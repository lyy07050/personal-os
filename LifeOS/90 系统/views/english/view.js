// 多邻国 · 英语。参数 {section: "today" | "words" | "mistakes"}。布局照 demo/v4/desktop-english.html。
// 单词卡是 Spaced Repetition 插件的 front::back；插件复习后会在行尾写 <!--SR:!日期,间隔,难度-->，用间隔算「掌握」。
const L = eval(await dv.io.load("90 系统/views/_shared/lib.js"));
const D = eval(await dv.io.load("90 系统/views/_shared/data.js"))(L, dv);
const esc = L.esc;
const T = L.today();
const section = (input && input.section) || "today";
const WORDS = "40 研发部/英语/单词本.md", MISTAKES = "40 研发部/英语/错词本.md";

const words = await D.wordCards(WORDS);
const mistakes = await D.wordCards(MISTAKES);
const word = D.wordOfDay(words);
const dmap = D.diaries();
const diaries = new Map([...dmap].map(([d, p]) => [d, p["背词"] === true]));
const streak = D.streak(dmap);
let longest = 0, run = 0;
[...diaries.keys()].sort().forEach((d, i, arr) => { run = diaries.get(d) && (i === 0 || L.daysLeft(d, arr[i - 1]) === 1) ? run + 1 : diaries.get(d) ? 1 : 0; longest = Math.max(longest, run); });
const mon = L.mondayOf(T);
const week = [...Array(7)].map((_, i) => diaries.get(L.addDays(mon, i)) === true);
const last14 = [...Array(14)].map((_, i) => diaries.get(L.addDays(T, i - 13)) === true);
const dueToday = words.filter((w) => w.due && w.due <= T).length;

// 开始学习：一轮 10 个词，今天该复习的先来，然后是掌握最少的；不记得的进错词本，学完给今天的「背词」打勾
function startReview() {
  const deck = [...words].sort((a, b) => ((a.due && a.due <= T) ? 0 : 1) - ((b.due && b.due <= T) ? 0 : 1) || a.mastery - b.mastery || Math.random() - 0.5).slice(0, 10)
    .map((w) => ({ front: w.front, back: w.back, w }));
  L.flashcards(root, deck, {
    title: "背单词", hint: "不记得的已经放进错词本",
    onForget: async (c) => {
      if (!mistakes.some((m) => m.front === c.front)) { await L.appendLine(MISTAKES, `${c.front}::${c.back}`); mistakes.push(c.w); }
    },
    onDone: () => D.setHabit(T, "背词", true),
  });
}

const o = {
  page: "english", eye: "41 · ENGLISH", title: { today: "多邻国", words: "单词本", mistakes: "错词本" }[section],
  facts: `连续 <b>${streak} 天</b>${dueToday ? ` · 今天要复习 ${dueToday} 个` : ""} · 单词本 ${words.length} 个`,
  btns: [{ label: "开始学习", cls: "pri", onclick: startReview }, { label: "＋ 收一个词", onclick: () => { const f = root.querySelector(".addw"); f.hidden = false; f.querySelector("input").focus(); } }],
  arts: [{ file: "notepaper.png", style: "left:865px;top:-91px;width:277px" }],
};
const dots = (n) => `<span class="mast" aria-label="掌握 ${n} / 5">${[...Array(5)].map((_, i) => `<i class="${i < n ? "on" : ""}"></i>`).join("")}</span>`;
// 每个词记一个编号，删除时按编号找回那一行原文
const reg = [], wid = (w) => reg.push(w) - 1;
const delW = (w) => L.delBtn(w.front, `data-w="${wid(w)}"`);
const table = (list) => `<table><thead><tr><th>单词</th><th>释义</th><th>掌握</th><th></th></tr></thead><tbody>${list.map((w) => `<tr class="has-del"><td><b>${esc(w.front)}</b></td><td>${esc(w.back.split("·")[0].trim())}</td><td>${dots(w.mastery)}</td><td class="dc">${delW(w)}</td></tr>`).join("")}</tbody></table>`;
const missList = (list) => `<ul class="list miss">${list.map((w) => `<li class="has-del"><span class="sq"></span>${esc(w.front)}<span>${esc(w.back.split("·")[0].replace(/^[a-z]+\.\s*/, "").trim())}</span>${delW(w)}</li>`).join("")}</ul>`;
const addForm = `<form class="addw" hidden><input name="f" placeholder="单词或表达" aria-label="单词" required><input name="b" placeholder="中文意思 · 例句" aria-label="意思"><label><input type="checkbox" name="m"> 也放进错词本</label><button class="btn pri">收进单词本</button></form>`;

