// 首页：只汇总，不录入。布局照 demo/v4/desktop-home.html。
const L = eval(await dv.io.load("90 系统/views/_shared/lib.js"));
const D = eval(await dv.io.load("90 系统/views/_shared/data.js"))(L, dv);
const { foodIcon } = eval(await dv.io.load("90 系统/views/_shared/food.js"));
const T = L.today();
const mon = L.mondayOf(T);
const week = [...Array(7)].map((_, i) => L.addDays(mon, i));
const esc = L.esc;

// ---------- 数据 ----------
const DL_PATH = D.DL;
const deadlines = await D.deadlines();
const projects = D.projects();
const interviews = D.interviews().map((i) => ({ title: i.title, when: i.date, path: i.path }));
let myEvents = await D.events(); // 10 总部/日程.md
const todos = L.doneLast(await D.todos()); // 没做的在前、做完的在后（只改显示顺序）

const { perDay: weekSpend, spent } = await D.weekSpend();

const food = await D.food();
const cold = food.filter((f) => f.place === "冷藏").sort((a, b) => (a.expires || "9999").localeCompare(b.expires || "9999"));

const dmap = D.diaries();
const studied = new Set([...dmap].filter(([, p]) => p["背词"] === true).map(([d]) => d));
const streak = D.streak(dmap);

const words = (await D.wordCards(D.WORDS)).map((w) => [w.front, w.back]);
const word = words.length ? D.wordOfDay(words) : null;

const allCards = await L.cards(dv);
const events = allCards.filter((c) => c.type === "活动" && c.date && c.date >= T).sort((a, b) => a.date.localeCompare(b.date)); // 全部未来活动，卡片里滑着看
const rem = L.reminders(allCards);

const courses = dv.pages('"45 教务处/课程"').where((p) => p.next_class).array()
  .map((p) => ({ code: p.course || p.file.folder.split("/").pop(), when: String(p.next_class) }));

// ---------- 日程（仿苹果日历周视图，可以翻周） ----------
let offset = 0; // 0 = 本周；只记在内存里，重新打开回到本周
const daysOf = (off) => [...Array(7)].map((_, i) => L.addDays(mon, off * 7 + i));
const hm2h = (hm) => +hm.slice(0, 2) + +hm.slice(3, 5) / 60;
function weekCal(days) {
  const allDay = days.map(() => []);
  const timed = [];
  const at = (d) => days.indexOf(d);
  deadlines.filter((d) => d.due && days.includes(d.due.slice(0, 10)))
    .forEach((d) => allDay[at(d.due.slice(0, 10))].push({ c: "r1", t: `${d.title.replace(d.course, "").trim() || d.title} 截止` }));
  allCards.filter((c) => c.type === "活动" && days.includes(c.date)).forEach((c) => allDay[at(c.date)].push({ c: "g1", t: c.title }));
  myEvents.filter((e) => days.includes(e.date)).forEach((e) => {
    if (e.time) timed.push({ d: at(e.date), h: hm2h(e.time), c: "y1 mine", t: `${esc(e.title)}<br>${e.time}` });
    else allDay[at(e.date)].push({ c: "y1 mine", t: e.title });
  });
  if (days.includes(T)) allDay[6].push({ c: "p1", t: "周复盘" });
  courses.forEach((c) => {
    const m = /周([一二三四五六日])\s*(\d{1,2}):(\d{2})/.exec(c.when);
    if (m) timed.push({ d: "一二三四五六日".indexOf(m[1]), h: +m[2] + +m[3] / 60, c: "b1", t: `${esc(c.code)}<br>${m[2]}:${m[3]}` });
  });
  interviews.forEach((i) => {
    const d = at(i.when.slice(0, 10)), hm = i.when.slice(11, 16);
    if (d >= 0 && hm) timed.push({ d, h: hm2h(hm), c: "r1", t: `面试<br>${hm}` });
  });
  const ti = at(T);
  let h = "<div></div>" + days.map((d, i) => `<div class="dh ${i === ti ? "today" : ""} ${i > 4 ? "wkend" : ""}">${L.WEEK_CN[i]}${i === ti ? " · Today" : ""}<b>${+d.slice(8)}</b></div>`).join("");
  h += `<div class="allday"><span class="lb">全天</span>${allDay.map((evs) => `<div>${evs.map((e) => `<span class="ev ${e.c}">${esc(e.t)}</span>`).join("")}</div>`).join("")}</div>`;
  h += `<div class="hours">${["09:00", "11:00", "13:00", "15:00", "17:00", "19:00"].map((t) => `<span class="hl">${t}</span>` + '<span class="cell"></span>'.repeat(7)).join("")}`;
  // 9 点前、21 点后的放在最上 / 最下一格，不让它消失
  h += timed.map((e) => `<span class="ev ${e.c}" style="left:calc(40px + (100% - 40px) / 7 * ${e.d} + 3px);width:calc((100% - 40px) / 7 - 6px);top:${(Math.min(Math.max(e.h, 9), 20) - 9) / 2 * 36}px;height:38px;margin:0">${e.t}</span>`).join("");
  return h + "</div>";
}

