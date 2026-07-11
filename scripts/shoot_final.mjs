import { chromium } from 'playwright-core';
import { readFileSync } from 'node:fs';
const exe=readFileSync('/tmp/claude-0/-home-user-wtrns-fr/38328e0c-204b-5a29-b40f-0e926a4d459e/scratchpad/chrome_path.txt','utf8').trim();
const O='/tmp/claude-0/-home-user-wtrns-fr/38328e0c-204b-5a29-b40f-0e926a4d459e/scratchpad';
const b=await chromium.launch({executablePath:exe,args:['--no-sandbox']});
const probe=await b.newPage();
for(let i=0;i<40;i++){try{const r=await probe.goto('http://localhost:4321/',{timeout:3000});if(r&&r.ok())break;}catch{}await probe.waitForTimeout(500);}
await probe.close();
const views=[
  {path:'/',name:'final-home',h:2400,scroll:2900},
  {path:'/articles',name:'final-articles',h:1500,scroll:1000},
  {path:'/theme/cuisine',name:'final-theme',h:1400,scroll:900},
];
for(const v of views){
  const p=await b.newPage({viewport:{width:1440,height:v.h}});
  await p.goto('http://localhost:4321'+v.path,{waitUntil:'load',timeout:20000}).catch(()=>{});
  await p.waitForTimeout(900);
  await p.evaluate(async(mx)=>{await new Promise(r=>{let y=0;const t=()=>{y+=450;scrollTo(0,y);if(y<mx)setTimeout(t,60);else r()};t()})}, v.scroll);
  await p.waitForTimeout(1000);
  await p.evaluate(()=>scrollTo(0,540));
  await p.waitForTimeout(900);
  await p.screenshot({path:`${O}/${v.name}.png`});
  console.log('shot',v.name);
  await p.close();
}
await b.close();
