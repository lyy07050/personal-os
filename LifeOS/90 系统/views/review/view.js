// 每周复盘。两种用法：
//   在周复盘笔记（10 总部/复盘/2026-W47.md）里：dv.view("90 系统/views/review") → 这一周的复盘
//   在 10 总部/周复盘面板.md 里：dv.view("90 系统/views/review", {mode: "index"}) → 所有周的列表
// 布局照 demo/v4/desktop-review.html。
const L = eval(await dv.io.load("90 系统/views/_shared/lib.js"));
const D = eval(await dv.io.load("90 系统/views/_shared/data.js"))(L, dv);
const esc = L.esc;
const T = L.today();
const DIR = "10 总部/复盘";
const HABITS = D.HABITS;
const CAT_BG = { 餐饮: "#f8dcd8", 购物: "#ecf8fe", 交通: "#fff0be", 日用: "#ece6ef", 服饰: "#e7e0ee", 美妆: "#fbe9e7", 娱乐: "#dfe8db", 学习: "#e6ede2", 居住: "#f2e8d3", 其他: "#f2e8d3", 待分类: "#eee" };

const reviews = D.reviews();
const current = dv.current && dv.current();
const week = input && input.mode === "index" ? null : String((current && current.week) || L.isoWeek(T));

const stats = (w) => D.reviewStats(w, reviews);

const STYLE = `
.lifeos-dash .rv-stats{display:grid;grid-template-columns:1fr 1fr;gap:20px 24px}
.lifeos-dash .st{height:198px;text-align:center;padding-top:24px}
.lifeos-dash .st h3{font-size:18px;font-weight:500;color:var(--ink-2);font-family:var(--sans)}
.lifeos-dash .st .g{display:block;font-size:88px;line-height:1.1;color:var(--green)}
.lifeos-dash .st .g small{font-size:40px}
.lifeos-dash .habit{display:grid;grid-template-columns:100px repeat(7,60px) 90px;align-items:center;row-gap:6px}
.lifeos-dash .habit .hd{font-size:17px;color:var(--ink-2);text-align:center}
.lifeos-dash .habit .nm{font-size:20px;color:var(--ink)}
.lifeos-dash .habit .n{font-size:20px;color:var(--ink-2);text-align:center}
.lifeos-dash .dash .dot{width:40px;height:40px;border-radius:50%;border:1.5px solid var(--outline);background:#f6f8f4;display:grid;place-items:center;margin:0 auto;transition:background .2s}
.lifeos-dash .dash .dot.on{background:var(--green);border-color:var(--green)}
.lifeos-dash .dot svg{opacity:0}.lifeos-dash .dot.on svg{opacity:1}
.lifeos-dash .money .strip{display:flex;height:44px;border-radius:10px;overflow:hidden;gap:3px}
.lifeos-dash .money .strip span{display:flex;align-items:center;padding:0 12px;font-size:15px;color:var(--table);white-space:nowrap;overflow:hidden;min-width:0}
.lifeos-dash .three{list-style:none;display:flex;flex-direction:column;gap:10px;margin:0;padding:0}
.lifeos-dash .three li{display:flex;align-items:center;gap:16px;background:var(--tile);border:1px solid rgba(37,45,41,.06);border-radius:16px;padding:10px 18px;position:relative}
.lifeos-dash .three .n{font-size:28px;color:var(--green);width:22px;text-align:center}
.lifeos-dash .three input{flex:1;border:0;background:none;box-shadow:none;font:inherit;font-size:20px;color:var(--ink);outline:none;caret-color:var(--green);min-height:36px;padding:0}
.lifeos-dash .three li:focus-within{border-color:var(--green)}
.lifeos-dash .three li::before{content:"";position:absolute;left:-12px;top:50%;width:44px;height:18px;translate:0 -50%;rotate:-8deg;scale:0;opacity:.85;background:#f8dcd8;border-radius:2px;transition:scale .35s cubic-bezier(.2,.8,.2,1)}
.lifeos-dash .three.pinned li::before{scale:1}
.lifeos-dash .three.pinned li:nth-child(2)::before{transition-delay:.12s;rotate:6deg;background-color:#fef7e0}
.lifeos-dash .three.pinned li:nth-child(3)::before{transition-delay:.24s;background-color:#dfe8db}
.lifeos-dash .kn{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}
.lifeos-dash .kn a{padding:18px 20px;font-family:var(--zcool);font-size:20px;transition:transform .25s cubic-bezier(.2,.8,.2,1)}
.lifeos-dash .kn a:hover{transform:translateY(-2px)}
.lifeos-dash .weeks a{display:grid;grid-template-columns:160px 1fr auto;align-items:center;gap:16px;padding:16px 20px;margin-bottom:12px}
.lifeos-dash .weeks .g{font-size:30px;color:var(--green)}
.lifeos-dash .weeks span{color:var(--ink-2)}
.is-mobile .lifeos-dash .habit{grid-template-columns:52px repeat(7,1fr) 44px}
.is-mobile .lifeos-dash .dash .dot{width:28px;height:28px}
.is-mobile .lifeos-dash .rv-stats,.is-mobile .lifeos-dash .kn{grid-template-columns:1fr 1fr}
.is-mobile .lifeos-dash .st{height:auto;padding:16px 0}
.is-mobile .lifeos-dash .st .g{font-size:56px}`;