// 本周花费小折线
function spark() {
  const max = Math.max(...weekSpend, 1), ti = week.indexOf(T);
  const pts = weekSpend.map((v, i) => [2 + i * 29.3, 40 - (v / max) * 32]);
  const d = pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ");
  const dot = pts[ti] ? `<circle cx="${pts[ti][0]}" cy="${pts[ti][1]}" r="3" fill="#a15c46"/>` : "";
  return `<svg width="180" height="44" viewBox="0 0 180 44" aria-hidden="true"><path d="${d}" fill="none" stroke="#8fa98a" stroke-width="1.6" stroke-linejoin="round"/>${dot}</svg>`;
}

const dateLong = `${L.MONTH_EN[+T.slice(5, 7) - 1].slice(0, 3)} <span class="g">${+T.slice(8)}</span> · ${["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"][L.weekday(T)]}`;
const left = todos.filter((t) => !t.done && t.kind !== "ev").length;
// 事情进度一行；新事情的类别（存英文，首页待办右边显示）
const AREAS = [["school", "学校"], ["career", "求职"], ["money", "钱"], ["english", "英语"], ["errands", "杂事"], ["life", "生活"]];
const projRow = (p) => `<li>${L.link(p.path, esc(p.title))}<span class="bar"><span style="width:${p.progress}%"></span></span><span class="p ${p.progress ? "" : "muted"}">${p.progress ? p.progress + "%" : "未开始"}</span></li>`;
// Fridge 一格
function foodTile(f, i) {
  const n = f.expires ? L.daysLeft(f.expires, T) : null;
  return `<div class="tile food" data-f="${i}"><h3>${esc(f.name)}</h3><small>${esc(f.qty)}</small><div class="left"><button class="ck" aria-label="吃完" title="吃完" ${n !== null && n <= 1 ? 'style="border-color:var(--warn)"' : ""}>${L.CK}</button><span class="${n !== null && n <= 1 ? "warn" : ""}">${n === null ? "—" : L.leftLabel(n)}</span></div><div class="pic">${foodIcon(f.name, 96)}</div></div>`;
}
const actRow = (e) => `<div class="act">${L.link(e.path, `<div class="date date-stamp"><span class="g">${L.md(e.date)}</span><small>${L.WEEK_CN[L.weekday(e.date)]}</small></div>`)}<div><b>${esc(e.title)}</b><span>${esc([e.source, (e.body.split("\n")[0] || "").split("·")[0].trim()].filter(Boolean).join(" · "))}</span></div></div>`;
// 一行待办；日程（kind === "ev"）用圆点，不能勾
const todoLi = (t, i) => `<li data-i="${i}" class="${t.done ? "done" : ""}${t.kind === "ev" ? " ev-row" : ""}">${t.kind === "ev" ? '<span class="dot" aria-hidden="true"></span>' : `<button class="ck" aria-label="完成">${L.CK}</button>`}<span class="t">${esc(t.text)}</span><small class="${t.warn ? "warn" : ""}">${esc(t.tag)}</small></li>`;

