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
    nodes: [], edges: [], view:"waffle", search:"",
    focusedWorkstream:null, selectedNode:null, live:false
  };

  const $ = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));
  const el = {
    viewContainer:$("#viewContainer"),
    search:$("#searchInput"),
    tooltip:$("#nodeTooltip"),
    rail:$("#railWorkstreams")
  };

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
      else if((c==="\n"||c==="\r")&&!quote){
        if(c==="\r"&&n==="\n")i++;
        row.push(field);field="";
        if(row.some(v=>v!==""))rows.push(row);
        row=[];
      } else field+=c;
    }
    if(field||row.length){row.push(field);rows.push(row)}
    if(!rows.length)return[];
    const headers=rows.shift().map(h=>h.trim());
    return rows.map(r=>Object.fromEntries(headers.map((h,i)=>[h,(r[i]??"").trim()])));
  }
  function pick(obj,keys){
    const source=Object.keys(obj);
    for(const key of keys){
      const norm=s=>s.toLowerCase().replace(/[^a-z0-9]/g,"");
      const found=source.find(k=>norm(k)===norm(key));
      if(found&&obj[found]!=="")return obj[found];
    }
    return "";
  }
  function normalizeWorkstream(raw){
    const value=String(raw||"").toUpperCase();
    const match=value.match(/WS\s*0*([1-9]|1[01])/);
    if(match)return `WS${String(Number(match[1])).padStart(3,"0")}`;
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
    return {
      id:pick(row,["Node_ID","ID","Item_ID"])||`ROW-${index+1}`,
      title:pick(row,["Node_Name","Node_Title","Title","Item","Task","Name"])||`Untitled item ${index+1}`,
      workstream:normalizeWorkstream(pick(row,["Workstream_ID","Workstream","WS","Area","Territory","Parent_Workstream"])),
      owner:pick(row,["Owner","Lead","Responsible","Accountable"])||"Unassigned",
      state:normalizeState(pick(row,["State_Bucket","Status","State","Workflow_State"])),
      risk:normalizeRisk(pick(row,["RAG_Risk","Risk","RAG","Risk_Status"])),
      evidence:pick(row,["Evidence","Proof","Link","URL"]),
      raw:row
    };
  }
  function mapEdge(row,index){
    return {
      id:pick(row,["Edge_ID","ID"])||`EDGE-${index+1}`,
      source:pick(row,["Source_Node_ID","Source","From","From_ID","Parent","Upstream"]),
      target:pick(row,["Target_Node_ID","Target","To","To_ID","Child","Downstream"]),
      type:pick(row,["Relationship_Type","Type","Relationship","Edge_Type"])||"DEPENDENCY",
      label:pick(row,["Label","Description","Relationship_Label"])
    };
  }

  async function loadData(){
    try{
      const [nodesRes,edgesRes]=await Promise.all([
        fetch(csvUrl(CONFIG.nodeSheet),{cache:"no-store"}),
        fetch(csvUrl(CONFIG.edgeSheet),{cache:"no-store"})
      ]);
      if(!nodesRes.ok)throw new Error("Node register unavailable");
      state.nodes=parseCSV(await nodesRes.text()).map(mapNode).filter(n=>n.workstream!=="UNASSIGNED");
      state.edges=edgesRes.ok?parseCSV(await edgesRes.text()).map(mapEdge).filter(e=>e.source&&e.target):[];
      state.live=true;
    }catch(err){
      console.warn(err);
      state.nodes=WORKSTREAMS.flatMap((w,wi)=>Array.from({length:18+(wi%7)},(_,i)=>({
        id:`${w.code}-${i+1}`,title:`${w.name} item ${i+1}`,workstream:w.code,
        owner:["GHM","Creative","Technical","Production"][i%4],
        state:["COMPLETED","ACTIVE","ACTIVE","REVIEW","LATER","BLOCKED"][(i+wi)%6],
        risk:i%10===0?"RED":i%6===0?"AMBER":"GREEN",evidence:"",raw:{}
      })));
      state.edges=[];
    }
    renderRail();
    update();
  }

  function filteredNodes(){
    const q=state.search.trim().toLowerCase();
    return state.nodes.filter(n=>!q||[n.id,n.title,n.owner,n.workstream,...Object.values(n.raw||{})].join(" ").toLowerCase().includes(q));
  }
  function summarise(nodes,code){
    const group=nodes.filter(n=>n.workstream===code);
    const done=group.filter(n=>n.state==="COMPLETED").length;
    const risk=group.filter(n=>n.risk==="RED"||n.risk==="AMBER").length;
    const blocked=group.filter(n=>n.state==="BLOCKED").length;
    return {
      group,total:group.length,done,risk,blocked,open:group.length-done,
      percent:group.length?Math.round(done/group.length*100):0
    };
  }
  function depCounts(id){
    const incoming=state.edges.filter(e=>e.target===id);
    const outgoing=state.edges.filter(e=>e.source===id);
    return {incoming,outgoing,total:incoming.length+outgoing.length};
  }
  function relatedIds(id){
    const set=new Set([id]);
    state.edges.forEach(e=>{
      if(e.source===id)set.add(e.target);
      if(e.target===id)set.add(e.source);
    });
    return set;
  }
  function workstreamDepCount(code){
    const nodeMap=new Map(state.nodes.map(n=>[n.id,n]));
    const pairs=new Set();
    state.edges.forEach(e=>{
      const a=nodeMap.get(e.source),b=nodeMap.get(e.target);
      if(!a||!b||a.workstream===b.workstream)return;
      if(a.workstream===code||b.workstream===code)pairs.add(`${a.workstream}|${b.workstream}`);
    });
    return pairs.size;
  }

  function updateCounts(nodes){
    const count=fn=>nodes.filter(fn).length;
    $("#countAll").textContent=nodes.length;
    $("#countActive").textContent=count(n=>n.state==="ACTIVE");
    $("#countRisk").textContent=count(n=>n.risk==="RED"||n.risk==="AMBER");
    $("#countBlocked").textContent=count(n=>n.state==="BLOCKED");
    $("#countReview").textContent=count(n=>n.state==="REVIEW");
    $("#countCompleted").textContent=count(n=>n.state==="COMPLETED");
  }

  function renderRail(){
    el.rail.innerHTML=WORKSTREAMS.map(w=>`
      <button class="rail-ws" data-rail="${w.code}" title="${escapeHtml(w.name)}">
        <img src="assets/workstream-icons/${w.icon}-responsive.png" alt="">
        <span>${w.number}</span>
      </button>`).join("");
    $$("[data-rail]").forEach(b=>b.addEventListener("click",()=>focusWorkstream(b.dataset.rail)));
  }

  function update(){
    const nodes=filteredNodes();
    updateCounts(nodes);
    if(state.view==="waffle")renderWaffle(nodes);
    else if(state.view==="structured")renderStructured(nodes);
    else renderTiles(nodes);
    updateRailState();
  }

  function renderWaffle(nodes){
    const related=state.selectedNode?relatedIds(state.selectedNode):null;
    el.viewContainer.innerHTML=`<div class="waffle-overview">${WORKSTREAMS.map(w=>{
      const s=summarise(nodes,w.code);
      const panelDim=state.focusedWorkstream&&state.focusedWorkstream!==w.code;
      const panelFocus=state.focusedWorkstream===w.code;
      return `<section class="waffle-panel ${panelFocus?"focused":""} ${panelDim?"dimmed":""}" id="panel-${w.code}" data-panel="${w.code}">
        <header class="waffle-panel-head">
          <img class="waffle-panel-icon" src="assets/workstream-icons/${w.icon}-responsive.png" alt="">
          <div class="waffle-panel-title">
            <span>${w.code}</span><h2>${escapeHtml(w.name)}</h2>
            <small>${s.total} items · ${s.blocked} blocked · ${s.risk} at risk</small>
          </div>
          <div><div class="panel-percent">${s.percent}%</div><div class="panel-deps">${workstreamDepCount(w.code)} linked areas</div></div>
        </header>
        <div class="panel-progress"><span style="width:${s.percent}%"></span></div>
        <div class="waffle-cells">${s.group.map(n=>{
          const deps=depCounts(n.id);
          const selected=state.selectedNode===n.id;
          const rel=related&&related.has(n.id)&&!selected;
          const unrelated=related&&!related.has(n.id);
          return `<button class="node-square ${n.state} risk-${n.risk} ${selected?"selected":""} ${rel?"related":""} ${unrelated?"unrelated":""}"
            data-node="${escapeHtml(n.id)}" data-workstream="${n.workstream}"
            aria-label="${escapeHtml(n.title)}"></button>`;
        }).join("")}</div>
        <footer class="panel-footer">
          <span>${s.done} complete · ${s.open} open</span>
          <button data-focus="${w.code}">${panelFocus?"Show all":"Focus area"}</button>
        </footer>
      </section>`;
    }).join("")}</div>`;

    $$("[data-focus]").forEach(b=>b.addEventListener("click",e=>{
      e.stopPropagation();
      focusWorkstream(state.focusedWorkstream===b.dataset.focus?null:b.dataset.focus);
    }));
    $$("[data-panel]").forEach(panel=>panel.addEventListener("dblclick",()=>focusWorkstream(panel.dataset.panel)));
    $$("[data-node]").forEach(square=>{
      square.addEventListener("click",e=>{
        e.stopPropagation();
        state.selectedNode=state.selectedNode===square.dataset.node?null:square.dataset.node;
        renderWaffle(nodes);
      });
      bindTooltip(square,()=>nodeTooltip(square.dataset.node));
    });

    if(state.focusedWorkstream){
      requestAnimationFrame(()=>document.getElementById(`panel-${state.focusedWorkstream}`)?.scrollIntoView({behavior:"smooth",block:"start"}));
    }
  }

  function renderStructured(nodes){
    const states=[["COMPLETED","Completed"],["ACTIVE","Active"],["REVIEW","Review"],["BLOCKED","Blocked"],["LATER","Later / to do"]];
    el.viewContainer.innerHTML=`<div class="structured-view">${states.map(([key,label])=>{
      const group=nodes.filter(n=>n.state===key);
      return `<section class="structure-column"><h3>${label}<span>${group.length}</span></h3>
        ${group.map(n=>{const w=WORKSTREAMS.find(x=>x.code===n.workstream),d=depCounts(n.id);return`
          <button class="structure-item" data-node="${escapeHtml(n.id)}">
            <img class="structure-icon" src="assets/workstream-icons/${w.icon}-responsive.png" alt="">
            <strong>${escapeHtml(n.title)}</strong>
            <small>${n.workstream} · ${escapeHtml(n.owner)}</small>
            <span class="structure-badges"><span>${n.risk} risk</span><span>${d.total} deps</span></span>
          </button>`}).join("")}
      </section>`;
    }).join("")}</div>`;
    $$("[data-node]").forEach(item=>bindTooltip(item,()=>nodeTooltip(item.dataset.node)));
  }

  function renderTiles(nodes){
    el.viewContainer.innerHTML=`<div class="square-grid">${WORKSTREAMS.map(w=>{
      const s=summarise(nodes,w.code);
      return `<button class="square-tile ${dominantState(s.group).toLowerCase()}" data-focus="${w.code}">
        <img class="tile-icon" src="assets/workstream-icons/${w.icon}-responsive.png" alt="">
        <span>${w.code}</span><h3>${escapeHtml(w.name)}</h3>
        <div class="tile-percent">${s.percent}%</div>
        <small>${s.done} complete · ${s.open} open · ${s.risk} at risk</small>
        <div class="chart-tooltip-card">${workstreamDepCount(w.code)} linked workstreams · ${s.blocked} blocked</div>
      </button>`;
    }).join("")}</div>`;
    $$("[data-focus]").forEach(b=>b.addEventListener("click",()=>{state.view="waffle";focusWorkstream(b.dataset.focus);syncTabs()}));
  }

  function dominantState(group){
    const states=["BLOCKED","ACTIVE","REVIEW","LATER","COMPLETED"];
    return states.sort((a,b)=>group.filter(n=>n.state===b).length-group.filter(n=>n.state===a).length)[0]||"LATER";
  }

  function focusWorkstream(code){
    state.focusedWorkstream=code;
    state.selectedNode=null;
    update();
  }
  function updateRailState(){
    $("#railHome").classList.toggle("active",!state.focusedWorkstream);
    $$("[data-rail]").forEach(b=>b.classList.toggle("active",b.dataset.rail===state.focusedWorkstream));
  }

  function nodeTooltip(id){
    const n=state.nodes.find(x=>x.id===id);
    if(!n)return "";
    const d=depCounts(id);
    const incoming=d.incoming.slice(0,3).map(e=>state.nodes.find(x=>x.id===e.source)?.title).filter(Boolean);
    const outgoing=d.outgoing.slice(0,3).map(e=>state.nodes.find(x=>x.id===e.target)?.title).filter(Boolean);
    return `<strong>${escapeHtml(n.title)}</strong>
      ${escapeHtml(n.owner)} · ${n.workstream}
      <div class="tip-badges"><span>${n.state}</span><span>${n.risk} risk</span><span>${d.total} dependencies</span></div>
      <div class="tip-deps">${incoming.length?`Depends on: ${incoming.map(escapeHtml).join(", ")}<br>`:""}${outgoing.length?`Enables: ${outgoing.map(escapeHtml).join(", ")}`:""}</div>`;
  }
  function bindTooltip(target,getHtml){
    target.addEventListener("pointerenter",e=>{el.tooltip.innerHTML=getHtml();el.tooltip.hidden=false;moveTooltip(e)});
    target.addEventListener("pointermove",moveTooltip);
    target.addEventListener("pointerleave",()=>el.tooltip.hidden=true);
  }
  function moveTooltip(e){
    el.tooltip.style.left=`${Math.min(innerWidth-330,e.clientX+15)}px`;
    el.tooltip.style.top=`${Math.min(innerHeight-190,e.clientY+15)}px`;
  }
  function syncTabs(){
    $$(".view-tab").forEach(b=>b.classList.toggle("active",b.dataset.view===state.view));
  }
  function escapeHtml(v){
    return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
  }

  $$(".view-tab").forEach(b=>b.addEventListener("click",()=>{
    state.view=b.dataset.view;
    state.selectedNode=null;
    syncTabs();
    update();
  }));
  $("#railHome").addEventListener("click",()=>focusWorkstream(null));
  el.search.addEventListener("input",e=>{state.search=e.target.value;update()});
  $("#resetButton").addEventListener("click",()=>{
    state.search="";state.focusedWorkstream=null;state.selectedNode=null;el.search.value="";update();
  });

  loadData();
})();