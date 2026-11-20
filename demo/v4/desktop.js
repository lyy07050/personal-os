// 网页版共用：侧栏、勾选、tab 切换。每页 <body data-page="home"> 决定高亮哪一项。
(function(){
  const nav=[
    ['h','OVERVIEW'],
    ['home','首页','desktop-home.html'],['inbox','随手记','desktop-inbox.html'],['review','每周复盘','desktop-review.html'],
    ['h','DEPARTMENTS'],
    ['finance','财务部','desktop-finance.html'],
    ['x','后勤部'],['fridge','食物墙','desktop-fridge.html',6,1],['things','物品墙','desktop-things.html',0,1],
    ['x','研发部'],['notes','知识库','desktop-notes.html',38,1],['english','多邻国 · 英语','desktop-english.html',0,1],
    ['school','教务处','desktop-school.html',3],['career','人事部 · 求职','desktop-career.html'],
    ['h','PRIVATE'],
    ['private','个人档案 🔒','desktop-private.html'],
  ];
  const page=document.body.dataset.page;
  const side=document.createElement('nav');side.className='side';side.setAttribute('aria-label','导航');
  let h='<a class="brand" href="desktop-home.html" style="padding:0;color:var(--ink)">my little <b>os.</b></a>';
  for(const [k,label,href,count,sub] of nav){
    if(k==='h'){h+=`<h6>${label}</h6>`;continue;}
    if(k==='x'){const on=(label==='后勤部'&&['fridge','things'].includes(page))||(label==='研发部'&&['notes','english'].includes(page));h+=`<a${on?' class="on"':''} style="cursor:default">${label}</a>`;continue;}
    h+=`<a href="${href}" class="${sub?'sub ':''}${k===page?'on':''}"${k===page?' aria-current="page"':''}>${label}${count?`<i>${count}</i>`:''}</a>`;
  }
  h+='<a class="foot" href="index.html">📱 手机版 →</a>';
  side.innerHTML=h;
  document.querySelector('.app').prepend(side);

  // 勾选：任何 .ck 按钮切换所在 li / 行的 done
  document.addEventListener('click',e=>{
    const ck=e.target.closest('button.ck');if(!ck)return;
    const host=ck.closest('[data-ck]')||ck.parentElement;if(host.classList.toggle('done'))stamp(ck);
  });
  // 顶部 tab 只做选中态
  document.querySelectorAll('.tabs').forEach(t=>t.addEventListener('click',e=>{
    const b=e.target.closest('button');if(!b)return;t.querySelectorAll('button').forEach(x=>x.classList.toggle('on',x===b));
  }));
})();
// 盖章：重新触发一次动画
function stamp(el){el.classList.remove('stamp');void el.offsetWidth;el.classList.add('stamp');el.addEventListener('animationend',()=>el.classList.remove('stamp'),{once:true});}
window.stamp=stamp;
// 习惯打卡圆点：打上时也盖章
document.addEventListener('click',e=>{const d=e.target.closest('.dot');if(d)setTimeout(()=>{if(d.classList.contains('on'))stamp(d)},0);});
// 和纸胶带：每个部门页 banner 左上角一段，颜色按页面轮换
(function(){const colors=['#dfe8db','#f8dcd8','#fef0c4','#e7e0ee','#dcecf6'];const ban=document.querySelector('.ban');if(!ban)return;
  const t=document.createElement('i');t.className='tape';t.setAttribute('aria-hidden','true');
  const i=[...document.body.dataset.page||''].reduce((a,c)=>a+c.charCodeAt(0),0)%colors.length;t.style.setProperty('--tape',colors[i]);ban.appendChild(t);})();
// 勾号 svg，页面里用 CK 占位
window.CK='<svg width="12" height="10" viewBox="0 0 11 9"><path d="M1 4.6 4 7.5 10 1.5" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
document.querySelectorAll('.ck').forEach(c=>{if(!c.innerHTML.trim())c.innerHTML=window.CK;});
