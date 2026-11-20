// 所有部门：每个方块链到对应的手机页面，最下面是加密的个人档案。布局照 demo/v4/mobile-more.html。
// 这里不读 60 个人档案里的任何东西，只放一个链接（Meld Encrypt 打开时会要密码）。
const L = eval(await dv.io.load("90 系统/views/_shared/lib.js"));
const D = eval(await dv.io.load("90 系统/views/_shared/data.js"))(L, dv);
const M = eval(await dv.io.load("90 系统/views/_shared/m.js"))(L);
const esc = L.esc, T = D.T;

// ---------- 每个部门一句话 ----------
const cards = await L.cards(dv);
const toSort = cards.filter((c) => c.type === "灵感" || c.type === "链接").length; // 「整理随手记」会挪走的
const reviews = D.reviews();
const lastW = L.isoWeek(L.addDays(T, -7));
const last = reviews.find((r) => String(r.week) === lastW) ? await D.reviewStats(lastW, reviews) : null;
const month = await L.ledger(dv, T.slice(0, 7));
const spent = month.reduce((a, e) => a + e.amount, 0);
const budget = Number((dv.page(`20 财务部/账本/${T.slice(0, 7)}`) || {}).budget) || 1400;
const unsorted = month.filter((e) => e.category === "待分类").length;
const [dollars, cents] = spent.toFixed(2).split(".");
const cold = (await D.food()).filter((f) => f.place === "冷藏");
const soon = cold.find((f) => f.left !== null && f.left <= 2);
const things = D.things();
const soonWarranty = things.filter((i) => i.warranty && L.daysLeft(i.warranty, T) >= 0 && L.daysLeft(i.warranty, T) <= 60).length;
const kcards = dv.pages('"40 研发部/知识卡"').array();
const newCards = kcards.filter((p) => L.iso(p.created) >= L.mondayOf(T)).length;
const words = await D.wordCards(D.WORDS);
const streak = D.streak();
const sun = L.addDays(L.mondayOf(T), 6);
const dls = (await D.deadlines()).filter((d) => !d.done && d.due && d.due.slice(0, 10) >= T);
const thisWeek = dls.filter((d) => d.due.slice(0, 10) <= sun);
const nextDl = dls.sort((a, b) => a.due.localeCompare(b.due))[0];
const jobs = D.jobs();
const nextIv = D.interviews().find((i) => i.date.slice(0, 10) >= T);
const when = (d) => { const n = L.daysLeft(d.slice(0, 10), T); return n === 0 ? `今天 ${d.slice(11, 16)}` : n === 1 ? `明天 ${d.slice(11, 16)}` : n < 7 ? `${L.WEEK_CN[L.weekday(d)]} ${d.slice(11, 16)}` : L.md(d); };

const TILES = [
  { no: "00", name: "随手记", to: "10 总部/手机/随手记", cls: "wide", bg: "var(--m-blue)", text: `${cards.length} 条${toSort ? ` · 还没整理 <em>${toSort}</em>` : ""}` },
  { no: "10", name: "每周复盘", to: "10 总部/手机/每周复盘", cls: "tall", bg: "#fff", art: ["peony.png", "right:-14px;top:-8px;width:96px"],
    text: `Week ${+L.isoWeek(T).slice(6)}${last && last.total ? `<br>上周完成度 ${Math.round(last.done / last.total * 100)}%` : ""}` },
  { no: "20", name: "财务部", to: "20 财务部/财务面板", cls: "tall", bg: "var(--yellow)", big: `$${Number(dollars).toLocaleString("en-US")}<span>.${cents}</span>`,
    text: `还剩 ${L.money(budget - spent)}${unsorted ? `<br><em>${unsorted} 笔待分类</em>` : ""}` },
  { no: "30", name: "食物墙", to: "10 总部/手机/冰箱", bg: "#fff", art: ["eggs.png", "right:10px;top:12px;width:70px"],
    text: `冷藏 ${cold.length} 样${soon ? `<br><em>${esc(soon.name)}${L.leftLabel(soon.left)}</em>` : ""}` },
  { no: "31", name: "物品墙", to: "10 总部/手机/物品墙", bg: "var(--blue)", text: `${things.length} 件${soonWarranty ? ` · ${soonWarranty} 件保修快到期` : ""}` },
  { no: "40", name: "知识库", to: "10 总部/手机/知识库", bg: "var(--beige)", text: `${kcards.length} 张${newCards ? ` · 本周新增 <em>${newCards}</em>` : ""}` },
  { no: "41", name: "多邻国", to: "10 总部/手机/多邻国", bg: "var(--tint)", art: ["notepaper.png", "right:-30px;top:-26px;width:92px;transform:rotate(10deg);opacity:.9"],
    text: `连续 ${streak} 天<br>单词本 ${words.length} 个` },
  { no: "45", name: "教务处", to: "10 总部/手机/教务处", bg: "var(--purple)",
    text: `本周 ${thisWeek.length} 个截止${nextDl ? `<br><em>${esc(nextDl.title.replace(nextDl.course, "").trim() || nextDl.title)} ${L.daysLeft(nextDl.due.slice(0, 10), T) === 0 ? "今晚" : L.md(nextDl.due)}</em>` : ""}` },
  { no: "50", name: "人事部", to: "10 总部/手机/人事部", bg: "var(--pink)", art: ["butterfly.png", "right:-22px;top:-20px;width:96px"],
    text: `面试中 ${jobs.filter((j) => j.stage === "面试中").length}${nextIv ? `<br>${when(nextIv.date)}` : ""}` },
];
const PRIVATE = { name: "个人档案", to: "60 个人档案/个人档案" };
const LOCK = '<svg width="20" height="22" viewBox="0 0 20 22" aria-hidden="true"><rect x="2.5" y="9" width="15" height="11" rx="3" fill="none" stroke="#4f5c52" stroke-width="1.7"/><path d="M6 9V6.5a4 4 0 0 1 8 0V9" fill="none" stroke="#4f5c52" stroke-width="1.7"/></svg>';