const html = `
<div class="topbar"><span></span><form class="find capture"><button type="button" class="sw" aria-pressed="false" title="打开后存成今日待办">待办</button><input placeholder="我想记…" aria-label="记进随手记"><span class="ok">已存进随手记</span></form></div>
<section class="hero" aria-label="今天">
  <img class="art" src="${L.art("home-flowercat-trim.png")}" alt="" style="left:0;top:-80px;width:149px">
  <img class="art" src="${L.art("home-lantern-trim.png")}" alt="" style="right:0;top:-58px;width:184px">
  <h1>Hi Charlotte 👋</h1>
  <p>Today is · ${dateLong}</p>
</section>
<div class="r1">
  <section class="card todo" style="padding:22px 22px 18px">
    <div class="head" style="margin-bottom:6px"><h2 style="font-size:26px">今日待办</h2><button class="add" aria-label="加一条待办" aria-expanded="false">＋</button></div>
    <ul class="list">${todos.map(todoLi).join("")}</ul>
    <form class="addtodo" hidden><input placeholder="加一条待办…" aria-label="待办内容" enterkeyhint="done"></form>
  </section>
  <section class="card cal" aria-label="本周日程">
    <div class="top"><h2>本周日程</h2><button class="nav" aria-label="上一周">‹</button><span class="wl">${L.weekLabel(mon)}</span><button class="nav" aria-label="下一周">›</button><button class="back" hidden>回到本周</button><button class="add" aria-label="加日程" aria-expanded="false">＋</button></div>
    <form class="addf evf" hidden aria-label="加日程">
      <input name="d" type="date" aria-label="日期" required><input name="t" type="time" aria-label="时间（空着就是全天）">
      <input name="n" placeholder="做什么" aria-label="事情" required><input name="p" placeholder="地点" aria-label="地点">
      <button class="go">加上</button></form>
    <div class="week">${weekCal(week)}</div>
  </section>
</div>
<section class="ov" aria-label="今日概览">
  <div class="left">
    <div class="stats">
      <div class="stat tile" style="border-radius:0 0 18px 0;border-top:0;border-left:0"><small>Tasks left</small><span class="g">${left}</span></div>
      <div class="stat tile"><small>Day streak</small><span class="g">${streak}</span></div>
      <div class="stat tile"><small>In the fridge</small><span class="g">${cold.length}</span></div>
      <button class="rec" aria-label="记一笔">记一笔</button>
    </div>
    <div class="spend tile" style="margin-left:0;border-radius:0 18px 0 0;border-left:0;border-bottom:0">
      <div><small>Spent this week</small><span class="g">${L.money(spent)}</span></div>
      <div style="text-align:right">${spark()}<div class="days">${L.WEEK_EN.map((d) => `<span>${d}</span>`).join("")}</div></div>
    </div>
  </div>
  <div class="word">
    <div class="top"><small>Word of the day</small><span class="g">${esc(word ? word[0] : "—")}</span><span>${esc(word ? word[1].split("·")[0].trim() : "")}</span></div>
    <div class="foot"><span>单词本 ${words.length} 个</span><span class="bar"><span style="width:${studied.has(T) ? 100 : 0}%"></span></span>${L.link("40 研发部/英语/英语面板", "多邻国 →")}</div>
  </div>
</section>
<div class="r3">
  <div class="stack">
    <section class="group fr" style="padding:18px 16px 16px">
      <div class="tabs2">${L.link("30 后勤部/食物墙", '<span class="on">Fridge</span>')}<button class="plus" aria-label="放进冰箱" aria-expanded="false">＋</button></div>
      <form class="mini foodf" hidden aria-label="放进冰箱">
        <input name="n" placeholder="名字" aria-label="名字" required><input name="q" placeholder="数量" aria-label="数量"><input name="d" type="number" min="0" inputmode="numeric" placeholder="几天到期" aria-label="几天到期">
        <select name="p" aria-label="位置"><option>冷藏</option><option>冷冻</option><option>常温</option></select>
        <select name="k" aria-label="类别">${L.FOOD_KINDS.map((k) => `<option>${k}</option>`).join("")}</select><button class="go">放进去</button></form>
      <div class="foods">${cold.map(foodTile).join("")}</div>
    </section>
    <section class="card prog" style="padding:22px 22px 18px">
      <div class="head" style="margin-bottom:8px;display:flex;justify-content:space-between;align-items:center"><h2 style="font-size:26px">事情进度</h2><button class="plus" aria-label="加一件事" aria-expanded="false">＋</button></div>
      <form class="mini projf" hidden aria-label="加一件事">
        <input name="t" placeholder="要推进的事（比如 写完 INF 1340 报告）" aria-label="事情" required>
        <select name="a" aria-label="类别">${AREAS.map(([v, l]) => `<option value="${v}">${l}</option>`).join("")}</select><button class="go">加上</button></form>
      <ul class="list">${projects.map(projRow).join("")}</ul>
    </section>
  </div>
  <aside class="rcol">
    <section class="mod" style="background:#fef7de">
      <div class="mh"><span>最近的活动</span><button class="plus" aria-label="加活动" aria-expanded="false">＋</button></div>
      <form class="mini actf" hidden aria-label="加活动">
        <input name="t" placeholder="什么活动" aria-label="活动" required><input name="d" type="date" aria-label="日期" required>
        <input name="s" placeholder="从哪看到的（小红书、邮件…）" aria-label="来源"><input name="n" placeholder="地点 · 备注" aria-label="备注"><button class="go">加上</button></form>
      <div class="acts">${events.map(actRow).join("")}</div>
    </section>
    <section class="mod" style="background:#f4f8fe;flex:1;position:relative">
      <div class="mh"><span>Reminder</span></div>
      <div class="rems">${rem.map((c, ci) => {
        const done = c.tasks.length - c.open, shown = L.doneLast(c.tasks.map((t, ti) => ({ ...t, ti })));
        return `<div class="rg" ${ci ? 'style="margin-top:20px"' : ""}>
          <div class="rt"><b>${esc(c.title)}</b><small>${done} / ${c.tasks.length}</small></div>
          <div class="bar"><span style="width:${Math.round(done / c.tasks.length * 100)}%"></span></div>
          <ul>${shown.map((t) => `<li class="${t.done ? "done" : ""}" data-c="${ci}" data-t="${t.ti}"><button class="ck" aria-label="完成">${L.CK}</button><span class="t">${esc(t.text)}</span></li>`).join("")}</ul>
          </div>`;
      }).join("")}</div>
    </section>
    <img class="cloth" src="${L.art("home-sticker.png")}" alt="">
  </aside>
</div>`;

