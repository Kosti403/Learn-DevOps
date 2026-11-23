/* npm run build → index.html (один файл). Порядок важен: каждый следующий файл использует объявленное выше. */
const fs=require('fs'),path=require('path');
const S=p=>path.join(__dirname,'src',p);
const read=p=>fs.readFileSync(S(p),'utf8').replace(/\s+$/,'');
const dir=d=>{const out=[];const walk=r=>fs.readdirSync(S(r),{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name)).forEach(e=>{const p=r+'/'+e.name;e.isDirectory()?walk(p):p.endsWith('.js')&&out.push(p)});walk(d);return out};
const files=()=>['core/helpers.js','course/registry.js',...dir('modules'),'course/order.js','data/cheat.js','engine/ex.js','engine/app.js'].filter(p=>fs.existsSync(S(p)));
function build(out='index.html'){
  const js=files().map(read).join('\n');
  const html=`<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>DevOps по-тихому</title><style>${read('shell/style.css')}</style></head><body>${read('shell/body.html')}<script>${js.replace(/<\/script/g,'<\/script')}</script></body></html>`;
  fs.writeFileSync(path.join(__dirname,out),html);return {files:files().length,kb:(html.length/1024).toFixed(1)}}
if(require.main===module)console.log('index.html',build());
module.exports={build,files,S};
