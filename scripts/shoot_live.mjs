import { chromium } from 'playwright-core';
import { readFileSync } from 'node:fs';
const exe = readFileSync('/tmp/claude-0/-home-user-wtrns-fr/38328e0c-204b-5a29-b40f-0e926a4d459e/scratchpad/chrome_path.txt','utf8').trim();
const O='/tmp/claude-0/-home-user-wtrns-fr/38328e0c-204b-5a29-b40f-0e926a4d459e/scratchpad';
const b=await chromium.launch({executablePath:exe,args:['--no-sandbox']});
try {
  const p=await b.newPage({viewport:{width:1440,height:2300}});
  console.log('goto home...');
  await p.goto('https://wtrns-preprod.pages.dev/',{waitUntil:'domcontentloaded',timeout:30000});
  await p.waitForTimeout(2500);
  // scroll to load lazy imgs then settle
  await p.evaluate(async()=>{await new Promise(r=>{let y=0;const t=()=>{y+=450;scrollTo(0,y);if(y<2800)setTimeout(t,80);else r()};t()})});
  await p.waitForTimeout(2500);
  await p.evaluate(()=>scrollTo(0,560));
  await p.waitForTimeout(1800);
  await p.screenshot({path:`${O}/live-home.png`});
  console.log('shot live-home');
  await p.close();
} catch(e){ console.log('ERR', e.message); }
await b.close();
