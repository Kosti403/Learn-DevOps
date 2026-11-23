/* Задания. Общие поля: t (тип), q (вопрос, html), e (почему — обязательно), g (группа), ref (id прошлой темы для ↺), code+lang (блок кода).
   t:'c'  выбор       {o:[варианты], a:индекс верного}        — варианты перемешиваются
   t:'r'  чтение      то же, что 'c', но с логом/конфигом в code
   t:'i'  впиши       {a:['ответ','допустимый вариант'], ph:'подсказка в поле', fix:true — «исправь ошибку»}
   t:'s'  собери      {p:['шаг 1','шаг 2',…]} — в верном порядке, на экране перемешиваются
   Группы g: base Базовые · prac Практика · job Как на работе · mix Смешанные (ставится сам, если есть ref) */
const TYPES={c:['Выбор','t-c'],r:['Чтение','t-r'],i:['Впиши','t-i'],s:['Собери','t-s']};
const GROUPS={base:'Базовые',prac:'Практика',job:'Как на работе',mix:'Смешанные ↺',rev:'Обзор'};
const norm=s=>String(s).trim().replace(/[“”«»]/g,'"').replace(/’/g,"'").replace(/\s+/g,' ').replace(/\s*;$/,'');
const shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.random()*(i+1)|0;[a[i],a[j]]=[a[j],a[i]]}return a};
function exHTML(x,i,state){
  const [tn,tc]=TYPES[x.t];const mix=x.ref?` <a class="ref" href="#m-${x.ref}">↺ ${MODS[x.ref]?MODS[x.ref].title:x.ref}</a>`:'';
  let body='';
  if(x.t==='c'||x.t==='r'){const ord=shuffle(x.o.map((_,k)=>k));body=`<div class="opts">${ord.map(k=>`<button class="opt" data-k="${k}">${x.o[k]}</button>`).join('')}</div>`}
  if(x.t==='i')body=`<div class="inrow"><span class="k-pr">${x.fix?'✎':'$'}</span><input class="inp" spellcheck="false" autocomplete="off" autocapitalize="off" placeholder="${esc(x.ph||'')}"><button class="go">Проверить</button></div>`;
  if(x.t==='s')body=`<div class="sline"></div><div class="spool">${shuffle(x.p.map((_,k)=>k)).map(k=>`<button class="chip" data-k="${k}">${x.p[k]}</button>`).join('')}</div><button class="go">Проверить</button>`;
  return `<div class="ex ${tc}${x.ref?' mixd':''}${state===1?' ok':state===0?' no':''}" data-i="${i}"><div class="exh"><span class="tag">${tn}${x.fix?' · исправь':''}</span><span class="num">${i+1}</span>${mix}</div><div class="q">${x.q}</div>${x.code?C(x.code,x.lang||'sh'):''}${body}<div class="fb"></div></div>`}
function exCheck(x,el){
  if(x.t==='c'||x.t==='r'){const b=el.querySelector('.opt.sel');return b&&+b.dataset.k===x.a}
  if(x.t==='i'){const v=norm(el.querySelector('.inp').value);return x.a.some(a=>norm(a)===v)}
  if(x.t==='s'){const ks=[...el.querySelectorAll('.sline .chip')].map(b=>x.p[+b.dataset.k]);return ks.length===x.p.length&&ks.every((s,k)=>s===x.p[k])}}
function exRight(x){
  if(x.t==='c'||x.t==='r')return x.o[x.a];
  if(x.t==='i')return `<code>${hlSh(x.a[0])}</code>`;
  return `<ol>${x.p.map(s=>`<li>${s}</li>`).join('')}</ol>`}
