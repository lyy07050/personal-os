// 个人档案 / 账号密码的顶部横幅。参数 {page: "profile" | "accounts"}。
// 这个 view 不读任何文件：档案内容就写在笔记正文里（下面的表格），用 Meld Encrypt 加密；这里只放标题和按钮。
const L = eval(await dv.io.load("90 系统/views/_shared/lib.js"));
const page = (input && input.page) || "profile";
const accounts = page === "accounts";
const o = {
  page: "private", eye: "60 · PRIVATE", title: accounts ? "账号密码 🔒" : "个人档案 🔒",
  facts: accounts ? "第二个密码单独加密 · 不上传云端 · AI 不读取" : "只存在这台电脑 · 不上传云端 · AI 不读取 · 账号密码单独加密",
  btns: [
    { label: accounts ? "回到个人档案" : "打开账号密码", cls: "pri", onclick: () => L.open(accounts ? "60 个人档案/个人档案" : "60 个人档案/账号密码") },
    { label: "怎么加密", onclick: () => L.open("90 系统/个人档案使用说明") },
  ],
};
const root = L.mount(dv, L.banner(o) + `<p class="pv-hint">下面的表格就是档案本身。填好后选中一节，用 Meld Encrypt 加密；之后点锁住的那段、输入密码才看得到。</p>`,
  ".lifeos-dash .pv-hint{font-size:14px;color:var(--ink-2);margin:14px 4px 0}");
L.wireBanner(root, o);
