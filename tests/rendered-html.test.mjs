import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";

const sourceRoot = new URL("../", import.meta.url);
const readSource = (path) => readFile(new URL(path, sourceRoot), "utf8");

test("Nearleo exposes an explicit terms consent flow", async () => {
  const [app, i18n] = await Promise.all([readSource("app/localserve-app.tsx"), readSource("app/i18n.ts")]);

  assert.match(app, /name="acceptedTerms"/);
  assert.match(app, /type="checkbox" required/);
  assert.match(app, /\{t\.readTerms\}/);
  assert.match(i18n, /unwanted messages and misuse of contact details/i);
  assert.match(app, /Contact and messaging rules/);
  assert.match(app, /No harassment, threats, abusive, discriminatory, sexual, romantic or otherwise unwanted messages or calls/);
  assert.match(app, /TERMS_VERSION/);
});

test("registration and login enforce and record terms acceptance", async () => {
  const [register, login, terms] = await Promise.all([
    readSource("app/api/auth/register/route.ts"),
    readSource("app/api/auth/login/route.ts"),
    readSource("lib/terms.ts"),
  ]);

  for (const route of [register, login]) {
    assert.match(route, /acceptedTerms/);
    assert.match(route, /if \(!acceptedTerms\)/);
    assert.match(route, /termsVersion: TERMS_VERSION/);
    assert.match(route, /termsAcceptedAt:/);
  }
  assert.match(terms, /2026-08-05-v1/);
});

test("footer destinations and launch pricing are wired to actions", async () => {
  const app = await readSource("app/localserve-app.tsx");

  for (const destination of ["about", "contact", "safety", "pricing", "provider-help", "terms"]) {
    assert.match(app, new RegExp(`setModal\\(\\"${destination}\\"\\)`));
  }
  assert.match(app, /onClick=\{openRequest\}>\{t\.postRequest\}/);
  assert.match(app, /support@nealeo\.com/);
  assert.doesNotMatch(app, /demo@lumiertechnologies\.com/);
  assert.match(app, /first 12 months free/i);
  assert.match(app, /₹199/);
  assert.match(app, /Work gallery and extra profile space/);
  assert.match(app, /Priority growth support from Lumier/);
});

