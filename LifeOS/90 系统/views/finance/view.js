// 财务部。参数 {period: "month" | "week" | "year"}。布局照 demo/v4/desktop-finance.html。
// 金额只读账本（20 财务部/账本/YYYY-MM.md），首页和复盘也读同一份。
const L = eval(await dv.io.load("90 系统/views/_shared/lib.js"));
const esc = L.esc;
const T = L.today();
const period = (input && input.period) || "month";
const CHIP = { 餐饮: "pink", 购物: "blue", 服饰: "purple", 美妆: "yellow", 日用: "beige", 居住: "beige", 学习: "apricot", 其他: "apricot", 待分类: "plain" };
const PIE = { 餐饮: "#f3c7c0", 购物: "#cfe2f0", 交通: "#fbe5a3", 服饰: "#ddd3e8", 美妆: "#f9e0dc", 日用: "#e3ead9", 学习: "#d6e6dc", 娱乐: "#f6dccf", 居住: "#e9e2d6", 其他: "#eadfc5", 待分类: "#e8e8e8" };
const GUESS = [[/kobo|indigo|chapters|coursera/i, "学习"], [/amzn|amazon|dollarama|walmart/i, "日用"], [/uber eats|doordash|tim|starbucks|pho|cafe|restaurant/i, "餐饮"], [/presto|ttc|uber|lyft|go transit/i, "交通"], [/sephora|shoppers/i, "美妆"], [/netflix|spotify|cineplex/i, "娱乐"]];

const month = T.slice(0, 7), year = T.slice(0, 4);
const ledgerPath = (m) => `20 财务部/账本/${m}.md`;
const monthsBack = (n) => [...Array(n)].map((_, i) => { const d = new Date(Date.UTC(+year, +month.slice(5) - 1 - i, 1)); return d.toISOString().slice(0, 7); });

// 读账本：一年的 12 个月（年视图）或最近 3 个月（周、月视图要画近 8 周）
const months = period === "year" ? [...Array(12)].map((_, i) => `${year}-${String(i + 1).padStart(2, "0")}`) : monthsBack(3);
const raw = {};
for (const m of months) raw[m] = await L.lines(dv, ledgerPath(m));
const all = Object.entries(raw).flatMap(([m, ls]) => ls.map((l, i) => ({ ...L.parseLedger(l), raw: l, line: i, month: m })).filter((e) => e.date));
const budgetMonth = Number((dv.page(ledgerPath(month)) || {}).budget) || 1400;

const mon = L.mondayOf(T), sun = L.addDays(mon, 6);
const scope = period === "week" ? all.filter((e) => e.date >= mon && e.date <= sun)
  : period === "year" ? all.filter((e) => e.date.startsWith(year)) : all.filter((e) => e.month === month);
const total = scope.reduce((a, e) => a + e.amount, 0);
const budget = period === "week" ? budgetMonth / 4 : period === "year" ? budgetMonth * 12 : budgetMonth;
const pending = all.filter((e) => e.category === "待分类" && e.month === month);
const daysInMonth = new Date(Date.UTC(+year, +month.slice(5), 0)).getUTCDate();
const elapsed = period === "week" ? (L.weekday(T) + 1) / 7 : period === "year" ? (L.daysLeft(T, `${year}-01-01`) + 1) / 365 : +T.slice(8) / daysInMonth;

const byCat = {};
scope.forEach((e) => { byCat[e.category] = (byCat[e.category] || 0) + e.amount; });
const cats = Object.entries(byCat).sort((a, b) => b[1] - a[1]);

// 分类规则：商户名包含关键词 → 分类
const rules = (await L.lines(dv, "20 财务部/分类规则.md")).map((l) => /^- (.+?) → (.+)$/.exec(l)).filter(Boolean).map((m) => [m[1].trim(), m[2].trim()]);
const guess = (name) => (rules.find(([k]) => name.toLowerCase().includes(k.toLowerCase())) || GUESS.find(([re]) => re.test(name)) || [null, "其他"])[1];
const subs = (await L.lines(dv, "20 财务部/订阅.md")).filter((l) => l.startsWith("- ")).map((l) => ({ name: l.slice(2, l.indexOf("[")).trim(), ...L.fields(l) }));

