import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
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
  const [app, styles] = await Promise.all([
    readSource("app/localserve-app.tsx"),
    readSource("app/globals.css"),
  ]);

  assert.match(app, /className="account-menu" role="menu"/);
  assert.match(app, /className="account-logout" onClick=\{signOut\}/);
  assert.match(app, />\{t\.logOut\}<\/b>/);
  assert.doesNotMatch(app, /className="mobile-signout"/);
  assert.match(app, /className="search-location-mobile" onClick=\{props\.openLocation\}/);
  assert.match(app, /\{t\.searchingNear\}/);
  assert.match(styles, /\.account-menu/);
  assert.match(styles, /\.search-location-mobile\{display:flex/);
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
  assert.match(app, /Select provider/);
  assert.match(app, /Mark job completed/);
  assert.match(app, /Estimated price/);
  assert.match(requestRoute, /statusHistory/);
  assert.match(requestRoute, /description\.length < 10 \|\| !address/);
  assert.doesNotMatch(requestRoute, /address\.length\s*</);
  assert.match(statusRoute, /in_progress/);
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

test("mobile homepage places the animated professionals before search", async () => {
  const styles = await readSource("app/globals.css");

  assert.match(styles, /\.hero-reference\{display:flex!important;flex-direction:column\}/);
  assert.match(styles, /\.hero-reference \.hero-collage\{order:1/);
  assert.match(styles, /\.hero-reference \.hero-copy\{order:2/);
  assert.match(styles, /Trusted local professionals/);
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

test("English and Malayalam language modes persist and localize service search", async () => {
  const [app, i18n, styles] = await Promise.all([
    readSource("app/localserve-app.tsx"),
    readSource("app/i18n.ts"),
    readSource("app/globals.css"),
  ]);

  assert.match(app, /nearlio-language/);
  assert.match(app, /document\.documentElement\.lang/);
  assert.match(app, /onClick=\{\(\)=>setLanguage\("ML"\)\}>മലയാളം<\/button>/);
  assert.match(app, /malayalamServiceNames\[name\]/);
  assert.match(i18n, /വിശ്വസ്തരായ പ്രാദേശിക വിദഗ്ധരെ കണ്ടെത്തൂ/);
  assert.match(i18n, /"Electrician":"ഇലക്ട്രീഷ്യൻ"/);
  assert.match(styles, /html\[data-language="ML"\]/);
  assert.match(styles, /grid-template-areas:"brand account" "location language"/);
  assert.doesNotMatch(styles, /location-mini\{display:none!important\}/);
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

  assert.match(app, /!q \|\| p\.distance === null \|\| p\.distance <= radius/);
  assert.match(app, /new URLSearchParams\(\{ limit: "200" \}\)/);
  assert.match(app, /service === "All services"[\s\S]*document\.querySelector\("\.results"\)/);
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
  assert.match(app, /className="premium-assurance"/);
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
  assert.match(home, /nearleo-logo\.svg/);
  assert.match(robots, /disallow: \["\/admin\/", "\/api\/"\]/);
  assert.match(sitemap, /sitemap/);
  assert.match(directory, /Nearleo service directory/);
  assert.match(servicePage, /BreadcrumbList/);
  assert.match(servicePage, /generateStaticParams/);
  assert.match(services, /slug: "electrician"/);
  assert.match(services, /slug: "interlock-paving"/);
  assert.match(proxy, /"nearleo\.com", "localserviecses\.vercel\.app"/);
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
  const [app, reviewRoute, profileRoute, providersRoute, styles, environment] = await Promise.all([
    readSource("app/localserve-app.tsx"),
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
  assert.match(app, /updateViaCache:"none"/);
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
  assert.match(await readSource("public/sw.js"), /nearleo-shell-v8/);
});

test("provider banners show persistent likes, average rating or New, and completed works", async () => {
  const [app, profilePage, providersRoute, publicProviders, likesRoute, styles] = await Promise.all([
    readSource("app/localserve-app.tsx"),
    readSource("app/professionals/[id]/page.tsx"),
    readSource("app/api/providers/route.ts"),
    readSource("lib/public-providers.ts"),
    readSource("app/api/providers/[id]/likes/route.ts"),
    readSource("app/globals.css"),
  ]);

  assert.match(app, /profile-banner-metrics/);
  assert.match(app, /likeSummary\.count/);
  assert.match(app, /p\.reviews>0\?p\.rating\.toFixed\(1\):"New"/);
  assert.match(app, /Works done/);
  assert.match(profilePage, /public-profile-banner-metrics/);
  assert.match(profilePage, /provider\.likes/);
  assert.match(profilePage, /provider\.completedJobs/);
  assert.match(providersRoute, /likes: Number\(row\.likeCount/);
  assert.match(publicProviders, /likes: Math\.max\(0, Number\(row\.likeCount/);
  assert.match(likesRoute, /createIndex\(\{ userId: 1, providerId: 1 \}, \{ unique: true \}\)/);
  assert.match(likesRoute, /countDocuments\(\{ providerId \}\)/);
  assert.match(likesRoute, /You cannot like your own provider profile/);
  assert.match(styles, /\.profile-banner-metrics/);
});
