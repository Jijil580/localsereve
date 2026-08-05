"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { translations } from "./i18n";

type View = "home" | "search" | "requests" | "messages" | "dashboard";
type SessionUser = { id: string; fullName: string; email: string; role: "customer" | "provider" | "admin" };
type MapLocation = { latitude: number; longitude: number; label?: string };
type RequestReply = { providerId:string;providerName:string;providerBusiness:string;providerWhatsApp?:string;message:string;createdAt:string };
type ServiceRequest = { _id:string;requestNumber:string;customerName?:string;service:string;description:string;address:string;preferredDate:string;preferredTime:string;urgency:string;status:string;quoteCount:number;whatsappNumber?:string;responses?:RequestReply[];createdAt:string };
type Provider = {
  id: string; name: string; business: string; service: string; rating: number; reviews: number;
  distance: number | null; experience: number; price: number; available: boolean; emergency?: boolean;
  verified: boolean; image: string; cover: string; description: string; jobs: number; locality: string; whatsapp?:string;
};

function whatsappUrl(phone:string|undefined,message:string){const digits=(phone||"").replace(/\D/g,"");const international=digits.length===10?`91${digits}`:digits;return `https://wa.me/${international}?text=${encodeURIComponent(message)}`}

const serviceNames = [
  "Plumber", "Electrician", "Carpenter", "Mason", "Painter", "Plastering worker", "Tile worker", "Marble and granite worker",
  "Flooring specialist", "False-ceiling worker", "Welder", "Fabrication worker", "Aluminium fabricator", "Glass worker", "Roofing worker",
  "Waterproofing specialist", "Interior designer", "Interior work contractor", "Civil contractor", "Building contractor", "Architect",
  "Structural engineer", "Surveyor", "Home renovation contractor", "Demolition worker", "Borewell service", "Water-tank cleaning",
  "Drain cleaning", "Septic-tank cleaning", "Pest-control service", "House-cleaning service", "Office-cleaning service",
  "Sofa and carpet cleaning", "Gardening and landscaping", "Tree cutting", "Lawn maintenance", "Security guard", "CCTV installation",
  "Home-automation technician", "Appliance repair", "Refrigerator repair", "Washing-machine repair", "Air-conditioner installation and repair",
  "Television repair", "Computer and laptop repair", "Mobile-phone repair", "Inverter and UPS service", "Solar-panel installation and service",
  "Generator service", "Internet and Wi-Fi technician", "DTH and antenna installation", "RO and water-purifier service", "Mechanic", "Car mechanic",
  "Bike mechanic", "Car wash", "Vehicle towing", "Driver", "Taxi service", "Goods-vehicle service", "Packers and movers", "Delivery service",
  "Photographer", "Videographer", "Drone photographer", "Wedding photographer", "Photo and video editor", "Event planner", "Wedding decorator",
  "Stage decorator", "Catering service", "Cook or chef", "Makeup artist", "Beautician", "Hair stylist", "Mehendi artist", "Tailor",
  "Laundry and ironing", "Babysitter", "Elder-care assistant", "Home nurse", "Physiotherapist", "Fitness trainer", "Yoga trainer", "Tutor",
  "Music teacher", "Dance teacher", "Language teacher", "Graphic designer", "Web developer", "Digital marketing professional", "Accountant",
  "Tax consultant", "Legal consultant", "Document-writing service", "Printing service", "Signboard maker", "Other local services",
];
const categoryIcons:Record<string,string>={Plumber:"🔧",Electrician:"⚡",Carpenter:"🪚",Mason:"🧱",Painter:"🎨","Plastering worker":"🏠","Tile worker":"◫","Marble and granite worker":"◇","Flooring specialist":"▦","False-ceiling worker":"⌂",Welder:"⚙"};
const categories = [...serviceNames.map(name => [categoryIcons[name]||"🛠", name, "Browse service"]), ["⋯", "All services", "Explore categories"]];
const featuredCategories = [...categories.slice(0,11), categories[categories.length-1]];