// ---------- 图 ----------
function pie() {
  const tot = cats.reduce((a, [, v]) => a + v, 0) || 1;
  let a0 = -Math.PI / 2, h = "";
  const pt = (a, r) => [100 + r * Math.cos(a), 100 + r * Math.sin(a)];
  for (const [c, v] of cats) {
    const a1 = a0 + (v / tot) * 2 * Math.PI, [x0, y0] = pt(a0, 96), [x1, y1] = pt(a1, 96), p = Math.round((v / tot) * 100);
    h += cats.length === 1 ? `<circle cx="100" cy="100" r="96" fill="${PIE[c]}"/>`
      : `<path d="M100 100L${x0.toFixed(1)} ${y0.toFixed(1)}A96 96 0 ${a1 - a0 > Math.PI ? 1 : 0} 1 ${x1.toFixed(1)} ${y1.toFixed(1)}Z" fill="${PIE[c] || "#eee"}"><title>${c} ${p}%</title></path>`;
    if (p >= 10) { const [tx, ty] = pt((a0 + a1) / 2, 62); h += `<text x="${tx.toFixed(1)}" y="${(ty + 5).toFixed(1)}">${p}%</text>`; }
    a0 = a1;
  }
  return `<svg class="pie" viewBox="0 0 200 200" role="img" aria-label="花费分类饼图">${h}</svg>`;
}

// 折线：近 8 周（周、月视图）或 12 个月（年视图）
function trend() {
  const pts = period === "year"
    ? months.map((m, i) => ({ label: `${i + 1}月`, v: all.filter((e) => e.month === m).reduce((a, e) => a + e.amount, 0), now: m === month }))
    : [...Array(8)].map((_, i) => { const s = L.addDays(mon, (i - 7) * 7), e = L.addDays(s, 6);
        return { label: i === 7 ? "本周" : `${+s.slice(5, 7)}/${+s.slice(8)}`, v: all.filter((x) => x.date >= s && x.date <= e).reduce((a, x) => a + x.amount, 0), now: i === 7 }; });
  const line = period === "year" ? budgetMonth : budgetMonth / 4;
  const max = Math.max(line * 1.3, ...pts.map((p) => p.v)), W = 520, x = (i) => 20 + (i * W) / (pts.length - 1), y = (v) => 150 - (v / max) * 120;
  let d = `M${x(0)} ${y(pts[0].v).toFixed(1)}`;
  for (let i = 1; i < pts.length; i++) { const cx = (x(i - 1) + x(i)) / 2; d += ` C ${cx} ${y(pts[i - 1].v).toFixed(1)}, ${cx} ${y(pts[i].v).toFixed(1)}, ${x(i)} ${y(pts[i].v).toFixed(1)}`; }
  const last = pts.findIndex((p) => p.now);
  return `<svg width="680" height="200" viewBox="0 0 680 200" aria-label="花费走势">
    <line x1="20" y1="${y(line).toFixed(1)}" x2="${20 + W}" y2="${y(line).toFixed(1)}" stroke="#cfd8d0" stroke-dasharray="4 4"/>
    <path d="${d}" fill="none" stroke="#7f8f6e" stroke-width="2.4"/>
    ${last >= 0 ? `<circle cx="${x(last)}" cy="${y(pts[last].v).toFixed(1)}" r="5" fill="#d07a6e"/>` : ""}
    <g font-size="14" fill="#636d64" font-family="PingFang SC, sans-serif">${pts.map((p, i) => `<text x="${x(i) - 14}" y="186">${p.label}</text>`).join("")}
    <text x="${26 + W}" y="${(y(line) + 4).toFixed(1)}">${period === "year" ? "月" : "周"}预算 ${L.money(line).replace(".00", "")}</text>
    ${last >= 0 ? `<text x="${x(last) - 50}" y="${(y(pts[last].v) - 12).toFixed(1)}" fill="#a15c46">${L.money(pts[last].v).replace(/\.\d+$/, "")}</text>` : ""}</g></svg>`;
}

// ---------- 页面 ----------
const labels = { week: ["本周", `${L.md(mon)} – ${L.md(sun)}`], month: ["本月", `${+month.slice(5)}.01 – ${L.md(T)}`], year: [`${year} 年`, `1.01 – ${L.md(T)}`] };
const [scopeName, range] = labels[period];
const factsScope = period === "week" ? "本周" : period === "year" ? `${year} 年` : `${L.MONTH_CN[+month.slice(5) - 1]}月`;
const o = {
  page: "finance", eye: "20 · FINANCE · CAD", title: "财务部",
  facts: `${factsScope}已花 <b>${L.money(total)}</b> / 预算 ${L.money(budget).replace(".00", "")}${pending.length ? ` · ${pending.length} 笔待分类` : ""}`,
  btns: [{ label: "＋ 记一笔", cls: "pri", href: ledgerPath(month).replace(/\.md$/, "") }, { label: "整理账本", onclick: copyAsk }, { label: `导出${period === "year" ? "今年" : "本月"}`, onclick: exportCsv }],
  arts: [{ file: "fin-stamps.png", style: "left:986px;top:-34px;width:226px" }],
};
const [ti, tf] = L.money(total).split(".");
const rows = [...scope].sort((a, b) => b.date.localeCompare(a.date)).slice(0, period === "year" ? 15 : 40);

