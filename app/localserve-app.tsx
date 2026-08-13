"use client";

import { FormEvent, MouseEvent, useEffect, useMemo, useRef, useState } from "react";
import { Language, malayalamServiceNames, serviceLabel, translations } from "./i18n";
import LocationPinIcon from "./location-pin";
import { TERMS_VERSION } from "../lib/terms";
import { seoServices } from "../lib/seo-services";

const GpsPinIcon = LocationPinIcon;

type View = "home" | "search" | "requests" | "messages" | "dashboard";
type SessionUser = { id: string; fullName: string; email: string; role: "customer" | "provider" | "admin" };
type MapLocation = { latitude: number; longitude: number; label?: string };
type RequestReply = { providerId:string;providerName:string;providerBusiness:string;message:string;quoteAmount?:number;availability?:string;createdAt:string };
type ServiceRequest = { _id:string;requestNumber:string;customerName?:string;service:string;description:string;address:string;preferredDate:string;preferredTime:string;urgency:string;status:string;quoteCount:number;whatsappNumber?:string;responses?:RequestReply[];assignedProviderId?:string;assignedProviderName?:string;createdAt:string };
type ProviderReview = { id:string;customerName:string;rating:number;comment:string;createdAt:string;updatedAt?:string };
type Provider = {
  id: string; name: string; business: string; service: string; rating: number; reviews: number; likes: number; liked: boolean;
  distance: number | null; experience: number; price: number; available: boolean; emergency?: boolean;
  verified: boolean; image: string; cover: string; description: string; jobs: number; locality: string; portfolio:string[];
  phone:string;email:string;instagramUrl:string;facebookUrl:string;youtubeUrl:string;
};

function whatsappUrl(phone:string|undefined,message:string){const digits=(phone||"").replace(/\D/g,"");const international=digits.length===10?`91${digits}`:digits;return `https://wa.me/${international}?text=${encodeURIComponent(message)}`}
function requireContactLogin(event:MouseEvent<HTMLAnchorElement>,user:SessionUser|null,onSignIn:()=>void){if(user)return;event.preventDefault();onSignIn()}

