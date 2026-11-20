// 手机 · 知识库：开始复习 + 分类方块 + 知识卡列表。布局照 demo/v4/mobile-notes.html。
const L = eval(await dv.io.load("90 系统/views/_shared/lib.js"));
const D = eval(await dv.io.load("90 系统/views/_shared/data.js"))(L, dv);
const M = eval(await dv.io.load("90 系统/views/_shared/m.js"))(L);
const esc = L.esc;
const CAT_BG = { 生活小知识: "var(--beige)", 体态: "var(--sage)", 变美: "var(--pink)", 多伦多生活: "var(--blue)", 回国吃喝玩乐: "var(--yellow)", 学习: "var(--purple)", 求职: "var(--apricot)" };

const cards = await D.notes("40 研发部/知识卡");
const newThisWeek = cards.filter((c) => c.date >= L.mondayOf(D.T)).length;

const html = M.head({ title: "知识库", sub: `${cards.length} 张${newThisWeek ? ` · 本周新增 ${newThisWeek} 张` : ""}` }) + `
<button class="review-btn">开始复习</button>
<div class="cats" role="group" aria-label="分类">${L.NOTE_CATEGORIES.map((c) => `<button class="cat" aria-pressed="false" data-c="${c}" style="background:${CAT_BG[c]}"><span>${c}</span><b class="num">${cards.filter((k) => k.category === c).length}</b></button>`).join("")}</div>
<div class="kc">${cards.map((k) => `<article class="card k" data-c="${esc(k.category)}" data-q="${esc(k.name + " " + k.body)}">${L.link(k.path, `<b>${esc(k.name)}</b>`)}<p>${esc(k.body.split("\n")[0])}</p><span class="meta">${k.source ? `<span class="chip soft">${esc(k.source)}</span>` : ""}${esc(k.category)}</span></article>`).join("")}</div>`;

const STYLE = `
.lifeos-dash .m .review-btn{width:100%;height:50px;border-radius:999px;background:var(--green);color:#fff;font-size:15px;font-weight:600;margin-bottom:14px;box-shadow:0 8px 20px rgba(47,70,57,.22)}
.lifeos-dash .m .cats{display:flex;gap:8px;overflow-x:auto;margin:0 -16px 14px;padding:2px 16px 4px;scrollbar-width:none}
.lifeos-dash .m .cats::-webkit-scrollbar{display:none}
.lifeos-dash .m .cat{flex:none;width:96px;height:84px;border-radius:20px;padding:10px 12px;display:flex;flex-direction:column;justify-content:space-between;text-align:left;font-size:13px;font-weight:500;color:var(--ink);border:2px solid transparent}
.lifeos-dash .m .cat .num{font-size:24px;color:var(--green)}
.lifeos-dash .m .cat[aria-pressed="true"]{border-color:var(--green)}
.lifeos-dash .m .kc{display:flex;flex-direction:column;gap:10px}
.lifeos-dash .m .k b{display:block;font-size:16px;font-weight:600;letter-spacing:-.02em}
.lifeos-dash .m .k p{font-size:13.5px;color:var(--ink-2);line-height:1.55;margin:6px 0 10px}
.lifeos-dash .m .k .meta{display:flex;align-items:center;gap:10px;font-size:12px;color:var(--muted)}`;

const root = M.mount(dv, html, STYLE, { search: "搜索知识…" });
root.querySelector(".review-btn").addEventListener("click", () => D.startReview(cards.length ? cards[Math.floor(Math.random() * cards.length)].path : null));
root.querySelectorAll(".cat").forEach((c) => c.addEventListener("click", () => {
  const on = c.getAttribute("aria-pressed") !== "true";
  root.querySelectorAll(".cat").forEach((x) => x.setAttribute("aria-pressed", on && x === c));
  root.querySelectorAll(".k").forEach((k) => { k.hidden = on && k.dataset.c !== c.dataset.c; });
}));
