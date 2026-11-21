// 个人档案（60 · PRIVATE）。布局照 demo/v4/desktop-private.html。
// 内容加密后存在这篇笔记自己里（%% lifeos-vault:… %% 注释，阅读模式看不见）：
//   身体数据 + 尺码 用密码 A（profile），账号密码 用密码 B（accounts）
// 这个 view 只读、只写它所在的这篇笔记；密码不存，钥匙只在内存里；离开页面、切走窗口、5 分钟没动都会自动锁上。
const L = eval(await dv.io.load("90 系统/views/_shared/lib.js"));
const V = eval(await dv.io.load("90 系统/views/_shared/vault.js"));
const esc = L.esc;
const HERE = dv.current().file.path;
const IDLE_MS = 5 * 60 * 1000;

const BODY = ["体重", "体检", "生理期"], SIZE = ["衣服", "裤子", "鞋", "戒指"], SITES = ["邮箱", "学校", "银行"];
const blank = {
  profile: () => ({ body: BODY.map((k) => ({ k, a: "", b: "" })), size: SIZE.map((k) => ({ k, a: "", b: "" })) }),
  accounts: () => ({ rows: SITES.map((k) => ({ k, user: "", pass: "", note: "" })) }),
};
// 解锁后的状态（只在内存里）：{ key, salt, data }
const open = { profile: null, accounts: null };
const noteText = async () => (await dv.io.load(HERE)) || "";
let text = await noteText();
const has = (name) => !!V.readBlob(text, name);

// ---------- 画面 ----------
const LOCK = '<svg width="26" height="28" viewBox="0 0 20 22" aria-hidden="true"><rect x="2.5" y="9" width="15" height="11" rx="3" fill="none" stroke="#4f5c52" stroke-width="1.6"/><path d="M6 9V6.5a4 4 0 0 1 8 0V9" fill="none" stroke="#4f5c52" stroke-width="1.6"/></svg>';
const skel = (ws, label) => `<div class="sk">${ws.map((w) => `<i style="width:${w}%"></i>`).join("")}<div class="cover">${LOCK}<span>${label}</span></div></div>`;
const cell = (sec, i, f, v, ph, type = "text") => `<input type="${type}" data-s="${sec}" data-i="${i}" data-f="${f}" value="${esc(v)}" placeholder="${ph}" aria-label="${ph}" autocomplete="off" spellcheck="false">`;
const delRow = (sec, i, k) => `<button class="rm" data-s="${sec}" data-i="${i}" aria-label="删掉 ${esc(k)} 这一行" title="删掉这一行">✕</button>`;
function table(sec, rows, cols) {
  return `<table class="pt"><thead><tr><th>项目</th>${cols.map((c) => `<th>${c[1]}</th>`).join("")}<th></th></tr></thead><tbody>${rows.map((r, i) =>
    `<tr><td>${cell(sec, i, "k", r.k, "项目")}</td>${cols.map(([f, ph, type]) => `<td>${cell(sec, i, f, r[f], ph, type)}</td>`).join("")}<td>${delRow(sec, i, r.k)}</td></tr>`).join("")}</tbody></table>
    <button class="addrow" data-s="${sec}">＋ 加一行</button>`;
}
function render() {
  const p = open.profile, a = open.accounts;
  const o = {
    page: "private", eye: "60 · PRIVATE", title: "个人档案 🔒",
    facts: "只存在这台电脑 · 不上传云端 · AI 不读取 · 账号密码单独加密",
    btns: [p ? { label: "锁上", cls: "pri", onclick: () => lock("profile") } : { label: has("profile") ? "输入密码解锁" : "设置密码，开始记录", cls: "pri", onclick: () => ask("profile") }],
  };
  const lockedCard = (title, sub, ws) => `<section class="card lock"><div class="head" style="margin-bottom:0"><h2>${title}</h2></div><small>${sub}</small>${skel(ws, has("profile") ? "解锁后才能看" : "还没有设置密码")}</section>`;
  const cards = p
    ? `<section class="card"><div class="head" style="margin-bottom:0"><h2>身体数据</h2></div>${table("body", p.data.body, [["a", "记录"], ["b", "什么时候"]])}</section>
       <section class="card"><div class="head" style="margin-bottom:0"><h2>尺码</h2></div>${table("size", p.data.size, [["a", "尺码"], ["b", "备注"]])}</section>`
    : lockedCard("身体数据", "体重 · 体检 · 生理期", [80, 62, 74, 48]) + lockedCard("尺码", "衣服 · 鞋 · 戒指", [70, 55, 66, 40]);
  const acc = a
    ? `<section class="card"><div class="head"><h2>账号密码</h2><button class="btn sec lockb">锁上账号密码</button></div>${table("rows", a.data.rows, [["user", "账号"], ["pass", "密码", "password"], ["note", "备注"]])}</section>`
    : `<section class="card lock acc"><div class="head" style="margin-bottom:0"><h2>账号密码</h2><button class="btn sec unlockb">${has("accounts") ? "用第二个密码解锁" : "设置第二个密码"}</button></div>${skel([44, 58, 36, 50], has("accounts") ? "要第二个密码" : "还没有设置第二个密码")}</section>`;
  root.innerHTML = `<style>${STYLE}</style>` + L.banner(o) + `<div class="stack"><div class="row c2">${cards}</div>${acc}<p class="pv-st" role="status"></p></div>`;
  L.wireBanner(root, o);
}