const serviceNames = [
  "Plumber", "Electrician", "Carpenter", "Mason", "Interlock paving", "Hollow-brick work", "Painter", "Plastering worker", "Tile worker", "Marble and granite worker",
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
const categoryIcons:Record<string,string>={Plumber:"🔧",Electrician:"⚡",Carpenter:"🪚",Mason:"🧱","Interlock paving":"▦","Hollow-brick work":"▤",Painter:"🎨","Plastering worker":"🏠","Tile worker":"◫","Marble and granite worker":"◇","Flooring specialist":"▦","False-ceiling worker":"⌂",Welder:"⚙"};
const categories = [...serviceNames.map(name => [categoryIcons[name]||"🛠", name, "Browse service"]), ["⋯", "All services", "Explore categories"]];
const featuredCategories = [...categories.slice(0,9), categories[categories.length-1]];
const serviceAliases:Record<string,string[]>={"Interlock paving":["interlock","interlocking paver","paving blocks"],"Hollow-brick work":["hollow brick","hollobricks","hollow blocks"]};

function editDistance(left:string,right:string){const previous=Array.from({length:right.length+1},(_,index)=>index);for(let row=1;row<=left.length;row++){let diagonal=previous[0];previous[0]=row;for(let column=1;column<=right.length;column++){const above=previous[column];previous[column]=Math.min(previous[column]+1,previous[column-1]+1,diagonal+(left[row-1]===right[column-1]?0:1));diagonal=above}}return previous[right.length]}
function matchingServices(value:string,language:Language="EN"){const needle=value.trim().toLowerCase();if(!needle)return[];return serviceNames.map(name=>{const normalized=name.toLowerCase();const localized=(malayalamServiceNames[name]||"").toLowerCase();const terms=[normalized,...normalized.split(/\s+|[-/]/),...(serviceAliases[name]||[]),localized];const direct=terms.some(term=>term&&term.includes(needle))?0:Math.min(...terms.filter(Boolean).map(term=>editDistance(needle,term)));return{name,score:direct}}).filter(item=>item.score<=Math.max(2,Math.floor(needle.length*.4))).sort((a,b)=>a.score-b.score||a.name.localeCompare(b.name)).slice(0,7).map(item=>item.name)}

function ServiceAutocomplete({value,onChange,onSelect,placeholder,ariaLabel,language="EN",name,required=false,disabled=false,restrictToServices=false}:{value:string;onChange:(value:string)=>void;onSelect?:(value:string)=>void;placeholder:string;ariaLabel:string;language?:Language;name?:string;required?:boolean;disabled?:boolean;restrictToServices?:boolean}){
  const [open,setOpen]=useState(false);const [active,setActive]=useState(0);const suggestions=useMemo(()=>matchingServices(value,language),[value,language]);const copy=translations[language];
  function choose(service:string){onChange(service);setOpen(false);onSelect?.(service)}
  return <div className="service-autocomplete"><input name={name} required={required} disabled={disabled} value={value} onChange={event=>{onChange(event.target.value);setOpen(true);setActive(0)}} onFocus={()=>setOpen(true)} onBlur={()=>{if(restrictToServices&&value.trim()&&!serviceNames.includes(value)&&suggestions[0])choose(suggestions[0]);setTimeout(()=>setOpen(false),120)}} onKeyDown={event=>{if(event.key==="ArrowDown"){event.preventDefault();setOpen(true);setActive(index=>Math.min(index+1,suggestions.length-1))}else if(event.key==="ArrowUp"){event.preventDefault();setActive(index=>Math.max(index-1,0))}else if(event.key==="Enter"&&open&&suggestions[active]){event.preventDefault();choose(suggestions[active])}else if(event.key==="Escape")setOpen(false)}} placeholder={placeholder} aria-label={ariaLabel} role="combobox" aria-autocomplete="list" aria-expanded={open&&suggestions.length>0}/>{open&&suggestions.length>0&&!disabled&&<div className="service-suggestions" role="listbox">{suggestions.map((service,index)=><button type="button" role="option" aria-selected={index===active} className={index===active?"active":""} key={service} onMouseDown={event=>event.preventDefault()} onClick={()=>choose(service)}><span>{categoryIcons[service]||"🛠"}</span><b>{serviceLabel(service,language)}</b><small>{value.trim().toLowerCase()===service.toLowerCase()?copy.exactMatch:copy.suggestedService}</small></button>)}</div>}</div>
}

const homeMotionServices = ["Plumber","Electrician","Carpenter","Painter","Tile worker","Cleaning","AC repair","Photographer","Mechanic","Home nurse","Tutor","Web developer"];

function OpeningIntro({onFinish}:{onFinish:()=>void}) {
  const [chapter,setChapter]=useState(0);
  function finish(){localStorage.setItem("nearlio-intro-seen","1");onFinish()}
  function nextChapter(){if(chapter>=2)finish();else setChapter(current=>current+1)}
  useEffect(()=>{const timer=window.setTimeout(nextChapter,chapter===2?1700:1650);return()=>window.clearTimeout(timer)},[chapter]);
  return <section className="opening-intro" role="status" aria-label={`Nearleo welcome, part ${chapter+1} of 3`} onClick={event=>{if(!(event.target as HTMLElement).closest("button"))nextChapter()}}>
    <div className="intro-chapters">
      <article className={`intro-chapter intro-chapter-1 ${chapter===0?"active":""}`}><img src="/near-lio-carpenter.jpg" alt="Carpenter completing skilled woodwork"/><div className="intro-chapter-shade"/><div className="intro-story intro-story-brand"><span className="intro-brand-mark">N</span><div><strong>Near<span>leo</span></strong><small>by Lumier</small></div><p>Where Local Experts Meet Local Customers</p></div></article>
      <article className={`intro-chapter intro-chapter-2 ${chapter===1?"active":""}`}><img src="/near-lio-tile-worker.jpg" alt="Local tile professional at work"/><div className="intro-chapter-shade"/><div className="intro-story"><em>FIND HELP NEARBY</em><h2>Search nearby.<br/>Choose confidently.</h2><p>Compare approved professional profiles around your location.</p></div></article>
      <article className={`intro-chapter intro-chapter-3 ${chapter===2?"active":""}`}><img src="/near-lio-plastering-worker.jpg" alt="Verified local plastering professional"/><div className="intro-chapter-shade"/><div className="intro-story"><em>REQUEST AND CONNECT</em><h2>Local work.<br/>Local trust.</h2><p>Post your requirement, receive real replies and follow every update.</p></div></article>
    </div>
    <div className="intro-watermark">Powered by <b>Lumier Technologies</b></div>
    <div className="intro-progress" aria-hidden="true">{[1,2,3].map((number,index)=><span className={index<chapter?"completed":index===chapter?"active":""} key={number}><i/></span>)}</div>
    <button type="button" className="intro-next" onClick={nextChapter}>{chapter===2?"Enter Nearleo":"Next →"}</button>
    <button type="button" className="intro-skip" onClick={finish}>Skip</button>
  </section>;
}

export default function NearleoApp() {
  const [introVisible, setIntroVisible] = useState(true);
  const [view, setView] = useState<View>("home");
  const [query, setQuery] = useState("");
  const [radius, setRadius] = useState(20);
  const [sort, setSort] = useState("recommended");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [availableOnly, setAvailableOnly] = useState(false);
  const [saved, setSaved] = useState<string[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [selected, setSelected] = useState<Provider | null>(null);
  const [modal, setModal] = useState<"booking" | "request" | "auth" | "profile" | "profile-view" | "location" | "about" | "contact" | "safety" | "pricing" | "provider-help" | "terms" | null>(null);
  const [toast, setToast] = useState("");
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [language, setLanguage] = useState<Language>("EN");
  const [role, setRole] = useState<"customer" | "provider" | "admin">("customer");
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [postAuthAction,setPostAuthAction]=useState<View|"request"|"contact"|null>(null);
  const [customerLocation, setCustomerLocation] = useState<MapLocation | null>(null);
  const t = translations[language];

  useEffect(() => {
    if(localStorage.getItem("nearlio-intro-seen")==="1")setIntroVisible(false);
    const savedLanguage=localStorage.getItem("nearlio-language");
    if(savedLanguage==="ML"||savedLanguage==="EN")setLanguage(savedLanguage);
    const launchParams=new URLSearchParams(window.location.search);
    const requestedService=launchParams.get("service");
    if(requestedService){
      setIntroVisible(false);
      setView("search");
      if(requestedService!=="All services"&&serviceNames.includes(requestedService))setQuery(requestedService);
    }
    if(launchParams.get("contactLogin")==="1"){
      setIntroVisible(false);setAuthMode("login");setPostAuthAction("contact");setModal("auth");notify("Please log in to call, WhatsApp or mail this provider.");
      window.history.replaceState({},"",requestedService?`/?service=${encodeURIComponent(requestedService)}`:"/");
    }
    if("serviceWorker" in navigator)navigator.serviceWorker.register("/sw.js",{updateViaCache:"none"}).then(registration=>registration.update()).catch(()=>{});
  }, []);

  useEffect(()=>{
    localStorage.setItem("nearlio-language",language);
    document.documentElement.lang=language==="ML"?"ml":"en";
    document.documentElement.dataset.language=language;
  },[language]);

  useEffect(() => {
    if(introVisible)return;
    const elements = document.querySelectorAll<HTMLElement>(".section,.how-section,.cta-band,.search-top,.search-layout,.dash-page,.chat-page,footer");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if(reduced){elements.forEach(element=>element.classList.add("motion-in"));return;}
    elements.forEach(element=>element.classList.add("motion-reveal"));
    const observer = new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add("motion-in");observer.unobserve(entry.target)}}),{threshold:.08,rootMargin:"0px 0px -35px"});
    elements.forEach(element=>observer.observe(element));
    return ()=>observer.disconnect();
  }, [view,introVisible]);

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
      const params = new URLSearchParams({ limit: "200" });
      if(point){params.set("lat",String(point.latitude));params.set("lng",String(point.longitude));}
      const response = await fetch(`/api/providers?${params}`);
      const result = await response.json();
      if (response.ok) setProviders(result.data ?? []);
    } catch { setProviders([]); }
  }

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const suggestedService = q.length >= 3 ? matchingServices(query,language)[0]||"" : "";
    const list = providers.filter(p => (!q || `${p.name} ${p.business} ${p.service} ${malayalamServiceNames[p.service]||""}`.toLowerCase().includes(q) || p.service===suggestedService) && (!customerLocation || p.distance === null || p.distance <= radius) && (!verifiedOnly || p.verified) && (!availableOnly || p.available));
    return [...list].sort((a,b) => sort === "nearest" ? (a.distance??Infinity)-(b.distance??Infinity) : sort === "rating" ? b.rating-a.rating : sort === "price" ? a.price-b.price : b.jobs-a.jobs);
  }, [providers, query, radius, verifiedOnly, availableOnly, sort,language,customerLocation]);

  function notify(message: string) { setToast(message); setTimeout(() => setToast(""), 2600); }
  function updateProviderLike(id:string,count:number,liked:boolean){setProviders(list=>list.map(provider=>provider.id===id?{...provider,likes:count,liked}:provider));setSelected(provider=>provider?.id===id?{...provider,likes:count,liked}:provider)}
  function goSearch(service?: string) { if (service === "All services") { setQuery(""); setView("search"); setTimeout(()=>document.querySelector(".results")?.scrollIntoView({behavior:"smooth",block:"start"}),50); return; } if (service) setQuery(service); setView("search"); window.scrollTo({top:0, behavior:"smooth"}); }
  function openProtected(nextView: View) { if (!currentUser) {setPostAuthAction(nextView);setModal("auth");return;} setView(nextView); }
  function openRequest(){if(!currentUser){setPostAuthAction("request");setModal("auth");return;}setModal("request")}
  function openContactSignIn(){notify("Please log in to call, WhatsApp or mail this provider.");setAuthMode("login");setPostAuthAction("contact");setModal("auth")}
  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    setAccountMenuOpen(false); setCurrentUser(null); setView("home"); await refreshProviders(null); notify("You have been signed out.");
  }
  function useLocation() {
    setModal("location");
  }
  async function saveCustomerLocation(location: MapLocation) {
    setCustomerLocation(location);
    if(currentUser) await fetch("/api/users/location",{method:"PUT",headers:{"content-type":"application/json"},credentials:"include",body:JSON.stringify(location)});
    await refreshProviders(location);setSort("nearest");setView("search");setModal(null);setTimeout(()=>document.querySelector(".results")?.scrollIntoView({behavior:"smooth",block:"start"}),50);notify("Nearby professionals are now listed from your location.");
  }

  return (
    <div className="app-shell">
      {introVisible&&<OpeningIntro onFinish={()=>setIntroVisible(false)}/>}
      <header className="topbar">
        <button className="brand" onClick={() => setView("home")} aria-label="Nearleo by Lumier home"><span className="brand-mark">N</span><span className="brand-wordmark"><span>Near<span>leo</span></span><small>by Lumier</small></span></button>
        <nav className="desktop-nav" aria-label="Main navigation">
          <button aria-current={view === "home" ? "page" : undefined} className={view === "home" ? "active" : ""} onClick={() => setView("home")}>{t.home}</button>
          <button aria-current={view === "search" ? "page" : undefined} className={view === "search" ? "active" : ""} onClick={() => goSearch()}>{t.findServices}</button>
          <button aria-current={view === "requests" ? "page" : undefined} className={view === "requests" ? "active" : ""} onClick={() => openProtected("requests")}>{t.myRequests}</button>
          <button aria-current={view === "messages" ? "page" : undefined} className={view === "messages" ? "active" : ""} onClick={() => openProtected("messages")}>{t.messages}</button>
        </nav>
        <div className="header-actions">
          <button className="location-mini" onClick={useLocation}><LocationPinIcon/><span>{customerLocation?.label||t.setLocation}</span></button>
          <div className="language-switch" role="group" aria-label={t.languageLabel}><span aria-hidden="true">文</span><button type="button" className={language==="EN"?"active":""} aria-pressed={language==="EN"} onClick={()=>setLanguage("EN")}>EN</button><button type="button" className={language==="ML"?"active":""} aria-pressed={language==="ML"} onClick={()=>setLanguage("ML")}>മലയാളം</button></div>
          <button className="ghost-btn desktop-only" onClick={() => {setRole("provider"); currentUser ? setView("dashboard") : setModal("auth")}}>{t.forProfessionals}</button>
          {currentUser ? <div className="account-menu-wrap"><button className="account-chip" aria-expanded={accountMenuOpen} aria-haspopup="menu" onClick={() => setAccountMenuOpen(open=>!open)}><span>{currentUser.fullName.split(" ").map(x=>x[0]).slice(0,2).join("")}</span><b>{currentUser.fullName.split(" ")[0]}</b><i>⌄</i></button>{accountMenuOpen&&<div className="account-menu" role="menu"><div className="account-menu-head"><span>{currentUser.fullName.split(" ").map(x=>x[0]).slice(0,2).join("")}</span><div><b>{currentUser.fullName}</b><small>{currentUser.role} account</small></div></div><button role="menuitem" onClick={()=>{setAccountMenuOpen(false);setRole(currentUser.role);setView("dashboard")}}><span>◉</span><div><b>{t.profileDashboard}</b><small>{t.manageAccount}</small></div></button><button role="menuitem" onClick={()=>{setAccountMenuOpen(false);useLocation()}}><span>⌖</span><div><b>{t.changeLocation}</b><small>{customerLocation?.label||t.chooseSearchArea}</small></div></button><button role="menuitem" className="account-logout" onClick={signOut}><span>↪</span><div><b>{t.logOut}</b><small>{t.endSession}</small></div></button></div>}</div> : <button className="primary-btn small" onClick={() => setModal("auth")}>{t.signIn}</button>}
        </div>
      </header>

      <main>
        {view === "home" && <>
          <section className="hero hero-reference">
            <div className="hero-copy">
              <div className="eyebrow"><span>✓</span> {t.trustedNearby}</div>
              <h1>{t.heroTitle} <span>{t.nearYou}</span></h1>
              <p>{t.heroDescription}</p>
              <form className="hero-search hero-search-expanded" onSubmit={e => {e.preventDefault(); goSearch()}}>
                <label className="search-field"><span>⌕</span><span><small>{t.service}</small><ServiceAutocomplete value={query} onChange={setQuery} onSelect={goSearch} placeholder={t.servicePlaceholder} ariaLabel={t.searchPlaceholder} language={language} /></span></label>
                <button type="button" className="location-field" onClick={useLocation}><LocationPinIcon/><span><small>{t.yourLocation}</small>{customerLocation?.label||t.location}</span></button>
                <label className="hero-radius"><span>◴</span><span><small>{t.radius}</small><select value={radius} onChange={event=>setRadius(Number(event.target.value))} aria-label={t.radius}><option value="10">10 km</option><option value="25">25 km</option><option value="50">50 km</option><option value="60">60 km</option></select></span></label>
              </form>
              <div className="hero-proof-row"><div><span>✓</span><b>{t.reviewedProfiles}</b></div><div><span>₹</span><b>{t.startingPrices}</b></div><div><span><LocationPinIcon/></span><b>{t.locationDiscovery}</b></div><div><span>↯</span><b>{t.savedReplies}</b></div></div>
            </div>
            <div className="hero-collage" aria-label="Verified Nearleo service professionals">
              <article className="collage-card collage-electrician"><img src="https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=700&q=85" alt="Electrician at work"/><span><b>{serviceLabel("Electrician",language)}</b><small>{t.localExpertise}</small></span></article>
              <article className="collage-card collage-main"><img src="/near-lio-carpenter.jpg" alt="Carpenter planing a wooden cabinet"/><span><b>{serviceLabel("Carpenter",language)}</b><small>{t.skilledService}</small></span></article>
              <article className="collage-card collage-tile"><img src="/near-lio-tile-worker.jpg" alt="Tile worker installing wall tiles"/><span><b>{serviceLabel("Tile worker",language)}</b><small>{t.nearbyProfessionals}</small></span></article>
              <article className="collage-card collage-plaster"><img src="/near-lio-plastering-worker.jpg" alt="Plastering worker smoothing an interior wall"/><span><b>{serviceLabel("Plastering worker",language)}</b><small>{t.approvedProfiles}</small></span></article>
              <article className="collage-card collage-photographer"><img src="/near-lio-photographer.jpg" alt="Professional cameraman filming an event"/><span><b>{serviceLabel("Photographer",language)}</b><small>{t.directEnquiries}</small></span></article>
              <div className="happy-customers"><b>Nearleo</b><span>{t.builtForCommunities}</span></div>
            </div>
          </section>

          <div className="home-service-motion" aria-label="Popular Nearleo services"><div>{[...homeMotionServices,...homeMotionServices].map((service,index)=><span key={`${service}-${index}`}>✦ {serviceLabel(service,language)}</span>)}</div></div>

          <section className="premium-assurance" aria-labelledby="nearleo-standard-title">
            <div className="assurance-intro"><span className="kicker">{t.nearleoStandard}</span><h2 id="nearleo-standard-title">{t.trustTitle}</h2></div>
            <div className="assurance-grid">
              <article><span aria-hidden="true">01</span><div><b>{t.browseFreely}</b><p>{t.browseFreelyBody}</p></div></article>
              <article><span aria-hidden="true">02</span><div><b>{t.privacyFirst}</b><p>{t.privacyFirstBody}</p></div></article>
              <article><span aria-hidden="true">03</span><div><b>{t.verificationClarity}</b><p>{t.verificationClarityBody}</p></div></article>
              <article><span aria-hidden="true">04</span><div><b>{t.locationControl}</b><p>{t.locationControlBody}</p></div></article>
            </div>
          </section>

          <section className="section categories-section">
            <div className="section-head"><div><span className="kicker">{t.exploreServices}</span><h2>{t.needHelp}</h2></div><button onClick={() => goSearch()}>{t.viewAllServices} →</button></div>
            <div className="category-grid">{featuredCategories.map(([icon,name]) => <button className="category-card" key={name} onClick={() => goSearch(name)}><span className="category-icon">{icon}</span><b>{serviceLabel(name,language)}</b><small>{name==="All services"?t.exploreCategories:t.browseService}</small><i>›</i></button>)}</div>
          </section>

          <section className="section seo-home-directory" aria-labelledby="seo-home-directory-title">
            <div className="section-head"><div><span className="kicker">Service directory</span><h2 id="seo-home-directory-title">Browse popular local services</h2></div><a href="/services">View service guides →</a></div>
            <div className="seo-home-links">{seoServices.map(service=><a href={`/services/${service.slug}`} key={service.slug}><span>{serviceLabel(service.name,language)}</span><i aria-hidden="true">→</i></a>)}</div>
            <a className="seo-kannur-entry" href="/kannur"><span><small>Now serving Kannur district</small><b>Explore local professionals in Kannur, Mattannur and Iritty</b></span><i aria-hidden="true">View Kannur directory →</i></a>
          </section>

          {!currentUser && <section className="mobile-auth-invite" aria-labelledby="mobile-auth-title">
            <div className="mobile-auth-invite-mark" aria-hidden="true">N</div>
            <div className="mobile-auth-invite-copy">
              <span className="kicker">{t.welcome}</span>
              <h2 id="mobile-auth-title">{t.signInAccount}</h2>
              <p>{t.registerDescription}</p>
            </div>
            <div className="mobile-auth-invite-actions">
              <button className="primary-btn" onClick={() => {setAuthMode("login");setModal("auth")}}>{t.signIn}</button>
              <button className="mobile-auth-create" onClick={() => {setAuthMode("register");setModal("auth")}}>{t.createAccount}</button>
            </div>
          </section>}

          <section className="section provider-section">
            <div className="section-head"><div><span className="kicker">{t.approvedProfiles}</span><h2>{t.topNearby}</h2><p>{t.realProfessionals}</p></div><button onClick={() => goSearch()}>{t.seeAllProfessionals} →</button></div>
            {providers.length ? <div className="provider-grid">{providers.slice(0,3).map(p => <ProviderCard key={p.id} provider={p} user={currentUser} saved={saved.includes(p.id)} onSignIn={openContactSignIn} onLikeUpdate={updateProviderLike} onSave={() => setSaved(s => s.includes(p.id) ? s.filter(x=>x!==p.id) : [...s,p.id])} onView={() => setSelected(p)} onBook={() => {setSelected(p);setModal("booking")}} language={language} />)}</div> : <div className="provider-empty"><span>⌕</span><h3>{t.noProviders}</h3><p>{t.providersSoon}</p><button className="primary-btn" onClick={() => {setRole("provider");currentUser?setView("dashboard"):setModal("auth")}}>{t.firstProfessional}</button></div>}
          </section>

          <section className="how-section"><div className="how-copy"><span className="kicker light">{t.simpleSecure}</span><h2>{t.easyTitle}</h2><p>{t.easyDescription}</p><button className="light-btn" onClick={openRequest}>{t.postRequest}</button></div><div className="steps">{[["01",t.step1Title,t.step1Body],["02",t.step2Title,t.step2Body],["03",t.step3Title,t.step3Body]].map(([n,h,p]) => <div className="step" key={n}><span>{n}</span><div><h3>{h}</h3><p>{p}</p></div></div>)}</div></section>

          <section className="cta-band"><div><span className="kicker">{t.growBusiness}</span><h2>{t.professionalCta}</h2><p>{t.professionalCtaBody}</p></div><button onClick={() => {setRole("provider");currentUser?setView("dashboard"):setModal("auth")}}>{t.joinProfessional} →</button></section>
        </>}

        {view === "search" && <><SearchView query={query} setQuery={setQuery} radius={radius} setRadius={setRadius} sort={sort} setSort={setSort} verifiedOnly={verifiedOnly} setVerifiedOnly={setVerifiedOnly} availableOnly={availableOnly} setAvailableOnly={setAvailableOnly} results={results} saved={saved} setSaved={setSaved} setSelected={setSelected} setModal={setModal} currentUser={currentUser} openContactSignIn={openContactSignIn} onLikeUpdate={updateProviderLike} locationLabel={customerLocation?.label||t.setLocation} openLocation={useLocation} language={language} copy={t} />{!query&&<AllServicesCatalogue onChoose={service=>{setQuery(service);setTimeout(()=>document.querySelector(".results")?.scrollIntoView({behavior:"smooth",block:"start"}),50)}} language={language}/>}</>}
        {view === "requests" && currentUser && <RequestsView onPost={openRequest} />}
        {view === "messages" && <CleanMessagesView onFind={goSearch} />}
        {view === "dashboard" && currentUser && <ProviderDashboard role={role} user={currentUser} onAction={notify} onRequest={openRequest} onSetup={()=>setModal("profile")} onView={()=>setModal("profile-view")} />}
      </main>

      <footer><div className="footer-brand"><div className="brand"><span className="brand-mark">N</span><span className="brand-wordmark"><span>Near<span>leo</span></span><small>by Lumier</small></span></div><p>{t.tagline}</p><small className="powered-by">{t.poweredBy} <b>Lumier Technologies</b></small></div><div><b>{t.customers}</b><button onClick={() => goSearch()}>{t.findServices}</button><button onClick={openRequest}>{t.postRequest}</button><button onClick={() => setModal("safety")}>{t.safety}</button></div><div><b>{t.professionals}</b><button onClick={() => {setRole("provider");currentUser?setView("dashboard"):setModal("auth")}}>{t.joinNearlio}</button><button onClick={() => setModal("pricing")}>{t.plansPricing}</button><button onClick={() => setModal("provider-help")}>{t.providerHelp}</button></div><div><b>{t.company}</b><button onClick={() => setModal("about")}>{t.about}</button><button onClick={() => setModal("contact")}>{t.contact}</button><button onClick={() => setModal("terms")}>{t.privacyTerms}</button></div><div className="footer-bottom">© 2026 Nearleo. {t.tagline} <span>{t.poweredBy} Lumier Technologies · support@nealeo.com</span></div></footer>

      <nav className="mobile-nav" aria-label="Mobile navigation">{[["⌂",t.home,"home"],["⌕",t.explore,"search"],["＋",t.requests,"requests"],["✉",t.inbox,"messages"],["◉",t.account,"dashboard"]].map(([icon,label,id]) => <button aria-current={view===id ? "page" : undefined} className={view===id ? "active" : ""} onClick={() => (["requests","messages","dashboard"].includes(id) ? openProtected(id as View) : setView(id as View))} key={id}><span>{icon}</span>{label}</button>)}</nav>
      {selected && !modal && <ProviderDrawer provider={selected} user={currentUser} saved={saved.includes(selected.id)} onClose={() => setSelected(null)} onBook={() => setModal("booking")} onSignIn={openContactSignIn} onLikeUpdate={updateProviderLike} onSave={() => setSaved(s => s.includes(selected.id) ? s.filter(x=>x!==selected.id) : [...s,selected.id])} />}
      {modal && <AppModal type={modal} provider={selected} user={currentUser} customerLocation={customerLocation} language={language} authMode={authMode} onLocationSaved={saveCustomerLocation} onClose={() => {setModal(null);setPostAuthAction(null)}} onFindServices={() => {setModal(null);goSearch()}} onJoinProvider={() => {setRole("provider");if(currentUser){setModal(null);setView("dashboard")}else setModal("auth")}} onAuthenticated={(user) => {setCurrentUser(user);setRole(user.role);refreshProviders();notify(`Welcome, ${user.fullName.split(" ")[0]}!`);if(postAuthAction==="request"){setModal("request")}else if(postAuthAction==="contact"){setModal(null)}else if(modal==="booking"){setModal("booking")}else{setModal(null);setView(postAuthAction||"dashboard")}setPostAuthAction(null)}} onProfileSaved={(user) => {setCurrentUser(user);setRole("provider");setModal(null);refreshProviders();notify("Profile saved and published on Nearleo.");setView("dashboard")}} onSuccess={(msg) => {setModal(null); notify(msg); if(modal!=="auth")setView("requests")}} />}
      {toast && <div className="toast" role="status">✓ {toast}</div>}
    </div>
  );
}

