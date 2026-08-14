"use client";

import { ArrowDownRight, ArrowUpRight, Coffee, LayoutDashboard, PackageOpen, Settings, ShoppingBasket, Store, Users } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const monthlyCosts = [
  { month: "3月", cost: 31.8 }, { month: "4月", cost: 30.4 }, { month: "5月", cost: 29.9 },
  { month: "6月", cost: 31.1 }, { month: "7月", cost: 28.7 }, { month: "8月", cost: 27.8 },
];

const productCosts = [
  { name: "タコス", cost: 286, price: 780, rate: 36.7, color: "bg-orange-500" },
  { name: "カレー", cost: 342, price: 980, rate: 34.9, color: "bg-amber-500" },
  { name: "コーヒー", cost: 94, price: 450, rate: 20.9, color: "bg-stone-600" },
  { name: "アルコール", cost: 168, price: 650, rate: 25.8, color: "bg-rose-500" },
  { name: "ソフトドリンク", cost: 72, price: 380, rate: 18.9, color: "bg-sky-500" },
];

const navItems = [[LayoutDashboard, "ダッシュボード"], [PackageOpen, "商品マスタ"], [ShoppingBasket, "材料・購入先"], [Store, "販売実績"], [Users, "ユーザー管理"]] as const;
const yen = (value: number) => `${new Intl.NumberFormat("ja-JP").format(value)}円`;

export default function Home() {
  return (
    <div className="min-h-screen bg-[#f6f3ee] text-[#28251f]">
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col bg-[#183c35] px-5 py-7 text-white lg:flex">
        <div className="flex items-center gap-3 px-2">
          <div className="grid size-10 place-items-center rounded-xl bg-[#f2ae41] text-[#183c35]"><Coffee size={22} strokeWidth={2.5} /></div>
          <div><p className="text-lg font-bold tracking-wide">COST TABLE</p><p className="text-xs text-emerald-100/70">原価管理システム</p></div>
        </div>
        <nav className="mt-10 space-y-2">
          {navItems.map(([Icon, label], index) => (
            <button key={label} className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm transition ${index === 0 ? "bg-white/14 font-semibold" : "text-emerald-50/70 hover:bg-white/8 hover:text-white"}`}>
              <Icon size={18} />{label}
            </button>
          ))}
        </nav>
        <div className="mt-auto rounded-2xl bg-white/8 p-4"><p className="text-xs text-emerald-100/60">ログイン中</p><p className="mt-1 text-sm font-semibold">管理者</p><button className="mt-4 flex items-center gap-2 text-xs text-emerald-50/70"><Settings size={15} /> 設定</button></div>
      </aside>

      <main className="px-5 py-6 lg:ml-64 lg:px-9 lg:py-8">
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div><p className="text-sm font-medium text-[#b66d27]">2026年8月</p><h1 className="mt-1 text-3xl font-bold tracking-tight">原価ダッシュボード</h1><p className="mt-2 text-sm text-stone-500">販売実績を基準に、月間の原価状況を確認できます。</p></div>
          <button className="rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-semibold shadow-sm">対象月を変更</button>
        </header>

        <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[["月間売上", "1,320,000円", "+5.8%", true], ["トータル原価", "366,960円", "+2.1%", false], ["平均原価率", "27.8%", "-0.9pt", true], ["販売個数", "1,684個", "+124個", true]].map(([label, value, change, good]) => (
            <article key={String(label)} className="rounded-2xl border border-stone-200/80 bg-white p-5 shadow-[0_8px_24px_rgba(60,50,35,0.04)]">
              <p className="text-sm text-stone-500">{String(label)}</p><p className="mt-3 text-2xl font-bold tracking-tight">{String(value)}</p>
              <p className={`mt-3 flex items-center gap-1 text-xs font-semibold ${good ? "text-emerald-700" : "text-orange-700"}`}>{good ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}{String(change)} <span className="font-normal text-stone-400">前月比</span></p>
            </article>
          ))}
        </section>

        <section className="mt-5 grid gap-5 xl:grid-cols-[1.35fr_1fr]">
          <ChartCard title="月別原価率" subtitle="過去6か月の推移">
            <LineChart data={monthlyCosts}><CartesianGrid stroke="#eee9df" strokeDasharray="4 4" vertical={false} /><XAxis dataKey="month" axisLine={false} tickLine={false} /><YAxis domain={[20, 40]} axisLine={false} tickLine={false} unit="%" /><Tooltip formatter={(value) => [`${value}%`, "原価率"]} /><Line type="monotone" dataKey="cost" stroke="#cc7b2b" strokeWidth={3} dot={{ r: 4, fill: "#fff", strokeWidth: 3 }} /></LineChart>
          </ChartCard>
          <ChartCard title="カテゴリ別売上" subtitle="税込販売価格 × 販売個数">
            <BarChart data={[{ name: "タコス", value: 42 }, { name: "カレー", value: 33 }, { name: "飲み物", value: 25 }]}><CartesianGrid stroke="#eee9df" strokeDasharray="4 4" vertical={false} /><XAxis dataKey="name" axisLine={false} tickLine={false} /><YAxis axisLine={false} tickLine={false} unit="%" /><Tooltip formatter={(value) => [`${value}%`, "売上構成"]} /><Bar dataKey="value" fill="#316c5e" radius={[8, 8, 2, 2]} /></BarChart>
          </ChartCard>
        </section>

        <section className="mt-5 rounded-2xl border border-stone-200/80 bg-white p-6 shadow-[0_8px_24px_rgba(60,50,35,0.04)]">
          <div className="flex items-center justify-between"><div><h2 className="font-bold">商品別原価</h2><p className="mt-1 text-xs text-stone-400">仕込み原価を販売個数で集計</p></div><button className="text-sm font-semibold text-[#a45f20]">すべて見る →</button></div>
          <div className="mt-5 overflow-x-auto"><table className="w-full min-w-[680px] text-left text-sm"><thead className="border-b border-stone-100 text-xs text-stone-400"><tr><th className="pb-3 font-medium">商品</th><th className="pb-3 font-medium">1個あたり原価</th><th className="pb-3 font-medium">税込販売価格</th><th className="pb-3 font-medium">原価率</th><th className="pb-3 font-medium">状態</th></tr></thead><tbody>
            {productCosts.map((item) => <tr key={item.name} className="border-b border-stone-100 last:border-0"><td className="py-4 font-semibold">{item.name}</td><td className="py-4">{yen(item.cost)}</td><td className="py-4 text-stone-500">{yen(item.price)}</td><td className="py-4"><div className="flex items-center gap-3"><div className="h-1.5 w-24 rounded-full bg-stone-100"><div className={`h-full rounded-full ${item.color}`} style={{ width: `${Math.min(item.rate * 2, 100)}%` }} /></div><span>{item.rate}%</span></div></td><td className="py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${item.rate > 35 ? "bg-orange-50 text-orange-700" : "bg-emerald-50 text-emerald-700"}`}>{item.rate > 35 ? "要確認" : "良好"}</span></td></tr>)}
          </tbody></table></div>
        </section>
      </main>
    </div>
  );
}

function ChartCard({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactElement }) {
  return <article className="rounded-2xl border border-stone-200/80 bg-white p-6 shadow-[0_8px_24px_rgba(60,50,35,0.04)]"><div className="flex items-center justify-between"><div><h2 className="font-bold">{title}</h2><p className="mt-1 text-xs text-stone-400">{subtitle}</p></div>{title === "月別原価率" && <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">目標 30%以下</span>}</div><div className="mt-6 h-64"><ResponsiveContainer width="100%" height="100%">{children}</ResponsiveContainer></div></article>;
}