// ---------- 密码小窗口 ----------
function ask(name) {
  const first = !has(name), second = name === "accounts";
  root.querySelector("dialog.pw")?.remove();
  root.insertAdjacentHTML("beforeend", `<dialog class="pw" aria-label="${first ? "设置密码" : "输入密码"}"><form>
    <h3>${first ? (second ? "设置第二个密码" : "设置密码") : (second ? "账号密码的密码" : "输入密码")}</h3>
    <input type="password" name="a" placeholder="密码" aria-label="密码" autocomplete="off" required>
    ${first ? `<input type="password" name="b" placeholder="再输一次" aria-label="再输一次密码" autocomplete="off" required>
    <p class="warn">⚠️ 忘记密码就再也打不开了，没有人能帮你找回。请记在你自己的地方（比如手机的「密码」App）。${second ? "建议和第一个密码不一样。" : ""}</p>` : ""}
    <p class="err" role="alert"></p>
    <div class="r"><button type="button" class="cancel">取消</button><button class="go">${first ? "设置并加密" : "解锁"}</button></div></form></dialog>`);
  const dlg = root.querySelector("dialog.pw"), f = dlg.querySelector("form"), err = dlg.querySelector(".err");
  dlg.querySelector(".cancel").addEventListener("click", () => dlg.close());
  dlg.addEventListener("close", () => dlg.remove());
  f.addEventListener("submit", async (e) => {
    e.preventDefault();
    const pw = f.a.value;
    if (first && pw !== f.b.value) { err.textContent = "两次输入的不一样"; return; }
    if (first && pw.length < 6) { err.textContent = "密码至少 6 位"; return; }
    f.querySelector(".go").disabled = true; err.textContent = first ? "加密中…" : "解锁中…";
    try {
      if (first) {
        const data = name === "profile" ? fromOldTables(text) : blank.accounts();
        const made = await V.create(pw, data);
        open[name] = { key: made.key, salt: made.salt, data };
        await writeNote(name, made.sealed, name === "profile");
      } else {
        text = await noteText();
        open[name] = await V.unlock(pw, V.readBlob(text, name));
      }
      f.reset(); dlg.close(); touch(); render();
    } catch (x) {
      err.textContent = x.message === "密码不对" ? "密码不对，再试一次" : `出错了：${x.message}`;
      f.querySelector(".go").disabled = false; f.a.select();
    }
  });
  dlg.showModal(); f.a.focus();
}

