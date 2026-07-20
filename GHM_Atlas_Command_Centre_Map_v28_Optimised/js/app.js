
(()=>{
"use strict";
const DATA=window.ATLAS_DATA;
const state={
  view:"overview",items:[...DATA.items],ws:null,territory:"WS001",
  waffleStatus:"all",waffleWs:"all",registerStatus:"all",registerRisk:"all",registerWs:"all",
  search:"",edges:true,labels:true,mapLayout:"dependency",territoryFilter:"all",
  territoryItemStatus:"all"
};
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const statusColor={Completed:"#34b56f",Active:"#d99a3c",Review:"#4e8bd8",Blocked:"#d45555",Later:"#8d969f"};
const riskOrder={Low:0,Medium:1,High:2,Critical:3};
const wsMap=new Map(DATA.workstreams.map(w=>[w.code,w]));
const itemMap=()=>new Map(state.items.map(i=>[i.id,i]));
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
const short=(s,n=42)=>String(s).length>n?String(s).slice(0,n-1)+"…":String(s);
const fmt=d=>new Intl.DateTimeFormat("en-GB",{day:"2-digit",month:"short",year:"numeric"}).format(new Date(d+"T12:00:00"));
const avg=a=>a.length?Math.round(a.reduce((x,y)=>x+y,0)/a.length):0;
const byWs=code=>state.items.filter(i=>i.workstream===code);
const summary=code=>{
  const a=byWs(code);
  return {
    total:a.length,completed:a.filter(i=>i.status==="Completed").length,
    active:a.filter(i=>i.status==="Active").length,review:a.filter(i=>i.status==="Review").length,
    blocked:a.filter(i=>i.status==="Blocked").length,later:a.filter(i=>i.status==="Later").length,
    risk:a.filter(i=>riskOrder[i.risk]>=2).length,critical:a.filter(i=>i.risk==="Critical").length,
    progress:avg(a.map(i=>i.progress))
  };
};
const health=s=>s.blocked>2||s.critical>1?"Critical":s.risk>5||s.blocked>0?"Attention":s.progress>78?"On track":"In progress";
function chip(status){return `<span class="status-chip" style="--chip:${statusColor[status]}">${esc(status)}</span>`}
function riskChip(risk){const c={Low:"#7c8790",Medium:"#d99a3c",High:"#d46954",Critical:"#d45555"}[risk];return `<span class="risk-chip" style="--risk:${c}">${esc(risk)}</span>`}
function progress(p){return `<div class="progress"><i style="width:${p}%"></i></div>`}
function toast(msg){const t=$("#toast");t.textContent=msg;t.classList.add("show");clearTimeout(toast.timer);toast.timer=setTimeout(()=>t.classList.remove("show"),2200)}
function closeDrawer(){
  $("#drawer").classList.remove("open");$("#drawer").setAttribute("aria-hidden","true");$("#scrim").hidden=true;state.ws=null;
}
function markActive(){
  $$("[data-view]").forEach(b=>{
    const active=b.dataset.view===state.view;
    b.classList.toggle("active",active);
    active?b.setAttribute("aria-current","page"):b.removeAttribute("aria-current");
  });
  $$(".territory-shortcut[data-open-territory]").forEach(b=>{
    const active=state.view==="territory"&&b.dataset.openTerritory===state.territory;
    b.classList.toggle("active",active);
    active?b.setAttribute("aria-current","page"):b.removeAttribute("aria-current");
  });
  const count=$("#visibleItemCount");if(count)count.textContent=`${state.items.length} visible items`;
}
function navigate(view){
  if(!document.querySelector(`[data-page="${view}"]`))view="overview";
  closeDrawer();state.view=view;
  $$(".view").forEach(v=>v.classList.toggle("active",v.dataset.page===view));
  markActive();
  const pageLabel=state.view==="territory"?(wsMap.get(state.territory)?.name||"Territory"):state.view.replace("birdseye","Bird’s-eye").replace("square","Block");
  document.title=`${pageLabel.charAt(0).toUpperCase()+pageLabel.slice(1)} · GHM Atlas Command Centre v24`;
  $("#rail").classList.remove("open");
  window.scrollTo({top:0,behavior:"smooth"});
  const renderers={
    overview:renderOverview,birdseye:renderMap,structured:renderStructured,square:renderSquare,
    waffle:renderWaffle,territories:renderTerritoryIndex,territory:renderTerritoryDetail,
    timeline:renderTimeline,register:renderRegister,dependencies:renderDependencies,
    evidence:renderEvidence,decisions:renderDecisions
  };
  renderers[view]?.();
  bindDynamic();
  history.replaceState(null,"","#"+view);
}
function openTerritory(code){
  if(!wsMap.has(code))return;
  state.territory=code;state.territoryItemStatus="all";navigate("territory");
}
function renderOverview(){
  const all=state.items,total=all.length;
  const counts={
    Active:all.filter(i=>i.status==="Active").length,
    Review:all.filter(i=>i.status==="Review").length,
    Blocked:all.filter(i=>i.status==="Blocked").length,
    Completed:all.filter(i=>i.status==="Completed").length,
    Later:all.filter(i=>i.status==="Later").length,
    Risk:all.filter(i=>riskOrder[i.risk]>=2).length
  };
  const signals=[
    {label:"All items",value:total,detail:"11 connected territories",wax:"completed",filter:"all"},
    {label:"Active",value:counts.Active,detail:"In live delivery",wax:"active",filter:"Active"},
    {label:"At risk",value:counts.Risk,detail:"High or critical",wax:"active",filter:"risk"},
    {label:"Blocked",value:counts.Blocked,detail:"Needs intervention",wax:"blocked",filter:"Blocked"},
    {label:"Review",value:counts.Review,detail:"Awaiting assurance",wax:"review",filter:"Review"},
    {label:"Completed",value:counts.Completed,detail:`${Math.round(counts.Completed/total*100)}% of programme`,wax:"completed",filter:"Completed"}
  ];
  $("#overviewSignals").innerHTML=signals.map(s=>`<button class="signal-card signal-${s.filter.toLowerCase()}" data-overview-filter="${s.filter}">
    <img src="assets/wax/${s.wax}.png" alt="">
    <span><small>${s.label}</small><strong>${s.value}</strong><em>${s.detail}</em></span>
  </button>`).join("");
  renderOverviewMap();
  renderTerritoryPulse();
  renderCondensedTerritories();
  renderOverviewOperations();
  bindDynamic();
}
function renderOverviewMap(){
  const svg=$("#overviewMap");if(!svg)return;
  const P=positions("dependency"),m=itemMap();
  const linkMap=new Map();
  state.items.forEach(i=>i.dependencies.forEach(id=>{
    const d=m.get(id);if(!d||d.workstream===i.workstream)return;
    const key=[i.workstream,d.workstream].sort().join("|");
    const entry=linkMap.get(key)||{a:i.workstream,b:d.workstream,count:0,blocked:0};
    entry.count++;if(i.status==="Blocked"||d.status==="Blocked")entry.blocked++;
    linkMap.set(key,entry);
  }));
  let edges=[...linkMap.values()].map(l=>{
    const a=P[l.a],b=P[l.b],hot=l.blocked>0;
    return `<path class="overview-territory-edge ${hot?"hot":""}" d="M ${a.x} ${a.y} Q 800 470 ${b.x} ${b.y}" style="--weight:${Math.min(5,1+l.count/6)}"><title>${l.a} ↔ ${l.b} · ${l.count} linked items</title></path>`;
  }).join("");
  let dots="";
  state.items.forEach(i=>{
    const p=P[i.id],risk=riskOrder[i.risk]>=2?"risk":"";
    dots+=`<circle class="overview-dot ${risk}" data-map-item="${i.id}" cx="${p.x}" cy="${p.y}" r="${i.status==="Blocked"?5.4:3.8}" fill="${statusColor[i.status]}"><title>${esc(i.id+" · "+i.title+" · "+i.status)}</title></circle>`;
  });
  let anchors=DATA.workstreams.map(w=>{
    const p=P[w.code],s=summary(w.code);
    return `<g class="overview-anchor" data-map-ws="${w.code}">
      <circle cx="${p.x}" cy="${p.y}" r="49"/>
      <image href="${w.icon}" x="${p.x-38}" y="${p.y-38}" width="76" height="76" preserveAspectRatio="xMidYMid meet"/>
      <text x="${p.x}" y="${p.y+62}">${w.code}</text><text class="anchor-sub" x="${p.x}" y="${p.y+75}">${esc(short(w.name,21))}</text>
      <title>${esc(w.name)} · ${s.total} items · ${s.blocked} blocked · ${s.progress}% progress</title>
    </g>`;
  }).join("");
  const center=`<g class="overview-centre" data-view="overview"><circle cx="800" cy="470" r="75"/><image href="assets/brand/command-centre-emblem.png" x="736" y="406" width="128" height="128" preserveAspectRatio="xMidYMid meet"/></g>`;
  svg.innerHTML=`<g>${edges}${dots}${anchors}${center}</g>`;
  $$("[data-map-ws]",svg).forEach(g=>g.onclick=()=>openDrawer(g.dataset.mapWs));
  $$("[data-map-item]",svg).forEach(n=>n.onclick=e=>{e.stopPropagation();openItem(n.dataset.mapItem)});
}
function pulseTerritories(){
  const entries=DATA.workstreams.map(w=>{
    const s=summary(w.code),a=byWs(w.code),next=[...a].filter(i=>i.status!=="Completed").sort((x,y)=>x.due.localeCompare(y.due))[0]||a[0];
    return {w,s,next,earliest:next?.due||"9999-12-31"};
  });
  const rules=[
    {label:"Most blocked",sort:(a,b)=>b.s.blocked-a.s.blocked||b.s.critical-a.s.critical},
    {label:"Highest risk",sort:(a,b)=>b.s.risk-a.s.risk||b.s.critical-a.s.critical},
    {label:"Nearest milestone",sort:(a,b)=>a.earliest.localeCompare(b.earliest)},
    {label:"Most active",sort:(a,b)=>b.s.active-a.s.active||b.s.review-a.s.review}
  ];
  const used=new Set(),out=[];
  rules.forEach(rule=>{
    const candidate=[...entries].sort(rule.sort).find(x=>!used.has(x.w.code))||[...entries].sort(rule.sort)[0];
    used.add(candidate.w.code);out.push({...candidate,label:rule.label});
  });
  return out;
}
function renderTerritoryPulse(){
  const el=$("#territoryPulse");if(!el)return;
  el.innerHTML=pulseTerritories().map(({w,s,next,label})=>{
    const items=byWs(w.code);
    return `<article class="pulse-card">
      <header><div><span>${label}</span><b>${w.code}</b></div><img src="${w.icon}" alt=""></header>
      <h3>${esc(w.name)}</h3>
      <div class="pulse-metrics"><div><strong>${s.total}</strong><span>Items</span></div><div><strong>${s.progress}%</strong><span>Progress</span></div><div><strong>${s.blocked}</strong><span>Blocked</span></div></div>
      <div class="pulse-waffle">${items.map(i=>`<button data-open-item="${i.id}" style="--state:${statusColor[i.status]}" title="${esc(i.id+" · "+i.title+" · "+i.status)}"></button>`).join("")}</div>
      <div class="pulse-next"><span>Next action</span><strong>${esc(short(next.nextAction,78))}</strong><small>${next.id} · ${fmt(next.due)}</small></div>
      <footer><button class="pulse-open" data-open-territory="${w.code}">Open territory</button><button class="pulse-chamber" data-open-ws="${w.code}">Quick chamber</button></footer>
    </article>`;
  }).join("");
}
function renderCondensedTerritories(){
  const el=$("#territoryCondensed");if(!el)return;
  el.innerHTML=DATA.workstreams.map(w=>{
    const s=summary(w.code),a=byWs(w.code),next=[...a].filter(i=>i.status!=="Completed").sort((x,y)=>x.due.localeCompare(y.due))[0]||a[0];
    return `<button class="territory-condensed" data-open-territory="${w.code}">
      <img src="${w.icon}" alt="">
      <div class="territory-condensed-copy"><span>${w.code} · ${health(s)}</span><strong>${esc(w.name)}</strong><small>${esc(short(next.nextAction,54))}</small></div>
      <div class="territory-condensed-metrics"><b>${s.progress}%</b><span>${s.active} active · ${s.blocked} blocked</span>${progress(s.progress)}</div>
    </button>`;
  }).join("");
}
function renderOverviewOperations(){
  const el=$("#overviewOperations");if(!el)return;
  const open=state.items.filter(i=>i.status!=="Completed");
  const milestone=[...open].sort((a,b)=>a.due.localeCompare(b.due))[0];
  const blocker=[...open].sort((a,b)=>(b.status==="Blocked")-(a.status==="Blocked")||riskOrder[b.risk]-riskOrder[a.risk]||a.due.localeCompare(b.due))[0];
  const decision=[...open].filter(i=>i.status==="Review").sort((a,b)=>a.due.localeCompare(b.due))[0]||open[0];
  const evidence=[...open].filter(i=>i.status==="Review"||riskOrder[i.risk]>=2).sort((a,b)=>riskOrder[b.risk]-riskOrder[a.risk])[0]||open[1];
  const cards=[
    ["Next milestone",milestone?.milestone,milestone,`Due ${milestone?fmt(milestone.due):"—"}`],
    ["Critical blocker",blocker?.title,blocker,blocker?`${blocker.risk} risk · ${blocker.owner}`:"No open blocker"],
    ["Decision awaiting",decision?.decision,decision,decision?`${decision.id} · ${decision.workstream}`:"No open decision"],
    ["Evidence watch",evidence?.evidence,evidence,evidence?`${evidence.status} · ${evidence.reviewer}`:"Evidence complete"]
  ];
  el.innerHTML=cards.map(([label,title,item,meta],idx)=>`<button class="operation-card" ${item?`data-open-item="${item.id}"`:""}>
    <span>${String(idx+1).padStart(2,"0")} · ${label}</span><strong>${esc(short(title||"No action required",54))}</strong><small>${esc(meta)}</small>
  </button>`).join("");
}
function drawerHtml(code,tab="overview"){
  const w=wsMap.get(code),a=byWs(code),s=summary(code);
  const next=[...a].filter(i=>i.status!=="Completed").sort((x,y)=>x.due.localeCompare(y.due)).slice(0,7);
  let body="";
  if(tab==="overview")body=`<div class="drawer-summary">
      <div><strong>${s.total}</strong><span>Items</span></div><div><strong>${s.progress}%</strong><span>Progress</span></div>
      <div><strong>${s.blocked}</strong><span>Blocked</span></div><div><strong>${s.risk}</strong><span>At risk</span></div></div>
      <div class="drawer-command"><span>Current health</span><strong>${health(s)}</strong><p>${territoryNarrative(code,s)}</p></div>
      <h3>Next command actions</h3>${next.map(i=>`<button class="row-item" data-open-item="${i.id}">${chip(i.status)}<div><strong>${esc(i.title)}</strong><br><span>${esc(i.nextAction)}</span></div><span>${fmt(i.due)}</span></button>`).join("")}
      <button class="gold drawer-full" data-open-territory="${code}">Open full territory overview</button>`;
  if(tab==="items")body=a.map(i=>`<button class="row-item" data-open-item="${i.id}">${chip(i.status)}<div><strong>${esc(i.title)}</strong><br><span>${i.id} · ${i.progress}% · ${esc(i.owner)}</span></div><span>${fmt(i.due)}</span></button>`).join("");
  if(tab==="owners"){
    const grouped=Object.entries(a.reduce((o,i)=>{(o[i.owner]??=[]).push(i);return o},{}));
    body=grouped.map(([owner,arr])=>`<div class="row-item"><span class="status-chip">${arr.length}</span><div><strong>${esc(owner)}</strong><br><span>${arr.filter(i=>i.status==="Blocked").length} blocked · ${avg(arr.map(i=>i.progress))}% average</span></div><span>Lead</span></div>`).join("");
  }
  if(tab==="evidence")body=a.map(i=>`<button class="row-item" data-open-item="${i.id}"><span class="status-chip">${i.id}</span><div><strong>${esc(i.evidence)}</strong><br><span>${esc(i.decision)}</span></div><span>${i.status==="Completed"?"Approved":"Open"}</span></button>`).join("");
  return `<div class="drawer-hero"><img class="drawer-main-icon" src="${w.icon}" alt=""><div><p class="eyebrow">${w.code} · COMMAND CHAMBER</p><h2>${esc(w.name)}</h2><span>${esc(w.description)}</span></div></div>
  <div class="drawer-tabs">${["overview","items","owners","evidence"].map(t=>`<button data-drawer-tab="${t}" class="${t===tab?"active":""}">${t[0].toUpperCase()+t.slice(1)}</button>`).join("")}</div>
  <div>${body}</div>`;
}
function openDrawer(code,tab="overview"){
  state.ws=code;$("#drawerContent").innerHTML=drawerHtml(code,tab);$("#drawer").classList.add("open");$("#drawer").setAttribute("aria-hidden","false");$("#scrim").hidden=false;bindDynamic();
}
function openItem(id){
  const i=itemMap().get(id);if(!i)return;
  const w=wsMap.get(i.workstream),deps=i.dependencies.map(x=>itemMap().get(x)).filter(Boolean);
  $("#itemContent").innerHTML=`<p class="eyebrow">${i.id} · ${i.workstream}</p><h2>${esc(i.title)}</h2><p>${esc(i.summary)}</p>
  <div class="drawer-summary"><div><strong>${i.progress}%</strong><span>Progress</span></div><div><strong>${i.priority}</strong><span>Priority</span></div><div><strong>${i.status}</strong><span>Status</span></div><div><strong>${i.risk}</strong><span>Risk</span></div></div>
  <h3>Command information</h3><div class="card"><p><b>Workstream:</b> ${esc(w.name)}</p><p><b>Owner:</b> ${esc(i.owner)} · <b>Reviewer:</b> ${esc(i.reviewer)}</p><p><b>Due:</b> ${fmt(i.due)}</p><p><b>Milestone:</b> ${esc(i.milestone)}</p><p><b>Next action:</b> ${esc(i.nextAction)}</p><p><b>Evidence:</b> ${esc(i.evidence)}</p><p><b>Decision:</b> ${esc(i.decision)}</p></div>
  <h3>Dependencies</h3>${deps.length?deps.map(d=>`<button class="row-item" data-open-item="${d.id}">${chip(d.status)}<div><strong>${esc(d.title)}</strong><br><span>${d.id} · ${d.workstream}</span></div><span>${d.progress}%</span></button>`).join(""):`<div class="card">No blocking dependency. This is a deliberate positive state.</div>`}
  <button class="ghost modal-territory" data-open-territory="${i.workstream}">Open ${esc(w.name)} territory</button>`;
  $("#itemModal").hidden=false;bindDynamic();
}
function territoryNarrative(code,s){
  const w=wsMap.get(code);
  if(s.blocked>2)return `${w.name} is carrying concentrated delivery pressure. ${s.blocked} items are blocked and ${s.risk} require elevated attention.`;
  if(s.review>4)return `${w.name} has moved substantial work into assurance. The immediate emphasis is review closure, evidence and release approval.`;
  if(s.progress>75)return `${w.name} is in a mature delivery state. Remaining work is concentrated around sign-off, dependencies and final release readiness.`;
  return `${w.name} is progressing through active delivery with a clear sequence of owned actions, reviews and dependent hand-offs.`;
}
function dependencySummary(code){
  const own=byWs(code),m=itemMap(),incoming=new Set(),outgoing=new Set(),links=[];
  own.forEach(i=>i.dependencies.forEach(id=>{
    const d=m.get(id);if(d&&d.workstream!==code){outgoing.add(d.workstream);links.push([i,d]);}
  }));
  state.items.filter(i=>i.workstream!==code).forEach(i=>i.dependencies.forEach(id=>{
    const d=m.get(id);if(d&&d.workstream===code)incoming.add(i.workstream);
  }));
  return {incoming:[...incoming],outgoing:[...outgoing],links};
}
function renderTerritoryIndex(){
  const summaries=DATA.workstreams.map(w=>({w,s:summary(w.code)}));
  const attention=summaries.filter(x=>["Critical","Attention"].includes(health(x.s))).length;
  $("#territoryIndexSummary").textContent=`${attention} territories need attention · 11 total`;
  $("#territoryFilters").innerHTML=["all","attention","ontrack"].map(f=>`<button data-territory-filter="${f}" class="${state.territoryFilter===f?"active":""}">${f==="all"?"All territories":f==="attention"?"Needs attention":"On track"}</button>`).join("");
  const filtered=summaries.filter(({s})=>{
    const h=health(s);return state.territoryFilter==="all"||(state.territoryFilter==="attention"&&["Critical","Attention"].includes(h))||(state.territoryFilter==="ontrack"&&["On track","In progress"].includes(h));
  });
  $("#territoryIndex").innerHTML=filtered.map(({w,s})=>{
    const a=byWs(w.code),urgent=[...a].filter(i=>i.status==="Blocked"||i.risk==="Critical").sort((x,y)=>x.due.localeCompare(y.due))[0]||[...a].sort((x,y)=>x.due.localeCompare(y.due))[0];
    const dep=dependencySummary(w.code);
    return `<article class="territory-card">
      <header><div><span class="ws-code">${w.code}</span><h2>${esc(w.name)}</h2><p>${esc(w.description)}</p></div><span class="health health-${health(s).toLowerCase().replace(" ","-")}">${health(s)}</span></header>
      <div class="territory-metrics">
        <div><strong>${s.progress}%</strong><span>Progress</span></div><div><strong>${s.active}</strong><span>Active</span></div>
        <div><strong>${s.blocked}</strong><span>Blocked</span></div><div><strong>${s.risk}</strong><span>At risk</span></div>
      </div>${progress(s.progress)}
      <div class="territory-now"><span>Where we are</span><p>${territoryNarrative(w.code,s)}</p></div>
      <div class="territory-next"><span>Next priority</span><strong>${esc(urgent.title)}</strong><small>${urgent.id} · ${esc(urgent.owner)} · ${fmt(urgent.due)}</small></div>
      <div class="territory-links"><span>${dep.incoming.length} incoming territories</span><span>${dep.outgoing.length} outgoing territories</span><span>${a.filter(i=>i.status==="Review").length} reviews</span></div>
      <footer><button class="gold" data-open-territory="${w.code}">Open territory overview</button><button class="ghost" data-open-ws="${w.code}">Quick chamber</button></footer>
    </article>`;
  }).join("");
  bindDynamic();
}
function renderTerritoryDetail(){
  const code=state.territory,w=wsMap.get(code),a=byWs(code),s=summary(code),dep=dependencySummary(code),m=itemMap();
  const blocked=a.filter(i=>i.status==="Blocked"||i.risk==="Critical").sort((x,y)=>riskOrder[y.risk]-riskOrder[x.risk]||x.due.localeCompare(y.due));
  const next=[...a].filter(i=>i.status!=="Completed").sort((x,y)=>x.due.localeCompare(y.due)).slice(0,7);
  const owners=Object.entries(a.reduce((o,i)=>{(o[i.owner]??=[]).push(i);return o},{})).sort((x,y)=>y[1].length-x[1].length);
  const statusFiltered=a.filter(i=>state.territoryItemStatus==="all"||i.status===state.territoryItemStatus);
  const incoming=dep.incoming.map(c=>wsMap.get(c)).filter(Boolean),outgoing=dep.outgoing.map(c=>wsMap.get(c)).filter(Boolean);
  $("#territoryDetail").innerHTML=`
    <section class="territory-hero">
      <div><button class="back-link" data-view="territories">← Territory index</button><p class="eyebrow">${code} · TERRITORY OVERVIEW</p><h1>${esc(w.name)}</h1><span>${esc(w.description)}</span>
      <div class="hero-actions"><button class="gold" data-open-ws="${code}">Open quick chamber</button><button class="ghost" data-view="birdseye">Locate in Bird’s-eye</button></div></div>
      <div class="territory-health-panel"><small>Current health</small><strong>${health(s)}</strong><span>${s.progress}% average progress</span>${progress(s.progress)}</div>
    </section>
    <div class="territory-kpis">
      <div><span>Total items</span><strong>${s.total}</strong><small>${s.completed} completed</small></div>
      <div><span>Active delivery</span><strong>${s.active}</strong><small>${s.review} in review</small></div>
      <div><span>Blockers</span><strong>${s.blocked}</strong><small>${s.critical} critical risks</small></div>
      <div><span>Dependencies</span><strong>${dep.incoming.length+dep.outgoing.length}</strong><small>${dep.links.length} item links</small></div>
      <div><span>Owners</span><strong>${owners.length}</strong><small>Lead: ${esc(w.lead||owners[0]?.[0]||"Assigned")}</small></div>
    </div>
    <div class="territory-dashboard">
      <section class="panel territory-state"><div class="panel-head"><div><p class="eyebrow">CURRENT POSITION</p><h2>Where we are</h2></div>${chip(blocked.length?"Active":"Completed")}</div>
        <p class="lead-copy">${territoryNarrative(code,s)}</p>
        <div class="status-distribution">${["Completed","Active","Review","Blocked","Later"].map(st=>`<div><span><i style="background:${statusColor[st]}"></i>${st}</span><strong>${a.filter(i=>i.status===st).length}</strong></div>`).join("")}</div>
      </section>
      <section class="panel"><div class="panel-head"><div><p class="eyebrow">FORWARD ACTION</p><h2>What needs to happen next</h2></div></div>
        ${next.map(i=>`<button class="action-row" data-open-item="${i.id}"><span class="action-rank">${String(next.indexOf(i)+1).padStart(2,"0")}</span><div><strong>${esc(i.nextAction)}</strong><small>${i.id} · ${esc(i.title)} · ${esc(i.owner)}</small></div><span>${fmt(i.due)}</span></button>`).join("")}
      </section>
      <section class="panel"><div class="panel-head"><div><p class="eyebrow">ATTENTION</p><h2>Blockers and risks</h2></div><span>${blocked.length} open</span></div>
        ${blocked.length?blocked.map(i=>`<button class="risk-row" data-open-item="${i.id}">${riskChip(i.risk)}<div><strong>${esc(i.title)}</strong><small>${esc(i.nextAction)}</small></div>${chip(i.status)}</button>`).join(""):`<div class="positive-state">No current blockers. Review and evidence controls remain active.</div>`}
      </section>
      <section class="panel"><div class="panel-head"><div><p class="eyebrow">CONNECTED DELIVERY</p><h2>Territory dependencies</h2></div></div>
        <div class="dependency-columns"><div><span>Feeds into this territory</span>${incoming.length?incoming.map(x=>`<button data-open-territory="${x.code}">${x.code}<b>${esc(x.name)}</b></button>`).join(""):`<p>No external incoming territory dependency.</p>`}</div>
        <div><span>This territory feeds</span>${outgoing.length?outgoing.map(x=>`<button data-open-territory="${x.code}">${x.code}<b>${esc(x.name)}</b></button>`).join(""):`<p>No external outgoing territory dependency.</p>`}</div></div>
      </section>
      <section class="panel"><div class="panel-head"><div><p class="eyebrow">OWNERSHIP</p><h2>People and load</h2></div></div>
        ${owners.slice(0,8).map(([owner,arr])=>`<div class="owner-row"><div><strong>${esc(owner)}</strong><small>${arr[0].reviewer===owner?"Reviewer":"Owner"}</small></div><span>${arr.length} items</span><span>${avg(arr.map(i=>i.progress))}%</span><span>${arr.filter(i=>i.status==="Blocked").length} blocked</span></div>`).join("")}
      </section>
      <section class="panel"><div class="panel-head"><div><p class="eyebrow">GOVERNANCE</p><h2>Evidence and decisions</h2></div></div>
        ${a.slice(0,7).map(i=>`<button class="evidence-row" data-open-item="${i.id}"><span>${i.id}</span><div><strong>${esc(i.evidence)}</strong><small>${esc(i.decision)}</small></div><span>${i.status==="Completed"?"Approved":"Open"}</span></button>`).join("")}
      </section>
    </div>
    <section class="territory-register panel">
      <div class="panel-head"><div><p class="eyebrow">FULL TERRITORY REGISTER</p><h2>${s.total} connected items</h2></div><div class="filters">${["all","Completed","Active","Review","Blocked","Later"].map(st=>`<button data-territory-item-status="${st}" class="${state.territoryItemStatus===st?"active":""}">${st==="all"?"All":st}</button>`).join("")}</div></div>
      <div class="table-wrap"><table><thead><tr><th>ID</th><th>Item</th><th>Status</th><th>Risk</th><th>Owner</th><th>Next action</th><th>Due</th><th>Progress</th></tr></thead><tbody>
      ${statusFiltered.map(i=>`<tr data-open-item="${i.id}"><td>${i.id}</td><td>${esc(i.title)}</td><td>${chip(i.status)}</td><td>${riskChip(i.risk)}</td><td>${esc(i.owner)}</td><td>${esc(short(i.nextAction,48))}</td><td>${fmt(i.due)}</td><td>${i.progress}%</td></tr>`).join("")}
      </tbody></table></div>
    </section>`;
  bindDynamic();
}
function renderStructured(){
  $("#structuredBoard").innerHTML=DATA.workstreams.map(w=>{
    const a=byWs(w.code).sort((x,y)=>x.due.localeCompare(y.due)),s=summary(w.code),dep=dependencySummary(w.code);
    return `<section class="structure-card">
      <header><div><span class="ws-code">${w.code}</span><h3>${esc(w.name)}</h3><small>${health(s)} · ${s.total} items</small></div><button class="link-btn" data-open-territory="${w.code}">Open →</button></header>
      <div class="structure-summary"><span>${s.progress}% progress</span><span>${s.blocked} blocked</span><span>${s.review} review</span><span>${dep.incoming.length+dep.outgoing.length} territory links</span></div>${progress(s.progress)}
      <ul>${a.slice(0,7).map(i=>`<li><button class="link-btn" data-open-item="${i.id}"><b>${i.id}</b> ${esc(i.title)} <span>${i.status}</span></button></li>`).join("")}</ul>
      <footer><span>Next: ${esc(short(a.find(i=>i.status!=="Completed")?.nextAction||"Maintain approved state",72))}</span></footer>
    </section>`;
  }).join("");bindDynamic();
}
function renderSquare(){
  $("#squareGrid").innerHTML=DATA.workstreams.map(w=>{
    const a=byWs(w.code),s=summary(w.code);
    return `<section class="block-card">
      <button class="block-head" data-open-territory="${w.code}"><img src="${w.icon}" alt=""><div><span>${w.code}</span><h3>${esc(w.name)}</h3><small>${health(s)} · ${esc(w.description)}</small></div></button>
      <div class="block-stats"><div><strong>${s.total}</strong><span>Items</span></div><div><strong>${s.progress}%</strong><span>Progress</span></div><div><strong>${s.blocked}</strong><span>Blocked</span></div></div>
      <div class="mini-items">${a.map(i=>`<button data-open-item="${i.id}" style="--state:${statusColor[i.status]}" data-tip="${esc(i.id+" · "+i.title+" · "+i.status+" · "+i.progress+"%")}" aria-label="${esc(i.id+" "+i.title)}"></button>`).join("")}</div>
      <div class="block-footer"><span>${s.review} in review</span><span>${s.risk} at risk</span><span>${health(s)}</span></div>
    </section>`;
  }).join("");bindDynamic();
}
function renderWaffle(){
  const statuses=["all","Completed","Active","Review","Blocked","Later"];
  $("#waffleFilters").innerHTML=statuses.map(s=>`<button data-waffle-status="${s}" class="${state.waffleStatus===s?"active":""}">${s==="all"?"All statuses":s}</button>`).join("")+
  `<select id="waffleWs"><option value="all">All workstreams</option>${DATA.workstreams.map(w=>`<option value="${w.code}" ${state.waffleWs===w.code?"selected":""}>${w.code} · ${esc(w.name)}</option>`).join("")}</select>`;
  const a=state.items.filter(i=>(state.waffleStatus==="all"||i.status===state.waffleStatus)&&(state.waffleWs==="all"||i.workstream===state.waffleWs));
  $("#waffleGrid").innerHTML=a.map(i=>{
    const w=wsMap.get(i.workstream);
    return `<button class="waffle-item" data-open-item="${i.id}" style="--state:${statusColor[i.status]}" title="${esc(i.summary)}">
      <img src="${w.icon}" alt=""><b>${i.id} · ${i.workstream}</b><strong>${esc(short(i.title,47))}</strong><span>${i.status} · ${i.progress}% · ${esc(i.owner)}</span>${progress(i.progress)}
    </button>`;
  }).join("");
  $("#waffleWs").onchange=e=>{state.waffleWs=e.target.value;renderWaffle()};bindDynamic();
}
function positions(layout){
  const P={},cx=800,cy=470;
  DATA.workstreams.forEach((w,wi)=>{
    let ax,ay;
    if(layout==="territory"){ax=235+(wi%4)*375;ay=155+Math.floor(wi/4)*315}
    else if(layout==="workflow"){ax=150+(wi%6)*260;ay=220+Math.floor(wi/6)*440}
    else {const ang=-Math.PI/2+wi*(Math.PI*2/11),r=layout==="radial"?320:350;ax=cx+Math.cos(ang)*r;ay=cy+Math.sin(ang)*r}
    P[w.code]={x:ax,y:ay};
    const arr=byWs(w.code);
    arr.forEach((i,j)=>{
      let x,y;
      if(layout==="workflow"){x=ax+((j%6)-2.5)*31;y=ay+68+Math.floor(j/6)*29}
      else if(layout==="territory"){x=ax+((j%6)-2.5)*29;y=ay+65+Math.floor(j/6)*28}
      else {const a=j*Math.PI*2/arr.length+(wi*.25),rr=68+(j%3)*20;x=ax+Math.cos(a)*rr;y=ay+Math.sin(a)*rr}
      P[i.id]={x,y};
    });
  });
  return P;
}
function renderMap(){
  const svg=$("#birdMap"),layout=state.mapLayout==="risk"?"dependency":state.mapLayout,P=positions(layout),m=itemMap(),status=$("#mapStatus").value;
  const visible=state.items.filter(i=>(status==="all"||i.status===status)&&(state.mapLayout!=="risk"||riskOrder[i.risk]>=2||i.status==="Blocked"));
  let edges="";
  if(state.edges){
    const visibleSet=new Set(visible.map(i=>i.id));
    visible.forEach(i=>i.dependencies.forEach(d=>{
      if(!P[d]||!visibleSet.has(d))return;const target=m.get(d),color=target?statusColor[target.status]:"#aeb5bb";
      edges+=`<line class="edge" x1="${P[i.id].x}" y1="${P[i.id].y}" x2="${P[d].x}" y2="${P[d].y}" style="stroke:${color}" data-edge="${i.id}|${d}"/>`;
    }));
  }
  let nodes="";
  visible.forEach(i=>{
    const p=P[i.id],risk=riskOrder[i.risk]>=2?"risk":"";
    nodes+=`<circle class="node-dot ${risk}" data-map-item="${i.id}" cx="${p.x}" cy="${p.y}" r="${i.status==="Blocked"?6:4.7}" fill="${statusColor[i.status]}"><title>${esc(i.id+" · "+i.title+" · "+i.status+" · "+i.progress+"%")}</title></circle>`;
    if(state.labels&&(i.status==="Blocked"||i.priority==="P0"))nodes+=`<text class="node-label" x="${p.x+8}" y="${p.y-7}">${esc(i.id)}</text>`;
  });
  let anchors="";
  DATA.workstreams.forEach(w=>{
    const p=P[w.code],s=summary(w.code);
    anchors+=`<g class="full-map-anchor" data-map-ws="${w.code}">
      <circle cx="${p.x}" cy="${p.y}" r="52"/>
      <image href="${w.icon}" x="${p.x-41}" y="${p.y-41}" width="82" height="82" preserveAspectRatio="xMidYMid meet"/>
      <text x="${p.x}" y="${p.y+66}">${w.code}</text><text class="sub" x="${p.x}" y="${p.y+80}">${esc(short(w.name,24))}</text>
      <title>${esc(w.name)} · ${s.total} items · ${s.blocked} blocked · ${s.progress}% progress</title>
    </g>`;
  });
  const center=`<g class="map-centre" data-map-home><circle cx="800" cy="470" r="82"/><image href="assets/brand/command-centre-emblem.png" x="728" y="398" width="144" height="144" preserveAspectRatio="xMidYMid meet"/></g>`;
  svg.innerHTML=`<g id="mapLayer">${edges}${nodes}${anchors}${center}</g>`;
  $$("[data-map-ws]",svg).forEach(g=>g.onclick=()=>openDrawer(g.dataset.mapWs));
  $$("[data-map-item]",svg).forEach(n=>{
    n.onclick=e=>{e.stopPropagation();openItem(n.dataset.mapItem)};
    n.onmouseenter=()=>{const id=n.dataset.mapItem;$$(".edge",svg).forEach(e=>e.classList.toggle("hot",e.dataset.edge.split("|").includes(id)))};
    n.onmouseleave=()=>$$(".edge",svg).forEach(e=>e.classList.remove("hot"));
  });
  $("[data-map-home]",svg).onclick=()=>navigate("overview");
}
function renderTimeline(){
  const a=[...state.items].sort((x,y)=>x.due.localeCompare(y.due));
  $("#timeline").innerHTML=a.slice(0,100).map(i=>`<button class="timeline-row" data-open-item="${i.id}"><span><b>${i.id}</b><br>${esc(short(i.title,28))}</span><div>${progress(i.progress)}<small>${esc(i.milestone)} · ${i.status}</small></div><span>${fmt(i.due)}</span></button>`).join("");bindDynamic();
}
function registerItems(){
  const q=state.search.trim().toLowerCase();
  return state.items.filter(i=>(state.registerStatus==="all"||i.status===state.registerStatus)&&(state.registerRisk==="all"||(state.registerRisk==="high"&&riskOrder[i.risk]>=2)||i.risk===state.registerRisk)&&(state.registerWs==="all"||i.workstream===state.registerWs)&&(!q||Object.values(i).join(" ").toLowerCase().includes(q)));
}
function renderRegister(){
  $("#registerTools").innerHTML=`<input id="registerSearch" placeholder="Search all ${state.items.length} items" value="${esc(state.search)}"><select id="registerStatus"><option value="all">All statuses</option>${["Completed","Active","Review","Blocked","Later"].map(s=>`<option ${state.registerStatus===s?"selected":""}>${s}</option>`).join("")}</select><select id="registerRisk"><option value="all">All risks</option><option value="high" ${state.registerRisk==="high"?"selected":""}>High + critical</option>${["Low","Medium","High","Critical"].map(r=>`<option value="${r}" ${state.registerRisk===r?"selected":""}>${r}</option>`).join("")}</select><select id="registerWs"><option value="all">All workstreams</option>${DATA.workstreams.map(w=>`<option value="${w.code}" ${state.registerWs===w.code?"selected":""}>${w.code} · ${esc(w.name)}</option>`).join("")}</select><span>${registerItems().length} shown</span>`;
  $("#registerBody").innerHTML=registerItems().map(i=>`<tr data-open-item="${i.id}"><td>${i.id}</td><td>${esc(i.title)}</td><td>${i.workstream}</td><td>${chip(i.status)}</td><td>${riskChip(i.risk)}</td><td>${esc(i.owner)}</td><td>${fmt(i.due)}</td><td>${i.progress}%</td></tr>`).join("");
  $("#registerSearch").oninput=e=>{state.search=e.target.value;renderRegister()};
  $("#registerStatus").onchange=e=>{state.registerStatus=e.target.value;renderRegister()};
  $("#registerRisk").onchange=e=>{state.registerRisk=e.target.value;renderRegister()};
  $("#registerWs").onchange=e=>{state.registerWs=e.target.value;renderRegister()};
  bindDynamic();
}
function renderDependencies(){
  const a=state.items.filter(i=>i.dependencies.length>1).slice(0,100),m=itemMap();
  $("#dependencyList").innerHTML=a.map(i=>`<button class="card" data-open-item="${i.id}"><span class="ws-code">${i.id} · ${i.workstream}</span><h3>${esc(i.title)}</h3><p>${i.dependencies.map(d=>m.get(d)).filter(Boolean).map(d=>`${d.id} ${short(d.title,30)}`).join(" → ")}</p><footer>${chip(i.status)}<span>${i.dependencies.length} dependencies</span></footer></button>`).join("");bindDynamic();
}
function renderEvidence(){
  $("#evidenceGrid").innerHTML=state.items.slice(0,120).map(i=>`<button class="card" data-open-item="${i.id}"><span class="ws-code">${i.workstream} · ${i.id}</span><h3>${esc(i.evidence)}</h3><p>${esc(i.summary)}</p><footer><span>${i.status==="Completed"?"Approved":"In assurance"}</span><span>${esc(i.reviewer)}</span></footer></button>`).join("");bindDynamic();
}
function renderDecisions(){
  $("#decisionGrid").innerHTML=state.items.slice(0,120).map(i=>`<button class="card" data-open-item="${i.id}"><span class="ws-code">${i.priority} · ${i.id}</span><h3>${esc(i.decision)}</h3><p>${esc(i.nextAction)}</p><footer>${chip(i.status)}<span>${fmt(i.due)}</span></footer></button>`).join("");bindDynamic();
}
function bindDynamic(){
  $$("[data-open-ws]").forEach(b=>b.onclick=e=>{e.stopPropagation();openDrawer(b.dataset.openWs)});
  $$("[data-open-territory]").forEach(b=>b.onclick=e=>{e.stopPropagation();$("#itemModal").hidden=true;openTerritory(b.dataset.openTerritory)});
  $$("[data-open-item]").forEach(b=>b.onclick=()=>openItem(b.dataset.openItem));
  $$("[data-drawer-tab]").forEach(b=>b.onclick=()=>{$("#drawerContent").innerHTML=drawerHtml(state.ws,b.dataset.drawerTab);bindDynamic()});
  $$("[data-waffle-status]").forEach(b=>b.onclick=()=>{state.waffleStatus=b.dataset.waffleStatus;renderWaffle()});
  $$("[data-status-jump]").forEach(b=>b.onclick=()=>{state.registerStatus=b.dataset.statusJump;state.registerRisk="all";navigate("register")});
  $$("[data-overview-filter]").forEach(b=>b.onclick=()=>{
    const f=b.dataset.overviewFilter;state.registerStatus="all";state.registerRisk="all";
    if(f==="risk")state.registerRisk="high";else if(f!=="all")state.registerStatus=f;
    navigate("register");
  });
  $$("[data-territory-filter]").forEach(b=>b.onclick=()=>{state.territoryFilter=b.dataset.territoryFilter;renderTerritoryIndex()});
  $$("[data-territory-item-status]").forEach(b=>b.onclick=()=>{state.territoryItemStatus=b.dataset.territoryItemStatus;renderTerritoryDetail()});
}
function exportCsv(){
  const rows=[["ID","Title","Workstream","Status","Risk","Owner","Due","Progress"],...registerItems().map(i=>[i.id,i.title,i.workstream,i.status,i.risk,i.owner,i.due,i.progress])];
  const csv=rows.map(r=>r.map(v=>`"${String(v).replaceAll('"','""')}"`).join(",")).join("\n");
  const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv"}));a.download="atlas-register-v25.csv";a.click();URL.revokeObjectURL(a.href);toast("Register exported");
}
function init(){
  $$("[data-view]").forEach(b=>b.addEventListener("click",()=>navigate(b.dataset.view)));
  const mobileMenu=$("#mobileMenu"), mobilePanel=$("#mobileNavPanel"), mobileScrim=$("#mobileNavScrim"), mobileClose=$("#mobileNavClose");
  const closeMobileNav=()=>{mobilePanel?.classList.remove("open");mobilePanel?.setAttribute("aria-hidden","true");mobileMenu?.setAttribute("aria-expanded","false");if(mobileScrim)mobileScrim.hidden=true;document.body.classList.remove("mobile-nav-open")};
  const openMobileNav=()=>{mobilePanel?.classList.add("open");mobilePanel?.setAttribute("aria-hidden","false");mobileMenu?.setAttribute("aria-expanded","true");if(mobileScrim)mobileScrim.hidden=false;document.body.classList.add("mobile-nav-open")};
  if(mobileMenu)mobileMenu.onclick=()=>mobilePanel?.classList.contains("open")?closeMobileNav():openMobileNav();
  if(mobileClose)mobileClose.onclick=closeMobileNav;
  if(mobileScrim)mobileScrim.onclick=closeMobileNav;
  document.addEventListener("keydown",e=>{if(e.key==="Escape")closeMobileNav()});
  $$("#mobileNavPanel [data-view], #mobileNavPanel [data-open-territory]").forEach(b=>b.addEventListener("click",closeMobileNav));
  $("#closeDrawer").onclick=closeDrawer;$("#scrim").onclick=closeDrawer;
  $("#closeItem").onclick=()=>$("#itemModal").hidden=true;
  $("#closeAdd").onclick=()=>$("#addModal").hidden=true;
  const addItemBtn=$("#addItemBtn");if(addItemBtn)addItemBtn.onclick=()=>$("#addModal").hidden=false;
  $("#addWs").innerHTML=DATA.workstreams.map(w=>`<option value="${w.code}">${w.code} · ${w.name}</option>`).join("");
  $("#addForm").onsubmit=e=>{
    e.preventDefault();const f=new FormData(e.target),id=`AT-${String(state.items.length+1).padStart(3,"0")}`;
    state.items.push({id,title:f.get("title"),workstream:f.get("workstream"),status:f.get("status"),risk:"Medium",priority:"P2",owner:f.get("owner"),reviewer:"Sophia Reed",progress:20,due:f.get("due"),milestone:"Prototype input",evidence:`Evidence pack ${id}`,decision:`Decision record ${id}`,summary:"New fully populated prototype item added during the v24 experience review.",nextAction:"Review the new item and confirm its dependency path.",dependencies:[]});
    $("#addModal").hidden=true;e.target.reset();renderOverview();toast(`${id} added to the prototype`);
  };
  const globalSearch=$("#globalSearch");if(globalSearch)globalSearch.onkeydown=e=>{if(e.key==="Enter"){state.search=e.target.value;navigate("register")}};
  const birdMap=$("#birdMap");
  const mapView={x:0,y:0,w:1600,h:940};
  const applyMapView=()=>birdMap?.setAttribute("viewBox",`${mapView.x} ${mapView.y} ${mapView.w} ${mapView.h}`);
  const zoomMap=(factor,cx=mapView.x+mapView.w/2,cy=mapView.y+mapView.h/2)=>{
    const nw=Math.max(420,Math.min(2600,mapView.w*factor));
    const nh=nw*(940/1600);
    const rx=(cx-mapView.x)/mapView.w, ry=(cy-mapView.y)/mapView.h;
    mapView.x=cx-rx*nw; mapView.y=cy-ry*nh; mapView.w=nw; mapView.h=nh; applyMapView();
  };
  birdMap?.addEventListener("wheel",e=>{
    e.preventDefault();
    const r=birdMap.getBoundingClientRect();
    const cx=mapView.x+((e.clientX-r.left)/r.width)*mapView.w;
    const cy=mapView.y+((e.clientY-r.top)/r.height)*mapView.h;
    zoomMap(e.deltaY<0?.88:1.14,cx,cy);
  },{passive:false});
  $("#zoomIn").onclick=()=>zoomMap(.82);
  $("#zoomOut").onclick=()=>zoomMap(1.22);
  $("#mapLayout").onchange=e=>{state.mapLayout=e.target.value;renderMap()};
  $("#mapStatus").onchange=renderMap;
  $("#toggleEdges").onclick=e=>{state.edges=!state.edges;e.currentTarget.classList.toggle("active",state.edges);renderMap()};
  $("#toggleLabels").onclick=e=>{state.labels=!state.labels;e.currentTarget.classList.toggle("active",state.labels);renderMap()};
  $("#fitMap").onclick=()=>{mapView.x=0;mapView.y=0;mapView.w=1600;mapView.h=940;applyMapView()};
  $("#fullscreenMap").onclick=()=>$("#mapShell").requestFullscreen?.();
  $("#exportCsv").onclick=exportCsv;
  document.addEventListener("keydown",e=>{if(e.key==="Escape"){closeDrawer();$("#itemModal").hidden=true;$("#addModal").hidden=true}});
  const initial=location.hash.slice(1);navigate(initial||"overview");
}
document.addEventListener("DOMContentLoaded",init);
})();
