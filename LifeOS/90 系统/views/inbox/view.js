// 随手记：快速记录 + 类型筛选 + 便签墙。布局照 demo/v4/desktop-inbox.html。
const L = eval(await dv.io.load("90 系统/views/_shared/lib.js"));
const esc = L.esc;
const TYPES = ["活动", "备忘", "灵感", "链接", "清单"];
const IDEA_BG = ["#e6ede2", "#faf0dc", "#f6e3df"];
const PIN = '<svg class="pin" width="14" height="14" viewBox="0 0 16 16" aria-label="置顶"><path d="M9.8 1.5 14.5 6.2l-2 .6-2.6 2.6.3 3.4-1.3 1.3L6.3 11.5 2.5 15.3l-.8-.8 3.8-3.8L2.9 8.1l1.3-1.3 3.4.3L10.2 4.5z" fill="#94604b"/></svg>';

const cards = (await L.cards(dv)).sort((a, b) => b.mtime - a.mtime || b.created.localeCompare(a.created));
let idea = 0;

function card(c, i) {
  const bg = c.type === "备忘" ? "#f4f8fe" : c.type === "活动" ? "#fef7de" : c.type === "灵感" ? IDEA_BG[idea++ % 3] : "#fff";
  const when = c.type === "活动" && c.date ? ` · ${L.md(c.date)} ${L.WEEK_CN[L.weekday(c.date)]}` : "";
  const right = c.pinned ? PIN : esc(c.source);
  const tag = c.tags[0] || "";
  let body = "";
  if (c.type === "链接") {
    const [url, ...rest] = (c.body.split("\n")[0] || "").split(" · ");
    const host = url.replace(/^[a-z]+:\/\//i, "").split("/")[0];
    body = `<p style="font-size:16px;color:var(--ink)">${esc(host)}</p><p style="font-size:13px">${esc(rest.join(" · "))}</p>`;
  } else if (c.body) {
    body = `<p${c.type === "灵感" && c.body.length < 16 ? ' class="say"' : ""}>${esc(c.body).replace(/\n/g, "<br>")}</p>`;
  }
  const tasks = c.tasks.length || c.type === "备忘" || c.type === "清单"
    ? `<ul>${c.tasks.map((t, ti) => `<li class="${t.done ? "done" : ""}" data-t="${ti}"><button class="ck" aria-label="完成">${L.CK}</button><span class="t">${esc(t.text)}</span></li>`).join("")}
       <li class="new"><button class="ck" aria-label="新的一项" tabindex="-1"></button><input aria-label="加一项"></li></ul>` : "";
  const done = c.tasks.length - c.open;
  const count = c.tasks.length ? `${done} / ${c.tasks.length}${c.type === "清单" ? " 已完成" : ""}` : c.type === "链接" ? '<a class="go">打开链接 ↗</a>' : "";
  const foot = tag || count ? `<div class="foot"><span>${esc(tag)}</span><span>${count}</span></div>` : "";
  return `<article class="note ${body.includes('class="say"') ? "big" : ""}" data-k="${c.type}" data-i="${i}" style="background:${bg}">
    <div class="meta"><span>${c.type}${when}</span>${right}</div>${L.link(c.path, `<h3>${esc(c.title)}</h3>`)}${body}${tasks}${foot}</article>`;
}

const counts = Object.fromEntries(TYPES.map((t) => [t, cards.filter((c) => c.type === t).length]));
const html = `
<div class="topbar"><span></span><label class="find">⌕ <input class="q" placeholder="搜索随手记…" aria-label="搜索随手记"></label></div>
<h1 class="title">随手记</h1>
<section class="quick" aria-label="快速记录">
  <h2>现在想记点什么？</h2>
  <textarea placeholder="我想记…" aria-label="内容" rows="1"></textarea>
  <div class="row2">
    <button class="mode on" data-m="备忘">文字</button><button class="mode" data-m="清单">清单</button><button class="mode" data-m="链接">链接</button><button class="mode" data-m="活动">活动</button>
    <button class="btn pri save">存一下 →</button>
  </div>
</section>
<div class="filters">
  <button class="on" data-f="all">全部 ${cards.length}</button>${TYPES.map((t) => `<button data-f="${t}">${t} ${counts[t]}</button>`).join("")}
  <span class="sort">按最近更新 ↓</span>
</div>
<div class="wall">${cards.map(card).join("")}</div>`;

const STYLE = `
.lifeos-dash .dash .topbar{display:flex;justify-content:space-between;align-items:center;height:52px}
.lifeos-dash .find{width:270px;height:52px;border-radius:26px;background:#fff;box-shadow:var(--sh-lift);display:flex;align-items:center;gap:8px;padding:0 20px;font-size:16px;color:var(--muted)}
.lifeos-dash .find input,.lifeos-dash .quick textarea,.lifeos-dash .note li.new input{border:0;outline:none;background:none;box-shadow:none;font:inherit;color:var(--ink);padding:0}
.lifeos-dash .find input{flex:1;font-size:16px}
.lifeos-dash .title{font-family:var(--zcool);font-size:44px;font-weight:400;margin:20px 0 22px}
.lifeos-dash .quick{background:#fff;border-radius:18px;border:1px solid rgba(37,45,41,.06);box-shadow:var(--sh-card);padding:22px 22px 20px;margin-bottom:20px}
.lifeos-dash .quick h2{font-size:22px;font-weight:500}
.lifeos-dash .quick textarea{display:block;width:100%;resize:none;font-size:16px;margin:12px 0 16px;min-height:26px}
.lifeos-dash .quick textarea::placeholder,.lifeos-dash .find input::placeholder{color:var(--muted)}
.lifeos-dash .quick .row2{display:flex;align-items:center;gap:8px}
.lifeos-dash .dash .quick .mode{height:38px;padding:0 18px;border-radius:12px;font-size:15px;color:var(--ink-2)}
.lifeos-dash .dash .quick .mode.on{background:var(--sage);color:var(--ink)}
.lifeos-dash .quick .save{margin-left:auto}
.lifeos-dash .filters{display:flex;align-items:center;gap:6px;margin-bottom:20px}
.lifeos-dash .dash .filters button{height:42px;padding:0 20px;border-radius:999px;font-size:15px;color:var(--ink-2)}
.lifeos-dash .dash .filters button.on{background:var(--green);color:#fff}
.lifeos-dash .filters .sort{margin-left:auto;font-size:14px;color:var(--ink-2)}
.lifeos-dash .wall{columns:3;column-gap:18px}
.lifeos-dash .note{break-inside:avoid;border-radius:20px;padding:20px 20px 18px;margin-bottom:18px;box-shadow:var(--sh-card);border:1px solid rgba(37,45,41,.04)}
.lifeos-dash .note .meta{display:flex;justify-content:space-between;font-size:12px;color:var(--ink-2);margin-bottom:14px}
.lifeos-dash .note h3{font-family:var(--zcool);font-weight:400;font-size:26px;margin-bottom:14px}
.lifeos-dash .note p{font-size:15px;color:var(--ink-2);line-height:1.65}
.lifeos-dash .note .foot{display:flex;justify-content:space-between;font-size:12px;color:var(--ink-2);margin-top:14px}
.lifeos-dash .note ul{list-style:none;margin:0;padding:0}
.lifeos-dash .note li{display:flex;align-items:center;gap:10px;font-size:15px;padding:5px 0}
.lifeos-dash .note li .ck{width:20px;height:20px}
.lifeos-dash .note li.new input{flex:1;border-bottom:1px dashed rgba(37,45,41,.2);font-size:15px;padding:2px 0}
.lifeos-dash .note li.new .ck{border-style:dashed}
.lifeos-dash .note.big h3{font-size:24px}
.lifeos-dash .note .say{font-family:var(--zcool);font-size:27px;line-height:1.55;color:#5c3f33}
.lifeos-dash .note[hidden]{display:none}
.lifeos-dash .note .go{cursor:pointer}
.is-mobile .lifeos-dash .wall{columns:1}
.is-mobile .lifeos-dash .filters{flex-wrap:wrap}`;

const root = L.mount(dv, html, STYLE);

// 快速记录
let mode = "备忘";
root.querySelectorAll(".quick .mode").forEach((b) => b.addEventListener("click", () => {
  mode = b.dataset.m;
  root.querySelectorAll(".quick .mode").forEach((x) => x.classList.toggle("on", x === b));
}));
const ta = root.querySelector(".quick textarea");
ta.addEventListener("input", () => { ta.style.height = "auto"; ta.style.height = ta.scrollHeight + "px"; });
root.querySelector(".quick .save").addEventListener("click", async () => {
  const text = ta.value.trim();
  if (!text) return;
  const [first, ...rest] = text.split("\n");
  const body = mode === "清单" ? [first, ...rest.map((l) => `- [ ] ${l.replace(/^[-*]\s*/, "")}`)].join("\n") : text;
  await L.newCard(body, mode);
  ta.value = ""; ta.style.height = "";
  L.notice("已存进随手记");
});

// 筛选和搜索
let filter = "all";
const apply = () => {
  const q = root.querySelector(".find .q").value.trim().toLowerCase();
  root.querySelectorAll(".note").forEach((n) => {
    const c = cards[+n.dataset.i];
    const hit = !q || (c.title + c.body + c.tasks.map((t) => t.text).join(" ")).toLowerCase().includes(q);
    n.hidden = !((filter === "all" || n.dataset.k === filter) && hit);
  });
};
root.querySelectorAll(".filters button").forEach((b) => b.addEventListener("click", () => {
  filter = b.dataset.f;
  root.querySelectorAll(".filters button").forEach((x) => x.classList.toggle("on", x === b));
  apply();
}));
root.querySelector(".find .q").addEventListener("input", apply);

// 勾选、加一项、打开链接
root.querySelectorAll(".note").forEach((n) => {
  const c = cards[+n.dataset.i];
  n.querySelectorAll("li[data-t]").forEach((li) => li.querySelector(".ck").addEventListener("click", async () => {
    if (li.classList.toggle("done")) L.stamp(li.querySelector(".ck"));
    await L.toggleTaskAt(c.path, c.tasks[+li.dataset.t].line);
  }));
  const input = n.querySelector("li.new input");
  if (input) input.addEventListener("keydown", async (e) => {
    if (e.key !== "Enter" || !input.value.trim()) return;
    e.preventDefault();
    const item = input.value.trim();
    const f = L.fileOf(c.path);
    await app.vault.process(f, (text) => {
      const ls = text.replace(/\n+$/, "").split("\n");
      const last = ls.map((l, i) => (/^- \[[ x]\]/.test(l) ? i : -1)).filter((i) => i >= 0).pop();
      ls.splice(last === undefined ? ls.length : last + 1, 0, `- [ ] ${item}`);
      return ls.join("\n") + "\n";
    });
    const li = document.createElement("li");
    li.innerHTML = `<button class="ck" aria-label="完成">${L.CK}</button><span class="t">${esc(item)}</span>`;
    input.closest("li").before(li);
    input.value = "";
  });
  const go = n.querySelector(".go");
  if (go) go.addEventListener("click", () => {
    const url = (c.body.split("\n")[0] || "").split(" · ")[0].trim();
    if (url) window.open(url);
  });
});
