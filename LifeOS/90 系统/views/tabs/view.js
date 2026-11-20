// 顶部 tab：分页面之间跳转。参数 {current, pages:[{label, path}]}；只写名字，不写数字。
const L = eval(await dv.io.load("90 系统/views/_shared/lib.js"));
const { current, pages } = input;
const html = pages.map((p) => {
  const cls = /[一-鿿]/.test(p.label) ? "cjk" : "lat";
  return p.label === current
    ? `<a class="${cls} on" aria-current="page">${L.esc(p.label)}</a>`
    : L.link(p.path, L.esc(p.label), cls);
}).join("");
L.mount(dv, `<nav class="tabs" aria-label="分页">${html}</nav>`);