function ProviderCard({provider:p,user,saved,onSave,onView,onBook,onSignIn,onLikeUpdate,language="EN"}:{provider:Provider;user:SessionUser|null;saved:boolean;onSave:()=>void;onView:()=>void;onBook:()=>void;onSignIn:()=>void;onLikeUpdate:(id:string,count:number,liked:boolean)=>void;language?:Language}) {
  const copy=translations[language];
  const [likeBusy,setLikeBusy]=useState(false);
  async function toggleLike(){if(!user){onSignIn();return}setLikeBusy(true);try{const response=await fetch(`/api/providers/${p.id}/likes`,{method:"POST",credentials:"include"});const result=await response.json();if(!response.ok)throw new Error(result.error);onLikeUpdate(p.id,Number(result.count||0),Boolean(result.liked))}catch{}finally{setLikeBusy(false)}}
  return <article className="provider-card premium-provider-card"><div className="provider-cover"><img src={p.cover} alt={`${p.business} profile`} loading="lazy"/><span className="distance"><GpsPinIcon/>{p.distance!==null?`${p.distance} km`:p.locality}</span><div className="provider-card-contact"><a href={`tel:${p.phone}`} onClick={event=>requireContactLogin(event,user,onSignIn)} aria-label={`Call ${p.business}`}>☎</a><a className="whatsapp" href={whatsappUrl(p.phone,`Hello ${p.name}, I found your ${p.service} profile on Nearleo.`)} onClick={event=>requireContactLogin(event,user,onSignIn)} target="_blank" rel="noreferrer" aria-label={`WhatsApp ${p.business}`}><img src="/icons/whatsapp.svg" alt="" aria-hidden="true"/></a><a href={`mailto:${p.email}?subject=${encodeURIComponent(`${p.service} enquiry from Nearleo`)}`} onClick={event=>requireContactLogin(event,user,onSignIn)} aria-label={`Mail ${p.business}`}>✉</a></div><button className={`save ${saved?"saved":""}`} onClick={onSave} aria-label={saved?copy.saved:copy.save}>{saved?"♥":"♡"}</button></div><div className="provider-body"><div className="provider-service-spotlight"><span>Service</span><strong>{serviceLabel(p.service,language)}</strong><i>{p.locality}</i></div><div className="provider-title"><div className="avatar">{p.image}</div><div><h3>{p.business} {p.verified&&<span className="verified" title={copy.reviewed}>✓</span>}</h3><p>{p.name}{p.experience>0?` · ${p.experience} years experience`:""}</p></div></div><div className="provider-trust-row"><span className={p.verified?"trust-badge":"trust-badge unverified"}>{p.verified?`✓ ${copy.reviewed}`:"Unverified provider"}</span><i className={p.available?"open":"closed"}>{p.available?copy.available:copy.availabilityUnknown}</i></div><div className="provider-card-metrics" aria-label="Provider profile summary"><button type="button" className={p.liked?"liked":""} onClick={toggleLike} disabled={likeBusy} aria-label={p.liked?"Unlike this provider":"Like this provider"}><i>{p.liked?"♥":"♡"}</i><span><b>{p.likes}</b><small>{p.likes===1?"Like":"Likes"}</small></span></button><div><i>★</i><span><b>{p.reviews>0?p.rating.toFixed(1):"New"}</b><small>{p.reviews>0?`${p.reviews} reviews`:"No ratings"}</small></span></div><div><i>✓</i><span><b>{p.jobs}</b><small>{p.jobs===1?"Work done":"Works done"}</small></span></div></div>{p.description&&<p className="description">{p.description}</p>}<div className="provider-meta"><span>{p.price>0?<>{copy.startsFrom} <b>₹{p.price}</b></>:<b>{copy.askEstimate}</b>}</span><span>{p.jobs>0?`${p.jobs} completed ${p.jobs===1?"job":"jobs"}`:copy.noJobs}</span></div><div className="card-actions"><button onClick={onView}>{copy.viewProfile}</button><button className="primary-btn" onClick={onBook}>{copy.requestService}</button></div></div></article>;
}

