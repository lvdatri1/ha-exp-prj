/**
 * @openapi
 * components:
 *   securitySchemes:
 *     cookieAuth:
 *       type: apiKey
 *       in: cookie
 *       name: session_user_id
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         username:
 *           type: string
 *         email:
 *           type: string
 *           nullable: true
 *         isGuest:
 *           type: boolean
 *         isAdmin:
 *           type: boolean
 *     EnergyDataPoint:
 *       type: object
 *       properties:
 *         startTime:
 *           type: string
 *           format: date-time
 *         endTime:
 *           type: string
 *           format: date-time
 *         kwh:
 *           type: number
 *           format: float
 *         date:
 *           type: string
 *           format: date
 *         hour:
 *           type: integer
 *         minute:
 *           type: integer
 *     PowerPlan:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         retailer:
 *           type: string
 *         name:
 *           type: string
 *         active:
 *           type: integer
 *         is_flat_rate:
 *           type: integer
 *         flat_rate:
 *           type: number
 *           nullable: true
 *         peak_rate:
 *           type: number
 *           nullable: true
 *         off_peak_rate:
 *           type: number
 *           nullable: true
 *         daily_charge:
 *           type: number
 *           nullable: true
 *         has_gas:
 *           type: integer
 *         gas_is_flat_rate:
 *           type: integer
 *         gas_flat_rate:
 *           type: number
 *           nullable: true
 *         gas_peak_rate:
 *           type: number
 *           nullable: true
 *         gas_off_peak_rate:
 *           type: number
 *           nullable: true
 *         gas_daily_charge:
 *           type: number
 *           nullable: true
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 *     Error:
 *       type: object
 *       properties:
 *         error:
 *           type: string
 */

export const swaggerDefinition = {
  openapi: "3.0.0",
  info: {
    title: "Home Energy Dashboard API",
    version: "1.0.0",
    description: "API for managing home energy consumption data, user authentication, and power plans",
    contact: {
      name: "API Support",
    },
  },
  servers: [
    {
      url: "http://localhost:3000",
      description: "Development server",
    },
  ],
  tags: [
    { name: "Authentication", description: "User authentication and session management" },
    { name: "Energy Data", description: "Electricity consumption data endpoints" },
    { name: "Gas Data", description: "Gas consumption data endpoints" },
    { name: "Power Plans", description: "Electricity and gas tariff management" },
    { name: "Admin", description: "Administrative endpoints (requires admin privileges)" },
    { name: "Forecast", description: "Energy consumption forecasting" },
    { name: "Import", description: "Data import from CSV files" },
  ],
};

/**
 * @openapi
 * /api/auth/signup:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Register a new user account
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 minLength: 3
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 6
 *     responses:
 *       200:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Username or email already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Login with username and password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @openapi
 * /api/auth/guest:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Create a guest account
 *     responses:
 *       200:
 *         description: Guest account created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 user:
 *                   $ref: '#/components/schemas/User'
 */

/**
 * @openapi
 * /api/auth/logout:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Logout current user
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 */

/**
 * @openapi
 * /api/auth/session:
 *   get:
 *     tags:
 *       - Authentication
 *     summary: Get current session information
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Session information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Not authenticated
 */

/**
 * @openapi
 * /api/data/all:
 *   get:
 *     tags:
 *       - Energy Data
 *     summary: Get all electricity data for current user
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Energy data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/EnergyDataPoint'
 *                 count:
 *                   type: integer
 *       401:
 *         description: Not authenticated
 */

/**
 * @openapi
 * /api/data/daily-totals:
 *   get:
 *     tags:
 *       - Energy Data
 *     summary: Get daily electricity totals for current user
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Daily totals retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 dailyTotals:
 *                   type: object
 *                   additionalProperties:
 *                     type: number
 *                 count:
 *                   type: integer
 *       401:
 *         description: Not authenticated
 */

