// 人事部 · 求职。参数 {section: "pipeline" | "interviews" | "notes"}。布局照 demo/v4/desktop-career.html。
// JobSync 是本机上单独跑的网站（端口 3737），这里只放入口。
const L = eval(await dv.io.load("90 系统/views/_shared/lib.js"));
const esc = L.esc;
const T = L.today();
const section = (input && input.section) || "pipeline";
const JOBSYNC = "http://localhost:3737";
const STAGES = ["想投", "已投递", "面试中", "Offer"];

const jobs = dv.pages('"50 人事部/投递"').where((p) => p.stage).array().map((p) => ({
  path: p.file.path, company: String(p.company || p.file.name), role: String(p.role || ""), stage: String(p.stage), when: String(p.when || ""),
})).sort((a, b) => b.when.localeCompare(a.when));
const interviews = dv.pages('"50 人事部/面试"').array().map((p) => ({
  path: p.file.path, name: p.file.name, company: String(p.company || ""), date: String(p.date || ""), tasks: p.file.tasks.array(),
})).sort((a, b) => a.date.localeCompare(b.date));
const nextIv = interviews.find((i) => i.date.slice(0, 10) >= T) || interviews[interviews.length - 1];
const tips = dv.pages('"40 研发部/知识卡"').where((p) => String(p.category) === "求职").sort((p) => L.iso(p.created), "desc").array();
const tipText = {};
for (const t of tips) { const s = (await dv.io.load(t.file.path)) || ""; tipText[t.file.path] = s.slice(s.indexOf("\n---", 4) + 4).split("\n").filter((l) => l.trim() && !l.startsWith("#")).join(" "); }

const ivLabel = (i) => { if (!i || !i.date) return ""; const d = i.date.slice(0, 10), n = L.daysLeft(d, T);
  return `${n === 0 ? "今天" : n > 0 && n < 7 ? L.WEEK_CN[L.weekday(d)] : L.md(d)} ${i.date.slice(11, 16)}`.trim(); };
const chip = (j) => j.stage === "想投" ? `<span class="chip apricot">${esc(j.when.replace("截止 ", "截止 ").replace(/(\d{4})-(\d{2})-(\d{2})/, (m, y, mo, da) => `${+mo}.${da}`)) || "想投"}</span>`
  : j.stage === "已投递" ? `<span class="chip">${esc(j.when.replace(/(\d{4})-(\d{2})-(\d{2})/, (m, y, mo, da) => `${+mo}.${da}`))} 投递</span>`
  : j.stage === "面试中" ? `<span class="chip ${/等/.test(j.when) ? "yellow" : "pink"}">${esc(j.when)}</span>` : `<span class="chip">${esc(j.when || "Offer")}</span>`;

const o = {
  page: "career", eye: "50 · CAREER", title: "人事部",
  facts: `投递 ${jobs.filter((j) => j.stage !== "想投").length} · 面试中 ${jobs.filter((j) => j.stage === "面试中").length}${nextIv && nextIv.date.slice(0, 10) >= T ? ` · ${ivLabel(nextIv).split(" ")[0]} <b>${nextIv.date.slice(11, 16)} 面试</b>` : ""}`,
  btns: [{ label: "打开 JobSync", cls: "pri", onclick: () => window.open(JOBSYNC) }, { label: "＋ 记一次投递", onclick: addJob }],
  arts: [{ file: "career-flower.png", style: "left:828px;top:118px;width:160px" }, { file: "career-shell1.png", style: "left:881px;top:95px;width:96px" },
    { file: "career-lotus2.png", style: "left:952px;top:63px;width:232px" }, { file: "career-shell2.png", style: "left:1126px;top:191px;width:83px" },
    { file: "career-butterflies.png", style: "left:990px;top:-88px;width:307px;filter:none" }],
};

const ivCard = (i) => !i ? "" : `<section class="card"><div class="head" style="margin-bottom:6px"><h2>${L.link(i.path, esc(i.name))}</h2><span class="note">${esc(ivLabel(i))}</span></div>
  <ul class="list">${i.tasks.map((t) => `<li class="${t.completed ? "done" : ""}" data-p="${esc(i.path)}" data-l="${t.line}"><button class="ck" aria-label="完成" style="width:30px;height:30px">${L.CK}</button><span class="t">${esc(t.text)}</span></li>`).join("")}</ul></section>`;