function SearchView(props:any) {
  const t=props.copy;const language:Language=props.language;
  return <div className="search-page"><div className="search-top"><span className="kicker">{t.discoverProfessionals}</span><h1>{t.findRightExpert}</h1><div className="search-bar-page"><select className="service-menu" value={categories.some(item=>item[1]===props.query)?props.query:""} onChange={event=>props.setQuery(event.target.value)} aria-label={t.service}><option value="">{t.allServices}</option>{categories.slice(0,-1).map(item=><option key={item[1]} value={item[1]}>{serviceLabel(item[1],language)}</option>)}</select><ServiceAutocomplete value={props.query} onChange={props.setQuery} onSelect={props.setQuery} placeholder={t.searchPlaceholder} ariaLabel={t.searchPlaceholder} language={language}/><button type="button" className="search-location-control" onClick={props.openLocation}><GpsPinIcon/><span>{props.locationLabel}</span></button></div><button type="button" className="search-location-mobile" onClick={props.openLocation}><span><GpsPinIcon/></span><span><small>{t.searchingNear}</small><b>{props.locationLabel}</b></span><i>{t.change}</i></button></div><div className="search-layout"><aside className="filters"><div className="filter-title"><h3>{t.filters}</h3><button onClick={()=>{props.setRadius(60);props.setVerifiedOnly(false);props.setAvailableOnly(false)}}>{t.reset}</button></div><label><span>{t.distance} <b>{props.radius} km</b></span><input type="range" min="5" max="60" step="5" value={props.radius} onChange={e=>props.setRadius(+e.target.value)}/></label><fieldset><legend>{t.trustAvailability}</legend><label className="check"><input type="checkbox" checked={props.verifiedOnly} onChange={e=>props.setVerifiedOnly(e.target.checked)}/><span>{t.verifiedOnly}</span></label><label className="check"><input type="checkbox" checked={props.availableOnly} onChange={e=>props.setAvailableOnly(e.target.checked)}/><span>{t.availableToday}</span></label><label className="check"><input type="checkbox"/><span>{t.emergencyService}</span></label><label className="check"><input type="checkbox"/><span>{t.homeVisit}</span></label></fieldset><fieldset><legend>{t.minimumRating}</legend><div className="rating-filter">{["4.5+","4.0+","3.5+"].map(x=><button key={x}>★ {x}</button>)}</div></fieldset><fieldset><legend>{t.priceRange}</legend><div className="two-inputs"><input placeholder="₹ Min"/><input placeholder="₹ Max"/></div></fieldset></aside><section className="results"><div className="results-head"><div><h2>{props.results.length} {t.professionalsFound}</h2><p>{props.query?`${t.within} ${props.radius} km ${t.of} ${props.locationLabel}`:t.allServices}</p></div><select value={props.sort} onChange={e=>props.setSort(e.target.value)} aria-label="Sort results"><option value="recommended">{t.recommended}</option><option value="nearest">{t.nearestFirst}</option><option value="rating">{t.highestRated}</option><option value="price">{t.lowestPrice}</option></select></div>{props.results.length ? <div className="result-list">{props.results.map((p:Provider)=><ProviderCard key={p.id} provider={p} user={props.currentUser} saved={props.saved.includes(p.id)} onSignIn={props.openContactSignIn} onLikeUpdate={props.onLikeUpdate} onSave={()=>props.setSaved((s:string[])=>s.includes(p.id)?s.filter(x=>x!==p.id):[...s,p.id])} onView={()=>props.setSelected(p)} onBook={()=>{props.setSelected(p);props.setModal("booking")}} language={language}/>)}</div>:<div className="empty"><span>⌕</span><h3>{t.noProfessionals}</h3><p>{t.widenSearch}</p><button className="primary-btn" onClick={()=>props.setRadius(60)}>{t.search60}</button></div>}</section></div></div>;
}

function AllServicesCatalogue({onChoose,language}:{onChoose:(service:string)=>void;language:Language}) {
  const t=translations[language];
  return <section className="all-services-catalogue" id="all-services"><div className="all-services-heading"><span className="kicker">{t.completeDirectory}</span><h2>{t.allServices}</h2><p>{t.chooseService}</p></div><div className="all-services-grid">{categories.slice(0,-1).map(([icon,name])=><button key={name} onClick={()=>onChoose(name)}><span>{icon}</span><b>{serviceLabel(name,language)}</b><i>›</i></button>)}</div></section>;
}

const requestStatusLabels:Record<string,string>={open:"Request posted",quoted:"Replies received",accepted:"Provider selected",in_progress:"Work in progress",completed:"Completed",cancelled:"Cancelled"};
const requestProgress=["open","quoted","accepted","in_progress","completed"];

function RequestsView({onPost}:{onPost:()=>void}) {
  const [requests,setRequests]=useState<ServiceRequest[]>([]);const [loading,setLoading]=useState(true);const [error,setError]=useState("");const [updatingId,setUpdatingId]=useState("");
  useEffect(()=>{fetch("/api/requests",{credentials:"include"}).then(async response=>{const result=await response.json();if(!response.ok)throw new Error(result.error);setRequests(result.data||[])}).catch(problem=>setError(problem instanceof Error?problem.message:"Unable to load requests")).finally(()=>setLoading(false))},[]);
  async function updateStatus(item:ServiceRequest,action:string,providerId?:string){setUpdatingId(item._id);setError("");try{const response=await fetch(`/api/requests/${item._id}`,{method:"PATCH",headers:{"content-type":"application/json"},credentials:"include",body:JSON.stringify({action,providerId})});const result=await response.json();if(!response.ok)throw new Error(result.error||"Unable to update request");setRequests(current=>current.map(entry=>entry._id===item._id?{...entry,...result.data}:entry))}catch(problem){setError(problem instanceof Error?problem.message:"Unable to update request")}finally{setUpdatingId("")}}
  const active=requests.filter(item=>["open","quoted","accepted","in_progress"].includes(item.status)).length;const quotes=requests.reduce((total,item)=>total+Number(item.quoteCount||0),0);const confirmed=requests.filter(item=>["accepted","in_progress"].includes(item.status)).length;
  return <div className="dash-page"><div className="page-heading"><div><span className="kicker">SERVICE REQUESTS</span><h1>My requests</h1><p>Follow each request from posting to provider selection and completion.</p></div><button className="primary-btn" onClick={onPost}>＋ Post a new request</button></div><div className="request-summary"><div><span>{active}</span>Active requests</div><div><span>{quotes}</span>Replies received</div><div><span>{confirmed}</span>Confirmed jobs</div></div>{loading?<div className="clean-empty"><h3>Loading your requests…</h3></div>:error&&requests.length===0?<div className="auth-error request-load-error">{error}</div>:requests.length===0?<div className="clean-empty"><span>＋</span><h3>No service requests yet</h3><p>Post your first request and nearby professionals will be able to reply.</p><button className="primary-btn" onClick={onPost}>Post your first request</button></div>:<>{error&&<div className="auth-error request-load-error">{error}</div>}<div className="saved-request-list">{requests.map(item=>{const stepIndex=requestProgress.indexOf(item.status);return <article className="saved-request-card request-workflow-card" key={item._id}><div className="request-icon">{categories.find(category=>category[1]===item.service)?.[0]||"⌁"}</div><div className="request-main"><span className={`status-pill status-${item.status}`}>{requestStatusLabels[item.status]||item.status}</span><h3>{item.service}</h3><p>{item.description}</p><small>⌖ {item.address} · {item.preferredDate} · {item.preferredTime}</small>{item.status!=="cancelled"&&<div className="request-progress" aria-label={`Request status: ${requestStatusLabels[item.status]||item.status}`}>{requestProgress.map((status,index)=><span className={index<=stepIndex?"done":""} key={status}><i>{index<stepIndex?"✓":index+1}</i><small>{requestStatusLabels[status]}</small></span>)}</div>}{item.assignedProviderName&&<div className="selected-provider"><span>Selected professional</span><b>{item.assignedProviderName}</b></div>}{Boolean(item.responses?.length)&&<div className="customer-replies">{item.responses!.map((reply,index)=><div className={item.assignedProviderId===reply.providerId?"accepted-reply":""} key={`${reply.providerId}-${index}`}><div className="reply-head"><b>{reply.providerBusiness||reply.providerName}</b>{reply.quoteAmount!==undefined&&<strong>Estimate ₹{reply.quoteAmount.toLocaleString("en-IN")}</strong>}</div><p>{reply.message}</p>{reply.availability&&<span>Availability: {reply.availability}</span>}<small>{new Date(reply.createdAt).toLocaleString()}</small><div className="reply-actions">{["open","quoted"].includes(item.status)&&<button className="primary-btn" disabled={updatingId===item._id} onClick={()=>updateStatus(item,"accept",reply.providerId)}>Select provider</button>}</div></div>)}</div>}<div className="request-status-actions">{["open","quoted","accepted"].includes(item.status)&&<button disabled={updatingId===item._id} onClick={()=>updateStatus(item,"cancel")}>Cancel request</button>}{["accepted","in_progress"].includes(item.status)&&<button className="primary-btn" disabled={updatingId===item._id} onClick={()=>updateStatus(item,"complete")}>Mark job completed</button>}</div></div><div className="saved-request-meta"><b>{item.requestNumber}</b><span>{item.quoteCount||0} {item.quoteCount===1?"reply":"replies"}</span><small>{new Date(item.createdAt).toLocaleDateString()}</small></div></article>})}</div></>}</div>;
}