const STYLE = `
.lifeos-dash .dash .topbar{display:flex;justify-content:space-between;align-items:center;height:52px;margin-bottom:6px}
.lifeos-dash .find{width:270px;height:52px;border-radius:26px;background:#fff;box-shadow:var(--sh-lift);display:flex;align-items:center;gap:8px;padding:0 20px;font-size:16px;color:var(--muted)}
.lifeos-dash .hero{position:relative;background:#fff;border-radius:4px;box-shadow:var(--sh-card);height:300px;margin:58px 0 32px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px}
.lifeos-dash .hero h1{font-family:"Playfair Display",serif;font-weight:700;font-size:72px;line-height:1;color:#111}
.lifeos-dash .hero p{font-family:"Crimson Text",serif;font-weight:600;font-size:34px;color:var(--ink-2)}
.lifeos-dash .hero p .g{font-size:34px;color:var(--ink)}
.lifeos-dash .hero .art{position:absolute;pointer-events:none;filter:var(--sh-sticker);transition:translate .5s cubic-bezier(.2,.8,.2,1),rotate .5s cubic-bezier(.2,.8,.2,1)}
.lifeos-dash .hero:hover .art{translate:0 -5px;rotate:-1.5deg}
.lifeos-dash .r1{display:grid;grid-template-columns:383px 1fr;gap:24px;margin-bottom:24px}
.lifeos-dash .fr .tabs2,.lifeos-dash .mod .mh{display:flex;justify-content:space-between;align-items:center}
.lifeos-dash .dash .plus{width:30px;height:30px;border-radius:50%;background:var(--sage);color:var(--green);font-size:18px;line-height:30px;text-align:center;flex:none;transition:background .2s,color .2s}
.lifeos-dash .mod .plus{background:rgba(255,255,255,.7)}
.lifeos-dash .dash .plus:hover,.lifeos-dash .dash .plus[aria-expanded="true"]{background:var(--green);color:#fff}
.lifeos-dash .mini{display:grid;gap:8px;margin:0 0 12px}
.lifeos-dash .foodf{grid-template-columns:1.4fr 1fr 1fr 1fr 1fr auto}
.lifeos-dash .actf{grid-template-columns:1fr 1fr}
.lifeos-dash .projf{grid-template-columns:1fr 110px auto}
.lifeos-dash .actf .go{grid-column:1/-1}
.lifeos-dash .mini[hidden]{display:none}
.lifeos-dash .mini input,.lifeos-dash .mini select{height:38px;min-width:0;border-radius:12px;border:1px solid rgba(37,45,41,.12);background:#fff;padding:0 12px;font:inherit;font-size:14px;color:var(--ink);box-shadow:none}
.lifeos-dash .mini .go{height:38px;padding:0 16px;border-radius:999px;background:var(--green);color:#fff;font-size:14px;font-weight:600}
.lifeos-dash .todo .list{max-height:372px;margin-right:-8px;padding-right:8px}
.lifeos-dash .prog .list{max-height:262px;margin-right:-8px;padding-right:8px}
.lifeos-dash .acts{max-height:300px}
.lifeos-dash .rems{max-height:440px;margin-right:-6px;padding-right:6px}
.lifeos-dash .todo .list li{font-size:16px;padding:11px 0;gap:12px}
.lifeos-dash .todo .list li .t{flex:1}
.lifeos-dash .todo .list li small{font-size:14px;color:var(--muted)}
.lifeos-dash .todo .list li small.warn{color:var(--warn)}
.lifeos-dash .todo .list .ck{width:20px;height:20px}
.lifeos-dash .cal{padding:18px 18px 14px}
.lifeos-dash .cal .top{display:flex;align-items:center;gap:14px;margin-bottom:10px}
.lifeos-dash .cal .top h2{font-family:var(--zcool);font-size:26px;font-weight:400}
.lifeos-dash .cal .top span{font-size:13px;color:var(--muted)}
.lifeos-dash .week{display:grid;grid-template-columns:40px repeat(7,1fr);font-size:12px}
.lifeos-dash .week .dh{text-align:center;padding:4px 0 6px;color:var(--muted);font-size:12px}
.lifeos-dash .week .dh b{display:block;font-size:22px;font-weight:400;color:var(--ink);margin-top:2px}
.lifeos-dash .week .dh.today{color:#d2453a}
.lifeos-dash .week .dh.today b{width:34px;height:34px;line-height:34px;border-radius:50%;background:#c13c33;color:#fff;margin:2px auto 0}
.lifeos-dash .week .wkend{background:rgba(37,45,41,.025)}
.lifeos-dash .allday{grid-column:1/-1;display:grid;grid-template-columns:40px repeat(7,1fr);border-top:1px solid rgba(37,45,41,.08);border-bottom:1px solid rgba(37,45,41,.08);padding:4px 0}
.lifeos-dash .allday .lb{font-size:12px;color:var(--muted);align-self:center}
.lifeos-dash .ev{display:block;font-size:12px;border-radius:3px;padding:2px 6px;margin:0 3px 2px;border-left:2.5px solid;line-height:1.35;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}
.lifeos-dash .ev.g1{background:#e8f1e4;border-color:#7f9f78;color:#3e5b4b}
.lifeos-dash .ev.r1{background:#fbe9e7;border-color:#d07a6e;color:#8e3f33}
.lifeos-dash .ev.b1{background:#e7f1fb;border-color:#6d97c2;color:#30577d}
.lifeos-dash .ev.p1{background:#efe9f6;border-color:#9a83bf;color:#56417a}
.lifeos-dash .hours{grid-column:1/-1;display:grid;grid-template-columns:40px repeat(7,1fr);grid-template-rows:repeat(6,36px);position:relative}
.lifeos-dash .hours .hl{font-size:12px;color:var(--muted);transform:translateY(-6px)}
.lifeos-dash .hours .cell{border-top:1px solid rgba(37,45,41,.06);border-left:1px solid rgba(37,45,41,.04)}
.lifeos-dash .hours .ev{position:absolute;white-space:normal}
.lifeos-dash .ev.y1{background:#fbf3dc;border-color:#c9a24a;color:#6f5420}
.lifeos-dash .ev.mine{cursor:pointer}
.lifeos-dash .cal .top .nav{width:28px;height:28px;border-radius:50%;font-size:18px;line-height:26px;color:var(--ink-2);transition:background .2s}
.lifeos-dash .cal .top .nav:hover{background:var(--sage)}
.lifeos-dash .cal .top .wl{min-width:150px;text-align:center}
.lifeos-dash .cal .top .back{height:26px;padding:0 10px;border-radius:13px;background:var(--sage);color:var(--green);font-size:12.5px}
.lifeos-dash .cal .top .add{margin-left:auto;width:34px;height:34px;border-radius:50%;background:var(--sage);color:var(--green);font-size:20px;line-height:34px;text-align:center;transition:background .2s,color .2s}
.lifeos-dash .cal .top .add:hover,.lifeos-dash .cal .top .add[aria-expanded="true"]{background:var(--green);color:#fff}
.lifeos-dash .evf{display:grid;grid-template-columns:150px 110px 1fr 140px auto;gap:8px;margin:0 0 10px}
.lifeos-dash .evf input{height:38px;border-radius:12px;border:1px solid rgba(37,45,41,.12);background:var(--tile);padding:0 12px;font:inherit;font-size:14px;color:var(--ink);box-shadow:none;min-width:0}
.lifeos-dash .evf .go{height:38px;padding:0 18px;border-radius:999px;background:var(--green);color:#fff;font-size:14px;font-weight:600}
.lifeos-dash .evf[hidden]{display:none}
.lifeos-dash .ov{display:grid;grid-template-columns:1fr 300px;gap:24px;margin-bottom:24px}
.lifeos-dash .ov .left{background:#fff;border-radius:22px;box-shadow:var(--sh-card);display:grid;grid-template-rows:auto 1fr;overflow:hidden}
.lifeos-dash .stats{display:flex;gap:12px;align-items:center;padding:0 12px 0 0}
.lifeos-dash .stat{width:164px;height:110px;text-align:center;padding-top:18px}
.lifeos-dash .stat small{font-size:15px;color:var(--ink-2)}
.lifeos-dash .stat .g{display:block;font-size:40px;line-height:1.3;color:var(--green)}
.lifeos-dash .dash .rec{width:90px;height:90px;border-radius:50%;background:var(--green);color:#fff;font-family:var(--zcool);font-size:22px;display:grid;place-items:center;margin-left:auto;margin-right:40px;border:5px solid #dfe8db;box-shadow:0 6px 14px rgba(52,72,59,.25)}
.lifeos-dash .spend{margin:12px 12px 12px 0;border-radius:18px;padding:16px 18px;display:flex;justify-content:space-between;align-items:flex-end}
.lifeos-dash .spend small{font-size:14px;color:var(--ink-2)}
.lifeos-dash .spend .g{display:block;font-size:52px;line-height:1.1;color:var(--green)}
.lifeos-dash .spend .days{font-size:13px;color:var(--ink-2);display:flex;gap:9px}
.lifeos-dash .word{border-radius:18px;background:#e7e0ee;box-shadow:var(--sh-card);display:flex;flex-direction:column;overflow:hidden;position:relative}
.lifeos-dash .word .top{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:20px}
.lifeos-dash .word .top small,.lifeos-dash .word .top span{font-size:14px;color:var(--ink-2)}
.lifeos-dash .word .top .g{font-size:32px;color:var(--ink)}
.lifeos-dash .word .foot{background:#fff;padding:12px 14px;display:flex;align-items:center;gap:10px;font-size:14px;color:var(--ink-2)}
.lifeos-dash .word .foot .bar{flex:1;height:3px;background:#eee}
.lifeos-dash .word .foot .bar span{background:#b9a6cc}
.lifeos-dash .r3{display:grid;grid-template-columns:779px 1fr;gap:24px}
.lifeos-dash .fr .tabs2{margin:2px 0 14px}
.lifeos-dash .fr .tabs2 span{font-family:var(--gaegu);font-weight:700;font-size:34px;color:var(--ink);letter-spacing:.04em}
.lifeos-dash .foods{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}
.lifeos-dash .food{padding:16px 14px;height:270px;position:relative}
.lifeos-dash .food h3{font-family:var(--zcool);font-weight:400;font-size:26px}
.lifeos-dash .food small{font-size:14px;color:var(--muted)}
.lifeos-dash .food .left{display:flex;align-items:center;gap:8px;margin-top:22px;font-size:15px}
.lifeos-dash .food .left .ck{width:20px;height:20px}
.lifeos-dash .food .pic{position:absolute;right:16px;bottom:14px}
.lifeos-dash .prog li{display:grid;grid-template-columns:170px 1fr 50px;gap:14px;align-items:center;font-size:15px;padding:9px 0;border:0}
.lifeos-dash .prog .p{text-align:right;color:var(--ink-2);font-size:14px}
.lifeos-dash .rcol{background:#fff;border-radius:22px;box-shadow:var(--sh-card);padding:16px;display:flex;flex-direction:column;gap:20px;position:relative}
.lifeos-dash .mod{border-radius:18px;padding:16px}
.lifeos-dash .mod .mh{display:flex;justify-content:space-between;align-items:baseline;font-size:15px;color:var(--ink);padding-bottom:10px;border-bottom:1px solid rgba(37,45,41,.08);margin-bottom:8px}
.lifeos-dash .act{display:flex;gap:14px;align-items:center;padding:9px 0}
.lifeos-dash .act .date{width:60px;text-align:center;flex:none;display:block}
.lifeos-dash .act .date .g{font-size:20px;color:var(--brown);display:block;line-height:1}
.lifeos-dash .act .date small{font-size:12px;color:var(--muted)}
.lifeos-dash .act b{display:block;font-weight:400;font-size:15px}
.lifeos-dash .act span{font-size:12px;color:var(--muted)}
.lifeos-dash .rg{margin-top:12px}
.lifeos-dash .rg .rt{display:flex;justify-content:space-between;align-items:baseline}
.lifeos-dash .rg .rt b{font-family:var(--zcool);font-weight:400;font-size:20px}
.lifeos-dash .rg .rt small{font-size:12px;color:var(--muted)}
.lifeos-dash .rg .bar{margin:8px 0 6px;height:5px;background:#e3e9f1}
.lifeos-dash .rg ul{list-style:none;font-size:13.5px;margin:0;padding:0}
.lifeos-dash .rg li{display:flex;align-items:center;gap:8px;padding:3px 0}
.lifeos-dash .rg li .ck{width:16px;height:16px;border-radius:4px;border-width:1.3px}
.lifeos-dash .rg li .ck svg{width:9px}
.lifeos-dash .rg .more{font-size:12px;color:var(--muted)}
.lifeos-dash .cloth{position:absolute;right:-20px;bottom:-28px;width:200px;pointer-events:none;filter:var(--sh-sticker)}
.lifeos-dash .todo .head{display:flex;align-items:center;justify-content:space-between}
.lifeos-dash .todo .add{width:34px;height:34px;border-radius:50%;background:var(--sage);color:var(--green);font-size:20px;line-height:34px;text-align:center;transition:background .2s,color .2s}
.lifeos-dash .todo .add:hover,.lifeos-dash .todo .add[aria-expanded="true"]{background:var(--green);color:#fff}
.lifeos-dash .addtodo{margin-top:10px}
.lifeos-dash .addtodo input{width:100%;height:42px;border-radius:14px;border:1px solid rgba(37,45,41,.12);background:var(--tile);padding:0 14px;font:inherit;font-size:15px;color:var(--ink);box-shadow:none}
.lifeos-dash .addtodo input:focus{outline:2px solid var(--green);outline-offset:1px}
.lifeos-dash .todo .dot{width:22px;flex:none;display:flex;justify-content:center}
.lifeos-dash .todo .dot::before{content:"";width:8px;height:8px;border-radius:50%;background:#c9a24a}
.lifeos-dash .capture .sw{flex:none;height:28px;padding:0 10px;border-radius:14px;border:1px solid rgba(37,45,41,.14);font-size:13px;color:var(--muted);transition:background .2s,color .2s}
.lifeos-dash .capture .sw[aria-pressed="true"]{background:var(--sage);border-color:transparent;color:var(--green);font-weight:600}
.lifeos-dash .capture input{flex:1;border:0;outline:none;background:none;font:inherit;font-size:16px;color:var(--ink);caret-color:var(--green);box-shadow:none;padding:0}
.lifeos-dash .capture .ok{display:none;font-size:13px;color:var(--green);white-space:nowrap}
.lifeos-dash .capture.saved input{display:none}
.lifeos-dash .capture.saved .ok{display:block}
.is-mobile .lifeos-dash .r1,.is-mobile .lifeos-dash .ov,.is-mobile .lifeos-dash .r3{grid-template-columns:1fr}
.is-mobile .lifeos-dash .dash .topbar .find{width:100%}
.is-mobile .lifeos-dash .hero{height:180px;margin:40px 0 16px;border-radius:22px}
.is-mobile .lifeos-dash .hero h1{font-size:34px;position:relative;z-index:1}
.is-mobile .lifeos-dash .hero p,.is-mobile .lifeos-dash .hero p .g{font-size:20px;position:relative;z-index:1}
.is-mobile .lifeos-dash .hero .art{width:76px!important;top:-36px!important;opacity:.9}
.is-mobile .lifeos-dash .stats{flex-wrap:wrap;padding:12px;gap:8px}
.is-mobile .lifeos-dash .stat{width:calc(50% - 4px);height:auto;padding:12px 0;border-radius:14px!important}
.is-mobile .lifeos-dash .dash .rec{width:72px;height:72px;font-size:18px;margin:0 auto}
.is-mobile .lifeos-dash .foods{grid-template-columns:1fr 1fr}
.is-mobile .lifeos-dash .food{height:200px}
.is-mobile .lifeos-dash .food .pic .food-img{max-width:70px!important;max-height:80px!important}
.is-mobile .lifeos-dash .prog li{grid-template-columns:110px 1fr 44px}
.is-mobile .lifeos-dash .cal{overflow-x:auto}
.is-mobile .lifeos-dash .week{min-width:520px}`;

