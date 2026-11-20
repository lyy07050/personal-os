// 首页：只汇总，不录入。布局照 demo/v4/desktop-home.html。
const L = eval(await dv.io.load("90 系统/views/_shared/lib.js"));
const { foodIcon } = eval(await dv.io.load("90 系统/views/_shared/food.js"));
const T = L.today();
const mon = L.mondayOf(T);
const week = [...Array(7)].map((_, i) => L.addDays(mon, i));
const esc = L.esc;

// ---------- 数据 ----------
const DL_PATH = "45 教务处/截止日期.md";
const dlLines = await L.lines(dv, DL_PATH);
const deadlines = dlLines.map((l, i) => ({ ...L.parseDeadline(l), line: i })).filter((d) => d.title);

const projects = dv.pages('"10 总部/项目"').where((p) => p.progress !== undefined).array()
  .map((p) => ({ path: p.file.path, title: p.file.name, progress: Number(p.progress) || 0, status: p.status || "", area: p.area || "" }));

// 复盘「下周三件要事」：最近一篇复盘里点过「放进首页待办」的那几行
const review = dv.pages('"10 总部/复盘"').where((p) => p.goals_on_home === true).sort((p) => p.file.name, "desc").first();
const goals = review ? review.file.tasks.where((t) => /\[来源::\s*复盘\]/.test(t.text)).array()
  .map((t) => ({ path: review.file.path, line: t.line, text: t.text.replace(/\[来源::[^\]]*\]/, "").trim(), done: t.completed }))
  .filter((g) => g.text) : [];

const interviews = dv.pages('"50 人事部/面试"').array()
  .map((p) => ({ title: p.company ? `${p.company} 面试` : p.file.name, when: String(p.date || ""), path: p.file.path }))
  .filter((i) => i.when.slice(0, 10) >= mon && i.when.slice(0, 10) <= week[6]);

const todos = [
  ...deadlines.filter((d) => !d.done && d.due && d.due.slice(0, 10) === T)
    .map((d) => ({ kind: "dl", text: d.title, tag: d.due.slice(11), warn: true, line: d.line })),
  ...interviews.filter((i) => i.when.slice(0, 10) === T).map((i) => ({ kind: "iv", text: i.title, tag: i.when.slice(11), warn: true, path: i.path })),
  ...goals.map((g) => ({ kind: "goal", text: g.text, tag: "本周", done: g.done, path: g.path, line: g.line })),
  ...projects.filter((p) => p.status !== "完成").map((p) => ({ kind: "proj", text: p.title, tag: p.area, path: p.path })),
  ...projects.filter((p) => p.status === "完成").map((p) => ({ kind: "proj", text: p.title, tag: p.area, path: p.path, done: true })),
].filter((t, i, all) => all.findIndex((x) => x.text === t.text) === i); // 截止和事情同名时只留一条

const nov = await L.ledger(dv, T.slice(0, 7));
const prev = mon.slice(0, 7) !== T.slice(0, 7) ? await L.ledger(dv, mon.slice(0, 7)) : [];
const weekSpend = week.map((d) => [...nov, ...prev].filter((e) => e.date === d).reduce((a, e) => a + e.amount, 0));
const spent = weekSpend.reduce((a, b) => a + b, 0);

const food = (await L.lines(dv, "30 后勤部/食物.md")).map((l, i) => ({ ...L.parseFood(l), raw: l, line: i })).filter((f) => f.name && !f.done);
const cold = food.filter((f) => f.place === "冷藏").sort((a, b) => (a.expires || "9999").localeCompare(b.expires || "9999"));

const diaries = dv.pages('"10 总部/日记"').where((p) => p.date).array();
const studied = new Set(diaries.filter((p) => p["背词"] === true).map((p) => L.iso(p.date)));
let streak = 0;
for (let d = studied.has(T) ? T : L.addDays(T, -1); studied.has(d); d = L.addDays(d, -1)) streak++;

const words = (await L.lines(dv, "40 研发部/英语/单词本.md")).filter((l) => l.includes("::")).map((l) => l.split("::"));
const word = words.length ? words[Math.floor(Date.parse(T) / 86400000) % words.length] : null;

const allCards = await L.cards(dv);
const events = L.upcomingEvents(allCards, T);
const rem = L.reminders(allCards);

const courses = dv.pages('"45 教务处/课程"').where((p) => p.next_class).array()
  .map((p) => ({ code: p.course || p.file.folder.split("/").pop(), when: String(p.next_class) }));