function ProviderReviews({provider,user,onSignIn}:{provider:Provider;user:SessionUser|null;onSignIn:()=>void}) {
  const [reviews,setReviews]=useState<ProviderReview[]>([]);const [rating,setRating]=useState(5);const [comment,setComment]=useState("");const [busy,setBusy]=useState(false);const [error,setError]=useState("");const [summary,setSummary]=useState({rating:provider.rating,count:provider.reviews});
  async function load(){try{const response=await fetch(`/api/providers/${provider.id}/reviews`,{credentials:"include"});const result=await response.json();if(!response.ok)throw new Error(result.error);setReviews(result.data||[]);setSummary({rating:Number(result.rating||0),count:Number(result.count||0)});if(result.ownReview){setRating(result.ownReview.rating);setComment(result.ownReview.comment||"")}}catch(problem){setError(problem instanceof Error?problem.message:"Unable to load reviews")}}
  useEffect(()=>{load()},[provider.id,user?.id]);
  async function submit(event:FormEvent<HTMLFormElement>){event.preventDefault();if(!user){onSignIn();return}setBusy(true);setError("");try{const response=await fetch(`/api/providers/${provider.id}/reviews`,{method:"POST",headers:{"content-type":"application/json"},credentials:"include",body:JSON.stringify({rating,comment})});const result=await response.json();if(!response.ok)throw new Error(result.error);await load()}catch(problem){setError(problem instanceof Error?problem.message:"Unable to save review")}finally{setBusy(false)}}
  return <section className="provider-reviews"><div className="review-heading"><div><span>CUSTOMER REVIEWS</span><h3>{summary.count?`${summary.rating.toFixed(1)} out of 5`:"Be the first to review"}</h3></div><div className="review-summary-stars" aria-label={`${summary.rating.toFixed(1)} out of 5 stars`}>{[1,2,3,4,5].map(star=><i className={star<=Math.round(summary.rating)?"active":""} key={star}>★</i>)}</div></div>{user?.role==="customer"?<form className="review-form" onSubmit={submit}><b>Rate this professional</b><div className="review-star-picker" role="group" aria-label="Choose a rating">{[1,2,3,4,5].map(star=><button type="button" className={star<=rating?"active":""} onClick={()=>setRating(star)} aria-label={`${star} star${star===1?"":"s"}`} aria-pressed={rating===star} key={star}>★</button>)}</div><textarea value={comment} onChange={event=>setComment(event.target.value)} maxLength={600} placeholder="Share your experience (optional)"/><button className="primary-btn" disabled={busy}>{busy?"Saving…":"Save my review"}</button></form>:!user?<button className="review-signin" type="button" onClick={onSignIn}>Sign in to add a review</button>:null}{error&&<div className="auth-error">{error}</div>}<div className="review-list">{reviews.slice(0,8).map(review=><article key={review.id}><div><b>{review.customerName}</b><span>{"★".repeat(review.rating)}{"☆".repeat(5-review.rating)}</span></div>{review.comment&&<p>{review.comment}</p>}<small>{new Date(review.updatedAt||review.createdAt).toLocaleDateString()}</small></article>)}{summary.count===0&&<p className="no-reviews">No customer reviews yet.</p>}</div></section>
}

function ProviderDrawer({provider:p,user,saved,onClose,onBook,onSave,onSignIn,onLikeUpdate}:{provider:Provider;user:SessionUser|null;saved:boolean;onClose:()=>void;onBook:()=>void;onSave:()=>void;onSignIn:()=>void;onLikeUpdate:(id:string,count:number,liked:boolean)=>void}) {
  const [likeBusy,setLikeBusy]=useState(false);
  const socialLinks=[["Instagram",p.instagramUrl,"◎"],["Facebook",p.facebookUrl,"f"],["YouTube",p.youtubeUrl,"▶"]].filter((item):item is string[]=>Boolean(item[1]));
  async function toggleLike(){if(!user){onSignIn();return}setLikeBusy(true);try{const response=await fetch(`/api/providers/${p.id}/likes`,{method:"POST",credentials:"include"});const result=await response.json();if(!response.ok)throw new Error(result.error);onLikeUpdate(p.id,Number(result.count||0),Boolean(result.liked))}catch{}finally{setLikeBusy(false)}}
  return <div className="overlay provider-profile-overlay" onMouseDown={event=>{if(event.target===event.currentTarget)onClose()}}><aside className="provider-drawer premium-profile-drawer"><button className="modal-close" onClick={onClose}>×</button><div className="drawer-cover premium-profile-cover"><img src={p.cover} alt={`${p.business} profile`}/><div className="profile-cover-shade"/><span className={`premium-availability ${p.available?"available":""}`}>{p.available?"● Available for work":"Ask availability"}</span><div className="profile-banner-metrics" aria-label="Provider profile summary"><button type="button" className={p.liked?"liked":""} onClick={toggleLike} disabled={likeBusy} aria-label={p.liked?"Unlike this provider":"Like this provider"}><i>{p.liked?"♥":"♡"}</i><span><b>{p.likes}</b><small>{p.likes===1?"Like":"Likes"}</small></span></button><div><i>★</i><span><b>{p.reviews>0?p.rating.toFixed(1):"New"}</b><small>{p.reviews>0?`${p.reviews} reviews`:"No ratings yet"}</small></span></div><div><i>✓</i><span><b>{p.jobs}</b><small>{p.jobs===1?"Work done":"Works done"}</small></span></div></div></div><div className="drawer-content premium-profile-content"><div className="profile-main premium-profile-main"><div className="avatar large">{p.image}</div><div><span className="profile-service-label">{p.service} · {p.locality}</span><h2>{p.business} {p.verified&&<span className="verified">✓</span>}</h2><p>{p.name}{p.experience>0?` · ${p.experience} years experience`:""}</p></div></div><section className="provider-contact-section"><div className="provider-contact-heading"><span>CONTACT NOW</span><h3>Contact {p.service}</h3></div>{!user&&<p className="contact-login-note">Log in to call, WhatsApp or mail this provider.</p>}<div className="direct-contact-grid"><a className="contact-call" href={`tel:${p.phone}`} onClick={event=>requireContactLogin(event,user,onSignIn)}><i>☎</i><span><small>PHONE</small><b>Call</b></span></a><a className="contact-whatsapp" href={whatsappUrl(p.phone,`Hello ${p.name}, I found your ${p.service} profile on Nearleo.`)} onClick={event=>requireContactLogin(event,user,onSignIn)} target="_blank" rel="noreferrer"><i><img src="/icons/whatsapp.svg" alt="" aria-hidden="true"/></i><span><small>MESSAGE</small><b>WhatsApp</b></span></a><a className="contact-email" href={`mailto:${p.email}?subject=${encodeURIComponent(`${p.service} enquiry from Nearleo`)}`} onClick={event=>requireContactLogin(event,user,onSignIn)}><i>✉</i><span><small>EMAIL</small><b>Mail</b></span></a></div></section>{socialLinks.length>0&&<div className="provider-social-links"><span>Follow this professional</span><div>{socialLinks.map(([label,url,icon])=><a href={url} target="_blank" rel="noreferrer" aria-label={`${label} profile`} key={label}><i>{icon}</i>{label}</a>)}</div></div>}<div className="profile-stats premium-profile-stats"><div><b>{p.reviews>0?`★ ${p.rating.toFixed(1)}`:"New"}</b><span>{p.reviews>0?`${p.reviews} customer reviews`:"No reviews yet"}</span></div><div><b>{p.jobs}</b><span>{p.jobs===1?"Completed job":"Completed jobs"}</span></div><div><b>{p.price>0?`₹${p.price}`:"Quote"}</b><span>Starting price</span></div><div><b>{p.distance!==null?`${p.distance} km`:p.locality}</b><span>{p.distance!==null?"Distance":"Service area"}</span></div></div><div className={`profile-verification ${p.verified?"":"unverified"}`}><b>{p.verified?"✓ Nearleo verified professional":"Unverified provider"}</b><span>{p.verified?"Nearleo has reviewed this provider’s submitted identity and profile information.":"This profile is publicly listed but not yet verified by Nearleo. Confirm work scope and pricing before hiring."}</span></div><section className="premium-about"><span>ABOUT THE PROFESSIONAL</span><h3>Trusted local expertise for your next job</h3><p>{p.description||`${p.name} provides ${p.service.toLowerCase()} services in ${p.locality}. Contact the provider directly to discuss your requirements.`}</p></section><div className="service-price premium-service-price"><span><small>PRIMARY SERVICE</small><b>{p.service}</b><em>Confirm scope, materials, timing and final price directly.</em></span><strong>{p.price>0?`From ₹${p.price}`:"Ask for estimate"}</strong></div>{p.portfolio.length>0?<section className="premium-portfolio"><div><span>WORK SHOWCASE</span><h3>Recent projects</h3></div><div className="portfolio-row">{p.portfolio.map((image,index)=><img src={image} loading="lazy" alt={`${p.business} recent work ${index+1}`} key={image}/>)}</div></section>:<div className="portfolio-empty"><b>Work gallery coming soon</b><span>This professional has not uploaded recent-project photos.</span></div>}<ProviderReviews provider={p} user={user} onSignIn={onSignIn}/><a className="full-profile-link" href={`/professionals/${p.id}`}>Open full public profile ↗</a><div className="drawer-actions premium-drawer-actions"><button onClick={onSave}>{saved?"♥ Saved":"♡ Save"}</button><button className="primary-btn" onClick={onBook}>Request service</button></div></div></aside></div>
}

function InformationPanel({type,onFindServices,onJoinProvider}:{type:string;onFindServices:()=>void;onJoinProvider:()=>void}) {
  if(type==="pricing") return <div className="info-panel pricing-panel"><span className="kicker">SIMPLE PRICING</span><h2>Start free. Grow when you are ready.</h2><div className="launch-offer"><b>Launch offer: first 12 months free</b><span>Every Nearleo customer and professional can use their chosen plan free for the first year after joining.</span></div><div className="pricing-grid"><article><span>FOR CUSTOMERS</span><h3>Customer</h3><strong>₹0 <small>forever</small></strong><ul><li>Search nearby professionals</li><li>Post service requests</li><li>Receive replies and quotations</li><li>Call, WhatsApp or email providers directly</li></ul><button className="primary-btn" onClick={onFindServices}>Find a service</button></article><article><span>FOR PROFESSIONALS</span><h3>Basic</h3><strong>₹0 <small>/ year</small></strong><ul><li>Verified public profile</li><li>Service location and nearby enquiries</li><li>Reply to customers</li><li>Basic profile photo and service information</li></ul><button className="primary-btn" onClick={onJoinProvider}>Join Basic</button></article><article className="featured-plan"><em>FIRST YEAR FREE</em><span>FOR PROFESSIONALS</span><h3>Growth</h3><strong>₹199 <small>/ year after year one</small></strong><ul><li>Everything in Basic</li><li>Work gallery and extra profile space</li><li>Enhanced business presentation</li><li>Priority growth support from Lumier</li></ul><a className="primary-btn" href="mailto:support@nealeo.com?subject=Nearleo%20Growth%20Plan">Choose Growth</a></article></div><p className="fine-print">Taxes, billing activation and renewal reminders will be shown before any paid renewal. No automatic charge is made during the free launch year.</p></div>;
  const content:Record<string,{kicker:string;title:string;body:React.ReactNode}>={
    about:{kicker:"ABOUT NEARLEO",title:"Local work. Local trust.",body:<><p>Nearleo is a local-services marketplace created by <b>Lumier Technologies</b>. We help customers discover nearby professionals and help skilled workers build a trusted digital presence.</p><div className="info-feature-grid"><div><b>Nearby discovery</b><span>Location-aware results connect customers with relevant professionals.</span></div><div><b>Verified profiles</b><span>Provider verification adds a visible trust badge without delaying public listing.</span></div><div><b>Direct communication</b><span>Phone, WhatsApp, email and service requests keep local work moving.</span></div></div></>},
    contact:{kicker:"CONTACT & SUPPORT",title:"Talk to Nearleo support",body:<><p>Questions about Nearleo, provider verification, plans, safety or partnerships are welcome.</p><div className="contact-card"><span>Company</span><b>Lumier Technologies</b><span>Help and support</span><a href="mailto:support@nealeo.com">support@nealeo.com</a><span>Service</span><b>Nearleo local-services marketplace</b></div><a className="primary-btn info-mail" href="mailto:support@nealeo.com?subject=Nearleo%20Support">Email Nearleo support</a></>},
    safety:{kicker:"TRUST & SAFETY",title:"Use Nearleo safely",body:<><p>Use contact details only for the genuine service request that made them available. Never send spam, repeated or unwanted messages, harassment, threats or unrelated promotions.</p><ul className="info-list"><li>Agree on scope, materials, price and timing before work begins.</li><li>Never share passwords, OTPs, PINs or banking credentials.</li><li>Keep quotations, receipts and important conversations in writing.</li><li>Stop contacting a user immediately when they withdraw permission.</li><li>Report suspicious accounts, fraud or unsafe conduct to Lumier support.</li></ul><a className="primary-btn info-mail" href="mailto:support@nealeo.com?subject=Nearleo%20Safety%20Report">Report a safety concern</a></>},
    "provider-help":{kicker:"PROVIDER HELP",title:"Build a profile customers can trust",body:<><div className="help-steps"><div><span>1</span><b>Create a professional account</b><p>Add your name, phone number and primary service.</p></div><div><span>2</span><b>Complete verification</b><p>Publish immediately with your essential service, location and contact details. Add photos or ID later if you want verification.</p></div><div><span>3</span><b>Receive nearby enquiries</b><p>Customers can call, WhatsApp or email you directly and can also send a structured service request.</p></div><div><span>4</span><b>Grow your profile</b><p>Add your gallery, social pages, availability and service details to build a premium online presence.</p></div></div><button className="primary-btn" onClick={onJoinProvider}>Join as a professional</button><a className="primary-btn info-mail" href="mailto:support@nealeo.com?subject=Nearleo%20Provider%20Help">Email provider support</a></>}
  };
  const page=content[type]||content.about;
  return <div className="info-panel"><span className="kicker">{page.kicker}</span><h2>{page.title}</h2>{page.body}</div>;
}