export default function NearlioApp() {
  const [view, setView] = useState<View>("home");
  const [query, setQuery] = useState("");
  const [radius, setRadius] = useState(20);
  const [sort, setSort] = useState("recommended");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [availableOnly, setAvailableOnly] = useState(false);
  const [saved, setSaved] = useState<string[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [selected, setSelected] = useState<Provider | null>(null);
  const [modal, setModal] = useState<"booking" | "request" | "auth" | "profile" | "profile-view" | "location" | null>(null);
  const [toast, setToast] = useState("");
  const [language, setLanguage] = useState<keyof typeof translations>("EN");
  const [role, setRole] = useState<"customer" | "provider" | "admin">("customer");
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null);
  const [postAuthAction,setPostAuthAction]=useState<View|"request"|null>(null);
  const [customerLocation, setCustomerLocation] = useState<MapLocation | null>(null);
  const t = translations[language];

  useEffect(() => {
    fetch("/api/auth/session", { credentials: "include" })
      .then(response => response.ok ? response.json() : { user: null })
      .then(data => { setCurrentUser(data.user ?? null); if (data.user?.role) setRole(data.user.role); })
      .catch(() => setCurrentUser(null));
    refreshProviders();
  }, []);

  useEffect(() => {
    if (!currentUser || currentUser.role === "admin") return;
    fetch("/api/users/location", { credentials: "include" }).then(response=>response.json()).then(data=>{
      if(data.location){setCustomerLocation(data.location);refreshProviders(data.location);}
    }).catch(()=>{});
  }, [currentUser?.id]);

  async function refreshProviders(location?: MapLocation | null) {
    try {
      const point = location ?? customerLocation;
      const params = new URLSearchParams({ limit: "50" });
      if(point){params.set("lat",String(point.latitude));params.set("lng",String(point.longitude));}
      const response = await fetch(`/api/providers?${params}`);
      const result = await response.json();
      if (response.ok) setProviders(result.data ?? []);
    } catch { setProviders([]); }
  }

  const results = useMemo(() => {
    const q = query.toLowerCase();
    const list = providers.filter(p => (!q || `${p.name} ${p.business} ${p.service}`.toLowerCase().includes(q)) && (p.distance === null || p.distance <= radius) && (!verifiedOnly || p.verified) && (!availableOnly || p.available));
    return [...list].sort((a,b) => sort === "nearest" ? (a.distance??Infinity)-(b.distance??Infinity) : sort === "rating" ? b.rating-a.rating : sort === "price" ? a.price-b.price : b.jobs-a.jobs);
  }, [providers, query, radius, verifiedOnly, availableOnly, sort]);

  function notify(message: string) { setToast(message); setTimeout(() => setToast(""), 2600); }
  function goSearch(service?: string) { if (service === "All services") { setQuery(""); setView("search"); setTimeout(()=>document.getElementById("all-services")?.scrollIntoView({behavior:"smooth",block:"start"}),50); return; } if (service) setQuery(service); setView("search"); window.scrollTo({top:0, behavior:"smooth"}); }
  function openProtected(nextView: View) { if (!currentUser) {setPostAuthAction(nextView);setModal("auth");return;} setView(nextView); }
  function openRequest(){if(!currentUser){setPostAuthAction("request");setModal("auth");return;}setModal("request")}
  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    setCurrentUser(null); setView("home"); notify("You have been signed out.");
  }
  function useLocation() {
    setModal("location");
  }
  async function saveCustomerLocation(location: MapLocation) {
    setCustomerLocation(location);
    if(currentUser) await fetch("/api/users/location",{method:"PUT",headers:{"content-type":"application/json"},credentials:"include",body:JSON.stringify(location)});
    await refreshProviders(location);setModal(null);notify("Nearby professionals are now sorted from your location.");
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <button className="brand" onClick={() => setView("home")} aria-label="Nearlio home"><span className="brand-mark">N</span><span>Near<span>lio</span></span></button>
        <nav className="desktop-nav" aria-label="Main navigation">
          <button className={view === "home" ? "active" : ""} onClick={() => setView("home")}>Home</button>
          <button className={view === "search" ? "active" : ""} onClick={() => goSearch()}>Find services</button>
          <button className={view === "requests" ? "active" : ""} onClick={() => openProtected("requests")}>My requests</button>
          <button className={view === "messages" ? "active" : ""} onClick={() => openProtected("messages")}>Messages</button>
        </nav>
        <div className="header-actions">
          <button className="location-mini" onClick={useLocation}>⌖ <span>{customerLocation?.label||"Set location"}</span></button>
          <button className="language" onClick={() => setLanguage(language === "EN" ? "HI" : language === "HI" ? "ML" : "EN")}>{language}</button>
          <button className="ghost-btn desktop-only" onClick={() => {setRole("provider"); currentUser ? setView("dashboard") : setModal("auth")}}>For professionals</button>
          {currentUser ? <><button className="account-chip" onClick={() => {setRole(currentUser.role);setView("dashboard")}}><span>{currentUser.fullName.split(" ").map(x=>x[0]).slice(0,2).join("")}</span><b>{currentUser.fullName.split(" ")[0]}</b></button><button className="signout-btn" onClick={signOut}>Sign out</button></> : <button className="primary-btn small" onClick={() => setModal("auth")}>Sign in</button>}
        </div>
      </header>

      <main>
        {view === "home" && <>
          <section className="hero">
            <div className="hero-copy">
              <div className="eyebrow"><span>✓</span> Verified local professionals</div>
              <h1>{t.find}<span>.</span></h1>
              <p>Book skilled local professionals for every job — with transparent pricing, verified reviews and reliable support.</p>
              <form className="hero-search" onSubmit={e => {e.preventDefault(); goSearch()}}>
                <label className="search-field"><span>⌕</span><input value={query} onChange={e => setQuery(e.target.value)} placeholder={t.search} aria-label="Service search" /></label>
                <button type="button" className="location-field" onClick={useLocation}><span>⌖</span><span><small>LOCATION</small>{customerLocation?.label||t.location}</span></button>
                <button className="search-submit">Search</button>
              </form>
              <div className="popular-searches"><span>Popular:</span>{["Electrician","AC repair","Cleaning","Plumber"].map(x => <button key={x} onClick={() => goSearch(x)}>{x}</button>)}</div>
            </div>
            <div className="hero-visual" aria-label="Trusted service professional">
              <img src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=1000&q=85" alt="Local service professionals at work" />
            </div>
          </section>

          <section className="trust-strip"><div><b>✓</b><span>Verified profiles</span></div><div><b>★</b><span>Transparent ratings</span></div><div><b>⌁</b><span>Secure bookings</span></div><div><b>◉</b><span>Account protection</span></div></section>

          <section className="section categories-section">
            <div className="section-head"><div><span className="kicker">EXPLORE SERVICES</span><h2>What do you need help with?</h2></div><button onClick={() => goSearch()}>View all services →</button></div>
            <div className="category-grid">{featuredCategories.map(([icon,name,count]) => <button className="category-card" key={name} onClick={() => goSearch(name)}><span className="category-icon">{icon}</span><b>{name}</b><small>{count}</small><i>›</i></button>)}</div>
          </section>

          <section className="section provider-section">
            <div className="section-head"><div><span className="kicker">HIGHLY RATED</span><h2>{t.nearby}</h2><p>Handpicked based on ratings, reliability and distance.</p></div><button onClick={() => goSearch()}>See all professionals →</button></div>
            {providers.length ? <div className="provider-grid">{providers.slice(0,3).map(p => <ProviderCard key={p.id} provider={p} saved={saved.includes(p.id)} onSave={() => setSaved(s => s.includes(p.id) ? s.filter(x=>x!==p.id) : [...s,p.id])} onView={() => setSelected(p)} onBook={() => {setSelected(p);setModal("booking")}} />)}</div> : <div className="provider-empty"><span>⌕</span><h3>No providers have published profiles yet</h3><p>New verified professionals will appear here as they complete onboarding.</p><button className="primary-btn" onClick={() => {setRole("provider");currentUser?setView("dashboard"):setModal("auth")}}>Become the first professional</button></div>}
          </section>

          <section className="how-section"><div className="how-copy"><span className="kicker light">SIMPLE & SECURE</span><h2>From search to service,<br/>we make it easy.</h2><p>Book confidently with verified professionals and transparent updates at every step.</p><button className="light-btn" onClick={openRequest}>Post a service request</button></div><div className="steps">{[["01","Tell us what you need","Search or post your requirement in under a minute."],["02","Choose a professional","Compare profiles, prices, portfolios and verified reviews."],["03","Book and relax","Track the job, pay securely and rate the service."]].map(([n,h,p]) => <div className="step" key={n}><span>{n}</span><div><h3>{h}</h3><p>{p}</p></div></div>)}</div></section>

          <section className="cta-band"><div><span className="kicker">GROW YOUR BUSINESS</span><h2>Skilled professional? Meet your next customer.</h2><p>Create a free profile, showcase your work and receive nearby enquiries.</p></div><button onClick={() => {setRole("provider");currentUser?setView("dashboard"):setModal("auth")}}>Join as a professional →</button></section>
        </>}

        {view === "search" && <><SearchView query={query} setQuery={setQuery} radius={radius} setRadius={setRadius} sort={sort} setSort={setSort} verifiedOnly={verifiedOnly} setVerifiedOnly={setVerifiedOnly} availableOnly={availableOnly} setAvailableOnly={setAvailableOnly} results={results} saved={saved} setSaved={setSaved} setSelected={setSelected} setModal={setModal} locationLabel={customerLocation?.label||"Set location"} openLocation={useLocation} />{!query&&<AllServicesCatalogue onChoose={service=>{setQuery(service);setTimeout(()=>document.querySelector(".results")?.scrollIntoView({behavior:"smooth",block:"start"}),50)}}/>}</>}
        {view === "requests" && currentUser && <RequestsView onPost={openRequest} />}
        {view === "messages" && <CleanMessagesView onFind={goSearch} />}
        {view === "dashboard" && currentUser && <ProviderDashboard role={role} user={currentUser} onAction={notify} onRequest={openRequest} onSetup={()=>setModal("profile")} onView={()=>setModal("profile-view")} />}
      </main>

      <footer><div className="footer-brand"><div className="brand"><span className="brand-mark">N</span><span>Near<span>lio</span></span></div><p>Where Local Experts Meet Local Customers.</p><small className="powered-by">Powered by <b>Lumier Technologies</b></small></div><div><b>Customers</b><a>Find services</a><a>Post a request</a><a>Safety</a></div><div><b>Professionals</b><a>Join Nearlio</a><a>Plans & pricing</a><a>Provider help</a></div><div><b>Company</b><a>About</a><a>Contact</a><a>Privacy & terms</a></div><div className="footer-bottom">© 2026 Nearlio. Where Local Experts Meet Local Customers. <span>Powered by Lumier Technologies · English · हिन्दी · മലയാളം</span></div></footer>

      <nav className="mobile-nav" aria-label="Mobile navigation">{[["⌂","Home","home"],["⌕","Search","search"],["＋","Requests","requests"],["✉","Messages","messages"],["◉","Profile","dashboard"]].map(([icon,label,id]) => <button className={view===id ? "active" : ""} onClick={() => (["requests","messages","dashboard"].includes(id) ? openProtected(id as View) : setView(id as View))} key={id}><span>{icon}</span>{label}</button>)}</nav>
      {selected && !modal && <ProviderDrawer provider={selected} saved={saved.includes(selected.id)} onClose={() => setSelected(null)} onBook={() => setModal("booking")} onSave={() => setSaved(s => s.includes(selected.id) ? s.filter(x=>x!==selected.id) : [...s,selected.id])} />}
      {modal && <AppModal type={modal} provider={selected} user={currentUser} customerLocation={customerLocation} onLocationSaved={saveCustomerLocation} onClose={() => {setModal(null);setPostAuthAction(null)}} onAuthenticated={(user) => {setCurrentUser(user);setRole(user.role);notify(`Welcome, ${user.fullName.split(" ")[0]}!`);if(postAuthAction==="request"){setModal("request")}else{setModal(null);setView(postAuthAction||"dashboard")}setPostAuthAction(null)}} onProfileSaved={(user) => {setCurrentUser(user);setRole("provider");setModal(null);refreshProviders();notify("Profile submitted for Nearlio verification.");setView("dashboard")}} onSuccess={(msg) => {setModal(null); notify(msg); if(modal!=="auth")setView("requests")}} />}
      {toast && <div className="toast" role="status">✓ {toast}</div>}
    </div>
  );
}

