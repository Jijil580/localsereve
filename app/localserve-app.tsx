"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { translations } from "./i18n";

type View = "home" | "search" | "requests" | "messages" | "dashboard";
type SessionUser = { id: string; fullName: string; email: string; role: "customer" | "provider" | "admin" };
type Provider = {
  id: number; name: string; business: string; service: string; rating: number; reviews: number;
  distance: number; experience: number; price: number; available: boolean; emergency?: boolean;
  verified: boolean; image: string; cover: string; description: string; jobs: number; locality: string;
};

const categories = [
  ["⚡", "Electrician", "214 nearby"], ["🔧", "Plumber", "182 nearby"],
  ["❄️", "AC Repair", "96 nearby"], ["🧹", "Home Cleaning", "134 nearby"],
  ["🪚", "Carpenter", "88 nearby"], ["🎨", "Painter", "76 nearby"],
  ["📷", "Photographer", "61 nearby"], ["🌿", "Gardening", "49 nearby"],
  ["🚗", "Mechanic", "107 nearby"], ["🧱", "Renovation", "42 nearby"],
  ["💻", "Tech Repair", "92 nearby"], ["⋯", "All services", "100+ categories"],
];

const providers: Provider[] = [
  { id: 1, name: "Arun Kumar", business: "AK Electrical Solutions", service: "Electrician", rating: 4.9, reviews: 128, distance: 2.4, experience: 12, price: 299, available: true, emergency: true, verified: true, image: "AK", cover: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=900&q=80", description: "Licensed electrician for home wiring, installations and 24/7 emergency repairs.", jobs: 386, locality: "Kakkanad, Kochi" },
  { id: 2, name: "Meera Nair", business: "CleanNest Services", service: "Home Cleaning", rating: 4.8, reviews: 94, distance: 4.1, experience: 7, price: 499, available: true, verified: true, image: "MN", cover: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=900&q=80", description: "Trained, background-checked team for deep cleaning and move-in services.", jobs: 242, locality: "Edappally, Kochi" },
  { id: 3, name: "Rasheed P.M.", business: "CoolCare AC Experts", service: "AC Repair", rating: 4.7, reviews: 76, distance: 5.8, experience: 9, price: 399, available: false, verified: true, image: "RP", cover: "https://images.unsplash.com/photo-1631545806609-7b708a62e454?auto=format&fit=crop&w=900&q=80", description: "Same-day AC service, installation and annual maintenance for all major brands.", jobs: 195, locality: "Palarivattom, Kochi" },
  { id: 4, name: "Suresh Babu", business: "WoodCraft Interiors", service: "Carpenter", rating: 4.9, reviews: 53, distance: 7.2, experience: 18, price: 699, available: true, verified: false, image: "SB", cover: "https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=900&q=80", description: "Custom furniture, modular kitchens, repairs and polished interior woodwork.", jobs: 164, locality: "Vyttila, Kochi" },
];

export default function LocalServeApp() {
  const [view, setView] = useState<View>("home");
  const [query, setQuery] = useState("");
  const [radius, setRadius] = useState(20);
  const [sort, setSort] = useState("recommended");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [availableOnly, setAvailableOnly] = useState(false);
  const [saved, setSaved] = useState<number[]>([2]);
  const [selected, setSelected] = useState<Provider | null>(null);
  const [modal, setModal] = useState<"booking" | "request" | "auth" | null>(null);
  const [toast, setToast] = useState("");
  const [language, setLanguage] = useState<keyof typeof translations>("EN");
  const [role, setRole] = useState<"customer" | "provider" | "admin">("customer");
  const [messages, setMessages] = useState(["Hello! I need help with a switchboard.", "Sure — I can visit today after 4 PM."]);
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null);
  const t = translations[language];

  useEffect(() => {
    fetch("/api/auth/session", { credentials: "include" })
      .then(response => response.ok ? response.json() : { user: null })
      .then(data => setCurrentUser(data.user ?? null))
      .catch(() => setCurrentUser(null));
  }, []);

  const results = useMemo(() => {
    const q = query.toLowerCase();
    const list = providers.filter(p => (!q || `${p.name} ${p.business} ${p.service}`.toLowerCase().includes(q)) && p.distance <= radius && (!verifiedOnly || p.verified) && (!availableOnly || p.available));
    return [...list].sort((a,b) => sort === "nearest" ? a.distance-b.distance : sort === "rating" ? b.rating-a.rating : sort === "price" ? a.price-b.price : b.jobs-a.jobs);
  }, [query, radius, verifiedOnly, availableOnly, sort]);

  function notify(message: string) { setToast(message); setTimeout(() => setToast(""), 2600); }
  function goSearch(service?: string) { if (service && service !== "All services") setQuery(service); setView("search"); window.scrollTo({top:0, behavior:"smooth"}); }
  function openProtected(nextView: View) { if (!currentUser) return setModal("auth"); setView(nextView); }
  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    setCurrentUser(null); setView("home"); notify("You have been signed out.");
  }
  function useLocation() {
    if (!navigator.geolocation) return notify("Location is not supported on this device.");
    navigator.geolocation.getCurrentPosition(() => notify("Location updated to your current position."), () => notify("Location permission was not granted."));
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <button className="brand" onClick={() => setView("home")} aria-label="LocalServe home"><span className="brand-mark">L</span><span>Local<span>Serve</span></span></button>
        <nav className="desktop-nav" aria-label="Main navigation">
          <button className={view === "home" ? "active" : ""} onClick={() => setView("home")}>Home</button>
          <button className={view === "search" ? "active" : ""} onClick={() => goSearch()}>Find services</button>
          <button className={view === "requests" ? "active" : ""} onClick={() => openProtected("requests")}>My requests</button>
          <button className={view === "messages" ? "active" : ""} onClick={() => openProtected("messages")}>Messages {currentUser && <span className="nav-dot">2</span>}</button>
        </nav>
        <div className="header-actions">
          <button className="location-mini" onClick={useLocation}>⌖ <span>Kochi</span></button>
          <button className="language" onClick={() => setLanguage(language === "EN" ? "HI" : language === "HI" ? "ML" : "EN")}>{language}</button>
          <button className="ghost-btn desktop-only" onClick={() => {setRole("provider"); currentUser ? setView("dashboard") : setModal("auth")}}>For professionals</button>
          {currentUser ? <><button className="account-chip" onClick={() => {setRole(currentUser.role);setView("dashboard")}}><span>{currentUser.fullName.split(" ").map(x=>x[0]).slice(0,2).join("")}</span><b>{currentUser.fullName.split(" ")[0]}</b></button><button className="signout-btn" onClick={signOut}>Sign out</button></> : <button className="primary-btn small" onClick={() => setModal("auth")}>Sign in</button>}
        </div>
      </header>

      <main>
        {view === "home" && <>
          <section className="hero">
            <div className="hero-copy">
              <div className="eyebrow"><span>✓</span> 12,000+ verified professionals</div>
              <h1>{t.find}<span>.</span></h1>
              <p>Book skilled local professionals for every job — with transparent pricing, verified reviews and reliable support.</p>
              <form className="hero-search" onSubmit={e => {e.preventDefault(); goSearch()}}>
                <label className="search-field"><span>⌕</span><input value={query} onChange={e => setQuery(e.target.value)} placeholder={t.search} aria-label="Service search" /></label>
                <button type="button" className="location-field" onClick={useLocation}><span>⌖</span><span><small>LOCATION</small>{t.location}</span></button>
                <button className="search-submit">Search</button>
              </form>
              <div className="popular-searches"><span>Popular:</span>{["Electrician","AC repair","Cleaning","Plumber"].map(x => <button key={x} onClick={() => goSearch(x)}>{x}</button>)}</div>
            </div>
            <div className="hero-visual" aria-label="Trusted service professional">
              <img src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=1000&q=85" alt="Local service professionals at work" />
              <div className="float-card rating-float"><div className="avatar-mini">AK</div><div><b>Arun Kumar</b><span>★★★★★ <em>4.9</em></span></div><i>✓</i></div>
              <div className="float-card jobs-float"><b>1,200+</b><span>jobs completed today</span></div>
            </div>
          </section>

          <section className="trust-strip"><div><b>12K+</b><span>Verified experts</span></div><div><b>4.8/5</b><span>Average rating</span></div><div><b>50K+</b><span>Jobs completed</span></div><div><b>24/7</b><span>Customer support</span></div></section>

          <section className="section categories-section">
            <div className="section-head"><div><span className="kicker">EXPLORE SERVICES</span><h2>What do you need help with?</h2></div><button onClick={() => goSearch()}>View all services →</button></div>
            <div className="category-grid">{categories.map(([icon,name,count]) => <button className="category-card" key={name} onClick={() => goSearch(name)}><span className="category-icon">{icon}</span><b>{name}</b><small>{count}</small><i>›</i></button>)}</div>
          </section>

          <section className="section provider-section">
            <div className="section-head"><div><span className="kicker">HIGHLY RATED</span><h2>{t.nearby}</h2><p>Handpicked based on ratings, reliability and distance.</p></div><button onClick={() => goSearch()}>See all professionals →</button></div>
            <div className="provider-grid">{providers.slice(0,3).map(p => <ProviderCard key={p.id} provider={p} saved={saved.includes(p.id)} onSave={() => setSaved(s => s.includes(p.id) ? s.filter(x=>x!==p.id) : [...s,p.id])} onView={() => setSelected(p)} onBook={() => {setSelected(p);setModal("booking")}} />)}</div>
          </section>

          <section className="how-section"><div className="how-copy"><span className="kicker light">SIMPLE & SECURE</span><h2>From search to service,<br/>we make it easy.</h2><p>Book confidently with verified professionals and transparent updates at every step.</p><button className="light-btn" onClick={() => setModal("request")}>Post a service request</button></div><div className="steps">{[["01","Tell us what you need","Search or post your requirement in under a minute."],["02","Choose a professional","Compare profiles, prices, portfolios and verified reviews."],["03","Book and relax","Track the job, pay securely and rate the service."]].map(([n,h,p]) => <div className="step" key={n}><span>{n}</span><div><h3>{h}</h3><p>{p}</p></div></div>)}</div></section>

          <section className="cta-band"><div><span className="kicker">GROW YOUR BUSINESS</span><h2>Skilled professional? Meet your next customer.</h2><p>Create a free profile, showcase your work and receive nearby enquiries.</p></div><button onClick={() => {setRole("provider");setView("dashboard")}}>Join as a professional →</button></section>
        </>}

        {view === "search" && <SearchView query={query} setQuery={setQuery} radius={radius} setRadius={setRadius} sort={sort} setSort={setSort} verifiedOnly={verifiedOnly} setVerifiedOnly={setVerifiedOnly} availableOnly={availableOnly} setAvailableOnly={setAvailableOnly} results={results} saved={saved} setSaved={setSaved} setSelected={setSelected} setModal={setModal} />}
        {view === "requests" && <RequestsView onPost={() => setModal("request")} />}
        {view === "messages" && <MessagesView messages={messages} setMessages={setMessages} />}
        {view === "dashboard" && <Dashboard role={role} setRole={setRole} onAction={notify} />}
      </main>

      <footer><div className="footer-brand"><div className="brand"><span className="brand-mark">L</span><span>Local<span>Serve</span></span></div><p>Trusted local services, one tap away.</p></div><div><b>Customers</b><a>Find services</a><a>Post a request</a><a>Safety</a></div><div><b>Professionals</b><a>Join LocalServe</a><a>Plans & pricing</a><a>Provider help</a></div><div><b>Company</b><a>About</a><a>Contact</a><a>Privacy & terms</a></div><div className="footer-bottom">© 2026 LocalServe. Made for local communities. <span>English · हिन्दी · മലയാളം</span></div></footer>

      <nav className="mobile-nav" aria-label="Mobile navigation">{[["⌂","Home","home"],["⌕","Search","search"],["＋","Requests","requests"],["✉","Messages","messages"],["◉","Profile","dashboard"]].map(([icon,label,id]) => <button className={view===id ? "active" : ""} onClick={() => (["requests","messages","dashboard"].includes(id) ? openProtected(id as View) : setView(id as View))} key={id}><span>{icon}</span>{label}</button>)}</nav>
      {selected && !modal && <ProviderDrawer provider={selected} saved={saved.includes(selected.id)} onClose={() => setSelected(null)} onBook={() => setModal("booking")} onSave={() => setSaved(s => s.includes(selected.id) ? s.filter(x=>x!==selected.id) : [...s,selected.id])} />}
      {modal && <AppModal type={modal} provider={selected} onClose={() => setModal(null)} onAuthenticated={(user) => {setCurrentUser(user);setRole(user.role);setModal(null);notify(`Welcome, ${user.fullName.split(" ")[0]}!`);setView("dashboard")}} onSuccess={(msg) => {setModal(null); notify(msg); if(modal!=="auth")setView("requests")}} />}
      {toast && <div className="toast" role="status">✓ {toast}</div>}
    </div>
  );
}

