// 手机 · 教务处：最近的截止 + 接下来 + 课程方块。布局照 demo/v4/mobile-school.html。
const L = eval(await dv.io.load("90 系统/views/_shared/lib.js"));
const D = eval(await dv.io.load("90 系统/views/_shared/data.js"))(L, dv);
const M = eval(await dv.io.load("90 系统/views/_shared/m.js"))(L);
const esc = L.esc, T = D.T;
const CODE_BG = ["#e9e7e6", "var(--sage)", "var(--beige)", "var(--purple)", "var(--blue)", "var(--pink)"];

const courses = D.courses();
const upcoming = (await D.deadlines()).filter((d) => !d.done && d.due && d.due.slice(0, 10) >= T).sort((a, b) => a.due.localeCompare(b.due));
const sun = L.addDays(L.mondayOf(T), 6);
const thisWeek = upcoming.filter((d) => d.due.slice(0, 10) <= sun).length;
let lastSync = "";
try { lastSync = String(JSON.parse((await dv.io.load("45 教务处/课件/.manifest.json")) || "{}").last_sync || ""); } catch (e) { lastSync = ""; }

const short = (d) => `${esc(d.course)} · ${esc(d.title.replace(d.course, "").trim() || d.title)}`;
const day = (d) => { const n = L.daysLeft(d.due.slice(0, 10), T); return `${n === 0 ? "今天" : n === 1 ? "明天" : L.WEEK_CN[L.weekday(d.due)]} ${d.due.slice(11) || "23:59"}`; };
function pill(d) {
  const n = L.daysLeft(d.due.slice(0, 10), T);
  if (n <= 0) {
    const [h, m] = (d.due.slice(11) || "23:59").split(":").map(Number), now = new Date();
    return `<span class="chip warn">还剩 ${Math.max(0, Math.round(h + m / 60 - now.getHours() - now.getMinutes() / 60))} 小时</span>`;
  }
  return `<span class="chip" ${n <= 7 ? 'style="background:var(--yellow);color:#6f5420"' : ""}>${n} 天</span>`;
}
const first = upcoming[0];

const html = M.head({ title: "教务处", sub: `本周 ${thisWeek} 个截止${lastSync ? ` · ${lastSync.slice(0, 10) === T ? "" : L.md(lastSync) + " "}${lastSync.slice(11, 16)} 同步` : ""}` }) +
  (first ? `<section class="card due-hero" aria-label="最近的截止">${pill(first)}<b>${short(first)}</b><p>${day(first)}</p></section>` : "") +
  `<section class="card" aria-label="截止时间线"><div class="label"><span>接下来</span>${L.link("45 教务处/教务面板/截止日期", "全部")}</div><ul class="tl">${upcoming.slice(first ? 1 : 0, 6).map((d) => `<li data-l="${d.line}" data-q="${esc(d.title)}"><button class="ck" aria-label="完成">${L.CK}</button><span class="d num">${L.md(d.due)}</span><div><b>${short(d)}</b><small>${day(d)}</small></div>${pill(d)}</li>`).join("") || '<li class="sub">没有要交的了</li>'}</ul></section>
  <div class="courses">${courses.map((c, i) => L.link(c.path, `<b>${esc(c.code)}</b><small>${esc(c.next)}</small>`, "card c", `style="background:${CODE_BG[i % CODE_BG.length]}" data-q="${esc(c.code + " " + c.name)}"`)).join("")}</div>`;

const STYLE = `
.lifeos-dash .m .due-hero{background:var(--pink);margin-bottom:12px;padding:18px}
.lifeos-dash .m .due-hero b{display:block;font-size:22px;font-weight:600;letter-spacing:-.02em;margin:12px 0 4px}
.lifeos-dash .m .due-hero p{font-size:13.5px;color:var(--ink-2)}
.lifeos-dash .m .tl{list-style:none;margin:0;padding:0}
.lifeos-dash .m .tl li{display:grid;grid-template-columns:22px 52px 1fr auto;gap:10px;align-items:center;padding:10px 0;border-bottom:1px solid rgba(37,45,41,.06)}
.lifeos-dash .m .tl li:last-child{border-bottom:0}
.lifeos-dash .m .tl .d{font-size:16px;display:inline-block;border:1.5px solid rgba(37,45,41,.2);border-radius:9px;padding:2px 4px;text-align:center}
.lifeos-dash .m .tl b{display:block;font-size:14.5px;font-weight:600}
.lifeos-dash .m .tl small{font-size:12px;color:var(--muted)}
.lifeos-dash .m .tl .done b{text-decoration:line-through;color:var(--muted)}
.lifeos-dash .m .courses{display:grid;grid-template-columns:1fr 1fr;gap:var(--gap);margin-top:12px}
.lifeos-dash .m .c{padding:14px 16px;display:block}
.lifeos-dash .m .c b{display:block;font-size:18px;font-weight:600;letter-spacing:-.02em}
.lifeos-dash .m .c small{font-size:12.5px;color:var(--ink-2)}`;

const root = M.mount(dv, html, STYLE, { search: "找课程、找作业…" });
root.querySelectorAll(".tl li[data-l] .ck").forEach((ck) => ck.addEventListener("click", async () => {
  const li = ck.closest("li");
  if (li.classList.toggle("done")) L.stamp(ck);
  await L.toggleTaskAt(D.DL, +li.dataset.l);
}));
