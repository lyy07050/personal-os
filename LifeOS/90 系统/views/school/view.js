// 教务处。参数 {section: "term" | "deadlines" | "files" | "notes"}。布局照 demo/v4/desktop-school.html。
// 数据来自 Quercus 同步：截止日期.md、每门课的课程主页.md、课件/.manifest.json（只读文件名和时间，不读课件内容）。
const L = eval(await dv.io.load("90 系统/views/_shared/lib.js"));
const esc = L.esc;
const T = L.today();
const section = (input && input.section) || "term";
const DL = "45 教务处/截止日期.md", MANIFEST = "45 教务处/课件/.manifest.json";
const CODE_BG = ["#e9e7e6", "var(--sage)", "var(--beige)", "var(--purple)", "var(--blue)", "var(--pink)"];

const courses = dv.pages('"45 教务处/课程"').where((p) => p.file.name === "课程主页").array().map((p) => {
  const folder = p.file.folder.split("/").pop();
  const code = String(p.course || folder.split(" ").slice(0, 2).join(" "));
  return { code, name: folder.slice(code.length).trim() || folder, next: p.next_class ? String(p.next_class) : "—", path: p.file.path, folder: p.file.folder };
});
const dls = (await L.lines(dv, DL)).map((l, i) => ({ ...L.parseDeadline(l), line: i })).filter((d) => d.title)
  .sort((a, b) => (a.due || "9999").localeCompare(b.due || "9999"));
let manifest = {};
try { manifest = JSON.parse((await dv.io.load(MANIFEST)) || "{}"); } catch (e) { manifest = {}; }
const files = Object.values(manifest.files || {}).sort((a, b) => String(b.downloaded_at).localeCompare(String(a.downloaded_at)));
const upcoming = dls.filter((d) => !d.done && d.due && d.due.slice(0, 10) >= T);
const mon = L.mondayOf(T), sun = L.addDays(mon, 6);
const thisWeek = upcoming.filter((d) => d.due.slice(0, 10) <= sun);
const lastSync = manifest.last_sync ? String(manifest.last_sync) : "";

function leftPill(d) {
  const n = L.daysLeft(d.due.slice(0, 10), T);
  let txt = `${n} 天`, style = "background:var(--sage);color:var(--green)";
  if (n <= 0) {
    const [h, m] = (d.due.slice(11) || "23:59").split(":").map(Number), now = new Date();
    const hours = Math.max(0, Math.round(h + m / 60 - now.getHours() - now.getMinutes() / 60));
    txt = n < 0 ? "已过" : `还剩 ${hours} 小时`; style = "background:#f8dcd8;color:#8e4a35";
  } else if (n <= 7) style = "background:var(--yellow);color:#6f5420";
  return `<span class="left" style="${style}">${txt}</span>`;
}
const dayLabel = (d) => { const day = d.due.slice(0, 10), n = L.daysLeft(day, T); return `${n === 0 ? "今天" : n === 1 ? "明天" : L.WEEK_CN[L.weekday(day)]}${d.due.length > 10 && d.due.slice(11) !== "23:59" || n <= 1 ? " " + d.due.slice(11) : " 23:59"}`; };
const tlItem = (d, check) => `<li class="${d.done ? "done" : ""}" data-l="${d.line}">${check ? `<button class="ck" aria-label="完成">${L.CK}</button>` : ""}<div>${d.due ? `<span class="g">${L.md(d.due)}</span><small>${dayLabel(d)}</small>` : '<span class="g">—</span>'}</div><div><b class="t">${esc(d.course)} · ${esc(d.title.replace(d.course, "").trim() || d.title)}</b><small>${esc((courses.find((c) => c.code === d.course) || {}).name || "")}</small></div>${d.due && !d.done ? leftPill(d) : "<span></span>"}</li>`;
const fileItem = (f) => { const ext = String(f.path || "").split(".").pop().toUpperCase().slice(0, 4);
  const day = String(f.downloaded_at || "").slice(0, 10);
  return `<li><span class="ft" style="color:${ext === "PDF" ? "#b0473b" : "#3e5b4b"}">${esc(ext)}</span><div><b>${esc(String(f.path).split("/").pop())}</b><small>${esc(f.course || "")}</small></div><span class="muted">${day === T ? "今天" : day === L.addDays(T, -1) ? "昨天" : day ? L.md(day) : ""}</span></li>`; };

const o = {
  page: "school", eye: "45 · SCHOOL · QUERCUS", title: "教务处",
  facts: `${courses.length} 门课 · 本周<b>${thisWeek.length} 个截止</b>${lastSync ? ` · 上次同步 Quercus ${lastSync.slice(0, 10) === T ? "今天" : L.md(lastSync)} ${lastSync.slice(11, 16)}` : ""}`,
  btns: [{ label: "立即同步", cls: "pri", onclick: syncAsk }, { label: "打开课件文件夹", onclick: () => app.showInFolder ? app.showInFolder("45 教务处/课件") : L.notice("课件在 45 教务处/课件") }],
  arts: [{ file: "school-desk.png", style: "left:770px;top:-266px;width:446px" }],
};

