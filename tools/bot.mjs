// Headless playthroughs for tuning: node tools/bot.mjs
import { Sim, lotId } from '../js/sim.js';
import { T, EVENT, BW, BH, NB, NL } from '../js/data.js';
const bots = {
  nothing: { yearly() {} , choice: () => undefined },
  sprawl: { start(s){ for(let i=0;i<NL;i++) s.setZone(i,1); }, yearly(){}, choice:()=>1 },
  planner: {
    start(s){ for(let by=0;by<BH;by++)for(let bx=0;bx<BW;bx++)for(let l=0;l<16;l++){const i=((by*BW+bx)<<4)|l; const lx=l&3;
        s.setZone(i, bx>=8? 2 : (lx===3&&bx%2===1)||(by%4===2&&(l>>2)===0)?3:1);} },
    yearly(s){
      // sewers on the most populated blocks first, then services
      const order=[...Array(NB).keys()].sort((a,b)=>s.bPop[b]-s.bPop[a]);
      for(const k of order){ if(s.money<1500) break; if(!s.sewer[k]&&s.bPop[k]>40) s.buildSewer(k); }
      for(const k of order){ if(s.money<2500) break; if(!s.paved[k]&&s.bPop[k]>80) s.pave(k); }
      const want=[[T.FIRE,1867],[T.SCHOOL,1869],[T.FIRE,1870],[T.PARK,1874],[T.SCHOOL,1880],[T.POLICE,1882],[T.BATH,1885],[T.HOSP,1888],[T.FIRE,1890],[T.SCHOOL,1892]];
      for(const [t,y] of want){ if(s.year>=y && !this['d'+t+y] && s.money>s.cost(t)+800){ const k=order[(Math.random()*6)|0]; const i=(k<<4)|5; if(!s.place(t,i)) this['d'+t+y]=1; } }
      if(s.year===1878&&s.money>3000) s.addLine(0,5,false);
      if(s.year===1884&&s.money>3000) s.addLine(1,5,false);
    },
    choice:(id)=>({limits:0,panic:0,strike77:1,smallpox:0,haymarket:1,powers:1,hull:0,fair:0,garbage:0,election:0}[id]) },
};
for (const [name, bot] of Object.entries(bots)) {
  const s = new Sim(); bot.start?.(s);
  console.log('\n== ' + name);
  let guard=0;
  while (!s.over) {
    s.step();
    while (s.burning.length && guard++<1e6) s.fireStep();
    while (s.pending.length) { const id = s.pending.shift(); const ev = EVENT[id]; let c = ev.choices ? (bot.choice(id) ?? ev.def) : undefined; s.choose(id, c); }
    if (s.month === 11) { bot.yearly(s);
      if (s.year % 5 === 0 || s.year===1871||s.year===1872) { const cnt={}; for(let i=0;i<NL;i++) cnt[s.b[i]]=(cnt[s.b[i]]||0)+1;
      console.log(s.year, 'pop', Math.round(s.totPop), 'crowd', s.crowd.toFixed(2), 'dr', s.deathRate.toFixed(1), 'happy', Math.round(s.happy), 'emp', Math.round(s.emp*100), 'smoke', Math.round(s.smoke), 'fire', Math.round(s.fireRisk), '$', Math.round(s.money), 'inc', Math.round(s.income), 'hl', Math.round(s.homelessTotal), 'bood', Math.round(s.boodle), 'shanty',cnt[1]||0,'cot',cnt[2]||0,'rear',cnt[3]||0,'wten',cnt[4]||0,'brk',cnt[5]||0,'bten',(cnt[6]||0)+(cnt[7]||0),'ind',(cnt[20]||0)+(cnt[21]||0)+(cnt[22]||0)+(cnt[23]||0),'rub',cnt[30]||0); }
    }
  }
  console.log('deaths', Math.round(s.deaths), 'arrived', Math.round(s.arrived), 'burned', s.stats.burned, 'gf', s.stats.gfBurned, Math.round(s.stats.gfDead), 'epi', Math.round(s.stats.epiDead), 'groups', Array.from(s.groupPop, Math.round).join(','));
  console.log(s.news.filter(n=>n.kind!=='info').slice(0,40).map(n=>n.y+': '+n.text).join('\n'));
}
