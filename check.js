/* npm run check — сборка + проверка данных; npm run map — карта курса. */
const {build,files,S}=require('./build.js'),fs=require('fs'),vm=require('vm');
const info=build();
const ctx={console};vm.createContext(ctx);
const src=files().filter(f=>!f.startsWith('engine/app')).map(f=>fs.readFileSync(S(f),'utf8')).join('\n')+';this.MODS=MODS;this.ORDER=ORDER;this.TICKETS=TICKETS;this.LEVELS=LEVELS;';
vm.runInContext(src,ctx);
const {MODS,ORDER}=ctx;let err=0;const bad=(id,k,m)=>{err++;console.log(`✗ ${id}#${k+1}: ${m}`)};
if(process.argv.includes('--map'))ORDER.forEach((id,i)=>{const m=MODS[id];console.log(String(i+1).padStart(2),m.lvl.padEnd(3),id.padEnd(9),String(m.ex.length).padStart(3),'заданий','лаб',m.lab.length,'qa',m.qa.length,'·',m.title)});
ORDER.forEach((id,i)=>{const m=MODS[id];
  if(!m.review&&!m.intro)bad(id,-1,'нет intro');if(!m.case)bad(id,-1,'нет блока «Ситуация» (case)');
  if(m.ex.length<20||m.ex.length>28)console.log(`! ${id}: заданий ${m.ex.length} (норма 22–28)`);
  const okTags=/^(p|b|i|a|ol|ul|li|code|mark|h2|h3|br|div|span|table|thead|tbody|tr|td|th|pre|details|summary|section|em|strong|sup|sub|small|u)$/;
  const txt=JSON.stringify([m.intro,m.theory,m.memo,m.traps,m.ex,m.lab,m.qa]);(txt.match(/<\/?[a-zA-Zа-яА-Я][^\s>\/]*/g)||[]).forEach(t=>{if(!okTags.test(t.replace(/[</]/g,'')))bad(id,-1,'странный тег '+t)});
  m.ex.forEach((x,k)=>{
    if(!x.e)bad(id,k,'нет пояснения');
    if(!'cris'.includes(x.t))bad(id,k,'тип '+x.t);
    if((x.t==='c'||x.t==='r')&&!(x.o&&x.o[x.a]!==undefined))bad(id,k,'нет верного варианта');
    if((x.t==='c'||x.t==='r')&&new Set(x.o).size!==x.o.length)bad(id,k,'повтор вариантов');
    if(x.t==='i'&&!(Array.isArray(x.a)&&x.a.length))bad(id,k,'нет ответов');
    if(x.t==='s'&&!(x.p&&x.p.length>1))bad(id,k,'нет шагов');
    if(x.ref&&!(ORDER.indexOf(x.ref)>-1&&ORDER.indexOf(x.ref)<i))bad(id,k,'ref не назад: '+x.ref)})});
ORDER.forEach(id=>{for(const m of JSON.stringify(MODS[id]).matchAll(/\[\[mod:(\w+)\]\]/g))if(!ctx.LEVELS.flatMap(l=>l.ids).includes(m[1]))bad(id,-1,'ссылка на модуль вне плана: '+m[1])});
const plan=ctx.LEVELS.flatMap(l=>l.ids);ctx.TICKETS.forEach(t=>t.need.forEach(n=>{if(!plan.includes(n))bad('project',-1,'тикет '+t.id+': модуля '+n+' нет в плане')}));
console.log(err?`Ошибок: ${err}`:'✓ ошибок нет',info);process.exit(err?1:0);
