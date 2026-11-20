// 食物墙：六类方块 + 购物清单 + 今天可以做。没有分页面。布局照 demo/v4/desktop-fridge.html。
// 「吃完」= 食物.md 里这一行打勾，名字加进购物清单。
const L = eval(await dv.io.load("90 系统/views/_shared/lib.js"));
const { foodIcon } = eval(await dv.io.load("90 系统/views/_shared/food.js"));
const esc = L.esc;
const T = L.today();
const FOOD = "30 后勤部/食物.md", SHOP = "30 后勤部/购物清单.md";
const BG = { 生鲜: "var(--tile)", 水果: "var(--blue)", 调味料: "var(--pink)", 粉面速食: "var(--yellow)", 药材: "var(--purple)", 零食: "var(--tile)" };

const food = (await L.lines(dv, FOOD)).map((l, i) => ({ ...L.parseFood(l), raw: l, line: i })).filter((f) => f.name && !f.done)
  .map((f) => ({ ...f, left: f.expires ? L.daysLeft(f.expires, T) : null }))
  .sort((a, b) => (a.left ?? 9999) - (b.left ?? 9999));
const shop = (await L.lines(dv, SHOP)).map((l, i) => ({ m: /^- \[( |x)\] (.+)$/.exec(l), line: i })).filter((x) => x.m)
  .map((x) => ({ done: x.m[1] === "x", text: x.m[2], line: x.line }));
const recipes = dv.pages('"30 后勤部/食谱"').array().map((p) => ({
  name: p.file.name, path: p.file.path,
  ingredients: (Array.isArray(p.ingredients) ? p.ingredients : String(p.ingredients || "").split(/[,，]/)).map((s) => String(s).trim()).filter(Boolean),
}));
const have = new Set(food.map((f) => f.name));
const inFridge = (ing) => [...have].some((n) => n.includes(ing) || ing.includes(n));
recipes.forEach((r) => { r.score = r.ingredients.filter(inFridge).length / (r.ingredients.length || 1); });
recipes.sort((a, b) => b.score - a.score);
const recipeText = {};
for (const r of recipes) recipeText[r.path] = ((await dv.io.load(r.path)) || "").split("\n").filter((l) => l.trim() && !l.startsWith("#") && !l.startsWith("---") && !/^\w+:/.test(l)).join(" ");

const cold = food.filter((f) => f.place === "冷藏");
const soon = cold.find((f) => f.left !== null && f.left <= 2);
const pill = (f) => f.left === null ? "" : `<span class="pill ${f.left <= 1 ? "warn" : ""}">${L.leftLabel(f.left)}</span>`;

const o = {
  page: "fridge", eye: "30 · KITCHEN", title: "食物墙",
  facts: `冷藏 ${cold.length} 样${soon ? ` · ${esc(soon.name)}<b>${L.leftLabel(soon.left)}</b>` : ""}`,
  btns: [{ label: "＋ 放进冰箱", cls: "pri", onclick: () => openAdd("生鲜") }, { label: "今天吃什么", onclick: () => root.querySelector(".recipes").scrollIntoView({ behavior: "smooth", block: "center" }) }],
  arts: [{ file: "fridge-cocktail.png", style: "left:858px;top:-24px;width:163px" }, { file: "fridge-pomegranate.png", style: "left:1021px;top:96px;width:180px" }],
};

const addForm = (kind) => `<form class="addf" data-k="${kind}" hidden><input name="n" placeholder="名字" aria-label="名字" required><input name="q" placeholder="数量" aria-label="数量"><input name="d" type="number" min="0" placeholder="几天" aria-label="几天到期"><select name="p" aria-label="位置"><option>冷藏</option><option>冷冻</option><option>常温</option></select><button class="btn pri">放进去</button></form>`;
const box = (kind) => {
  const items = food.filter((f) => (f.kind || "生鲜") === kind);
  return `<div class="box" data-k="${kind}" style="background:${BG[kind]}"><div class="bh"><h3>${kind}</h3><span class="pill">${items.length} 项</span></div>
    ${items.length ? `<ul>${items.map((f) => `<li data-l="${f.line}"><span class="pic">${foodIcon(f.name, 30)}</span><span class="t">${esc(f.name)}</span>${pill(f)}<button class="eat">吃完</button></li>`).join("")}</ul><button class="add">＋ 添加</button>`
      : `<button class="empty" aria-label="添加">＋</button>`}${addForm(kind)}</div>`;
};