test("provider recent work uses only authenticated gallery uploads", async () => {
  const [app, profileRoute, providersRoute, files] = await Promise.all([
    readSource("app/localserve-app.tsx"),
    readSource("app/api/providers/me/route.ts"),
    readSource("app/api/providers/route.ts"),
    readSource("lib/provider-files.ts"),
  ]);

  assert.match(app, /name="recentWork"/);
  assert.match(app, /p\.portfolio\.length>0/);
  assert.doesNotMatch(app, /photo-1503387762-592deb58ef4e/);
  assert.match(profileRoute, /recentWork/);
  assert.match(profileRoute, /portfolioImageIds/);
  assert.match(providersRoute, /\/api\/providers\/portfolio\//);
  assert.match(files, /"recent-work"/);
});

test("mobile users can manage account and change provider search location", async () => {
  const [app, styles, locationPin, locationSearch] = await Promise.all([
    readSource("app/localserve-app.tsx"),
    readSource("app/globals.css"),
    readSource("app/location-pin.tsx"),
    readSource("app/api/location/search/route.ts"),
  ]);

  assert.match(app, /className="account-menu" role="menu"/);
  assert.match(app, /className="account-logout" onClick=\{signOut\}/);
  assert.match(app, />\{t\.logOut\}<\/b>/);
  assert.doesNotMatch(app, /className="mobile-signout"/);
  assert.match(app, /className="search-location-mobile" onClick=\{props\.openLocation\}/);
  assert.match(app, /\{t\.searchingNear\}/);
  assert.match(app, /setSort\("nearest"\);navigate\("search"\)/);
  assert.match(app, /!customerLocation \|\| p\.distance === null \|\| p\.distance <= radius/);
  assert.match(app, /className="search-location-control"/);
  assert.doesNotMatch(app, /className="search-submit"/);
  assert.doesNotMatch(app, /<button className="primary-btn">\{t\.search\}<\/button>/);
  assert.match(locationPin, /className=\{`gps-pin/);
  assert.match(styles, /\.account-menu/);
  assert.match(styles, /\.search-location-mobile\{display:flex/);
  assert.match(styles, /\.gps-pin\{/);
  assert.match(styles, /\.search-bar-page\{grid-template-columns:minmax\(280px,1fr\) auto\}/);
  assert.doesNotMatch(app, /nearby-location-list|availableLocations/);
  assert.match(app, /window\.setTimeout\(\(\)=>searchPlace\(query,sequence\),250\)/);
  assert.match(app, /Suggestions appear automatically/);
  assert.match(app, /new AbortController\(\)/);
  assert.doesNotMatch(app, /onClick=\{searchPlace\}/);
  assert.match(styles, /Fast floating location autocomplete/);
  assert.match(styles, /\.place-results\{position:absolute/);
  assert.match(locationSearch, /https:\/\/photon\.komoot\.io\/api\//);
  assert.match(locationSearch, /Kara – Peravoor/);
  assert.match(locationSearch, /tokens\.map\(token=>searchPhoton/);
  assert.match(locationSearch, /s-maxage=2592000/);
  assert.match(locationSearch, /latitude>=6&&latitude<=38/);
  assert.doesNotMatch(locationSearch, /localServeLastGeocodeAt|Please wait a moment/);
});

test("opening uses a mobile-first Nearleo service montage", async () => {
  const [app, styles] = await Promise.all([
    readSource("app/localserve-app.tsx"),
    readSource("app/globals.css"),
  ]);

  assert.match(app, /OpeningIntro/);
  assert.match(app, /Nearleo welcome, part/);
  assert.match(app, /near-lio-carpenter\.jpg/);
  assert.match(app, /near-lio-tile-worker\.jpg/);
  assert.match(app, />Skip<\/button>/);
  assert.match(app, /FIND HELP NEARBY/);
  assert.match(app, /REQUEST AND CONNECT/);
  assert.match(app, /nearlio-intro-seen/);
  assert.match(app, /chapter===2\?1700:1650/);
  assert.match(app, /Next →/);
  assert.match(app, /closest\("button"\)/);
  assert.match(app, /className="intro-watermark">Powered by <b>Lumier Technologies<\/b>/);
  assert.match(styles, /animation-duration:1\.65s/);
  assert.match(styles, /\.intro-watermark\{/);
  assert.match(styles, /text-shadow:/);
  assert.match(styles, /grid-template-columns:repeat\(3,1fr\)!important/);
  assert.match(styles, /@media\(min-width:761px\)/);
  assert.match(styles, /prefers-reduced-motion:reduce/);
});

test("production request workflow persists quotes and status transitions", async () => {
  const [app, requestRoute, statusRoute, responseRoute] = await Promise.all([
    readSource("app/localserve-app.tsx"),
    readSource("app/api/requests/route.ts"),
    readSource("app/api/requests/[id]/route.ts"),
    readSource("app/api/provider/requests/[id]/respond/route.ts"),
  ]);
  assert.match(app, /Mark as selected/);
  assert.match(app, /Confirm job/);
  assert.match(app, /Work finished · Payment given/);
  assert.match(app, /Work finished · Payment received/);
  assert.match(app, /Estimated price/);
  assert.match(requestRoute, /statusHistory/);
  assert.match(requestRoute, /description\.length < 10 \|\| !address/);
  assert.doesNotMatch(requestRoute, /address\.length\s*</);
  assert.match(statusRoute, /in_progress/);
  assert.match(statusRoute, /confirm: \{ from: \["accepted"\], to: "confirmed" \}/);
  assert.match(statusRoute, /complete: \{ from: \["in_progress"\], to: "in_progress" \}/);
  assert.match(statusRoute, /cancel: \{ from: \["open", "quoted", "accepted", "confirmed", "in_progress"\], to: "cancelled" \}/);
  assert.match(statusRoute, /Only this job's customer or selected provider can cancel it/);
  assert.match(statusRoute, /Only this job's customer or selected provider can update it/);
  assert.match(statusRoute, /customerCompletionConfirmedAt/);
  assert.match(statusRoute, /providerCompletionConfirmedAt/);
  assert.match(statusRoute, /paymentGivenAt/);
  assert.match(statusRoute, /paymentReceivedAt/);
  assert.match(statusRoute, /Enter the same final amount or discuss it in Messages/);
  assert.match(statusRoute, /assignedProviderId/);
  assert.match(responseRoute, /quoteAmount/);
  assert.match(responseRoute, /availability/);
});

test("Nearleo is installable and avoids invented marketplace totals", async () => {
  const [app, layout, manifest, worker, i18n] = await Promise.all([
    readSource("app/localserve-app.tsx"),
    readSource("app/layout.tsx"),
    readSource("app/manifest.ts"),
    readSource("public/sw.js"),
    readSource("app/i18n.ts"),
  ]);
  assert.doesNotMatch(app, /10,000\+/);
  assert.doesNotMatch(app, /Happy customers/);
  assert.match(i18n, /No customer reviews yet/);
  assert.match(layout, /manifest\.webmanifest/);
  assert.match(manifest, /display: "standalone"/);
  assert.match(worker, /CACHE_NAME/);
});

test("motion continues through the main mobile experience", async () => {
  const [app, styles] = await Promise.all([
    readSource("app/localserve-app.tsx"),
    readSource("app/globals.css"),
  ]);

  assert.match(app, /className="home-service-motion"/);
  assert.match(app, /IntersectionObserver/);
  assert.match(app, /prefers-reduced-motion: reduce/);
  assert.match(styles, /page-service-flow/);
  assert.match(styles, /page-card-float/);
  assert.match(styles, /\.motion-reveal\.motion-in/);
});

test("mobile homepage places the trusted-professionals heading before search and promotional content", async () => {
  const [styles, app] = await Promise.all([
    readSource("app/globals.css"),
    readSource("app/localserve-app.tsx"),
  ]);

  assert.match(styles, /\.hero-reference\{display:flex!important;flex-direction:column\}/);
  assert.match(styles, /\.hero-reference \.hero-copy\{order:1!important;display:flex/);
  assert.doesNotMatch(styles, /\.hero-reference \.hero-search-expanded\{order:-10/);
  assert.match(styles, /\.hero-reference \.hero-collage\{order:2!important/);
  assert.match(styles, /\.hero-reference \.location-field\{display:flex!important/);
  assert.match(styles, /Trusted local professionals/);
  assert.ok(app.indexOf('<h1>{t.heroTitle}') < app.indexOf('<form className="hero-search hero-search-expanded"'));
});

test("interlock and hollow-brick services are searchable categories", async () => {
  const app = await readSource("app/localserve-app.tsx");

  assert.match(app, /"Interlock paving"/);
  assert.match(app, /"Hollow-brick work"/);
  assert.match(app, /"hollobricks"/);
  assert.match(app, /serviceAliases/);
});

test("service entry and provider discovery tolerate spelling mistakes", async () => {
  const app = await readSource("app/localserve-app.tsx");

  assert.match(app, /function editDistance/);
  assert.match(app, /function matchingServices/);
  assert.match(app, /p\.service===suggestedService/);
  assert.match(app, /name="service" value=\{profileService\}/);
  assert.match(app, /Type your service, even with a spelling mistake/);
  assert.match(app, /Type a service, even with a spelling mistake/);
  assert.match(app, /Choose your main service from the suggestions/);
});

test("service discovery renders one search field without a duplicate selected row", async () => {
  const [app, styles] = await Promise.all([
    readSource("app/localserve-app.tsx"),
    readSource("app/globals.css"),
  ]);

  assert.doesNotMatch(app, /<select className="service-menu"/);
  assert.match(app, /language=\{language\} showAllOnEmpty/);
  assert.match(app, /showAllOnEmpty\?serviceNames:\[\]/);
  assert.match(styles, /\.search-bar-page\{grid-template-columns:minmax\(280px,1fr\) auto\}/);
  assert.match(styles, /@media\(max-width:760px\)\{\.search-bar-page\{grid-template-columns:1fr\}/);
});

test("six Indian language modes persist and localize service search", async () => {
  const [app, i18n, styles, home] = await Promise.all([
    readSource("app/localserve-app.tsx"),
    readSource("app/i18n.ts"),
    readSource("app/globals.css"),
    readSource("app/page.tsx"),
  ]);

  assert.match(app, /nearlio-language/);
  assert.match(app, /document\.documentElement\.lang/);
  assert.match(app, /languageOptions\.map/);
  assert.match(app, /serviceSearchLabels\(name\)/);
  assert.match(i18n, /വിശ്വസ്തരായ പ്രാദേശിക വിദഗ്ധരെ കണ്ടെത്തൂ/);
  assert.match(i18n, /"Electrician":"ഇലക്ട്രീഷ്യൻ"/);
  assert.match(i18n, /code: "HI", label: "हिन्दी"/);
  assert.match(i18n, /code: "TA", label: "தமிழ்"/);
  assert.match(i18n, /code: "KN", label: "ಕನ್ನಡ"/);
  assert.match(i18n, /code: "TE", label: "తెలుగు"/);
  assert.match(i18n, /"Electrician":"इलेक्ट्रीशियन"/);
  assert.match(i18n, /"Electrician":"எலக்ட்ரீஷியன்"/);
  assert.match(styles, /html\[data-language="ML"\]/);
  assert.match(styles, /html\[data-language="HI"\]/);
  assert.match(styles, /html\[data-language="TA"\]/);
  assert.match(styles, /\.language-switch select/);
  assert.match(styles, /grid-template-areas:"brand account" "location language"/);
  assert.doesNotMatch(styles, /location-mini\{display:none!important\}/);
  assert.match(home, /"hi-IN", "ta-IN", "kn-IN", "te-IN"/);
});

test("provider profiles publish immediately with optional verification media", async () => {
  const [app, profileRoute, providersRoute, adminRoute] = await Promise.all([
    readSource("app/localserve-app.tsx"),
    readSource("app/api/providers/me/route.ts"),
    readSource("app/api/providers/route.ts"),
    readSource("app/api/admin/providers/[id]/route.ts"),
  ]);

  assert.match(profileRoute, /published: true/);
  assert.match(profileRoute, /status: "active"/);
  assert.doesNotMatch(profileRoute, /Upload a clear profile photo/);
  assert.doesNotMatch(profileRoute, /Upload the front of a government-issued ID card/);
  assert.doesNotMatch(providersRoute, /verificationStatus: "approved"/);
  assert.doesNotMatch(providersRoute, /whatsapp:/);
  assert.match(adminRoute, /body\.action === "unverify"/);
  assert.match(app, /Unverified provider/);
  assert.match(app, /Save and publish profile/);
});

test("provider contact actions require login before phone, WhatsApp or email is revealed", async () => {
  const [app, providersRoute, profilePage] = await Promise.all([
    readSource("app/localserve-app.tsx"),
    readSource("app/api/providers/route.ts"),
    readSource("app/professionals/[id]/page.tsx"),
  ]);

  assert.match(app, /href={`tel:\$\{p\.phone\}`}/);
  assert.match(app, /Contact \{p\.service\}/);
  assert.match(app, /requireContactLogin\(event,user,onSignIn\)/);
  assert.match(app, /Please log in to call, WhatsApp or mail this provider/);
  assert.match(app, /contactLogin/);
  assert.match(app, /\/icons\/whatsapp\.svg/);
  assert.match(app, /<b>WhatsApp<\/b>/);
  assert.match(app, /<b>Mail<\/b>/);
  assert.match(providersRoute, /const session = await getSession\(\)/);
  assert.match(providersRoute, /const revealContact = Boolean\(session\)/);
  assert.match(providersRoute, /phone: revealContact \? String\(row\.phone/);
  assert.match(providersRoute, /email: revealContact \? String\(row\.contactEmail/);
  assert.match(profilePage, /Contact \{provider\.service\}/);
  assert.match(profilePage, /const viewer = await getSession\(\)/);
  assert.match(profilePage, /contactLoginHref/);
  assert.match(profilePage, /Log in to call, WhatsApp or mail this provider/);
  assert.match(profilePage, /telephone: viewer \? provider\.phone : undefined/);
  assert.match(profilePage, /<b>Call<\/b>/);
  assert.match(profilePage, /WhatsApp/);
  assert.match(profilePage, /\/icons\/whatsapp\.svg/);
  assert.match(profilePage, /<b>Mail<\/b>/);
  assert.match(profilePage, /mailto:/);
});

test("logged-out mobile visitors get central login and sign-up actions", async () => {
  const [app, styles] = await Promise.all([
    readSource("app/localserve-app.tsx"),
    readSource("app/globals.css"),
  ]);

  assert.match(app, /!currentUser && <section className="mobile-auth-invite"/);
  assert.match(app, /setAuthMode\("login"\);setModal\("auth"\)/);
  assert.match(app, /setAuthMode\("register"\);setModal\("auth"\)/);
  assert.match(app, /initialMode=\{authMode\}/);
  assert.match(styles, /\.mobile-auth-invite\{display:none\}/);
  assert.match(styles, /@media\(max-width:760px\)[\s\S]*\.mobile-auth-invite\{display:grid/);
});

test("empty service selection lists every published provider", async () => {
  const [app, providersRoute] = await Promise.all([
    readSource("app/localserve-app.tsx"),
    readSource("app/api/providers/route.ts"),
  ]);

  assert.match(app, /!customerLocation \|\| p\.distance === null \|\| p\.distance <= radius/);
  assert.match(app, /new URLSearchParams\(\{ limit: "200" \}\)/);
  assert.match(app, /service === "All services"[\s\S]*window\.scrollTo\(\{top:0/);
  assert.match(providersRoute, /Math\.min\(200,/);
  assert.match(providersRoute, /providersWithoutCoordinates/);
  assert.doesNotMatch(providersRoute, /maxDistance:/);
});

test("Nearleo uses a premium blue and white visual identity", async () => {
  const [styles, app, i18n, layout, manifest] = await Promise.all([
    readSource("app/globals.css"),
    readSource("app/localserve-app.tsx"),
    readSource("app/i18n.ts"),
    readSource("app/layout.tsx"),
    readSource("app/manifest.ts"),
  ]);

  assert.match(styles, /--green:#1769e0/);
  assert.match(styles, /--green-dark:#0b3d91/);
  assert.match(styles, /Nearleo premium blue and white identity/);
  assert.match(styles, /2026 premium product polish/);
  assert.match(styles, /\.hero-reference\{background:linear-gradient\(112deg,#fff 0%,#f9fbff/);
  assert.match(styles, /footer\{background:linear-gradient\(135deg,#06152f,#0a2e68\)/);
  assert.match(styles, /\.mobile-auth-invite\{border-color:#cbdcf3;background:linear-gradient\(145deg,#fff 0%,#edf4ff/);
  assert.match(app, /className="premium-assurance premium-assurance-bottom"/);
  assert.match(i18n, /privacyFirst: "Privacy-first contact"/);
  assert.match(i18n, /Clear verification status/);
  assert.match(layout, /og-blue\.png/);
  assert.match(layout, /theme-color" content="#1769e0"/);
  assert.match(manifest, /theme_color: "#1769e0"/);
});

test("Nearleo exposes a canonical, crawlable SEO foundation", async () => {
  const [layout, home, robots, sitemap, directory, servicePage, services, proxy] = await Promise.all([
    readSource("app/layout.tsx"),
    readSource("app/page.tsx"),
    readSource("app/robots.ts"),
    readSource("app/sitemap.ts"),
    readSource("app/services/page.tsx"),
    readSource("app/services/[slug]/page.tsx"),
    readSource("lib/seo-services.ts"),
    readSource("proxy.ts"),
  ]);

  assert.match(services, /https:\/\/www\.nearleo\.com/);
  assert.match(layout, /alternates: \{ canonical: "\/" \}/);
  assert.match(layout, /max-image-preview/);
  assert.match(home, /application\/ld\+json/);
  assert.match(home, /"@type": "Organization"/);
  assert.match(home, /app-icon-512\.png/);
  assert.match(robots, /disallow: \["\/admin\/", "\/api\/"\]/);
  assert.match(sitemap, /sitemap/);
  assert.match(directory, /Nearleo service directory/);
  assert.match(servicePage, /BreadcrumbList/);
  assert.match(servicePage, /generateStaticParams/);
  assert.match(services, /slug: "electrician"/);
  assert.match(services, /slug: "interlock-paving"/);
  assert.match(proxy, /"nearleo\.com"/);
  assert.match(proxy, /"localserviecses\.vercel\.app"/);
  assert.match(proxy, /"localserve-marketplace\.jijilsadanandan\.chatgpt\.site"/);
  assert.match(proxy, /www\.nearleo\.com/);
  assert.match(proxy, /NextResponse\.redirect\(canonicalUrl, 308\)/);
});

test("Kannur providers have crawlable premium profiles with direct contact", async () => {
  const [directory, servicePage, profilePage, publicProviders, sitemap, home] = await Promise.all([
    readSource("app/kannur/page.tsx"),
    readSource("app/services/[slug]/kannur/page.tsx"),
    readSource("app/professionals/[id]/page.tsx"),
    readSource("lib/public-providers.ts"),
    readSource("app/sitemap.ts"),
    readSource("app/localserve-app.tsx"),
  ]);

  assert.match(directory, /Find local service professionals in Kannur/);
  assert.match(servicePage, /profiles serving Kannur/);
  assert.match(servicePage, /areaServed/);
  assert.match(profilePage, /ProfilePage/);
  assert.match(profilePage, /public-direct-contact/);
  assert.match(profilePage, /aggregateRating/);
  assert.match(publicProviders, /publicProjection/);
  assert.match(publicProviders, /phone:\s*1/);
  assert.match(publicProviders, /contactEmail:\s*1/);
  assert.match(publicProviders, /instagramUrl:\s*1/);
  assert.doesNotMatch(publicProviders, /privateDocuments:\s*1/);
  assert.match(sitemap, /professionals\/\$\{provider\.id\}/);
  assert.match(sitemap, /services\/\$\{service\.slug\}\/kannur/);
  assert.match(home, /href="\/kannur"/);
});

test("priority Kannur and Iritty search phrases have dedicated landing pages", async () => {
  const [services, kannurService, irittyPage, sitemap] = await Promise.all([
    readSource("lib/seo-services.ts"),
    readSource("app/services/[slug]/kannur/page.tsx"),
    readSource("app/services/interlock-paving/iritty/page.tsx"),
    readSource("app/sitemap.ts"),
  ]);

  assert.match(services, /kannurSearchTitle: "Electrician in Kannur"/);
  assert.match(services, /kannurSearchTitle: "Interlock Paving in Kannur"/);
  assert.match(services, /kannurSearchTitle: "Hollow-Brick Workers in Kannur"/);
  assert.match(kannurService, /service\.kannurSearchTitle/);
  assert.match(kannurService, /href="\/services\/interlock-paving\/iritty"/);
  assert.match(irittyPage, /Find interlock workers in Iritty/);
  assert.match(irittyPage, /Interlock Workers in Iritty/);
  assert.match(sitemap, /services\/interlock-paving\/iritty/);
});

test("customers can leave one-to-five-star provider reviews and providers can add social links", async () => {
  const [app, pwaInstall, reviewRoute, profileRoute, providersRoute, styles, environment] = await Promise.all([
    readSource("app/localserve-app.tsx"),
    readSource("app/pwa-install.tsx"),
    readSource("app/api/providers/[id]/reviews/route.ts"),
    readSource("app/api/providers/me/route.ts"),
    readSource("app/api/providers/route.ts"),
    readSource("app/globals.css"),
    readSource(".env.example"),
  ]);

  assert.match(app, /Rate this professional/);
  assert.match(app, /Choose a rating/);
  assert.match(app, /Save my review/);
  assert.match(app, /Instagram/);
  assert.match(app, /Facebook/);
  assert.match(app, /YouTube/);
  assert.match(pwaInstall, /updateViaCache: "none"/);
  assert.match(reviewRoute, /session\.role !== "customer"/);
  assert.match(reviewRoute, /rating < 1 \|\| rating > 5/);
  assert.match(reviewRoute, /createIndex\(\{ customerId: 1, providerId: 1 \}, \{ unique: true \}\)/);
  assert.match(reviewRoute, /averageRating/);
  assert.match(profileRoute, /socialUrl/);
  assert.match(profileRoute, /instagramUrl, facebookUrl, youtubeUrl/);
  assert.match(providersRoute, /instagramUrl: String/);
  assert.match(styles, /Premium provider profiles and direct contact/);
  assert.match(styles, /\.provider-reviews/);
  assert.match(styles, /\.direct-contact-grid/);
  assert.doesNotMatch(environment, /TURN_|STUN_/);
  assert.doesNotMatch(app, /WebRtcCallCenter|Request Audio Call|Call Approval/);
  assert.match(await readSource("public/sw.js"), /nearleo-shell-v24/);
});

test("provider banners show persistent likes, average rating or New, and completed works", async () => {
  const [app, profilePage, providerCard, providersRoute, publicProviders, likesRoute, styles] = await Promise.all([
    readSource("app/localserve-app.tsx"),
    readSource("app/professionals/[id]/page.tsx"),
    readSource("app/seo-provider-card.tsx"),
    readSource("app/api/providers/route.ts"),
    readSource("lib/public-providers.ts"),
    readSource("app/api/providers/[id]/likes/route.ts"),
    readSource("app/globals.css"),
  ]);

  assert.match(app, /profile-banner-metrics/);
  assert.match(app, /provider-card-metrics/);
  assert.match(app, /className=\{`save \$\{p\.liked\?"saved":""\}`\} onClick=\{toggleLike\}/);
  assert.match(app, /provider-service-spotlight/);
  assert.match(app, /serviceLabel\(p\.service,language\)/);
  assert.match(app, /onLikeUpdate\(p\.id,Number\(result\.count\|\|0\),Boolean\(result\.liked\)\)/);
  assert.match(app, /const providerRefreshId=useRef\(0\)/);
  assert.match(app, /credentials:"include",cache:"no-store"/);
  assert.match(app, /if \(requestId!==providerRefreshId\.current\)return/);
  assert.match(app, /setSelected\(current=>current\?nextProviders\.find\(provider=>provider\.id===current\.id\)\?\?current:current\)/);
  assert.match(app, /onAuthenticated=\{async \(user\) => \{setCurrentUser\(user\);setRole\(user\.role\);await refreshProviders\(\)/);
  assert.match(app, /problem instanceof Error\?problem\.message:"Unable to update like"/);
  assert.match(app, /p\.likes/);
  assert.match(app, /p\.reviews>0\?p\.rating\.toFixed\(1\):"New"/);
  assert.match(app, /Works done/);
  assert.match(profilePage, /public-profile-banner-metrics/);
  assert.match(profilePage, /provider\.likes/);
  assert.match(profilePage, /provider\.completedJobs/);
  assert.match(providerCard, /seo-provider-metrics/);
  assert.match(providerCard, /provider\.reviews>0\?provider\.rating\.toFixed\(1\):"New"/);
  assert.match(providersRoute, /likeCountByProviderId/);
  assert.match(providersRoute, /likes: likeCountByProviderId\.get\(String\(row\._id\)\) \?\? 0/);
  assert.match(providersRoute, /liked: likedProviderIds\.has/);
  assert.match(publicProviders, /actualLikeCount \?\? row\.likeCount/);
  assert.match(publicProviders, /countDocuments\(\{ providerId: row\._id \}\)/);
  assert.match(likesRoute, /createIndex\(\{ userId: 1, providerId: 1 \}, \{ unique: true \}\)/);
  assert.match(likesRoute, /if \(!session \|\| !ObjectId\.isValid\(session\.id\)\)/);
  assert.match(likesRoute, /countDocuments\(\{ providerId \}\)/);
  assert.match(likesRoute, /return Response\.json\(\{ count, liked: Boolean\(ownLike\) \}, \{ headers: noStoreHeaders \}\)/);
  assert.match(likesRoute, /You cannot like your own provider profile/);
  assert.match(styles, /\.profile-banner-metrics/);
  assert.match(styles, /\.provider-card-metrics/);
  assert.match(styles, /\.provider-service-spotlight/);
  assert.match(styles, /\.profile-service-label/);
  assert.match(styles, /\.public-profile-intro>\.seo-kicker/);
  assert.match(styles, /\.seo-provider-copy>span/);
});

test("provider profiles support authenticated social sharing with rich preview banners", async () => {
  const [profilePage, shareProfile, socialImage, app, styles, worker] = await Promise.all([
    readSource("app/professionals/[id]/page.tsx"),
    readSource("app/share-profile.tsx"),
    readSource("app/professionals/[id]/share-card.png/route.tsx"),
    readSource("app/localserve-app.tsx"),
    readSource("app/globals.css"),
    readSource("public/sw.js"),
  ]);

  assert.match(profilePage, /<ShareProfile authenticated=\{Boolean\(viewer\)\}/);
  assert.match(profilePage, /share-card\.png\?v=/);
  assert.match(profilePage, /design=2/);
  assert.match(profilePage, /socialPageUrl/);
  assert.match(profilePage, /\?shared=\$\{sharedValue\}/);
  assert.match(profilePage, /twitter: \{ card: "summary_large_image"/);
  assert.match(shareProfile, /navigator\.share/);
  assert.match(shareProfile, /https:\/\/wa\.me\/\?text=/);
  assert.match(shareProfile, /facebook\.com\/sharer\/sharer\.php/);
  assert.match(shareProfile, /twitter\.com\/intent\/tweet/);
  assert.match(shareProfile, /nearleo-share-after-login/);
  assert.match(shareProfile, /shared=\$\{shareToken\}/);
  assert.match(shareProfile, /Log in to share profile/);
  assert.match(socialImage, /width: 1200, height: 630/);
  assert.match(socialImage, /content-length/);
  assert.match(socialImage, /s-maxage=86400/);
  assert.match(socialImage, /provider\.photoUrl/);
  assert.match(socialImage, /provider\.service/);
  assert.match(socialImage, /provider\.completedJobs/);
  assert.match(app, /profileUrl=\{`\$\{window\.location\.origin\}\/professionals\/\$\{p\.id\}`\}/);
  assert.match(app, /nearleo-share-after-login/);
  assert.match(styles, /\.profile-share-options/);
  assert.match(worker, /nearleo-shell-v24/);
});

test("provider profiles fall back to uploaded work imagery when no dedicated DP exists", async () => {
  const [publicProviders, providersRoute] = await Promise.all([
    readSource("lib/public-providers.ts"),
    readSource("app/api/providers/route.ts"),
  ]);

  assert.match(publicProviders, /row\.profilePhotoId \? `\/api\/providers\/photo\/\$\{id\}` : portfolioIds\.length \? `\/api\/providers\/portfolio\/\$\{id\}\/0` : null/);
  assert.match(providersRoute, /row\.profilePhotoId \? `\/api\/providers\/photo\/\$\{row\._id\}` : Array\.isArray\(row\.portfolioImageIds\) && row\.portfolioImageIds\.length \? `\/api\/providers\/portfolio\/\$\{row\._id\}\/0`/);
});

test("seasonal greetings remain available without crowding the current home header", async () => {
  const [app, styles, worker] = await Promise.all([
    readSource("app/localserve-app.tsx"),
    readSource("app/globals.css"),
    readSource("public/sw.js"),
  ]);

  assert.match(app, /function SeasonalFestivalBanner/);
  assert.match(app, /timeZone:"Asia\/Kolkata"/);
  assert.match(app, /id:"onam-week",month:8,day:26/);
  assert.match(app, /Onam Week: celebrating Kerala together/);
  assert.match(app, /ഓണവാരം: കേരളം ഒന്നായി ആഘോഷിക്കാം/);
  assert.doesNotMatch(app, /<SeasonalFestivalBanner compact language=\{language\}/);
  assert.match(styles, /\.seasonal-banner/);
  assert.match(styles, /\.onam-pookalam/);
  assert.match(styles, /@keyframes onamPetalBloom/);
  assert.match(styles, /Compact seasonal banner/);
  assert.match(styles, /min-height:118px/);
  assert.match(styles, /prefers-reduced-motion:reduce/);
  assert.match(worker, /nearleo-shell-v24/);
});

test("Nearleo offers a complete browser-to-home-screen installation flow", async () => {
  const [pwaInstall, layout, manifest, worker, styles] = await Promise.all([
    readSource("app/pwa-install.tsx"),
    readSource("app/layout.tsx"),
    readSource("app/manifest.ts"),
    readSource("public/sw.js"),
    readSource("app/globals.css"),
  ]);

  assert.match(pwaInstall, /beforeinstallprompt/);
  assert.match(pwaInstall, /appinstalled/);
  assert.match(pwaInstall, /Install Nearleo app/);
  assert.match(pwaInstall, /Add to Home Screen/);
  assert.match(pwaInstall, /display-mode: standalone/);
  assert.match(pwaInstall, /navigator\.serviceWorker/);
  assert.match(layout, /<PwaInstall \/>/);
  assert.match(layout, /apple-touch-icon\.png/);
  assert.match(layout, /mobile-web-app-capable/);
  assert.match(manifest, /app-icon-192\.png/);
  assert.match(manifest, /app-icon-512\.png/);
  assert.match(manifest, /app-icon-maskable-512\.png/);
  assert.match(manifest, /start_url: "\/\?source=pwa"/);
  assert.match(worker, /nearleo-shell-v24/);
  assert.match(styles, /\.pwa-install-card/);
});

test("Nearleo publishes its N logo to search engines and shows a branded loading screen", async () => {
  const [layout, home, favicon, faviconIco, faviconPng, initialLoader, routeLoader, styles] = await Promise.all([
    readSource("app/layout.tsx"),
    readSource("app/page.tsx"),
    readSource("public/favicon.svg"),
    readFile(new URL("public/favicon.ico", sourceRoot)),
    readFile(new URL("public/nearleo-favicon-96.png", sourceRoot)),
    readSource("app/initial-loading-screen.tsx"),
    readSource("app/loading.tsx"),
    readSource("app/globals.css"),
  ]);

  assert.match(layout, /app-icon-192\.png/);
  assert.match(layout, /app-icon-512\.png/);
  assert.match(layout, /shortcut: "\/favicon\.ico"/);
  assert.match(layout, /rel="icon" href="\/favicon\.ico" sizes="48x48"/);
  assert.match(layout, /nearleo-favicon-96\.png/);
  assert.match(layout, /<InitialLoadingScreen \/>/);
  assert.match(home, /contentUrl: `\$\{SITE_URL\}\/app-icon-512\.png`/);
  assert.match(home, /caption: "Nearleo logo"/);
  assert.match(favicon, /viewBox="0 0 512 512"/);
  assert.match(favicon, /fill="white"/);
  assert.ok(faviconIco.length > 1000);
  assert.ok(faviconPng.length > 1000);
  assert.match(initialLoader, /nearleo-page-loader/);
  assert.match(initialLoader, /Nearleo is loading/);
  assert.match(routeLoader, /nearleo-route-loader/);
  assert.match(styles, /background:radial-gradient\(circle at 50% 38%,#3486f3/);
  assert.match(styles, /\.nearleo-loader-mark/);
  assert.match(styles, /@keyframes nearleoLoaderProgress/);
});

test("all Nearleo pages and the full service catalogue support six languages", async () => {
  const [i18n, interfaceI18n, publicPageI18n, globalLanguage, layout, styles] = await Promise.all([
    readSource("app/i18n.ts"),
    readSource("app/interface-i18n.ts"),
    readSource("app/public-page-i18n.ts"),
    readSource("app/global-language.tsx"),
    readSource("app/layout.tsx"),
    readSource("app/globals.css"),
  ]);

  for (const code of ["EN", "ML", "HI", "TA", "KN", "TE"]) {
    assert.match(i18n, new RegExp(`code: "${code}"`));
  }
  for (const map of ["malayalamServiceNames", "hindiServiceNames", "tamilServiceNames", "kannadaServiceNames", "teluguServiceNames"]) {
    assert.match(i18n, new RegExp(`${map}: Record<string, string>`));
  }
  assert.match(i18n, /"Signboard maker":"സൈൻബോർഡ് നിർമ്മാതാവ്"/);
  assert.match(i18n, /"Signboard maker":"साइनबोर्ड निर्माता"/);
  assert.match(i18n, /"Signboard maker":"பெயர்ப்பலகை தயாரிப்பாளர்"/);
  assert.match(i18n, /"Signboard maker":"ನಾಮಫಲಕ ತಯಾರಕ"/);
  assert.match(i18n, /"Signboard maker":"సైన్‌బోర్డ్ తయారీదారు"/);
  assert.match(interfaceI18n, /"PROVIDER DASHBOARD"/);
  assert.match(interfaceI18n, /"User Terms & Privacy Notice"/);
  assert.match(interfaceI18n, /function dynamicTranslation/);
  assert.match(interfaceI18n, /years experience/);
  assert.match(interfaceI18n, /Unable to\|Something went wrong/);
  assert.match(publicPageI18n, /"Nearleo service directory"/);
  assert.match(publicPageI18n, /"Find interlock workers in Iritty"/);
  assert.match(publicPageI18n, /"Provider verification"/);
  assert.match(globalLanguage, /document\.createTreeWalker/);
  assert.match(globalLanguage, /new MutationObserver/);
  assert.match(globalLanguage, /\["placeholder", "aria-label", "title", "alt"\]/);
  assert.match(globalLanguage, /localStorage\.setItem\("nearlio-language"/);
  assert.match(layout, /<GlobalLanguage \/>/);
  assert.match(styles, /\.global-language-switch/);
});

test("community, retail, transport and health categories are searchable and translated", async () => {
  const [app, i18n, seo] = await Promise.all([
    readSource("app/localserve-app.tsx"),
    readSource("app/i18n.ts"),
    readSource("lib/seo-services.ts"),
  ]);
  const requestedCategories = [
    "Lottery service", "Retail store", "Rubber tapping worker", "Coconut picker", "Barber", "Chicken shop",
    "Beef stall", "Mobile shop", "Restaurant", "Autorickshaw service", "Traveller van service", "Ambulance service",
    "Pharmacy", "Dental clinic", "Hospital", "Medical laboratory",
  ];

  for (const category of requestedCategories) {
    assert.match(app, new RegExp(`"${category}"`));
    assert.equal((i18n.match(new RegExp(`"${category}"`, "g")) ?? []).length, 5);
    assert.match(seo, new RegExp(`name: "${category}"`));
  }
  assert.match(app, /Pharmacy:\["pharamcy","medical shop","chemist"\]/);
  assert.match(app, /"Coconut picker":\["coconut picking","coconut climbing","coconut tree climber","coconut plucker"\]/);
  assert.match(app, /"Traveller van service":\["traveller","traveler","tempo traveller","tourist van"\]/);
  assert.match(seo, /Nearleo is not an emergency service/);
});

test("the full service catalogue uses consistent blue professional imagery", async () => {
  const [app, styles] = await Promise.all([readSource("app/localserve-app.tsx"), readSource("app/globals.css")]);
  assert.match(app, /function AllServicesCatalogue/);
  assert.match(app, /serviceTilePhoto/);
  assert.match(app, /near-lio-carpenter\.jpg/);
  assert.match(app, /service-tile-shade/);
  assert.match(styles, /Image-led service catalogue/);
  assert.match(styles, /\.service-tile-copy/);
});

test("new customer requests carry location and are limited to nearby matching providers", async () => {
  const [app, requestsRoute, providerRequests] = await Promise.all([
    readSource("app/localserve-app.tsx"),
    readSource("app/api/requests/route.ts"),
    readSource("app/api/provider/requests/route.ts"),
  ]);
  assert.match(app, /customerLocation=\{customerLocation\}/);
  assert.match(app, /Nearby providers will be matched within 35 km/);
  assert.match(requestsRoute, /function requestLocation/);
  assert.match(requestsRoute, /location = requestLocation\(body\.location\)/);
  assert.match(providerRequests, /MAX_MATCH_DISTANCE_KM = 35/);
  assert.match(providerRequests, /distanceKm\(profile\.location, row\.location\)/);
});

test("location selection requests permission, resolves an address and confirms before saving", async () => {
  const [app, reverseRoute] = await Promise.all([
    readSource("app/localserve-app.tsx"),
    readSource("app/api/location/reverse/route.ts"),
  ]);
  assert.match(app, /navigator\.permissions\.query\(\{name:"geolocation"\}\)/);
  assert.match(app, /Allow and use my exact location/);
  assert.match(app, /Review selected address/);
  assert.match(app, /Continue with this address/);
  assert.match(app, /Saved and recent addresses/);
  assert.match(app, /Edit address/);
  assert.match(reverseRoute, /photon\.komoot\.io\/reverse/);
});

test("the customer messages workspace surfaces provider quotations", async () => {
  const app = await readSource("app/localserve-app.tsx");
  assert.match(app, /function CleanMessagesView\(\{user,onFind,onRequests/);
  assert.match(app, /fetch\("\/api\/messages",\{credentials:"include"\}\)/);
  assert.match(app, /Provider replies/);
  assert.match(app, /selected\.quoteAmount/);
  assert.match(app, /onRequests=\{\(\)=>navigate\("requests"\)\}/);
});

test("every service uses its own dedicated mobile-ready visual", async () => {
  const app = await readSource("app/localserve-app.tsx");
  const images = await readdir(new URL("public/service-tiles/individual/", sourceRoot));
  assert.equal(images.length, 116);
  assert.match(app, /\/service-tiles\/individual\/\$\{service\.toLowerCase\(\)\.replace/);
  assert.ok(images.includes("beautician.webp"));
  assert.ok(images.includes("dental-clinic.webp"));
});

test("quick Explore services cards show the same service-specific imagery", async () => {
  const [app, styles] = await Promise.all([readSource("app/localserve-app.tsx"), readSource("app/globals.css")]);
  assert.match(app, /category-card-visual/);
  assert.match(app, /className="category-image"/);
  assert.match(app, /name==="All services"\?"Other local services":name/);
  assert.match(styles, /category-card-visual/);
  assert.match(styles, /category-card-shade/);
});

test("mobile Explore services cards automatically advance while preserving touch control", async () => {
  const [app, styles] = await Promise.all([
    readSource("app/localserve-app.tsx"),
    readSource("app/globals.css"),
  ]);

  assert.match(app, /const categoryRailRef=useRef<HTMLDivElement>\(null\)/);
  assert.match(app, /frame=window\.requestAnimationFrame\(flow\)/);
  assert.match(app, /categoryRailDirection\.current\*elapsed\*\.034/);
  assert.match(app, /window\.cancelAnimationFrame\(frame\)/);
  assert.match(app, /onPointerDown=\{\(\)=>\{categoryRailPaused\.current=true\}\}/);
  assert.match(app, /prefers-reduced-motion: reduce/);
  assert.match(app, /\{categories\.map\(\(\[,name\]\) => <button className="category-card/);
  assert.match(styles, /\.category-rail-shell:after/);
  assert.match(styles, /\.categories-section \.category-card:nth-child\(n\+11\)\{display:flex\}/);
  assert.match(styles, /\.hero-inline-motion/);
  assert.match(app, /service-tiles\/individual\/electrician\.webp/);
  assert.match(styles, /min-width:142px/);
});

test("homepage puts search and service exploration before the animated worker montage", async () => {
  const app = await readSource("app/localserve-app.tsx");
  const search = app.indexOf('className="hero hero-reference hero-copy-only"');
  const explore = app.indexOf('className="section categories-section"');
  const montage = app.indexOf('className="home-worker-showcase"');
  assert.ok(search >= 0 && explore > search && montage > explore);
});

test("homepage keeps its header uncluttered and moves trust guidance to the bottom", async () => {
  const app = await readSource("app/localserve-app.tsx");
  assert.doesNotMatch(app, /<SeasonalFestivalBanner compact language=\{language\}/);
  const explore = app.indexOf('className="section categories-section"');
  const assurance = app.lastIndexOf('className="premium-assurance premium-assurance-bottom"');
  assert.ok(assurance > explore);
  assert.match(app, /premium-proof-row/);
});

test("mobile request steps keep fields clear of the submit controls", async () => {
  const [app, styles] = await Promise.all([readSource("app/localserve-app.tsx"), readSource("app/globals.css")]);
  assert.match(app, /if\(step<3\)\{next\(\);return\}/);
  assert.match(app, /className="request-form-body"/);
  assert.match(app, /className="modal-actions request-form-actions"/);
  assert.match(app, /"Submit request"/);
  assert.match(styles, /\.request-modal \.request-form\{height:100%;display:grid;grid-template-rows:auto minmax\(0,1fr\) auto/);
  assert.match(styles, /\.request-form-actions\{position:static/);
});

test("detailed footer stays on Home and the mobile menu exposes essential destinations", async () => {
  const app = await readSource("app/localserve-app.tsx");
  assert.match(app, /\{view==="home"&&<footer>/);
  assert.match(app, /setModal\("about"\)/);
  assert.match(app, /setRole\(currentUser\.role\),navigate\("dashboard"\)/);
  assert.match(app, /openProtected\("requests"\)/);
  assert.match(app, /Help &amp; support/);
});

test("mobile navigation uses browser history and offers an animated quick menu", async () => {
  const [app, styles] = await Promise.all([readSource("app/localserve-app.tsx"), readSource("app/globals.css")]);
  assert.match(app, /window\.history\.pushState\(\{nearleoView:next\}/);
  assert.match(app, /window\.addEventListener\("popstate",onPopState\)/);
  assert.match(app, /nearleoAccountMenu:true/);
  assert.match(app, /nearleoSideMenu:true/);
  assert.match(app, /onClick=\{toggleAccountMenuHistory\}/);
  assert.match(app, /onClick=\{toggleSideMenuHistory\}/);
  assert.match(app, /replaceState\(currentPageState,"",window\.location\.href\)/);
  assert.match(app, /id="nearleo-side-menu"/);
  assert.match(app, /All services/);
  assert.match(app, /Help &amp; support/);
  assert.match(app, /support@nealeo\.com/);
  assert.match(styles, /\.menu-toggle\.open i:nth-child\(1\)/);
  assert.match(styles, /\.side-menu\{/);
  assert.match(styles, /@keyframes sideMenuIn/);
});

test("Messages navigation opens the conversation list while direct chat links stay targeted", async () => {
  const app = await readSource("app/localserve-app.tsx");
  assert.match(app, /function openMessages\(requestId="",providerId=""\)/);
  assert.match(app, /setMessageViewKey\(current=>current\+1\)/);
  assert.match(app, /id==="messages"\?openMessages\(\)/);
  assert.match(app, /<CleanMessagesView key=\{messageViewKey\}/);
  assert.match(app, /const \[selectedId,setSelectedId\]=useState\(""\)/);
  assert.doesNotMatch(app, /useState\("__first__"\)/);
  assert.match(app, /if\(requested\)return requested\.id/);
});

test("customer message lists and chat headers show provider profile photos", async () => {
  const [app, route, styles] = await Promise.all([
    readSource("app/localserve-app.tsx"),
    readSource("app/api/messages/route.ts"),
    readSource("app/globals.css"),
  ]);
  assert.match(route, /providerPhotoUrl:providersWithPhotos\.has\(providerId\)\?`\/api\/providers\/photo\/\$\{providerId\}`/);
  assert.match(route, /projection:\{_id:1,profilePhotoId:1\}/);
  assert.match(app, /function MessageAvatar\(\{name,photoUrl=""\}/);
  assert.match(app, /photoUrl=\{user\.role==="provider"\?"":item\.providerPhotoUrl\}/);
  assert.match(app, /photoUrl=\{user\.role==="provider"\?"":selected\.providerPhotoUrl\}/);
  assert.match(styles, /\.conversation-avatar\.has-photo img\{width:100%;height:100%;display:block;object-fit:cover\}/);
});

test("premium colour refresh preserves the existing UI structure", async () => {
  const styles = await readSource("app/globals.css");
  assert.match(styles, /Premium colour depth: palette-only overrides; layout and interactions stay unchanged/);
  assert.match(styles, /--green:#075ee8/);
  assert.match(styles, /linear-gradient\(180deg,#dceaff 0%,#f7ebff 46%,#e4fff5 100%\)/);
  assert.match(styles, /\.view-all-services-banner,\.view-all-services-link\{border-color:#4c73e8;background:linear-gradient\(112deg,#075ee8,#6944cf\)/);
});

test("request and account tiles use distinct coordinated colours", async () => {
  const styles = await readSource("app/globals.css");
  assert.match(styles, /Distinct request and account tile colours; dimensions and layout are unchanged/);
  assert.match(styles, /\.premium-request-summary>button:nth-child\(1\).*#cfe2ff/);
  assert.match(styles, /\.premium-request-summary>button:nth-child\(2\).*#e5d5ff/);
  assert.match(styles, /\.premium-request-summary>button:nth-child\(3\).*#cdeede/);
  assert.match(styles, /\.stat-grid>\.stat-card:nth-child\(5\).*#f8d9e8/);
});

test("mobile request and account headings use minimal vertical space", async () => {
  const styles = await readSource("app/globals.css");
  assert.match(styles, /Compact mobile headers for Requests and Account; content tiles remain unchanged/);
  assert.match(styles, /\.dash-page\{padding-top:10px\}/);
  assert.match(styles, /\.dash-page>\.page-heading\{margin-bottom:12px\}/);
  assert.match(styles, /\.dash-page>\.page-heading h1\{margin:4px 0 3px;font-size:26px/);
});

test("nearby professionals follow the scrolling service tiles and auto-roll every loaded provider", async () => {
  const [app, styles] = await Promise.all([readSource("app/localserve-app.tsx"), readSource("app/globals.css")]);
  const viewAll = app.indexOf('className="hero-view-all"');
  const nearby = app.indexOf('className="section provider-section nearby-provider-rail"');
  const categories = app.indexOf('className="section categories-section"');
  assert.ok(viewAll >= 0 && categories > viewAll && nearby > categories);
  assert.match(app, /providerRailRef=useRef<HTMLDivElement>/);
  assert.match(app, /providers\.map\(p => <ProviderCard/);
  assert.doesNotMatch(app, /providers\.slice\(0,3\)\.map/);
  assert.match(styles, /\.nearby-provider-rail \.provider-grid\{display:flex/);
});

test("See all professionals skips the service catalogue and the mobile heading stays compact", async () => {
  const [app, styles] = await Promise.all([readSource("app/localserve-app.tsx"), readSource("app/globals.css")]);
  assert.match(app, /const \[providerDirectoryOnly,setProviderDirectoryOnly\]=useState\(false\)/);
  assert.match(app, /function showAllProfessionalProfiles\(\)\{setQuery\(""\);setProviderDirectoryOnly\(true\);navigate\("search"\);\}/);
  assert.match(app, /<button onClick=\{showAllProfessionalProfiles\}>/);
  assert.match(app, /!query&&!providerDirectoryOnly&&<AllServicesCatalogue/);
  assert.match(app, /providerDirectoryOnly \|\| !customerLocation/);
  assert.match(styles, /\.nearby-provider-rail>\.section-head \.kicker,\.nearby-provider-rail>\.section-head p\{display:none\}/);
  assert.match(styles, /\.nearby-provider-rail>\.section-head h2\{margin:0;font:500 22px/);
});

test("mobile filters stay compact and minimum rating actively filters providers", async () => {
  const [app, styles] = await Promise.all([readSource("app/localserve-app.tsx"), readSource("app/globals.css")]);
  assert.match(app, /const \[minimumRating,setMinimumRating\]=useState\(0\)/);
  assert.match(app, /!minimumRating \|\| p\.rating>=minimumRating/);
  assert.match(app, /className=\{props\.minimumRating===rating\?"active":""\}/);
  assert.match(app, /aria-pressed=\{props\.minimumRating===rating\}/);
  assert.match(app, /props\.setMinimumRating\(props\.minimumRating===rating\?0:rating\)/);
  assert.match(app, /props\.setMinimumRating\(0\)/);
  assert.match(styles, /\.rating-filter button\.active\{/);
  assert.match(styles, /\.search-layout>\.filters\{display:flex;align-items:stretch;gap:7px;overflow-x:auto/);
});

test("service requests require a saved or newly confirmed delivery-style address", async () => {
  const [app, route, styles] = await Promise.all([
    readSource("app/localserve-app.tsx"),
    readSource("app/api/users/location/route.ts"),
    readSource("app/globals.css"),
  ]);
  assert.match(app, /const exactSavedAddress=customerLocation\?\.address\?\.trim\(\)\|\|""/);
  assert.match(app, /nearleo-last-service-address/);
  assert.match(app, /function useSavedAddress\(\)/);
  assert.match(app, /function addNewAddress\(\)/);
  assert.match(app, /function confirmNewAddress\(\)/);
  assert.match(app, /step===2&&!addressConfirmed/);
  assert.match(app, /Use this address/);
  assert.match(app, /Add new address/);
  assert.match(app, /No service address saved yet/);
  assert.match(app, /className="exact-service-address"/);
  assert.match(app, /House\/building number, street, locality, landmark and PIN code/);
  assert.match(app, /location:next/);
  assert.doesNotMatch(app, /address:hasExactDetails\?current\.address:next\.label/);
  assert.match(route, /locationAddress/);
  assert.match(route, /if\(address\)updates\.locationAddress=address/);
  assert.match(styles, /\.delivery-address-selector\{/);
  assert.match(styles, /\.saved-address-actions\{/);
  assert.match(styles, /\.confirm-address-button\{/);
  assert.match(styles, /\.exact-service-address\{/);
});

test("confirmed jobs support private Google Maps navigation and live provider tracking", async () => {
  const [app, trackingRoute, providerRequests, statusRoute, styles] = await Promise.all([
    readSource("app/localserve-app.tsx"),
    readSource("app/api/requests/[id]/tracking/route.ts"),
    readSource("app/api/provider/requests/route.ts"),
    readSource("app/api/requests/[id]/route.ts"),
    readSource("app/globals.css"),
  ]);
  assert.match(app, /function googleMapsDirectionsUrl/);
  assert.match(app, /function JobTrackingPanel/);
  assert.match(app, /navigator\.geolocation\.watchPosition/);
  assert.match(app, /Open Google Maps navigation/);
  assert.match(app, /View provider in Google Maps/);
  assert.match(app, /function NearleoLiveMap/);
  assert.match(app, /tile\.openstreetmap\.org/);
  assert.match(app, /Nearleo service provider/);
  assert.match(app, /Free map powered by OpenStreetMap/);
  assert.match(app, /within 150 metres of the service location/);
  assert.match(app, /window\.setInterval\(heartbeat,15000\)/);
  assert.match(app, /Live tracking is active/);
  assert.match(app, /providerMarkerRef\.current\?\.setLatLng\(providerPoint\)/);
  assert.match(app, /fitBounds\(\[providerPoint,destinationPoint\]/);
  assert.match(app, /<JobTrackingPanel conversation=\{selected\} user=\{user\}/);
  assert.match(providerRequests, /location: String\(row\.assignedProviderId/);
  assert.match(trackingRoute, /trackableStatuses = new Set\(\["confirmed"\]\)/);
  assert.match(trackingRoute, /arrivalDistanceKm = 0\.15/);
  assert.match(trackingRoute, /export async function PATCH/);
  assert.match(trackingRoute, /arrivedAt: now/);
  assert.match(trackingRoute, /Only this job's customer and selected provider can view tracking/);
  assert.match(trackingRoute, /providerLocationSharing: true/);
  assert.match(trackingRoute, /liveLocationFreshnessMs = 120_000/);
  assert.match(trackingRoute, /Date\.now\(\) - updatedAt < liveLocationFreshnessMs/);
  assert.match(trackingRoute, /export async function DELETE/);
  assert.match(statusRoute, /providerLocationSharing = false/);
  assert.match(statusRoute, /providerTrackingStoppedAt = now/);
  assert.doesNotMatch(statusRoute, /Only the selected provider can start or complete this job/);
  assert.match(statusRoute, /Only this job's customer or selected provider can update it/);
  assert.match(statusRoute, /Enter the final amount charged before completing this work/);
  assert.match(styles, /\.job-tracking-panel\{/);
  assert.match(styles, /\.provider-live-map\{/);
  assert.match(styles, /\.nearleo-map-vehicle\{/);
  assert.match(styles, /\.google-navigation-btn\{/);
  assert.match(styles, /\.nearleo-vehicle-marker\{transition:transform \.8s linear!important\}/);
  assert.match(styles, /\.open-live-map\{background:linear-gradient/);
  assert.match(styles, /\.job-tracking-panel\{max-height:none\}/);
  assert.match(styles, /\.job-tracking-panel\.journey-ended\{/);
  assert.match(styles, /\.conversation-cancel-job\{/);
  assert.match(app, /I’ve arrived · End travel/);
  assert.match(app, /Live travel and job actions are now closed/);
});

test("premium header and request review use clear colour-coded information groups", async () => {
  const [app, styles] = await Promise.all([
    readSource("app/localserve-app.tsx"),
    readSource("app/globals.css"),
  ]);
  assert.match(app, /className="review-provider"/);
  assert.match(app, /className="review-service"/);
  assert.match(app, /className="review-schedule"/);
  assert.match(app, /className="review-matching"/);
  assert.match(app, /className="review-urgency"/);
  assert.match(styles, /Premium mobile header and high-clarity request review/);
  assert.match(styles, /\.account-chip>span,\.account-menu-head>span\{background:linear-gradient/);
  assert.match(styles, /\.request-review \.review-service\{/);
  assert.match(styles, /\.request-review \.request-review-address\{display:grid/);
});

test("gold notification control and live unread message badge use persisted message state", async () => {
  const [app, notifications, styles] = await Promise.all([
    readSource("app/localserve-app.tsx"),
    readSource("app/api/notifications/route.ts"),
    readSource("app/globals.css"),
  ]);
  assert.match(notifications, /messageCount/);
  assert.match(notifications, /readByProvider/);
  assert.match(notifications, /readByCustomer/);
  assert.match(app, /const \[messageNotificationCount,setMessageNotificationCount\]=useState\(0\)/);
  assert.match(app, /className="mobile-message-badge"/);
  assert.match(app, /nearleo:messages-read/);
  assert.match(app, /unread message/);
  assert.match(styles, /Gold alerts and a persistent unread count/);
  assert.match(styles, /\.notification-button\{overflow:visible;border-color:#e0b54b/);
  assert.match(styles, /\.mobile-message-badge\{/);
  assert.match(styles, /\.has-unread-messages/);
});

test("Nearleo ships synchronized Android and iPhone app projects", async () => {
  const [config, androidManifest, iosInfo, workflow] = await Promise.all([
    readSource("capacitor.config.ts"),
    readSource("android/app/src/main/AndroidManifest.xml"),
    readSource("ios/App/App/Info.plist"),
    readSource(".github/workflows/mobile-build.yml"),
  ]);
  assert.match(config, /appId: "com\.nearleo\.app"/);
  assert.match(config, /appName: "Nearleo"/);
  assert.match(config, /url: "https:\/\/nearleo\.com"/);
  assert.match(config, /cleartext: false/);
  assert.match(androidManifest, /android\.permission\.INTERNET/);
  assert.match(androidManifest, /android\.permission\.ACCESS_FINE_LOCATION/);
  assert.match(iosInfo, /NSLocationWhenInUseUsageDescription/);
  assert.match(workflow, /\.\/gradlew assembleDebug/);
  assert.match(workflow, /Nearleo-Android\.apk/);
});
