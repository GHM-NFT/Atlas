
(()=>{
"use strict";
const APP_VERSION="31+ RC2";
const DATA=window.ATLAS_DATA;
const INTERNAL=window.ATLAS_INTERNAL_DATA||{meta:{},territories:[],milestones:[],dependencies:[],evidence:[],decisions:[],risksBlockers:[],documents:[],allRecords:[],validationIssues:[],unresolvedIssues:[],territoryEdges:[],authorityNotes:[]};
const state={
  view:"overview",items:[...DATA.items],ws:null,territory:"WS001",
  waffleStatus:"all",waffleWs:"all",registerStatus:"all",registerRisk:"all",registerWs:"all",
  search:"",edges:true,labels:true,mapLayout:"dependency",territoryFilter:"all",
  territoryItemStatus:"all",blockMode:"overview",blockStatus:"all",waffleSearch:"",
  waffleSort:"territory",internalTab:"summary",internalSeverity:"all",
  internalTerritory:"all",internalType:"all",internalSearch:"",
  territorySearch:"",
  milestoneSearch:"",milestoneStatus:"all",milestoneTerritory:"all",
  dependencySearch:"",dependencyRisk:"all",dependencyTerritory:"all",
  evidenceSearch:"",evidenceStatus:"all",evidenceTerritory:"all",
  decisionSearch:"",decisionStatus:"all",decisionTerritory:"all",
  mapSelection:null
};
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const statusColor={Completed:"#34b56f",Active:"#d99a3c",Review:"#4e8bd8",Blocked:"#d45555",Later:"#8d969f","At risk":"#5d6873"};
const statusDescription={
  Completed:"Finished and accepted",
  Active:"In active delivery",
  "At risk":"High or critical risk",
  Review:"Awaiting assurance",
  Blocked:"Requires intervention",
  Later:"Scheduled for later"
};
const riskOrder={Low:0,Medium:1,High:2,Critical:3};
const visualOrder={Blocked:0,"At risk":1,Review:2,Active:3,Later:4,Completed:5};
const itemVisualState=i=>i.status==="Blocked"?"Blocked":(i.status!=="Completed"&&riskOrder[i.risk]>=2?"At risk":i.status);
const knownProgress=i=>Boolean(i&&i.progressKnown&&Number.isFinite(Number(i.progress)));
const progressLabel=i=>knownProgress(i)?`${Math.round(Number(i.progress))}%`:"Not recorded";
const dateValue=d=>d&&/^\d{4}-\d{2}-\d{2}/.test(String(d))?String(d).slice(0,10):"";
const dateLabel=d=>dateValue(d)?fmt(dateValue(d)):"Not recorded";
const sortDate=d=>dateValue(d)||"9999-12-31";
const severityColor=s=>({Critical:"#ff7b6f",High:"#e39c62",Medium:"#d6b55a",Low:"#70b7d9"}[s]||"#8d969f");
const territoryFromId=id=>{
  const value=String(id??"").trim();
  const workstream=DATA.workstreams.find(w=>w.code===value||w.territoryId===value||w.name===value);
  if(workstream)return workstream.code;
  const territory=INTERNAL.territories.find(t=>t.territory_id===value||t.territory_name===value||t.territory_short_name===value);
  if(!territory)return"";
  return DATA.workstreams.find(w=>w.territoryId===territory.territory_id||w.name===territory.territory_name||w.name===territory.territory_short_name)?.code||"";
};
const wsMap=new Map(DATA.workstreams.map(w=>[w.code,w]));
const itemMap=()=>new Map(state.items.map(i=>[i.id,i]));
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
const short=(s,n=42)=>String(s).length>n?String(s).slice(0,n-1)+"…":String(s);
const fmt=d=>{
  const value=dateValue(d);
  if(!value)return"Not recorded";
  return new Intl.DateTimeFormat("en-GB",{day:"2-digit",month:"short",year:"numeric"}).format(new Date(value+"T12:00:00"));
};
const avg=a=>{
  const values=a.map(Number).filter(Number.isFinite);
  return values.length?Math.round(values.reduce((x,y)=>x+y,0)/values.length):null;
};
const byWs=code=>state.items.filter(i=>i.workstream===code);
const summary=code=>{
  const a=byWs(code);
  const known=a.filter(knownProgress);
  return {
    total:a.length,completed:a.filter(i=>i.status==="Completed").length,
    active:a.filter(i=>i.status==="Active").length,review:a.filter(i=>i.status==="Review").length,
    blocked:a.filter(i=>i.status==="Blocked").length,later:a.filter(i=>i.status==="Later").length,
    atRisk:a.filter(i=>itemVisualState(i)==="At risk").length,
    risk:a.filter(i=>riskOrder[i.risk]>=2).length,critical:a.filter(i=>i.risk==="Critical").length,
    progress:known.length?avg(known.map(i=>i.progress)):null,progressKnown:known.length>0
  };
};
const health=s=>s.blocked>2||s.critical>1?"Critical":s.risk>5||s.blocked>0?"Attention":s.progressKnown&&s.progress>78?"On track":"In progress";
function chip(status){return `<span class="status-chip" style="--chip:${statusColor[status]}">${esc(status)}</span>`}
function riskChip(risk){const c={Low:"#7c8790",Medium:"#d99a3c",High:"#d46954",Critical:"#d45555"}[risk];return `<span class="risk-chip" style="--risk:${c}">${esc(risk)}</span>`}
function progress(p,color="",known=true){
  const value=Number(p);
  if(known===false||!Number.isFinite(value)){
    return `<div class="progress unknown" ${color?`style="--progress-color:${color}"`:""}><i></i><span>Not recorded</span></div>`;
  }
  const safe=Math.max(0,Math.min(100,value));
  return `<div class="progress" ${color?`style="--progress-color:${color}"`:""}><i style="width:${safe}%"></i></div>`;
}
function toast(msg){const t=$("#toast");t.textContent=msg;t.classList.add("show");clearTimeout(toast.timer);toast.timer=setTimeout(()=>t.classList.remove("show"),2200)}
const overlayBackgroundSelectors=".atlas-rail,.atlas-topbar,main,.ethos-footer";
let drawerLastFocus=null,itemModalLastFocus=null;

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
  const active=$("#drawer")?.classList.contains("open")||!$("#itemModal")?.hidden;
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


function trapActiveOverlay(event){
  const roots=[
    !$("#itemModal")?.hidden?$("#itemModal"):null,
    $("#drawer")?.classList.contains("open")?$("#drawer"):null
  ].filter(Boolean);
  const root=roots[0];
  if(!root)return false;
  if(event.key==="Escape"){
    event.preventDefault();
    if(root.id==="itemModal")closeItemModal();
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
const mobileNavBackgroundSelectors=".atlas-rail,.atlas-topbar,main,.ethos-footer,#drawer,#scrim,#itemModal";
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
  if($("#drawer")?.classList.contains("open")||!$("#itemModal")?.hidden)return;
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
    timeline:"Milestones",
    register:"Register",
    dependencies:"Dependencies",
    evidence:"Evidence",
    decisions:"Decisions",
    internal:"Internal audit"
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
  closeItemModal({restoreFocus:false});
  closeDrawer({restoreFocus:false});
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
    evidence:renderEvidence,decisions:renderDecisions,internal:renderInternal
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
  state.overviewTerritory=state.overviewTerritory||"WS001";
  state.overviewItemStatus=state.overviewItemStatus||"all";
  const visualCounts=["Completed","Active","At risk","Blocked","Review","Later"].reduce((out,status)=>{
    out[status]=all.filter(item=>itemVisualState(item)===status).length;
    return out;
  },{});
  const signals=[
    {label:"All items",value:total,detail:"11 connected territories",wax:"all-items",filter:"all",color:"#f3f3f3"},
    {label:"Active",value:visualCounts.Active,detail:"In live delivery",wax:"active",filter:"Active",color:statusColor.Active},
    {label:"At risk",value:visualCounts["At risk"],detail:"High or critical risk",wax:"risk",filter:"risk",color:statusColor["At risk"]},
    {label:"Blocked",value:visualCounts.Blocked,detail:"Needs intervention",wax:"blocked",filter:"Blocked",color:statusColor.Blocked},
    {label:"Review",value:visualCounts.Review,detail:"Awaiting assurance",wax:"review",filter:"Review",color:statusColor.Review},
    {label:"Completed",value:visualCounts.Completed,detail:`${total?Math.round(visualCounts.Completed/total*100):0}% of work items`,wax:"completed",filter:"Completed",color:statusColor.Completed}
  ];
  $("#overviewSignals").innerHTML=signals.map(signal=>`<button class="signal-card signal-${signal.filter.toLowerCase().replace(" ","-")}" style="--signal:${signal.color}" data-overview-filter="${signal.filter}" type="button">
    <img src="assets/wax/${signal.wax}.png" alt="">
    <span><small>${signal.label}</small><strong>${signal.value}</strong><em>${signal.detail}</em></span>
  </button>`).join("");

  const ordered=[...all].sort((a,b)=>visualOrder[itemVisualState(a)]-visualOrder[itemVisualState(b)]||a.workstream.localeCompare(b.workstream)||a.id.localeCompare(b.id));
  $("#overviewVisibleCount").textContent=ordered.length;
  $("#overviewBlockLegend").innerHTML=["Blocked","At risk","Review","Active","Later","Completed"].map(status=>`<span><i style="--state:${statusColor[status]}"></i>${status}</span>`).join("");
  $("#overviewBlockGrid").innerHTML=ordered.map(item=>{
    const visual=itemVisualState(item);
    return `<button class="project-block status-${visual.toLowerCase().replace(" ","-")}" data-open-item="${item.id}" style="--state:${statusColor[visual]}" title="${esc(item.id+" · "+item.title+" · "+visual)}" aria-label="${esc("Open quick chamber for "+item.id+" "+item.title)}"><span>${item.id}</span></button>`;
  }).join("");

  const code=wsMap.has(state.overviewTerritory)?state.overviewTerritory:"WS001";
  state.overviewTerritory=code;
  const w=wsMap.get(code),items=byWs(code),s=summary(code),dep=dependencySummary(code);
  const h=health(s);
  const healthColor=h==="Critical"?"#d45555":h==="Attention"?"#d99a3c":h==="On track"?"#34b56f":"#4e8bd8";
  const openItems=[...items].filter(item=>item.status!=="Completed").sort((a,b)=>visualOrder[itemVisualState(a)]-visualOrder[itemVisualState(b)]||sortDate(a.due).localeCompare(sortDate(b.due))||a.id.localeCompare(b.id));
  const priority=openItems[0]||items[0];
  const ownerNames=[...new Set(items.map(item=>item.owner).filter(Boolean))];
  $("#overviewTerritoryFocus").innerHTML=`
    <div class="rc2-focus-title">
      <img src="${w.icon}" alt="">
      <div><span class="ws-code">${w.code}</span><h2>${esc(w.name)}</h2></div>
      <span class="rc2-health" style="--health:${healthColor}">${h}</span>
    </div>
    <p class="rc2-focus-description">${esc(w.description)}</p>
    <div class="rc2-focus-metrics">
      <div><strong>${s.progressKnown?`${s.progress}%`:"—"}</strong><span>${s.progressKnown?"Progress":"Not recorded"}</span></div>
      <div><strong>${s.active}</strong><span>Active</span></div>
      <div><strong>${s.blocked}</strong><span>Blocked</span></div>
      <div><strong>${s.atRisk}</strong><span>At risk</span></div>
    </div>
    <div class="rc2-focus-copy"><span>Where we are</span><p>${esc(territoryNarrative(code,s))}</p></div>
    <div class="rc2-focus-copy"><span>Next priority</span><strong>${esc(priority?.title||"Not recorded")}</strong><p>${priority?`${priority.id} · ${esc(priority.owner||"Unassigned")} · ${dateLabel(priority.due)}`:"No priority record"}</p></div>
    <div class="rc2-focus-copy"><span>Ownership and dependencies</span><p>${ownerNames.slice(0,4).map(esc).join(" · ")||"Ownership not recorded"} · ${dep.incoming.length} incoming · ${dep.outgoing.length} outgoing</p></div>
    <div class="rc2-focus-actions">
      <button class="atlas-cta compact-cta" data-open-territory="${code}" type="button"><span>Open territory</span><b aria-hidden="true">→</b></button>
      <button class="atlas-secondary compact-cta" data-open-ws="${code}" type="button"><span>Open quick chamber</span><b aria-hidden="true">+</b></button>
    </div>`;

  renderOverviewMap();

  const risks=[...items].filter(item=>item.status==="Blocked"||riskOrder[item.risk]>=2)
    .sort((a,b)=>visualOrder[itemVisualState(a)]-visualOrder[itemVisualState(b)]||riskOrder[b.risk]-riskOrder[a.risk]||a.id.localeCompare(b.id))
    .slice(0,3);
  $("#overviewRiskCount").textContent=`${risks.length} shown`;
  $("#overviewRisks").className="rc2-action-list";
  $("#overviewRisks").innerHTML=risks.length?risks.map((item,index)=>`<button class="rc2-action-row" data-open-item="${item.id}" type="button">
    <span class="rc2-rank">${String(index+1).padStart(2,"0")}</span><div><strong>${esc(item.title)}</strong><small>${esc(item.nextAction||"No next action recorded")} · ${esc(item.risk)}</small></div><span>${item.id}</span>
  </button>`).join(""):`<div class="positive-state">No current blocker or high-risk item is mapped to ${esc(w.name)}.</div>`;

  const forward=openItems.slice(0,3);
  $("#overviewForward").className="rc2-action-list";
  $("#overviewForward").innerHTML=forward.length?forward.map((item,index)=>`<button class="rc2-action-row" data-open-item="${item.id}" type="button">
    <span class="rc2-rank">${String(index+1).padStart(2,"0")}</span><div><strong>${esc(item.nextAction||"Not recorded")}</strong><small>${item.id} · ${esc(item.title)} · ${esc(item.owner||"Unassigned")}</small></div><span>${dateLabel(item.due)}</span>
  </button>`).join(""):`<div class="positive-state">No forward action is currently recorded.</div>`;

  const territoryEvidence=INTERNAL.evidence.filter(record=>territoryFromId(record.territory_id)===code);
  const territoryDecisions=INTERNAL.decisions.filter(record=>territoryFromId(record.territory_id)===code);
  const governance=[
    ...territoryDecisions.filter(record=>!/approved|closed|complete|accepted/i.test(String(record.decision_status))).map(record=>({kind:"decision",id:record.decision_id,title:record.title,meta:record.decision_status||"Not recorded"})),
    ...territoryEvidence.filter(record=>!/approved|verified|complete/i.test(String(record.verification_status))).map(record=>({kind:"evidence",id:record.evidence_id,title:record.title,meta:record.verification_status||"Not recorded"})),
    ...territoryDecisions.map(record=>({kind:"decision",id:record.decision_id,title:record.title,meta:record.decision_status||"Not recorded"})),
    ...territoryEvidence.map(record=>({kind:"evidence",id:record.evidence_id,title:record.title,meta:record.verification_status||"Not recorded"}))
  ].filter((record,index,array)=>array.findIndex(other=>other.kind===record.kind&&other.id===record.id)===index).slice(0,3);
  $("#overviewGovernance").className="rc2-action-list";
  $("#overviewGovernance").innerHTML=governance.length?governance.map((record,index)=>`<button class="rc2-action-row" data-open-internal="${record.kind}|${esc(record.id)}" type="button">
    <span class="rc2-rank">${String(index+1).padStart(2,"0")}</span><div><strong>${esc(record.title)}</strong><small>${record.kind==="decision"?"Decision":"Evidence"} · ${esc(record.meta)}</small></div><span>${esc(record.id)}</span>
  </button>`).join(""):`<div class="positive-state">No evidence or decision record is mapped to ${esc(w.name)}.</div>`;

  renderCondensedTerritories();

  const statuses=["all","Completed","Active","At risk","Review","Blocked","Later"];
  $("#overviewRegisterFilters").innerHTML=statuses.map(status=>`<button type="button" data-overview-register-status="${status}" class="${state.overviewItemStatus===status?"active":""}">${status==="all"?"All":status}</button>`).join("");
  const registerItems=items.filter(item=>state.overviewItemStatus==="all"||itemVisualState(item)===state.overviewItemStatus||item.status===state.overviewItemStatus);
  $("#overviewRegisterTitle").textContent=`${items.length} connected work items`;
  $("#overviewRegisterBody").innerHTML=registerItems.map(item=>`<tr data-open-item="${item.id}">
    <td>${item.id}</td><td>${esc(item.title)}</td><td>${chip(item.status)}</td><td>${riskChip(item.risk)}</td><td>${esc(item.owner||"Unassigned")}</td><td>${esc(short(item.nextAction||"Not recorded",54))}</td><td>${dateLabel(item.due)}</td><td><strong style="color:${statusColor[itemVisualState(item)]}">${progressLabel(item)}</strong></td>
  </tr>`).join("");

  bindDynamic();
  $$("[data-overview-register-status]").forEach(button=>button.onclick=()=>{
    state.overviewItemStatus=button.dataset.overviewRegisterStatus;
    renderOverview();
    requestAnimationFrame(()=>document.querySelector(".rc2-overview-register")?.scrollIntoView({block:"start"}));
  });
}
function renderOverviewMap(){
  const svg=$("#overviewMap");if(!svg)return;
  const P=positions("dependency");
  const territoryEdges=[...(DATA.territoryEdges||INTERNAL.territoryEdges||[])].sort((a,b)=>(b.count||0)-(a.count||0));
  const edges=territoryEdges.slice(0,18).map((l,index)=>{
    const a=P[l.a],b=P[l.b];if(!a||!b)return"";
    const color=index%3===0?"#6ab493":index%3===1?"#c29043":"#6f91ba";
    return `<path class="overview-territory-edge ${index<5?"arrival":""}" d="M ${a.x} ${a.y} Q ${(a.x+b.x)/2} ${Math.min(a.y,b.y)-55} ${b.x} ${b.y}" style="--weight:${Math.min(5,1+(l.count||1)/4)};stroke:${color};--delay:${index*.16}s"><title>${esc(`${l.a} ↔ ${l.b} · ${l.count||1} linked records`)}</title></path>`;
  }).join("");
  const dots=state.items.map(i=>{
    const p=P[i.id];if(!p)return"";
    const visual=itemVisualState(i);
    return `<circle class="overview-dot ${riskOrder[i.risk]>=2?"risk":""}" data-map-item="${i.id}" cx="${p.x}" cy="${p.y}" r="${visual==="Blocked"?5.4:3.8}" fill="${statusColor[visual]}"><title>${esc(i.id+" · "+i.title+" · "+visual)}</title></circle>`;
  }).join("");
  const anchors=DATA.workstreams.map(w=>{
    const p=P[w.code],s=summary(w.code);
    return `<g class="overview-anchor" data-map-ws="${w.code}" style="--anchor-color:${s.blocked?"#d45555":s.atRisk?"#5d6873":"#d6b55a"}">
      <circle cx="${p.x}" cy="${p.y}" r="49"/>
      <image href="${w.icon}" x="${p.x-38}" y="${p.y-38}" width="76" height="76" preserveAspectRatio="xMidYMid meet"/>
      <text x="${p.x}" y="${p.y+62}">${w.code}</text><text class="anchor-sub" x="${p.x}" y="${p.y+75}">${esc(short(w.name,21))}</text>
      <title>${esc(w.name)} · ${s.total} items · ${s.blocked} blocked · ${s.progressKnown?`${s.progress}% progress`:"progress not recorded"}</title>
    </g>`;
  }).join("");
  const center=`<g class="overview-centre" data-view="overview"><circle cx="800" cy="470" r="75"/><image href="assets/brand/command-centre-emblem.png" x="736" y="406" width="128" height="128" preserveAspectRatio="xMidYMid meet"/></g>`;
  svg.innerHTML=`<g>${edges}${dots}${anchors}${center}</g>`;
  $$("[data-map-ws]",svg).forEach(g=>g.onclick=()=>openDrawer(g.dataset.mapWs));
  $$("[data-map-item]",svg).forEach(n=>n.onclick=e=>{e.stopPropagation();openItem(n.dataset.mapItem)});
}
function pulseTerritories(){
  const entries=DATA.workstreams.map(w=>{
    const s=summary(w.code),a=byWs(w.code),next=[...a].filter(i=>i.status!=="Completed").sort((x,y)=>sortDate(x.due).localeCompare(sortDate(y.due)))[0]||a[0];
    return {w,s,next,earliest:sortDate(next?.due)};
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
    if(candidate){used.add(candidate.w.code);out.push({...candidate,label:rule.label});}
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
      <div class="pulse-metrics"><div><strong>${s.total}</strong><span>Items</span></div><div><strong>${s.progressKnown?`${s.progress}%`:"—"}</strong><span>${s.progressKnown?"Progress":"Not recorded"}</span></div><div><strong>${s.blocked}</strong><span>Blocked</span></div></div>
      <div class="pulse-waffle">${items.map(i=>`<button data-open-item="${i.id}" style="--state:${statusColor[itemVisualState(i)]}" title="${esc(i.id+" · "+i.title+" · "+itemVisualState(i))}"></button>`).join("")}</div>
      <div class="pulse-next"><span>Next action</span><strong>${esc(short(next?.nextAction||"Not recorded",78))}</strong><small>${next?`${next.id} · ${dateLabel(next.due)}`:"Not recorded"}</small></div>
      <footer><button class="pulse-open" data-open-territory="${w.code}">Open territory</button><button class="pulse-chamber" data-open-ws="${w.code}">Open quick chamber</button></footer>
    </article>`;
  }).join("");
}
function renderCondensedTerritories(){
  const el=$("#territoryCondensed");if(!el)return;
  el.innerHTML=DATA.workstreams.map(w=>{
    const s=summary(w.code),a=byWs(w.code),next=[...a].filter(i=>i.status!=="Completed").sort((x,y)=>sortDate(x.due).localeCompare(sortDate(y.due)))[0]||a[0];
    return `<button class="territory-condensed" data-open-territory="${w.code}">
      <img src="${w.icon}" alt="">
      <div class="territory-condensed-copy"><span>${w.code} · ${health(s)}</span><strong>${esc(w.name)}</strong><small>${esc(short(next?.nextAction||"Not recorded",54))}</small></div>
      <div class="territory-condensed-metrics"><b>${s.progressKnown?`${s.progress}%`:"—"}</b><span>${s.active} active · ${s.blocked} blocked</span>${progress(s.progress,"",s.progressKnown)}</div>
    </button>`;
  }).join("");
}
function renderOverviewOperations(){
  const el=$("#overviewOperations");if(!el)return;
  const milestone=[...INTERNAL.milestones].filter(m=>dateValue(m.target_date)).sort((a,b)=>sortDate(a.target_date).localeCompare(sortDate(b.target_date)))[0];
  const blocker=[...INTERNAL.risksBlockers].sort((a,b)=>riskOrder[b.risk_level]-riskOrder[a.risk_level])[0];
  const decision=[...INTERNAL.decisions].filter(d=>!["Approved","Closed","Complete"].includes(d.decision_status)).sort((a,b)=>sortDate(a.target_date).localeCompare(sortDate(b.target_date)))[0]||INTERNAL.decisions[0];
  const evidence=[...INTERNAL.evidence].filter(e=>!String(e.verification_status).toLowerCase().includes("verified"))[0]||INTERNAL.evidence[0];
  const cards=[
    ["Next milestone",milestone?.title,milestone?`milestone|${milestone.milestone_id}`:"",`Due ${dateLabel(milestone?.target_date)}`],
    ["Critical blocker",blocker?.title,blocker?`risk|${blocker.risk_id}`:"",blocker?`${blocker.risk_level||blocker.severity||"Risk not recorded"} · ${blocker.owner||"Unassigned"}`:"No blocker recorded"],
    ["Decision awaiting",decision?.title,decision?`decision|${decision.decision_id}`:"",decision?`${decision.decision_status||"Not recorded"} · ${dateLabel(decision.target_date)}`:"No decision recorded"],
    ["Evidence watch",evidence?.title,evidence?`evidence|${evidence.evidence_id}`:"",evidence?`${evidence.verification_status||"Not recorded"} · ${evidence.source_authority||"Source authority not recorded"}`:"No evidence recorded"]
  ];
  el.innerHTML=cards.map(([label,title,key,meta],idx)=>`<button class="operation-card" ${key?`data-open-internal="${esc(key)}"`:""}>
    <span>${String(idx+1).padStart(2,"0")} · ${label}</span><strong>${esc(short(title||"No action required",54))}</strong><small>${esc(meta)}</small>
  </button>`).join("");
}
function drawerHtml(code,tab="overview"){
  const w=wsMap.get(code),a=byWs(code),s=summary(code);
  const next=[...a].filter(i=>i.status!=="Completed").sort((x,y)=>sortDate(x.due).localeCompare(sortDate(y.due))).slice(0,7);
  const evidence=INTERNAL.evidence.filter(e=>territoryFromId(e.territory_id)===code);
  let body="";
  if(tab==="overview")body=`<div class="drawer-summary">
      <div><strong>${s.total}</strong><span>Items</span></div><div><strong>${s.progressKnown?`${s.progress}%`:"—"}</strong><span>${s.progressKnown?"Progress":"Not recorded"}</span></div>
      <div><strong>${s.blocked}</strong><span>Blocked</span></div><div><strong>${s.atRisk}</strong><span>At risk</span></div></div>
      <div class="drawer-command"><span>Current health</span><strong>${health(s)}</strong><p>${territoryNarrative(code,s)}</p></div>
      <h3>Next command actions</h3>${next.length?next.map(i=>`<button class="row-item" data-open-item="${i.id}">${chip(i.status)}<div><strong>${esc(i.title)}</strong><br><span>${esc(i.nextAction||"Not recorded")}</span></div><span>${dateLabel(i.due)}</span></button>`).join(""):`<div class="card">No open command action is recorded.</div>`}
      <button class="gold drawer-full" data-open-territory="${code}" type="button">Open territory</button>`;
  if(tab==="items")body=a.map(i=>`<button class="row-item" data-open-item="${i.id}">${chip(i.status)}<div><strong>${esc(i.title)}</strong><br><span>${i.id} · ${progressLabel(i)} · ${esc(i.owner)}</span></div><span>${dateLabel(i.due)}</span></button>`).join("");
  if(tab==="owners"){
    const grouped=Object.entries(a.reduce((o,i)=>{(o[i.owner]??=[]).push(i);return o},{}));
    body=grouped.map(([owner,arr])=>{
      const known=arr.filter(knownProgress),value=known.length?avg(known.map(i=>i.progress)):null;
      return `<div class="row-item"><span class="status-chip">${arr.length}</span><div><strong>${esc(owner)}</strong><br><span>${arr.filter(i=>i.status==="Blocked").length} blocked · ${value===null?"progress not recorded":`${value}% average`}</span></div><span>Lead</span></div>`;
    }).join("");
  }
  if(tab==="evidence")body=evidence.length?evidence.map(e=>`<button class="row-item" data-open-internal="evidence|${esc(e.evidence_id)}"><span class="status-chip">${esc(e.evidence_id)}</span><div><strong>${esc(e.title)}</strong><br><span>${esc(e.source_authority||"Source authority not recorded")}</span></div><span>${esc(e.verification_status||"Open")}</span></button>`).join(""):`<div class="card">No evidence record is mapped to this territory.</div>`;
  return `<div class="drawer-hero"><img class="drawer-main-icon" src="${w.icon}" alt=""><div><p class="eyebrow">${w.code} · Quick Chamber</p><h2>${esc(w.name)}</h2><span>${esc(w.description)}</span></div></div>
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
  const w=wsMap.get(i.workstream)||{name:i.workstream||"Not recorded"};
  const deps=(i.dependencies||[]).map(x=>itemMap().get(x)).filter(Boolean);
  const itemIssues=INTERNAL.validationIssues.filter(issue=>issue.record_or_row_id===i.id||String(issue.observed_value||"").includes(i.id));
  $("#itemContent").innerHTML=`<p class="quick-chamber-label">Quick Chamber</p><p class="eyebrow">${esc(i.id)} · ${esc(i.workstream)}</p><h2>${esc(i.title)}</h2><p>${esc(i.summary||"No operational summary recorded.")}</p>
  <div class="drawer-summary"><div><strong>${progressLabel(i)}</strong><span>Progress</span></div><div><strong>${esc(i.priority||"Not recorded")}</strong><span>Priority</span></div><div><strong>${esc(i.status)}</strong><span>Status</span></div><div><strong>${esc(i.risk)}</strong><span>Risk</span></div></div>
  <h3>Command information</h3><div class="card"><p><b>Territory:</b> ${esc(w.name)}</p><p><b>Owner:</b> ${esc(i.owner||"Unassigned")} · <b>Reviewer:</b> ${esc(i.reviewer||"Not recorded")}</p><p><b>Target date:</b> ${dateLabel(i.due)}</p><p><b>Milestone:</b> ${esc(i.milestone||"Not recorded")}</p><p><b>Next action:</b> ${esc(i.nextAction||"Not recorded")}</p><p><b>Evidence:</b> ${esc(i.evidence||"Not recorded")}</p><p><b>Decision:</b> ${esc(i.decision||"Not recorded")}</p></div>
  <h3>Source and assurance</h3><div class="card"><p><b>Verification:</b> ${esc(i.verificationStatus||"Not recorded")}</p><p><b>Source:</b> ${esc(i.sourceWorksheet||"Not recorded")} · row ${esc(i.sourceRowId||"Not recorded")}</p><p><b>Record key:</b> ${esc(i.recordKey||i.id)}</p><p><b>Validation findings:</b> ${itemIssues.length}</p></div>
  <h3>Dependencies</h3>${deps.length?deps.map(d=>`<button class="row-item" data-open-item="${d.id}">${chip(d.status)}<div><strong>${esc(d.title)}</strong><br><span>${d.id} · ${d.workstream}</span></div><span>${progressLabel(d)}</span></button>`).join(""):`<div class="card">No stable item dependency is resolved for this record.</div>`}
  <div class="modal-actions"><button class="atlas-cta compact-cta" data-open-territory="${i.workstream}" type="button"><span>Open territory</span><b>→</b></button><button class="atlas-secondary compact-cta" data-locate-item="${i.id}" type="button"><span>Locate in Bird’s-eye</span><b>⌖</b></button></div>`;
  itemModalLastFocus=document.activeElement;
  const itemModal=$("#itemModal");
  itemModal.hidden=false;
  itemModal.setAttribute("aria-hidden","false");
  itemModal.setAttribute("aria-label","Quick Chamber item details");
  syncOverlayBody();
  bindDynamic();
  focusOverlay(itemModal);
}
function territoryNarrative(code,s){
  const w=wsMap.get(code);
  if(s.blocked>2)return `${w.name} is carrying concentrated delivery pressure. ${s.blocked} items are blocked and ${s.risk} have high or critical risk classifications.`;
  if(s.review>4)return `${w.name} has substantial work in assurance. The immediate emphasis is review closure, evidence and release approval.`;
  if(s.progressKnown&&s.progress>75)return `${w.name} is in a mature delivery state. Remaining work is concentrated around sign-off, dependencies and final release readiness.`;
  if(!s.progressKnown)return `${w.name} has ${s.total} mapped work items. Progress remains not recorded because the Command Sheet has no authoritative 0–100 field.`;
  return `${w.name} is progressing through active delivery with a sequence of owned actions, reviews and dependent hand-offs.`;
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
  const q=state.territorySearch.trim().toLowerCase();
  const filtered=summaries.filter(({w,s})=>{
    const h=health(s);
    const statusMatch=state.territoryFilter==="all"||
      (state.territoryFilter==="attention"&&["Critical","Attention"].includes(h))||
      (state.territoryFilter==="ontrack"&&["On track","In progress"].includes(h));
    const searchMatch=!q||[w.code,w.name,w.description,w.lead,w.sponsor,h].some(v=>String(v||"").toLowerCase().includes(q));
    return statusMatch&&searchMatch;
  });
  $("#territoryIndexSummary").textContent=`${attention} territories need attention · ${filtered.length} shown · ${DATA.workstreams.length} total`;
  $("#territoryFilters").className="filters command-tools command-index-tools";
  $("#territoryFilters").innerHTML=`
    <div class="command-search"><input id="territorySearch" type="search" value="${esc(state.territorySearch)}" placeholder="Search territories" aria-label="Search territories"></div>
    <div class="command-filter-buttons" role="group" aria-label="Filter territories by attention state">
      ${["all","attention","ontrack"].map(f=>`<button type="button" data-territory-filter="${f}" class="${state.territoryFilter===f?"active":""}">${f==="all"?"All territories":f==="attention"?"Needs attention":"On track"}</button>`).join("")}
    </div>
    <button class="command-reset" id="territoryReset" type="button">Reset</button>
    <span class="command-result-count">${filtered.length} shown</span>`;
  $("#territoryIndex").innerHTML=filtered.map(({w,s})=>{
    const a=byWs(w.code),urgent=[...a].filter(i=>i.status==="Blocked"||i.risk==="Critical").sort((x,y)=>sortDate(x.due).localeCompare(sortDate(y.due)))[0]||[...a].sort((x,y)=>sortDate(x.due).localeCompare(sortDate(y.due)))[0];
    const dep=dependencySummary(w.code),h=health(s),hClass=h.toLowerCase().replace(" ","-");
    const healthColor=h==="Critical"?"#d45555":h==="Attention"?"#d99a3c":h==="On track"?"#34b56f":"#4e8bd8";
    return `<article class="territory-card health-state-${hClass}" style="--health:${healthColor}">
      <header>
        <div class="territory-card-title"><img src="${w.icon}" alt=""><div><span class="ws-code">${w.code}</span><h2>${esc(w.name)}</h2><p>${esc(w.description)}</p></div></div>
        <span class="health health-${hClass}">${h}</span>
      </header>
      <div class="territory-metrics">
        <div><strong>${s.progressKnown?`${s.progress}%`:"—"}</strong><span>${s.progressKnown?"Progress":"Not recorded"}</span></div>
        <div><strong>${s.active}</strong><span>Active</span></div>
        <div class="blocked-metric"><strong>${s.blocked}</strong><span>Blocked</span></div>
        <div><strong>${s.atRisk}</strong><span>At risk</span></div>
      </div>${progress(s.progress,healthColor,s.progressKnown)}
      <div class="territory-now"><span>Where we are</span><p>${territoryNarrative(w.code,s)}</p></div>
      <div class="territory-next"><span>Next priority</span><strong>${esc(urgent?.title||"Not recorded")}</strong><small>${urgent?`${urgent.id} · ${esc(urgent.owner)} · ${dateLabel(urgent.due)}`:"No priority record"}</small></div>
      <div class="territory-links"><span>${dep.incoming.length} incoming</span><span>${dep.outgoing.length} outgoing</span><span>${a.filter(i=>i.status==="Review").length} reviews</span></div>
      <footer><button class="atlas-cta compact-cta" data-open-territory="${w.code}" type="button"><span>Open territory</span><b>→</b></button><button class="atlas-secondary compact-cta" data-open-ws="${w.code}" type="button"><span>Open quick chamber</span><b>+</b></button></footer>
    </article>`;
  }).join("")||`<div class="entity-empty-state"><div><h3>No territories match this view</h3><p>Clear the search or reset the attention filter.</p><button class="command-reset" id="territoryEmptyReset" type="button">Reset filters</button></div></div>`;
  const search=$("#territorySearch");
  if(search)search.oninput=e=>{state.territorySearch=e.target.value;clearTimeout(renderTerritoryIndex.searchTimer);renderTerritoryIndex.searchTimer=setTimeout(renderTerritoryIndex,120)};
  const reset=()=>{state.territorySearch="";state.territoryFilter="all";renderTerritoryIndex()};
  $("#territoryReset")?.addEventListener("click",reset);
  $("#territoryEmptyReset")?.addEventListener("click",reset);
  bindDynamic();
}
function territoryMiniMap(code,items,healthColor){
  const cx=300,cy=165,radius=112;
  const selected=items.slice(0,48);
  const points=new Map(selected.map((item,index)=>{
    const angle=-Math.PI/2+(index/Math.max(1,selected.length))*Math.PI*2;
    const ring=radius+(index%3)*17;
    return [item.id,{x:cx+Math.cos(angle)*ring,y:cy+Math.sin(angle)*ring}];
  }));
  const links=[];
  selected.forEach(item=>(item.dependencies||[]).forEach(dep=>{
    if(!points.has(dep))return;
    const a=points.get(item.id),b=points.get(dep);
    links.push(`<line class="mini-link" x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}"/>`);
  }));
  const nodes=selected.map(item=>{
    const p=points.get(item.id),visual=itemVisualState(item);
    return `<circle class="mini-node" data-open-item="${item.id}" cx="${p.x}" cy="${p.y}" r="${visual==="Blocked"?6:4.5}" fill="${statusColor[visual]}"><title>${esc(item.id+" · "+item.title+" · "+visual)}</title></circle>`;
  }).join("");
  const w=wsMap.get(code);
  return `<svg class="territory-bird-mini" viewBox="0 0 600 330" role="img" aria-label="${esc(w.name)} territory Bird’s-eye preview">
    ${links.join("")}
    <circle class="mini-anchor" style="--health:${healthColor}" cx="${cx}" cy="${cy}" r="52"/>
    <image href="${w.icon}" x="${cx-42}" y="${cy-42}" width="84" height="84" preserveAspectRatio="xMidYMid meet"/>
    ${nodes}
  </svg>`;
}

function renderTerritoryDetail(){
  const code=state.territory,w=wsMap.get(code);
  if(!w)return;
  const items=byWs(code),s=summary(code),dep=dependencySummary(code);
  const h=health(s);
  const healthColor=h==="Critical"?"#d45555":h==="Attention"?"#d99a3c":h==="On track"?"#34b56f":"#4e8bd8";
  const blocked=[...items].filter(item=>item.status==="Blocked"||riskOrder[item.risk]>=2)
    .sort((a,b)=>visualOrder[itemVisualState(a)]-visualOrder[itemVisualState(b)]||riskOrder[b.risk]-riskOrder[a.risk]||a.id.localeCompare(b.id));
  const next=[...items].filter(item=>item.status!=="Completed")
    .sort((a,b)=>visualOrder[itemVisualState(a)]-visualOrder[itemVisualState(b)]||sortDate(a.due).localeCompare(sortDate(b.due))||a.id.localeCompare(b.id));
  const owners=Object.entries(items.reduce((out,item)=>{(out[item.owner||"Unassigned"]??=[]).push(item);return out},{})).sort((a,b)=>b[1].length-a[1].length);
  const incoming=dep.incoming.map(id=>wsMap.get(id)).filter(Boolean);
  const outgoing=dep.outgoing.map(id=>wsMap.get(id)).filter(Boolean);
  const territoryEvidence=INTERNAL.evidence.filter(record=>territoryFromId(record.territory_id)===code);
  const territoryDecisions=INTERNAL.decisions.filter(record=>territoryFromId(record.territory_id)===code);
  const statusFiltered=items.filter(item=>state.territoryItemStatus==="all"||itemVisualState(item)===state.territoryItemStatus||item.status===state.territoryItemStatus);
  const signals=[
    {label:"All items",value:s.total,detail:"Complete territory",wax:"all-items",status:"all",color:"#f3f3f3"},
    {label:"Active",value:s.active,detail:"Current state",wax:"active",status:"Active",color:statusColor.Active},
    {label:"At risk",value:s.atRisk,detail:"High or critical",wax:"risk",status:"At risk",color:statusColor["At risk"]},
    {label:"Blocked",value:s.blocked,detail:"Current state",wax:"blocked",status:"Blocked",color:statusColor.Blocked},
    {label:"Review",value:s.review,detail:"Current state",wax:"review",status:"Review",color:statusColor.Review},
    {label:"Completed",value:s.completed,detail:"Current state",wax:"completed",status:"Completed",color:statusColor.Completed}
  ];
  const governance=[
    ...territoryDecisions.filter(record=>!/approved|closed|complete|accepted/i.test(String(record.decision_status))).map(record=>({kind:"decision",id:record.decision_id,title:record.title,meta:record.decision_status||"Not recorded"})),
    ...territoryEvidence.filter(record=>!/approved|verified|complete/i.test(String(record.verification_status))).map(record=>({kind:"evidence",id:record.evidence_id,title:record.title,meta:record.verification_status||"Not recorded"})),
    ...territoryDecisions.map(record=>({kind:"decision",id:record.decision_id,title:record.title,meta:record.decision_status||"Not recorded"})),
    ...territoryEvidence.map(record=>({kind:"evidence",id:record.evidence_id,title:record.title,meta:record.verification_status||"Not recorded"}))
  ].filter((record,index,array)=>array.findIndex(other=>other.kind===record.kind&&other.id===record.id)===index).slice(0,3);
  const waffleItems=[...items].sort((a,b)=>visualOrder[itemVisualState(a)]-visualOrder[itemVisualState(b)]||a.id.localeCompare(b.id));

  $("#territoryDetail").innerHTML=`
    <div class="rc2-territory-layout">
      <section class="rc2-territory-hero" style="--health:${healthColor}">
        <div class="rc2-territory-hero-copy">
          <button class="back-link" data-view="territories" type="button">← Command Index</button>
          <p class="eyebrow">${w.code} · Territory Overview</p>
          <h1>${esc(w.name)}</h1>
          <p>${esc(w.description)}</p>
          <div class="rc2-territory-hero-actions">
            <button class="atlas-cta" data-open-ws="${code}" type="button"><span>Open quick chamber</span><b aria-hidden="true">+</b></button>
            <button class="atlas-secondary" data-locate-territory="${code}" type="button"><span>Locate in Bird’s-eye</span><b aria-hidden="true">⌖</b></button>
          </div>
        </div>
        <div class="rc2-territory-hero-side">
          <img class="rc2-territory-mark" src="${w.icon}" alt="">
          <div class="rc2-territory-status">
            <span>Current status</span>
            <strong>${h}</strong>
            <small>${s.progressKnown?"Recorded progress":"Progress not recorded"}</small>
            ${progress(s.progress,healthColor,s.progressKnown)}
          </div>
        </div>
      </section>

      <section>
        <div class="overview-section-title">
          <div><p>Current status</p><h2>${esc(w.name)} delivery state</h2></div>
          <span>Risk remains separate from progress; no percentage has been inferred.</span>
        </div>
        <div class="rc2-territory-status-grid">
          ${signals.map(signal=>`<button class="signal-card" data-territory-status-jump="${signal.status}" style="--signal:${signal.color}" type="button">
            <img src="assets/wax/${signal.wax}.png" alt=""><span><small>${signal.label}</small><strong>${signal.value}</strong><em>${signal.detail}</em></span>
          </button>`).join("")}
        </div>
      </section>

      <section class="rc2-territory-primary">
        <article class="panel rc2-territory-summary">
          <div class="rc2-territory-summary-head">
            <img src="${w.icon}" alt="">
            <div><span class="ws-code">${w.code}</span><h2>${esc(w.name)}</h2></div>
            <span class="rc2-health" style="--health:${healthColor}">${h}</span>
          </div>
          <p class="rc2-focus-description">${esc(w.description)}</p>
          <div class="rc2-focus-metrics">
            <div><strong>${s.total}</strong><span>Items</span></div>
            <div><strong>${s.progressKnown?`${s.progress}%`:"—"}</strong><span>${s.progressKnown?"Progress":"Not recorded"}</span></div>
            <div><strong>${s.blocked}</strong><span>Blocked</span></div>
            <div><strong>${s.atRisk}</strong><span>At risk</span></div>
          </div>
          <div class="rc2-focus-copy"><span>Where we are</span><p>${esc(territoryNarrative(code,s))}</p></div>
          <div class="rc2-focus-copy"><span>Next priority</span><strong>${esc(next[0]?.title||"Not recorded")}</strong><p>${next[0]?`${next[0].id} · ${esc(next[0].owner||"Unassigned")} · ${dateLabel(next[0].due)}`:"No priority record"}</p></div>
          <div class="rc2-territory-meta-grid">
            <div><span>Ownership</span><p>${owners.slice(0,4).map(([owner,records])=>`${esc(owner)} (${records.length})`).join(" · ")||"Not recorded"}</p></div>
            <div><span>Dependencies</span><p>${incoming.length} incoming · ${outgoing.length} outgoing${incoming[0]?` · ${incoming.slice(0,2).map(record=>record.code).join(", ")}`:""}</p></div>
          </div>
          <div class="rc2-focus-actions">
            <button class="atlas-cta compact-cta" data-open-territory="${code}" type="button"><span>Open territory</span><b aria-hidden="true">→</b></button>
            <button class="atlas-secondary compact-cta" data-open-ws="${code}" type="button"><span>Open quick chamber</span><b aria-hidden="true">+</b></button>
          </div>
        </article>

        <article class="panel rc2-territory-waffle">
          <div class="panel-head"><div><p class="eyebrow">Territory waffle</p><h2>Every work item</h2><span>Stable item order with live delivery state.</span></div><button class="panel-expand" data-view="waffle" type="button">Open Waffle</button></div>
          <div class="rc2-territory-waffle-mini">${waffleItems.map(item=>`<button data-open-item="${item.id}" style="--state:${statusColor[itemVisualState(item)]}" title="${esc(item.id+" · "+item.title+" · "+itemVisualState(item))}" aria-label="${esc("Open quick chamber for "+item.id+" "+item.title)}"></button>`).join("")}</div>
          <div class="project-block-key">${["Blocked","At risk","Review","Active","Later","Completed"].map(status=>`<span><i style="--state:${statusColor[status]}"></i>${status}</span>`).join("")}</div>
        </article>

        <article class="panel rc2-territory-map-panel">
          <div class="panel-head"><div><p class="eyebrow">Bird’s-eye preview</p><h2>Connected delivery</h2><span>Work-item links inside ${esc(w.name)}.</span></div><button class="panel-expand" data-locate-territory="${code}" type="button">Locate in Bird’s-eye</button></div>
          <div class="rc2-territory-map-stage">${territoryMiniMap(code,items,healthColor)}</div>
        </article>
      </section>

      <section class="rc2-territory-action-grid">
        <article class="panel rc2-action-panel">
          <div class="panel-head"><div><p class="eyebrow">Attention</p><h2>Blockers and risks</h2></div><span>${blocked.length} open</span></div>
          <div class="rc2-action-list">${blocked.length?blocked.slice(0,3).map((item,index)=>`<button class="rc2-action-row" data-open-item="${item.id}" type="button"><span class="rc2-rank">${String(index+1).padStart(2,"0")}</span><div><strong>${esc(item.title)}</strong><small>${esc(item.nextAction||"No next action recorded")} · ${esc(item.risk)}</small></div><span>${item.id}</span></button>`).join(""):`<div class="positive-state">No current blocker is mapped to this territory.</div>`}</div>
        </article>
        <article class="panel rc2-action-panel">
          <div class="panel-head"><div><p class="eyebrow">Forward action</p><h2>What needs to happen next</h2></div></div>
          <div class="rc2-action-list">${next.length?next.slice(0,3).map((item,index)=>`<button class="rc2-action-row" data-open-item="${item.id}" type="button"><span class="rc2-rank">${String(index+1).padStart(2,"0")}</span><div><strong>${esc(item.nextAction||"Not recorded")}</strong><small>${item.id} · ${esc(item.title)} · ${esc(item.owner||"Unassigned")}</small></div><span>${dateLabel(item.due)}</span></button>`).join(""):`<div class="positive-state">No forward action is currently recorded.</div>`}</div>
        </article>
        <article class="panel rc2-action-panel">
          <div class="panel-head"><div><p class="eyebrow">Governance</p><h2>Evidence and decisions</h2></div></div>
          <div class="rc2-action-list">${governance.length?governance.map((record,index)=>`<button class="rc2-action-row" data-open-internal="${record.kind}|${esc(record.id)}" type="button"><span class="rc2-rank">${String(index+1).padStart(2,"0")}</span><div><strong>${esc(record.title)}</strong><small>${record.kind==="decision"?"Decision":"Evidence"} · ${esc(record.meta)}</small></div><span>${esc(record.id)}</span></button>`).join(""):`<div class="positive-state">No evidence or decision record is mapped to this territory.</div>`}</div>
        </article>
      </section>

      <section class="territory-register panel rc2-territory-register">
        <div class="panel-head">
          <div><p class="eyebrow">Full territory register</p><h2>${items.length} connected work items</h2></div>
          <div class="filters territory-status-filters">${["all","Completed","Active","At risk","Review","Blocked","Later"].map(status=>`<button data-territory-item-status="${status}" class="${state.territoryItemStatus===status?"active":""}" type="button">${status==="all"?"All":status}</button>`).join("")}</div>
        </div>
        <div class="table-wrap"><table><thead><tr><th>ID</th><th>Item</th><th>Status</th><th>Risk</th><th>Owner</th><th>Next action</th><th>Target date</th><th>Progress</th></tr></thead><tbody>
          ${statusFiltered.length?statusFiltered.map(item=>`<tr data-open-item="${item.id}"><td>${item.id}</td><td>${esc(item.title)}</td><td>${chip(item.status)}</td><td>${riskChip(item.risk)}</td><td>${esc(item.owner||"Unassigned")}</td><td>${esc(short(item.nextAction||"Not recorded",54))}</td><td>${dateLabel(item.due)}</td><td><strong style="color:${statusColor[itemVisualState(item)]}">${progressLabel(item)}</strong></td></tr>`).join(""):`<tr class="table-empty-row"><td colspan="8">No work items are recorded for ${esc(w.name)} in the current source dataset.</td></tr>`}
        </tbody></table></div>
      </section>
    </div>`;
  bindDynamic();
}
function renderStructured(){
  $("#structuredBoard").innerHTML=DATA.workstreams.map(w=>{
    const a=byWs(w.code).sort((x,y)=>visualOrder[itemVisualState(x)]-visualOrder[itemVisualState(y)]||sortDate(x.due).localeCompare(sortDate(y.due))||x.id.localeCompare(y.id)),s=summary(w.code),dep=dependencySummary(w.code);
    return `<section class="structure-card">
      <header><div><span class="ws-code">${w.code}</span><h3>${esc(w.name)}</h3><small>${health(s)} · ${s.total} work items</small></div><button class="link-btn" data-open-territory="${w.code}">Open territory →</button></header>
      <div class="structure-summary"><span>${s.progressKnown?`${s.progress}% progress`:"Progress not recorded"}</span><span>${s.blocked} blocked</span><span>${s.atRisk} at risk</span><span>${dep.incoming.length+dep.outgoing.length} territory links</span></div>${progress(s.progress,"",s.progressKnown)}
      <ul>${a.slice(0,7).map(i=>`<li><button class="link-btn" data-open-item="${i.id}" aria-label="${esc("Open quick chamber for "+i.id+" "+i.title)}"><b>${i.id}</b> ${esc(i.title)} <span>${itemVisualState(i)}</span></button></li>`).join("")}</ul>
      <footer><span>Next: ${esc(short(a.find(i=>i.status!=="Completed")?.nextAction||"No next action recorded",72))}</span></footer>
    </section>`;
  }).join("");bindDynamic();
}
function renderSquare(){
  const statuses=["Blocked","At risk","Review","Active","Later","Completed"];
  const counts=statuses.map(status=>({
    status,count:state.items.filter(i=>itemVisualState(i)===status).length
  }));
  $("#blockViewControls").innerHTML=`
    <div class="block-mode-switch" role="group" aria-label="Block map view">
      <button data-block-mode="overview" class="${state.blockMode==="overview"?"active":""}">Whole project</button>
      <button data-block-mode="territories" class="${state.blockMode==="territories"?"active":""}">By territory</button>
    </div>
    <div class="block-status-strip" role="group" aria-label="Filter delivery blocks by status">
      <button data-block-status="all" class="status-all ${state.blockStatus==="all"?"active":""}" style="--state:#f3f3f3">
        <i class="block-signal-mark" aria-hidden="true"></i>
        <span class="block-signal-copy"><small>Portfolio view</small><b>All blocks</b><em>Complete work-item field</em></span>
        <strong>${state.items.length}</strong>
      </button>
      ${counts.map(x=>`<button data-block-status="${x.status}" class="status-${x.status.toLowerCase().replace(" ","-")} ${state.blockStatus===x.status?"active":""}" style="--state:${statusColor[x.status]}">
        <i class="block-signal-mark" aria-hidden="true"></i>
        <span class="block-signal-copy"><small>${x.status==="At risk"?"Risk overlay":"Delivery state"}</small><b>${x.status}</b><em>${statusDescription[x.status]}</em></span>
        <strong>${x.count}</strong>
      </button>`).join("")}
    </div>`;
  const visible=state.items
    .filter(i=>state.blockStatus==="all"||itemVisualState(i)===state.blockStatus)
    .sort((a,b)=>visualOrder[itemVisualState(a)]-visualOrder[itemVisualState(b)]||a.workstream.localeCompare(b.workstream)||a.id.localeCompare(b.id));

  if(state.blockMode==="overview"){
    $("#squareGrid").className="square-grid project-block-overview";
    $("#squareGrid").innerHTML=`<section class="project-block-field">
      <header><div><p class="eyebrow">WHOLE PROJECT</p><h2>${visible.length} visible delivery blocks</h2><span>Urgency first, then territory and stable item ID. Select any block to inspect its source record.</span></div><div class="project-block-key">${statuses.map(st=>`<span><i style="--state:${statusColor[st]}"></i>${st}</span>`).join("")}</div></header>
      <div class="project-block-grid">${visible.map(i=>{
        const visual=itemVisualState(i);
        return `<button class="project-block status-${visual.toLowerCase().replace(" ","-")}" data-open-item="${i.id}" style="--state:${statusColor[visual]}" data-tip="${esc(i.id+" · "+i.title+" · "+visual+" · "+progressLabel(i))}" aria-label="${esc("Open quick chamber for "+i.id+" "+i.title+", "+visual+", "+progressLabel(i))}"><span>${i.id}</span></button>`;
      }).join("")}</div>
      <footer><span>Order: Blocked → At risk → Review → Active → Later → Completed.</span><button data-block-mode="territories">Open territory sections</button></footer>
    </section>`;
  }else{
    $("#squareGrid").className="square-grid territory-block-grid";
    $("#squareGrid").innerHTML=DATA.workstreams.map(w=>{
      const a=byWs(w.code)
        .filter(i=>state.blockStatus==="all"||itemVisualState(i)===state.blockStatus)
        .sort((x,y)=>visualOrder[itemVisualState(x)]-visualOrder[itemVisualState(y)]||x.id.localeCompare(y.id));
      const s=summary(w.code);
      return `<section class="block-card health-state-${health(s).toLowerCase().replace(" ","-")}">
        <button class="block-head" data-open-territory="${w.code}">
          <img src="${w.icon}" alt="">
          <div><span>${w.code}</span><h3>${esc(w.name)}</h3><small>${esc(w.description)}</small></div>
          <b aria-hidden="true">→</b>
        </button>
        <div class="block-stats">
          <div><strong>${s.total}</strong><span>Items</span></div>
          <div><strong>${s.progressKnown?`${s.progress}%`:"—"}</strong><span>${s.progressKnown?"Progress":"Not recorded"}</span></div>
          <div class="blocked-stat"><strong>${s.blocked}</strong><span>Blocked</span></div>
        </div>
        <div class="mini-items">${a.map(i=>{
          const visual=itemVisualState(i);
          return `<button data-open-item="${i.id}" style="--state:${statusColor[visual]}" data-tip="${esc(i.id+" · "+i.title+" · "+visual+" · "+progressLabel(i))}" aria-label="${esc("Open quick chamber for "+i.id+" "+i.title+", "+visual+", "+progressLabel(i))}"></button>`;
        }).join("")}</div>
        <div class="block-footer"><span>${s.review} in review</span><span>${s.atRisk} at risk</span><button data-open-territory="${w.code}">Open territory</button></div>
      </section>`;
    }).join("");
  }
  bindDynamic();
}
function renderWaffle(){
  const statuses=["all","Blocked","At risk","Review","Active","Later","Completed"];
  $("#waffleFilters").className="filters waffle-filters-advanced";
  $("#waffleFilters").innerHTML=`
    <div class="waffle-search">
      <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M16 16l5 5"/></svg>
      <input id="waffleSearch" type="search" value="${esc(state.waffleSearch)}" placeholder="Search items, owners or IDs" aria-label="Search waffle items">
    </div>
    <div class="waffle-status-icons" role="group" aria-label="Quick status views">
      ${statuses.map(s=>`<button data-waffle-status="${s}" class="${state.waffleStatus===s?"active":""}" title="${s==="all"?"All statuses":s}"><i style="--status:${s==="all"?"#f3f3f3":statusColor[s]}"></i><span>${s==="all"?"All":s}</span></button>`).join("")}
    </div>
    <select id="waffleWs"><option value="all">All territories</option>${DATA.workstreams.map(w=>`<option value="${w.code}" ${state.waffleWs===w.code?"selected":""}>${w.code} · ${esc(w.name)}</option>`).join("")}</select>
    <select id="waffleSort" class="waffle-sort" aria-label="Sort Waffle items">
      <option value="territory" ${state.waffleSort==="territory"?"selected":""}>Territory + item ID</option>
      <option value="status" ${state.waffleSort==="status"?"selected":""}>Urgency / status</option>
      <option value="owner" ${state.waffleSort==="owner"?"selected":""}>Owner</option>
      <option value="due" ${state.waffleSort==="due"?"selected":""}>Target date</option>
    </select>`;
  const q=state.waffleSearch.trim().toLowerCase();
  const a=state.items.filter(i=>
    (state.waffleStatus==="all"||itemVisualState(i)===state.waffleStatus)&&
    (state.waffleWs==="all"||i.workstream===state.waffleWs)&&
    (!q||[i.id,i.title,i.owner,i.workstream,i.status,i.risk].some(v=>String(v).toLowerCase().includes(q)))
  );
  const sorters={
    territory:(x,y)=>x.workstream.localeCompare(y.workstream)||x.id.localeCompare(y.id),
    status:(x,y)=>visualOrder[itemVisualState(x)]-visualOrder[itemVisualState(y)]||x.workstream.localeCompare(y.workstream)||x.id.localeCompare(y.id),
    owner:(x,y)=>String(x.owner).localeCompare(String(y.owner))||x.id.localeCompare(y.id),
    due:(x,y)=>sortDate(x.due).localeCompare(sortDate(y.due))||x.id.localeCompare(y.id)
  };
  a.sort(sorters[state.waffleSort]||sorters.territory);
  $("#waffleGrid").innerHTML=a.map(i=>{
    const w=wsMap.get(i.workstream),visual=itemVisualState(i);
    return `<button class="waffle-item status-${visual.toLowerCase().replace(" ","-")}" data-open-item="${i.id}" style="--state:${statusColor[visual]}" title="${esc(i.summary||"No summary recorded")}">
      <img src="${w.icon}" alt="">
      <b>${i.id} · ${i.workstream}</b>
      <strong>${esc(short(i.title,58))}</strong>
      <span>${visual} · ${progressLabel(i)} · ${esc(i.owner)}</span>
      <em class="item-action">Open quick chamber</em>
      ${progress(i.progress,statusColor[visual],i.progressKnown)}
    </button>`;
  }).join("")||`<div class="empty-state"><h3>No items match this view</h3><p>Clear a status, territory or search filter to see more of the Atlas.</p></div>`;
  $("#waffleWs").onchange=e=>{state.waffleWs=e.target.value;renderWaffle()};
  $("#waffleSort").onchange=e=>{state.waffleSort=e.target.value;renderWaffle()};
  const search=$("#waffleSearch");
  if(search)search.oninput=e=>{state.waffleSearch=e.target.value;clearTimeout(renderWaffle.searchTimer);renderWaffle.searchTimer=setTimeout(renderWaffle,140)};
  bindDynamic();
}
function positions(layout){
  const P={},cx=800,cy=470;
  const curated={
    WS001:{x:300,y:185},WS010:{x:800,y:120},WS008:{x:1300,y:185},
    WS007:{x:175,y:455},WS005:{x:555,y:410},WS009:{x:1050,y:410},WS004:{x:1420,y:455},
    WS002:{x:395,y:735},WS003:{x:810,y:610},WS006:{x:820,y:820},WS011:{x:1245,y:735}
  };
  DATA.workstreams.forEach((w,wi)=>{
    let ax,ay;
    if(layout==="territory"){ax=235+(wi%4)*375;ay=155+Math.floor(wi/4)*315}
    else if(layout==="workflow"){ax=150+(wi%6)*260;ay=220+Math.floor(wi/6)*440}
    else {ax=curated[w.code]?.x??cx;ay=curated[w.code]?.y??cy}
    P[w.code]={x:ax,y:ay};
    const arr=byWs(w.code);
    arr.forEach((i,j)=>{
      let x,y;
      if(layout==="workflow"){x=ax+((j%6)-2.5)*31;y=ay+68+Math.floor(j/6)*29}
      else if(layout==="territory"){x=ax+((j%6)-2.5)*29;y=ay+65+Math.floor(j/6)*28}
      else {
        const a=-Math.PI/2+j*Math.PI*2/Math.max(1,arr.length)+(wi*.17);
        const rr=76+(j%4)*18;
        x=ax+Math.cos(a)*rr;y=ay+Math.sin(a)*rr;
      }
      P[i.id]={x,y};
    });
  });
  return P;
}
function renderMapSelection(){
  const host=$("#mapSelectionActions");
  if(!host)return;
  const selection=state.mapSelection;
  if(!selection){
    host.innerHTML=`<span class="map-selection-prompt">Select a territory or work item to reveal its actions.</span>`;
    return;
  }
  if(selection.type==="territory"){
    const w=wsMap.get(selection.id);
    if(!w){state.mapSelection=null;renderMapSelection();return}
    host.innerHTML=`<div class="map-selection-copy"><small>Selected territory</small><strong>${esc(w.code)} · ${esc(w.name)}</strong></div>
      <button class="atlas-cta compact-cta" data-open-territory="${w.code}" type="button"><span>Open territory</span><b>→</b></button>
      <button class="atlas-secondary compact-cta" data-open-ws="${w.code}" type="button"><span>Open quick chamber</span><b>+</b></button>`;
  }else{
    const item=itemMap().get(selection.id);
    if(!item){state.mapSelection=null;renderMapSelection();return}
    host.innerHTML=`<div class="map-selection-copy"><small>Selected work item</small><strong>${esc(item.id)} · ${esc(short(item.title,48))}</strong></div>
      <button class="atlas-cta compact-cta" data-open-item="${item.id}" type="button"><span>Open quick chamber</span><b>+</b></button>
      <button class="atlas-secondary compact-cta" data-open-territory="${item.workstream}" type="button"><span>Open territory</span><b>→</b></button>`;
  }
}
function locateInBirdseye(type,id){
  state.mapSelection={type,id};
  navigate("birdseye");
}
function renderMap(){
  const svg=$("#birdMap"),layout=state.mapLayout==="risk"?"dependency":state.mapLayout,P=positions(layout),status=$("#mapStatus").value;
  const visible=state.items.filter(i=>(status==="all"||itemVisualState(i)===status)&&(state.mapLayout!=="risk"||riskOrder[i.risk]>=2||i.status==="Blocked"));
  const visibleSet=new Set(visible.map(i=>i.id));
  let edges="";
  if(state.edges){
    const territoryEdges=[...(DATA.territoryEdges||INTERNAL.territoryEdges||[])].sort((a,b)=>(b.count||0)-(a.count||0));
    edges=territoryEdges.map((link,index)=>{
      const a=P[link.a],b=P[link.b];if(!a||!b)return"";
      const mx=(a.x+b.x)/2,my=(a.y+b.y)/2-55-(index%3)*18;
      const color=index%3===0?"#62b18c":index%3===1?"#c18b3c":"#6d8fb7";
      const label=short(link.relationship||link.relationships?.[0]||`${link.count||1} linked records`,28);
      return `<g class="territory-link-group" data-territory-edge="${link.a}|${link.b}">
        <path class="territory-edge ${index<8?"arrival":""}" d="M ${a.x} ${a.y} Q ${mx} ${my} ${b.x} ${b.y}" style="stroke:${color};color:${color};--delay:${(index*.14).toFixed(2)}s"/>
        ${state.labels&&index<14?`<text class="territory-edge-label" x="${mx}" y="${my-4}">${esc(label)}</text>`:""}
      </g>`;
    }).join("");
  }
  const nodes=visible.map(i=>{
    const p=P[i.id];if(!p)return"";
    const visual=itemVisualState(i),risk=riskOrder[i.risk]>=2?"risk":"";
    return `<circle tabindex="0" class="node-dot ${risk} ${state.mapSelection?.type==="item"&&state.mapSelection.id===i.id?"selected":""}" data-map-item="${i.id}" cx="${p.x}" cy="${p.y}" r="${visual==="Blocked"?6.4:4.8}" fill="${statusColor[visual]}" style="color:${statusColor[visual]}"><title>${esc(i.id+" · "+i.title+" · "+visual+" · "+progressLabel(i))}</title></circle>${state.labels&&(visual==="Blocked"||i.priority==="P0")?`<text class="node-label" x="${p.x+8}" y="${p.y-7}">${esc(i.id)}</text>`:""}`;
  }).join("");
  const anchors=DATA.workstreams.map(w=>{
    const p=P[w.code],s=summary(w.code),color=s.blocked?"#d45555":s.atRisk?"#5d6873":s.review?"#4e8bd8":"#d6b55a";
    return `<g tabindex="0" class="full-map-anchor ${state.mapSelection?.type==="territory"&&state.mapSelection.id===w.code?"selected":""}" data-map-ws="${w.code}" style="--anchor-color:${color}">
      <circle cx="${p.x}" cy="${p.y}" r="62"/>
      <image href="${w.icon}" x="${p.x-48}" y="${p.y-48}" width="96" height="96" preserveAspectRatio="xMidYMid meet"/>
      <text x="${p.x}" y="${p.y+78}">${w.code}</text><text class="sub" x="${p.x}" y="${p.y+93}">${esc(short(w.name,24))}</text>
      <title>${esc(w.name)} · ${s.total} work items · ${s.blocked} blocked · ${s.atRisk} at risk · ${s.progressKnown?`${s.progress}% progress`:"progress not recorded"}</title>
    </g>`;
  }).join("");
  const center=`<g class="map-centre" data-map-home><circle cx="800" cy="470" r="82"/><image href="assets/brand/command-centre-emblem.png" x="728" y="398" width="144" height="144" preserveAspectRatio="xMidYMid meet"/></g>`;
  svg.innerHTML=`<g id="mapLayer">${edges}${nodes}${anchors}${center}</g>`;
  $$("[data-map-ws]",svg).forEach(g=>{
    const selectTerritory=()=>{state.mapSelection={type:"territory",id:g.dataset.mapWs};renderMap();openDrawer(g.dataset.mapWs)};
    g.onclick=selectTerritory;
    g.onkeydown=e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();selectTerritory()}};
    g.onmouseenter=()=>$$("[data-territory-edge]",svg).forEach(edge=>edge.classList.toggle("hot",edge.dataset.territoryEdge.split("|").includes(g.dataset.mapWs)));
    g.onmouseleave=()=>$$("[data-territory-edge]",svg).forEach(edge=>edge.classList.remove("hot"));
  });
  $$("[data-map-item]",svg).forEach(n=>{
    const selectItem=()=>{state.mapSelection={type:"item",id:n.dataset.mapItem};renderMap();openItem(n.dataset.mapItem)};
    n.onclick=e=>{e.stopPropagation();selectItem()};
    n.onkeydown=e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();selectItem()}};
  });
  $("[data-map-home]",svg).onclick=()=>navigate("overview");
  renderMapSelection();
  bindDynamic();
}
function renderTimeline(){
  const allMilestones=[...INTERNAL.milestones].sort((a,b)=>sortDate(a.target_date).localeCompare(sortDate(b.target_date))||String(a.milestone_id).localeCompare(String(b.milestone_id)));
  const statuses=[...new Set(allMilestones.map(m=>String(m.status||"Not recorded")))].sort();
  const q=state.milestoneSearch.trim().toLowerCase();
  const milestones=allMilestones.filter(m=>{
    const territory=territoryFromId(m.territory_id);
    const searchMatch=!q||[m.milestone_id,m.title,m.description,m.owner,m.status,m.mapping_note,territory].some(v=>String(v||"").toLowerCase().includes(q));
    const statusMatch=state.milestoneStatus==="all"||String(m.status||"Not recorded")===state.milestoneStatus;
    const territoryMatch=state.milestoneTerritory==="all"||territory===state.milestoneTerritory;
    return searchMatch&&statusMatch&&territoryMatch;
  });
  const dated=allMilestones.filter(m=>dateValue(m.target_date));
  const pastDue=dated.filter(m=>new Date(dateValue(m.target_date)+"T23:59:59")<new Date()&&!/completed|closed|approved/i.test(String(m.status))).length;
  const territoryCount=new Set(allMilestones.map(m=>territoryFromId(m.territory_id)).filter(Boolean)).size;
  const itemIds=itemMap();
  const linkedItem=m=>String(m.related_item_ids||"").split(/[,\s;|]+/).find(id=>itemIds.has(id))||"";
  $("#timeline").innerHTML=`
    <section class="command-tools" aria-label="Milestone search and filters">
      <div class="command-search"><input id="milestoneSearch" type="search" value="${esc(state.milestoneSearch)}" placeholder="Search milestones" aria-label="Search milestones"></div>
      <select id="milestoneStatus" aria-label="Filter milestones by status"><option value="all">All statuses</option>${statuses.map(s=>`<option value="${esc(s)}" ${state.milestoneStatus===s?"selected":""}>${esc(s)}</option>`).join("")}</select>
      <select id="milestoneTerritory" aria-label="Filter milestones by territory"><option value="all">All territories</option>${DATA.workstreams.map(w=>`<option value="${w.code}" ${state.milestoneTerritory===w.code?"selected":""}>${w.code} · ${esc(w.name)}</option>`).join("")}</select>
      <button class="command-reset" id="milestoneReset" type="button">Reset</button>
      <span class="command-result-count">${milestones.length} shown</span>
    </section>
    <section class="milestone-summary">
      <div><span>Milestone records</span><strong>${allMilestones.length}</strong><small>${milestones.length} in the current view</small></div>
      <div><span>Territories represented</span><strong>${territoryCount}</strong><small>Across the programme</small></div>
      <div class="${pastDue?"attention":""}"><span>Past dated gates</span><strong>${pastDue}</strong><small>Dates require confirmation or closure</small></div>
      <div><span>Progress authority</span><strong>—</strong><small>No canonical percentage field</small></div>
    </section>
    <section class="milestone-layout">
      <div class="milestone-groups">
        ${milestones.map(m=>{
          const territory=territoryFromId(m.territory_id),itemId=linkedItem(m);
          return `<article class="milestone-card ${String(m.status).toLowerCase().includes("block")?"has-blocker":""}">
            <header><div><p class="eyebrow">${dateLabel(m.target_date)} · ${esc(m.milestone_id)}</p><h2>${esc(m.title)}</h2></div><span class="status-chip">${esc(m.status||"Not recorded")}</span></header>
            <p>${esc(m.description||"No milestone description recorded.")}</p>
            <div class="milestone-stats"><span>${esc(territory||"No territory")}</span><span>${esc(m.owner||"Unassigned")}</span><span>${esc(m.mapping_note||"Source mapped")}</span></div>
            <div class="command-card-actions">
              ${itemId?`<button class="atlas-cta compact-cta" data-open-item="${itemId}" type="button"><span>Open quick chamber</span><b>+</b></button>`:""}
              ${territory?`<button class="atlas-secondary compact-cta" data-open-territory="${territory}" type="button"><span>Open territory</span><b>→</b></button>`:""}
              <button class="record-link" data-open-internal="milestone|${esc(m.milestone_id)}" type="button">Open milestone record</button>
            </div>
          </article>`;
        }).join("")||`<div class="entity-empty-state"><div><h3>No milestones match this view</h3><p>Clear the search or reset the filters.</p></div></div>`}
      </div>
      <aside class="milestone-next">
        <p class="eyebrow">Next dated actions</p><h2>What is approaching</h2>
        ${dated.slice(0,8).map(m=>`<button data-open-internal="milestone|${esc(m.milestone_id)}" type="button"><span>${dateLabel(m.target_date)}</span><strong>${esc(m.title)}</strong><small>${esc(m.milestone_id)} · ${esc(territoryFromId(m.territory_id)||"No territory")}</small></button>`).join("")||`<div class="entity-empty-state">No dated milestone is recorded.</div>`}
      </aside>
    </section>`;
  const search=$("#milestoneSearch");
  if(search)search.oninput=e=>{state.milestoneSearch=e.target.value;clearTimeout(renderTimeline.searchTimer);renderTimeline.searchTimer=setTimeout(renderTimeline,120)};
  $("#milestoneStatus").onchange=e=>{state.milestoneStatus=e.target.value;renderTimeline()};
  $("#milestoneTerritory").onchange=e=>{state.milestoneTerritory=e.target.value;renderTimeline()};
  $("#milestoneReset").onclick=()=>{state.milestoneSearch="";state.milestoneStatus="all";state.milestoneTerritory="all";renderTimeline()};
  bindDynamic();
}
function registerItems(){
  const q=state.search.trim().toLowerCase();
  return state.items.filter(i=>(state.registerStatus==="all"||i.status===state.registerStatus)&&(state.registerRisk==="all"||(state.registerRisk==="high"&&riskOrder[i.risk]>=2)||i.risk===state.registerRisk)&&(state.registerWs==="all"||i.workstream===state.registerWs)&&(!q||Object.values(i).join(" ").toLowerCase().includes(q)));
}
function renderRegister(){
  const items=registerItems();
  $("#registerTools").className="filters command-tools register-tools";
  $("#registerTools").innerHTML=`
    <div class="command-search"><input id="registerSearch" type="search" placeholder="Search all ${state.items.length} work items" value="${esc(state.search)}" aria-label="Search the item register"></div>
    <select id="registerStatus" aria-label="Filter the register by status"><option value="all">All statuses</option>${["Completed","Active","Review","Blocked","Later"].map(s=>`<option value="${s}" ${state.registerStatus===s?"selected":""}>${s}</option>`).join("")}</select>
    <select id="registerRisk" aria-label="Filter the register by risk"><option value="all">All risks</option><option value="high" ${state.registerRisk==="high"?"selected":""}>High + critical</option>${["Low","Medium","High","Critical"].map(r=>`<option value="${r}" ${state.registerRisk===r?"selected":""}>${r}</option>`).join("")}</select>
    <select id="registerWs" aria-label="Filter the register by territory"><option value="all">All territories</option>${DATA.workstreams.map(w=>`<option value="${w.code}" ${state.registerWs===w.code?"selected":""}>${w.code} · ${esc(w.name)}</option>`).join("")}</select>
    <button class="command-reset" id="registerReset" type="button">Reset</button>
    <span class="command-result-count">${items.length} shown</span>`;
  $("#registerBody").innerHTML=items.map(i=>`<tr data-open-item="${i.id}"><td>${i.id}</td><td>${esc(i.title)}</td><td>${i.workstream}</td><td>${chip(i.status)}</td><td>${riskChip(i.risk)}</td><td>${esc(i.owner)}</td><td>${dateLabel(i.due)}</td><td class="${knownProgress(i)?"":"not-recorded"}">${progressLabel(i)}</td><td><button class="table-action" data-open-item="${i.id}" type="button">Open quick chamber</button></td></tr>`).join("")||`<tr><td colspan="9"><div class="entity-empty-state">No work items match the current search and filters.</div></td></tr>`;
  $("#registerSearch").oninput=e=>{state.search=e.target.value;clearTimeout(renderRegister.searchTimer);renderRegister.searchTimer=setTimeout(renderRegister,120)};
  $("#registerStatus").onchange=e=>{state.registerStatus=e.target.value;renderRegister()};
  $("#registerRisk").onchange=e=>{state.registerRisk=e.target.value;renderRegister()};
  $("#registerWs").onchange=e=>{state.registerWs=e.target.value;renderRegister()};
  $("#registerReset").onclick=()=>{state.search="";state.registerStatus="all";state.registerRisk="all";state.registerWs="all";renderRegister()};
  bindDynamic();
}
function renderDependencies(){
  const allRecords=[...INTERNAL.dependencies];
  const q=state.dependencySearch.trim().toLowerCase();
  const records=allRecords.filter(record=>{
    const territory=territoryFromId(record.territory_id);
    const risk=String(record.risk_level||"Not recorded");
    const searchMatch=!q||[record.dependency_id,record.description,record.dependency_type,record.from_item_id,record.from_item_raw,record.to_item_id,record.to_item_raw,record.owner,record.status,record.next_action,territory].some(value=>String(value||"").toLowerCase().includes(q));
    const riskMatch=state.dependencyRisk==="all"||risk===state.dependencyRisk||(state.dependencyRisk==="Other"&&!["Red","Amber"].includes(risk));
    const territoryMatch=state.dependencyTerritory==="all"||territory===state.dependencyTerritory;
    return searchMatch&&riskMatch&&territoryMatch;
  }).sort((a,b)=>{
    const order={Red:0,Amber:1,Other:2};
    return (order[a.risk_level]??2)-(order[b.risk_level]??2)||String(a.dependency_id).localeCompare(String(b.dependency_id));
  });
  const unresolved=allRecords.filter(record=>record.relationship_key_quality&&String(record.relationship_key_quality).toLowerCase()!=="stable").length;
  const resolved=allRecords.filter(record=>record.from_item_id&&record.to_item_id).length;
  const high=allRecords.filter(record=>/red|high|critical/i.test(String(record.risk_level))).length;
  const items=itemMap();
  const riskLabel=value=>/red|critical|high/i.test(String(value))?"Critical":/amber|medium/i.test(String(value))?"Medium":"Low";
  $("#dependencyList").className="command-page-content";
  $("#dependencyList").innerHTML=`
    <section class="command-tools" aria-label="Dependency search and filters">
      <div class="command-search"><input id="dependencySearch" type="search" value="${esc(state.dependencySearch)}" placeholder="Search dependencies" aria-label="Search dependencies"></div>
      <select id="dependencyRisk" aria-label="Filter dependencies by risk"><option value="all">All risk states</option>${["Red","Amber","Other"].map(risk=>`<option value="${risk}" ${state.dependencyRisk===risk?"selected":""}>${risk}</option>`).join("")}</select>
      <select id="dependencyTerritory" aria-label="Filter dependencies by territory"><option value="all">All territories</option>${DATA.workstreams.map(workstream=>`<option value="${workstream.code}" ${state.dependencyTerritory===workstream.code?"selected":""}>${workstream.code} · ${esc(workstream.name)}</option>`).join("")}</select>
      <button class="command-reset" id="dependencyReset" type="button">Reset</button>
      <span class="command-result-count">${records.length} shown</span>
    </section>
    <section class="command-summary-grid">
      <div><span>Dependency records</span><strong>${allRecords.length}</strong><small>${records.length} in the current view</small></div>
      <div><span>Resolved endpoints</span><strong>${resolved}</strong><small>Both item IDs are present</small></div>
      <div class="critical"><span>Unstable endpoints</span><strong>${unresolved}</strong><small>Human review is still required</small></div>
      <div class="review"><span>High / critical risk</span><strong>${high}</strong><small>Requires internal review</small></div>
    </section>
    <section class="rc2-record-table-shell">
      <header class="rc2-record-table-head"><div><p>Delivery chains</p><h2>Dependency register</h2></div><span>${records.length} of ${allRecords.length} records</span></header>
      <div class="rc2-record-table-scroll">
        <table class="rc2-record-table dependency-record-table">
          <colgroup><col style="width:8%"><col style="width:8%"><col style="width:15%"><col style="width:15%"><col style="width:12%"><col style="width:9%"><col style="width:10%"><col style="width:9%"><col style="width:14%"></colgroup>
          <thead><tr><th>ID</th><th>Territory</th><th>From</th><th>To</th><th>Type</th><th>Risk</th><th>Owner</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>${records.map(record=>{
            const territory=territoryFromId(record.territory_id);
            const itemId=items.has(record.from_item_id)?record.from_item_id:items.has(record.to_item_id)?record.to_item_id:"";
            return `<tr>
              <td><button class="record-link rc2-record-id" data-open-internal="dependency|${esc(record.dependency_id)}" type="button">${esc(record.dependency_id)}</button></td>
              <td><strong>${esc(territory||"Unmapped")}</strong><small>${esc(wsMap.get(territory)?.name||"Territory not resolved")}</small></td>
              <td><strong>${esc(record.from_item_id||record.from_item_raw||"Unresolved source")}</strong><small>From</small></td>
              <td><strong>${esc(record.to_item_id||record.to_item_raw||"Unresolved target")}</strong><small>To</small></td>
              <td><strong>${esc(record.dependency_type||"Not recorded")}</strong><small>${esc(short(record.description||"",48))}</small></td>
              <td>${riskChip(riskLabel(record.risk_level))}</td>
              <td>${esc(record.owner||"Unassigned")}</td>
              <td><strong>${esc(record.status||"Not recorded")}</strong><small>${esc(record.relationship_key_quality||"Key quality not recorded")}</small></td>
              <td><div class="rc2-record-actions">
                ${itemId?`<button data-open-item="${itemId}" type="button">Open quick chamber</button><button class="secondary" data-locate-item="${itemId}" type="button">Locate in Bird’s-eye</button>`:`<button data-open-internal="dependency|${esc(record.dependency_id)}" type="button">Open record</button>${territory?`<button class="secondary" data-locate-territory="${territory}" type="button">Locate in Bird’s-eye</button>`:""}`}
              </div></td>
            </tr>`;
          }).join("")||`<tr><td colspan="9"><div class="entity-empty-state"><h3>No dependencies match this view</h3><p>Clear the search or reset the filters.</p></div></td></tr>`}</tbody>
        </table>
      </div>
    </section>`;
  const search=$("#dependencySearch");
  if(search)search.oninput=event=>{state.dependencySearch=event.target.value;clearTimeout(renderDependencies.searchTimer);renderDependencies.searchTimer=setTimeout(renderDependencies,120)};
  $("#dependencyRisk").onchange=event=>{state.dependencyRisk=event.target.value;renderDependencies()};
  $("#dependencyTerritory").onchange=event=>{state.dependencyTerritory=event.target.value;renderDependencies()};
  $("#dependencyReset").onclick=()=>{state.dependencySearch="";state.dependencyRisk="all";state.dependencyTerritory="all";renderDependencies()};
  bindDynamic();
}
function renderEvidence(){
  const allRecords=[...INTERNAL.evidence];
  const isApproved=record=>/approved|verified|complete/i.test(String(record.verification_status));
  const q=state.evidenceSearch.trim().toLowerCase();
  const records=allRecords.filter(record=>{
    const territory=territoryFromId(record.territory_id);
    const searchMatch=!q||[record.evidence_id,record.title,record.notes,record.source_title,record.source_authority,record.verification_status,record.verified_by,record.evidence_type,territory].some(value=>String(value||"").toLowerCase().includes(q));
    const statusMatch=state.evidenceStatus==="all"||(state.evidenceStatus==="approved"&&isApproved(record))||(state.evidenceStatus==="open"&&!isApproved(record));
    const territoryMatch=state.evidenceTerritory==="all"||territory===state.evidenceTerritory;
    return searchMatch&&statusMatch&&territoryMatch;
  }).sort((a,b)=>String(a.evidence_id).localeCompare(String(b.evidence_id)));
  const approved=allRecords.filter(isApproved).length;
  const open=allRecords.length-approved;
  const withSource=allRecords.filter(record=>String(record.source_url||record.source_title||"").trim()).length;
  $("#evidenceGrid").className="command-page-content";
  $("#evidenceGrid").innerHTML=`
    <section class="command-tools" aria-label="Evidence search and filters">
      <div class="command-search"><input id="evidenceSearch" type="search" value="${esc(state.evidenceSearch)}" placeholder="Search evidence" aria-label="Search evidence"></div>
      <select id="evidenceStatus" aria-label="Filter evidence by assurance state"><option value="all">All assurance states</option><option value="approved" ${state.evidenceStatus==="approved"?"selected":""}>Approved / verified</option><option value="open" ${state.evidenceStatus==="open"?"selected":""}>Open assurance</option></select>
      <select id="evidenceTerritory" aria-label="Filter evidence by territory"><option value="all">All territories</option>${DATA.workstreams.map(workstream=>`<option value="${workstream.code}" ${state.evidenceTerritory===workstream.code?"selected":""}>${workstream.code} · ${esc(workstream.name)}</option>`).join("")}</select>
      <button class="command-reset" id="evidenceReset" type="button">Reset</button>
      <span class="command-result-count">${records.length} shown</span>
    </section>
    <section class="command-summary-grid">
      <div><span>Evidence records</span><strong>${allRecords.length}</strong><small>${records.length} in the current view</small></div>
      <div><span>Approved / verified</span><strong>${approved}</strong><small>Based on the recorded assurance state</small></div>
      <div class="review"><span>Open assurance</span><strong>${open}</strong><small>Not yet recorded as verified</small></div>
      <div><span>Source attached</span><strong>${withSource}</strong><small>URL or source title is present</small></div>
    </section>
    <section class="rc2-record-table-shell">
      <header class="rc2-record-table-head"><div><p>Assurance library</p><h2>Evidence register</h2></div><span>${records.length} of ${allRecords.length} records</span></header>
      <div class="rc2-record-table-scroll">
        <table class="rc2-record-table evidence-record-table">
          <colgroup><col style="width:8%"><col style="width:8%"><col style="width:25%"><col style="width:10%"><col style="width:12%"><col style="width:13%"><col style="width:12%"><col style="width:12%"></colgroup>
          <thead><tr><th>ID</th><th>Territory</th><th>Evidence</th><th>Type</th><th>Assurance</th><th>Source authority</th><th>Verified by / date</th><th>Actions</th></tr></thead>
          <tbody>${records.map(record=>{
            const territory=territoryFromId(record.territory_id);
            return `<tr>
              <td><span class="rc2-record-id">${esc(record.evidence_id)}</span></td>
              <td><strong>${esc(territory||"Unmapped")}</strong><small>${esc(wsMap.get(territory)?.name||"Territory not resolved")}</small></td>
              <td><strong>${esc(record.title||"Untitled evidence record")}</strong><small>${esc(record.notes||record.source_title||"No supporting note recorded")}</small></td>
              <td>${esc(record.evidence_type||"Not recorded")}</td>
              <td><span class="evidence-state ${isApproved(record)?"approved":"open"}">${esc(record.verification_status||"Not recorded")}</span></td>
              <td><strong>${esc(record.source_authority||"Not recorded")}</strong><small>${esc(record.source_title||"Source title not recorded")}</small></td>
              <td><strong>${esc(record.verified_by||"Not recorded")}</strong><small>${dateLabel(record.verified_date)}</small></td>
              <td><div class="rc2-record-actions"><button data-open-internal="evidence|${esc(record.evidence_id)}" type="button">Open evidence</button>${territory?`<button class="secondary" data-open-territory="${territory}" type="button">Open territory</button>`:""}</div></td>
            </tr>`;
          }).join("")||`<tr><td colspan="8"><div class="entity-empty-state"><h3>No evidence matches this view</h3><p>Clear the search or reset the filters.</p></div></td></tr>`}</tbody>
        </table>
      </div>
    </section>`;
  const search=$("#evidenceSearch");
  if(search)search.oninput=event=>{state.evidenceSearch=event.target.value;clearTimeout(renderEvidence.searchTimer);renderEvidence.searchTimer=setTimeout(renderEvidence,120)};
  $("#evidenceStatus").onchange=event=>{state.evidenceStatus=event.target.value;renderEvidence()};
  $("#evidenceTerritory").onchange=event=>{state.evidenceTerritory=event.target.value;renderEvidence()};
  $("#evidenceReset").onclick=()=>{state.evidenceSearch="";state.evidenceStatus="all";state.evidenceTerritory="all";renderEvidence()};
  bindDynamic();
}
function renderDecisions(){
  const allRecords=[...INTERNAL.decisions];
  const isApproved=record=>/approved|closed|complete|accepted/i.test(String(record.decision_status));
  const isRejected=record=>/rejected/i.test(String(record.decision_status));
  const q=state.decisionSearch.trim().toLowerCase();
  const records=allRecords.filter(record=>{
    const territory=territoryFromId(record.territory_id);
    const searchMatch=!q||[record.decision_id,record.title,record.decision_summary,record.impact_if_unresolved,record.decision_owner,record.decision_status,record.approval_status,record.notes,territory].some(value=>String(value||"").toLowerCase().includes(q));
    const statusMatch=state.decisionStatus==="all"||(state.decisionStatus==="approved"&&isApproved(record))||(state.decisionStatus==="open"&&!isApproved(record)&&!isRejected(record))||(state.decisionStatus==="rejected"&&isRejected(record));
    const territoryMatch=state.decisionTerritory==="all"||territory===state.decisionTerritory;
    return searchMatch&&statusMatch&&territoryMatch;
  }).sort((a,b)=>String(a.decision_id).localeCompare(String(b.decision_id)));
  const open=allRecords.filter(record=>!isApproved(record)&&!isRejected(record)).length;
  const approved=allRecords.filter(isApproved).length;
  const rejected=allRecords.filter(isRejected).length;
  const rejectedRefs=INTERNAL.validationIssues.filter(issue=>String(issue.observed_value||"").includes("D008")).length;
  $("#decisionGrid").className="command-page-content";
  $("#decisionGrid").innerHTML=`
    <section class="command-tools" aria-label="Decision search and filters">
      <div class="command-search"><input id="decisionSearch" type="search" value="${esc(state.decisionSearch)}" placeholder="Search decisions" aria-label="Search decisions"></div>
      <select id="decisionStatus" aria-label="Filter decisions by state"><option value="all">All decision states</option><option value="open" ${state.decisionStatus==="open"?"selected":""}>Open</option><option value="approved" ${state.decisionStatus==="approved"?"selected":""}>Approved / closed</option><option value="rejected" ${state.decisionStatus==="rejected"?"selected":""}>Rejected</option></select>
      <select id="decisionTerritory" aria-label="Filter decisions by territory"><option value="all">All territories</option>${DATA.workstreams.map(workstream=>`<option value="${workstream.code}" ${state.decisionTerritory===workstream.code?"selected":""}>${workstream.code} · ${esc(workstream.name)}</option>`).join("")}</select>
      <button class="command-reset" id="decisionReset" type="button">Reset</button>
      <span class="command-result-count">${records.length} shown</span>
    </section>
    <section class="command-summary-grid">
      <div><span>Decision records</span><strong>${allRecords.length}</strong><small>${records.length} in the current view</small></div>
      <div><span>Open decisions</span><strong>${open}</strong><small>Still shaping delivery</small></div>
      <div><span>Approved / closed</span><strong>${approved}</strong><small>${rejected} rejected record${rejected===1?"":"s"}</small></div>
      <div class="critical"><span>Rejected D008 references</span><strong>${rejectedRefs}</strong><small>Internal validation finding</small></div>
    </section>
    <section class="rc2-record-table-shell">
      <header class="rc2-record-table-head"><div><p>Governance record</p><h2>Decision register</h2></div><span>${records.length} of ${allRecords.length} records</span></header>
      <div class="rc2-record-table-scroll">
        <table class="rc2-record-table decision-record-table">
          <colgroup><col style="width:8%"><col style="width:8%"><col style="width:28%"><col style="width:10%"><col style="width:13%"><col style="width:10%"><col style="width:10%"><col style="width:13%"></colgroup>
          <thead><tr><th>ID</th><th>Territory</th><th>Decision</th><th>State</th><th>Owner</th><th>Target date</th><th>Approval</th><th>Actions</th></tr></thead>
          <tbody>${records.map(record=>{
            const territory=territoryFromId(record.territory_id);
            return `<tr>
              <td><span class="rc2-record-id">${esc(record.decision_id)}</span></td>
              <td><strong>${esc(territory||"Unmapped")}</strong><small>${esc(wsMap.get(territory)?.name||"Territory not resolved")}</small></td>
              <td><strong>${esc(record.title||"Untitled decision")}</strong><small>${esc(record.decision_summary||record.impact_if_unresolved||"No decision summary recorded")}</small></td>
              <td><span class="status-chip">${esc(record.decision_status||"Not recorded")}</span></td>
              <td>${esc(record.decision_owner||"Unassigned")}</td>
              <td>${dateLabel(record.target_date||record.decision_date)}</td>
              <td><strong>${esc(record.approval_status||"Not recorded")}</strong><small>${esc(record.approved_by||"Approver not recorded")}</small></td>
              <td><div class="rc2-record-actions"><button data-open-internal="decision|${esc(record.decision_id)}" type="button">Open decision</button>${territory?`<button class="secondary" data-open-territory="${territory}" type="button">Open territory</button>`:""}</div></td>
            </tr>`;
          }).join("")||`<tr><td colspan="8"><div class="entity-empty-state"><h3>No decisions match this view</h3><p>Clear the search or reset the filters.</p></div></td></tr>`}</tbody>
        </table>
      </div>
    </section>`;
  const search=$("#decisionSearch");
  if(search)search.oninput=event=>{state.decisionSearch=event.target.value;clearTimeout(renderDecisions.searchTimer);renderDecisions.searchTimer=setTimeout(renderDecisions,120)};
  $("#decisionStatus").onchange=event=>{state.decisionStatus=event.target.value;renderDecisions()};
  $("#decisionTerritory").onchange=event=>{state.decisionTerritory=event.target.value;renderDecisions()};
  $("#decisionReset").onclick=()=>{state.decisionSearch="";state.decisionStatus="all";state.decisionTerritory="all";renderDecisions()};
  bindDynamic();
}
let atlasTooltip=null,atlasTooltipTarget=null;
function internalValue(value){
  if(value===null||value===undefined||value==="")return"Not recorded";
  if(Array.isArray(value))return value.length?value.join(", "):"None";
  if(typeof value==="object")return JSON.stringify(value);
  return String(value);
}

function openInternalDetail(key){
  const [kind,id]=String(key||"").split("|");
  const sets={
    milestone:["milestones","milestone_id"],
    dependency:["dependencies","dependency_id"],
    evidence:["evidence","evidence_id"],
    decision:["decisions","decision_id"],
    risk:["risksBlockers","risk_id"],
    document:["documents","document_id"],
    record:["allRecords","record_key"],
    issue:["validationIssues","issue_id"]
  };
  const config=sets[kind];if(!config)return;
  const record=(INTERNAL[config[0]]||[]).find(row=>String(row[config[1]])===id);
  if(!record)return;
  const title=record.title||record.description||record.check||record[config[1]]||"Internal record";
  const identifier=record[config[1]]||id;
  const fields=Object.entries(record).filter(([,value])=>value!==null&&value!==undefined&&value!=="");
  const relatedItem=record.related_item_id||record.from_item_id||record.to_item_id||record.record_or_row_id;
  $("#itemContent").innerHTML=`
    <p class="eyebrow">INTERNAL · ${esc(kind.toUpperCase())} · ${esc(identifier)}</p>
    <h2>${esc(title)}</h2>
    <p>This private read-only record preserves source provenance and unresolved fields exactly as supplied.</p>
    <div class="internal-detail-grid">${fields.map(([field,value])=>`<div><span>${esc(field.replaceAll("_"," "))}</span><strong>${esc(internalValue(value))}</strong></div>`).join("")}</div>
    ${relatedItem&&itemMap().has(relatedItem)?`<button class="gold" data-open-item="${esc(relatedItem)}">Open quick chamber</button>`:""}
    <button class="ghost" data-view="internal">Return to internal audit</button>`;
  itemModalLastFocus=document.activeElement;
  const itemModal=$("#itemModal");
  itemModal.hidden=false;
  itemModal.setAttribute("aria-hidden","false");
  const recordLabel=kind==="evidence"?"Evidence record details":kind==="decision"?"Decision record details":`${kind.charAt(0).toUpperCase()+kind.slice(1)} record details`;
  itemModal.setAttribute("aria-label",recordLabel);
  syncOverlayBody();
  bindDynamic();
  focusOverlay(itemModal);
}

function internalRecordTypeOptions(){
  return Object.keys(INTERNAL.meta.recordTypeCounts||{}).sort();
}

function renderInternal(){
  const root=$("#internalDashboard");if(!root)return;
  root.className="internal-dashboard";
  const meta=INTERNAL.meta||{};
  const q=state.internalSearch.trim().toLowerCase();
  const matchText=row=>!q||Object.values(row).map(internalValue).join(" ").toLowerCase().includes(q);
  const matchTerritory=row=>{
    if(state.internalTerritory==="all")return true;
    const territory=territoryFromId(row.territory_id||row.workstream_id||"");
    return territory===state.internalTerritory||String(row.territory_id||"")===state.internalTerritory;
  };
  const issues=(INTERNAL.validationIssues||[]).filter(row=>
    (state.internalSeverity==="all"||row.severity===state.internalSeverity)&&
    matchTerritory(row)&&matchText(row)
  );
  const records=(INTERNAL.allRecords||[]).filter(row=>
    (state.internalType==="all"||row.record_type===state.internalType)&&
    matchTerritory(row)&&matchText(row)
  );
  const tabs=[
    ["summary","Summary"],
    ["validation","Validation issues"],
    ["records","All records"],
    ["entities","Canonical entities"],
    ["authority","Authority notes"]
  ];

  let body="";
  if(state.internalTab==="summary"){
    const high=(meta.severityCounts?.Critical||0)+(meta.severityCounts?.High||0);
    body=`
      <section class="internal-panel">
        <header><div><span>CONTROL POSITION</span><h2>Read-only full-data staging</h2></div><span>Source modified ${esc(meta.sourceModified||"Not recorded")}</span></header>
        <div class="internal-entity-grid">
          <article class="internal-entity-card"><span>Source authority</span><strong>Google Sheet</strong><p>The supplied export remains authoritative. Atlas makes no write-back.</p></article>
          <article class="internal-entity-card"><span>Progress authority</span><strong>None</strong><p>${esc(meta.progressAuthority||"No authoritative percentage exists.")}</p></article>
          <article class="internal-entity-card"><span>Duplicate IDs</span><strong>${(meta.duplicateNodeIds||[]).length}</strong><p>${esc((meta.duplicateNodeIds||[]).join(", ")||"No duplicates recorded")}</p></article>
          <article class="internal-entity-card"><span>High / critical findings</span><strong>${high}</strong><p>All findings remain visible in the validation register.</p></article>
          <article class="internal-entity-card"><span>Public exposure</span><strong>None</strong><p>This package is marked private and must not be placed on public GitHub Pages.</p></article>
        </div>
      </section>
      <section class="internal-panel">
        <header><div><span>PRIORITY FINDINGS</span><h2>Critical and high issues</h2></div><span>${meta.unresolvedFindingCount||0} unresolved high / critical findings</span></header>
        <div class="internal-table-wrap"><table class="internal-table"><thead><tr><th>Severity</th><th>Issue</th><th>Worksheet</th><th>Record</th><th>Description</th><th>Suggested action</th></tr></thead><tbody>
          ${(INTERNAL.unresolvedIssues||[]).map(issue=>`<tr data-open-internal="issue|${esc(issue.issue_id)}"><td><span class="severity-chip" style="--severity:${severityColor(issue.severity)}">${esc(issue.severity)}</span></td><td>${esc(issue.issue_id)}<br><small>${esc(issue.check)}</small></td><td>${esc(issue.worksheet)}</td><td>${esc(issue.record_or_row_id||"Not recorded")}</td><td>${esc(issue.description)}</td><td>${esc(issue.suggested_action||"Human review required")}</td></tr>`).join("")}
        </tbody></table></div>
      </section>`;
  }else if(state.internalTab==="validation"){
    body=`<section class="internal-panel">
      <header><div><span>VALIDATION REGISTER</span><h2>${issues.length} findings shown</h2></div><span>All ${meta.validationFindingCount||INTERNAL.validationIssues.length} findings retained</span></header>
      <div class="internal-table-wrap"><table class="internal-table"><thead><tr><th>Severity</th><th>Issue</th><th>Territory</th><th>Worksheet</th><th>Record / row</th><th>Field</th><th>Observed value</th><th>Description</th><th>Action</th></tr></thead><tbody>
        ${issues.map(issue=>`<tr data-open-internal="issue|${esc(issue.issue_id)}"><td><span class="severity-chip" style="--severity:${severityColor(issue.severity)}">${esc(issue.severity)}</span></td><td>${esc(issue.issue_id)}<br><small>${esc(issue.check)}</small></td><td>${esc(territoryFromId(issue.territory_id)||issue.territory_id||"—")}</td><td>${esc(issue.worksheet)}</td><td>${esc(issue.record_or_row_id||"Not recorded")}</td><td>${esc(issue.field||"—")}</td><td>${esc(short(issue.observed_value||"Not recorded",70))}</td><td>${esc(issue.description)}</td><td>${esc(issue.suggested_action||"Human review required")}</td></tr>`).join("")}
      </tbody></table></div>
    </section>`;
  }else if(state.internalTab==="records"){
    body=`<section class="internal-panel">
      <header><div><span>PHYSICAL NODE REGISTER</span><h2>${records.length} records shown</h2></div><span>${meta.uniqueNodeIds||0} unique IDs from ${meta.totalPhysicalRecords||records.length} physical rows</span></header>
      <div class="internal-table-wrap"><table class="internal-table"><thead><tr><th>Record key</th><th>Node ID</th><th>Type</th><th>Territory</th><th>Title</th><th>Status</th><th>Risk</th><th>Owner</th><th>Source</th><th>Row</th></tr></thead><tbody>
        ${records.map(record=>`<tr data-open-internal="record|${esc(record.record_key)}"><td>${esc(record.record_key)}</td><td>${esc(record.node_id||"Not recorded")}</td><td>${esc(record.record_type||"Not recorded")}</td><td>${esc(territoryFromId(record.workstream_id)||record.workstream_id||"—")}</td><td>${esc(record.title||"Untitled record")}</td><td>${esc(record.state_bucket||record.status_raw||"Not recorded")}</td><td>${esc(record.rag_risk||"Not recorded")}</td><td>${esc(record.owner||"Unassigned")}</td><td>${esc(record.source_worksheet||"Not recorded")}</td><td>${esc(record.source_row_id||"—")}</td></tr>`).join("")}
      </tbody></table></div>
    </section>`;
  }else if(state.internalTab==="entities"){
    const entities=[
      ["Work items",state.items.length,"Operational items used by Block, Waffle and Register."],
      ["Milestones",INTERNAL.milestones.length,"Output and control-gate records."],
      ["Dependencies",INTERNAL.dependencies.length,"Resolved and unresolved delivery relationships."],
      ["Evidence",INTERNAL.evidence.length,"Assurance records and source authority."],
      ["Decisions",INTERNAL.decisions.length,"Governance choices and approval state."],
      ["Risks / blockers",INTERNAL.risksBlockers.length,"Risk, blocker and mitigation records."],
      ["Documents / sources",INTERNAL.documents.length,"Canonical and supporting source records."],
      ["Territories",INTERNAL.territories.length,"Programme workstream definitions."]
    ];
    body=`<section class="internal-panel"><header><div><span>CANONICAL ENTITY LAYER</span><h2>Normalised Atlas collections</h2></div><span>Derived from the controlled export</span></header>
      <div class="internal-entity-grid">${entities.map(([label,count,copy])=>`<article class="internal-entity-card"><span>${label}</span><strong>${count}</strong><p>${copy}</p></article>`).join("")}</div>
    </section>`;
  }else{
    body=`<section class="internal-panel"><header><div><span>AUTHORITY MATRIX</span><h2>Source and key decisions</h2></div><span>${INTERNAL.authorityNotes.length} canonical entity notes</span></header>
      <div class="internal-table-wrap"><table class="internal-table"><thead><tr><th>Entity</th><th>Primary source</th><th>Secondary source</th><th>Key</th><th>Authority note</th></tr></thead><tbody>
        ${INTERNAL.authorityNotes.map(note=>`<tr><td>${esc(note.canonical_entity)}</td><td>${esc(note.primary_source)}</td><td>${esc(note.secondary_source||"None")}</td><td>${esc(note.key)}</td><td>${esc(note.authority_note)}</td></tr>`).join("")}
      </tbody></table></div>
    </section>`;
  }

  root.innerHTML=`
    <div class="internal-warning"><i>!</i><div><strong>Private full-access build</strong><span>Contains internal QA, governance and unresolved records. Keep local and do not upload to public GitHub Pages.</span></div><b>READ ONLY · NO WRITE-BACK</b></div>
    <section class="internal-summary-grid">
      <article class="internal-summary-card" style="--metric:#d6b55a"><span>Physical records</span><strong>${meta.totalPhysicalRecords||INTERNAL.allRecords.length}</strong><small>All supplied mapping rows</small></article>
      <article class="internal-summary-card" style="--metric:#70b7d9"><span>Unique Node IDs</span><strong>${meta.uniqueNodeIds||"—"}</strong><small>${(meta.duplicateNodeIds||[]).length} duplicated IDs retained</small></article>
      <article class="internal-summary-card" style="--metric:#d99a3c"><span>Work items</span><strong>${state.items.length}</strong><small>Operational delivery records</small></article>
      <article class="internal-summary-card" style="--metric:#ff7b6f"><span>Validation findings</span><strong>${meta.validationFindingCount||INTERNAL.validationIssues.length}</strong><small>${meta.unresolvedFindingCount||INTERNAL.unresolvedIssues.length} high / critical</small></article>
      <article class="internal-summary-card" style="--metric:#5d6873"><span>Progress field</span><strong>—</strong><small>Not authoritatively recorded</small></article>
    </section>
    <nav class="internal-tabs" aria-label="Internal audit sections">${tabs.map(([id,label])=>`<button data-internal-tab="${id}" class="${state.internalTab===id?"active":""}">${label}</button>`).join("")}</nav>
    ${["validation","records"].includes(state.internalTab)?`<div class="internal-tools">
      <input id="internalSearch" type="search" value="${esc(state.internalSearch)}" placeholder="Search internal records and findings">
      ${state.internalTab==="validation"?`<select id="internalSeverity"><option value="all">All severities</option>${["Critical","High","Medium","Low"].map(s=>`<option value="${s}" ${state.internalSeverity===s?"selected":""}>${s}</option>`).join("")}</select>`:`<select id="internalType"><option value="all">All record types</option>${internalRecordTypeOptions().map(t=>`<option value="${esc(t)}" ${state.internalType===t?"selected":""}>${esc(t)}</option>`).join("")}</select>`}
      <select id="internalTerritory"><option value="all">All territories</option>${DATA.workstreams.map(w=>`<option value="${w.code}" ${state.internalTerritory===w.code?"selected":""}>${w.code} · ${esc(w.name)}</option>`).join("")}</select>
      <span>${state.internalTab==="validation"?issues.length:records.length} shown</span>
    </div>`:""}
    ${body}`;

  $$("[data-internal-tab]",root).forEach(button=>button.onclick=()=>{state.internalTab=button.dataset.internalTab;renderInternal()});
  const search=$("#internalSearch",root);
  if(search)search.oninput=e=>{state.internalSearch=e.target.value;clearTimeout(renderInternal.timer);renderInternal.timer=setTimeout(renderInternal,120)};
  const severity=$("#internalSeverity",root);if(severity)severity.onchange=e=>{state.internalSeverity=e.target.value;renderInternal()};
  const type=$("#internalType",root);if(type)type.onchange=e=>{state.internalType=e.target.value;renderInternal()};
  const territory=$("#internalTerritory",root);if(territory)territory.onchange=e=>{state.internalTerritory=e.target.value;renderInternal()};
  bindDynamic();
}

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
  $$("[data-view]").forEach(b=>b.onclick=e=>{e.preventDefault?.();e.stopPropagation();navigate(b.dataset.view)});
  $$("[data-open-ws]").forEach(b=>b.onclick=e=>{e.preventDefault?.();e.stopPropagation();openDrawer(b.dataset.openWs)});
  $$("[data-open-territory]").forEach(b=>b.onclick=e=>{e.preventDefault?.();e.stopPropagation();closeItemModal({restoreFocus:false});closeDrawer({restoreFocus:false});openTerritory(b.dataset.openTerritory)});
  $$("[data-open-item]").forEach(b=>b.onclick=e=>{e?.stopPropagation?.();openItem(b.dataset.openItem)});
  $$("[data-open-internal]").forEach(b=>b.onclick=e=>{e?.stopPropagation?.();openInternalDetail(b.dataset.openInternal)});
  $$("[data-locate-territory]").forEach(b=>b.onclick=e=>{e?.preventDefault?.();e?.stopPropagation?.();locateInBirdseye("territory",b.dataset.locateTerritory)});
  $$("[data-locate-item]").forEach(b=>b.onclick=e=>{e?.preventDefault?.();e?.stopPropagation?.();locateInBirdseye("item",b.dataset.locateItem)});
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
  $$("[data-territory-status-jump]").forEach(b=>b.onclick=()=>{
    const filter=b.dataset.territoryStatusJump;
    state.territoryItemStatus=filter==="risk"?"At risk":filter;
    document.querySelector(".territory-register")?.scrollIntoView({block:"start"});
    renderTerritoryDetail();
    requestAnimationFrame(()=>document.querySelector(".territory-register")?.scrollIntoView({block:"start"}));
  });
}
function exportCsv(){
  const rows=[["ID","Title","Territory","Status","Risk","Owner","Target date","Progress","Source worksheet","Source row"],...registerItems().map(i=>[i.id,i.title,i.workstream,i.status,i.risk,i.owner,i.due||"Not recorded",knownProgress(i)?i.progress:"Not recorded",i.sourceWorksheet||"Not recorded",i.sourceRowId||"Not recorded"])];
  const csv=rows.map(r=>r.map(v=>`"${String(v??"").replaceAll('"','""')}"`).join(",")).join("\n");
  const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv"}));a.download="ghm-atlas-work-items-v31.csv";a.click();setTimeout(()=>URL.revokeObjectURL(a.href),0);toast("Work-item register exported");
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

  const closeHandler=fn=>e=>{e?.preventDefault?.();e?.stopPropagation?.();fn()};
  $("#closeDrawer").onclick=closeHandler(closeDrawer);
  $("#scrim").onclick=closeHandler(closeDrawer);
  $("#closeItem").onclick=closeHandler(closeItemModal);
  $("#itemModal").addEventListener("mousedown",e=>{if(e.target===e.currentTarget)closeItemModal()});
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