function AppModal({type,provider,user,customerLocation,language,authMode,onLocationSaved,onClose,onFindServices,onJoinProvider,onSuccess,onAuthenticated,onProfileSaved}:{type:string;provider:Provider|null;user:SessionUser|null;customerLocation:MapLocation|null;language:Language;authMode:"login"|"register";onLocationSaved:(location:MapLocation)=>void;onClose:()=>void;onFindServices:()=>void;onJoinProvider:()=>void;onSuccess:(m:string)=>void;onAuthenticated:(u:SessionUser)=>void;onProfileSaved:(u:SessionUser)=>void}) {
  if(type==="terms") return <div className="overlay"><div className="modal auth-modal"><UserTerms onClose={onClose}/></div></div>;
  if(["about","contact","safety","pricing","provider-help"].includes(type)) return <div className="overlay"><div className={`modal info-modal ${type==="pricing"?"pricing-modal":""}`}><button className="modal-close" onClick={onClose}>×</button><InformationPanel type={type} onFindServices={onFindServices} onJoinProvider={onJoinProvider}/></div></div>;
  if(type==="profile" && user) return <div className="overlay"><div className="modal profile-modal"><button className="modal-close" onClick={onClose}>×</button><ProviderProfileForm user={user} language={language} onSaved={onProfileSaved}/></div></div>;
  if(type==="profile-view" && user) return <div className="overlay"><div className="modal profile-view-modal"><button className="modal-close" onClick={onClose}>×</button><ProviderProfilePreview/></div></div>;
  if(type==="location") return <div className="overlay"><div className="modal location-modal"><button className="modal-close" onClick={onClose}>×</button><CustomerLocationForm initial={customerLocation} onSaved={onLocationSaved}/></div></div>;
  if(type==="request"||type==="booking") return <div className="overlay"><div className="modal auth-modal"><button className="modal-close" onClick={onClose}>×</button>{user?<RequestForm provider={type==="booking"?provider:null} language={language} onSuccess={onSuccess}/>:<AuthForm onAuthenticated={onAuthenticated} language={language}/>}</div></div>;
  return <div className="overlay"><div className="modal auth-modal"><button className="modal-close" onClick={onClose}>×</button><AuthForm onAuthenticated={onAuthenticated} language={language} initialMode={authMode}/></div></div>;
}

function RequestForm({onSuccess,provider,language}:{onSuccess:(message:string)=>void;provider?:Provider|null;language:Language}) {
  const [step,setStep]=useState(1);const [busy,setBusy]=useState(false);const [error,setError]=useState("");
  const [draft,setDraft]=useState({service:provider?.service||"",description:"",address:"",preferredDate:"",preferredTime:"Morning",urgency:"Flexible",whatsappNumber:"",allowWhatsApp:false,preferredProviderId:provider?.id||""});
  const update=(field:string,value:string)=>setDraft(current=>({...current,[field]:value}));
  function next(){setError("");if(step===1){const selectedService=serviceNames.includes(draft.service)?draft.service:matchingServices(draft.service,language)[0]||"";if(!selectedService||draft.description.trim().length<10){setError("Choose a service from the suggestions and describe the work in at least 10 characters.");return}if(selectedService!==draft.service)setDraft(current=>({...current,service:selectedService}))}if(step===2&&(!draft.address.trim()||!draft.preferredDate)){setError("Add the service address and preferred date.");return}if(step===2&&draft.allowWhatsApp&&draft.whatsappNumber.replace(/\D/g,"").length<10){setError("Enter a valid WhatsApp number or turn off WhatsApp contact.");return}setStep(current=>Math.min(3,current+1))}
  async function submit(event:FormEvent<HTMLFormElement>){event.preventDefault();setBusy(true);setError("");try{const response=await fetch("/api/requests",{method:"POST",headers:{"content-type":"application/json"},credentials:"include",body:JSON.stringify(draft)});const result=await response.json();if(!response.ok)throw new Error(result.error||"Unable to post request");onSuccess("Your request is live and saved in My requests.")}catch(problem){setError(problem instanceof Error?problem.message:"Unable to post request")}finally{setBusy(false)}}
  return <form className="request-form" onSubmit={submit}><span className="kicker">{provider?"REQUEST THIS PROFESSIONAL":"POST A REQUEST"}</span><h2>{provider?`Request ${provider.business}`:"Tell us what you need"}</h2><p className="muted">{provider?`Your request will be saved and sent for ${provider.service}. The professional must reply before anything is confirmed.`:"Your request will be saved to your account and shared with suitable nearby professionals."}</p><div className="stepper"><span className="active">1</span><i></i><span className={step>1?"active":""}>2</span><i></i><span className={step>2?"active":""}>3</span></div>{step===1&&<><label>Service category<ServiceAutocomplete value={draft.service} onChange={value=>update("service",value)} placeholder="Type a service, even with a spelling mistake" ariaLabel="Choose service category" language={language} required disabled={Boolean(provider)} restrictToServices/></label><label>Describe the work<textarea value={draft.description} onChange={event=>update("description",event.target.value)} required minLength={10} placeholder="Explain what needs to be done…"/></label></>}{step===2&&<><label>Service address<input value={draft.address} onChange={event=>update("address",event.target.value)} required placeholder="House, street, area and city"/></label><div className="form-row"><label>Preferred date<input value={draft.preferredDate} onChange={event=>update("preferredDate",event.target.value)} min={new Date().toISOString().slice(0,10)} required type="date"/></label><label>Preferred time<select value={draft.preferredTime} onChange={event=>update("preferredTime",event.target.value)}><option>Morning</option><option>Afternoon</option><option>Evening</option></select></label></div><label>Urgency<select value={draft.urgency} onChange={event=>update("urgency",event.target.value)}><option>Flexible</option><option>Within 24 hours</option><option>Emergency</option></select></label><label>WhatsApp number (optional)<input value={draft.whatsappNumber} onChange={event=>update("whatsappNumber",event.target.value)} inputMode="tel" placeholder="10-digit WhatsApp number"/></label><label className="check consent-check"><input type="checkbox" checked={draft.allowWhatsApp} onChange={event=>setDraft(current=>({...current,allowWhatsApp:event.target.checked}))}/><span>Allow matched providers to contact me on WhatsApp</span></label></>}{step===3&&<div className="request-review">{provider&&<div><span>Preferred professional</span><b>{provider.business}</b></div>}<div><span>Service</span><b>{draft.service}</b></div><div><span>When</span><b>{draft.preferredDate} · {draft.preferredTime}</b></div><div><span>Address</span><b>{draft.address}</b></div><div><span>Urgency</span><b>{draft.urgency}</b></div>{draft.allowWhatsApp&&<div><span>WhatsApp</span><b>{draft.whatsappNumber||"Not provided"}</b></div>}<p>{draft.description}</p><small>No booking or price is confirmed until you select a provider reply.</small></div>}{error&&<div className="auth-error">{error}</div>}<div className="modal-actions">{step>1&&<button type="button" onClick={()=>setStep(current=>current-1)}>Back</button>}{step<3?<button type="button" className="primary-btn" onClick={next}>Continue</button>:<button className="primary-btn" disabled={busy}>{busy?"Posting…":"Send request"}</button>}</div></form>;
}

function AuthForm({onAuthenticated,language,initialMode="login"}:{onAuthenticated:(user:SessionUser)=>void;language:Language;initialMode?:"login"|"register"}) {
  const [mode,setMode]=useState<"login"|"register">(initialMode);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  const [showTerms,setShowTerms]=useState(false);
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
  const consentId=`terms-consent-${mode}`;
  const t=translations[language];
  return <>
    <form onSubmit={submitAuth} className="auth-form">
      <span className="kicker">{t.welcome}</span>
      <h2>{mode==="login"?t.signInAccount:t.createNearlioAccount}</h2>
      <p className="muted">{mode==="login"?t.loginDescription:t.registerDescription}</p>
      <div className="auth-tabs"><button type="button" className={mode==="login"?"active":""} onClick={()=>{setMode("login");setError("")}}>{t.signIn}</button><button type="button" className={mode==="register"?"active":""} onClick={()=>{setMode("register");setError("")}}>{t.createAccount}</button></div>
      {mode==="register"&&<><label>{t.fullName}<input name="fullName" required minLength={2} autoComplete="name" placeholder={t.fullName}/></label><div className="form-row"><label>{t.emailAddress}<input name="email" required type="email" autoComplete="email" placeholder="you@example.com"/></label><label>{t.mobileNumber}<input name="phone" required type="tel" pattern="[0-9 +()-]{10,18}" autoComplete="tel" placeholder={t.mobileNumber}/></label></div><label>{t.joinAs}<select name="role" defaultValue="customer"><option value="customer">{t.customerBook}</option><option value="provider">{t.providerReceive}</option></select></label></>}
      {mode==="login"&&<label>{t.emailMobile}<input name="identifier" required autoComplete="username" placeholder={t.emailMobile}/></label>}
      <label>{t.password}<input name="password" required type="password" minLength={8} autoComplete={mode==="login"?"current-password":"new-password"} placeholder={t.passwordPlaceholder}/></label>
      {mode==="register"&&<p className="password-hint">{t.passwordHint}</p>}
      <div className="terms-consent"><input id={consentId} name="acceptedTerms" type="checkbox" required/><label htmlFor={consentId}>{t.consent}</label><button type="button" onClick={()=>setShowTerms(true)}>{t.readTerms}</button></div>
      {error&&<div className="auth-error" role="alert">{error}</div>}
      <button type="submit" className="primary-btn wide" disabled={busy}>{busy?t.pleaseWait:mode==="login"?t.agreeSignIn:t.agreeCreate}</button>
      <p className="legal">{t.passwordSecure}</p>
    </form>
    {showTerms&&<UserTerms onClose={()=>setShowTerms(false)}/>} 
  </>
}

