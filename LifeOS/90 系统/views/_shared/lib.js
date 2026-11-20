// 人生 OS 面板共用工具。用法（在 view.js 里）：
//   const L = eval(await dv.io.load("90 系统/views/_shared/lib.js"));
// 整个文件是一个表达式。上半部分是纯函数（node 测试直接跑），下半部分要用 Obsidian 的 app / dv。
(() => {
  // ---------- 纯函数：格式（和 tools/lifeos_formats.py 一致） ----------
  const FIELD = /\[([^\[\]:]+?)::\s*([^\[\]]*?)\]/g;
  const fields = (line) => {
    const out = {};
    for (const m of line.matchAll(FIELD)) out[m[1].trim()] = m[2].trim();
    return out;
  };
  const isDay = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s || "");
  const amount = (s) => {
    const n = Number(String(s || "").replace(/[$,\s]/g, ""));
    return s !== undefined && s !== "" && Number.isFinite(n) ? n : null;
  };

  function parseLedger(line) {
    const m = /^- (\d{4}-\d{2}-\d{2}) (.+?) (?=\[)/.exec(line);
    if (!m) return null;
    const f = fields(line);
    const a = amount(f["金额"]);
    if (a === null || !("分类" in f)) return null;
    return { date: m[1], name: m[2].trim(), amount: a, category: f["分类"], method: f["方式"] || "" };
  }

  function parseFood(line) {
    const m = /^- \[( |x)\] (.+?) (?=\[)/.exec(line);
    if (!m) return null;
    const f = fields(line);
    if (!("位置" in f) || !("到期" in f)) return null;
    const exp = f["到期"] === "无" ? null : f["到期"];
    if (exp !== null && !isDay(exp)) return null;
    return { done: m[1] === "x", name: m[2].trim(), qty: f["数量"] || "", expires: exp, place: f["位置"], kind: f["类别"] || "" };
  }

  function parseDeadline(line) {
    const m = /^- \[( |x)\] (.+?) (?=\[)/.exec(line);
    if (!m) return null;
    const f = fields(line);
    if (!("截止" in f) || !("课程" in f)) return null;
    const due = f["截止"] === "无" ? null : f["截止"];
    return { done: m[1] === "x", title: m[2].trim(), due, course: f["课程"] };
  }

  // ---------- 纯函数：日期和数字 ----------
  const dayNum = (s) => Math.round(Date.UTC(+s.slice(0, 4), +s.slice(5, 7) - 1, +s.slice(8, 10)) / 86400000);
  const daysLeft = (dateStr, todayStr) => dayNum(dateStr) - dayNum(todayStr);
  const addDays = (s, n) => new Date((dayNum(s) + n) * 86400000).toISOString().slice(0, 10);
  const weekday = (s) => (new Date(dayNum(s) * 86400000).getUTCDay() + 6) % 7; // 周一=0
  const mondayOf = (s) => addDays(s, -weekday(s));
  const WEEK_CN = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];
  const WEEK_EN = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const MONTH_EN = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const MONTH_CN = ["一", "二", "三", "四", "五", "六", "七", "八", "九", "十", "十一", "十二"];
  const md = (s) => `${+s.slice(5, 7)}.${s.slice(8, 10)}`; // 11.18
  // ISO 周：isoWeek("2026-11-18") → "2026-W47"；weekMonday("2026-W47") → "2026-11-16"
  function isoWeek(s) {
    const thu = addDays(s, 3 - weekday(s));
    const jan4 = thu.slice(0, 4) + "-01-04";
    const n = 1 + Math.round((dayNum(thu) - dayNum(mondayOf(jan4))) / 7);
    return `${thu.slice(0, 4)}-W${String(n).padStart(2, "0")}`;
  }
  const weekMonday = (w) => addDays(mondayOf(w.slice(0, 4) + "-01-04"), (+w.slice(6) - 1) * 7);

  function leftLabel(n) {
    if (n < 0) return "已过期";
    if (n === 0) return "今天过期";
    if (n === 1) return "明天过期";
    if (n < 14) return `${n} 天`;
    if (n < 28) return `${Math.round(n / 7)} 周`;
    return `${Math.round(n / 30)} 个月`;
  }

  function money(n) {
    const [i, d] = Math.abs(n).toFixed(2).split(".");
    return (n < 0 ? "-" : "") + "$" + i.replace(/\B(?=(\d{3})+(?!\d))/g, ",") + "." + d;
  }

  // ---------- 纯函数：首页从随手记里挑什么 ----------
  // 最近的活动：type 活动、有日期、日期 ≥ 今天；按日期升序，最多 3 条
  const upcomingEvents = (cards, today, max = 3) =>
    cards.filter((c) => c.type === "活动" && isDay(String(c.date || "")) && String(c.date) >= today)
      .sort((a, b) => String(a.date).localeCompare(String(b.date)))
      .slice(0, max);
  // Reminder：置顶、并且还有没勾的项（open = 没勾的任务数）
  const reminders = (cards) => cards.filter((c) => c.pinned === true && (c.open || 0) > 0);

  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const CK = '<svg width="12" height="10" viewBox="0 0 11 9" aria-hidden="true"><path d="M1 4.6 4 7.5 10 1.5" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  // ---------- Obsidian 部分（node 里不会调用） ----------
  const hasApp = typeof app !== "undefined" && app && app.vault;
  const today = () => (typeof moment !== "undefined" ? moment().format("YYYY-MM-DD") : new Date().toISOString().slice(0, 10));
  const resource = (path) => (hasApp ? app.vault.adapter.getResourcePath(path) : path);
  const art = (file) => resource("90 系统/附件/插画/" + file);
  const fileOf = (path) => (hasApp ? app.vault.getAbstractFileByPath(path) : null);

  async function lines(dv, path) {
    const text = await dv.io.load(path);
    return text ? text.split("\n") : [];
  }

  async function ledger(dv, month) { // month: "2026-11"
    return (await lines(dv, `20 财务部/账本/${month}.md`)).map(parseLedger).filter(Boolean);
  }

  // 把文件里的某一行换成新的一行（找不到就什么也不做）
  async function replaceLine(path, oldLine, newLine) {
    const f = fileOf(path);
    if (!f) return false;
    let hit = false;
    await app.vault.process(f, (text) => text.split("\n").map((l) => {
      if (!hit && l === oldLine) { hit = true; return newLine; }
      return l;
    }).join("\n"));
    return hit;
  }

  async function appendLine(path, line) {
    const f = fileOf(path);
    if (!f) { await app.vault.create(path, line + "\n"); return; }
    await app.vault.process(f, (text) => text.replace(/\n*$/, "\n") + line + "\n");
  }

  async function setMeta(path, key, value) {
    const f = fileOf(path);
    if (f) await app.fileManager.processFrontMatter(f, (fm) => { fm[key] = value; });
  }

  const toggleTaskLine = (line) => line.startsWith("- [ ]") ? line.replace("- [ ]", "- [x]") : line.replace("- [x]", "- [ ]");

  // 勾 / 取消勾 文件第 lineNo 行（从 0 数）的任务
  async function toggleTaskAt(path, lineNo) {
    const f = fileOf(path);
    if (!f) return;
    await app.vault.process(f, (text) => {
      const ls = text.split("\n");
      if (/^\s*- \[[ x]\]/.test(ls[lineNo] || "")) ls[lineNo] = ls[lineNo].replace(/- \[( |x)\]/, (m, c) => (c === "x" ? "- [ ]" : "- [x]"));
      return ls.join("\n");
    });
  }

  // frontmatter 里的日期在 Dataview 里是 Luxon DateTime，统一成 "YYYY-MM-DD"
  const iso = (v) => (v && v.toISODate ? v.toISODate() : v ? String(v).slice(0, 10) : "");

  // 读随手记卡片：{path, name, title, type, pinned, source, date, tasks:[{text, done, line}], open, body}
  async function cards(dv) {
    const out = [];
    for (const p of dv.pages('"00 随手记"').where((p) => p.type)) {
      const text = (await dv.io.load(p.file.path)) || "";
      const ls = text.split("\n");
      const title = (ls.find((l) => l.startsWith("# ")) || "").slice(2).trim() || p.file.name;
      const tasks = [];
      ls.forEach((l, i) => { const m = /^- \[( |x)\] (.*)$/.exec(l); if (m) tasks.push({ text: m[2], done: m[1] === "x", line: i }); });
      const end = text.indexOf("\n---", 4);
      const body = ls.slice(text.startsWith("---") ? text.slice(0, end + 4).split("\n").length : 0)
        .filter((l) => l.trim() && !l.startsWith("# ") && !/^- \[/.test(l) && !/^#\S/.test(l)).join("\n");
      const tags = (text.match(/(^|\s)#([^\s#]+)/g) || []).map((t) => t.trim()).filter((t) => !t.startsWith("# "));
      out.push({ path: p.file.path, name: p.file.name, title, type: p.type, pinned: p.pinned === true, source: p.source || "",
        date: iso(p.date), created: iso(p.created) || iso(p.file.mtime), mtime: p.file.mtime.toMillis(),
        tasks, open: tasks.filter((t) => !t.done).length, body, tags });
    }
    return out;
  }

  // 新建一张随手记卡片，返回路径
  async function newCard(text, type = "备忘") {
    const title = text.replace(/[\\/:*?"<>|#^[\]]/g, " ").trim().slice(0, 40) || "随手记";
    let path = `00 随手记/${title}.md`;
    for (let i = 2; fileOf(path); i++) path = `00 随手记/${title} ${i}.md`;
    const body = `---\ntype: ${type}\npinned: false\nsource: \ncreated: ${today()}\n---\n# ${title}\n\n${text}\n`;
    await app.vault.create(path, body);
    return path;
  }

  const notice = (msg) => { if (typeof Notice !== "undefined") new Notice(msg, 2000); };
  const link = (path, label, cls = "") => `<a class="internal-link ${cls}" data-href="${esc(path)}" href="${esc(path)}">${label}</a>`;

  // 盖章：勾上的一瞬间压下去
  function stamp(el) {
    el.classList.remove("stamp"); void el.offsetWidth; el.classList.add("stamp");
    el.addEventListener("animationend", () => el.classList.remove("stamp"), { once: true });
  }

  // banner：{eye, title, facts, btns:[{label, cls, href|onclick}], arts:[{file, style}], page}
  function banner(o) {
    const tapes = ["#dfe8db", "#f8dcd8", "#fef0c4", "#e7e0ee", "#dcecf6"];
    const tape = tapes[[...(o.page || o.title)].reduce((a, c) => a + c.charCodeAt(0), 0) % tapes.length];
    const btns = (o.btns || []).map((b, i) => b.href
      ? link(b.href, esc(b.label), `btn ${b.cls || "sec"}`)
      : `<button class="btn ${b.cls || "sec"}" data-btn="${i}">${esc(b.label)}</button>`).join("");
    const arts = (o.arts || []).map((a) => `<img class="art" src="${esc(art(a.file))}" alt="" style="${a.style}">`).join("");
    return `<section class="ban"><i class="tape" aria-hidden="true" style="--tape:${tape}"></i>
      <p class="eye">${esc(o.eye)}</p><h1>${esc(o.title)}</h1>
      ${o.facts ? `<p class="facts">${o.facts}</p>` : ""}
      ${btns ? `<div class="btns">${btns}</div>` : ""}${arts}</section>`;
  }
  function wireBanner(root, o) {
    root.querySelectorAll(".ban [data-btn]").forEach((b) => {
      const spec = o.btns[+b.dataset.btn];
      if (spec && spec.onclick) b.addEventListener("click", spec.onclick);
    });
  }

  // 在 dv.container 里放一个 .dash 根节点
  function mount(dv, html, style = "") {
    const root = dv.container.createDiv({ cls: "dash" });
    root.innerHTML = (style ? `<style>${style}</style>` : "") + html;
    return root;
  }

  // 打开一个仓库里的笔记
  const open = (path) => hasApp && app.workspace.openLinkText(path, "", false);

  return {
    fields, parseLedger, parseFood, parseDeadline, daysLeft, addDays, weekday, mondayOf, md, isoWeek, weekMonday, leftLabel, money,
    upcomingEvents, reminders, esc, CK, WEEK_CN, WEEK_EN, MONTH_EN, MONTH_CN,
    today, resource, art, fileOf, lines, ledger, replaceLine, appendLine, setMeta, toggleTaskLine, toggleTaskAt, iso, cards, newCard,
    notice, link, stamp, banner, wireBanner, mount, open,
    CATEGORIES: ["餐饮", "交通", "购物", "服饰", "日用", "美妆", "娱乐", "学习", "居住", "其他"],
    ITEM_CATEGORIES: ["电子", "小玩意", "衣物", "化妆品", "厨房"],
    NOTE_CATEGORIES: ["生活小知识", "体态", "变美", "多伦多生活", "回国吃喝玩乐", "学习", "求职"],
    FOOD_KINDS: ["生鲜", "水果", "调味料", "粉面速食", "药材", "零食"],
  };
})()
