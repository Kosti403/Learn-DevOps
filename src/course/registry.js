/* Реестр. Каждый файл src/modules/** вызывает MOD({...}) или REV({...}). Порядок — в course/order.js.
   MOD({
     id, lvl:'L1', title, sub,
     intro:  'html — Что это и зачем (3–6 предложений)',
     theory: 'html — суть: механизм, команды, схемы',
     memo:   'html — Как тренировать',
     traps:  [[ошибка, правильно, почему], …],
     ex:     [задания — формат в engine/ex.js],
     lab:    [{t:'задача руками', h:'подсказка', chk:'как проверить себя', sol:'решение'}],
     qa:     [[вопрос собеса, ответ], …],
     cheat:  [[команда, что делает], …]   — уходит в общую шпаргалку
   }) */
const MODS={};
const MOD=m=>{if(MODS[m.id])throw new Error('Дубль модуля: '+m.id);MODS[m.id]=Object.assign({ex:[],lab:[],qa:[],cheat:[],traps:[]},m)};
const REV=r=>MOD(Object.assign({review:true,lvl:'',sub:'Накопительный обзор: без подсказок, темы смешаны.'},r));
