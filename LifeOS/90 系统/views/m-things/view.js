// 手机 · 物品墙：类别筛选 + 一张列表，位置写大一点，保修快到期用警示色。布局照 demo/v4/mobile-things.html。
const L = eval(await dv.io.load("90 系统/views/_shared/lib.js"));
const D = eval(await dv.io.load("90 系统/views/_shared/data.js"))(L, dv);
const M = eval(await dv.io.load("90 系统/views/_shared/m.js"))(L);
const esc = L.esc, T = D.T;
const BG = { 电子: "var(--pink)", 小玩意: "var(--purple)", 衣物: "var(--blue)", 化妆品: "var(--apricot)", 厨房: "var(--yellow)" };
const PIN = '<svg width="12" height="15" viewBox="0 0 13 16" aria-hidden="true"><path d="M6.5 15s5.5-5.2 5.5-9A5.5 5.5 0 0 0 1 6c0 3.8 5.5 9 5.5 9z" fill="none" stroke="#3e5b4b" stroke-width="1.5"/><circle cx="6.5" cy="6" r="1.8" fill="#3e5b4b"/></svg>';

const items = D.things();
const soon = items.filter((i) => i.warranty && L.daysLeft(i.warranty, T) >= 0 && L.daysLeft(i.warranty, T) <= 60).length;
function right(i) {
  if (i.warranty) {
    const n = L.daysLeft(i.warranty, T);
    return n < 0 ? ["保修已过期", "warn"] : n <= 60 ? [`保修 ${+i.warranty.slice(5, 7)} 月到期`, "warn"] : [`保修到 ${i.warranty.slice(0, 7).replace("-", ".")}`, ""];
  }
  return [i.note, ""];
}

const html = M.head({ title: "物品墙", sub: `${items.length} 件${soon ? ` · ${soon} 件保修快到期` : ""}` }) +
  `<div class="chips" role="group" aria-label="类别"><button aria-pressed="true" data-f="all">全部</button>${L.ITEM_CATEGORIES.map((c) => `<button aria-pressed="false" data-f="${c}">${c}</button>`).join("")}</div>
  <section class="card tlist" aria-label="物品"><ul>${items.map((i) => { const [txt, cls] = right(i);
    return `<li data-k="${esc(i.category)}" data-q="${esc(i.name + " " + i.location)}"><span class="sw" style="background:${BG[i.category] || "var(--tint)"}"></span><div>${L.link(i.path, `<b>${esc(i.name)}</b>`)}<span class="where">${PIN}${esc(i.location)}</span></div><small class="${cls}">${esc(txt)}</small></li>`; }).join("")}</ul></section>`;

const STYLE = `
.lifeos-dash .m .tlist ul{list-style:none;margin:0;padding:0}
.lifeos-dash .m .tlist li{display:grid;grid-template-columns:36px 1fr auto;gap:12px;align-items:center;padding:11px 0;border-bottom:1px solid rgba(37,45,41,.06)}
.lifeos-dash .m .tlist li:last-child{border-bottom:0}
.lifeos-dash .m .sw{width:36px;height:36px;border-radius:12px}
.lifeos-dash .m .tlist b{display:block;font-size:15px;font-weight:600;letter-spacing:-.02em}
.lifeos-dash .m .where{display:flex;align-items:center;gap:5px;font-size:14px;color:var(--ink);margin-top:2px}
.lifeos-dash .m .tlist small{font-size:12px;color:var(--muted);text-align:right}
.lifeos-dash .m .tlist small.warn{color:var(--warn)}`;

const root = M.mount(dv, html, STYLE, { search: "东西放哪了…" });
M.chips(root, ".chips", ".tlist li");
