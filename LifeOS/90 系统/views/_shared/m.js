// 手机页面共用的外壳：顶部返回 + 标题，底部「我想记…」（或搜索框）+「+」菜单。照 demo/v4/mobile.js。
// 用法：const M = eval(await dv.io.load("90 系统/views/_shared/m.js"))(L);
//   const root = M.mount(dv, M.head({title, sub, back}) + body, STYLE, {search: "东西放哪了…"});
// 整个文件是一个表达式（一个函数），eval 的结果就是它。
((L) => {
  const DIR = "10 总部/手机/";
  const HOME = "10 总部/手机/手机首页", MORE = "10 总部/手机/所有部门", FRIDGE = "10 总部/手机/冰箱";
  const SHORTCUT = "shortcuts://run-shortcut?name=" + encodeURIComponent("记一笔"); // iOS 快捷指令「记一笔」
  const BACK = '<svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><path d="M11 3 5 9l6 6" fill="none" stroke="#252d29" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const PLUS = '<svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true"><path d="M11 3v16M3 11h16" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/></svg>';
  const LENS = '<svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true"><circle cx="9" cy="9" r="6.2" fill="none" stroke="#252d29" stroke-width="1.7"/><path d="m13.6 13.6 4 4" stroke="#252d29" stroke-width="1.7" stroke-linecap="round"/></svg>';
  const IC_MONEY = '<svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true"><path d="M10 3v14M5 7.5h7a2.5 2.5 0 0 1 0 5H8a2.5 2.5 0 0 0 0 5h7" fill="none" stroke="#3e5b4b" stroke-width="1.7" stroke-linecap="round" transform="translate(0 -1.5)"/></svg>';
  const IC_FRIDGE = '<svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true"><rect x="5" y="2.5" width="10" height="15" rx="2.5" fill="none" stroke="#3e5b4b" stroke-width="1.7"/><path d="M5 8.5h10M8 5v1.5M8 11v2" stroke="#3e5b4b" stroke-width="1.7" stroke-linecap="round"/></svg>';

  const head = ({ title, sub = "", back = MORE }) =>
    `<header class="navbar">${L.link(back, BACK, "round")}<div class="title"><h1>${L.esc(title)}</h1>${sub ? `<p>${sub}</p>` : ""}</div></header>`;

  // 和纸胶带：贴在某个块的上边
  const tape = (color, pos) => `<i class="tape" aria-hidden="true" style="--tape:${color};${pos}"></i>`;

  // opts.search：给了就是搜索框（过滤页面里带 data-q 的块），不给就是「我想记…」
  function mount(dv, html, style, opts = {}) {
    const field = opts.search
      ? `<label class="search">${LENS}<input class="q" placeholder="${L.esc(opts.search)}" aria-label="${L.esc(opts.search)}"></label>`
      : `<form class="capture"><input placeholder="我想记…" aria-label="记进随手记" enterkeyhint="done"><span class="ok" hidden>已存进随手记</span></form>`;
    // 菜单放在底栏里面：底栏贴着屏幕底部，菜单就总是在「+」上方
    const dock = `<div class="dock"><div class="sheet" role="menu" aria-label="新建">
        <button role="menuitem" data-go="money"><span class="ic" style="background:#dfe8db">${IC_MONEY}</span>记一笔</button>
        <button role="menuitem" data-go="fridge"><span class="ic" style="background:#fdefee">${IC_FRIDGE}</span>放进冰箱</button></div>
      ${field}<button class="dash-fab" aria-label="新建" aria-expanded="false">${PLUS}</button></div>`;
    const root = L.mount(dv, html + dock, style);
    root.classList.add("m");

    const fab = root.querySelector(".dash-fab"), sheet = root.querySelector(".sheet");
    const toggle = (o) => { sheet.classList.toggle("open", o); fab.classList.toggle("open", o); fab.setAttribute("aria-expanded", o); };
    fab.addEventListener("click", () => toggle(!sheet.classList.contains("open")));
    sheet.querySelector('[data-go="money"]').addEventListener("click", () => { toggle(false); window.open(SHORTCUT); });
    sheet.querySelector('[data-go="fridge"]').addEventListener("click", () => { toggle(false); window.lifeosFridgeAdd = true; L.open(FRIDGE); });

    const form = root.querySelector("form.capture");
    if (form) form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const input = form.querySelector("input"), text = input.value.trim();
      if (!text) return;
      await L.newCard(text);
      input.value = ""; input.blur();
      const ok = form.querySelector(".ok");
      input.hidden = true; ok.hidden = false;
      setTimeout(() => { input.hidden = false; ok.hidden = true; }, 1400);
    });
    const q = root.querySelector(".search .q");
    if (q) q.addEventListener("input", () => {
      const s = q.value.trim().toLowerCase();
      root.querySelectorAll("[data-q]").forEach((el) => { el.hidden = !!s && !el.dataset.q.toLowerCase().includes(s); });
    });
    return root;
  }

  // 一组「筛选」按钮：点一个，只留 data-k 相同的块；再点「全部」恢复
  function chips(root, sel, items) {
    root.querySelectorAll(`${sel} button`).forEach((b) => b.addEventListener("click", () => {
      root.querySelectorAll(`${sel} button`).forEach((x) => x.setAttribute("aria-pressed", x === b));
      root.querySelectorAll(items).forEach((n) => { n.hidden = !(b.dataset.f === "all" || n.dataset.k === b.dataset.f); });
    }));
  }

  return { DIR, HOME, MORE, FRIDGE, SHORTCUT, head, tape, mount, chips };
})
