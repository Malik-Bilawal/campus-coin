import "dotenv/config";
import { connectDB } from "../config/db.js";
import { seedSystemCategories } from "./categories.js";
import { User } from "../models/User.js";
import { env } from "../config/env.js";

async function seed() {
  await connectDB();
  await seedSystemCategories();

  const adminEmail = "admin@campuscoin.app";
  const existing = await User.findOne({ email: adminEmail });
  if (!existing) {
    await User.create({
      name: "Admin",
      email: adminEmail,
      password: await User.hashPassword("Admin@123"),
      role: "admin",
      currency: "BDT",
    });
    console.log(`✅ Admin created: ${adminEmail} / Admin@123`);
  }

  const demoEmail = "demo@campuscoin.app";
  const demoExists = await User.findOne({ email: demoEmail });
  if (!demoExists) {
    await User.create({
      name: "Demo Student",
      email: demoEmail,
      password: await User.hashPassword("Demo@123"),
      role: "student",
      academicYear: "3rd Year",
      allowanceBaseline: 15000,
      savingsGoal: 5000,
      currency: "BDT",
    });
    console.log(`✅ Demo student created: ${demoEmail} / Demo@123`);
  }

  console.log("🎉 Seed complete");
  process.exit(0);
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