const root = L.mount(dv, html, STYLE);
// 卡片里上下滑、Fridge 翻页
["todo .list", "prog .list", "acts", "rems"].forEach((sel) => L.scrolly(root.querySelector("." + sel)));
const fridgePager = L.pager(root.querySelector(".fr .foods"), 4);
// 记一笔：小窗口里填金额、项目、分类、方式（现金、Apple Pay…），写进当月账本
const openMoney = L.moneySheet(root, (e) => D.addExpense(e));
root.querySelector(".rec").addEventListener("click", openMoney);

// ---------- 交互 ----------
const form = root.querySelector("form.capture"), sw = form.querySelector(".sw");
sw.addEventListener("click", () => {
  const on = sw.getAttribute("aria-pressed") !== "true";
  sw.setAttribute("aria-pressed", on);
  form.querySelector("input").placeholder = on ? "要做的事…" : "我想记…";
  form.querySelector("input").focus();
});
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const input = form.querySelector("input"), text = input.value.trim();
  if (!text) return;
  const asTodo = sw.getAttribute("aria-pressed") === "true";
  if (asTodo) addRow(text, await D.addTodo(text)); else await L.newCard(text);
  form.querySelector(".ok").textContent = asTodo ? "已存进今日待办" : "已存进随手记";
  input.value = ""; form.classList.add("saved");
  setTimeout(() => form.classList.remove("saved"), 1400);
});

