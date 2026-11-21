// 食物墙：六类方块 + 购物清单 + 今天可以做。没有分页面。布局照 demo/v4/desktop-fridge.html。
// 「吃完」= 食物.md 里这一行打勾，名字加进购物清单。
const L = eval(await dv.io.load("90 系统/views/_shared/lib.js"));
const D = eval(await dv.io.load("90 系统/views/_shared/data.js"))(L, dv);
const { foodIcon } = eval(await dv.io.load("90 系统/views/_shared/food.js"));
const esc = L.esc;
const T = L.today();
const FOOD = "30 后勤部/食物.md", SHOP = "30 后勤部/购物清单.md";
const BG = { 生鲜: "var(--tile)", 水果: "var(--blue)", 调味料: "var(--pink)", 粉面速食: "var(--yellow)", 药材: "var(--purple)", 零食: "var(--tile)" };

const food = await D.food();
const shop = await D.shopping();
const { list: recipes, inFridge } = await D.recipes(food);

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
    ${items.length ? `<ul>${items.map((f) => `<li data-l="${f.line}"><span class="pic">${foodIcon(f.name, 30)}</span><span class="t editable" title="点一下修改">${esc(f.name)}</span>${pill(f)}<button class="eat">吃完</button></li>`).join("")}</ul><button class="add">＋ 添加</button>`
      : `<button class="empty" aria-label="添加">＋</button>`}${addForm(kind)}</div>`;
};

// 购物清单一行（按文字找回文件里那一行，不靠行号）
const shopLi = (s) => `<li class="has-del ${s.done ? "done" : ""}" data-t="${esc(s.text)}"><button class="ck" aria-label="买到了" style="width:30px;height:30px">${L.CK}</button><span class="ic">${foodIcon(s.text.split(/\s/)[0], 40)}</span><span class="t editable" title="点一下修改">${esc(s.text)}</span>${L.delBtn(s.text)}</li>`;
const shopRaw = (li) => `- [${li.classList.contains("done") ? "x" : " "}] ${li.dataset.t}`;
// 一道菜：标题、做法、食材（冰箱里有的绿色）、右上角删除
const recipeCard = (r) => `<div class="recipe has-del">${L.delBtn(r.name, `data-p="${esc(r.path)}" data-n="${esc(r.name)}"`, "corner")}${L.link(r.path, `<h3>${esc(r.name)}</h3>`)}<p>${esc(r.text)}</p>${r.ingredients.map((g) => `<span class="chip ${inFridge(g) ? "" : "plain"}">${esc(g)}</span>`).join(" ")}</div>`;
const html = L.banner(o) + `<div class="stack">
  <section class="group boxes" aria-label="食物收纳">${L.FOOD_KINDS.map(box).join("")}</section>
  <section class="card shop" aria-label="购物清单">
    <div class="head" style="margin-bottom:6px"><h2>购物清单</h2>${L.link(SHOP.replace(/\.md$/, ""), "打开清单", "note")}</div>
    <ul class="list">${L.doneLast(shop).map(shopLi).join("")}</ul>
  </section>
  <section class="card" aria-label="今天可以做">
    <div class="head"><h2>今天可以做</h2><button class="plus" aria-label="加一道菜" aria-expanded="false">＋</button></div>
    <form class="recf" hidden aria-label="加一道菜">
      <input name="n" placeholder="菜名（比如 番茄炒蛋）" aria-label="菜名" required>
      <input name="g" placeholder="食材，用逗号隔开（番茄，鸡蛋）" aria-label="食材">
      <input name="s" placeholder="怎么做（一两句就行）" aria-label="做法"><button class="btn pri">加上</button></form>
    <div class="recipes">${recipes.map(recipeCard).join("")}</div>
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
.lifeos-dash .shop .list li .delb{margin-left:auto}
.lifeos-dash .dash .plus{width:34px;height:34px;border-radius:50%;background:var(--sage);color:var(--green);font-size:20px;line-height:34px;text-align:center;flex:none;transition:background .2s,color .2s}
.lifeos-dash .dash .plus:hover,.lifeos-dash .dash .plus[aria-expanded="true"]{background:var(--green);color:#fff}
.lifeos-dash .recf{display:grid;grid-template-columns:1fr 1.2fr 1.6fr auto;gap:8px;margin:0 0 16px}
.lifeos-dash .recf[hidden]{display:none}
.lifeos-dash .recf input{height:40px;min-width:0;border-radius:12px;border:1px solid rgba(37,45,41,.12);background:#fff;padding:0 12px;font:inherit;font-size:15px;color:var(--ink);box-shadow:none}
.lifeos-dash .recf .btn{height:40px}
.lifeos-dash .recipe{border-radius:16px;padding:22px 20px;background:#fff;box-shadow:var(--sh-lift)}
.lifeos-dash .recipe h3{font-family:var(--zcool);font-weight:400;font-size:26px;margin-bottom:8px}
.lifeos-dash .recipe p{font-size:16px;color:var(--ink-2);line-height:1.6;margin-bottom:14px}
.is-mobile .lifeos-dash .recf{grid-template-columns:1fr}
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
  await D.addFood({ name, qty: v.q, days: v.d, place: v.p, kind: form.dataset.k });
  form.reset(); form.hidden = true;
  L.notice(`${name} 放进${v.p}了`);
}));

// 吃完 → 打勾 + 进购物清单
// 每个分类框一页 5 样，多了用 ‹ › 翻
const pagers = [...root.querySelectorAll(".box > ul")].map((ul) => L.pager(ul, 5));