function ProviderCard({provider:p,saved,onSave,onView,onBook}:{provider:Provider;saved:boolean;onSave:()=>void;onView:()=>void;onBook:()=>void}) {
  return <article className="provider-card"><div className="provider-cover"><img src={p.cover} alt={`${p.service} work by ${p.business}`} /><span className="distance">⌖ {p.distance!==null?`${p.distance} km`:p.locality}</span><button className={`save ${saved?"saved":""}`} onClick={onSave} aria-label="Save provider">{saved?"♥":"♡"}</button></div><div className="provider-body"><div className="provider-title"><div className="avatar">{p.image}</div><div><h3>{p.business} {p.verified&&<span className="verified">✓</span>}</h3><p>{p.service} · {p.experience} years</p></div></div><div className="rating"><b>★ {p.rating}</b><span>({p.reviews} reviews)</span><i className={p.available?"open":"closed"}>{p.available?"Available today":"Next: tomorrow"}</i></div><p className="description">{p.description}</p><div className="provider-meta"><span>From <b>₹{p.price}</b></span><span>{p.jobs} jobs done</span></div><div className="card-actions"><button onClick={onView}>View profile</button><button className="primary-btn" onClick={onBook}>Book now</button></div></div></article>;
}

function SearchView(props:any) {
  return <div className="search-page"><div className="search-top"><span className="kicker">DISCOVER PROFESSIONALS</span><h1>Find the right expert nearby</h1><div className="search-bar-page"><select className="service-menu" value={categories.some(item=>item[1]===props.query)?props.query:""} onChange={event=>props.setQuery(event.target.value)} aria-label="Service category"><option value="">All services</option>{categories.slice(0,-1).map(item=><option key={item[1]} value={item[1]}>{item[1]}</option>)}</select><input value={props.query} onChange={(e:any)=>props.setQuery(e.target.value)} placeholder="Search service, provider or business"/><button onClick={props.openLocation}>⌖ {props.locationLabel}</button><button className="primary-btn">Search</button></div></div><div className="search-layout"><aside className="filters"><div className="filter-title"><h3>Filters</h3><button onClick={()=>{props.setRadius(60);props.setVerifiedOnly(false);props.setAvailableOnly(false)}}>Reset</button></div><label><span>Distance <b>{props.radius} km</b></span><input type="range" min="5" max="60" step="5" value={props.radius} onChange={e=>props.setRadius(+e.target.value)}/></label><fieldset><legend>Trust & availability</legend><label className="check"><input type="checkbox" checked={props.verifiedOnly} onChange={e=>props.setVerifiedOnly(e.target.checked)}/><span>Verified providers only</span></label><label className="check"><input type="checkbox" checked={props.availableOnly} onChange={e=>props.setAvailableOnly(e.target.checked)}/><span>Available today</span></label><label className="check"><input type="checkbox"/><span>Emergency service</span></label><label className="check"><input type="checkbox"/><span>Home visit</span></label></fieldset><fieldset><legend>Minimum rating</legend><div className="rating-filter">{["4.5+","4.0+","3.5+"].map(x=><button key={x}>★ {x}</button>)}</div></fieldset><fieldset><legend>Price range</legend><div className="two-inputs"><input placeholder="₹ Min"/><input placeholder="₹ Max"/></div></fieldset></aside><section className="results"><div className="results-head"><div><h2>{props.results.length} professionals found</h2><p>Within {props.radius} km of {props.locationLabel}</p></div><select value={props.sort} onChange={e=>props.setSort(e.target.value)} aria-label="Sort results"><option value="recommended">Recommended</option><option value="nearest">Nearest first</option><option value="rating">Highest rated</option><option value="price">Lowest price</option></select></div>{props.results.length ? <div className="result-list">{props.results.map((p:Provider)=><ProviderCard key={p.id} provider={p} saved={props.saved.includes(p.id)} onSave={()=>props.setSaved((s:string[])=>s.includes(p.id)?s.filter(x=>x!==p.id):[...s,p.id])} onView={()=>props.setSelected(p)} onBook={()=>{props.setSelected(p);props.setModal("booking")}}/>)}</div>:<div className="empty"><span>⌕</span><h3>No professionals found</h3><p>Try a wider distance or fewer filters.</p><button className="primary-btn" onClick={()=>props.setRadius(60)}>Search within 60 km</button></div>}</section></div></div>;
}

function AllServicesCatalogue({onChoose}:{onChoose:(service:string)=>void}) {
  return <section className="all-services-catalogue" id="all-services"><div className="all-services-heading"><span className="kicker">COMPLETE DIRECTORY</span><h2>All services</h2><p>Choose a service to find matching professionals near you.</p></div><div className="all-services-grid">{categories.slice(0,-1).map(([icon,name])=><button key={name} onClick={()=>onChoose(name)}><span>{icon}</span><b>{name}</b><i>›</i></button>)}</div></section>;
}

