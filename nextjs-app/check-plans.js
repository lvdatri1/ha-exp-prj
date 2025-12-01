const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const plans = await prisma.powerPlan.findMany();
  console.log(`Found ${plans.length} power plans:`);
  plans.forEach((p) => {
    console.log(`  - [${p.id}] ${p.retailer} - ${p.name} (active: ${p.active})`);
  });
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
