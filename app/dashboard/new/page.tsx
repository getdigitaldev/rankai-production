import { prisma } from "@/lib/prisma";
import NewListingForm from "./NewListingForm";

export const dynamic = "force-dynamic";

export default async function NewListingPage({
  searchParams,
}: {
  searchParams: Promise<{ targetId?: string; cancelled?: string }>;
}) {
  const { targetId, cancelled } = await searchParams;
  const categories = await prisma.category.findMany({ orderBy: { order: "asc" } });

  let target = null;
  if (targetId) {
    const t = await prisma.listing.findUnique({
      where: { id: targetId },
      include: { category: true },
    });
    if (t && t.status === "ACTIVE") {
      target = { id: t.id, name: t.name, bidAmountCents: t.bidAmountCents, categoryId: t.categoryId, categoryLabel: t.category.label };
    }
  }

  return (
    <div className="form-page" style={{ minHeight: "auto", padding: 0 }}>
      <NewListingForm
        categories={categories.map((c) => ({ id: c.id, label: c.label }))}
        target={target}
        cancelled={!!cancelled}
      />
    </div>
  );
}
