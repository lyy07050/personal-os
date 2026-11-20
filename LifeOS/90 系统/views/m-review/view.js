// 手机 · 每周复盘：本周复盘笔记（没有就用最近一篇）的三件要事 + 四个数字 + 习惯打卡 + 钱花在哪。布局照 demo/v4/mobile-review.html。
// 三件要事、「放进首页待办」、习惯圆点都会写回文件，和电脑上的周复盘一样。
const L = eval(await dv.io.load("90 系统/views/_shared/lib.js"));
const D = eval(await dv.io.load("90 系统/views/_shared/data.js"))(L, dv);
const M = eval(await dv.io.load("90 系统/views/_shared/m.js"))(L);
const esc = L.esc, T = D.T;
const CAT_BG = { 餐饮: "#f8dcd8", 购物: "var(--blue)", 交通: "#fff0be", 日用: "#ece6ef", 服饰: "#e7e0ee", 美妆: "#fbe9e7", 娱乐: "#dfe8db", 学习: "#e6ede2", 居住: "#f2e8d3", 其他: "#f2e8d3", 待分类: "#eee" };

const reviews = D.reviews();
const thisW = L.isoWeek(T);
const note = reviews.find((r) => String(r.week) === thisW) || reviews[0];
const week = note ? String(note.week) : thisW;
const s = await D.reviewStats(week, reviews);
const goals = note ? note.file.tasks.where((t) => /\[来源::\s*复盘\]/.test(t.text)).array().slice(0, 3) : [];
const onHome = note && note.goals_on_home === true;
const cats = Object.entries(s.byCat).sort((a, b) => b[1] - a[1]);
const left = s.weekBudget - s.spent;

const html = M.head({ title: "每周复盘", sub: `Week ${+week.slice(6)} · ${L.md(s.mon)} – ${L.md(s.sun)}` }) + `
<section class="card plan" aria-label="下周三件要事">${M.tape("#dfe8db", "top:-8px;left:26px;rotate:-5deg")}
  <div class="label"><span>下周三件要事</span>${note ? L.link(note.file.path, "打开复盘") : ""}</div>
  <ol class="three ${onHome ? "pinned" : ""}">${[0, 1, 2].map((i) => {
    const t = goals[i], text = t ? t.text.replace(/\[来源::[^\]]*\]/, "").trim() : "";
    return `<li><span class="n">${i + 1}</span><input value="${esc(text)}" aria-label="第 ${i + 1} 件" data-i="${i}" ${note ? "" : "disabled"}></li>`;
  }).join("")}</ol>
  <button class="save" ${onHome || !note ? "disabled" : ""}>${onHome ? "已放进首页待办" : "放进首页待办"}</button>
</section>
<div class="stats">
  <div class="card st"><span class="label2">完成待办</span><b class="num">${s.done}<small>/${s.total}</small></b></div>
  <div class="card st"><span class="label2">本周花费</span><b class="num">$${Math.round(s.spent)}</b></div>
  <div class="card st"><span class="label2">学英语</span><b class="num">${s.english}<small>天</small></b></div>
  <div class="card st"><span class="label2">新知识卡</span><b class="num">${s.newCards.length}</b></div>
</div>
<section class="card" aria-label="习惯打卡">
  <div class="label"><span>习惯打卡</span></div>
  <div class="hr head"><span></span>${"一二三四五六日".split("").map((d) => `<span class="d">${d}</span>`).join("")}</div>
  ${D.HABITS.map((h) => `<div class="hr"><span class="hn">${h}</span>${s.days.map((d, i) => `<button class="dot ${s.diaries[d] && s.diaries[d][h] === true ? "on" : ""}" aria-label="${h} ${L.WEEK_CN[i]}" data-h="${h}" data-d="${d}">${L.CK}</button>`).join("")}</div>`).join("")}
</section>
<section class="card" aria-label="钱花在哪" style="margin-top:12px">
  <div class="label"><span>钱花在哪</span><span class="count">${left >= 0 ? `还剩 ${L.money(left)}` : `超出 ${L.money(-left)}`}</span></div>
  <div class="mstrip">${cats.map(([c, v]) => `<span style="flex:${v.toFixed(2)};background:${CAT_BG[c] || "#eee"}">${c}</span>`).join("") || '<span class="sub">这周还没记账</span>'}</div>
