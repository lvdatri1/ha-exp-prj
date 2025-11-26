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

@app.route('/api/kwh/forecast/details', methods=['GET'])
def get_forecast_details():
    """API endpoint to get detailed forecast for a specific time"""
    time = request.args.get('time')
    
    if not time:
        return jsonify({
            'error': 'Missing time parameter'
        }), 400
    
    try:
        forecast = calculate_forecast(time)
        
        if forecast is None:
            return jsonify({
                'error': 'No historical data available to generate forecast',
                'requestedTime': time
            }), 404
        
        return jsonify(forecast)
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

@app.route('/')
def index():
    """Serve the data viewer UI"""
    return '''
<!DOCTYPE html>
<html>
<head>
    <title>Energy Data Viewer</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        .container {
            max-width: 1400px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        .header h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
        }
        .tabs {
            display: flex;
            justify-content: center;
            gap: 20px;
            margin-top: 20px;
        }
        .tab {
            padding: 10px 30px;
            background: rgba(255,255,255,0.2);
            border: none;
            color: white;
            cursor: pointer;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            transition: background 0.3s;
        }
        .tab:hover, .tab.active {
            background: rgba(255,255,255,0.3);
        }
        .stats {
            display: flex;
            justify-content: center;
            gap: 40px;
            margin-top: 20px;
        }
        .stat-item {
            text-align: center;
        }
        .stat-value {
            font-size: 2em;
            font-weight: bold;
        }
        .stat-label {
            font-size: 0.9em;
            opacity: 0.9;
            margin-top: 5px;
        }
        .tab-content {
            display: none;
        }
        .tab-content.active {
            display: block;
        }
        .controls {
            padding: 20px 30px;
            background: #f8f9fa;
            border-bottom: 1px solid #dee2e6;
            display: flex;
            gap: 15px;
            flex-wrap: wrap;
            align-items: center;
        }
        .control-group {
            display: flex;
            gap: 10px;
            align-items: center;
        }
        label {
            font-weight: 600;
            color: #495057;
        }
        input, select, button {
            padding: 10px 15px;
            border: 1px solid #ced4da;
            border-radius: 6px;
            font-size: 14px;
        }
        button {
            background: #667eea;
            color: white;
            border: none;
            cursor: pointer;
            font-weight: 600;
            transition: background 0.3s;
        }
        button:hover {
            background: #5568d3;
        }
        .table-container {
            padding: 30px;
            overflow-x: auto;
        }
        table {
            width: 100%;
            border-collapse: collapse;
        }
        th {
            background: #667eea;
            color: white;
            padding: 15px;
            text-align: left;
            font-weight: 600;
            position: sticky;
            top: 0;
            z-index: 10;
        }
        td {
            padding: 12px 15px;
            border-bottom: 1px solid #dee2e6;
        }
        tr:hover {
            background: #f8f9fa;
        }
        .loading {
            text-align: center;
            padding: 40px;
            color: #6c757d;
            font-size: 1.2em;
        }
        .pagination {
            display: flex;
            justify-content: center;
            gap: 10px;
            padding: 20px;
        }
        .page-btn {
            padding: 8px 16px;
            background: white;
            border: 1px solid #667eea;
            color: #667eea;
            cursor: pointer;
            border-radius: 6px;
            transition: all 0.3s;
        }
        .page-btn:hover, .page-btn.active {
            background: #667eea;
            color: white;
        }
        .page-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        .forecast-section {
            padding: 30px;
        }
        .forecast-form {
            background: #f8f9fa;
            padding: 30px;
            border-radius: 12px;
            margin-bottom: 30px;
        }
        .form-row {
            display: flex;
            gap: 20px;
            margin-bottom: 20px;
            align-items: flex-end;
            flex-wrap: wrap;
        }
        .form-field {
            flex: 1;
            min-width: 200px;
        }
        .form-field label {
            display: block;
            margin-bottom: 8px;
        }
        .form-field input {
            width: 100%;
        }
        .forecast-result {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            border-radius: 12px;
            display: none;
        }
        .forecast-result.show {
            display: block;
        }
        .result-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-top: 20px;
        }
        .result-card {
            background: rgba(255,255,255,0.2);
            padding: 20px;
            border-radius: 8px;
            text-align: center;
        }
        .result-value {
            font-size: 2em;
            font-weight: bold;
            margin: 10px 0;
        }
        .result-label {
            font-size: 0.9em;
            opacity: 0.9;
        }
        .forecast-table {
            margin-top: 30px;
        }
        .btn-secondary {
            background: #6c757d;
        }
        .btn-secondary:hover {
            background: #5a6268;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>⚡ Energy Data Viewer</h1>
            <div class="tabs">
                <button class="tab active" onclick="switchTab('data')">📊 Historical Data</button>
                <button class="tab" onclick="switchTab('forecast')">🔮 Forecast</button>
            </div>
            <div class="stats" id="dataStats">
                <div class="stat-item">
                    <div class="stat-value" id="totalRecords">-</div>
                    <div class="stat-label">Total Records</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value" id="totalKwh">-</div>
                    <div class="stat-label">Total kWh</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value" id="avgKwh">-</div>
                    <div class="stat-label">Average kWh</div>
                </div>
            </div>
        </div>
        
        <!-- Historical Data Tab -->
        <div id="dataTab" class="tab-content active">
            <div class="controls">
                <div class="control-group">
                    <label>Rows per page:</label>
                    <select id="pageSize" onchange="changePageSize()">
                        <option value="50">50</option>
                        <option value="100" selected>100</option>
                        <option value="200">200</option>
                        <option value="500">500</option>
                    </select>
                </div>
                <div class="control-group">
                    <label>Filter by date:</label>
                    <input type="date" id="filterDate" onchange="filterData()">
                    <button onclick="clearFilter()">Clear</button>
                </div>
                <div class="control-group">
                    <button onclick="exportToCSV()">📥 Export CSV</button>
                </div>
            </div>
            
            <div class="table-container">
                <div class="loading" id="loading">Loading data...</div>
                <table id="dataTable" style="display: none;">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Start Time</th>
                            <th>End Time</th>
                            <th>kWh</th>
                            <th>Duration</th>
                        </tr>
                    </thead>
                    <tbody id="tableBody"></tbody>
                </table>
            </div>
            
            <div class="pagination" id="pagination"></div>
        </div>

    <script>
        let allData = [];
        let filteredData = [];
        let currentPage = 1;
        let pageSize = 100;
        let fullDayForecastData = [];

        function switchTab(tab) {
            // Update tab buttons
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            event.target.classList.add('active');
            
            // Update tab content
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            document.getElementById(tab + 'Tab').classList.add('active');
            
            // Show/hide stats
            if (tab === 'data') {
                document.getElementById('dataStats').style.display = 'flex';
            } else {
                document.getElementById('dataStats').style.display = 'none';
            }
        }le="margin-bottom: 20px; color: #495057;">Single Time Forecast</h2>
                    <div class="form-row">
                        <div class="form-field">
                            <label>Date</label>
                            <input type="date" id="forecastDate" required>
                        </div>
                        <div class="form-field">
                            <label>Time</label>
                            <input type="time" id="forecastTime" value="08:00" required>
                        </div>
                        <div class="form-field">
                            <button onclick="getForecast()" style="width: 100%;">🔮 Get Forecast</button>
                        </div>
                    </div>
                </div>

                <div class="forecast-result" id="forecastResult">
                    <h2>Forecast Result</h2>
                    <div class="result-grid">
                        <div class="result-card">
                            <div class="result-label">Forecasted kWh</div>
                            <div class="result-value" id="forecastKwh">-</div>
                        </div>
                        <div class="result-card">
                            <div class="result-label">Day of Week</div>
                            <div class="result-value" id="forecastDay" style="font-size: 1.5em;">-</div>
                        </div>
                        <div class="result-card">
                            <div class="result-label">Time Slot</div>
                            <div class="result-value" id="forecastTimeSlot" style="font-size: 1.5em;">-</div>
                        </div>
                        <div class="result-card">
                            <div class="result-label">Sample Count</div>
                            <div class="result-value" id="forecastSamples">-</div>
                        </div>
                    </div>
                </div>

                <div class="forecast-form" style="margin-top: 30px;">
                    <h2 style="margin-bottom: 20px; color: #495057;">Full Day Forecast</h2>
                    <div class="form-row">
                        <div class="form-field">
                            <label>Date</label>
                            <input type="date" id="forecastFullDate" required>
                        </div>
                        <div class="form-field">
                            <button onclick="getFullDayForecast()" style="width: 100%;">📅 Get Full Day</button>
                        </div>
                        <div class="form-field">
                            <button onclick="exportForecastCSV()" class="btn-secondary" style="width: 100%;">📥 Export Forecast</button>
                        </div>
                    </div>
                </div>

                <div class="forecast-table">
                    <div class="loading" id="forecastLoading" style="display: none;">Loading forecast...</div>
                    <table id="forecastDataTable" style="display: none;">
                        <thead>
                            <tr>
                                <th>Time</th>
                                <th>Forecasted kWh</th>
                                <th>Min kWh</th>
                                <th>Max kWh</th>
                                <th>Samples</th>
                            </tr>
                        </thead>
                        <tbody id="forecastTableBody"></tbody>
                    </table>
                    <div id="forecastSummary" style="padding: 20px; background: #f8f9fa; border-radius: 8px; margin-top: 20px; display: none;">
                        <h3 style="color: #495057; margin-bottom: 10px;">Daily Summary</h3>
                        <p style="color: #6c757d;"><strong>Total Forecasted kWh:</strong> <span id="forecastTotal">-</span></p>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script>
        let allData = [];
        let filteredData = [];
        let currentPage = 1;
        let pageSize = 100;
        let fullDayForecastData = [];

        function switchTab(tab) {
            // Update tab buttons
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            event.target.classList.add('active');
            
            // Update tab content
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            document.getElementById(tab + 'Tab').classList.add('active');
            
            // Show/hide stats
            if (tab === 'data') {
                document.getElementById('dataStats').style.display = 'flex';
            } else {
                document.getElementById('dataStats').style.display = 'none';
            }
        }

        async function loadData() {
            try {
                const response = await fetch('/api/data/all');
                const data = await response.json();
                allData = data.records;
                filteredData = allData;
                updateStats();
                renderTable();
                document.getElementById('loading').style.display = 'none';
                document.getElementById('dataTable').style.display = 'table';
            } catch (error) {
                document.getElementById('loading').textContent = 'Error loading data: ' + error.message;
            }
        }

        function updateStats() {
            document.getElementById('totalRecords').textContent = filteredData.length.toLocaleString();
            const totalKwh = filteredData.reduce((sum, r) => sum + r.kwh, 0);
            document.getElementById('totalKwh').textContent = totalKwh.toFixed(2);
            document.getElementById('avgKwh').textContent = (totalKwh / filteredData.length).toFixed(4);
        }

        function renderTable() {
            const start = (currentPage - 1) * pageSize;
            const end = start + pageSize;
            const pageData = filteredData.slice(start, end);
            
            const tbody = document.getElementById('tableBody');
            tbody.innerHTML = pageData.map((row, idx) => {
                const duration = calculateDuration(row.startTime, row.endTime);
                return `
                    <tr>
                        <td>${start + idx + 1}</td>
                        <td>${formatDateTime(row.startTime)}</td>
                        <td>${formatDateTime(row.endTime)}</td>
                        <td><strong>${row.kwh.toFixed(4)}</strong></td>
                        <td>${duration}</td>
                    </tr>
                `;
            }).join('');
            
            renderPagination();
        }

        function renderPagination() {
            const totalPages = Math.ceil(filteredData.length / pageSize);
            const pagination = document.getElementById('pagination');
            
            let html = '<button class="page-btn" onclick="changePage(1)" ' + (currentPage === 1 ? 'disabled' : '') + '>First</button>';
            html += '<button class="page-btn" onclick="changePage(' + (currentPage - 1) + ')" ' + (currentPage === 1 ? 'disabled' : '') + '>Previous</button>';
            
            const startPage = Math.max(1, currentPage - 2);
            const endPage = Math.min(totalPages, currentPage + 2);
            
            for (let i = startPage; i <= endPage; i++) {
                html += '<button class="page-btn ' + (i === currentPage ? 'active' : '') + '" onclick="changePage(' + i + ')">' + i + '</button>';
            }
            
            html += '<button class="page-btn" onclick="changePage(' + (currentPage + 1) + ')" ' + (currentPage === totalPages ? 'disabled' : '') + '>Next</button>';
            html += '<button class="page-btn" onclick="changePage(' + totalPages + ')" ' + (currentPage === totalPages ? 'disabled' : '') + '>Last</button>';
            
            pagination.innerHTML = html;
        }

        function changePage(page) {
            currentPage = page;
            renderTable();
        }

        function changePageSize() {
            pageSize = parseInt(document.getElementById('pageSize').value);
            currentPage = 1;
            renderTable();
        }

        function filterData() {
            const filterDate = document.getElementById('filterDate').value;
            if (filterDate) {
                filteredData = allData.filter(row => {
                    const startDate = row.startTime.split('T')[0];
                    return startDate === filterDate;
                });
            } else {
                filteredData = allData;
            }
            currentPage = 1;
            updateStats();
            renderTable();
        }

        function clearFilter() {
            document.getElementById('filterDate').value = '';
            filterData();
        }

        function formatDateTime(isoString) {
            const date = new Date(isoString);
            return date.toLocaleString('en-NZ', { 
                year: 'numeric', 
                month: '2-digit', 
                day: '2-digit',
                hour: '2-digit', 
                minute: '2-digit',
                hour12: false
            });
        }

        function calculateDuration(start, end) {
            const startDate = new Date(start);
            const endDate = new Date(end);
            const minutes = (endDate - startDate) / (1000 * 60);
            return minutes + ' min';
        }

        function exportToCSV() {
            let csv = 'Start Time,End Time,kWh\\n';
            filteredData.forEach(row => {
                csv += `"${row.startTime}","${row.endTime}",${row.kwh}\\n`;
            });
            
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'energy_data_' + new Date().toISOString().split('T')[0] + '.csv';
            a.click();
            window.URL.revokeObjectURL(url);
        }

        async function getForecast() {
            const date = document.getElementById('forecastDate').value;
            const time = document.getElementById('forecastTime').value;
            
            if (!date || !time) {
                alert('Please select both date and time');
                return;
            }
            
            const dateTime = date + 'T' + time + ':00';
            
            try {
                const response = await fetch('/api/kwh/forecast?time=' + dateTime);
                const data = await response.json();
                
                if (response.ok) {
                    // Also get detailed info
                    const detailResponse = await fetch('/api/kwh/forecast/details?time=' + dateTime);
                    const detailData = await detailResponse.json();
                    
                    document.getElementById('forecastKwh').textContent = data.kwh.toFixed(4) + ' kWh';
                    document.getElementById('forecastDay').textContent = detailData.dayOfWeek;
                    document.getElementById('forecastTimeSlot').textContent = time;
                    document.getElementById('forecastSamples').textContent = detailData.sampleCount;
                    document.getElementById('forecastResult').classList.add('show');
                } else {
                    alert('Error: ' + data.error);
                }
            } catch (error) {
                alert('Failed to get forecast: ' + error.message);
            }
        }

        async function getFullDayForecast() {
            const date = document.getElementById('forecastFullDate').value;
            
            if (!date) {
                alert('Please select a date');
                return;
            }
            
            document.getElementById('forecastLoading').style.display = 'block';
            document.getElementById('forecastDataTable').style.display = 'none';
            document.getElementById('forecastSummary').style.display = 'none';
            
            try {
                const response = await fetch('/api/kwh/forecast/date/' + date);
                const data = await response.json();
                
                if (response.ok) {
                    fullDayForecastData = data.forecasts;
                    
                    const tbody = document.getElementById('forecastTableBody');
                    tbody.innerHTML = data.forecasts.map(f => `
                        <tr>
                            <td>${formatDateTime(f.time)}</td>
                            <td><strong>${f.averageKwh.toFixed(4)}</strong></td>
                            <td>${f.minKwh.toFixed(4)}</td>
                            <td>${f.maxKwh.toFixed(4)}</td>
                            <td>${f.sampleCount}</td>
                        </tr>
                    `).join('');
                    
                    document.getElementById('forecastTotal').textContent = data.forecastedTotalKwh + ' kWh';
                    document.getElementById('forecastLoading').style.display = 'none';
                    document.getElementById('forecastDataTable').style.display = 'table';
                    document.getElementById('forecastSummary').style.display = 'block';
                } else {
                    document.getElementById('forecastLoading').textContent = 'Error: ' + data.error;
                }
            } catch (error) {
                document.getElementById('forecastLoading').textContent = 'Failed to load forecast: ' + error.message;
            }
        }

        function exportForecastCSV() {
            if (fullDayForecastData.length === 0) {
                alert('Please generate a full day forecast first');
                return;
            }
            
            let csv = 'Time,Forecasted kWh,Min kWh,Max kWh,Samples\\n';
            fullDayForecastData.forEach(row => {
                csv += `"${row.time}",${row.averageKwh},${row.minKwh},${row.maxKwh},${row.sampleCount}\\n`;
            });
            
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'forecast_' + new Date().toISOString().split('T')[0] + '.csv';
            a.click();
            window.URL.revokeObjectURL(url);
        }

        // Load data on page load
        loadData();
    </script>
</body>
</html>
    '''

@app.route('/api/data/all', methods=['GET'])
def get_all_data():
    """API endpoint to get all energy data"""
    return jsonify({
        'records': [
            {
                'startTime': item['startTime'].isoformat(),
                'endTime': item['endTime'].isoformat(),
                'kwh': item['kwh']
            }
            for item in energy_data
        ]
    })

if __name__ == '__main__':
    load_energy_data()
    print('Energy API server running on http://localhost:3000')
    print('Web UI: http://localhost:3000')
    print('Try: http://localhost:3000/api/kwh?time=2025-10-01T08:00:00')
    print('Or: http://localhost:3000/api/kwh/date/2025-10-01')
    print('Forecast: http://localhost:3000/api/kwh/forecast?time=2025-11-30T08:00:00')
    print('Day Forecast: http://localhost:3000/api/kwh/forecast/date/2025-11-30')
    app.run(host='0.0.0.0', port=3000, debug=False)