function RequestsView({onPost}:{onPost:()=>void}) {
  const [requests,setRequests]=useState<ServiceRequest[]>([]);const [loading,setLoading]=useState(true);const [error,setError]=useState("");
  useEffect(()=>{fetch("/api/requests",{credentials:"include"}).then(async response=>{const result=await response.json();if(!response.ok)throw new Error(result.error);setRequests(result.data||[])}).catch(problem=>setError(problem instanceof Error?problem.message:"Unable to load requests")).finally(()=>setLoading(false))},[]);
  const active=requests.filter(item=>item.status==="open"||item.status==="quoted").length;const quotes=requests.reduce((total,item)=>total+Number(item.quoteCount||0),0);
  return <div className="dash-page"><div className="page-heading"><div><span className="kicker">SERVICE REQUESTS</span><h1>My requests</h1><p>Your posted work, provider replies and bookings appear here.</p></div><button className="primary-btn" onClick={onPost}>＋ Post a new request</button></div><div className="request-summary"><div><span>{active}</span>Active requests</div><div><span>{quotes}</span>Replies received</div><div><span>0</span>Upcoming bookings</div></div>{loading?<div className="clean-empty"><h3>Loading your requests…</h3></div>:error?<div className="auth-error request-load-error">{error}</div>:requests.length===0?<div className="clean-empty"><span>＋</span><h3>No service requests yet</h3><p>Post your first request and nearby professionals will be able to reply.</p><button className="primary-btn" onClick={onPost}>Post your first request</button></div>:<div className="saved-request-list">{requests.map(item=><article className="saved-request-card" key={item._id}><div className="request-icon">{categories.find(category=>category[1]===item.service)?.[0]||"⌁"}</div><div><span className="status-pill amber">{item.status.toUpperCase()}</span><h3>{item.service}</h3><p>{item.description}</p><small>⌖ {item.address} · {item.preferredDate} · {item.preferredTime}</small>{Boolean(item.responses?.length)&&<div className="customer-replies">{item.responses!.map((reply,index)=><div key={`${reply.providerId}-${index}`}><b>{reply.providerBusiness||reply.providerName}</b><p>{reply.message}</p><small>{new Date(reply.createdAt).toLocaleString()}</small>{reply.providerWhatsApp&&<a href={whatsappUrl(reply.providerWhatsApp,`Hello ${reply.providerName}, I am contacting you about ${item.requestNumber}.`)} target="_blank" rel="noreferrer">WhatsApp provider</a>}</div>)}</div>}</div><div className="saved-request-meta"><b>{item.requestNumber}</b><span>{item.quoteCount||0} replies</span><small>{new Date(item.createdAt).toLocaleDateString()}</small></div></article>)}</div>}</div>;
}



function ProviderDrawer({provider:p,saved,onClose,onBook,onSave}:{provider:Provider;saved:boolean;onClose:()=>void;onBook:()=>void;onSave:()=>void}) { return <div className="overlay" onMouseDown={e=>{if(e.target===e.currentTarget)onClose()}}><aside className="provider-drawer"><button className="modal-close" onClick={onClose}>×</button><div className="drawer-cover"><img src={p.cover} alt={`${p.business} portfolio`}/></div><div className="drawer-content"><div className="profile-main"><div className="avatar large">{p.image}</div><div><h2>{p.business} <span className="verified">✓</span></h2><p>{p.name} · {p.service}</p><span className="status-pill green">AVAILABLE TODAY</span></div></div><div className="profile-stats"><div><b>★ {p.rating}</b><span>{p.reviews} reviews</span></div><div><b>{p.jobs}</b><span>Jobs done</span></div><div><b>{p.experience} yrs</b><span>Experience</span></div><div><b>{p.distance!==null?`${p.distance} km`:"Set location"}</b><span>Distance</span></div></div><h3>About</h3><p>{p.description} Serving homes and businesses across {p.locality}. Every job includes clear estimates, tidy workmanship and a service guarantee.</p><div className="tags"><span>English</span><span>हिन्दी</span><span>മലയാളം</span><span>Home visit</span><span>UPI accepted</span></div><h3>Popular services</h3><div className="service-price"><span><b>Inspection & diagnosis</b><small>30–45 minutes</small></span><b>₹{p.price}</b></div><div className="service-price"><span><b>Standard service visit</b><small>Materials charged separately</small></span><b>From ₹799</b></div><h3>Recent work</h3><div className="portfolio-row"><img src={p.cover} alt="Recent project"/><img src="https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=500&q=80" alt="Completed project"/></div><div className="drawer-actions"><button onClick={onSave}>{saved?"♥ Saved":"♡ Save"}</button>{p.whatsapp&&<a className="whatsapp-btn" href={whatsappUrl(p.whatsapp,`Hello ${p.name}, I found your ${p.service} profile on Nearlio.`)} target="_blank" rel="noreferrer">WhatsApp</a>}<button className="primary-btn" onClick={onBook}>Book service</button></div></div></aside></div> }

function AppModal({type,provider,user,customerLocation,onLocationSaved,onClose,onSuccess,onAuthenticated,onProfileSaved}:{type:string;provider:Provider|null;user:SessionUser|null;customerLocation:MapLocation|null;onLocationSaved:(location:MapLocation)=>void;onClose:()=>void;onSuccess:(m:string)=>void;onAuthenticated:(u:SessionUser)=>void;onProfileSaved:(u:SessionUser)=>void}) {
  const [step,setStep]=useState(1);
  const submit=(e:FormEvent)=>{e.preventDefault();onSuccess(type==="request"?"Your request is live. Nearby providers will be notified.":"Booking request sent. The provider will confirm shortly.")};
  if(type==="profile" && user) return <div className="overlay"><div className="modal profile-modal"><button className="modal-close" onClick={onClose}>×</button><ProviderProfileForm user={user} onSaved={onProfileSaved}/></div></div>;
  if(type==="profile-view" && user) return <div className="overlay"><div className="modal profile-view-modal"><button className="modal-close" onClick={onClose}>×</button><ProviderProfilePreview/></div></div>;
  if(type==="location") return <div className="overlay"><div className="modal location-modal"><button className="modal-close" onClick={onClose}>×</button><CustomerLocationForm initial={customerLocation} onSaved={onLocationSaved}/></div></div>;
  if(type==="request") return <div className="overlay"><div className="modal auth-modal"><button className="modal-close" onClick={onClose}>×</button>{user?<RequestForm onSuccess={onSuccess}/>:<AuthForm onAuthenticated={onAuthenticated}/>}</div></div>;
  return <div className="overlay"><div className="modal auth-modal"><button className="modal-close" onClick={onClose}>×</button>{type==="auth"?<AuthForm onAuthenticated={onAuthenticated}/>:<form onSubmit={submit}><span className="kicker">{type==="request"?"POST A REQUEST":"BOOK A SERVICE"}</span><h2>{type==="request"?"Tell us what you need":`Book ${provider?.business||"professional"}`}</h2><div className="stepper"><span className="active">1</span><i></i><span className={step>1?"active":""}>2</span><i></i><span className={step>2?"active":""}>3</span></div>{step===1&&<><label>Service category<select required defaultValue={provider?.service||""}><option value="" disabled>Select a service</option>{categories.slice(0,-1).map(x=><option key={x[1]}>{x[1]}</option>)}</select></label><label>Describe the work<textarea required minLength={10} placeholder="Tell the professional what needs to be done..."/></label><label className="upload">＋ Add photos or video<input type="file" accept="image/*,video/*" multiple/></label></>}{step===2&&<><label>Service address<input required placeholder="House / apartment, street"/></label><div className="form-row"><label>Preferred date<input required type="date"/></label><label>Preferred time<select><option>Morning</option><option>Afternoon</option><option>Evening</option></select></label></div><label>Urgency<select><option>Flexible</option><option>Within 24 hours</option><option>Emergency</option></select></label></>}{step===3&&<div className="booking-review"><div><span>Service</span><b>{provider?.service||"Selected service"}</b></div><div><span>Visit charge</span><b>₹{provider?.price||299}</b></div><div><span>Payment</span><b>After service</b></div><p>Final price may change after inspection. You can review and approve any quotation before work begins.</p></div>}<div className="modal-actions">{step>1&&<button type="button" onClick={()=>setStep(step-1)}>Back</button>}{step<3?<button type="button" className="primary-btn" onClick={()=>setStep(step+1)}>Continue</button>:<button type="submit" className="primary-btn">Confirm request</button>}</div></form>}</div></div>
}

