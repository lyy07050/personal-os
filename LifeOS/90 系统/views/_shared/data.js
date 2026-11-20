// 电脑面板和手机页面共用的「读数据 / 写数据」。只认 CLAUDE.md 里的格式。
// 用法：const D = eval(await dv.io.load("90 系统/views/_shared/data.js"))(L, dv);
// 整个文件是一个表达式（一个函数），eval 的结果就是它。
((L, dv) => {
  const T = L.today();
  const FOOD = "30 后勤部/食物.md", SHOP = "30 后勤部/购物清单.md", DL = "45 教务处/截止日期.md";
  const WORDS = "40 研发部/英语/单词本.md", MISTAKES = "40 研发部/英语/错词本.md";
  const HABITS = ["早起", "喝水", "运动", "背词", "早睡"];
  const goalRe = /\[来源::\s*复盘\]/;

  // ---------- 食物 ----------
  async function food() {
    return (await L.lines(dv, FOOD)).map((l, i) => ({ ...L.parseFood(l), raw: l, line: i })).filter((f) => f.name && !f.done)
      .map((f) => ({ ...f, left: f.expires ? L.daysLeft(f.expires, T) : null }))
      .sort((a, b) => (a.left ?? 9999) - (b.left ?? 9999));
  }
  async function shopping() {
    return (await L.lines(dv, SHOP)).map((l, i) => ({ m: /^- \[( |x)\] (.+)$/.exec(l), line: i })).filter((x) => x.m)
      .map((x) => ({ done: x.m[1] === "x", text: x.m[2], line: x.line }));
  }
  // 吃完：食物.md 这一行打勾，名字进购物清单
  async function eat(f) {
    await L.replaceLine(FOOD, f.raw, L.toggleTaskLine(f.raw));
    await L.appendLine(SHOP, `- [ ] ${f.name}`);
  }
  // 放进冰箱：插到「## 位置」那一节的最后。days 为空 = 不会过期
  async function addFood({ name, qty, days, place, kind }) {
    const exp = days === "" || days === undefined || days === null ? "无" : L.addDays(T, +days);
    const line = `- [ ] ${name} [数量:: ${(qty || "").trim() || "1"}] [到期:: ${exp}] [位置:: ${place}]${kind ? ` [类别:: ${kind}]` : ""}`;
    const f = L.fileOf(FOOD);
    if (!f) { await app.vault.create(FOOD, `## ${place}\n\n${line}\n`); return; }
    await app.vault.process(f, (text) => {
      const ls = text.replace(/\n+$/, "").split("\n");
      let h = ls.indexOf(`## ${place}`);
      if (h < 0) { ls.push("", `## ${place}`, ""); h = ls.length - 2; }
      let end = ls.findIndex((l, i) => i > h && l.startsWith("## "));
      if (end < 0) end = ls.length;
      while (end > h + 1 && !ls[end - 1].trim()) end--;
      ls.splice(end, 0, line);
      return ls.join("\n") + "\n";
    });
  }
  async function recipes(foodList) {
    const have = new Set(foodList.map((f) => f.name));
    const inFridge = (ing) => [...have].some((n) => n.includes(ing) || ing.includes(n));
    const out = dv.pages('"30 后勤部/食谱"').array().map((p) => ({
      name: p.file.name, path: p.file.path,
      ingredients: (Array.isArray(p.ingredients) ? p.ingredients : String(p.ingredients || "").split(/[,，]/)).map((s) => String(s).trim()).filter(Boolean),
    }));
    for (const r of out) {
      r.score = r.ingredients.filter(inFridge).length / (r.ingredients.length || 1);
      r.text = ((await dv.io.load(r.path)) || "").split("\n").filter((l) => l.trim() && !l.startsWith("#") && !l.startsWith("---") && !/^\w+:/.test(l)).join(" ");
    }
    return { list: out.sort((a, b) => b.score - a.score), inFridge };
  }

  // ---------- 截止 / 事情 / 面试 / 首页待办 ----------
  async function deadlines() {
    return (await L.lines(dv, DL)).map((l, i) => ({ ...L.parseDeadline(l), line: i })).filter((d) => d.title);
  }
  const projects = () => dv.pages('"10 总部/项目"').where((p) => p.progress !== undefined).array()
    .map((p) => ({ path: p.file.path, title: p.file.name, progress: Number(p.progress) || 0, status: p.status || "", area: p.area || "" }));
  // 复盘「下周三件要事」：最近一篇点过「放进首页待办」的复盘里的那几行
  function homeGoals() {
    const r = dv.pages('"10 总部/复盘"').where((p) => p.goals_on_home === true).sort((p) => p.file.name, "desc").first();
    return r ? r.file.tasks.where((t) => goalRe.test(t.text)).array()
      .map((t) => ({ path: r.file.path, line: t.line, text: t.text.replace(/\[来源::[^\]]*\]/, "").trim(), done: t.completed }))
      .filter((g) => g.text) : [];
  }
  const interviews = () => dv.pages('"50 人事部/面试"').array().map((p) => ({
    path: p.file.path, name: p.file.name, company: String(p.company || ""), role: String(p.role || ""), format: String(p.format || ""),
    title: p.company ? `${p.company} 面试` : p.file.name, date: String(p.date || ""), tasks: p.file.tasks.array(),
  })).sort((a, b) => a.date.localeCompare(b.date));
  const jobs = () => dv.pages('"50 人事部/投递"').where((p) => p.stage).array().map((p) => ({
    path: p.file.path, company: String(p.company || p.file.name), role: String(p.role || ""), stage: String(p.stage), when: String(p.when || ""),
  })).sort((a, b) => b.when.localeCompare(a.when));

  // 今日待办：今天截止的作业、今天的面试、复盘定的三件事、没做完的事情（同名只留一条）
  async function todos() {
    const dls = await deadlines(), projs = projects();
    const list = [
      ...dls.filter((d) => !d.done && d.due && d.due.slice(0, 10) === T).map((d) => ({ kind: "dl", text: d.title, tag: d.due.slice(11), warn: true, path: DL, line: d.line })),
      ...interviews().filter((i) => i.date.slice(0, 10) === T).map((i) => ({ kind: "iv", text: i.title, tag: i.date.slice(11), warn: true, path: i.path })),
      ...homeGoals().map((g) => ({ kind: "goal", text: g.text, tag: "本周", done: g.done, path: g.path, line: g.line })),
      ...projs.filter((p) => p.status !== "完成").map((p) => ({ kind: "proj", text: p.title, tag: p.area, path: p.path })),
      ...projs.filter((p) => p.status === "完成").map((p) => ({ kind: "proj", text: p.title, tag: p.area, path: p.path, done: true })),
    ];
    return list.filter((t, i) => list.findIndex((x) => x.text === t.text) === i);
  }
  async function toggleTodo(t, done) {
    if (t.kind === "dl" || t.kind === "goal") await L.toggleTaskAt(t.path, t.line);
    else if (t.kind === "proj") {
      await L.setMeta(t.path, "status", done ? "完成" : "进行中");
      if (done) await L.setMeta(t.path, "progress", 100);
    }
  }

  // ---------- 钱 ----------
  async function weekSpend(day = T) {
    const mon = L.mondayOf(day), days = [...Array(7)].map((_, i) => L.addDays(mon, i));
    const months = [...new Set(days.map((d) => d.slice(0, 7)))];
    const entries = (await Promise.all(months.map((m) => L.ledger(dv, m)))).flat().filter((e) => e.date >= mon && e.date <= days[6]);
    const perDay = days.map((d) => entries.filter((e) => e.date === d).reduce((a, e) => a + e.amount, 0));
    const budget = Number((dv.page(`20 财务部/账本/${mon.slice(0, 7)}`) || {}).budget) || 1400;
    return { days, entries, perDay, spent: perDay.reduce((a, b) => a + b, 0), weekBudget: budget / 4 };
  }

  // ---------- 日记 / 英语 ----------
  const diaries = () => new Map(dv.pages('"10 总部/日记"').where((p) => p.date).array().map((p) => [L.iso(p.date), p]));
  function streak(map = diaries(), habit = "背词") {
    const on = (d) => map.get(d) && map.get(d)[habit] === true;
    let n = 0;
    for (let d = on(T) ? T : L.addDays(T, -1); on(d); d = L.addDays(d, -1)) n++;
    return n;
  }
  // 单词卡是 Spaced Repetition 的 front::back；行尾 <!--SR:!日期,间隔,难度--> 的间隔算「掌握」
  async function wordCards(path) {
    return (await L.lines(dv, path)).map((l, i) => ({ l, i })).filter(({ l }) => l.includes("::") && !l.startsWith("#")).map(({ l, i }) => {
      const sr = /<!--SR:!([\d-]+),(\d+),(\d+)-->/.exec(l);
      const [front, back] = l.replace(/<!--SR:.*?-->/, "").split("::");
      const interval = sr ? +sr[2] : 0;
      return { front: front.trim(), back: (back || "").trim(), line: i, due: sr ? sr[1] : "",
        mastery: interval >= 60 ? 5 : interval >= 21 ? 4 : interval >= 7 ? 3 : interval >= 3 ? 2 : interval >= 1 ? 1 : 0 };
    });
  }
  const wordOfDay = (words) => (words.length ? words[Math.floor(Date.parse(T) / 86400000) % words.length] : null);
  function startReview(fallback) {
    const cmd = "obsidian-spaced-repetition:srs-review-flashcards";
    if (typeof app !== "undefined" && app.commands && app.commands.commands && app.commands.commands[cmd]) app.commands.executeCommandById(cmd);
    else if (fallback) L.open(fallback);
  }

  // ---------- 周复盘 ----------
  const reviews = () => dv.pages('"10 总部/复盘"').where((p) => p.week).sort((p) => String(p.week), "desc").array();
  async function reviewStats(w, all = reviews()) {
    const mon = L.weekMonday(w), days = [...Array(7)].map((_, i) => L.addDays(mon, i)), sun = days[6];
    const money = await weekSpend(mon);
    const byCat = {};
    money.entries.forEach((e) => { byCat[e.category] = (byCat[e.category] || 0) + e.amount; });
    const dmap = diaries(), week = {};
    days.forEach((d) => { if (dmap.has(d)) week[d] = dmap.get(d); });
    const english = days.filter((d) => week[d] && week[d]["背词"] === true).length;
    const newCards = dv.pages('"40 研发部/知识卡"').where((p) => { const c = L.iso(p.created); return c >= mon && c <= sun; }).array();
    // 完成待办：这周截止的作业 + 上周复盘定下的三件事
    const dls = (await deadlines()).filter((d) => d.due && d.due.slice(0, 10) >= mon && d.due.slice(0, 10) <= sun);
    const prev = all.find((r) => String(r.week) === L.isoWeek(L.addDays(mon, -7)));
    const goals = prev ? prev.file.tasks.where((t) => goalRe.test(t.text) && t.text.replace(/\[[^\]]*\]/g, "").trim()).array() : [];
    const total = dls.length + goals.length, done = dls.filter((d) => d.done).length + goals.filter((g) => g.completed).length;
    return { mon, sun, days, spent: money.spent, byCat, diaries: week, english, newCards, total, done, weekBudget: money.weekBudget };
  }
  // 三件要事输入框 → 改复盘笔记里第 i 行「[来源:: 复盘]」
  async function setGoal(path, i, text) {
    const f = L.fileOf(path);
    if (!f) return;
    await app.vault.process(f, (body) => {
      const ls = body.split("\n");
      const idx = ls.map((l, k) => (goalRe.test(l) && /^- \[[ x]\]/.test(l) ? k : -1)).filter((k) => k >= 0);
      if (idx[i] !== undefined) ls[idx[i]] = ls[idx[i]].replace(/^(- \[[ x]\]).*$/, `$1 ${text} [来源:: 复盘]`);
      else ls.splice((idx.length ? idx[idx.length - 1] + 1 : ls.indexOf("## 下周三件要事") + 2), 0, `- [ ] ${text} [来源:: 复盘]`);
      return ls.join("\n");
    });
  }
  // 习惯打卡：改那天日记的属性（没有日记就新建一篇）
  async function setHabit(day, habit, on) {
    const p = `10 总部/日记/${day}.md`;
    if (!L.fileOf(p)) await app.vault.create(p, `---\ndate: ${day}\n${HABITS.map((h) => `${h}: false`).join("\n")}\n---\n`);
    await L.setMeta(p, habit, on);
  }

  // ---------- 知识卡 / 灵感 / 胡思乱想 ----------
  async function bodyOf(path) {
    const t = (await dv.io.load(path)) || "";
    const end = t.startsWith("---") ? t.indexOf("\n---", 4) + 4 : 0;
    return t.slice(end).split("\n").filter((l) => l.trim() && !l.startsWith("# ")).join("\n").trim();
  }
  async function notes(folder, dateKey = "created") {
    const out = [];
    for (const p of dv.pages(`"${folder}"`).array()) {
      out.push({ path: p.file.path, name: p.file.name, category: p.category ? String(p.category) : "", source: p.source ? String(p.source) : "",
        date: L.iso(p[dateKey]) || L.iso(p.file.ctime), body: await bodyOf(p.file.path) });
    }
    return out.sort((a, b) => b.date.localeCompare(a.date));
  }

  // ---------- 课程 ----------
  const courses = () => dv.pages('"45 教务处/课程"').where((p) => p.file.name === "课程主页").array().map((p) => {
    const folder = p.file.folder.split("/").pop();
    const code = String(p.course || folder.split(" ").slice(0, 2).join(" "));
    return { code, name: folder.slice(code.length).trim() || folder, next: p.next_class ? String(p.next_class) : "—", path: p.file.path, folder: p.file.folder };
  });

  // ---------- 物品 ----------
  const things = () => dv.pages('"30 后勤部/物品"').where((p) => p.category).array().map((p) => ({
    path: p.file.path, name: p.file.name, category: String(p.category), location: p.location || "—",
    bought: L.iso(p.bought), price: p.price, warranty: L.iso(p.warranty), note: p.note ? String(p.note) : "",
  })).sort((a, b) => b.bought.localeCompare(a.bought));

  return {
    T, FOOD, SHOP, DL, WORDS, MISTAKES, HABITS,
    food, shopping, eat, addFood, recipes, deadlines, projects, homeGoals, interviews, jobs, todos, toggleTodo,
    weekSpend, diaries, streak, wordCards, wordOfDay, startReview, reviews, reviewStats, setGoal, setHabit, bodyOf, notes, courses, things,
  };
})
