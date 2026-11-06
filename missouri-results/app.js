/* Missouri Election Results, Nov 3, 2026.
   One page, no build step. Data lives in data/ (or inline <script type="application/json"> tags
   when the page is bundled into a single file). Map and charts are drawn with d3 + topojson. */
"use strict";

const DATA_FILES = { topo:'data/mo.topo.json', meta:'data/meta.json', holders:'data/holders.json', places:'data/places.json', local:'data/local.json', about:'data/measures.json', offices:'data/offices.json', results:'data/results.csv', judicial:'data/judicial.csv' };
async function loadData(){
  const out={};
  for(const [k,file] of Object.entries(DATA_FILES)){
    const el=document.getElementById('data-'+k);
    const csv=file.endsWith('.csv');
    if(el){ out[k]= csv? el.textContent.trim() : JSON.parse(el.textContent); continue; }
    const r=await fetch(file); if(!r.ok) throw new Error(`Couldn’t load ${file} (${r.status})`);
    out[k]= csv? (await r.text()).trim() : await r.json();
  }
  return out;
}
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const dur = ms => reducedMotion ? 0 : ms;

/* ---------- theme (shares the "theme" key with the rest of the site) ---------- */
const isDark = () => { const t=document.documentElement.dataset.theme; return t? t==='dark' : !matchMedia('(prefers-color-scheme: light)').matches; };
function setupTheme(onChange){
  const btn=document.getElementById('theme'); if(!btn) return;
  const root=document.documentElement, system=matchMedia('(prefers-color-scheme: light)');
  const label=btn.querySelector('span'), icon=btn.querySelector('use');
  const render=()=>{ const light=!isDark(); label.textContent= light?'Dark':'Light'; icon.setAttribute('href', light?'#i-moon':'#i-sun');
    if(root.dataset.theme) document.querySelectorAll('meta[name="theme-color"]').forEach(m=>{ m.content= light?'#f6f3ec':'#0a0e13'; }); };
  btn.addEventListener('click',()=>{ const next=isDark()?'light':'dark'; root.dataset.theme=next; try{ localStorage.setItem('theme',next); }catch(e){} render(); onChange(); });
  system.addEventListener('change',()=>{ render(); onChange(); });
  btn.hidden=false; render();
}

