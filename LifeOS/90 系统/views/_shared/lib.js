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
  // 首页 Reminder：钉住的卡片都显示（勾完了也留着，取下钉子才消失）
  const reminders = (cards) => cards.filter((c) => c.pinned === true);

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
    return (await lines(dv, `20 财务部/账本/${month}.md`)).map((l) => { const e = parseLedger(l); return e && { ...e, raw: l }; }).filter(Boolean);
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
        tasks, open: tasks.filter((t) => !t.done).length, body, tags, done: p.done === true, doneOn: iso(p.done_on) });
    }
    return out;
  }

  // 新建一张随手记卡片，返回路径
  // 卡片标题 = 文件名：去掉文件名不允许的字符，连续空白合成一个，最长 40
  const safeTitle = (text) => String(text).replace(/[\\/:*?"<>|#^[\]\n\r]/g, " ").replace(/\s+/g, " ").trim().slice(0, 40).trim() || "随手记";
  // type 是「待办」时 frontmatter 写 done / date，其他类型照旧写 pinned / source
  // 第一行是标题，后面的行是正文；meta 可带 date（待办、活动）和 source（活动）
  async function newCard(text, type = "备忘", meta = {}) {
    const [first, ...more] = String(text).trim().split("\n");
    const title = safeTitle(first);
    let path = `00 随手记/${title}.md`;
    for (let i = 2; fileOf(path); i++) path = `00 随手记/${title} ${i}.md`;
    const head = type === "待办"
      ? `type: 待办\ndone: false\n${meta.date ? `date: ${meta.date}\n` : ""}created: ${today()}`
      : `type: ${type}\npinned: false\nsource: ${meta.source || ""}\n${meta.date ? `date: ${meta.date}\n` : ""}created: ${today()}`;
    // 标题照原文（一行）；文件名才需要去掉 / : 这些字符
    const line = first.replace(/\s+/g, " ").trim().slice(0, 80) || title;
    const rest = more.join("\n").trim() ? `\n${more.join("\n").trim()}\n` : "";
    const body = `---\n${head}\n---\n# ${line}\n${rest}`;
    await app.vault.create(path, body);
    return path;
  }

  const notice = (msg) => { if (typeof Notice !== "undefined") new Notice(msg, 2000); };
  const link = (path, label, cls = "", attrs = "") => `<a class="internal-link ${cls}" data-href="${esc(path)}" href="${esc(path)}"${attrs ? " " + attrs : ""}>${label}</a>`;

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
  // ---------- 日程（10 总部/日程.md 一行一条） ----------
  const EVENT_RE = /^- (\d{4}-\d{2}-\d{2})(?: ([0-2]\d:[0-5]\d))? (.+?)((?: \[(?:地点|类别)::\s*[^\[\]]*?\])*)\s*$/;
  function parseEvent(line) {
    const m = EVENT_RE.exec(line);
    if (!m || isNaN(Date.parse(m[1])) || new Date(m[1]).toISOString().slice(0, 10) !== m[1]) return null;
    if (m[2] && +m[2].slice(0, 2) > 23) return null;
    const title = m[3].trim();
    const f = fields(m[4] || "");
    return title ? { date: m[1], time: m[2] || "", title, place: (f["地点"] || "").trim(), kind: (f["类别"] || "").trim() } : null;
  }
  const formatEvent = (e) => `- ${e.date}${e.time ? " " + e.time : ""} ${String(e.title).split(/\s+/).filter(Boolean).join(" ")}${e.place ? ` [地点:: ${e.place}]` : ""}${e.kind ? ` [类别:: ${e.kind}]` : ""}`;

  // 今日待办里的待办卡：没做完且（没写日期或日期 ≤ 今天），加上今天勾掉的
  const todoCards = (cards, day) => cards.filter((c) => c.type === "待办" && ((!c.done && (!c.date || c.date <= day)) || c.doneOn === day));

  // 一周的标题：同月「2026年11月 · 16–22日」，跨月「2026年11月30日–12月6日」，跨年带上第二个年份
  function weekLabel(mon) {
    const sun = addDays(mon, 6), [y1, m1, d1] = mon.split("-").map(Number), [y2, m2, d2] = sun.split("-").map(Number);
    if (m1 === m2) return `${y1}年${m1}月 · ${d1}–${d2}日`;
    return `${y1}年${m1}月${d1}日–${y2 !== y1 ? `${y2}年` : ""}${m2}月${d2}日`;
  }

  // ---------- 卡片里滑动、格子翻页、勾完排后面 ----------
  // 做完的排后面（稳定排序：同一组里保持原来的先后）
  const doneLast = (items) => [...items.filter((x) => !x.done), ...items.filter((x) => x.done)];
  const chunk = (arr, n) => { const out = []; for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n)); return out; };
  const calm = () => typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;

  // 卡片里上下滑：高度由调用的地方的样式定；没滑到底时底部淡出，提示下面还有
  function scrolly(el) {
    el.classList.add("scrolly");
    const upd = () => el.classList.toggle("at-end", el.scrollTop + el.clientHeight >= el.scrollHeight - 4);
    el.addEventListener("scroll", upd, { passive: true });
    if (typeof ResizeObserver !== "undefined") new ResizeObserver(upd).observe(el);
    upd();
    return el;
  }

  // 格子翻页：el 的子元素每 per 个一页，放进横向轨道（箭头、触控板左右滑都能翻）。
  // el 本身被换成 .pager；每一页沿用 el 原来的标签和 class，所以原来的格子样式照样生效。返回 {refresh, add, el}
  function pager(el, per) {
    const tag = el.tagName, cls = el.className;
    const wrap = document.createElement("div");
    wrap.className = "pager";
    el.replaceWith(wrap);
    function render(list) {
      const keep = wrap.querySelector(".pages") ? Math.round(wrap.querySelector(".pages").scrollLeft / Math.max(1, wrap.querySelector(".pages").clientWidth)) : 0;
      wrap.textContent = "";
      const track = document.createElement("div");
      track.className = "pages";
      const pages = chunk(list, per);
      (pages.length ? pages : [[]]).forEach((items) => {
        const pg = document.createElement(tag);
        pg.className = `${cls} page`;
        items.forEach((n) => pg.appendChild(n));
        track.appendChild(pg);
      });
      wrap.appendChild(track);
      if (pages.length < 2) return;
      wrap.insertAdjacentHTML("beforeend", `<button class="pg-btn prev" aria-label="上一页">‹</button><button class="pg-btn next" aria-label="下一页">›</button><span class="pg-n"></span>`);
      const prev = wrap.querySelector(".prev"), next = wrap.querySelector(".next"), num = wrap.querySelector(".pg-n");
      const at = () => Math.round(track.scrollLeft / Math.max(1, track.clientWidth));
      const upd = () => { const i = at(); num.textContent = `${i + 1} / ${pages.length}`; prev.disabled = i === 0; next.disabled = i === pages.length - 1; };
      const go = (d) => track.scrollTo({ left: (at() + d) * track.clientWidth, behavior: calm() ? "auto" : "smooth" });
      prev.addEventListener("click", () => go(-1));
      next.addEventListener("click", () => go(1));
      track.addEventListener("scroll", upd, { passive: true });
      track.scrollLeft = Math.min(keep, pages.length - 1) * track.clientWidth;
      upd();
    }
    const current = () => [...wrap.querySelectorAll(":scope > .pages > .page > *")];
    render([...el.children]);
    return { el: wrap, refresh: () => render(current()), add: (node, at = current().length) => { const l = current(); l.splice(at, 0, node); render(l); } };
  }

  // 勾完排后面：0.6 秒（盖章动画之后）把这一行挪到列表最后；取消勾就挪回「没做的」那一组的最后
  function sinkDone(li) {
    setTimeout(() => {
      const list = li.parentElement;
      if (!list) return;
      const tail = [...list.children].find((n) => n.classList.contains("new")) || null; // 「加一项」那一行永远在最后
      if (li.classList.contains("done")) list.insertBefore(li, tail);
      else list.insertBefore(li, [...list.children].find((n) => n !== li && n.classList.contains("done")) || null);
      if (!calm() && li.animate) li.animate([{ opacity: 0, transform: "translateY(-6px)" }, { opacity: 1, transform: "none" }], { duration: 260, easing: "ease-out" });
    }, 600);
  }

  // ---------- 记一笔 ----------
  const formatLedger = (e) => `- ${e.date} ${String(e.name).replace(/\s+/g, " ").trim()} [金额:: ${Number(e.amount).toFixed(2)}] [分类:: ${e.category}] [方式:: ${e.method}]`;
  const METHODS = [["现金", "现金"], ["ApplePay", "Apple Pay"], ["信用卡", "信用卡"], ["借记卡", "借记卡"], ["转账", "转账 / e-Transfer"]];
  // 记一笔 / 改一笔的小窗口（<dialog>，Esc 关）。返回 open(old?)：不给 old = 记新的一笔；给了 = 改这一笔（带「删除」）
  // save(entry, old) 负责写进账本；onDelete(old) 负责删
  function moneySheet(root, save, { onDelete } = {}) {
    const cats = ["待分类", "餐饮", "交通", "购物", "服饰", "日用", "美妆", "娱乐", "学习", "居住", "其他"];
    root.insertAdjacentHTML("beforeend", `<dialog class="money" aria-label="记一笔"><form class="mf">
      <h3>记一笔</h3>
      <label class="amt-in"><span>$</span><input name="a" type="number" step="0.01" min="0.01" inputmode="decimal" placeholder="0.00" aria-label="金额" required></label>
      <input name="n" placeholder="买了什么（比如 煎饼果子）" aria-label="项目" required>
      <div class="r"><select name="c" aria-label="分类">${cats.map((c) => `<option value="${c}">${c === "待分类" ? "分类：以后再整理" : c}</option>`).join("")}</select>
        <select name="m" aria-label="方式">${METHODS.map(([v, l]) => `<option value="${v}">${l}</option>`).join("")}</select></div>
      <input name="d" type="date" aria-label="日期" required>
      <div class="r"><button type="button" class="cancel">取消</button><button class="go">记下</button></div>
      <button type="button" class="mdel" hidden>删掉这一笔</button></form></dialog>`);
    const all = root.querySelectorAll("dialog.money"), dlg = all[all.length - 1], f = dlg.querySelector("form");
    let old = null;
    dlg.querySelector(".cancel").addEventListener("click", () => dlg.close());
    dlg.querySelector(".mdel").addEventListener("click", () => { const o = old; dlg.close(); if (o && onDelete) onDelete(o); });
    f.addEventListener("submit", async (e) => {
      e.preventDefault();
      const amt = parseFloat(f.a.value), name = f.n.value.trim();
      if (!(amt > 0) || !name) return;
      const entry = { date: f.d.value || today(), name, amount: amt, category: f.c.value, method: f.m.value };
      await save(entry, old);
      dlg.close();
      notice(old ? `改好了：${name} $${amt.toFixed(2)}` : `记下了：${name} $${amt.toFixed(2)}`);
    });
    return (o = null) => {
      old = o; f.reset();
      dlg.querySelector("h3").textContent = o ? "改一笔" : "记一笔";
      dlg.querySelector(".go").textContent = o ? "保存" : "记下";
      dlg.querySelector(".mdel").hidden = !(o && onDelete);
      if (o) {
        f.a.value = Number(o.amount).toFixed(2); f.n.value = o.name; f.d.value = o.date;
        f.c.value = [...f.c.options].some((x) => x.value === o.category) ? o.category : "待分类";
        if (![...f.m.options].some((x) => x.value === o.method)) f.m.insertAdjacentHTML("beforeend", `<option value="${esc(o.method)}">${esc(o.method)}</option>`);
        f.m.value = o.method;
      } else f.d.value = today();
      dlg.showModal(); f.a.focus();
    };
  }

  function mount(dv, html, style = "") {
    const root = dv.container.createDiv({ cls: "dash" });
    root.innerHTML = (style ? `<style>${style}</style>` : "") + html;
    return root;
  }

  // ---------- 通用的编辑小窗口 ----------
  // fields: [{k, label, type: "text"|"number"|"date"|"select", options: [值] 或 [[值, 显示]], wide, placeholder, required}]
  // onSave(values) 写回去；onDelete() 有就显示「删除」；openPath 有就显示「打开笔记」
  function editSheet(root, { title, fields, values = {}, onSave, onDelete, openPath }) {
    root.querySelector("dialog.esh")?.remove();
    const input = (f) => {
      const v = values[f.k] ?? "", ph = f.placeholder ? ` placeholder="${esc(f.placeholder)}"` : "", req = f.required ? " required" : "";
      if (f.type === "select") return `<select name="${f.k}">${f.options.map((o) => { const [val, lab] = Array.isArray(o) ? o : [o, o]; return `<option value="${esc(val)}" ${String(val) === String(v) ? "selected" : ""}>${esc(lab)}</option>`; }).join("")}</select>`;
      return `<input name="${f.k}" type="${f.type || "text"}" value="${esc(v)}"${ph}${req}${f.type === "number" ? ' step="0.01" min="0" inputmode="decimal"' : ""} autocomplete="off">`;
    };
    root.insertAdjacentHTML("beforeend", `<dialog class="esh" aria-label="${esc(title)}"><form>
      <h3>${esc(title)}</h3>
      ${fields.map((f) => `<label class="${f.wide ? "w" : ""}">${esc(f.label)}${input(f)}</label>`).join("")}
      <div class="ea">${onDelete ? '<button type="button" class="del">删除</button>' : ""}${openPath ? '<button type="button" class="open">打开笔记</button>' : ""}<span></span><button type="button" class="cancel">取消</button><button class="go">保存</button></div></form></dialog>`);
    const dlg = root.querySelector("dialog.esh"), form = dlg.querySelector("form");
    dlg.addEventListener("close", () => dlg.remove());
    dlg.querySelector(".cancel").addEventListener("click", () => dlg.close());
    dlg.querySelector(".del")?.addEventListener("click", () => { dlg.close(); onDelete(); });
    dlg.querySelector(".open")?.addEventListener("click", () => { dlg.close(); open(openPath); });
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const v = Object.fromEntries(fields.map((f) => [f.k, String(form[f.k].value).trim()]));
      if (fields.some((f) => f.required && !v[f.k])) return;
      form.querySelector(".go").disabled = true;
      try { await onSave(v); dlg.close(); } finally { form.querySelector(".go") && (form.querySelector(".go").disabled = false); }
    });
    dlg.showModal();
    form.querySelector("input,select")?.focus();
  }

  // ---------- 闪卡复习（不用装插件，直接在面板上弹出）----------
  // deck: [{front, back}]；先看正面，「看答案」翻面，再选「记得 / 不记得」
  // onForget(card) 每张不记得的卡调用一次；onDone({total, known}) 一轮结束时调用
  function flashcards(root, deck, { title = "复习", hint = "不记得的下次再看", onForget = () => {}, onDone = () => {} } = {}) {
    if (!deck.length) { notice("还没有可以复习的卡片"); return; }
    root.querySelector("dialog.flash")?.remove();
    root.insertAdjacentHTML("beforeend", `<dialog class="flash" aria-label="${esc(title)}"><div class="fh"><span class="fn"></span><button class="fx" aria-label="关闭">✕</button></div>
      <div class="fc"><p class="ff"></p><p class="fb" hidden></p></div>
      <div class="fa"><button class="show">看答案 <kbd>空格</kbd></button><button class="no" hidden>不记得 <kbd>1</kbd></button><button class="yes" hidden>记得 <kbd>2</kbd></button><button class="end" hidden>完成</button></div></dialog>`);
    const dlg = root.querySelector("dialog.flash"), $ = (s) => dlg.querySelector(s);
    let i = 0, known = 0, finished = false;
    const show = () => {
      const c = deck[i];
      $(".fn").textContent = `${title} · ${i + 1} / ${deck.length}`;
      $(".ff").textContent = c.front; $(".fb").textContent = c.back || "（没有写背面）";
      $(".fb").hidden = true; $(".show").hidden = false; $(".no").hidden = $(".yes").hidden = true;
    };
    const flip = () => { $(".fb").hidden = false; $(".show").hidden = true; $(".no").hidden = $(".yes").hidden = false; $(".yes").focus(); };
    const next = async (ok) => {
      if (ok) known++; else await onForget(deck[i]);
      if (++i < deck.length) return show();
      finished = true;
      $(".fn").textContent = title;
      $(".ff").textContent = `这一轮 ${deck.length} 张，记得 ${known} 张`;
      $(".fb").hidden = false; $(".fb").textContent = known === deck.length ? "全部记得，真棒！" : hint;
      $(".no").hidden = $(".yes").hidden = true; $(".end").hidden = false; $(".end").focus();
      await onDone({ total: deck.length, known });
    };
    $(".show").addEventListener("click", flip);
    $(".no").addEventListener("click", () => next(false));
    $(".yes").addEventListener("click", () => next(true));
    $(".end").addEventListener("click", () => dlg.close());
    $(".fx").addEventListener("click", () => dlg.close());
    dlg.addEventListener("keydown", (e) => {
      if (finished) return;
      if (e.key === " " && !$(".show").hidden) { e.preventDefault(); flip(); }
      else if (e.key === "1" && !$(".no").hidden) next(false);
      else if (e.key === "2" && !$(".yes").hidden) next(true);
    });
    show(); dlg.showModal(); $(".show").focus();
  }

  // ---------- 订阅 ----------
  // 这个订阅本月该记账的日期（YYYY-MM-DD）；还没到扣款日、本月已经记过、或今年不在这个月扣 → null
  // 月付：day 是几号（大于当月天数就取月底）；年付：day 写 "MM-DD"
  function subDue(s, T) {
    if (!(+s.amount > 0)) return null;
    const ym = T.slice(0, 7), pad = (n) => String(n).padStart(2, "0");
    const dim = (y, m) => new Date(Date.UTC(+y, +m, 0)).getUTCDate();
    let date;
    if ((s.cycle || "月") === "年") {
      const m = /^(\d{1,2})-(\d{1,2})$/.exec(String(s.day || "").trim());
      if (!m || pad(m[1]) !== ym.slice(5)) return null;
      date = `${ym}-${pad(Math.min(+m[2], dim(T.slice(0, 4), m[1])))}`;
    } else {
      date = `${ym}-${pad(Math.min(Math.max(1, parseInt(s.day, 10) || 1), dim(T.slice(0, 4), ym.slice(5))))}`;
    }
    if (date > T || (s.charged && String(s.charged) >= ym)) return null;
    return date;
  }

  // ---------- 删除和撤销 ----------
  const DEL = '<svg width="15" height="15" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 4.5h10M6.5 4.5V3h3v1.5M4.5 4.5l.6 8.5h5.8l.6-8.5" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  // 删除按钮：label 给读屏用；attrs 是额外属性（data-p 等）；corner = 贴在卡片右上角
  const delBtn = (label, attrs = "", cls = "") => `<button class="delb${cls ? " " + cls : ""}" ${attrs} aria-label="删除 ${esc(label)}" title="删除">${DEL}</button>`;

  // 先给反悔的时间：底部出一条「…  撤销」，ms 毫秒后才真的执行 commit；点撤销就执行 revert
  // 同一页面上一条还没执行完又来一条：先把上一条执行掉
  // 撤销条挂在 body 上（面板里有 container 查询，fixed 会跟着面板滚走），外面包一层 .lifeos-dash 好让样式生效
  function undoable(root, text, commit, revert = () => {}, ms = 4000) {
    let host = document.body.querySelector(":scope > .lifeos-undo-host");
    if (!host) {
      document.body.insertAdjacentHTML("beforeend", '<div class="lifeos-dash lifeos-undo-host"><div class="undo-bar" role="status" aria-live="polite"><span class="ut"></span><button class="ub">撤销</button><i class="uc"></i></div></div>');
      host = document.body.querySelector(":scope > .lifeos-undo-host");
    }
    const bar = host.firstElementChild;
    root = host;
    if (root._undoPending) root._undoPending();
    bar.querySelector(".ut").textContent = text;
    bar.style.setProperty("--ms", ms + "ms");
    bar.classList.remove("show"); void bar.offsetWidth; bar.classList.add("show");
    let settled = false;
    const finish = () => { settled = true; clearTimeout(timer); bar.classList.remove("show"); root._undoPending = null; };
    const fire = async () => { if (settled) return; finish(); await commit(); };
    const timer = setTimeout(fire, ms);
    root._undoPending = fire;
    bar.querySelector(".ub").onclick = () => { if (settled) return; finish(); revert(); };
  }
  // 删一项：先变淡 + 撤销条（4 秒），时间到了才从页面拿掉并真的删
  function removeWithUndo(root, el, text, commit, after = () => {}) {
    el.classList.add("leaving");
    undoable(root, text, async () => { el.remove(); after(); await commit(); }, () => el.classList.remove("leaving"), 4000);
  }
  // 删掉文件里和 raw 一模一样的第一行（按内容找，不按行号，前面删过别的也不会删错）
  async function removeLine(path, raw) {
    const f = fileOf(path);
    if (!f) return false;
    let hit = false;
    await app.vault.process(f, (text) => text.split("\n").filter((l) => hit || l !== raw || !(hit = true)).join("\n"));
    return hit;
  }
  // 整篇笔记放进系统废纸篓（不是永久删除，废纸篓里还能找回来）
  async function trashFile(path) {
    const f = fileOf(path);
    if (f) await app.vault.trash(f, true);
  }

  // 打开另一个面板，并告诉它一打开要做什么（比如随手记只看「活动」）。用 sessionStorage 传一次就清掉
  function goto(path, key, value) {
    try { sessionStorage.setItem(`lifeos:${key}`, value); } catch (e) { /* 私密窗口里存不了就算了，照样打开 */ }
    open(path);
  }
  function takeIntent(key) {
    try { const v = sessionStorage.getItem(`lifeos:${key}`); sessionStorage.removeItem(`lifeos:${key}`); return v; } catch (e) { return null; }
  }

  // 打开一个仓库里的笔记
  const open = (path) => hasApp && app.workspace.openLinkText(path, "", false);

  return {
    fields, parseLedger, parseFood, parseDeadline, daysLeft, addDays, weekday, mondayOf, md, isoWeek, weekMonday, leftLabel, money,
    upcomingEvents, reminders, esc, CK, WEEK_CN, WEEK_EN, MONTH_EN, MONTH_CN,
    today, resource, art, fileOf, lines, ledger, replaceLine, appendLine, setMeta, toggleTaskLine, toggleTaskAt, iso, cards, newCard,
    safeTitle, parseEvent, formatEvent, todoCards, weekLabel, doneLast, chunk, scrolly, pager, sinkDone, formatLedger, moneySheet, METHODS,
    editSheet, flashcards, subDue, notice, link, stamp, banner, wireBanner, mount, open, DEL, delBtn, undoable, removeWithUndo, removeLine, trashFile, goto, takeIntent,
    CATEGORIES: ["餐饮", "交通", "购物", "服饰", "日用", "美妆", "娱乐", "学习", "居住", "其他"],
    ITEM_CATEGORIES: ["电子", "小玩意", "衣物", "化妆品", "厨房"],
    NOTE_CATEGORIES: ["生活小知识", "体态", "变美", "多伦多生活", "回国吃喝玩乐", "学习", "求职"],
    FOOD_KINDS: ["生鲜", "水果", "调味料", "粉面速食", "药材", "零食"],
  };
})()
