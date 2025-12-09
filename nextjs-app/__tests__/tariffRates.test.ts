/**
 * Tests for tariff rate parsing and derivation logic
 */

// Helper: Parse rate JSON
function parseRateDefinition(rateJson?: string | null) {
  if (!rateJson) return null;
  try {
    const parsed = JSON.parse(rateJson);
    if (parsed && typeof parsed === "object") {
      return parsed;
    }
    return null;
  } catch (err) {
    return null;
  }
}

// Helper: Derive peak/off-peak from flexible rates
function deriveTwoTierRates(rates) {
  if (!rates) return { hasRates: false, isSingleRate: false };

  const entries = Object.entries(rates).filter(([, value]) => typeof value === "number" && !Number.isNaN(value));
  if (entries.length === 0) return { hasRates: false, isSingleRate: false };

  const values = entries.map(([, value]) => value);
  if (entries.length === 1) {
    return { hasRates: true, isSingleRate: true, flatRate: values[0] };
  }

  const normalized = entries.map(([key, value]) => [key.toLowerCase(), value]);
  const pick = (candidates) => {
    const match = normalized.find(([name]) => candidates.includes(name));
    return match ? match[1] : undefined;
  };

  const peak = pick(["peak", "day", "shoulder"]);
  const offPeak = pick(["offpeak", "off_peak", "night", "free"]);

  return {
    hasRates: true,
    isSingleRate: false,
    peak: peak ?? Math.max(...values),
    offPeak: offPeak ?? Math.min(...values),
  };
}

describe("Tariff Rate Parsing", () => {
  describe("parseRateDefinition", () => {
    it("should parse valid JSON rate definition", () => {
      const json = JSON.stringify({ day: 0.25, night: 0.15 });
      const result = parseRateDefinition(json);
      expect(result).toEqual({ day: 0.25, night: 0.15 });
    });

    it("should return null for invalid JSON", () => {
      const result = parseRateDefinition("invalid json");
      expect(result).toBeNull();
    });

    it("should return null for null or undefined input", () => {
      expect(parseRateDefinition(null)).toBeNull();
      expect(parseRateDefinition(undefined)).toBeNull();
    });

    it("should handle multi-rate structure", () => {
      const json = JSON.stringify({ free: 0, night: 0.15, day: 0.25, peak: 0.35 });
      const result = parseRateDefinition(json);
      expect(result).toEqual({ free: 0, night: 0.15, day: 0.25, peak: 0.35 });
    });
  });

  describe("deriveTwoTierRates", () => {
    it("should identify single rate as flat", () => {
      const rates = { flat: 0.3 };
      const result = deriveTwoTierRates(rates);
      expect(result.isSingleRate).toBe(true);
      expect(result.flatRate).toBe(0.3);
    });

    it("should extract peak and off-peak from day/night", () => {
      const rates = { day: 0.25, night: 0.15 };
      const result = deriveTwoTierRates(rates);
      expect(result.isSingleRate).toBe(false);
      expect(result.peak).toBe(0.25);
      expect(result.offPeak).toBe(0.15);
    });

    it("should extract peak and off-peak from peak/offpeak", () => {
      const rates = { peak: 0.38, offpeak: 0.25 };
      const result = deriveTwoTierRates(rates);
      expect(result.peak).toBe(0.38);
      expect(result.offPeak).toBe(0.25);
    });

    it("should handle complex multi-rate structure", () => {
      const rates = { free: 0, night: 0.12, day: 0.25, peak: 0.38 };
      const result = deriveTwoTierRates(rates);
      expect(result.isSingleRate).toBe(false);
      expect(result.peak).toBe(0.38);
      expect(result.offPeak).toBeDefined();
    });

    it("should fallback to min/max when no named rates found", () => {
      const rates = { tier_a: 0.2, tier_b: 0.3 };
      const result = deriveTwoTierRates(rates);
      expect(result.peak).toBe(0.3); // max
      expect(result.offPeak).toBe(0.2); // min
    });

    it("should return no rates for empty object", () => {
      const result = deriveTwoTierRates({});
      expect(result.hasRates).toBe(false);
    });

    it("should return no rates for null", () => {
      const result = deriveTwoTierRates(null);
      expect(result.hasRates).toBe(false);
    });
  });

  describe("Integration: Parse and Derive", () => {
    it("should parse JSON and derive two-tier rates end-to-end", () => {
      const electricityJson = JSON.stringify({ day: 0.25, night: 0.15 });
      const parsed = parseRateDefinition(electricityJson);
      const derived = deriveTwoTierRates(parsed);

      expect(derived.isSingleRate).toBe(false);
      expect(derived.peak).toBe(0.25);
      expect(derived.offPeak).toBe(0.15);
    });

    it("should handle plan with multiple rate types", () => {
      const plan = {
        electricity_rates: JSON.stringify({ free: 0, night: 0.15, day: 0.25, peak: 0.35 }),
        gas_rates: JSON.stringify({ day: 0.025, night: 0.02 }),
      };

      const elec = parseRateDefinition(plan.electricity_rates);
      const elecDerived = deriveTwoTierRates(elec);
      expect(elecDerived.peak).toBe(0.35);

      const gas = parseRateDefinition(plan.gas_rates);
      const gasDerived = deriveTwoTierRates(gas);
      expect(gasDerived.peak).toBe(0.025);
    });
  });
});
