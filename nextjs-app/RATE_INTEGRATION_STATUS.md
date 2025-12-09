# Tariff Calculator & Power Plans Rate Integration Status

## What's Working ✅

### 1. **New Flexible Rate Structure (Multi-tier rates)**

- Admin form: Create/edit plans with flexible rate definitions (e.g., `{free: 0, night: 0.15, day: 0.25, peak: 0.35}`)
- RateEditor component: Add/remove/edit multiple rate types
- Database: Rates stored as JSON in `electricity_rates` and `gas_rates` fields
- API: Correctly serializes and deserializes rates

### 2. **Tariff Calculator Auto-Fill from Plans**

- Parses flexible rate JSON and intelligently maps to peak/off-peak:
  - Recognizes `peak`, `day`, `shoulder` → peak rate
  - Recognizes `offpeak`, `off_peak`, `night`, `free` → off-peak rate
  - Falls back to min/max for unrecognized rate names
  - Detects single-rate plans (flat mode)
- Auto-fills electricity & gas settings when a plan is selected
- Backward compatible with legacy `peak_rate`/`off_peak_rate` fields
- Debug logging available in browser console (dev mode only)

### 3. **Backward Compatibility**

- Old plans (legacy peak/off-peak format) still work
- Flat rate plans still work
- New flexible rates coexist with legacy fields

### 4. **Plan Details Display** (NEW)

- Visual component shows all rates from a selected plan
- Appears below PlanSelector in both single and comparison views
- Shows flexible rate definitions in user-friendly format (e.g., "Night: €0.15", "Day: €0.25")
- Color-coded sections for electricity (blue) and gas (orange)
- Displays daily charges if configured
- Fallback display for legacy peak/off-peak rates
- Component: `PlanDetailsDisplay.tsx`

---

## What's NOT Implemented (Yet) ⏳

### **Schedule Persistence**

- The `MultiRateScheduleEditor` in the admin form is for **preview only**
- Schedules allow defining custom time periods for each rate (e.g., "Peak 9am-5pm")
- **NOT SAVED to database** – schedule data is discarded on form submit
- **NOT USED in tariff calculator** – rates are applied as simple peak/off-peak
- **Future work**: Add `electricitySchedules` and `gasSchedules` fields to PowerPlan schema

### **Advanced Schedule-Based Calculation**

- Tariff calculator currently only uses:
  - Flat rate (if `is_flat_rate === 1`)
  - Simple peak/off-peak (derived from rate definitions)
- Schedule-based calculation (e.g., "9am-5pm weekdays = peak") is not implemented

---

## Testing the Implementation

### Scenario 1: Create a plan with multi-rate definition

1. Go to `/admin/power-plans`
2. Create new plan
3. Set "Flat Rate" to OFF
4. Click "RateEditor" button
5. Add multiple rates (e.g., "Night" → 0.15, "Day" → 0.25, "Peak" → 0.35)
6. Submit form
7. Go to home page Analytics tab
8. Select plan in Tariff Calculator
9. ✅ Peak rate should = 0.35, Off-peak should ≈ 0.15
10. Check browser console for debug logs

### Scenario 2: Verify schedule editor shows up but isn't saved

1. Same as Scenario 1, but expand "Electricity Rate Schedule"
2. Define some time periods for each rate
3. Submit form and reload
4. ⚠️ Schedule is gone (not saved)
5. But the **rates themselves** are preserved

---

## Architecture

```
PowerPlan (DB)
├── flat_rate (legacy)
├── peak_rate / off_peak_rate (legacy)
├── electricity_rates: string (JSON) ← NEW
├── gas_rates: string (JSON) ← NEW
└── [electricity_schedules, gas_schedules] ← PLANNED

TariffCalculator
├── PlanSelector → fetch plans with electricity_rates/gas_rates
├── parseRateDefinition() → convert JSON to RateDefinition
├── deriveTwoTierRates() → intelligently map to peak/off-peak
└── Auto-fill form with appropriate rates

RateEditor (Admin)
└── Create rate definitions dynamically

MultiRateScheduleEditor (Admin, Preview Only)
└── UI for defining schedules (not persisted yet)
```

---

## Console Logs (Dev Mode)

When you select a plan in Analytics, check the browser console:

```
[TariffCalc] Plan 1 selected: {
  planName: "Standard",
  electricityRatesJSON: '{"day":0.25,"night":0.15}',
  parsedDef: {day: 0.25, night: 0.15},
  derived: {hasRates: true, isSingleRate: false, peak: 0.25, offPeak: 0.15}
}
```

This confirms the rates are being parsed and mapped correctly.

---

## Next Steps to Complete Schedule Support

1. **Add schema fields** for schedule persistence
2. **Update PowerPlanForm** to save schedule data (currently discarded)
3. **Update TariffCalculator** to use schedule definitions instead of simple peak/off-peak
4. **Recalculate tariff costs** considering time-based schedules
