/* Помощники для текста модулей. Всё глобально (один файл после сборки).
   esc(s)             — экранировать HTML
   C(code,lang)       — блок кода с раскраской. lang: 'sh' (по умолч.), 'term' ($ команда + вывод), 'out' (как есть), 'yaml', 'ps' (PowerShell)
   c(code)            — команда в строке текста (inline)
   tbl(head,rows)     — таблица
   CMDS([[cmd,что делает],…]) — таблица команд с раскраской
   TR([[ошибка,правильно,почему],…]) — ловушки
   BOX(title,html,kind) — врезка: kind 'idea' | 'warn' | 'deep' (глубже: механизм под капотом) */
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const CMDWORD=/^(sudo|time|watch|xargs|exec|env)$/;
function hlSh(line){
  if(/^\s*#/.test(line))return `<i class="k-com">${esc(line)}</i>`;
  let out='',first=true,m;const re=/(\s+)|("(?:[^"\\]|\\.)*"|'[^']*')|(\|\||&&|\||;|>>|2>&1|>|<)|(#.*$)|([^\s|;&<>]+)/g;
  while((m=re.exec(line))){
    if(m[1]){out+=m[1];continue}
    if(m[2]){out+=`<span class="k-str">${esc(m[2])}</span>`;continue}
    if(m[3]){out+=`<span class="k-op">${esc(m[3])}</span>`;if(/^(\|\||&&|\||;)$/.test(m[3]))first=true;continue}
    if(m[4]){out+=`<i class="k-com">${esc(m[4])}</i>`;continue}
    const t=m[5];let k;
    if(first){k='k-cmd';if(!CMDWORD.test(t)&&!/=/.test(t))first=false}
    else if(/^-/.test(t))k='k-flag';
    else if(/^\$/.test(t))k='k-var';
    else if(/^(\/|~|\.\/|\.\.\/)/.test(t))k='k-path';
    out+=k?`<span class="${k}">${esc(t)}</span>`:esc(t)}
  return out}
function hlYaml(line){
  if(/^\s*#/.test(line))return `<i class="k-com">${esc(line)}</i>`;
  const m=line.match(/^(\s*-?\s*)([\w.\-\/]+)(:)(.*)$/);
  return m?esc(m[1])+`<span class="k-cmd">${esc(m[2])}</span>`+m[3]+`<span class="k-str">${esc(m[4])}</span>`:esc(line)}
function C(code,lang='sh'){
  const lines=code.replace(/^\n|\n\s*$/g,'').split('\n');
  const body=lines.map(l=>{
    if(lang==='term')return /^\$ /.test(l)?`<span class="k-pr">$ </span>`+hlSh(l.slice(2)):`<span class="k-outl">${esc(l)}</span>`;
    if(lang==='out')return esc(l);
    if(lang==='yaml')return hlYaml(l);
    return hlSh(l)}).join('\n');
  return `<pre class="code">${body}</pre>`}
const c=s=>`<code>${hlSh(s)}</code>`;
const tbl=(h,rows)=>`<div class="tw"><table><thead><tr>${h.map(x=>`<th>${x}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${r.map(x=>`<td>${x}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
const CMDS=rows=>`<div class="tw"><table class="cmds"><tbody>${rows.map(([k,v])=>`<tr><td><code>${hlSh(k)}</code></td><td>${v}</td></tr>`).join('')}</tbody></table></div>`;
const TR=rows=>`<ul class="traps">${rows.map(([w,r,y])=>`<li><div><span class="bad">✗ ${w}</span></div><div><span class="good">✓ ${r}</span></div><div class="why">${y}</div></li>`).join('')}</ul>`;
const BOX=(t,h,k='idea')=>`<div class="box ${k}"><b>${t}</b>${h}</div>`;