function ProviderCard({provider:p,saved,onSave,onView,onBook}:{provider:Provider;saved:boolean;onSave:()=>void;onView:()=>void;onBook:()=>void}) {
  return <article className="provider-card"><div className="provider-cover"><img src={p.cover} alt={`${p.service} work by ${p.business}`} /><span className="distance">⌖ {p.distance} km</span><button className={`save ${saved?"saved":""}`} onClick={onSave} aria-label="Save provider">{saved?"♥":"♡"}</button></div><div className="provider-body"><div className="provider-title"><div className="avatar">{p.image}</div><div><h3>{p.business} {p.verified&&<span className="verified">✓</span>}</h3><p>{p.service} · {p.experience} years</p></div></div><div className="rating"><b>★ {p.rating}</b><span>({p.reviews} reviews)</span><i className={p.available?"open":"closed"}>{p.available?"Available today":"Next: tomorrow"}</i></div><p className="description">{p.description}</p><div className="provider-meta"><span>From <b>₹{p.price}</b></span><span>{p.jobs} jobs done</span></div><div className="card-actions"><button onClick={onView}>View profile</button><button className="primary-btn" onClick={onBook}>Book now</button></div></div></article>;
}

function SearchView(props:any) {
  return <div className="search-page"><div className="search-top"><span className="kicker">DISCOVER PROFESSIONALS</span><h1>Find the right expert nearby</h1><div className="search-bar-page"><input value={props.query} onChange={(e:any)=>props.setQuery(e.target.value)} placeholder="Search service, provider or business"/><button>⌖ Kochi, Kerala</button><button className="primary-btn">Search</button></div></div><div className="search-layout"><aside className="filters"><div className="filter-title"><h3>Filters</h3><button onClick={()=>{props.setRadius(60);props.setVerifiedOnly(false);props.setAvailableOnly(false)}}>Reset</button></div><label><span>Distance <b>{props.radius} km</b></span><input type="range" min="5" max="60" step="5" value={props.radius} onChange={e=>props.setRadius(+e.target.value)}/></label><fieldset><legend>Trust & availability</legend><label className="check"><input type="checkbox" checked={props.verifiedOnly} onChange={e=>props.setVerifiedOnly(e.target.checked)}/><span>Verified providers only</span></label><label className="check"><input type="checkbox" checked={props.availableOnly} onChange={e=>props.setAvailableOnly(e.target.checked)}/><span>Available today</span></label><label className="check"><input type="checkbox"/><span>Emergency service</span></label><label className="check"><input type="checkbox"/><span>Home visit</span></label></fieldset><fieldset><legend>Minimum rating</legend><div className="rating-filter">{["4.5+","4.0+","3.5+"].map(x=><button key={x}>★ {x}</button>)}</div></fieldset><fieldset><legend>Price range</legend><div className="two-inputs"><input placeholder="₹ Min"/><input placeholder="₹ Max"/></div></fieldset></aside><section className="results"><div className="results-head"><div><h2>{props.results.length} professionals found</h2><p>Within {props.radius} km of Kochi</p></div><select value={props.sort} onChange={e=>props.setSort(e.target.value)} aria-label="Sort results"><option value="recommended">Recommended</option><option value="nearest">Nearest first</option><option value="rating">Highest rated</option><option value="price">Lowest price</option></select></div>{props.results.length ? <div className="result-list">{props.results.map((p:Provider)=><ProviderCard key={p.id} provider={p} saved={props.saved.includes(p.id)} onSave={()=>props.setSaved((s:number[])=>s.includes(p.id)?s.filter(x=>x!==p.id):[...s,p.id])} onView={()=>props.setSelected(p)} onBook={()=>{props.setSelected(p);props.setModal("booking")}}/>)}</div>:<div className="empty"><span>⌕</span><h3>No professionals found</h3><p>Try a wider distance or fewer filters.</p><button className="primary-btn" onClick={()=>props.setRadius(60)}>Search within 60 km</button></div>}</section></div></div>;
}

