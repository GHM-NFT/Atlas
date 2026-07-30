
(()=>{
"use strict";
const DATA=window.ATLAS_DATA;
const state={view:"overview",items:[...DATA.items],ws:null,item:null,waffleStatus:"all",waffleWs:"all",registerStatus:"all",registerWs:"all",search:"",edges:true,labels:true,mapLayout:"dependency"};
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const statusColor={Completed:"#34b56f",Active:"#d99a3c",Review:"#4e8bd8",Blocked:"#d45555",Later:"#8d969f"};
const riskOrder={Low:0,Medium:1,High:2,Critical:3};
const wsMap=new Map(DATA.workstreams.map(w=>[w.code,w]));
const itemMap=()=>new Map(state.items.map(i=>[i.id,i]));
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
const short=(s,n=42)=>s.length>n?s.slice(0,n-1)+"…":s;
const fmt=d=>new Intl.DateTimeFormat("en-GB",{day:"2-digit",month:"short",year:"numeric"}).format(new Date(d+"T12:00:00"));
const avg=a=>a.length?Math.round(a.reduce((x,y)=>x+y,0)/a.length):0;
const byWs=code=>state.items.filter(i=>i.workstream===code);
const summary=code=>{
  const a=byWs(code);
  return {total:a.length,completed:a.filter(i=>i.status==="Completed").length,active:a.filter(i=>i.status==="Active").length,review:a.filter(i=>i.status==="Review").length,blocked:a.filter(i=>i.status==="Blocked").length,later:a.filter(i=>i.status==="Later").length,risk:a.filter(i=>riskOrder[i.risk]>=2).length,progress:avg(a.map(i=>i.progress))};
};
function chip(status){return `<span class="status-chip" style="--chip:${statusColor[status]}">${esc(status)}</span>`}
function progress(p){return `<div class="progress"><i style="width:${p}%"></i></div>`}
function toast(msg){const t=$("#toast");t.textContent=msg;t.classList.add("show");clearTimeout(toast.timer);toast.timer=setTimeout(()=>t.classList.remove("show"),2200)}
function closeDrawer(){
  $("#drawer").classList.remove("open");$("#drawer").setAttribute("aria-hidden","true");$("#scrim").hidden=true;state.ws=null;
}
function navigate(view){
  if(!document.querySelector(`[data-page="${view}"]`))view="overview";
  closeDrawer();
  state.view=view;
  $$(".view").forEach(v=>v.classList.toggle("active",v.dataset.page===view));
  $$("[data-view]").forEach(b=>b.classList.toggle("active",b.dataset.view===view));
  $("#rail").classList.remove("open");
  window.scrollTo({top:0,behavior:"smooth"});
  if(view==="birdseye")renderMap();
  if(view==="structured")renderStructured();
  if(view==="square")renderSquare();
  if(view==="waffle")renderWaffle();
  if(view==="timeline")renderTimeline();
  if(view==="register")renderRegister();
  if(view==="dependencies")renderDependencies();
  if(view==="evidence")renderEvidence();
  if(view==="decisions")renderDecisions();
  history.replaceState(null,"","#"+view);
}
function renderOverview(){
  const all=state.items,total=all.length;
  const done=all.filter(i=>i.status==="Completed").length;
  const blocked=all.filter(i=>i.status==="Blocked").length;
  const review=all.filter(i=>i.status==="Review").length;
  const dueSoon=all.filter(i=>new Date(i.due)<=new Date("2026-08-31")&&i.status!=="Completed").length;
  $("#kpis").innerHTML=[
    ["Total items",total,"Across 11 connected territories"],
    ["Complete",done,`${Math.round(done/total*100)}% of programme`],
    ["In review",review,"Awaiting assurance"],
    ["Blocked",blocked,"Requires command attention"],
    ["Due by 31 Aug",dueSoon,"Near-term delivery horizon"]
  ].map(x=>`<div class="kpi"><small>${x[0]}</small><strong>${x[1]}</strong><span>${x[2]}</span></div>`).join("");
  const statuses=["Completed","Active","Review","Blocked","Later"];
  $("#seals").innerHTML=statuses.map(s=>{
    const count=all.filter(i=>i.status===s).length;
    return `<button class="seal" data-status-jump="${s}" title="Open ${s} items in the register"><img src="assets/wax/${s.toLowerCase()}.png" alt=""><strong>${count}</strong><span>${s}</span></button>`;
  }).join("");
  $("#workstreams").innerHTML=DATA.workstreams.map(w=>{
    const s=summary(w.code);
    return `<button class="ws-card" data-open-ws="${w.code}">
      <img class="ws-official" src="${w.navIcon}" alt="">
      <img class="ws-art" src="${w.icon}" alt="">
      <span class="ws-code">${w.code}</span><h3>${esc(w.name)}</h3><p>${esc(w.description)}</p>
      <div class="ws-meta"><span>${s.total} items</span><span>${s.blocked} blocked · ${s.risk} at risk</span></div>${progress(s.progress)}
    </button>`;
  }).join("");
  const priority=all.filter(i=>i.status==="Blocked"||i.priority==="P0"||i.risk==="Critical").sort((a,b)=>riskOrder[b.risk]-riskOrder[a.risk]||a.due.localeCompare(b.due)).slice(0,8);
  $("#priorityCount").textContent=`${priority.length} shown`;
  $("#priorityQueue").innerHTML=priority.map(i=>`<button class="row-item" data-open-item="${i.id}">
    ${chip(i.status)}<div><strong>${esc(i.title)}</strong><br><span>${i.id} · ${wsMap.get(i.workstream).name} · ${esc(i.owner)}</span></div><span>${fmt(i.due)}</span>
  </button>`).join("");
  const miles=[...all].filter(i=>i.status!=="Completed").sort((a,b)=>a.due.localeCompare(b.due)).slice(0,9);
  $("#milestones").innerHTML=miles.map(i=>`<button class="row-item" data-open-item="${i.id}">
    <span class="ws-code">${i.workstream}</span><div><strong>${esc(i.milestone)}</strong><br><span>${esc(i.title)}</span></div><span>${fmt(i.due)}</span>
  </button>`).join("");
  bindDynamic();
}
function drawerHtml(code,tab="overview"){
  const w=wsMap.get(code),a=byWs(code),s=summary(code);
  const blocked=a.filter(i=>i.status==="Blocked").slice(0,5);
  const next=[...a].filter(i=>i.status!=="Completed").sort((x,y)=>x.due.localeCompare(y.due)).slice(0,8);
  let body="";
  if(tab==="overview")body=`<div class="drawer-summary"><div><strong>${s.total}</strong><span>Items</span></div><div><strong>${s.progress}%</strong><span>Progress</span></div><div><strong>${s.blocked}</strong><span>Blocked</span></div><div><strong>${s.risk}</strong><span>At risk</span></div></div>
    <h3>Next command actions</h3>${next.map(i=>`<button class="row-item" data-open-item="${i.id}">${chip(i.status)}<div><strong>${esc(i.title)}</strong><br><span>${esc(i.nextAction)}</span></div><span>${fmt(i.due)}</span></button>`).join("")}`;
  if(tab==="items")body=a.map(i=>`<button class="row-item" data-open-item="${i.id}">${chip(i.status)}<div><strong>${esc(i.title)}</strong><br><span>${i.id} · ${i.progress}% · ${esc(i.owner)}</span></div><span>${fmt(i.due)}</span></button>`).join("");
  if(tab==="owners"){
    const grouped=Object.entries(a.reduce((o,i)=>{(o[i.owner]??=[]).push(i);return o},{}));
    body=grouped.map(([owner,arr])=>`<div class="row-item"><span class="status-chip">${arr.length}</span><div><strong>${esc(owner)}</strong><br><span>${arr.filter(i=>i.status==="Blocked").length} blocked · ${avg(arr.map(i=>i.progress))}% average</span></div><span>Lead</span></div>`).join("");
  }
  if(tab==="evidence")body=a.map(i=>`<button class="row-item" data-open-item="${i.id}"><span class="status-chip">${i.id}</span><div><strong>${esc(i.evidence)}</strong><br><span>${esc(i.decision)}</span></div><span>${i.status==="Completed"?"Approved":"Open"}</span></button>`).join("");
  return `<div class="drawer-hero"><div class="drawer-icons"><img class="drawer-main-icon" src="${w.icon}" alt=""><img class="drawer-official-icon" src="${w.navIcon}" alt=""></div><div><p class="eyebrow">${w.code} · COMMAND CHAMBER</p><h2>${esc(w.name)}</h2><span>${esc(w.description)}</span></div></div>
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
  <h3>Dependencies</h3>${deps.length?deps.map(d=>`<button class="row-item" data-open-item="${d.id}">${chip(d.status)}<div><strong>${esc(d.title)}</strong><br><span>${d.id} · ${d.workstream}</span></div><span>${d.progress}%</span></button>`).join(""):`<div class="card">No blocking dependency. This is a deliberate positive empty state.</div>`}`;
  $("#itemModal").hidden=false;bindDynamic();
}
function renderStructured(){
  $("#structuredBoard").innerHTML=DATA.workstreams.map(w=>{
    const a=byWs(w.code).sort((x,y)=>x.due.localeCompare(y.due)).slice(0,7),s=summary(w.code);
    return `<section class="structure-card"><header><div class="structure-icons"><img class="official-icon" src="${w.navIcon}" alt=""><img class="large-icon" src="${w.icon}" alt=""></div><div><span class="ws-code">${w.code}</span><h3>${esc(w.name)}</h3></div></header>
    <div class="ws-meta"><span>${s.total} items</span><span>${s.progress}% complete</span></div>${progress(s.progress)}
    <ul>${a.map(i=>`<li><button class="link-btn" data-open-item="${i.id}">${i.id} · ${esc(i.title)} · ${i.status}</button></li>`).join("")}</ul></section>`;
  }).join("");bindDynamic();
}
function renderSquare(){
  $("#squareGrid").innerHTML=DATA.workstreams.map(w=>{
    const a=byWs(w.code),s=summary(w.code);
    return `<section class="block-card"><img class="block-watermark" src="${w.icon}" alt=""><button class="block-head link-btn" data-open-ws="${w.code}"><img src="${w.navIcon}" alt=""><div><span>${w.code}</span><h3>${esc(w.name)}</h3><small>${esc(w.description)}</small></div></button>
      <div class="block-stats"><div><strong>${s.total}</strong><span>Items</span></div><div><strong>${s.progress}%</strong><span>Progress</span></div><div><strong>${s.blocked}</strong><span>Blocked</span></div></div>
      <div class="mini-items">${a.map(i=>`<button data-open-item="${i.id}" style="--state:${statusColor[i.status]}" data-tip="${esc(i.id+" · "+i.title+" · "+i.status+" · "+i.progress+"%")}" aria-label="${esc(i.id+" "+i.title)}"></button>`).join("")}</div>
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
      <img src="${w.navIcon}" alt=""><b>${i.id} · ${i.workstream}</b><strong>${esc(short(i.title,45))}</strong><span>${i.status} · ${i.progress}% · ${esc(i.owner)}</span>${progress(i.progress)}
    </button>`;
  }).join("");
  $("#waffleWs").onchange=e=>{state.waffleWs=e.target.value;renderWaffle()};bindDynamic();
}
function positions(layout){
  const P={},cx=800,cy=470;
  DATA.workstreams.forEach((w,wi)=>{
    let ax,ay;
    if(layout==="territory"){ax=250+(wi%4)*365;ay=180+Math.floor(wi/4)*300}
    else if(layout==="workflow"){ax=150+(wi%6)*260;ay=245+Math.floor(wi/6)*430}
    else {const ang=-Math.PI/2+wi*(Math.PI*2/11),r=layout==="radial"?325:350;ax=cx+Math.cos(ang)*r;ay=cy+Math.sin(ang)*r}
    P[w.code]={x:ax,y:ay};
    const arr=byWs(w.code);
    arr.forEach((i,j)=>{
      let x,y;
      if(layout==="workflow"){x=ax+((j%6)-2.5)*30;y=ay+55+Math.floor(j/6)*28}
      else if(layout==="territory"){x=ax+((j%6)-2.5)*28;y=ay+62+Math.floor(j/6)*26}
      else {const a=j*Math.PI*2/arr.length+(wi*.25),rr=70+(j%3)*18;x=ax+Math.cos(a)*rr;y=ay+Math.sin(a)*rr}
      P[i.id]={x,y};
    });
  });
  return P;
}
function renderMap(){
  const svg=$("#birdMap"),P=positions(state.mapLayout),m=itemMap(),visible=state.items.filter(i=>$("#mapStatus").value==="all"||i.status===$("#mapStatus").value);
  const vset=new Set(visible.map(i=>i.id));
  let edges="";
  if(state.edges){
    visible.forEach(i=>i.dependencies.forEach(d=>{
      if(!P[d])return;
      const target=m.get(d),color=target?statusColor[target.status]:"#aeb5bb";
      edges+=`<line class="edge" x1="${P[i.id].x}" y1="${P[i.id].y}" x2="${P[d].x}" y2="${P[d].y}" style="stroke:${color}" data-edge="${i.id}|${d}"/>`;
    }));
  }
  let nodes="";
  visible.forEach(i=>{
    const p=P[i.id],risk=riskOrder[i.risk]>=2?"risk":"";
    nodes+=`<circle class="node-dot ${risk}" data-map-item="${i.id}" cx="${p.x}" cy="${p.y}" r="${i.status==="Blocked"?6:4.7}" fill="${statusColor[i.status]}"><title>${esc(i.id+" · "+i.title+" · "+i.status+" · "+i.progress+"%")}</title></circle>`;
    if(state.labels&&(i.status==="Blocked"||i.priority==="P0"))nodes+=`<text class="node-label" x="${p.x+8}" y="${p.y-7}">${esc(i.id)}</text>`;
  });
  let anchors=`<g class="anchor" data-map-home><circle cx="800" cy="470" r="92" fill="rgba(7,10,15,.74)" stroke="#d9ae55" stroke-width="2"/><image href="assets/brand/command-centre-emblem.png" x="716" y="386" width="168" height="168" preserveAspectRatio="xMidYMid meet"/></g>`;
  DATA.workstreams.forEach(w=>{
    const p=P[w.code],s=summary(w.code);
    anchors+=`<g class="anchor" data-map-ws="${w.code}"><circle cx="${p.x}" cy="${p.y}" r="49" fill="rgba(8,12,17,.82)" stroke="rgba(217,174,85,.65)"/><image href="${w.icon}" x="${p.x-43}" y="${p.y-43}" width="86" height="86" preserveAspectRatio="xMidYMid meet"/><text x="${p.x}" y="${p.y+64}">${w.code} · ${esc(short(w.name,24))}</text><title>${esc(w.name)} · ${s.total} items · ${s.blocked} blocked</title></g>`;
  });
  svg.innerHTML=`<g id="mapLayer">${edges}${nodes}${anchors}</g>`;
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
  $("#timeline").innerHTML=a.slice(0,80).map(i=>`<button class="timeline-row" data-open-item="${i.id}"><span><b>${i.id}</b><br>${esc(short(i.title,28))}</span><div>${progress(i.progress)}<small>${esc(i.milestone)} · ${i.status}</small></div><span>${fmt(i.due)}</span></button>`).join("");bindDynamic();
}
function registerItems(){
  const q=state.search.trim().toLowerCase();
  return state.items.filter(i=>(state.registerStatus==="all"||i.status===state.registerStatus)&&(state.registerWs==="all"||i.workstream===state.registerWs)&&(!q||Object.values(i).join(" ").toLowerCase().includes(q)));
}
function renderRegister(){
  $("#registerTools").innerHTML=`<input id="registerSearch" placeholder="Search all 248 items" value="${esc(state.search)}"><select id="registerStatus"><option value="all">All statuses</option>${["Completed","Active","Review","Blocked","Later"].map(s=>`<option ${state.registerStatus===s?"selected":""}>${s}</option>`).join("")}</select><select id="registerWs"><option value="all">All workstreams</option>${DATA.workstreams.map(w=>`<option value="${w.code}" ${state.registerWs===w.code?"selected":""}>${w.code} · ${esc(w.name)}</option>`).join("")}</select><span>${registerItems().length} shown</span>`;
  $("#registerBody").innerHTML=registerItems().map(i=>`<tr data-open-item="${i.id}"><td>${i.id}</td><td>${esc(i.title)}</td><td>${i.workstream}</td><td>${chip(i.status)}</td><td>${i.risk}</td><td>${esc(i.owner)}</td><td>${fmt(i.due)}</td><td>${i.progress}%</td></tr>`).join("");
  $("#registerSearch").oninput=e=>{state.search=e.target.value;renderRegister()};
  $("#registerStatus").onchange=e=>{state.registerStatus=e.target.value;renderRegister()};
  $("#registerWs").onchange=e=>{state.registerWs=e.target.value;renderRegister()};
  bindDynamic();
}
function renderDependencies(){
  const a=state.items.filter(i=>i.dependencies.length>1).slice(0,90),m=itemMap();
  $("#dependencyList").innerHTML=a.map(i=>`<button class="card" data-open-item="${i.id}"><span class="ws-code">${i.id} · ${i.workstream}</span><h3>${esc(i.title)}</h3><p>${i.dependencies.map(d=>m.get(d)).filter(Boolean).map(d=>`${d.id} ${short(d.title,30)}`).join(" → ")}</p><footer>${chip(i.status)}<span>${i.dependencies.length} dependencies</span></footer></button>`).join("");bindDynamic();
}
function renderEvidence(){
  $("#evidenceGrid").innerHTML=state.items.slice(0,99).map(i=>`<button class="card" data-open-item="${i.id}"><span class="ws-code">${i.workstream} · ${i.id}</span><h3>${esc(i.evidence)}</h3><p>${esc(i.summary)}</p><footer><span>${i.status==="Completed"?"Approved":"In assurance"}</span><span>${esc(i.reviewer)}</span></footer></button>`).join("");bindDynamic();
}
function renderDecisions(){
  $("#decisionGrid").innerHTML=state.items.slice(0,99).map(i=>`<button class="card" data-open-item="${i.id}"><span class="ws-code">${i.priority} · ${i.id}</span><h3>${esc(i.decision)}</h3><p>${esc(i.nextAction)}</p><footer>${chip(i.status)}<span>${fmt(i.due)}</span></footer></button>`).join("");bindDynamic();
}
function bindDynamic(){
  $$("[data-open-ws]").forEach(b=>b.onclick=()=>openDrawer(b.dataset.openWs));
  $$("[data-open-item]").forEach(b=>b.onclick=()=>openItem(b.dataset.openItem));
  $$("[data-drawer-tab]").forEach(b=>b.onclick=()=>{$("#drawerContent").innerHTML=drawerHtml(state.ws,b.dataset.drawerTab);bindDynamic()});
  $$("[data-waffle-status]").forEach(b=>b.onclick=()=>{state.waffleStatus=b.dataset.waffleStatus;renderWaffle()});
  $$("[data-status-jump]").forEach(b=>b.onclick=()=>{state.registerStatus=b.dataset.statusJump;navigate("register")});
}
function exportCsv(){
  const rows=[["ID","Title","Workstream","Status","Risk","Owner","Due","Progress"],...registerItems().map(i=>[i.id,i.title,i.workstream,i.status,i.risk,i.owner,i.due,i.progress])];
  const csv=rows.map(r=>r.map(v=>`"${String(v).replaceAll('"','""')}"`).join(",")).join("\n");
  const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv"}));a.download="atlas-register-v21.csv";a.click();URL.revokeObjectURL(a.href);toast("Register exported");
}
function init(){
  renderOverview();
  $$("[data-view]").forEach(b=>b.addEventListener("click",()=>navigate(b.dataset.view)));
  $("#mobileMenu").onclick=()=>$("#rail").classList.toggle("open");
  $("#closeDrawer").onclick=closeDrawer;$("#scrim").onclick=closeDrawer;
  $("#closeItem").onclick=()=>$("#itemModal").hidden=true;
  $("#closeAdd").onclick=()=>$("#addModal").hidden=true;
  $("#addItemBtn").onclick=()=>$("#addModal").hidden=false;
  $("#addWs").innerHTML=DATA.workstreams.map(w=>`<option value="${w.code}">${w.code} · ${w.name}</option>`).join("");
  $("#addForm").onsubmit=e=>{
    e.preventDefault();const f=new FormData(e.target),id=`AT-${String(state.items.length+1).padStart(3,"0")}`;
    state.items.push({id,title:f.get("title"),workstream:f.get("workstream"),status:f.get("status"),risk:"Medium",priority:"P2",owner:f.get("owner"),reviewer:"Sophia Reed",progress:20,due:f.get("due"),milestone:"Prototype input",evidence:`Evidence pack ${id}`,decision:`Decision record ${id}`,summary:"New fully populated prototype item added during the v21 experience review.",nextAction:"Review the new item and confirm its dependency path.",dependencies:[]});
    $("#addModal").hidden=true;e.target.reset();renderOverview();toast(`${id} added to the prototype`);
  };
  $("#globalSearch").onkeydown=e=>{if(e.key==="Enter"){state.search=e.target.value;navigate("register")}};
  $("#mapLayout").onchange=e=>{state.mapLayout=e.target.value;renderMap()};
  $("#mapStatus").onchange=renderMap;
  $("#toggleEdges").onclick=e=>{state.edges=!state.edges;e.currentTarget.classList.toggle("active",state.edges);renderMap()};
  $("#toggleLabels").onclick=e=>{state.labels=!state.labels;e.currentTarget.classList.toggle("active",state.labels);renderMap()};
  $("#fitMap").onclick=()=>$("#birdMap").setAttribute("viewBox","0 0 1600 940");
  $("#fullscreenMap").onclick=()=>$("#mapShell").requestFullscreen?.();
  $("#exportCsv").onclick=exportCsv;
  document.addEventListener("keydown",e=>{if(e.key==="Escape"){closeDrawer();$("#itemModal").hidden=true;$("#addModal").hidden=true}});
  const initial=location.hash.slice(1);navigate(initial||"overview");
}
document.addEventListener("DOMContentLoaded",init);
})();
