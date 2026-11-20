// 手机版共用：「+」在每一屏都弹同一个菜单（记一笔 / 放进冰箱）；「我想记…」输入框回车就存进随手记。
(function(){
  const css=`
  .sheet{position:absolute;left:12px;right:12px;bottom:104px;z-index:7;background:#fff;border-radius:26px;padding:8px;box-shadow:0 20px 50px rgba(37,45,41,.18);opacity:0;transform:translateY(16px) scale(.98);pointer-events:none;transition:all .3s cubic-bezier(.2,.8,.2,1)}
  .sheet.open{opacity:1;transform:none;pointer-events:auto}
  .sheet a{display:flex;align-items:center;gap:12px;padding:14px 12px;border-radius:18px;color:inherit;text-decoration:none;font-size:16px;font-weight:500}
  .sheet a:hover,.sheet a:focus-visible{background:#f8fbf9}
  .sheet .ic{width:40px;height:40px;border-radius:14px;display:grid;place-items:center;flex:none}
  .fab{transition:transform .3s cubic-bezier(.2,.8,.2,1)}
  .fab.open{transform:rotate(45deg)}
  .capture{flex:1;height:56px;border-radius:999px;background:#fff;display:flex;align-items:center;padding:0 22px;box-shadow:0 10px 30px rgba(52,72,59,.14)}
  .capture input{flex:1;min-width:0;border:0;outline:none;background:none;font:inherit;font-size:16px;color:#252d29;caret-color:#3e5b4b}
  .capture input::placeholder{color:#5b645c}
  .toast{position:absolute;left:50%;bottom:104px;transform:translate(-50%,10px);background:#252d29;color:#fff;font-size:13.5px;padding:10px 16px;border-radius:999px;opacity:0;transition:all .3s cubic-bezier(.2,.8,.2,1);z-index:9;white-space:nowrap;pointer-events:none}
  .toast.show{opacity:1;transform:translate(-50%,0)}
  /* 手账质感：盖章 · 撕贴纸 · 和纸胶带 · 日期印章 */
  @keyframes stamp{0%{scale:1.45;rotate:-14deg;box-shadow:0 0 0 0 rgba(62,91,75,.35)}55%{scale:.9;rotate:3deg}100%{scale:1;rotate:0deg;box-shadow:0 0 0 8px rgba(62,91,75,0)}}
  .stamp{animation:stamp .46s cubic-bezier(.2,.8,.2,1)}
  @keyframes peel{0%{rotate:0deg;translate:0 0}45%{rotate:-16deg;translate:-4px -12px;scale:1.08}100%{rotate:-7deg;translate:-2px -4px;scale:1}}
  .food.gone .pic{animation:peel .62s cubic-bezier(.2,.8,.2,1) both;filter:drop-shadow(0 6px 6px rgba(46,42,39,.18))}
  .tape{position:absolute;width:70px;height:20px;z-index:3;pointer-events:none;opacity:.78;background:var(--tape,#dfe8db);border-radius:2px}
  .ev .date{border:1.5px solid rgba(127,79,60,.3)}
  @media (prefers-reduced-motion:reduce){.sheet,.fab,.toast{transition:none}.stamp,.food.gone .pic{animation:none}}`;
  const st=document.createElement('style');st.textContent=css;document.head.appendChild(st);
  const screen=document.querySelector('.screen');if(!screen)return;
  const toast=document.createElement('div');toast.className='toast';toast.setAttribute('role','status');screen.appendChild(toast);
  const say=t=>{toast.textContent=t;toast.classList.add('show');clearTimeout(say.t);say.t=setTimeout(()=>toast.classList.remove('show'),1600);};
  const fab=screen.querySelector('.fab');
  if(fab){
    const sheet=document.createElement('div');sheet.className='sheet';sheet.setAttribute('role','menu');sheet.setAttribute('aria-label','新建');
    sheet.innerHTML=`<a role="menuitem" href="mobile-expense.html"><span class="ic" style="background:#dfe8db"><svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true"><path d="M10 3v14M5 7.5h7a2.5 2.5 0 0 1 0 5H8a2.5 2.5 0 0 0 0 5h7" fill="none" stroke="#3e5b4b" stroke-width="1.7" stroke-linecap="round" transform="translate(0 -1.5)"/></svg></span>记一笔</a>
      <a role="menuitem" href="mobile-fridge.html#add"><span class="ic" style="background:#fdefee"><svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true"><rect x="5" y="2.5" width="10" height="15" rx="2.5" fill="none" stroke="#3e5b4b" stroke-width="1.7"/><path d="M5 8.5h10M8 5v1.5M8 11v2" stroke="#3e5b4b" stroke-width="1.7" stroke-linecap="round"/></svg></span>放进冰箱</a>`;
    screen.appendChild(sheet);
    fab.setAttribute('aria-expanded','false');fab.setAttribute('aria-label','新建');
    fab.addEventListener('click',e=>{e.preventDefault();const o=sheet.classList.toggle('open');fab.classList.toggle('open',o);fab.setAttribute('aria-expanded',o);});
  }
  screen.querySelectorAll('form.capture').forEach(f=>f.addEventListener('submit',e=>{e.preventDefault();const i=f.querySelector('input');if(!i.value.trim())return;i.value='';i.blur();say('已存进随手记');}));
  window.osToast=say;
  // 盖章：勾上的一瞬间压下去
  const stamp=el=>{el.classList.remove('stamp');void el.offsetWidth;el.classList.add('stamp');el.addEventListener('animationend',()=>el.classList.remove('stamp'),{once:true});};
  document.addEventListener('click',e=>{const ck=e.target.closest('.ck');if(!ck)return;setTimeout(()=>{const li=ck.closest('li');if(li&&li.classList.contains('done'))stamp(ck);},0);});
  // 和纸胶带：首页问候卡、今日单词卡、每页第一张大卡
  [['.hello','#f8dcd8','top:-9px;right:96px;rotate:4deg'],['.word','#fef0c4','top:-8px;left:22px;rotate:-6deg'],['.hero','#dfe8db','top:-8px;left:26px;rotate:-5deg'],['.amount','#dcecf6','top:-8px;right:30px;rotate:5deg']]
    .forEach(([sel,c,pos])=>{const host=screen.querySelector(sel);if(!host)return;const t=document.createElement('i');t.className='tape';t.setAttribute('aria-hidden','true');t.style.cssText=pos;t.style.setProperty('--tape',c);if(getComputedStyle(host).position==='static')host.style.position='relative';host.style.overflow='visible';host.appendChild(t);});
})();