const html = L.banner(o) + `<div class="stack">
  <section class="group boxes" aria-label="食物收纳">${L.FOOD_KINDS.map(box).join("")}</section>
  <section class="card shop" aria-label="购物清单">
    <div class="head" style="margin-bottom:6px"><h2>购物清单</h2>${L.link(SHOP.replace(/\.md$/, ""), "打开清单", "note")}</div>
    <ul class="list">${shop.map((s, i) => `<li data-i="${i}" class="${s.done ? "done" : ""}"><button class="ck" aria-label="买到了" style="width:30px;height:30px">${L.CK}</button><span class="ic">${foodIcon(s.text.split(/\s/)[0], 40)}</span><span class="t">${esc(s.text)}</span></li>`).join("")}</ul>
  </section>
  <section class="card" aria-label="今天可以做">
    <div class="head"><h2>今天可以做</h2></div>
    <div class="recipes">${recipes.slice(0, 3).map((r) => `<div class="recipe">${L.link(r.path, `<h3>${esc(r.name)}</h3>`)}<p>${esc(recipeText[r.path])}</p>${r.ingredients.map((g) => `<span class="chip ${inFridge(g) ? "" : "plain"}">${esc(g)}</span>`).join(" ")}</div>`).join("")}</div>
  </section></div>`;

const STYLE = `
.lifeos-dash .boxes{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}
.lifeos-dash .box{border-radius:18px;padding:20px;min-height:309px;display:flex;flex-direction:column;border:1px solid rgba(37,45,41,.06);box-shadow:var(--sh-lift)}
.lifeos-dash .box .bh{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px}
.lifeos-dash .box h3{font-family:var(--zcool);font-weight:400;font-size:26px}
.lifeos-dash .pill{height:24px;padding:0 9px;border-radius:12px;background:rgba(223,232,219,.9);font-size:12px;color:var(--green);display:inline-grid;place-items:center;white-space:nowrap}
.lifeos-dash .pill.warn{background:#f8dcd8;color:#8e4a35}
.lifeos-dash .box ul{list-style:none;margin:0;padding:0}
.lifeos-dash .box li{display:flex;align-items:center;gap:10px;font-size:16px;padding:8px 0}
.lifeos-dash .box li .t{flex:1}
.lifeos-dash .box li .pic{width:42px;display:flex;justify-content:center}
.lifeos-dash .dash .box li .eat{height:26px;padding:0 10px;border-radius:13px;background:#fff;border:1px solid rgba(37,45,41,.12);font-size:12.5px;color:var(--ink-2);opacity:0;transition:opacity .2s,background .2s}
.lifeos-dash .box li:hover .eat,.lifeos-dash .box li .eat:focus-visible{opacity:1}
.lifeos-dash .dash .box li .eat:hover{background:var(--green);color:#fff;border-color:var(--green)}
.lifeos-dash .box li.gone{opacity:.35;text-decoration:line-through}
.lifeos-dash .dash .box .empty{flex:1;margin:4px 0 0;border:1.5px dashed rgba(37,45,41,.16);border-radius:14px;font-size:26px;color:var(--muted);transition:border-color .2s,color .2s}
.lifeos-dash .dash .box .empty:hover{border-color:var(--green);color:var(--green)}
.lifeos-dash .dash .box .add{margin-top:auto;align-self:flex-start;font-size:14px;color:var(--ink-2);opacity:0;transition:opacity .2s}
.lifeos-dash .box:hover .add,.lifeos-dash .box .add:focus-visible{opacity:1}
.lifeos-dash .addf{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:10px}
.lifeos-dash .addf[hidden]{display:none}
.lifeos-dash .addf input,.lifeos-dash .addf select{height:34px;border-radius:10px;border:1px solid rgba(37,45,41,.12);background:#fff;padding:0 10px;font:inherit;font-size:14px;color:var(--ink);box-shadow:none}
.lifeos-dash .addf .btn{height:34px;font-size:14px;justify-content:center}
.lifeos-dash .shop .list li{font-size:20px}
.lifeos-dash .shop .ic{width:60px;display:flex;justify-content:center}
.lifeos-dash .recipes{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}
.lifeos-dash .recipe{border-radius:16px;padding:22px 20px;background:#fff;box-shadow:var(--sh-lift)}
.lifeos-dash .recipe h3{font-family:var(--zcool);font-weight:400;font-size:26px;margin-bottom:8px}
.lifeos-dash .recipe p{font-size:16px;color:var(--ink-2);line-height:1.6;margin-bottom:14px}
.is-mobile .lifeos-dash .boxes,.is-mobile .lifeos-dash .recipes{grid-template-columns:1fr}
.is-mobile .lifeos-dash .box{min-height:0}`;

