/* Приложение: прогресс (localStorage), маршруты, экраны.
   #home главная · #m-<id>-<вкладка> модуль (theory|ex|lab|qa) · #cheat · #qa · #todo «Надо разобрать» */
const KEY='devops-v1';
const P=Object.assign({done:{},open:{},todo:[],lab:{},proj:{}},(()=>{try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch(e){return {}}})());
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(P))}catch(e){}};
const $=s=>document.querySelector(s);
const score=id=>{const m=MODS[id],d=P.done[id]||{};const n=m.ex.length;const ok=Object.values(d).filter(v=>v===1).length;return {n,ok,pct:n?ok/n:0}};
const unlocked=id=>{const i=ORDER.indexOf(id);if(i<=0||P.open[id])return true;const prev=ORDER[i-1];return score(prev).pct>=PASS&&unlocked(prev)};
const groupOf=x=>x.ref?'mix':x.g||'base';
const plain=s=>String(s).replace(/<[^>]+>/g,'');

function side(cur){
  $('#side').innerHTML=`<a class="sl${!cur?' cur':''}" href="#home">⌂ Главная</a><a class="sl" href="#project">🛠 Проект «Магазин»</a><a class="sl" href="#qa">🎴 Собес каждый день</a><a class="sl" href="#cheat">📋 Шпаргалка</a><a class="sl" href="#terms">📖 Словарь инструментов</a><a class="sl" href="#todo">🗒 Надо разобрать <span class="cnt">${P.todo.length||''}</span></a>`+
  LEVELS.filter(l=>l.ids.some(id=>MODS[id])).map(l=>`<details open><summary>${l.id} · ${l.name}</summary>${l.ids.filter(id=>MODS[id]).map(id=>{const m=MODS[id],s=score(id),u=unlocked(id);
    return `<a class="sl${m.review?' rev':''}${cur===id?' cur':''}" href="#m-${id}">${u?'':'🔒 '}${ORDER.indexOf(id)+1}. ${m.title}<span class="pg" style="--p:${s.pct*100|0}%"></span></a>`}).join('')}</details>`).join('')}

function home(){
  const total=ORDER.reduce((a,id)=>a+MODS[id].ex.length,0),ok=ORDER.reduce((a,id)=>a+score(id).ok,0);
  return `<h1>DevOps по-тихому</h1><p class="sub">Linux → Docker → Kubernetes → CI/CD → Terraform → Собес. Цель — понимать, что происходит в системе и почему.</p>
  ${BOX('Как работать с тетрадью',`<ol><li><b>Теория</b> — сначала «что это и зачем», потом суть. Команды не зубри: пойми, что они делают.</li><li><b>Практика</b> — задания. Следующий модуль откроется при ${PASS*100}% верных.</li><li><b>Лаба</b> — главное. Делай руками в терминале <b>без ИИ</b>. Застрял — <code>man</code>, <code>--help</code>, потом подсказка, и только потом решение.</li><li><b>Собес</b> — проговори ответ вслух, потом открой. Раздел «Собес каждый день» собирает вопросы всех открытых тем.</li><li>Не понял — жми «В разобрать», тема уйдёт в список.</li></ol>`)}
  <div class="stats"><div><b>${ORDER.length}</b>модулей готово</div><div><b>${ok}/${total}</b>заданий решено</div><div><b>${P.todo.length}</b>надо разобрать</div></div>
  <p class="muted">Прогресс хранится в этом браузере. На другом устройстве открывай модули кнопкой «Открыть без прохождения».</p>`}