// 今日待办：勾选（用事件委托，新加的行也能勾）、「＋」加一条
const todoList = root.querySelector(".todo .list"), addBtn = root.querySelector(".todo .add"), addForm = root.querySelector(".addtodo");
todoList.addEventListener("click", async (e) => {
  const ck = e.target.closest(".ck"); if (!ck) return;
  const li = ck.closest("li"), t = todos[+li.dataset.i];
  if (!t || t.kind === "ev") return;
  const done = li.classList.toggle("done");
  if (done) L.stamp(ck);
  L.sinkDone(li);
  await D.toggleTodo(t, done);
});
function addRow(text, path) {
  const t = { kind: "card", text, tag: "", done: false, path };
  todos.push(t);
  const firstDone = todoList.querySelector(":scope > li.done"); // 新加的放在「没做的」最后
  if (firstDone) firstDone.insertAdjacentHTML("beforebegin", todoLi(t, todos.length - 1));
  else todoList.insertAdjacentHTML("beforeend", todoLi(t, todos.length - 1));
}
const toggleAdd = (open) => {
  addForm.hidden = !open; addBtn.setAttribute("aria-expanded", open);
  if (open) addForm.querySelector("input").focus();
};
addBtn.addEventListener("click", () => toggleAdd(addForm.hidden));
addForm.addEventListener("keydown", (e) => { if (e.key === "Escape") toggleAdd(false); });
addForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const input = addForm.querySelector("input"), text = input.value.trim();
  if (!text) return;
  input.value = "";
  addRow(text, await D.addTodo(text));
});

