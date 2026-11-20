// 手机首页：一面卡片墙，只「记和查」。布局照 demo/v4/mobile-home.html。
// 右上圆按钮 → 所有部门；底部「我想记…」→ 随手记；「+」→ 记一笔 / 放进冰箱。
const L = eval(await dv.io.load("90 系统/views/_shared/lib.js"));
const D = eval(await dv.io.load("90 系统/views/_shared/data.js"))(L, dv);
const M = eval(await dv.io.load("90 系统/views/_shared/m.js"))(L);
const { foodIcon } = eval(await dv.io.load("90 系统/views/_shared/food.js"));
const esc = L.esc, T = D.T;
const GRID = '<svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true"><g fill="#252d29"><circle cx="5" cy="5" r="3.2"/><circle cx="15" cy="5" r="3.2"/><circle cx="5" cy="15" r="3.2"/><circle cx="15" cy="15" r="3.2"/></g></svg>';
const DOTS = '<svg width="14" height="4" viewBox="0 0 14 4" aria-hidden="true"><g fill="currentColor"><circle cx="2" cy="2" r="1.6"/><circle cx="7" cy="2" r="1.6"/><circle cx="12" cy="2" r="1.6"/></g></svg>';

const todos = await D.todos();
const projects = D.projects();
const shop = await D.shopping();
const food = await D.food();
const cold = food.filter((f) => f.place === "冷藏");
const money = await D.weekSpend();
const words = await D.wordCards(D.WORDS);
const word = D.wordOfDay(words);
const studiedToday = (D.diaries().get(T) || {})["背词"] === true;
const allCards = await L.cards(dv);
const events = L.upcomingEvents(allCards, T);
const rem = L.reminders(allCards)[0];

function spark() {
  const max = Math.max(...money.perDay, 1), ti = money.days.indexOf(T);
  const pts = money.perDay.map((v, i) => [2 + i * 24.3, 40 - (v / max) * 32]);
  const d = pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ");
  const dot = pts[ti] ? `<circle cx="${pts[ti][0]}" cy="${pts[ti][1]}" r="3.5" fill="#a15c46"/>` : "";
  return `<svg viewBox="0 0 150 46" width="100%" height="46" aria-hidden="true"><path d="${d}" fill="none" stroke="#8fa98a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>${dot}</svg>`;
}
const [dollars, cents] = money.spent.toFixed(2).split(".");
const left = money.weekBudget - money.spent;
const fridgeTop = cold.slice(0, 6);

