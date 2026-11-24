/* npm run new -- <id>  — создать заготовку модуля src/modules/<уровень>/<id>.js со всеми обязательными частями.
   id должен быть в плане (LEVELS в src/course/order.js). Пока заготовка не заполнена, npm run check будет ругаться — так и задумано. */
const fs=require('fs'),vm=require('vm'),path=require('path');
const {files,S}=require(path.join(__dirname,'..','build.js'));
const id=process.argv[2];if(!id){console.error('Укажи id: npm run new -- ssh');process.exit(1)}
const ctx={};vm.createContext(ctx);
vm.runInContext(files().filter(f=>!f.startsWith('engine/app')).map(f=>fs.readFileSync(S(f),'utf8')).join('\n;')+';this.MODS=MODS;this.LEVELS=LEVELS;',ctx);
const lvl=ctx.LEVELS.find(l=>l.ids.includes(id));if(!lvl){console.error(`Модуля ${id} нет в плане (LEVELS). Сначала добавь id в src/course/order.js и строку в ROADMAP.md`);process.exit(1)}
if(ctx.MODS[id]){console.error(`Модуль ${id} уже есть`);process.exit(1)}
const dir=S('modules/'+lvl.id);fs.mkdirSync(dir,{recursive:true});const file=path.join(dir,id+'.js');
fs.writeFileSync(file,`/* ${id} · ${lvl.id} · TODO тема */
MOD({id:'${id}',title:'TODO название',sub:'TODO подзаголовок: о чём модуль в одну строку.',
case:\`<p>TODO Ситуация: живая история с работы — что сломалось, кто пишет, что от тебя хотят (3–5 предложений).</p><p class="goal"><b>Цель модуля:</b> TODO после модуля ты сможешь…</p>\`,
intro:\`<p>TODO Что это и зачем: простыми словами, какую боль решает, как было бы без этого (3–6 предложений).</p>\`,
theory:\`<h2>TODO</h2>
\${C(\`команда --флаг /путь\`)}
\${CMDS([['cmd','что делает']])}
\${BOX('Заголовок','<p>текст</p>','deep')}\`,
memo:\`<p>TODO Как тренировать.</p>\`,
traps:[
 ['TODO ошибка','правильно','почему']],
ex:[
 /* 22–28 заданий. Типы: c (выбор), r (чтение вывода), i (впиши, fix:true — исправь), s (собери). Группы g: base (по умолч.), prac, job.
    У каждого — e: почему так (полноценное объяснение, не одно слово). Ссылки на другие модули — [[mod:id]]. */
 {t:'c',q:'TODO вопрос',o:['верный','неверный 1','неверный 2','неверный 3'],a:0,e:'TODO почему'}],
lab:[
 {t:'TODO задача руками, без ИИ',h:'<p>подсказка</p>',chk:'<p>как проверить себя</p>',sol:C(\`решение\`)}],
qa:[
 ['TODO вопрос собеса','ответ']],
cheat:[['cmd','что делает']]});
`);
console.log('Создан',path.relative(process.cwd(),file),'— заполни TODO, затем: npm run check');
