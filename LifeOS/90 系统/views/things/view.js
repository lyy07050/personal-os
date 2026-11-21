// 物品墙。参数 {category}：不给 = 全部；给了 = 那一类的分页面。布局照 demo/v4/desktop-things.html。
// 位置用大字，保修快到期 / 已过期用警示色。不显示物品总价值。
const L = eval(await dv.io.load("90 系统/views/_shared/lib.js"));
const esc = L.esc;
const T = L.today();
const cat = input && input.category;
const BG = { 电子: "var(--pink)", 小玩意: "var(--purple)", 衣物: "var(--blue)", 化妆品: "var(--apricot)", 厨房: "var(--yellow)" };
const PIN = '<svg width="13" height="16" viewBox="0 0 13 16" aria-hidden="true"><path d="M6.5 15s5.5-5.2 5.5-9A5.5 5.5 0 0 0 1 6c0 3.8 5.5 9 5.5 9z" fill="none" stroke="#3e5b4b" stroke-width="1.5"/><circle cx="6.5" cy="6" r="1.8" fill="#3e5b4b"/></svg>';
const dot = (d) => d.replace(/-/g, ".");

const all = dv.pages('"30 后勤部/物品"').where((p) => p.category).array().map((p) => ({
  path: p.file.path, name: p.file.name, category: String(p.category), location: p.location || "—",
  bought: L.iso(p.bought), price: p.price, warranty: L.iso(p.warranty), note: p.note ? String(p.note) : "",
})).sort((a, b) => b.bought.localeCompare(a.bought));
const items = cat ? all.filter((i) => i.category === cat) : all;
const soonWarranty = all.filter((i) => i.warranty && L.daysLeft(i.warranty, T) >= 0 && L.daysLeft(i.warranty, T) <= 60);

function third(i) {
  if (i.warranty) {
    const n = L.daysLeft(i.warranty, T);
    const txt = n < 0 ? "已过期" : n <= 60 ? `${+i.warranty.slice(5, 7)} 月到期` : `到 ${dot(i.warranty.slice(0, 7))}`;
    return `<dt>保修</dt><dd class="${n <= 60 ? "warn" : ""}">${txt}</dd>`;
  }
  const m = /^(尺码|开封|剩余)\s*(.+)$/.exec(i.note);
  if (m) return `<dt>${m[1]}</dt><dd>${esc(m[2])}</dd>`;
  return i.note ? `<dt>备注</dt><dd>${esc(i.note)}</dd>` : "";
}

const o = {
  page: "things", eye: "31 · THINGS", title: cat || "物品墙",
  facts: `${items.length} 件${all[0] ? ` · 最近添加：${esc((cat ? items : all)[0]?.name || "")}` : ""}${soonWarranty.length ? ` · ${soonWarranty.length} 件保修快到期` : ""}`,
  btns: [{ label: "＋ 添加物品", cls: "pri", onclick: addItem }, { label: "按位置看", onclick: () => { byPlace = !byPlace; render(); } }],
  arts: [{ file: "things-lantern.png", style: "left:698px;top:-92px;width:346px" }, { file: "things-snuff.png", style: "left:971px;top:39px;width:185px" }],
};

const card = (i) => `<article class="tile item">${L.link(i.path, `<div class="ph" style="background:${BG[i.category] || "var(--tile)"}"><span class="chip">${esc(i.category)}</span></div><h3>${esc(i.name)}</h3>`)}
  <p class="where">${PIN}${esc(i.location)}</p><dl><dt>购入</dt><dd>${i.bought ? dot(i.bought) : "—"}${i.price !== undefined && i.price !== null && i.price !== "" ? ` · $${esc(i.price)}` : ""}</dd>${third(i)}</dl></article>`;

let byPlace = false;
const STYLE = `
.lifeos-dash .items{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}
.lifeos-dash .item{border-radius:22px;padding:24px 24px 26px;min-height:340px;transition:transform .3s cubic-bezier(.2,.8,.2,1)}
.lifeos-dash .item:hover{transform:translateY(-2px)}
.lifeos-dash .ph{height:150px;border-radius:12px;position:relative;margin-bottom:18px}
.lifeos-dash .ph .chip{position:absolute;left:14px;top:14px;height:28px;font-size:14px;background:rgba(255,255,255,.7);color:var(--ink-2)}
.lifeos-dash .item h3{font-family:var(--zcool);font-weight:400;font-size:26px;margin-bottom:6px}
.lifeos-dash .item dl{display:grid;grid-template-columns:42px 1fr;row-gap:4px;font-size:16px;margin:0}
.lifeos-dash .item dt{color:var(--muted)}
.lifeos-dash .item dd{color:var(--table);margin:0}
.lifeos-dash .item dd.warn{color:var(--warn)}
.lifeos-dash .where{display:flex;align-items:center;gap:7px;font-size:18px;color:var(--ink);margin:2px 0 10px}
.lifeos-dash .place h2{font-family:var(--zcool);font-weight:400;font-size:26px;margin:8px 4px 14px}
.is-mobile .lifeos-dash .items{grid-template-columns:1fr}
.is-mobile .lifeos-dash .ph{height:80px}`;

const root = L.mount(dv, "", STYLE);
function render() {
  let body;
  if (byPlace) {
    const places = [...new Set(items.map((i) => i.location))];
    body = places.map((p) => `<div class="place"><h2>${esc(p)}</h2><section class="group items">${items.filter((i) => i.location === p).map(card).join("")}</section></div>`).join("");
  } else body = `<section class="group items" aria-label="物品">${items.map(card).join("")}</section>`;
  root.querySelector(".dash-body") ? root.querySelector(".dash-body").innerHTML = body
    : (root.insertAdjacentHTML("beforeend", L.banner(o) + `<div class="stack dash-body">${body}</div>`), L.wireBanner(root, o));
  root.querySelectorAll(".dash-body .items").forEach((g) => L.pager(g, 6)); // 一页 6 张，多了用 ‹ › 翻
}
render();

// 添加物品：新建一篇物品笔记并打开
async function addItem() {
  const k = cat || "小玩意";
  let path = `30 后勤部/物品/新物品.md`;
  for (let n = 2; L.fileOf(path); n++) path = `30 后勤部/物品/新物品 ${n}.md`;
  await app.vault.create(path, `---\ncategory: ${k}\nlocation: \nbought: ${T}\nprice: \nwarranty: \nnote: \n---\n# 新物品\n`);
  L.open(path);
}
