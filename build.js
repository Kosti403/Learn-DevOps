/* npm run build → index.html (открыть в браузере) + artifact.html (для публикации артефактом:
   без doctype/html/head/body — их добавляет площадка). Порядок файлов важен: каждый использует объявленное выше. */
const fs=require('fs'),path=require('path');
const S=p=>path.join(__dirname,'src',p);
const read=p=>fs.readFileSync(S(p),'utf8').replace(/\s+$/,'');
const dir=d=>{const out=[];const walk=r=>fs.readdirSync(S(r),{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name)).forEach(e=>{const p=r+'/'+e.name;e.isDirectory()?walk(p):p.endsWith('.js')&&out.push(p)});walk(d);return out};
const files=()=>['core/helpers.js','course/registry.js',...dir('modules'),'course/order.js','data/cheat.js','engine/ex.js','engine/app.js'].filter(p=>fs.existsSync(S(p)));
function build(out='index.html'){
  const js=files().map(read).join('\n').replace(/<\/script/g,'<\\/script');
  const css=read('shell/style.css'),body=read('shell/body.html'),title='<title>DevOps по-тихому</title>';
  const html=`<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">${title}<style>${css}</style></head><body>${body}<script>${js}</script></body></html>`;
  fs.writeFileSync(path.join(__dirname,out),html);
  fs.writeFileSync(path.join(__dirname,'artifact.html'),`${title}<style>${css}</style>${body}<script>${js}</script>`);
  return {files:files().length,kb:(html.length/1024).toFixed(1)}}
if(require.main===module)console.log('index.html + artifact.html',build());
module.exports={build,files,S};
