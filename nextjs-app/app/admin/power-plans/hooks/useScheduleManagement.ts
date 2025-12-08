import { useState } from "react";
import { DEFAULT_SCHEDULE, DAYS } from "@/constants/tariff";
import { WeekSchedule, DaySchedule, PeakPeriod } from "@/types/tariff";

export function useScheduleManagement() {
  const [schedule, setSchedule] = useState<WeekSchedule>(DEFAULT_SCHEDULE);
  const [gasSchedule, setGasSchedule] = useState<WeekSchedule>(DEFAULT_SCHEDULE);
  const [showSchedule, setShowSchedule] = useState(false);
  const [showGasSchedule, setShowGasSchedule] = useState(false);

  const updateDaySchedule = (day: string, updates: Partial<DaySchedule>) => {
    setSchedule((prev) => ({
      ...prev,
      [day]: { ...prev[day], ...updates },
    }));
  };

  const updateGasDaySchedule = (day: string, updates: Partial<DaySchedule>) => {
    setGasSchedule((prev) => ({
      ...prev,
      [day]: { ...prev[day], ...updates },
    }));
  };

  const addPeakPeriod = (day: string) => {
    setSchedule((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        peakPeriods: [...prev[day].peakPeriods, { id: Date.now().toString(), start: "09:00", end: "17:00" }],
      },
    }));
  };

  const addGasPeakPeriod = (day: string) => {
    setGasSchedule((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        peakPeriods: [...prev[day].peakPeriods, { id: Date.now().toString(), start: "09:00", end: "17:00" }],
      },
    }));
  };

  const removePeakPeriod = (day: string, id: string) => {
    setSchedule((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        peakPeriods: prev[day].peakPeriods.filter((p) => p.id !== id),
      },
    }));
  };

  const removeGasPeakPeriod = (day: string, id: string) => {
    setGasSchedule((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        peakPeriods: prev[day].peakPeriods.filter((p) => p.id !== id),
      },
    }));
  };

  const updatePeakPeriod = (day: string, id: string, field: "start" | "end", value: string) => {
    setSchedule((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        peakPeriods: prev[day].peakPeriods.map((p) => (p.id === id ? { ...p, [field]: value } : p)),
      },
    }));
  };

  const updateGasPeakPeriod = (day: string, id: string, field: "start" | "end", value: string) => {
    setGasSchedule((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        peakPeriods: prev[day].peakPeriods.map((p) => (p.id === id ? { ...p, [field]: value } : p)),
      },
    }));
  };

  const copyScheduleToAll = (day: string) => {
    const daySchedule = schedule[day];
    setSchedule((prev) => {
      const updated: WeekSchedule = { ...prev };
      DAYS.forEach((d) => {
        updated[d.key] = { ...daySchedule };
      });
      return updated;
    });
  };

  const copyGasScheduleToAll = (day: string) => {
    const daySchedule = gasSchedule[day];
    setGasSchedule((prev) => {
      const updated: WeekSchedule = { ...prev };
      DAYS.forEach((d) => {
        updated[d.key] = { ...daySchedule };
      });
      return updated;
    });
  };

  const resetSchedule = () => {
    setSchedule(DEFAULT_SCHEDULE);
    setGasSchedule(DEFAULT_SCHEDULE);
    setShowSchedule(false);
    setShowGasSchedule(false);
  };

  return {
    schedule,
    gasSchedule,
    showSchedule,
    showGasSchedule,
    setSchedule,
    setGasSchedule,
    setShowSchedule,
    setShowGasSchedule,
    updateDaySchedule,
    updateGasDaySchedule,
    addPeakPeriod,
    addGasPeakPeriod,
    removePeakPeriod,
    removeGasPeakPeriod,
    updatePeakPeriod,
    updateGasPeakPeriod,
    copyScheduleToAll,
    copyGasScheduleToAll,
    resetSchedule,
  };
}
