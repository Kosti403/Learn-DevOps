/* npm run status — где мы: готовые модули по уровням, следующий модуль, что осталось, проект.
   Источник правды о готовности — наличие модуля в src/modules (MODS), план — LEVELS в src/course/order.js. */
const fs=require('fs'),vm=require('vm'),path=require('path'),cp=require('child_process');
const {files,S}=require(path.join(__dirname,'..','build.js'));
const ctx={};vm.createContext(ctx);
vm.runInContext(files().filter(f=>!f.startsWith('engine/app')).map(f=>fs.readFileSync(S(f),'utf8')).join('\n;')+';this.MODS=MODS;this.LEVELS=LEVELS;this.ORDER=ORDER;this.TICKETS=TICKETS;',ctx);
const {MODS,LEVELS,ORDER,TICKETS}=ctx;
let next=null,doneN=0,allN=0;
console.log('\n=== Курс: готово / план ===');
for(const l of LEVELS){const d=l.ids.filter(id=>MODS[id]),t=l.ids.filter(id=>!MODS[id]);doneN+=d.length;allN+=l.ids.length;
  if(!next&&t.length)next=t[0];
  console.log(`${l.id} ${l.name}: ${d.length}/${l.ids.length}`+(t.length?`\n   осталось: ${t.join(', ')}`:' ✅'));}
console.log(`\nИтого модулей: ${doneN}/${allN} (${Math.round(doneN/allN*100)}%), заданий: ${ORDER.reduce((a,id)=>a+MODS[id].ex.length,0)}`);
console.log(`Следующий модуль: ${next||'— всё готово'}  →  npm run new -- ${next||''}`);
const ready=TICKETS.filter(t=>t.need.every(id=>MODS[id])).map(t=>t.id);
console.log(`Проект «Магазин»: тикетов ${TICKETS.length}, обеспечены готовыми модулями: ${ready.length} (${ready.join(', ')||'—'})`);
try{console.log('\nПоследние коммиты:\n'+cp.execSync('git log --oneline -5',{cwd:path.join(__dirname,'..')}).toString())}catch(e){}