async function main(){
const DATA = await loadData();
const topo = DATA.topo, META = DATA.meta, HOLDERS = DATA.holders, PLACES = DATA.places, LOCAL = DATA.local, ABOUT = DATA.about;
const LAYERS = {
  counties: topojson.feature(topo, topo.objects.counties).features,
  congress: topojson.feature(topo, topo.objects.congress).features,
  senate:   topojson.feature(topo, topo.objects.senate).features,
  house:    topojson.feature(topo, topo.objects.house).features,
};
const stateMesh = topojson.mesh(topo, topo.objects.counties, (a,b)=>a===b);
const countyMesh = topojson.mesh(topo, topo.objects.counties, (a,b)=>a!==b);

const SOURCES = ABOUT._sources || '';

// ---------- county name lookup ----------
const norm = s => String(s||'').toLowerCase().replace(/\bsaint\b/g,'st').replace(/\bsainte\b/g,'ste').replace(/[.'’]/g,'').replace(/\bcounty\b/g,'').replace(/\s+/g,'');
const countyByKey = new Map();
LAYERS.counties.forEach(f => { countyByKey.set(f.properties.id, f.properties.id); countyByKey.set(norm(f.properties.name), f.properties.id); });
countyByKey.set('stlouiscity','29510'); countyByKey.set('cityofstlouis','29510'); countyByKey.set('stlouis','29189'); countyByKey.set('kansascity','KC');
const countyName = Object.fromEntries(LAYERS.counties.map(f=>[f.properties.id,f.properties.name]));
const countyFull = id => id==='29510' ? 'St. Louis City' : id==='29189' ? 'St. Louis County' : countyName[id]+' County';
const haveCounty = new Set(Object.keys(META.counties).map(n=>countyByKey.get(norm(n))).filter(Boolean));
const redo = new Set((META.needs_redownload||[]).map(n=>countyByKey.get(norm(n))));
const missingMsg = id => redo.has(id) ? 'Results file needs to be collected again' : 'County file not collected yet';
// counties where the SOS feed had an error and the county clerk's own report is used instead
const CORRECTIONS = META.corrections || [];
const corrFor = race => CORRECTIONS.filter(c => c.races.includes('*') || c.races.includes(race));
const corrNote = race => { const c=corrFor(race); return c.length ? ` ${c.map(x=>x.county).join(', ')}: corrected from the county clerk’s report (the state feed has an error there).` : ''; };

// ---------- chambers ----------
const CHAMBERS = [
  {id:'us-house', label:'U.S. House', race:'U.S. House', layer:'congress', seats:8, prefix:'CD', long:'Congressional District', holders:'congress', term:''},
  {id:'state-senate', label:'State Senate', race:'State Senate', layer:'senate', seats:34, prefix:'SD', long:'Senate District', holders:'senate', supermaj:23, term:'Odd-numbered districts are not on the ballot until 2028.'},
  {id:'state-house', label:'State House', race:'State House', layer:'house', seats:163, prefix:'HD', long:'House District', holders:'house', supermaj:109},
];
const slug = s => String(s).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');

// ---------- data ----------
function parseCSV(text){
  const rows=[]; let i=0, f='', row=[], q=false;
  while(i<text.length){ const c=text[i];
    if(q){ if(c=='"'){ if(text[i+1]=='"'){f+='"';i++;} else q=false; } else f+=c; }
    else if(c=='"') q=true; else if(c==','){ row.push(f); f=''; }
    else if(c=='\n'||c=='\r'){ if(c=='\r'&&text[i+1]=='\n') i++; row.push(f); rows.push(row); row=[]; f=''; }
    else f+=c; i++; }
  if(f!==''||row.length){ row.push(f); rows.push(row); }
  return rows.filter(r=>r.some(x=>x.trim()!==''));
}
// each CSV row adds one choice's votes to one reporting unit of a race
function csvRows(text, each){
  const rows=parseCSV(text), ix=Object.fromEntries(rows[0].map((h,i)=>[h,i]));
  for(const R of rows.slice(1)) each(k=>(R[ix[k]]||'').trim());
}
function addVotes(rc, type, id, g){
  const uk=type+':'+id;
  if(!rc.units.has(uk)) rc.units.set(uk,{type,id,choices:new Map(),reporting:null});
  const u=rc.units.get(uk), prev=u.choices.get(g('choice'));
  u.choices.set(g('choice'),{choice:g('choice'),party:g('party'),votes:(prev?prev.votes:0)+(+g('votes')||0)});
  if(g('reporting')!=='') u.reporting=+g('reporting');
}
const store = new Map();
csvRows(DATA.results, g=>{
  const race=g('race'), district=g('district'); let type=g('unit'), id=g('unit_id');
  if(type==='county'){ id=countyByKey.get(norm(id)); if(!id){ console.warn('unknown county',g('unit_id')); return; } }
  const key=race+'|'+district;
  if(!store.has(key)) store.set(key,{name:race,district,chamber:district?(CHAMBERS.find(c=>c.race===race)||{}).id:null,units:new Map()});
  addVotes(store.get(key), type, id, g);
});
// judicial races other than the Supreme Court (which is in results.csv): appellate retention, circuit and associate circuit races
const JSTORE = new Map();
csvRows(DATA.judicial, g=>{
  const id=countyByKey.get(norm(g('unit_id'))); if(!id){ console.warn('unknown county',g('unit_id')); return; }
  const race=g('race'); if(!JSTORE.has(race)) JSTORE.set(race,{name:race,group:g('group'),units:new Map()});
  addVotes(JSTORE.get(race), 'county', id, g);
});

// ---------- aggregation ----------
const isMeasure = rc => { for(const u of rc.units.values()){ const k=[...u.choices.keys()].map(s=>s.toLowerCase()); return k.length>0 && k.every(c=>c==='yes'||c==='no'); } return false; };
function mergeChoices(list){
  const m=new Map(), rep=[];
  list.forEach(u=>{ u.choices.forEach(c=>{ const p=m.get(c.choice); m.set(c.choice,{choice:c.choice,party:c.party,votes:(p?p.votes:0)+c.votes}); }); if(u.reporting!=null) rep.push(u.reporting); });
  return {choices:m, reporting: rep.length? Math.min(...rep) : null};
}
function countyResults(rc){
  const out=new Map();
  rc.units.forEach(u=>{ if(u.type!=='county') return; const id=u.id==='KC'?'29095':u.id; (out.get(id)||out.set(id,[]).get(id)).push(u); });
  const res=new Map(); out.forEach((list,id)=>res.set(id,mergeChoices(list))); return res;
}
function raceTotal(rc){
  for(const t of ['state','district']){ const L=[...rc.units.values()].filter(u=>u.type===t); if(L.length) return mergeChoices(L); }
  return mergeChoices([...rc.units.values()].filter(u=>u.type==='county'));
}
function summarize(res){
  if(!res) return null;
  const arr=[...res.choices.values()].filter(c=>c.votes>0||c.party!=='W').sort((a,b)=>b.votes-a.votes);
  const total=arr.reduce((a,c)=>a+c.votes,0);
  arr.forEach(c=>c.pct= total? c.votes/total*100 : 0);
  const lead=arr[0], second=arr[1];
  const margin = lead ? (lead.pct-(second?second.pct:0)) : 0;
  const final = res.reporting===100;
  return {arr,total,lead,second,margin,reporting:res.reporting,uncontested:arr.filter(c=>c.party!=='W').length===1, final, winner: final? lead : null};
}

// ---------- color ----------
let cssCache=new Map();
const css = n => { if(!cssCache.has(n)) cssCache.set(n, getComputedStyle(document.documentElement).getPropertyValue(n).trim()); return cssCache.get(n); };
function famOf(c){ if(!c) return null; const ch=c.choice.toLowerCase(); if(ch==='yes') return 'Y'; if(ch==='no') return 'N'; if(c.party==='R') return 'R'; if(c.party==='D') return 'D'; return 'O'; }
const famP = p => p==='R'?'R':p==='D'?'D':'O';
const BINS=[5,15,30];
function fillFor(s){
  if(!s || !s.total) return css('--nodata');
  if(s.arr.length>1 && s.margin===0) return css('--tie');
  const step = s.uncontested?3 : s.margin<BINS[0]?0 : s.margin<BINS[1]?1 : s.margin<BINS[2]?2 : 3;
  return css(`--${famOf(s.lead)}${step}`);
}
const solid = fam => css(`--${fam}2`);
const deep = fam => css(`--${fam}3`);
const partyName = p => ({R:'Republican',D:'Democratic',L:'Libertarian',G:'Green',C:'Constitution',I:'Independent',W:'Write-in'})[p]||p||'';
const partyShort = p => ({R:'Republicans',D:'Democrats'})[p]||'Other';
const fmt = d3.format(',');
const ico=(n,cls='')=>`<svg class="ico ${cls}" aria-hidden="true"><use href="#i-${n}"/></svg>`;
const esc=t=>String(t??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c]);
const pct = v => v.toFixed(1)+'%';
const RECOUNT = 0.5; // RSMo 115.601: candidates filing with SOS may request a recount if defeated by < 0.5% of votes cast
// small shared bits of markup
const muted = (t, small) => `<span class="muted${small?' sm':''}">${t}</span>`;
const sq = color => `<span class="swatch" style="background:${color}"></span>`;
const badge = (text, fam) => `<span class="badge" style="background:${solid(fam)}">${text}</span>`;
const abbrev = v => v>=1e6 ? (v/1e6).toFixed(1)+'M' : v>=1e4 ? Math.round(v/1e3)+'k' : v>=1e3 ? (v/1e3).toFixed(1)+'k' : String(v);
const detailHead = (kicker, title) => `<div class="dhead"><div><div class="kicker">${kicker}</div><h2>${title}</h2></div><button class="iconbtn sq" id="clearSel" aria-label="Clear selection">${ico('x')}</button></div>`;

// ---------- chamber model ----------
function chamberModel(ch){
  const H = HOLDERS[ch.holders];
  const seats=[];
  for(let d=1; d<=ch.seats; d++){
    const rc = store.get(ch.race+'|'+d);
    const prev = H[d] || {party:'?',name:'Unknown'};
    if(rc){
      const s=summarize(raceTotal(rc));
      const party = s.lead? (s.lead.party==='R'||s.lead.party==='D'? s.lead.party : 'O') : '?';
      seats.push({d, raced:true, party, prev:prev.party, prevName:prev.name, s, flip: party!==prev.party, close: !s.uncontested && s.margin<RECOUNT, tight: !s.uncontested && s.margin<3, final:s.final});
    } else {
      seats.push({d, raced:false, party:prev.party, prev:prev.party, prevName:prev.name, s:null, flip:false});
    }
  }
  const count = p => seats.filter(x=>x.party===p).length;
  const before = p => seats.filter(x=>x.prev===p).length;
  return {seats, R:count('R'), D:count('D'), O:seats.length-count('R')-count('D'), bR:before('R'), bD:before('D'), flips:seats.filter(x=>x.flip), close:seats.filter(x=>x.close), up:seats.filter(x=>x.raced).length};
}

// ---------- state ----------
const state = { view:'statewide', race:null, selected:null, overlay:true, cat:'All', court:'supreme', ocat:'all' };
const raceOrder = n => /auditor/i.test(n)?0 : /amend/i.test(n)?1 : /prop/i.test(n)?2 : 3;
function statewideRaces(){ return [...store.values()].filter(r=>!r.district).sort((a,b)=>raceOrder(a.name)-raceOrder(b.name)||a.name.localeCompare(b.name,undefined,{numeric:true})); }

// ---------- map ----------
const W=900,H=780;
const svg=d3.select('#map').attr('viewBox',`0 0 ${W} ${H}`);
const proj=d3.geoIdentity().reflectY(true).fitExtent([[12,12],[W-12,H-12]], {type:'FeatureCollection',features:LAYERS.counties});
const path=d3.geoPath(proj);
const gZoom=svg.append('g');
const gUnits=gZoom.append('g'), gFlip=gZoom.append('g'), gOverlay=gZoom.append('g'), gOutline=gZoom.append('g'), gLabels=gZoom.append('g'), gCities=gZoom.append('g');
gOverlay.append('path').attr('class','cty-overlay').attr('d',path(countyMesh));
gOutline.append('path').attr('class','state-outline').attr('d',path(stateMesh));
let zk=1;
const zoom=d3.zoom().scaleExtent([1,40]).translateExtent([[-100,-100],[W+100,H+100]]).on('zoom',e=>{
  gZoom.attr('transform',e.transform); zk=e.transform.k; zT=e.transform; updateLabels(); updateCities();
  if(e.sourceEvent) d3.selectAll('#zoomPresets button').attr('aria-pressed',false);   // user panned/zoomed by hand
});
// ---------- city landmarks ----------
const cityData = PLACES.labels.map(([name,x,y,pop,tier])=>({name,pop,tier: tier===3 && pop<20000 ? 4 : tier, p:proj([x,y])}));
let zT=d3.zoomIdentity;
const cityG = gCities.selectAll('g').data(cityData).join('g').attr('class',d=>'city t'+d.tier).attr('transform',d=>`translate(${d.p[0]},${d.p[1]})`);
cityG.append('circle'); cityG.append('text').text(d=>d.name);
function updateCities(){
  const minTier = zk<1.9?1 : zk<4?2 : zk<8?3 : 4, fsz=t=>t===1?12.5:11;
  const placed=[], show=new Map();
  const order=[...cityData].sort((a,b)=>a.tier-b.tier||b.pop-a.pop);
  for(const d of order){
    if(d.tier>minTier) continue;
    const f=fsz(d.tier), w=d.name.length*f*0.56+8, sx=zT.applyX(d.p[0]), sy=zT.applyY(d.p[1]);
    if(sx<-20||sx>W+20||sy<-20||sy>H+20) continue;
    const left = sx+w > W-6;                      // flip label to the left near the right edge
    const box= left? [sx-w,sy-f*0.7,sx+4,sy+f*0.7] : [sx-4,sy-f*0.7,sx+w,sy+f*0.7];
    if(placed.some(b=>!(box[2]<b[0]||box[0]>b[2]||box[3]<b[1]||box[1]>b[3]))) continue;
    placed.push(box); show.set(d,left);
  }
  cityG.style('display',d=>show.has(d)?null:'none');
  cityG.select('circle').attr('r',d=>(d.tier===1?3.2:2.4)/zk).attr('stroke-width',1.2/zk);
  cityG.select('text').attr('x',d=>(show.get(d)?-5:5)/zk).attr('text-anchor',d=>show.get(d)?'end':'start').attr('dy','0.35em').style('font-size',d=>fsz(d.tier)/zk+'px').style('stroke-width',3/zk+'px');
}
updateCities();
function distCenters(layer,id,cls='pc'){
  const D=(PLACES.district[layer]||{})[id]; if(!D) return '';
  const list=D.places.map(([n,p,t,cdp])=>`<b>${n}</b>${p<t*0.97?' (part)':''}${cdp?'*':''} ${abbrev(p)}`).join(' · ');
  const un=D.uninc/D.pop, anyCdp=D.places.some(x=>x[3]);
  let h = list? `Largest places: ${list}` : 'No cities, towns or named communities';
  if(un>=0.4) h+=`<br>${Math.round(un*100)}% live outside incorporated cities`;
  h+=`<br>${muted(`District pop. ${fmt(D.pop)} (2020 Census)${anyCdp?' · *unincorporated community':''}`)}`;
  return `<div class="${cls}">${h}</div>`;
}
function popCenters(id, cls='pc'){
  const L=PLACES.county[id]; if(!L||!L.length) return '';
  return `<div class="${cls}">Largest places: ${L.slice(0,4).map(([n,p,t,multi])=>`<b>${n}</b>${multi?' (part)':''} ${abbrev(p)}`).join(' · ')}</div>`;
}
svg.call(zoom).on('dblclick.zoom',null);
d3.select('#zin').on('click',()=>svg.transition().duration(dur(300)).call(zoom.scaleBy,1.8));
d3.select('#zout').on('click',()=>svg.transition().duration(dur(300)).call(zoom.scaleBy,1/1.8));
const PRESETS=[['Statewide',null],['Kansas City',['29095','29047','29165']],['St. Louis',['29510','29189']],['Columbia',['29019']],['Springfield',['29077']]];
function zoomTo(fc,ms=700,fill=0.85){ const [[x0,y0],[x1,y1]]=path.bounds(fc); const k=Math.min(40,fill/Math.max((x1-x0)/W,(y1-y0)/H)); svg.transition().duration(dur(ms)).call(zoom.transform,d3.zoomIdentity.translate(W/2,H/2).scale(k).translate(-(x0+x1)/2,-(y0+y1)/2)); }
d3.select('#zoomPresets').selectAll('button').data(PRESETS).join('button').text(d=>d[0]).attr('aria-pressed',(d,i)=>i===0).on('click',(e,d)=>{
  d3.selectAll('#zoomPresets button').attr('aria-pressed',x=>x===d);
  if(!d[1]){ svg.transition().duration(dur(600)).call(zoom.transform,d3.zoomIdentity); return; }
  zoomTo({type:'FeatureCollection',features:LAYERS.counties.filter(f=>d[1].includes(f.properties.id))});
});
d3.select('#ctyOverlay').on('change',function(){ state.overlay=this.checked; gOverlay.style('display',this.checked&&state.view!=='statewide'?null:'none'); });

// ---------- tooltip ----------
const tip=d3.select('#tip');
function tipHTML(title,s,foot){
  let h=`<h4>${title}</h4>`;
  if(!s||!s.total) return h+`<div class="muted">${foot||'No results'}</div>`;
  s.arr.slice(0,5).forEach(c=>{ h+=`<div class="row"><i style="background:${solid(famOf(c))}"></i><span>${c.choice}${c.party&&c.party!=='W'?' '+muted(c.party,true):''}</span><span class="p num">${pct(c.pct)}</span><span class="vv num">${fmt(c.votes)}</span></div>`; });
  const f=[]; if(s.reporting!=null) f.push(`${Math.round(s.reporting)}% of precincts`); if(s.uncontested) f.push('Uncontested'); if(foot) f.push(foot);
  return h+(f.length?`<div class="foot">${f.join(' · ')}</div>`:'');
}
function showTip(e,html){ tip.html(html).style('opacity',1); moveTip(e); }
function moveTip(e){ const t=tip.node(); const pad=14; let x=e.clientX+pad, y=e.clientY+pad; const r=t.getBoundingClientRect(); if(x+r.width>innerWidth-8) x=e.clientX-r.width-pad; if(y+r.height>innerHeight-8) y=e.clientY-r.height-pad; tip.style('left',x+'px').style('top',y+'px'); }
const hideTip=()=>tip.style('opacity',0);

// ---------- render ----------
let current = {};
function render(){
  cssCache=new Map(); hideTip();
  if(current.kind && current.kind!==viewKind()) { sortKey='name'; sortDir=1; }
  const views=[{id:'statewide',label:'Statewide'},...CHAMBERS,{id:'courts',label:'Courts'},{id:'county-offices',label:'County offices'},{id:'local-issues',label:'Local issues'}];
  d3.select('#viewTabs').selectAll('button').data(views).join('button').attr('role','tab').attr('aria-selected',d=>d.id===state.view).text(d=>d.label).on('click',(e,d)=>{ state.view=d.id; state.selected=null; syncHash(); render(); });
  if(state.view==='courts' || state.view==='county-offices'){
    current = state.view==='courts' ? courtsState() : officesState();
    d3.select('#chamber').attr('hidden',true);
    d3.select('#ctyToggle').style('visibility','hidden');
    gOverlay.style('display','none');
  } else if(state.view==='local-issues'){
    const cats=['All',...[...new Set(LOCAL.measures.map(m=>m.category))].sort((a,b)=>catOrder(a)-catOrder(b))];
    if(!cats.includes(state.cat)) state.cat='All';
    d3.select('#raceChips').style('display',null).selectAll('button').data(cats,d=>d).join('button').attr('aria-pressed',d=>d===state.cat).text(d=>d==='All'?`All (${LOCAL.measures.length})`:catLabel(d)).on('click',(e,d)=>{ state.cat=d; state.selected=null; render(); });
    const ms=LOCAL.measures.filter(m=>state.cat==='All'||m.category===state.cat);
    const byC=d3.group(ms,m=>m.fips);
    current = { kind:'local', features:LAYERS.counties, layer:'counties', unitWord:'County', ms, byC, sumOf:id=>byC.get(id)||null, nameOf:id=>countyFull(id) };
    d3.select('#chamber').attr('hidden',true);
    d3.select('#ctyToggle').style('visibility','hidden');
    gOverlay.style('display','none');
  } else if(state.view==='statewide'){
    const races=statewideRaces();
    if(!races.find(r=>r.name===state.race)) state.race = races[0].name;
    d3.select('#raceChips').style('display',null).selectAll('button').data(races,d=>d.name).join('button').attr('aria-pressed',d=>d.name===state.race).text(d=>d.name).on('click',(e,d)=>{ state.race=d.name; state.selected=null; syncHash(); render(); });
    const rc = races.find(r=>r.name===state.race);
    const byCounty = countyResults(rc);
    current = { kind:'statewide', features:LAYERS.counties, layer:'counties', rc, unitWord:'County',
      sumOf:id=>summarize(byCounty.get(id)), nameOf:id=>countyFull(id) };
    d3.select('#chamber').attr('hidden',true);
    d3.select('#ctyToggle').style('visibility','hidden');
    gOverlay.style('display','none');
  } else {
    d3.select('#raceChips').style('display','none');
    const ch = CHAMBERS.find(c=>c.id===state.view);
    const model = chamberModel(ch);
    const byD = new Map(model.seats.map(s=>[String(s.d),s]));
    current = { kind:'chamber', features:LAYERS[ch.layer], layer:ch.layer, ch, model, byD, unitWord:'District',
      sumOf:id=>{ const s=byD.get(id); return s&&s.s; }, nameOf:id=>`${ch.long} ${id}` };
    d3.select('#chamber').attr('hidden',null);
    d3.select('#ctyToggle').style('visibility',null);
    gOverlay.style('display',state.overlay?null:'none');
    drawChamber();
  }
  drawMap(); drawLegend(); drawSummary(); drawDetail(); drawTable(); drawStatus();
}

const viewKind=()=> ({statewide:'statewide','local-issues':'local',courts:'courts','county-offices':'offices'})[state.view]||'chamber';
function drawMap(){
  const sums=new Map(current.features.map(f=>[f.properties.id,current.sumOf(f.properties.id)]));
  current.sums=sums;
  gUnits.selectAll('path.unit').data(current.features,d=>d.properties.name).join('path').attr('class','unit').attr('d',path)
    .attr('fill',d=>{ const id=d.properties.id, s=sums.get(id);
      if(current.kind==='local') return localFill(s);
      if(current.kind==='offices') return officeFill(id);
      if(current.kind==='courts' && !s) return css('--notup');
      if(current.kind==='chamber' && !s) return css('--notup');
      if(current.kind==='statewide' && !s) return css('--nodata');
      return fillFor(s); })
    .classed('sel',d=>d.properties.id===state.selected)
    .on('mouseenter',function(e,d){ d3.select(this).raise().classed('hl',true); gUnits.selectAll('.sel').raise(); showTip(e, unitTip(d.properties.id)); highlightRow(d.properties.id,true); })
    .on('mousemove',moveTip)
    .on('mouseleave',function(e,d){ d3.select(this).classed('hl',false); hideTip(); highlightRow(d.properties.id,false); })
    .on('click',(e,d)=>select(d.properties.id));
  gUnits.selectAll('.sel').raise();
  const flips = current.kind==='chamber' ? current.features.filter(f=>{ const s=current.byD.get(f.properties.id); return s&&s.flip; }) : [];
  gFlip.selectAll('path').data(flips,d=>d.properties.name).join('path').attr('class','flipov').attr('d',path);
  const lab = current.kind==='chamber'? current.features : [];
  gLabels.selectAll('text').data(lab,d=>d.properties.name).join('text').attr('class','lbl')
    .attr('transform',d=>{ const c=labelPoint(d); return `translate(${c[0]},${c[1]})`; }).text(d=>d.properties.id);
  updateLabels();
}
function unitTip(id){
  if(current.kind==='local') return localTip(id);
  if(current.kind==='courts') return courtsTip(id);
  if(current.kind==='offices') return officesTip(id);
  if(current.kind==='statewide'){
    const s=current.sums.get(id);
    return tipHTML(current.nameOf(id), s, s? (id==='29095'?'Includes Kansas City’s Jackson County part':null) : (haveCounty.has(id)?'No results':missingMsg(id))) + popCenters(id);
  }
  const seat=current.byD.get(id);
  if(!seat) return `<h4>${current.nameOf(id)}</h4>`;
  if(!seat.raced) return `<h4>${current.nameOf(id)}</h4><div>${seat.prevName} ${muted(`(${seat.prev})`)}</div><div class="foot">Not on the ballot this year</div>`+distCenters(current.layer,id);
  const notes=[]; if(seat.flip) notes.push(`<b>Flip</b> ${seat.prev} to ${seat.party}`); if(seat.close) notes.push('<b>Recount range</b>'); else if(seat.tight) notes.push('Under 3 pts');
  return tipHTML(current.nameOf(id), seat.s, notes.join(' · ')||`Held by ${seat.prev}`)+distCenters(current.layer,id);
}
// label anchor = centroid of the largest polygon part; width is cached so zooming doesn't re-measure every district
const lpCache=new Map();
function labelGeom(f){
  const k=f.properties.name; if(lpCache.has(k)) return lpCache.get(k);
  const g=f.geometry; let best=null, ba=-1;
  (g.type==='MultiPolygon'? g.coordinates : [g.coordinates]).forEach(p=>{ const ft={type:'Polygon',coordinates:p}; const a=path.area(ft); if(a>ba){ba=a;best=ft;} });
  const b=path.bounds(f), v={c:path.centroid(best), w:b[1][0]-b[0][0]}; lpCache.set(k,v); return v;
}
const labelPoint = f => labelGeom(f).c;
function updateLabels(){
  const base = current.layer==='congress'?18: current.layer==='senate'?12: 9;
  const minK = current.layer==='house'?3.2 : 1;
  gLabels.selectAll('text').style('font-size',(base/Math.pow(zk,0.8))+'px').style('stroke-width',(3/zk)+'px')
    .style('display', d => zk<minK ? 'none' : current.layer!=='house' || labelGeom(d).w*zk>22 ? null : 'none');
}

function drawLegend(){
  const L=d3.select('#legend'); L.html('');
  if(current.kind==='local') return localLegend(L);
  if(current.kind==='offices') return officesLegend(L);
  const fams=new Set(); current.sums.forEach(s=>{ if(s&&s.lead) fams.add(famOf(s.lead)); });
  const names={R:'Republican',D:'Democratic',O:'Other',Y:'Yes',N:'No'};
  L.append('span').style('font-weight','600').text(current.kind==='courts'&&current.court.id==='trial'?'Yes share across judges, or winner:':'Leader, by margin:');
  ['R','D','O','Y','N'].filter(f=>fams.has(f)).forEach(f=>{ const r=L.append('span').attr('class','ramp'); r.append('span').text(names[f]); const sw=r.append('span').attr('class','sw'); [0,1,2,3].forEach(i=>sw.append('i').style('background',css(`--${f}${i}`))); });
  L.append('span').style('color','var(--muted)').text('<5 · 5–15 · 15–30 · 30+ pts');
  if(current.kind==='chamber'){
    if(current.model.flips.length){ const n=L.append('span'); n.append('svg').attr('width',16).attr('height',12).style('vertical-align','-2px').style('margin-right','4px').html(`<rect width="16" height="12" rx="3" fill="${solid('D')}"/><rect width="16" height="12" rx="3" fill="url(#hatch)"/>`); n.append('span').text('Flipped'); }
    if(current.model.up<current.ch.seats){ const n=L.append('span'); n.append('span').attr('class','k').style('background',css('--notup')); n.append('span').text('Not on the ballot'); }
  } else if(current.kind==='courts'){
    if([...current.sums.values()].some(s=>!s)){ const n=L.append('span'); n.append('span').attr('class','k').style('background',css('--notup')); n.append('span').text(current.court.id==='trial'?'No circuit-court race in the state’s count':'Not in this district'); }
  } else if([...current.sums.values()].some(s=>!s)){ const n=L.append('span'); n.append('span').attr('class','k').style('background',css('--nodata')); n.append('span').text(redo.size?'County file being re-collected':'County file not collected yet'); }
}

// ---------- hemicycle ----------
function hemiLayout(n){
  const rows = n<=10?1 : n<=40?4 : 8;
  const r0 = rows===1? 1 : 0.42;
  const radii = d3.range(rows).map(i=> rows===1?1 : r0 + (1-r0)*i/(rows-1));
  const sumR = d3.sum(radii);
  let counts = radii.map(r=>Math.round(n*r/sumR));
  let diff = n - d3.sum(counts); let i=rows-1; while(diff!==0){ counts[i]+=Math.sign(diff); diff-=Math.sign(diff); i=(i-1+rows)%rows; }
  const pts=[];
  radii.forEach((r,ri)=>{ const c=counts[ri]; for(let k=0;k<c;k++){ const a = c===1? Math.PI/2 : Math.PI - Math.PI*k/(c-1); pts.push({r,a,row:ri}); } });
  pts.sort((p,q)=> q.a-p.a || q.r-p.r );
  const spacing = rows===1? Math.PI/(n) : Math.min((1-r0)/(rows-1), Math.PI*radii[rows-1]/(counts[rows-1]-1));
  return {pts, dot: spacing*0.42, r0};
}
function seatOrder(model){
  const S=model.seats;
  const grp=(p,f)=>S.filter(f).filter(x=>x.party===p).sort((a,b)=>a.d-b.d);
  const D=[...grp('D',x=>!x.raced), ...grp('D',x=>x.raced&&!x.flip), ...grp('D',x=>x.flip)];
  const O=S.filter(x=>x.party!=='D'&&x.party!=='R');
  const R=[...grp('R',x=>x.flip), ...grp('R',x=>x.raced&&!x.flip), ...grp('R',x=>!x.raced)];
  return [...D,...O,...R];
}
function drawChamber(){
  const {ch, model} = current;
  const hs=d3.select('#hemi'); hs.selectAll('*').remove();
  const N=ch.seats, maj=Math.floor(N/2)+1;
  const lay=hemiLayout(N), order=seatOrder(model);
  const rows=d3.max(lay.pts,p=>p.row)+1;
  const rowR=d3.range(rows).map(i=>lay.pts.find(p=>p.row===i).r);
  const step = rows>1? (rowR[1]-rowR[0]) : 0.22;              // radial depth of one tier
  const rise = rows>1? 0.065 : 0;                              // tier height
  const ballR = Math.min(lay.dot, step*0.42, rows===1?0.075:1);
  const zOf = i => i*rise;
  // camera: in front of the open side, raised, looking down at the chamber
  const camD=1.55, camH=1.25, phi=0.62;
  const cosP=Math.cos(phi), sinP=Math.sin(phi);
  const P3=(X,Y,Z)=>{ const y=Y+camD, z=Z-camH; const depth=y*cosP - z*sinP, up=y*sinP + z*cosP; return [X/depth, -up/depth, depth]; };
  const polar=(a,r,z)=>P3(Math.cos(a)*r, Math.sin(a)*r, z);
  // gather geometry in projected space, then fit to the viewBox
  const A=d3.range(0,49).map(i=>Math.PI*i/48);
  const inner0 = rowR[0]-step/2, outerN = rowR[rows-1]+step/2;
  const shapes=[];
  // pit floor
  shapes.push({cls:'floor', pts:[...A.map(a=>polar(a,inner0,0)), polar(0,0,0)]});
  for(let i=rows-1;i>=0;i--){
    const ri=rowR[i]-step/2, ro=rowR[i]+step/2, z=zOf(i);
    shapes.push({cls:'top'+(i%2), pts:[...A.map(a=>polar(a,ro,z)), ...A.slice().reverse().map(a=>polar(a,ri,z))]});
    if(i>0) shapes.push({cls:'riser', pts:[...A.map(a=>polar(a,ri,z)), ...A.slice().reverse().map(a=>polar(a,ri,zOf(i-1)))]});
    else shapes.push({cls:'riser', pts:[...A.map(a=>polar(a,ri,z)), ...A.slice().reverse().map(a=>polar(a,ri,-0.04))]});
  }
  // front lip of the outer tiers (the cut faces at the open side)
  const seats = order.map((seat,i)=>{ const p=lay.pts[i]; const z=zOf(p.row);
    const c=polar(p.a,p.r,z+ballR), base=polar(p.a,p.r,z), edge=P3(Math.cos(p.a)*p.r+ballR, Math.sin(p.a)*p.r, z+ballR);
    return {seat, c, base, rad:Math.hypot(edge[0]-c[0],edge[1]-c[1]), depth:c[2]}; });
  const all=[...shapes.flatMap(s=>s.pts), ...seats.map(s=>s.c)];
  const x0=d3.min(all,p=>p[0]), x1=d3.max(all,p=>p[0]), y0=d3.min(all,p=>p[1]), y1=d3.max(all,p=>p[1]);
  const VW=640, padT=34, padB=rows===1?60:64, sc=(VW-40)/(x1-x0), VH=Math.round((y1-y0)*sc+padT+padB);
  hs.attr('viewBox',`0 0 ${VW} ${VH}`);
  const S=p=>[20+(p[0]-x0)*sc, padT+(p[1]-y0)*sc];
  const line=d3.line();
  const defs=hs.append('defs');
  ['D','R','O'].forEach(f=>{ const g=defs.append('radialGradient').attr('id','ball'+f).attr('cx','36%').attr('cy','30%').attr('r','72%');
    g.append('stop').attr('offset','0%').attr('stop-color','#fff').attr('stop-opacity',isDark()?.35:.6);
    g.append('stop').attr('offset','30%').attr('stop-color',solid(f));
    g.append('stop').attr('offset','100%').attr('stop-color',deep(f)); });
  const shadow=defs.append('radialGradient').attr('id','ballShadow'); shadow.append('stop').attr('offset','0%').attr('stop-color','#000').attr('stop-opacity',isDark()?.55:.28); shadow.append('stop').attr('offset','100%').attr('stop-color','#000').attr('stop-opacity',0);
  const shade={floor:css('--tier-floor'), top0:css('--tier-a'), top1:css('--tier-b'), riser:css('--tier-riser')};
  const gT=hs.append('g');
  shapes.forEach(sh=>gT.append('path').attr('d',line(sh.pts.map(S))+'Z').attr('fill',shade[sh.cls]).attr('stroke',shade[sh.cls]).attr('stroke-width',.6));
  // seats, far to near
  const gS=hs.append('g');
  seats.sort((p,q)=>q.depth-p.depth).forEach(({seat,c,base,rad})=>{
    const [x,y]=S(c), [bx,by]=S(base), r=rad*sc, f=famP(seat.party);
    const g=gS.append('g').attr('class','seat').attr('data-d',seat.d).style('opacity',seat.raced?1:.38).datum(seat);
    g.append('ellipse').attr('cx',bx+r*.2).attr('cy',by).attr('rx',r*1.15).attr('ry',r*.42).attr('fill','url(#ballShadow)');
    g.append('circle').attr('class','ball').attr('cx',x).attr('cy',y).attr('r',r).attr('fill',`url(#ball${f})`);
    if(seat.flip) g.append('circle').attr('cx',x).attr('cy',y).attr('r',r+Math.max(1.6,r*.22)).attr('fill','none').attr('stroke',css('--fg')).attr('stroke-width',1.5);
  });
  gS.selectAll('.seat').on('mouseenter',(e,s)=>{ showTip(e, unitTip(String(s.d))); highlightRow(String(s.d),true); gUnits.selectAll('path.unit').filter(f=>f.properties.id===String(s.d)).classed('hl',true).raise(); })
    .on('mousemove',moveTip).on('mouseleave',(e,s)=>{ hideTip(); highlightRow(String(s.d),false); gUnits.selectAll('path.unit').classed('hl',false); })
    .on('click',(e,s)=>select(String(s.d)));
  // control lines: radial lines running up the tiers
  const radial=(a,cls,label)=>{
    const pts=[[inner0-0.02,-0.0], ...rowR.map((r,i)=>[r,zOf(i)+ballR*2.05]), [outerN+0.05, zOf(rows-1)+ballR*2.05]];
    hs.append('path').attr('class','hemi-mark '+cls).attr('fill','none').attr('d',line(pts.map(([r,z])=>S(polar(a,r,z)))));
    const t=S(polar(a,outerN+0.13,zOf(rows-1)+ballR*2));
    if(label) hs.append('text').attr('class','hemi-lbl').attr('x',t[0]).attr('y',t[1]).text(label);
  };
  const boundary=k=> k<=0? Math.PI : k>=N? 0 : (lay.pts[k-1].a+lay.pts[k].a)/2;
  if(ch.supermaj){ radial(boundary(ch.supermaj),'','2/3 D'); radial(boundary(N-ch.supermaj),'','2/3 R'); }
  radial(Math.PI/2,'maj',`Majority · ${maj}`);
  // seat totals at the front of the floor
  const fc=S(P3(0,-0.02,0));
  hs.append('text').attr('class','hemi-big').attr('x',fc[0]-10).attr('y',fc[1]+38).attr('text-anchor','end').attr('font-size',N>40?40:32).attr('fill',solid('D')).text(model.D);
  hs.append('text').attr('class','hemi-big').attr('x',fc[0]+10).attr('y',fc[1]+38).attr('text-anchor','start').attr('font-size',N>40?40:32).attr('fill',solid('R')).text(model.R);
  hs.append('text').attr('class','hemi-lbl').attr('x',fc[0]).attr('y',fc[1]+56).text(`${N} seats`);
  updateSeatSel();
  // legend
  const L=d3.select('#hemiLegend'); L.html('');
  const add=(html)=>L.append('span').html(html);
  add(`<span class="b" style="background:${solid('D')}"></span>Democratic`);
  add(`<span class="b" style="background:${solid('R')}"></span>Republican`);
  if(model.flips.length) add(`<span class="b" style="background:transparent;border:1.6px solid var(--fg)"></span>Flipped`);
  if(model.up<N) add(`<span class="b" style="background:${solid('R')};opacity:.38"></span>Not up (current holder)`);
  if(ch.supermaj) add(`<span style="display:inline-block;width:14px;border-top:1.5px dashed var(--fg);vertical-align:3px;margin-right:4px"></span>Two-thirds line (${ch.supermaj})`);

  // stats
  const ST=d3.select('#chamberStats');
  const dD=model.D-model.bD, dR=model.R-model.bR, sg=v=>v>0?'+'+v:v<0?'−'+(-v):'±0';
  let verdict='';
  if(ch.supermaj){
    const sm=ch.supermaj, hadR=model.bR>=sm, hasR=model.R>=sm, hasD=model.D>=sm;
    if(hasR) verdict=`<strong>Republicans ${hadR?'keep':'win'} a two-thirds supermajority</strong>${model.R} seats, ${model.R-sm} more than the ${sm} needed.`;
    else if(hasD) verdict=`<strong>Democrats win a two-thirds supermajority</strong>${model.D} of ${sm} needed.`;
    else verdict=`<strong>${hadR?'Republicans lose their two-thirds supermajority':'No party has a two-thirds supermajority'}</strong>Republicans hold ${model.R}, ${sm-model.R} short of the ${sm} needed. Democrats hold ${model.D}, so ${model.D>=N-sm+1?`<b>Democrats can block</b> veto overrides and other votes that need two-thirds`:`${N-sm+1-model.D} short of being able to block a two-thirds vote on their own`}.`;
    verdict+=`<div style="font-size:12px;color:var(--text-soft);margin-top:6px">Two-thirds of each chamber is needed to override a governor’s veto. Before the election: R ${model.bR}, D ${model.bD}${hadR?' (R supermajority)':''}.</div>`;
  } else {
    verdict=`<strong>${model.R>model.D?'Republicans':'Democrats'} hold ${Math.max(model.R,model.D)} of ${N} Missouri seats</strong>Before the election: R ${model.bR}, D ${model.bD}.`;
  }
  const meterPct = v=>v/N*100;
  ST.html(`<div class="kicker">${model.up} of ${N} seats on the ballot · unofficial</div><h2>${ch.label}</h2>
    <div class="split">
      <div class="side"><b class="num" style="color:${solid('D')}">${model.D}</b><span>Democrats <span class="chg num">${sg(dD)}</span></span></div>
      <div class="side"><b class="num" style="color:${solid('R')}">${model.R}</b><span>Republicans <span class="chg num">${sg(dR)}</span></span></div>
      ${model.O?`<div class="side"><b class="num">${model.O}</b><span>Other</span></div>`:''}
    </div>
    ${ch.supermaj?`<div class="meter" aria-hidden="true"><i style="left:0;width:${meterPct(model.D)}%;background:${solid('D')}"></i><i style="right:0;width:${meterPct(model.R)}%;background:${solid('R')}"></i>
      <span class="tick dash" style="left:${meterPct(N-ch.supermaj)}%"></span><span class="tlbl" style="left:${meterPct(N-ch.supermaj)}%">R two-thirds</span>
      <span class="tick" style="left:50%"></span>
      <span class="tick dash" style="left:${meterPct(ch.supermaj)}%"></span><span class="tlbl" style="left:${meterPct(ch.supermaj)}%">D two-thirds</span></div>`:''}
    <div class="verdict">${verdict}</div>
    ${model.flips.length?`<div class="kicker" style="margin-top:12px">${model.flips.length} flip${model.flips.length>1?'s':''}</div><div class="fliplist">${model.flips.map(f=>`<button data-d="${f.d}" style="color:${deep(famP(f.party))}">${ch.prefix} ${f.d} · ${f.prev} to ${f.party}</button>`).join('')}</div>`:''}
    ${model.close.length?`<div class="kicker" style="margin-top:12px;color:var(--accent-pink)">Within recount range (&lt;0.5 pt)</div><div class="fliplist">${model.close.map(f=>`<button data-d="${f.d}">${ch.prefix} ${f.d} · ${f.s.margin.toFixed(2)} pts</button>`).join('')}</div>`:''}
    ${ch.term?`<p class="before" style="margin-top:12px">${ch.term}</p>`:''}`);
  ST.selectAll('.fliplist button').on('click',function(){ const d=this.dataset.d; select(d,true); const f=current.features.find(f=>f.properties.id===d); if(f && current.layer!=='congress') zoomTo(f.geometry? {type:'FeatureCollection',features:[f]}:f, 800, 0.3); });
}
function updateSeatSel(){ d3.selectAll('#hemi .seat').classed('sel',s=>String(s.d)===state.selected); }

// ---------- side panels ----------
function aboutHTML(name){
  const a=ABOUT[name]; if(!a) return '';
  let h=`<div class="about">${a.text}`;
  if(a.yes) h+=`<dl><dt style="background:${css('--Y0')};color:${css('--Y3')}">YES</dt><dd>${a.yes}</dd><dt style="background:${css('--N0')};color:${css('--N3')}">NO</dt><dd>${a.no}</dd></dl>`;
  if(a.note) h+=`<div style="margin-top:8px"><b>Note:</b> ${a.note}</div>`;
  if(a.yes) h+=`<div class="src">Summary paraphrased from the official ballot language.</div>`;
  return h+'</div>';
}
function candRows(s, opts={}){
  if(!s||!s.total) return `<div class="detail-empty">No votes reported.</div>`;
  return s.arr.map(c=>`
    <div class="cand">
      <div class="nm">${s.winner===c && !opts.noCheck?`<span class="check" title="Ahead with all precincts reported (unofficial)">${ico('check')}</span>`:''}${c.choice}${opts.inc&&opts.inc(c)?'<span class="inc">INCUMBENT</span>':''}${c.party&&c.party!=='W'?`<span class="pty">${partyName(c.party)}</span>`:''}</div>
      <div class="pct num">${pct(c.pct)}</div>
      <div></div><div class="v num">${fmt(c.votes)} votes</div>
      <div class="bar"><i style="width:${c.pct}%;background:${solid(famOf(c))}"></i></div>
    </div>`).join('') + (s.reporting!=null?`<div class="reporting">${s.reporting===100?'All precincts reported':Math.round(s.reporting)+'% of precincts reported'}<div class="track"><i style="width:${s.reporting}%"></i></div></div>`:'');
}
const lastName = n => String(n).replace(/\(.*?\)/g,'').replace(/,?\s+(Jr\.?|Sr\.?|II|III|IV)$/i,'').trim().split(/\s+/).pop().toLowerCase();
const firstName = n => String(n).trim().split(/\s+/)[0].toLowerCase();
// incumbent = same first AND last name as the pre-election holder (avoids e.g. two different Murphys)
const isIncumbent = (cand, holder) => !/^vacant/i.test(holder) && lastName(cand)===lastName(holder) && firstName(cand)===firstName(holder);
function drawSummary(){
  const el=d3.select('#summary');
  if(current.kind==='local') return localSummary(el);
  if(current.kind==='courts') return courtsSummary(el);
  if(current.kind==='offices') return officesSummary(el);
  if(current.kind==='statewide'){
    const rc=current.rc, tot=summarize(raceTotal(rc)), meas=isMeasure(rc);
    let line='';
    if(meas){ const y=tot.arr.find(c=>c.choice.toLowerCase()==='yes'); if(y){ const pass=y.pct>50, done=tot.final;
      const word = /retention/i.test(rc.name) ? (pass?(done?'Retained':'Leading to retain'):(done?'Not retained':'Trailing')) : done?(pass?'Passed':'Failed'):(pass?'Passing':'Failing');
      line=`<div class="result-line" style="color:${deep(pass?'Y':'N')}">${word}: Yes ${pct(y.pct)}</div>`; } }
    const counted=[...current.sums.values()].filter(Boolean).length; const redoTxt=redo.size?` ${[...redo].map(id=>countyName[id]).join(', ')} are being re-collected.`:'';
    el.html(`<div class="kicker">${(ABOUT[rc.name]||{}).kicker||'Statewide'}</div><h2>${rc.name==='Supreme Court Retention'?'Supreme Court: Paul C. Wilson':rc.name}</h2>
      ${line}${aboutHTML(rc.name)}${candRows(tot,{inc:c=>rc.name==='State Auditor'&&/fitzpatrick/i.test(c.choice)})}
      <div class="reporting">County map: ${counted} of 115 counties.${redoTxt} The statewide totals above are complete.${corrNote(rc.name)}</div>`);
  } else {
    const {model,ch}=current;
    const tight=model.seats.filter(s=>s.tight).sort((a,b)=>a.s.margin-b.s.margin);
    const raced=model.seats.filter(s=>s.raced);
    const has=(s,p)=>s.s.arr.some(c=>c.party===p);
    const contested=raced.filter(s=>has(s,'D')&&has(s,'R'));
    const vD=d3.sum(contested,s=>s.s.arr.filter(c=>c.party==='D').reduce((a,c)=>a+c.votes,0));
    const vR=d3.sum(contested,s=>s.s.arr.filter(c=>c.party==='R').reduce((a,c)=>a+c.votes,0));
    const onlyD=raced.filter(s=>has(s,'D')&&!has(s,'R')).length, onlyR=raced.filter(s=>has(s,'R')&&!has(s,'D')).length;
    const tp=vD+vR, pD=vD/tp*100, pR=vR/tp*100;
      el.html(`<div class="kicker">${ch.label} · all ${model.up} races</div><h2>Closest races</h2>
      <p class="sub">Margins under 3 points, from the statewide count.</p>
      ${tight.length? `<table class="minitable">${tight.map(s=>`<tr data-d="${s.d}" style="cursor:pointer"><td>${ch.prefix} ${s.d}${s.flip?' '+badge('flip',famP(s.party)):''}${s.close?' <span class="badge close">recount range</span>':''}</td><td>${s.s.lead.choice} (${s.s.lead.party})</td><td class="r num">+${s.s.margin.toFixed(2)}</td></tr>`).join('')}</table>` : '<div class="detail-empty">None.</div>'}
      <div class="kicker" style="margin-top:16px">Two-party vote · ${contested.length} D-vs-R race${contested.length===1?'':'s'}</div>
      <div style="display:flex;height:10px;border-radius:5px;overflow:hidden;gap:2px;margin:8px 0 6px"><i style="width:${pD}%;background:${solid('D')}"></i><i style="width:${pR}%;background:${solid('R')}"></i></div>
      <table class="minitable">
        <tr><td>${sq(solid('D'))}Democratic</td><td class="r num">${fmt(vD)}</td><td class="r num"><b>${pct(pD)}</b></td></tr>
        <tr><td>${sq(solid('R'))}Republican</td><td class="r num">${fmt(vR)}</td><td class="r num"><b>${pct(pR)}</b></td></tr>
      </table>
      <p class="sub" style="margin-top:8px">${onlyD||onlyR?`Not counted: ${[onlyD?`${onlyD} race${onlyD===1?'':'s'} with no Republican on the ballot`:'',onlyR?`${onlyR} with no Democrat`:''].filter(Boolean).join(' and ')}. Including races without both parties would skew the totals. `:''}Third-party votes are left out of the two-party share.</p>`);
    el.selectAll('tr[data-d]').on('click',function(){ select(this.dataset.d,true); });
  }
}
function drawDetail(){
  const el=d3.select('#detail'), id=state.selected;
  if(current.kind==='local') return localDetail(el,id);
  if(current.kind==='courts') return courtsDetail(el,id);
  if(current.kind==='offices') return officesDetail(el,id);
  if(!id){ el.html(`<div class="kicker">Details</div><p class="detail-empty" style="margin:6px 0 0">Hover over the map${current.kind==='chamber'?' or a seat':''} for a quick look. Click to pin results here.</p>`); return; }
  if(current.kind==='statewide'){
    const s=current.sums.get(id);
    const fix=corrFor(current.rc.name).find(c=>countyByKey.get(norm(c.county))===id);
    el.html(`${detailHead(current.rc.name, countyFull(id))}
      ${s? candRows(s,{noCheck:true}) : `<div class="detail-empty">${haveCounty.has(id)?'No results for this race here.':missingMsg(id)+'. The statewide totals already include it.'}</div>`}
      ${fix?`<div class="reporting" style="color:var(--accent-pink)">${esc(fix.note)}</div>`:''}
      ${id==='29095'&&s? kcBreakdown(current.rc) : ''}${popCenters(id,'reporting')}`);
  } else {
    const seat=current.byD.get(id), ch=current.ch;
    let h=detailHead(ch.label, `${ch.long} ${id}`);
    if(!seat.raced){ h+=`<p class="sub">Not on the ballot in 2026.</p><div class="cand"><div class="nm">${seat.prevName}<span class="pty">${partyName(seat.prev)}</span></div><div></div></div>`; }
    else{
      const tags=[]; if(seat.flip) tags.push(badge(`${seat.prev} to ${seat.party} flip`, famP(seat.party))); if(seat.close) tags.push('<span class="badge close">Recount range</span>');
      h+=`<p class="sub">Previously held by ${seat.prevName.startsWith('Vacant')?seat.prevName.replace('Vacant','vacant, last held by').replace(/[()]/g,''):seat.prevName} (${seat.prev})</p>${tags.length?`<div class="tags">${tags.join('')}</div>`:''}`;
      h+=candRows(seat.s,{inc:c=>isIncumbent(c.choice, seat.prevName)});
      if(seat.close) h+=`<div class="reporting" style="color:var(--accent-pink)">The margin is under 0.5% of votes cast, so the trailing candidate can ask for a recount after the results are certified (RSMo § 115.601).</div>`;
      const rc=store.get(ch.race+'|'+id), cr=countyResults(rc);
      const fixed=new Set(corrFor(ch.race).map(c=>countyByKey.get(norm(c.county))));
      if(cr.size) h+=`<div class="kicker" style="margin-top:14px">By county</div><table class="minitable">${[...cr].map(([cid,res])=>{const ss=summarize(res);return `<tr><td>${countyFull(cid)}${cid==='29095'&&rc.units.has('county:KC')?' '+muted('(incl. KC board)',true):''}${fixed.has(cid)?' '+muted('(county clerk count)',true):''}</td><td class="r num">${ss.lead?`${lastName(ss.lead.choice).replace(/^./,m=>m.toUpperCase())} +${ss.margin.toFixed(1)}`:'—'}</td><td class="r num muted">${fmt(ss.total)}</td></tr>`;}).join('')}</table>`;
    }
    h+=distCenters(current.layer,id,'reporting');
    el.html(h);
  }
  d3.select('#clearSel').on('click',()=>select(null));
}

function kcBreakdown(rc){
  const part=(uid,label)=>{ const u=rc.units.get('county:'+uid); if(!u) return ''; const ss=summarize(mergeChoices([u])); return `<tr><td>${label}</td><td class="r num">${ss.lead.choice} +${ss.margin.toFixed(1)}</td><td class="r num" style="color:var(--muted)">${fmt(ss.total)}</td></tr>`; };
  return `<div class="kicker" style="margin-top:14px">How Jackson County reports</div>
    <table class="minitable">${part('29095','Jackson County Election Board (outside KC)')}${part('KC','Kansas City Election Board')}</table>
    <div class="reporting">Kansas City has its own election board, but it only counts KC voters who live in Jackson County. The Jackson County total above adds both boards. KC voters in Clay, Platte and Cass counties are counted in those counties’ results, so the map has no separate Kansas City total.</div>`;
}
// ---------- local ballot issues ----------
const CAT={'sales tax':'Sales tax','property tax':'Property tax','bond':'Bonds','use tax':'Use tax','marijuana tax':'Marijuana tax','charter/governance':'Charter & governance','other':'Other'};
const catLabel=c=>CAT[c]||c; const catOrder=c=>{const i=Object.keys(CAT).indexOf(c); return i<0?99:i;};
LOCAL.measures.forEach(m=>{ m.fips=countyByKey.get(norm(m.county))||null; if(m.fips==='KC') m.fips='29095'; });
const host=u=>{ try{ return new URL(u).hostname.replace(/^www\./,''); }catch(e){ return 'source'; } };
const resWord=r=>r==='passed'?'Passed':r==='failed'?'Failed':'No result yet';
const NOTFOUND=new Set((LOCAL.no_measures||[]).map(n=>countyByKey.get(norm(n))).filter(Boolean));
const UNCHECKED=new Map((LOCAL.unchecked||[]).map(u=>[countyByKey.get(norm(u.county)),u.why]).filter(x=>x[0]));
function localFill(list){
  if(!list||!list.length) return css('--nodata');
  const n=list.length; const step=n>=8?3:n>=4?2:n>=2?1:0; return css(`--O${step}`);
}
function yesPct(m){ if(m.yes_pct!=null) return +m.yes_pct; if(m.yes_votes!=null&&m.no_votes!=null&&(m.yes_votes+m.no_votes)>0) return m.yes_votes/(m.yes_votes+m.no_votes)*100; return null; }
// pass line for the yes bar; null when the threshold isn't known
function thresholdPct(t){
  t=String(t||'');
  if(/^(unknown|not stated)/i.test(t)) return null;
  if(/4\/7/.test(t)) return 57.14;
  if(/2\/3|two-thirds/i.test(t)) return 66.67;
  const m=t.match(/^(\d+(?:\.\d+)?)%/); if(m) return +m[1];
  return 50;
}
// what we know about a county with no measures in the current filter
function noMeasuresText(id){
  if(state.cat!=='All') return 'No local measures in this category';
  if(UNCHECKED.has(id)) return 'Not fully checked: '+esc(UNCHECKED.get(id));
  if(NOTFOUND.has(id)) return 'Checked: no local measures found';
  return 'No local measures found (not every county source was available)';
}
function localTip(id){
  const L=current.sums.get(id);
  let h=`<h4>${countyFull(id)}</h4>`;
  if(!L||!L.length) return h+`<div class="muted">${noMeasuresText(id)}</div>`+popCenters(id);
  L.slice(0,7).forEach(m=>{ const y=yesPct(m); h+=`<div style="display:flex;gap:6px;align-items:baseline;padding:2px 0"><span class="res ${m.result}" style="font-size:9px">${m.result==='unknown'?'?':ico(m.result==='passed'?'check':'x')}</span><span><b>${esc(m.jurisdiction)}</b> ${esc(m.measure)} <span style="color:var(--muted)">· ${esc(catLabel(m.category))}${y!=null?` · ${y.toFixed(0)}% yes`:''}</span></span></div>`; });
  if(L.length>7) h+=`<div class="foot">+${L.length-7} more · click for all</div>`;
  return h+popCenters(id);
}
function localLegend(L){
  L.append('span').style('font-weight','600').text('Local measures found:');
  const r=L.append('span').attr('class','ramp'); const sw=r.append('span').attr('class','sw'); [0,1,2,3].forEach(i=>sw.append('i').style('background',css(`--O${i}`)));
  L.append('span').style('color','var(--muted)').text('1 · 2–3 · 4–7 · 8+');
  const n=L.append('span'); n.append('span').attr('class','k').style('background',css('--nodata')); n.append('span').text('None found');
}
function localSummary(el){
  const ms=current.ms, n=ms.length, cty=new Set(ms.map(m=>m.fips)).size;
  const by=r=>ms.filter(m=>m.result===r).length;
  const cats=d3.rollups(ms,v=>({n:v.length,p:v.filter(m=>m.result==='passed').length,f:v.filter(m=>m.result==='failed').length}),m=>m.category).sort((a,b)=>b[1].n-a[1].n);
  const jt=d3.rollups(ms,v=>v.length,m=>m.jurisdiction_type).sort((a,b)=>b[1]-a[1]);
  el.html(`<div class="kicker">Local ballot measures · Nov 3, 2026</div><h2>${state.cat==='All'?'All local measures':catLabel(state.cat)}</h2>
    <p class="sub">${n} measure${n===1?'':'s'} in ${cty} count${cty===1?'y':'ies'}. Gathered from county clerks, election boards and local news.</p>
    <div class="split" style="gap:18px;margin:4px 0 10px">
      <div class="side"><b class="num" style="font-size:30px;color:${css('--Y3')}">${by('passed')}</b><span>passed</span></div>
      <div class="side"><b class="num" style="font-size:30px;color:${css('--N3')}">${by('failed')}</b><span>failed</span></div>
      <div class="side"><b class="num" style="font-size:30px;color:var(--muted)">${by('unknown')}</b><span>no result yet</span></div>
    </div>
    ${state.cat==='All'?`<div class="kicker" style="margin-top:8px">By type</div><div class="catbar">${cats.map(([c,v])=>`<span>${esc(catLabel(c))}</span><span class="num" style="color:var(--text-soft)">${v.n}${v.p||v.f?` <span style="color:var(--muted)">(${v.p} passed · ${v.f} failed)</span>`:''}</span>`).join('')}</div>`:''}
    <div class="kicker" style="margin-top:12px">Who put them on the ballot</div><div class="catbar">${jt.map(([t,v])=>`<span>${esc(t.replace(/^./,c=>c.toUpperCase()))}</span><span class="num" style="color:var(--text-soft)">${v}</span>`).join('')}</div>
    <p class="sub" style="margin-top:10px">Results are unofficial election-night counts as reported by each source. The Secretary of State doesn’t publish local measures, so coverage depends on what counties and news outlets posted.</p>`);
}
function measureCard(m){
  const y=yesPct(m), th=thresholdPct(m.threshold);
  return `<div class="lm"><div class="hd"><div><span class="jn">${esc(m.jurisdiction)}</span> <span class="mn">${esc(m.measure)} · ${esc(catLabel(m.category))}</span></div><span class="res ${m.result}">${resWord(m.result)}</span></div>
    <div class="ds">${esc(m.description)}</div>
    ${y!=null?`<div class="meta num">Yes ${y.toFixed(1)}%${m.yes_votes!=null?` (${fmt(m.yes_votes)} – ${fmt(m.no_votes)})`:''} · needs ${esc(m.threshold||'majority')}</div><div class="ybar"><i style="width:${y}%"></i>${th!=null?`<b style="left:${th}%"></b>`:''}</div>`:`<div class="meta">Needs ${esc(m.threshold||'majority')}</div>`}
    <div class="meta" style="margin-top:4px">${esc(m.jurisdiction_type)}${m.result_note?` · ${esc(m.result_note)}`:''} · ${(m.sources||[]).slice(0,3).map(u=>`<a href="${esc(u)}" target="_blank" rel="noopener">${esc(host(u))}</a>`).join(' · ')}</div></div>`;
}
function localDetail(el,id){
  if(!id){ el.html(`<div class="kicker">Details</div><p class="detail-empty" style="margin:6px 0 0">Hover over a county for a quick look. Click to see every measure there, with descriptions and sources.</p>`); return; }
  const L=current.sums.get(id)||[];
  el.html(`${detailHead(`Local measures${state.cat!=='All'?' · '+esc(catLabel(state.cat)):''}`, countyFull(id))}
    ${L.length? L.slice().sort((a,b)=>(a.jurisdiction_type==='county'?0:1)-(b.jurisdiction_type==='county'?0:1)||a.jurisdiction.localeCompare(b.jurisdiction)).map(measureCard).join('') : `<p class="detail-empty">${noMeasuresText(id)}.</p>`}
    ${popCenters(id,'reporting')}`);
  d3.select('#clearSel').on('click',()=>select(null));
}
let lSort='county', lDir=1;
function localTable(){
  d3.select('#tableTitle').text(`Local measures · ${current.ms.length}`);
  const q=norm(d3.select('#tableSearch').property('value'));
  let data=current.ms.filter(m=>!q||norm([m.county,m.jurisdiction,m.measure,m.description,catLabel(m.category)].join(' ')).includes(q));
  const key={county:m=>m.county,jurisdiction:m=>m.jurisdiction,measure:m=>m.measure,category:m=>catLabel(m.category),yes:m=>yesPct(m)??-1,result:m=>m.result};
  data.sort((a,b)=>{ const x=key[lSort](a), y=key[lSort](b); return (typeof x==='number'? x-y : String(x).localeCompare(String(y),undefined,{numeric:true}))*lDir || a.county.localeCompare(b.county) || a.jurisdiction.localeCompare(b.jurisdiction); });
  const cols=[['county','County'],['jurisdiction','Jurisdiction'],['measure','Measure'],['category','Type'],['yes','Yes %','r'],['result','Result']];
  const T=d3.select('#table'); T.html('');
  T.append('thead').append('tr').selectAll('th').data(cols).join('th').attr('class',d=>d[2]||'').html(d=>d[1]+(lSort===d[0]?(lDir>0?' '+ico('up','sort'):' '+ico('down','sort')):'')).on('click',(e,d)=>{ if(lSort===d[0]) lDir*=-1; else { lSort=d[0]; lDir=d[2]?-1:1; } localTable(); });
  const tb=T.append('tbody');
  if(!data.length){ tb.append('tr').append('td').attr('colspan',6).style('color','var(--muted)').text('No measures match.'); return; }
  tb.selectAll('tr').data(data).join('tr').attr('data-id',m=>m.fips).classed('sel',m=>m.fips===state.selected)
    .html(m=>{ const y=yesPct(m); return `<td>${esc(m.county.replace(/ County$/,''))}</td><td>${esc(m.jurisdiction)}</td><td title="${esc(m.description)}">${esc(m.measure)}</td><td>${esc(catLabel(m.category))}</td><td class="r num">${y!=null?y.toFixed(1)+'%':''}</td><td><span class="res ${m.result}">${resWord(m.result)}</span></td>`; })
    .attr('tabindex',0).attr('role','button')
    .on('click',(e,m)=>{ if(m.fips) select(m.fips,true); }).on('keydown',(e,m)=>{ if((e.key==='Enter'||e.key===' ')&&m.fips){ e.preventDefault(); select(m.fips,true); } });
}
// ---------- courts ----------
// Missouri Plan judges (Supreme Court, Courts of Appeals, and circuit judges in Jackson, Clay, Platte, Greene,
// St. Louis County and St. Louis City) face a yes/no retention vote; other circuit judges run on party ballots.
const SUPREME = store.get('Supreme Court Retention|');
const crCache = new Map();
const crOf = rc => { if(!crCache.has(rc)) crCache.set(rc, countyResults(rc)); return crCache.get(rc); };
const seatOf = n => n.split(': ')[0];
const judgeOf = n => n.includes(': ') ? n.split(': ').slice(1).join(': ') : null;
const APPEALS = [...JSTORE.values()].filter(r=>r.group==='appeals').map(rc=>{
  const [, dist, judge] = rc.name.match(/^Court of Appeals, (\w+) District: (.+)$/);
  const surname = judge.split(/\s+/).pop();
  return {id:slug(surname), label:`${dist} · ${surname}`, rc, kicker:`Court of Appeals · ${dist} District`, title:judge};
}).sort((a,b)=>['Western','Eastern','Southern'].indexOf(a.kicker.split(' · ')[1].split(' ')[0])-['Western','Eastern','Southern'].indexOf(b.kicker.split(' · ')[1].split(' ')[0]) || a.label.localeCompare(b.label));
const TRIAL = [...JSTORE.values()].filter(r=>r.group!=='appeals').sort((a,b)=>a.name.localeCompare(b.name,undefined,{numeric:true}));
const COURTS = [
  {id:'supreme', label:'Supreme Court · Wilson', rc:SUPREME, kicker:'Missouri Supreme Court', title:'Paul C. Wilson'},
  ...APPEALS,
  {id:'trial', label:'Circuit courts', kicker:'Circuit courts', title:'Circuit and associate circuit judges'},
];
const yesShare = s => { const y=s&&s.arr.find(c=>c.choice==='Yes'); return y? y.pct : null; };
// one county's trial-court races folded into one map color: combined yes share if any judge faced retention, else the winner
function trialSum(L){
  const ret=L.filter(x=>x.rc.group==='retention');
  if(!ret.length) return L[0].s;
  let y=0, n=0; ret.forEach(x=>x.s.arr.forEach(c=>{ if(c.choice==='Yes') y+=c.votes; else n+=c.votes; }));
  return summarize({choices:new Map([['Yes',{choice:'Yes',party:'',votes:y}],['No',{choice:'No',party:'',votes:n}]]), reporting:d3.min(ret,x=>x.s.reporting)});
}
function courtsState(){
  const c=COURTS.find(x=>x.id===state.court)||COURTS[0]; state.court=c.id;
  d3.select('#raceChips').style('display',null).selectAll('button').data(COURTS,d=>d.id).join('button').attr('aria-pressed',d=>d.id===c.id).text(d=>d.label)
    .on('click',(e,d)=>{ state.court=d.id; state.selected=null; syncHash(); render(); });
  const base={kind:'courts', court:c, features:LAYERS.counties, layer:'counties', unitWord:'County', nameOf:countyFull};
  if(c.id==='trial'){
    const byC=new Map();
    TRIAL.forEach(rc=>crOf(rc).forEach((res,id)=>{ (byC.get(id)||byC.set(id,[]).get(id)).push({rc, s:summarize(res)}); }));
    return {...base, byC, sumOf:id=>{ const L=byC.get(id); return L? trialSum(L) : null; }};
  }
  const cr=crOf(c.rc);
  return {...base, rc:c.rc, sumOf:id=>summarize(cr.get(id))};
}
// every judicial contest on one county's ballot (from the state's count)
function courtsIn(id){
  const out=[];
  [{rc:SUPREME, court:'Supreme Court', judge:'Paul C. Wilson'}, ...APPEALS.map(a=>({rc:a.rc, court:a.kicker.replace(' · ',', '), judge:a.title})),
   ...TRIAL.map(rc=>({rc, court:seatOf(rc.name).replace(/^Circuit (\d+)/,'Circuit Court $1'), judge:judgeOf(rc.name)}))]
    .forEach(x=>{ const res=crOf(x.rc).get(id); if(res) out.push({...x, s:summarize(res)}); });
  return out;
}
function courtLine(x, tag='div'){
  const y=yesShare(x.s);
  if(y!=null) return `<${tag} class="jl"><span><b>${esc(x.judge)}</b> ${muted(esc(x.court),true)}</span><span class="num">${x.s.total? `Yes ${pct(y)}`:'—'}</span></${tag}>`;
  const w=x.s.lead; return `<${tag} class="jl"><span><b>${esc(w.choice)}</b> ${muted(`${esc(w.party)} · ${esc(x.court)}`,true)}</span><span class="num">${x.s.uncontested?'Unopposed':pct(w.pct)}</span></${tag}>`;
}
function courtsTip(id){
  const s=current.sums.get(id);
  if(current.court.id==='trial'){
    const L=current.byC.get(id);
    if(!L) return `<h4>${countyFull(id)}</h4><div class="muted">No circuit-court race in the state’s count</div>`+popCenters(id);
    const xs=courtsIn(id).filter(x=>x.rc!==SUPREME && x.rc.group!=='appeals');
    return `<h4>${countyFull(id)}</h4>${xs.slice(0,8).map(x=>courtLine(x)).join('')}${xs.length>8?`<div class="foot">+${xs.length-8} more · click for all</div>`:''}`+popCenters(id);
  }
  return tipHTML(countyFull(id), s, s? (id==='29095'&&current.rc.units.has('county:KC')?'Includes Kansas City’s Jackson County part':null) : 'Not in this court’s district') + popCenters(id);
}
const RETAIN_NOTE = 'Missouri Plan judges are appointed, then face a yes-or-no retention vote. A judge needs a simple majority of yes votes to keep the seat.';
function courtsSummary(el){
  const c=current.court;
  if(c.id==='trial'){
    const ret=TRIAL.filter(r=>r.group==='retention').map(rc=>({rc, s:summarize(raceTotal(rc))})).sort((a,b)=>yesShare(a.s)-yesShare(b.s));
    const elect=TRIAL.filter(r=>r.group==='elected').map(rc=>({rc, s:summarize(raceTotal(rc))}));
    const lost=ret.filter(x=>yesShare(x.s)<=50), circuits=new Set(ret.map(x=>seatOf(x.rc.name).split(',')[0]));
    const contested=elect.filter(x=>!x.s.uncontested);
    el.html(`<div class="kicker">Circuit courts · ${TRIAL.length} races</div><h2>Circuit and associate circuit judges</h2>
      <p class="sub">${ret.length} judges in ${circuits.size} circuits faced retention votes; ${lost.length? `${lost.length} fell short of a majority` : 'all were retained'}. ${elect.length} seats were filled on party ballots${contested.length?'':', every one by an unopposed candidate'}. ${RETAIN_NOTE}</p>
      <div class="kicker" style="margin-top:12px">Retention votes, lowest yes share first</div>
      <table class="minitable">${ret.slice(0,10).map(x=>`<tr data-id="${[...crOf(x.rc).keys()][0]}" style="cursor:pointer"><td>${esc(judgeOf(x.rc.name))} ${muted(esc(seatOf(x.rc.name)),true)}</td><td class="r num">${pct(yesShare(x.s))}</td></tr>`).join('')}</table>${ret.length>10?`<p class="sub" style="margin-top:6px">All ${ret.length} are in the table below.</p>`:''}
      <p class="sub" style="margin-top:8px">Associate circuit judges elected on county ballots aren’t in the state’s count; they’re under County offices.</p>`);
    el.selectAll('tr[data-id]').on('click',function(){ select(this.dataset.id,true); });
    return;
  }
  const tot=summarize(raceTotal(c.rc)), y=yesShare(tot), done=tot.final, n=crOf(c.rc).size;
  const word = y>50 ? (done?'Retained':'Leading to retain') : (done?'Not retained':'Trailing');
  el.html(`<div class="kicker">${esc(c.kicker)}</div><h2>${esc(c.title)}</h2>
    <div class="result-line" style="color:${deep(y>50?'Y':'N')}">${word}: Yes ${pct(y)}</div>
    <div class="about">${RETAIN_NOTE}${c.id==='supreme'?'':` The ${esc(c.kicker.split(' · ')[1])} covers ${n} ${n===1?'county':'counties'}${c.rc.units.has('county:KC')?' (Kansas City’s board reports separately and is added to Jackson County)':''}.`}</div>
    ${candRows(tot)}
    <div class="reporting">From the Secretary of State’s count.${corrNote(c.id==='supreme'?'Supreme Court Retention':c.rc.name)}</div>`);
}
function courtsDetail(el,id){
  if(!id){ el.html(`<div class="kicker">Details</div><p class="detail-empty" style="margin:6px 0 0">Hover over a county for a quick look. Click to see every judge on that county’s ballot.</p>`); return; }
  const c=current.court, s=c.id==='trial'? null : current.sums.get(id);
  const raceName = c.id==='supreme'?'Supreme Court Retention':c.rc&&c.rc.name;
  const fix = raceName && corrFor(raceName).find(x=>countyByKey.get(norm(x.county))===id);
  const xs=courtsIn(id);
  const off=OFFC.get(id), aj=off? off.races.filter(r=>r.cat==='judge') : [];
  el.html(`${detailHead(c.id==='trial'?'Courts':esc(c.title), countyFull(id))}
    ${c.id==='trial'? '' : s? candRows(s,{noCheck:true}) : `<div class="detail-empty">${esc(countyFull(id))} isn’t in this court’s district.</div>`}
    ${fix?`<div class="reporting" style="color:var(--accent-pink)">${esc(fix.note)}</div>`:''}
    <div class="kicker" style="margin-top:14px">Every judge on the ballot here</div>
    <div class="jlist">${xs.map(x=>courtLine(x)).join('')}</div>
    ${aj.length?`<div class="kicker" style="margin-top:14px">Associate circuit judges (county ballot)</div><div class="jlist">${aj.map(r=>r.s?`<div class="jl"><span><b>${esc(r.s.lead.choice)}</b> ${muted(`${r.s.lead.party?esc(r.s.lead.party)+' · ':''}${esc(r.office)}`,true)}</span><span class="num">${r.s.uncontested?'Unopposed':pct(r.s.lead.pct)}</span></div>`:'').join('')}</div><div class="reporting">From ${esc(off.source)}.</div>`:''}
    ${popCenters(id,'reporting')}`);
  d3.select('#clearSel').on('click',()=>select(null));
}
let cSort=null, cDir=1;
function courtsTable(){
  const c=current.court, T=d3.select('#table'); T.html('');
  let cols, rows;
  if(c.id==='trial'){
    d3.select('#tableTitle').text(`Circuit courts · ${TRIAL.length} races`);
    rows=TRIAL.map(rc=>{ const s=summarize(raceTotal(rc)), y=yesShare(s), ids=[...crOf(rc).keys()];
      return {id:ids[0], seat:seatOf(rc.name), judge:judgeOf(rc.name)||s.lead.choice, counties:ids.map(i=>countyFull(i).replace(/ County$/,'')).join(', '), yes:y??-1, res: y!=null? (y>50?'Retained':'Not retained') : `Elected (${s.lead.party}${s.uncontested?', unopposed':''})`}; });
    cols=[['seat','Seat'],['judge','Judge'],['counties','Counties'],['yes','Yes %','r'],['res','Result']];
  } else {
    d3.select('#tableTitle').text(`${c.title} · results by county`);
    rows=[...current.sums].filter(([,s])=>s).map(([id,s])=>{ const yes=s.arr.find(x=>x.choice==='Yes'), no=s.arr.find(x=>x.choice==='No');
      return {id, name:countyFull(id).replace(/ County$/,''), yes:yesShare(s), y:yes?yes.votes:0, n:no?no.votes:0, total:s.total}; });
    cols=[['name','County'],['yes','Yes %','r'],['y','Yes','r'],['n','No','r'],['total','Total votes','r']];
  }
  if(!cols.find(x=>x[0]===cSort)){ cSort=cols[0][0]; cDir=1; }
  const q=norm(d3.select('#tableSearch').property('value'));
  const data=rows.filter(r=>!q||norm(Object.values(r).join(' ')).includes(q))
    .sort((a,b)=>{ const x=a[cSort], y=b[cSort]; return (typeof x==='number'? x-y : String(x).localeCompare(String(y),undefined,{numeric:true}))*cDir; });
  T.append('thead').append('tr').selectAll('th').data(cols).join('th').attr('class',d=>d[2]||'').html(d=>d[1]+(cSort===d[0]?' '+ico(cDir>0?'up':'down','sort'):''))
    .on('click',(e,d)=>{ if(cSort===d[0]) cDir*=-1; else { cSort=d[0]; cDir=d[2]?-1:1; } courtsTable(); });
  const tb=T.append('tbody');
  if(!data.length){ tb.append('tr').append('td').attr('colspan',cols.length).style('color','var(--muted)').text('No rows match.'); return; }
  tb.selectAll('tr').data(data).join('tr').attr('data-id',d=>d.id).classed('sel',d=>d.id===state.selected)
    .html(d=> c.id==='trial'
      ? `<td>${esc(d.seat)}</td><td>${esc(d.judge)}</td><td>${esc(d.counties)}</td><td class="r num">${d.yes>=0?pct(d.yes):''}</td><td>${d.yes>=0?`<span class="res ${d.yes>50?'passed':'failed'}">${d.res}</span>`:esc(d.res)}</td>`
      : `<td>${esc(d.name)}</td><td class="r"><span class="lean num" style="background:${fillFor(current.sums.get(d.id))};color:${Math.abs(d.yes-50)>=7.5?css('--on-strong'):'var(--fg)'}">${pct(d.yes)}</span></td><td class="r num">${fmt(d.y)}</td><td class="r num">${fmt(d.n)}</td><td class="r num">${fmt(d.total)}</td>`)
    .attr('tabindex',0).attr('role','button')
    .on('click',(e,d)=>select(d.id,true)).on('keydown',(e,d)=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); select(d.id,true); } });
}