/**
 * @openapi
 * /api/gas/all:
 *   get:
 *     tags:
 *       - Gas Data
 *     summary: Get all gas consumption data for current user
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Gas data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/EnergyDataPoint'
 *       401:
 *         description: Not authenticated
 */

/**
 * @openapi
 * /api/gas/daily-totals:
 *   get:
 *     tags:
 *       - Gas Data
 *     summary: Get daily gas consumption totals for current user
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Daily gas totals retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 dailyTotals:
 *                   type: object
 *                   additionalProperties:
 *                     type: number
 *                 count:
 *                   type: integer
 *       401:
 *         description: Not authenticated
 */

/**
 * @openapi
 * /api/gas/by-date:
 *   get:
 *     tags:
 *       - Gas Data
 *     summary: Get gas consumption data for a specific date
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Gas data for specified date
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/EnergyDataPoint'
 *       401:
 *         description: Not authenticated
 */

/**
 * @openapi
 * /api/kwh:
 *   get:
 *     tags:
 *       - Energy Data
 *     summary: Get electricity consumption for specific time range
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: start
 *         required: true
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: end
 *         required: true
 *         schema:
 *           type: string
 *           format: date-time
 *     responses:
 *       200:
 *         description: Energy data for time range
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/EnergyDataPoint'
 *       400:
 *         description: Missing or invalid parameters
 *       401:
 *         description: Not authenticated
 */

/**
 * @openapi
 * /api/kwh/forecast:
 *   get:
 *     tags:
 *       - Forecast
 *     summary: Get electricity consumption forecast for next 30 minutes
 *     description: Predicts consumption based on historical data for same day of week and hour
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Forecast generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 forecast:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       time:
 *                         type: string
 *                         format: date-time
 *                       kwh:
 *                         type: number
 *                 baseTime:
 *                   type: string
 *                   format: date-time
 *                 sampleCount:
 *                   type: integer
 *       401:
 *         description: Not authenticated
 */

/**
 * @openapi
 * /api/kwh/forecast/date/{date}:
 *   get:
 *     tags:
 *       - Forecast
 *     summary: Get historical forecast data for a specific date
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Historical forecast data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 date:
 *                   type: string
 *                   format: date
 *                 forecast:
 *                   type: array
 *       401:
 *         description: Not authenticated
 */

/**
 * @openapi
 * /api/power-plans:
 *   get:
 *     tags:
 *       - Power Plans
 *     summary: List all power plans
 *     parameters:
 *       - in: query
 *         name: active
 *         schema:
 *           type: string
 *           enum: ['0', '1', 'true', 'false']
 *         description: Filter by active status
 *     responses:
 *       200:
 *         description: List of power plans
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 plans:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/PowerPlan'
 *   post:
 *     tags:
 *       - Power Plans
 *     summary: Create a new power plan (admin only)
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - retailer
 *               - name
 *             properties:
 *               retailer:
 *                 type: string
 *               name:
 *                 type: string
 *               active:
 *                 type: integer
 *                 default: 1
 *               is_flat_rate:
 *                 type: integer
 *                 default: 1
 *               flat_rate:
 *                 type: number
 *                 nullable: true
 *               peak_rate:
 *                 type: number
 *                 nullable: true
 *               off_peak_rate:
 *                 type: number
 *                 nullable: true
 *               daily_charge:
 *                 type: number
 *                 nullable: true
 *               has_gas:
 *                 type: integer
 *                 default: 0
 *               gas_is_flat_rate:
 *                 type: integer
 *                 default: 1
 *               gas_flat_rate:
 *                 type: number
 *                 nullable: true
 *               gas_peak_rate:
 *                 type: number
 *                 nullable: true
 *               gas_off_peak_rate:
 *                 type: number
 *                 nullable: true
 *               gas_daily_charge:
 *                 type: number
 *                 nullable: true
 *     responses:
 *       201:
 *         description: Power plan created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 plan:
 *                   $ref: '#/components/schemas/PowerPlan'
 *       403:
 *         description: Forbidden - admin only
 */