const tipCard = (t) => `<section class="card tip"><div class="nh"><span>${esc(t.file.name)}</span>${L.link(t.file.path, "知识库 →")}</div><p>${esc(tipText[t.file.path])}</p></section>`;

let body = "";
if (section === "pipeline") {
  body = `<section class="group board" aria-label="求职流程">${STAGES.map((s) => {
    const mine = jobs.filter((j) => j.stage === s), show = s === "已投递" ? 3 : 2;
    return `<div class="col tile" data-s="${s}"><div class="ch"><h3 class="${s === "Offer" ? "g" : ""}">${s}</h3><span>${mine.length}</span></div>
      ${mine.map((j, k) => `<div class="co" ${k >= show ? "hidden" : ""}>${L.link(j.path, `<b>${esc(j.company)}</b>`)}<small>${esc(j.role)}</small>${chip(j)}</div>`).join("")}
      ${mine.length > show ? `<button class="more">另外 ${mine.length - show} 家 →</button>` : ""}${mine.length ? "" : '<div class="slot" aria-hidden="true"></div>'}</div>`;
  }).join("")}</section>${ivCard(nextIv)}${tips[0] ? tipCard(tips[0]) : ""}`;
} else if (section === "interviews") {
  body = interviews.map(ivCard).join("") || '<section class="card"><p class="muted">还没有面试</p></section>';
} else {
  body = tips.map(tipCard).join("");
}

const STYLE = `
.lifeos-dash .board{display:grid;grid-template-columns:1fr 1fr;gap:20px 24px;align-items:start}
.lifeos-dash .col{border-radius:22px;padding:18px 16px 16px}
.lifeos-dash .col .ch{display:flex;justify-content:space-between;align-items:baseline;padding:0 4px 12px}
.lifeos-dash .col h3{font-family:var(--zcool);font-weight:400;font-size:26px}
.lifeos-dash .col h3.g{font-family:var(--gaegu);font-size:30px}
.lifeos-dash .col .ch span{font-size:16px;color:var(--brown);font-weight:500}
.lifeos-dash .co{background:#fff;border-radius:16px;border:1px solid rgba(37,45,41,.06);padding:16px 18px;margin-bottom:12px;box-shadow:0 1px 2px rgba(52,72,59,.04)}
.lifeos-dash .co[hidden]{display:none}
.lifeos-dash .co b{display:block;font-weight:500;font-size:18px}
.lifeos-dash .co small{display:block;font-size:14px;color:var(--muted);margin:3px 0 12px}
.lifeos-dash .tip .nh{display:flex;justify-content:space-between;font-size:15px;color:var(--ink-2);padding-bottom:14px;border-bottom:1px solid rgba(37,45,41,.1);margin-bottom:20px}
.lifeos-dash .tip p{font-family:var(--zcool);font-size:24px;line-height:1.5;max-width:32em}
.lifeos-dash .slot{height:96px;border:1.5px dashed rgba(37,45,41,.14);border-radius:16px}
.lifeos-dash .dash .more{display:block;padding:6px 4px 0;font-size:15px;color:var(--ink-2)}
.is-mobile .lifeos-dash .board{grid-template-columns:1fr}`;

const root = L.mount(dv, L.banner(o) + `<div class="stack">${body}</div>`, STYLE);
L.wireBanner(root, o);
root.querySelectorAll(".col .more").forEach((b) => b.addEventListener("click", () => { b.closest(".col").querySelectorAll(".co[hidden]").forEach((c) => { c.hidden = false; }); b.remove(); }));
root.querySelectorAll("li[data-l] .ck").forEach((ck) => ck.addEventListener("click", async () => {
  const li = ck.closest("li");
  if (li.classList.toggle("done")) L.stamp(ck);
  await L.toggleTaskAt(li.dataset.p, +li.dataset.l);
}));
async function addJob() {
  let path = "50 人事部/投递/新投递.md";
  for (let n = 2; L.fileOf(path); n++) path = `50 人事部/投递/新投递 ${n}.md`;
  await app.vault.create(path, `---\ncompany: \nrole: \nstage: 已投递\nwhen: ${T}\n---\n# 新投递\n`);
  L.open(path);
}
