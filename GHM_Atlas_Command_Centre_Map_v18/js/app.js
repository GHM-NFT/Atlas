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
    edges: [],
    view: "birdseye",
    status: "ALL",
    workstream: "ALL",
    owner: "ALL",
    risk: "ALL",
    search: "",
    selectedWorkstream: null,
    detailSort: "priority",
    visualLayout: "birdseye",
    visualDensity: "balanced",
    visualLabels: false,
    visualEdges: false,
    visualIcons: true,
    visualFocus: null,
    visualWorkstreamFocus: null,
    visualAnchorLast: null,
    visualAnchorLastAt: 0,
    visualScale: 1,
    visualX: 0,
    visualY: 0,
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
    attentionList: $("#attentionList"), detailSort: $("#detailSort"),
    detailIcon: $("#detailIcon"), priorityStack: $("#priorityStack"),
    ownerBreakdown: $("#ownerBreakdown"), evidenceList: $("#evidenceList"),
    visualControls: $("#visualMapControls"), visualLayout: $("#visualLayout"), visualDensity: $("#visualDensity"),
    visualTooltip: $("#visualMapTooltip")
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
      const [nodeResponse, edgeResponse] = await Promise.all([
        fetch(csvUrl(CONFIG.nodeSheet), { cache:"no-store" }),
        fetch(csvUrl(CONFIG.edgeSheet), { cache:"no-store" })
      ]);
      if(!nodeResponse.ok) throw new Error(`Node sheet returned ${nodeResponse.status}`);
      const rows=parseCSV(await nodeResponse.text());
      const mapped=rows.map(mapNode).filter(n => n.title && n.workstream !== "UNASSIGNED");
      if(!mapped.length) throw new Error("No recognised workstream records");
      let edges=[];
      if(edgeResponse.ok){
        edges=parseCSV(await edgeResponse.text()).map((row,index)=>({
          id:pick(row,["Edge_ID","ID"]) || `EDGE-${index+1}`,
          source:pick(row,["Source_Node_ID","Source","From","From_ID","Parent","Upstream"]),
          target:pick(row,["Target_Node_ID","Target","To","To_ID","Child","Downstream"]),
          type:pick(row,["Relationship_Type","Type","Relationship","Edge_Type"]) || "DEPENDENCY",
          label:pick(row,["Label","Description","Relationship_Label"])
        })).filter(e=>e.source&&e.target);
      }
      state.nodes=mapped; state.edges=edges; state.live=true;
      setSync("live");
    } catch(error) {
      console.warn("Live register unavailable; using demonstration data.", error);
      state.nodes=FALLBACK; state.edges=[]; state.live=false;
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

  function visualNodeMap() {
    return new Map(state.nodes.map(n=>[n.id,n]));
  }

  function visualDepCounts(id) {
    const incoming=state.edges.filter(e=>e.target===id);
    const outgoing=state.edges.filter(e=>e.source===id);
    return {incoming,outgoing,total:incoming.length+outgoing.length};
  }

  function visualRelatedIds(id) {
    const set=new Set([id]);
    state.edges.forEach(e=>{
      if(e.source===id)set.add(e.target);
      if(e.target===id)set.add(e.source);
    });
    return set;
  }

  function visualDensityFactor(){
    return state.visualDensity==="compact" ? .84 : state.visualDensity==="spacious" ? 1.16 : 1;
  }

  function visualLayoutData(nodes, mode) {
    const density=visualDensityFactor(),W=1800,H=1120,cx=W/2,cy=H/2;
    const positions=new Map(), anchors=new Map(), groupTitles=[];

    if(mode==="birdseye"){
      const rx=650*density, ry=400*density;
      WORKSTREAMS.forEach((w,i)=>{
        const angle=-Math.PI/2+i*(Math.PI*2/WORKSTREAMS.length);
        const ax=cx+Math.cos(angle)*rx, ay=cy+Math.sin(angle)*ry;
        anchors.set(w.code,{x:ax,y:ay});
        const group=nodes.filter(n=>n.workstream===w.code);
        group.forEach((n,j)=>{
          const ring=Math.floor(j/16)+1, idx=j%16, count=Math.min(16,group.length-(ring-1)*16);
          const a=(idx/Math.max(count,1))*Math.PI*2+ring*.22;
          const r=(86+ring*40)*density;
          positions.set(n.id,{x:ax+Math.cos(a)*r,y:ay+Math.sin(a)*r});
        });
      });
    } else if(mode==="territory"){
      const cols=4, cellW=430, cellH=330;
      WORKSTREAMS.forEach((w,i)=>{
        const col=i%cols,row=Math.floor(i/cols);
        const ax=220+col*cellW, ay=180+row*cellH;
        anchors.set(w.code,{x:ax,y:ay});
        groupTitles.push({x:ax,y:ay-115,title:w.name,count:nodes.filter(n=>n.workstream===w.code).length});
        const group=nodes.filter(n=>n.workstream===w.code);
        group.forEach((n,j)=>{
          const cols2=10;
          positions.set(n.id,{x:ax-135+(j%cols2)*30,y:ay-70+Math.floor(j/cols2)*27});
        });
      });
    } else if(mode==="workflow"){
      const states=["COMPLETED","ACTIVE","REVIEW","BLOCKED","LATER"];
      const xs=[180,540,900,1260,1620];
      states.forEach((st,i)=>{
        const group=nodes.filter(n=>n.state===st);
        groupTitles.push({x:xs[i],y:65,title:st.replace("_"," "),count:group.length});
        group.forEach((n,j)=>{
          const cols2=11;
          positions.set(n.id,{x:xs[i]-145+(j%cols2)*29,y:120+Math.floor(j/cols2)*26});
        });
      });
      WORKSTREAMS.forEach((w,i)=>{
        const angle=-Math.PI/2+i*(Math.PI*2/WORKSTREAMS.length);
        anchors.set(w.code,{x:cx+Math.cos(angle)*180,y:cy+Math.sin(angle)*130});
      });
    } else {
      const sorted=[...nodes].sort((a,b)=>visualDepCounts(b.id).total-visualDepCounts(a.id).total);
      const maxR=470*density;
      sorted.forEach((n,i)=>{
        const angle=i*2.399963229728653;
        const r=Math.sqrt(i/Math.max(sorted.length,1))*maxR;
        positions.set(n.id,{x:cx+Math.cos(angle)*r,y:cy+Math.sin(angle)*r});
      });
      WORKSTREAMS.forEach((w,i)=>{
        const angle=-Math.PI/2+i*(Math.PI*2/WORKSTREAMS.length);
        anchors.set(w.code,{x:cx+Math.cos(angle)*610,y:cy+Math.sin(angle)*420});
      });
    }

    return {W,H,positions,anchors,groupTitles};
  }

  function visualCurve(a,b,bend=.08){
    const mx=(a.x+b.x)/2,my=(a.y+b.y)/2,dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy)||1;
    const nx=-dy/len,ny=dx/len;
    return `M ${a.x} ${a.y} Q ${mx+nx*len*bend} ${my+ny*len*bend} ${b.x} ${b.y}`;
  }

  function visualWorkstreamConnections() {
    const nodeMap=visualNodeMap(), seen=new Set(), connections=[];
    state.edges.forEach(e=>{
      const a=nodeMap.get(e.source),b=nodeMap.get(e.target);
      if(!a||!b||a.workstream===b.workstream)return;
      const forward=`${a.workstream}|${b.workstream}`;
      if(!seen.has(forward)){
        seen.add(forward);
        connections.push({source:a.workstream,target:b.workstream,type:e.type});
      }
    });
    return connections;
  }

  function visualRelatedWorkstreams(code) {
    const related=new Set([code]);
    visualWorkstreamConnections().forEach(e=>{
      if(e.source===code)related.add(e.target);
      if(e.target===code)related.add(e.source);
    });
    return related;
  }

  function handleVisualAnchorClick(code) {
    const now=Date.now();
    const second=state.visualAnchorLast===code &&
      state.visualWorkstreamFocus===code &&
      (now-state.visualAnchorLastAt)<1800;
    state.visualAnchorLast=code;
    state.visualAnchorLastAt=now;
    if(second){
      showDetails(code);
      return;
    }
    state.visualFocus=null;
    state.visualWorkstreamFocus=code;
    renderVisualMap(filteredNodes());
  }

  function renderVisualMap(nodes){
    const layout=visualLayoutData(nodes,state.visualLayout);
    const nodeMap=new Map(nodes.map(n=>[n.id,n]));
    const relatedNodes=state.visualFocus?visualRelatedIds(state.visualFocus):null;
    const relatedWorkstreams=state.visualWorkstreamFocus?visualRelatedWorkstreams(state.visualWorkstreamFocus):null;
    const workstreamConnections=visualWorkstreamConnections();

    const workstreamEdges=workstreamConnections.map(e=>{
      const a=layout.anchors.get(e.source),b=layout.anchors.get(e.target);
      if(!a||!b)return"";
      const highlight=state.visualWorkstreamFocus &&
        (e.source===state.visualWorkstreamFocus||e.target===state.visualWorkstreamFocus);
      const visible=state.visualEdges||highlight;
      const dim=state.visualWorkstreamFocus&&!highlight;
      return `<path class="vm-edge vm-workstream-edge ${visible?"visible":""} ${highlight?"highlight":""} ${dim?"dim":""}" d="${visualCurve(a,b,.12)}"></path>`;
    }).join("");

    const edges=state.edges.map(e=>{
      const a=layout.positions.get(e.source),b=layout.positions.get(e.target);
      if(!a||!b)return"";
      const source=nodeMap.get(e.source),target=nodeMap.get(e.target);
      const nodeHighlight=state.visualFocus&&(e.source===state.visualFocus||e.target===state.visualFocus);
      const wsHighlight=state.visualWorkstreamFocus &&
        (source?.workstream===state.visualWorkstreamFocus||target?.workstream===state.visualWorkstreamFocus);
      const highlight=nodeHighlight||wsHighlight;
      const dim=(state.visualFocus||state.visualWorkstreamFocus)&&!highlight;
      const blocked=source?.state==="BLOCKED"||target?.state==="BLOCKED";
      const visible=state.visualEdges||highlight;
      return `<path class="vm-edge ${visible?"visible":""} ${highlight?"highlight":""} ${dim?"dim":""} ${blocked?"blocked":""}" d="${visualCurve(a,b)}"></path>`;
    }).join("");

    const dots=nodes.map(n=>{
      const p=layout.positions.get(n.id); if(!p)return"";
      const dep=visualDepCounts(n.id);
      const selected=state.visualFocus===n.id;
      const nodeDim=relatedNodes&&!relatedNodes.has(n.id);
      const wsDim=relatedWorkstreams&&!relatedWorkstreams.has(n.workstream);
      const relatedWs=state.visualWorkstreamFocus &&
        relatedWorkstreams?.has(n.workstream) &&
        n.workstream!==state.visualWorkstreamFocus;
      const radius=Math.min(12,4.6+Math.sqrt(dep.total)*1.7);
      return `<g class="vm-node ${selected?"selected":""} ${(nodeDim||wsDim)?"dim":""} ${relatedWs?"related-workstream":""}" tabindex="0" data-vm-node="${escapeHtml(n.id)}" transform="translate(${p.x},${p.y})">
        <circle class="vm-risk ${n.risk}" r="${radius+3.2}"></circle>
        <circle class="vm-dot ${n.state}" r="${radius}"></circle>
        <text class="vm-label" x="${radius+8}" y="4">${escapeHtml(shorten(n.title,46))}</text>
        <title>${escapeHtml(n.title)} · ${n.state} · ${n.risk} risk · ${dep.total} dependencies</title>
      </g>`;
    }).join("");

    const anchors=state.visualIcons?WORKSTREAMS.map(w=>{
      const p=layout.anchors.get(w.code); if(!p)return"";
      const s=summarise(nodes,w.code);
      const selected=state.visualWorkstreamFocus===w.code;
      const related=relatedWorkstreams?.has(w.code)&&!selected;
      const dim=relatedWorkstreams&&!relatedWorkstreams.has(w.code);
      return `<g class="vm-anchor ${selected?"selected":""} ${related?"related":""} ${dim?"dim":""}" tabindex="0" data-vm-anchor="${w.code}" transform="translate(${p.x},${p.y})">
        <image class="vm-anchor-image" href="assets/workstream-icons/${w.icon}-responsive.png" x="-58" y="-58" width="116" height="116"></image>
        <text class="vm-anchor-code" y="76">${w.code}</text>
        <text class="vm-anchor-title" y="96">${escapeHtml(shorten(w.name,26))}</text>
        <text class="vm-anchor-count" y="112">${s.total} items · ${s.percent}% complete</text>
      </g>`;
    }).join(""):"";

    const titles=layout.groupTitles.map(g=>`<g><text class="vm-group-title" x="${g.x}" y="${g.y}">${escapeHtml(g.title)}</text><text class="vm-group-count" x="${g.x}" y="${g.y+17}">${g.count} items</text></g>`).join("");

    const hub=(state.visualLayout==="birdseye"||state.visualLayout==="dependency")
      ? `<g class="vm-command-hub" tabindex="0" data-vm-home transform="translate(${layout.W/2},${layout.H/2})">
          <image href="assets/brand/ghm-medallion.png" x="-55" y="-55" width="110" height="110"></image>
          <text y="78">COMMAND CENTRE</text>
        </g>` : "";

    const focusTitle=state.visualWorkstreamFocus
      ? `${state.visualWorkstreamFocus} · direct connected areas highlighted`
      : state.visualFocus
        ? `Direct dependencies highlighted`
        : `${state.visualLayout.replace("_"," ")} · ${nodes.length} visible items`;

    el.viewContainer.innerHTML=`<div class="visual-map-stage">
      <div class="visual-map-caption"><strong>Atlas Command Centre Map</strong><span>${escapeHtml(focusTitle)}</span></div>
      <svg class="visual-map-svg ${state.visualLabels?"show-labels":""} ${state.visualScale<.72?"zoomed-out":state.visualScale>1.65?"zoomed-in":""}" viewBox="0 0 ${layout.W} ${layout.H}" aria-label="Atlas visual project map">
        <g class="vm-world" transform="translate(${state.visualX} ${state.visualY}) scale(${state.visualScale})">
          ${titles}${workstreamEdges}${edges}${dots}${hub}${anchors}
        </g>
      </svg>
    </div>`;

    bindVisualMap(layout);
  }

  function bindVisualMap(layout){
    const svg=$(".visual-map-svg"),world=$(".vm-world");let drag=false,lastX=0,lastY=0;
    const apply=()=>world.setAttribute("transform",`translate(${state.visualX} ${state.visualY}) scale(${state.visualScale})`);

    svg.addEventListener("wheel",e=>{
      e.preventDefault();
      const rect=svg.getBoundingClientRect(),mx=(e.clientX-rect.left)/rect.width*layout.W,my=(e.clientY-rect.top)/rect.height*layout.H;
      const old=state.visualScale,next=Math.max(.45,Math.min(4,old*(e.deltaY<0?1.12:.89)));
      state.visualX=mx-(mx-state.visualX)*(next/old);state.visualY=my-(my-state.visualY)*(next/old);state.visualScale=next;apply();
    },{passive:false});

    svg.addEventListener("pointerdown",e=>{if(e.target.closest(".vm-node,.vm-anchor"))return;drag=true;lastX=e.clientX;lastY=e.clientY;svg.setPointerCapture(e.pointerId);svg.classList.add("dragging")});
    svg.addEventListener("pointermove",e=>{if(!drag)return;const rect=svg.getBoundingClientRect();state.visualX+=(e.clientX-lastX)/rect.width*layout.W;state.visualY+=(e.clientY-lastY)/rect.height*layout.H;lastX=e.clientX;lastY=e.clientY;apply()});
    svg.addEventListener("pointerup",()=>{drag=false;svg.classList.remove("dragging")});

    $$("[data-vm-node]").forEach(g=>{
      g.addEventListener("click",()=>{
        state.visualWorkstreamFocus=null;
        state.visualFocus=state.visualFocus===g.dataset.vmNode?null:g.dataset.vmNode;
        renderVisualMap(filteredNodes());
      });
      g.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();g.click()}});
      bindVisualTooltip(g,()=>visualNodeTip(g.dataset.vmNode));
    });
    $$("[data-vm-anchor]").forEach(g=>{
      g.addEventListener("click",()=>handleVisualAnchorClick(g.dataset.vmAnchor));
      g.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();g.click()}});
      bindVisualTooltip(g,()=>visualWorkstreamTip(g.dataset.vmAnchor));
    });
    const home=$("[data-vm-home]");
    if(home){
      home.addEventListener("click",resetVisualMap);
      home.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();resetVisualMap()}});
      bindVisualTooltip(home,()=>'<strong>GHM Command Centre</strong>Return to the full Atlas overview.');
    }
  }

  function visualNodeTip(id){
    const n=state.nodes.find(x=>x.id===id),d=visualDepCounts(id);
    return `<strong>${escapeHtml(n.title)}</strong>${escapeHtml(n.owner)} · ${n.workstream}
      <div class="vm-tip-meta"><span>${n.state}</span><span>${n.risk} risk</span><span>${d.incoming.length} in</span><span>${d.outgoing.length} out</span></div>`;
  }

  function visualWorkstreamTip(code){
    const w=WORKSTREAMS.find(x=>x.code===code),s=summarise(filteredNodes(),code);
    const connected=visualRelatedWorkstreams(code).size-1;
    return `<strong>${code} — ${escapeHtml(w.name)}</strong>${s.done} complete · ${s.open} open · ${s.blocked} blocked
      <div class="vm-tip-meta"><span>${s.percent}% complete</span><span>${s.risk} at risk</span><span>${connected} connected areas</span></div>
      <small>Click once to focus dependencies; click again to open the command chamber.</small>`;
  }

  function bindVisualTooltip(target,getHtml){
    target.addEventListener("pointerenter",e=>{el.visualTooltip.innerHTML=getHtml();el.visualTooltip.hidden=false;moveVisualTooltip(e)});
    target.addEventListener("pointermove",moveVisualTooltip);
    target.addEventListener("pointerleave",()=>el.visualTooltip.hidden=true);
  }

  function moveVisualTooltip(e){
    el.visualTooltip.style.left=`${Math.min(innerWidth-330,e.clientX+15)}px`;
    el.visualTooltip.style.top=`${Math.min(innerHeight-190,e.clientY+15)}px`;
  }

  function resetVisualMap(){
    state.visualScale=1;state.visualX=0;state.visualY=0;
    state.visualFocus=null;state.visualWorkstreamFocus=null;
    state.visualAnchorLast=null;state.visualAnchorLastAt=0;
    if(state.view==="visualmap")renderVisualMap(filteredNodes());
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
    document.body.classList.toggle("visual-map-mode",state.view==="visualmap");
    el.visualControls.hidden=state.view!=="visualmap";
    if(state.view==="birdseye") renderBirdseye(nodes);
    else if(state.view==="visualmap") renderVisualMap(nodes);
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
        <picture>
          <source media="(max-width: 900px)" srcset="assets/workstream-icons/${w.icon}-responsive.png">
          <img class="workstream-icon" src="assets/workstream-icons/${w.icon}-desktop.png" alt="" loading="lazy">
        </picture>
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
    el.viewContainer.innerHTML=`<div class="birdseye-grid">${cards}</div>
      <div class="ethos-banner" aria-label="Atlas values">
        <img src="assets/brand/ethos.png" alt="Truth, Legacy, Creativity, Integrity and Connection">
      </div>`;
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

  function healthLabel(score) {
    if(score >= 80) return "Strong";
    if(score >= 60) return "Stable";
    if(score >= 40) return "Watch";
    return "Intervention";
  }

  function renderPriorityStack(group) {
    const items=[...group].sort((a,b)=>priorityScore(b)-priorityScore(a)).slice(0,6);
    el.priorityStack.innerHTML=items.map((n,i)=>`
      <article class="priority-item ${priorityScore(n)>=100?"critical":""}">
        <span class="priority-rank">${i+1}</span>
        <strong>${escapeHtml(n.title)}</strong>
        <small>${n.state} · ${n.risk} risk · ${escapeHtml(n.owner)}</small>
      </article>`).join("") || '<div class="empty-state">No matching priorities.</div>';
  }

  function renderOwnerBreakdown(group) {
    const counts={};
    group.forEach(n=>counts[n.owner]=(counts[n.owner]||0)+1);
    const rows=Object.entries(counts).sort((a,b)=>b[1]-a[1]);
    const max=rows[0]?.[1]||1;
    el.ownerBreakdown.innerHTML=rows.map(([owner,count])=>`
      <article class="owner-row">
        <div class="owner-row-head"><strong>${escapeHtml(owner)}</strong><span>${count} item${count===1?"":"s"}</span></div>
        <div class="owner-bar"><span style="width:${Math.round(count/max*100)}%"></span></div>
      </article>`).join("") || '<div class="empty-state">No ownership data.</div>';
  }

  function renderEvidence(group) {
    const rows=group.filter(n=>validUrl(n.evidence));
    el.evidenceList.innerHTML=rows.map(n=>`
      <article class="evidence-row">
        <strong>${escapeHtml(n.title)}</strong>
        <small>${escapeHtml(n.owner)} · ${n.state}</small>
        <a href="${escapeHtml(validUrl(n.evidence))}" target="_blank" rel="noopener">Open source evidence ↗</a>
      </article>`).join("") || '<div class="empty-state">No linked evidence is available for the current selection.</div>';
  }

  function showDetails(code){
    state.selectedWorkstream=code;
    const w=WORKSTREAMS.find(x=>x.code===code); if(!w) return;
    const s=summarise(filteredNodes(),code);
    el.detailIcon.src=`assets/workstream-icons/${w.icon}-desktop.png`;
    el.detailIcon.alt=`${w.name} workstream icon`;
    $("#detailTitle").textContent=`${code} — ${w.name}`;
    $("#detailDescription").textContent=`Live workstream summary using workflow state as fill colour and RAG risk as a separate warning signal.`;
    $("#detailTotal").textContent=s.total;
    $("#detailDone").textContent=s.done;
    $("#detailOpen").textContent=s.open;
    $("#detailRisk").textContent=s.risk;
    $("#detailBlocked").textContent=s.blocked;
    $("#detailReview").textContent=s.group.filter(n=>n.state==="REVIEW").length;
    const health=healthScore(s);
    $("#detailHealth").textContent=health;
    $("#detailHealthLabel").textContent=healthLabel(health);
    $("#detailPercent").textContent=`${s.percent}%`;
    $("#detailProgress").style.width=`${s.percent}%`;
    const sorted=[...s.group].sort((a,b)=>{
      if(state.detailSort==="owner") return a.owner.localeCompare(b.owner);
      if(state.detailSort==="title") return a.title.localeCompare(b.title);
      if(state.detailSort==="state") return a.state.localeCompare(b.state);
      return priorityScore(b)-priorityScore(a);
    });
    renderPriorityStack(s.group);
    renderOwnerBreakdown(s.group);
    renderEvidence(s.group);
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

  function shorten(v,n){ const s=String(v||""); return s.length>n?s.slice(0,n-1)+"…":s; }
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
  $$(".chamber-tab").forEach(tab=>tab.addEventListener("click",()=>{
    $$(".chamber-tab").forEach(x=>x.classList.toggle("active",x===tab));
    $$("[data-detail-section]").forEach(section=>section.classList.toggle("active",section.dataset.detailSection===tab.dataset.detailTab));
  }));
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
  el.visualLayout.addEventListener("change",e=>{state.visualLayout=e.target.value;resetVisualMap()});
  el.visualDensity.addEventListener("change",e=>{state.visualDensity=e.target.value;resetVisualMap()});
  $("#fitVisualMap").addEventListener("click",resetVisualMap);
  $("#toggleVisualLabels").addEventListener("click",e=>{
    state.visualLabels=!state.visualLabels;
    e.currentTarget.setAttribute("aria-pressed",String(state.visualLabels));
    if(state.view==="visualmap")renderVisualMap(filteredNodes());
  });
  $("#toggleVisualEdges").addEventListener("click",e=>{
    state.visualEdges=!state.visualEdges;
    e.currentTarget.setAttribute("aria-pressed",String(state.visualEdges));
    if(state.view==="visualmap")renderVisualMap(filteredNodes());
  });
  $("#toggleIconAnchors").addEventListener("click",e=>{
    state.visualIcons=!state.visualIcons;
    e.currentTarget.setAttribute("aria-pressed",String(state.visualIcons));
    if(state.view==="visualmap")renderVisualMap(filteredNodes());
  });
  $("#resetVisualFocus").addEventListener("click",()=>{
    state.visualFocus=null;state.visualWorkstreamFocus=null;
    if(state.view==="visualmap")renderVisualMap(filteredNodes());
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