</section>`;

const STYLE = `
.lifeos-dash .m .plan{margin-bottom:12px;overflow:visible}
.lifeos-dash .m .three{list-style:none;display:flex;flex-direction:column;gap:8px;margin:0;padding:0}
.lifeos-dash .m .three li{display:flex;align-items:center;gap:12px;background:var(--tint);border-radius:14px;padding:6px 14px;border:1px solid rgba(37,45,41,.06);position:relative}
.lifeos-dash .m .three .n{font-weight:600;color:var(--green);width:14px}
.lifeos-dash .m .three input{flex:1;min-width:0;border:0;background:none;box-shadow:none;padding:0;font:inherit;font-size:15px;outline:none;min-height:34px;caret-color:var(--green);color:var(--ink)}
.lifeos-dash .m .three li:focus-within{border-color:var(--green)}
.lifeos-dash .m .three li::before{content:"";position:absolute;left:-8px;top:50%;width:34px;height:14px;translate:0 -50%;rotate:-8deg;scale:0;opacity:.85;background:#f8dcd8;border-radius:2px;transition:scale .35s cubic-bezier(.2,.8,.2,1)}
.lifeos-dash .m .three.pinned li::before{scale:1}
.lifeos-dash .m .three.pinned li:nth-child(2)::before{transition-delay:.12s;background-color:#fef0c4}
.lifeos-dash .m .three.pinned li:nth-child(3)::before{transition-delay:.24s;background-color:#dfe8db}
.lifeos-dash .m .save{width:100%;height:48px;border-radius:999px;background:var(--green);color:#fff;font-size:15px;font-weight:600;margin-top:12px}
.lifeos-dash .m .save:disabled{opacity:.55}
.lifeos-dash .m .stats{display:grid;grid-template-columns:1fr 1fr;gap:var(--gap);margin-bottom:12px}
.lifeos-dash .m .st{padding:14px 16px;text-align:center}
.lifeos-dash .m .label2{display:block;font-size:13px;color:var(--ink-2)}
.lifeos-dash .m .st .num{display:block;font-size:34px;line-height:1.15;color:var(--green)}
.lifeos-dash .m .st .num small{font-size:16px;color:var(--ink-2)}
.lifeos-dash .m .hr{display:grid;grid-template-columns:44px repeat(7,1fr);align-items:center;padding:3px 0}
.lifeos-dash .m .hr.head .d{font-size:12px;color:var(--muted);text-align:center}
.lifeos-dash .m .hn{font-size:13.5px}
.lifeos-dash .m .dot{width:30px;height:30px;border-radius:50%;border:1.5px solid var(--outline);background:#f6f8f4;display:grid;place-items:center;margin:0 auto}
.lifeos-dash .m .dot svg{opacity:0}
.lifeos-dash .m .dot.on{background:var(--green);border-color:var(--green)}
.lifeos-dash .m .dot.on svg{opacity:1}
.lifeos-dash .m .mstrip{display:flex;height:36px;border-radius:10px;overflow:hidden;gap:3px}
.lifeos-dash .m .mstrip span{display:flex;align-items:center;padding:0 8px;font-size:12.5px;color:#303a33;min-width:0;overflow:hidden;white-space:nowrap}`;

const root = M.mount(dv, html, STYLE);
root.querySelectorAll(".three input").forEach((inp) => inp.addEventListener("change", () => D.setGoal(note.file.path, +inp.dataset.i, inp.value.trim())));
root.querySelector(".save").addEventListener("click", async (e) => {
  const b = e.currentTarget;
  await L.setMeta(note.file.path, "goals_on_home", true);
  b.textContent = "已放进首页待办"; b.disabled = true;
  root.querySelector(".three").classList.add("pinned");
});
root.querySelectorAll(".dot").forEach((d) => d.addEventListener("click", async () => {
  const on = d.classList.toggle("on");
  if (on) L.stamp(d);
  await D.setHabit(d.dataset.d, d.dataset.h, on);
}));
