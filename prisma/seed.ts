import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const LISTINGS = [
  { url: "https://example.com/tool-one", name: "Tool One", totalPaidCents: 1700 },
  { url: "https://example.com/tool-two", name: "Tool Two", totalPaidCents: 1200 },
  { url: "https://example.com/tool-three", name: "Tool Three", totalPaidCents: 500 },
];

async function main() {
  for (const l of LISTINGS) {
    await prisma.listing.upsert({
      where: { url: l.url },
      update: {},
      create: l,
    });
  }

  console.log(`Seeded ${LISTINGS.length} listings.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
