// 网页版左侧导航（所有电脑面板相同）。照 demo/v4/desktop.js 和 UI 规范第 5 节。参数 {page}：当前页，高亮用。
// 和同一个 dataviewjs 块里的面板并排：块是两列网格，左边这一栏，右边面板（样式在 lifeos.css 的「侧栏」一节）。
const L = eval(await dv.io.load("90 系统/views/_shared/lib.js"));
const D = eval(await dv.io.load("90 系统/views/_shared/data.js"))(L, dv);
const page = (input && input.page) || "";
const T = D.T;

// 角标：快过期的食物、知识卡总数、本周还没交的截止
const soon = (await D.food()).filter((f) => f.left !== null && f.left <= 3).length;
const cards = dv.pages('"40 研发部/知识卡"').length;
const sun = L.addDays(L.mondayOf(T), 6);
const due = (await D.deadlines()).filter((d) => !d.done && d.due && d.due.slice(0, 10) >= T && d.due.slice(0, 10) <= sun).length;

const NAV = [
  ["h", "OVERVIEW"],
  ["home", "首页", "10 总部/首页"], ["inbox", "随手记", "00 随手记/随手记"], ["review", "每周复盘", "10 总部/周复盘面板"],
  ["h", "DEPARTMENTS"],
  ["finance", "财务部", "20 财务部/财务面板"],
  ["x", "后勤部", ["fridge", "things"]],
  ["fridge", "食物墙", "30 后勤部/食物墙", soon, 1], ["things", "物品墙", "30 后勤部/物品墙", 0, 1],
  ["x", "研发部", ["notes", "english"]],
  ["notes", "知识库", "40 研发部/知识库", cards, 1], ["english", "多邻国 · 英语", "40 研发部/英语/英语面板", 0, 1],
  ["school", "教务处", "45 教务处/教务面板", due], ["career", "人事部 · 求职", "50 人事部/求职"],
  ["h", "PRIVATE"],
  ["private", "个人档案 🔒", "60 个人档案/个人档案"],
];

let h = `${L.link("10 总部/首页", "my little <b>os.</b>", "brand")}`;
for (const [k, label, to, count, sub] of NAV) {
  if (k === "h") { h += `<h6>${label}</h6>`; continue; }
  if (k === "x") { h += `<span class="grp${to.includes(page) ? " on" : ""}">${label}</span>`; continue; }
  const inner = `<span>${L.esc(label)}</span>${count ? `<i>${count}</i>` : ""}`;
  h += k === page
    ? `<a class="${sub ? "sub " : ""}on" aria-current="page">${inner}</a>`
    : L.link(to, inner, sub ? "sub" : "");
}
h += L.link("10 总部/手机/手机首页", "📱 手机版 →", "foot");

const root = L.mount(dv, `<nav class="side" aria-label="导航">${h}</nav>`);
root.classList.add("side-host");