// 日程：翻周、回到本周、「＋」加日程、点自己加的日程打开 日程.md
const cal = root.querySelector(".cal"), evf = cal.querySelector(".evf"), evAdd = cal.querySelector(".top .add");
function redraw() {
  const days = daysOf(offset);
  cal.querySelector(".top h2").textContent = offset ? "日程" : "本周日程";
  cal.querySelector(".top .wl").textContent = L.weekLabel(days[0]);
  cal.querySelector(".top .back").hidden = offset === 0;
  cal.querySelector(".week").innerHTML = weekCal(days);
}
cal.querySelector('[aria-label="上一周"]').addEventListener("click", () => { offset--; redraw(); });
cal.querySelector('[aria-label="下一周"]').addEventListener("click", () => { offset++; redraw(); });
cal.querySelector(".top .back").addEventListener("click", () => { offset = 0; redraw(); });
const openEvf = (open) => {
  evf.hidden = !open; evAdd.setAttribute("aria-expanded", open);
  if (!open) return;
  const days = daysOf(offset);
  evf.d.value = days.includes(T) ? T : days[0];
  evf.n.focus();
};
evAdd.addEventListener("click", () => openEvf(evf.hidden));
evf.addEventListener("keydown", (e) => { if (e.key === "Escape") openEvf(false); });
evf.addEventListener("submit", async (e) => {
  e.preventDefault();
  const title = evf.n.value.trim(), date = evf.d.value;
  if (!title || !date) return;
  await D.addEvent({ date, time: evf.t.value, title, place: evf.p.value.trim() });
  myEvents = await D.events();
  evf.reset(); openEvf(false);
  offset = Math.round((Date.parse(L.mondayOf(date)) - Date.parse(mon)) / 864e5 / 7); // 跳到新日程所在的那一周
  redraw();
  L.notice(`${title} 加进日程了`);
});
cal.querySelector(".week").addEventListener("click", (e) => { if (e.target.closest(".ev.mine")) L.open(D.EVENTS); });

