<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>Activities & Tickets | MyRoamy</title>
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="description" content="Book tours, museums, attractions and niche adventures with MyRoamy — powered by Tiqets and Viator." />
<style>
:root{
--blue:#1A3C6E; --teal:#2BB9A9; --orange:#FF7E47; --cream:#F4E1C1;
--ink:#142940; --ring:#e6e9ef; --page:#fffdf9;
}
body{margin:0;font-family:system-ui,-apple-system,Segoe UI,Roboto,Inter,sans-serif;color:var(--ink);background:var(--page)}
a{color:var(--blue);text-decoration:none}
.container{max-width:1180px;margin:0 auto;padding:0 20px}
.chip{display:inline-flex;align-items:center;gap:.4rem;padding:.35rem .65rem;border-radius:999px;background:var(--cream);border:1px solid #f1d9b6;color:var(--blue);font-weight:800;font-size:.85rem}
.btn{display:inline-flex;align-items:center;gap:.5rem;padding:.7rem 1rem;border-radius:.8rem;font-weight:800;transition:.12s ease;border:1px solid transparent;cursor:pointer}
.btn.primary{background:linear-gradient(135deg,var(--blue),var(--teal));color:#fff}
.btn.secondary{background:#fff;color:var(--blue);border-color:var(--ring)}
.nav{position:sticky;top:0;z-index:30;background:#ffffffcc;backdrop-filter:blur(10px);border-bottom:1px solid #eef0f4}
.nav-inner{height:68px;display:flex;align-items:center;justify-content:space-between}
.brand img{height:40px}
.hero{padding:42px 0 22px;background:linear-gradient(180deg,#fff 0%,#fff 45%,#f9fbfd 100%)}
.grid{display:grid;gap:12px;grid-template-columns:repeat(auto-fill,minmax(260px,1fr))}
.card{background:#fff;border:1px solid var(--ring);border-radius:14px;overflow:hidden;box-shadow:0 14px 36px rgba(0,0,0,.06)}
.media{aspect-ratio:16/9;background:#f2f4f8;position:relative}
.badge{position:absolute;left:10px;top:10px;background:#fff;border:1px solid var(--ring);border-radius:.6rem;padding:.25rem .5rem;font-weight:800;font-size:.8rem}
.body{padding:12px}
.title{margin:.1rem 0;color:var(--blue);font-weight:900;font-size:1.02rem}
.price{font-weight:900;color:#FF7E47}
</style>
</head>
<body>

<nav class="nav">
<div class="container nav-inner">
<a class="brand" href="/"><img src="https://cdn.prod.website-files.com/68a774f23819c86639a50248/68c0cbc4030fe3b28f45e8f8_cropped.png" alt="MyRoamy logo"></a>
<div>
<button class="btn secondary" data-provider="all">All</button>
<button class="btn secondary" data-provider="tiqets">Tiqets</button>
</div>
</div>
</nav>

<header class="hero container">
<span class="chip">Activities & Attractions</span>
<h1>Book museums, tours, and epic things to do.</h1>
<form id="finder">
<input name="q" placeholder="Search (e.g., Louvre)" />
<input name="city" placeholder="City (e.g., Paris)" />
<button class="btn primary" type="submit">Search</button>
</form>
</header>

<section class="results container">
<div id="resultCount" class="chip">Loading…</div>
<div id="grid" class="grid"></div>
<button id="prevBtn" class="btn secondary" disabled>Prev</button>
<button id="nextBtn" class="btn secondary" disabled>Next</button>
</section>

<footer class="container">
<small>© <span id="year"></span> MyRoamy</small>
</footer>

<script>
const TIQETS_PROXY = "https://myroamy-proxy.vercel.app/api/tiqets/products";

let state = { page:0, pageSize:12, total:0, items:[], query:{q:"",city:""} };

function $(s,d=document){return d.querySelector(s);}
const grid = $("#grid"), resultCount=$("#resultCount"), nextBtn=$("#nextBtn"), prevBtn=$("#prevBtn");

function mapTiqetsItem(x){
return {
id:x.id,
title:x.title||x.name||"",
image:x.images?.[0]?.url||"",
price:Number(x.from_price||x.price?.value||0),
url:x.product_url||"#",
provider:"Tiqets"
};
}

async function fetchTiqets({q,city,page,pageSize}){
const params=new URLSearchParams({page:(page??0)+1,per_page:pageSize??12});
if(q) params.set("query",q);
if(city) params.set("city",city);
const res=await fetch(`${TIQETS_PROXY}?${params}`);
if(!res.ok) throw new Error("HTTP "+res.status);
const json=await res.json();
const rows=json?.data?.products||json?.products||[];
const items=rows.map(mapTiqetsItem);
const total=json?.meta?.total??items.length;
return {items,total};
}

function render(items){
grid.innerHTML="";
if(!items.length){resultCount.textContent="No results";return;}
resultCount.textContent=`Showing ${items.length} of ${state.total}`;
items.forEach(p=>{
const card=document.createElement("div");
card.className="card";
card.innerHTML=`
<div class="media">
${p.image?`<img src="${p.image}" alt="${p.title}" style="width:100%;height:100%;object-fit:cover">`:""}
<span class="badge">${p.provider}</span>
</div>
<div class="body">
<div class="title">${p.title}</div>
<div class="price">$${p.price||"—"}</div>
<a href="${p.url}" target="_blank" class="btn secondary">View</a>
</div>`;
grid.appendChild(card);
});
prevBtn.disabled=state.page<=0;
nextBtn.disabled=(state.page+1)*state.pageSize>=state.total;
}

async function search(){
try{
const r=await fetchTiqets({...state.query,page:state.page,pageSize:state.pageSize});
state.items=r.items; state.total=r.total; render(r.items);
}catch(e){console.error(e); resultCount.textContent="Error loading activities";}
}

$("#finder").addEventListener("submit",e=>{
e.preventDefault();
const fd=new FormData(e.target);
state.page=0;
state.query.q=fd.get("q")||"";
state.query.city=fd.get("city")||"";
search();
});

nextBtn.onclick=()=>{state.page++;search();};
prevBtn.onclick=()=>{if(state.page>0){state.page--;search();}};

document.getElementById("year").textContent=new Date().getFullYear();
search();
</script>
</body>
</html>