function modView(id,tab){
  const m=MODS[id];if(!m)return '<p>Нет такого модуля.</p>';
  const u=unlocked(id),s=score(id),i=ORDER.indexOf(id),next=ORDER[i+1];
  const tabs=[['theory','Теория'],['ex',`Практика ${s.ok}/${s.n}`],['lab',`Лаба ${m.lab.length}`],['qa',`Собес ${m.qa.length}`]]
    .filter(([k])=>(k!=='lab'||m.lab.length)&&(k!=='qa'||m.qa.length)&&(k!=='theory'||m.theory));
  if(!tabs.some(t=>t[0]===tab))tab=tabs[0][0];
  let h=`<div class="mh"><span class="lv">${m.review?'Обзор':m.lvl} · модуль ${i+1}</span><h1>${m.title}</h1><p class="sub">${m.sub||''}</p></div><nav class="tabs">${tabs.map(([k,n])=>`<a class="${k===tab?'on':''}" href="#m-${id}-${k}">${n}</a>`).join('')}</nav>`;
  const early=earlyTerms(id);const caseBox=m.case?`<section class="case"><h2>Ситуация</h2>${m.case}</section>`:'';const earlyBox=early.length?`<details class="early"><summary>В этом модуле встретятся инструменты, которых ещё не было (${early.length}). Что это и зачем они нужны — раскрой</summary>${early.map(t=>termHTML(t)).join('')}</details>`:'';
  const tk=ticketsAfter(id);const projBox=tk.length?`<section class="projbox"><h2>🛠 В проекте «Магазин»</h2><p>После этого модуля можно делать:</p>${tk.map(t=>`<p>→ <a href="#project">Тикет ${t.id} · ${t.t}</a> — ${t.why}</p>`).join('')}</section>`:'';
  if(tab==='theory')h+=caseBox;
  if(tab==='theory'||tab==='ex'||tab==='lab')h+=earlyBox;
  if(tab==='theory')h+=(m.intro?`<section class="intro"><h2>Что это и зачем</h2>${m.intro}</section>`:'')+`<section>${m.theory}</section>`+(m.memo?`<section><h2>Как тренировать</h2>${m.memo}</section>`:'')+(m.traps.length?`<section><h2>Ловушки</h2>${TR(m.traps)}</section>`:'')+projBox;
  if(tab==='ex'){
    if(!u)return h+`<div class="lock">🔒 Практика откроется, когда в предыдущем модуле будет ${PASS*100}% верных. Теорию можно читать уже сейчас.<br><button class="force" data-id="${id}">Открыть без прохождения</button></div>`;
    const d=P.done[id]||{};let last='';
    h+=`<div class="bar"><span>Верно: ${s.ok} из ${s.n} (${s.pct*100|0}%)</span><button class="reset" data-id="${id}">Сбросить</button></div>`;
    m.ex.forEach((x,k)=>{const g=m.review?'rev':groupOf(x);if(g!==last){h+=`<h3 class="grp">${GROUPS[g]}</h3>`;last=g}h+=exHTML(x,k,d[k])});
    if(next)h+=`<p class="nextp">${s.pct>=PASS?`<a class="btn" href="#m-${next}">Дальше: ${MODS[next].title} →</a>`:`Для перехода дальше нужно ${PASS*100}%.`}</p>`}
  if(tab==='lab')h+=BOX('Правила лабы','<p>Терминал, без ИИ и без копипасты из решения. Порядок: подумай → <code>man</code> / <code>--help</code> → подсказка → решение. <b>Где делать:</b> бесплатно — GitHub Codespaces (Linux + Docker в браузере, ~60 ч/мес) или Killercoda (песочницы Linux/Kubernetes); для проекта — свой VPS (Hetzner CX22: 2 CPU, 4 ГБ, ≈ €4–5/мес, почасовая оплата). WSL/VirtualBox — только если на компьютере включена виртуализация. Не на рабочем сервере.</p>','warn')+
    m.lab.map((l,k)=>{const dn=(P.lab[id]||{})[k];return `<div class="lab${dn?' ok':''}"><div class="exh"><span class="tag">Лаба ${k+1}</span><label><input type="checkbox" class="labdone" data-id="${id}" data-k="${k}"${dn?' checked':''}> сделал сам</label></div><div class="q">${l.t}</div>${l.h?`<details><summary>Подсказка</summary>${l.h}</details>`:''}${l.chk?`<details><summary>Как проверить себя</summary>${l.chk}</details>`:''}${l.sol?`<details class="sol"><summary>Решение (только после попытки)</summary>${l.sol}</details>`:''}</div>`}).join('');
  if(tab==='lab')h+=projBox;
  if(tab==='qa')h+=`<p class="muted">Сначала ответь вслух сам, потом раскрой.</p>`+m.qa.map(([q,a])=>`<details class="qa"><summary>${q}</summary><div>${a}</div></details>`).join('');
  return h}

