# Tariff Calculator Enhancement: Advanced Multi-Rate Editing & Schedule Support

## 🎯 What Was Implemented

The Tariff Calculator now has **full parity with the admin Power Plan form** - users can create, edit, and apply custom multi-tier rates with time-based schedules directly in the calculator. This eliminates the need to switch between admin and calculator interfaces.

## ✨ Key Features Added

### 1. **Rate Editor Integration** ⚡

- Add/remove/edit custom rate types (free, night, day, peak, shoulder, etc.)
- Add custom named rates
- Works with both electricity and gas rates
- Real-time updates to cost calculations

### 2. **Schedule Editor Integration** ⏰

- Define time-based periods for each rate type
- Set default rate for unscheduled times
- Copy schedules across days for consistency
- Support for schedules crossing midnight

### 3. **Multi-Rate Cost Calculation** 💰

- New `calculateCostsWithMultiRates()` function processes complex schedules
- Correctly accounts for variable rates throughout the day/week
- Supports mixed flat-rate and multi-rate scenarios
- Generates detailed cost breakdown by rate type

### 4. **Seamless UI/UX** 🎨

- **Toggle Button**: "Add Custom Rates & Schedule" switches between simple and advanced modes
- **Single Tariff View**: Rate editor appears above the existing peak/off-peak settings
- **Comparison Mode**: Both Tariff 1 and Tariff 2 can use custom rates independently
- **Color-Coded**: Blue for electricity, orange for gas
- **Responsive**: Works on mobile and desktop

## 📁 Files Modified/Created

### Core Files:

1. **`components/TariffCalculator.tsx`** ⭐ MAJOR UPDATE

   - Added multi-rate state management (electricityRates1, electricitySchedule1, etc.)
   - Imported RateEditor and MultiRateScheduleEditor components
   - Updated calculateCosts() functions to use new calculateCostsWithMultiRates()
   - Added UI sections for rate and schedule editing
   - Added toggle buttons to switch between simple and advanced modes
   - Full support in both single tariff and comparison modes

2. **`utils/tariffCalculations.ts`** ⭐ MAJOR UPDATE

   - New `MultiRateTariffConfig` interface for flexible configuration
   - New `calculateCostsWithMultiRates()` function supporting:
     - Multi-rate schedules with time-based periods
     - Flat rate and multi-rate modes
     - Gas and electricity with different configurations
     - Detailed cost breakdown by rate type
   - Helper function `getRateAtTime()` for determining active rate at specific time

3. **`types/tariff.ts`** ✏️ UPDATED

   - Made peak/offPeak cost fields optional (supports multi-rate data)
   - Added `byRate` and `byGasRate` fields for multi-rate cost tracking
   - Updated CostData and MonthlyCost interfaces to be flexible

4. **`components/SingleTariffTable.tsx`** ✏️ UPDATED

   - Fixed null checks for optional peak/offPeak fields
   - Compatible with both legacy and multi-rate cost data

5. **`components/CostComparisonTable.tsx`** ✏️ UPDATED
   - Fixed null checks for optional cost fields
   - Works with both calculation methods seamlessly

### Reused Components (No Changes Needed):

- `components/RateEditor.tsx` - Already supports adding/removing rates
- `components/MultiRateScheduleEditor.tsx` - Already handles schedule editing
- `app/admin/power-plans/components/PowerPlanForm.tsx` - Reference for implementation

## 🔄 How It Works

### Single Tariff Mode:

```
User selects plan
  ↓
Plan Details show (existing feature)
  ↓
[NEW] "Add Custom Rates & Schedule" button appears
  ↓
User clicks button → switches to advanced mode
  ↓
User can:
  1. Define custom rates (night: 0.15, day: 0.25, peak: 0.35)
  2. Add time-based schedule (9am-5pm weekdays = peak rate)
  3. See costs recalculate in real-time
```

### Comparison Mode:

```
Tariff 1 [Blue]        Tariff 2 [Orange]
  ↓                      ↓
Select Plan 1      Select Plan 2
  ↓                      ↓
[Optional] Custom   [Optional] Custom
  Rates 1            Rates 2
  ↓                      ↓
Calculate & Compare side-by-side
```

## 💡 Code Examples

### Using Custom Rates in Calculator:

```typescript
// User adds rates via RateEditor
const electricityRates = {
  free: 0,
  night: 0.15,
  day: 0.25,
  peak: 0.35,
};

// User sets up schedule via MultiRateScheduleEditor
const electricitySchedule = {
  monday: {
    periods: [{ start: "09:00", end: "17:00", rateType: "peak" }],
    defaultRate: "day",
  },
  // ... other days
};

// Calculator uses new function
const result = calculateCostsWithMultiRates(
  allData,
  gasData,
  true, // hasGas
  {
    isFlatMode: false,
    rates: electricityRates,
    schedule: electricitySchedule,
    dailyCharge: 0.3,
  },
  gasConfig // optional
);

// Result includes detailed breakdown
result.yearly.byRate = {
  free: 0,
  night: 150,
  day: 200,
  peak: 50,
};
```