let body = "";
if (section === "term") {
  body = `<section class="group courses" aria-label="课程">${courses.map((c, i) => {
    const next = upcoming.find((d) => d.course === c.code);
    const n = next ? L.daysLeft(next.due.slice(0, 10), T) : null;
    const count = files.filter((f) => f.course === c.code).length;
    return `<div class="tile course">${L.link(c.path, `<div class="code" style="background:${CODE_BG[i % CODE_BG.length]}">${esc(c.code)}</div>`)}<div class="body"><h3>${esc(c.name)}</h3><dl><dt>下次课</dt><dd>${esc(c.next)}</dd><dt>截止</dt><dd class="${n !== null && n <= 0 ? "warn" : ""}">${next ? `${esc(next.title.replace(c.code, "").trim())} · ${n === 0 ? "今晚" : L.md(next.due)}` : "—"}</dd><dt>课件</dt><dd>${count} 个</dd></dl></div></div>`;
  }).join("")}</section>
  <section class="card tl"><div class="head"><h2>截止时间线</h2>${L.link("45 教务处/教务面板/截止日期", "全部 →", "note")}</div><ul class="list">${upcoming.slice(0, 4).map((d) => tlItem(d)).join("")}</ul></section>
  <section class="card files"><div class="head"><h2>最近下载的课件</h2></div><ul class="list">${files.slice(0, 4).map(fileItem).join("")}</ul></section>`;
} else if (section === "deadlines") {
  const past = dls.filter((d) => d.done || !d.due || d.due.slice(0, 10) < T);
  body = `<section class="card tl"><div class="head"><h2>还没交</h2></div><ul class="list">${upcoming.map((d) => tlItem(d, true)).join("")}</ul></section>
    <section class="card tl"><div class="head"><h2>已交或已过</h2></div><ul class="list">${past.map((d) => tlItem(d, true)).join("")}</ul></section>`;
} else if (section === "files") {
  body = courses.map((c) => { const mine = files.filter((f) => f.course === c.code);
    return `<section class="card files"><div class="head"><h2>${esc(c.code)}</h2><span class="note">${mine.length} 个</span></div><ul class="list">${mine.map(fileItem).join("")}</ul></section>`; }).join("");
} else {
  body = courses.map((c) => {
    const notes = dv.pages(`"${c.folder}"`).where((p) => p.file.name !== "课程主页").sort((p) => p.file.name, "desc").array();
    return `<section class="card"><div class="head"><h2>${L.link(c.path, esc(c.code))}</h2><span class="note">${notes.length} 篇</span></div><ul class="list">${notes.map((p) => `<li>${L.link(p.file.path, esc(p.file.name))}</li>`).join("") || '<li class="muted">还没有笔记</li>'}</ul></section>`;
  }).join("");
}

const STYLE = `
.lifeos-dash .courses{display:grid;grid-template-columns:1fr 1fr;gap:20px 24px}
.lifeos-dash .course{min-height:300px;border-radius:22px;overflow:hidden;padding:0}
.lifeos-dash .course .code{height:92px;display:flex;align-items:center;padding:0 24px;font-family:"Crimson Text",serif;font-weight:600;font-size:39px;color:rgba(37,45,41,.72)}
.lifeos-dash .course .body{padding:22px 24px}
.lifeos-dash .course h3{font-family:"Playfair Display",serif;font-weight:700;font-size:26px;margin-bottom:14px}
.lifeos-dash .course dl{display:grid;grid-template-columns:62px 1fr;row-gap:10px;font-size:16px;margin:0}
.lifeos-dash .course dt{color:var(--muted)}
.lifeos-dash .course dd{margin:0}
.lifeos-dash .course dd.warn{color:var(--warn)}
.lifeos-dash .tl li{display:grid;grid-template-columns:120px 1fr auto;align-items:center;padding:18px 0;border-bottom:1px solid rgba(37,45,41,.07)}
.lifeos-dash .tl li:has(.ck){grid-template-columns:44px 120px 1fr auto}
.lifeos-dash .tl li:last-child{border:0}
.lifeos-dash .tl .g{font-size:28px;color:var(--ink);line-height:1;display:inline-block;border:1.5px solid rgba(37,45,41,.22);border-radius:10px;padding:2px 8px}
.lifeos-dash .tl small{display:block;font-size:14px;color:var(--muted);margin-top:4px}
.lifeos-dash .tl b{font-weight:500;font-size:18px}
.lifeos-dash .left{height:30px;padding:0 14px;border-radius:15px;font-size:14px;display:inline-grid;place-items:center}
.lifeos-dash .files li{display:grid;grid-template-columns:52px 1fr auto;align-items:center;padding:14px 0;border-bottom:1px solid rgba(37,45,41,.07)}
.lifeos-dash .files li:last-child{border:0}
.lifeos-dash .ft{width:38px;height:42px;border-radius:6px;background:#fff;box-shadow:var(--sh-lift);font-family:var(--mono);font-size:12px;display:grid;align-items:end;justify-items:center;padding-bottom:5px;font-weight:500}
.lifeos-dash .files b{font-weight:500;font-size:18px}
.lifeos-dash .files small{display:block;font-size:14px;color:var(--muted)}
.is-mobile .lifeos-dash .courses{grid-template-columns:1fr}
.is-mobile .lifeos-dash .tl li{grid-template-columns:80px 1fr;row-gap:6px}`;

const root = L.mount(dv, L.banner(o) + `<div class="stack">${body}</div>`, STYLE);
L.wireBanner(root, o);
root.querySelectorAll(".tl li .ck").forEach((ck) => ck.addEventListener("click", async () => {
  const li = ck.closest("li");
  if (li.classList.toggle("done")) L.stamp(ck);
  await L.toggleTaskAt(DL, +li.dataset.l);
}));
async function syncAsk() {
  await navigator.clipboard.writeText("同步 Quercus");
  L.notice("已复制「同步 Quercus」，粘贴给 Claude Code；每天 08:00 也会自动同步");
}