function RequestForm({onSuccess}:{onSuccess:(message:string)=>void}) {
  const [step,setStep]=useState(1);const [busy,setBusy]=useState(false);const [error,setError]=useState("");
  const [draft,setDraft]=useState({service:"",description:"",address:"",preferredDate:"",preferredTime:"Morning",urgency:"Flexible",whatsappNumber:"",allowWhatsApp:false});
  const update=(field:string,value:string)=>setDraft(current=>({...current,[field]:value}));
  function next(){setError("");if(step===1&&(!draft.service||draft.description.trim().length<10)){setError("Choose a service and describe the work in at least 10 characters.");return}if(step===2&&(!draft.address.trim()||!draft.preferredDate)){setError("Add the service address and preferred date.");return}if(step===2&&draft.allowWhatsApp&&draft.whatsappNumber.replace(/\D/g,"").length<10){setError("Enter a valid WhatsApp number or turn off WhatsApp contact.");return}setStep(current=>Math.min(3,current+1))}
  async function submit(event:FormEvent<HTMLFormElement>){event.preventDefault();setBusy(true);setError("");try{const response=await fetch("/api/requests",{method:"POST",headers:{"content-type":"application/json"},credentials:"include",body:JSON.stringify(draft)});const result=await response.json();if(!response.ok)throw new Error(result.error||"Unable to post request");onSuccess("Your request is live and saved in My requests.")}catch(problem){setError(problem instanceof Error?problem.message:"Unable to post request")}finally{setBusy(false)}}
  return <form className="request-form" onSubmit={submit}><span className="kicker">POST A REQUEST</span><h2>Tell us what you need</h2><p className="muted">Your request will be saved to your account and shared with suitable nearby professionals.</p><div className="stepper"><span className="active">1</span><i></i><span className={step>1?"active":""}>2</span><i></i><span className={step>2?"active":""}>3</span></div>{step===1&&<><label>Service category<select value={draft.service} onChange={event=>update("service",event.target.value)} required><option value="" disabled>Select a service</option>{categories.slice(0,-1).map(item=><option key={item[1]} value={item[1]}>{item[1]}</option>)}</select></label><label>Describe the work<textarea value={draft.description} onChange={event=>update("description",event.target.value)} required minLength={10} placeholder="Explain what needs to be done…"/></label></>}{step===2&&<><label>Service address<input value={draft.address} onChange={event=>update("address",event.target.value)} required placeholder="House, street, area and city"/></label><div className="form-row"><label>Preferred date<input value={draft.preferredDate} onChange={event=>update("preferredDate",event.target.value)} min={new Date().toISOString().slice(0,10)} required type="date"/></label><label>Preferred time<select value={draft.preferredTime} onChange={event=>update("preferredTime",event.target.value)}><option>Morning</option><option>Afternoon</option><option>Evening</option></select></label></div><label>Urgency<select value={draft.urgency} onChange={event=>update("urgency",event.target.value)}><option>Flexible</option><option>Within 24 hours</option><option>Emergency</option></select></label><label>WhatsApp number (optional)<input value={draft.whatsappNumber} onChange={event=>update("whatsappNumber",event.target.value)} inputMode="tel" placeholder="10-digit WhatsApp number"/></label><label className="check consent-check"><input type="checkbox" checked={draft.allowWhatsApp} onChange={event=>setDraft(current=>({...current,allowWhatsApp:event.target.checked}))}/><span>Allow matched providers to contact me on WhatsApp</span></label></>}{step===3&&<div className="request-review"><div><span>Service</span><b>{draft.service}</b></div><div><span>When</span><b>{draft.preferredDate} · {draft.preferredTime}</b></div><div><span>Address</span><b>{draft.address}</b></div><div><span>Urgency</span><b>{draft.urgency}</b></div>{draft.allowWhatsApp&&<div><span>WhatsApp</span><b>{draft.whatsappNumber||"Not provided"}</b></div>}<p>{draft.description}</p></div>}{error&&<div className="auth-error">{error}</div>}<div className="modal-actions">{step>1&&<button type="button" onClick={()=>setStep(current=>current-1)}>Back</button>}{step<3?<button type="button" className="primary-btn" onClick={next}>Continue</button>:<button className="primary-btn" disabled={busy}>{busy?"Posting…":"Post request"}</button>}</div></form>;
}

function AuthForm({onAuthenticated}:{onAuthenticated:(user:SessionUser)=>void}) {
  const [mode,setMode]=useState<"login"|"register">("login");
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  async function submitAuth(event:FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    const data=Object.fromEntries(new FormData(event.currentTarget).entries());
    try {
      const response=await fetch(`/api/auth/${mode==="login"?"login":"register"}`,{method:"POST",headers:{"content-type":"application/json"},credentials:"include",body:JSON.stringify(data)});
      const result=await response.json();
      if(!response.ok) throw new Error(result.error||"Something went wrong");
      onAuthenticated(result.user);
    } catch (problem) { setError(problem instanceof Error?problem.message:"Unable to continue"); }
    finally { setBusy(false); }
  }
  return <form onSubmit={submitAuth} className="auth-form"><span className="kicker">WELCOME TO NEARLIO</span><h2>{mode==="login"?"Sign in to your account":"Create your Nearlio account"}</h2><p className="muted">{mode==="login"?"Manage bookings, quotes and messages securely.":"Join as a customer or start receiving nearby service enquiries."}</p><div className="auth-tabs"><button type="button" className={mode==="login"?"active":""} onClick={()=>{setMode("login");setError("")}}>Sign in</button><button type="button" className={mode==="register"?"active":""} onClick={()=>{setMode("register");setError("")}}>Create account</button></div>{mode==="register"&&<><label>Full name<input name="fullName" required minLength={2} autoComplete="name" placeholder="Your full name"/></label><div className="form-row"><label>Email address<input name="email" required type="email" autoComplete="email" placeholder="you@example.com"/></label><label>Mobile number<input name="phone" required type="tel" pattern="[0-9 +()-]{10,18}" autoComplete="tel" placeholder="10-digit number"/></label></div><label>I want to join as<select name="role" defaultValue="customer"><option value="customer">Customer — book services</option><option value="provider">Service professional — receive work</option></select></label></>}{mode==="login"&&<label>Email or mobile number<input name="identifier" required autoComplete="username" placeholder="Email or mobile number"/></label>}<label>Password<input name="password" required type="password" minLength={8} autoComplete={mode==="login"?"current-password":"new-password"} placeholder="At least 8 characters"/></label>{mode==="register"&&<p className="password-hint">Use uppercase, lowercase and at least one number.</p>}{error&&<div className="auth-error" role="alert">{error}</div>}<button type="submit" className="primary-btn wide" disabled={busy}>{busy?"Please wait…":mode==="login"?"Sign in securely":"Create account"}</button><p className="legal">By continuing, you agree to our Terms and Privacy Policy. Your password is securely hashed and never stored as plain text.</p></form>
}