function RequestsView({onPost}:{onPost:()=>void}) { return <div className="dash-page"><div className="page-heading"><div><span className="kicker">SERVICE REQUESTS</span><h1>My requests</h1><p>Compare quotes and follow every job from one place.</p></div><button className="primary-btn" onClick={onPost}>＋ Post a new request</button></div><div className="request-summary"><div><span>2</span>Active requests</div><div><span>5</span>Quotes received</div><div><span>1</span>Upcoming booking</div></div><div className="request-card"><div className="request-icon">⚡</div><div><span className="status-pill amber">QUOTES RECEIVED</span><h3>Electrical switchboard repair</h3><p>Kakkanad · Preferred today, 4–6 PM</p><div className="quote-avatars"><i>AK</i><i>RS</i><i>+1</i><span>3 providers sent quotes</span></div></div><div className="request-price"><small>BEST QUOTE</small><b>₹850</b><button className="primary-btn">Compare quotes</button></div></div><div className="request-card"><div className="request-icon">🧹</div><div><span className="status-pill green">CONFIRMED</span><h3>2BHK deep cleaning</h3><p>Edappally · 08 Aug, 10:00 AM</p><div className="mini-pro"><i>MN</i><span><b>CleanNest Services</b><small>Booking #LS-2084</small></span></div></div><div className="request-price"><small>TOTAL</small><b>₹2,499</b><button>View booking</button></div></div></div> }

function MessagesView({messages,setMessages}:{messages:string[];setMessages:(m:string[])=>void}) { const [draft,setDraft]=useState(""); return <div className="chat-page"><aside className="conversations"><h2>Messages</h2><input placeholder="Search conversations"/><button className="conversation active"><i>AK</i><span><b>Arun Kumar</b><small>Sure — I can visit today...</small></span><em>2m</em></button><button className="conversation"><i>MN</i><span><b>CleanNest Services</b><small>Your booking is confirmed.</small></span><em>1d</em></button></aside><section className="chat"><div className="chat-head"><div className="avatar">AK</div><div><b>Arun Kumar <span className="verified">✓</span></b><small>Online now · Usually replies in 5 min</small></div><button>☎</button><button>⋯</button></div><div className="chat-body"><div className="date-chip">TODAY</div>{messages.map((m,i)=><div key={i} className={`bubble ${i%2?"theirs":"mine"}`}>{m}<small>{i%2?"3:42 PM":"3:40 PM"} {i%2?"":"✓✓"}</small></div>)}<div className="quote-message"><span>QUOTATION #Q-1042</span><div><b>Switchboard repair</b><b>₹850</b></div><p>Labour ₹650 · Parts ₹200 · 1 year warranty</p><button>View quotation</button></div></div><form className="chat-input" onSubmit={e=>{e.preventDefault();if(draft.trim()){setMessages([...messages,draft]);setDraft("")}}}><button type="button">＋</button><input value={draft} onChange={e=>setDraft(e.target.value)} placeholder="Type a message..."/><button type="button">🎙</button><button className="send">➤</button></form></section></div> }

function Dashboard({role,setRole,onAction}:{role:string;setRole:(r:any)=>void;onAction:(s:string)=>void}) { const stats = role==="admin"?[["12,482","Total users"],["3,291","Providers"],["8,640","Bookings"],["₹18.4L","Platform revenue"]]:role==="provider"?[["18","New enquiries"],["7","Upcoming jobs"],["₹42,860","This month"],["4.9","Average rating"]]:[["2","Active requests"],["5","Quotes received"],["3","Upcoming bookings"],["8","Saved providers"]]; return <div className="dash-page"><div className="role-switch"><span>Preview dashboard:</span>{["customer","provider","admin"].map(r=><button className={role===r?"active":""} onClick={()=>setRole(r)} key={r}>{r[0].toUpperCase()+r.slice(1)}</button>)}</div><div className="page-heading"><div><span className="kicker">{role.toUpperCase()} DASHBOARD</span><h1>{role==="provider"?"Good morning, Arun!":role==="admin"?"Platform overview":"Welcome back, Anjali!"}</h1><p>{role==="provider"?"You have 3 new enquiries waiting for a response.":role==="admin"?"Here is what is happening across LocalServe today.":"Here’s an overview of your service activity."}</p></div><button className="primary-btn" onClick={()=>onAction("Report downloaded successfully.")}>{role==="provider"?"Update availability":role==="admin"?"Download report":"Post a request"}</button></div><div className="stat-grid">{stats.map(([value,label],i)=><div className="stat-card" key={label}><i>{["↗","◫","₹","★"][i]}</i><b>{value}</b><span>{label}</span><small>↑ 12% this month</small></div>)}</div><div className="dashboard-grid"><section className="panel"><div className="panel-head"><h3>{role==="admin"?"Recent provider verifications":"Upcoming activity"}</h3><button>View all</button></div>{[1,2,3].map((x)=><div className="activity-row" key={x}><div className="activity-icon">{role==="admin"?"✓":x===1?"⚡":x===2?"🧹":"❄️"}</div><div><b>{role==="admin"?["GreenLine Plumbing","Vijay Electricals","Asha Home Care"][x-1]:["Switchboard repair","2BHK deep cleaning","AC general service"][x-1]}</b><span>{role==="admin"?"Documents submitted · Kochi":["Today · 4:00 PM","08 Aug · 10:00 AM","10 Aug · 11:30 AM"][x-1]}</span></div><span className={`status-pill ${x===1?"green":"amber"}`}>{role==="admin"?x===1?"REVIEW":"PENDING":x===1?"UPCOMING":"CONFIRMED"}</span><button>›</button></div>)}</section><section className="panel"><div className="panel-head"><h3>{role==="provider"?"Profile strength":"Booking progress"}</h3></div>{role==="provider"?<><div className="profile-score"><div><b>84%</b></div><p><b>Your profile looks great</b><span>Add 3 more portfolio projects to rank higher.</span></p></div><button className="outline-wide">Improve profile</button></>:<div className="timeline">{["Booking confirmed","Provider on the way","Work started","Work completed","Payment"].map((x,i)=><div className={i<2?"done":i===2?"current":""} key={x}><i>{i<2?"✓":i+1}</i><span><b>{x}</b><small>{i<2?"Completed":i===2?"Next step":"Pending"}</small></span></div>)}</div>}</section></div></div> }

function ProviderDrawer({provider:p,saved,onClose,onBook,onSave}:{provider:Provider;saved:boolean;onClose:()=>void;onBook:()=>void;onSave:()=>void}) { return <div className="overlay" onMouseDown={e=>{if(e.target===e.currentTarget)onClose()}}><aside className="provider-drawer"><button className="modal-close" onClick={onClose}>×</button><div className="drawer-cover"><img src={p.cover} alt={`${p.business} portfolio`}/></div><div className="drawer-content"><div className="profile-main"><div className="avatar large">{p.image}</div><div><h2>{p.business} <span className="verified">✓</span></h2><p>{p.name} · {p.service}</p><span className="status-pill green">AVAILABLE TODAY</span></div></div><div className="profile-stats"><div><b>★ {p.rating}</b><span>{p.reviews} reviews</span></div><div><b>{p.jobs}</b><span>Jobs done</span></div><div><b>{p.experience} yrs</b><span>Experience</span></div><div><b>{p.distance} km</b><span>Distance</span></div></div><h3>About</h3><p>{p.description} Serving homes and businesses across {p.locality}. Every job includes clear estimates, tidy workmanship and a service guarantee.</p><div className="tags"><span>English</span><span>हिन्दी</span><span>മലയാളം</span><span>Home visit</span><span>UPI accepted</span></div><h3>Popular services</h3><div className="service-price"><span><b>Inspection & diagnosis</b><small>30–45 minutes</small></span><b>₹{p.price}</b></div><div className="service-price"><span><b>Standard service visit</b><small>Materials charged separately</small></span><b>From ₹799</b></div><h3>Recent work</h3><div className="portfolio-row"><img src={p.cover} alt="Recent project"/><img src="https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=500&q=80" alt="Completed project"/></div><div className="drawer-actions"><button onClick={onSave}>{saved?"♥ Saved":"♡ Save"}</button><button>WhatsApp</button><button className="primary-btn" onClick={onBook}>Book service</button></div></div></aside></div> }

function AppModal({type,provider,onClose,onSuccess,onAuthenticated}:{type:string;provider:Provider|null;onClose:()=>void;onSuccess:(m:string)=>void;onAuthenticated:(u:SessionUser)=>void}) {
  const [step,setStep]=useState(1);
  const submit=(e:FormEvent)=>{e.preventDefault();onSuccess(type==="request"?"Your request is live. Nearby providers will be notified.":"Booking request sent. The provider will confirm shortly.")};
  return <div className="overlay"><div className="modal auth-modal"><button className="modal-close" onClick={onClose}>×</button>{type==="auth"?<AuthForm onAuthenticated={onAuthenticated}/>:<form onSubmit={submit}><span className="kicker">{type==="request"?"POST A REQUEST":"BOOK A SERVICE"}</span><h2>{type==="request"?"Tell us what you need":`Book ${provider?.business||"professional"}`}</h2><div className="stepper"><span className="active">1</span><i></i><span className={step>1?"active":""}>2</span><i></i><span className={step>2?"active":""}>3</span></div>{step===1&&<><label>Service category<select required defaultValue={provider?.service||""}><option value="" disabled>Select a service</option>{categories.slice(0,-1).map(x=><option key={x[1]}>{x[1]}</option>)}</select></label><label>Describe the work<textarea required minLength={10} placeholder="Tell the professional what needs to be done..."/></label><label className="upload">＋ Add photos or video<input type="file" accept="image/*,video/*" multiple/></label></>}{step===2&&<><label>Service address<input required placeholder="House / apartment, street"/></label><div className="form-row"><label>Preferred date<input required type="date"/></label><label>Preferred time<select><option>Morning</option><option>Afternoon</option><option>Evening</option></select></label></div><label>Urgency<select><option>Flexible</option><option>Within 24 hours</option><option>Emergency</option></select></label></>}{step===3&&<div className="booking-review"><div><span>Service</span><b>{provider?.service||"Selected service"}</b></div><div><span>Visit charge</span><b>₹{provider?.price||299}</b></div><div><span>Payment</span><b>After service</b></div><p>Final price may change after inspection. You can review and approve any quotation before work begins.</p></div>}<div className="modal-actions">{step>1&&<button type="button" onClick={()=>setStep(step-1)}>Back</button>}{step<3?<button type="button" className="primary-btn" onClick={()=>setStep(step+1)}>Continue</button>:<button type="submit" className="primary-btn">Confirm request</button>}</div></form>}</div></div>
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
  return <form onSubmit={submitAuth} className="auth-form"><span className="kicker">WELCOME TO LOCALSERVE</span><h2>{mode==="login"?"Sign in to your account":"Create your LocalServe account"}</h2><p className="muted">{mode==="login"?"Manage bookings, quotes and messages securely.":"Join as a customer or start receiving nearby service enquiries."}</p><div className="auth-tabs"><button type="button" className={mode==="login"?"active":""} onClick={()=>{setMode("login");setError("")}}>Sign in</button><button type="button" className={mode==="register"?"active":""} onClick={()=>{setMode("register");setError("")}}>Create account</button></div>{mode==="register"&&<><label>Full name<input name="fullName" required minLength={2} autoComplete="name" placeholder="Your full name"/></label><div className="form-row"><label>Email address<input name="email" required type="email" autoComplete="email" placeholder="you@example.com"/></label><label>Mobile number<input name="phone" required type="tel" pattern="[0-9 +()-]{10,18}" autoComplete="tel" placeholder="10-digit number"/></label></div><label>I want to join as<select name="role" defaultValue="customer"><option value="customer">Customer — book services</option><option value="provider">Service professional — receive work</option></select></label></>}{mode==="login"&&<label>Email or mobile number<input name="identifier" required autoComplete="username" placeholder="Email or mobile number"/></label>}<label>Password<input name="password" required type="password" minLength={8} autoComplete={mode==="login"?"current-password":"new-password"} placeholder="At least 8 characters"/></label>{mode==="register"&&<p className="password-hint">Use uppercase, lowercase and at least one number.</p>}{error&&<div className="auth-error" role="alert">{error}</div>}<button type="submit" className="primary-btn wide" disabled={busy}>{busy?"Please wait…":mode==="login"?"Sign in securely":"Create account"}</button><p className="legal">By continuing, you agree to our Terms and Privacy Policy. Your password is securely hashed and never stored as plain text.</p></form>
}