function cheat(){return `<h1>Шпаргалка</h1><input id="cs" class="inp wide" placeholder="Поиск: tail, права, порт…">`+ORDER.filter(id=>MODS[id].cheat.length).map(id=>`<section class="cs"><h3><a href="#m-${id}">${MODS[id].title}</a></h3>${CMDS(MODS[id].cheat)}</section>`).join('')}
function qaDaily(){const all=ORDER.filter(unlocked).flatMap(id=>MODS[id].qa.map(([q,a])=>[q,a,id]));
  return `<h1>Собес каждый день</h1><p class="sub">Пробегись глазами. Не знаешь — «В разобрать». Вопросы только из открытых модулей, порядок случайный.</p>`+
    shuffle(all).map(([q,a,id])=>`<details class="qa"><summary>${q}</summary><div>${a}<p class="muted">→ <a href="#m-${id}">${MODS[id].title}</a> · <button class="totodo" data-t="${esc(plain(q))}">В разобрать</button></p></div></details>`).join('')}
const modLink=id=>MODS[id]?`<a href="#m-${id}">${MODS[id].title}</a>${score(id).pct>=PASS?' ✓':''}`:`<span class="muted">${id} (модуль в работе)</span>`;
const ready=t=>t.need.every(id=>MODS[id]&&score(id).pct>=PASS);
function ticketHTML(t){const dn=P.proj[t.id],r=ready(t);return `<div class="ticket${dn?' ok':''}"><div class="exh"><span class="tag">Тикет ${t.id}</span><span class="${r?'rdy':'nrdy'}">${dn?'сделано':r?'можно делать':'сначала пройди модули'}</span><label><input type="checkbox" class="projdone" data-id="${t.id}"${dn?' checked':''}> сделал</label></div><h3>${t.t}</h3><p><b>Зачем:</b> ${t.why}</p><p><b>Что сделать:</b> ${t.do}</p><p><b>Готово, когда:</b> ${t.done}</p>${t.hint?`<details><summary>Подсказка</summary>${t.hint}</details>`:''}<p class="muted">Готовят модули: ${t.need.map(modLink).join(' · ')}</p></div>`}
function project(){const n=TICKETS.length,d=TICKETS.filter(t=>P.proj[t.id]).length;
  return `<h1>Проект «Магазин»</h1><p class="sub">${PROJECT.goal}</p>`+BOX('Как работать с проектом','<p>Это не задания с ответами, а настоящая работа: делаешь руками на своём сервере, без ИИ, и коммитишь в свой GitLab. Тикет становится «можно делать», когда пройдены модули, которые к нему готовят. Модули объясняют, <b>как</b>; проект показывает, <b>зачем</b> всё это вместе.</p>')+`<div class="stats"><div><b>${d}/${n}</b>тикетов сделано</div></div>`+PROJECT.sprints.map(s=>`<section><h2>${s.n}</h2><p class="sub">${s.goal}</p>${s.tickets.map(ticketHTML).join('')}</section>`).join('')}
