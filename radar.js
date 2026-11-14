(async()=>{
const panel=document.querySelector('#radar-panel');if(!panel)return;
const overview=panel.dataset.overview==='true',name=panel.dataset.person;
const d=await(await fetch(overview?'radar-level-data.json':'../radar-level-data.json')).json();
const app=panel.querySelector('.radar-app'), own=d.records.filter(r=>r.name===name);
const names={A:'依原始績效考核指標與配比',B:'依原始績效考核架構＋專案執行成果',C:'調整後的績效考核架構'};
app.innerHTML=`<div class="radar-controls"><label>評核架構<select id="radar-model">${Object.entries(names).map(([k,v])=>`<option value="${k}">${k}｜${v}</option>`).join('')}</select></label><label>分數情境<select id="radar-scenario"><option>S0</option><option selected>S5</option></select></label>${own.length>1?'<label>本人的職務<select id="radar-own">'+own.map((r,i)=>`<option value="${i}">${r.role==='研發代理'?'代理研發處長':r.role}</option>`).join('')+'</select></label>':overview?'<label>謝世澤納入比較的職務<select id="radar-own"><option value="0">特助</option><option value="1">代理研發處長</option></select></label>':''}</div><div class="radar-render" aria-live="polite"></div>`;
function draw(){
const model=app.querySelector('#radar-model').value, scenario=app.querySelector('#radar-scenario').value;
app.querySelector('#radar-scenario').closest('label').hidden=model==='A';
const r=overview?null:own[Number(app.querySelector('#radar-own')?.value||0)];
const selectedHsieh=own.length>1?r.role:(overview&&app.querySelector('#radar-own').value==='1'?'研發代理':'特助');
const pool=d.records.filter(x=>x.name!=='謝世澤'||x.role===selectedHsieh);
const values=x=>model==='A'?x.A:x[model][scenario];
const levels=overview?['director','manager']:[r.level], axes=d.axes[model];
app.querySelector('.radar-render').innerHTML=`<div class="radar-level-grid ${overview?'two-levels':''}">${levels.map(level=>{
 const members=pool.filter(x=>x.level===level), avg=axes.map((_,i)=>{const v=members.map(x=>values(x)[i]).filter(v=>v!==null);return {mean:v.reduce((a,b)=>a+b,0)/v.length,n:v.length}}), vals=r?values(r):avg.map(x=>x.mean), means=avg.map(x=>x.mean);
 const point=(v,i,rad=140)=>{const a=i*Math.PI/3-Math.PI/2;return [250+rad*v/9*Math.cos(a),220+rad*v/9*Math.sin(a)]};
 const points=vs=>vs.map((v,i)=>point(v,i).join(',')).join(' ');
 let svg=`<svg viewBox="0 0 500 440" role="img" aria-label="${overview?d.levels[level]:name} ${model}類${model==='A'?'':scenario}雷達圖">`;
 for(let l=3;l<=9;l+=3)svg+=`<polygon points="${points(Array(6).fill(l))}" fill="none" stroke="#dfdaeb"/><text x="255" y="${220-140*l/9-3}" font-size="17" fill="#777">${l}</text>`;
 axes.forEach((label,i)=>{const [x,y]=point(9,i),[lx,ly]=point(12,i);svg+=`<line x1="250" y1="220" x2="${x}" y2="${y}" stroke="#e8e4f0"/><text x="${lx}" y="${ly}" text-anchor="middle" font-size="20" fill="#575168">${label}</text>`});
 svg+=`<polygon points="${points(means)}" fill="#14aa9b18" stroke="#14aa9b" stroke-width="2.5" stroke-dasharray="6 4"/>`;
 if(r&&vals.every(v=>v!==null))svg+=`<polygon points="${points(vals)}" fill="#7c65f52c" stroke="#7c65f5" stroke-width="3"/>`;
 else if(r)vals.forEach((v,i)=>{let j=(i+1)%6;if(v!==null&&vals[j]!==null){const [x,y]=point(v,i),[x2,y2]=point(vals[j],j);svg+=`<line x1="${x}" y1="${y}" x2="${x2}" y2="${y2}" stroke="#7c65f5" stroke-width="3"/>`}});
 if(r)vals.forEach((v,i)=>{if(v!==null){const [x,y]=point(v,i);svg+=`<circle cx="${x}" cy="${y}" r="4" fill="#7c65f5"/>`}});svg+='</svg>';
 return `<article class="radar-level-card"><h3>${d.levels[level]}${overview?'平均':'同級比較'} <small>${members.length} 人</small></h3><p class="radar-legend">${r?`<span class="radar-person">● ${name}｜${r.role==='研發代理'?'代理研發處長':r.role}</span>　`:''}<span class="radar-average">┄ ${d.levels[level]}平均</span>${model==='A'?'':`　${scenario}`}</p><div class="radar-visual">${svg}</div><div class="scroll"><table class="radar-values"><thead><tr><th>評核構面</th>${r?'<th>本人</th>':''}<th>同級平均</th><th>人數</th></tr></thead><tbody>${axes.map((a,i)=>`<tr><td data-label="評核構面">${a}</td>${r?`<td data-label="本人">${vals[i]===null?'不計分':vals[i].toFixed(2)}</td>`:''}<td data-label="同級平均">${avg[i].mean.toFixed(2)}</td><td data-label="人數">${avg[i].n}</td></tr>`).join('')}</tbody></table></div><details class="radar-members"><summary>比較對象</summary><p>${members.map(x=>`${x.name}${x.name==='謝世澤'?'（'+(x.role==='研發代理'?'代理研發處長':'特助')+'）':''}`).join('、')}</p></details></article>`
}).join('')}</div><p class="radar-note">處級與廠長／經理級分別計算，平均包含本人。以相同架構、同一分數情境的六個構面比較，量尺為 0–9 分；不混用加權貢獻與原始分數。${model==='A'?'成果軸依原成果權重換算為同一量尺，能力五項採總經理評價；A 類為單一分數。':model==='B'?'成果軸沿用單一綜合成果評分，不拆成營運、專案與會議三等份。':'不計分構面不補零，依該軸有效人數計算。'}謝世澤兩個職務分開檢視，同一平均只納入所選的一個角色；特助採處級比較。各職責的具體指標與判斷依據仍見個人報告。</p>${r?`<a href="#${r.anchor}${model.toLowerCase()}">查看${model}類逐項分數與依據 →</a>`:''}`;
}
app.querySelectorAll('select').forEach(el=>el.addEventListener('change',draw));draw();
})();
