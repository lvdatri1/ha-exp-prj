# Power Plans Create/Edit Issue - Debugging Guide

## What Was Fixed

### 1. Schedule Field Persistence ✅

- Added `electricity_schedule` and `gas_schedule` to:
  - POST endpoint (`/api/power-plans/route.ts`)
  - PUT endpoint (was already there)
  - `createPowerPlan()` function in `lib/db.ts`
  - `updatePowerPlan()` function in `lib/db.ts`
  - Mapping function `mapPowerPlanToLegacyFormat()`

### 2. Form State Management ✅

- Added schedule field initialization in `PowerPlanForm.tsx`
- Load schedules from form when editing
- Reset schedules after successful create
- Added form button types (`type="button"`) to prevent default submission

### 3. Logging & Error Handling ✅

- Added detailed console logging in:
  - `handleCreatePlan()` - page.tsx
  - `createPlan()` hook - usePowerPlans.ts
  - `POST /api/power-plans` - route.ts
  - `requireAdmin()` - route.ts
- Improved error messages to include actual error details

## How to Test If It's Working

### Option 1: Manual Testing in Browser

1. Open browser DevTools (F12)
2. Go to Admin → Power Plans Management
3. Fill in form:
   - Retailer: "Test Retailer"
   - Plan Name: "Test Plan"
   - Is Flat Rate: Yes (checked)
   - Flat Rate: 0.25
   - Daily Charge: 0.50
4. Click "Create Plan"
5. Check Console for logs - should see:
   ```
   Creating plan with data: {retailer: "Test Retailer", name: "Test Plan", ...}
   Creating plan, sending data: {...}
   Response status: 201
   Created plan: {...}
   ```

### Option 2: Use the Diagnostic Script

Run from project root:

```bash
cd c:\Users\trinle\git\ha\nextjs-app
node test-create-plan.js
```

This will:

1. Login as admin
2. Create a test plan
3. Show success/error response

## Debugging Steps If Still Not Working

### Step 1: Check Browser Console

1. Open DevTools (F12)
2. Go to Console tab
3. Refresh page
4. Look for these logs:
   - `Creating plan with data: ...` ← Form data being sent
   - `Creating plan, sending data: ...` ← Confirmed to be sent
   - `Response status: ...` ← HTTP status code
   - `Created plan: ...` ← Success, or error message

### Step 2: Check Network Tab

1. Open DevTools → Network tab
2. Click "Create Plan" button
3. Look for POST request to `/api/power-plans`
4. Check:
   - **Status**: Should be 201 (Created) or 200 (OK)
   - **Request Payload**: Should include all form fields
   - **Response**: Should contain `{ plan: { id, name, ... } }`
   - **Headers**: Should have `Content-Type: application/json`

### Step 3: Check Server Logs

If running dev server locally:

1. Look at terminal running `npm run dev`
2. Should see logs like:
   ```
   RequireAdmin - userId from cookie: 1
   User from DB: admin isAdmin: true
   Create plan error: ... (if error)
   ```

### Step 4: Verify Admin Status

The form requires you to be logged in as an **admin**:

1. Check the user in database has `is_admin = 1` (or `true`)
2. Or check in Admin Dashboard - verify you see "Admin" status

### Step 5: Check Form Validation

If error "Retailer and Plan Name are required":

1. Verify you filled in both fields
2. Fields must not be empty
3. This is a client-side check before sending to API

## Recent Changes Made

### Files Modified:

1. **app/admin/power-plans/components/PowerPlanForm.tsx**

   - Added `type="button"` to submit/cancel buttons
   - Prevents form default submission behavior

2. **app/admin/power-plans/page.tsx**

   - Added validation for required fields
   - Added console logging in `handleCreatePlan()`
   - Added error message display

3. **app/admin/power-plans/hooks/usePowerPlans.ts**

   - Added detailed logging in `createPlan()` function
   - Better error reporting

4. **app/api/power-plans/route.ts**
   - Added detailed logging in `requireAdmin()`
   - Better error messages with actual error details
   - Already has schedule fields in POST handler

## Common Issues & Solutions

### "Forbidden" Error (403)

**Cause**: User is not logged in or not an admin
**Solution**:

1. Make sure you're on an admin page
2. Check Session/Auth in browser DevTools
3. Verify admin user in database

### "Failed to create plan" (500)

**Cause**: Database error
**Solution**:

1. Check server logs for the actual error
2. Verify Prisma is properly initialized
3. Check database migrations are up to date

### Form Won't Submit

**Cause**: Button behavior
**Solution**:

1. Added `type="button"` to buttons
2. Check that onClick handlers are being called
3. Check console for validation errors

### Data Not Persisting

**Cause**: Schedule fields not being saved
**Solution**:

- ✅ FIXED - All schedule fields now added to API
- ✅ FIXED - Database schema has schedule fields
- ✅ FIXED - Form loads/saves schedules properly

## Next Steps to Confirm Fix

1. **Start dev server**:

   ```bash
   cd c:\Users\trinle\git\ha\nextjs-app
   npm run dev
   ```

2. **Open browser**:

   - Go to `http://localhost:3000/admin/power-plans`
   - Login as admin if needed

3. **Try creating a plan**:

   - Fill in minimal fields (Retailer, Name)
   - Click "Create Plan"
   - Watch console for logs

4. **Check results**:

   - Plan should appear in the list
   - No error messages
   - Console should show success logs

5. **Try editing the plan**:
   - Click "Edit" on the plan
   - Verify form loads with existing data
   - Make a change
   - Click "Save"
   - Verify it saves without error

## If Issue Persists

Please provide:

1. The exact error message displayed
2. Console logs (screenshot or copy/paste)
3. Network tab screenshot showing the API request/response
4. Whether you're using admin credentials
5. Any error in the server terminal

This information will help pinpoint the exact issue.