function CleanMessagesView({onFind}:{onFind:()=>void}) {
  return <div className="messages-empty-page"><div className="clean-empty"><span>✉</span><h3>No conversations yet</h3><p>Messages with professionals will appear here after you contact a provider or receive a quotation.</p><button className="primary-btn" onClick={onFind}>Find a professional</button></div></div>;
}

function CleanDashboard({role,user,onAction,onRequest}:{role:SessionUser["role"];user:SessionUser;onAction:(s:string)=>void;onRequest:()=>void}) {
  const stats = role === "admin"
    ? [["0","Customers"],["0","Providers"],["0","Bookings"],["₹0","Revenue"]]
    : role === "provider"
      ? [["0","New enquiries"],["0","Upcoming jobs"],["₹0","Earnings"],["—","No ratings yet"]]
      : [["0","Active requests"],["0","Quotes received"],["0","Upcoming bookings"],["0","Saved providers"]];
  const firstName = user.fullName.trim().split(/\s+/)[0] || "there";
  const description = role === "provider"
    ? "New enquiries and confirmed jobs will appear here."
    : role === "admin"
      ? "Platform activity will appear here as customers and professionals begin using Nearlio."
      : "Your service requests, quotations and bookings will appear here.";
  const prompt = role === "provider"
    ? ["Complete your professional profile","Add your services, coverage area and availability to start receiving enquiries."]
    : role === "admin"
      ? ["No platform activity yet","New customers, providers and bookings will appear here automatically."]
      : ["Post your first service request","Describe the work you need and nearby professionals will be able to send quotations."];
  return <div className="dash-page"><div className="page-heading"><div><span className="kicker">{role.toUpperCase()} DASHBOARD</span><h1>{role === "admin" ? "Platform overview" : `Welcome, ${firstName}!`}</h1><p>{description}</p></div><button className="primary-btn" onClick={role==="customer"?onRequest:()=>onAction("There is no activity report to download yet.")}>{role === "admin" ? "Platform status" : "Post a request"}</button></div><div className="stat-grid">{stats.map(([value,label],index)=><div className="stat-card" key={label}><i>{["↗","◫","₹","★"][index]}</i><b>{value}</b><span>{label}</span><small>No activity yet</small></div>)}</div><div className="dashboard-grid"><section className="panel"><div className="panel-head"><h3>Recent activity</h3></div><div className="clean-empty compact"><span>○</span><h3>No activity yet</h3><p>Real account activity will appear here.</p></div></section><section className="panel"><div className="panel-head"><h3>Get started</h3></div><div className="clean-empty compact"><span>＋</span><h3>{prompt[0]}</h3><p>{prompt[1]}</p></div></section></div></div>;
}

function ProviderEnquiryCard({item,onReplied}:{item:ServiceRequest;onReplied:(id:string)=>void}) {
  const [message,setMessage]=useState("");const [busy,setBusy]=useState(false);const [error,setError]=useState("");const [sent,setSent]=useState(false);
  async function reply(event:FormEvent<HTMLFormElement>){event.preventDefault();setBusy(true);setError("");try{const response=await fetch(`/api/provider/requests/${item._id}/respond`,{method:"POST",headers:{"content-type":"application/json"},credentials:"include",body:JSON.stringify({message})});const result=await response.json();if(!response.ok)throw new Error(result.error||"Unable to send reply");setMessage("");setSent(true);onReplied(item._id)}catch(problem){setError(problem instanceof Error?problem.message:"Unable to send reply")}finally{setBusy(false)}}
  return <article className="provider-enquiry-card"><div><span className={`status-pill ${item.urgency==="Emergency"?"red":"amber"}`}>{item.urgency||"Flexible"}</span><h3>{item.service} request</h3><p>{item.description}</p></div><dl><div><dt>Customer</dt><dd>{item.customerName||"Nearlio customer"}</dd></div><div><dt>Location</dt><dd>{item.address}</dd></div><div><dt>Preferred</dt><dd>{item.preferredDate} · {item.preferredTime}</dd></div><div><dt>Request</dt><dd>{item.requestNumber}</dd></div></dl><form className="provider-reply-form" onSubmit={reply}><label>Reply to customer<textarea value={message} onChange={event=>setMessage(event.target.value)} minLength={3} required placeholder="Introduce yourself, confirm availability, or share an estimate…"/></label>{error&&<div className="auth-error">{error}</div>}{sent&&<div className="reply-sent">✓ Reply sent and saved</div>}<div><button className="primary-btn" disabled={busy}>{busy?"Sending…":"Send reply"}</button>{item.whatsappNumber&&<a className="whatsapp-btn" href={whatsappUrl(item.whatsappNumber,`Hello ${item.customerName||"there"}, I am responding to your ${item.service} request ${item.requestNumber} on Nearlio.`)} target="_blank" rel="noreferrer">WhatsApp customer</a>}</div></form></article>;
}

function ProviderDashboard({role,user,onAction,onRequest,onSetup,onView}:{role:SessionUser["role"];user:SessionUser;onAction:(s:string)=>void;onRequest:()=>void;onSetup:()=>void;onView:()=>void}) {
  const [enquiries,setEnquiries]=useState<ServiceRequest[]>([]);
  const [loadingEnquiries,setLoadingEnquiries]=useState(role==="provider");
  const [enquiryError,setEnquiryError]=useState("");
  const [profileReady,setProfileReady]=useState(true);
  useEffect(()=>{
    if(role!=="provider"){setLoadingEnquiries(false);return}
    setLoadingEnquiries(true);setEnquiryError("");
    fetch("/api/provider/requests",{credentials:"include"}).then(async response=>{
      const result=await response.json();if(!response.ok)throw new Error(result.error||"Unable to load enquiries");
      setEnquiries(result.data||[]);setProfileReady(result.profileReady!==false);
    }).catch(problem=>setEnquiryError(problem instanceof Error?problem.message:"Unable to load enquiries")).finally(()=>setLoadingEnquiries(false));
  },[role]);
  if (role !== "provider") return <CleanDashboard role={role} user={user} onAction={onAction} onRequest={onRequest}/>;
  const firstName = user.fullName.trim().split(/\s+/)[0] || "there";
  const urgent=enquiries.filter(item=>item.urgency==="Emergency"||item.urgency==="Within 24 hours").length;
  const stats = [[String(enquiries.length),"New enquiries"],[String(urgent),"Urgent requests"],["₹0","Earnings"],["—","No ratings yet"]];
  return <div className="dash-page"><div className="page-heading"><div><span className="kicker">PROVIDER DASHBOARD</span><h1>Welcome, {firstName}!</h1><p>View customer requests that match your approved service.</p></div><div className="page-heading-actions"><button className="ghost-btn" onClick={onView}>View profile</button><button className="primary-btn" onClick={onSetup}>Set up profile</button></div></div><div className="stat-grid">{stats.map(([value,label],index)=><div className="stat-card" key={label}><i>{["↗","◫","₹","★"][index]}</i><b>{value}</b><span>{label}</span><small>{index<2&&enquiries.length?"Live customer requests":"No activity yet"}</small></div>)}</div><div className="dashboard-grid provider-dashboard-grid"><section className="panel provider-enquiries"><div className="panel-head"><h3>Matching customer requests</h3><span>{enquiries.length} open</span></div>{loadingEnquiries?<div className="clean-empty compact"><h3>Loading enquiries…</h3></div>:enquiryError?<div className="auth-error">{enquiryError}</div>:!profileReady?<div className="clean-empty compact"><span>○</span><h3>Profile approval required</h3><p>Complete your profile and wait for admin approval to receive matching requests.</p></div>:enquiries.length===0?<div className="clean-empty compact"><span>○</span><h3>No matching enquiries yet</h3><p>New customer requests for your approved service will appear here automatically.</p></div>:<div className="provider-enquiry-list">{enquiries.map(item=><ProviderEnquiryCard key={item._id} item={item} onReplied={id=>setEnquiries(current=>current.map(entry=>entry._id===id?{...entry,quoteCount:entry.quoteCount+1,status:"quoted"}:entry))}/>)}</div>}</section><section className="panel"><div className="panel-head"><h3>Professional profile</h3><button onClick={onView}>View profile</button></div><div className="clean-empty compact"><span>＋</span><h3>Manage your profile</h3><p>Review the information customers see or submit changes for verification.</p><button className="primary-btn" onClick={onSetup}>Edit profile</button></div></section></div></div>;
}

