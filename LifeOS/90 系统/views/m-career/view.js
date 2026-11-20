// 手机 · 人事部：下一场面试 + 面试准备 + 四个阶段的数字 + JobSync 入口。布局照 demo/v4/mobile-career.html。
const L = eval(await dv.io.load("90 系统/views/_shared/lib.js"));
const D = eval(await dv.io.load("90 系统/views/_shared/data.js"))(L, dv);
const M = eval(await dv.io.load("90 系统/views/_shared/m.js"))(L);
const esc = L.esc, T = D.T;
const JOBSYNC = "http://localhost:3737";
const STAGES = [["想投", "var(--tint)"], ["已投递", "var(--sage)"], ["面试中", "var(--pink)"], ["Offer", "var(--yellow)"]];

const jobs = D.jobs();
const ivs = D.interviews();
const iv = ivs.find((i) => i.date.slice(0, 10) >= T);
const job = iv && jobs.find((j) => j.company === iv.company);
const when = (d) => { const n = L.daysLeft(d.slice(0, 10), T); return `${n === 0 ? "今天" : n === 1 ? "明天" : n < 7 ? L.WEEK_CN[L.weekday(d)] : L.md(d)} ${d.slice(11, 16)}`.trim(); };

const html = M.head({ title: "人事部", sub: `投递 ${jobs.filter((j) => j.stage !== "想投").length} · 面试中 ${jobs.filter((j) => j.stage === "面试中").length}` }) +
  (iv ? `<section class="card iv" aria-label="下一场面试"><span class="chip warn">${esc(when(iv.date))}</span>${L.link(iv.path, `<b>${esc(iv.company ? `${iv.company} · ${iv.name.replace(iv.company, "").trim() || "面试"}` : iv.name)}</b>`)}<p>${esc(job ? job.role : "")}</p></section>
  <section class="card" aria-label="面试准备"><div class="label"><span>面试准备</span><span class="count">${iv.tasks.filter((t) => t.completed).length} / ${iv.tasks.length}</span></div><ul class="prep">${iv.tasks.map((t) => `<li class="${t.completed ? "done" : ""}" data-l="${t.line}"><button class="ck" aria-label="完成">${L.CK}</button><span class="t">${esc(t.text)}</span></li>`).join("")}</ul></section>` : "") +
  `<div class="stages">${STAGES.map(([s, bg]) => `<div class="card s" style="background:${bg}"><b class="num">${jobs.filter((j) => j.stage === s).length}</b><span>${s}</span></div>`).join("")}</div>
  <button class="jobsync">打开 JobSync</button>`;

const STYLE = `
.lifeos-dash .m .iv{background:var(--pink);margin-bottom:12px;padding:18px}
.lifeos-dash .m .iv b{display:block;font-size:22px;font-weight:600;letter-spacing:-.02em;margin:12px 0 4px}
.lifeos-dash .m .iv p{font-size:13.5px;color:var(--ink-2)}
.lifeos-dash .m .prep{list-style:none;margin:0;padding:0}
.lifeos-dash .m .prep li{display:flex;align-items:center;gap:10px;padding:9px 0;font-size:14.5px;border-bottom:1px solid rgba(37,45,41,.06)}
.lifeos-dash .m .prep li:last-child{border-bottom:0}
.lifeos-dash .m .stages{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:12px}
.lifeos-dash .m .s{padding:12px 8px;text-align:center;border-radius:20px}
.lifeos-dash .m .s .num{display:block;font-size:24px;color:var(--green)}
.lifeos-dash .m .s span{font-size:12.5px;color:var(--ink-2)}
.lifeos-dash .m .jobsync{display:flex;align-items:center;justify-content:center;width:100%;height:48px;margin-top:12px;border-radius:999px;background:#fff;box-shadow:var(--shadow);font-size:15px;font-weight:500}`;

const root = M.mount(dv, html, STYLE);
root.querySelector(".jobsync").addEventListener("click", () => window.open(JOBSYNC));
root.querySelectorAll(".prep li[data-l] .ck").forEach((ck) => ck.addEventListener("click", async () => {
  const li = ck.closest("li");
  if (li.classList.toggle("done")) L.stamp(ck);
  await L.toggleTaskAt(iv.path, +li.dataset.l);
}));
