
(()=>{
"use strict";
const APP_VERSION="31+ RC3.8 INTERNAL REVIEW";
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
const statusColor={Completed:"#34b56f",Active:"#14c6c9",Review:"#4e8bd8",Blocked:"#ff1744",Later:"#8d969f","At risk":"#ff8a00"};
const statusDescription={
  Completed:"Finished and accepted",
  Active:"In active delivery",
  "At risk":"High or critical risk",
  Review:"Awaiting assurance",
  Blocked:"Requires intervention",
  Later:"Scheduled for later"
};
const waxForStatus=value=>{
  const text=String(value||"").toLowerCase();
  if(/not\s*started|not\s*begun|not\s*recorded|scheduled|later/.test(text))return"risk";
  if(/blocked|critical|rejected|overdue/.test(text))return"blocked";
  if(/high|risk|amber|attention/.test(text))return"high";
  if(/approved|closed|complete|completed|accepted|verified/.test(text))return"completed";
  if(/review|pending|awaiting/.test(text))return"review";
  if(/active|progress|started|open/.test(text))return"turquoise";
  return"risk";
};
const riskOrder={Low:0,Medium:1,High:2,Critical:3};
const visualOrder={Blocked:0,"At risk":1,Review:2,Active:3,Later:4,Completed:5};
const itemVisualState=i=>i.status==="Blocked"?"Blocked":(i.status!=="Completed"&&riskOrder[i.risk]>=2?"At risk":i.status);
const knownProgress=i=>Boolean(i&&i.progressKnown&&Number.isFinite(Number(i.progress)));
const progressLabel=i=>knownProgress(i)?`${Math.round(Number(i.progress))}%${i.progressProvisional?" est.":""}`:"Not recorded";
const progressValueHtml=i=>knownProgress(i)?`<span>${Math.round(Number(i.progress))}%</span>${i.progressProvisional?"<small>est.</small>":""}`:"<span>—</span><small>not recorded</small>";
const summaryProgressLabel=s=>s?.progressKnown?`${Math.round(Number(s.progress))}%${s.progressProvisional?" est.":""}`:"Not recorded";
const dateValue=d=>d&&/^\d{4}-\d{2}-\d{2}/.test(String(d))?String(d).slice(0,10):"";
const dateLabel=d=>dateValue(d)?fmt(dateValue(d)):"Not recorded";
const sortDate=d=>dateValue(d)||"9999-12-31";
const severityColor=s=>({Critical:"#ff1744",High:"#ff8a00",Medium:"#f4c542",Low:"#70b7d9"}[s]||"#8d969f");
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
    progress:known.length?avg(known.map(i=>i.progress)):null,
    progressKnown:known.length>0,
    progressProvisional:known.length>0&&known.some(i=>i.progressProvisional)
  };
};
const health=s=>s.blocked>2||s.critical>1?"Critical":s.risk>5||s.blocked>0?"Attention":(!s.progressProvisional&&s.progressKnown&&s.progress>78)?"On track":"In progress";
function chip(status){return `<span class="status-chip" style="--chip:${statusColor[status]}">${esc(status)}</span>`}
function riskChip(risk){const c={Low:"#7c8790",Medium:"#f4c542",High:"#ff8a00",Critical:"#ff1744"}[risk];return `<span class="risk-chip risk-${String(risk).toLowerCase()}" style="--risk:${c}">${esc(risk)}</span>`}
function progressPair(color=""){
  const key=String(color||"#14c6c9").trim().toLowerCase();
  const pairs={
    "#ff1744":["#ff1744","#ff8a00"],
    "#ff8a00":["#ff8a00","#f4c542"],
    "#14c6c9":["#14c6c9","#4e8bd8"],
    "#4e8bd8":["#4e8bd8","#14c6c9"],
    "#34b56f":["#34b56f","#14c6c9"],
    "#d6b55a":["#d7b75e","#ff8a00"],
    "#d7b75e":["#d7b75e","#ff8a00"]
  };
  return pairs[key]||[color||"#14c6c9","#4e8bd8"];
}
function progress(p,color="",known=true){
  const value=Number(p);
  const [start,end]=progressPair(color);
  const style=`--progress-color:${start};--progress-start:${start};--progress-end:${end}`;
  if(known===false||!Number.isFinite(value)){
    return `<div class="progress unknown" style="${style}" aria-label="Progress not recorded"><span class="progress-track"><i></i></span><b>—</b></div>`;
  }
  const safe=Math.max(0,Math.min(100,Math.round(value)));
  return `<div class="progress compact-progress" style="${style}" aria-label="${safe}% estimated progress"><span class="progress-track"><i style="width:${safe}%"></i></span><b>${safe}%<small> est.</small></b></div>`;
}
function toast(msg){const t=$("#toast");t.textContent=msg;t.classList.add("show");clearTimeout(toast.timer);toast.timer=setTimeout(()=>t.classList.remove("show"),2200)}
function decorateStatusPills(root=document){
  const nodes=$$(".status-chip,.risk-chip,.health,.rc2-health,.record-status,.evidence-status,.decision-status",root);
  nodes.forEach(node=>{
    const value=String(node.textContent||"").trim().toLowerCase();
    node.classList.remove("is-positive","is-open","is-review","is-critical","is-neutral");
    if(/approved|closed|verified|resolved|completed|complete|accepted|on track/.test(value))node.classList.add("is-positive");
    else if(/blocked|critical|high|overdue|rejected/.test(value))node.classList.add("is-critical");
    else if(/review|attention|medium|pending|awaiting/.test(value))node.classList.add("is-review");
    else if(/open|active|in progress|in-progress/.test(value))node.classList.add("is-open");
    else node.classList.add("is-neutral");
  });
}
function goBackRoute(){
  if(window.history.length>1){window.history.back();return}
  navigate("overview");
}
function installRouteBackButtons(){
  $$(".shared-command-banner").forEach(banner=>{
    const existingRow=banner.previousElementSibling;
    banner.parentElement?.classList.add("has-route-back");
    if(existingRow?.classList.contains("route-back-row"))return;
    const row=document.createElement("div");
    row.className="route-back-row";
    const button=document.createElement("button");
    button.type="button";
    button.className="route-back";
    button.setAttribute("data-history-back","");
    button.setAttribute("aria-label","Go back");
    button.textContent="← Back";
    row.append(button);
    banner.before(row);
  });
  const mapCopy=document.querySelector(".map-copy-panel");
  if(mapCopy&&!mapCopy.querySelector(".route-back")){
    const button=document.createElement("button");
    button.type="button";
    button.className="route-back";
    button.setAttribute("data-history-back","");
    button.setAttribute("aria-label","Go back");
    button.textContent="← Back";
    mapCopy.prepend(button);
  }
}

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
  hideAtlasTooltip();
  modal.hidden=true;
  modal.setAttribute("aria-hidden","true");
  modal.classList.remove("blocked-chamber");
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
  hideAtlasTooltip();
  drawer?.classList.remove("open");
  drawer?.classList.remove("blocked-chamber");
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
const mobileNavBackgroundSelectors=".atlas-rail,main,.ethos-footer,#drawer,#scrim,#itemModal";
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

  if(scroll){
    window.scrollTo({top:0,left:0,behavior:"auto"});
    requestAnimationFrame(()=>requestAnimationFrame(()=>window.scrollTo({top:0,left:0,behavior:"auto"})));
  }
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
    {label:"All items",value:total,detail:"11 connected territories",wax:"all-items",filter:"all",color:"#d7b75e"},
    {label:"In progress",value:visualCounts.Active,detail:"In live delivery",wax:"turquoise",filter:"Active",color:statusColor.Active},
    {label:"At risk",value:visualCounts["At risk"],detail:"High or critical risk",wax:"high",filter:"risk",color:statusColor["At risk"]},
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
    return `<button class="project-block status-${visual.toLowerCase().replace(" ","-")}" data-open-item="${item.id}" style="--state:${statusColor[visual]}" data-tip="${esc(item.id+" · "+item.title+" · "+visual+" · "+progressLabel(item))}" aria-label="${esc("Open quick chamber for "+item.id+" "+item.title)}"><span>${item.id}</span></button>`;
  }).join("");

  const code=wsMap.has(state.overviewTerritory)?state.overviewTerritory:"WS001";
  state.overviewTerritory=code;
  const w=wsMap.get(code),items=byWs(code),s=summary(code),dep=dependencySummary(code);
  const h=health(s);
  const healthColor=h==="Critical"?"#ff1744":h==="Attention"?"#ff8a00":h==="On track"?"#34b56f":"#4e8bd8";
  const openItems=[...items].filter(item=>item.status!=="Completed").sort((a,b)=>visualOrder[itemVisualState(a)]-visualOrder[itemVisualState(b)]||sortDate(a.due).localeCompare(sortDate(b.due))||a.id.localeCompare(b.id));
  const priority=openItems[0]||items[0];
  const ownerNames=[...new Set(items.map(item=>item.owner).filter(Boolean))];
  $("#overviewTerritoryFocus").innerHTML=`
    <div class="rc2-focus-title">
      <div class="focus-icon-progress"><img src="${w.icon}" alt=""><small>${summaryProgressLabel(s)}</small></div>
      <div><span class="ws-code">${w.code}</span><h2>${esc(w.name)}</h2></div>
      <span class="rc2-health" style="--health:${healthColor}">${h}</span>
    </div>
    <p class="rc2-focus-description">${esc(w.description)}</p>
    <div class="rc2-focus-metrics">
      <div><strong>${summaryProgressLabel(s)}</strong><span>${s.progressKnown?"Progress":"Not recorded"}</span></div>
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

  const overviewStatusTitle=$("#overviewStatusTitle");
  if(overviewStatusTitle)overviewStatusTitle.textContent=`${w.name} delivery state`;
  const overviewStatusNote=$("#overviewStatusNote");
  if(overviewStatusNote)overviewStatusNote.textContent="Progress percentages are estimated visual placeholders pending the next approved snapshot.";

  const overviewBlockItems=[...all].sort((a,b)=>visualOrder[itemVisualState(a)]-visualOrder[itemVisualState(b)]||a.workstream.localeCompare(b.workstream)||a.id.localeCompare(b.id));
  const overviewBlockMini=$("#overviewBlockMini");
  if(overviewBlockMini){
    overviewBlockMini.innerHTML=overviewBlockItems.map(item=>{
      const visual=itemVisualState(item);
      return `<button class="project-block status-${visual.toLowerCase().replace(" ","-")}" data-open-item="${item.id}" type="button" style="--state:${statusColor[visual]}" data-tip="${esc(item.id+" · "+item.title+" · "+visual+" · "+progressLabel(item))}" aria-label="${esc("Open quick chamber for "+item.id+" "+item.title)}"><span>${item.id}</span></button>`;
    }).join("");
  }
  const overviewBlockMiniLegend=$("#overviewBlockMiniLegend");
  if(overviewBlockMiniLegend){
    overviewBlockMiniLegend.innerHTML=["Blocked","At risk","Review","Active","Later","Completed"].map(status=>`<span><i style="--state:${statusColor[status]}"></i>${status}</span>`).join("");
  }

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

  const auditHost=$("#overviewAuditIndicator");
  if(auditHost){
    const meta=INTERNAL.meta||{};
    const severity=meta.severityCounts||{};
    auditHost.className="internal-summary-grid overview-internal-summary";
    auditHost.innerHTML=`
      <article class="internal-summary-card" style="--metric:#d6b55a"><span>Physical records</span><strong>${meta.totalPhysicalRecords||INTERNAL.allRecords.length}</strong><small>All supplied mapping rows</small></article>
      <article class="internal-summary-card" style="--metric:#70b7d9"><span>Unique Node IDs</span><strong>${meta.uniqueNodeIds||"—"}</strong><small>${(meta.duplicateNodeIds||[]).length} duplicated IDs retained</small></article>
      <article class="internal-summary-card" style="--metric:#d99a3c"><span>Work items</span><strong>${state.items.length}</strong><small>Operational delivery records</small></article>
      <article class="internal-summary-card" style="--metric:#ff1744"><span>Validation findings</span><strong>${meta.validationFindingCount||INTERNAL.validationIssues.length}</strong><small>${meta.unresolvedFindingCount||INTERNAL.unresolvedIssues.length} high / critical</small></article>
      <article class="internal-summary-card" style="--metric:#5d6873"><span>Progress field</span><strong>50% est.</strong><small>Estimated visual placeholder</small></article>`;
  }

  const statuses=["all","Completed","Active","At risk","Review","Blocked","Later"];
  $("#overviewRegisterFilters").innerHTML=statuses.map(status=>`<button type="button" data-overview-register-status="${status}" class="${state.overviewItemStatus===status?"active":""}">${status==="all"?"All":status}</button>`).join("");
  const registerItems=all.filter(item=>state.overviewItemStatus==="all"||itemVisualState(item)===state.overviewItemStatus||item.status===state.overviewItemStatus);
  $("#overviewRegisterTitle").textContent=`${all.length} programme work items`;
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
  svg.setAttribute("preserveAspectRatio","xMidYMid meet");
  svg.setAttribute("viewBox","0 0 1800 1050");
  const P=positions("dependency",false);
  const territoryEdges=[...(DATA.territoryEdges||INTERNAL.territoryEdges||[])].sort((a,b)=>(b.count||0)-(a.count||0));
  const edges=territoryEdges.map((l,index)=>{
    const a=P[l.a],b=P[l.b];if(!a||!b)return"";
    const color=index%3===0?"#6ab493":index%3===1?"#c29043":"#6f91ba";
    return `<path class="overview-territory-edge ${index<5?"arrival":""}" d="M ${a.x} ${a.y} Q ${(a.x+b.x)/2} ${Math.min(a.y,b.y)-55} ${b.x} ${b.y}" style="--weight:${Math.min(5,1+(l.count||1)/4)};stroke:${color};--delay:${index*.16}s"><title>${esc(`${l.a} ↔ ${l.b} · ${l.count||1} linked records`)}</title></path>`;
  }).join("");
  const dots=state.items.map((i,index)=>{
    const p=P[i.id];if(!p)return"";
    const visual=itemVisualState(i),radius=visual==="Blocked"?7.2:5;
    return `<g class="overview-node-action" tabindex="0" role="button" data-map-item="${i.id}" aria-label="${esc("Open quick chamber for "+i.id+" "+i.title)}" style="--node-color:${statusColor[visual]};--pulse-delay:${((index%14)*.12).toFixed(2)}s">
      <circle class="overview-dot-hit" cx="${p.x}" cy="${p.y}" r="15" fill="transparent" pointer-events="all"/>
      <circle class="overview-dot-pulse" cx="${p.x}" cy="${p.y}" r="${radius+1}" fill="none"/>
      <circle class="overview-dot ${riskOrder[i.risk]>=2?"risk":""}" cx="${p.x}" cy="${p.y}" r="${radius}" fill="${statusColor[visual]}"><title>${esc(i.id+" · "+i.title+" · "+visual)}</title></circle>
    </g>`;
  }).join("");
  const anchors=DATA.workstreams.map(w=>{
    const p=P[w.code],s=summary(w.code);
    return `<g class="overview-anchor" data-map-ws="${w.code}" tabindex="0" role="button" aria-label="${esc("Open "+w.name+" Quick Chamber")}" style="--anchor-color:${s.blocked?"#ff1744":s.atRisk?"#ff8a00":"#d6b55a"}">
      <circle class="overview-anchor-hit" cx="${p.x}" cy="${p.y}" r="68" fill="transparent" pointer-events="all"/>
      <image href="${w.icon}" x="${p.x-56}" y="${p.y-56}" width="112" height="112" preserveAspectRatio="xMidYMid meet"/>
      <text x="${p.x}" y="${p.y+68}">${w.code}</text><text class="anchor-sub" x="${p.x}" y="${p.y+82}">${esc(short(w.name,21))}</text>
      <title>${esc(w.name)} · ${s.total} items · ${s.blocked} blocked · ${s.progressKnown?`${summaryProgressLabel(s)} progress`:"progress not recorded"}</title>
    </g>`;
  }).join("");
  const center=`<g class="overview-centre" data-view="overview"><image href="assets/brand/command-centre-map-icon.png" x="810" y="435" width="180" height="180" preserveAspectRatio="xMidYMid meet"/></g>`;
  svg.innerHTML=`<g>${edges}${dots}${anchors}${center}</g>`;
  $$("[data-map-ws]",svg).forEach(g=>{
    const open=()=>openDrawer(g.dataset.mapWs);
    g.onclick=open;
    g.onkeydown=e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();open();}};
  });
  $$("[data-map-item]",svg).forEach(n=>{
    const open=e=>{e?.stopPropagation?.();openItem(n.dataset.mapItem);};
    n.onclick=open;
    n.onkeydown=e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();open(e);}};
  });
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
      <div class="pulse-metrics"><div><strong>${s.total}</strong><span>Items</span></div><div><strong>${summaryProgressLabel(s)}</strong><span>${s.progressKnown?"Progress":"Not recorded"}</span></div><div><strong>${s.blocked}</strong><span>Blocked</span></div></div>
      <div class="pulse-waffle">${items.map(i=>`<button data-open-item="${i.id}" style="--state:${statusColor[itemVisualState(i)]}" data-tip="${esc(i.id+" · "+i.title+" · "+itemVisualState(i)+" · "+progressLabel(i))}"></button>`).join("")}</div>
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
      <div class="territory-condensed-icon"><img src="${w.icon}" alt=""></div>
      <div class="territory-condensed-copy"><span>${w.code} · ${health(s)}</span><strong>${esc(w.name)}</strong><small>${esc(short(next?.nextAction||"Not recorded",54))}</small></div>
      <div class="territory-condensed-metrics"><span>${s.active} active · ${s.blocked} blocked</span></div>
      <div class="territory-condensed-progress">${progress(s.progress,"",s.progressKnown)}</div>
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
      <div><strong>${s.total}</strong><span>Items</span></div><div><strong>${summaryProgressLabel(s)}</strong><span>${s.progressKnown?"Progress":"Not recorded"}</span></div>
      <div><strong>${s.blocked}</strong><span>Blocked</span></div><div><strong>${s.atRisk}</strong><span>At risk</span></div></div>
      <div class="drawer-command"><span>Current health</span><strong>${health(s)}</strong><p>${territoryNarrative(code,s)}</p></div>
      <h3>Next command actions</h3>${next.length?next.map(i=>`<button class="row-item" data-open-item="${i.id}">${chip(i.status)}<div><strong>${esc(i.title)}</strong><br><span>${esc(i.nextAction||"Not recorded")}</span></div><span>${dateLabel(i.due)}</span></button>`).join(""):`<div class="card">No open command action is recorded.</div>`}
      <button class="gold drawer-full" data-open-territory="${code}" type="button">Open territory</button>`;
  if(tab==="items")body=a.map(i=>`<button class="row-item" data-open-item="${i.id}">${chip(i.status)}<div><strong>${esc(i.title)}</strong><br><span>${i.id} · ${progressLabel(i)} · ${esc(i.owner)}</span></div><span>${dateLabel(i.due)}</span></button>`).join("");
  if(tab==="owners"){
    const grouped=Object.entries(a.reduce((o,i)=>{(o[i.owner]??=[]).push(i);return o},{}));
    body=grouped.map(([owner,arr])=>{
      const known=arr.filter(knownProgress),value=known.length?avg(known.map(i=>i.progress)):null;
      return `<div class="row-item"><span class="status-chip">${arr.length}</span><div><strong>${esc(owner)}</strong><br><span>${arr.filter(i=>i.status==="Blocked").length} blocked · ${value===null?"progress not recorded":`${value}% estimated average`}</span></div><span>Lead</span></div>`;
    }).join("");
  }
  if(tab==="evidence")body=evidence.length?`<div class="drawer-evidence-list">${evidence.map(e=>`<button class="row-item" data-open-internal="evidence|${esc(e.evidence_id)}"><span class="status-chip">${esc(e.evidence_id)}</span><div><strong>${esc(e.title)}</strong><span>${esc(e.source_authority||"Source authority not recorded")}</span></div><span>${esc(e.verification_status||"Open")}</span></button>`).join("")}</div>`:`<div class="card">No evidence record is mapped to this territory.</div>`;
  return `<div class="drawer-hero"><div class="drawer-icon-progress"><img class="drawer-main-icon" src="${w.icon}" alt=""><small>${summaryProgressLabel(s)}</small></div><div><p class="eyebrow">${w.code} · Quick Chamber</p><h2>${esc(w.name)}</h2><span>${esc(w.description)}</span></div></div>
  <div class="drawer-tabs">${["overview","items","owners","evidence"].map(t=>`<button data-drawer-tab="${t}" class="${t===tab?"active":""}">${t[0].toUpperCase()+t.slice(1)}</button>`).join("")}</div>
  <div>${body}</div>`;
}
function openDrawer(code,tab="overview"){
  hideAtlasTooltip();
  closeItemModal({restoreFocus:false});
  const drawer=$("#drawer");
  drawerLastFocus=document.activeElement;
  state.ws=code;
  drawer.dataset.tab=tab;
  drawer.classList.toggle("blocked-chamber",summary(code).blocked>0);
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
  hideAtlasTooltip();
  if($("#drawer")?.classList.contains("open"))closeDrawer({restoreFocus:false});
  const i=itemMap().get(id);if(!i)return;
  const w=wsMap.get(i.workstream)||{name:i.workstream||"Not recorded"};
  const deps=(i.dependencies||[]).map(x=>itemMap().get(x)).filter(Boolean);
  const itemIssues=INTERNAL.validationIssues.filter(issue=>issue.record_or_row_id===i.id||String(issue.observed_value||"").includes(i.id));
  $("#itemContent").innerHTML=`<p class="quick-chamber-label">Quick Chamber</p><p class="eyebrow">${esc(i.id)} · ${esc(i.workstream)}</p><h2>${esc(i.title)}</h2><p>${esc(i.summary||"No operational summary recorded.")}</p>
  <div class="drawer-summary"><div><strong class="modal-progress-value">${progressValueHtml(i)}</strong><span>Progress</span></div><div><strong>${esc(i.priority||"Not recorded")}</strong><span>Priority</span></div><div><strong>${esc(i.status)}</strong><span>Status</span></div><div><strong>${esc(i.risk)}</strong><span>Risk</span></div></div>
  <div class="item-info-columns">
    <section><h3>Command information</h3><div class="card"><p><b>Territory:</b> ${esc(w.name)}</p><p><b>Owner:</b> ${esc(i.owner||"Unassigned")} · <b>Reviewer:</b> ${esc(i.reviewer||"Not recorded")}</p><p><b>Target date:</b> ${dateLabel(i.due)}</p><p><b>Milestone:</b> ${esc(i.milestone||"Not recorded")}</p><p><b>Next action:</b> ${esc(i.nextAction||"Not recorded")}</p><p><b>Evidence:</b> ${esc(i.evidence||"Not recorded")}</p><p><b>Decision:</b> ${esc(i.decision||"Not recorded")}</p></div></section>
    <section><h3>Source and assurance</h3><div class="card"><p><b>Verification:</b> ${esc(i.verificationStatus||"Not recorded")}</p><p><b>Source:</b> ${esc(i.sourceWorksheet||"Not recorded")} · row ${esc(i.sourceRowId||"Not recorded")}</p><p><b>Record key:</b> ${esc(i.recordKey||i.id)}</p><p><b>Validation findings:</b> ${itemIssues.length}</p></div></section>
  </div>
  <h3>Dependencies</h3>${deps.length?deps.map(d=>`<button class="row-item" data-open-item="${d.id}">${chip(d.status)}<div><strong>${esc(d.title)}</strong><br><span>${d.id} · ${d.workstream}</span></div><span>${progressLabel(d)}</span></button>`).join(""):`<div class="card">No stable item dependency is resolved for this record.</div>`}
  <div class="modal-actions"><button class="atlas-cta compact-cta" data-open-territory="${i.workstream}" type="button"><span>Open territory</span><b>→</b></button><button class="atlas-secondary compact-cta" data-locate-item="${i.id}" type="button"><span>Locate in Bird’s-eye</span><b>⌖</b></button></div>`;
  itemModalLastFocus=document.activeElement;
  const itemModal=$("#itemModal");
  itemModal.classList.toggle("blocked-chamber",i.status==="Blocked"||i.risk==="Critical");
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
  if(!s.progressProvisional&&s.progressKnown&&s.progress>75)return `${w.name} is in a mature delivery state. Remaining work is concentrated around sign-off, dependencies and final release readiness.`;
  if(!s.progressKnown)return `${w.name} has ${s.total} mapped work items. An estimated visual percentage is shown pending the next approved Command Sheet snapshot.`;
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
    const healthColor=h==="Critical"?"#ff1744":h==="Attention"?"#ff8a00":h==="On track"?"#34b56f":"#4e8bd8";
    return `<article class="territory-card health-state-${hClass}" style="--health:${healthColor}">
      <header>
        <div class="territory-card-title"><div class="territory-card-icon"><img src="${w.icon}" alt=""><small>${summaryProgressLabel(s)}</small></div><div><span class="ws-code">${w.code}</span><h2>${esc(w.name)}</h2><p>${esc(w.description)}</p></div></div>
        <span class="health health-${hClass}">${h}</span>
      </header>
      <div class="territory-metrics">
        <div><strong>${summaryProgressLabel(s)}</strong><span>${s.progressKnown?"Progress":"Not recorded"}</span></div>
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
  const nodes=selected.map((item,index)=>{
    const p=points.get(item.id),visual=itemVisualState(item);
    const radius=visual==="Blocked"?7.5:5.5;
    return `<g class="mini-node-action" tabindex="0" role="button" data-open-item="${item.id}" aria-label="${esc("Open quick chamber for "+item.id+" "+item.title)}" data-tip="${esc(item.id+" · "+item.title+" · "+visual+" · "+progressLabel(item))}" style="--node-color:${statusColor[visual]};--pulse-delay:${((index%12)*.14).toFixed(2)}s">
      <circle class="mini-node-hit" cx="${p.x}" cy="${p.y}" r="18"/>
      <circle class="mini-node-pulse" cx="${p.x}" cy="${p.y}" r="${radius+1}" fill="none"/>
      <circle class="mini-node" cx="${p.x}" cy="${p.y}" r="${radius}" fill="${statusColor[visual]}"><title>${esc(item.id+" · "+item.title+" · "+visual)}</title></circle>
    </g>`;
  }).join("");
  const w=wsMap.get(code);
  return `<svg class="territory-bird-mini" viewBox="0 0 600 330" role="img" aria-label="${esc(w.name)} territory Bird’s-eye preview">
    ${links.join("")}
    <g class="mini-anchor-action" tabindex="0" role="button" data-open-ws="${code}" aria-label="${esc("Open "+w.name+" Quick Chamber")}">
      <circle class="mini-anchor-hit" cx="${cx}" cy="${cy}" r="82" fill="transparent" pointer-events="all"/>
      <image href="${w.icon}" x="${cx-76}" y="${cy-76}" width="152" height="152" preserveAspectRatio="xMidYMid meet"/>
    </g>
    ${nodes}
  </svg>`;
}

function renderTerritoryDetail(){
  const code=state.territory,w=wsMap.get(code);
  if(!w)return;
  const items=byWs(code),s=summary(code),dep=dependencySummary(code);
  const h=health(s);
  const healthColor=h==="Critical"?"#ff1744":h==="Attention"?"#ff8a00":h==="On track"?"#34b56f":"#4e8bd8";
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
    {label:"All items",value:s.total,detail:"Complete territory",wax:"all-items",status:"all",color:"#d7b75e"},
    {label:"In progress",value:s.active,detail:"Current state",wax:"turquoise",status:"Active",color:statusColor.Active},
    {label:"At risk",value:s.atRisk,detail:"High or critical",wax:"high",status:"At risk",color:statusColor["At risk"]},
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
          <div class="territory-icon-progress${s.progressKnown?"":" no-progress"}">
            <img class="rc2-territory-mark" src="${w.icon}" alt="">
            ${s.progressKnown?progress(s.progress,healthColor,true):""}
          </div>
        </div>
      </section>

      <section>
        <div class="overview-section-title">
          <div><p>Current status</p><h2>${esc(w.name)} delivery state</h2></div>
          <span>Progress percentages are estimated visual placeholders pending the next approved snapshot.</span>
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
            <div><strong>${summaryProgressLabel(s)}</strong><span>${s.progressKnown?"Progress":"Not recorded"}</span></div>
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

        <article class="panel rc2-territory-block">
          <div class="panel-head"><div><p class="eyebrow">Territory block</p><h2>Every work item</h2><span>All delivery blocks in stable item order.</span></div><button class="panel-expand" data-view="square" type="button">Open Block</button></div>
          <div class="rc2-territory-block-mini">${waffleItems.map(item=>{const visual=itemVisualState(item);return `<button class="project-block status-${visual.toLowerCase().replace(" ","-")}" data-open-item="${item.id}" style="--state:${statusColor[visual]}" data-tip="${esc(item.id+" · "+item.title+" · "+visual+" · "+progressLabel(item))}" aria-label="${esc("Open quick chamber for "+item.id+" "+item.title)}"><span>${item.id}</span></button>`}).join("")}</div>
          <div class="project-block-key">${["Blocked","At risk","Review","Active","Later","Completed"].map(status=>`<span><i style="--state:${statusColor[status]}"></i>${status}</span>`).join("")}</div>
        </article>

        <article class="panel rc2-territory-map-panel">
          <div class="panel-head"><div><p class="eyebrow">Bird’s-eye preview</p><h2>Connected delivery</h2><span>Work-item links inside ${esc(w.name)}.</span></div><button class="panel-expand" data-locate-territory="${code}" type="button">Locate in Bird’s-eye</button></div>
          <div class="rc2-territory-map-stage">${territoryMiniMap(code,items,healthColor)}</div>
        </article>
      </section>

      <section class="rc2-territory-action-grid">
        <article class="panel rc2-action-panel">
          <div class="panel-head critical-panel-head"><div><p class="eyebrow">Attention</p><h2>Blockers and risks</h2></div><img class="critical-medusa" src="assets/v31/medusa-block-128.webp" alt=""><span>${blocked.length} open</span></div>
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
      <div class="structure-summary"><span>${s.progressKnown?`${summaryProgressLabel(s)} progress`:"Progress not recorded"}</span><span>${s.blocked} blocked</span><span>${s.atRisk} at risk</span><span>${dep.incoming.length+dep.outgoing.length} territory links</span></div>${progress(s.progress,"",s.progressKnown)}
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
          <div><strong>${summaryProgressLabel(s)}</strong><span>${s.progressKnown?"Progress":"Not recorded"}</span></div>
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
  const deliveryStates=statuses.slice(1);
  $("#waffleFilters").className="filters waffle-filters-advanced";
  $("#waffleFilters").innerHTML=`
    <div class="waffle-search">
      <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M16 16l5 5"/></svg>
      <input id="waffleSearch" type="search" value="${esc(state.waffleSearch)}" placeholder="Search items, owners or IDs" aria-label="Search waffle items">
    </div>
    <div class="waffle-status-icons" role="group" aria-label="Quick status views">
      ${statuses.map(s=>`<button data-waffle-status="${s}" class="${state.waffleStatus===s?"active":""}" data-tip="${s==="all"?"All statuses":s}" type="button"><i style="--status:${s==="all"?"#f3f3f3":statusColor[s]}"></i><span>${s==="all"?"All":s}</span></button>`).join("")}
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

  const wallItems=[...a].sort((x,y)=>visualOrder[itemVisualState(x)]-visualOrder[itemVisualState(y)]||x.workstream.localeCompare(y.workstream)||x.id.localeCompare(y.id));
  const wallCounts=deliveryStates.map(status=>({status,count:wallItems.filter(item=>itemVisualState(item)===status).length})).filter(group=>group.count);
  const aggregate=`<section class="waffle-overview panel" aria-label="Aggregate delivery waffle">
    <div class="waffle-overview-copy"><p class="eyebrow">Aggregate view</p><h2>${wallItems.length} connected work items</h2><span>One continuous wall shows the complete delivery mix. Select any coloured brick to open its Quick Chamber.</span></div>
    <div class="waffle-wall-wrap">
      <div class="waffle-wall" role="list" aria-label="Continuous multicoloured delivery wall">${wallItems.map(item=>{
        const visual=itemVisualState(item);
        return `<button class="waffle-brick" role="listitem" type="button" data-open-item="${item.id}" style="--state:${statusColor[visual]}" data-tip="${esc(item.id+" · "+item.title+" · "+visual+" · "+progressLabel(item))}" aria-label="${esc("Open quick chamber for "+item.id+" "+item.title)}"></button>`;
      }).join("")}</div>
      <div class="waffle-wall-key">${wallCounts.map(group=>`<span><i style="--state:${statusColor[group.status]}"></i>${group.status} <b>${group.count}</b></span>`).join("")}</div>
    </div>
  </section>`;

  const grouped=deliveryStates.map(status=>{
    const records=a.filter(item=>itemVisualState(item)===status);
    if(!records.length)return"";
    return `<section class="waffle-status-group" style="--state:${statusColor[status]}">
      <header><div><p>${status}</p><h2>${records.length} work item${records.length===1?"":"s"}</h2></div><span>${statusDescription[status]}</span></header>
      <div class="waffle-card-grid">${records.map(item=>{
        const w=wsMap.get(item.workstream);
        return `<button class="waffle-item waffle-item-classic status-${status.toLowerCase().replace(" ","-")}" data-open-item="${item.id}" style="--state:${statusColor[status]}" data-tip="${esc(item.id+" · "+item.title+" · "+status+" · "+progressLabel(item))}" type="button">
          <img src="${w.icon}" alt="">
          <b>${item.id} · ${item.workstream}</b>
          <strong>${esc(short(item.title,58))}</strong>
          <span>${status} · ${progressLabel(item)} · ${esc(item.owner||"Unassigned")}</span>
          <em class="item-action">Open quick chamber</em>
          ${progress(item.progress,statusColor[status],item.progressKnown)}
        </button>`;
      }).join("")}</div>
    </section>`;
  }).join("");

  $("#waffleGrid").innerHTML=aggregate+(grouped||`<div class="empty-state"><h3>No items match this view</h3><p>Clear a status, territory or search filter to see more of the Atlas.</p></div>`);
  $("#waffleWs").onchange=e=>{state.waffleWs=e.target.value;renderWaffle()};
  $("#waffleSort").onchange=e=>{state.waffleSort=e.target.value;renderWaffle()};
  const search=$("#waffleSearch");
  if(search)search.oninput=e=>{state.waffleSearch=e.target.value;clearTimeout(renderWaffle.searchTimer);renderWaffle.searchTimer=setTimeout(renderWaffle,140)};
  bindDynamic();
}
function positions(layout,compact=window.innerWidth<=970){
  const P={};
  const desktopCentre={x:900,y:525};
  const compactCentre={x:500,y:1450};
  const curatedDesktop={
    WS001:{x:260,y:170},WS010:{x:900,y:130},WS008:{x:1540,y:170},
    WS007:{x:170,y:520},WS005:{x:550,y:365},WS009:{x:1250,y:365},WS004:{x:1630,y:520},
    WS002:{x:340,y:870},WS003:{x:700,y:735},WS006:{x:1070,y:820},WS011:{x:1450,y:850}
  };
  const curatedCompact={
    WS001:{x:170,y:170},WS002:{x:500,y:170},WS003:{x:830,y:170},
    WS004:{x:170,y:520},WS005:{x:500,y:520},WS006:{x:830,y:520},
    WS007:{x:170,y:870},WS008:{x:500,y:870},WS009:{x:830,y:870},
    WS010:{x:325,y:1210},WS011:{x:675,y:1210}
  };
  DATA.workstreams.forEach((w,wi)=>{
    let ax,ay;
    if(compact){
      ({x:ax,y:ay}=curatedCompact[w.code]||compactCentre);
    }else if(layout==="territory"){
      ax=220+(wi%4)*450;ay=160+Math.floor(wi/4)*350;
    }else if(layout==="workflow"){
      ax=150+(wi%6)*300;ay=220+Math.floor(wi/6)*500;
    }else{
      ({x:ax,y:ay}=curatedDesktop[w.code]||desktopCentre);
    }
    P[w.code]={x:ax,y:ay};
    const arr=byWs(w.code);
    arr.forEach((item,index)=>{
      let x,y;
      if(compact){
        const angle=-Math.PI/2+index*Math.PI*2/Math.max(1,arr.length)+(wi*.13);
        const radius=105+(index%4)*16;
        x=ax+Math.cos(angle)*radius;
        y=ay+Math.sin(angle)*radius;
      }else if(layout==="workflow"){
        x=ax+((index%6)-2.5)*34;y=ay+90+Math.floor(index/6)*31;
      }else if(layout==="territory"){
        x=ax+((index%6)-2.5)*33;y=ay+88+Math.floor(index/6)*31;
      }else{
        const angle=-Math.PI/2+index*Math.PI*2/Math.max(1,arr.length)+(wi*.17);
        const radius=150+(index%4)*20;
        x=ax+Math.cos(angle)*radius;
        y=ay+Math.sin(angle)*radius;
      }
      P[item.id]={x,y};
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
  const svg=$("#birdMap");
  if(!svg)return;
  const compact=window.innerWidth<=970;
  const dimensions=compact?{width:1000,height:1520,cx:500,cy:1450}:{width:1800,height:1050,cx:900,cy:525};
  const layout=state.mapLayout==="risk"?"dependency":state.mapLayout;
  const P=positions(layout,compact);
  const status=$("#mapStatus")?.value||"all";
  svg.setAttribute("viewBox",`0 0 ${dimensions.width} ${dimensions.height}`);
  svg.setAttribute("preserveAspectRatio","xMidYMid meet");
  svg.dataset.compact=compact?"true":"false";

  const visible=state.items.filter(item=>
    (status==="all"||itemVisualState(item)===status)&&
    (state.mapLayout!=="risk"||riskOrder[item.risk]>=2||item.status==="Blocked")
  );
  let edges="";
  if(state.edges){
    const territoryEdges=[...(DATA.territoryEdges||INTERNAL.territoryEdges||[])].sort((a,b)=>(b.count||0)-(a.count||0));
    edges=territoryEdges.map((link,index)=>{
      const a=P[link.a],b=P[link.b];
      if(!a||!b)return"";
      const mx=(a.x+b.x)/2;
      const my=(a.y+b.y)/2-(compact?26:55)-(index%3)*(compact?8:18);
      const color=index%3===0?"#62b18c":index%3===1?"#c18b3c":"#6d8fb7";
      const label=short(link.relationship||link.relationships?.[0]||`${link.count||1} linked records`,28);
      return `<g class="territory-link-group" data-territory-edge="${link.a}|${link.b}">
        <path class="territory-edge ${index<8?"arrival":""}" d="M ${a.x} ${a.y} Q ${mx} ${my} ${b.x} ${b.y}" style="stroke:${color};color:${color};--delay:${(index*.14).toFixed(2)}s"/>
        ${state.labels&&index<(compact?8:14)?`<text class="territory-edge-label" x="${mx}" y="${my-4}">${esc(label)}</text>`:""}
      </g>`;
    }).join("");
  }

  const nodes=visible.map((item,index)=>{
    const p=P[item.id];
    if(!p)return"";
    const visual=itemVisualState(item);
    const risk=riskOrder[item.risk]>=2?"risk":"";
    const radius=visual==="Blocked"?(compact?20:18):(compact?16:13.6);
    const selectedClass=state.mapSelection?.type==="item"&&state.mapSelection.id===item.id?"selected":"";
    return `<g class="node-live-group ${selectedClass}" style="--node-color:${statusColor[visual]};--pulse-delay:${((index%14)*.12).toFixed(2)}s">
      <circle aria-hidden="true" class="node-pulse-ring" cx="${p.x}" cy="${p.y}" r="${radius+2}"></circle>
      <circle tabindex="0" role="button" class="node-dot ${risk} ${selectedClass}" data-map-item="${item.id}" cx="${p.x}" cy="${p.y}" r="${radius}" fill="${statusColor[visual]}" style="color:${statusColor[visual]}"><title>${esc(item.id+" · "+item.title+" · "+visual+" · "+progressLabel(item))}</title></circle>
    </g>${state.labels&&(visual==="Blocked"||item.priority==="P0")?`<text class="node-label" x="${p.x+10}" y="${p.y-8}">${esc(item.id)}</text>`:""}`;
  }).join("");

  const anchorRadius=compact?76:104;
  const iconSize=compact?150:210;
  const anchors=DATA.workstreams.map(workstream=>{
    const p=P[workstream.code];
    const summaryData=summary(workstream.code);
    const color=summaryData.blocked?"#ff1744":summaryData.atRisk?"#ff8a00":summaryData.review?"#4e8bd8":"#d6b55a";
    return `<g tabindex="0" role="button" aria-label="${esc("Open "+workstream.name+" Quick Chamber")}" class="full-map-anchor ${state.mapSelection?.type==="territory"&&state.mapSelection.id===workstream.code?"selected":""}" data-map-ws="${workstream.code}" style="--anchor-color:${color}">
      <circle class="full-map-anchor-hit" cx="${p.x}" cy="${p.y}" r="${anchorRadius}" fill="transparent" pointer-events="all"/>
      <image href="${workstream.icon}" x="${p.x-iconSize/2}" y="${p.y-iconSize/2}" width="${iconSize}" height="${iconSize}" preserveAspectRatio="xMidYMid meet"/>
      <text x="${p.x}" y="${p.y+anchorRadius+16}">${workstream.code}</text>
      <text class="sub" x="${p.x}" y="${p.y+anchorRadius+31}">${esc(short(workstream.name,24))}</text>
      <title>${esc(workstream.name)} · ${summaryData.total} work items · ${summaryData.blocked} blocked · ${summaryData.atRisk} at risk · ${summaryProgressLabel(summaryData)}</title>
    </g>`;
  }).join("");

  const centreSize=compact?190:240;
  const center=`<g class="map-centre" data-map-home role="button" tabindex="0"><image href="assets/brand/command-centre-map-icon.png" x="${dimensions.cx-centreSize/2}" y="${dimensions.cy-centreSize/2}" width="${centreSize}" height="${centreSize}" preserveAspectRatio="xMidYMid meet"/><title>Return to Overview</title></g>`;
  svg.innerHTML=`<g id="mapLayer">${edges}${nodes}${anchors}${center}</g>`;

  const updateSelectionClass=(type,id)=>{
    $$(".full-map-anchor.selected,.node-dot.selected",svg).forEach(node=>node.classList.remove("selected"));
    const selector=type==="territory"?`[data-map-ws="${CSS.escape(id)}"]`:`[data-map-item="${CSS.escape(id)}"]`;
    $(selector,svg)?.classList.add("selected");
  };

  $$("[data-map-ws]",svg).forEach(group=>{
    const selectTerritory=event=>{
      event?.preventDefault?.();
      event?.stopPropagation?.();
      const id=group.dataset.mapWs;
      state.mapSelection={type:"territory",id};
      updateSelectionClass("territory",id);
      renderMapSelection();
      bindDynamic();
      openDrawer(id);
    };
    group.onclick=selectTerritory;
    group.onkeydown=event=>{
      if(event.key==="Enter"||event.key===" "){
        event.preventDefault();
        selectTerritory(event);
      }
    };
    group.onmouseenter=()=>$$("[data-territory-edge]",svg).forEach(edge=>edge.classList.toggle("hot",edge.dataset.territoryEdge.split("|").includes(group.dataset.mapWs)));
    group.onmouseleave=()=>$$("[data-territory-edge]",svg).forEach(edge=>edge.classList.remove("hot"));
  });

  $$("[data-map-item]",svg).forEach(node=>{
    const selectItem=event=>{
      event?.preventDefault?.();
      event?.stopPropagation?.();
      const id=node.dataset.mapItem;
      state.mapSelection={type:"item",id};
      updateSelectionClass("item",id);
      renderMapSelection();
      bindDynamic();
      openItem(id);
    };
    node.onclick=selectItem;
    node.onkeydown=event=>{
      if(event.key==="Enter"||event.key===" "){
        event.preventDefault();
        selectItem(event);
      }
    };
  });

  const home=$("[data-map-home]",svg);
  if(home){
    home.onclick=()=>navigate("overview");
    home.onkeydown=event=>{
      if(event.key==="Enter"||event.key===" "){
        event.preventDefault();
        navigate("overview");
      }
    };
  }
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
            <header><div><p class="eyebrow">${dateLabel(m.target_date)} · ${esc(m.milestone_id)}</p><h2>${esc(m.title)}</h2></div><img class="milestone-wax" src="assets/wax/${waxForStatus(m.status)}.png" alt="${esc(m.status||"Not recorded")}" title="${esc(m.status||"Not recorded")}"></header>
            <p>${esc(m.description||"No milestone description recorded.")}</p>
            <div class="milestone-stats"><span>${esc(territory||"No territory")}</span><span>${esc(m.owner||"Unassigned")}</span><span>${esc(m.mapping_note||"Source mapped")}</span></div>
            <div class="command-card-actions">
              ${itemId?`<button class="atlas-cta compact-cta" data-open-item="${itemId}" type="button"><span>Open quick chamber</span><b>+</b></button>`:""}
              ${territory?`<button class="atlas-secondary compact-cta" data-open-territory="${territory}" type="button"><span>Open territory</span><b>→</b></button>`:""}
              <button class="record-link milestone-record-link" data-open-internal="milestone|${esc(m.milestone_id)}" type="button"><span>Open milestone record</span><b aria-hidden="true">→</b></button>
            </div>
          </article>`;
        }).join("")||`<div class="entity-empty-state"><div><h3>No milestones match this view</h3><p>Clear the search or reset the filters.</p></div></div>`}
      </div>
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
          <colgroup><col style="width:5%"><col style="width:7%"><col style="width:14%"><col style="width:14%"><col style="width:10%"><col style="width:8%"><col style="width:9%"><col style="width:9%"><col style="width:24%"></colgroup>
          <thead><tr><th>ID</th><th>Territory</th><th>From</th><th>To</th><th>Type</th><th>Risk</th><th>Owner</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>${records.map(record=>{
            const territory=territoryFromId(record.territory_id);
            const itemId=items.has(record.from_item_id)?record.from_item_id:items.has(record.to_item_id)?record.to_item_id:"";
            return `<tr class="clickable-record-row" data-open-internal="dependency|${esc(record.dependency_id)}">
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
          <colgroup><col style="width:5%"><col style="width:8%"><col style="width:24%"><col style="width:9%"><col style="width:11%"><col style="width:12%"><col style="width:11%"><col style="width:20%"></colgroup>
          <thead><tr><th>ID</th><th>Territory</th><th>Evidence</th><th>Type</th><th>Assurance</th><th>Source authority</th><th>Verified by / date</th><th>Actions</th></tr></thead>
          <tbody>${records.map(record=>{
            const territory=territoryFromId(record.territory_id);
            return `<tr class="clickable-record-row" data-open-internal="evidence|${esc(record.evidence_id)}">
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
          <colgroup><col style="width:5%"><col style="width:8%"><col style="width:31%"><col style="width:9%"><col style="width:10%"><col style="width:8%"><col style="width:9%"><col style="width:20%"></colgroup>
          <thead><tr><th>ID</th><th>Territory</th><th>Decision</th><th>State</th><th>Owner</th><th>Target date</th><th>Approval</th><th>Actions</th></tr></thead>
          <tbody>${records.map(record=>{
            const territory=territoryFromId(record.territory_id);
            return `<tr class="clickable-record-row" data-open-internal="decision|${esc(record.decision_id)}">
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
  const primaryFields=fields.slice(0,12),additionalFields=fields.slice(12);
  const relatedItem=record.related_item_id||record.from_item_id||record.to_item_id||record.record_or_row_id;
  const fieldGrid=rows=>rows.map(([field,value])=>`<div><span>${esc(field.replaceAll("_"," "))}</span><strong>${esc(internalValue(value))}</strong></div>`).join("");
  $("#itemContent").innerHTML=`
    <p class="eyebrow">INTERNAL · ${esc(kind.toUpperCase())} · ${esc(identifier)}</p>
    <h2>${esc(title)}</h2>
    <p class="internal-detail-intro">Read-only source detail. No value has been inferred or rewritten.</p>
    <div class="internal-detail-grid">${fieldGrid(primaryFields)}</div>
    ${additionalFields.length?`<details class="internal-detail-more"><summary>Show ${additionalFields.length} additional source fields</summary><div class="internal-detail-grid">${fieldGrid(additionalFields)}</div></details>`:""}
    <div class="internal-detail-actions">
      ${relatedItem&&itemMap().has(relatedItem)?`<button class="gold" data-open-item="${esc(relatedItem)}">Open quick chamber</button>`:""}
      <button class="ghost" data-view="internal">Return to internal audit</button>
    </div>`;
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
      <article class="internal-summary-card" style="--metric:#ff1744"><span>Validation findings</span><strong>${meta.validationFindingCount||INTERNAL.validationIssues.length}</strong><small>${meta.unresolvedFindingCount||INTERNAL.unresolvedIssues.length} high / critical</small></article>
      <article class="internal-summary-card" style="--metric:#5d6873"><span>Progress field</span><strong>50% est.</strong><small>Estimated visual placeholder</small></article>
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
  atlasTooltip.hidden=true;
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
  tip.hidden=false;
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
  atlasTooltip.hidden=true;
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
    if(target&&window.matchMedia("(hover:hover) and (pointer:fine)").matches)showAtlasTooltip(target);
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
  $$("[data-history-back]").forEach(b=>b.onclick=e=>{e.preventDefault?.();e.stopPropagation();goBackRoute()});
  $$("[data-view]").forEach(b=>b.onclick=e=>{e.preventDefault?.();e.stopPropagation();navigate(b.dataset.view)});
  $$("[data-open-ws]").forEach(b=>{
    const activate=e=>{e?.preventDefault?.();e?.stopPropagation?.();openDrawer(b.dataset.openWs);};
    b.onclick=activate;
    if(b.namespaceURI==="http://www.w3.org/2000/svg")b.onkeydown=e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();activate(e);}};
  });
  $$("[data-open-territory]").forEach(b=>b.onclick=e=>{e.preventDefault?.();e.stopPropagation();closeItemModal({restoreFocus:false});closeDrawer({restoreFocus:false});openTerritory(b.dataset.openTerritory)});
  $$("[data-open-item]").forEach(b=>{
    const activate=e=>{e?.preventDefault?.();e?.stopPropagation?.();openItem(b.dataset.openItem);};
    b.onclick=activate;
    if(b.namespaceURI==="http://www.w3.org/2000/svg")b.onkeydown=e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();activate(e);}};
  });
  $$("[data-open-internal]").forEach(b=>b.onclick=e=>{e?.stopPropagation?.();openInternalDetail(b.dataset.openInternal)});
  $$("[data-locate-territory]").forEach(b=>b.onclick=e=>{e?.preventDefault?.();e?.stopPropagation?.();locateInBirdseye("territory",b.dataset.locateTerritory)});
  $$("[data-locate-item]").forEach(b=>b.onclick=e=>{e?.preventDefault?.();e?.stopPropagation?.();locateInBirdseye("item",b.dataset.locateItem)});
  $$("[data-drawer-tab]").forEach(b=>b.onclick=()=>{
    const drawer=$("#drawer");
    if(drawer)drawer.dataset.tab=b.dataset.drawerTab;
    $("#drawerContent").innerHTML=drawerHtml(state.ws,b.dataset.drawerTab);
    bindDynamic();
  });
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
  decorateStatusPills();
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
  installRouteBackButtons();
  bindDynamic();

  const loader=$("#atlasLoader");
  const loaderImage=loader?.querySelector("img");
  const loaderStart=performance.now();
  let loaderHidden=false;
  const hideLoader=()=>{
    if(loaderHidden)return;
    loaderHidden=true;
    const remaining=Math.max(0,1050-(performance.now()-loaderStart));
    setTimeout(()=>loader?.classList.add("is-hidden"),remaining);
  };
  const imageReady=loaderImage?.decode?loaderImage.decode().catch(()=>{}):Promise.resolve();
  const pageReady=document.readyState==="complete"
    ?Promise.resolve()
    :new Promise(resolve=>window.addEventListener("load",resolve,{once:true}));
  Promise.all([imageReady,pageReady]).then(hideLoader);
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
    if(window.innerWidth>1440&&mobilePanel?.classList.contains("open"))closeMobileNav({restoreFocus:false});
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
  const mapDimensions=()=>window.innerWidth<=970?{w:900,h:1240}:{w:1600,h:940};
  const initialMapDimensions=mapDimensions();
  const mapView={x:0,y:0,w:initialMapDimensions.w,h:initialMapDimensions.h};
  const applyMapView=()=>birdMap?.setAttribute("viewBox",`${mapView.x} ${mapView.y} ${mapView.w} ${mapView.h}`);
  const zoomMap=(factor,cx=mapView.x+mapView.w/2,cy=mapView.y+mapView.h/2)=>{
    const dimensions=mapDimensions();
    const minWidth=window.innerWidth<=970?320:380;
    const maxWidth=window.innerWidth<=970?1500:2600;
    const nw=Math.max(minWidth,Math.min(maxWidth,mapView.w*factor));
    const nh=nw*(dimensions.h/dimensions.w);
    const rx=(cx-mapView.x)/mapView.w,ry=(cy-mapView.y)/mapView.h;
    mapView.x=cx-rx*nw;mapView.y=cy-ry*nh;mapView.w=nw;mapView.h=nh;applyMapView();
  };
  const fitMap=()=>{
    const dimensions=mapDimensions();
    mapView.x=0;mapView.y=0;mapView.w=dimensions.w;mapView.h=dimensions.h;
    applyMapView();
  };
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
      if(e.target?.closest?.("[data-map-ws],[data-map-item],[data-map-home]"))return;
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
        if(Math.abs(dx)+Math.abs(dy)>10)dragged=true;
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
  let mapResizeTimer=null;
  window.addEventListener("resize",()=>{
    clearTimeout(mapResizeTimer);
    mapResizeTimer=setTimeout(()=>{
      if(state.view!=="birdseye")return;
      fitMap();
      renderMap();
    },140);
  });
  if($("#exportCsv"))$("#exportCsv").onclick=exportCsv;
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