## 🚀 State Management

### Tariff 1 Multi-Rate State:

- `useMultiRate1` - boolean toggle for advanced mode
- `electricityRates1` - RateDefinition object
- `electricitySchedule1` - MultiRateWeekSchedule object
- `gasRates1` - RateDefinition object
- `gasSchedule1` - MultiRateWeekSchedule object

### Tariff 2 Multi-Rate State:

- `useMultiRate2` - boolean toggle for advanced mode
- `electricityRates2`, `electricitySchedule2`
- `gasRates2`, `gasSchedule2_sched`

Note: Legacy peak/off-peak state still exists for backward compatibility.

## 📊 Cost Calculation Flow

### Multi-Rate Calculation Process:

1. **Grouping**: Group energy data by date
2. **Rate Assignment**: For each time point, determine which rate applies based on schedule
3. **Aggregation**: Sum kWh by rate type for each day
4. **Cost Calculation**: Multiply each rate's kWh × rate value
5. **Breakdown**: Provide costs per rate type (free, night, day, peak, etc.)
6. **Aggregation**: Monthly and yearly summaries

### Calculation Accuracy:

- ✅ Handles schedules crossing midnight
- ✅ Supports multiple overlapping rate types
- ✅ Correctly aggregates by month and year
- ✅ Works with both electricity and gas
- ✅ Supports mixed flat-rate and tiered scenarios

## 🧪 Testing the Feature

### Step 1: Create Test Rates

1. Go to `/analytics` → Tariff Calculator
2. Click "+ Add Custom Rates & Schedule"
3. Add electricity rates:
   - Night: 0.15/kWh
   - Day: 0.25/kWh
   - Peak: 0.35/kWh
4. Set Daily Charge: 0.30

### Step 2: Define Schedule

1. Click "⏰ Define Time-Based Schedules"
2. For Monday (example):
   - Add period: 9:00 AM - 5:00 PM = Peak rate
   - Default rate for other times = Day
3. Copy to all days or set individually

### Step 3: View Results

1. Charts and cost tables update automatically
2. Click "▶ Comparing 2 Tariffs" to compare with standard plan
3. See side-by-side cost breakdown

## ⚙️ Technical Details

### Types:

```typescript
interface MultiRateTariffConfig {
  isFlatMode: boolean;
  flatRate?: number;
  rates: Record<string, number>;
  schedule: Record<
    string,
    {
      periods: Array<{ start: string; end: string; rateType: string }>;
      defaultRate: string;
    }
  >;
  dailyCharge: number;
}
```

### Performance:

- ✅ No additional API calls
- ✅ Calculation uses in-memory data only
- ✅ React memoization for schedule changes
- ✅ Efficient time checking with minute-based math

### Browser Compatibility:

- ✅ Chrome/Chromium
- ✅ Firefox
- ✅ Safari
- ✅ Edge

## 🔐 Data Persistence

- **Current Session**: All custom rates/schedules stored in React state
- **Between Sessions**: Not persisted (can be saved to localStorage if needed)
- **To Save Plan**: Create/edit power plan in admin to persist rates

## 🎓 Reuse of Existing Components

This implementation heavily reuses components from the admin form:

- **RateEditor**: Identical functionality for adding/removing rates
- **MultiRateScheduleEditor**: Full schedule editing with copy-to-all
- **Type definitions**: Shared RateDefinition, MultiRateWeekSchedule types
- **Calculation helpers**: timeToMinutes(), getRateAtTime()

## 📝 Backward Compatibility

- ✅ Existing peak/off-peak mode still works
- ✅ Legacy calculation function preserved
- ✅ Old cost data format still supported
- ✅ Can toggle between simple and advanced without losing data

## 🚨 Known Limitations

1. **Schedules Not Persistent**: Custom rates/schedules are session-only

   - _Workaround_: Save as power plan in admin to persist

2. **Gas Schedule Optional**: Gas rates currently use electricity schedule

   - _Reason_: Gas consumption patterns often match electricity
   - _Future_: Can add separate gas schedule if needed

3. **No Holiday Support**: Doesn't account for special dates/holidays
   - _Workaround_: Manual adjustment or create separate plan

## 🎯 Future Enhancements

- [ ] Save custom rates/schedules to localStorage
- [ ] Import/export rate configurations
- [ ] Holiday calendars for special rate days
- [ ] Rate history/versioning
- [ ] Integration with actual rate data from providers
- [ ] Scenario modeling (what-if analysis)

## ✅ Quality Assurance

- ✅ No TypeScript errors
- ✅ Dev server compiles successfully
- ✅ All components render without issues
- ✅ Cost calculations verified with manual examples
- ✅ UI/UX matches admin form design

## 📚 Documentation Files

- `RATE_INTEGRATION_STATUS.md` - Updated with new feature
- `PLAN_DETAILS_DISPLAY.md` - Rate display component
- `TESTING_PLAN_DETAILS_DISPLAY.md` - Testing instructions (older)
- `CHANGES_SUMMARY.md` - Previous changes summary
