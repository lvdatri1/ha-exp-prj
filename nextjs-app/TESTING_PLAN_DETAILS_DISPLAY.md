# Testing Instructions: Plan Details Display Feature

## Quick Test (2 minutes)

### Prerequisite

- Dev server running: `npm run dev` (currently running on port 3000)
- App accessible at: http://localhost:3000

### Step-by-Step Test

#### 1. Create a Test Power Plan with Custom Rates

1. Navigate to: http://localhost:3000/admin/power-plans
2. Click "Create New Plan" or edit an existing plan
3. Fill in basic info:

   - **Retailer**: `Test Provider`
   - **Name**: `Test Multi-Rate Plan`
   - **Active**: Check this box

4. Configure Custom Rates:

   - Look for "Electricity Rates" section
   - Click "Add Custom Rates" if shown
   - In the RateEditor, add these rates:
     - `free`: 0.00
     - `night`: 0.15
     - `day`: 0.25
     - `peak`: 0.35
   - Set Daily Charge: 0.30

5. **Save the Plan**

#### 2. View Plan Details in Tariff Calculator

1. Navigate to: http://localhost:3000/analytics
2. Scroll down to "Tariff Calculator (NZ)" section
3. In the **PlanSelector** dropdown, select your test plan
4. **Expected Result**: You should see a new section appear below the dropdown:

```
⚡ Electricity
free:   €0.0000/kWh
night:  €0.1500/kWh
day:    €0.2500/kWh
peak:   €0.3500/kWh
Daily charge: €0.3000
```

5. **Verify**: The form fields below are also auto-filled with peak (0.35) and off-peak (0.15) rates

#### 3. Test Comparison Mode

1. Still on the Tariff Calculator, click **"Compare Tariffs"** button
2. You should now see two cards: "Tariff 1" (blue) and "Tariff 2" (orange)
3. For Tariff 1:
   - Select your test plan
   - Verify Plan Details display appears below PlanSelector
4. For Tariff 2:
   - Select a different plan or the same plan
   - Verify Plan Details display appears for it too
5. **Expected**: Both show their respective rate details

#### 4. Test with Legacy Plan (Peak/Off-Peak Only)

1. Select a plan that doesn't have custom rates (only has peak/off-peak)
2. **Expected Result**: Plan Details shows:

```
⚡ Electricity
Peak Rate:     €X.XXXX/kWh
Off-Peak Rate: €X.XXXX/kWh
Daily charge:  €X.XXXX (if configured)
```

#### 5. Test with Gas Plan

1. If available, select a plan with `has_gas = true` and gas rates configured
2. **Expected**: You should see both electricity AND gas sections:

```
⚡ Electricity
[electricity rates]

🔥 Gas
[gas rates]
```

## What to Verify

| Test Case                  | Expected Behavior                              | Status |
| -------------------------- | ---------------------------------------------- | ------ |
| Plan with flexible rates   | Shows all custom rates in formatted boxes      | ✓      |
| Legacy peak/off-peak plan  | Shows peak and off-peak rates                  | ✓      |
| Plan with daily charge     | Displays daily charge below rates              | ✓      |
| Plan with gas              | Shows both electricity and gas sections        | ✓      |
| No plan selected           | Plan Details section not visible (null safety) | ✓      |
| Single tariff mode         | Plan Details appears once                      | ✓      |
| Comparison mode            | Plan Details appears twice (one for each)      | ✓      |
| Form auto-fill still works | Peak/off-peak fields populate automatically    | ✓      |
| No TypeScript errors       | Browser console clean, no errors               | ✓      |

## Troubleshooting

### Plan Details Not Showing?

1. **Check if plan is selected**: Ensure a plan is actually selected in the dropdown
2. **Check browser console**:
   - Open DevTools (F12)
   - Go to Console tab
   - Look for any error messages
3. **Verify plan has rates**:
   - Go back to admin page
   - Edit the plan
   - Check that rates are actually configured
4. **Refresh page**: Sometimes React state needs a refresh
5. **Check network**:
   - Open DevTools → Network tab
   - Look for `/api/power-plans?active=1` response
   - Verify it includes `electricity_rates` field with JSON data

### Rates Showing Incorrectly?

1. Check the JSON format in the database
2. Look at browser console for parse errors
3. Verify `electricity_rates` field contains valid JSON

## Browser Compatibility

- ✅ Chrome/Chromium (tested)
- ✅ Firefox (should work)
- ✅ Safari (should work)
- ✅ Edge (should work)

**Note**: This uses standard React and Tailwind CSS, so any modern browser should work.

## Performance Notes

- ✅ No additional API calls (uses already-fetched plan data)
- ✅ Lightweight component (~130 lines)
- ✅ CSS-in-JS (Tailwind) - no extra CSS files
- ✅ Re-renders only when selected plan changes

## Technical Details for Developers

### Component Location

- **File**: `/components/PlanDetailsDisplay.tsx`
- **Type**: Client component ("use client")
- **Props**: `{ plan: ExternalPowerPlan | null }`

### Data Flow

```
PlanSelector (user selects plan)
    ↓
selectedPlan state updated
    ↓
PlanDetailsDisplay renders with selectedPlan
    ↓
parseRateDefinition() parses electricity_rates JSON
    ↓
Rates displayed in formatted boxes
```

### Rate Parsing Logic

- Uses `parseRateDefinition()` to safely parse JSON
- Filters out non-numeric values
- Displays all numeric properties
- Replaces underscores with spaces in display names
- Formats numbers to 4 decimal places

### Styling

- Tailwind CSS classes
- DaisyUI button components (not used in this component but consistent)
- Gradient backgrounds (blue for electricity, orange for gas)
- Responsive design (stacks on mobile)

## Files Changed

1. ✨ **NEW**: `components/PlanDetailsDisplay.tsx` - The new display component
2. **MODIFIED**: `components/TariffCalculator.tsx` - Added 3 instances of PlanDetailsDisplay
3. **MODIFIED**: `RATE_INTEGRATION_STATUS.md` - Added documentation of this feature
4. ✨ **NEW**: `PLAN_DETAILS_DISPLAY.md` - Detailed component documentation
5. ✨ **NEW**: `CHANGES_SUMMARY.md` - Summary of all changes

## Reverting Changes (If Needed)

To remove this feature:

1. Delete `components/PlanDetailsDisplay.tsx`
2. Remove imports from `components/TariffCalculator.tsx`
3. Remove the 3 `<PlanDetailsDisplay>` JSX elements from TariffCalculator

The tariff calculator will continue to work normally - just without the visual rate display.