const html = L.banner(o) + `<div class="stack">
  <div class="row c2">
    <section class="card">
      <div class="head"><h2>${scopeName}</h2><span class="note">${range}</span></div>
      <div class="big">${ti}<small>.${tf}</small></div>
      <div class="budget"><div class="prog"><span style="width:${Math.min(100, (total / budget) * 100).toFixed(1)}%"></span><i class="tick" style="left:${(elapsed * 100).toFixed(1)}%"></i></div><span>还剩 <b>${L.money(budget - total)}</b></span></div>
    </section>
    <section class="card">
      <div class="head"><h2>分类</h2></div>
      <div class="cat-wrap">${pie()}<ul class="list cats">${cats.slice(0, 7).map(([c, v]) => `<li><span class="sw" style="background:${PIE[c] || "#eee"}"></span>${c}<span class="mono">${L.money(v)}</span></li>`).join("")}</ul></div>
    </section>
  </div>
  <section class="card" style="height:330px;position:relative">
    <img class="fin-buttons" src="${L.art("fin-buttons.png")}" alt="">
    <div class="head"><h2>${period === "year" ? "每月花费" : "每周花费 · 近 8 周"}</h2></div>${trend()}
  </section>
  <section class="card">
    <div class="head"><h2>账单流水</h2></div>
    <table><thead><tr><th>日期</th><th>项目</th><th>分类</th><th>方式</th><th style="text-align:right">金额</th></tr></thead>
    <tbody>${rows.map((e) => `<tr class="${e.category === "待分类" ? "pending" : ""}"><td>${L.md(e.date)}</td><td>${esc(e.name)}</td><td><span class="chip ${CHIP[e.category] || ""}">${e.category}</span></td><td>${esc(e.method.replace("ApplePay", "Apple Pay"))}</td><td class="amt">${L.money(e.amount)}</td></tr>`).join("")}</tbody></table>
  </section>
  <section class="card">
    ${pending.length ? `<div class="head" style="margin-bottom:4px"><h2>待分类</h2></div>
    ${pending.map((e, i) => `<div class="guess" data-i="${i}"><div><b>${esc(e.name)}</b><small class="mono">${L.money(e.amount)}</small></div><div class="pick"><button class="btn pri ok">${guess(e.name)} ✓</button><select class="btn sec chg" aria-label="改分类"><option value="">改</option>${L.CATEGORIES.map((c) => `<option>${c}</option>`).join("")}</select></div></div>`).join("")}` : ""}
    <div class="head" style="margin:${pending.length ? 26 : 0}px 0 4px"><h2>订阅</h2></div>
    <ul class="list subs">${subs.map((s, i) => `<li><span class="sw" style="background:${["var(--green)", "#a66b53", "#e8dccb", "#b9a6cc"][i % 4]}"></span>${esc(s.name)}<span class="mono">${L.money(+s["金额"] || 0)}/${s["周期"] || "月"}</span></li>`).join("")}</ul>
  </section>
