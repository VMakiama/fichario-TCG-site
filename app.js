const SUPABASE_URL="https://szfvykbrbndvtvphsfah.supabase.co";
const SUPABASE_KEY="sb_publishable_Hqzo80yfzjTExrGauXIu4w_2vtEehYU";
const sb=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY,{auth:{persistSession:true,detectSessionInUrl:true,flowType:"implicit"}});

let SETS=[],SETBY={},CAT={};
const $=s=>document.querySelector(s);
const fmt=v=>v==null||isNaN(v)?"—":Number(v).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
const fmtK=v=>v==null?"—":(v>=10000?"R$ "+(v/1000).toLocaleString("pt-BR",{maximumFractionDigits:1})+" mil":fmt(v));
const pct=v=>(v>0?"+":"")+v.toLocaleString("pt-BR",{maximumFractionDigits:1})+"%";
const today=()=>{const d=new Date(new Date().toLocaleString("en-US",{timeZone:"America/Sao_Paulo"}));return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0")};
const br=d=>d?d.slice(8,10)+"/"+d.slice(5,7)+"/"+d.slice(0,4):"";
const parseMoney=s=>{if(!s)return NaN;s=String(s).replace(/[^\d,.-]/g,"");if(s.includes(","))s=s.replace(/\./g,"").replace(",",".");return parseFloat(s)};
const cardsOf=sid=>CAT[sid]||[];
const key=(s,n)=>s+"|"+n;

let state={owned:{},prices:{},pdate:null,base:{},bdate:null,history:[],tab:"resumo",set:null,filter:"all",q:"",wset:"ALL",sel:new Set(),ready:false};
try{const t=localStorage.getItem("fh-tab");if(t)state.tab=t;state.set=localStorage.getItem("fh-set")}catch(e){}

function thumbStyle(sid,idx){const s=SETBY[sid];const c=idx%10,r=Math.floor(idx/10);const rows=s.rows;
  return `background-image:url(thumbs/${sid}.jpg);background-size:1000% ${rows*100}%;background-position:${c/9*100}% ${rows>1?r/(rows-1)*100:0}%`}
function ownedMap(sid){return state.owned[sid]||{}}
function isOwned(sid,n){return !!ownedMap(sid)[n]}
function price(sid,n){const p=state.prices[sid];return p&&p[n]!=null?p[n]:null}
function basePrice(sid,n){const o=ownedMap(sid)[n];if(o&&o.paid!=null)return o.paid;const b=state.base[sid];return b&&b[n]!=null?b[n]:null}

function totals(){let val=0,base=0,own=0,all=0,miss=0,missN=0,inv=0;const per={};
  for(const s of SETS){let sv=0,so=0,sm=0;const list=cardsOf(s.id);
    list.forEach(([n])=>{all++;const p=price(s.id,n);if(isOwned(s.id,n)){own++;so++;if(p!=null){val+=p;sv+=p;const b=basePrice(s.id,n);base+=b!=null?b:p}const o=ownedMap(s.id)[n];if(o.paid!=null)inv+=o.paid}else{missN++;if(p!=null){miss+=p;sm+=p}}});
    per[s.id]={own:so,all:list.length,val:sv,miss:sm}}
  return {val,base,own,all,miss,missN,inv,per}}

function renderResumo(){const t=totals();
  $("#h-total").textContent=state.pdate?fmt(t.val):"—";
  const d=t.val-t.base,dp=t.base?d/t.base*100:0;const el=$("#h-delta");
  if(!state.pdate){el.className="delta flat";el.textContent="Aguardando preços"}
  else{el.className="delta "+(Math.abs(d)<0.005?"flat":d>0?"up":"down");el.textContent=(d>=0?"▲ ":"▼ ")+fmt(Math.abs(d))+" ("+pct(dp)+") desde "+br(state.bdate)}
  $("#h-sub").textContent="Menor preço da LigaPokemon em português, estado NM"+(state.pdate?" · atualizado em "+br(state.pdate):"")+".";
  $("#s-cards").textContent=t.own+" / "+t.all;$("#s-miss").textContent=fmtK(t.miss);$("#s-inv").textContent=fmtK(t.inv);
  $("#sets").innerHTML=SETS.map(s=>{const p=t.per[s.id];const f=p.all?p.own/p.all:0;
    return `<button class="setrow" type="button" data-goset="${s.id}"><span class="code">${s.id}</span><span style="min-width:0"><span class="nm">${s.name}</span><span class="bar"><i class="${f>=1?"full":""}" style="width:${(f*100).toFixed(1)}%"></i></span><span class="meta">${p.own} de ${p.all} · faltam ${p.all-p.own}</span></span><span class="val">${fmtK(p.val)}<small>${p.all-p.own?"faltam "+fmtK(p.miss):"completa"}</small></span></button>`}).join("");
  renderSpark();renderMovers();renderBuys()}
function renderSpark(){const svg=$("#spark");const pts=state.history.filter(x=>x.total>0);
  if(pts.length<2){svg.innerHTML=`<text x="0" y="50" fill="var(--ink-3)" font-size="12">O gráfico ganha forma a partir da próxima atualização diária.</text>`;return}
  const W=320,H=84,pad=6;const vs=pts.map(p=>p.total);const mn=Math.min(...vs),mx=Math.max(...vs);const rng=mx-mn||1;
  const xy=pts.map((p,i)=>[i/(pts.length-1)*W,H-pad-(p.total-mn)/rng*(H-pad*2-14)]);
  const line=xy.map((q,i)=>(i?"L":"M")+q[0].toFixed(1)+" "+q[1].toFixed(1)).join(" ");const last=xy[xy.length-1];
  svg.innerHTML=`<defs><linearGradient id="sg" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="var(--accent)" stop-opacity=".28"/><stop offset="1" stop-color="var(--accent)" stop-opacity="0"/></linearGradient></defs>
  <line x1="0" x2="${W}" y1="${H-pad}" y2="${H-pad}" stroke="var(--line)"/><path d="${line} L${W} ${H-pad} L0 ${H-pad} Z" fill="url(#sg)"/><path d="${line}" fill="none" stroke="var(--accent)" stroke-width="2" vector-effect="non-scaling-stroke"/>
  <circle cx="${last[0]}" cy="${last[1]}" r="3.5" fill="var(--accent)"/><text x="0" y="11" fill="var(--ink-3)" font-size="10">${br(pts[0].date)}</text><text x="${W}" y="11" fill="var(--ink-3)" font-size="10" text-anchor="end">${br(pts[pts.length-1].date)}</text>`}
function cardRec(sid,n){return cardsOf(sid).find(c=>c[0]===n)}
function mini(sid,n){const c=cardRec(sid,n);return `<span class="mini" style="${thumbStyle(sid,c?c[3]:0)}"></span>`}
function nameOf(sid,n){const c=cardRec(sid,n);return c?(c[1]||c[2]):n}
function renderMovers(){const arr=[];for(const s of SETS)for(const n in ownedMap(s.id)){const p=price(s.id,n),b=basePrice(s.id,n);if(p!=null&&b)arr.push({s:s.id,n,p,b,d:(p-b)/b*100})}
  const up=arr.filter(a=>a.d>0.5).sort((a,b)=>b.d-a.d).slice(0,5),down=arr.filter(a=>a.d<-0.5).sort((a,b)=>a.d-b.d).slice(0,5);
  const row=a=>`<button class="li" type="button" data-card="${a.s}|${a.n}">${mini(a.s,a.n)}<span style="min-width:0"><span class="t">${nameOf(a.s,a.n)}</span><span class="s">${a.s} ${a.n} · era ${fmt(a.b)}</span></span><span class="r">${fmt(a.p)}<small class="${a.d>0?"up":"down"}">${pct(a.d)}</small></span></button>`;
  $("#m-up").innerHTML=up.length?up.map(row).join(""):`<div class="note">Nenhuma alta ainda.</div>`;
  $("#m-down").innerHTML=down.length?down.map(row).join(""):`<div class="note">Nenhuma queda ainda.</div>`}
function renderBuys(){const arr=[];for(const s of SETS)for(const [n,o] of Object.entries(ownedMap(s.id)))if(o.paid!=null)arr.push({s:s.id,n,o});
  arr.sort((a,b)=>(b.o.d||"").localeCompare(a.o.d||""));
  $("#buys").innerHTML=arr.length?arr.slice(0,30).map(a=>{const p=price(a.s,a.n);const d=p!=null?(p-a.o.paid):null;
    return `<button class="li" type="button" data-card="${a.s}|${a.n}">${mini(a.s,a.n)}<span style="min-width:0"><span class="t">${nameOf(a.s,a.n)}</span><span class="s">${br(a.o.d)} · pago ${fmt(a.o.paid)}</span></span><span class="r">${fmt(p)}${d!=null?`<small class="${d>=0?"up":"down"}">${d>=0?"+":"−"}${fmt(Math.abs(d))}</small>`:""}</span></button>`}).join(""):`<div class="note">Quando você registrar uma carta comprada, ela aparece aqui com o valor pago e quanto vale hoje.</div>`}

function renderChips(){$("#setchips").innerHTML=SETS.map(s=>`<button class="chip" type="button" data-set="${s.id}" aria-pressed="${s.id===state.set}">${s.short}</button>`).join("");
  document.querySelectorAll(".seg button").forEach(b=>b.setAttribute("aria-pressed",b.dataset.f===state.filter))}
function norm(s){return (s||"").normalize("NFD").replace(/[̀-ͯ]/g,"").toLowerCase()}
function renderGrid(){renderChips();const q=norm(state.q.trim());const sets=q?SETS:[SETBY[state.set]];let html="",shown=0,own=0,tot=0;
  for(const s of sets){cardsOf(s.id).forEach(c=>{const [n,pt,en,idx]=c;const o=isOwned(s.id,n);
    if(q&&!(norm(pt).includes(q)||norm(en).includes(q)||n.includes(q)||(s.id+" "+n).toLowerCase().includes(q)))return;
    tot++;if(o)own++;if(state.filter==="own"&&!o)return;if(state.filter==="miss"&&o)return;shown++;const p=price(s.id,n);
    html+=`<button class="pocket ${o?"own":"miss"}" type="button" data-card="${s.id}|${n}" aria-label="${(pt||en).replace(/"/g,"")} ${n}${o?"":" (falta)"}"><span class="slot"><span class="thumb" style="${thumbStyle(s.id,idx)}"></span></span><span class="cap"><span class="n">${q?s.id+" ":""}${n}</span><span class="p">${p!=null?fmt(p):"—"}</span></span></button>`})}
  const s=SETBY[state.set];
  $("#bhead").innerHTML=q?`<span><b>${shown}</b> resultado${shown===1?"":"s"} para “${state.q.trim()}”</span>`:`<span><b>${s.name}</b> · ${s.total?s.total+" no set principal":"promos"}</span><span>${own} de ${tot}</span>`;
  $("#grid").innerHTML=html||`<div class="empty" style="grid-column:1/-1"><b>Nada por aqui</b>${state.filter==="miss"?"Você já tem todas as cartas desta coleção.":"Tente outro nome ou número."}</div>`}

function wantList(){const arr=[];for(const s of SETS){if(state.wset!=="ALL"&&state.wset!==s.id)continue;cardsOf(s.id).forEach(c=>{if(!isOwned(s.id,c[0]))arr.push({s:s.id,n:c[0],i:c[3],name:c[1]||c[2],p:price(s.id,c[0])})})}
  return arr.sort((a,b)=>(b.p??-1)-(a.p??-1))}
function renderComprar(){const t=totals();$("#w-total").textContent=fmt(t.miss);$("#w-count").textContent=t.missN+" carta"+(t.missN===1?"":"s")+" faltando";
  $("#wchips").innerHTML=[{id:"ALL",short:"Todas"},...SETS].map(s=>`<button class="chip" type="button" data-wset="${s.id}" aria-pressed="${s.id===state.wset}">${s.short}</button>`).join("");
  const arr=wantList();
  $("#wlist").innerHTML=arr.length?arr.map(a=>{const k=key(a.s,a.n);return `<div class="wrow"><button class="ck" type="button" role="checkbox" aria-checked="${state.sel.has(k)}" data-sel="${k}" aria-label="Selecionar ${a.name}"></button><span class="mini" style="${thumbStyle(a.s,a.i)}"></span><button class="info" type="button" data-card="${k}"><span class="t" style="font-weight:600;display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${a.name}</span><span class="s" style="font-size:12px;color:var(--ink-3)">${SETBY[a.s].short} · ${a.n}${SETBY[a.s].total?"/"+String(SETBY[a.s].total).padStart(3,"0"):""}</span></button><span style="font-weight:700;white-space:nowrap">${a.p!=null?fmt(a.p):"sem anúncio"}</span></div>`}).join(""):`<div class="empty"><b>Coleção completa</b>Não falta nenhuma carta nesta seleção.</div>`;
  renderLot()}
function selTotal(){let s=0,n=0,unknown=0;for(const k of state.sel){const [sid,num]=k.split("|");const p=price(sid,num);n++;if(p==null)unknown++;else s+=p}return {s,n,unknown}}
function verdict(ask,ref){if(!(ask>0)||!(ref>0))return "";const d=(ask-ref)/ref*100;
  if(d<=-3)return `<span class="verdict good">${fmt(ref-ask)} abaixo da Liga (${pct(d)}). Bom negócio.</span>`;
  if(d<=5)return `<span class="verdict ok">Praticamente o preço da Liga (${pct(d)}).</span>`;
  return `<span class="verdict bad">${fmt(ask-ref)} acima da Liga (${pct(d)}). Contraproposta: ${fmt(ref*0.95)}.</span>`}
function renderLot(){const lot=$("#lot");if(state.tab!=="comprar"||!state.sel.size){lot.hidden=true;return}lot.hidden=false;
  const t=selTotal();$("#lot-sum").innerHTML=`<b>${t.n}</b> selecionada${t.n===1?"":"s"} · Liga ${fmt(t.s)}${t.unknown?` · ${t.unknown} sem preço`:""}`;
  $("#lot-verdict").innerHTML=verdict(parseMoney($("#lot-ask").value),t.s)}

let sheetKey=null;
function openCard(k){sheetKey=k;const [sid,n]=k.split("|");const s=SETBY[sid];const c=cardRec(sid,n);if(!c)return;const [,pt,en,idx]=c;
  const o=ownedMap(sid)[n];const p=price(sid,n);const b=basePrice(sid,n);
  const num=n+(s.total?"/"+String(s.total).padStart(3,"0"):"");
  const ligaName=en+" ("+(s.total?num:n+"/∞")+")";
  const url="https://www.ligapokemon.com.br/?view=cards/card&card="+encodeURIComponent(ligaName)+"&ed="+sid+"&num="+n;
  let h=`<div class="cardtop"><span class="thumb" style="${thumbStyle(sid,idx)}"></span><div><div class="en">${s.name} · ${num}</div><h3>${pt||en}</h3>${pt&&pt!==en?`<div class="en">${en}</div>`:""}<span class="tag ${o?"own":"miss"}">${o?"No fichário":"Falta"}</span></div></div><dl class="kv"><dt>Menor preço na Liga hoje</dt><dd>${fmt(p)}</dd>`;
  if(o){h+=o.paid!=null?`<dt>Você pagou (${br(o.d)})</dt><dd>${fmt(o.paid)}</dd>`:`<dt>Valor em ${br(state.bdate)}</dt><dd>${fmt(b)}</dd>`;
    if(p!=null&&b){const d=p-b;h+=`<dt>Variação</dt><dd class="${d>0.004?"up":d<-0.004?"down":"flat"}">${d>=0?"+":"−"}${fmt(Math.abs(d))} (${pct(d/b*100)})</dd>`}}
  h+=`</dl>`;
  if(!o){h+=`<div class="box"><label for="ask">Quanto o vendedor está pedindo?</label><div class="field"><span>R$</span><input id="ask" inputmode="decimal" placeholder="${p!=null?p.toFixed(2).replace(".",","):"0,00"}"></div><div id="ask-v"></div></div><div class="actions"><button class="btn" type="button" id="do-buy">Comprei esta carta</button></div>`}
  else{h+=`<div class="box"><label for="paid">Valor pago ${o.paid!=null?"":"(opcional)"}</label><div class="field"><span>R$</span><input id="paid" inputmode="decimal" value="${o.paid!=null?o.paid.toFixed(2).replace(".",","):""}" placeholder="Não informado"></div></div><div class="actions"><button class="btn" type="button" id="do-save">Salvar valor</button><button class="btn danger" type="button" id="do-remove">Tirar do fichário</button></div><div id="confirm"></div>`}
  h+=`<a class="linkout" href="${url}" target="_blank" rel="noopener">Ver anúncios na LigaPokemon ↗</a>`;
  $("#sheet-body").innerHTML=h;$("#scrim").classList.add("on");$("#sheet").classList.add("on");
  const ask=$("#ask");if(ask)ask.addEventListener("input",()=>{$("#ask-v").innerHTML=verdict(parseMoney(ask.value),p)});
  const bb=$("#do-buy");if(bb)bb.onclick=()=>{const v=parseMoney(ask.value);const paid=v>0?v:p;if(!(paid>0)){toast("Informe o valor pago");ask.focus();return}buy([[sid,n,paid]])};
  const sv=$("#do-save");if(sv)sv.onclick=async()=>{const v=parseMoney($("#paid").value);const paid=v>0?Math.round(v*100)/100:null;
    const {error}=await sb.from("owned").update({paid,updated_at:new Date().toISOString()}).eq("set_id",sid).eq("num",n);if(error){toast("Não foi possível salvar. Tente de novo.");return}
    state.owned[sid][n]={...o,paid};closeSheet();renderAll();toast("Valor salvo")};
  const rm=$("#do-remove");if(rm)rm.onclick=()=>{$("#confirm").innerHTML=`<div class="box"><span>Tirar ${pt||en} ${n} do fichário?</span><div class="actions" style="margin-top:0"><button class="btn danger" type="button" id="do-remove2">Tirar</button><button class="btn ghost" type="button" id="do-cancel">Cancelar</button></div></div>`;
    $("#do-remove2").onclick=async()=>{const {error}=await sb.from("owned").delete().eq("set_id",sid).eq("num",n);if(error){toast("Não foi possível remover.");return}delete state.owned[sid][n];closeSheet();renderAll();toast("Carta removida do fichário")};
    $("#do-cancel").onclick=()=>{$("#confirm").innerHTML=""}}}
function closeSheet(){$("#scrim").classList.remove("on");$("#sheet").classList.remove("on");sheetKey=null}
async function buy(items){const d=today();const rows=items.map(([sid,n,paid])=>({set_id:sid,num:n,acquired_on:d,paid:Math.round(paid*100)/100,src:"compra"}));
  const {error}=await sb.from("owned").upsert(rows);if(error){toast("Não foi possível registrar. Tente de novo.");return}
  for(const r of rows){(state.owned[r.set_id]=state.owned[r.set_id]||{})[r.num]={d:r.acquired_on,paid:r.paid,src:"compra"};state.sel.delete(key(r.set_id,r.num))}
  closeSheet();renderAll();toast(items.length>1?items.length+" cartas registradas":"Carta registrada no fichário")}

let tt;function toast(m){const t=$("#toast");t.textContent=m;t.classList.add("on");clearTimeout(tt);tt=setTimeout(()=>t.classList.remove("on"),2200)}
function setTab(t){state.tab=t;try{localStorage.setItem("fh-tab",t)}catch(e){}
  document.querySelectorAll("main[data-view]").forEach(m=>m.hidden=m.dataset.view!==t);
  document.querySelectorAll("nav.tabs button").forEach(b=>{if(b.dataset.tab===t)b.setAttribute("aria-current","page");else b.removeAttribute("aria-current")});
  renderAll();window.scrollTo(0,0)}
function renderAll(){if(!state.ready)return;$("#stamp").innerHTML=state.pdate?`Liga · ${br(state.pdate)}`:"Sem preços ainda";
  if(state.tab==="resumo")renderResumo();if(state.tab==="fichario")renderGrid();if(state.tab==="comprar")renderComprar();renderLot();if(sheetKey)openCard(sheetKey)}
document.addEventListener("click",e=>{const t=e.target.closest("[data-tab],[data-set],[data-f],[data-card],[data-goset],[data-wset],[data-sel]");if(!t)return;
  if(t.dataset.tab)setTab(t.dataset.tab);
  else if(t.dataset.goset){state.set=t.dataset.goset;state.q="";$("#q").value="";try{localStorage.setItem("fh-set",state.set)}catch(e){}setTab("fichario")}
  else if(t.dataset.set){state.set=t.dataset.set;state.q="";$("#q").value="";try{localStorage.setItem("fh-set",state.set)}catch(e){}renderGrid()}
  else if(t.dataset.f){state.filter=t.dataset.f;renderGrid()}
  else if(t.dataset.wset){state.wset=t.dataset.wset;renderComprar()}
  else if(t.dataset.sel){const k=t.dataset.sel;state.sel.has(k)?state.sel.delete(k):state.sel.add(k);t.setAttribute("aria-checked",state.sel.has(k));renderLot()}
  else if(t.dataset.card)openCard(t.dataset.card)});
$("#q").addEventListener("input",e=>{state.q=e.target.value;renderGrid()});
$("#scrim").addEventListener("click",closeSheet);
document.addEventListener("keydown",e=>{if(e.key==="Escape")closeSheet()});
$("#lot-ask").addEventListener("input",renderLot);
$("#lot-clear").onclick=()=>{state.sel.clear();$("#lot-ask").value="";renderComprar()};
$("#lot-copy").onclick=async()=>{const lines=[...state.sel].map(k=>{const [sid,n]=k.split("|");const s=SETBY[sid];return `• ${nameOf(sid,n)} ${n}${s.total?"/"+String(s.total).padStart(3,"0"):""} (${s.name}) — Liga ${fmt(price(sid,n))}`});
  const txt="Procuro estas cartas (português, NM):\n"+lines.join("\n")+"\nTotal pela Liga: "+fmt(selTotal().s);
  try{await navigator.clipboard.writeText(txt);toast("Lista copiada")}catch(e){const ta=document.createElement("textarea");ta.value=txt;document.body.appendChild(ta);ta.select();try{document.execCommand("copy");toast("Lista copiada")}catch(_){toast("Não foi possível copiar")}ta.remove()}};
$("#lot-buy").onclick=()=>{const t=selTotal();const ask=parseMoney($("#lot-ask").value);const items=[...state.sel].map(k=>k.split("|"));if(!items.length)return;
  const paidTotal=ask>0?ask:t.s;if(!(paidTotal>0)){toast("Informe o valor do lote");return}
  const known=items.map(([s,n])=>price(s,n)||0);const sum=known.reduce((a,b)=>a+b,0);
  buy(items.map(([s,n],i)=>[s,n,sum?paidTotal*known[i]/sum:paidTotal/items.length]))};

/* ---------- Login e carga ---------- */
async function all(q){let out=[],from=0;for(;;){const {data,error}=await q().range(from,from+999);if(error)throw error;out=out.concat(data);if(data.length<1000)break;from+=1000}return out}
async function load(){$("#stamp").textContent="Carregando…";
  try{
    const [sets,cards,owned,cur,base,hist]=await Promise.all([
      all(()=>sb.from("sets").select("*").order("sort")),
      all(()=>sb.from("cards").select("set_id,num,name_pt,name_en,sprite_idx").order("set_id").order("num")),
      all(()=>sb.from("owned").select("set_id,num,acquired_on,paid,src")),
      all(()=>sb.from("prices_current").select("set_id,num,date,price")),
      all(()=>sb.from("prices_base").select("set_id,num,date,price")),
      sb.rpc("collection_history").then(r=>r.data||[])]);
    if(!sets.length){$("#gate").hidden=false;$("#gate-msg").textContent="Esta conta não tem acesso ao fichário.";$("#app").hidden=true;return}
    SETS=sets.map(s=>({id:s.id,name:s.name,short:s.short,total:s.total,rows:s.sprite_rows}));SETBY=Object.fromEntries(SETS.map(s=>[s.id,s]));
    CAT={};cards.forEach(c=>(CAT[c.set_id]=CAT[c.set_id]||[]).push([c.num,c.name_pt,c.name_en,c.sprite_idx]));
    state.owned={};owned.forEach(o=>(state.owned[o.set_id]=state.owned[o.set_id]||{})[o.num]={d:o.acquired_on,paid:o.paid!=null?Number(o.paid):null,src:o.src});
    state.prices={};let pd=null;cur.forEach(p=>{(state.prices[p.set_id]=state.prices[p.set_id]||{})[p.num]=Number(p.price);if(!pd||p.date>pd)pd=p.date});state.pdate=pd;
    state.base={};let bd=null;base.forEach(p=>{(state.base[p.set_id]=state.base[p.set_id]||{})[p.num]=Number(p.price);if(!bd||p.date<bd)bd=p.date});state.bdate=bd;
    state.history=hist.map(h=>({date:h.date,total:Number(h.total)}));
    if(!state.set||!SETBY[state.set])state.set=SETS[0].id;
    state.ready=true;setTab(state.tab)
  }catch(e){$("#stamp").textContent="Erro ao carregar";toast("Não foi possível carregar seus dados. Verifique a conexão.")}}
function showGate(on){$("#gate").hidden=!on;$("#app").hidden=on;$("nav.tabs").hidden=on}
$("#gate-form").addEventListener("submit",async e=>{e.preventDefault();const email=$("#gate-email").value.trim();if(!email)return;$("#gate-btn").disabled=true;
  const {error}=await sb.auth.signInWithOtp({email,options:{emailRedirectTo:location.origin+location.pathname,shouldCreateUser:true}});
  $("#gate-btn").disabled=false;$("#gate-msg").textContent=error?"Não foi possível enviar o link. Tente de novo em alguns minutos.":"Enviamos um link de acesso para "+email+". Abra o e-mail neste aparelho."});
$("#logout").addEventListener("click",async()=>{await sb.auth.signOut();location.reload()});
sb.auth.getSession().then(({data})=>{if(data.session){showGate(false);load()}else showGate(true)});
sb.auth.onAuthStateChange((ev,session)=>{if(ev==="SIGNED_IN"&&session&&!state.ready){showGate(false);load()}});
