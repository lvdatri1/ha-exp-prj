# Quick Start: Using Advanced Rates in Tariff Calculator

## 🚀 In 5 Minutes

### Option 1: Simple Mode (Default)

1. Go to Analytics → Tariff Calculator
2. Select a power plan
3. Adjust peak/off-peak rates manually
4. View costs

### Option 2: Advanced Mode (NEW!)

1. Go to Analytics → Tariff Calculator
2. Click **"+ Add Custom Rates & Schedule"** button
3. **Add Rates** (Choose from common types or add custom):
   - ⭕ Free: 0.00
   - 🌙 Night: 0.15
   - ☀️ Day: 0.25
   - 🔴 Peak: 0.35
4. **Define Schedule** (Optional):
   - Click "⏰ Define Time-Based Schedules"
   - Set time periods for each rate type
   - Example: 9am-5pm weekdays = Peak rate
5. **View Results**:
   - Costs update automatically
   - See breakdown by rate type
   - Compare with other tariffs

## 🎨 UI Locations

### Single Tariff View:

```
┌─ Tariff Calculator (NZ) ─────────────┐
│                                      │
│  🔽 Plan Selector                    │
│  [Plan Details Display]              │
│                                      │
│  ┌─ [+ Add Custom Rates & Schedule]─┐│ ← NEW!
│  │ ⚡ Electricity                    ││
│  │  ☐ Flat Rate                      ││
│  │  ┌─ RateEditor ─────────────────┐ ││
│  │  │ Night: 0.15/kWh        [X]  │ ││
│  │  │ Day:   0.25/kWh        [X]  │ ││
│  │  │ Peak:  0.35/kWh        [X]  │ ││
│  │  └──────────────────────────────┘ ││
│  │  ⏰ Define Time-Based Schedules   ││
│  │  ┌─ MultiRateScheduleEditor ──┐  ││
│  │  │ Monday:                    │  ││
│  │  │  + Add period: 9am-5pm    │  ││
│  │  │    Rate Type: Peak        │  ││
│  │  └────────────────────────────┘  ││
│  │                                  ││
│  │ 🔥 Gas                           ││
│  │  ☐ Flat Rate                     ││
│  │  [Rate Editor]                   ││
│  └──────────────────────────────────┘│
│                                      │
│ [TariffSettings - Legacy Mode]       │
│                                      │
│ [Cost Tables]                        │
└──────────────────────────────────────┘
```

### Comparison Mode:

```
Left Side (Blue)       │  Right Side (Orange)
┌─────────────────┐   │  ┌─────────────────┐
│ Tariff 1        │   │  │ Tariff 2        │
│ Plan Selector   │   │  │ Plan Selector   │
│ [+ Add Rates]   │   │  │ [+ Add Rates]   │
│ [Editor]        │   │  │ [Editor]        │
│ [Settings]      │   │  │ [Settings]      │
└─────────────────┘   │  └─────────────────┘
```

## 📊 What Changes When Using Advanced Rates

### Before (Simple Mode):

```
Electricity Cost = (peak kWh × peak_rate) + (off-peak kWh × off-peak_rate) + daily_charge
```

### After (Advanced Mode):

```
Electricity Cost = Σ(rate_type_kWh × rate_value) for each rate type
                 + daily_charge

Example:
= (free kWh × 0.00)
+ (night kWh × 0.15)
+ (day kWh × 0.25)
+ (peak kWh × 0.35)
+ daily_charge (0.30)
```

## 🔑 Key Controls

| Control                          | Purpose                | Location               |
| -------------------------------- | ---------------------- | ---------------------- |
| `+ Add Custom Rates & Schedule`  | Toggle advanced mode   | Below Plan Details     |
| `RateEditor`                     | Add/remove/edit rates  | In advanced section    |
| `☐ Flat Rate`                    | Switch to flat pricing | In advanced section    |
| `⏰ Define Time-Based Schedules` | Add schedule           | In advanced section    |
| `MultiRateScheduleEditor`        | Edit time periods      | Expand schedule button |
| `Copy to all days`               | Apply same schedule    | In schedule editor     |

## 🧮 Cost Breakdown

When using advanced rates, costs are tracked by type:

```javascript
// Cost data includes:
result.yearly.byRate = {
  free: 0, // Cost of free-tier consumption
  night: 150, // Cost of night-rate consumption
  day: 200, // Cost of day-rate consumption
  peak: 50, // Cost of peak-rate consumption
};

result.yearly.total = 400; // (0 + 150 + 200 + 50 + daily charges)
```

## ❓ FAQ

**Q: Can I use multiple rates for different days?**
A: Yes! Set schedules individually for each day or use "Copy to all days" for consistency.

**Q: What if a time isn't covered by any period?**
A: The default rate is used for unscheduled times.

**Q: Can schedules cross midnight?**
A: Yes! If end_time < start_time, it's treated as crossing midnight.

**Q: How do I save my custom rates?**
A: Create a new power plan in `/admin/power-plans` using the same rates and schedules.

**Q: Can I use advanced rates in comparison mode?**
A: Yes! Each tariff (1 and 2) can independently use advanced rates.

**Q: What happens to my rates if I select a different plan?**
A: Advanced rates persist in the session. Your manually entered rates are preserved.

**Q: Can I have different gas and electricity schedules?**
A: Currently, they share the same schedule. Separate schedules coming in future update.

## 🎯 Common Scenarios

### Scenario 1: Off-Peak Focused Plan

```
Rates:
- Off-peak (night + free): 0.10/kWh
- Normal: 0.20/kWh

Schedule:
- 10pm-7am: Off-peak
- 7am-10pm: Normal
```

### Scenario 2: Time-of-Use (TOU) Plan

```
Rates:
- Night (10pm-7am): 0.12/kWh
- Day (7am-9pm): 0.25/kWh
- Peak (9am-5pm weekdays): 0.35/kWh

Schedule:
- Monday-Friday: 9am-5pm = Peak, else Day
- 10pm-7am (all days): Night
```

### Scenario 3: Flat + Peak

```
Rates:
- Flat: 0.20/kWh

Toggle "Flat Rate" → Single rate applied uniformly
(Ignore schedule, use flat rate for all)
```

## 🔗 Related Pages

- Admin Power Plans: `/admin/power-plans`
- Analytics Dashboard: `/analytics`
- Energy Data View: `/analytics/energy-data`

## 💬 Tips & Tricks

1. **Copy Schedules**: Use "Copy to all days" after setting one day's schedule
2. **Preview Rates**: Plan Details section shows rates from selected plan
3. **Reset Rates**: Deselect and reselect plan to reset to defaults
4. **Compare**: Use "Compare Tariffs" to see side-by-side with another plan
5. **Fine-tune**: Adjust rates slightly to see cost sensitivity

## ⚠️ Important Notes

- Custom rates are **session-only** (cleared on page refresh)
- To make rates permanent, save as power plan in admin
- Schedules follow a **weekly repeating pattern** (Mon-Sun)
- Time entry uses **24-hour format** (09:00 not 9:00 AM)
- Rates should be **positive numbers** (0 for free tier is OK)
