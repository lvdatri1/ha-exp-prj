// Rate period type definitions for flexible power plan rates
export interface RatePeriod {
  id: string;
  name: string; // "free", "night", "day", "peak", "shoulder", etc.
  rate: number; // $/kWh
  color: string; // For UI display
}

export interface RateDefinition {
  [rateName: string]: number; // e.g., { "free": 0, "night": 0.15, "day": 0.25, "peak": 0.35 }
}

// Common rate types
export const COMMON_RATE_TYPES = [
  { name: "free", label: "Free", color: "#4caf50" },
  { name: "night", label: "Night Rate", color: "#3f51b5" },
  { name: "day", label: "Day Rate", color: "#ff9800" },
  { name: "peak", label: "Peak Rate", color: "#f44336" },
  { name: "shoulder", label: "Shoulder Rate", color: "#9c27b0" },
  { name: "offpeak", label: "Off-Peak Rate", color: "#00bcd4" },
];
