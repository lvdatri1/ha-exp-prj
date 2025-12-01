// Seed default power plans into the database using Prisma.
// Run with: npm run seed:plans
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const defaults = [
  {
    retailer: "Mercury",
    name: "Mercury Anytime",
    active: true,
    isFlatRate: true,
    flatRate: 0.32,
    dailyCharge: 0.35,
    peakRate: null,
    offPeakRate: null,
    hasGas: false,
    gasIsFlatRate: true,
    gasFlatRate: null,
    gasDailyCharge: null,
    gasPeakRate: null,
    gasOffPeakRate: null,
  },
  {
    retailer: "Contact Energy",
    name: "Contact Energy Basic",
    active: true,
    isFlatRate: false,
    flatRate: null,
    peakRate: 0.38,
    offPeakRate: 0.22,
    dailyCharge: 0.3,
    hasGas: true,
    gasIsFlatRate: true,
    gasFlatRate: 0.13,
    gasDailyCharge: 0.5,
    gasPeakRate: null,
    gasOffPeakRate: null,
  },
  {
    retailer: "Genesis Energy",
    name: "Genesis Energy Classic",
    active: true,
    isFlatRate: true,
    flatRate: 0.34,
    dailyCharge: 0.36,
    peakRate: null,
    offPeakRate: null,
    hasGas: true,
    gasIsFlatRate: true,
    gasFlatRate: 0.14,
    gasDailyCharge: 0.52,
    gasPeakRate: null,
    gasOffPeakRate: null,
  },
  {
    retailer: "Electric Kiwi",
    name: "Electric Kiwi MoveMaster",
    active: true,
    isFlatRate: false,
    flatRate: null,
    peakRate: 0.37,
    offPeakRate: 0.19,
    dailyCharge: 0.28,
    hasGas: false,
    gasIsFlatRate: true,
    gasFlatRate: null,
    gasDailyCharge: null,
    gasPeakRate: null,
    gasOffPeakRate: null,
  },
];

async function main() {
  let inserted = 0;

  for (const plan of defaults) {
    const existing = await prisma.powerPlan.findFirst({
      where: {
        retailer: plan.retailer,
        name: plan.name,
      },
    });

    if (!existing) {
      await prisma.powerPlan.create({
        data: plan,
      });
      inserted++;
    }
  }

  console.log(`Seed complete. Inserted ${inserted} new plans.`);
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