const html = `
<header class="top"><span class="brand">my little <b>os.</b></span>${L.link(M.MORE, GRID, "round big")}</header>
<section class="hello" aria-label="今天">${M.tape("#f8dcd8", "top:-9px;right:96px;rotate:4deg")}
  <img class="blossom" src="${L.art("blossom.png")}" alt=""><img class="catplant" src="${L.art("cat-plant.png")}" alt="">
  <h1 class="h">Hi Charlotte 👋</h1>
  <p class="cal" aria-label="${+T.slice(5, 7)} 月 ${+T.slice(8)} 日 ${L.WEEK_CN[L.weekday(T)]}"><span class="d">${+T.slice(8)}</span><span class="m2"><b>${L.MONTH_EN[+T.slice(5, 7) - 1].slice(0, 3)}</b>${["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"][L.weekday(T)]}</span></p>
</section>
<main class="grid">
  <section class="card todo" aria-label="今日待办">
    <div class="label"><span>今日待办 <span class="count">${todos.filter((t) => !t.done).length}</span></span></div>
    <ul>${todos.slice(0, 5).map((t, i) => `<li data-i="${i}" class="${t.done ? "done" : ""}"><button class="ck" aria-label="完成">${L.CK}</button><div class="t"><span>${esc(t.text)}</span><small class="${t.warn ? "warn" : ""}">${esc(t.tag)}</small></div></li>`).join("") || '<li class="sub">今天没有待办</li>'}</ul>
  </section>
  <section class="card shop" aria-label="购物清单">
    <div class="label"><span>购物清单 <span class="count">${shop.filter((s) => !s.done).length}</span></span></div>
    <ul>${shop.slice(0, 5).map((s, i) => `<li data-i="${i}" class="${s.done ? "done" : ""}"><button class="ck" aria-label="买到了">${L.CK}</button><div class="t"><span>${esc(s.text)}</span></div></li>`).join("") || '<li class="sub">都买齐了</li>'}</ul>
    <img class="shop-pic" src="${L.art("eggs.png")}" alt="">
  </section>
  ${projects.length ? `<section class="card wide prog" aria-label="事情进度"><div class="label"><span>事情进度</span></div><ul>${projects.map((p) => `<li class="${p.progress ? "" : "idle"}">${L.link(p.path, esc(p.title), "name")}<span class="track"><span style="width:${p.progress}%"></span></span><span class="pct">${p.progress ? p.progress + "%" : "未开始"}</span></li>`).join("")}</ul></section>` : ""}
  ${rem ? `<section class="card rem" aria-label="Reminder">
    <div class="label"><span>Reminder</span></div>
    <div class="rt">${L.link(rem.path, `<span class="h">${esc(rem.title)}</span>`)}<span class="count">${rem.tasks.length - rem.open} / ${rem.tasks.length}</span></div>
    <div class="bar"><span style="width:${Math.round((rem.tasks.length - rem.open) / rem.tasks.length * 100)}%"></span></div>
    <ul>${rem.tasks.slice(0, 3).map((t, i) => `<li data-i="${i}" class="${t.done ? "done" : ""}"><button class="ck" aria-label="完成">${L.CK}</button><span class="t">${esc(t.text)}</span></li>`).join("")}</ul>
    ${rem.tasks.length > 3 ? `<p class="sub" style="margin-top:4px">还有 ${rem.tasks.length - 3} 项</p>` : ""}
    <img class="fold" src="${L.art("home-sticker.png")}" alt="">
  </section>` : ""}
  <section class="card spend${rem ? "" : " wide"}" aria-label="本周花费">
    <div class="label"><span>本周花费</span><span class="count">${left >= 0 ? `还剩 ${L.money(left)}` : `超出 ${L.money(-left)}`}</span></div>
    ${L.link("20 财务部/财务面板/本周", `<div class="amt num">$${Number(dollars).toLocaleString("en-US")}<small>.${cents}</small></div>`)}
    ${spark()}
  </section>
  ${events.length ? `<section class="card wide events" aria-label="最近的活动">
    <div class="label"><span>最近的活动</span>${L.link(M.DIR + "随手记", DOTS, "mini")}</div>
    <div class="evs">${events.map((e) => `<div class="ev">${L.link(e.path, `<div class="date"><div class="num">${L.md(e.date)}</div><small>${L.WEEK_CN[L.weekday(e.date)]}</small></div>`)}<div><b>${esc(e.title)}</b><span>${esc([e.source, (e.body.split("\n")[0] || "").split("·")[0].trim()].filter(Boolean).join(" · "))}</span></div></div>`).join("")}</div>
  </section>` : ""}
  ${word ? `<section class="card wide word" aria-label="今日单词">${M.tape("#fef0c4", "top:-8px;left:22px;rotate:-6deg")}
    <img src="${L.art("notepaper.png")}" alt="">
    <div class="copy"><div class="sub">今日单词</div><div class="w">${esc(word.front)}</div><div class="mean">${esc(word.back)}</div></div>
    <div class="foot"><span>${studiedToday ? "今天背过了" : `单词本 ${words.length} 个`}</span>${L.link(M.DIR + "多邻国", "多邻国 →")}</div>
  </section>` : ""}
</main>
<div class="sec"><span class="h">冰箱里</span>${L.link(M.FRIDGE, `全部 ${food.length} 样 →`)}</div>
<div class="strip">${fridgeTop.map((f) => `<div class="food">${L.link(M.FRIDGE, `<div class="pic">${foodIcon(f.name, 66)}</div><b>${esc(f.name)}</b>`)}<span class="days ${f.left !== null && f.left <= 1 ? "warn" : ""}">${f.left === null ? "常备" : f.left <= 1 ? L.leftLabel(f.left) : `${f.left} 天`}</span></div>`).join("") || '<p class="sub">冰箱空了</p>'}</div>`;