// ---------- 本周日程（仿苹果日历周视图） ----------
function weekCal() {
  const allDay = week.map(() => []);
  const timed = [];
  deadlines.filter((d) => d.due && week.includes(d.due.slice(0, 10)))
    .forEach((d) => allDay[week.indexOf(d.due.slice(0, 10))].push({ c: "r1", t: `${d.title.replace(d.course, "").trim() || d.title} 截止` }));
  allCards.filter((c) => c.type === "活动" && week.includes(c.date)).forEach((c) => allDay[week.indexOf(c.date)].push({ c: "g1", t: c.title }));
  allDay[6].push({ c: "p1", t: "周复盘" });
  courses.forEach((c) => {
    const m = /周([一二三四五六日])\s*(\d{1,2}):(\d{2})/.exec(c.when);
    if (m) timed.push({ d: "一二三四五六日".indexOf(m[1]), h: +m[2] + +m[3] / 60, c: "b1", t: `${c.code}<br>${m[2]}:${m[3]}` });
  });
  interviews.forEach((i) => {
    const d = week.indexOf(i.when.slice(0, 10)), hm = i.when.slice(11, 16);
    if (d >= 0 && hm) timed.push({ d, h: +hm.slice(0, 2) + +hm.slice(3) / 60, c: "r1", t: `面试<br>${hm}` });
  });
  const ti = week.indexOf(T);
  let h = "<div></div>" + week.map((d, i) => `<div class="dh ${i === ti ? "today" : ""} ${i > 4 ? "wkend" : ""}">${L.WEEK_CN[i]}${i === ti ? " · Today" : ""}<b>${+d.slice(8)}</b></div>`).join("");
  h += `<div class="allday"><span class="lb">全天</span>${allDay.map((evs) => `<div>${evs.map((e) => `<span class="ev ${e.c}">${esc(e.t)}</span>`).join("")}</div>`).join("")}</div>`;
  h += `<div class="hours">${["09:00", "11:00", "13:00", "15:00", "17:00", "19:00"].map((t) => `<span class="hl">${t}</span>` + '<span class="cell"></span>'.repeat(7)).join("")}`;
  h += timed.filter((e) => e.h >= 9 && e.h < 21).map((e) => `<span class="ev ${e.c}" style="left:calc(40px + (100% - 40px) / 7 * ${e.d} + 3px);width:calc((100% - 40px) / 7 - 6px);top:${(e.h - 9) / 2 * 36}px;height:38px;margin:0">${e.t}</span>`).join("");
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
const left = todos.filter((t) => !t.done).length;

const html = `
<div class="topbar"><span></span><form class="find capture"><input placeholder="我想记…" aria-label="记进随手记"><span class="ok">已存进随手记</span></form></div>
<section class="hero" aria-label="今天">
  <img class="art" src="${L.art("home-flowercat-trim.png")}" alt="" style="left:0;top:-80px;width:149px">
  <img class="art" src="${L.art("home-lantern-trim.png")}" alt="" style="right:0;top:-58px;width:184px">
  <h1>Hi Charlotte 👋</h1>
  <p>Today is · ${dateLong}</p>
</section>
<div class="r1">
  <section class="card todo" style="padding:22px 22px 18px">
    <div class="head" style="margin-bottom:6px"><h2 style="font-size:26px">今日待办</h2></div>
    <ul class="list">${todos.slice(0, 7).map((t, i) => `<li data-i="${i}" class="${t.done ? "done" : ""}"><button class="ck" aria-label="完成">${L.CK}</button><span class="t">${esc(t.text)}</span><small class="${t.warn ? "warn" : ""}">${esc(t.tag)}</small></li>`).join("")}</ul>
  </section>
  <section class="card cal" aria-label="本周日程">
    <div class="top"><h2>本周日程</h2><span>${mon.slice(0, 4)}年${+mon.slice(5, 7)}月 · ${+mon.slice(8)}–${+week[6].slice(8)}日</span></div>
    <div class="week">${weekCal()}</div>
  </section>
</div>
<section class="ov" aria-label="今日概览">
  <div class="left">
    <div class="stats">
      <div class="stat tile" style="border-radius:0 0 18px 0;border-top:0;border-left:0"><small>Tasks left</small><span class="g">${left}</span></div>
      <div class="stat tile"><small>Day streak</small><span class="g">${streak}</span></div>
      <div class="stat tile"><small>In the fridge</small><span class="g">${cold.length}</span></div>
      ${L.link(`20 财务部/账本/${T.slice(0, 7)}`, "记一笔", "rec")}
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
      <div class="tabs2">${L.link("30 后勤部/食物墙", '<span class="on">Fridge</span>')}</div>
      <div class="foods">${cold.slice(0, 4).map((f, i) => {
        const n = f.expires ? L.daysLeft(f.expires, T) : null;
        return `<div class="tile food" data-f="${i}"><h3>${esc(f.name)}</h3><small>${esc(f.qty)}</small><div class="left"><button class="ck" aria-label="吃完" title="吃完" ${n !== null && n <= 1 ? 'style="border-color:var(--warn)"' : ""}>${L.CK}</button><span class="${n !== null && n <= 1 ? "warn" : ""}">${n === null ? "—" : L.leftLabel(n)}</span></div><div class="pic">${foodIcon(f.name, 96)}</div></div>`;
      }).join("")}</div>
    </section>
    <section class="card prog" style="padding:22px 22px 18px">
      <div class="head" style="margin-bottom:8px"><h2 style="font-size:26px">事情进度</h2></div>
      <ul class="list">${projects.map((p) => `<li>${L.link(p.path, esc(p.title))}<span class="bar"><span style="width:${p.progress}%"></span></span><span class="p ${p.progress ? "" : "muted"}">${p.progress ? p.progress + "%" : "未开始"}</span></li>`).join("")}</ul>
    </section>
  </div>
  <aside class="rcol">
    <section class="mod" style="background:#fef7de">
      <div class="mh"><span>最近的活动</span></div>
      ${events.map((e) => `<div class="act">${L.link(e.path, `<div class="date date-stamp"><span class="g">${L.md(e.date)}</span><small>${L.WEEK_CN[L.weekday(e.date)]}</small></div>`)}<div><b>${esc(e.title)}</b><span>${esc([e.source, (e.body.split("\n")[0] || "").split("·")[0].trim()].filter(Boolean).join(" · "))}</span></div></div>`).join("")}
    </section>
    <section class="mod" style="background:#f4f8fe;flex:1;position:relative">
      <div class="mh"><span>Reminder</span></div>
      ${rem.map((c, ci) => {
        const done = c.tasks.length - c.open, shown = c.tasks.slice(0, 3);
        return `<div class="rg" ${ci ? 'style="margin-top:20px"' : ""}>
          <div class="rt"><b>${esc(c.title)}</b><small>${done} / ${c.tasks.length}</small></div>
          <div class="bar"><span style="width:${Math.round(done / c.tasks.length * 100)}%"></span></div>
          <ul>${shown.map((t, ti) => `<li class="${t.done ? "done" : ""}" data-c="${ci}" data-t="${ti}"><button class="ck" aria-label="完成">${L.CK}</button><span class="t">${esc(t.text)}</span></li>`).join("")}</ul>
          ${c.tasks.length > 3 ? L.link(c.path, `还有 ${c.tasks.length - 3} 项 →`, "more") : ""}</div>`;
      }).join("")}
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

// ---------- 交互 ----------
const form = root.querySelector("form.capture");
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const input = form.querySelector("input"), text = input.value.trim();
  if (!text) return;
  await L.newCard(text);
  input.value = ""; form.classList.add("saved");
  setTimeout(() => form.classList.remove("saved"), 1400);
});

root.querySelectorAll(".todo li").forEach((li) => li.querySelector(".ck").addEventListener("click", async () => {
  const t = todos[+li.dataset.i];
  if (li.classList.toggle("done")) L.stamp(li.querySelector(".ck"));
  if (t.kind === "dl") await L.toggleTaskAt(DL_PATH, t.line);
  else if (t.kind === "goal") await L.toggleTaskAt(t.path, t.line);
  else if (t.kind === "proj") {
    const done = li.classList.contains("done");
    await L.setMeta(t.path, "status", done ? "完成" : "进行中");
    if (done) await L.setMeta(t.path, "progress", 100);
  }
}));

// 冰箱：勾上 = 吃完 → 这行打勾，名字进购物清单
root.querySelectorAll(".food").forEach((el) => el.querySelector(".ck").addEventListener("click", async () => {
  const f = cold[+el.dataset.f];
  el.classList.add("gone"); L.stamp(el.querySelector(".ck")); el.querySelector(".ck").classList.add("on");
  await L.replaceLine("30 后勤部/食物.md", f.raw, L.toggleTaskLine(f.raw));
  await L.appendLine("30 后勤部/购物清单.md", `- [ ] ${f.name}`);
  L.notice(`${f.name} 吃完了，已加进购物清单`);
}));

root.querySelectorAll(".rg li").forEach((li) => li.querySelector(".ck").addEventListener("click", async () => {
  const c = rem[+li.dataset.c], t = c.tasks[+li.dataset.t];
  if (li.classList.toggle("done")) L.stamp(li.querySelector(".ck"));
  await L.toggleTaskAt(c.path, t.line);
}));
