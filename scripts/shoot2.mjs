import { chromium } from 'playwright-core';
import { readFileSync } from 'node:fs';
const exe = readFileSync('/tmp/claude-0/-home-user-wtrns-fr/38328e0c-204b-5a29-b40f-0e926a4d459e/scratchpad/chrome_path.txt','utf8').trim();
const O='/tmp/claude-0/-home-user-wtrns-fr/38328e0c-204b-5a29-b40f-0e926a4d459e/scratchpad';
const b=await chromium.launch({executablePath:exe,args:['--no-sandbox']});
const p=await b.newPage({viewport:{width:1300,height:900}});
for(let i=0;i<40;i++){try{const r=await p.goto('http://localhost:4321/',{timeout:3000});if(r&&r.ok())break;}catch{}await p.waitForTimeout(500);}
// article with placeholder cover
await p.goto('http://localhost:4321/loi-bourquin-contestation-refus',{waitUntil:'load'});await p.waitForTimeout(900);
await p.screenshot({path:O+'/verify-article-ph.png'});
// homepage top (cards mix)
await p.goto('http://localhost:4321/',{waitUntil:'load'});await p.waitForTimeout(900);
await p.evaluate(()=>scrollTo(0,900));await p.waitForTimeout(700);
await p.screenshot({path:O+'/verify-home-cards.png'});
await b.close();console.log('shot');