const tile = (t) => L.link(t.to, `${t.art ? `<img src="${L.art(t.art[0])}" alt="" style="${t.art[1]}">` : ""}<span class="no">${t.no}</span>${t.big ? `<div class="bigsum num">${t.big}</div>` : ""}<h2 class="h">${t.name}</h2><p>${t.text}</p>`,
  `tile2 ${t.cls || ""}`, `style="background:${t.bg}" data-q="${esc(t.name)}"`);

const html = M.head({ title: "所有部门", back: M.HOME }) + `
<div class="tiles">${TILES.map(tile).join("")}</div>
<div class="sec2">加密</div>
${L.link(PRIVATE.to, `<span class="ic">${LOCK}</span><div><h2 class="h">${PRIVATE.name}</h2></div>`, 'tile2 wide lock', 'data-q="个人档案"')}`;

const STYLE = `
.lifeos-dash .m .tiles{display:grid;grid-template-columns:1fr 1fr;gap:var(--gap)}
.lifeos-dash .m .tile2{border-radius:var(--r-card);padding:16px;min-height:148px;position:relative;overflow:hidden;box-shadow:var(--shadow);display:flex;flex-direction:column;transition:transform .3s cubic-bezier(.2,.8,.2,1)}
.lifeos-dash .m .tile2:active{transform:scale(.98)}
.lifeos-dash .m .tile2.wide{grid-column:1/-1;min-height:118px}
.lifeos-dash .m .tile2.tall{min-height:200px}
.lifeos-dash .m .tile2 .no{font-size:12px;font-weight:500;color:var(--muted);letter-spacing:.02em}
.lifeos-dash .m .tile2 h2{font-size:20px;line-height:1.2;margin-top:auto}
.lifeos-dash .m .tile2 p{font-size:12.5px;color:var(--ink-2);margin-top:4px;line-height:1.45}
.lifeos-dash .m .tile2 p em{font-style:normal;color:var(--warn)}
.lifeos-dash .m .tile2 .bigsum{font-size:34px;line-height:1;margin-top:10px}
.lifeos-dash .m .tile2 .bigsum span{font-size:20px}
.lifeos-dash .m .tile2 img{position:absolute;pointer-events:none;filter:drop-shadow(0 3px 5px rgba(46,42,39,.12))}
.lifeos-dash .m .lock{background:var(--apricot);flex-direction:row;align-items:center;gap:14px;min-height:0}
.lifeos-dash .m .lock .ic{width:46px;height:46px;border-radius:16px;background:rgba(255,255,255,.7);display:grid;place-items:center;flex:none}
.lifeos-dash .m .lock h2{margin-top:0;font-size:17px}
.lifeos-dash .m .sec2{margin:22px 4px 10px;font-size:13px;font-weight:500;color:var(--muted)}`;

M.mount(dv, html, STYLE, { search: "找部门…" });
