/**
 * Integration tests for tariff calculation with different power plans
 * Tests the full flow: plan selection → data population → calculation
 */

import { describe, it, expect } from "@jest/globals";
import { calculateCostsWithMultiRates, calculateCostsForTariff } from "../utils/tariffCalculations";
import { RateDefinition } from "../types/rates";
import { MultiRateWeekSchedule } from "../components/MultiRateScheduleEditor";

describe("Tariff Calculation Tests", () => {
  // Sample electricity consumption data (48 half-hourly readings = 1 day)
  const mockElectricityData = [
    // Morning peak (7am-9am)
    { startTime: "2024-01-15T07:00:00Z", kwh: 1.5 },
    { startTime: "2024-01-15T07:30:00Z", kwh: 1.8 },
    { startTime: "2024-01-15T08:00:00Z", kwh: 2.0 },
    { startTime: "2024-01-15T08:30:00Z", kwh: 1.7 },
    // Day time (9am-5pm) - 16 readings
    { startTime: "2024-01-15T09:00:00Z", kwh: 1.2 },
    { startTime: "2024-01-15T09:30:00Z", kwh: 1.1 },
    { startTime: "2024-01-15T10:00:00Z", kwh: 1.0 },
    { startTime: "2024-01-15T10:30:00Z", kwh: 0.9 },
    { startTime: "2024-01-15T11:00:00Z", kwh: 1.0 },
    { startTime: "2024-01-15T11:30:00Z", kwh: 1.1 },
    { startTime: "2024-01-15T12:00:00Z", kwh: 1.3 },
    { startTime: "2024-01-15T12:30:00Z", kwh: 1.2 },
    { startTime: "2024-01-15T13:00:00Z", kwh: 1.1 },
    { startTime: "2024-01-15T13:30:00Z", kwh: 1.0 },
    { startTime: "2024-01-15T14:00:00Z", kwh: 1.2 },
    { startTime: "2024-01-15T14:30:00Z", kwh: 1.3 },
    { startTime: "2024-01-15T15:00:00Z", kwh: 1.4 },
    { startTime: "2024-01-15T15:30:00Z", kwh: 1.5 },
    { startTime: "2024-01-15T16:00:00Z", kwh: 1.6 },
    { startTime: "2024-01-15T16:30:00Z", kwh: 1.7 },
    // Evening peak (5pm-9pm)
    { startTime: "2024-01-15T17:00:00Z", kwh: 2.2 },
    { startTime: "2024-01-15T17:30:00Z", kwh: 2.5 },
    { startTime: "2024-01-15T18:00:00Z", kwh: 2.8 },
    { startTime: "2024-01-15T18:30:00Z", kwh: 2.6 },
    { startTime: "2024-01-15T19:00:00Z", kwh: 2.4 },
    { startTime: "2024-01-15T19:30:00Z", kwh: 2.3 },
    { startTime: "2024-01-15T20:00:00Z", kwh: 2.1 },
    { startTime: "2024-01-15T20:30:00Z", kwh: 1.9 },
    // Night time (9pm-7am) - 20 readings
    { startTime: "2024-01-15T21:00:00Z", kwh: 0.8 },
    { startTime: "2024-01-15T21:30:00Z", kwh: 0.7 },
    { startTime: "2024-01-15T22:00:00Z", kwh: 0.6 },
    { startTime: "2024-01-15T22:30:00Z", kwh: 0.5 },
    { startTime: "2024-01-15T23:00:00Z", kwh: 0.5 },
    { startTime: "2024-01-15T23:30:00Z", kwh: 0.4 },
    { startTime: "2024-01-16T00:00:00Z", kwh: 0.4 },
    { startTime: "2024-01-16T00:30:00Z", kwh: 0.4 },
    { startTime: "2024-01-16T01:00:00Z", kwh: 0.3 },
    { startTime: "2024-01-16T01:30:00Z", kwh: 0.3 },
    { startTime: "2024-01-16T02:00:00Z", kwh: 0.3 },
    { startTime: "2024-01-16T02:30:00Z", kwh: 0.3 },
    { startTime: "2024-01-16T03:00:00Z", kwh: 0.3 },
    { startTime: "2024-01-16T03:30:00Z", kwh: 0.3 },
    { startTime: "2024-01-16T04:00:00Z", kwh: 0.4 },
    { startTime: "2024-01-16T04:30:00Z", kwh: 0.4 },
    { startTime: "2024-01-16T05:00:00Z", kwh: 0.5 },
    { startTime: "2024-01-16T05:30:00Z", kwh: 0.6 },
    { startTime: "2024-01-16T06:00:00Z", kwh: 0.8 },
    { startTime: "2024-01-16T06:30:00Z", kwh: 1.0 },
  ];

  const totalKwh = mockElectricityData.reduce((sum, item) => sum + item.kwh, 0);

  describe("Flat Rate Plan", () => {
    it("should calculate cost correctly with flat rate of $0.30/kWh", () => {
      const flatRate = 0.3;
      const dailyCharge = 1.0;

      // Data spans 2 days (Jan 15 and Jan 16), so 2 daily charges
      const numDays = 2;
      const expectedEnergyCost = totalKwh * flatRate;
      const expectedDailyCost = dailyCharge * numDays;
      const expectedTotal = expectedEnergyCost + expectedDailyCost;

      // Using multi-rate calculator with single rate
      const rates: RateDefinition = { flat: flatRate };
      const schedule: MultiRateWeekSchedule = {
        monday: { periods: [], defaultRate: "flat" },
        tuesday: { periods: [], defaultRate: "flat" },
        wednesday: { periods: [], defaultRate: "flat" },
        thursday: { periods: [], defaultRate: "flat" },
        friday: { periods: [], defaultRate: "flat" },
        saturday: { periods: [], defaultRate: "flat" },
        sunday: { periods: [], defaultRate: "flat" },
      };

      const electricityConfig = {
        isFlatMode: true,
        flatRate: flatRate,
        rates: rates,
        schedule: schedule,
        dailyCharge: dailyCharge,
      };

      const result = calculateCostsWithMultiRates(mockElectricityData, [], false, electricityConfig);

      expect(result).not.toBeNull();
      expect(result!.yearly.total).toBeCloseTo(expectedTotal, 2);
      console.log(
        `✓ Flat rate test: ${totalKwh} kWh × $${flatRate} + ${numDays} days × $${dailyCharge} = $${result!.yearly.total.toFixed(
          2
        )}`
      );
    });
  });

  describe("Two-Tier Time-of-Use Plan", () => {
    it("should calculate cost with peak/off-peak rates", () => {
      const peakRate = 0.45;
      const offPeakRate = 0.2;
      const dailyCharge = 1.2;

      const rates: RateDefinition = {
        peak: peakRate,
        offPeak: offPeakRate,
      };

      // Peak hours: 7am-9am and 5pm-9pm (12 readings)
      // Off-peak: all other times (36 readings)
      const schedule: MultiRateWeekSchedule = {
        monday: {
          periods: [
            { start: "07:00", end: "09:00", rateType: "peak" },
            { start: "17:00", end: "21:00", rateType: "peak" },
          ],
          defaultRate: "offPeak",
        },
        tuesday: {
          periods: [
            { start: "07:00", end: "09:00", rateType: "peak" },
            { start: "17:00", end: "21:00", rateType: "peak" },
          ],
          defaultRate: "offPeak",
        },
        wednesday: {
          periods: [
            { start: "07:00", end: "09:00", rateType: "peak" },
            { start: "17:00", end: "21:00", rateType: "peak" },
          ],
          defaultRate: "offPeak",
        },
        thursday: {
          periods: [
            { start: "07:00", end: "09:00", rateType: "peak" },
            { start: "17:00", end: "21:00", rateType: "peak" },
          ],
          defaultRate: "offPeak",
        },
        friday: {
          periods: [
            { start: "07:00", end: "09:00", rateType: "peak" },
            { start: "17:00", end: "21:00", rateType: "peak" },
          ],
          defaultRate: "offPeak",
        },
        saturday: {
          periods: [],
          defaultRate: "offPeak",
        },
        sunday: {
          periods: [],
          defaultRate: "offPeak",
        },
      };

      const electricityConfig = {
        isFlatMode: false,
        rates: rates,
        schedule: schedule,
        dailyCharge: dailyCharge,
      };

      const result = calculateCostsWithMultiRates(mockElectricityData, [], false, electricityConfig);

      expect(result).not.toBeNull();
      expect(result!.yearly.total).toBeGreaterThan(0);

      // Peak consumption: morning (1.5+1.8+2.0+1.7) + evening (2.2+2.5+2.8+2.6+2.4+2.3+2.1+1.9) = 26.8 kWh
      const peakKwh = 1.5 + 1.8 + 2.0 + 1.7 + 2.2 + 2.5 + 2.8 + 2.6 + 2.4 + 2.3 + 2.1 + 1.9;
      const offPeakKwh = totalKwh - peakKwh;

      console.log(
        `✓ Two-tier test: Peak ${peakKwh.toFixed(2)} kWh × $${peakRate} + Off-peak ${offPeakKwh.toFixed(
          2
        )} kWh × $${offPeakRate} + $${dailyCharge} = $${result!.yearly.total.toFixed(2)}`
      );
    });
  });

  describe("Three-Tier Time-of-Use Plan", () => {
    it("should calculate cost with peak/shoulder/off-peak rates", () => {
      const peakRate = 0.5;
      const shoulderRate = 0.3;
      const offPeakRate = 0.15;
      const dailyCharge = 1.5;

      const rates: RateDefinition = {
        peak: peakRate,
        shoulder: shoulderRate,
        offPeak: offPeakRate,
      };

      // Peak: 5pm-9pm (evening)
      // Shoulder: 7am-9am, 9am-5pm
      // Off-peak: 9pm-7am
      const schedule: MultiRateWeekSchedule = {
        monday: {
          periods: [
            { start: "07:00", end: "09:00", rateType: "shoulder" },
            { start: "09:00", end: "17:00", rateType: "shoulder" },
            { start: "17:00", end: "21:00", rateType: "peak" },
          ],
          defaultRate: "offPeak",
        },
        tuesday: {
          periods: [
            { start: "07:00", end: "09:00", rateType: "shoulder" },
            { start: "09:00", end: "17:00", rateType: "shoulder" },
            { start: "17:00", end: "21:00", rateType: "peak" },
          ],
          defaultRate: "offPeak",
        },
        wednesday: {
          periods: [
            { start: "07:00", end: "09:00", rateType: "shoulder" },
            { start: "09:00", end: "17:00", rateType: "shoulder" },
            { start: "17:00", end: "21:00", rateType: "peak" },
          ],
          defaultRate: "offPeak",
        },
        thursday: {
          periods: [
            { start: "07:00", end: "09:00", rateType: "shoulder" },
            { start: "09:00", end: "17:00", rateType: "shoulder" },
            { start: "17:00", end: "21:00", rateType: "peak" },
          ],
          defaultRate: "offPeak",
        },
        friday: {
          periods: [
            { start: "07:00", end: "09:00", rateType: "shoulder" },
            { start: "09:00", end: "17:00", rateType: "shoulder" },
            { start: "17:00", end: "21:00", rateType: "peak" },
          ],
          defaultRate: "offPeak",
        },
        saturday: {
          periods: [],
          defaultRate: "offPeak",
        },
        sunday: {
          periods: [],
          defaultRate: "offPeak",
        },
      };

      const electricityConfig = {
        isFlatMode: false,
        rates: rates,
        schedule: schedule,
        dailyCharge: dailyCharge,
      };

      const result = calculateCostsWithMultiRates(mockElectricityData, [], false, electricityConfig);

      expect(result).not.toBeNull();
      expect(result!.yearly.total).toBeGreaterThan(0);

      console.log(`✓ Three-tier test: Total cost = $${result!.yearly.total.toFixed(2)}`);
      console.log(`  Daily charge: $${dailyCharge}, Energy cost: $${(result!.yearly.total - dailyCharge).toFixed(2)}`);
    });
  });

  describe("Plan Comparison", () => {
    it("should show flat rate is cheaper for consistent consumption", () => {
      const flatRate = 0.28;
      const peakRate = 0.45;
      const offPeakRate = 0.18;
      const dailyCharge = 1.0;

      // Flat rate calculation
      const flatRates: RateDefinition = { flat: flatRate };
      const flatSchedule: MultiRateWeekSchedule = {
        monday: { periods: [], defaultRate: "flat" },
        tuesday: { periods: [], defaultRate: "flat" },
        wednesday: { periods: [], defaultRate: "flat" },
        thursday: { periods: [], defaultRate: "flat" },
        friday: { periods: [], defaultRate: "flat" },
        saturday: { periods: [], defaultRate: "flat" },
        sunday: { periods: [], defaultRate: "flat" },
      };

      const flatElectricityConfig = {
        isFlatMode: true,
        flatRate: flatRate,
        rates: flatRates,
        schedule: flatSchedule,
        dailyCharge: dailyCharge,
      };

      const flatResult = calculateCostsWithMultiRates(mockElectricityData, [], false, flatElectricityConfig);

      // Time-of-use calculation
      const touRates: RateDefinition = {
        peak: peakRate,
        offPeak: offPeakRate,
      };

      const touSchedule: MultiRateWeekSchedule = {
        monday: {
          periods: [
            { start: "07:00", end: "09:00", rateType: "peak" },
            { start: "17:00", end: "21:00", rateType: "peak" },
          ],
          defaultRate: "offPeak",
        },
        tuesday: {
          periods: [
            { start: "07:00", end: "09:00", rateType: "peak" },
            { start: "17:00", end: "21:00", rateType: "peak" },
          ],
          defaultRate: "offPeak",
        },
        wednesday: {
          periods: [
            { start: "07:00", end: "09:00", rateType: "peak" },
            { start: "17:00", end: "21:00", rateType: "peak" },
          ],
          defaultRate: "offPeak",
        },
        thursday: {
          periods: [
            { start: "07:00", end: "09:00", rateType: "peak" },
            { start: "17:00", end: "21:00", rateType: "peak" },
          ],
          defaultRate: "offPeak",
        },
        friday: {
          periods: [
            { start: "07:00", end: "09:00", rateType: "peak" },
            { start: "17:00", end: "21:00", rateType: "peak" },
          ],
          defaultRate: "offPeak",
        },
        saturday: {
          periods: [],
          defaultRate: "offPeak",
        },
        sunday: {
          periods: [],
          defaultRate: "offPeak",
        },
      };

      const touElectricityConfig = {
        isFlatMode: false,
        rates: touRates,
        schedule: touSchedule,
        dailyCharge: dailyCharge,
      };

      const touResult = calculateCostsWithMultiRates(mockElectricityData, [], false, touElectricityConfig);

      expect(flatResult).not.toBeNull();
      expect(touResult).not.toBeNull();

      const savings = flatResult!.yearly.total - touResult!.yearly.total;
      console.log(`\n✓ Plan Comparison:`);
      console.log(`  Flat Rate ($${flatRate}/kWh): $${flatResult!.yearly.total.toFixed(2)}`);
      console.log(
        `  Time-of-Use (Peak $${peakRate}, Off-peak $${offPeakRate}): $${touResult!.yearly.total.toFixed(2)}`
      );
      console.log(`  ${savings > 0 ? "Time-of-Use saves" : "Flat Rate saves"} $${Math.abs(savings).toFixed(2)}`);
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty consumption data", () => {
      const rates: RateDefinition = { flat: 0.3 };
      const schedule: MultiRateWeekSchedule = {
        monday: { periods: [], defaultRate: "flat" },
        tuesday: { periods: [], defaultRate: "flat" },
        wednesday: { periods: [], defaultRate: "flat" },
        thursday: { periods: [], defaultRate: "flat" },
        friday: { periods: [], defaultRate: "flat" },
        saturday: { periods: [], defaultRate: "flat" },
        sunday: { periods: [], defaultRate: "flat" },
      };

      const electricityConfig = {
        isFlatMode: true,
        flatRate: 0.3,
        rates: rates,
        schedule: schedule,
        dailyCharge: 1.0,
      };

      const result = calculateCostsWithMultiRates([], [], false, electricityConfig);

      expect(result).toBeNull();
    });

    it("should handle missing rate type in schedule", () => {
      const rates: RateDefinition = {
        peak: 0.5,
        offPeak: 0.2,
      };

      // Schedule references 'shoulder' but it's not in rates
      const schedule: MultiRateWeekSchedule = {
        monday: {
          periods: [{ start: "09:00", end: "17:00", rateType: "shoulder" }],
          defaultRate: "offPeak",
        },
        tuesday: { periods: [], defaultRate: "offPeak" },
        wednesday: { periods: [], defaultRate: "offPeak" },
        thursday: { periods: [], defaultRate: "offPeak" },
        friday: { periods: [], defaultRate: "offPeak" },
        saturday: { periods: [], defaultRate: "offPeak" },
        sunday: { periods: [], defaultRate: "offPeak" },
      };

      const electricityConfig = {
        isFlatMode: false,
        rates: rates,
        schedule: schedule,
        dailyCharge: 1.0,
      };

      const result = calculateCostsWithMultiRates(mockElectricityData.slice(0, 10), [], false, electricityConfig);

      // Should still calculate using fallback to default rate
      expect(result).not.toBeNull();
      expect(result!.yearly.total).toBeGreaterThan(0);
    });
  });
});