// 点「吃完」先变淡，等 4 秒（可以撤销），时间到了才打勾、进购物清单
// 点食物名字 = 改名字、数量、到期、位置、类别（也能删）；改完刷新一下就排到新位置
root.querySelectorAll(".box li").forEach((li) => li.querySelector(".t").addEventListener("click", () => {
  const f = food.find((x) => x.line === +li.dataset.l);
  if (!f || li.classList.contains("gone")) return;
  L.editSheet(root, {
    title: "改食物", values: { name: f.name, qty: f.qty, expires: f.expires || "", place: f.place, kind: f.kind || "" },
    fields: [
    { k: "name", label: "名字", wide: true, required: true },
    { k: "qty", label: "数量", placeholder: "1 盒 / 500 g" },
    { k: "expires", label: "到期（空着 = 不会坏）", type: "date" },
    { k: "place", label: "放在哪", type: "select", options: ["冷藏", "冷冻", "常温"] },
    { k: "kind", label: "类别", type: "select", options: [["", "（不分）"], ...L.FOOD_KINDS] },
  ],
    onSave: async (v) => {
      f.raw = await D.editFood(f, v);
      Object.assign(f, v, { expires: v.expires || null, left: v.expires ? L.daysLeft(v.expires, T) : null });
      li.querySelector(".t").textContent = f.name;
      li.querySelector(".pill")?.remove();
      li.querySelector(".t").insertAdjacentHTML("afterend", pill(f));
      L.notice(`${f.name} 改好了${v.place !== li.closest(".box")?.dataset.k ? "" : ""}`);
    },
    onDelete: () => L.removeWithUndo(root, li, `「${f.name}」删掉了`, () => L.removeLine(FOOD, f.raw)),
  });
}));
root.querySelectorAll(".box li").forEach((li) => li.querySelector(".eat").addEventListener("click", () => {
  const f = food.find((x) => x.line === +li.dataset.l);
  if (li.classList.contains("gone")) return;
  li.classList.add("gone");
  L.undoable(root, `${f.name} 吃完了，会加进购物清单`, async () => {
    const pg = pagers.find((p) => p.el.contains(li));
    li.remove(); if (pg) pg.refresh();
    await D.eat(f);
    const ul = root.querySelector(".shop .list"), box = document.createElement("ul");
    box.innerHTML = shopLi({ text: f.name, done: false });
    ul.insertBefore(box.firstElementChild, ul.querySelector(":scope > li.done")); // 放在「还没买」的最后
  }, () => li.classList.remove("gone"));
}));

// 购物清单：勾 = 买到了；垃圾桶 = 删掉这一行（4 秒内可撤销）
root.querySelector(".shop .list").addEventListener("click", async (e) => {
  const li = e.target.closest("li[data-t]");
  if (!li) return;
  if (e.target.closest(".t")) {
    // 点文字 = 改名字
    const before = shopRaw(li);
    return L.editSheet(root, {
      title: "改购物清单", values: { t: li.dataset.t }, fields: [{ k: "t", label: "要买什么", wide: true, required: true }],
      onSave: async (v) => { li.dataset.t = v.t.replace(/\s+/g, " "); li.querySelector(".t").textContent = li.dataset.t; await L.replaceLine(SHOP, before, shopRaw(li)); },
      onDelete: () => L.removeWithUndo(root, li, `「${li.dataset.t}」从购物清单删掉了`, () => L.removeLine(SHOP, before)),
    });
  }
  if (e.target.closest(".delb")) {
    const raw = shopRaw(li);
    L.removeWithUndo(root, li, `「${li.dataset.t}」从购物清单删掉了`, () => L.removeLine(SHOP, raw));
  } else if (e.target.closest(".ck")) {
    const before = shopRaw(li);
    if (li.classList.toggle("done")) L.stamp(li.querySelector(".ck"));
    L.sinkDone(li);
    await L.replaceLine(SHOP, before, shopRaw(li));
  }
});

// 今天可以做：一页 3 道，多了用 ‹ › 翻；「＋」加一道菜，垃圾桶删掉（食谱放进废纸篓）
const recPager = L.pager(root.querySelector(".recipes"), 3);
const recf = root.querySelector(".recf"), recPlus = root.querySelector('[aria-label="加一道菜"].plus');
const toggleRec = (open) => { recf.hidden = !open; recPlus.setAttribute("aria-expanded", open); if (open) recf.n.focus(); };
recPlus.addEventListener("click", () => toggleRec(recf.hidden));
recf.addEventListener("keydown", (e) => { if (e.key === "Escape") toggleRec(false); });
recf.addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = recf.n.value.trim();
  if (!name) return;
  const ingredients = recf.g.value.split(/[,，、\s]+/), steps = recf.s.value;
  const path = await D.addRecipe({ name, ingredients, steps });
  const box = document.createElement("div");
  box.innerHTML = recipeCard({ name, path, text: steps.trim(), ingredients: ingredients.map((s) => s.trim()).filter(Boolean) });
  recPager.add(box.firstElementChild, 0); // 新加的放第一个
  recf.reset(); toggleRec(false);
  L.notice(`${name} 加进今天可以做了`);
});
root.addEventListener("click", (e) => {
  const b = e.target.closest(".recipe .delb[data-p]");
  if (!b) return;
  e.preventDefault(); e.stopPropagation();
  const card = b.closest(".recipe");
  L.removeWithUndo(root, card, `「${b.dataset.n}」删掉了`, () => L.trashFile(b.dataset.p), () => recPager.refresh());
});