const STYLE = `
.lifeos-dash .m .top{display:flex;justify-content:space-between;align-items:center;padding:4px 4px 14px}
.lifeos-dash .m .round.big{width:52px;height:52px}
.lifeos-dash .m .hello{position:relative;background:#fff;border-radius:var(--r-card);box-shadow:var(--shadow);padding:122px 20px 22px;margin-bottom:var(--gap);min-height:232px}
.lifeos-dash .m .hello .blossom{position:absolute;left:-8px;top:-6px;width:84px;transform:rotate(180deg);pointer-events:none;filter:var(--sh-sticker)}
.lifeos-dash .m .hello .catplant{position:absolute;right:-6px;bottom:-4px;width:124px;pointer-events:none;filter:var(--sh-sticker)}
.lifeos-dash .m .hello h1{font-size:26px;line-height:1.15;max-width:calc(100% - 118px)}
.lifeos-dash .m .hello .cal{display:flex;align-items:center;gap:10px;margin-top:10px}
.lifeos-dash .m .hello .cal .d{font-size:46px;font-weight:600;line-height:.9;letter-spacing:-.04em;color:var(--green);font-variant-numeric:tabular-nums}
.lifeos-dash .m .hello .cal .m2{display:flex;flex-direction:column;gap:2px;font-size:13px;line-height:1.15;color:var(--ink-2)}
.lifeos-dash .m .hello .cal .m2 b{font-weight:600;color:var(--ink);font-size:14px}
.lifeos-dash .m .grid{display:grid;grid-template-columns:1fr 1fr;gap:var(--gap)}
.lifeos-dash .m .grid>.card{min-height:170px}
.lifeos-dash .m .grid>.wide{grid-column:1/-1;min-height:0}
.lifeos-dash .m ul{list-style:none;margin:0;padding:0}
.lifeos-dash .m .todo{background:var(--sage)}
.lifeos-dash .m .todo li{display:flex;align-items:center;gap:9px;font-size:14px;padding:5px 0;line-height:1.35}
.lifeos-dash .m .todo li .t{flex:1;min-width:0}
.lifeos-dash .m .todo li small{display:block;font-size:12px;color:var(--muted)}
.lifeos-dash .m .todo li small.warn{color:var(--warn)}
.lifeos-dash .m .shop{background:var(--pink)}
.lifeos-dash .m .shop ul{position:relative;z-index:1}
.lifeos-dash .m .shop li{display:flex;align-items:center;gap:9px;font-size:14px;padding:4px 0}
.lifeos-dash .m .shop li .ck,.lifeos-dash .m .rem li .ck{width:18px;height:18px}
.lifeos-dash .m .shop li .ck svg,.lifeos-dash .m .rem li .ck svg{width:9px}
.lifeos-dash .m .shop-pic{position:absolute;right:-14px;bottom:-12px;width:84px;transform:rotate(-8deg);opacity:.95;pointer-events:none}
.lifeos-dash .m .prog li{display:grid;grid-template-columns:8.6em 1fr 3.2em;align-items:center;gap:12px;padding:7px 0;font-size:14px}
.lifeos-dash .m .prog .name{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.lifeos-dash .m .prog .track{height:6px;border-radius:3px;background:var(--sage);overflow:hidden}
.lifeos-dash .m .prog .track span{display:block;height:100%;border-radius:3px;background:var(--done)}
.lifeos-dash .m .prog .pct{text-align:right;font-size:12.5px;font-weight:500;color:var(--ink-2);font-variant-numeric:tabular-nums}
.lifeos-dash .m .prog .idle .pct{color:var(--muted);font-weight:400}
.lifeos-dash .m .rem{background:var(--m-blue);min-height:236px}
.lifeos-dash .m .rem .rt{display:flex;justify-content:space-between;align-items:baseline;gap:6px}
.lifeos-dash .m .rem .rt .h{font-size:20px;line-height:1.2}
.lifeos-dash .m .rem .bar{height:6px;background:rgba(169,180,164,.3);margin:10px 0 8px}
.lifeos-dash .m .rem li{display:flex;align-items:center;gap:7px;padding:3px 0;font-size:13px;position:relative;z-index:1}
.lifeos-dash .m .rem .fold{position:absolute;right:-30px;bottom:-26px;width:150px;transform:rotate(-8deg);opacity:.95;pointer-events:none}
.lifeos-dash .m .spend{display:flex;flex-direction:column;min-height:200px}
.lifeos-dash .m .spend .amt{font-size:40px;color:var(--green);line-height:1;margin-top:4px;font-family:var(--sans)}
.lifeos-dash .m .spend .amt small{font-size:22px}
.lifeos-dash .m .spend svg{margin-top:auto}
.lifeos-dash .m .events{background:var(--m-yellow)}
.lifeos-dash .m .mini{width:30px;height:30px;border-radius:50%;background:rgba(255,255,255,.75);display:grid;place-items:center;color:var(--ink-2)}
.lifeos-dash .m .evs{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
.lifeos-dash .m .ev{display:flex;flex-direction:column;gap:8px;min-width:0}
.lifeos-dash .m .ev .date{min-width:56px;width:max-content;text-align:center;background:rgba(255,255,255,.75);border-radius:14px;padding:6px 8px 5px;border:1.5px solid rgba(127,79,60,.3)}
.lifeos-dash .m .ev .date .num{font-size:16px;color:var(--brown);line-height:1}
.lifeos-dash .m .ev .date small{display:block;font-size:11px;color:var(--muted);margin-top:2px}
.lifeos-dash .m .ev b{display:block;font-weight:500;font-size:13.5px;line-height:1.3}
.lifeos-dash .m .ev span{font-size:12px;color:var(--muted)}
.lifeos-dash .m .word{background:var(--tint);min-height:168px;display:flex;flex-direction:column;justify-content:flex-end;overflow:visible}
.lifeos-dash .m .word img{position:absolute;right:-18px;top:-30px;width:150px;transform:rotate(10deg);opacity:.95;pointer-events:none}
.lifeos-dash .m .word .copy,.lifeos-dash .m .word .foot{max-width:62%}
.lifeos-dash .m .word .w{font-weight:600;font-size:24px;line-height:1.1;letter-spacing:-.02em}
.lifeos-dash .m .word .mean{font-size:13px;color:var(--ink-2);margin-top:6px}
.lifeos-dash .m .word .foot{display:flex;justify-content:space-between;align-items:center;margin-top:12px;font-size:12px;color:var(--muted)}
.lifeos-dash .m .hello{overflow:visible}
.lifeos-dash .m .strip{display:flex;gap:10px;overflow-x:auto;margin:0 -16px;padding:2px 16px 4px;scrollbar-width:none}
.lifeos-dash .m .strip::-webkit-scrollbar{display:none}
.lifeos-dash .m .food{flex:none;width:112px;border-radius:22px;background:var(--card);padding:12px;box-shadow:var(--shadow)}
.lifeos-dash .m .food .pic{height:70px;display:grid;place-items:center}
.lifeos-dash .m .food b{display:block;font-weight:600;font-size:15px;margin-top:6px;letter-spacing:-.02em}
.lifeos-dash .m .food .days{display:inline-block;margin-top:4px;font-size:12px;padding:2px 8px;border-radius:999px;background:var(--sage);color:var(--green)}
.lifeos-dash .m .food .days.warn{background:var(--pink);color:var(--warn)}`;

const root = M.mount(dv, html, STYLE);

root.querySelectorAll(".todo li[data-i]").forEach((li) => li.querySelector(".ck").addEventListener("click", async () => {
  const done = li.classList.toggle("done");
  if (done) L.stamp(li.querySelector(".ck"));
  await D.toggleTodo(todos[+li.dataset.i], done);
}));
root.querySelectorAll(".shop li[data-i]").forEach((li) => li.querySelector(".ck").addEventListener("click", async () => {
  if (li.classList.toggle("done")) L.stamp(li.querySelector(".ck"));
  await L.toggleTaskAt(D.SHOP, shop[+li.dataset.i].line);
}));
root.querySelectorAll(".rem li[data-i]").forEach((li) => li.querySelector(".ck").addEventListener("click", async () => {
  if (li.classList.toggle("done")) L.stamp(li.querySelector(".ck"));
  await L.toggleTaskAt(rem.path, rem.tasks[+li.dataset.i].line);
}));
