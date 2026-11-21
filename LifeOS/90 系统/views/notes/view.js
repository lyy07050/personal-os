// 知识库。参数 {section: "cards" | "ideas" | "thoughts"}。布局照 demo/v4/desktop-notes.html。
const L = eval(await dv.io.load("90 系统/views/_shared/lib.js"));
const esc = L.esc;
const T = L.today();
const section = (input && input.section) || "cards";
const CAT_BG = { 生活小知识: "var(--beige)", 体态: "var(--sage)", 变美: "var(--pink)", 多伦多生活: "var(--blue)", 回国吃喝玩乐: "var(--yellow)", 学习: "var(--purple)", 求职: "var(--apricot)" };
const SRC_CHIP = { 小红书: "pink", 课堂: "beige", 抖音: "purple", 网页: "" };
const when = (d) => !d ? "" : d === T ? "今天" : d === L.addDays(T, -1) ? "昨天" : L.md(d);

async function bodyOf(path) {
  const t = (await dv.io.load(path)) || "";
  const end = t.startsWith("---") ? t.indexOf("\n---", 4) + 4 : 0;
  return t.slice(end).split("\n").filter((l) => l.trim() && !l.startsWith("# ")).join("\n").trim();
}
async function load(folder, dateKey) {
  const out = [];
  for (const p of dv.pages(`"${folder}"`).array()) {
    out.push({ path: p.file.path, name: p.file.name, category: p.category ? String(p.category) : "", source: p.source ? String(p.source) : "",
      date: L.iso(p[dateKey]) || L.iso(p.file.ctime), body: await bodyOf(p.file.path) });
  }
  return out.sort((a, b) => b.date.localeCompare(a.date));
}

const cards = await load("40 研发部/知识卡", "created");
const ideas = await load("40 研发部/灵感", "created");
const thoughts = await load("40 研发部/胡思乱想", "date");
const mon = L.mondayOf(T);
const newThisWeek = cards.filter((c) => c.date >= mon).length;

async function newNote(folder, name, meta) {
  let path = `${folder}/${name}.md`;
  for (let n = 2; L.fileOf(path); n++) path = `${folder}/${name} ${n}.md`;
  await app.vault.create(path, `---\n${meta}\n---\n# ${name}\n\n`);
  L.open(path);
}
function review() {
  const cmd = "obsidian-spaced-repetition:srs-review-flashcards";
  if (app.commands && app.commands.commands && app.commands.commands[cmd]) app.commands.executeCommandById(cmd);
  else if (cards.length) L.open(cards[Math.floor(Math.random() * cards.length)].path);
}

const o = {
  page: "notes", eye: "40 · NOTES", title: { cards: "知识库", ideas: "灵感", thoughts: "胡思乱想" }[section],
  facts: section === "cards" ? `${cards.length} 张知识卡 · 本周新增 ${newThisWeek} 张`
    : section === "ideas" ? `${ideas.length} 个灵感` : `${thoughts.length} 篇`,
  btns: section === "cards" ? [{ label: "开始复习", cls: "pri", onclick: review }, { label: "＋ 存一条", onclick: () => newNote("40 研发部/知识卡", "新知识卡", `category: 生活小知识\nsource: \ncreated: ${T}`) }]
    : section === "ideas" ? [{ label: "＋ 记一个灵感", cls: "pri", onclick: () => newNote("40 研发部/灵感", "新灵感", `created: ${T}`) }]
    : [{ label: "＋ 写一篇", cls: "pri", onclick: async () => { const p = `40 研发部/胡思乱想/${T}.md`; if (!L.fileOf(p)) await app.vault.create(p, `---\ndate: ${T}\n---\n`); L.open(p); } }],
  arts: [{ file: "notes-flower.png", style: "left:961px;top:37px;width:238px" }],
};

