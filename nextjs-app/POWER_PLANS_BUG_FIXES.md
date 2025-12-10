# Power Plans CRUD Create/Edit Save Bugs - Fixed

## Root Causes Identified and Fixed

### 1. **Schedule Fields Not Persisted on Create** (CRITICAL)

**Problem:** When creating a power plan with schedules, the `electricity_schedule` and `gas_schedule` fields were not being sent to or processed by the API.

**Files Fixed:**

- `app/api/power-plans/route.ts` - POST endpoint
- `lib/db.ts` - createPowerPlan function
- `app/admin/power-plans/page.tsx` - Form initialization

**Changes:**

```typescript
// BEFORE: Missing schedule fields in POST endpoint
const plan = await createPowerPlan({
  electricity_rates: body.electricity_rates ?? null,
  // ... schedule fields missing!
});

// AFTER: Added schedule fields
const plan = await createPowerPlan({
  electricity_rates: body.electricity_rates ?? null,
  electricity_schedule: body.electricity_schedule ?? null,
  // ... and gas_schedule
});
```

### 2. **Schedule Fields Not Persisted on Update** (CRITICAL)

**Problem:** The PUT endpoint in `app/api/power-plans/[id]/route.ts` correctly accepted schedule fields, but the `updatePowerPlan` function wasn't mapping them.

**Files Fixed:**

- `lib/db.ts` - updatePowerPlan function (lines 336-340)
- `lib/db.ts` - PowerPlan type definition (added schedule fields)
- `lib/db.ts` - mapPowerPlanToLegacyFormat function

**Changes:**

```typescript
// BEFORE: updatePowerPlan didn't map schedule fields
if ("electricity_rates" in fields) data.electricityRates = ...;
if ("daily_charge" in fields) data.dailyCharge = ...;
// ... missing schedule mappings!

// AFTER: Added schedule field mappings
if ("electricity_schedule" in fields) data.electricitySchedule = ...;
if ("gas_schedule" in fields) data.gasSchedule = ...;
```

### 3. **Schedule Data Not Loading on Edit** (CRITICAL)

**Problem:** When opening the edit form, the schedule data wasn't being loaded from the database, so users couldn't see or modify existing schedules.

**Files Fixed:**

- `app/admin/power-plans/components/PowerPlanForm.tsx` - Form state initialization

**Changes:**

```typescript
// BEFORE: Always created empty schedules
const [electricitySchedule, setElectricitySchedule] = useState<MultiRateWeekSchedule>(() =>
  createEmptySchedule(Object.keys(electricityRates)[0] || "day")
);

// AFTER: Load from form if available
const [electricitySchedule, setElectricitySchedule] = useState<MultiRateWeekSchedule>(() => {
  if (form.electricity_schedule) {
    try {
      return JSON.parse(form.electricity_schedule);
    } catch {
      return createEmptySchedule(...);
    }
  }
  return createEmptySchedule(...);
});
```

### 4. **Type Definitions Missing Schedule Fields**

**Problem:** The PowerPlan interfaces weren't including the new schedule fields.

**Files Fixed:**

- `lib/db.ts` - PowerPlan interface
- `app/admin/power-plans/hooks/usePowerPlans.ts` - PowerPlan interface

### 5. **Form Not Resetting Schedules After Create**

**Problem:** After successfully creating a plan, the form wasn't fully resetting, including the schedule fields.

**Files Fixed:**

- `app/admin/power-plans/page.tsx` - handleCreatePlan function

**Changes:**

```typescript
// BEFORE: Reset missing schedule fields
setForm({
  electricity_rates: null,
  gas_rates: null,
  // ... missing schedule fields!
});

// AFTER: Full reset with schedules
setForm({
  electricity_rates: null,
  electricity_schedule: null, // NEW
  gas_rates: null,
  gas_schedule: null, // NEW
});
```

### 6. **Test Mock Data Missing Fields**

**Problem:** Unit tests were failing because mock data didn't include the new schedule fields.

**Files Fixed:**

- `lib/__tests__/db.test.ts` - Mock power plan object

## Complete List of Modified Files

1. ✅ `app/api/power-plans/route.ts` - Added schedule fields to POST endpoint
2. ✅ `app/api/power-plans/[id]/route.ts` - Already had schedule fields (no change needed)
3. ✅ `lib/db.ts` - Added schedule fields to:
   - PowerPlan interface (type definition)
   - createPowerPlan function
   - updatePowerPlan function
   - mapPowerPlanToLegacyFormat function
4. ✅ `app/admin/power-plans/page.tsx` - Updated form initialization and reset
5. ✅ `app/admin/power-plans/components/PowerPlanForm.tsx` - Load schedules from form on edit
6. ✅ `app/admin/power-plans/hooks/usePowerPlans.ts` - Updated PowerPlan type
7. ✅ `lib/__tests__/db.test.ts` - Fixed mock data

## Testing Approach

### E2E Test Files Created

- `e2e/power-plans-crud-with-schedules.spec.ts` - Comprehensive CRUD test
- `e2e/debug-save-issue.spec.ts` - Debugging tests with network monitoring

### Test Coverage

1. **Create Plan with Schedules**

   - Fill basic plan details
   - Configure electricity rates
   - Add schedule periods
   - Verify plan is created

2. **Edit Plan and Update Schedule**

   - Load existing plan
   - Verify schedule data loads
   - Modify schedule
   - Save changes
   - Verify persistence

3. **Network Request Monitoring**
   - Intercept API calls
   - Verify schedule fields are in payload
   - Check response status
   - Validate error handling

## How to Verify Fixes

### Manual Testing

1. **Create a new plan:**

   - Admin → Power Plans Management
   - Click "Create New Power Plan"
   - Fill in Retailer and Plan Name
   - Select "Flat Rate" = unchecked (for multi-rate)
   - Configure electricity rates (day, night, peak, etc.)
   - Click "Electricity Rate Schedule" button
   - Add a period with start/end time and rate type
   - Click "Create Plan"
   - Verify plan appears in list

2. **Edit existing plan:**

   - Click "Edit" on any plan
   - Verify the form loads with existing data
   - Verify schedule editor shows existing periods
   - Make a change (e.g., add a new period)
   - Click "Save"
   - Verify the plan is updated and schedules persist

3. **Check browser console:**
   - Look for any JavaScript errors
   - Check Network tab for API responses
   - Verify PUT/POST requests include schedule fields

### Unit Test Verification

```bash
npm test -- lib/__tests__/db.test.ts
```

Should pass all Power Plans tests.

## Summary of Bug Impact

**Before Fixes:**

- ❌ Creating plans with schedules: Schedules not saved to DB
- ❌ Editing plans: Schedule data lost, form doesn't show existing schedules
- ❌ Saving edits: Schedules not persisted, errors on submit
- ❌ Unit tests: Failed due to incomplete mock data

**After Fixes:**

- ✅ Creating plans with schedules: Fully functional
- ✅ Editing plans: Schedules load correctly, user can modify them
- ✅ Saving edits: All data persists correctly
- ✅ Unit tests: All passing with complete mock data
- ✅ Type safety: Full TypeScript support for schedule fields
