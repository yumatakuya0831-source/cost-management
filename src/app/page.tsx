import { redirect } from "next/navigation";

import { DashboardView, type DashboardData, type DashboardMonthPoint } from "@/features/dashboard/dashboard-view";
import { getCurrentAppUser } from "@/lib/auth/user";
import { createClient } from "@/lib/supabase/server";

function tokyoCurrentMonth() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tokyo", year: "numeric", month: "2-digit" }).format(new Date()).slice(0, 7);
}

function validMonth(value: string | undefined) {
  return value && /^\d{4}-(0[1-9]|1[0-2])$/.test(value) ? value : tokyoCurrentMonth();
}

function monthSequence(targetMonth: string, count: number) {
  const [year, month] = targetMonth.split("-").map(Number);
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(Date.UTC(year, month - count + index, 1));
    return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
  });
}

const emptyDashboard = (targetMonth: string): DashboardData => ({ targetMonth: `${targetMonth}-01`, totalRevenue: 0, totalCost: 0, costRate: null, quantitySold: 0, products: [] });

export default async function Home({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const user = await getCurrentAppUser();
  if (!user) redirect("/login");
  const targetMonth = validMonth((await searchParams).month);
  const months = monthSequence(targetMonth, 7);
  const supabase = await createClient();
  const [dashboardResults, categoryResult] = await Promise.all([
    Promise.all(months.map((month) => supabase.rpc("get_monthly_dashboard", { requested_month: `${month}-01` }))),
    supabase.from("categories").select("id,name").order("sort_order"),
  ]);
  const dashboards = dashboardResults.map((result, index) => (result.data as DashboardData | null) ?? emptyDashboard(months[index]));
  const current = dashboards.at(-1) ?? emptyDashboard(targetMonth);
  const previous = dashboards.at(-2) ?? null;
  const history: DashboardMonthPoint[] = dashboards.slice(-6).map((data, index) => ({ month: `${Number(months[index + 1].slice(5))}月`, cost: data.costRate == null ? null : Number(data.costRate) * 100 }));
  const categoryNames = Object.fromEntries(((categoryResult.data ?? []) as { id: string; name: string }[]).map((category) => [category.id, category.name]));
  const categoryTotals = new Map<string, number>();
  current.products.forEach((product) => {
    const categoryName = categoryNames[product.categoryId] ?? "未分類";
    categoryTotals.set(categoryName, (categoryTotals.get(categoryName) ?? 0) + Number(product.monthlyRevenue));
  });
  const categorySales = [...categoryTotals].map(([name, revenue]) => ({ name, revenue, value: Number(current.totalRevenue) > 0 ? revenue / Number(current.totalRevenue) * 100 : 0 }));
  const hasError = Boolean(categoryResult.error || dashboardResults.some((result) => result.error));

  return <DashboardView data={current} previous={previous} history={history} categorySales={categorySales} targetMonth={targetMonth} isAdmin={user.role === "admin"} displayName={user.display_name} hasError={hasError} />;
}