// ---------- county offices (from county clerks and local news; the state doesn't publish these) ----------
const OFFICES = DATA.offices;
const OCATS = new Map(OFFICES.categories);
// one race's candidates in the same shape summarize() returns, so candRows/fillFor work on it
function offSum(r){
  const named=r.cands.filter(x=>x.n!=='Write-in');
  if(!named.length) return null;
  const arr=r.cands.map(x=>({choice:x.n, party:x.p, votes:x.v||0, w:!!x.w})).sort((a,b)=>b.votes-a.votes || b.w-a.w);
  const total=d3.sum(arr,c=>c.votes);
  arr.forEach(c=>c.pct= total? c.votes/total*100 : (c.w?100:0));
  const winners=arr.filter(c=>c.w), lead=winners[0]||arr[0], second=arr.find(c=>!c.w);
  // with several seats, the margin that matters is between the last winner and the first loser
  const last = winners.length>1 ? winners[winners.length-1] : lead;
  return {arr, total, lead, second, edge:last, margin: total? last.pct-(second?second.pct:0) : 100, reporting:null,
    uncontested: named.length<=winners.length, final:true, winner:lead, noCount:!total, seats:winners.length};
}
const OFFC = new Map();
Object.entries(OFFICES.counties).forEach(([name,c])=>{
  const id=countyByKey.get(norm(name)); if(!id){ console.warn('unknown county',name); return; }
  c.races.forEach(r=>r.s=offSum(r)); OFFC.set(id==='KC'?'29095':id, {...c, name});
});
const ALL_ORACES = [...OFFC].flatMap(([id,c])=>c.races.map(r=>({...r, id, county:c.name})));
const ocatsPresent = () => ['all', ...[...OCATS.keys()].filter(k=>ALL_ORACES.some(r=>r.cat===k))];
const ocatLabel = k => k==='all' ? 'All offices' : OCATS.get(k);
const isContested = r => r.s && !r.s.uncontested && r.s.arr.filter(c=>c.choice!=='Write-in'&&!/\(write-in\)/i.test(c.choice)).length>r.s.seats;
function officesState(){
  const cats=ocatsPresent(); if(!cats.includes(state.ocat)) state.ocat='all';
  d3.select('#raceChips').style('display',null).selectAll('button').data(cats,d=>d).join('button').attr('aria-pressed',d=>d===state.ocat)
    .text(d=>d==='all'?`All offices (${ALL_ORACES.length})`:ocatLabel(d)).on('click',(e,d)=>{ state.ocat=d; state.selected=null; render(); });
  const inCat = r => state.ocat==='all' || r.cat===state.ocat;
  return {kind:'offices', features:LAYERS.counties, layer:'counties', unitWord:'County', nameOf:countyFull, inCat,
    races: ALL_ORACES.filter(inCat), sumOf:id=>{ const c=OFFC.get(id); return c? c.races.filter(inCat) : null; }};
}
// one office: its margin shade. Several: the party that won most of them, darker the more it won.
function officeFill(id){
  const list=current.sums.get(id);
  if(!list) return css('--nodata');
  const ss=list.map(r=>r.s).filter(Boolean);
  if(!ss.length) return css('--notup');
  if(ss.length===1) return fillFor(ss[0]);
  const [fam,n]=[...d3.rollup(ss,v=>v.length,s=>famOf(s.lead))].sort((a,b)=>b[1]-a[1])[0];
  const share=n/ss.length; return css(`--${fam}${share>=1?3:share>=0.75?2:share>0.5?1:0}`);
}
function officesTip(id){
  const c=OFFC.get(id), L=current.sums.get(id);
  let h=`<h4>${countyFull(id)}</h4>`;
  if(!c) return h+`<div class="muted">County offices not collected</div>`+popCenters(id);
  if(!L.length) return h+`<div class="muted">No ${esc(ocatLabel(state.ocat).toLowerCase())} race in our source${c.partial?' (it lists only some races)':''}</div>`+popCenters(id);
  L.slice(0,8).forEach(r=>{ const s=r.s; h+=`<div class="row"><i style="background:${s?solid(famOf(s.lead)):'transparent'}"></i><span>${esc(r.office)}: ${s?`<b>${esc(s.lead.choice)}</b>${s.lead.party&&s.lead.party!=='W'?' '+muted(s.lead.party,true):''}`:muted('no candidate')}</span><span class="p num">${s&&!s.uncontested?pct(s.lead.pct):''}</span></div>`; });
  if(L.length>8) h+=`<div class="foot">+${L.length-8} more · click for all</div>`;
  else if(c.partial) h+=`<div class="foot">Source lists only some races</div>`;
  return h+popCenters(id);
}
function officesLegend(L){
  L.append('span').style('font-weight','600').text('Winning party:');
  const fams=new Set(current.races.filter(r=>r.s).map(r=>famOf(r.s.lead)));
  const names={R:'Republican',D:'Democratic',O:'Other or no label'};
  ['R','D','O'].filter(f=>fams.has(f)).forEach(f=>{ const r=L.append('span').attr('class','ramp'); r.append('span').text(names[f]); const sw=r.append('span').attr('class','sw'); [0,1,2,3].forEach(i=>sw.append('i').style('background',css(`--${f}${i}`))); });
  L.append('span').style('color','var(--muted)').text('darker = wider margin, or more of the offices');
  [['--nodata','Not collected'],['--notup','No race of this kind in our source']].forEach(([v,t])=>{ const n=L.append('span'); n.append('span').attr('class','k').style('background',css(v)); n.append('span').text(t); });
}
function officesSummary(el){
  const R=current.races, cty=new Set(R.map(r=>r.id)).size;
  const won=p=>R.filter(r=>r.s&&(p==='O'? !['R','D'].includes(r.s.lead.party) : r.s.lead.party===p)).length;
  const close=R.filter(isContested).sort((a,b)=>a.s.margin-b.s.margin);
  const partial=[...OFFC.values()].filter(c=>c.partial).length;
  el.html(`<div class="kicker">County offices · Nov 3, 2026</div><h2>${esc(ocatLabel(state.ocat))}</h2>
    <p class="sub">${R.length} race${R.length===1?'':'s'} in ${cty} count${cty===1?'y':'ies'}. The Secretary of State doesn’t publish county offices, so these come from county clerks and local news. ${OFFC.size} of 115 counties are collected${partial?`; for ${partial} of them we only found news reports that list some races`:''}.</p>
    <div class="split" style="gap:18px;margin:4px 0 10px">
      <div class="side"><b class="num" style="font-size:30px;color:${deep('R')}">${won('R')}</b><span>Republican</span></div>
      <div class="side"><b class="num" style="font-size:30px;color:${deep('D')}">${won('D')}</b><span>Democratic</span></div>
      <div class="side"><b class="num" style="font-size:30px;color:var(--muted)">${won('O')}</b><span>other or no label</span></div>
    </div>
    <div class="kicker" style="margin-top:8px">Contested races · ${close.length}, closest first</div>
    ${close.length?`<table class="minitable">${close.slice(0,12).map(r=>`<tr data-id="${r.id}" style="cursor:pointer"><td>${esc(r.county.replace(/ County$/,''))} ${muted(esc(r.office),true)}</td><td>${esc(r.s.edge.choice)}${r.s.edge.party?' '+muted(esc(r.s.edge.party),true):''}</td><td class="r num">+${r.s.margin.toFixed(1)}</td></tr>`).join('')}</table>${close.length>12?`<p class="sub" style="margin-top:6px">${close.length-12} more in the table below.</p>`:''}`:'<div class="detail-empty">None in this group.</div>'}
    <p class="sub" style="margin-top:10px">Unofficial election-night counts. Most county offices were uncontested. Sources without party labels show the candidate with no party.</p>`);
  el.selectAll('tr[data-id]').on('click',function(){ select(this.dataset.id,true); });
}
function officeCard(r){
  const s=r.s;
  const body = !s ? `<div class="detail-empty">${esc(r.note||'No candidate filed.')}</div>`
    : s.noCount ? `<div class="cand"><div class="nm">${esc(s.lead.choice)}${s.lead.party?`<span class="pty">${partyName(s.lead.party)}</span>`:''}</div><div class="pct">Unopposed</div></div>`
    : candRows(s);
  return `<div class="lm"><div class="hd"><span class="jn">${esc(r.office)}</span>${isContested(r)?'<span class="res unknown">Contested</span>':''}</div>${body}${s&&r.note?`<div class="meta">${esc(r.note)}</div>`:''}</div>`;
}
function officesDetail(el,id){
  if(!id){ el.html(`<div class="kicker">Details</div><p class="detail-empty" style="margin:6px 0 0">Hover over a county for a quick look. Click to see every county office we have for it.</p>`); return; }
  const c=OFFC.get(id), L=c? current.sums.get(id) : [];
  el.html(`${detailHead(`County offices${state.ocat!=='all'?' · '+esc(ocatLabel(state.ocat)):''}`, countyFull(id))}
    ${!c? `<p class="detail-empty">Not collected. We didn’t find a county report or news source with ${esc(countyFull(id))}’s office results.</p>`
      : `<p class="sub">From ${esc(c.source)}.${c.partial?' This source lists only some races, so uncontested offices may be missing.':''}</p>${L.length? L.map(officeCard).join('') : `<p class="detail-empty">No ${esc(ocatLabel(state.ocat).toLowerCase())} race in this source.</p>`}`}
    <p class="sub" style="margin-top:10px">Circuit and appellate judges from the state’s count are under Courts.</p>
    ${popCenters(id,'reporting')}`);
  d3.select('#clearSel').on('click',()=>select(null));
}
let oSort='county', oDir=1;
function officesTable(){
  d3.select('#tableTitle').text(`${ocatLabel(state.ocat)} · ${current.races.length} races`);
  const q=norm(d3.select('#tableSearch').property('value'));
  const rows=current.races.map(r=>({r, id:r.id, county:r.county, office:r.office, winner:r.s?r.s.lead.choice:'', party:r.s?r.s.lead.party:'', margin:r.s&&isContested(r)?r.s.margin:999, total:r.s?r.s.total:0}));
  const data=rows.filter(d=>!q||norm([d.county,d.office,d.winner,...(d.r.cands||[]).map(c=>c.n)].join(' ')).includes(q))
    .sort((a,b)=>{ const x=a[oSort], y=b[oSort]; return (typeof x==='number'? x-y : String(x).localeCompare(String(y),undefined,{numeric:true}))*oDir || a.county.localeCompare(b.county) || a.office.localeCompare(b.office); });
  const cols=[['county','County'],['office','Office'],['winner','Winner'],['party','Party'],['margin','Margin','r'],['total','Votes','r']];
  const T=d3.select('#table'); T.html('');
  T.append('thead').append('tr').selectAll('th').data(cols).join('th').attr('class',d=>d[2]||'').html(d=>d[1]+(oSort===d[0]?' '+ico(oDir>0?'up':'down','sort'):''))
    .on('click',(e,d)=>{ if(oSort===d[0]) oDir*=-1; else { oSort=d[0]; oDir=1; } officesTable(); });
  const tb=T.append('tbody');
  if(!data.length){ tb.append('tr').append('td').attr('colspan',6).style('color','var(--muted)').text('No races match.'); return; }
  tb.selectAll('tr').data(data).join('tr').attr('data-id',d=>d.id).classed('sel',d=>d.id===state.selected)
    .html(d=>{ const s=d.r.s; return `<td>${esc(d.county)}</td><td>${esc(d.office)}</td><td>${s?esc(s.lead.choice):muted('No candidate')}</td><td>${esc(d.party)}</td><td class="r">${!s?'':isContested(d.r)?`<span class="lean num" style="background:${fillFor(s)};color:${s.margin>=15?css('--on-strong'):'var(--fg)'}">+${s.margin.toFixed(1)}</span>`:muted('Uncontested')}</td><td class="r num">${d.total?fmt(d.total):''}</td>`; })
    .attr('tabindex',0).attr('role','button')
    .on('click',(e,d)=>select(d.id,true)).on('keydown',(e,d)=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); select(d.id,true); } });
}

