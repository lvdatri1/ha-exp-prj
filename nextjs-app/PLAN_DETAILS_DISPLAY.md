# Plan Details Display Enhancement

## What Was Added

A new component `PlanDetailsDisplay` has been added to the Tariff Calculator to show the actual rates configured in each selected power plan. This addresses the user's concern about not being able to "see same like in admin page" by displaying the rates that were configured in the admin form.

## Component: PlanDetailsDisplay

**Location:** `components/PlanDetailsDisplay.tsx`

### Features:

- **Visual Rate Display**: Shows electricity and gas rates from the selected power plan in an easy-to-read format
- **Flexible Rates**: Parses and displays the new flexible rate definitions (e.g., "day", "night", "peak", "free") that were created in the admin form
- **Fallback to Legacy Rates**: If flexible rates aren't available, shows legacy peak/off-peak rates
- **Color-Coded Sections**:
  - Blue gradient for electricity rates
  - Orange gradient for gas rates
- **Daily Charges**: Displays daily charges for both electricity and gas
- **Conditional Gas Display**: Only shows gas rates if the plan has gas (has_gas === 1)

### Data Flow:

1. User selects a power plan in the PlanSelector dropdown
2. TariffCalculator auto-fills form fields from the plan's rates (existing behavior)
3. **NEW**: PlanDetailsDisplay component renders immediately below PlanSelector showing:
   - All rates defined in electricity_rates JSON
   - All rates defined in gas_rates JSON
   - Daily charges if configured
   - Graceful fallback if rates aren't configured

## Integration Points

### Updated Files:

#### 1. **components/TariffCalculator.tsx**

- Added import: `import PlanDetailsDisplay from "./PlanDetailsDisplay"`
- Added `<PlanDetailsDisplay plan={selectedPlan} />` after PlanSelector in:
  - Single tariff view (non-comparison mode)
  - Tariff 1 (comparison mode)
  - Tariff 2 (comparison mode)

#### 2. **components/PlanDetailsDisplay.tsx** (NEW)

- Standalone component that receives ExternalPowerPlan as prop
- Parses electricity_rates and gas_rates JSON
- Renders rates with formatting and styling
- Null-safe: returns nothing if plan is null

## How It Works

### For Plans with Flexible Rates:

When a power plan has multi-tier rates configured in the admin form (e.g., `{ "night": 0.15, "day": 0.25, "peak": 0.35 }`), the PlanDetailsDisplay component will show:

```
⚡ Electricity
night: €0.1500/kWh
day:   €0.2500/kWh
peak:  €0.3500/kWh
Daily charge: €0.3000
```

### For Legacy Plans:

Plans with only peak/off-peak rates will still display:

```
⚡ Electricity
Peak Rate:     €0.3800/kWh
Off-Peak Rate: €0.2500/kWh
Daily charge:  €0.3000
```

## User Experience Improvement

**Before:** User selects a plan, it auto-fills the form, but they can't see what rates are actually defined in the plan.

**After:** User selects a plan and immediately sees:

1. The rates are auto-filled (existing functionality)
2. A visual "Plan Details" section showing exactly what rates are configured
3. This matches the visual feedback from the admin form where they defined the rates

## Testing

To test this enhancement:

1. **Create a Test Plan in Admin:**

   - Go to `/admin/power-plans`
   - Create or edit a plan
   - Click "Add Custom Rates"
   - Define multiple rates (e.g., "Night", "Day", "Peak" with different values)
   - Save the plan

2. **View in Tariff Calculator:**

   - Go to `/analytics`
   - Find "Tariff Calculator (NZ)"
   - Select your test plan from the dropdown
   - You should see the "Plan Details" section displaying all the rates you configured

3. **Compare Mode:**
   - Click "Compare Tariffs"
   - Both Tariff 1 and Tariff 2 sections show their plan details

## Technical Details

- **Parsing:** Uses the same `parseRateDefinition()` helper as the auto-fill logic
- **Formatting:** Rates are formatted to 4 decimal places with €/kWh units
- **Styling:** Uses Tailwind CSS with DaisyUI utility classes for consistent styling
- **Performance:** No additional API calls; data comes from already-fetched plans
- **Accessibility:** Semantic HTML with proper text hierarchy and icons

## Next Steps (If Needed)

If users want even more visibility:

- Could add a history/audit log showing when rates were updated
- Could show applied schedules (though schedules aren't persisted yet)
- Could add comparison between configured rates and applied rates
