export interface ExternalPowerPlan {
  id?: number;
  retailer: string;
  name: string;
  active: number;
  is_flat_rate: number;
  flat_rate?: number | null;
  peak_rate?: number | null;
  off_peak_rate?: number | null;
  daily_charge?: number | null;
  has_gas: number;
  gas_is_flat_rate: number;
  gas_flat_rate?: number | null;
  gas_peak_rate?: number | null;
  gas_off_peak_rate?: number | null;
  gas_daily_charge?: number | null;
}

export interface TariffCalculatorProps {
  allData: any[];
  gasData?: any[];
}

export interface PeakPeriod {
  id: string;
  start: string;
  end: string;
}

export interface DaySchedule {
  enabled: boolean;
  allOffPeak: boolean;
  peakPeriods: PeakPeriod[];
}

export type WeekSchedule = {
  [key: string]: DaySchedule;
};

export interface MonthlyCost {
  peakCost: number;
  offPeakCost: number;
  dailyCharge: number;
  gasPeakCost: number;
  gasOffPeakCost: number;
  gasDailyCharge: number;
}

export interface CostData {
  monthly: { [key: string]: MonthlyCost };
  yearly: {
    peak: number;
    offPeak: number;
    daily: number;
    gasPeak: number;
    gasOffPeak: number;
    gasDaily: number;
    total: number;
  };
}

export type CompareType = "both" | "electric" | "gas";
