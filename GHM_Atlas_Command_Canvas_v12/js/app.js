(() => {
  "use strict";

  const CONFIG = {
    spreadsheetId: "1TszfahbSPhV0c_1LK0Y_ub_0mlEiDiwzJdC93vX7JtM",
    nodeSheet: "Atlas_Command_Map_Nodes",
    edgeSheet: "Atlas_Command_Map_Edges"
  };

  const WORKSTREAMS = [
    { code:"WS001", number:1, name:"White Paper", icon:"▤" },
    { code:"WS002", number:2, name:"Website", icon:"⌂" },
    { code:"WS003", number:3, name:"Pipeline / Technical", icon:"⚙" },
    { code:"WS004", number:4, name:"Video Production", icon:"◉" },
    { code:"WS005", number:5, name:"Metadata / Manifest", icon:"▥" },
    { code:"WS006", number:6, name:"Launch / Market Readiness", icon:"⚕" },
    { code:"WS007", number:7, name:"Atlas / Story / Portal", icon:"◎" },
    { code:"WS008", number:8, name:"Artwork / Collections", icon:"✦" },
    { code:"WS009", number:9, name:"QA / Review / Decisions", icon:"✓" },
    { code:"WS010", number:10, name:"Sources / Library", icon:"▥" },
    { code:"WS011", number:11, name:"Prints / Fulfilment", icon:"▧" }
  ];

  const FALLBACK = WORKSTREAMS.flatMap((w, wi) => {
    const statuses = ["COMPLETED","COMPLETED","ACTIVE","ACTIVE","REVIEW","LATER"];
    return Array.from({length: 12 + (wi % 5)}, (_, i) => ({
      id:`${w.code}-${String(i+1).padStart(3,"0")}`,
      title:`${w.name} item ${i+1}`,
      workstream:w.code,
      owner:["GHM","Creative","Technical","Production"][i%4],
      state:statuses[(i+wi)%statuses.length],
      risk:(i%9===0?"RED":i%5===0?"AMBER":"GREEN"),
      evidence:"",
      raw:{}
    }));
  });

  const state = {
    nodes: [],
    view: "birdseye",
    status: "ALL",
    workstream: "ALL",
    owner: "ALL",
    risk: "ALL",
    search: "",
    selectedWorkstream: null,
    detailSort: "priority",
    live: false
  };

  const $ = (s) => document.querySelector(s);
  const $$ = (s) => Array.from(document.querySelectorAll(s));
  const el = {
    viewContainer: $("#viewContainer"), totalItems: $("#totalItems"),
    resultsSummary: $("#resultsSummary"), search: $("#searchInput"),
    workstream: $("#workstreamFilter"), owner: $("#ownerFilter"), risk: $("#riskFilter"),
    syncDot: $("#syncDot"), syncLabel: $("#syncLabel"), syncTime: $("#syncTime"),
    rightPanel: $("#rightPanel"), scrim: $("#mobileScrim"),
    attentionList: $("#attentionList"), detailSort: $("#detailSort")
  };

  function csvUrl(sheet) {
    return `https://docs.google.com/spreadsheets/d/${CONFIG.spreadsheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheet)}`;
  }

  function parseCSV(text) {
    const rows=[]; let row=[], field="", quote=false;
    for(let i=0;i<text.length;i++){
      const c=text[i], n=text[i+1];
      if(c === '"' && quote && n === '"'){ field+='"'; i++; }
      else if(c === '"'){ quote=!quote; }
      else if(c === "," && !quote){ row.push(field); field=""; }
      else if((c === "\n" || c === "\r") && !quote){
        if(c === "\r" && n === "\n") i++;
        row.push(field); field="";
        if(row.some(v => v !== "")) rows.push(row);
        row=[];
      } else field+=c;
    }
    if(field || row.length){ row.push(field); rows.push(row); }
    if(!rows.length) return [];
    const headers=rows.shift().map(h => h.trim());
    return rows.map(r => Object.fromEntries(headers.map((h,i)=>[h,(r[i]??"").trim()])));
  }

  function pick(obj, keys) {
    const source = Object.keys(obj);
    for(const key of keys){
      const found=source.find(k => k.toLowerCase().replace(/[^a-z0-9]/g,"") === key.toLowerCase().replace(/[^a-z0-9]/g,""));
      if(found && obj[found] !== "") return obj[found];
    }
    return "";
  }

  function normalizeWorkstream(raw) {
    const value=String(raw||"").toUpperCase();
    const direct=value.match(/WS\s*0*([1-9]|1[01])/);
    if(direct) return `WS${String(Number(direct[1])).padStart(3,"0")}`;
    const found=WORKSTREAMS.find(w => value.includes(w.name.toUpperCase().split(" / ")[0]));
    return found ? found.code : "UNASSIGNED";
  }

  function normalizeState(raw) {
    const v=String(raw||"").trim().toUpperCase().replace(/[\s-]+/g,"_");
    if(/DONE|COMPLETE|CLOSED|APPROVED/.test(v)) return "COMPLETED";
    if(/BLOCK|GATED|HOLD|DEPEND/.test(v)) return "BLOCKED";
    if(/REVIEW|QA|VERIFY|DECISION/.test(v)) return "REVIEW";
    if(/ACTIVE|NOW|DOING|PROGRESS|OPEN/.test(v)) return "ACTIVE";
    return "LATER";
  }

  function normalizeRisk(raw) {
    const v=String(raw||"").toUpperCase();
    if(/RED|HIGH|CRITICAL/.test(v)) return "RED";
    if(/AMBER|YELLOW|MEDIUM/.test(v)) return "AMBER";
    if(/GREEN|LOW|OK/.test(v)) return "GREEN";
    return "NONE";
  }

  function mapNode(row, index) {
    return {
      id: pick(row,["Node_ID","ID","Item_ID"]) || `ROW-${index+1}`,
      title: pick(row,["Node_Name","Node_Title","Title","Item","Task","Name"]) || `Untitled item ${index+1}`,
      workstream: normalizeWorkstream(pick(row,["Workstream_ID","Workstream","WS","Area","Territory","Parent_Workstream"])),
      owner: pick(row,["Owner","Lead","Responsible","Accountable"]) || "Unassigned",
      state: normalizeState(pick(row,["State_Bucket","Status","State","Workflow_State"])),
      risk: normalizeRisk(pick(row,["RAG_Risk","Risk","RAG","Risk_Status"])),
      evidence: pick(row,["Evidence","Proof","Link","URL"]),
      raw: row
    };
  }

  async function loadData() {
    setSync("loading");
    try {
      const response = await fetch(csvUrl(CONFIG.nodeSheet), { cache:"no-store" });
      if(!response.ok) throw new Error(`Sheet returned ${response.status}`);
      const rows=parseCSV(await response.text());
      const mapped=rows.map(mapNode).filter(n => n.title && n.workstream !== "UNASSIGNED");
      if(!mapped.length) throw new Error("No recognised workstream records");
      state.nodes=mapped; state.live=true;
      setSync("live");
    } catch(error) {
      console.warn("Live register unavailable; using demonstration data.", error);
      state.nodes=FALLBACK; state.live=false;
      setSync("error");
    }
    populateFilters();
    update();
  }

  function setSync(mode) {
    el.syncDot.className="sync-dot"+(mode==="live"?" live":mode==="error"?" error":"");
    if(mode==="live"){
      el.syncLabel.textContent="Live register connected";
      el.syncTime.textContent=`Updated ${new Date().toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"})}`;
    } else if(mode==="error"){
      el.syncLabel.textContent="Preview data shown";
      el.syncTime.textContent="Live sheet could not be reached";
    } else {
      el.syncLabel.textContent="Connecting to live register…";
      el.syncTime.textContent="Google Sheets";
    }
  }

  function populateFilters(){
    el.workstream.innerHTML='<option value="ALL">All 11 workstreams</option>'+WORKSTREAMS.map(w=>`<option value="${w.code}">${w.code} — ${w.name}</option>`).join("");
    const owners=[...new Set(state.nodes.map(n=>n.owner).filter(Boolean))].sort();
    el.owner.innerHTML='<option value="ALL">All owners</option>'+owners.map(o=>`<option>${escapeHtml(o)}</option>`).join("");
  }

  function filteredNodes() {
    const q=state.search.toLowerCase();
    return state.nodes.filter(n => {
      const atRisk=n.risk==="RED" || n.risk==="AMBER";
      const statusOK = state.status==="ALL" ||
        (state.status==="AT_RISK" ? atRisk :
        state.status==="BLOCKED" ? n.state==="BLOCKED" :
        state.status==="REVIEW" ? n.state==="REVIEW" :
        state.status==="COMPLETED" ? n.state==="COMPLETED" :
        state.status==="ACTIVE" ? n.state==="ACTIVE" : true);
      const hay=[n.id,n.title,n.owner,n.workstream,n.evidence,...Object.values(n.raw||{})].join(" ").toLowerCase();
      return statusOK &&
        (state.workstream==="ALL" || n.workstream===state.workstream) &&
        (state.owner==="ALL" || n.owner===state.owner) &&
        (state.risk==="ALL" || n.risk===state.risk) &&
        (!q || hay.includes(q));
    });
  }

  function summarise(nodes, workstream) {
    const group=nodes.filter(n=>n.workstream===workstream);
    const done=group.filter(n=>n.state==="COMPLETED").length;
    const risk=group.filter(n=>n.risk==="RED"||n.risk==="AMBER").length;
    const blocked=group.filter(n=>n.state==="BLOCKED").length;
    const percent=group.length?Math.round(done/group.length*100):0;
    const topRisk=group.some(n=>n.risk==="RED")?"RED":group.some(n=>n.risk==="AMBER")?"AMBER":group.length?"GREEN":"NONE";
    const dominant=["BLOCKED","ACTIVE","REVIEW","LATER","COMPLETED"].sort((a,b)=>group.filter(n=>n.state===b).length-group.filter(n=>n.state===a).length)[0]||"LATER";
    return {group,total:group.length,done,risk,blocked,open:group.length-done,percent,topRisk,dominant};
  }

  function updateCounts(nodes=state.nodes) {
    const count=(fn)=>nodes.filter(fn).length;
    $("#countAll").textContent=nodes.length;
    $("#countActive").textContent=count(n=>n.state==="ACTIVE");
    $("#countRisk").textContent=count(n=>n.risk==="RED"||n.risk==="AMBER");
    $("#countBlocked").textContent=count(n=>n.state==="BLOCKED");
    $("#countReview").textContent=count(n=>n.state==="REVIEW");
    $("#countCompleted").textContent=count(n=>n.state==="COMPLETED");
    el.totalItems.textContent=`${nodes.length} visible items`;
  }

  function priorityScore(n) {
    let score = 0;
    if(n.risk === "RED") score += 100;
    else if(n.risk === "AMBER") score += 45;
    if(n.state === "BLOCKED") score += 80;
    else if(n.state === "REVIEW") score += 28;
    else if(n.state === "ACTIVE") score += 18;
    if(n.owner === "Unassigned") score += 12;
    return score;
  }

  function healthScore(summary) {
    if(!summary.total) return 0;
    const riskPenalty = summary.risk * 7;
    const blockedPenalty = summary.blocked * 12;
    return Math.max(0, Math.min(100, Math.round(summary.percent - riskPenalty - blockedPenalty + 20)));
  }

  function validUrl(value) {
    try {
      const url = new URL(value);
      return /^https?:$/.test(url.protocol) ? url.href : "";
    } catch (_) { return ""; }
  }

  function renderAttention(nodes) {
    const urgent = nodes
      .filter(n => n.risk === "RED" || n.risk === "AMBER" || n.state === "BLOCKED" || n.state === "REVIEW")
      .sort((a,b) => priorityScore(b) - priorityScore(a))
      .slice(0,8);

    if(!urgent.length) {
      el.attentionList.innerHTML = '<div class="empty-state">No matching items currently need attention.</div>';
      return;
    }
    el.attentionList.innerHTML = urgent.map(n => `
      <button class="attention-card ${priorityScore(n) >= 100 ? "critical" : ""}" data-workstream="${n.workstream}">
        <span>${escapeHtml(n.workstream)}</span>
        <strong>${escapeHtml(n.title)}</strong>
        <small>${escapeHtml(n.owner)} · ${n.state.replace("_"," ")}</small>
        <span class="attention-badges">
          ${n.risk !== "NONE" ? `<span class="mini-badge ${n.risk.toLowerCase()}">${n.risk} risk</span>` : ""}
          ${n.state === "BLOCKED" ? '<span class="mini-badge red">Blocked</span>' : ""}
          ${n.state === "REVIEW" ? '<span class="mini-badge blue">Review</span>' : ""}
        </span>
      </button>`).join("");
    bindWorkstreamButtons();
  }

  function update(){
    const nodes=filteredNodes();
    updateCounts(nodes);
    renderAttention(nodes);
    const contexts = [
      state.workstream !== "ALL" ? state.workstream : "",
      state.owner !== "ALL" ? state.owner : "",
      state.risk !== "ALL" ? `${state.risk} risk` : "",
      state.status !== "ALL" ? state.status.replace("_"," ") : ""
    ].filter(Boolean);
    el.resultsSummary.innerHTML=`<span>Showing ${nodes.length} of ${state.nodes.length} items</span>${contexts.length ? `<span class="filter-context">${contexts.map(x=>`<span class="filter-pill">${escapeHtml(x)}</span>`).join("")}</span>` : ""}`;
    if(state.view==="birdseye") renderBirdseye(nodes);
    else if(state.view==="structured") renderStructured(nodes);
    else if(state.view==="tiles") renderTiles(nodes);
    else renderWaffle(nodes);
  }

  function renderBirdseye(nodes){
    const ordered=[...WORKSTREAMS].sort((a,b)=>{
      const sa=summarise(nodes,a.code), sb=summarise(nodes,b.code);
      return (sb.blocked*100 + sb.risk*25 + sb.open) - (sa.blocked*100 + sa.risk*25 + sa.open);
    });
    const cards=ordered.map(w=>{
      const s=summarise(nodes,w.code);
      const urgent = s.blocked > 0 || s.topRisk === "RED";
      const score = healthScore(s);
      return `<button class="workstream-card ${state.selectedWorkstream===w.code?"selected":""}" data-workstream="${w.code}">
        ${urgent ? `<span class="card-priority">${s.blocked ? `${s.blocked} blocked` : "red risk"}</span>` : ""}
        <span class="risk-ring ${s.topRisk.toLowerCase()}"></span>
        <span class="card-number">${w.number}</span>
        <span class="card-code">${w.code}</span>
        <h3>${escapeHtml(w.name)}</h3>
        <div class="card-metrics">
          <div><strong>${s.total}</strong><span>items</span></div>
          <div><strong>${s.open}</strong><span>open</span></div>
          <div><strong>${s.risk}</strong><span>at risk</span></div>
        </div>
        <div class="progress-track"><span style="width:${s.percent}%"></span></div>
        <div class="card-status-line"><strong>${s.percent}%</strong><span>complete</span></div>
        <span class="health-score" title="Composite workstream health score">${score}</span>
      </button>`;
    }).join("");
    el.viewContainer.innerHTML=`<div class="birdseye-grid">${cards}</div>`;
    bindWorkstreamButtons();
  }

  function renderStructured(nodes){
    const columns=[
      ["COMPLETED","Completed"],["ACTIVE","Active"],["REVIEW","Review"],["BLOCKED","Blocked"],["LATER","Later / to do"]
    ];
    el.viewContainer.innerHTML=`<div class="structured-view">${columns.map(([key,label])=>{
      const group=nodes.filter(n=>n.state===key);
      return `<section class="structure-column"><h3>${label}<span>${group.length}</span></h3>
        ${group.slice(0,80).map(n=>`<button class="structure-item" data-workstream="${n.workstream}">
          <strong>${escapeHtml(n.title)}</strong><small>${n.workstream} · ${escapeHtml(n.owner)}</small>
        </button>`).join("") || '<div class="empty-state">No items</div>'}
      </section>`;
    }).join("")}</div>`;
    bindWorkstreamButtons();
  }

  function renderTiles(nodes){
    el.viewContainer.innerHTML=`<div class="square-grid">${WORKSTREAMS.map(w=>{
      const s=summarise(nodes,w.code);
      return `<button class="square-tile ${s.dominant.toLowerCase()}" data-workstream="${w.code}">
        <span class="risk-corner ${s.topRisk}"></span>
        <span>${w.code}</span><h3>${escapeHtml(w.name)}</h3>
        <div class="tile-percent">${s.percent}%</div>
        <small>${s.done} complete · ${s.open} open · ${s.risk} at risk</small>
      </button>`;
    }).join("")}</div>`;
    bindWorkstreamButtons();
  }

  function renderWaffle(nodes){
    const capped=nodes.slice(0,500);
    const cells=capped.map(n=>`<button class="waffle-cell ${n.state.toLowerCase()} ${state.selectedWorkstream===n.workstream?"selected":""}" data-workstream="${n.workstream}" title="${escapeHtml(n.workstream)} · ${escapeHtml(n.title)} · ${n.state} · ${n.risk} risk · ${escapeHtml(n.owner)}"></button>`).join("");
    const key=WORKSTREAMS.map(w=>{
      const s=summarise(nodes,w.code);
      return `<button data-workstream="${w.code}"><span>${w.code} ${escapeHtml(w.name)}</span><strong>${s.percent}%</strong></button>`;
    }).join("");
    el.viewContainer.innerHTML=`<div class="waffle-layout"><div class="waffle-grid">${cells || '<div class="empty-state">No items match the filters</div>'}</div><aside class="waffle-key"><h3>Workstream completion</h3>${key}</aside></div>`;
    bindWorkstreamButtons();
  }

  function bindWorkstreamButtons(){
    $$("[data-workstream]").forEach(button=>button.addEventListener("click",()=>showDetails(button.dataset.workstream)));
  }

  function showDetails(code){
    state.selectedWorkstream=code;
    const w=WORKSTREAMS.find(x=>x.code===code); if(!w) return;
    const s=summarise(filteredNodes(),code);
    $("#detailTitle").textContent=`${code} — ${w.name}`;
    $("#detailDescription").textContent=`Live workstream summary using workflow state as fill colour and RAG risk as a separate warning signal.`;
    $("#detailTotal").textContent=s.total;
    $("#detailDone").textContent=s.done;
    $("#detailOpen").textContent=s.open;
    $("#detailRisk").textContent=s.risk;
    $("#detailPercent").textContent=`${s.percent}%`;
    $("#detailProgress").style.width=`${s.percent}%`;
    const sorted=[...s.group].sort((a,b)=>{
      if(state.detailSort==="owner") return a.owner.localeCompare(b.owner);
      if(state.detailSort==="title") return a.title.localeCompare(b.title);
      if(state.detailSort==="state") return a.state.localeCompare(b.state);
      return priorityScore(b)-priorityScore(a);
    });
    $("#detailList").innerHTML=sorted.slice(0,50).map(n=>{
      const evidence=validUrl(n.evidence);
      return `<div class="detail-item ${n.state.toLowerCase()}">
        <strong>${escapeHtml(n.title)}</strong>
        <small>${n.state} · ${escapeHtml(n.owner)}</small>
        <span class="detail-risk ${n.risk}">${n.risk==="NONE"?"—":n.risk[0]}</span>
        ${evidence ? `<a class="evidence-link" href="${escapeHtml(evidence)}" target="_blank" rel="noopener">Open evidence ↗</a>` : ""}
      </div>`;
    }).join("") || '<div class="empty-state">No matching items</div>';
    if(window.innerWidth<=1280){ el.rightPanel.classList.add("open"); el.scrim.classList.add("show"); }
    update();
  }

  function closePanels(){
    el.rightPanel.classList.remove("open"); $("#leftRail").classList.remove("open");
    el.scrim.classList.remove("show"); $("#menuButton").setAttribute("aria-expanded","false");
  }

  function escapeHtml(v){ return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c])); }

  $$(".view-tab,.rail-item[data-view]").forEach(b=>b.addEventListener("click",()=>{
    state.view=b.dataset.view;
    $$(".view-tab,.rail-item[data-view]").forEach(x=>x.classList.toggle("active",x.dataset.view===state.view));
    update(); closePanels();
  }));
  $$(".status-stat").forEach(b=>b.addEventListener("click",()=>{
    state.status=b.dataset.status;
    $$(".status-stat").forEach(x=>x.classList.toggle("active",x===b));
    update();
  }));
  el.search.addEventListener("input",e=>{state.search=e.target.value;update()});
  el.workstream.addEventListener("change",e=>{state.workstream=e.target.value;update()});
  el.owner.addEventListener("change",e=>{state.owner=e.target.value;update()});
  el.risk.addEventListener("change",e=>{state.risk=e.target.value;update()});
  $("#resetButton").addEventListener("click",()=>{
    Object.assign(state,{status:"ALL",workstream:"ALL",owner:"ALL",risk:"ALL",search:""});
    el.search.value="";el.workstream.value="ALL";el.owner.value="ALL";el.risk.value="ALL";
    $$(".status-stat").forEach((x,i)=>x.classList.toggle("active",i===0));update();
  });
  $("#attentionToggle").addEventListener("click",()=>{
    const list=$("#attentionList");
    const hidden=list.hidden=!list.hidden;
    $("#attentionToggle").textContent=hidden?"Expand":"Collapse";
    $("#attentionToggle").setAttribute("aria-expanded",String(!hidden));
  });
  el.detailSort.addEventListener("change",e=>{
    state.detailSort=e.target.value;
    if(state.selectedWorkstream) showDetails(state.selectedWorkstream);
  });
  $("#refreshButton").addEventListener("click",loadData);
  $("#panelClose").addEventListener("click",closePanels);
  el.scrim.addEventListener("click",closePanels);
  $("#menuButton").addEventListener("click",()=>{
    const rail=$("#leftRail"); const open=!rail.classList.contains("open");
    rail.classList.toggle("open",open); el.scrim.classList.toggle("show",open);
    $("#menuButton").setAttribute("aria-expanded",String(open));
  });

  loadData();
})();