function ProviderProfileForm({user,onSaved}:{user:SessionUser;onSaved:(user:SessionUser)=>void}) {
  const [profile,setProfile]=useState<any>(null);
  const [loading,setLoading]=useState(true);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  const [serviceLocation,setServiceLocation]=useState<MapLocation|null>(null);
  useEffect(()=>{
    fetch("/api/providers/me",{credentials:"include"}).then(async response=>{
      const result=await response.json();
      if(!response.ok) throw new Error(result.error||"Unable to load profile");
      const loaded=result.profile||{};setProfile(loaded);
      const point=loaded.location?.coordinates;if(Array.isArray(point))setServiceLocation({longitude:Number(point[0]),latitude:Number(point[1]),label:loaded.locality||"Service location"});
    }).catch(problem=>setError(problem instanceof Error?problem.message:"Unable to load profile")).finally(()=>setLoading(false));
  },[]);
  async function save(event:FormEvent<HTMLFormElement>) {
    event.preventDefault();setBusy(true);setError("");
    const form=new FormData(event.currentTarget);
    try {
      const response=await fetch("/api/providers/me",{method:"PUT",credentials:"include",body:form});
      const result=await response.json();
      if(!response.ok) throw new Error(result.error||"Unable to save profile");
      onSaved(result.user);
    } catch(problem) { setError(problem instanceof Error?problem.message:"Unable to save profile"); }
    finally { setBusy(false); }
  }
  if(loading) return <div className="profile-loading">Loading your profile…</div>;
  return <form className="provider-profile-form" onSubmit={save}><span className="kicker">PROFESSIONAL PROFILE</span><h2>{profile?._id?"Update your profile":"Set up your profile"}</h2><p className="muted">Your profile and identity documents are reviewed by Nearlio before customers can see you.</p>{profile?.verificationStatus&&<div className={`verification-banner ${profile.verificationStatus}`}><b>{profile.verificationStatus==="approved"?"✓ Verified":profile.verificationStatus==="rejected"?"Changes required":"Verification pending"}</b><span>{profile.verificationStatus==="rejected"?(profile.rejectionReason||"Update the requested details and resubmit."):profile.verificationStatus==="approved"?"Your public profile is active.":"A Nearlio admin will review your submission."}</span></div>}<label>Your name<input value={user.fullName} disabled/></label><label>Business or professional name<input name="businessName" required minLength={2} maxLength={100} defaultValue={profile?.businessName||""} placeholder="Example: Jiji Electrical Services"/></label><div className="form-row"><label>Main service<select name="service" required defaultValue={profile?.service||""}><option value="" disabled>Select service</option>{categories.slice(0,-1).map(item=><option key={item[1]} value={item[1]}>{item[1]}</option>)}</select></label><label>Years of experience<input name="experienceYears" required type="number" min="0" max="60" defaultValue={profile?.experienceYears??0}/></label></div><div className="form-row"><label>Starting price (₹)<input name="startingPrice" required type="number" min="0" max="1000000" defaultValue={profile?.startingPrice??299}/></label><label>Phone number<input name="phone" required type="tel" minLength={10} maxLength={24} defaultValue={profile?.phone||""} placeholder="Contact number"/></label></div><label>Service area<input name="locality" required minLength={2} maxLength={100} defaultValue={profile?.locality||"Kochi, Kerala"} placeholder="Area, city"/></label><div className="profile-location"><div className="profile-location-head"><b>Service location on map</b><span>Customers only see the distance, not your exact coordinates.</span></div><LocationPicker value={serviceLocation} onChange={setServiceLocation}/><input type="hidden" name="latitude" value={serviceLocation?.latitude??""}/><input type="hidden" name="longitude" value={serviceLocation?.longitude??""}/>{!serviceLocation&&<small className="location-required">Use mobile location or choose a point on the map.</small>}</div><label>About your services<textarea name="description" required minLength={30} maxLength={800} defaultValue={profile?.description||""} placeholder="Describe your skills, typical jobs and what customers can expect."/></label><div className="identity-upload-grid"><label>Profile photo {profile?.profilePhotoId&&<small>Current photo saved</small>}<input name="profilePhoto" type="file" accept="image/jpeg,image/png,image/webp" required={!profile?.profilePhotoId}/><em>Clear face photo · JPG, PNG or WebP · max 4 MB</em></label><label>ID card — front {profile?.idCardFrontId&&<small>Current ID saved</small>}<input name="idCardFront" type="file" accept="image/jpeg,image/png,image/webp" required={!profile?.idCardFrontId}/><em>Government-issued identity card · max 4 MB</em></label><label>ID card — back (optional) {profile?.idCardBackId&&<small>Current image saved</small>}<input name="idCardBack" type="file" accept="image/jpeg,image/png,image/webp"/><em>Upload if your ID contains details on both sides</em></label></div><div className="privacy-note"><b>🔒 Private identity verification</b><span>ID images are never shown publicly. Only authorised Nearlio administrators can review them.</span></div><div className="profile-checks"><label><input name="available" type="checkbox" defaultChecked={profile?.available??true}/> Available for new work</label><label><input name="emergency" type="checkbox" defaultChecked={profile?.emergency??false}/> Emergency service offered</label></div>{error&&<div className="auth-error" role="alert">{error}</div>}<button className="primary-btn wide" type="submit" disabled={busy}>{busy?"Submitting…":profile?._id?"Save and resubmit for verification":"Submit for verification"}</button></form>;
}

