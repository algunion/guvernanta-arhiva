const state={data:null,institutions:[],people:new Map(),appointments:new Map(),multiBoardPeople:new Map(),activeTab:"institutions",visible:18,query:"",authority:"",sector:"",coverage:"",sort:"members"};
const $=(s)=>document.querySelector(s);
state.sort="multi_boards";
state.authority="__central__";
state.selectedPersonName="";
state.peopleSort="income";
state.peopleSortDirection=-1;
const $$=(s)=>[...document.querySelectorAll(s)];
const fmt=new Intl.NumberFormat("ro-RO");
const money=new Intl.NumberFormat("ro-RO",{style:"currency",currency:"RON",maximumFractionDigits:0});
const euro=new Intl.NumberFormat("ro-RO",{style:"currency",currency:"EUR",maximumFractionDigits:0});
const pdfViewerState={module:null,pdf:null,renderTask:null,pageNumber:1,zoom:1,url:"",generation:0,renderSequence:0,resizeTimer:null};
const clean=(s="")=>String(s).normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
const escapeHtml=(s="")=>String(s).replace(/[&<>'"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#039;",'"':"&quot;"}[c]));
const personName=(name="")=>String(name).trim().toLocaleLowerCase("ro-RO").replace(/(^|[\s.\-‐‑‒–—'’])(\p{L})/gu,(_match,boundary,letter)=>boundary+letter.toLocaleUpperCase("ro-RO"));
const assetUrl=(path="")=>/^https?:\/\//i.test(String(path))?String(path):String(path).split("/").map(encodeURIComponent).join("/");
const initials=(name="")=>name.replace(/[^\p{L}\p{N} ]/gu," ").split(/\s+/).filter(Boolean).slice(0,3).map(x=>x[0]).join("").toUpperCase();
const isBoardAppointment=(a)=>{const c=a.role?.category||"";const l=clean(a.role?.label||"");return c==="board_chair"||c==="board_member"||/pre[sșş]edint|administrator|consiliu de administra|consiliul de administra|\bc\.?a\.?\b/.test(l)};
const sectorFor=(i)=>{const v=clean(`${i.name} ${i.supervising_authority||""}`);if(/energie|nuclear|electro|gaz|hidro|carbune|mineral|petrol|oil/.test(v))return"Energie";if(/transport|cfr|aeroport|tarom|rutier|port|naval|metrou|drum|canal/.test(v))return"Transport";if(/apararii|romarm|mecanica|pulberi|piro|arm/.test(v))return"Apărare";if(/finant|banca|credit|garantare|asigur/.test(v))return"Finanțe";if(/industrie|uzina|fabrica|constructii|metal|cupru|sider/.test(v))return"Industrie";return"Infrastructură"};
const isLocalAuthority=i=>i.authority_level==="local"||(!i.authority_level&&!i.supervising_authority);
const authorityLabel=i=>i.supervising_authority||(isLocalAuthority(i)?"Autoritate locală":"Autoritate centrală neprecizată");
const byName=(a,b)=>a.name.localeCompare(b.name,"ro",{sensitivity:"base"});

async function init(){
  const response=await fetch("data/registry.json",{cache:"no-cache"});
  if(!response.ok)throw new Error("Registrul nu a putut fi încărcat.");
  state.data=await response.json();
  state.institutions=state.data.institutions.map(i=>({...i,sector:sectorFor(i)}));
  state.people=new Map(state.data.people.map(p=>[p.id,p]));
  state.appointments=new Map();
  for(const a of state.data.appointments){if(!state.appointments.has(a.institution_id))state.appointments.set(a.institution_id,[]);state.appointments.get(a.institution_id).push(a)}
  updateMultiBoardStats();
  renderStats();
  renderFilters();
  bind();
  const urlState=new URLSearchParams(location.search);const requestedPerson=urlState.get("person");if(requestedPerson){state.query=requestedPerson;state.selectedPersonName=requestedPerson;state.activeTab="people";$("#searchInput").value=requestedPerson}else if(urlState.get("tab")==="people")state.activeTab="people";$$('.tab').forEach(t=>t.classList.toggle('active',t.dataset.tab===state.activeTab));
  render();
  openFromHash();
}
function renderStats(){
  const institutions=state.institutions.filter(matchesAuthority),institutionIds=new Set(institutions.map(i=>i.id));
  const appointments=state.data.appointments.filter(a=>institutionIds.has(a.institution_id));
  const people=new Set(appointments.map(a=>a.person_id));
  const local=appointments.filter(a=>a.cv?.local_url).length;
  const income=appointments.filter(a=>a.compensation?.gross_ron!=null||a.compensation?.net_ron!=null||a.compensation?.net_eur!=null).length;
  const multiBoardCount=[...people].filter(personId=>state.multiBoardPeople.has(personId)).length;
  $("#statInstitutions").textContent=fmt.format(institutions.length);
  $("#statPeople").textContent=fmt.format(state.authority?people.size:state.data.people.length);
  $("#statCvs").textContent=fmt.format(local);
  $("#statIncome").textContent=fmt.format(income);
  $("#statMultiBoards").textContent=fmt.format(multiBoardCount);
  $("#statMultiBoardsCard").hidden=false;
}
function updateMultiBoardStats(){
  const byPerson=new Map();
  for(const a of state.data.appointments){if(!byPerson.has(a.person_id))byPerson.set(a.person_id,[]);byPerson.get(a.person_id).push(a)}
  state.multiBoardPeople=new Map([...byPerson].filter(([,appointments])=>appointments.length>1));
}
function renderFilters(){
  const centralAuthorityCounts=new Map();
  for(const i of state.institutions){if(!i.supervising_authority||isLocalAuthority(i))continue;centralAuthorityCounts.set(i.supervising_authority,(centralAuthorityCounts.get(i.supervising_authority)||0)+1)}
  const centralAuthorities=[...centralAuthorityCounts].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0],"ro",{sensitivity:"base"}));
  const centralCount=state.institutions.filter(i=>!isLocalAuthority(i)).length;
  const unspecifiedCentral=state.institutions.filter(i=>!isLocalAuthority(i)&&!i.supervising_authority).length;
  const authorityOptions=[["__central__",`Toate autoritățile tutelare (${fmt.format(centralCount)})`],...(unspecifiedCentral?[["__central_unspecified__",`Autoritate centrală neprecizată (${fmt.format(unspecifiedCentral)})`]]:[]),...centralAuthorities.map(([name,count])=>[name,`${name} (${fmt.format(count)})`])];
  $("#authoritySelect").innerHTML=authorityOptions.map(([value,label])=>`<option value="${escapeHtml(value)}">${escapeHtml(label)}</option>`).join("");
  $("#authoritySelect").value=state.authority;
  const coverages=[['','Orice tip de date'],['cv','Are CV-uri'],['income','Are venituri declarate'],['multi_boards','Persoane cu cumul de funcții']];
  $("#coverageList").innerHTML=coverages.map(([value,label])=>`<button class="filter-option ${state.coverage===value?"active":""}" type="button" data-coverage="${value}"><strong>${label}</strong></button>`).join("");
}
function bind(){
  $("#searchInput").addEventListener("input",e=>{state.query=e.target.value;state.selectedPersonName="";const url=new URL(location.href);url.searchParams.delete("person");history.replaceState(null,"",url);state.visible=18;render()});
  $("#sortSelect").addEventListener("change",e=>{if(state.activeTab==="people"){const [key,direction]=e.target.value.split(":");state.peopleSort=key;state.peopleSortDirection=Number(direction)}else state.sort=e.target.value;state.visible=18;render()});
  $("#resetFilters").addEventListener("click",resetFilters);
  $("#authoritySelect").addEventListener("change",e=>{state.authority=e.target.value;state.visible=18;renderStats();render()});
  $("#coverageList").addEventListener("click",e=>{const b=e.target.closest("[data-coverage]");if(!b)return;state.coverage=b.dataset.coverage;state.visible=18;renderFilters();render()});
  $$(".tab").forEach(tab=>tab.addEventListener("click",()=>{state.activeTab=tab.dataset.tab;state.visible=18;$$('.tab').forEach(t=>t.classList.toggle('active',t===tab));render()}));
  $("#loadMore").addEventListener("click",()=>{state.visible+=18;render()});
  $("#resultsGrid").addEventListener("click",e=>{const sortButton=e.target.closest("[data-people-sort]");if(sortButton){const key=sortButton.dataset.peopleSort;if(state.peopleSort===key)state.peopleSortDirection*=-1;else{state.peopleSort=key;state.peopleSortDirection=key==="name"?1:-1}state.visible=18;render();return}const target=e.target.closest("[data-person-search]");if(!target)return;e.preventDefault();searchPerson(target.dataset.personSearch||target.textContent)});
  $("#downloadCsv").addEventListener("click",downloadCsv);
  $("#dialogClose").addEventListener("click",()=>{$("#institutionDialog").close();history.replaceState(null,"",location.pathname+location.search)});
  $("#institutionDialog").addEventListener("click",e=>{if(e.target===$("#institutionDialog"))$("#dialogClose").click()});
  $("#dialogContent").addEventListener("click",e=>{const target=e.target.closest("[data-person-search]");if(!target)return;e.preventDefault();searchPerson(target.dataset.personSearch||target.textContent)});
  document.addEventListener("click",e=>{const target=e.target.closest("[data-document-url]");if(!target)return;e.preventDefault();openDocument(target.dataset.documentUrl,target.dataset.documentTitle||"Document")});
  $("#documentDialogClose").addEventListener("click",closeDocument);
  $("#documentDialog").addEventListener("click",e=>{if(e.target===$("#documentDialog"))closeDocument()});
  $("#documentDialog").addEventListener("close",resetDocumentViewer);
  $("#pdfPrevious").addEventListener("click",()=>changePdfPage(-1));
  $("#pdfNext").addEventListener("click",()=>changePdfPage(1));
  $("#pdfZoomOut").addEventListener("click",()=>changePdfZoom(-.2));
  $("#pdfZoomIn").addEventListener("click",()=>changePdfZoom(.2));
  document.addEventListener("keydown",handleDocumentKeys);
  window.addEventListener("resize",()=>{if(!pdfViewerState.pdf||!$("#documentDialog").open)return;clearTimeout(pdfViewerState.resizeTimer);pdfViewerState.resizeTimer=setTimeout(()=>renderPdfPage(),180)});
  window.addEventListener("hashchange",openFromHash);
}
function resetFilters(){state.query="";state.selectedPersonName="";state.authority="__central__";state.coverage="";state.sort="multi_boards";state.peopleSort="income";state.peopleSortDirection=-1;state.visible=18;$("#searchInput").value="";const url=new URL(location.href);url.searchParams.delete("person");history.replaceState(null,"",url);renderStats();renderFilters();render()}
function matchesAuthority(i){return!state.authority||(state.authority==="__central__"&&!isLocalAuthority(i))||(state.authority==="__local__"&&isLocalAuthority(i))||(state.authority==="__central_unspecified__"&&!isLocalAuthority(i)&&!i.supervising_authority)||(state.authority==="__local_unspecified__"&&isLocalAuthority(i)&&!i.supervising_authority)||i.supervising_authority===state.authority}
function matchesInstitution(i){
  const appts=state.appointments.get(i.id)||[];
  const people=appts.map(a=>state.people.get(a.person_id)?.full_name||"").join(" ");
  const haystack=clean(`${i.name} ${i.supervising_authority||""} ${people}`);
  const q=clean(state.query);
  const searchOk=!q||q.split(/\s+/).every(t=>haystack.includes(t));
  const authorityOk=matchesAuthority(i);
  const coverageOk=!state.coverage||(state.coverage==="cv"&&i.metrics.local_cvs>0)||(state.coverage==="income"&&i.metrics.compensation_records>0)||(state.coverage==="multi_boards"&&multiBoardAppointmentsForInstitution(i.id).length>0);
  return searchOk&&authorityOk&&coverageOk;
}
function filteredInstitutions(){
  const rows=state.institutions.filter(matchesInstitution);
  const maxGross=i=>Math.max(0,...(state.appointments.get(i.id)||[]).map(a=>a.compensation?.gross_ron||0));
  const multiCount=i=>multiBoardAppointmentsForInstitution(i.id).length;
  const sorters={members:(a,b)=>(b.metrics.members-a.metrics.members)||byName(a,b),cvs:(a,b)=>(b.metrics.local_cvs-a.metrics.local_cvs)||byName(a,b),income_count:(a,b)=>(b.metrics.compensation_records-a.metrics.compensation_records)||byName(a,b),multi_boards:(a,b)=>(multiCount(b)-multiCount(a))||(b.metrics.members-a.metrics.members)||byName(a,b),gross:(a,b)=>(maxGross(b)-maxGross(a))||byName(a,b),az:byName,za:(a,b)=>byName(b,a)};
  return rows.sort(sorters[state.sort]||sorters.members);
}
function filteredPeople(){
  const institutions=filteredInstitutions();
  const allowed=new Set(institutions.map(i=>i.id));
  const rows=[];
  for(const p of state.people.values()){
    const appts=state.data.appointments.filter(a=>a.person_id===p.id&&allowed.has(a.institution_id));
    if(!appts.length)continue;
    if(state.query&&!clean(p.full_name).includes(clean(state.query))&&!appts.some(a=>clean(institutionName(a.institution_id)).includes(clean(state.query))))continue;
    rows.push({person:p,appointments:appts});
  }
  return rows.sort(comparePeople);
}
function appointmentIncome(a){const c=a.compensation||{};if(c.gross_ron!=null)return{amount:Number(c.gross_ron)||0,type:"BRUT",period:c.period,currency:"RON"};if(c.net_ron!=null)return{amount:Number(c.net_ron)||0,type:"NET",period:c.period,currency:"RON"};if(c.net_eur!=null)return{amount:Number(c.net_eur)||0,type:"NET",period:c.period,currency:"EUR"};return null}
function personSummary(row){const companies=new Set(row.appointments.map(a=>a.institution_id));const boards=new Set(row.appointments.filter(isBoardAppointment).map(a=>a.institution_id));const incomes=row.appointments.map(appointmentIncome).filter(Boolean);return{companies:companies.size,boards:boards.size,total:incomes.reduce((sum,x)=>sum+(x.currency==="RON"?x.amount:0),0),incomeCount:incomes.length}}
function comparePeople(a,b){const am=personSummary(a),bm=personSummary(b);const values={name:[a.person.full_name,b.person.full_name],functions:[a.appointments.length,b.appointments.length],companies:[am.companies,bm.companies],boards:[am.boards,bm.boards],income:[am.total,bm.total]};const [av,bv]=values[state.peopleSort]||values.functions;const base=typeof av==="number"?av-bv:String(av).localeCompare(String(bv),"ro",{sensitivity:"base",numeric:true});return base*state.peopleSortDirection||a.person.full_name.localeCompare(b.person.full_name,"ro",{sensitivity:"base"})}
function renderSortSelect(){const select=$("#sortSelect");const mode=state.activeTab;const companyOptions=[['multi_boards','Cumul de funcții'],['gross','Venitul brut cel mai mare'],['az','Denumire A-Z'],['za','Denumire Z-A']];const peopleOptions=[['functions:-1','Cele mai multe funcții'],['income:-1','Venitul total lunar cel mai mare'],['companies:-1','Cele mai multe companii'],['name:1','Nume A-Z'],['name:-1','Nume Z-A']];if(select.dataset.mode!==mode){const options=mode==="people"?peopleOptions:companyOptions;select.innerHTML=options.map(([value,label])=>`<option value="${value}">${label}</option>`).join("");select.dataset.mode=mode}select.value=mode==="people"?`${state.peopleSort}:${state.peopleSortDirection}`:state.sort;select.hidden=false}
function render(){
  const rows=state.activeTab==="people"?filteredPeople():filteredInstitutions();
  $("#pageTitle").textContent=state.selectedPersonName?personName(state.selectedPersonName):"guvernanta.gov.ro";
  $("#resultCount").textContent=`${fmt.format(rows.length)} ${rows.length===1?"rezultat":"rezultate"}`;
  $("#statsStrip").hidden=Boolean(state.selectedPersonName);
  renderSortSelect();
  const visible=rows.slice(0,state.visible);
  $("#resultsGrid").classList.toggle("people-table-view",state.activeTab==="people");
  $("#resultsGrid").innerHTML=visible.length?(state.activeTab==="people"?peopleTable(visible):visible.map(institutionCard).join("")):`<div class="empty-state"><h3>Niciun rezultat</h3><p>Încearcă o căutare mai scurtă sau elimină filtrele.</p></div>`;
  $("#resultsGrid").querySelectorAll("[data-institution-id]").forEach(el=>el.addEventListener("click",e=>{if(e.target.closest('a,button.position-link'))return;location.hash=`institutie=${el.dataset.institutionId}`}));
  $("#resultsGrid").querySelectorAll(".position-link").forEach(el=>el.addEventListener("click",()=>{location.hash=`institutie=${el.dataset.institutionId}`}));
  $("#loadMore").hidden=Boolean(state.selectedPersonName)||rows.length<=state.visible;
}
function institutionCard(i){
  const m=i.metrics;const overlaps=multiBoardAppointmentsForInstitution(i.id);const overlapNames=overlaps.map(a=>state.people.get(a.person_id)?.full_name).filter(Boolean).map(personName).sort((a,b)=>a.localeCompare(b,"ro",{sensitivity:"base"}));
  const overlapBadge=overlaps.length?`<span class="badge overlap" title="${escapeHtml(overlapNames.join("\n"))}">${overlaps.length} ${overlaps.length===1?"persoană":"persoane"} cumul de funcții</span>`:"";
  return `<article class="company-card" data-institution-id="${i.id}" tabindex="0"><div class="card-top">${institutionLogo(i)}<div class="card-heading"><h3>${escapeHtml(i.name)}</h3><p class="authority">${escapeHtml(authorityLabel(i))}</p></div><button class="arrow" type="button" aria-label="Deschide fișa">↗</button></div><div class="badges">${i.county?`<span class="badge">${escapeHtml(i.county)}</span>`:""}<span class="badge">${m.members} ${m.members===1?"funcție":"funcții"}</span><span class="badge ${m.local_cvs?"cv":"empty"}">${m.local_cvs} CV</span><span class="badge ${m.compensation_records?"income":"empty"}">${m.compensation_records} venituri</span>${overlapBadge}</div></article>`;
}
function institutionLogo(i,large=false){const className=`initials${i.assets?.logo?" has-logo":""}${large?" dialog-logo":""}`;return i.assets?.logo?`<span class="${className}"><img src="${escapeHtml(assetUrl(i.assets.logo.url))}" alt="Logo ${escapeHtml(i.name)}" loading="lazy" decoding="async"></span>`:`<span class="${className}">${escapeHtml(initials(i.name))}</span>`}
function documentLink(file,label){return`<button class="company-document" type="button" title="${escapeHtml(file.name)}" data-document-url="${escapeHtml(assetUrl(file.url))}" data-document-title="${escapeHtml(file.name)}"><span>Document al companiei</span><strong>${escapeHtml(label)}</strong><em>Vizualizează ↗</em></button>`}
function annualRemunerationReportLabel(file){const match=String(file?.name||"").match(/(?:^|\D)(2024|2026)(?!\d)/);return`Raportul anual de remunerație pentru ${match?match[1]:"2025"}`}
function institutionDocuments(i){const reports=i.assets?.annual_remuneration_reports||[],templates=i.assets?.mandate_templates||[];if(!reports.length&&!templates.length)return"";return`<div class="company-documents">${reports.map(file=>documentLink(file,annualRemunerationReportLabel(file))).join("")}${templates.map(file=>documentLink(file,`${mandateDocumentLabel(file)} — model`)).join("")}</div>`}
function politicalLabel(value){const label=String(value||"").trim();if(!label)return"Nespecificat";return /^fără apartenență politică$/i.test(label)?"Fără":label}
function politicalHref(personName){return`politic.html?${new URLSearchParams({person:personName})}`}
function politicalAffiliationMarkup(value,personName){const label=politicalLabel(value);return label==="Fără"?`<span>Apartenență politică: Fără</span>`:`<a class="member-political" href="${escapeHtml(politicalHref(personName))}">Apartenență politică: ${escapeHtml(label)} ↗</a>`}
function peopleSortHeading(key,label){const active=state.peopleSort===key;return`<button type="button" class="people-sort ${active?"active":""}" data-people-sort="${key}">${label}<span>${active?(state.peopleSortDirection===1?"↑":"↓"):"↕"}</span></button>`}
function periodText(period){return period==="monthly"?"/ lună":period==="annual"?"/ an":period==="per_meeting"?"/ ședință":""}
function peopleTable(people){return`<div class="people-table-scroll"><table class="people-table"><thead><tr><th>#</th><th>${peopleSortHeading("name","Persoană")}</th><th>${peopleSortHeading("functions","Funcții și companii")}</th><th>${peopleSortHeading("functions","Funcții")}</th><th>${peopleSortHeading("income","Venit total lunar")}</th></tr></thead><tbody>${people.map((row,index)=>personTableRow(row,index)).join("")}</tbody></table></div>`}
function personTableRow(row,index){const p=row.person;const summary=personSummary(row);const functionCount=row.appointments.length;const positions=[...row.appointments].sort(sortAppointments).map(a=>{const income=appointmentIncome(a);const incomeMoney=income?(income.currency==="EUR"?euro:money).format(income.amount):null;return`<div class="person-position"><button class="position-company" type="button" data-institution-id="${a.institution_id}"><strong>${escapeHtml(institutionName(a.institution_id))}</strong><span>${escapeHtml(a.role?.label||"Funcție neprecizată")}</span></button><span class="position-income">${income?`${incomeMoney} <small>${income.type} ${periodText(income.period)}</small>`:"În lucru"}</span></div>`}).join("");const segments=Array.from({length:3},(_,i)=>`<i class="${i<Math.min(functionCount,3)?"active":""}"></i>`).join("");return`<tr><td class="person-rank">${String(index+1).padStart(2,"0")}</td><td class="person-identity"><button class="person-table-name" type="button" data-person-search="${escapeHtml(p.full_name)}">${escapeHtml(personName(p.full_name))}</button><span>${functionCount} ${functionCount===1?"funcție":"funcții"} în ${summary.companies} ${summary.companies===1?"companie":"companii"}</span></td><td><div class="person-positions">${positions}</div></td><td><div class="board-meter"><div>${segments}</div><strong>${functionCount} ${functionCount===1?"funcție":"funcții"}</strong></div></td><td class="person-total">${summary.total?`<strong>${money.format(summary.total)}</strong><span>TOTAL LUNAR DECLARAT ÎN RON</span>`:"<strong>În lucru</strong><span>VENIT ÎN CURS DE COMPLETARE</span>"}</td></tr>`}
function institutionName(id){return state.institutions.find(i=>i.id===id)?.name||"Companie neidentificată"}
function multiBoardTooltip(personId){const appointments=state.multiBoardPeople.get(personId);if(!appointments)return"";const ids=[...new Set(appointments.map(a=>a.institution_id))];return ids.map(institutionName).filter(Boolean).sort((a,b)=>a.localeCompare(b,"ro",{sensitivity:"base"})).join("\n")}
function multiBoardAppointmentsForInstitution(institutionId){const seen=new Set();return(state.appointments.get(institutionId)||[]).filter(a=>{if(!state.multiBoardPeople.has(a.person_id)||seen.has(a.person_id))return false;seen.add(a.person_id);return true})}
function searchPerson(name){state.query=name;state.selectedPersonName=name;state.visible=18;state.activeTab="people";$("#searchInput").value=name;$$('.tab').forEach(t=>t.classList.toggle('active',t.dataset.tab==='people'));$("#institutionDialog").close();const url=new URL(location.href);url.searchParams.set("person",name);url.searchParams.delete("tab");url.hash="";history.replaceState(null,"",url);render();$(".content")?.scrollIntoView({behavior:"smooth",block:"start"})}
function rolePriority(a){const category=a.role?.category||"other";const label=clean(a.role?.label||"");const vice=/vicepre[sșş]edint/.test(label);const boardContext=/consili|administra|supraveghere|\bc\.?a\.?\b|\bc\.?s\.?\b/.test(label);const member=/me\w{0,3}mbru/.test(label);if((category==="board_chair"&&!vice)||(/pre[sșş]edint/.test(label)&&boardContext&&!vice))return 0;if(category==="board_member"||vice&&boardContext||/administrator/.test(label)||member&&(boardContext||label==="membru"))return 1;if(/director(?:ul)? general|general manager|pre[sșş]edinte directorat/.test(label))return 2;if(/director (financiar|economic)|chief financial officer|\bc\.?f\.?o\.?\b/.test(label))return 3;if(["executive_director","director","executive"].includes(category)||/\bdirector\b|\bmanager\b|[sșş]ef serviciu/.test(label))return 4;return 5}
function sortAppointments(a,b){const priority=rolePriority(a)-rolePriority(b);if(priority)return priority;const roleName=(a.role?.label||"").localeCompare(b.role?.label||"","ro",{sensitivity:"base"});if(roleName)return roleName;return(state.people.get(a.person_id)?.full_name||"").localeCompare(state.people.get(b.person_id)?.full_name||"","ro",{sensitivity:"base"})}
function openFromHash(){const id=decodeURIComponent(location.hash.replace("#institutie=",""));if(!location.hash.startsWith("#institutie=")||!state.data)return;const inst=state.institutions.find(x=>x.id===id);if(inst)openInstitution(inst)}
function institutionHeaderDetails(i){const parts=[authorityLabel(i)];if(i.county)parts.push(`Județ ${i.county}`);if(i.cui)parts.push(`CUI ${i.cui}`);if(i.incorporation_date)parts.push(`Înființată ${new Date(`${i.incorporation_date}T00:00:00`).toLocaleDateString("ro-RO")}`);return parts.map(escapeHtml).join(" · ")}
function openInstitution(i){const appts=(state.appointments.get(i.id)||[]).sort(sortAppointments),documents=institutionDocuments(i),cumulativeFunctions=multiBoardAppointmentsForInstitution(i.id).length;$("#dialogContent").innerHTML=`<header class="dialog-header"><div class="dialog-company-title">${institutionLogo(i,true)}<div><p class="kicker">Fișa companiei</p><h2 id="dialogTitle">${escapeHtml(i.name)}</h2><p>${institutionHeaderDetails(i)}</p></div></div><div class="dialog-summary"><span class="badge">${appts.length} funcții</span><span class="badge cv">${i.metrics.local_cvs} CV-uri</span><span class="badge income">${i.metrics.compensation_records} venituri</span>${cumulativeFunctions?`<span class="badge overlap">${cumulativeFunctions} ${cumulativeFunctions===1?"persoană":"persoane"} cumul de funcții</span>`:""}${i.operational_status?`<span class="badge">${escapeHtml(i.operational_status)}</span>`:""}${documents?`<button class="badge document-jump" type="button" data-scroll-documents>Documentele companiei ↓</button>`:""}</div></header><section class="member-list"><h3>Consiliu și conducere</h3>${appts.length?appts.map(member).join(""):`<p class="empty-state">Nu există persoane înregistrate pentru această companie.</p>`}</section>${documents?`<section class="dialog-documents" id="companyDocuments"><h3>Documentele companiei</h3>${documents}</section>`:""}`;if(!$("#institutionDialog").open)$("#institutionDialog").showModal();$("[data-scroll-documents]")?.addEventListener("click",()=>$("#companyDocuments")?.scrollIntoView({behavior:"smooth",block:"start"}))}
function mandateDocumentParts(file={}){const name=file.name||"",tokens=name.replace(/\.[^.]+$/,"").split(/[_\s-]+/).map(token=>token.toUpperCase()),additional=tokens.find(token=>/^AA\d*$/.test(token));return{name,tokens,additional,additionalNumber:additional&&additional!=="AA"?Number(additional.slice(2)):0}}
function visibleMandateContracts(files=[]){return[...files].sort((a,b)=>{const left=mandateDocumentParts(a),right=mandateDocumentParts(b),typeOrder=Number(Boolean(left.additional))-Number(Boolean(right.additional));if(typeOrder)return typeOrder;if(left.additional&&right.additional&&left.additionalNumber!==right.additionalNumber)return left.additionalNumber-right.additionalNumber;return left.name.localeCompare(right.name,"ro",{numeric:true,sensitivity:"base"})})}
function mandateDocumentLabel(file={}){const{tokens,additional}=mandateDocumentParts(file),roles={CA:"Consiliu de administrație",CS:"Consiliu de Supraveghere",DE:"Director economic",DF:"Director financiar",DG:"Director general",MD:"Membru Directorat",DIRECTORAT:"Directorat"},role=Object.keys(roles).find(code=>tokens.some(token=>new RegExp(`^${code}(?:\\d+|\\(\\d+\\))?$`).test(token))),provisional=role==="CA"&&tokens.some(token=>/^PROVIZOR/.test(token)),roleLabel=role?`${roles[role]}${provisional?" provizoriu":""}`:"",type=additional?`Act adițional${additional==="AA"?"":` ${additional}`}`:"Contract de mandat";return role?`${type} — ${roleLabel}`:type}
function member(a){const knownPerson=state.people.get(a.person_id);const p=knownPerson||{full_name:"Persoană neidentificată"};const c=a.compensation||{};const hasIncome=c.gross_ron!=null||c.net_ron!=null||c.net_eur!=null;const periodLabel=c.period==="monthly"?"PE LUNĂ":c.period==="annual"?"PE AN":c.period==="per_meeting"?"PE ȘEDINȚĂ":null;const income=hasIncome?`<div class="income-box">${c.net_ron!=null?`<div class="income-row"><strong>${money.format(c.net_ron)}</strong><span>NET</span></div>`:""}${c.net_eur!=null?`<div class="income-row"><strong>${euro.format(c.net_eur)}</strong><span>NET</span></div>`:""}${c.gross_ron!=null?`<div class="income-row"><strong>${money.format(c.gross_ron)}</strong><span>BRUT</span></div>`:""}${periodLabel?`<span class="income-period">${periodLabel}</span>`:""}</div>`:"";const local=a.cv?.local_url?`<button class="cv-link" type="button" data-document-url="${escapeHtml(assetUrl(a.cv.local_url))}" data-document-title="CV — ${escapeHtml(personName(p.full_name))}">CV ↗</button>`:"";const contracts=visibleMandateContracts(a.mandate_contracts||[]).map(file=>`<button class="cv-link contract" type="button" data-document-url="${escapeHtml(assetUrl(file.url))}" data-document-title="${escapeHtml(file.name)}">${mandateDocumentLabel(file)} ↗</button>`).join("");const functionCount=state.multiBoardPeople.get(a.person_id)?.length||0;const multiBoard=functionCount>1?`<span class="badge overlap" title="${escapeHtml(multiBoardTooltip(a.person_id))}">ocupă ${functionCount} funcții</span>`:"";const displayName=personName(p.full_name);const name=knownPerson?`<button class="member-search" type="button" data-person-search="${escapeHtml(p.full_name)}" title="Vezi profilul și funcțiile ocupate de ${escapeHtml(displayName)}">${escapeHtml(displayName)}</button>`:escapeHtml(displayName);const mandateLabel=a.notes||"Mandat până la: Nespecificat";return`<article class="member"><div><div class="member-name">${name}${multiBoard}</div><div class="member-role">${escapeHtml(a.role?.label||"Funcție neprecizată")}</div><div class="member-meta">${politicalAffiliationMarkup(a.political_affiliation,p.full_name)}<span>${escapeHtml(mandateLabel)}</span></div></div><div class="member-actions">${income}${local}${contracts}</div></article>`}

async function openDocument(url,title){
  const absoluteUrl=new URL(url,location.href).href;
  const isPdf=/\.pdf(?:$|[?#])/i.test(absoluteUrl);
  const isOffice=/\.docx?(?:$|[?#])/i.test(absoluteUrl);
  $("#documentDialogTitle").textContent=title;
  if(!$("#documentDialog").open)$("#documentDialog").showModal();
  if(isPdf){await openPdfDocument(absoluteUrl);return}
  $("#pdfViewer").hidden=true;
  $("#documentFrame").hidden=false;
  $("#documentFrame").src=isOffice&&!/^(localhost|127\.0\.0\.1)$/i.test(location.hostname)?`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(absoluteUrl)}`:absoluteUrl;
}
async function openPdfDocument(url){
  const generation=++pdfViewerState.generation;
  pdfViewerState.url=url;pdfViewerState.pageNumber=1;pdfViewerState.zoom=1;pdfViewerState.pdf=null;
  const download=$("#pdfDownload");download.href=url;download.download=decodeURIComponent(new URL(url).pathname.split("/").pop()||"document.pdf");
  $("#documentFrame").hidden=true;$("#documentFrame").src="about:blank";
  $("#pdfViewer").hidden=false;$("#pdfCanvas").hidden=true;$("#pdfLoading").hidden=false;$("#pdfError").hidden=true;
  $("#pdfPageNumber").textContent="1";$("#pdfPageCount").textContent="–";updatePdfControls();
  $("#pdfFallbackLink").href=url;
  try{
    if(!pdfViewerState.module){pdfViewerState.module=await import("./vendor/pdfjs/pdf.min.mjs");pdfViewerState.module.GlobalWorkerOptions.workerSrc="./vendor/pdfjs/pdf.worker.min.mjs"}
    const pdf=await pdfViewerState.module.getDocument({url}).promise;
    if(generation!==pdfViewerState.generation){pdf.destroy();return}
    pdfViewerState.pdf=pdf;$("#pdfPageCount").textContent=String(pdf.numPages);await renderPdfPage();
  }catch(error){if(generation!==pdfViewerState.generation)return;console.error("PDF viewer:",error);$("#pdfLoading").hidden=true;$("#pdfCanvas").hidden=true;$("#pdfError").hidden=false;updatePdfControls()}
}
async function renderPdfPage(){
  const pdf=pdfViewerState.pdf;if(!pdf)return;
  const generation=pdfViewerState.generation,renderSequence=++pdfViewerState.renderSequence;
  try{
    if(pdfViewerState.renderTask){pdfViewerState.renderTask.cancel();pdfViewerState.renderTask=null}
    $("#pdfLoading").hidden=false;$("#pdfError").hidden=true;
    const page=await pdf.getPage(pdfViewerState.pageNumber);if(generation!==pdfViewerState.generation||renderSequence!==pdfViewerState.renderSequence)return;
    const baseViewport=page.getViewport({scale:1});
    const availableWidth=Math.max(260,$("#pdfViewport").clientWidth-36);
    const fitScale=Math.min(2,availableWidth/baseViewport.width);
    const cssScale=fitScale*pdfViewerState.zoom;
    const pixelRatio=Math.min(window.devicePixelRatio||1,2);
    const renderViewport=page.getViewport({scale:cssScale*pixelRatio});
    const canvas=$("#pdfCanvas"),context=canvas.getContext("2d",{alpha:false});
    canvas.width=Math.floor(renderViewport.width);canvas.height=Math.floor(renderViewport.height);
    canvas.style.width=`${Math.floor(renderViewport.width/pixelRatio)}px`;canvas.style.height=`${Math.floor(renderViewport.height/pixelRatio)}px`;
    pdfViewerState.renderTask=page.render({canvasContext:context,viewport:renderViewport});
    await pdfViewerState.renderTask.promise;if(generation!==pdfViewerState.generation||renderSequence!==pdfViewerState.renderSequence)return;
    pdfViewerState.renderTask=null;canvas.hidden=false;$("#pdfLoading").hidden=true;$("#pdfPageNumber").textContent=String(pdfViewerState.pageNumber);updatePdfControls();
  }catch(error){if(error?.name==="RenderingCancelledException")return;console.error("PDF page:",error);$("#pdfLoading").hidden=true;$("#pdfError").hidden=false}
}
function changePdfPage(delta){if(!pdfViewerState.pdf)return;const next=Math.min(pdfViewerState.pdf.numPages,Math.max(1,pdfViewerState.pageNumber+delta));if(next===pdfViewerState.pageNumber)return;pdfViewerState.pageNumber=next;$("#pdfViewport").scrollTo({top:0,left:0});renderPdfPage()}
function changePdfZoom(delta){if(!pdfViewerState.pdf)return;pdfViewerState.zoom=Math.min(2.4,Math.max(.6,Math.round((pdfViewerState.zoom+delta)*10)/10));renderPdfPage();updatePdfControls()}
function updatePdfControls(){const pdf=pdfViewerState.pdf;$("#pdfPrevious").disabled=!pdf||pdfViewerState.pageNumber<=1;$("#pdfNext").disabled=!pdf||pdfViewerState.pageNumber>=pdf.numPages;$("#pdfZoomOut").disabled=!pdf||pdfViewerState.zoom<=.6;$("#pdfZoomIn").disabled=!pdf||pdfViewerState.zoom>=2.4}
function handleDocumentKeys(event){if(!$("#documentDialog").open||$("#pdfViewer").hidden)return;if(event.key==="ArrowLeft"||event.key==="PageUp"){event.preventDefault();changePdfPage(-1)}else if(event.key==="ArrowRight"||event.key==="PageDown"){event.preventDefault();changePdfPage(1)}}
function resetDocumentViewer(){pdfViewerState.generation++;pdfViewerState.renderSequence++;if(pdfViewerState.renderTask){pdfViewerState.renderTask.cancel();pdfViewerState.renderTask=null}if(pdfViewerState.pdf){pdfViewerState.pdf.destroy();pdfViewerState.pdf=null}$("#documentFrame").src="about:blank";$("#documentFrame").hidden=true;$("#pdfViewer").hidden=true;$("#pdfCanvas").hidden=true}
function closeDocument(){if($("#documentDialog").open)$("#documentDialog").close()}
function downloadCsv(){const rows=filteredInstitutions();const lines=[["Companie","Autoritate","Functii","CV-uri","Venituri","Persoane cu cumul de functii"],...rows.map(i=>[i.name,i.supervising_authority||"",i.metrics.members,i.metrics.local_cvs,i.metrics.compensation_records,multiBoardAppointmentsForInstitution(i.id).length])];const csv=lines.map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(",")).join("\n");const blob=new Blob([csv],{type:"text/csv;charset=utf-8"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download="registrul-companiilor-de-stat.csv";a.click();URL.revokeObjectURL(url)}
init().catch(error=>{$("#resultsGrid").innerHTML=`<div class="empty-state"><h3>Datele nu au putut fi încărcate</h3><p>${escapeHtml(error.message)} Pornește site-ul prin server local.</p></div>`});
