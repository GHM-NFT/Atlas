(() => {
  "use strict";

  const CONFIG = {
    spreadsheetId: "1TszfahbSPhV0c_1LK0Y_ub_0mlEiDiwzJdC93vX7JtM",
    nodeSheet: "Atlas_Command_Map_Nodes",
    edgeSheet: "Atlas_Command_Map_Edges"
  };

  const WORKSTREAMS = [
    { code:"WS001", number:1, name:"White Paper", icon:"ws001" },
    { code:"WS002", number:2, name:"Website", icon:"ws002" },
    { code:"WS003", number:3, name:"Pipeline / Technical", icon:"ws003" },
    { code:"WS004", number:4, name:"Video Production", icon:"ws004" },
    { code:"WS005", number:5, name:"Metadata / Manifest", icon:"ws005" },
    { code:"WS006", number:6, name:"Launch / Market Readiness", icon:"ws006" },
    { code:"WS007", number:7, name:"Atlas / Story / Portal", icon:"ws007" },
    { code:"WS008", number:8, name:"Artwork / Collections", icon:"ws008" },
    { code:"WS009", number:9, name:"QA / Review / Decisions", icon:"ws009" },
    { code:"WS010", number:10, name:"Sources / Library", icon:"ws010" },
    { code:"WS011", number:11, name:"Prints / Fulfilment", icon:"ws011" }
  ];

  const state = {
    nodes: [], edges: [], view:"birdseye", status:"ALL", workstream:"ALL", owner:"ALL", risk:"ALL",
    search:"", selectedWorkstream:null, detailSort:"priority", live:false,
    labels:false, allEdges:false, mapScale:1, mapX:0, mapY:0, mapPositions:new Map(),
    lastClickedWorkstream:null, lastClickTime:0
  };

  const $ = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));
  const el = {
    viewContainer:$("#viewContainer"), totalItems:$("#totalItems"), resultsSummary:$("#resultsSummary"),
    search:$("#searchInput"), workstream:$("#workstreamFilter"), owner:$("#ownerFilter"), risk:$("#riskFilter"),
    syncDot:$("#syncDot"), syncLabel:$("#syncLabel"), syncTime:$("#syncTime"),
    rightPanel:$("#rightPanel"), scrim:$("#mobileScrim"), attentionList:$("#attentionList"),
    detailSort:$("#detailSort"), detailIcon:$("#detailIcon"), priorityStack:$("#priorityStack"),
    ownerBreakdown:$("#ownerBreakdown"), evidenceList:$("#evidenceList"),
    tooltip:$("#mapTooltip"), mapToolbar:$("#mapToolbar"), dockIcons:$("#dockIcons")
  };

  const FALLBACK = WORKSTREAMS.flatMap((w,wi)=>Array.from({length:14+(wi%6)},(_,i)=>({
    id:`${w.code}-${String(i+1).padStart(3,"0")}`, title:`${w.name} item ${i+1}`, workstream:w.code,
    owner:["GHM","Creative","Technical","Production"][i%4],
    state:["COMPLETED","COMPLETED","ACTIVE","ACTIVE","REVIEW","LATER","BLOCKED"][(i+wi)%7],
    risk:i%11===0?"RED":i%6===0?"AMBER":"GREEN", evidence:"", raw:{}
  })));

  function fallbackEdges(nodes){
    const edges=[];
    WORKSTREAMS.forEach((w,i)=>{
      const a=nodes.find(n=>n.workstream===w.code);
      const b=nodes.find(n=>n.workstream===WORKSTREAMS[(i+1)%WORKSTREAMS.length].code);
      if(a&&b) edges.push({source:a.id,target:b.id,type:"WORKSTREAM"});
      const c=nodes.find(n=>n.workstream===WORKSTREAMS[(i+3)%WORKSTREAMS.length].code);
      if(a&&c&&i%2===0) edges.push({source:a.id,target:c.id,type:"DEPENDENCY"});
    });
    nodes.forEach((n,i)=>{
      const same=nodes.filter(x=>x.workstream===n.workstream);
      if(i%3===0 && same[1]) edges.push({source:n.id,target:same[(i+1)%same.length].id,type:"INTERNAL"});
    });
    return edges;
  }

  function csvUrl(sheet){
    return `https://docs.google.com/spreadsheets/d/${CONFIG.spreadsheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheet)}`;
  }
  function parseCSV(text){
    const rows=[];let row=[],field="",quote=false;
    for(let i=0;i<text.length;i++){
      const c=text[i],n=text[i+1];
      if(c==='"'&&quote&&n==='"'){field+='"';i++}
      else if(c==='"'){quote=!quote}
      else if(c===","&&!quote){row.push(field);field=""}
      else if((c==="\n"||c==="\r")&&!quote){if(c==="\r"&&n==="\n")i++;row.push(field);field="";if(row.some(v=>v!==""))rows.push(row);row=[]}
      else field+=c;
    }
    if(field||row.length){row.push(field);rows.push(row)}
    if(!rows.length)return[];
    const headers=rows.shift().map(h=>h.trim());
    return rows.map(r=>Object.fromEntries(headers.map((h,i)=>[h,(r[i]??"").trim()])));
  }
  function pick(obj,keys){
    const source=Object.keys(obj);
    for(const key of keys){
      const found=source.find(k=>k.toLowerCase().replace(/[^a-z0-9]/g,"")===key.toLowerCase().replace(/[^a-z0-9]/g,""));
      if(found&&obj[found]!=="")return obj[found];
    }
    return "";
  }
  function normalizeWorkstream(raw){
    const value=String(raw||"").toUpperCase();
    const direct=value.match(/WS\s*0*([1-9]|1[01])/);
    if(direct)return`WS${String(Number(direct[1])).padStart(3,"0")}`;
    const found=WORKSTREAMS.find(w=>value.includes(w.name.toUpperCase().split(" / ")[0]));
    return found?found.code:"UNASSIGNED";
  }
  function normalizeState(raw){
    const v=String(raw||"").trim().toUpperCase().replace(/[\s-]+/g,"_");
    if(/DONE|COMPLETE|CLOSED|APPROVED/.test(v))return"COMPLETED";
    if(/BLOCK|GATED|HOLD|DEPEND/.test(v))return"BLOCKED";
    if(/REVIEW|QA|VERIFY|DECISION/.test(v))return"REVIEW";
    if(/ACTIVE|NOW|DOING|PROGRESS|OPEN/.test(v))return"ACTIVE";
    return"LATER";
  }
  function normalizeRisk(raw){
    const v=String(raw||"").toUpperCase();
    if(/RED|HIGH|CRITICAL/.test(v))return"RED";
    if(/AMBER|YELLOW|MEDIUM/.test(v))return"AMBER";
    if(/GREEN|LOW|OK/.test(v))return"GREEN";
    return"NONE";
  }
  function mapNode(row,index){
    return{
      id:pick(row,["Node_ID","ID","Item_ID"])||`ROW-${index+1}`,
      title:pick(row,["Node_Name","Node_Title","Title","Item","Task","Name"])||`Untitled item ${index+1}`,
      workstream:normalizeWorkstream(pick(row,["Workstream_ID","Workstream","WS","Area","Territory","Parent_Workstream"])),
      owner:pick(row,["Owner","Lead","Responsible","Accountable"])||"Unassigned",
      state:normalizeState(pick(row,["State_Bucket","Status","State","Workflow_State"])),
      risk:normalizeRisk(pick(row,["RAG_Risk","Risk","RAG","Risk_Status"])),
      evidence:pick(row,["Evidence","Proof","Link","URL"]),raw:row
    };
  }
  function mapEdge(row,index){
    return{
      id:pick(row,["Edge_ID","ID"])||`EDGE-${index+1}`,
      source:pick(row,["Source_Node_ID","Source","From","From_ID","Parent","Upstream"]),
      target:pick(row,["Target_Node_ID","Target","To","To_ID","Child","Downstream"]),
      type:pick(row,["Relationship_Type","Type","Relationship","Edge_Type"])||"DEPENDENCY",
      label:pick(row,["Label","Description","Relationship_Label"])
    };
  }
  async function loadData(){
    setSync("loading");
    try{
      const [nodeRes,edgeRes]=await Promise.all([
        fetch(csvUrl(CONFIG.nodeSheet),{cache:"no-store"}),
        fetch(csvUrl(CONFIG.edgeSheet),{cache:"no-store"})
      ]);
      if(!nodeRes.ok)throw new Error(`Node sheet returned ${nodeRes.status}`);
      const rows=parseCSV(await nodeRes.text());
      const mapped=rows.map(mapNode).filter(n=>n.title&&n.workstream!=="UNASSIGNED");
      if(!mapped.length)throw new Error("No recognised workstream records");
      let edges=[];
      if(edgeRes.ok)edges=parseCSV(await edgeRes.text()).map(mapEdge).filter(e=>e.source&&e.target);
      state.nodes=mapped;state.edges=edges;state.live=true;setSync("live");
    }catch(error){
      console.warn("Live register unavailable; using preview data.",error);
      state.nodes=FALLBACK;state.edges=fallbackEdges(FALLBACK);state.live=false;setSync("error");
    }
    populateFilters();renderDock();update();
  }
  function setSync(mode){
    el.syncDot.className="sync-dot"+(mode==="live"?" live":mode==="error"?" error":"");
    if(mode==="live"){el.syncLabel.textContent="Live register connected";el.syncTime.textContent=`Updated ${new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}`}
    else if(mode==="error"){el.syncLabel.textContent="Preview data shown";el.syncTime.textContent="Live sheet could not be reached"}
    else{el.syncLabel.textContent="Connecting to live register…";el.syncTime.textContent="Google Sheets"}
  }
  function populateFilters(){
    el.workstream.innerHTML='<option value="ALL">All 11 workstreams</option>'+WORKSTREAMS.map(w=>`<option value="${w.code}">${w.code} — ${w.name}</option>`).join("");
    const owners=[...new Set(state.nodes.map(n=>n.owner).filter(Boolean))].sort();
    el.owner.innerHTML='<option value="ALL">All owners</option>'+owners.map(o=>`<option>${escapeHtml(o)}</option>`).join("");
  }
  function renderDock(){
    el.dockIcons.innerHTML=WORKSTREAMS.map(w=>`<button class="dock-icon" data-dock="${w.code}" aria-label="Focus ${escapeHtml(w.name)}">
      <img src="assets/workstream-icons/${w.icon}-responsive.png" alt=""><span>${w.number}</span>
    </button>`).join("");
    $$("[data-dock]").forEach(b=>b.addEventListener("click",()=>focusWorkstream(b.dataset.dock,false)));
  }
  function filteredNodes(){
    const q=state.search.toLowerCase();
    return state.nodes.filter(n=>{
      const atRisk=n.risk==="RED"||n.risk==="AMBER";
      const statusOK=state.status==="ALL"||
        (state.status==="AT_RISK"?atRisk:
        state.status==="BLOCKED"?n.state==="BLOCKED":
        state.status==="REVIEW"?n.state==="REVIEW":
        state.status==="COMPLETED"?n.state==="COMPLETED":
        state.status==="ACTIVE"?n.state==="ACTIVE":true);
      const hay=[n.id,n.title,n.owner,n.workstream,n.evidence,...Object.values(n.raw||{})].join(" ").toLowerCase();
      return statusOK&&(state.workstream==="ALL"||n.workstream===state.workstream)&&(state.owner==="ALL"||n.owner===state.owner)&&
        (state.risk==="ALL"||n.risk===state.risk)&&(!q||hay.includes(q));
    });
  }
  function summarise(nodes,workstream){
    const group=nodes.filter(n=>n.workstream===workstream),done=group.filter(n=>n.state==="COMPLETED").length,
      risk=group.filter(n=>n.risk==="RED"||n.risk==="AMBER").length,blocked=group.filter(n=>n.state==="BLOCKED").length,
      percent=group.length?Math.round(done/group.length*100):0;
    const topRisk=group.some(n=>n.risk==="RED")?"RED":group.some(n=>n.risk==="AMBER")?"AMBER":group.length?"GREEN":"NONE";
    const dominant=["BLOCKED","ACTIVE","REVIEW","LATER","COMPLETED"].sort((a,b)=>group.filter(n=>n.state===b).length-group.filter(n=>n.state===a).length)[0]||"LATER";
    return{group,total:group.length,done,risk,blocked,open:group.length-done,percent,topRisk,dominant};
  }
  function priorityScore(n){return(n.risk==="RED"?100:n.risk==="AMBER"?45:0)+(n.state==="BLOCKED"?80:n.state==="REVIEW"?28:n.state==="ACTIVE"?18:0)+(n.owner==="Unassigned"?12:0)}
  function healthScore(s){if(!s.total)return 0;return Math.max(0,Math.min(100,Math.round(s.percent-s.risk*7-s.blocked*12+20)))}
  function validUrl(v){try{const u=new URL(v);return/^https?:$/.test(u.protocol)?u.href:""}catch(_){return""}}
  function dependencyCounts(nodeId){
    const incoming=state.edges.filter(e=>e.target===nodeId).length,outgoing=state.edges.filter(e=>e.source===nodeId).length;
    return{incoming,outgoing,total:incoming+outgoing};
  }
  function workstreamDependencyMap(){
    const nodeMap=new Map(state.nodes.map(n=>[n.id,n]));
    const set=new Set(), list=[];
    state.edges.forEach(e=>{
      const a=nodeMap.get(e.source),b=nodeMap.get(e.target);
      if(!a||!b||a.workstream===b.workstream)return;
      const key=`${a.workstream}|${b.workstream}`;
      if(!set.has(key)){set.add(key);list.push({source:a.workstream,target:b.workstream,type:e.type})}
    });
    return list;
  }
  function updateCounts(nodes=state.nodes){
    const count=fn=>nodes.filter(fn).length;
    $("#countAll").textContent=nodes.length;$("#countActive").textContent=count(n=>n.state==="ACTIVE");
    $("#countRisk").textContent=count(n=>n.risk==="RED"||n.risk==="AMBER");$("#countBlocked").textContent=count(n=>n.state==="BLOCKED");
    $("#countReview").textContent=count(n=>n.state==="REVIEW");$("#countCompleted").textContent=count(n=>n.state==="COMPLETED");
    el.totalItems.textContent=`${nodes.length} visible items`;
  }
  function renderAttention(nodes){
    const urgent=nodes.filter(n=>n.risk==="RED"||n.risk==="AMBER"||n.state==="BLOCKED"||n.state==="REVIEW").sort((a,b)=>priorityScore(b)-priorityScore(a)).slice(0,8);
    el.attentionList.innerHTML=urgent.map(n=>`<button class="attention-card ${priorityScore(n)>=100?"critical":""}" data-workstream="${n.workstream}">
      <span>${n.workstream}</span><strong>${escapeHtml(n.title)}</strong><small>${escapeHtml(n.owner)} · ${n.state}</small>
      <span class="attention-badges">${n.risk!=="NONE"?`<span class="mini-badge ${n.risk.toLowerCase()}">${n.risk} risk</span>`:""}${n.state==="BLOCKED"?'<span class="mini-badge red">Blocked</span>':""}</span>
    </button>`).join("")||'<div class="empty-state">No matching items currently need attention.</div>';
    bindWorkstreamButtons();
  }
  function update(){
    const nodes=filteredNodes();updateCounts(nodes);renderAttention(nodes);
    const contexts=[state.workstream!=="ALL"?state.workstream:"",state.owner!=="ALL"?state.owner:"",state.risk!=="ALL"?`${state.risk} risk`:"",state.status!=="ALL"?state.status.replace("_"," "):""].filter(Boolean);
    el.resultsSummary.innerHTML=`<span>Showing ${nodes.length} of ${state.nodes.length} items</span>${contexts.length?`<span class="filter-context">${contexts.map(x=>`<span class="filter-pill">${escapeHtml(x)}</span>`).join("")}</span>`:""}`;
    document.body.classList.toggle("canvas-view",["birdseye","tiles","waffle"].includes(state.view));
    document.body.classList.toggle("structured-view-active",state.view==="structured");
    el.mapToolbar.hidden=state.view!=="birdseye";
    if(state.view==="birdseye")renderProjectMap(nodes);
    else if(state.view==="structured")renderStructured(nodes);
    else if(state.view==="tiles")renderTiles(nodes);
    else renderWaffle(nodes);
  }

  function clusterLayout(nodes){
    const W=1800,H=1100,cx=W/2,cy=H/2,rx=660,ry=390;
    const positions=new Map(),centres=new Map();
    WORKSTREAMS.forEach((w,i)=>{
      const angle=-Math.PI/2+i*(Math.PI*2/WORKSTREAMS.length);
      const x=cx+Math.cos(angle)*rx,y=cy+Math.sin(angle)*ry;
      centres.set(w.code,{x,y});
      const group=nodes.filter(n=>n.workstream===w.code);
      group.forEach((n,j)=>{
        const ring=Math.floor(j/14)+1, index=j%14, count=Math.min(14,group.length-(ring-1)*14);
        const a=index*(Math.PI*2/Math.max(count,1))+ring*.23;
        const radius=95+ring*48;
        positions.set(n.id,{x:x+Math.cos(a)*radius,y:y+Math.sin(a)*radius,workstream:w.code});
      });
    });
    state.mapPositions=positions;
    return{W,H,centres,positions};
  }
  function renderProjectMap(nodes){
    const {W,H,centres,positions}=clusterLayout(nodes),nodeMap=new Map(nodes.map(n=>[n.id,n]));
    const wsEdges=workstreamDependencyMap();
    const internalEdges=state.edges.filter(e=>nodeMap.has(e.source)&&nodeMap.has(e.target));
    const focus=state.selectedWorkstream;
    const relatedWS=new Set([focus]);
    if(focus)wsEdges.forEach(e=>{if(e.source===focus)relatedWS.add(e.target);if(e.target===focus)relatedWS.add(e.source)});
    const wsEdgeSvg=wsEdges.map(e=>{
      const a=centres.get(e.source),b=centres.get(e.target);if(!a||!b)return"";
      const highlighted=focus&&(e.source===focus||e.target===focus);
      const dimmed=focus&&!highlighted;
      return`<path class="map-edge workstream-edge ${highlighted?"highlighted":""} ${dimmed?"dimmed":""}" d="${curvePath(a,b,0.12)}"></path>`;
    }).join("");
    const nodeEdgeSvg=internalEdges.map(e=>{
      const a=positions.get(e.source),b=positions.get(e.target);if(!a||!b)return"";
      const source=nodeMap.get(e.source),target=nodeMap.get(e.target);
      const sameFocus=focus&&(source.workstream===focus||target.workstream===focus);
      const show=state.allEdges||sameFocus;
      if(!show)return"";
      const dimmed=focus&&!sameFocus;
      const blocked=(source.state==="BLOCKED"||target.state==="BLOCKED");
      return`<path class="map-edge ${sameFocus?"highlighted":""} ${blocked?"blocked":""} ${dimmed?"dimmed":""}" d="${curvePath(a,b,0.06)}"></path>`;
    }).join("");
    const nodeSvg=nodes.map(n=>{
      const p=positions.get(n.id);if(!p)return"";
      const dimmed=focus&&!relatedWS.has(n.workstream), highlighted=focus===n.workstream, dep=dependencyCounts(n.id);
      return`<g class="map-node ${dimmed?"dimmed":""} ${highlighted?"highlighted":""}" tabindex="0" data-node="${escapeHtml(n.id)}" data-workstream="${n.workstream}" transform="translate(${p.x},${p.y})">
        <circle class="node-risk ${n.risk}" r="10"></circle><circle class="node-dot ${n.state}" r="6"></circle>
        <text class="node-label" x="12" y="4">${escapeHtml(shorten(n.title,44))}</text>
        <title>${escapeHtml(n.title)} · ${n.state} · ${n.risk} risk · ${dep.total} dependencies</title>
      </g>`;
    }).join("");
    const wsSvg=WORKSTREAMS.map(w=>{
      const c=centres.get(w.code),s=summarise(nodes,w.code),dimmed=focus&&!relatedWS.has(w.code),selected=focus===w.code,related=focus&&relatedWS.has(w.code)&&!selected;
      return`<g class="workstream-node map-node ${dimmed?"dimmed":""} ${selected?"selected":""} ${related?"related":""}" tabindex="0" data-main="${w.code}" transform="translate(${c.x},${c.y})">
        <circle class="workstream-halo" r="66"></circle>
        <image class="workstream-image" href="assets/workstream-icons/${w.icon}-responsive.png" x="-51" y="-51" width="102" height="102"></image>
        <circle cx="48" cy="-48" r="17" fill="#071727" stroke="#d5ad5a" stroke-width="2"></circle>
        <text class="workstream-count" x="48" y="-44">${s.total}</text>
        <text class="workstream-code" y="84">${w.code}</text>
        <text class="workstream-label" y="103">${escapeHtml(shorten(w.name,27))}</text>
      </g>`;
    }).join("");
    el.viewContainer.innerHTML=`<div class="project-map"><svg class="map-svg ${state.labels?"show-labels":""}" viewBox="0 0 ${W} ${H}" aria-label="Whole project dependency map">
      <defs><filter id="glow"><feGaussianBlur stdDeviation="4" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
      <g class="map-world" transform="translate(${state.mapX} ${state.mapY}) scale(${state.mapScale})">${wsEdgeSvg}${nodeEdgeSvg}${nodeSvg}${wsSvg}</g>
    </svg></div>`;
    bindMapInteractions(W,H,centres,nodeMap);
    updateDockState();
  }
  function curvePath(a,b,bend){
    const mx=(a.x+b.x)/2,my=(a.y+b.y)/2,dx=b.x-a.x,dy=b.y-a.y,nx=-dy,ny=dx,len=Math.hypot(nx,ny)||1;
    const cx=mx+(nx/len)*Math.hypot(dx,dy)*bend,cy=my+(ny/len)*Math.hypot(dx,dy)*bend;
    return`M ${a.x} ${a.y} Q ${cx} ${cy} ${b.x} ${b.y}`;
  }
  function bindMapInteractions(W,H,centres,nodeMap){
    const svg=$(".map-svg"),world=$(".map-world");let dragging=false,lastX=0,lastY=0;
    const apply=()=>world.setAttribute("transform",`translate(${state.mapX} ${state.mapY}) scale(${state.mapScale})`);
    svg.addEventListener("wheel",e=>{
      e.preventDefault();const rect=svg.getBoundingClientRect(),mx=(e.clientX-rect.left)/rect.width*W,my=(e.clientY-rect.top)/rect.height*H;
      const old=state.mapScale,factor=e.deltaY<0?1.12:.89,next=Math.min(3.5,Math.max(.45,old*factor));
      state.mapX=mx-(mx-state.mapX)*(next/old);state.mapY=my-(my-state.mapY)*(next/old);state.mapScale=next;apply();
    },{passive:false});
    svg.addEventListener("pointerdown",e=>{if(e.target.closest(".map-node"))return;dragging=true;lastX=e.clientX;lastY=e.clientY;svg.setPointerCapture(e.pointerId);svg.classList.add("dragging")});
    svg.addEventListener("pointermove",e=>{if(!dragging)return;const rect=svg.getBoundingClientRect();state.mapX+=(e.clientX-lastX)/rect.width*W;state.mapY+=(e.clientY-lastY)/rect.height*H;lastX=e.clientX;lastY=e.clientY;apply()});
    svg.addEventListener("pointerup",()=>{dragging=false;svg.classList.remove("dragging")});
    $$("[data-main]").forEach(g=>{
      g.addEventListener("click",()=>handleMainClick(g.dataset.main));
      g.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();handleMainClick(g.dataset.main)}});
      bindTooltip(g,()=>workstreamTooltip(g.dataset.main));
    });
    $$("[data-node]").forEach(g=>{
      g.addEventListener("click",()=>showNodeTooltip(g.dataset.node,true));
      bindTooltip(g,()=>nodeTooltip(nodeMap.get(g.dataset.node)));
    });
  }
  function handleMainClick(code){
    const now=Date.now(),second=state.lastClickedWorkstream===code&&(now-state.lastClickTime)<1400&&state.selectedWorkstream===code;
    state.lastClickedWorkstream=code;state.lastClickTime=now;
    if(second)showDetails(code);
    else focusWorkstream(code,true);
  }
  function focusWorkstream(code,animate=true){
    state.selectedWorkstream=code;$("#clearFocusButton").disabled=false;
    const w=WORKSTREAMS.find(x=>x.code===code);if(!w)return;
    const index=WORKSTREAMS.indexOf(w),angle=-Math.PI/2+index*(Math.PI*2/WORKSTREAMS.length),cx=900+Math.cos(angle)*660,cy=550+Math.sin(angle)*390;
    state.mapScale=1.8;state.mapX=900-cx*state.mapScale;state.mapY=550-cy*state.mapScale;
    renderProjectMap(filteredNodes());
  }
  function fitMap(){
    state.mapScale=1;state.mapX=0;state.mapY=0;state.selectedWorkstream=null;$("#clearFocusButton").disabled=true;renderProjectMap(filteredNodes());
  }
  function updateDockState(){
    $("#dockHome").classList.toggle("active",!state.selectedWorkstream);
    $$("[data-dock]").forEach(b=>b.classList.toggle("active",b.dataset.dock===state.selectedWorkstream));
  }
  function bindTooltip(target,getHtml){
    target.addEventListener("pointerenter",e=>{el.tooltip.innerHTML=getHtml();el.tooltip.hidden=false;moveTooltip(e)});
    target.addEventListener("pointermove",moveTooltip);
    target.addEventListener("pointerleave",()=>el.tooltip.hidden=true);
  }
  function moveTooltip(e){el.tooltip.style.left=`${Math.min(innerWidth-310,e.clientX+16)}px`;el.tooltip.style.top=`${Math.min(innerHeight-180,e.clientY+16)}px`}
  function workstreamTooltip(code){
    const w=WORKSTREAMS.find(x=>x.code===code),s=summarise(filteredNodes(),code),deps=workstreamDependencyMap().filter(e=>e.source===code||e.target===code).length;
    return`<strong>${code} — ${escapeHtml(w.name)}</strong>${s.done} complete · ${s.open} open · ${s.blocked} blocked
      <div class="tooltip-meta"><span>${s.percent}% complete</span><span>${s.risk} at risk</span><span>${deps} connected areas</span></div>`;
  }
  function nodeTooltip(n){
    const d=dependencyCounts(n.id);
    return`<strong>${escapeHtml(n.title)}</strong>${escapeHtml(n.owner)}
      <div class="tooltip-meta"><span>${n.state}</span><span>${n.risk} risk</span><span>${d.incoming} in</span><span>${d.outgoing} out</span></div>`;
  }
  function showNodeTooltip(id,pin){const n=state.nodes.find(x=>x.id===id);if(!n)return;el.tooltip.innerHTML=nodeTooltip(n);el.tooltip.hidden=false}

  function renderStructured(nodes){
    const columns=[["COMPLETED","Completed"],["ACTIVE","Active"],["REVIEW","Review"],["BLOCKED","Blocked"],["LATER","Later / to do"]];
    el.viewContainer.innerHTML=`<div class="structured-view">${columns.map(([key,label])=>{
      const group=nodes.filter(n=>n.state===key);
      return`<section class="structure-column"><h3>${label}<span>${group.length}</span></h3>${group.slice(0,100).map(n=>{
        const w=WORKSTREAMS.find(x=>x.code===n.workstream),d=dependencyCounts(n.id);
        return`<button class="structure-item" data-workstream="${n.workstream}">
          <img class="structure-icon" src="assets/workstream-icons/${w.icon}-responsive.png" alt="">
          <strong>${escapeHtml(n.title)}</strong><small>${n.workstream} · ${escapeHtml(n.owner)}</small>
          <span class="structure-badges"><span>${n.risk} risk</span><span class="dependency-badge">${d.total} deps</span>${validUrl(n.evidence)?'<span>Evidence</span>':""}</span>
        </button>`;
      }).join("")||'<div class="empty-state">No items</div>'}</section>`;
    }).join("")}</div>`;bindWorkstreamButtons();
  }
  function renderTiles(nodes){
    el.viewContainer.innerHTML=`<div class="square-grid">${WORKSTREAMS.map(w=>{
      const s=summarise(nodes,w.code),deps=workstreamDependencyMap().filter(e=>e.source===w.code||e.target===w.code).length;
      return`<button class="square-tile ${s.dominant.toLowerCase()}" data-workstream="${w.code}">
        <span class="risk-corner ${s.topRisk}"></span><img class="tile-icon" src="assets/workstream-icons/${w.icon}-responsive.png" alt="">
        <span>${w.code}</span><h3>${escapeHtml(w.name)}</h3><div class="tile-percent">${s.percent}%</div>
        <small>${s.done} complete · ${s.open} open · ${s.risk} at risk</small>
        <div class="chart-tooltip-card"><strong>${deps} connected workstreams</strong><br>${s.blocked} blocked · ${s.group.filter(n=>n.state==="REVIEW").length} in review<br>Click for command chamber</div>
      </button>`;
    }).join("")}</div>`;bindWorkstreamButtons();
  }
  function renderWaffle(nodes){
    const summaries=WORKSTREAMS.map(w=>summarise(nodes,w.code));
    const totalDone=summaries.reduce((a,s)=>a+s.done,0),totalRisk=summaries.reduce((a,s)=>a+s.risk,0);
    const groups=WORKSTREAMS.map(w=>{
      const s=summarise(nodes,w.code);
      const cells=s.group.slice(0,180).map(n=>{const d=dependencyCounts(n.id);return`<button class="waffle-cell ${n.state.toLowerCase()}" data-workstream="${n.workstream}" data-short="${escapeHtml(shorten(n.title,55))} · ${n.owner} · ${n.state} · ${n.risk} risk · ${d.total} deps"></button>`}).join("");
      return`<section class="waffle-workstream"><div class="waffle-workstream-head"><img src="assets/workstream-icons/${w.icon}-responsive.png" alt=""><div><h3>${w.code} — ${escapeHtml(w.name)}</h3><small>${s.done} complete · ${s.open} open · ${s.risk} at risk</small></div><strong>${s.percent}%</strong></div><div class="waffle-workstream-cells">${cells||'<small>No matching items</small>'}</div></section>`;
    }).join("");
    el.viewContainer.innerHTML=`<div class="waffle-layout"><div>${groups}</div><aside class="waffle-key"><h3>Project status</h3>
      <div class="waffle-summary"><div><span>Complete</span><strong>${totalDone}</strong></div><div><span>At risk</span><strong>${totalRisk}</strong></div></div>
      <p>Each square is one item. Colour shows workflow state; hover reveals owner, risk and dependency count.</p>
    </aside></div>`;bindWorkstreamButtons();
  }
  function bindWorkstreamButtons(){$$("[data-workstream]").forEach(b=>b.addEventListener("click",()=>showDetails(b.dataset.workstream)))}
  function healthLabel(score){return score>=80?"Strong":score>=60?"Stable":score>=40?"Watch":"Intervention"}
  function renderPriorityStack(group){
    const items=[...group].sort((a,b)=>priorityScore(b)-priorityScore(a)).slice(0,6);
    el.priorityStack.innerHTML=items.map((n,i)=>`<article class="priority-item ${priorityScore(n)>=100?"critical":""}"><span class="priority-rank">${i+1}</span><strong>${escapeHtml(n.title)}</strong><small>${n.state} · ${n.risk} risk · ${escapeHtml(n.owner)}</small></article>`).join("")||'<div class="empty-state">No matching priorities.</div>';
  }
  function renderOwnerBreakdown(group){
    const counts={};group.forEach(n=>counts[n.owner]=(counts[n.owner]||0)+1);const rows=Object.entries(counts).sort((a,b)=>b[1]-a[1]),max=rows[0]?.[1]||1;
    el.ownerBreakdown.innerHTML=rows.map(([owner,count])=>`<article class="owner-row"><div class="owner-row-head"><strong>${escapeHtml(owner)}</strong><span>${count} item${count===1?"":"s"}</span></div><div class="owner-bar"><span style="width:${Math.round(count/max*100)}%"></span></div></article>`).join("")||'<div class="empty-state">No ownership data.</div>';
  }
  function renderEvidence(group){
    const rows=group.filter(n=>validUrl(n.evidence));
    el.evidenceList.innerHTML=rows.map(n=>`<article class="evidence-row"><strong>${escapeHtml(n.title)}</strong><small>${escapeHtml(n.owner)} · ${n.state}</small><a href="${escapeHtml(validUrl(n.evidence))}" target="_blank" rel="noopener">Open source evidence ↗</a></article>`).join("")||'<div class="empty-state">No linked evidence is available.</div>';
  }
  function showDetails(code){
    state.selectedWorkstream=code;const w=WORKSTREAMS.find(x=>x.code===code);if(!w)return;const s=summarise(filteredNodes(),code);
    el.detailIcon.src=`assets/workstream-icons/${w.icon}-desktop.png`;el.detailIcon.alt=`${w.name} workstream icon`;
    $("#detailTitle").textContent=`${code} — ${w.name}`;$("#detailDescription").textContent="Live workstream summary with priorities, ownership, evidence and dependency-aware status.";
    $("#detailTotal").textContent=s.total;$("#detailDone").textContent=s.done;$("#detailOpen").textContent=s.open;$("#detailRisk").textContent=s.risk;
    $("#detailBlocked").textContent=s.blocked;$("#detailReview").textContent=s.group.filter(n=>n.state==="REVIEW").length;
    const health=healthScore(s);$("#detailHealth").textContent=health;$("#detailHealthLabel").textContent=healthLabel(health);
    $("#detailPercent").textContent=`${s.percent}%`;$("#detailProgress").style.width=`${s.percent}%`;
    renderPriorityStack(s.group);renderOwnerBreakdown(s.group);renderEvidence(s.group);
    const sorted=[...s.group].sort((a,b)=>state.detailSort==="owner"?a.owner.localeCompare(b.owner):state.detailSort==="title"?a.title.localeCompare(b.title):state.detailSort==="state"?a.state.localeCompare(b.state):priorityScore(b)-priorityScore(a));
    $("#detailList").innerHTML=sorted.slice(0,50).map(n=>{const evidence=validUrl(n.evidence),d=dependencyCounts(n.id);return`<div class="detail-item ${n.state.toLowerCase()}"><strong>${escapeHtml(n.title)}</strong><small>${n.state} · ${escapeHtml(n.owner)} · ${d.incoming} in / ${d.outgoing} out</small><span class="detail-risk ${n.risk}">${n.risk==="NONE"?"—":n.risk[0]}</span>${evidence?`<a class="evidence-link" href="${escapeHtml(evidence)}" target="_blank" rel="noopener">Open evidence ↗</a>`:""}</div>`}).join("")||'<div class="empty-state">No matching items</div>';
    el.rightPanel.classList.add("open");el.scrim.classList.add("show");
  }
  function closePanels(){el.rightPanel.classList.remove("open");$("#leftRail").classList.remove("open");el.scrim.classList.remove("show");$("#menuButton").setAttribute("aria-expanded","false")}
  function shorten(v,n){const s=String(v||"");return s.length>n?s.slice(0,n-1)+"…":s}
  function escapeHtml(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}

  $$(".view-tab,.rail-item[data-view]").forEach(b=>b.addEventListener("click",()=>{state.view=b.dataset.view;$$(".view-tab,.rail-item[data-view]").forEach(x=>x.classList.toggle("active",x.dataset.view===state.view));closePanels();update()}));
  $$(".status-stat").forEach(b=>b.addEventListener("click",()=>{state.status=b.dataset.status;$$(".status-stat").forEach(x=>x.classList.toggle("active",x===b));update()}));
  el.search.addEventListener("input",e=>{state.search=e.target.value;update()});el.workstream.addEventListener("change",e=>{state.workstream=e.target.value;update()});
  el.owner.addEventListener("change",e=>{state.owner=e.target.value;update()});el.risk.addEventListener("change",e=>{state.risk=e.target.value;update()});
  $("#resetButton").addEventListener("click",()=>{Object.assign(state,{status:"ALL",workstream:"ALL",owner:"ALL",risk:"ALL",search:""});el.search.value="";el.workstream.value="ALL";el.owner.value="ALL";el.risk.value="ALL";$$(".status-stat").forEach((x,i)=>x.classList.toggle("active",i===0));update()});
  $("#fitMapButton").addEventListener("click",fitMap);$("#clearFocusButton").addEventListener("click",fitMap);
  $("#labelsButton").addEventListener("click",e=>{state.labels=!state.labels;e.currentTarget.setAttribute("aria-pressed",String(state.labels));e.currentTarget.textContent=state.labels?"Hide labels":"Show labels";if(state.view==="birdseye")renderProjectMap(filteredNodes())});
  $("#edgesButton").addEventListener("click",e=>{state.allEdges=!state.allEdges;e.currentTarget.setAttribute("aria-pressed",String(state.allEdges));e.currentTarget.textContent=state.allEdges?"Hide extra dependencies":"Show all dependencies";if(state.view==="birdseye")renderProjectMap(filteredNodes())});
  $("#dockHome").addEventListener("click",()=>{state.view="birdseye";$$(".view-tab,.rail-item[data-view]").forEach(x=>x.classList.toggle("active",x.dataset.view==="birdseye"));fitMap();update()});
  $$(".chamber-tab").forEach(tab=>tab.addEventListener("click",()=>{$$(".chamber-tab").forEach(x=>x.classList.toggle("active",x===tab));$$("[data-detail-section]").forEach(s=>s.classList.toggle("active",s.dataset.detailSection===tab.dataset.detailTab))}));
  $("#attentionToggle").addEventListener("click",()=>{const list=$("#attentionList"),hidden=list.hidden=!list.hidden;$("#attentionToggle").textContent=hidden?"Expand":"Collapse";$("#attentionToggle").setAttribute("aria-expanded",String(!hidden))});
  el.detailSort.addEventListener("change",e=>{state.detailSort=e.target.value;if(state.selectedWorkstream)showDetails(state.selectedWorkstream)});
  $("#refreshButton").addEventListener("click",loadData);$("#panelClose").addEventListener("click",closePanels);el.scrim.addEventListener("click",closePanels);
  $("#menuButton").addEventListener("click",()=>{const rail=$("#leftRail"),open=!rail.classList.contains("open");rail.classList.toggle("open",open);el.scrim.classList.toggle("show",open);$("#menuButton").setAttribute("aria-expanded",String(open))});
  loadData();
})();