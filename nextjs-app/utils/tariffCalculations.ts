import { WeekSchedule, PeakPeriod, CostData } from "../types/tariff";

export function timeToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

export function isPeakTime(minutes: number, periods: PeakPeriod[]): boolean {
  return periods.some((period) => {
    const startMin = timeToMinutes(period.start);
    const endMin = timeToMinutes(period.end);

    if (endMin < startMin) {
      // Crosses midnight
      return minutes >= startMin || minutes < endMin;
    }
    return minutes >= startMin && minutes < endMin;
  });
}

export function calculateCostsForTariff(
  allData: any[],
  gasData: any[],
  hasGas: boolean,
  isFlatRateMode: boolean,
  flatRateValue: number,
  tariffSchedule: WeekSchedule,
  tariffPeakRate: number,
  tariffOffPeakRate: number,
  tariffDailyCharge: number,
  isGasFlatRateMode: boolean,
  tariffGasRate: number,
  tariffGasPeakRate: number,
  tariffGasOffPeakRate: number,
  tariffGasSchedule: WeekSchedule,
  tariffGasDailyCharge: number
): CostData | null {
  if (!allData || allData.length === 0) return null;

  // Group electricity by date
  const byDate: Record<string, { peakKwh: number; offPeakKwh: number }> = {};
  allData.forEach((item) => {
    const start = new Date(item.startTime);
    const dateKey = start.toISOString().split("T")[0];
    const dayOfWeek = start.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const minutes = start.getHours() * 60 + start.getMinutes();

    // Map day of week to schedule key
    const dayKeys = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    const dayKey = dayKeys[dayOfWeek];
    const daySchedule = tariffSchedule[dayKey];

    if (!byDate[dateKey]) {
      byDate[dateKey] = { peakKwh: 0, offPeakKwh: 0 };
    }

    // Check if this day is all off-peak or has peak periods
    if (daySchedule.allOffPeak) {
      byDate[dateKey].offPeakKwh += item.kwh;
    } else if (isPeakTime(minutes, daySchedule.peakPeriods)) {
      byDate[dateKey].peakKwh += item.kwh;
    } else {
      byDate[dateKey].offPeakKwh += item.kwh;
    }
  });

  // Group gas by date
  const gasByDate: Record<string, { peakKwh: number; offPeakKwh: number; totalKwh: number }> = {};
  if (hasGas && gasData && gasData.length > 0) {
    gasData.forEach((item) => {
      const start = new Date(item.startTime);
      const dateKey = start.toISOString().split("T")[0];
      const dayOfWeek = start.getDay();
      const minutes = start.getHours() * 60 + start.getMinutes();

      const dayKeys = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
      const dayKey = dayKeys[dayOfWeek];
      const daySchedule = tariffGasSchedule[dayKey];

      if (!gasByDate[dateKey]) {
        gasByDate[dateKey] = { peakKwh: 0, offPeakKwh: 0, totalKwh: 0 };
      }

      gasByDate[dateKey].totalKwh += item.kwh;

      // Check if this day is all off-peak or has peak periods
      if (daySchedule.allOffPeak) {
        gasByDate[dateKey].offPeakKwh += item.kwh;
      } else if (isPeakTime(minutes, daySchedule.peakPeriods)) {
        gasByDate[dateKey].peakKwh += item.kwh;
      } else {
        gasByDate[dateKey].offPeakKwh += item.kwh;
      }
    });
  }

  // Monthly aggregation
  const monthly: Record<string, any> = {};
  const yearly = {
    peak: 0,
    offPeak: 0,
    gasPeak: 0,
    gasOffPeak: 0,
    daily: 0,
    gasDaily: 0,
    total: 0,
  };

  Object.keys(byDate)
    .sort()
    .forEach((dateKey) => {
      const [y, m] = dateKey.split("-");
      const mKey = `${y}-${m}`;

      let peakCost, offPeakCost, gasPeakCost, gasOffPeakCost, gasDailyChargeDay, totalDay;

      if (isFlatRateMode) {
        // Flat rate mode: all kWh at same rate
        const totalKwh = byDate[dateKey].peakKwh + byDate[dateKey].offPeakKwh;
        peakCost = 0;
        offPeakCost = totalKwh * flatRateValue;
      } else {
        // Peak/Off-peak mode
        peakCost = byDate[dateKey].peakKwh * tariffPeakRate;
        offPeakCost = byDate[dateKey].offPeakKwh * tariffOffPeakRate;
      }

      // Calculate gas cost based on its pricing mode
      if (gasByDate[dateKey]) {
        if (isGasFlatRateMode) {
          gasPeakCost = 0;
          gasOffPeakCost = gasByDate[dateKey].totalKwh * tariffGasRate;
        } else {
          gasPeakCost = gasByDate[dateKey].peakKwh * tariffGasPeakRate;
          gasOffPeakCost = gasByDate[dateKey].offPeakKwh * tariffGasOffPeakRate;
        }
        gasDailyChargeDay = tariffGasDailyCharge;
      } else {
        gasPeakCost = 0;
        gasOffPeakCost = 0;
        gasDailyChargeDay = 0;
      }

      totalDay = peakCost + offPeakCost + gasPeakCost + gasOffPeakCost + tariffDailyCharge + gasDailyChargeDay;

      if (!monthly[mKey]) {
        monthly[mKey] = {
          peakCost: 0,
          offPeakCost: 0,
          gasPeakCost: 0,
          gasOffPeakCost: 0,
          dailyCharge: 0,
          gasDailyCharge: 0,
          total: 0,
        };
      }

      monthly[mKey].peakCost += peakCost;
      monthly[mKey].offPeakCost += offPeakCost;
      monthly[mKey].gasPeakCost += gasPeakCost;
      monthly[mKey].gasOffPeakCost += gasOffPeakCost;
      monthly[mKey].dailyCharge += tariffDailyCharge;
      monthly[mKey].gasDailyCharge += gasDailyChargeDay;
      monthly[mKey].total += totalDay;

      yearly.peak += peakCost;
      yearly.offPeak += offPeakCost;
      yearly.gasPeak += gasPeakCost;
      yearly.gasOffPeak += gasOffPeakCost;
      yearly.daily += tariffDailyCharge;
      yearly.gasDaily += gasDailyChargeDay;
      yearly.total += totalDay;
    });

  return { monthly, yearly };
}
