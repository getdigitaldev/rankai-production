import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const CATEGORIES = [
  { slug: "writing", label: "AI Writing", order: 1 },
  { slug: "coding", label: "AI Coding Agents", order: 2 },
  { slug: "marketing", label: "AI Marketing", order: 3 },
  { slug: "voice", label: "AI Voice & Video", order: 4 },
  { slug: "sales", label: "AI Sales & CRM", order: 5 },
  { slug: "ops", label: "AI Ops & Infra", order: 6 },
];

async function main() {
  for (const c of CATEGORIES) {
    await prisma.category.upsert({
      where: { slug: c.slug },
      update: { label: c.label, order: c.order },
      create: c,
    });
  }

  const adminEmail = process.env.SEED_ADMIN_EMAIL || "admin@rankai.local";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || "ChangeMe123!";
  const passwordHash = await bcrypt.hash(adminPassword, 10);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { role: "ADMIN" },
    create: {
      email: adminEmail,
      passwordHash,
      name: "Admin",
      role: "ADMIN",
    },
  });

  console.log(`Seeded categories and admin user: ${adminEmail} / ${adminPassword}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