// 冰箱：勾上 = 吃完 → 这行打勾，名字进购物清单
root.querySelector(".fr").addEventListener("click", async (e) => {
  const ck = e.target.closest(".food .ck"); if (!ck) return;
  const el = ck.closest(".food"), f = cold[+el.dataset.f];
  if (!f || el.classList.contains("gone")) return;
  el.classList.add("gone"); L.stamp(ck); ck.classList.add("on");
  await D.eat(f);
  L.notice(`${f.name} 吃完了，已加进购物清单`);
});

// 「＋」小表单：点开 / 再点或 Esc 收起
function wirePlus(btn, form) {
  const toggle = (open) => { form.hidden = !open; btn.setAttribute("aria-expanded", open); if (open) form.querySelector("input").focus(); };
  btn.addEventListener("click", () => toggle(form.hidden));
  form.addEventListener("keydown", (e) => { if (e.key === "Escape") toggle(false); });
  return toggle;
}
// Fridge「＋」：写进 食物.md；放进冷藏的马上出现在格子里（按到期排好）
const foodf = root.querySelector(".foodf"), toggleFood = wirePlus(root.querySelector(".fr .plus"), foodf);
foodf.addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = foodf.n.value.trim(), place = foodf.p.value;
  if (!name) return;
  const days = foodf.d.value;
  await D.addFood({ name, qty: foodf.q.value, days, place, kind: foodf.k.value });
  if (place === "冷藏") {
    const f = { name, qty: foodf.q.value.trim() || "1", expires: days === "" ? null : L.addDays(T, +days) };
    cold.push(f);
    const at = cold.slice(0, -1).filter((x) => (x.expires || "9999") <= (f.expires || "9999")).length;
    const box = document.createElement("div"); box.innerHTML = foodTile(f, cold.length - 1);
    fridgePager.add(box.firstElementChild, at);
  }
  foodf.reset(); toggleFood(false);
  L.notice(`${name} 放进${place}了`);
});
// 事情进度「＋」：新建一篇事情笔记，马上出现在列表最后
const projf = root.querySelector(".projf"), toggleProj = wirePlus(root.querySelector(".prog .plus"), projf);
projf.addEventListener("submit", async (e) => {
  e.preventDefault();
  const title = projf.t.value.trim();
  if (!title) return;
  const path = await D.addProject({ title, area: projf.a.value });
  const list = root.querySelector(".prog .list");
  list.insertAdjacentHTML("beforeend", projRow({ path, title, progress: 0 }));
  list.scrollTop = list.scrollHeight;
  projf.reset(); toggleProj(false);
  L.notice(`${title} 加进事情进度了`);
});
// 最近的活动「＋」：新建一张活动卡（随手记 type: 活动），按日期插进列表
const actf = root.querySelector(".actf"), toggleAct = wirePlus(root.querySelector(".mod .plus"), actf), acts = root.querySelector(".acts");
actf.addEventListener("submit", async (e) => {
  e.preventDefault();
  const title = actf.t.value.trim(), date = actf.d.value;
  if (!title || !date) return;
  const path = await D.addActivity({ title, date, source: actf.s.value, note: actf.n.value });
  if (date >= T) {
    const ev = { path, title, date, source: actf.s.value.trim(), body: actf.n.value.trim() };
    let at = events.findIndex((x) => x.date > date);
    if (at < 0) at = events.length;
    const box = document.createElement("div"); box.innerHTML = actRow(ev);
    acts.insertBefore(box.firstElementChild, acts.children[at] || null);
    events.splice(at, 0, ev);
  }
  actf.reset(); toggleAct(false);
  L.notice(`${title} 加进最近的活动了`);
});

root.querySelectorAll(".rg li").forEach((li) => li.querySelector(".ck").addEventListener("click", async () => {
  const c = rem[+li.dataset.c], t = c.tasks[+li.dataset.t];
  if (li.classList.toggle("done")) L.stamp(li.querySelector(".ck"));
  L.sinkDone(li);
  await L.toggleTaskAt(c.path, t.line);
}));