let sortKey='name', sortDir=1;
function drawTable(){
  const ch=current.ch;
  if(current.kind==='local') return localTable();
  if(current.kind==='courts') return courtsTable();
  if(current.kind==='offices') return officesTable();
  d3.select('#tableTitle').text(current.kind==='statewide'? `${current.rc.name} · results by county` : `${ch.label} · results by district`);
  let rows, cols;
  if(current.kind==='statewide'){
    rows=current.features.map(f=>{ const id=f.properties.id, s=current.sums.get(id); return {id, name:countyFull(id).replace(/ County$/,''), s, leader:s&&s.lead?s.lead.choice:'', margin:s&&s.total?s.margin:-1, total:s?s.total:0, rep:s&&s.reporting!=null?s.reporting:-1}; });
    cols=[['name','County'],['leader','Leader'],['margin','Margin','r'],['total','Total votes','r'],['rep','Reporting','r']];
  } else {
    rows=current.model.seats.map(seat=>({id:String(seat.d), name:seat.d, seat, s:seat.s, leader:seat.s?seat.s.lead.choice:seat.prevName, margin:seat.s&&!seat.s.uncontested?seat.s.margin:(seat.s?999:-1), total:seat.s?seat.s.total:0, prev:seat.prev, flip:seat.flip?1:0}));
    cols=[['name','District'],['leader','Winner'],['margin','Margin','r'],['prev','Held by'],['flip','Flip'],['total','Total votes','r']];
  }
  const q=norm(d3.select('#tableSearch').property('value'));
  let data=rows.filter(r=> !q || norm(r.name).includes(q) || norm(r.leader).includes(q) || (q==='flip'&&r.flip));
  data.sort((a,b)=>{ const x=a[sortKey], y=b[sortKey]; return (typeof x==='number'&&typeof y==='number'? x-y : String(x).localeCompare(String(y),undefined,{numeric:true}))*sortDir; });
  const T=d3.select('#table'); T.html('');
  T.append('thead').append('tr').selectAll('th').data(cols).join('th').attr('class',d=>d[2]||'').html(d=>d[1]+(sortKey===d[0]?(sortDir>0?' '+ico('up','sort'):' '+ico('down','sort')):''))
    .attr('aria-sort',d=>sortKey===d[0]?(sortDir>0?'ascending':'descending'):null)
    .on('click',(e,d)=>{ if(sortKey===d[0]) sortDir*=-1; else { sortKey=d[0]; sortDir=(d[2]||d[0]==='flip')?-1:1; } drawTable(); });
  const tb=T.append('tbody');
  const marginCell=s=> s&&s.total? (s.uncontested?muted('Uncontested'):`<span class="lean num" style="background:${fillFor(s)};color:${s.margin>=15?css('--on-strong'):'var(--fg)'}">+${s.margin.toFixed(1)}</span>`) : '';
  tb.selectAll('tr').data(data).join('tr').attr('data-id',d=>d.id).classed('sel',d=>d.id===state.selected)
    .html(d=>{ const s=d.s;
      if(current.kind==='statewide') return `<td>${d.name}</td><td>${s&&s.lead?`${s.lead.choice}${s.lead.party&&s.lead.party!=='W'?' '+muted(s.lead.party,true):''}`:muted(haveCounty.has(d.id)?'—':(redo.has(d.id)?'Being re-collected':'Not collected yet'))}</td><td class="r">${marginCell(s)}</td><td class="r num">${s&&s.total?fmt(s.total):''}</td><td class="r num">${d.rep>=0?Math.round(d.rep)+'%':''}</td>`;
      const seat=d.seat;
      if(!seat.raced) return `<td>${ch.prefix} ${d.name}</td><td class="muted">${seat.prevName} (${seat.prev}) · not up</td><td></td><td>${seat.prev}</td><td></td><td></td>`;
      return `<td>${ch.prefix} ${d.name}</td><td>${s.lead.choice} ${muted(s.lead.party,true)}${seat.close?' <span class="badge close">recount range</span>':''}</td><td class="r">${marginCell(s)}</td><td>${seat.prev}</td><td>${seat.flip?badge(`${seat.prev} to ${seat.party}`,famP(seat.party)):''}</td><td class="r num">${fmt(s.total)}</td>`; })
    .attr('tabindex',0).attr('role','button')
    .on('click',(e,d)=>select(d.id)).on('keydown',(e,d)=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); select(d.id); } })
    .on('mouseenter',(e,d)=>gUnits.selectAll('path.unit').filter(f=>f.properties.id===d.id).classed('hl',true).raise())
    .on('mouseleave',()=>gUnits.selectAll('path.unit').classed('hl',false));
}
function highlightRow(id,on){ d3.selectAll('#table tbody tr').filter(function(){return this.dataset.id===id;}).classed('sel',on||id===state.selected); }
d3.select('#tableSearch').on('input',drawTable);

