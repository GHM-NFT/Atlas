
/* GHM Atlas RC3.2 — deterministic provisional progress placeholders.
   These values are visual placeholders only and do not alter source-record counts. */
(()=>{
  "use strict";
  const atlas=window.ATLAS_DATA;
  if(!atlas||!Array.isArray(atlas.items))return;
  const hash=value=>{
    let h=2166136261;
    for(const ch of String(value||"")){
      h^=ch.charCodeAt(0);
      h=Math.imul(h,16777619);
    }
    return h>>>0;
  };
  const rangeFor=item=>{
    if(item.status==="Completed")return [100,100];
    if(item.status==="Blocked")return [24,58];
    if(item.status==="Review")return [58,86];
    if(item.status==="Later")return [12,42];
    if(item.risk==="Critical")return [28,56];
    if(item.risk==="High")return [34,66];
    return [38,79];
  };
  atlas.items.forEach(item=>{
    const existing=Number(item.progress);
    const authoritative=Boolean(item.progressKnown&&Number.isFinite(existing));
    if(authoritative){
      item.progressProvisional=false;
      return;
    }
    const [min,max]=rangeFor(item);
    const span=Math.max(1,max-min+1);
    item.progress=min+(hash(item.id)%span);
    item.progressKnown=true;
    item.progressProvisional=true;
  });
  window.ATLAS_PROVISIONAL_PROGRESS=true;
})();
