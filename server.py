from flask import Flask, jsonify, request
import csv
from datetime import datetime
from collections import defaultdict
import os

app = Flask(__name__)

# Store energy data in memory
energy_data = []

def parse_datetime(datetime_str):
    """Parse date/time in DD/MM/YYYY HH:MM:SS format"""
    try:
        return datetime.strptime(datetime_str, "%d/%m/%Y %H:%M:%S")
    except:
        return None

def load_energy_data():
    """Load CSV data on startup"""
    global energy_data
    data = []
    
    csv_path = os.path.join(os.path.dirname(__file__), 'energy_data.csv')
    
    with open(csv_path, 'r', encoding='utf-8') as file:
        csv_reader = csv.reader(file)
        for row in csv_reader:
            # Only process DET rows (detail rows with energy data)
            if row and row[0] == 'DET':
                try:
                    start_time = parse_datetime(row[9])
                    end_time = parse_datetime(row[10])
                    kwh = float(row[12])
                    
                    if start_time and end_time and kwh is not None:
                        data.append({
                            'startTime': start_time,
                            'endTime': end_time,
                            'kwh': kwh
                        })
                except (ValueError, IndexError):
                    continue
    
    energy_data = data
    print(f"Loaded {len(energy_data)} energy records")

def find_kwh_for_time(requested_time):
    """Find kWh for a given timestamp"""
    requested_date = datetime.fromisoformat(requested_time.replace('Z', '+00:00'))
    
    for item in energy_data:
        if item['startTime'] <= requested_date <= item['endTime']:
            return item['kwh']
    
    return None

def calculate_forecast(requested_time):
    """Calculate forecast based on day of week and hour averages"""
    requested_date = datetime.fromisoformat(requested_time.replace('Z', '+00:00'))
    day_of_week = requested_date.weekday()  # 0 = Monday, 6 = Sunday
    hour = requested_date.hour
    minute = requested_date.minute
    
    # Find all records that match the same day of week and same 30-minute time slot
    matching_records = []
    for item in energy_data:
        item_day_of_week = item['startTime'].weekday()
        item_hour = item['startTime'].hour
        item_minute = item['startTime'].minute
        
        if (item_day_of_week == day_of_week and 
            item_hour == hour and 
            item_minute == minute):
            matching_records.append(item)
    
    if not matching_records:
        return None
    
    # Calculate average kWh
    total_kwh = sum(item['kwh'] for item in matching_records)
    average_kwh = total_kwh / len(matching_records)
    
    # Calculate min and max for context
    kwh_values = [item['kwh'] for item in matching_records]
    min_kwh = min(kwh_values)
    max_kwh = max(kwh_values)
    
    day_names = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    
    return {
        'averageKwh': round(average_kwh, 4),
        'minKwh': round(min_kwh, 4),
        'maxKwh': round(max_kwh, 4),
        'sampleCount': len(matching_records),
        'dayOfWeek': day_names[day_of_week],
        'hour': hour,
        'minute': minute
    }

@app.route('/api/kwh', methods=['GET'])
def get_kwh():
    """API endpoint to get kWh for a specific time"""
    time = request.args.get('time')
    
    if not time:
        return jsonify({
            'error': 'Missing time parameter',
            'usage': '/api/kwh?time=2025-10-01T08:00:00'
        }), 400
    
    try:
        kwh = find_kwh_for_time(time)
        
        if kwh is None:
            return jsonify({
                'error': 'No energy data found for the requested time',
                'requestedTime': time
            }), 404
        
        return jsonify({
            'requestedTime': time,
            'kwh': kwh
        })
    except Exception as e:
        return jsonify({
            'error': 'Invalid request',
            'message': str(e)
        }), 400

@app.route('/api/kwh/date/<date>', methods=['GET'])
def get_kwh_date(date):
    """API endpoint to get all data for a specific date"""
    try:
        requested_date = datetime.fromisoformat(date)
        day_start = requested_date.replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = day_start.replace(hour=23, minute=59, second=59)
        
        day_data = [
            item for item in energy_data
            if day_start <= item['startTime'] <= day_end
        ]
        
        if not day_data:
            return jsonify({
                'error': 'No energy data found for the requested date',
                'requestedDate': date
            }), 404
        
        total_kwh = sum(item['kwh'] for item in day_data)
        
        return jsonify({
            'date': date,
            'records': len(day_data),
            'totalKwh': f"{total_kwh:.2f}",
            'data': [
                {
                    'startTime': item['startTime'].isoformat(),
                    'endTime': item['endTime'].isoformat(),
                    'kwh': item['kwh']
                }
                for item in day_data
            ]
        })
    except Exception as e:
        return jsonify({
            'error': 'Invalid date format',
            'message': str(e)
        }), 400

@app.route('/api/kwh/forecast', methods=['GET'])
def get_forecast():
    """API endpoint to get forecast for a specific time"""
    time = request.args.get('time')
    
    if not time:
        return jsonify({
            'error': 'Missing time parameter',
            'usage': '/api/kwh/forecast?time=2025-11-30T08:00:00'
        }), 400
    
    try:
        forecast = calculate_forecast(time)
        
        if forecast is None:
            return jsonify({
                'error': 'No historical data available to generate forecast',
                'requestedTime': time
            }), 404
        
        return jsonify({
            'time': time,
            'kwh': forecast['averageKwh'],
            'unit': 'kWh'
        })
    except Exception as e:
        return jsonify({
            'error': 'Invalid request',
            'message': str(e)
        }), 400

@app.route('/api/kwh/forecast/date/<date>', methods=['GET'])
def get_forecast_date(date):
    """API endpoint to get forecast for a full day"""
    try:
        requested_date = datetime.fromisoformat(date)
        day_start = requested_date.replace(hour=0, minute=0, second=0, microsecond=0)
        
        # Generate forecasts for every 30-minute interval in the day
        forecasts = []
        total_forecast_kwh = 0
        
        for hour in range(24):
            for minute in [0, 30]:
                time_slot = day_start.replace(hour=hour, minute=minute)
                forecast = calculate_forecast(time_slot.isoformat())
                
                if forecast:
                    forecasts.append({
                        'time': time_slot.isoformat(),
                        'averageKwh': forecast['averageKwh'],
                        'minKwh': forecast['minKwh'],
                        'maxKwh': forecast['maxKwh'],
                        'sampleCount': forecast['sampleCount']
                    })
                    total_forecast_kwh += forecast['averageKwh']
        
        if not forecasts:
            return jsonify({
                'error': 'No historical data available to generate forecast',
                'requestedDate': date
            }), 404
        
        day_names = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        day_of_week = requested_date.weekday()
        
        return jsonify({
            'date': date,
            'dayOfWeek': day_names[day_of_week],
            'forecastedTotalKwh': f"{total_forecast_kwh:.2f}",
            'intervals': len(forecasts),
            'forecasts': forecasts
        })
    except Exception as e:
        return jsonify({
            'error': 'Invalid date format',
            'message': str(e)
        }), 400

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'OK',
        'recordsLoaded': len(energy_data)
    })

if __name__ == '__main__':
    load_energy_data()
    print('Energy API server running on http://localhost:3000')
    print('Try: http://localhost:3000/api/kwh?time=2025-10-01T08:00:00')
    print('Or: http://localhost:3000/api/kwh/date/2025-10-01')
    print('Forecast: http://localhost:3000/api/kwh/forecast?time=2025-11-30T08:00:00')
    print('Day Forecast: http://localhost:3000/api/kwh/forecast/date/2025-11-30')
    app.run(host='0.0.0.0', port=3000, debug=False)