function select(id,force){
  state.selected = (!force && state.selected===id)? null : id;
  gUnits.selectAll('path.unit').classed('sel',d=>d.properties.id===state.selected);
  gUnits.selectAll('.sel').raise();
  if(current.kind==='chamber') updateSeatSel();
  drawDetail(); drawTable();
}
function drawStatus(){
  const t = META.statewide_asof ? META.statewide_asof.replace(/:\d\d (?=[AP]M)/,' ') : '';
  d3.select('#statusText').text(`Unofficial results · MO Secretary of State · as of ${t}`);
  const corr = CORRECTIONS.length ? ` Where the state feed has a clear error, the county clerk’s own report is used instead: ${CORRECTIONS.map(c=>esc(c.note)).join(' ')} Statewide and district totals add up the corrected county figures.` : '';
  d3.select('#foot').html(`Results: Missouri Secretary of State election-night reporting (enr.sos.mo.gov), unofficial, as of ${META.statewide_asof}.${corr} County maps use ${[...haveCounty].filter(id=>id!=='KC').length} of 115 county result files${haveCounty.has('KC')?' plus the Kansas City Election Board’s count':''}, which covers only KC’s Jackson County part and is added into Jackson County.${redo.size?` ${[...redo].map(countyFull).join(', ')}: the collected files were duplicates of other counties, so they’re blank on the map until re-collected (statewide and district totals already include them).`:''} A check mark means a candidate is ahead with all precincts reported. These are not certified results.<br>
  Flips are measured against the party holding each seat before the election. Vacant seats count for the party that last held them (House 95, 110, 114, 149 and 160, and Senate 10, all Republican). Recount range: under 0.5% of votes cast (RSMo § 115.601).<br>
  Courts: appellate retention votes and circuit-court races are from the same Secretary of State count. County offices are not in the state’s count; they come from county clerks’ reports and local news (KY3, KFVS12, KOAM, the Southeast Missourian, the Mexico Ledger and The Beacon), and each county names its source. They cover ${OFFC.size} of 115 counties.<br>
  Population centers: Census 2024 city estimates for counties; 2020 Census block counts for districts. Boundaries: U.S. Census Bureau 2025 cartographic boundary files (counties; 2022 congressional plan, in effect for this election; current State Senate and State House districts). ${SOURCES}`);
}