function CustomerLocationForm({initial,onSaved}:{initial:MapLocation|null;onSaved:(location:MapLocation)=>void}) {
  const [location,setLocation]=useState<MapLocation|null>(initial);
  const [label,setLabel]=useState(initial?.label||"");
  const [busy,setBusy]=useState(false);
  async function save(){if(!location)return;setBusy(true);await onSaved({...location,label:label.trim()||"Selected location"});setBusy(false);}
  return <div className="customer-location-form"><span className="kicker">YOUR LOCATION</span><h2>Find professionals near you</h2><p className="muted">Use your mobile GPS or tap anywhere on the map. Your saved location is used only to calculate distance.</p><LocationPicker value={location} onChange={(next)=>{setLocation(next);if(!label)setLabel(next.label||"")}}/><label>Location name<input value={label} onChange={event=>setLabel(event.target.value)} placeholder="Home, office or area name"/></label><button className="primary-btn wide" onClick={save} disabled={!location||busy}>{busy?"Saving…":"Use this location"}</button></div>;
}

function LocationPicker({value,onChange}:{value:MapLocation|null;onChange:(location:MapLocation)=>void}) {
  const containerRef=useRef<HTMLDivElement|null>(null);
  const mapRef=useRef<any>(null);
  const markerRef=useRef<any>(null);
  const callbackRef=useRef(onChange);
  const [locating,setLocating]=useState(false);
  const [error,setError]=useState("");
  const [placeQuery,setPlaceQuery]=useState("");
  const [placeResults,setPlaceResults]=useState<MapLocation[]>([]);
  const [searching,setSearching]=useState(false);
  callbackRef.current=onChange;
  useEffect(()=>{
    let cancelled=false;
    (async()=>{
      if(!containerRef.current||mapRef.current)return;
      const module=await import("leaflet");const L=module.default;
      if(cancelled||!containerRef.current)return;
      const start=value??{latitude:9.9312,longitude:76.2673};
      const map=L.map(containerRef.current,{zoomControl:true}).setView([start.latitude,start.longitude],13);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:19,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'}).addTo(map);
      const icon=L.divIcon({className:"localserve-map-marker",html:"<span>●</span>",iconSize:[32,32],iconAnchor:[16,28]});
      const marker=L.marker([start.latitude,start.longitude],{draggable:true,icon}).addTo(map);
      const select=(latitude:number,longitude:number,label="Selected map location")=>callbackRef.current({latitude,longitude,label});
      map.on("click",event=>{marker.setLatLng(event.latlng);select(event.latlng.lat,event.latlng.lng)});
      marker.on("dragend",()=>{const point=marker.getLatLng();select(point.lat,point.lng)});
      mapRef.current=map;markerRef.current=marker;
      setTimeout(()=>map.invalidateSize(),0);
    })();
    return()=>{cancelled=true;if(mapRef.current){mapRef.current.remove();mapRef.current=null;markerRef.current=null;}};
  },[]);
  useEffect(()=>{if(value&&mapRef.current&&markerRef.current){markerRef.current.setLatLng([value.latitude,value.longitude]);mapRef.current.setView([value.latitude,value.longitude],15);}},[value?.latitude,value?.longitude]);
  async function searchPlace(){if(placeQuery.trim().length<2)return;setSearching(true);setError("");try{const response=await fetch(`/api/location/search?q=${encodeURIComponent(placeQuery.trim())}`);const result=await response.json();if(!response.ok)throw new Error(result.error||"Unable to search locations");setPlaceResults(result.data||[]);if(!(result.data||[]).length)setError("No matching location found. Try an area, town, landmark or postcode.")}catch(problem){setError(problem instanceof Error?problem.message:"Unable to search locations")}finally{setSearching(false)}}
  function detect(){setError("");if(!navigator.geolocation){setError("Location is not supported on this device.");return}setLocating(true);navigator.geolocation.getCurrentPosition(position=>{const next={latitude:position.coords.latitude,longitude:position.coords.longitude,label:"Current location"};onChange(next);setLocating(false)},()=>{setError("Location permission was not granted. You can choose a point on the map instead.");setLocating(false)},{enableHighAccuracy:true,timeout:12000,maximumAge:60000});}
  return <div className="location-picker"><div className="place-search" role="search"><input value={placeQuery} onChange={event=>setPlaceQuery(event.target.value)} onKeyDown={event=>{if(event.key==="Enter"){event.preventDefault();searchPlace()}}} placeholder="Search area, town, landmark or postcode" aria-label="Search location"/><button type="button" onClick={searchPlace} disabled={searching}>{searching?"Searching…":"Search"}</button></div>{placeResults.length>0&&<div className="place-results">{placeResults.map((result,index)=><button type="button" key={`${result.latitude}-${result.longitude}-${index}`} onClick={()=>{onChange(result);setPlaceQuery(result.label||"");setPlaceResults([])}}><b>⌖</b><span>{result.label}</span></button>)}</div>}<button type="button" className="gps-button" onClick={detect} disabled={locating}>◎ {locating?"Detecting your location…":"Use my current mobile location"}</button><div ref={containerRef} className="map-canvas" aria-label="Choose location on map"/>{value&&<div className="coordinate-chip">✓ Location selected · {value.label||`${value.latitude.toFixed(5)}, ${value.longitude.toFixed(5)}`}</div>}{error&&<div className="location-error">{error}</div>}</div>;
}

function ProviderProfilePreview() {
  const [profile,setProfile]=useState<any>(null);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");
  useEffect(()=>{fetch("/api/providers/me",{credentials:"include"}).then(async response=>{const result=await response.json();if(!response.ok)throw new Error(result.error);setProfile(result.profile)}).catch(problem=>setError(problem instanceof Error?problem.message:"Unable to load profile")).finally(()=>setLoading(false))},[]);
  if(loading)return <div className="profile-loading">Loading your profile…</div>;
  if(error)return <div className="auth-error">{error}</div>;
  if(!profile)return <div className="clean-empty"><span>＋</span><h3>No professional profile yet</h3><p>Complete your profile to submit it for verification.</p></div>;
  const status=profile.verificationStatus||"pending";
  return <div className="provider-profile-preview"><span className="kicker">PROFILE INFORMATION</span><div className="preview-identity">{profile.profilePhotoId?<img src="/api/providers/me/photo" alt={`${profile.name} profile`}/>:<div className="preview-avatar">{profile.initials||"LS"}</div>}<div><span className={`verification-badge ${status}`}>{status==="approved"?"✓ VERIFIED":status==="rejected"?"CHANGES REQUIRED":"PENDING VERIFICATION"}</span><h2>{profile.businessName}</h2><p>{profile.name} · {profile.service}</p></div></div>{status==="rejected"&&<div className="rejection-box"><b>Admin feedback</b><span>{profile.rejectionReason||"Update your profile and resubmit."}</span></div>}<div className="preview-info-grid"><div><span>Service</span><b>{profile.service}</b></div><div><span>Experience</span><b>{profile.experienceYears} years</b></div><div><span>Starting price</span><b>₹{profile.startingPrice}</b></div><div><span>Service area</span><b>{profile.locality}</b></div><div><span>Phone</span><b>{profile.phone}</b></div><div><span>Availability</span><b>{profile.available?"Available for work":"Currently unavailable"}</b></div><div className="wide"><span>About</span><p>{profile.description}</p></div></div><div className="preview-security"><b>Identity verification documents</b><span>{profile.idCardFrontId?"✓ ID front uploaded":"ID front missing"} · {profile.idCardBackId?"✓ ID back uploaded":"ID back optional"}</span></div><p className="preview-note">Your exact map coordinates and identity images are private. Customers only see your approved public information and their distance from you.</p></div>;
}
