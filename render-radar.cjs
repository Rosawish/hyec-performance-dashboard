// Execute the unchanged website radar renderer against a minimal DOM adapter.
const fs=require('fs'),vm=require('vm');
(async()=>{let output={};const data=JSON.parse(fs.readFileSync('radar-level-data.json'));
for(const name of ['全公司總覽',...new Set(data.records.map(r=>r.name))]){
 const count=name==='全公司總覽'?2:data.records.filter(r=>r.name===name).length;
 output[name]=[];
 for(let role=0;role<count;role++)for(const [model,scenario] of [['A','S5'],['B','S0'],['B','S5'],['C','S0'],['C','S5']]){
  const controls={'#radar-model':{value:model},'#radar-scenario':{value:scenario,closest:()=>({})},'#radar-own':{value:String(role)}};
  const render={innerHTML:''},app={innerHTML:'',querySelector:s=>s==='.radar-render'?render:controls[s],querySelectorAll:()=>[]};
  const panel={dataset:{overview:name==='全公司總覽'?'true':'false',person:name},querySelector:()=>app};
  await vm.runInNewContext(fs.readFileSync('radar.js','utf8'),{document:{querySelector:()=>panel},fetch:async()=>({json:async()=>data})});
  const title=model+'｜'+(model==='A'?'單一分數':scenario)+(count>1?'｜謝世澤'+(role?'代理研發處長':'特助'):'');
  output[name].push({title,html:render.innerHTML});
 }
}fs.writeFileSync('radar-print.json',JSON.stringify(output));})();
