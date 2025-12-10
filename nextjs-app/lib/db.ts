import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

// Type exports for backward compatibility
export interface User {
  id: number;
  username: string;
  email: string | null;
  password_hash?: string | null;
  is_guest: boolean;
  is_admin: boolean;
  created_at: Date;
  last_login: Date | null;
}

export interface EnergyRecord {
  id: number;
  user_id: number;
  start_time: string;
  end_time: string;
  kwh: number;
  date: string;
  hour: number;
  minute: number;
  is_daily_total: boolean;
  created_at?: Date;
}

export interface GasRecord {
  id: number;
  user_id: number;
  start_time: string;
  end_time: string;
  kwh: number;
  date: string;
  hour: number;
  minute: number;
  is_daily_total: boolean;
  created_at?: Date;
}

export interface PowerPlan {
  id: number;
  retailer: string;
  name: string;
  active: boolean;
  is_flat_rate: boolean;
  flat_rate: number | null;
  peak_rate: number | null;
  off_peak_rate: number | null;
  electricity_rates: string | null;
  electricity_schedule: string | null;
  daily_charge: number | null;
  has_gas: boolean;
  gas_is_flat_rate: boolean;
  gas_flat_rate: number | null;
  gas_rates: string | null;
  gas_schedule: string | null;
  gas_peak_rate: number | null;
  gas_off_peak_rate: number | null;
  gas_daily_charge: number | null;
  created_at: Date;
  updated_at: Date;
}

// Singleton Prisma Client instance with proper type declarations
declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

export const prisma =
  global.__prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  global.__prisma = prisma;
}

// User operations
export async function createUser(username: string, email: string | null, password: string | null, isGuest = false) {
  const passwordHash = password ? await bcrypt.hash(password, 10) : null;
  const user = await prisma.user.create({
    data: {
      username,
      email,
      passwordHash,
      isGuest: Boolean(isGuest),
    },
  });
  return mapUserToLegacyFormat(user);
}

export async function getUserById(id: number): Promise<User | null> {
  const user = await prisma.user.findUnique({ where: { id } });
  return user ? mapUserToLegacyFormat(user) : null;
}

export async function getUserByUsername(username: string): Promise<User | null> {
  const user = await prisma.user.findUnique({ where: { username } });
  return user ? mapUserToLegacyFormat(user) : null;
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const user = await prisma.user.findUnique({ where: { email } });
  return user ? mapUserToLegacyFormat(user) : null;
}

export async function verifyPassword(userId: number, password: string): Promise<boolean> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !user.passwordHash) return false;
  return await bcrypt.compare(password, user.passwordHash);
}

export async function updateLastLogin(userId: number) {
  await prisma.user.update({
    where: { id: userId },
    data: { lastLogin: new Date() },
  });
}

export async function listUsers(): Promise<User[]> {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
  });
  return users.map(mapUserToLegacyFormat);
}

export async function updateUserAdmin(userId: number, isAdmin: boolean) {
  await prisma.user.update({
    where: { id: userId },
    data: { isAdmin },
  });
}

// Energy data operations
export async function insertEnergyData(records: Omit<EnergyRecord, "id">[], userId: number) {
  await prisma.energyData.createMany({
    data: records.map((r) => ({
      userId,
      startTime: r.start_time,
      endTime: r.end_time,
      kwh: r.kwh,
      date: r.date,
      hour: r.hour,
      minute: r.minute,
      isDailyTotal: r.is_daily_total,
    })),
  });
}

export async function getAllEnergyData(userId: number): Promise<EnergyRecord[]> {
  const data = await prisma.energyData.findMany({
    where: {
      userId,
      isDailyTotal: false,
    },
    orderBy: { startTime: "asc" },
  });
  return data.map(mapEnergyToLegacyFormat);
}

export async function getDailyTotals(userId: number): Promise<Record<string, number>> {
  const rows = await prisma.energyData.findMany({
    where: {
      userId,
      hour: 23,
      minute: 30,
    },
    select: { date: true, kwh: true },
    orderBy: { date: "asc" },
  });

  const totals: Record<string, number> = {};
  rows.forEach((row) => {
    totals[row.date] = row.kwh;
  });
  return totals;
}

export async function getEnergyByDate(date: string, userId: number): Promise<EnergyRecord[]> {
  const data = await prisma.energyData.findMany({
    where: {
      userId,
      date,
      isDailyTotal: false,
    },
    orderBy: { startTime: "asc" },
  });
  return data.map(mapEnergyToLegacyFormat);
}

export async function getEnergyByTimeRange(
  startTime: string,
  endTime: string,
  userId: number
): Promise<EnergyRecord[]> {
  const data = await prisma.energyData.findMany({
    where: {
      userId,
      startTime: { gte: startTime, lte: endTime },
      isDailyTotal: false,
    },
    orderBy: { startTime: "asc" },
  });
  return data.map(mapEnergyToLegacyFormat);
}

