// 手机 · 冰箱：一页从上往下，冷藏 → 今天可以做 → 冷冻 → 常温 → 购物清单，没有 tab。布局照 demo/v4/mobile-fridge.html。
// 「吃完」= 食物.md 这一行打勾 + 名字进购物清单；「+ → 放进冰箱」打开这页并展开添加表单。
const L = eval(await dv.io.load("90 系统/views/_shared/lib.js"));
const D = eval(await dv.io.load("90 系统/views/_shared/data.js"))(L, dv);
const M = eval(await dv.io.load("90 系统/views/_shared/m.js"))(L);
const { foodIcon } = eval(await dv.io.load("90 系统/views/_shared/food.js"));
const esc = L.esc;

const food = await D.food();
const shop = await D.shopping();
const { list: recipes, inFridge } = await D.recipes(food);
const by = (p) => food.filter((f) => f.place === p);
const cold = by("冷藏"), frozen = by("冷冻"), pantry = by("常温");
const hero = cold.find((f) => f.left !== null && f.left <= 2);
const daysText = (n) => n === null ? "常备" : n < 0 ? "已过期" : n <= 1 ? L.leftLabel(n) : n >= 30 ? `还剩 ${Math.round(n / 30)} 个月` : n >= 14 ? `还剩 ${Math.round(n / 7)} 周` : `还剩 ${n} 天`;
const summary = `冷藏 ${cold.length} 样${hero ? ` · ${esc(hero.name)}${L.leftLabel(hero.left)}` : ""}`;

const item = (f, i) => `<div class="food" data-l="${f.line}" data-q="${esc(f.name)}" style="animation-delay:${i * 40}ms"><button class="eat">吃完</button>
  <div class="pic">${foodIcon(f.name, 60)}</div>
  <div class="row"><div><b>${esc(f.name)}</b><small>${esc(f.qty)}</small></div><span class="chip ${f.left === null ? "soft" : f.left <= 3 ? "warn" : ""}">${daysText(f.left)}</span></div></div>`;
const section = (title, items) => `<div class="sec"><span class="h">${title}</span><span class="sub">${items.length} 样</span></div>
  <div class="foods">${items.map(item).join("") || '<p class="sub empty">空的</p>'}</div>`;

const addForm = `<form class="card addf" hidden aria-label="放进冰箱">
  <div class="label"><span>放进冰箱</span></div>
  <input name="n" placeholder="名字" aria-label="名字" required>
  <div class="r"><input name="q" placeholder="数量" aria-label="数量"><input name="d" type="number" min="0" inputmode="numeric" placeholder="几天到期" aria-label="几天到期"></div>
  <div class="r"><select name="p" aria-label="位置"><option>冷藏</option><option>冷冻</option><option>常温</option></select>
    <select name="k" aria-label="类别">${L.FOOD_KINDS.map((k) => `<option>${k}</option>`).join("")}</select></div>
  <button class="go">放进去</button></form>`;

const html = M.head({ title: "冰箱", sub: summary, back: M.HOME }) + addForm +
  (hero ? `<section class="card hero">${M.tape("#dfe8db", "top:-8px;left:26px;rotate:-5deg")}<span class="chip warn">${L.leftLabel(hero.left)}</span><div class="hp">${foodIcon(hero.name, 130)}</div><h2 class="h">${esc(hero.name)}<br>先吃掉</h2><p>${esc(hero.qty)}${recipes[0] && recipes[0].ingredients.some((g) => hero.name.includes(g) || g.includes(hero.name)) ? ` · 今天可以做${esc(recipes[0].name)}` : ""}</p></section>` : "") +
  section("冷藏", cold) +
  (recipes.length ? `<section class="card cook" style="margin-top:var(--gap)"><div class="label"><span>今天可以做</span></div><ul>${recipes.slice(0, 2).map((r) => `<li>${L.link(r.path, `<b>${esc(r.name)}</b>`)}<p>${esc(r.text)}</p>${r.ingredients.map((g) => `<span class="chip ${inFridge(g) ? "" : "soft"}">${esc(g)}</span>`).join(" ")}</li>`).join("")}</ul></section>` : "") +
  section("冷冻", frozen) +
  section("常温", pantry) +
  `<div class="sec"><span class="h">${"购物清单"}</span>${L.link(D.SHOP.replace(/\.md$/, ""), "打开清单")}</div>
  <section class="card shop"><ul>${shop.map((s, i) => `<li data-i="${i}" class="${s.done ? "done" : ""}" data-q="${esc(s.text)}"><button class="ck" aria-label="买到了">${L.CK}</button><span class="ic">${foodIcon(s.text.split(/\s/)[0], 30)}</span><span class="t">${esc(s.text)}</span></li>`).join("")}</ul></section>`;