const root = L.mount(dv, html, STYLE);
L.wireBanner(root, o);

function openAdd(kind) {
  const f = root.querySelector(`.addf[data-k="${kind}"]`);
  f.hidden = false; f.querySelector("input").focus();
}
root.querySelectorAll(".box").forEach((b) => b.querySelectorAll(".add,.empty").forEach((x) => x.addEventListener("click", () => openAdd(b.dataset.k))));

// 放进冰箱：插到「## 位置」那一节的最后
root.querySelectorAll(".addf").forEach((form) => form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const v = Object.fromEntries(new FormData(form));
  const name = v.n.trim();
  if (!name) return;
  const exp = v.d === "" ? "无" : L.addDays(T, +v.d);
  const line = `- [ ] ${name} [数量:: ${v.q.trim() || "1"}] [到期:: ${exp}] [位置:: ${v.p}] [类别:: ${form.dataset.k}]`;
  await app.vault.process(L.fileOf(FOOD), (text) => {
    const ls = text.replace(/\n+$/, "").split("\n");
    let h = ls.indexOf(`## ${v.p}`);
    if (h < 0) { ls.push("", `## ${v.p}`, ""); h = ls.length - 2; }
    let end = ls.findIndex((l, i) => i > h && l.startsWith("## "));
    if (end < 0) end = ls.length;
    while (end > h + 1 && !ls[end - 1].trim()) end--;
    ls.splice(end, 0, line);
    return ls.join("\n") + "\n";
  });
  form.reset(); form.hidden = true;
  L.notice(`${name} 放进${v.p}了`);
}));

// 吃完 → 打勾 + 进购物清单
root.querySelectorAll(".box li").forEach((li) => li.querySelector(".eat").addEventListener("click", async () => {
  const f = food.find((x) => x.line === +li.dataset.l);
  li.classList.add("gone"); li.querySelector(".eat").remove();
  await L.replaceLine(FOOD, f.raw, L.toggleTaskLine(f.raw));
  await L.appendLine(SHOP, `- [ ] ${f.name}`);
  const ul = root.querySelector(".shop .list"), n = document.createElement("li");
  n.innerHTML = `<button class="ck" aria-label="买到了" style="width:30px;height:30px">${L.CK}</button><span class="ic">${foodIcon(f.name, 40)}</span><span class="t">${esc(f.name)}</span>`;
  ul.appendChild(n);
}));

root.querySelectorAll(".shop li[data-i]").forEach((li) => li.querySelector(".ck").addEventListener("click", async () => {
  if (li.classList.toggle("done")) L.stamp(li.querySelector(".ck"));
  await L.toggleTaskAt(SHOP, shop[+li.dataset.i].line);
}));
