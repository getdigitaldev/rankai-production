import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function createCategory(formData: FormData) {
  "use server";
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") return;

  const label = String(formData.get("label") || "").trim();
  const slug = String(formData.get("slug") || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  if (!label || !slug) return;

  const maxOrder = await prisma.category.aggregate({ _max: { order: true } });
  await prisma.category.create({
    data: { label, slug, order: (maxOrder._max.order ?? 0) + 1 },
  });
  revalidatePath("/admin/categories");
  revalidatePath("/");
}

export default async function AdminCategoriesPage() {
  const categories = await prisma.category.findMany({
    orderBy: { order: "asc" },
    include: { _count: { select: { listings: true } } },
  });

  return (
    <div>
      <div className="dash-header">
        <h2>Categories</h2>
      </div>

      <form action={createCategory} className="field-row" style={{ marginBottom: 28, alignItems: "flex-end" }}>
        <div className="field">
          <label>Label</label>
          <input name="label" placeholder="e.g. AI Legal Tools" required />
        </div>
        <div className="field">
          <label>Slug</label>
          <input name="slug" placeholder="e.g. legal" required />
        </div>
        <button type="submit" className="btn btn-primary" style={{ marginBottom: 16 }}>
          Add category
        </button>
      </form>

      <table className="data-table">
        <thead>
          <tr>
            <th>Label</th>
            <th>Slug</th>
            <th>Order</th>
            <th>Listings</th>
          </tr>
        </thead>
        <tbody>
          {categories.map((c) => (
            <tr key={c.id}>
              <td>{c.label}</td>
              <td>{c.slug}</td>
              <td>{c.order}</td>
              <td>{c._count.listings}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