// 以前的模板是明文表格（## 身体数据 / ## 尺码）：第一次设密码时把里面填过的字搬进加密数据，再把明文表格删掉
function fromOldTables(t) {
  const data = blank.profile();
  for (const [sec, head] of [["body", "身体数据"], ["size", "尺码"]]) {
    const m = new RegExp(`## ${head}\\n([\\s\\S]*?)(?=\\n## |\\n%%|$)`).exec(t);
    if (!m) continue;
    for (const line of m[1].split("\n").filter((l) => l.startsWith("|") && !/^\|[\s|:-]+\|$/.test(l)).slice(1)) {
      const [k, a = "", b = ""] = line.split("|").slice(1, -1).map((x) => x.trim());
      if (!k) continue;
      const row = data[sec].find((r) => r.k === k);
      if (row) { row.a = a; row.b = b; } else data[sec].push({ k, a, b });
    }
  }
  return data;
}
async function writeNote(name, sealed, dropOld = false) {
  await app.vault.process(L.fileOf(HERE), (t) => {
    if (dropOld) t = t.replace(/\n## (身体数据|尺码)\n[\s\S]*?(?=\n## |\n%%|$)/g, "");
    return V.writeBlob(t, name, sealed);
  });
  text = await noteText();
}

// ---------- 改了就加密保存（停手 0.8 秒后） ----------
const timers = {};
function changed(name) {
  clearTimeout(timers[name]);
  status("还没保存…");
  timers[name] = setTimeout(async () => {
    const o = open[name];
    if (!o) return;
    await writeNote(name, await V.seal(o.key, o.salt, o.data));
    status("已加密保存 ✓");
  }, 800);
}
const status = (s) => { const el = root.querySelector(".pv-st"); if (el) el.textContent = s; };
const secOf = (s) => (s === "rows" ? "accounts" : "profile");
async function flush(name) {
  if (!timers[name] || !open[name]) return;
  clearTimeout(timers[name]); timers[name] = null;
  await writeNote(name, await V.seal(open[name].key, open[name].salt, open[name].data));
}

// ---------- 锁上 ----------
async function lock(name) {
  await flush(name);
  open[name] = null;
  render();
}
async function lockAll() {
  for (const n of ["profile", "accounts"]) if (open[n]) await lock(n);
}
let idle;
const touch = () => { clearTimeout(idle); idle = setTimeout(lockAll, IDLE_MS); };
document.addEventListener("visibilitychange", () => { if (document.hidden) lockAll(); });
// 离开这篇笔记（面板被换掉）就把内存里的东西清掉
const watch = setInterval(() => { if (!root.isConnected) { clearInterval(watch); clearTimeout(idle); open.profile = open.accounts = null; } }, 2000);

const STYLE = `
.lifeos-dash .lock{min-height:375px;display:flex;flex-direction:column}
.lifeos-dash .lock.acc{min-height:240px}
.lifeos-dash .lock small{font-size:15px;color:var(--muted)}
.lifeos-dash .sk{flex:1;position:relative;margin-top:18px}
.lifeos-dash .sk i{display:block;height:14px;border-radius:7px;background:#eef1ee;margin-bottom:16px}
.lifeos-dash .sk .cover{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;color:var(--ink-2);font-size:15px;background:linear-gradient(rgba(255,255,255,.2),rgba(255,255,255,.85) 40%)}
.lifeos-dash .row.c2{display:grid;grid-template-columns:1fr 1fr;gap:24px}
.lifeos-dash .pt{width:100%;border-collapse:collapse;margin-top:14px}
.lifeos-dash .pt th{text-align:left;font-size:13px;font-weight:500;color:var(--muted);padding:0 6px 6px}
.lifeos-dash .pt td{padding:3px 4px;border-top:1px solid rgba(37,45,41,.06)}
.lifeos-dash .pt td:last-child{width:30px}
.lifeos-dash .pt input{width:100%;height:36px;border:1px solid transparent;border-radius:10px;background:none;box-shadow:none;padding:0 8px;font:inherit;font-size:15px;color:var(--ink)}
.lifeos-dash .pt input:hover{background:var(--tile)}
.lifeos-dash .pt input:focus{background:#fff;border-color:var(--green);outline:none}
.lifeos-dash .pt td:first-child input{color:var(--ink-2)}
.lifeos-dash .dash .pt .rm{width:28px;height:28px;border-radius:8px;background:none;color:var(--muted);opacity:0;font-size:12px}
.lifeos-dash .pt tr:hover .rm,.lifeos-dash .pt .rm:focus-visible{opacity:1}
.lifeos-dash .dash .addrow{margin-top:8px;font-size:14px;color:var(--ink-2);background:none;padding:4px 6px}
.lifeos-dash .pv-st{font-size:13px;color:var(--muted);text-align:right;min-height:18px;margin:0}
.lifeos-dash dialog.pw{border:0;border-radius:22px;padding:22px 24px;width:min(380px,92vw);background:#fff;color:var(--ink);box-shadow:0 20px 60px rgba(37,45,41,.25)}
.lifeos-dash dialog.pw::backdrop{background:rgba(37,45,41,.35)}
.lifeos-dash .pw form{display:grid;gap:10px}
.lifeos-dash .pw h3{font-family:var(--zcool);font-weight:400;font-size:24px;margin:0 0 4px}
.lifeos-dash .pw input{height:44px;border-radius:12px;border:1px solid rgba(37,45,41,.14);background:var(--tile);padding:0 14px;font:inherit;font-size:16px;color:var(--ink);box-shadow:none}
.lifeos-dash .pw .warn{font-size:13px;line-height:1.6;color:#8f3f31;background:#fbe9e7;border-radius:12px;padding:10px 12px;margin:0}
.lifeos-dash .pw .err{font-size:13px;color:#a2493a;min-height:18px;margin:0}
.lifeos-dash .pw .r{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.lifeos-dash .pw .cancel{height:44px;border-radius:999px;background:var(--tile);color:var(--ink-2)}
.lifeos-dash .pw .go{height:44px;border-radius:999px;background:var(--green);color:#fff;font-weight:600}
@container (max-width:900px){.lifeos-dash .row.c2{grid-template-columns:1fr}}
.is-mobile .lifeos-dash .row.c2{grid-template-columns:1fr}`;

const root = L.mount(dv, "", "");
render();

// 改表格、加一行、删一行（都在已解锁的那一份数据上）
root.addEventListener("input", (e) => {
  const inp = e.target.closest("input[data-s]");
  if (!inp) return;
  const name = secOf(inp.dataset.s), o = open[name];
  if (!o) return;
  const list = name === "accounts" ? o.data.rows : o.data[inp.dataset.s];
  list[+inp.dataset.i][inp.dataset.f] = inp.value;
  touch(); changed(name);
});
root.addEventListener("click", (e) => {
  touch();
  const add = e.target.closest(".addrow"), rm = e.target.closest(".rm");
  if (e.target.closest(".unlockb")) return ask("accounts");
  if (e.target.closest(".lockb")) return lock("accounts");
  if (!add && !rm) return;
  const s = (add || rm).dataset.s, name = secOf(s), o = open[name];
  if (!o) return;
  const list = name === "accounts" ? o.data.rows : o.data[s];
  if (add) list.push(name === "accounts" ? { k: "", user: "", pass: "", note: "" } : { k: "", a: "", b: "" });
  else list.splice(+rm.dataset.i, 1);
  changed(name); render(); status("还没保存…");
  if (add) root.querySelector(`input[data-s="${s}"][data-i="${list.length - 1}"][data-f="k"]`)?.focus();
});
// 密码栏：点进去显示明文，离开就藏回去
root.addEventListener("focusin", (e) => { if (e.target.matches('input[data-f="pass"]')) e.target.type = "text"; });
root.addEventListener("focusout", (e) => { if (e.target.matches('input[data-f="pass"]')) e.target.type = "password"; });