// 新建本周复盘笔记（和模板 90 系统/模板/周复盘.md 内容一致）
async function startWeek() {
  const w = L.isoWeek(T), path = `${DIR}/${w}.md`;
  if (!L.fileOf(path)) {
    const goal = "- [ ]  [来源:: 复盘]";
    await app.vault.create(path, `---\nweek: ${w}\ncssclasses: [lifeos-dash, lifeos-desk, lifeos-review]\n---\n## 下周三件要事\n\n${goal}\n${goal}\n${goal}\n\n\`\`\`dataviewjs\nawait dv.view("90 系统/views/side", {"page": "review"})\nawait dv.view("90 系统/views/review")\n\`\`\`\n\n## 想说的话\n\n`);
  }
  L.open(path);
}

if (!week) {
  // ---------- 周复盘面板：所有周 ----------
  const thisWeek = L.isoWeek(T);
  const rows = [];
  for (const r of reviews) {
    const s = await stats(String(r.week));
    rows.push(L.link(r.file.path, `<span class="g">Week ${+String(r.week).slice(6)}</span><span>${L.md(s.mon)} – ${L.md(s.sun)} · 花了 ${L.money(s.spent)} · 学英语 ${s.english} 天</span><span>${s.total ? Math.round(s.done / s.total * 100) + "%" : ""}</span>`, "tile"));
  }
  const o = {
    page: "review", eye: `WEEK ${+thisWeek.slice(6)} · ${L.md(L.weekMonday(thisWeek))} – ${L.md(L.addDays(L.weekMonday(thisWeek), 6))}`, title: "每周复盘",
    facts: `一共 ${reviews.length} 周`,
    btns: [{ label: reviews.some((r) => String(r.week) === thisWeek) ? "打开本周复盘" : "开始本周复盘", cls: "pri", onclick: startWeek }],
    arts: [{ file: "review-fan.png", style: "left:798px;top:30px;width:376px" }],
  };
  const root = L.mount(dv, L.banner(o) + `<section class="card weeks"><div class="head"><h2>每一周</h2></div>${rows.join("")}</section>`, STYLE);
  L.wireBanner(root, o);
} else {
  // ---------- 某一周 ----------
  const s = await stats(week);
  const prevW = L.isoWeek(L.addDays(s.mon, -7));
  const prev = reviews.find((r) => String(r.week) === prevW);
  const ps = prev ? await stats(prevW) : null;
  const path = current && current.file ? current.file.path : `${DIR}/${week}.md`;
  const goalTasks = current && current.file ? current.file.tasks.where((t) => /\[来源::\s*复盘\]/.test(t.text)).array().slice(0, 3) : [];
  const onHome = current && current.goals_on_home === true;
  const n = +week.slice(6);

  const nav = `<nav class="tabs" aria-label="分页">${prev ? L.link(prev.file.path, `Week ${n - 1}`, "lat") : `<a class="lat" aria-disabled="true">Week ${n - 1}</a>`}<a class="lat on" aria-current="page">Week ${n}</a>${L.link("10 总部/周复盘面板", "全部", "cjk")}</nav>`;
  const o = {
    page: "review", eye: `WEEK ${n} · ${L.md(s.mon)} – ${L.md(s.sun)}`, title: "每周复盘",
    facts: ps && ps.total ? `上周完成度 ${Math.round(ps.done / ps.total * 100)}%` : "",
    btns: [{ label: "打开全部复盘", cls: "pri", onclick: () => L.open("10 总部/周复盘面板") }],
    arts: [{ file: "review-fan.png", style: "left:798px;top:30px;width:376px" }],
  };
  const habitRows = HABITS.map((h, r) => {
    const marks = s.days.map((d) => s.diaries[d] && s.diaries[d][h] === true);
    return `<span class="nm">${h}</span>${marks.map((on, i) => `<button class="dot ${on ? "on" : ""}" aria-label="${h} ${L.WEEK_CN[i]}" data-h="${h}" data-d="${s.days[i]}">${L.CK}</button>`).join("")}<span class="n">${marks.filter(Boolean).length} / 7</span>`;
  }).join("");
  const cats = Object.entries(s.byCat).sort((a, b) => b[1] - a[1]);
  const html = nav + L.banner(o) + `<div class="stack">
    <section class="card plan" aria-label="下周三件要事">
      <div class="head"><h2>下周三件要事</h2><button class="btn pri to-home" ${onHome ? "disabled" : ""}>${onHome ? "已放进首页待办" : "放进首页待办"}</button></div>
      <ol class="three ${onHome ? "pinned" : ""}">${[0, 1, 2].map((i) => {
        const t = goalTasks[i];
        const text = t ? t.text.replace(/\[来源::[^\]]*\]/, "").trim() : "";
        return `<li><span class="n g">${i + 1}</span><input value="${esc(text)}" aria-label="第 ${i + 1} 件" data-i="${i}"></li>`;
      }).join("")}</ol>
    </section>
    <section class="card" aria-label="本周新知识">
      <div class="head"><h2>本周新知识</h2>${L.link("40 研发部/知识库", `知识库 ${s.newCards.length} 张 →`, "note")}</div>
      <div class="kn">${s.newCards.slice(0, 3).map((c) => L.link(c.file.path, esc(c.file.name), "tile")).join("")}</div>
    </section>
    <section class="group rv-stats" aria-label="数据概览">
      <div class="tile st"><h3>完成待办</h3><span class="g">${s.done}<small>/${s.total}</small></span></div>
      <div class="tile st"><h3>本周花费</h3><span class="g">$${Math.round(s.spent)}</span></div>
      <div class="tile st"><h3>学英语</h3><span class="g">${s.english}<small>天</small></span></div>
      <div class="tile st"><h3>新知识卡</h3><span class="g">${s.newCards.length}</span></div>
    </section>
    <section class="card" style="min-height:356px;position:relative" aria-label="习惯打卡">
      <img src="${L.art("butterfly.png")}" alt="" style="position:absolute;right:-18px;top:-120px;width:225px;pointer-events:none;filter:var(--sh-sticker)">
      <div class="head" style="justify-content:flex-start"><h2>习惯打卡</h2></div>
      <div class="habit"><span></span>${"一二三四五六日".split("").map((d) => `<span class="hd">${d}</span>`).join("")}<span class="hd">已完成</span>${habitRows}</div>
      <img src="${L.art("peony.png")}" alt="" style="position:absolute;left:850px;top:60px;width:204px;pointer-events:none;filter:var(--sh-sticker)">
    </section>
    <section class="card money" aria-label="钱花在哪">
      <div class="head" style="margin-bottom:12px"><h2>钱花在哪</h2><span class="note">预算还剩 ${L.money(s.weekBudget - s.spent)}</span></div>
      <div class="strip">${cats.map(([c, v]) => `<span style="flex:${v.toFixed(2)};background:${CAT_BG[c] || "#eee"}">${c} $${Math.round(v)}</span>`).join("")}</div>
    </section></div>`;
  const root = L.mount(dv, html, STYLE);

  // 三件要事：改输入框 → 改笔记里对应那一行
  root.querySelectorAll(".three input").forEach((inp) => inp.addEventListener("change", () => D.setGoal(path, +inp.dataset.i, inp.value.trim())));
  root.querySelector(".to-home").addEventListener("click", async (e) => {
    const b = e.currentTarget;
    await L.setMeta(path, "goals_on_home", true);
    b.textContent = "已放进首页待办"; b.disabled = true;
    root.querySelector(".three").classList.add("pinned");
  });
  // 习惯打卡：点圆点 → 改那天日记的属性（没有日记就新建一篇）
  root.querySelectorAll(".dot").forEach((d) => d.addEventListener("click", async () => {
    const on = d.classList.toggle("on");
    if (on) L.stamp(d);
    const row = [...root.querySelectorAll(`.dot[data-h="${d.dataset.h}"]`)];
    d.parentElement.querySelectorAll(".n")[HABITS.indexOf(d.dataset.h)].textContent = `${row.filter((x) => x.classList.contains("on")).length} / 7`;
    await D.setHabit(d.dataset.d, d.dataset.h, on);
  }));
}