/**
 * @openapi
 * /api/power-plans/{id}:
 *   get:
 *     tags:
 *       - Power Plans
 *     summary: Get a specific power plan by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Power plan details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 plan:
 *                   $ref: '#/components/schemas/PowerPlan'
 *       404:
 *         description: Power plan not found
 *   put:
 *     tags:
 *       - Power Plans
 *     summary: Update a power plan (admin only)
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               retailer:
 *                 type: string
 *               name:
 *                 type: string
 *               active:
 *                 type: integer
 *               is_flat_rate:
 *                 type: integer
 *               flat_rate:
 *                 type: number
 *               peak_rate:
 *                 type: number
 *               off_peak_rate:
 *                 type: number
 *               daily_charge:
 *                 type: number
 *     responses:
 *       200:
 *         description: Power plan updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 plan:
 *                   $ref: '#/components/schemas/PowerPlan'
 *       403:
 *         description: Forbidden - admin only
 *       404:
 *         description: Power plan not found
 *   delete:
 *     tags:
 *       - Power Plans
 *     summary: Delete a power plan (admin only)
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Power plan deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *       403:
 *         description: Forbidden - admin only
 */

/**
 * @openapi
 * /api/admin/users:
 *   get:
 *     tags:
 *       - Admin
 *     summary: List all users (admin only)
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: List of users
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 users:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *       403:
 *         description: Forbidden - admin only
 */

/**
 * @openapi
 * /api/admin/users/{id}:
 *   put:
 *     tags:
 *       - Admin
 *     summary: Update user admin status (admin only)
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               is_admin:
 *                 type: integer
 *                 enum: [0, 1]
 *     responses:
 *       200:
 *         description: User updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       403:
 *         description: Forbidden - admin only
 *       404:
 *         description: User not found
 */

/**
 * @openapi
 * /api/admin/metrics:
 *   get:
 *     tags:
 *       - Admin
 *     summary: Get system metrics (admin only)
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: System metrics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 metrics:
 *                   type: object
 *                   properties:
 *                     totalUsers:
 *                       type: integer
 *                     activeUsers:
 *                       type: integer
 *                     guestUsers:
 *                       type: integer
 *                     totalEnergyRecords:
 *                       type: integer
 *                     totalGasRecords:
 *                       type: integer
 *                     totalPowerPlans:
 *                       type: integer
 *                     activePowerPlans:
 *                       type: integer
 *       403:
 *         description: Forbidden - admin only
 */

/**
 * @openapi
 * /api/admin/bootstrap:
 *   post:
 *     tags:
 *       - Admin
 *     summary: Bootstrap first admin user
 *     description: Makes the current user an admin if no admin exists
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: User promoted to admin
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Not authenticated
 *       409:
 *         description: Admin already exists
 */

/**
 * @openapi
 * /api/generate-persona:
 *   post:
 *     tags:
 *       - Import
 *     summary: Generate sample energy data based on persona
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - personaKey
 *             properties:
 *               personaKey:
 *                 type: string
 *                 enum: ['lowUsage', 'mediumUsage', 'highUsage', 'erratic', 'nightOwl', 'dayTime']
 *               startDate:
 *                 type: string
 *                 format: date
 *               endDate:
 *                 type: string
 *                 format: date
 *               clearExisting:
 *                 type: boolean
 *               hasGas:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Persona data generated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 electricRecords:
 *                   type: integer
 *                 gasRecords:
 *                   type: integer
 *       400:
 *         description: Invalid persona
 *       401:
 *         description: Not authenticated
 */

/**
 * @openapi
 * /api/import:
 *   post:
 *     tags:
 *       - Import
 *     summary: Import energy data from CSV file
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               type:
 *                 type: string
 *                 enum: ['electric', 'gas']
 *               clearExisting:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Data imported successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 recordsImported:
 *                   type: integer
 *       400:
 *         description: Invalid file or parameters
 *       401:
 *         description: Not authenticated
 */
