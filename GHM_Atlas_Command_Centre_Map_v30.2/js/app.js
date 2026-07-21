
(()=>{
"use strict";
const APP_VERSION="30.2";
const DATA=window.ATLAS_DATA;
const state={
  view:"overview",items:[...DATA.items],ws:null,territory:"WS001",
  waffleStatus:"all",waffleWs:"all",registerStatus:"all",registerRisk:"all",registerWs:"all",
  search:"",edges:true,labels:true,mapLayout:"dependency",territoryFilter:"all",
  territoryItemStatus:"all",blockMode:"overview",blockStatus:"all",waffleSearch:""
};
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const statusColor={Completed:"#34b56f",Active:"#d99a3c",Review:"#4e8bd8",Blocked:"#d45555",Later:"#8d969f"};
const statusDescription={
  Completed:"Finished and accepted",
  Active:"In active delivery",
  Review:"Awaiting assurance",
  Blocked:"Requires intervention",
  Later:"Scheduled for later"
};
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
function progress(p,color=""){return `<div class="progress" ${color?`style="--progress-color:${color}"`:""}><i style="width:${p}%"></i></div>`}
function toast(msg){const t=$("#toast");t.textContent=msg;t.classList.add("show");clearTimeout(toast.timer);toast.timer=setTimeout(()=>t.classList.remove("show"),2200)}
const overlayBackgroundSelectors=".atlas-rail,.atlas-topbar,main,.ethos-footer";
let drawerLastFocus=null,itemModalLastFocus=null,addModalLastFocus=null;

function overlayFocusable(root){
  if(!root)return[];
  return $$('button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])',root)
    .filter(el=>!el.disabled&&!el.hidden&&el.getAttribute("aria-hidden")!=="true");
}

function setOverlayBackgroundInert(inert){
  $$(overlayBackgroundSelectors).forEach(el=>{
    if(inert)el.setAttribute("inert","");
    else if(!$("#mobileNavPanel")?.classList.contains("open"))el.removeAttribute("inert");
  });
}

function syncOverlayBody(){
  const active=$("#drawer")?.classList.contains("open")||!$("#itemModal")?.hidden||!$("#addModal")?.hidden;
  document.body.classList.toggle("overlay-open",Boolean(active));
  setOverlayBackgroundInert(Boolean(active));
}

function focusOverlay(root){
  requestAnimationFrame(()=>{
    const target=root?.querySelector(".close")||overlayFocusable(root)[0]||root;
    target?.focus();
  });
}

function closeItemModal({restoreFocus=true}={}){
  const modal=$("#itemModal");
  if(!modal||modal.hidden)return;
  modal.hidden=true;
  modal.setAttribute("aria-hidden","true");
  syncOverlayBody();
  if(restoreFocus){
    const target=itemModalLastFocus?.isConnected?itemModalLastFocus:null;
    requestAnimationFrame(()=>target?.focus());
  }
}

function openAddModal(){
  const modal=$("#addModal");
  if(!modal)return;
  addModalLastFocus=document.activeElement;
  modal.hidden=false;
  modal.setAttribute("aria-hidden","false");
  syncOverlayBody();
  focusOverlay(modal);
}

function closeAddModal({restoreFocus=true}={}){
  const modal=$("#addModal");
  if(!modal||modal.hidden)return;
  modal.hidden=true;
  modal.setAttribute("aria-hidden","true");
  syncOverlayBody();
  if(restoreFocus){
    const target=addModalLastFocus?.isConnected?addModalLastFocus:null;
    requestAnimationFrame(()=>target?.focus());
  }
}

function trapActiveOverlay(event){
  const roots=[
    !$("#itemModal")?.hidden?$("#itemModal"):null,
    !$("#addModal")?.hidden?$("#addModal"):null,
    $("#drawer")?.classList.contains("open")?$("#drawer"):null
  ].filter(Boolean);
  const root=roots[0];
  if(!root)return false;
  if(event.key==="Escape"){
    event.preventDefault();
    if(root.id==="itemModal")closeItemModal();
    else if(root.id==="addModal")closeAddModal();
    else closeDrawer();
    return true;
  }
  if(event.key!=="Tab")return false;
  const focusable=overlayFocusable(root);
  if(!focusable.length){
    event.preventDefault();
    root.focus?.();
    return true;
  }
  const first=focusable[0],last=focusable[focusable.length-1];
  if(event.shiftKey&&(document.activeElement===first||!root.contains(document.activeElement))){
    event.preventDefault();last.focus();return true;
  }
  if(!event.shiftKey&&(document.activeElement===last||!root.contains(document.activeElement))){
    event.preventDefault();first.focus();return true;
  }
  return false;
}
function closeDrawer({restoreFocus=true}={}){
  const drawer=$("#drawer"),wasOpen=drawer?.classList.contains("open");
  drawer?.classList.remove("open");
  drawer?.setAttribute("aria-hidden","true");
  drawer?.setAttribute("inert","");
  $("#scrim").hidden=true;
  state.ws=null;
  syncOverlayBody();
  if(restoreFocus&&wasOpen){
    const target=drawerLastFocus?.isConnected?drawerLastFocus:null;
    requestAnimationFrame(()=>target?.focus());
  }
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
const mobileNavBackgroundSelectors=".atlas-rail,.atlas-topbar,main,.ethos-footer,#drawer,#scrim,#itemModal,#addModal";
let mobileNavLastFocus=null;

function setMobileNavBackgroundInert(inert){
  $$(mobileNavBackgroundSelectors).forEach(el=>{
    if(inert)el.setAttribute("inert","");
    else el.removeAttribute("inert");
  });
}

function mobileNavFocusable(){
  const panel=$("#mobileNavPanel");
  if(!panel)return[];
  return $$('button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])',panel)
    .filter(el=>!el.disabled&&!el.hidden&&el.getAttribute("aria-hidden")!=="true");
}

function closeMobileNav({restoreFocus=true}={}){
  const panel=$("#mobileNavPanel"),menu=$("#mobileMenu"),scrim=$("#mobileNavScrim");
  const wasOpen=panel?.classList.contains("open");
  panel?.classList.remove("open");
  panel?.setAttribute("aria-hidden","true");
  panel?.setAttribute("inert","");
  menu?.setAttribute("aria-expanded","false");
  menu?.setAttribute("aria-label","Open navigation");
  if(scrim)scrim.hidden=true;
  document.body.classList.remove("mobile-nav-open");
  setMobileNavBackgroundInert(false);
  if(restoreFocus&&wasOpen){
    const target=mobileNavLastFocus?.isConnected?mobileNavLastFocus:menu;
    requestAnimationFrame(()=>target?.focus());
  }
}

function openMobileNav(){
  const panel=$("#mobileNavPanel"),menu=$("#mobileMenu"),scrim=$("#mobileNavScrim");
  if(!panel||!menu)return;
  mobileNavLastFocus=document.activeElement;
  panel.removeAttribute("inert");
  panel.classList.add("open");
  panel.setAttribute("aria-hidden","false");
  menu.setAttribute("aria-expanded","true");
  menu.setAttribute("aria-label","Close navigation");
  if(scrim)scrim.hidden=false;
  document.body.classList.add("mobile-nav-open");
  setMobileNavBackgroundInert(true);
  requestAnimationFrame(()=>{
    const target=$("#mobileNavClose")||mobileNavFocusable()[0];
    target?.focus();
  });
}

function trapMobileNavFocus(event){
  if($("#drawer")?.classList.contains("open")||!$("#itemModal")?.hidden||!$("#addModal")?.hidden)return;
  const panel=$("#mobileNavPanel");
  if(!panel?.classList.contains("open"))return;
  if(event.key==="Escape"){
    event.preventDefault();
    closeMobileNav();
    return;
  }
  if(event.key!=="Tab")return;
  const focusable=mobileNavFocusable();
  if(!focusable.length){
    event.preventDefault();
    return;
  }
  const first=focusable[0],last=focusable[focusable.length-1];
  if(event.shiftKey&&document.activeElement===first){
    event.preventDefault();last.focus();
  }else if(!event.shiftKey&&document.activeElement===last){
    event.preventDefault();first.focus();
  }
}

function routeHash(view=state.view){
  return view==="territory"
    ?`#territory/${encodeURIComponent(state.territory)}`
    :`#${view}`;
}

function parseRoute(hash=location.hash){
  const raw=String(hash||"").replace(/^#/,"");
  if(!raw)return{view:"overview"};
  const territoryMatch=raw.match(/^territory\/([^/?#]+)$/);
  if(territoryMatch){
    const code=decodeURIComponent(territoryMatch[1]).toUpperCase();
    return wsMap.has(code)?{view:"territory",territory:code}:null;
  }
  if(raw==="territory")return{view:"territory",territory:state.territory};
  return document.querySelector(`[data-page="${raw}"]`)?{view:raw}:null;
}

function pageLabelFor(view){
  const labels={
    overview:"Overview",
    birdseye:"Bird’s-eye",
    structured:"Structured",
    square:"Block",
    waffle:"Waffle",
    territories:"Command Index",
    timeline:"Milestone Horizon",
    register:"Register",
    dependencies:"Dependencies",
    evidence:"Evidence",
    decisions:"Decisions"
  };
  if(view==="territory")return wsMap.get(state.territory)?.name||"Territory";
  return labels[view]||view.charAt(0).toUpperCase()+view.slice(1);
}

function focusActiveRoute(pageLabel,{announce=true}={}){
  const activePage=$(".view.active");
  const target=activePage?.querySelector("h1")||$("#main-content");
  if(!target)return;
  if(target.tagName==="H1")target.setAttribute("tabindex","-1");
  requestAnimationFrame(()=>{
    target.focus({preventScroll:true});
    target.scrollIntoView({block:"start",inline:"nearest",behavior:"auto"});
    if(announce){
      const live=$("#routeAnnouncer");
      if(live){
        live.textContent="";
        requestAnimationFrame(()=>{live.textContent=`${pageLabel} view loaded`;});
      }
    }
  });
}

function navigate(view,{historyMode="push",focus=true,scroll=true,territory=null}={}){
  if(territory&&wsMap.has(territory))state.territory=territory;
  if(!document.querySelector(`[data-page="${view}"]`))view="overview";
  closeMobileNav({restoreFocus:false});
  $("#drawer")?.setAttribute("inert","");
  $("#itemModal")?.setAttribute("aria-hidden","true");
  $("#addModal")?.setAttribute("aria-hidden","true");
  closeDrawer();
  state.view=view;
  $$(".view").forEach(v=>v.classList.toggle("active",v.dataset.page===view));
  markActive();
  const pageLabel=pageLabelFor(view);
  document.title=`${pageLabel} · GHM Atlas Command Centre v${APP_VERSION}`;
  $("#rail")?.classList.remove("open");

  const renderers={
    overview:renderOverview,birdseye:renderMap,structured:renderStructured,square:renderSquare,
    waffle:renderWaffle,territories:renderTerritoryIndex,territory:renderTerritoryDetail,
    timeline:renderTimeline,register:renderRegister,dependencies:renderDependencies,
    evidence:renderEvidence,decisions:renderDecisions
  };
  renderers[view]?.();
  bindDynamic();

  const nextHash=routeHash(view);
  const historyState={view,territory:view==="territory"?state.territory:null};
  if(historyMode==="replace"||location.hash===nextHash){
    history.replaceState(historyState,"",nextHash);
  }else if(historyMode==="push"){
    history.pushState(historyState,"",nextHash);
  }

  if(scroll)window.scrollTo({top:0,left:0,behavior:"auto"});
  if(focus)focusActiveRoute(pageLabel);
}

function openTerritory(code,options={}){
  if(!wsMap.has(code))return;
  state.territory=code;
  state.territoryItemStatus="all";
  navigate("territory",{...options,territory:code});
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
    {label:"All items",value:total,detail:"11 connected territories",wax:"all-items",filter:"all"},
    {label:"Active",value:counts.Active,detail:"In live delivery",wax:"active",filter:"Active"},
    {label:"At risk",value:counts.Risk,detail:"High or critical",wax:"risk",filter:"risk"},
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
  const drawer=$("#drawer");
  drawerLastFocus=document.activeElement;
  state.ws=code;
  $("#drawerContent").innerHTML=drawerHtml(code,tab);
  drawer.removeAttribute("inert");
  drawer.classList.add("open");
  drawer.setAttribute("aria-hidden","false");
  $("#scrim").hidden=false;
  syncOverlayBody();
  bindDynamic();
  focusOverlay(drawer);
}
function openItem(id){
  const i=itemMap().get(id);if(!i)return;
  const w=wsMap.get(i.workstream),deps=i.dependencies.map(x=>itemMap().get(x)).filter(Boolean);
  $("#itemContent").innerHTML=`<p class="eyebrow">${i.id} · ${i.workstream}</p><h2>${esc(i.title)}</h2><p>${esc(i.summary)}</p>
  <div class="drawer-summary"><div><strong>${i.progress}%</strong><span>Progress</span></div><div><strong>${i.priority}</strong><span>Priority</span></div><div><strong>${i.status}</strong><span>Status</span></div><div><strong>${i.risk}</strong><span>Risk</span></div></div>
  <h3>Command information</h3><div class="card"><p><b>Workstream:</b> ${esc(w.name)}</p><p><b>Owner:</b> ${esc(i.owner)} · <b>Reviewer:</b> ${esc(i.reviewer)}</p><p><b>Due:</b> ${fmt(i.due)}</p><p><b>Milestone:</b> ${esc(i.milestone)}</p><p><b>Next action:</b> ${esc(i.nextAction)}</p><p><b>Evidence:</b> ${esc(i.evidence)}</p><p><b>Decision:</b> ${esc(i.decision)}</p></div>
  <h3>Dependencies</h3>${deps.length?deps.map(d=>`<button class="row-item" data-open-item="${d.id}">${chip(d.status)}<div><strong>${esc(d.title)}</strong><br><span>${d.id} · ${d.workstream}</span></div><span>${d.progress}%</span></button>`).join(""):`<div class="card">No blocking dependency. This is a deliberate positive state.</div>`}
  <button class="ghost modal-territory" data-open-territory="${i.workstream}">Open ${esc(w.name)} territory</button>`;
  itemModalLastFocus=document.activeElement;
  const itemModal=$("#itemModal");
  itemModal.hidden=false;
  itemModal.setAttribute("aria-hidden","false");
  syncOverlayBody();
  bindDynamic();
  focusOverlay(itemModal);
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
    const dep=dependencySummary(w.code),h=health(s),hClass=h.toLowerCase().replace(" ","-");
    const healthColor=h==="Critical"?"#d45555":h==="Attention"?"#d99a3c":h==="On track"?"#34b56f":"#4e8bd8";
    return `<article class="territory-card health-state-${hClass}" style="--health:${healthColor}">
      <header>
        <div class="territory-card-title"><img src="${w.icon}" alt=""><div><span class="ws-code">${w.code}</span><h2>${esc(w.name)}</h2><p>${esc(w.description)}</p></div></div>
        <span class="health health-${hClass}">${h}</span>
      </header>
      <div class="territory-metrics">
        <div><strong>${s.progress}%</strong><span>Progress</span></div>
        <div><strong>${s.active}</strong><span>Active</span></div>
        <div class="blocked-metric"><strong>${s.blocked}</strong><span>Blocked</span></div>
        <div><strong>${s.risk}</strong><span>At risk</span></div>
      </div>${progress(s.progress,healthColor)}
      <div class="territory-now"><span>Where we are</span><p>${territoryNarrative(w.code,s)}</p></div>
      <div class="territory-next"><span>Next priority</span><strong>${esc(urgent.title)}</strong><small>${urgent.id} · ${esc(urgent.owner)} · ${fmt(urgent.due)}</small></div>
      <div class="territory-links"><span>${dep.incoming.length} incoming</span><span>${dep.outgoing.length} outgoing</span><span>${a.filter(i=>i.status==="Review").length} reviews</span></div>
      <footer><button class="atlas-cta compact-cta" data-open-territory="${w.code}"><span>Open territory</span><b>→</b></button><button class="atlas-secondary compact-cta" data-open-ws="${w.code}"><span>Quick chamber</span><b>+</b></button></footer>
    </article>`;
  }).join("");
  bindDynamic();
}
function renderTerritoryDetail(){
  const code=state.territory,w=wsMap.get(code),a=byWs(code),s=summary(code),dep=dependencySummary(code);
  const blocked=a.filter(i=>i.status==="Blocked"||i.risk==="Critical").sort((x,y)=>riskOrder[y.risk]-riskOrder[x.risk]||x.due.localeCompare(y.due));
  const next=[...a].filter(i=>i.status!=="Completed").sort((x,y)=>x.due.localeCompare(y.due)).slice(0,7);
  const owners=Object.entries(a.reduce((o,i)=>{(o[i.owner]??=[]).push(i);return o},{})).sort((x,y)=>y[1].length-x[1].length);
  const statusFiltered=a.filter(i=>state.territoryItemStatus==="all"||i.status===state.territoryItemStatus);
  const incoming=dep.incoming.map(c=>wsMap.get(c)).filter(Boolean),outgoing=dep.outgoing.map(c=>wsMap.get(c)).filter(Boolean);
  const h=health(s),hClass=h.toLowerCase().replace(" ","-");
  const healthColor=h==="Critical"?"#d45555":h==="Attention"?"#d99a3c":h==="On track"?"#34b56f":"#4e8bd8";
  $("#territoryDetail").innerHTML=`
    <section class="territory-hero health-state-${hClass}" style="--health:${healthColor}">
      <div class="territory-hero-copy">
        <button class="back-link" data-view="territories">← Command Index</button>
        <p class="eyebrow">${code} · TERRITORY OVERVIEW</p>
        <h1>${esc(w.name)}</h1>
        <span>${esc(w.description)}</span>
        <div class="hero-actions">
          <button class="atlas-cta compact-cta" data-open-ws="${code}"><span>Open quick chamber</span><b>+</b></button>
          <button class="atlas-secondary compact-cta" data-view="birdseye"><span>Locate in Bird’s-eye</span><b>⌖</b></button>
        </div>
      </div>
      <div class="territory-hero-side">
        <img src="${w.icon}" alt="${esc(w.name)} territory emblem">
        <div class="territory-health-panel" data-health="${hClass}"><small>Current health</small><strong>${h}</strong><span>${s.progress}% average progress</span>${progress(s.progress,healthColor)}</div>
      </div>
    </section>
    <div class="territory-kpis">
      <div><span>Total items</span><strong>${s.total}</strong><small>${s.completed} completed</small></div>
      <div><span>Active delivery</span><strong>${s.active}</strong><small>${s.review} in review</small></div>
      <div class="blocked-kpi"><span>Blockers</span><strong>${s.blocked}</strong><small>${s.critical} critical risks</small></div>
      <div><span>Dependencies</span><strong>${dep.incoming.length+dep.outgoing.length}</strong><small>${dep.links.length} item links</small></div>
      <div><span>Owners</span><strong>${owners.length}</strong><small>Lead: ${esc(w.lead||owners[0]?.[0]||"Assigned")}</small></div>
    </div>
    <div class="territory-dashboard">
      <section class="panel territory-state"><div class="panel-head"><div><p class="eyebrow">CURRENT POSITION</p><h2>Where we are</h2></div>${chip(blocked.length?"Active":"Completed")}</div>
        <p class="lead-copy">${territoryNarrative(code,s)}</p>
        <div class="status-distribution">${["Completed","Active","Review","Blocked","Later"].map(st=>`<div><span><i style="background:${statusColor[st]}"></i>${st}</span><strong>${a.filter(i=>i.status===st).length}</strong></div>`).join("")}</div>
      </section>
      <section class="panel"><div class="panel-head"><div><p class="eyebrow">FORWARD ACTION</p><h2>What needs to happen next</h2></div></div>
        ${next.map((i,index)=>`<button class="action-row" data-open-item="${i.id}"><span class="action-rank">${String(index+1).padStart(2,"0")}</span><div><strong>${esc(i.nextAction)}</strong><small>${i.id} · ${esc(i.title)} · ${esc(i.owner)}</small></div><span>${fmt(i.due)}</span></button>`).join("")}
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
      <div class="panel-head"><div><p class="eyebrow">FULL TERRITORY REGISTER</p><h2>${s.total} connected items</h2></div><div class="filters territory-status-filters">${["all","Completed","Active","Review","Blocked","Later"].map(st=>`<button data-territory-item-status="${st}" class="${state.territoryItemStatus===st?"active":""}">${st==="all"?"All":st}</button>`).join("")}</div></div>
      <div class="table-wrap"><table><thead><tr><th>ID</th><th>Item</th><th>Status</th><th>Risk</th><th>Owner</th><th>Next action</th><th>Due</th><th>Progress</th></tr></thead><tbody>
      ${statusFiltered.map(i=>`<tr data-open-item="${i.id}"><td>${i.id}</td><td>${esc(i.title)}</td><td>${chip(i.status)}</td><td>${riskChip(i.risk)}</td><td>${esc(i.owner)}</td><td>${esc(short(i.nextAction,48))}</td><td>${fmt(i.due)}</td><td><strong style="color:${statusColor[i.status]}">${i.progress}%</strong></td></tr>`).join("")}
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
  const statusOrder={Blocked:0,Review:1,Active:2,Later:3,Completed:4};
  const counts=["Completed","Active","Review","Blocked","Later"].map(status=>({
    status,count:state.items.filter(i=>i.status===status).length
  }));
  $("#blockViewControls").innerHTML=`
    <div class="block-mode-switch" role="group" aria-label="Block map view">
      <button data-block-mode="overview" class="${state.blockMode==="overview"?"active":""}">Whole project</button>
      <button data-block-mode="territories" class="${state.blockMode==="territories"?"active":""}">By territory</button>
    </div>
    <div class="block-status-strip" role="group" aria-label="Filter delivery blocks by status">
      <button data-block-status="all" class="status-all ${state.blockStatus==="all"?"active":""}" style="--state:#f3f3f3">
        <i class="block-signal-mark" aria-hidden="true"></i>
        <span class="block-signal-copy"><small>Portfolio view</small><b>All blocks</b><em>Complete programme</em></span>
        <strong>${state.items.length}</strong>
      </button>
      ${counts.map(x=>`<button data-block-status="${x.status}" class="status-${x.status.toLowerCase()} ${state.blockStatus===x.status?"active":""}" style="--state:${statusColor[x.status]}">
        <i class="block-signal-mark" aria-hidden="true"></i>
        <span class="block-signal-copy"><small>Delivery state</small><b>${x.status}</b><em>${statusDescription[x.status]}</em></span>
        <strong>${x.count}</strong>
      </button>`).join("")}
    </div>`;
  const visible=state.items
    .filter(i=>state.blockStatus==="all"||i.status===state.blockStatus)
    .sort((a,b)=>a.workstream.localeCompare(b.workstream)||statusOrder[a.status]-statusOrder[b.status]||a.id.localeCompare(b.id));

  if(state.blockMode==="overview"){
    $("#squareGrid").className="square-grid project-block-overview";
    $("#squareGrid").innerHTML=`<section class="project-block-field">
      <header><div><p class="eyebrow">WHOLE PROJECT</p><h2>${visible.length} visible delivery blocks</h2><span>Ordered by territory and delivery state. Select any block to inspect the item.</span></div><div class="project-block-key">${["Completed","Active","Review","Blocked","Later"].map(st=>`<span><i style="--state:${statusColor[st]}"></i>${st}</span>`).join("")}</div></header>
      <div class="project-block-grid">${visible.map(i=>`<button class="project-block status-${i.status.toLowerCase()}" data-open-item="${i.id}" style="--state:${statusColor[i.status]}" data-tip="${esc(i.id+" · "+i.title+" · "+i.status+" · "+i.progress+"%")}" aria-label="${esc(i.id+" "+i.title+", "+i.status+", "+i.progress+" percent")}"><span>${i.id}</span></button>`).join("")}</div>
      <footer><span>Blocks are grouped by workstream, then ordered Blocked → Review → Active → Later → Completed.</span><button data-block-mode="territories">Open territory sections</button></footer>
    </section>`;
  }else{
    $("#squareGrid").className="square-grid territory-block-grid";
    $("#squareGrid").innerHTML=DATA.workstreams.map(w=>{
      const a=byWs(w.code)
        .filter(i=>state.blockStatus==="all"||i.status===state.blockStatus)
        .sort((x,y)=>statusOrder[x.status]-statusOrder[y.status]||x.id.localeCompare(y.id));
      const s=summary(w.code);
      return `<section class="block-card health-state-${health(s).toLowerCase().replace(" ","-")}">
        <button class="block-head" data-open-territory="${w.code}">
          <img src="${w.icon}" alt="">
          <div><span>${w.code}</span><h3>${esc(w.name)}</h3><small>${esc(w.description)}</small></div>
          <b aria-hidden="true">→</b>
        </button>
        <div class="block-stats">
          <div><strong>${s.total}</strong><span>Items</span></div>
          <div><strong>${s.progress}%</strong><span>Progress</span></div>
          <div class="blocked-stat"><strong>${s.blocked}</strong><span>Blocked</span></div>
        </div>
        <div class="mini-items">${a.map(i=>`<button data-open-item="${i.id}" style="--state:${statusColor[i.status]}" data-tip="${esc(i.id+" · "+i.title+" · "+i.status+" · "+i.progress+"%")}" aria-label="${esc(i.id+" "+i.title+", "+i.status+", "+i.progress+" percent")}"></button>`).join("")}</div>
        <div class="block-footer"><span>${s.review} in review</span><span>${s.risk} at risk</span><button data-open-territory="${w.code}">Open territory</button></div>
      </section>`;
    }).join("");
  }
  bindDynamic();
}
function renderWaffle(){
  const statuses=["all","Completed","Active","Review","Blocked","Later"];
  $("#waffleFilters").innerHTML=`
    <div class="waffle-search">
      <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M16 16l5 5"/></svg>
      <input id="waffleSearch" type="search" value="${esc(state.waffleSearch)}" placeholder="Search items, owners or IDs" aria-label="Search waffle items">
    </div>
    <div class="waffle-status-icons" role="group" aria-label="Quick status views">
      ${statuses.map(s=>`<button data-waffle-status="${s}" class="${state.waffleStatus===s?"active":""}" title="${s==="all"?"All statuses":s}"><i style="--status:${s==="all"?"#f3f3f3":statusColor[s]}"></i><span>${s==="all"?"All":s}</span></button>`).join("")}
    </div>
    <select id="waffleWs"><option value="all">All workstreams</option>${DATA.workstreams.map(w=>`<option value="${w.code}" ${state.waffleWs===w.code?"selected":""}>${w.code} · ${esc(w.name)}</option>`).join("")}</select>`;
  const q=state.waffleSearch.trim().toLowerCase();
  const a=state.items.filter(i=>
    (state.waffleStatus==="all"||i.status===state.waffleStatus)&&
    (state.waffleWs==="all"||i.workstream===state.waffleWs)&&
    (!q||[i.id,i.title,i.owner,i.workstream,i.status].some(v=>String(v).toLowerCase().includes(q)))
  );
  $("#waffleGrid").innerHTML=a.map(i=>{
    const w=wsMap.get(i.workstream);
    return `<button class="waffle-item status-${i.status.toLowerCase()}" data-open-item="${i.id}" style="--state:${statusColor[i.status]}" title="${esc(i.summary)}">
      <img src="${w.icon}" alt="">
      <b>${i.id} · ${i.workstream}</b>
      <strong>${esc(short(i.title,58))}</strong>
      <span>${i.status} · ${i.progress}% · ${esc(i.owner)}</span>
      ${progress(i.progress,statusColor[i.status])}
    </button>`;
  }).join("")||`<div class="empty-state"><h3>No items match this view</h3><p>Clear a status, workstream or search filter to see more of the Atlas.</p></div>`;
  $("#waffleWs").onchange=e=>{state.waffleWs=e.target.value;renderWaffle()};
  const search=$("#waffleSearch");
  if(search)search.oninput=e=>{state.waffleSearch=e.target.value;clearTimeout(renderWaffle.searchTimer);renderWaffle.searchTimer=setTimeout(renderWaffle,140)};
  bindDynamic();
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
  const grouped=[...state.items].reduce((map,item)=>{
    const key=item.milestone||"Unassigned milestone";
    (map[key]??=[]).push(item);return map;
  },{});
  const groups=Object.entries(grouped).map(([name,items])=>({
    name,items:[...items].sort((a,b)=>a.due.localeCompare(b.due)),
    due:[...items].sort((a,b)=>a.due.localeCompare(b.due))[0]?.due,
    progress:avg(items.map(i=>i.progress)),
    blocked:items.filter(i=>i.status==="Blocked").length,
    review:items.filter(i=>i.status==="Review").length,
    completed:items.filter(i=>i.status==="Completed").length
  })).sort((a,b)=>a.due.localeCompare(b.due));
  const overdue=state.items.filter(i=>new Date(i.due)<new Date()&&i.status!=="Completed").length;
  const upcoming=[...state.items].filter(i=>i.status!=="Completed").sort((a,b)=>a.due.localeCompare(b.due)).slice(0,5);
  $("#timeline").innerHTML=`
    <section class="milestone-summary">
      <div><span>Milestone groups</span><strong>${groups.length}</strong><small>Across all 11 territories</small></div>
      <div><span>Open items</span><strong>${state.items.filter(i=>i.status!=="Completed").length}</strong><small>Active delivery horizon</small></div>
      <div class="${overdue?"attention":""}"><span>Past due</span><strong>${overdue}</strong><small>Needs confirmation or closure</small></div>
      <div><span>Average progress</span><strong>${avg(state.items.map(i=>i.progress))}%</strong><small>Whole programme</small></div>
    </section>
    <section class="milestone-layout">
      <div class="milestone-groups">
        ${groups.map(g=>`<article class="milestone-card ${g.blocked?"has-blocker":""}">
          <header><div><p class="eyebrow">${fmt(g.due)} · ${g.items.length} ITEMS</p><h2>${esc(g.name)}</h2></div><strong>${g.progress}%</strong></header>
          ${progress(g.progress,g.blocked?statusColor.Blocked:"#34b56f")}
          <div class="milestone-stats"><span>${g.completed} complete</span><span>${g.review} review</span><span>${g.blocked} blocked</span></div>
          <div class="milestone-items">${g.items.slice(0,4).map(i=>`<button data-open-item="${i.id}"><i style="--state:${statusColor[i.status]}"></i><span><b>${i.id}</b>${esc(short(i.title,48))}</span><em>${fmt(i.due)}</em></button>`).join("")}</div>
        </article>`).join("")}
      </div>
      <aside class="milestone-next">
        <p class="eyebrow">NEXT DATED ACTIONS</p><h2>What is approaching</h2>
        ${upcoming.map(i=>`<button data-open-item="${i.id}"><span>${fmt(i.due)}</span><strong>${esc(i.nextAction)}</strong><small>${i.id} · ${esc(wsMap.get(i.workstream).name)}</small></button>`).join("")}
      </aside>
    </section>`;
  bindDynamic();
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
  const a=state.items.filter(i=>i.dependencies.length>0).sort((x,y)=>y.dependencies.length-x.dependencies.length||riskOrder[y.risk]-riskOrder[x.risk]).slice(0,120),m=itemMap();
  const cross=a.filter(i=>i.dependencies.some(d=>m.get(d)?.workstream!==i.workstream)).length;
  const blocked=a.filter(i=>i.status==="Blocked").length;
  $("#dependencyList").innerHTML=`
    <section class="command-summary-grid">
      <div><span>Connected items</span><strong>${a.length}</strong><small>With one or more dependencies</small></div>
      <div><span>Cross-territory chains</span><strong>${cross}</strong><small>Links between workstreams</small></div>
      <div class="critical"><span>Blocked chains</span><strong>${blocked}</strong><small>Require active intervention</small></div>
    </section>
    <section class="command-card-grid">
      ${a.map(i=>{
        const deps=i.dependencies.map(d=>m.get(d)).filter(Boolean);
        return `<button class="command-card dependency-card" data-open-item="${i.id}">
          <header><span class="ws-code">${i.id} · ${i.workstream}</span>${chip(i.status)}</header>
          <h3>${esc(i.title)}</h3>
          <div class="dependency-chain">${deps.slice(0,3).map((d,index)=>`<span><i style="--state:${statusColor[d.status]}"></i>${d.id}<small>${esc(short(d.title,28))}</small></span>${index<Math.min(2,deps.length-1)?"<b>→</b>":""}`).join("")}</div>
          <footer><span>${deps.length} dependencies</span><span>${i.progress}% progress</span><span>${esc(i.owner)}</span></footer>
        </button>`;
      }).join("")}
    </section>`;
  bindDynamic();
}
function renderEvidence(){
  const approved=state.items.filter(i=>i.status==="Completed").length;
  const review=state.items.filter(i=>i.status==="Review").length;
  $("#evidenceGrid").innerHTML=`
    <section class="command-summary-grid">
      <div><span>Evidence records</span><strong>${state.items.length}</strong><small>One connected record per item</small></div>
      <div><span>Approved</span><strong>${approved}</strong><small>Completed and accepted</small></div>
      <div class="review"><span>In assurance</span><strong>${review}</strong><small>Awaiting review or sign-off</small></div>
    </section>
    <section class="command-card-grid">
      ${state.items.slice(0,160).map(i=>`<button class="command-card evidence-card" data-open-item="${i.id}">
        <header><span class="ws-code">${i.workstream} · ${i.id}</span><span class="evidence-state ${i.status==="Completed"?"approved":"open"}">${i.status==="Completed"?"Approved":"In assurance"}</span></header>
        <h3>${esc(i.evidence)}</h3>
        <p>${esc(i.summary)}</p>
        <footer><span>${esc(i.reviewer)}</span><span>${fmt(i.due)}</span></footer>
      </button>`).join("")}
    </section>`;
  bindDynamic();
}
function renderDecisions(){
  const open=state.items.filter(i=>i.status!=="Completed").length;
  const critical=state.items.filter(i=>i.risk==="Critical").length;
  $("#decisionGrid").innerHTML=`
    <section class="command-summary-grid">
      <div><span>Decision records</span><strong>${state.items.length}</strong><small>Connected to every item</small></div>
      <div><span>Open decisions</span><strong>${open}</strong><small>Still shaping delivery</small></div>
      <div class="critical"><span>Critical risk</span><strong>${critical}</strong><small>Decisions with highest urgency</small></div>
    </section>
    <section class="command-card-grid">
      ${state.items.slice(0,160).map(i=>`<button class="command-card decision-card" data-open-item="${i.id}">
        <header><span class="ws-code">${i.priority} · ${i.id}</span>${riskChip(i.risk)}</header>
        <h3>${esc(i.decision)}</h3>
        <p>${esc(i.nextAction)}</p>
        <footer>${chip(i.status)}<span>${fmt(i.due)}</span><span>${esc(i.owner)}</span></footer>
      </button>`).join("")}
    </section>`;
  bindDynamic();
}

let atlasTooltip=null,atlasTooltipTarget=null;
function ensureAtlasTooltip(){
  if(atlasTooltip)return atlasTooltip;
  atlasTooltip=document.createElement("div");
  atlasTooltip.id="atlasTooltip";
  atlasTooltip.className="atlas-tooltip";
  atlasTooltip.setAttribute("role","tooltip");
  document.body.appendChild(atlasTooltip);
  return atlasTooltip;
}
function positionAtlasTooltip(target){
  if(!atlasTooltip||!target)return;
  const r=target.getBoundingClientRect(),t=atlasTooltip.getBoundingClientRect(),pad=12;
  let left=r.left+r.width/2-t.width/2;
  left=Math.max(pad,Math.min(window.innerWidth-t.width-pad,left));
  let top=r.top-t.height-10;
  if(top<pad)top=r.bottom+10;
  if(top+t.height>window.innerHeight-pad)top=Math.max(pad,window.innerHeight-t.height-pad);
  atlasTooltip.style.left=`${Math.round(left)}px`;
  atlasTooltip.style.top=`${Math.round(top)}px`;
}
function showAtlasTooltip(target){
  const text=target?.dataset?.tip;
  if(!text)return;
  const tip=ensureAtlasTooltip();
  atlasTooltipTarget=target;
  const parts=text.split(" · ");
  tip.innerHTML=parts.length>1?`<b>${esc(parts.shift())}</b>${esc(parts.join(" · "))}`:esc(text);
  target.setAttribute("aria-describedby",tip.id);
  tip.classList.add("visible");
  requestAnimationFrame(()=>positionAtlasTooltip(target));
}
function hideAtlasTooltip(target=null){
  if(!atlasTooltip)return;
  if(target&&atlasTooltipTarget!==target)return;
  atlasTooltipTarget?.removeAttribute("aria-describedby");
  atlasTooltipTarget=null;
  atlasTooltip.classList.remove("visible");
}
function initAtlasTooltips(){
  ensureAtlasTooltip();
  document.addEventListener("mouseover",e=>{
    const target=e.target.closest?.("[data-tip]");
    if(!target||target.contains(e.relatedTarget))return;
    showAtlasTooltip(target);
  });
  document.addEventListener("mouseout",e=>{
    const target=e.target.closest?.("[data-tip]");
    if(!target||target.contains(e.relatedTarget))return;
    hideAtlasTooltip(target);
  });
  document.addEventListener("focusin",e=>{
    const target=e.target.closest?.("[data-tip]");
    if(target)showAtlasTooltip(target);
  });
  document.addEventListener("focusout",e=>{
    const target=e.target.closest?.("[data-tip]");
    if(target)hideAtlasTooltip(target);
  });
  document.addEventListener("pointerdown",()=>hideAtlasTooltip(),{passive:true});
  window.addEventListener("scroll",()=>hideAtlasTooltip(),{passive:true});
  window.addEventListener("resize",()=>hideAtlasTooltip(),{passive:true});
}

function bindDynamic(){
  $$("[data-view]").forEach(b=>b.onclick=e=>{e.stopPropagation();navigate(b.dataset.view)});
  $$("[data-open-ws]").forEach(b=>b.onclick=e=>{e.stopPropagation();openDrawer(b.dataset.openWs)});
  $$("[data-open-territory]").forEach(b=>b.onclick=e=>{e.stopPropagation();closeItemModal({restoreFocus:false});closeDrawer({restoreFocus:false});openTerritory(b.dataset.openTerritory)});
  $$("[data-open-item]").forEach(b=>b.onclick=()=>openItem(b.dataset.openItem));
  $$("[data-drawer-tab]").forEach(b=>b.onclick=()=>{$("#drawerContent").innerHTML=drawerHtml(state.ws,b.dataset.drawerTab);bindDynamic()});
  $$("[data-waffle-status]").forEach(b=>b.onclick=()=>{state.waffleStatus=b.dataset.waffleStatus;renderWaffle()});
  $$("[data-block-mode]").forEach(b=>b.onclick=()=>{state.blockMode=b.dataset.blockMode;renderSquare()});
  $$("[data-block-status]").forEach(b=>b.onclick=()=>{state.blockStatus=b.dataset.blockStatus;renderSquare()});
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
  history.scrollRestoration="manual";
  initAtlasTooltips();
  bindDynamic();

  const loader=$("#atlasLoader");
  const loaderStart=performance.now();
  const hideLoader=()=>{
    const remaining=Math.max(0,1050-(performance.now()-loaderStart));
    setTimeout(()=>loader?.classList.add("is-hidden"),remaining);
  };
  if(document.readyState==="complete")hideLoader();
  else window.addEventListener("load",hideLoader,{once:true});
  setTimeout(hideLoader,3400);

  const mobileMenu=$("#mobileMenu"),mobilePanel=$("#mobileNavPanel"),mobileScrim=$("#mobileNavScrim"),mobileClose=$("#mobileNavClose");
  closeMobileNav({restoreFocus:false});
  $("#drawer")?.setAttribute("inert","");
  $("#itemModal")?.setAttribute("aria-hidden","true");
  $("#addModal")?.setAttribute("aria-hidden","true");
  if(mobileMenu)mobileMenu.onclick=()=>mobilePanel?.classList.contains("open")?closeMobileNav():openMobileNav();
  if(mobileClose)mobileClose.onclick=()=>closeMobileNav();
  if(mobileScrim)mobileScrim.onclick=()=>closeMobileNav();
  document.addEventListener("keydown",trapMobileNavFocus);
  $$("#mobileNavPanel [data-view],#mobileNavPanel [data-open-territory]").forEach(
    b=>b.addEventListener("click",()=>closeMobileNav({restoreFocus:false}))
  );
  window.addEventListener("resize",()=>{
    if(window.innerWidth>970&&mobilePanel?.classList.contains("open"))closeMobileNav({restoreFocus:false});
  },{passive:true});

  const skipLink=$("#skipLink");
  if(skipLink)skipLink.onclick=e=>{
    e.preventDefault();
    focusActiveRoute(pageLabelFor(state.view),{announce:false});
  };

  const restoreRouteFromLocation=()=>{
    const route=parseRoute(location.hash);
    if(!route)return;
    const sameView=state.view===route.view;
    const sameTerritory=route.view!=="territory"||state.territory===route.territory;
    if(sameView&&sameTerritory)return;
    navigate(route.view,{
      historyMode:"none",
      focus:true,
      scroll:true,
      territory:route.territory||null
    });
  };
  window.addEventListener("popstate",restoreRouteFromLocation);
  window.addEventListener("hashchange",restoreRouteFromLocation);

  $("#closeDrawer").onclick=()=>closeDrawer();$("#scrim").onclick=()=>closeDrawer();
  $("#closeItem").onclick=()=>closeItemModal();
  $("#closeAdd").onclick=()=>closeAddModal();
  $("#itemModal").addEventListener("mousedown",e=>{if(e.target===e.currentTarget)closeItemModal()});
  $("#addModal").addEventListener("mousedown",e=>{if(e.target===e.currentTarget)closeAddModal()});
  const addItemBtn=$("#addItemBtn");if(addItemBtn)addItemBtn.onclick=openAddModal;
  $("#addWs").innerHTML=DATA.workstreams.map(w=>`<option value="${w.code}">${w.code} · ${w.name}</option>`).join("");
  $("#addForm").onsubmit=e=>{
    e.preventDefault();const f=new FormData(e.target),id=`AT-${String(state.items.length+1).padStart(3,"0")}`;
    state.items.push({id,title:f.get("title"),workstream:f.get("workstream"),status:f.get("status"),risk:"Medium",priority:"P2",owner:f.get("owner"),reviewer:"Sophia Reed",progress:20,due:f.get("due"),milestone:"Prototype input",evidence:`Evidence pack ${id}`,decision:`Decision record ${id}`,summary:"New fully populated prototype item added during the v30 experience review.",nextAction:"Review the new item and confirm its dependency path.",dependencies:[]});
    closeAddModal({restoreFocus:false});e.target.reset();renderOverview();toast(`${id} added to the prototype`);
  };
  const globalSearch=$("#globalSearch");if(globalSearch)globalSearch.onkeydown=e=>{if(e.key==="Enter"){state.search=e.target.value;navigate("register")}};

  const birdMap=$("#birdMap");
  const mapView={x:0,y:0,w:1600,h:940};
  const applyMapView=()=>birdMap?.setAttribute("viewBox",`${mapView.x} ${mapView.y} ${mapView.w} ${mapView.h}`);
  const zoomMap=(factor,cx=mapView.x+mapView.w/2,cy=mapView.y+mapView.h/2)=>{
    const nw=Math.max(380,Math.min(2600,mapView.w*factor));
    const nh=nw*(940/1600);
    const rx=(cx-mapView.x)/mapView.w,ry=(cy-mapView.y)/mapView.h;
    mapView.x=cx-rx*nw;mapView.y=cy-ry*nh;mapView.w=nw;mapView.h=nh;applyMapView();
  };
  const fitMap=()=>{mapView.x=0;mapView.y=0;mapView.w=1600;mapView.h=940;applyMapView()};
  birdMap?.addEventListener("wheel",e=>{
    e.preventDefault();
    const r=birdMap.getBoundingClientRect();
    const cx=mapView.x+((e.clientX-r.left)/r.width)*mapView.w;
    const cy=mapView.y+((e.clientY-r.top)/r.height)*mapView.h;
    zoomMap(e.deltaY<0?.88:1.14,cx,cy);
  },{passive:false});

  if(birdMap){
    birdMap.style.touchAction="none";
    const pointers=new Map();
    let lastPinch=null,lastPan=null,dragged=false;
    const pointInMap=e=>{
      const r=birdMap.getBoundingClientRect();
      return {x:e.clientX,y:e.clientY,mapX:mapView.x+((e.clientX-r.left)/r.width)*mapView.w,mapY:mapView.y+((e.clientY-r.top)/r.height)*mapView.h,r};
    };
    birdMap.addEventListener("pointerdown",e=>{
      if(e.pointerType==="mouse"&&e.button!==0)return;
      birdMap.setPointerCapture?.(e.pointerId);
      pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
      dragged=false;
      if(pointers.size===1)lastPan={x:e.clientX,y:e.clientY};
      if(pointers.size===2){
        const p=[...pointers.values()];
        lastPinch={distance:Math.hypot(p[1].x-p[0].x,p[1].y-p[0].y)};
      }
    });
    birdMap.addEventListener("pointermove",e=>{
      if(!pointers.has(e.pointerId))return;
      e.preventDefault();
      pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
      const r=birdMap.getBoundingClientRect();
      if(pointers.size===2){
        const p=[...pointers.values()];
        const distance=Math.hypot(p[1].x-p[0].x,p[1].y-p[0].y);
        const centerX=(p[0].x+p[1].x)/2,centerY=(p[0].y+p[1].y)/2;
        if(lastPinch?.distance){
          const cx=mapView.x+((centerX-r.left)/r.width)*mapView.w;
          const cy=mapView.y+((centerY-r.top)/r.height)*mapView.h;
          zoomMap(Math.max(.82,Math.min(1.22,lastPinch.distance/distance)),cx,cy);
        }
        lastPinch={distance};lastPan=null;dragged=true;
      }else if(pointers.size===1&&lastPan){
        const dx=e.clientX-lastPan.x,dy=e.clientY-lastPan.y;
        if(Math.abs(dx)+Math.abs(dy)>3)dragged=true;
        mapView.x-=dx/r.width*mapView.w;
        mapView.y-=dy/r.height*mapView.h;
        lastPan={x:e.clientX,y:e.clientY};applyMapView();
      }
    },{passive:false});
    const release=e=>{
      pointers.delete(e.pointerId);
      lastPinch=null;
      if(pointers.size===1){
        const p=[...pointers.values()][0];
        lastPan={x:p.x,y:p.y};
      }else lastPan=null;
      setTimeout(()=>{dragged=false},60);
    };
    birdMap.addEventListener("pointerup",release);
    birdMap.addEventListener("pointercancel",release);
    birdMap.addEventListener("click",e=>{if(dragged){e.preventDefault();e.stopImmediatePropagation()}},true);
    birdMap.addEventListener("contextmenu",e=>e.preventDefault());
  }

  $("#zoomIn").onclick=()=>zoomMap(.82);
  $("#zoomOut").onclick=()=>zoomMap(1.22);
  $("#mapLayout").onchange=e=>{state.mapLayout=e.target.value;renderMap()};
  $("#mapStatus").onchange=e=>{
    $("#quickAll")?.classList.toggle("active",e.target.value==="all");
    $("#quickBlocked")?.classList.toggle("active",e.target.value==="Blocked");
    renderMap();
  };
  $("#quickAll").onclick=()=>{
    $("#mapStatus").value="all";$("#quickAll").classList.add("active");$("#quickBlocked").classList.remove("active");renderMap();
  };
  $("#quickBlocked").onclick=()=>{
    $("#mapStatus").value="Blocked";$("#quickBlocked").classList.add("active");$("#quickAll").classList.remove("active");renderMap();
  };
  $("#toggleEdges").onclick=e=>{state.edges=!state.edges;e.currentTarget.classList.toggle("active",state.edges);renderMap()};
  $("#toggleLabels").onclick=e=>{state.labels=!state.labels;e.currentTarget.classList.toggle("active",state.labels);renderMap()};
  $("#fitMap").onclick=fitMap;
  $("#fullscreenMap").onclick=()=>$("#mapShell").requestFullscreen?.();
  $("#exportCsv").onclick=exportCsv;
  document.addEventListener("keydown",e=>{
    if(trapActiveOverlay(e))return;
    if(e.key==="Escape")closeMobileNav();
  });

  const initial=parseRoute(location.hash)||{view:"overview"};
  navigate(initial.view,{
    historyMode:"replace",
    focus:false,
    scroll:false,
    territory:initial.territory||null
  });
}
document.addEventListener("DOMContentLoaded",init);
})();