let body = "";
if (section === "today") {
  body = `<div class="row c2">
    <section class="card streak" style="height:338px"><div class="head"><h2>连续学习</h2><span class="note">本周</span></div>
      <span class="g">${streak}<small>天</small></span>
      <div class="days">${week.map((on, i) => `<span><i class="${on ? "on" : ""}"></i>${"一二三四五六日"[i]}</span>`).join("")}</div></section>
    <section class="card" style="height:338px"><div class="head"><h2>今日单词</h2></div>
      <div class="wod"><span class="g">${esc(word ? word.front : "—")}</span><p>${esc(word ? word.back : "")}</p></div></section>
  </div>
  <section class="card"><div class="head"><h2>错词本</h2>${L.link("40 研发部/英语/英语面板/错词本", `全部 ${mistakes.length} 个 →`, "note")}</div>${missList(mistakes.slice(0, 6))}</section>
  <section class="card"><div class="head"><h2>单词本</h2>${L.link("40 研发部/英语/英语面板/单词本", `全部 ${words.length} 个 →`, "note")}</div>${table(words.slice(-5).reverse())}</section>
  <section class="card"><div class="head"><h2>最近 14 天</h2></div>
    <div style="display:flex;gap:24px;align-items:center"><span style="font-size:16px;color:var(--ink-2)">背词</span><span class="beads">${last14.map((v) => `<i class="${v ? "" : "off"}"></i>`).join("")}</span></div>
    <p style="font-size:16px;color:var(--ink-2);margin-top:18px">14 天里背了 ${last14.filter(Boolean).length} 天 · 最长连续 ${longest} 天</p></section>`;
} else if (section === "words") {
  body = `<section class="card"><div class="head"><h2>${words.length} 个</h2><label class="find">⌕ <input class="q" placeholder="查单词…" aria-label="查单词"></label></div>${table([...words].reverse())}</section>`;
} else {
  body = `<section class="card"><div class="head"><h2>${mistakes.length} 个</h2></div>${missList(mistakes)}</section>`;
}

const STYLE = `
.lifeos-dash .wlist{max-height:520px}
.lifeos-dash .streak .g{font-size:56px;line-height:1;color:var(--green)}
.lifeos-dash .streak .g small{font-size:32px;color:var(--ink-2)}
.lifeos-dash .days{display:grid;grid-template-columns:repeat(7,1fr);gap:8px;margin-top:22px;text-align:center;font-size:15px;color:var(--ink-2)}
.lifeos-dash .days i{display:block;height:40px;border-radius:10px;margin-bottom:10px;background:var(--sage)}
.lifeos-dash .days i.on{background:var(--blue);border:1px solid #cfe3ee}
.lifeos-dash .wod{height:212px;border-radius:14px;background:#e6ede2;box-shadow:var(--sh-lift);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:0 20px;text-align:center}
.lifeos-dash .wod .g{font-size:56px}
.lifeos-dash .wod p{font-size:16px;color:var(--ink-2)}
.lifeos-dash .miss li{display:grid;grid-template-columns:26px 1fr auto 34px;align-items:center;font-size:16px;padding:11px 0}
.lifeos-dash .miss .sq{width:14px;height:14px;border-radius:3px;background:var(--brown);align-self:center}
.lifeos-dash .mast{display:flex;gap:4px}
.lifeos-dash .mast i{width:9px;height:9px;border-radius:50%;background:#dfe5df}
.lifeos-dash .mast i.on{background:var(--green)}
.lifeos-dash .beads{display:flex;gap:6px;align-items:center}
.lifeos-dash .beads i{width:22px;height:22px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#fff,#f4d9d4 55%,#e9c3bc);box-shadow:0 1px 3px rgba(0,0,0,.08)}
.lifeos-dash .beads i.off{background:#dfe5df}
.lifeos-dash .find{height:44px;border-radius:22px;background:var(--tile);display:flex;align-items:center;gap:8px;padding:0 16px;color:var(--muted)}
.lifeos-dash .find input,.lifeos-dash .addw input:not([type]){border:0;outline:none;background:none;box-shadow:none;font:inherit;color:var(--ink)}
.lifeos-dash .addw{display:flex;gap:10px;align-items:center;margin-top:16px}
.lifeos-dash .addw[hidden]{display:none}
.lifeos-dash .addw input:not([type]){height:40px;border-radius:12px;background:#fff;border:1px solid rgba(37,45,41,.12);padding:0 12px}
.lifeos-dash .addw label{font-size:14px;color:var(--ink-2);display:flex;gap:6px;align-items:center}`;

const root = L.mount(dv, L.banner(o) + `<div class="stack">${body}</div>`, STYLE);
// 单词表、错词本在卡片里上下滑
root.querySelectorAll(".stack table, .stack .miss").forEach((t) => { const w = document.createElement("div"); w.className = "wlist"; t.replaceWith(w); w.appendChild(t); L.scrolly(w); });
L.wireBanner(root, o);
// 删除一个词：变淡 4 秒（可撤销），时间到了从单词本 / 错词本里删掉那一行
root.addEventListener("click", (e) => {
  const b = e.target.closest(".delb[data-w]");
  if (!b) return;
  const w = reg[+b.dataset.w];
  L.removeWithUndo(root, b.closest(".has-del"), `「${w.front}」删掉了`, () => L.removeLine(w.path, w.raw));
});
root.querySelector(".ban").insertAdjacentHTML("beforeend", addForm);
const form = root.querySelector(".addw");
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const v = Object.fromEntries(new FormData(form));
  const line = `${v.f.trim()}::${(v.b || "").trim()}`;
  await L.appendLine(WORDS, line);
  if (v.m) await L.appendLine(MISTAKES, line);
  form.reset(); form.hidden = true;
  L.notice(`${v.f.trim()} 收进单词本了`);
});
const q = root.querySelector(".find .q");
if (q) q.addEventListener("input", () => root.querySelectorAll("tbody tr").forEach((tr) => { tr.hidden = !tr.textContent.toLowerCase().includes(q.value.trim().toLowerCase()); }));
