// Create admin account with username "admin" and password "admin123"
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  // Check if admin already exists
  const existingAdmin = await prisma.user.findUnique({
    where: { username: "admin" },
  });

  if (existingAdmin) {
    console.log("Admin user already exists. Updating password...");
    const passwordHash = await bcrypt.hash("admin123", 10);
    await prisma.user.update({
      where: { id: existingAdmin.id },
      data: {
        passwordHash,
        isAdmin: true,
        isGuest: false,
      },
    });
    console.log("✓ Admin password updated successfully");
    console.log("  Username: admin");
    console.log("  Password: admin123");
    return;
  }

  // Create new admin user
  const passwordHash = await bcrypt.hash("admin123", 10);
  const admin = await prisma.user.create({
    data: {
      username: "admin",
      email: "admin@example.com",
      passwordHash,
      isAdmin: true,
      isGuest: false,
    },
  });

  console.log("✓ Admin user created successfully");
  console.log("  Username: admin");
  console.log("  Password: admin123");
  console.log("  ID:", admin.id);
}

main()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