function UserTerms({onClose}:{onClose:()=>void}) {
  return <section className="terms-sheet" role="dialog" aria-modal="true" aria-labelledby="terms-title">
    <div className="terms-sheet-head"><div><span className="kicker">NEARLEO USER AGREEMENT</span><h2 id="terms-title">User Terms & Privacy Notice</h2><p>Effective 5 August 2026 · Version {TERMS_VERSION}</p></div><button type="button" onClick={onClose} aria-label="Close terms">×</button></div>
    <div className="terms-content">
      <div className="terms-alert"><b>Respect every user’s privacy.</b><span>Contact details may be used only for the service request or booking that made them available.</span></div>
      <h3>1. Who may use Nearleo</h3><p>You must be at least 18 years old, provide accurate account information and keep your password secure. You are responsible for activity under your account.</p>
      <h3>2. Marketplace role</h3><p>Nearleo helps local customers and independent service professionals find and contact each other. Providers are not Nearleo employees. Customers and providers must agree directly on scope, price, materials, timing and payment before work starts.</p>
      <h3>3. Contact and messaging rules</h3><ul><li>Contact another user only about a genuine service enquiry, quotation, booking or active job.</li><li>Do not send spam, promotions, repeated messages after someone asks you to stop, or messages unrelated to the requested service.</li><li>No harassment, threats, abusive, discriminatory, sexual, romantic or otherwise unwanted messages or calls.</li><li>Do not copy, sell, publish, scrape or share another person’s phone number, email, address, identity document or profile data.</li><li>WhatsApp or phone contact is allowed only when the user has chosen to share that contact method. Stop immediately if consent is withdrawn.</li></ul>
      <h3>4. Honest and safe use</h3><p>Do not impersonate others, create fake requests or reviews, misrepresent qualifications, submit unlawful content, demand advance money dishonestly, bypass safety controls or use Nearleo for fraud. Providers must perform only work they are qualified and legally permitted to perform.</p>
      <h3>5. Privacy notice</h3><p>Nearleo processes account details, contact information, approximate or selected location, requests, bookings, messages, profile information and provider verification documents to operate and secure the marketplace. Only information needed for matching and completing a service should be shared. Identity documents and exact coordinates are not intended for public display. Nearleo does not treat acceptance of these terms as consent to unrelated promotional messaging.</p>
      <h3>6. External communication and payments</h3><p>WhatsApp, phone calls and payments outside Nearleo are provided by third parties and carry additional risk. Verify the other user, keep written estimates and receipts, and never share passwords, OTPs, card PINs or banking credentials.</p>
      <h3>7. Reports and enforcement</h3><p>Users should report harassment, spam, fraud, unsafe conduct or privacy misuse to Nearleo administration and preserve relevant evidence. Nearleo may restrict messaging, reject provider verification, suspend or remove accounts and cooperate with lawful authorities when reasonably necessary to protect users or the platform.</p>
      <h3>8. Service disputes and emergencies</h3><p>Nearleo does not guarantee a provider’s work, availability or quoted price. Users remain responsible for deciding whether to hire or accept a job. Nearleo is not an emergency service; contact the appropriate emergency authority when anyone is in immediate danger.</p>
      <h3>9. Changes and law</h3><p>Nearleo may update these terms when the service or legal requirements change and will request acceptance of a new version where appropriate. These terms are governed by applicable laws of India. Nothing here limits rights that cannot lawfully be excluded.</p>
    </div>
    <div className="terms-sheet-actions"><button type="button" className="primary-btn" onClick={onClose}>I understand</button></div>
  </section>
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
      ? "Platform activity will appear here as customers and professionals begin using Nearleo."
      : "Your service requests, quotations and bookings will appear here.";
  const prompt = role === "provider"
    ? ["Complete your professional profile","Add your services, coverage area and availability to start receiving enquiries."]
    : role === "admin"
      ? ["No platform activity yet","New customers, providers and bookings will appear here automatically."]
      : ["Post your first service request","Describe the work you need and nearby professionals will be able to send quotations."];
  return <div className="dash-page"><div className="page-heading"><div><span className="kicker">{role.toUpperCase()} DASHBOARD</span><h1>{role === "admin" ? "Platform overview" : `Welcome, ${firstName}!`}</h1><p>{description}</p></div><button className="primary-btn" onClick={role==="customer"?onRequest:()=>onAction("There is no activity report to download yet.")}>{role === "admin" ? "Platform status" : "Post a request"}</button></div><div className="stat-grid">{stats.map(([value,label],index)=><div className="stat-card" key={label}><i>{["↗","◫","₹","★"][index]}</i><b>{value}</b><span>{label}</span><small>No activity yet</small></div>)}</div><div className="dashboard-grid"><section className="panel"><div className="panel-head"><h3>Recent activity</h3></div><div className="clean-empty compact"><span>○</span><h3>No activity yet</h3><p>Real account activity will appear here.</p></div></section><section className="panel"><div className="panel-head"><h3>Get started</h3></div><div className="clean-empty compact"><span>＋</span><h3>{prompt[0]}</h3><p>{prompt[1]}</p></div></section></div></div>;
}

function ProviderEnquiryCard({item,onUpdated}:{item:ServiceRequest;onUpdated:(id:string,status:string)=>void}) {
  const [message,setMessage]=useState("");const [quoteAmount,setQuoteAmount]=useState("");const [availability,setAvailability]=useState("");const [busy,setBusy]=useState(false);const [error,setError]=useState("");const [sent,setSent]=useState(false);
  async function reply(event:FormEvent<HTMLFormElement>){event.preventDefault();setBusy(true);setError("");try{const response=await fetch(`/api/provider/requests/${item._id}/respond`,{method:"POST",headers:{"content-type":"application/json"},credentials:"include",body:JSON.stringify({message,quoteAmount:Number(quoteAmount),availability})});const result=await response.json();if(!response.ok)throw new Error(result.error||"Unable to send reply");setMessage("");setQuoteAmount("");setAvailability("");setSent(true);onUpdated(item._id,"quoted")}catch(problem){setError(problem instanceof Error?problem.message:"Unable to send reply")}finally{setBusy(false)}}
  async function updateJob(action:"start"|"complete"){setBusy(true);setError("");try{const response=await fetch(`/api/requests/${item._id}`,{method:"PATCH",headers:{"content-type":"application/json"},credentials:"include",body:JSON.stringify({action})});const result=await response.json();if(!response.ok)throw new Error(result.error||"Unable to update job");onUpdated(item._id,result.data.status)}catch(problem){setError(problem instanceof Error?problem.message:"Unable to update job")}finally{setBusy(false)}}
  const assigned=["accepted","in_progress"].includes(item.status);
  return <article className="provider-enquiry-card"><div><span className={`status-pill ${assigned?`status-${item.status}`:item.urgency==="Emergency"?"red":"amber"}`}>{assigned?requestStatusLabels[item.status]:item.urgency||"Flexible"}</span><h3>{item.service} request</h3><p>{item.description}</p></div><dl><div><dt>Customer</dt><dd>{item.customerName||"Nearleo customer"}</dd></div><div><dt>Location</dt><dd>{item.address}</dd></div><div><dt>Preferred</dt><dd>{item.preferredDate} · {item.preferredTime}</dd></div><div><dt>Request</dt><dd>{item.requestNumber}</dd></div></dl>{assigned?<div className="assigned-job-actions"><b>{item.status==="accepted"?"The customer selected you":"Work is marked in progress"}</b><p>Keep the customer informed and update the job when work begins or is completed.</p>{error&&<div className="auth-error">{error}</div>}<div>{item.status==="accepted"&&<button className="primary-btn" disabled={busy} onClick={()=>updateJob("start")}>Start work</button>}{item.status==="in_progress"&&<button className="primary-btn" disabled={busy} onClick={()=>updateJob("complete")}>Mark completed</button>}{item.whatsappNumber&&<a className="whatsapp-btn" href={whatsappUrl(item.whatsappNumber,`Hello ${item.customerName||"there"}, I am contacting you about ${item.requestNumber} on Nearleo.`)} target="_blank" rel="noreferrer">WhatsApp customer</a>}</div></div>:<form className="provider-reply-form" onSubmit={reply}><label>Message to customer<textarea value={message} onChange={event=>setMessage(event.target.value)} minLength={3} required placeholder="Introduce yourself and explain how you can help…"/></label><div className="form-row"><label>Estimated price (₹)<input type="number" min="0" max="10000000" value={quoteAmount} onChange={event=>setQuoteAmount(event.target.value)} required placeholder="e.g. 1500"/></label><label>Your availability<input value={availability} onChange={event=>setAvailability(event.target.value)} minLength={3} required placeholder="e.g. Tomorrow morning"/></label></div>{error&&<div className="auth-error">{error}</div>}{sent&&<div className="reply-sent">✓ Reply and estimate saved</div>}<div><button className="primary-btn" disabled={busy}>{busy?"Sending…":"Send reply & estimate"}</button>{item.whatsappNumber&&<a className="whatsapp-btn" href={whatsappUrl(item.whatsappNumber,`Hello ${item.customerName||"there"}, I am responding to your ${item.service} request ${item.requestNumber} on Nearleo.`)} target="_blank" rel="noreferrer">WhatsApp customer</a>}</div></form>}</article>;
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
  return <div className="dash-page"><div className="page-heading"><div><span className="kicker">PROVIDER DASHBOARD</span><h1>Welcome, {firstName}!</h1><p>View customer requests that match your listed service. Verification is not required.</p></div><div className="page-heading-actions"><button className="ghost-btn" onClick={onView}>View profile</button><button className="primary-btn" onClick={onSetup}>Set up profile</button></div></div><div className="stat-grid">{stats.map(([value,label],index)=><div className="stat-card" key={label}><i>{["↗","◫","₹","★"][index]}</i><b>{value}</b><span>{label}</span><small>{index<2&&enquiries.length?"Live customer requests":"No activity yet"}</small></div>)}</div><div className="dashboard-grid provider-dashboard-grid"><section className="panel provider-enquiries"><div className="panel-head"><h3>Requests and active jobs</h3><span>{enquiries.length} items</span></div>{loadingEnquiries?<div className="clean-empty compact"><h3>Loading enquiries…</h3></div>:enquiryError?<div className="auth-error">{enquiryError}</div>:!profileReady?<div className="clean-empty compact"><span>○</span><h3>Complete your provider profile</h3><p>Add the required service, location and contact details to receive matching requests.</p></div>:enquiries.length===0?<div className="clean-empty compact"><span>○</span><h3>No matching enquiries yet</h3><p>New customer requests for your service will appear here automatically.</p></div>:<div className="provider-enquiry-list">{enquiries.map(item=><ProviderEnquiryCard key={item._id} item={item} onUpdated={(id,status)=>setEnquiries(current=>status==="completed"?current.filter(entry=>entry._id!==id):current.map(entry=>entry._id===id?{...entry,quoteCount:status==="quoted"?entry.quoteCount+1:entry.quoteCount,status}:entry))}/>)}</div>}</section><section className="panel"><div className="panel-head"><h3>Professional profile</h3><button onClick={onView}>View profile</button></div><div className="clean-empty compact"><span>＋</span><h3>Manage your profile</h3><p>Review and update the information customers see. Optional verification documents can be added any time.</p><button className="primary-btn" onClick={onSetup}>Edit profile</button></div></section></div></div>;
}

