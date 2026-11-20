// 在浏览器里把每个画板拆成 Figma 图层数据（JSON），由 run_extract.sh 调用
(async () => {
  document.body.classList.add('board');
  const st = document.createElement('style');
  st.textContent = '*,*::before,*::after{animation:none!important;transition:none!important}';
  document.head.appendChild(st);
  await document.fonts.ready;
  await new Promise(r => setTimeout(r, 300));

  const SVGNS = 'http://www.w3.org/2000/svg';
  const R = v => Math.round(v * 10) / 10;
  const col = s => { // "rgb(a)" -> [r,g,b,a] 0-1
    const m = s && s.match(/rgba?\(([^)]+)\)/); if (!m) return null;
    const p = m[1].split(/[ ,/]+/).filter(Boolean).map(Number);
    const a = p.length > 3 ? p[3] : 1; if (a === 0) return null;
    return [R(p[0] / 255 * 1000) / 1000, R(p[1] / 255 * 1000) / 1000, R(p[2] / 255 * 1000) / 1000, a];
  };
  const splitTop = s => { const out = []; let d = 0, cur = '';
    for (const ch of s) { if (ch === '(') d++; if (ch === ')') d--; if (ch === ',' && d === 0) { out.push(cur.trim()); cur = ''; } else cur += ch; }
    if (cur.trim()) out.push(cur.trim()); return out; };

  // ---- 去掉旋转，只保留位移，记录角度 ----
  const rot = new Map();
  for (const el of document.querySelectorAll('body *')) {
    if (el.closest('svg') && el.tagName.toLowerCase() !== 'svg') continue;
    const t = getComputedStyle(el).transform;
    if (!t || t === 'none') continue;
    const m = new DOMMatrix(t);
    const ang = Math.atan2(m.b, m.a) * 180 / Math.PI;
    const sc = Math.hypot(m.a, m.b);
    if (Math.abs(ang) > 0.1 || Math.abs(sc - 1) > 0.01) {
      rot.set(el, R(ang));
      el.style.setProperty('transform', `translate(${m.e}px,${m.f}px)`, 'important');
    }
  }

  // ---- 背景 → Figma paints ----
  function gradTransform(angDeg) {
    const a = angDeg * Math.PI / 180, dx = Math.sin(a), dy = -Math.cos(a);
    const L = Math.abs(dx) + Math.abs(dy);
    const p0 = [0.5 - dx * L / 2, 0.5 - dy * L / 2], v = [dx * L, dy * L];
    const n = v[0] * v[0] + v[1] * v[1];
    const M = [[v[0] / n, v[1] / n], [-v[1] / n, v[0] / n]];
    const t = [0 - (M[0][0] * p0[0] + M[0][1] * p0[1]), 0.5 - (M[1][0] * p0[0] + M[1][1] * p0[1])];
    return [[R(M[0][0] * 1e3) / 1e3, R(M[0][1] * 1e3) / 1e3, R(t[0] * 1e3) / 1e3], [R(M[1][0] * 1e3) / 1e3, R(M[1][1] * 1e3) / 1e3, R(t[1] * 1e3) / 1e3]];
  }
  function stops(parts) {
    const cs = parts.map(p => { const c = col(p); const m = p.match(/\)\s*([\d.]+)%/); return c && { c, p: m ? +m[1] / 100 : null }; }).filter(Boolean);
    cs.forEach((s, i) => { if (s.p === null) s.p = cs.length === 1 ? 0 : i / (cs.length - 1); });
    return cs.map(s => [s.p, s.c]);
  }
  function paints(cs) {
    const out = [];
    const bc = col(cs.backgroundColor); if (bc) out.push({ k: 's', c: bc });
    const bi = cs.backgroundImage;
    if (bi && bi !== 'none') {
      for (const g of splitTop(bi).reverse()) {
        let m;
        if ((m = g.match(/^linear-gradient\((.*)\)$/))) {
          const parts = splitTop(m[1]); let ang = 180;
          if (/deg$/.test(parts[0])) ang = parseFloat(parts.shift());
          else if (/^to /.test(parts[0])) { const d = parts.shift(); ang = { 'to top': 0, 'to right': 90, 'to bottom': 180, 'to left': 270 }[d] ?? 180; }
          out.push({ k: 'l', t: gradTransform(ang), s: stops(parts) });
        } else if ((m = g.match(/^radial-gradient\((.*)\)$/))) {
          const parts = splitTop(m[1]); if (!col(parts[0])) parts.shift();
          out.push({ k: 'r', s: stops(parts) });
        } else if ((m = g.match(/^conic-gradient\((.*)\)$/))) {
          const parts = splitTop(m[1]); if (!col(parts[0])) parts.shift();
          out.push({ k: 'a', s: stops(parts) });
        }
        // url(...) 纸纹 / repeating 条纹：跳过
      }
    }
    return out;
  }
  function shadows(s) {
    if (!s || s === 'none') return [];
    return splitTop(s).map(x => {
      const c = col(x); const inset = /inset/.test(x);
      const nums = x.replace(/rgba?\([^)]*\)/, '').replace('inset', '').trim().split(/\s+/).map(parseFloat);
      return c && [nums[0] || 0, nums[1] || 0, nums[2] || 0, nums[3] || 0, c, inset ? 1 : 0];
    }).filter(Boolean);
  }
  const px = (v, w, h) => v.endsWith('%') ? parseFloat(v) / 100 * Math.min(w, h) : parseFloat(v) || 0;

  // ---- SVG：展开 <use>，内联样式 ----
  const SK = ['fill', 'fill-opacity', 'fill-rule', 'stroke', 'stroke-width', 'stroke-opacity', 'stroke-linecap', 'stroke-linejoin', 'stroke-dasharray', 'opacity', 'font-family', 'font-size', 'font-weight'];
  const DEFAULT = { 'fill-opacity': '1', 'fill-rule': 'nonzero', 'stroke-opacity': '1', 'stroke-linecap': 'butt', 'stroke-linejoin': 'miter', 'stroke-dasharray': 'none', opacity: '1' };
  const svgs = [], svgIdx = new Map();
  function build(o, refs, vp) {
    const tag = o.tagName.toLowerCase();
    if (['filter', 'script', 'style', 'title', 'symbol', 'defs', 'mask', 'clippath', 'lineargradient', 'radialgradient'].includes(tag) && tag !== 'symbol') return null;
    if (tag === 'use') {
      const id = (o.getAttribute('href') || o.getAttribute('xlink:href') || '').slice(1);
      const tg = document.getElementById(id); if (!tg) return null;
      const g = document.createElementNS(SVGNS, 'g');
      const x = +o.getAttribute('x') || 0, y = +o.getAttribute('y') || 0;
      let tr = `translate(${x},${y})`;
      if (tg.tagName.toLowerCase() === 'symbol') {
        const vb = (tg.getAttribute('viewBox') || `0 0 ${vp[0]} ${vp[1]}`).split(/[ ,]+/).map(Number);
        const w = o.getAttribute('width') ? parseFloat(o.getAttribute('width')) : vp[0];
        const h = o.getAttribute('height') ? parseFloat(o.getAttribute('height')) : vp[1];
        const s = Math.min(w / vb[2], h / vb[3]);
        const ox = (w - vb[2] * s) / 2 - vb[0] * s, oy = (h - vb[3] * s) / 2 - vb[1] * s;
        tr += ` translate(${R(ox * 100) / 100},${R(oy * 100) / 100}) scale(${R(s * 1e4) / 1e4})`;
        for (const c of tg.children) { const b = build(c, refs, [vb[2], vb[3]]); if (b) g.appendChild(b); }
      } else { const b = build(tg, refs, vp); if (b) { b.removeAttribute('id'); g.appendChild(b); } }
      if (o.getAttribute('transform')) tr = o.getAttribute('transform') + ' ' + tr;
      g.setAttribute('transform', tr);
      inline(o, g, refs, false, false);
      return g;
    }
    const n = document.createElementNS(SVGNS, tag);
    for (const a of o.attributes) {
      if (['class', 'style', 'filter', 'id', 'mask', 'clip-path'].includes(a.name)) continue;
      n.setAttribute(a.name, a.value);
    }
    if (['path', 'circle', 'ellipse', 'rect', 'line', 'polyline', 'polygon'].includes(tag)) inline(o, n, refs, false, false);
    else if (['text', 'tspan'].includes(tag)) inline(o, n, refs, false, true);
    else if (tag === 'g') inline(o, n, refs, false, false);
    for (const c of o.childNodes) {
      if (c.nodeType === 3) { if (c.textContent.trim()) n.appendChild(document.createTextNode(c.textContent)); }
      else if (c.nodeType === 1) { const b = build(c, refs, vp); if (b) n.appendChild(b); }
    }
    return n;
  }
  function inline(o, n, refs, onlyOpacity, isText) {
    const cs = getComputedStyle(o), pcs = o.parentElement ? getComputedStyle(o.parentElement) : null;
    for (const k of (onlyOpacity ? ['opacity'] : SK.filter(k => isText || !k.startsWith('font')))) {
      let v = cs.getPropertyValue(k); if (!v) continue;
      if (k === 'opacity') { if (v === '1') continue; }
      else if (pcs && pcs.getPropertyValue(k) === v) continue; // 继承来的，交给外层 g
      if (k === 'stroke' && v === 'none') continue;
      const m = v.match(/url\("?#([^")]+)"?\)/);
      if (m) { refs.add(m[1]); v = `url(#${m[1]})`; }
      if (k === 'stroke-width' && cs.stroke === 'none') continue;
      n.setAttribute(k, v);
    }
  }
  function defsFor(refs) {
    const d = document.createElementNS(SVGNS, 'defs'), done = new Set();
    const add = id => {
      if (done.has(id)) return; done.add(id);
      const g = document.getElementById(id); if (!g) return;
      const tag = g.tagName.toLowerCase(); if (!/gradient/.test(tag)) return;
      const c = g.cloneNode(true); c.removeAttribute('class');
      c.querySelectorAll('stop').forEach((s, i) => { const o = g.querySelectorAll('stop')[i]; const cs = getComputedStyle(o);
        s.setAttribute('stop-color', cs.stopColor); if (cs.stopOpacity !== '1') s.setAttribute('stop-opacity', cs.stopOpacity); s.removeAttribute('style'); });
      const h = (g.getAttribute('href') || g.getAttribute('xlink:href') || '').slice(1); if (h) add(h);
      d.appendChild(c);
    };
    [...refs].forEach(add);
    return d;
  }
  const syms = {};
  function symbolSvg(id) {
    if (syms[id]) return;
    const tg = document.getElementById(id);
    const vb = tg.getAttribute('viewBox').split(/[ ,]+/).map(Number);
    const refs = new Set();
    const out = document.createElementNS(SVGNS, 'svg');
    out.setAttribute('width', vb[2]); out.setAttribute('height', vb[3]); out.setAttribute('viewBox', vb.join(' '));
    for (const c of tg.children) { const b = build(c, refs, [vb[2], vb[3]]); if (b) out.appendChild(b); }
    const d = defsFor(refs); if (d.children.length) out.prepend(d);
    syms[id] = { w: vb[2], h: vb[3], s: clean(out.outerHTML) };
  }
  function clean(s) {
    return s.replace(/ xmlns="[^"]*"/g, '').replace(/>\s+</g, '><')
      .replace(/rgb\((\d+), (\d+), (\d+)\)/g, (m, a, b, c) => '#' + [a, b, c].map(x => (+x).toString(16).padStart(2, '0')).join(''))
      .replace(/(\d+\.\d\d)\d+/g, '$1').replace(/="(-?[\d.]+)px"/g, '="$1"');
  }
  // 一个 <svg> → parts：p = 普通图形（svg 字符串，铺满整个 svg 区域），u = 符号实例（id, 位置, 缩放, 旋转）
  function svgData(el) {
    const r = el.getBoundingClientRect();
    const vbA = el.getAttribute('viewBox');
    const vp = vbA ? vbA.split(/[ ,]+/).map(Number).slice(2) : [r.width, r.height];
    const inv = el.getScreenCTM().inverse();
    const parts = []; let cur = null, refs = null;
    const flush = () => { if (cur && cur.children.length) { const d = defsFor(refs); if (d.children.length) cur.prepend(d); parts.push({ p: clean(cur.outerHTML) }); } cur = null; };
    const start = () => { if (cur) return; refs = new Set(); cur = document.createElementNS(SVGNS, 'svg');
      cur.setAttribute('width', R(r.width)); cur.setAttribute('height', R(r.height));
      if (vbA) cur.setAttribute('viewBox', vbA);
      if (el.getAttribute('preserveAspectRatio')) cur.setAttribute('preserveAspectRatio', el.getAttribute('preserveAspectRatio'));
      const ecs = getComputedStyle(el); for (const k of ['fill', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin']) { const v = ecs.getPropertyValue(k);
        if (!({ fill: 'rgb(0, 0, 0)', stroke: 'none', 'stroke-width': '1px', 'stroke-linecap': 'butt', 'stroke-linejoin': 'miter' })[k] || ({ fill: 'rgb(0, 0, 0)', stroke: 'none', 'stroke-width': '1px', 'stroke-linecap': 'butt', 'stroke-linejoin': 'miter' })[k] !== v) cur.setAttribute(k, clean(v)); } };
    const visit = (node, wrapTr) => {
      for (const c of node.children) {
        const tag = c.tagName.toLowerCase();
        const id = tag === 'use' ? (c.getAttribute('href') || '').slice(1) : '';
        const tg = id && document.getElementById(id);
        if (tg && tg.tagName.toLowerCase() === 'symbol') {
          flush(); symbolSvg(id);
          const vb = tg.getAttribute('viewBox').split(/[ ,]+/).map(Number);
          const w = parseFloat(c.getAttribute('width')) || vp[0], h = parseFloat(c.getAttribute('height')) || vp[1];
          const s = Math.min(w / vb[2], h / vb[3]);
          const x0 = (+c.getAttribute('x') || 0) + (w - vb[2] * s) / 2 - vb[0] * s, y0 = (+c.getAttribute('y') || 0) + (h - vb[3] * s) / 2 - vb[1] * s;
          const m = new DOMMatrix().translate(-r.left, -r.top).multiply(c.getScreenCTM()).translate(x0, y0).scale(s);
          const sc = Math.hypot(m.a, m.b), ang = Math.atan2(m.b, m.a) * 180 / Math.PI;
          let op = 1; for (let q = c; q && q !== el; q = q.parentElement) op *= +getComputedStyle(q).opacity;
          parts.push({ u: id, a: R(m.e), b: R(m.f), s: Math.round(sc * 1e4) / 1e4, rot: R(ang), op: op < 1 ? R(op * 100) / 100 : undefined });
        } else if (tag === 'g' && c.querySelector('use')) {
          visit(c);
        } else if (!['defs', 'filter', 'title', 'style'].includes(tag)) {
          start();
          const b = build(c, refs, vp);
          if (b) { const ctm = node === el ? null : inv.multiply(node.getScreenCTM());
            if (ctm && !ctm.isIdentity) { const g = document.createElementNS(SVGNS, 'g');
              const k = 1; // inv 已经把屏幕坐标换成 viewBox 单位
              const mm = new DOMMatrix([ctm.a * k, ctm.b * k, ctm.c * k, ctm.d * k, ctm.e * k, ctm.f * k]);
              g.setAttribute('transform', `matrix(${[mm.a, mm.b, mm.c, mm.d, mm.e, mm.f].map(v => R(v * 1000) / 1000).join(',')})`); g.appendChild(b); cur.appendChild(g); }
            else cur.appendChild(b); }
        }
      }
    };
    visit(el);
    flush();
    return parts;
  }

  // ---- 文字 ----
  const fam = f => f.split(',')[0].replace(/["']/g, '').trim();
  function textNode(tn, origin) {
    const s = tn.textContent.replace(/\s+/g, ' ').trim(); if (!s) return null;
    const p = tn.parentElement, cs = getComputedStyle(p);
    if (cs.visibility === 'hidden' || +cs.opacity === 0) return null;
    const rg = document.createRange(); rg.selectNodeContents(tn);
    const rects = [...rg.getClientRects()].filter(r => r.width > 0);
    if (!rects.length) return null;
    const b = rg.getBoundingClientRect();
    const tops = new Set(rects.map(r => Math.round(r.top)));
    let txt = s; if (cs.textTransform === 'uppercase') txt = txt.toUpperCase();
    const c = col(cs.color) || [0, 0, 0, 1];
    const lh = cs.lineHeight === 'normal' ? null : R(parseFloat(cs.lineHeight));
    const ls = cs.letterSpacing === 'normal' ? 0 : R(parseFloat(cs.letterSpacing));
    const lhv = cs.lineHeight === 'normal' ? 0 : parseFloat(cs.lineHeight);
    const dy = lhv ? (lhv - rects[0].height) / 2 : 0;
    return { t: 't', s: txt, x: R(b.left - origin[0]), y: R(b.top - origin[1] - dy), w: R(b.width), h: R(b.height),
      f: fam(cs.fontFamily), wt: +cs.fontWeight, sz: R(parseFloat(cs.fontSize)), lh, ls, c, wrap: tops.size > 1 ? 1 : 0,
      al: tops.size > 1 && cs.textAlign === 'center' ? 'c' : undefined };
  }

  // ---- 元素树 ----
  function box(el, cs, r, origin, name) {
    const n = { t: 'f', n: name, x: R(r.left - origin[0]), y: R(r.top - origin[1]), w: R(r.width), h: R(r.height), ch: [] };
    const bg = paints(cs); if (bg.length) n.bg = bg;
    const rad = ['TopLeft', 'TopRight', 'BottomRight', 'BottomLeft'].map(k => R(px(cs[`border${k}Radius`], r.width, r.height)));
    if (rad.some(v => v)) n.r = rad.every(v => v === rad[0]) ? rad[0] : rad;
    const bw = ['Top', 'Right', 'Bottom', 'Left'].map(k => cs[`border${k}Style`] === 'none' ? 0 : R(parseFloat(cs[`border${k}Width`])));
    if (bw.some(v => v)) {
      const i = bw.findIndex(v => v); const k = ['Top', 'Right', 'Bottom', 'Left'][i];
      const c = col(cs[`border${k}Color`]);
      if (c) n.st = { c, w: bw.every(v => v === bw[0]) ? bw[0] : bw, d: /dash|dot/.test(cs[`border${k}Style`]) ? 1 : 0 };
    }
    const sh = shadows(cs.boxShadow); if (sh.length) n.sh = sh;
    if (+cs.opacity < 1) n.op = +cs.opacity;
    if (cs.overflow === 'hidden' || cs.overflowX === 'hidden') n.clip = 1;
    if (/blur/.test(cs.filter)) n.blur = parseFloat(cs.filter.match(/blur\(([\d.]+)/)[1]);
    if (/drop-shadow/.test(cs.filter)) { const m = cs.filter.match(/drop-shadow\((rgba?\([^)]*\))\s+([-\d.]+)px\s+([-\d.]+)px\s+([-\d.]+)px/); if (m) n.sh = (n.sh || []).concat([[+m[2], +m[3], +m[4], 0, col(m[1]), 0]]); }
    return n;
  }
  const visual = n => n.bg || n.st || n.sh || n.op !== undefined || n.blur;
  function nameOf(el) {
    const c = [...el.classList].filter(x => !['on'].includes(x)).join('.');
    return (el.tagName.toLowerCase() === 'div' ? '' : el.tagName.toLowerCase()) + (c ? '.' + c : '') || 'div';
  }
  function pseudo(el, which, origin, out) {
    const cs = getComputedStyle(el, '::' + which);
    if (!cs.content || cs.content === 'none' || cs.content === 'normal' || cs.display === 'none') return;
    if (cs.content !== '""') return; // 只处理装饰性伪元素
    const r = el.getBoundingClientRect(), pcs = getComputedStyle(el);
    let w = parseFloat(cs.width), h = parseFloat(cs.height), x, y;
    if (cs.position === 'absolute') {
      const ins = parseFloat(cs.top); x = r.left + ins; y = r.top + ins; w = r.width - 2 * ins; h = r.height - 2 * ins;
    } else if (which === 'before') { x = r.left + parseFloat(pcs.paddingLeft); y = r.top + parseFloat(pcs.paddingTop) + (parseFloat(cs.marginTop) || 0); }
    else { x = r.left + (r.width - w) / 2; y = r.top + (r.height - h) / 2 - 1; }
    if (!(w > 0 && h > 0)) return;
    const n = box(el, cs, { left: x, top: y, width: w, height: h }, origin, '::' + which);
    n.ch = undefined; if (rot.size && /rotate/.test(cs.transform)) { const m = new DOMMatrix(cs.transform); n.rot = R(Math.atan2(m.b, m.a) * 180 / Math.PI); }
    if (visual(n)) out.push(n);
  }
  function walk(el, origin, out) {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') return;
    const tag = el.tagName.toLowerCase();
    if (['script', 'template', 'style', 'select', 'option'].includes(tag)) return;
    const r = el.getBoundingClientRect();
    if (tag === 'svg') {
      if (r.width < 1 || r.height < 1) return;
      const n = { t: 's', n: nameOf(el), parts: svgData(el), x: R(r.left - origin[0]), y: R(r.top - origin[1]), w: R(r.width), h: R(r.height) };
      if (el.classList.contains('stk')) n.stk = 1;
      if (el.classList.contains('col')) n.sh = [[0, 10, 10, 0, [0.18, 0.165, 0.153, 0.16], 0]];
      if (rot.has(el)) n.rot = rot.get(el);
      out.push(n); return;
    }
    let n = box(el, cs, r, origin, nameOf(el));
    if (rot.has(el)) n.rot = rot.get(el);
    let target = out, o2 = origin;
    if (visual(n) || n.rot) { out.push(n); target = n.ch; o2 = [r.left, r.top]; }
    if (cs.zIndex !== 'auto' && +cs.zIndex < 0 && target === n.ch) n.back = 1;
    pseudo(el, 'before', o2, target);
    for (const c of el.childNodes) {
      if (c.nodeType === 3) { const t = textNode(c, o2); if (t) target.push(t); }
      else if (c.nodeType === 1) walk(c, o2, target);
    }
    pseudo(el, 'after', o2, target);
    if (target === n.ch && !n.ch.length) delete n.ch;
  }

  const frames = [];
  for (const f of document.querySelectorAll('.frame')) {
    const r = f.getBoundingClientRect();
    const out = [];
    const cs = getComputedStyle(f);
    for (const c of f.childNodes) if (c.nodeType === 1) walk(c, [r.left, r.top], out);
    frames.push({ id: f.dataset.page, title: f.dataset.title, w: R(r.width), h: R(r.height), x: R(r.left), y: R(r.top + scrollY), bg: paints(cs), r: parseFloat(cs.borderTopLeftRadius) || 0, sh: shadows(cs.boxShadow), ch: out });
  }
  const json = JSON.stringify({ frames, syms });
  document.documentElement.innerHTML = '<body><pre id="OUT"></pre></body>';
  document.getElementById('OUT').textContent = json;
})();
