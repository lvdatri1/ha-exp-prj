import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Check if test admin already exists
  const existingAdmin = await prisma.user.findUnique({
    where: { username: "admin" },
  });

  if (!existingAdmin) {
    // Create test admin user
    const hashedPassword = await bcrypt.hash("admin", 10);

    const testAdmin = await prisma.user.create({
      data: {
        username: "admin",
        email: "admin@test.local",
        passwordHash: hashedPassword,
        isAdmin: true,
        isGuest: false,
      },
    });

    console.log("Test admin user created:");
    console.log(`  Username: admin`);
    console.log(`  Password: admin`);
    console.log(`  ID: ${testAdmin.id}`);
  } else {
    console.log("Admin user already exists");
  }

  // Also create some sample power plans if none exist
  const existingPlans = await prisma.powerPlan.count();

  if (existingPlans === 0) {
    const samplePlans = await prisma.powerPlan.createMany({
      data: [
        {
          retailer: "Energy Provider A",
          name: "Basic Plan",
          active: true,
          isFlatRate: true,
          flatRate: 0.15,
          peakRate: null,
          offPeakRate: null,
          dailyCharge: 1.0,
          hasGas: false,
          gasIsFlatRate: false,
          gasFlatRate: null,
          gasPeakRate: null,
          gasOffPeakRate: null,
          gasDailyCharge: null,
        },
        {
          retailer: "Energy Provider B",
          name: "Time of Use",
          active: true,
          isFlatRate: false,
          flatRate: null,
          peakRate: 0.22,
          offPeakRate: 0.12,
          dailyCharge: 0.5,
          hasGas: true,
          gasIsFlatRate: true,
          gasFlatRate: 0.05,
          gasPeakRate: null,
          gasOffPeakRate: null,
          gasDailyCharge: 0.3,
        },
      ],
    });

    console.log(`Sample power plans created: ${samplePlans.count}`);
  } else {
    console.log(`${existingPlans} power plans already exist`);
  }
}

main()
  .then(async () => {
    console.log("\nSeed completed successfully");
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("Seed failed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
