import { chromium } from 'playwright-core';
import { readFileSync } from 'node:fs';
const exe=readFileSync('/tmp/claude-0/-home-user-wtrns-fr/38328e0c-204b-5a29-b40f-0e926a4d459e/scratchpad/chrome_path.txt','utf8').trim();
const O='/tmp/claude-0/-home-user-wtrns-fr/38328e0c-204b-5a29-b40f-0e926a4d459e/scratchpad';
const b=await chromium.launch({executablePath:exe,args:['--no-sandbox']});
const p=await b.newPage({viewport:{width:1440,height:1500}});
for(let i=0;i<30;i++){try{const r=await p.goto('http://localhost:4321/',{timeout:3000});if(r&&r.ok())break;}catch{}await p.waitForTimeout(500);}
await p.waitForTimeout(1200);
await p.evaluate(()=>scrollTo(0,760));
await p.waitForTimeout(1200);
await p.screenshot({path:O+'/bento-check.png'});
await b.close();console.log('shot');