</div>`;

const STYLE = `
.lifeos-dash .bills{max-height:460px}
.lifeos-dash .bills thead th{position:sticky;top:0;background:#fff;z-index:1}
.lifeos-dash .big small{font-size:32px;color:var(--ink-2)}
.lifeos-dash .big{margin:6px 0 22px}
.lifeos-dash .prog{height:12px;border-radius:6px;background:#e8eee9;margin-bottom:16px}
.lifeos-dash .prog span{display:block;height:100%;background:#f6d6d2;border-radius:6px}
.lifeos-dash .budget{display:flex;align-items:center;gap:16px}
.lifeos-dash .budget .prog{flex:1;position:relative;margin:0}
.lifeos-dash .budget .tick{position:absolute;top:-5px;width:2px;height:22px;background:var(--ink-2);border-radius:1px}
.lifeos-dash .budget>span{font-size:17px;color:var(--ink-2);white-space:nowrap}
.lifeos-dash .budget b{font-weight:500;color:var(--ink)}
.lifeos-dash .cat-wrap{display:grid;grid-template-columns:200px 1fr;gap:36px;align-items:center}
.lifeos-dash .pie{width:200px;height:200px;display:block}
.lifeos-dash .pie path{stroke:#fff;stroke-width:2.5;stroke-linejoin:round;transition:transform .25s cubic-bezier(.2,.8,.2,1);transform-origin:100px 100px}
.lifeos-dash .pie path:hover{transform:scale(1.04)}
.lifeos-dash .pie text{font-family:var(--gaegu);font-weight:700;font-size:15px;fill:#4a524c;text-anchor:middle}
.lifeos-dash .cats li{display:grid;grid-template-columns:22px 1fr auto;font-size:16px;padding:10px 0}
.lifeos-dash .cats .sw,.lifeos-dash .subs .sw{width:13px;height:13px;border-radius:3px}
.lifeos-dash .dash tr.pending td{background:#faf1ee}
.lifeos-dash .guess{display:flex;align-items:center;justify-content:space-between;padding:18px 0;border-bottom:1px solid rgba(37,45,41,.07)}
.lifeos-dash .guess:last-of-type{border:0}
.lifeos-dash .guess b{display:block;font-weight:500;font-size:18px}
.lifeos-dash .guess small{font-size:15px;color:var(--muted)}
.lifeos-dash .guess.done>div:first-child{opacity:.4}
.lifeos-dash .pick{display:flex;gap:8px}
.lifeos-dash .pick .btn{height:40px;font-size:15px}
.lifeos-dash select.chg{appearance:none;-webkit-appearance:none;border:0;font:inherit;color:var(--ink);text-align:center;cursor:pointer}
.lifeos-dash .guess.done select.chg{display:none}
.lifeos-dash .subs li{display:grid;grid-template-columns:30px 1fr auto;font-size:16px;padding:13px 0}
.lifeos-dash .fin-buttons{position:absolute;width:95px;height:397px;right:186px;bottom:-190px;transform:rotate(-90deg);pointer-events:none;filter:var(--sh-sticker);z-index:2}
.is-mobile .lifeos-dash .cat-wrap{grid-template-columns:1fr;justify-items:center}
.is-mobile .lifeos-dash svg[width="680"]{width:100%;height:auto}
.is-mobile .lifeos-dash .fin-buttons{display:none}`;

const root = L.mount(dv, html, STYLE);
// 账单流水在卡片里上下滑（表头跟着停在上面）
root.querySelectorAll("table").forEach((t) => { if (!t.querySelector("thead th")) return; const w = document.createElement("div"); w.className = "bills"; t.replaceWith(w); w.appendChild(t); L.scrolly(w); });
L.wireBanner(root, o);

// 待分类：✓ 确认（同时把关键词记进分类规则，下次自动分好）· 改 · 撤销
root.querySelectorAll(".guess").forEach((g) => {
  const e = pending[+g.dataset.i], ok = g.querySelector(".ok"), chg = g.querySelector(".chg");
  let cat = guess(e.name), saved = null;
  chg.addEventListener("change", () => { if (chg.value) { cat = chg.value; ok.textContent = `${cat} ✓`; chg.value = ""; } });
  ok.addEventListener("click", async () => {
    if (!saved) {
      saved = e.raw.replace("[分类:: 待分类]", `[分类:: ${cat}]`);
      await L.replaceLine(ledgerPath(e.month), e.raw, saved);
      const key = e.name.replace(/^SQ \*/, "").split(/\s+/)[0];
      if (!rules.some(([k]) => e.name.toLowerCase().includes(k.toLowerCase()))) await L.appendLine("20 财务部/分类规则.md", `- ${key} → ${cat}`);
      g.classList.add("done"); ok.textContent = "撤销"; L.stamp(ok);
    } else {
      await L.replaceLine(ledgerPath(e.month), saved, e.raw);
      saved = null; g.classList.remove("done"); ok.textContent = `${cat} ✓`;
    }
  });
});

async function copyAsk() {
  await navigator.clipboard.writeText("整理账本");
  L.notice("已复制「整理账本」，粘贴给 Claude Code 就行");
}
async function exportCsv() {
  const name = period === "year" ? year : month;
  const csv = "日期,项目,分类,方式,金额\n" + scope.map((e) => [e.date, `"${e.name.replace(/"/g, '""')}"`, e.category, e.method, e.amount.toFixed(2)].join(",")).join("\n") + "\n";
  const path = `20 财务部/导出/${name}.csv`;
  if (!L.fileOf("20 财务部/导出")) await app.vault.createFolder("20 财务部/导出").catch(() => {});
  const f = L.fileOf(path);
  if (f) await app.vault.modify(f, csv); else await app.vault.create(path, csv);
  L.notice(`已导出到 ${path}`);
}