let body = "";
if (section === "cards") {
  const tiles = L.NOTE_CATEGORIES.map((c) => {
    const mine = cards.filter((k) => k.category === c);
    return `<button class="cat" data-c="${c}" style="background:${CAT_BG[c]}" aria-pressed="false"><h3>${c}</h3><span class="g">${mine.length}</span><small>${mine[0] ? "最近：" + esc(mine[0].name) : c === "变美" ? "化妆 · 穿搭" : ""}</small></button>`;
  }).join("");
  body = `<section class="card" aria-label="分类"><div class="head"><h2>分类</h2></div><div class="cats">${tiles}</div></section>
    <section class="card" aria-label="知识卡"><div class="head"><h2>最近的知识卡</h2><button class="filter" hidden></button></div>
    <div class="cards">${cards.map((k) => `<article class="tile k" data-c="${esc(k.category)}">${L.link(k.path, `<h3>${esc(k.name)}</h3>`)}<p>${esc(k.body.slice(0, 90))}</p><div class="meta">${k.source ? `<span class="chip ${SRC_CHIP[k.source] ?? ""}">${esc(k.source)}</span>` : ""}${esc(k.category)}<span class="d">${when(k.date)}</span></div></article>`).join("")}</div></section>`;
} else if (section === "ideas") {
  const [first, ...rest] = ideas;
  body = (first ? `<section class="card idea">${L.link(first.path, `<div class="nh"><span>灵感 · ${esc(first.name)}</span><span>${when(first.date)}</span></div><p>${esc(first.body)}</p>`)}</section>` : "")
    + `<section class="card"><div class="cards">${rest.map((k) => `<article class="tile k">${L.link(k.path, `<h3>${esc(k.name)}</h3>`)}<p>${esc(k.body)}</p><div class="meta"><span class="d">${when(k.date)}</span></div></article>`).join("")}</div></section>`;
} else {
  body = `<section class="card"><ul class="list th">${thoughts.map((k) => `<li>${L.link(k.path, `<span class="g">${L.md(k.date)}</span>`)}<p>${esc(k.body)}</p></li>`).join("")}</ul></section>`;
}

const STYLE = `
.lifeos-dash .idea .nh{display:flex;justify-content:space-between;font-size:15px;color:var(--ink-2);padding-bottom:14px;border-bottom:1px solid rgba(37,45,41,.1);margin-bottom:20px}
.lifeos-dash .idea p{font-family:var(--zcool);font-size:27px;line-height:1.5;color:var(--ink)}
.lifeos-dash .cats{display:grid;grid-template-columns:repeat(7,1fr);gap:12px}
.lifeos-dash .dash .cat{height:150px;text-align:left;border-radius:16px;padding:16px 14px 14px;display:flex;flex-direction:column;transition:transform .25s cubic-bezier(.2,.8,.2,1)}
.lifeos-dash .cat:hover{transform:translateY(-2px)}
.lifeos-dash .cat h3{font-family:var(--zcool);font-weight:400;font-size:20px}
.lifeos-dash .cat .g{font-size:40px;line-height:1.2;color:var(--green)}
.lifeos-dash .cat small{margin-top:auto;font-size:12.5px;color:var(--ink-2);line-height:1.5}
.lifeos-dash .cat[aria-pressed="true"]{outline:2px solid var(--green);outline-offset:-2px}
.lifeos-dash .dash .filter{height:34px;padding:0 14px;border-radius:17px;background:var(--green);color:#fff;font-size:15px;display:inline-flex;align-items:center;gap:8px}
.lifeos-dash .filter[hidden]{display:none}
.lifeos-dash .cards{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}
.lifeos-dash .k{border-radius:20px;padding:22px 24px;display:flex;flex-direction:column;min-height:193px}
.lifeos-dash .k[hidden]{display:none}
.lifeos-dash .k h3{font-family:var(--zcool);font-weight:400;font-size:26px;margin-bottom:10px}
.lifeos-dash .k p{font-size:16px;color:var(--ink-2);line-height:1.6;margin-bottom:16px}
.lifeos-dash .k .meta{margin-top:auto;display:flex;align-items:center;gap:14px;font-size:15px;color:var(--ink-2)}
.lifeos-dash .k .meta .d{margin-left:auto}
.lifeos-dash .th li{align-items:baseline;gap:24px}
.lifeos-dash .th .g{font-size:26px;color:var(--brown);min-width:70px;display:inline-block}
.lifeos-dash .th p{font-size:18px;color:var(--ink)}
.is-mobile .lifeos-dash .cats{grid-template-columns:repeat(2,1fr)}
.is-mobile .lifeos-dash .cards{grid-template-columns:1fr}`;

const root = L.mount(dv, L.banner(o) + `<div class="stack">${body}</div>`, STYLE);
root.querySelectorAll(".stack .cards").forEach((g) => L.pager(g, 6)); // 一页两排共 6 张
L.wireBanner(root, o);

// 分类方块：筛选这一类；再次点击或点 ✕ 取消筛选
const F = root.querySelector(".filter");
function setFilter(c) {
  root.querySelectorAll(".cat").forEach((x) => x.setAttribute("aria-pressed", x === c));
  root.querySelectorAll(".cards .k").forEach((k) => { k.hidden = !!c && k.dataset.c !== c.dataset.c; });
  if (!F) return;
  F.hidden = !c;
  if (c) F.innerHTML = `${c.dataset.c} <span aria-hidden="true">✕</span>`;
  F.setAttribute("aria-label", c ? `取消筛选 ${c.dataset.c}` : "");
}
root.querySelectorAll(".cat").forEach((c) => c.addEventListener("click", () => setFilter(c.getAttribute("aria-pressed") === "true" ? null : c)));
if (F) F.addEventListener("click", () => setFilter(null));
