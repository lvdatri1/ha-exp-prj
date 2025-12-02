import { WeekSchedule } from "../types/tariff";

export const DAYS = [
  { key: "monday", label: "Monday" },
  { key: "tuesday", label: "Tuesday" },
  { key: "wednesday", label: "Wednesday" },
  { key: "thursday", label: "Thursday" },
  { key: "friday", label: "Friday" },
  { key: "saturday", label: "Saturday" },
  { key: "sunday", label: "Sunday" },
];

export const DEFAULT_SCHEDULE: WeekSchedule = {
  monday: {
    enabled: true,
    allOffPeak: false,
    peakPeriods: [
      { id: "1", start: "07:00", end: "11:00" },
      { id: "2", start: "17:00", end: "21:00" },
    ],
  },
  tuesday: {
    enabled: true,
    allOffPeak: false,
    peakPeriods: [
      { id: "1", start: "07:00", end: "11:00" },
      { id: "2", start: "17:00", end: "21:00" },
    ],
  },
  wednesday: {
    enabled: true,
    allOffPeak: false,
    peakPeriods: [
      { id: "1", start: "07:00", end: "11:00" },
      { id: "2", start: "17:00", end: "21:00" },
    ],
  },
  thursday: {
    enabled: true,
    allOffPeak: false,
    peakPeriods: [
      { id: "1", start: "07:00", end: "11:00" },
      { id: "2", start: "17:00", end: "21:00" },
    ],
  },
  friday: {
    enabled: true,
    allOffPeak: false,
    peakPeriods: [
      { id: "1", start: "07:00", end: "11:00" },
      { id: "2", start: "17:00", end: "21:00" },
    ],
  },
  saturday: { enabled: true, allOffPeak: true, peakPeriods: [] },
  sunday: { enabled: true, allOffPeak: true, peakPeriods: [] },
};
