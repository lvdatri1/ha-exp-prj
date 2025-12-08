import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function checkUsers() {
  const users = await prisma.user.findMany();
  console.log("All users in database:");
  users.forEach((u) => {
    console.log(`- ID: ${u.id}, Username: ${u.username}, IsAdmin: ${u.isAdmin}, IsGuest: ${u.isGuest}`);
  });

  // Try to find admin
  const admin = await prisma.user.findUnique({ where: { username: "admin" } });
  if (admin) {
    console.log("\nAdmin user found:");
    console.log(admin);

    // Test password verification
    const testPassword = "admin";
    const isMatch = await bcrypt.compare(testPassword, admin.passwordHash || "");
    console.log(`\nPassword test (admin): ${isMatch}`);
  } else {
    console.log("\nNo admin user found");
  }
}

checkUsers()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