function terms(){return `<h1>Словарь инструментов</h1><p class="sub">Каждый инструмент: что это, зачем он вообще нужен, где живёт на сервере и в какой ситуации ты с ним столкнёшься.</p>`+TERMS.map(t=>termHTML(t)).join('')}
function todo(){return `<h1>Надо разобрать</h1><p class="sub">Сюда — всё, что не понял. Разобрал — отмечай ✓.</p><div class="inrow"><input id="tdi" class="inp" placeholder="Тема или команда"><button id="tda" class="go">Добавить</button></div><ul class="todo">${P.todo.map((t,k)=>`<li><span>${esc(t)}</span><button class="tdx" data-k="${k}">✓</button></li>`).join('')}</ul>`}

function route(){
  let [a,id,tab]=location.hash.slice(1).split('-');a=a||'home';
  $('#main').innerHTML=a==='m'?modView(id,tab):a==='cheat'?cheat():a==='qa'?qaDaily():a==='todo'?todo():a==='terms'?terms():a==='project'?project():home();
  side(a==='m'?id:null);document.body.classList.remove('menu');scrollTo(0,0)}
addEventListener('hashchange',route);

document.addEventListener('click',ev=>{
  const t=ev.target.closest('button,input[type=checkbox]');if(!t)return;
  const cl=n=>t.classList.contains(n);
  if(t.id==='burger')return document.body.classList.toggle('menu');
  if(cl('force')){P.open[t.dataset.id]=true;save();return route()}
  if(cl('reset')){if(t.dataset.sure){delete P.done[t.dataset.id];save();route()}else{t.dataset.sure=1;t.textContent='Точно сбросить? Нажми ещё раз'}return}
  if(cl('projdone')){P.proj[t.dataset.id]=t.checked;save();return route()}
  if(cl('labdone')){(P.lab[t.dataset.id]=P.lab[t.dataset.id]||{})[t.dataset.k]=t.checked;save();t.closest('.lab').classList.toggle('ok',t.checked);return}
  if(cl('totodo')){if(!P.todo.includes(t.dataset.t))P.todo.push(t.dataset.t);save();t.textContent='Добавлено ✓';return}
  if(t.id==='tda'){const v=$('#tdi').value.trim();if(v){P.todo.push(v);save();route()}return}
  if(cl('tdx')){P.todo.splice(+t.dataset.k,1);save();return route()}
  const el=t.closest('.ex');if(!el)return;
  const id=location.hash.slice(1).split('-')[1],k=+el.dataset.i,x=MODS[id].ex[k];
  if(cl('chip')){(t.parentNode.classList.contains('spool')?el.querySelector('.sline'):el.querySelector('.spool')).appendChild(t);return}
  if(cl('opt')){el.querySelectorAll('.opt').forEach(b=>b.classList.remove('sel'));t.classList.add('sel')}
  if(cl('opt')||cl('go')){
    const ok=!!exCheck(x,el);(P.done[id]=P.done[id]||{})[k]=ok?1:0;save();
    el.classList.toggle('ok',ok);el.classList.toggle('no',!ok);
    el.querySelector('.fb').innerHTML=`<div class="res">${ok?'✓ Верно':'✗ Неверно'}</div>${ok?'':`<div class="right">Правильно: ${exRight(x)}</div>`}<div class="why">${x.e}</div><button class="totodo" data-t="${esc((MODS[id].title+': '+plain(x.q)).slice(0,140))}">В разобрать</button>`;
    const s=score(id),b=$('.bar span');if(b)b.textContent=`Верно: ${s.ok} из ${s.n} (${s.pct*100|0}%)`;side(id)}});
document.addEventListener('keydown',ev=>{if(ev.key==='Enter'&&ev.target.classList.contains('inp')){const g=ev.target.parentNode.querySelector('.go');g&&g.click()}});
document.addEventListener('input',ev=>{if(ev.target.id==='cs'){const v=ev.target.value.toLowerCase();document.querySelectorAll('.cs tr').forEach(r=>r.style.display=r.textContent.toLowerCase().includes(v)?'':'none')}});
route();