export async function clearDatabase(userId: number) {
  await prisma.energyData.deleteMany({ where: { userId } });
}

// Gas data operations
export async function insertGasData(records: Omit<GasRecord, "id">[], userId: number) {
  await prisma.gasData.createMany({
    data: records.map((r) => ({
      userId,
      startTime: r.start_time,
      endTime: r.end_time,
      kwh: r.kwh,
      date: r.date,
      hour: r.hour,
      minute: r.minute,
      isDailyTotal: r.is_daily_total,
    })),
  });
}

export async function getAllGasData(userId: number): Promise<GasRecord[]> {
  const data = await prisma.gasData.findMany({
    where: {
      userId,
      isDailyTotal: false,
    },
    orderBy: { startTime: "asc" },
  });
  return data.map(mapGasToLegacyFormat);
}

export async function getGasDailyTotals(userId: number): Promise<Record<string, number>> {
  const rows = await prisma.gasData.findMany({
    where: {
      userId,
      hour: 23,
      minute: 30,
    },
    select: { date: true, kwh: true },
    orderBy: { date: "asc" },
  });

  const totals: Record<string, number> = {};
  rows.forEach((row) => {
    totals[row.date] = row.kwh;
  });
  return totals;
}

export async function getGasByDate(date: string, userId: number): Promise<GasRecord[]> {
  const data = await prisma.gasData.findMany({
    where: {
      userId,
      date,
      isDailyTotal: false,
    },
    orderBy: { startTime: "asc" },
  });
  return data.map(mapGasToLegacyFormat);
}

export async function getGasByTimeRange(startTime: string, endTime: string, userId: number): Promise<GasRecord[]> {
  const data = await prisma.gasData.findMany({
    where: {
      userId,
      startTime: { gte: startTime, lte: endTime },
      isDailyTotal: false,
    },
    orderBy: { startTime: "asc" },
  });
  return data.map(mapGasToLegacyFormat);
}

export async function clearGasData(userId: number) {
  await prisma.gasData.deleteMany({ where: { userId } });
}

// Power plans operations
export async function listPowerPlans(activeOnly: boolean = false): Promise<PowerPlan[]> {
  const plans = await prisma.powerPlan.findMany({
    where: activeOnly ? { active: true } : undefined,
    orderBy: [{ active: "desc" }, { retailer: "asc" }, { name: "asc" }],
  });
  return plans.map(mapPowerPlanToLegacyFormat);
}

export async function getPowerPlanById(id: number): Promise<PowerPlan | null> {
  const plan = await prisma.powerPlan.findUnique({ where: { id } });
  return plan ? mapPowerPlanToLegacyFormat(plan) : null;
}

export async function createPowerPlan(plan: any): Promise<PowerPlan> {
  const data: any = {
    retailer: plan.retailer,
    name: plan.name,
    active: plan.active ?? true,
    isFlatRate: plan.is_flat_rate ?? true,
    flatRate: plan.flat_rate ?? null,
    electricityRates: (plan as any).electricity_rates ?? null,
    electricitySchedule: (plan as any).electricity_schedule ?? null,
    peakRate: plan.peak_rate ?? null,
    offPeakRate: plan.off_peak_rate ?? null,
    dailyCharge: plan.daily_charge ?? null,
    hasGas: plan.has_gas ?? false,
    gasIsFlatRate: plan.gas_is_flat_rate ?? true,
    gasFlatRate: plan.gas_flat_rate ?? null,
    gasRates: (plan as any).gas_rates ?? null,
    gasSchedule: (plan as any).gas_schedule ?? null,
    gasPeakRate: plan.gas_peak_rate ?? null,
    gasOffPeakRate: plan.gas_off_peak_rate ?? null,
    gasDailyCharge: plan.gas_daily_charge ?? null,
  };

  const created = await prisma.powerPlan.create({ data });
  return mapPowerPlanToLegacyFormat(created);
}

