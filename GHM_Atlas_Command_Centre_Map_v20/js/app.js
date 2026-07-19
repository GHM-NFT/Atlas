(() => {
  "use strict";

  const DATA = window.ATLAS_DATA;
  const state = {
    view: "overview",
    density: "comfortable",
    tableDensity: "comfortable",
    mapMode: "all",
    mapLabels: true,
    selectedWorkstream: null,
    selectedEdge: null,
    drawerTab: "overview",
    register: {
      search: "",
      workstream: "ALL",
      status: "ALL",
      risk: "ALL",
      sort: "due",
      direction: "asc",
      page: 1,
      pageSize: 14
    },
    timeline: { workstream: "ALL", status: "ALL" },
    quick: "ALL",
    tasks: [...DATA.tasks]
  };

  const STATUS = {
    COMPLETE: { label: "Complete", className: "complete", color: "#59b889" },
    ACTIVE: { label: "Active", className: "active", color: "#74a9d8" },
    REVIEW: { label: "Review", className: "review", color: "#d7a14c" },
    BLOCKED: { label: "Blocked", className: "blocked", color: "#d16b62" },
    PLANNED: { label: "Planned", className: "planned", color: "#9d8dd1" }
  };
  const EDGE = { healthy: "#59b889", watch: "#d7a14c", critical: "#d16b62" };
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const esc = (value = "") => String(value).replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));
  const initials = (name = "") => name.split(/\s+/).map(part => part.replace(/[^A-Za-z]/g,"")[0] || "").join("").slice(0,2).toUpperCase();
  const humanDate = value => new Intl.DateTimeFormat("en-GB",{day:"2-digit",month:"short",year:"numeric"}).format(new Date(`${value}T12:00:00`));
  const shortDate = value => new Intl.DateTimeFormat("en-GB",{day:"2-digit",month:"short"}).format(new Date(`${value}T12:00:00`));
  const wsByCode = code => DATA.workstreams.find(w => w.code === code);
  const taskById = id => state.tasks.find(t => t.id === id);
  const tasksFor = code => state.tasks.filter(t => t.workstream === code);
  const edgesFor = code => DATA.edges.filter(e => e.source === code || e.target === code);
  const milestoneFor = code => DATA.milestones.find(m => m.workstream === code) || null;

  function summarise(code) {
    const tasks = tasksFor(code);
    const counts = Object.fromEntries(Object.keys(STATUS).map(k => [k, tasks.filter(t => t.status === k).length]));
    const progress = Math.round(tasks.reduce((sum,t) => sum + t.progress,0) / Math.max(tasks.length,1));
    const high = tasks.filter(t => t.risk === "HIGH").length;
    const health = counts.BLOCKED > 1 || high > 2 ? "critical" : counts.BLOCKED || high ? "watch" : "healthy";
    return { total: tasks.length, counts, progress, high, health };
  }

  function overall() {
    const total = state.tasks.length;
    const complete = state.tasks.filter(t => t.status === "COMPLETE").length;
    const blocked = state.tasks.filter(t => t.status === "BLOCKED").length;
    const review = state.tasks.filter(t => t.status === "REVIEW").length;
    const active = state.tasks.filter(t => t.status === "ACTIVE").length;
    const weighted = Math.round(state.tasks.reduce((s,t) => s + t.progress,0) / total);
    const score = Math.max(0, Math.min(100, Math.round(weighted - blocked * 1.2)));
    return { total, complete, blocked, review, active, score };
  }

  function renderGlobalStats() {
    const o = overall();
    $("#healthScore").textContent = o.score;
    $("#projectScore").textContent = `${o.score}%`;
    $("#railComplete").textContent = o.complete;
    $("#railBlocked").textContent = o.blocked;
    $("#railReview").textContent = o.review;
    const sourceCount = $(".data-source small");
    if (sourceCount) sourceCount.textContent = `${o.total} records · fully populated`;
    $("#healthOrb").style.background = `radial-gradient(circle,var(--panel) 58%,transparent 59%),conic-gradient(var(--gold) 0 ${o.score}%,rgba(255,255,255,.08) ${o.score}% 100%)`;
    $("#scoreRing").style.background = `radial-gradient(circle,var(--panel) 58%,transparent 59%),conic-gradient(var(--green) 0 ${o.score}%,rgba(255,255,255,.07) ${o.score}% 100%)`;
  }

  function renderSignals() {
    const o = overall();
    const dueSoon = state.tasks.filter(t => t.due >= "2026-07-18" && t.due <= "2026-07-31" && t.status !== "COMPLETE").length;
    const highRisk = state.tasks.filter(t => t.risk === "HIGH").length;
    const evidenceReady = state.tasks.filter(t => t.evidence && t.evidence.length > 8).length;
    $("#signalList").innerHTML = [
      { icon:"!", title:"Blocked items", text:"Require named resolution", value:o.blocked },
      { icon:"↗", title:"Due by 31 July", text:"Across seven workstreams", value:dueSoon },
      { icon:"✓", title:"Evidence attached", text:"Complete prototype coverage", value:`${evidenceReady}/${o.total}` }
    ].map(s => `<div class="signal-item"><span class="signal-icon">${s.icon}</span><div><strong>${s.title}</strong><span>${s.text}</span></div><b>${s.value}</b></div>`).join("");
  }

  function workstreamCard(w) {
    const s = summarise(w.code);
    const milestone = milestoneFor(w.code);
    const healthColor = s.health === "critical" ? "var(--red)" : s.health === "watch" ? "var(--amber)" : "var(--green)";
    const healthLabel = s.health === "critical" ? "Pressure" : s.health === "watch" ? "Watch" : "Healthy";
    const visibleTasks = filteredByQuick(tasksFor(w.code));
    const hiddenByQuick = state.quick !== "ALL" && visibleTasks.length === 0;
    return `<article class="workstream-card" data-workstream="${w.code}" style="--ws-accent:${w.accent};--health:${healthColor};${hiddenByQuick ? "opacity:.32" : ""}">
      <div class="ws-card-top">
        <div class="ws-identity">
          <div class="ws-icon"><img src="assets/workstream-icons/${w.icon}-desktop.png" alt=""></div>
          <div><span class="ws-code">${w.code}</span><h3>${esc(w.name)}</h3><span class="ws-phase">${esc(w.phase)}</span></div>
        </div>
        <span class="health-chip"><i></i>${healthLabel}</span>
      </div>
      <div class="ws-progress">
        <div class="ws-progress-line"><span style="width:${s.progress}%"></span></div>
        <div class="ws-progress-copy"><span>Readiness</span><strong>${s.progress}%</strong></div>
      </div>
      <div class="ws-metrics">
        <div><strong>${s.counts.ACTIVE}</strong><span>active</span></div>
        <div><strong>${s.counts.REVIEW}</strong><span>review</span></div>
        <div><strong>${s.counts.BLOCKED}</strong><span>blocked</span></div>
        <div><strong>${edgesFor(w.code).length}</strong><span>links</span></div>
      </div>
      <div class="ws-milestone">
        <p>Next milestone<strong>${esc(milestone?.label || w.milestone)}</strong></p>
        <time>${shortDate(milestone?.date || w.milestoneDate)}</time>
      </div>
      <div class="ws-card-footer">
        <span class="owner-chip"><b>${initials(w.lead)}</b>${esc(w.lead)}</span>
        <button class="open-workstream" data-open-workstream="${w.code}">Open command chamber →</button>
      </div>
    </article>`;
  }

  function filteredByQuick(tasks) {
    if (state.quick === "ATTENTION") return tasks.filter(t => t.status === "BLOCKED" || t.risk === "HIGH" || t.status === "REVIEW");
    if (state.quick === "THIS_WEEK") return tasks.filter(t => t.due >= "2026-07-18" && t.due <= "2026-07-25" && t.status !== "COMPLETE");
    if (state.quick === "MINE") return tasks.filter(t => t.owner === "GHM" || t.owner.startsWith("G."));
    return tasks;
  }

  function renderWorkstreams() {
    const grid = $("#workstreamGrid");
    grid.className = `workstream-grid ${state.density === "compact" ? "compact" : ""}`;
    grid.innerHTML = DATA.workstreams.map(workstreamCard).join("");
  }

  function renderDecisions() {
    $("#decisionList").innerHTML = DATA.decisions.map(d => `<button class="decision-item" data-decision="${d.id}">
      <span class="decision-id">${d.id}</span>
      <span><strong>${esc(d.title)}</strong><small>${esc(d.impact)} · Owner ${esc(d.owner)}</small></span>
      <span class="decision-due"><b>${shortDate(d.due)}</b><span>${esc(d.status)}</span></span>
    </button>`).join("");
  }

  function renderActivity() {
    $("#activityList").innerHTML = DATA.activity.map(a => `<div class="activity-item">
      <span class="activity-avatar">${initials(a.person)}</span>
      <p><strong>${esc(a.person)}</strong> ${esc(a.action)} <strong>${esc(a.object)}</strong> · ${esc(a.to)}</p>
      <time>${esc(a.time)}</time>
    </div>`).join("");
  }

  function switchView(view) {
    state.view = view;
    $$(".view").forEach(panel => panel.classList.toggle("active", panel.dataset.viewPanel === view));
    $$(".nav-button").forEach(button => button.classList.toggle("active", button.dataset.view === view));
    $(".primary-nav").classList.remove("open");
    $("#sideRail").classList.remove("open");
    if (view === "map") renderMap();
    if (view === "timeline") renderTimeline();
    if (view === "register") renderRegister();
    window.scrollTo({top:0,behavior:"smooth"});
  }

  function openDrawer(code, tab = "overview") {
    state.selectedWorkstream = code;
    state.drawerTab = tab;
    renderDrawer();
    $("#workstreamDrawer").classList.add("open");
    $("#workstreamDrawer").setAttribute("aria-hidden","false");
    document.body.style.overflow = "hidden";
  }

  function closeDrawer() {
    $("#workstreamDrawer").classList.remove("open");
    $("#workstreamDrawer").setAttribute("aria-hidden","true");
    document.body.style.overflow = "";
  }

  function renderDrawer() {
    const w = wsByCode(state.selectedWorkstream);
    if (!w) return;
    const s = summarise(w.code);
    $("#drawerHeader").innerHTML = `<div class="drawer-title-wrap" style="--drawer-accent:${w.accent}">
      <img src="assets/workstream-icons/${w.icon}-desktop.png" alt="">
      <div><span>${w.code} · ${esc(w.phase)}</span><h2 id="drawerTitle">${esc(w.name)}</h2><p>${esc(w.objective)}</p></div>
    </div>`;
    $("#drawerMetrics").innerHTML = [
      ["Readiness",`${s.progress}%`],["Items",s.total],["Active",s.counts.ACTIVE],["Blocked",s.counts.BLOCKED],["High risk",s.high]
    ].map(([label,value]) => `<div><strong>${value}</strong><span>${label}</span></div>`).join("");
    $$(".drawer-tabs button").forEach(b => b.classList.toggle("active", b.dataset.drawerTab === state.drawerTab));
    const content = $("#drawerContent");
    if (state.drawerTab === "overview") content.innerHTML = drawerOverview(w,s);
    if (state.drawerTab === "tasks") content.innerHTML = drawerTasks(w);
    if (state.drawerTab === "dependencies") content.innerHTML = drawerDependencies(w);
    if (state.drawerTab === "decisions") content.innerHTML = drawerDecisions(w);
  }

  function drawerOverview(w,s) {
    const milestone = milestoneFor(w.code);
    const critical = tasksFor(w.code).filter(t => t.status === "BLOCKED" || t.risk === "HIGH").slice(0,3);
    return `<div class="drawer-overview-grid">
      <section class="drawer-card"><h3>Command intent</h3><p>${esc(w.objective)}</p></section>
      <section class="drawer-card"><h3>Next control gate</h3><p><strong>${esc(milestone.label)}</strong><br>${humanDate(milestone.date)} · ${esc(milestone.status.replace("-"," "))}</p></section>
      <section class="drawer-card full"><h3>Immediate priorities</h3><div class="drawer-list">${
        critical.length ? critical.map(drawerTaskRow).join("") :
        tasksFor(w.code).filter(t => t.status === "ACTIVE").slice(0,3).map(drawerTaskRow).join("")
      }</div></section>
      <section class="drawer-card"><h3>Accountability</h3><p>Lead: <strong>${esc(w.lead)}</strong><br>Phase: ${esc(w.phase)}<br>${edgesFor(w.code).length} connected workstream relationships</p></section>
      <section class="drawer-card"><h3>Evidence coverage</h3><p><strong>${s.total}/${s.total} items populated</strong><br>Every prototype record contains ownership, status, risk, due date, evidence and next action.</p></section>
    </div>`;
  }

  function drawerTaskRow(t) {
    return `<button class="drawer-task" data-open-item="${t.id}">
      <i class="task-state" style="--state:${STATUS[t.status].color}"></i>
      <span><strong>${esc(t.title)}</strong><span>${t.id} · ${esc(t.owner)} · ${humanDate(t.due)}</span></span>
      <b>${t.progress}%</b>
    </button>`;
  }

  function drawerTasks(w) {
    return `<div class="drawer-list">${tasksFor(w.code)
      .sort((a,b) => ({BLOCKED:0,REVIEW:1,ACTIVE:2,PLANNED:3,COMPLETE:4}[a.status] - {BLOCKED:0,REVIEW:1,ACTIVE:2,PLANNED:3,COMPLETE:4}[b.status]))
      .map(drawerTaskRow).join("")}</div>`;
  }

  function drawerDependencies(w) {
    const edges = edgesFor(w.code);
    return `<div class="drawer-list">${edges.map(e => {
      const other = wsByCode(e.source === w.code ? e.target : e.source);
      const direction = e.source === w.code ? "Supplies" : "Receives from";
      return `<button class="dependency-card" data-map-workstream="${other.code}">
        <img src="assets/workstream-icons/${other.icon}-responsive.png" alt="">
        <span><strong>${direction} ${esc(other.name)}</strong><span>${esc(e.type)} · ${esc(e.label)}</span></span>
        <b>${esc(e.status)}</b>
      </button>`;
    }).join("")}</div>`;
  }

  function drawerDecisions(w) {
    const decisions = DATA.decisions.filter(d => d.impact.includes(w.code));
    if (!decisions.length) {
      return `<section class="drawer-card"><h3>No escalated decisions</h3><p>This workstream is operating within approved authority. The next scheduled review remains ${esc(w.milestone)}.</p></section>`;
    }
    return `<div class="drawer-list">${decisions.map(d => `<button class="decision-card" data-decision="${d.id}">
      <strong>${d.id} · ${esc(d.title)}</strong>
      <p>${esc(d.status)} · owner ${esc(d.owner)} · due ${humanDate(d.due)} · affects ${esc(d.impact)}</p>
    </button>`).join("")}</div>`;
  }

  function openItem(id) {
    const t = taskById(id);
    if (!t) return;
    const w = wsByCode(t.workstream);
    const dependencies = t.dependencies.map(taskById).filter(Boolean);
    $("#itemModalContent").innerHTML = `<header class="item-head">
      <span class="item-id">${t.id} · ${esc(w.name)}</span>
      <h2 id="itemModalTitle">${esc(t.title)}</h2>
      <p>${esc(t.description)}</p>
      <div class="item-badges">
        <span class="state-badge ${STATUS[t.status].className}">${STATUS[t.status].label}</span>
        <span class="risk-badge ${t.risk.toLowerCase()}">${t.risk} risk</span>
        <span class="status-pill">${t.priority}</span>
      </div>
    </header>
    <div class="item-grid">
      <section class="item-card"><span>Owner</span><strong>${esc(t.owner)}</strong><p>Accountable for the next acceptance checkpoint.</p></section>
      <section class="item-card"><span>Due date</span><strong>${humanDate(t.due)}</strong><p>Last updated ${humanDate(t.updated)}.</p></section>
      <section class="item-card"><span>Progress</span><strong>${t.progress}% complete</strong><p>${esc(t.nextAction)}</p></section>
      <section class="item-card"><span>Decision state</span><strong>${esc(t.decision)}</strong><p>Priority ${t.priority} within ${esc(w.phase)}.</p></section>
      <section class="item-card full"><span>Evidence</span><strong>${esc(t.evidence)}</strong><p>The prototype never leaves the evidence field empty.</p></section>
      <section class="item-card full"><span>Dependencies</span><strong>${dependencies.length ? dependencies.map(d => d.id).join(", ") : "No predecessor required"}</strong><p>${dependencies.length ? dependencies.map(d => d.title).join(" · ") : "This item can progress independently within its approved scope."}</p></section>
      <section class="item-card full"><span>Activity notes</span><div class="item-notes">${t.notes.map(n => `<div class="item-note">${esc(n)}</div>`).join("")}</div></section>
    </div>
    <div class="item-actions"><button class="secondary-button" data-action="copy-item" data-item="${t.id}">Copy reference</button><button class="primary-button" data-action="mark-reviewed" data-item="${t.id}">Mark reviewed</button></div>`;
    openLayer("#itemModal");
  }

  function closeItem() { closeLayer("#itemModal"); }

  function openLayer(selector) {
    const layer = $(selector);
    layer.classList.add("open");
    layer.setAttribute("aria-hidden","false");
    document.body.style.overflow = "hidden";
  }
  function closeLayer(selector) {
    const layer = $(selector);
    layer.classList.remove("open");
    layer.setAttribute("aria-hidden","true");
    if (!$$(".modal-layer.open,.command-drawer.open").length) document.body.style.overflow = "";
  }

  function mapPositions() {
    return {
      WS001:[265,145], WS010:[585,100], WS008:[935,145],
      WS007:[150,365], WS004:[1030,365],
      WS002:[320,590], WS006:[600,625], WS011:[895,590],
      WS005:[445,330], WS003:[600,410], WS009:[755,330]
    };
  }

  function renderMap() {
    const svg = $("#dependencyMap");
    const pos = mapPositions();
    const focusCode = state.selectedWorkstream;
    const selectedEdge = DATA.edges.find(e => e.id === state.selectedEdge);
    let edges = DATA.edges;
    if (state.mapMode === "critical") edges = edges.filter(e => e.status === "critical" || e.status === "watch");
    if (state.mapMode === "selected" && focusCode) edges = edges.filter(e => e.source === focusCode || e.target === focusCode);

    const connected = new Set();
    if (focusCode) {
      connected.add(focusCode);
      DATA.edges.filter(e => e.source === focusCode || e.target === focusCode).forEach(e => {connected.add(e.source);connected.add(e.target);});
    }
    if (selectedEdge) { connected.add(selectedEdge.source); connected.add(selectedEdge.target); }

    const edgeMarkup = edges.map(e => {
      const [x1,y1] = pos[e.source], [x2,y2] = pos[e.target];
      const mx=(x1+x2)/2, my=(y1+y2)/2;
      const curve = `M ${x1} ${y1} Q ${mx} ${my-32} ${x2} ${y2}`;
      const dim = (focusCode && ![e.source,e.target].includes(focusCode)) || (selectedEdge && e.id !== selectedEdge.id);
      const focus = e.id === state.selectedEdge || (focusCode && [e.source,e.target].includes(focusCode));
      return `<g data-map-edge="${e.id}">
        <path class="map-edge-hit" d="${curve}"></path>
        <path class="map-edge ${e.status} ${dim?"dim":""} ${focus?"focus":""}" d="${curve}"></path>
        ${state.mapLabels && (!dim || !focusCode) ? `<text class="map-edge-label" x="${mx}" y="${my-38}">${esc(e.type)}</text>` : ""}
      </g>`;
    }).join("");

    const nodeMarkup = DATA.workstreams.map(w => {
      const [x,y]=pos[w.code];
      const s=summarise(w.code);
      const dim=(focusCode || selectedEdge) && !connected.has(w.code);
      const selected=w.code===focusCode;
      return `<g class="map-node ${dim?"dim":""} ${selected?"selected":""}" data-map-node="${w.code}" transform="translate(${x},${y})" style="--node-accent:${w.accent}">
        <circle class="outer" r="67"></circle><circle class="inner" r="56"></circle>
        <image href="assets/workstream-icons/${w.icon}-responsive.png" x="-34" y="-45" width="68" height="68"></image>
        <text class="node-code" y="30">${w.code}</text>
        <text y="48">${esc(w.short)}</text>
        <text class="node-health" y="64">${s.progress}% · ${s.counts.BLOCKED} blocked</text>
      </g>`;
    }).join("");

    svg.innerHTML = `<defs><filter id="softglow"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>${edgeMarkup}${nodeMarkup}`;
    renderMapInspector();
  }

  function renderMapInspector() {
    const inspector = $("#mapInspector");
    if (state.selectedEdge) {
      const e=DATA.edges.find(x=>x.id===state.selectedEdge);
      const source=wsByCode(e.source),target=wsByCode(e.target);
      inspector.innerHTML=`<div class="inspector-content">
        <p class="eyebrow">Dependency relationship</p>
        <h2>${esc(e.type)}</h2>
        <p class="lead">${esc(e.label)}</p>
        <div class="inspector-health">
          <div><strong>${esc(e.status)}</strong><span>relationship state</span></div>
          <div><strong>${esc(e.strength)}</strong><span>dependency strength</span></div>
        </div>
        <div class="inspector-section"><h3>From</h3><button class="dependency-card" data-map-workstream="${source.code}"><img src="assets/workstream-icons/${source.icon}-responsive.png" alt=""><span><strong>${source.code} · ${esc(source.name)}</strong><span>${esc(source.phase)}</span></span><b>Open</b></button></div>
        <div class="inspector-section"><h3>To</h3><button class="dependency-card" data-map-workstream="${target.code}"><img src="assets/workstream-icons/${target.icon}-responsive.png" alt=""><span><strong>${target.code} · ${esc(target.name)}</strong><span>${esc(target.phase)}</span></span><b>Open</b></button></div>
        <div class="inspector-actions"><button class="secondary-button" data-action="clear-map-focus">Clear focus</button><button class="primary-button" data-map-workstream="${target.code}">Inspect target</button></div>
      </div>`;
      return;
    }
    if (!state.selectedWorkstream) {
      inspector.innerHTML=`<div class="inspector-empty"><img src="assets/brand/ghm-medallion.png" alt=""><p class="eyebrow">Map inspector</p><h2>Select a workstream</h2><p>Its health, dependencies, milestone and immediate actions will appear here.</p></div>`;
      return;
    }
    const w=wsByCode(state.selectedWorkstream),s=summarise(w.code),m=milestoneFor(w.code),critical=tasksFor(w.code).filter(t=>t.status==="BLOCKED"||t.risk==="HIGH").slice(0,3);
    inspector.innerHTML=`<div class="inspector-content">
      <div class="inspector-hero"><img src="assets/workstream-icons/${w.icon}-responsive.png" alt=""><div><span>${w.code} · ${esc(w.phase)}</span><h2>${esc(w.name)}</h2></div></div>
      <div class="inspector-health"><div><strong>${s.progress}%</strong><span>readiness</span></div><div><strong>${s.counts.BLOCKED}</strong><span>blocked</span></div><div><strong>${s.high}</strong><span>high risk</span></div><div><strong>${edgesFor(w.code).length}</strong><span>dependencies</span></div></div>
      <div class="inspector-section"><h3>Next milestone</h3><div class="inspector-link"><strong>${esc(m.label)}</strong>${humanDate(m.date)} · ${esc(m.status)}</div></div>
      <div class="inspector-section"><h3>Immediate attention</h3><div class="inspector-list">${(critical.length?critical:tasksFor(w.code).filter(t=>t.status==="ACTIVE").slice(0,2)).map(t=>`<button class="inspector-link" data-open-item="${t.id}"><strong>${esc(t.title)}</strong>${t.id} · ${esc(t.owner)}</button>`).join("")}</div></div>
      <div class="inspector-actions"><button class="secondary-button" data-action="clear-map-focus">Clear focus</button><button class="primary-button" data-open-workstream="${w.code}">Open chamber</button></div>
    </div>`;
  }

  function renderTimeline() {
    const summary = [
      ["12","milestones","through September"],
      ["3","critical gates","require council attention"],
      ["5","watch items","being actively managed"],
      ["02 Sep","launch window","planned control point"]
    ];
    $("#timelineSummary").innerHTML=summary.map(([value,label,small])=>`<div class="timeline-stat"><span>${label}</span><strong>${value}</strong><small>${small}</small></div>`).join("");

    const wsFilter=state.timeline.workstream,statusFilter=state.timeline.status;
    const visibleMilestones=DATA.milestones.filter(m=>(wsFilter==="ALL"||m.workstream===wsFilter)&&(statusFilter==="ALL"||m.status===statusFilter));
    const visibleCodes=wsFilter!=="ALL"
      ? [wsFilter]
      : statusFilter==="ALL"
        ? DATA.workstreams.map(w=>w.code)
        : [...new Set(visibleMilestones.map(m=>m.workstream))];
    const start=new Date("2026-07-01T12:00:00"),end=new Date("2026-10-01T12:00:00");
    const span=end-start;
    const pos=date=>Math.max(2,Math.min(98,((new Date(`${date}T12:00:00`)-start)/span)*100));
    const today=pos("2026-07-18");
    $("#timelineBoard").innerHTML=`<div class="timeline-axis">
      <div class="month-row"><span>Workstream</span><span>July</span><span>August</span><span>September</span><span>October</span></div>
      ${visibleCodes.map(code=>{
        const w=wsByCode(code),ms=visibleMilestones.filter(m=>m.workstream===code);
        return `<div class="timeline-row"><div class="timeline-label"><img src="assets/workstream-icons/${w.icon}-responsive.png" alt=""><div><strong>${w.code} · ${esc(w.short)}</strong><span>${esc(w.phase)}</span></div></div>
          <div class="timeline-track"><div class="today-line" style="left:${today}%"><span>Today</span></div>${ms.map(m=>`<button class="milestone ${m.status}" style="left:${pos(m.date)}%" data-milestone="${m.id}"><strong>${esc(m.label)}</strong><span>${shortDate(m.date)} · ${esc(m.status)}</span></button>`).join("")}</div></div>`;
      }).join("")}
    </div>`;
  }

  function registerFiltered() {
    let rows=[...state.tasks];
    const f=state.register;
    const q=f.search.trim().toLowerCase();
    if(q) rows=rows.filter(t=>[t.id,t.title,t.owner,t.evidence,t.description].some(v=>String(v).toLowerCase().includes(q)));
    if(f.workstream!=="ALL") rows=rows.filter(t=>t.workstream===f.workstream);
    if(f.status!=="ALL") rows=rows.filter(t=>t.status===f.status);
    if(f.risk!=="ALL") rows=rows.filter(t=>t.risk===f.risk);
    const dir=f.direction==="asc"?1:-1;
    rows.sort((a,b)=>{
      const va=a[f.sort],vb=b[f.sort];
      return String(va).localeCompare(String(vb),undefined,{numeric:true})*dir;
    });
    return rows;
  }

  function renderRegister() {
    const rows=registerFiltered(),f=state.register;
    const pages=Math.max(1,Math.ceil(rows.length/f.pageSize));
    if(f.page>pages) f.page=pages;
    const shown=rows.slice((f.page-1)*f.pageSize,f.page*f.pageSize);
    $("#registerCount").textContent=`${rows.length} of ${state.tasks.length} records · sorted by ${f.sort} ${f.direction}`;
    $("#registerBody").innerHTML=shown.map(t=>{
      const w=wsByCode(t.workstream),s=STATUS[t.status];
      return `<tr data-open-item="${t.id}">
        <td><span class="record-id">${t.id}</span></td>
        <td><span class="record-title"><strong>${esc(t.title)}</strong><span>${esc(t.evidence)}</span></span></td>
        <td><span class="ws-table-chip" style="--chip:${w.accent}"><i></i><span>${w.code} · ${esc(w.short)}</span></span></td>
        <td><span class="owner-table"><b>${initials(t.owner)}</b>${esc(t.owner)}</span></td>
        <td><span class="state-badge ${s.className}">${s.label}</span></td>
        <td><span class="risk-badge ${t.risk.toLowerCase()}">${t.risk}</span></td>
        <td>${humanDate(t.due)}</td>
        <td><span class="progress-cell"><i class="progress-mini"><span style="width:${t.progress}%;background:${s.color}"></span></i><b>${t.progress}%</b></span></td>
      </tr>`;
    }).join("");
    $("#registerEmpty").hidden=rows.length!==0;
    $("#registerTable").hidden=rows.length===0;
    $("#registerTable").classList.toggle("compact",state.tableDensity==="compact");
    $("#pagination").innerHTML=`<button data-page="${f.page-1}" ${f.page===1?"disabled":""}>←</button>${Array.from({length:pages},(_,i)=>i+1).map(p=>`<button class="${p===f.page?"active":""}" data-page="${p}">${p}</button>`).join("")}<button data-page="${f.page+1}" ${f.page===pages?"disabled":""}>→</button>`;
  }

  function clearRegister() {
    state.register={...state.register,search:"",workstream:"ALL",status:"ALL",risk:"ALL",page:1};
    $("#registerSearch").value="";
    $("#filterWorkstream").value="ALL";
    $("#filterStatus").value="ALL";
    $("#filterRisk").value="ALL";
    renderRegister();
  }

  function renderPalette(query="") {
    const q=query.trim().toLowerCase();
    const workstreams=DATA.workstreams.filter(w=>!q||`${w.code} ${w.name} ${w.lead}`.toLowerCase().includes(q)).slice(0,5);
    const tasks=state.tasks.filter(t=>!q||`${t.id} ${t.title} ${t.owner} ${t.evidence}`.toLowerCase().includes(q)).slice(0,7);
    $("#paletteContent").innerHTML=`
      <div class="palette-group"><h3>Navigate</h3>
        ${["overview","map","timeline","register"].filter(v=>!q||v.includes(q)).map((v,i)=>`<button class="palette-result" data-view="${v}"><span class="signal-icon">${i+1}</span><span><strong>${v[0].toUpperCase()+v.slice(1)}</strong><span>Open Atlas ${v}</span></span><b>↵</b></button>`).join("")}
      </div>
      <div class="palette-group"><h3>Workstreams</h3>${workstreams.map(w=>`<button class="palette-result" data-open-workstream="${w.code}"><img src="assets/workstream-icons/${w.icon}-responsive.png" alt=""><span><strong>${w.code} · ${esc(w.name)}</strong><span>${esc(w.phase)} · ${esc(w.lead)}</span></span><b>Open</b></button>`).join("")}</div>
      <div class="palette-group"><h3>Work items</h3>${tasks.map(t=>`<button class="palette-result" data-open-item="${t.id}"><span class="state-badge ${STATUS[t.status].className}">${STATUS[t.status].label}</span><span><strong>${esc(t.title)}</strong><span>${t.id} · ${esc(t.owner)} · ${humanDate(t.due)}</span></span><b>${t.progress}%</b></button>`).join("")}</div>`;
  }

  function openPalette() {
    renderPalette("");
    $("#paletteInput").value="";
    openLayer("#commandPalette");
    setTimeout(()=>$("#paletteInput").focus(),50);
  }

  function showToast(title,detail="") {
    const toast=document.createElement("div");
    toast.className="toast";
    toast.innerHTML=`<strong>${esc(title)}</strong>${detail?`<small>${esc(detail)}</small>`:""}`;
    $("#toastRegion").appendChild(toast);
    setTimeout(()=>toast.remove(),3600);
  }

  function exportCsv() {
    const rows=registerFiltered();
    const headers=["ID","Title","Workstream","Owner","Status","Risk","Priority","Due","Progress","Evidence"];
    const csv=[headers,...rows.map(t=>[t.id,t.title,t.workstream,t.owner,t.status,t.risk,t.priority,t.due,t.progress,t.evidence])]
      .map(row=>row.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(",")).join("\n");
    const blob=new Blob([csv],{type:"text/csv"});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a");a.href=url;a.download="atlas-v20-register-view.csv";a.click();
    URL.revokeObjectURL(url);
    showToast("Register exported",`${rows.length} visible records downloaded as CSV.`);
  }

  function openNewItem() {
    $("#itemModalContent").innerHTML=`<header class="item-head"><span class="item-id">Prototype data entry</span><h2 id="itemModalTitle">Add a complete work item</h2><p>Every field is required so the interface never creates an accidental blank.</p></header>
      <form id="newItemForm" class="item-grid">
        <label class="item-card"><span>Workstream</span><select name="workstream" required>${DATA.workstreams.map(w=>`<option value="${w.code}">${w.code} · ${esc(w.name)}</option>`).join("")}</select></label>
        <label class="item-card"><span>Owner</span><input name="owner" value="GHM" required></label>
        <label class="item-card full"><span>Title</span><input name="title" value="New Atlas prototype item" required></label>
        <label class="item-card"><span>Status</span><select name="status">${Object.keys(STATUS).map(k=>`<option value="${k}">${STATUS[k].label}</option>`).join("")}</select></label>
        <label class="item-card"><span>Risk</span><select name="risk"><option>LOW</option><option selected>MEDIUM</option><option>HIGH</option></select></label>
        <label class="item-card"><span>Due date</span><input type="date" name="due" value="2026-08-28" required></label>
        <label class="item-card"><span>Priority</span><select name="priority"><option>P1</option><option selected>P2</option><option>P3</option></select></label>
        <label class="item-card full"><span>Description</span><input name="description" value="A fully populated prototype record for UX validation." required></label>
        <label class="item-card full"><span>Evidence</span><input name="evidence" value="Prototype brief and acceptance note" required></label>
        <div class="item-card full"><span>Completion rule</span><p>Saving creates ownership, status, risk, dates, evidence, next action, notes and a unique Atlas ID.</p></div>
        <div class="item-actions item-card full"><button type="button" class="secondary-button" data-action="close-item">Cancel</button><button type="submit" class="primary-button">Save prototype item</button></div>
      </form>`;
    openLayer("#itemModal");
  }

  function saveNewItem(form) {
    const fd=new FormData(form),code=fd.get("workstream");
    const next=String(Math.max(0,...tasksFor(code).map(t=>Number(t.id.split("-")[1])))+1).padStart(3,"0");
    const status=fd.get("status");
    const item={
      id:`${code}-${next}`,workstream:code,title:fd.get("title"),owner:fd.get("owner"),status,risk:fd.get("risk"),
      priority:fd.get("priority"),due:fd.get("due"),updated:"2026-07-18",progress:status==="COMPLETE"?100:status==="REVIEW"?88:status==="ACTIVE"?60:status==="BLOCKED"?35:10,
      description:fd.get("description"),evidence:fd.get("evidence"),dependencies:[],decision:"Within agreed delivery authority",
      nextAction:"Complete the next acceptance checkpoint",notes:["Created in the v20 experience prototype.","All required fields were populated at creation.","Ready for command-centre review."]
    };
    state.tasks.unshift(item);
    closeItem();
    renderAll();
    switchView("register");
    showToast("Prototype item created",`${item.id} has been added without any blank fields.`);
  }

  function fillSelects() {
    const options=DATA.workstreams.map(w=>`<option value="${w.code}">${w.code} · ${esc(w.name)}</option>`).join("");
    ["#filterWorkstream","#timelineWorkstream"].forEach(id=>$(id).insertAdjacentHTML("beforeend",options));
  }

  function renderAll() {
    renderGlobalStats();
    renderSignals();
    renderWorkstreams();
    renderDecisions();
    renderActivity();
    renderMap();
    renderTimeline();
    renderRegister();
  }

  document.addEventListener("click", event => {
    const button=event.target.closest("button,[data-open-item],[data-open-workstream],[data-map-node],[data-map-edge]");
    if(!button)return;

    if(button.dataset.view){ switchView(button.dataset.view); closeLayer("#commandPalette"); return; }
    if(button.dataset.openWorkstream){ openDrawer(button.dataset.openWorkstream); closeLayer("#commandPalette"); return; }
    if(button.dataset.openItem){ openItem(button.dataset.openItem); closeLayer("#commandPalette"); return; }
    if(button.dataset.drawerTab){ state.drawerTab=button.dataset.drawerTab;renderDrawer();return; }
    if(button.dataset.density){ state.density=button.dataset.density;$$("[data-density]").forEach(b=>b.classList.toggle("active",b===button));renderWorkstreams();return; }
    if(button.dataset.tableDensity){ state.tableDensity=button.dataset.tableDensity;$$("[data-table-density]").forEach(b=>b.classList.toggle("active",b===button));renderRegister();return; }
    if(button.dataset.quick){ state.quick=button.dataset.quick;$$("[data-quick]").forEach(b=>b.classList.toggle("active",b===button));renderWorkstreams();showToast("Quick filter applied",button.textContent.trim());return; }
    if(button.dataset.mapMode){ state.mapMode=button.dataset.mapMode;$$("[data-map-mode]").forEach(b=>b.classList.toggle("active",b===button));renderMap();return; }
    if(button.dataset.mapNode){ state.selectedEdge=null;state.selectedWorkstream=state.selectedWorkstream===button.dataset.mapNode?null:button.dataset.mapNode;state.mapMode=state.selectedWorkstream?"selected":"all";$$("[data-map-mode]").forEach(b=>b.classList.toggle("active",b.dataset.mapMode===state.mapMode));renderMap();return; }
    if(button.dataset.mapEdge){ state.selectedWorkstream=null;state.selectedEdge=state.selectedEdge===button.dataset.mapEdge?null:button.dataset.mapEdge;renderMap();return; }
    if(button.dataset.mapWorkstream){ state.selectedEdge=null;state.selectedWorkstream=button.dataset.mapWorkstream;state.mapMode="selected";renderMap();closeDrawer();switchView("map");return; }
    if(button.dataset.page){ state.register.page=Number(button.dataset.page);renderRegister();return; }
    if(button.dataset.milestone){
      const m=DATA.milestones.find(x=>x.id===button.dataset.milestone),w=wsByCode(m.workstream);
      showToast(m.label,`${w.code} · ${humanDate(m.date)} · ${m.status}`);
      return;
    }
    if(button.dataset.decision){
      const d=DATA.decisions.find(x=>x.id===button.dataset.decision);
      showToast(`${d.id} · ${d.title}`,`${d.status} · owner ${d.owner} · due ${humanDate(d.due)}`);
      return;
    }

    const action=button.dataset.action;
    if(action==="home"){switchView("overview");return;}
    if(action==="close-drawer"){closeDrawer();return;}
    if(action==="close-item"){closeItem();return;}
    if(action==="close-palette"){closeLayer("#commandPalette");return;}
    if(action==="open-data"){openLayer("#dataModal");return;}
    if(action==="close-data"){closeLayer("#dataModal");return;}
    if(action==="open-critical"){state.mapMode="critical";state.selectedWorkstream="WS006";switchView("map");renderMap();return;}
    if(action==="clear-map-focus"){state.selectedWorkstream=null;state.selectedEdge=null;state.mapMode="all";renderMap();return;}
    if(action==="clear-register"){clearRegister();return;}
    if(action==="show-decisions"){showToast("Decision log ready","Four populated decisions are visible in the overview and workstream chambers.");return;}
    if(action==="open-milestone"){showToast("Review note added","Prototype interaction confirmed. No production data was changed.");return;}
    if(action==="copy-item"){
      navigator.clipboard?.writeText(button.dataset.item);
      showToast("Item reference copied",button.dataset.item);return;
    }
    if(action==="mark-reviewed"){
      const t=taskById(button.dataset.item);t.status="REVIEW";t.progress=Math.max(t.progress,88);t.updated="2026-07-18";closeItem();renderAll();showToast("Item moved to review",`${t.id} is now visible as Review across every view.`);return;
    }
  });

  $("#mobileMenuButton").addEventListener("click",()=>{
    const nav=$(".primary-nav");nav.classList.toggle("open");$("#sideRail").classList.toggle("open");
  });
  $("#commandSearchButton").addEventListener("click",openPalette);
  $("#paletteInput").addEventListener("input",e=>renderPalette(e.target.value));
  $("#dataSourceButton").addEventListener("click",()=>openLayer("#dataModal"));
  $("#notificationButton").addEventListener("click",()=>showToast("Four command notifications","Two decisions, one dependency watch, and one acceptance gate need review."));
  $("#profileButton").addEventListener("click",()=>showToast("GHM command profile","Prototype permissions: programme owner."));
  $("#resetMapButton").addEventListener("click",()=>{state.selectedWorkstream=null;state.selectedEdge=null;state.mapMode="all";$$("[data-map-mode]").forEach(b=>b.classList.toggle("active",b.dataset.mapMode==="all"));renderMap();});
  $("#criticalMapButton").addEventListener("click",()=>{state.mapMode="critical";state.selectedWorkstream="WS006";$$("[data-map-mode]").forEach(b=>b.classList.toggle("active",b.dataset.mapMode==="critical"));renderMap();});
  $("#showLabels").addEventListener("change",e=>{state.mapLabels=e.target.checked;renderMap();});
  $("#timelineToday").addEventListener("click",()=>{showToast("Timeline centred on 18 July 2026","The gold line marks the prototype review date.");$("#timelineBoard").scrollTo({left:0,behavior:"smooth"});});
  $("#timelineWorkstream").addEventListener("change",e=>{state.timeline.workstream=e.target.value;renderTimeline();});
  $("#timelineStatus").addEventListener("change",e=>{state.timeline.status=e.target.value;renderTimeline();});
  $("#registerSearch").addEventListener("input",e=>{state.register.search=e.target.value;state.register.page=1;renderRegister();});
  $("#filterWorkstream").addEventListener("change",e=>{state.register.workstream=e.target.value;state.register.page=1;renderRegister();});
  $("#filterStatus").addEventListener("change",e=>{state.register.status=e.target.value;state.register.page=1;renderRegister();});
  $("#filterRisk").addEventListener("change",e=>{state.register.risk=e.target.value;state.register.page=1;renderRegister();});
  $("#clearFilters").addEventListener("click",clearRegister);
  $("#exportButton").addEventListener("click",exportCsv);
  $("#newItemButton").addEventListener("click",openNewItem);
  $("#registerTable").addEventListener("click",e=>{
    const th=e.target.closest("th[data-sort]");
    if(!th)return;
    const key=th.dataset.sort;
    if(state.register.sort===key)state.register.direction=state.register.direction==="asc"?"desc":"asc";
    else{state.register.sort=key;state.register.direction="asc";}
    renderRegister();
  });
  document.addEventListener("submit",e=>{
    if(e.target.id==="newItemForm"){e.preventDefault();saveNewItem(e.target);}
  });
  document.addEventListener("keydown",e=>{
    if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==="k"){e.preventDefault();openPalette();}
    if(e.key==="Escape"){
      closeDrawer();["#itemModal","#commandPalette","#dataModal"].forEach(closeLayer);
    }
  });

  fillSelects();
  renderAll();
  setTimeout(()=>$("#loadingScreen").classList.add("done"),720);
})();