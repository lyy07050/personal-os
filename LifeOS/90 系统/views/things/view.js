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

// 点卡片 = 打开编辑小窗口（data-i 是它在 all 里的位置）
const card = (i) => `<article class="tile item has-del" data-i="${all.indexOf(i)}" role="button" tabindex="0" aria-label="编辑 ${esc(i.name)}">${L.delBtn(i.name, `data-p="${esc(i.path)}" data-n="${esc(i.name)}"`, "corner")}<div class="ph" style="background:${BG[i.category] || "var(--tile)"}"><span class="chip">${esc(i.category)}</span></div><h3>${esc(i.name)}</h3>
  <p class="where">${PIN}${esc(i.location)}</p><dl><dt>购入</dt><dd>${i.bought ? dot(i.bought) : "—"}${i.price !== undefined && i.price !== null && i.price !== "" ? ` · $${esc(i.price)}` : ""}</dd>${third(i)}</dl></article>`;

let byPlace = false;
const STYLE = `
.lifeos-dash .item[data-i]{cursor:pointer}
.lifeos-dash .item[data-i]:focus-visible{outline:2px solid var(--green);outline-offset:3px}
.lifeos-dash dialog.itd{border:0;border-radius:22px;padding:22px 24px;width:min(440px,92vw);background:#fff;color:var(--ink);box-shadow:0 20px 60px rgba(37,45,41,.25)}
.lifeos-dash dialog.itd::backdrop{background:rgba(37,45,41,.25)}
.lifeos-dash .itd form{display:grid;grid-template-columns:1fr 1fr;gap:10px 10px}
.lifeos-dash .itd h3{grid-column:1/-1;font-family:var(--zcool);font-weight:400;font-size:24px;margin:0}
.lifeos-dash .itd label{display:grid;gap:4px;font-size:12px;color:var(--muted)}
.lifeos-dash .itd label.w{grid-column:1/-1}
.lifeos-dash .itd input,.lifeos-dash .itd select{height:40px;min-width:0;border-radius:12px;border:1px solid rgba(37,45,41,.12);background:var(--tile);padding:0 12px;font:inherit;font-size:15px;color:var(--ink);box-shadow:none}
.lifeos-dash .itd input[name=n]{font-size:18px;font-weight:500}
.lifeos-dash .itd .ea{grid-column:1/-1;display:flex;align-items:center;gap:8px;margin-top:6px}
.lifeos-dash .itd .ea span{flex:1}
.lifeos-dash .itd .ea button{height:40px;padding:0 18px;border-radius:999px;font-size:14px}
.lifeos-dash .itd .cancel{background:var(--tile);color:var(--ink-2)}
.lifeos-dash .itd .go{background:var(--green);color:#fff;font-weight:600}
.lifeos-dash .itd .open{background:none;color:var(--ink-2);text-decoration:underline;text-underline-offset:3px;padding:0 6px!important}
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

// 删除：变淡 4 秒（可撤销），时间到了整篇笔记放进系统废纸篓
root.addEventListener("click", (e) => {
  const b = e.target.closest(".delb[data-p]");
  if (!b) return;
  e.preventDefault(); e.stopPropagation();
  L.removeWithUndo(root, b.closest(".has-del"), `「${b.dataset.n}」删掉了`, () => L.trashFile(b.dataset.p));
});

// ---------- 编辑 / 添加物品的小窗口 ----------
// 改的是物品笔记的 frontmatter；名字改了就连笔记一起改名（# 标题也跟着改）
root.insertAdjacentHTML("beforeend", `<dialog class="itd" aria-label="物品"><form>
  <h3></h3>
  <label class="w">名字<input name="n" required></label>
  <label>类别<select name="c">${L.ITEM_CATEGORIES.map((c) => `<option>${c}</option>`).join("")}</select></label>
  <label>放在哪<input name="l" placeholder="比如 床头"></label>
  <label>什么时候买的<input name="b" type="date"></label>
  <label>价格（$）<input name="p" type="number" step="0.01" min="0" inputmode="decimal"></label>
  <label>保修到<input name="w" type="date"></label>
  <label>备注<input name="o" placeholder="尺码 M / 开封 11.02 / 剩余一半"></label>
  <div class="ea"><button type="button" class="open">打开笔记</button><span></span><button type="button" class="cancel">取消</button><button class="go">保存</button></div></form></dialog>`);
const itd = root.querySelector("dialog.itd"), itf = itd.querySelector("form");
let editing = null; // null = 新物品
function openItem(i) {
  editing = i || null;
  itd.querySelector("h3").textContent = i ? "编辑物品" : "添加物品";
  itd.querySelector(".open").hidden = !i;
  itf.reset();
  itf.n.value = i ? i.name : ""; itf.c.value = i ? i.category : (cat || "小玩意"); itf.l.value = i && i.location !== "—" ? i.location : "";
  itf.b.value = i ? i.bought : T; itf.p.value = i && i.price != null ? i.price : ""; itf.w.value = i ? i.warranty : ""; itf.o.value = i ? i.note : "";
  itd.showModal(); itf.n.focus();
}
function addItem() { openItem(null); }
itd.querySelector(".cancel").addEventListener("click", () => itd.close());
itd.querySelector(".open").addEventListener("click", () => { itd.close(); if (editing) L.open(editing.path); });
itf.addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = L.safeTitle(itf.n.value).trim();
  if (!name) return;
  const v = { category: itf.c.value, location: itf.l.value.trim(), bought: itf.b.value, price: itf.p.value === "" ? "" : Number(itf.p.value), warranty: itf.w.value, note: itf.o.value.trim() };
  let path = editing ? editing.path : null;
  if (!editing) {
    path = `30 后勤部/物品/${name}.md`;
    for (let n = 2; L.fileOf(path); n++) path = `30 后勤部/物品/${name} ${n}.md`;
    await app.vault.create(path, `---\ncategory: ${v.category}\n---\n# ${name}\n`);
  } else if (name !== editing.name) {
    let to = `30 后勤部/物品/${name}.md`;
    for (let n = 2; L.fileOf(to); n++) to = `30 后勤部/物品/${name} ${n}.md`;
    await app.vault.process(L.fileOf(path), (t) => t.replace(`\n# ${editing.name}`, `\n# ${name}`));
    await app.fileManager.renameFile(L.fileOf(path), to);
    path = to;
  }
  await app.fileManager.processFrontMatter(L.fileOf(path), (fm) => { Object.assign(fm, v); });
  const it = editing || {};
  Object.assign(it, { path, name: path.split("/").pop().replace(/\.md$/, ""), category: v.category, location: v.location || "—", bought: v.bought, price: v.price, warranty: v.warranty, note: v.note });
  if (!editing) { all.unshift(it); if (items !== all && cat === v.category) items.unshift(it); } // 总页面里 items 就是 all，只加一次
  else if (cat && v.category !== cat) items.splice(items.indexOf(it), 1); // 分页面里改成别的类别就不在这页了
  itd.close();
  render();
  L.notice(editing ? `${it.name} 改好了` : `${it.name} 加进物品墙了`);
});
root.addEventListener("click", (e) => {
  if (e.target.closest(".delb")) return;
  const c = e.target.closest(".item[data-i]");
  if (c) openItem(all[+c.dataset.i]);
});
root.addEventListener("keydown", (e) => {
  const c = e.target.closest(".item[data-i]");
  if (c && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); openItem(all[+c.dataset.i]); }
});
