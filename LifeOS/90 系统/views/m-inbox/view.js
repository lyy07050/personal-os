// 手机 · 随手记：类型筛选 + 两列便签墙。布局照 demo/v4/mobile-inbox.html。
const L = eval(await dv.io.load("90 系统/views/_shared/lib.js"));
const M = eval(await dv.io.load("90 系统/views/_shared/m.js"))(L);
const esc = L.esc;
const TYPES = ["活动", "备忘", "灵感", "清单", "链接"];
const IDEA_BG = ["#e6ede2", "#faf0dc", "#f6e3df"];

const cards = (await L.cards(dv)).sort((a, b) => b.mtime - a.mtime || b.created.localeCompare(a.created));
const toSort = cards.filter((c) => c.type === "灵感" || c.type === "链接").length;
let idea = 0;

function note(c, i) {
  const bg = c.type === "备忘" ? "var(--m-blue)" : c.type === "活动" ? "var(--m-yellow)" : c.type === "灵感" ? IDEA_BG[idea++ % 3] : "#fff";
  const when = c.type === "活动" && c.date ? ` · ${L.md(c.date)} ${L.WEEK_CN[L.weekday(c.date)]}` : "";
  let body = "";
  if (c.type === "链接") {
    const [url, ...rest] = (c.body.split("\n")[0] || "").split(" · ");
    body = `<p>${esc([url.replace(/^[a-z]+:\/\//i, "").split("/")[0], ...rest].filter(Boolean).join(" · "))}</p>`;
  } else if (c.body) body = `<p>${esc(c.body.split("\n")[0])}</p>`;
  const tasks = c.tasks.length ? `<ul>${c.tasks.slice(0, 4).map((t, ti) => `<li data-t="${ti}" class="${t.done ? "done" : ""}"><button class="ck" aria-label="完成">${L.CK}</button><span class="t">${esc(t.text)}</span></li>`).join("")}</ul>${c.tasks.length > 4 ? `<p>还有 ${c.tasks.length - 4} 项</p>` : ""}` : "";
  return `<article class="card note" data-k="${c.type}" data-i="${i}" data-q="${esc(c.title + " " + c.body)}" style="background:${bg}"><span class="k">${c.type}${when}${c.pinned ? " · 置顶" : ""}</span>${L.link(c.path, `<b>${esc(c.title)}</b>`)}${body}${tasks}</article>`;
}

const html = M.head({ title: "随手记", sub: `${cards.length} 条${toSort ? ` · 还没整理 ${toSort} 条` : ""}` }) +
  `<div class="chips" role="group" aria-label="类型"><button aria-pressed="true" data-f="all">全部</button>${TYPES.map((t) => `<button aria-pressed="false" data-f="${t}">${t}</button>`).join("")}</div>
  <div class="masonry">${cards.map(note).join("")}</div>`;

const STYLE = `
.lifeos-dash .m .masonry{columns:2;column-gap:10px}
.lifeos-dash .m .note{break-inside:avoid;margin-bottom:10px;padding:14px;border-radius:22px}
.lifeos-dash .m .note .k{display:block;font-size:12px;color:var(--muted);margin-bottom:6px}
.lifeos-dash .m .note b{display:block;font-size:16px;font-weight:600;letter-spacing:-.02em;line-height:1.3}
.lifeos-dash .m .note p{font-size:13px;color:var(--ink-2);margin-top:4px;line-height:1.5}
.lifeos-dash .m .note ul{list-style:none;margin:6px 0 0;padding:0}
.lifeos-dash .m .note li{display:flex;align-items:center;gap:8px;font-size:13.5px;padding:3px 0}
.lifeos-dash .m .note li .ck{width:18px;height:18px}`;

const root = M.mount(dv, html, STYLE);
M.chips(root, ".chips", ".note");
root.querySelectorAll(".note li[data-t]").forEach((li) => li.querySelector(".ck").addEventListener("click", async () => {
  const c = cards[+li.closest(".note").dataset.i];
  if (li.classList.toggle("done")) L.stamp(li.querySelector(".ck"));
  await L.toggleTaskAt(c.path, c.tasks[+li.dataset.t].line);
}));
