import random
from datetime import datetime, timedelta
import csv

def generate_energy_value(hour, month):
    """Generate realistic energy values based on time of day and season"""
    # Base consumption pattern by hour (higher during day, lower at night)
    hour_multiplier = {
        0: 0.6, 1: 0.5, 2: 0.5, 3: 0.5, 4: 0.5, 5: 0.6,
        6: 0.8, 7: 1.2, 8: 1.5, 9: 1.8, 10: 1.7, 11: 1.6,
        12: 1.5, 13: 1.4, 14: 1.3, 15: 1.4, 16: 1.6, 17: 1.9,
        18: 2.0, 19: 2.2, 20: 2.1, 21: 1.8, 22: 1.2, 23: 0.8
    }
    
    # Seasonal variation (higher in winter, lower in summer)
    # Dec, Jan, Feb = winter, Jun, Jul, Aug = summer in Southern Hemisphere
    season_multiplier = {
        12: 1.3, 1: 1.3, 2: 1.2,  # Summer (hot - more AC)
        3: 1.0, 4: 0.9, 5: 0.8,    # Autumn
        6: 0.9, 7: 0.9, 8: 0.9,    # Winter
        9: 0.9, 10: 1.0, 11: 1.1   # Spring
    }
    
    base = 0.15
    hour_factor = hour_multiplier.get(hour, 1.0)
    season_factor = season_multiplier.get(month, 1.0)
    random_variation = random.uniform(0.85, 1.15)
    
    return round(base * hour_factor * season_factor * random_variation, 2)

def generate_full_year_data():
    """Generate one full year of energy data"""
    
    # Start from December 1, 2024
    start_date = datetime(2024, 12, 1, 0, 0, 1)
    end_date = datetime(2025, 11, 30, 23, 59, 59)
    
    records = []
    current_time = start_date
    
    # Track daily cumulative totals
    daily_records = []
    current_day_total = 0
    last_date = start_date.date()
    
    while current_time <= end_date:
        period_end = current_time + timedelta(minutes=30, seconds=-1)
        
        # Check if we've moved to a new day
        if current_time.date() != last_date:
            # Process previous day's records with cumulative values
            for i, rec in enumerate(daily_records):
                records.append(rec)
            
            # Reset for new day
            daily_records = []
            current_day_total = 0
            last_date = current_time.date()
        
        # Generate energy value for this 30-min period
        period_energy = generate_energy_value(current_time.hour, current_time.month)
        current_day_total += period_energy
        
        # Create record in the same format as original CSV
        record = [
            'DET',
            '',
            '1001152970CK861',
            '000',
            '',
            '212589268',
            'X',
            'UN',
            '24',
            current_time.strftime('%d/%m/%Y %H:%M:%S'),
            period_end.strftime('%d/%m/%Y %H:%M:%S'),
            'RD',
            current_day_total,  # Cumulative total for the day
            ''
        ]
        
        daily_records.append(record)
        
        # Move to next 30-minute period
        current_time += timedelta(minutes=30)
    
    # Add the last day's records
    for rec in daily_records:
        records.append(rec)
    
    return records

# Generate the data
print("Generating one year of energy data...")
records = generate_full_year_data()

# Calculate total records
total_records = len(records)
start_date_str = "01/12/2024"
end_date_str = "30/11/2025"

# Write to CSV file
output_file = 'energy_data.csv'
with open(output_file, 'w', newline='') as f:
    writer = csv.writer(f)
    
    # Write header
    header = ['HDR', 'ICPCONS', '1.1', 'PSNZ', 'PSNZ', 'CUST', '24/11/2025', '', 
              str(total_records), start_date_str, end_date_str]
    writer.writerow(header)
    
    # Write all records
    writer.writerows(records)

print(f"Generated {total_records} records")
print(f"Date range: {start_date_str} to {end_date_str}")
print(f"Saved to {output_file}")
