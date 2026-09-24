const $=s=>document.querySelector(s);
const clean=(s="")=>String(s).normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim();
const escapeHtml=(s="")=>String(s).replace(/[&<>'"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#039;",'"':"&quot;"}[c]));
const personName=(name="")=>String(name).trim().toLocaleLowerCase("ro-RO").replace(/(^|[\s.\-‐‑‒–—'’])(\p{L})/gu,(_match,boundary,letter)=>boundary+letter.toLocaleUpperCase("ro-RO"));
const palette={PSD:"#d94a45",PNL:"#e9b83f",USR:"#4d7fe8",AUR:"#d59a22",UDMR:"#4a9b6f",PMP:"#7563b8",PRO_ROMANIA:"#8e5b9e",Neafiliat:"#8a958f",Neprecizat:"#c7ccc8",Altul:"#3d887e"};
let rows=[],sortKey="name",sortDirection=1;

function category(value){
  const v=clean(value).replace(/[_-]+/g," ");
  if(/\bpsd\b|social democrat/.test(v))return"PSD";
  if(/\bpnl\b|national liberal/.test(v))return"PNL";
  if(/\busr\b|salvati romania/.test(v))return"USR";
  if(/\baur\b|alianta pentru unirea romanilor/.test(v))return"AUR";
  if(/\budmr\b|uniunea democrata maghiara/.test(v))return"UDMR";
  if(/\bpmp\b|miscarea populara/.test(v))return"PMP";
  if(/pro romania/.test(v))return"PRO_ROMANIA";
  if(/neafiliat|fara (apartenenta|afiliere)|apolitic|nu este (membru|cazul)|^nu$|independent/.test(v))return"Neafiliat";
  if(!v||/^\d+$/.test(v)||/\d{1,2}\.\d{1,2}\.\d{2,4}/.test(v)||/neprecizat|nespecificat/.test(v))return"Neprecizat";
  return"Altul";
}
function label(value){return value==="PRO_ROMANIA"?"PRO România":value}
async function init(){
  const response=await fetch("data/registry.json",{cache:"no-cache"});if(!response.ok)throw new Error("Datele nu au putut fi încărcate.");
  const data=await response.json();buildRows(data);renderPie();const requestedPerson=new URLSearchParams(location.search).get("person");if(requestedPerson)$("#politicalSearch").value=requestedPerson;renderTable();if(requestedPerson)focusPerson(requestedPerson);
  $("#politicalSearch").addEventListener("input",renderTable);
  document.querySelectorAll("[data-sort]").forEach(button=>button.addEventListener("click",()=>{if(sortKey===button.dataset.sort)sortDirection*=-1;else{sortKey=button.dataset.sort;sortDirection=1}renderTable()}));
}
function buildRows(data){
  const people=new Map(data.people.map(p=>[p.id,p]));const institutions=new Map(data.institutions.map(i=>[i.id,i]));const grouped=new Map();
  for(const a of data.appointments){const person=people.get(a.person_id);if(!person)continue;let item=grouped.get(a.person_id);if(!item){item={id:a.person_id,name:person.full_name,raw:new Set(),categories:new Map(),positions:[]};grouped.set(a.person_id,item)}
    const affiliation=String(a.political_affiliation||"").trim()||"Nespecificat";item.raw.add(affiliation);const cat=category(affiliation);item.categories.set(cat,(item.categories.get(cat)||0)+1);item.positions.push({institution:institutions.get(a.institution_id)?.name||"Companie neidentificată",role:a.role?.label||"Funcție neprecizată",institutionId:a.institution_id});
  }
  rows=[...grouped.values()].map(r=>({...r,category:[...r.categories].sort((a,b)=>b[1]-a[1])[0][0],positions:[...new Map(r.positions.map(p=>[`${p.institutionId}|${p.role}`,p])).values()]})).sort((a,b)=>a.name.localeCompare(b.name,"ro",{sensitivity:"base"}));
}
function renderPie(){const counts=new Map();for(const r of rows)counts.set(r.category,(counts.get(r.category)||0)+1);const entries=[...counts].sort((a,b)=>b[1]-a[1]);const total=rows.length;let cursor=0;const stops=[];for(const [cat,count] of entries){const end=cursor+count/total*100;stops.push(`${palette[cat]} ${cursor}% ${end}%`);cursor=end}$("#politicalPie").style.background=`conic-gradient(${stops.join(",")})`;$("#peopleTotal").textContent=total.toLocaleString("ro-RO");$("#pieLegend").innerHTML=entries.map(([cat,count])=>`<div><i style="--legend-color:${palette[cat]}"></i><span>${escapeHtml(label(cat))}</span><strong>${count}</strong><small>${(count/total*100).toLocaleString("ro-RO",{maximumFractionDigits:1})}%</small></div>`).join("")}
function renderTable(){const q=clean($("#politicalSearch").value);const values={name:r=>r.name,category:r=>label(r.category),positions:r=>r.positions.length};const compare=(a,b)=>{const av=values[sortKey](a),bv=values[sortKey](b);return(typeof av==="number"?av-bv:String(av).localeCompare(String(bv),"ro",{sensitivity:"base",numeric:true}))*sortDirection};const filtered=rows.filter(r=>!q||clean(`${r.name} ${r.category} ${[...r.raw].join(" ")} ${r.positions.map(p=>p.institution).join(" ")}`).includes(q)).sort(compare);document.querySelectorAll("[data-sort]").forEach(button=>{const active=button.dataset.sort===sortKey;button.classList.toggle("active",active);button.querySelector("span").textContent=active?(sortDirection===1?"↑":"↓"):"↕";button.closest("th").setAttribute("aria-sort",active?(sortDirection===1?"ascending":"descending"):"none")});$("#politicalRows").innerHTML=filtered.map((r,index)=>`<tr class="person-row" data-row="${index}"><td><button class="political-name" type="button" aria-expanded="false">${escapeHtml(personName(r.name))}</button></td><td><span class="party-pill" style="--party-color:${palette[r.category]}">${escapeHtml(label(r.category))}</span></td><td>${r.positions.length}</td></tr><tr class="company-detail" hidden><td colspan="3"><div>${r.positions.map(p=>`<a href="./#institutie=${encodeURIComponent(p.institutionId)}"><strong>${escapeHtml(p.institution)}</strong><span>${escapeHtml(p.role)}</span></a>`).join("")}</div></td></tr>`).join("");$("#politicalEmpty").hidden=filtered.length>0;document.querySelectorAll(".person-row").forEach(tr=>tr.addEventListener("click",()=>{const detail=tr.nextElementSibling;const open=detail.hidden;detail.hidden=!open;tr.querySelector("button").setAttribute("aria-expanded",String(open))}))}
function focusPerson(name){const row=[...document.querySelectorAll(".person-row")].find(item=>clean(item.querySelector(".political-name")?.textContent)===clean(name));if(!row)return;row.classList.add("target-person");const detail=row.nextElementSibling;if(detail?.classList.contains("company-detail")){detail.hidden=false;row.querySelector("button").setAttribute("aria-expanded","true")}requestAnimationFrame(()=>row.scrollIntoView({behavior:"smooth",block:"center"}))}
init().catch(e=>{$("#politicalEmpty").hidden=false;$("#politicalEmpty").textContent=e.message});