function ProviderProfileForm({user,onSaved,language}:{user:SessionUser;onSaved:(user:SessionUser)=>void;language:Language}) {
  const [profile,setProfile]=useState<any>(null);
  const [profileService,setProfileService]=useState("");
  const [loading,setLoading]=useState(true);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  const [serviceLocation,setServiceLocation]=useState<MapLocation|null>(null);
  useEffect(()=>{
    fetch("/api/providers/me",{credentials:"include"}).then(async response=>{
      const result=await response.json();
      if(!response.ok) throw new Error(result.error||"Unable to load profile");
      const loaded=result.profile||{};setProfile(loaded);setProfileService(typeof loaded.service==="string"?loaded.service:"");
      const point=loaded.location?.coordinates;if(Array.isArray(point))setServiceLocation({longitude:Number(point[0]),latitude:Number(point[1]),label:loaded.locality||"Service location"});
    }).catch(problem=>setError(problem instanceof Error?problem.message:"Unable to load profile")).finally(()=>setLoading(false));
  },[]);
  async function save(event:FormEvent<HTMLFormElement>) {
    event.preventDefault();setBusy(true);setError("");
    const form=new FormData(event.currentTarget);
    let selectedService=String(form.get("service")||"");
    if(!serviceNames.includes(selectedService)){selectedService=matchingServices(selectedService,language)[0]||"";if(!selectedService){setError("Choose your main service from the suggestions.");setBusy(false);return;}form.set("service",selectedService);setProfileService(selectedService)}
    try {
      const response=await fetch("/api/providers/me",{method:"PUT",credentials:"include",body:form});
      const result=await response.json();
      if(!response.ok) throw new Error(result.error||"Unable to save profile");
      onSaved(result.user);
    } catch(problem) { setError(problem instanceof Error?problem.message:"Unable to save profile"); }
    finally { setBusy(false); }
  }
  if(loading) return <div className="profile-loading">Loading your profile…</div>;
  return <form className="provider-profile-form" onSubmit={save}><span className="kicker">PROFESSIONAL PROFILE</span><h2>{profile?._id?"Update your profile":"Set up your profile"}</h2><p className="muted">Your profile is listed immediately after saving the required details. Photos, description and identity documents are optional.</p>{profile?.verificationStatus&&<div className={`verification-banner ${profile.verificationStatus}`}><b>{profile.verificationStatus==="approved"?"✓ Verified":"Unverified"}</b><span>{profile.verificationStatus==="approved"?"Nearleo has verified your profile.":"Your profile is public and contactable. Add optional documents if you want to request verification."}</span></div>}<label>Your name<input value={user.fullName} disabled/></label><label>Business or professional name<input name="businessName" required minLength={2} maxLength={100} defaultValue={profile?.businessName||""} placeholder="Example: Jiji Electrical Services"/></label><div className="form-row"><label>Main service<ServiceAutocomplete name="service" value={profileService} onChange={setProfileService} placeholder="Type your service, even with a spelling mistake" ariaLabel="Main professional service" language={language} required restrictToServices/></label><label>Years of experience<input name="experienceYears" required type="number" min="0" max="60" defaultValue={profile?.experienceYears??0}/></label></div><div className="form-row"><label>Starting price (₹)<input name="startingPrice" required type="number" min="0" max="1000000" defaultValue={profile?.startingPrice??299}/></label><label>Phone number<input name="phone" required type="tel" minLength={10} maxLength={24} defaultValue={profile?.phone||""} placeholder="Contact number"/></label></div><label>Service area<input name="locality" required minLength={2} maxLength={100} defaultValue={profile?.locality||"Kochi, Kerala"} placeholder="Area, city"/></label><div className="profile-location"><div className="profile-location-head"><b>Service location on map</b><span>Customers only see the distance, not your exact coordinates.</span></div><LocationPicker value={serviceLocation} onChange={setServiceLocation}/><input type="hidden" name="latitude" value={serviceLocation?.latitude??""}/><input type="hidden" name="longitude" value={serviceLocation?.longitude??""}/>{!serviceLocation&&<small className="location-required">Use mobile location or choose a point on the map.</small>}</div><label>About your services (optional)<textarea name="description" maxLength={800} defaultValue={profile?.description||""} placeholder="Describe your skills, typical jobs and what customers can expect."/></label><div className="provider-social-fields"><div><b>Social media profiles (optional)</b><span>Add your professional pages so customers can follow your work.</span></div><label>Instagram<input name="instagramUrl" type="url" defaultValue={profile?.instagramUrl||""} placeholder="https://instagram.com/yourprofile"/></label><label>Facebook<input name="facebookUrl" type="url" defaultValue={profile?.facebookUrl||""} placeholder="https://facebook.com/yourpage"/></label><label>YouTube<input name="youtubeUrl" type="url" defaultValue={profile?.youtubeUrl||""} placeholder="https://youtube.com/@yourchannel"/></label></div><div className="portfolio-upload"><div><b>Recent work gallery</b><span>Only your uploaded work appears on your public profile.</span></div><label>Choose up to 4 images<input name="recentWork" type="file" accept="image/jpeg,image/png,image/webp" multiple/><em>New images replace the current gallery · maximum 3.5 MB combined</em></label>{Array.isArray(profile?.portfolioImageIds)&&profile.portfolioImageIds.length>0&&<label className="remove-portfolio"><input name="removePortfolio" type="checkbox"/><span>Remove all {profile.portfolioImageIds.length} current work image{profile.portfolioImageIds.length===1?"":"s"}</span></label>}</div><div className="identity-upload-grid"><label>Profile photo (optional) {profile?.profilePhotoId&&<small>Current photo saved</small>}<input name="profilePhoto" type="file" accept="image/jpeg,image/png,image/webp"/><em>Clear face photo · JPG, PNG or WebP · max 4 MB</em></label><label>ID card — front (optional) {profile?.idCardFrontId&&<small>Current ID saved</small>}<input name="idCardFront" type="file" accept="image/jpeg,image/png,image/webp"/><em>Government-issued identity card · max 4 MB</em></label><label>ID card — back (optional) {profile?.idCardBackId&&<small>Current image saved</small>}<input name="idCardBack" type="file" accept="image/jpeg,image/png,image/webp"/><em>Upload if your ID contains details on both sides</em></label></div><div className="privacy-note"><b>🔒 Private identity verification</b><span>ID images are optional, private and never shown publicly. Only authorised Nearleo administrators can review uploaded documents.</span></div><div className="profile-checks"><label><input name="available" type="checkbox" defaultChecked={profile?.available??true}/> Available for new work</label><label><input name="emergency" type="checkbox" defaultChecked={profile?.emergency??false}/> Emergency service offered</label></div>{error&&<div className="auth-error" role="alert">{error}</div>}<button className="primary-btn wide" type="submit" disabled={busy}>{busy?"Saving…":profile?._id?"Save profile changes":"Save and publish profile"}</button></form>;
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
  return <div className="location-picker"><div className="place-search" role="search"><input value={placeQuery} onChange={event=>setPlaceQuery(event.target.value)} onKeyDown={event=>{if(event.key==="Enter"){event.preventDefault();searchPlace()}}} placeholder="Search area, town, landmark or postcode" aria-label="Search location"/><button type="button" onClick={searchPlace} disabled={searching}>{searching?"Searching…":"Search"}</button></div>{placeResults.length>0&&<div className="place-results">{placeResults.map((result,index)=><button type="button" key={`${result.latitude}-${result.longitude}-${index}`} onClick={()=>{onChange(result);setPlaceQuery(result.label||"");setPlaceResults([])}}><b><LocationPinIcon/></b><span>{result.label}</span></button>)}</div>}<button type="button" className="gps-button" onClick={detect} disabled={locating}><LocationPinIcon/>{locating?"Detecting your location…":"Use my current mobile location"}</button><div ref={containerRef} className="map-canvas" aria-label="Choose location on map"/>{value&&<div className="coordinate-chip">✓ Location selected · {value.label||`${value.latitude.toFixed(5)}, ${value.longitude.toFixed(5)}`}</div>}{error&&<div className="location-error">{error}</div>}</div>;
}

function ProviderProfilePreview() {
  const [profile,setProfile]=useState<any>(null);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");
  useEffect(()=>{fetch("/api/providers/me",{credentials:"include"}).then(async response=>{const result=await response.json();if(!response.ok)throw new Error(result.error);setProfile(result.profile)}).catch(problem=>setError(problem instanceof Error?problem.message:"Unable to load profile")).finally(()=>setLoading(false))},[]);
  if(loading)return <div className="profile-loading">Loading your profile…</div>;
  if(error)return <div className="auth-error">{error}</div>;
  if(!profile)return <div className="clean-empty"><span>＋</span><h3>No professional profile yet</h3><p>Complete the required details to publish your profile.</p></div>;
  const status=profile.verificationStatus||"pending";
  return <div className="provider-profile-preview"><span className="kicker">PROFILE INFORMATION</span><div className="preview-identity">{profile.profilePhotoId?<img src="/api/providers/me/photo" alt={`${profile.name} profile`}/>:<div className="preview-avatar">{profile.initials||"LS"}</div>}<div><span className={`verification-badge ${status}`}>{status==="approved"?"✓ VERIFIED":"UNVERIFIED"}</span><h2>{profile.businessName}</h2><p>{profile.name} · {profile.service}</p></div></div>{status==="rejected"&&<div className="rejection-box"><b>Admin feedback</b><span>{profile.rejectionReason||"Update your profile and resubmit."}</span></div>}<div className="preview-info-grid"><div><span>Service</span><b>{profile.service}</b></div><div><span>Experience</span><b>{profile.experienceYears} years</b></div><div><span>Starting price</span><b>₹{profile.startingPrice}</b></div><div><span>Service area</span><b>{profile.locality}</b></div><div><span>Phone</span><b>{profile.phone}</b></div><div><span>Email</span><b>{profile.contactEmail||"Account email"}</b></div><div><span>Availability</span><b>{profile.available?"Available for work":"Currently unavailable"}</b></div><div className="wide"><span>About</span><p>{profile.description}</p></div></div><div className="preview-security"><b>Identity verification documents</b><span>{profile.idCardFrontId?"✓ ID front uploaded":"ID front missing"} · {profile.idCardBackId?"✓ ID back uploaded":"ID back optional"}</span></div><p className="preview-note">Your exact map coordinates and identity images remain private. Customers see your public profile and their distance from you.</p></div>;
}
