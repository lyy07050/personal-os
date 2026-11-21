// 个人档案的加密工具。用法：const V = eval(await dv.io.load("90 系统/views/_shared/vault.js"));
// 只用浏览器自带的 Web Crypto，不连网、不存密码：
//   密码 →（PBKDF2，SHA-256，310000 次，随机 16 字节盐）→ AES-GCM 256 位钥匙
//   一份加密数据写成一行文字："v1.<盐>.<IV>.<密文>"（都是 base64），每次保存换新的 IV
//   存在笔记里的样子：%% lifeos-vault:profile v1.xxx.yyy.zzz %%（%% 是 Obsidian 的注释，阅读模式看不见）
// 整个文件是一个表达式（node 测试也能直接跑）。
(() => {
  const ITER = 310000;
  const C = globalThis.crypto;
  const enc = new TextEncoder(), dec = new TextDecoder();
  const b64 = (u8) => { let s = ""; for (const x of u8) s += String.fromCharCode(x); return btoa(s); };
  const unb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
  const random = (n) => C.getRandomValues(new Uint8Array(n));

  // 钥匙不能导出（extractable: false），只在内存里用
  async function keyFrom(password, salt) {
    const base = await C.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveKey"]);
    return C.subtle.deriveKey({ name: "PBKDF2", salt, iterations: ITER, hash: "SHA-256" }, base,
      { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
  }
  async function seal(key, salt, data) {
    const iv = random(12);
    const ct = new Uint8Array(await C.subtle.encrypt({ name: "AES-GCM", iv }, key, enc.encode(JSON.stringify(data))));
    return `v1.${b64(salt)}.${b64(iv)}.${b64(ct)}`;
  }
  // 第一次设密码：新的盐
  async function create(password, data) {
    const salt = random(16), key = await keyFrom(password, salt);
    return { key, salt, sealed: await seal(key, salt, data) };
  }
  // 解锁：密码不对时 AES-GCM 会校验失败 → 抛「密码不对」
  async function unlock(password, sealed) {
    const [v, s, i, c] = String(sealed).split(".");
    if (v !== "v1" || !s || !i || !c) throw new Error("加密数据坏了");
    const salt = unb64(s), key = await keyFrom(password, salt);
    let plain;
    try { plain = await C.subtle.decrypt({ name: "AES-GCM", iv: unb64(i) }, key, unb64(c)); } catch (e) { throw new Error("密码不对"); }
    return { key, salt, data: JSON.parse(dec.decode(plain)) };
  }

  // 笔记里的那一行：读出来 / 写回去（有就替换，没有就加在最后）
  const markRe = (name) => new RegExp(`%%\\s*lifeos-vault:${name}\\s+(\\S+)\\s*%%`);
  const readBlob = (text, name) => { const m = markRe(name).exec(text || ""); return m ? m[1] : null; };
  function writeBlob(text, name, sealed) {
    const line = `%% lifeos-vault:${name} ${sealed} %%`;
    return markRe(name).test(text) ? text.replace(markRe(name), line) : `${text.replace(/\n*$/, "")}\n\n${line}\n`;
  }

  return { ITER, keyFrom, seal, create, unlock, readBlob, writeBlob };
})()
