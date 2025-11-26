# Energy Data API

A simple Express.js API to query energy consumption data from CSV files.

## Installation

```bash
npm install
```

## Start the Server

```bash
npm start
```

The server will start on `http://localhost:3000`

## API Endpoints

### 1. Get kWh for a specific time

```
GET /api/kwh?time=<ISO-8601-timestamp>
```

**Example:**

```
http://localhost:3000/api/kwh?time=2025-10-01T08:00:00
```

**Response:**

```json
{
  "requestedTime": "2025-10-01T08:00:00",
  "kwh": 0.19
}
```

### 2. Get all energy data for a specific date

```
GET /api/kwh/date/:date
```

**Example:**

```
http://localhost:3000/api/kwh/date/2025-10-01
```

**Response:**

```json
{
  "date": "2025-10-01",
  "records": 48,
  "totalKwh": "25.73",
  "data": [
    {
      "startTime": "2025-10-01T00:00:01.000Z",
      "endTime": "2025-10-01T00:30:00.000Z",
      "kwh": 0.15
    },
    ...
  ]
}
```

### 3. Get kWh forecast for a specific time

```
GET /api/kwh/forecast?time=<ISO-8601-timestamp>
```

Predicts kWh consumption based on historical averages for the same day of week and time slot.

**Example:**

```
http://localhost:3000/api/kwh/forecast?time=2025-11-30T08:00:00
```

**Response:**

```json
{
  "requestedTime": "2025-11-30T08:00:00",
  "forecast": {
    "averageKwh": 0.4235,
    "minKwh": 0.19,
    "maxKwh": 0.82,
    "sampleCount": 4,
    "dayOfWeek": "Saturday",
    "hour": 8,
    "minute": 0
  },
  "note": "Forecast based on average of 4 historical records for Saturdays at 08:00"
}
```

### 4. Get forecast for entire day

```
GET /api/kwh/forecast/date/:date
```

Returns forecasted kWh for all 30-minute intervals throughout the day based on historical day-of-week averages.

**Example:**

```
http://localhost:3000/api/kwh/forecast/date/2025-11-30
```

**Response:**

```json
{
  "date": "2025-11-30",
  "dayOfWeek": "Saturday",
  "forecastedTotalKwh": "24.35",
  "intervals": 48,
  "forecasts": [
    {
      "time": "2025-11-30T00:00:00.000Z",
      "averageKwh": 0.4235,
      "minKwh": 0.19,
      "maxKwh": 0.82,
      "sampleCount": 4
    },
    ...
  ]
}
```

### 5. Health Check

```
GET /health
```

**Response:**

```json
{
  "status": "OK",
  "recordsLoaded": 2596
}
```

## How It Works

### Historical Data Query

1. The server loads `energy_data.csv` on startup
2. It parses the CSV and stores energy records in memory
3. Each record contains a start time, end time, and kWh value
4. When you query for a specific time, it finds the record where your requested time falls between the start and end times
5. The kWh value for that period is returned

### Forecasting Algorithm

The forecast endpoints use a day-of-week and time-based averaging algorithm:

1. For a requested future time, it identifies the day of week (Monday-Sunday) and the specific time slot
2. It searches all historical data for matching day of week and time combinations

## Example Usage

````bash
# Get energy consumption at 8:00 AM on October 1st
curl "http://localhost:3000/api/kwh?time=2025-10-01T08:00:00"

# Get all data for October 1st
curl "http://localhost:3000/api/kwh/date/2025-10-01"

# Get forecast for a future Saturday at 8:00 AM
curl "http://localhost:3000/api/kwh/forecast?time=2025-11-30T08:00:00"

# Get forecast for entire day
curl "http://localhost:3000/api/kwh/forecast/date/2025-11-30"

# Check server health
curl "http://localhost:3000/health"
```nergy consumption in kWh

## Example Usage

```bash
# Get energy consumption at 8:00 AM on October 1st
curl "http://localhost:3000/api/kwh?time=2025-10-01T08:00:00"

# Get all data for October 1st
curl "http://localhost:3000/api/kwh/date/2025-10-01"

# Check server health
curl "http://localhost:3000/health"
````
