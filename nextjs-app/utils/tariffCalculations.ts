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

// Helper to determine which rate applies at a specific time based on schedule
function getRateAtTime(
  minutes: number,
  periods: Array<{ start: string; end: string; rateType: string }>,
  defaultRate: string
): string {
  for (const period of periods) {
    const startMin = timeToMinutes(period.start);
    const endMin = timeToMinutes(period.end);

    if (endMin < startMin) {
      // Crosses midnight
      if (minutes >= startMin || minutes < endMin) {
        return period.rateType;
      }
    } else if (minutes >= startMin && minutes < endMin) {
      return period.rateType;
    }
  }
  return defaultRate;
}

// New: Calculate costs with multi-rate schedules (like admin page)
export interface MultiRateTariffConfig {
  isFlatMode: boolean;
  flatRate?: number;
  rates: Record<string, number>; // e.g., { "free": 0, "night": 0.15, "day": 0.25, "peak": 0.35 }
  schedule: Record<
    string,
    {
      periods: Array<{ start: string; end: string; rateType: string }>;
      defaultRate: string;
    }
  >;
  dailyCharge: number;
}

export function calculateCostsWithMultiRates(
  allData: any[],
  gasData: any[],
  hasGas: boolean,
  electricityConfig: MultiRateTariffConfig,
  gasConfig?: MultiRateTariffConfig
): CostData | null {
  if (!allData || allData.length === 0) return null;

  const byDate: Record<
    string,
    {
      [rateType: string]: number; // e.g., { "free": 0, "night": 5.2, "day": 8.3, "peak": 2.1 }
    }
  > = {};

  // Process electricity
  allData.forEach((item) => {
    const start = new Date(item.startTime);
    const dateKey = start.toISOString().split("T")[0];
    const dayOfWeek = start.getDay();
    const minutes = start.getHours() * 60 + start.getMinutes();

    const dayKeys = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    const dayKey = dayKeys[dayOfWeek];

    if (!byDate[dateKey]) {
      byDate[dateKey] = {};
    }

    if (electricityConfig.isFlatMode) {
      // Flat rate mode
      if (!byDate[dateKey]["flat"]) byDate[dateKey]["flat"] = 0;
      byDate[dateKey]["flat"] += item.kwh;
    } else {
      // Multi-rate mode
      const daySchedule = electricityConfig.schedule[dayKey];
      const rateType = getRateAtTime(minutes, daySchedule.periods, daySchedule.defaultRate);

      if (!byDate[dateKey][rateType]) byDate[dateKey][rateType] = 0;
      byDate[dateKey][rateType] += item.kwh;
    }
  });

  // Process gas
  const gasByDate: Record<
    string,
    {
      [rateType: string]: number;
      totalKwh: number;
    }
  > = {};

  if (hasGas && gasData && gasData.length > 0 && gasConfig) {
    gasData.forEach((item) => {
      const start = new Date(item.startTime);
      const dateKey = start.toISOString().split("T")[0];
      const dayOfWeek = start.getDay();
      const minutes = start.getHours() * 60 + start.getMinutes();

      const dayKeys = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
      const dayKey = dayKeys[dayOfWeek];

      if (!gasByDate[dateKey]) {
        gasByDate[dateKey] = { totalKwh: 0 };
      }

      gasByDate[dateKey].totalKwh += item.kwh;

      if (gasConfig.isFlatMode) {
        if (!gasByDate[dateKey]["flat"]) gasByDate[dateKey]["flat"] = 0;
        gasByDate[dateKey]["flat"] += item.kwh;
      } else {
        const daySchedule = gasConfig.schedule[dayKey];
        const rateType = getRateAtTime(minutes, daySchedule.periods, daySchedule.defaultRate);

        if (!gasByDate[dateKey][rateType]) gasByDate[dateKey][rateType] = 0;
        gasByDate[dateKey][rateType] += item.kwh;
      }
    });
  }

  // Calculate costs
  const monthly: Record<string, any> = {};
  const yearly = {
    byRate: {} as Record<string, number>, // e.g., { "free": 0, "night": 100, "day": 200, "peak": 50 }
    byGasRate: {} as Record<string, number>,
    daily: 0,
    gasDaily: 0,
    total: 0,
  };

  Object.keys(byDate)
    .sort()
    .forEach((dateKey) => {
      const [y, m] = dateKey.split("-");
      const mKey = `${y}-${m}`;

      if (!monthly[mKey]) {
        monthly[mKey] = {
          byRate: {},
          byGasRate: {},
          dailyCharge: 0,
          gasDailyCharge: 0,
          total: 0,
        };
      }

      let dayCost = electricityConfig.dailyCharge;

      // Calculate electricity costs
      if (electricityConfig.isFlatMode) {
        const rate = electricityConfig.flatRate || 0;
        const cost = (byDate[dateKey]["flat"] || 0) * rate;
        if (!monthly[mKey].byRate["flat"]) monthly[mKey].byRate["flat"] = 0;
        monthly[mKey].byRate["flat"] += cost;
        if (!yearly.byRate["flat"]) yearly.byRate["flat"] = 0;
        yearly.byRate["flat"] += cost;
        dayCost += cost;
      } else {
        Object.entries(byDate[dateKey]).forEach(([rateType, kwh]) => {
          if (rateType === "flat") return; // Skip flat if present
          const rate = electricityConfig.rates[rateType] || 0;
          const cost = (kwh as number) * rate;
          if (!monthly[mKey].byRate[rateType]) monthly[mKey].byRate[rateType] = 0;
          monthly[mKey].byRate[rateType] += cost;
          if (!yearly.byRate[rateType]) yearly.byRate[rateType] = 0;
          yearly.byRate[rateType] += cost;
          dayCost += cost;
        });
      }

      // Calculate gas costs
      if (gasByDate[dateKey] && gasConfig) {
        dayCost += gasConfig.dailyCharge;

        if (gasConfig.isFlatMode) {
          const rate = gasConfig.flatRate || 0;
          const cost = (gasByDate[dateKey]["flat"] || 0) * rate;
          if (!monthly[mKey].byGasRate["flat"]) monthly[mKey].byGasRate["flat"] = 0;
          monthly[mKey].byGasRate["flat"] += cost;
          if (!yearly.byGasRate["flat"]) yearly.byGasRate["flat"] = 0;
          yearly.byGasRate["flat"] += cost;
          dayCost += cost;
        } else {
          Object.entries(gasByDate[dateKey]).forEach(([rateType, kwh]) => {
            if (rateType === "flat" || rateType === "totalKwh") return;
            const rate = gasConfig.rates[rateType] || 0;
            const cost = (kwh as number) * rate;
            if (!monthly[mKey].byGasRate[rateType]) monthly[mKey].byGasRate[rateType] = 0;
            monthly[mKey].byGasRate[rateType] += cost;
            if (!yearly.byGasRate[rateType]) yearly.byGasRate[rateType] = 0;
            yearly.byGasRate[rateType] += cost;
            dayCost += cost;
          });
        }
      }

      monthly[mKey].dailyCharge += electricityConfig.dailyCharge;
      if (gasByDate[dateKey] && gasConfig) {
        monthly[mKey].gasDailyCharge += gasConfig.dailyCharge;
      }
      monthly[mKey].total += dayCost;
      yearly.daily += electricityConfig.dailyCharge;
      if (gasByDate[dateKey] && gasConfig) {
        yearly.gasDaily += gasConfig.dailyCharge;
      }
      yearly.total += dayCost;
    });

  return { monthly, yearly };
}