export async function updatePowerPlan(
  id: number,
  fields: Partial<Omit<PowerPlan, "id" | "created_at" | "updated_at">>
): Promise<PowerPlan | null> {
  const data: any = {};

  // Map legacy field names to Prisma field names
  if ("retailer" in fields) data.retailer = fields.retailer;
  if ("name" in fields) data.name = fields.name;
  if ("active" in fields) data.active = fields.active;
  if ("is_flat_rate" in fields) data.isFlatRate = fields.is_flat_rate;
  if ("flat_rate" in fields) data.flatRate = fields.flat_rate;
  if ("electricity_rates" in fields) data.electricityRates = (fields as any).electricity_rates;
  if ("electricity_schedule" in fields) data.electricitySchedule = (fields as any).electricity_schedule;
  if ("peak_rate" in fields) data.peakRate = fields.peak_rate;
  if ("off_peak_rate" in fields) data.offPeakRate = fields.off_peak_rate;
  if ("daily_charge" in fields) data.dailyCharge = fields.daily_charge;
  if ("has_gas" in fields) data.hasGas = fields.has_gas;
  if ("gas_is_flat_rate" in fields) data.gasIsFlatRate = fields.gas_is_flat_rate;
  if ("gas_flat_rate" in fields) data.gasFlatRate = fields.gas_flat_rate;
  if ("gas_rates" in fields) data.gasRates = (fields as any).gas_rates;
  if ("gas_schedule" in fields) data.gasSchedule = (fields as any).gas_schedule;
  if ("gas_peak_rate" in fields) data.gasPeakRate = fields.gas_peak_rate;
  if ("gas_off_peak_rate" in fields) data.gasOffPeakRate = fields.gas_off_peak_rate;
  if ("gas_daily_charge" in fields) data.gasDailyCharge = fields.gas_daily_charge;

  if (Object.keys(data).length === 0) return getPowerPlanById(id);

  const updated = await prisma.powerPlan.update({
    where: { id },
    data,
  });
  return mapPowerPlanToLegacyFormat(updated);
}

export async function deletePowerPlan(id: number) {
  await prisma.powerPlan.delete({ where: { id } });
}

// Admin metrics
export async function getAdminMetrics() {
  const [users, guestUsers, adminUsers, energyRecords, gasRecords, activePlans, totalPlans, recentUsers, recentPlans] =
    await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isGuest: true } }),
      prisma.user.count({ where: { isAdmin: true } }),
      prisma.energyData.count(),
      prisma.gasData.count(),
      prisma.powerPlan.count({ where: { active: true } }),
      prisma.powerPlan.count(),
      prisma.user.findMany({
        select: { id: true, username: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      prisma.powerPlan.findMany({
        select: { id: true, retailer: true, name: true, updatedAt: true },
        orderBy: { updatedAt: "desc" },
        take: 5,
      }),
    ]);

  return {
    users,
    guestUsers,
    adminUsers,
    energyRecords,
    gasRecords,
    activePlans,
    totalPlans,
    recentUsers: recentUsers.map((u) => ({
      id: u.id,
      username: u.username,
      created_at: u.createdAt.toISOString(),
    })),
    recentPlans: recentPlans.map((p) => ({
      id: p.id,
      retailer: p.retailer,
      name: p.name,
      updated_at: p.updatedAt.toISOString(),
    })),
  };
}

// Helper functions to map Prisma models to legacy format
function mapUserToLegacyFormat(user: any): User {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    password_hash: user.passwordHash,
    is_guest: user.isGuest,
    is_admin: user.isAdmin,
    created_at: user.createdAt,
    last_login: user.lastLogin,
  };
}

function mapEnergyToLegacyFormat(data: any): EnergyRecord {
  return {
    id: data.id,
    user_id: data.userId,
    start_time: data.startTime,
    end_time: data.endTime,
    kwh: data.kwh,
    date: data.date,
    hour: data.hour,
    minute: data.minute,
    is_daily_total: data.isDailyTotal,
    created_at: data.createdAt,
  };
}

function mapGasToLegacyFormat(data: any): GasRecord {
  return {
    id: data.id,
    user_id: data.userId,
    start_time: data.startTime,
    end_time: data.endTime,
    kwh: data.kwh,
    date: data.date,
    hour: data.hour,
    minute: data.minute,
    is_daily_total: data.isDailyTotal,
    created_at: data.createdAt,
  };
}

function mapPowerPlanToLegacyFormat(plan: any): PowerPlan {
  return {
    id: plan.id,
    retailer: plan.retailer,
    name: plan.name,
    active: plan.active,
    is_flat_rate: plan.isFlatRate,
    flat_rate: plan.flatRate,
    electricity_rates: plan.electricityRates ?? null,
    electricity_schedule: plan.electricitySchedule ?? null,
    peak_rate: plan.peakRate,
    off_peak_rate: plan.offPeakRate,
    daily_charge: plan.dailyCharge,
    has_gas: plan.hasGas,
    gas_is_flat_rate: plan.gasIsFlatRate,
    gas_flat_rate: plan.gasFlatRate,
    gas_rates: plan.gasRates ?? null,
    gas_schedule: plan.gasSchedule ?? null,
    gas_peak_rate: plan.gasPeakRate,
    gas_off_peak_rate: plan.gasOffPeakRate,
    gas_daily_charge: plan.gasDailyCharge,
    created_at: plan.createdAt,
    updated_at: plan.updatedAt,
  };
}