const STYLE = `
.lifeos-dash .m .hero{background:var(--pink);min-height:176px;display:flex;flex-direction:column;justify-content:flex-end;padding:18px;overflow:visible}
.lifeos-dash .m .hero .hp{position:absolute;right:18px;top:16px;transform:rotate(6deg)}
.lifeos-dash .m .hero .chip{position:absolute;left:18px;top:18px;background:rgba(255,255,255,.8)}
.lifeos-dash .m .hero h2{font-size:24px;line-height:1.15;position:relative}
.lifeos-dash .m .hero p{font-size:13px;color:var(--ink-2);margin-top:4px;max-width:62%}
.lifeos-dash .m .foods{display:grid;grid-template-columns:1fr 1fr;gap:var(--gap)}
.lifeos-dash .m .foods .empty{grid-column:1/-1;padding:0 4px}
.lifeos-dash .m .food{border-radius:24px;background:#fff;padding:14px;box-shadow:var(--shadow);display:flex;flex-direction:column;gap:10px;min-height:150px;position:relative;animation:lifeos-in .35s cubic-bezier(.2,.8,.2,1) both}
@keyframes lifeos-in{from{opacity:0;transform:translateY(6px)}}
.lifeos-dash .m .food .pic{height:64px;display:flex;align-items:center}
.lifeos-dash .m .food .row{display:flex;justify-content:space-between;align-items:flex-end;gap:6px;margin-top:auto}
.lifeos-dash .m .food b{display:block;font-size:15px;font-weight:600;letter-spacing:-.02em}
.lifeos-dash .m .food small{font-size:12px;color:var(--muted)}
.lifeos-dash .m .food .eat{position:absolute;right:10px;top:10px;height:28px;padding:0 11px;border-radius:14px;background:var(--tint);border:1px solid rgba(37,45,41,.1);font-size:12.5px;color:var(--ink-2)}
.lifeos-dash .m .food .eat:active{background:var(--green);color:#fff}
.lifeos-dash .m .food.gone{opacity:.35}
.lifeos-dash .m .cook{background:var(--m-yellow)}
.lifeos-dash .m .cook ul,.lifeos-dash .m .shop ul{list-style:none;margin:0;padding:0}
.lifeos-dash .m .cook li{padding:8px 0;border-bottom:1px solid rgba(37,45,41,.06)}
.lifeos-dash .m .cook li:last-child{border-bottom:0}
.lifeos-dash .m .cook b{font-weight:600;font-size:15px;letter-spacing:-.02em}
.lifeos-dash .m .cook p{font-size:12.5px;color:var(--ink-2);margin:3px 0 6px}
.lifeos-dash .m .shop li{display:flex;align-items:center;gap:10px;padding:10px 0;font-size:15px;border-bottom:1px solid rgba(37,45,41,.06)}
.lifeos-dash .m .shop li:last-child{border-bottom:0}
.lifeos-dash .m .shop li .ic{width:44px;display:flex;justify-content:center}
.lifeos-dash .m .addf{margin-bottom:var(--gap);display:flex;flex-direction:column;gap:8px}
.lifeos-dash .m .addf input,.lifeos-dash .m .addf select{width:100%;height:44px;border-radius:14px;border:1px solid rgba(37,45,41,.12);background:var(--tint);padding:0 14px;font:inherit;font-size:16px;color:var(--ink);box-shadow:none}
.lifeos-dash .m .addf .r{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.lifeos-dash .m .addf .go{height:46px;border-radius:999px;background:var(--green);color:#fff;font-size:15px;font-weight:600}
@media (prefers-reduced-motion:reduce){.lifeos-dash .m .food{animation:none}}`;

const root = M.mount(dv, html, STYLE, { search: "冰箱里有…" });

// 「+ → 放进冰箱」跳过来时直接展开表单
const form = root.querySelector(".addf");
if (window.lifeosFridgeAdd) { window.lifeosFridgeAdd = false; form.hidden = false; setTimeout(() => form.querySelector("input").focus(), 200); }
root.querySelector('.sheet [data-go="fridge"]').addEventListener("click", (e) => {
  e.stopImmediatePropagation(); window.lifeosFridgeAdd = false;
  root.querySelector(".dash-fab").click(); // 收起菜单
  form.hidden = false; form.scrollIntoView({ behavior: "smooth", block: "center" }); form.querySelector("input").focus();
}, true);
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const v = Object.fromEntries(new FormData(form));
  const name = v.n.trim();
  if (!name) return;
  await D.addFood({ name, qty: v.q, days: v.d, place: v.p, kind: v.k });
  form.reset(); form.hidden = true;
  L.notice(`${name} 放进${v.p}了`);
});

root.querySelectorAll(".food .eat").forEach((b) => b.addEventListener("click", async () => {
  const card = b.closest(".food"), f = food.find((x) => x.line === +card.dataset.l);
  card.classList.add("gone"); b.hidden = true;
  await D.eat(f);
  const li = document.createElement("li");
  li.innerHTML = `<button class="ck" aria-label="买到了">${L.CK}</button><span class="ic">${foodIcon(f.name, 30)}</span><span class="t">${esc(f.name)}</span>`;
  root.querySelector(".shop ul").appendChild(li);
  L.notice(`${f.name} → 购物清单`);
}));
root.querySelectorAll(".shop li[data-i]").forEach((li) => li.querySelector(".ck").addEventListener("click", async () => {
  if (li.classList.toggle("done")) L.stamp(li.querySelector(".ck"));
  await L.toggleTaskAt(D.SHOP, shop[+li.dataset.i].line);
}));
