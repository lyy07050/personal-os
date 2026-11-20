// 侧边栏（每页一份，方便在 Figma 里每个画板都完整）
const NAV=[
  ['Overview',[['home','首页'],['inbox','收件箱',4],['review','每周复盘']]],
  ['Departments',[['finance','财务部'],['food','后勤部'],['food','食物墙',6,1],['items','物品墙',0,1],['knowledge','研发部'],['knowledge','知识库',38,1],['english','多邻国 · 英语',0,1],['school','教务处',3],['career','人事部 · 求职']]],
  ['Private',[['profile','个人档案 🔒']]]
];
function sideHTML(active){
  let h='<div class="logo">my little <i>os.</i></div>';
  for(const [g,items] of NAV){
    h+=`<div class="up">${g}</div><nav class="nav">`;
    for(const [id,label,n,sub] of items){
      const on=id===active?' on':'';
      h+=`<a class="${sub?'sub':''}${on}" data-go="${id}">${label}${n?` <sup>${n}</sup>`:''}</a>`;
    }
    h+='</nav>';
  }
  return h+'<div class="phl" data-go="phones">📱 手机版 →</div>';
}
document.querySelectorAll('.frame').forEach(f=>{
  const s=f.querySelector('.side'); if(s) s.innerHTML=sideHTML(f.dataset.page);
});
// 只给每页一个高亮：子项优先
document.querySelectorAll('.frame .side').forEach(s=>{
  const on=[...s.querySelectorAll('a.on')];
  if(on.length>1){const keep=on.find(a=>a.classList.contains('sub'))||on[0];on.forEach(a=>a!==keep&&a.classList.remove('on'));}
});
// 首页横幅拼贴
document.querySelectorAll('[data-banner]').forEach(b=>b.prepend(document.getElementById('banner').content.cloneNode(true)));
// 习惯热力图
const H={早起:'11011101011101',喝水:'11111111111111',运动:'01001010010100',背词:'11111101111111',早睡:'00101001010010'};
document.querySelectorAll('.heat').forEach(el=>{
  const days=+el.dataset.days||14, only=el.dataset.only;
  if(days!==14) el.style.gridTemplateColumns=`48px repeat(${days},minmax(0,24px))`;
  el.innerHTML=Object.entries(H).filter(([k])=>!only||k===only).map(([k,v])=>`<span>${k}</span>`+[...v.slice(-days)].map(x=>x==='1'?'<i class="on"></i>':'<i></i>').join('')).join('');
});
document.querySelectorAll('.todo li,.check li').forEach(li=>li.onclick=()=>li.classList.toggle('done'));
// 翻页 / 平铺
const sel=document.getElementById('pg');
function go(id){
  document.body.classList.remove('board');
  document.querySelectorAll('.frame').forEach(f=>f.classList.toggle('on',f.dataset.page===id));
  sel.value=id; scrollTo(0,0);
  try{localStorage.setItem('os-page',id)}catch(e){}
}
document.querySelectorAll('.frame').forEach(f=>sel.add(new Option(f.dataset.title,f.dataset.page)));
sel.onchange=()=>go(sel.value);
document.addEventListener('click',e=>{const g=e.target.closest('[data-go]');if(g)go(g.dataset.go)});
document.getElementById('board').onclick=()=>{document.body.classList.toggle('board');scrollTo(0,0)};
let start='home';try{start=localStorage.getItem('os-page')||'home'}catch(e){}
if(location.hash==='#figma'){document.body.classList.add('board');start='home'}
go(document.querySelector(`.frame[data-page="${start}"]`)?start:'home');
if(location.hash==='#figma')document.body.classList.add('board');