// ---------- hash ----------
function syncHash(){ const h = state.view==='statewide' ? (state.race? 'race-'+slug(state.race) : '') : state.view==='courts' && state.court!=='supreme' ? 'courts-'+state.court : state.view; try{ history.replaceState(null,'',h?'#'+h:location.pathname); }catch(e){} }
function readHash(){ const h=location.hash.slice(1); if(!h){ state.view='statewide'; return; } if(CHAMBERS.find(c=>c.id===h)||['local-issues','courts','county-offices'].includes(h)){ state.view=h; return; }
  if(h.startsWith('courts-')){ state.view='courts'; state.court=h.slice(7); return; } if(h.startsWith('race-')){ state.view='statewide'; const r=statewideRaces().find(r=>slug(r.name)===h.slice(5)); if(r) state.race=r.name; } }
addEventListener('hashchange',()=>{ readHash(); state.selected=null; render(); });

readHash(); render();
setupTheme(()=>render());
addEventListener('scroll',hideTip,{passive:true});
}

/* ---------- ambient effects, as on the rest of the site ---------- */
(function ambient(){
  const y=document.getElementById('year'); if(y) y.textContent=new Date().getFullYear();
  if(!reducedMotion){
    addEventListener('pointermove',e=>{ document.documentElement.style.setProperty('--mx',e.clientX+'px'); document.documentElement.style.setProperty('--my',e.clientY+'px'); },{passive:true});
  }
  const els=document.querySelectorAll('.reveal');
  if(reducedMotion || !('IntersectionObserver' in window)){ els.forEach(el=>el.classList.add('in')); return; }
  const io=new IntersectionObserver(entries=>{ entries.forEach((e,i)=>{ if(e.isIntersecting){ e.target.style.transitionDelay=((i%4)*90)+'ms'; e.target.classList.add('in'); io.unobserve(e.target); } }); },{threshold:0.15});
  els.forEach(el=>io.observe(el));
})();

main().catch(err=>{ console.error(err); const m=document.getElementById('summary'); if(m) m.innerHTML=`<div class="kicker">Something went wrong</div><p class="detail-empty">${String(err.message||err)}</p>`; });
