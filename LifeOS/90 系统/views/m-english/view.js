// 手机 · 多邻国：今日单词 + 本周连续学习 + 错词本 + 单词本。布局照 demo/v4/mobile-english.html。
const L = eval(await dv.io.load("90 系统/views/_shared/lib.js"));
const D = eval(await dv.io.load("90 系统/views/_shared/data.js"))(L, dv);
const M = eval(await dv.io.load("90 系统/views/_shared/m.js"))(L);
const esc = L.esc, T = D.T;

const words = await D.wordCards(D.WORDS);
const mistakes = await D.wordCards(D.MISTAKES);
const word = D.wordOfDay(words);
const dmap = D.diaries();
const streak = D.streak(dmap);
const mon = L.mondayOf(T);
const week = [...Array(7)].map((_, i) => (dmap.get(L.addDays(mon, i)) || {})["背词"] === true);
const dueToday = words.filter((w) => w.due && w.due <= T).length;
const mean = (w) => esc(w.back.split("·")[0].replace(/^[a-z]+\.\s*/, "").trim());
const list = (ws) => `<ul class="words">${ws.map((w) => `<li data-q="${esc(w.front + " " + w.back)}"><b>${esc(w.front)}</b><span>${mean(w)}</span></li>`).join("")}</ul>`;

const html = M.head({ title: "多邻国", sub: `连续 ${streak} 天${dueToday ? ` · 今天要复习 ${dueToday} 个` : ""}` }) + `
<section class="card wod" aria-label="今日单词">${M.tape("#fef0c4", "top:-8px;left:22px;rotate:-6deg")}<span class="label2">今日单词</span><b>${esc(word ? word.front : "—")}</b><p>${esc(word ? word.back : "单词本还是空的")}</p><button class="go">开始学习</button></section>
<section class="card streak" aria-label="连续学习"><div class="label"><span>连续学习</span><span class="count num">${streak} 天</span></div>
  <div class="days">${week.map((on) => `<i class="${on ? "on" : ""}"></i>`).join("")}</div><div class="dl">${"一二三四五六日".split("").map((d) => `<span>${d}</span>`).join("")}</div></section>
<section class="card" aria-label="错词本"><div class="label"><span>错词本</span><span class="count">${mistakes.length}</span></div>${list(mistakes.slice(0, 6))}</section>
<section class="card" aria-label="单词本" style="margin-top:12px"><div class="label"><span>单词本</span><span class="count">${words.length}</span></div>${list([...words].reverse())}</section>`;

const STYLE = `
.lifeos-dash .m .wod{background:var(--sage);margin-bottom:12px;padding:20px 18px;overflow:visible}
.lifeos-dash .m .label2{font-size:13px;color:var(--ink-2)}
.lifeos-dash .m .wod b{display:block;font-size:30px;font-weight:600;letter-spacing:-.02em;margin:6px 0 4px}
.lifeos-dash .m .wod p{font-size:13.5px;color:var(--ink-2)}
.lifeos-dash .m .go{margin-top:16px;height:44px;padding:0 22px;border-radius:999px;background:var(--green);color:#fff;font-size:15px;font-weight:600}
.lifeos-dash .m .streak{margin-bottom:12px}
.lifeos-dash .m .days{display:grid;grid-template-columns:repeat(7,1fr);gap:6px}
.lifeos-dash .m .days i{height:30px;border-radius:9px;background:var(--sage)}
.lifeos-dash .m .days i.on{background:var(--blue);border:1px solid #cfe3ee}
.lifeos-dash .m .dl{display:grid;grid-template-columns:repeat(7,1fr);gap:6px;text-align:center;font-size:12px;color:var(--muted);margin-top:6px}
.lifeos-dash .m .words{list-style:none;margin:0;padding:0}
.lifeos-dash .m .words li{display:flex;justify-content:space-between;align-items:baseline;gap:12px;padding:9px 0;border-bottom:1px solid rgba(37,45,41,.06);font-size:14px}
.lifeos-dash .m .words li:last-child{border-bottom:0}
.lifeos-dash .m .words b{font-weight:600}
.lifeos-dash .m .words span{color:var(--ink-2);text-align:right}`;

const root = M.mount(dv, html, STYLE, { search: "查单词…" });
root.querySelector(".go").addEventListener("click", () => D.startReview(D.WORDS));
