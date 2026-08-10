import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const sourceRoot = new URL("../", import.meta.url);
const readSource = (path) => readFile(new URL(path, sourceRoot), "utf8");

test("LumNearo exposes an explicit terms consent flow", async () => {
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
  assert.match(app, /demo@lumiertechnologies\.com/);
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

test("opening uses a mobile-first LumNearo service montage", async () => {
  const [app, styles] = await Promise.all([
    readSource("app/localserve-app.tsx"),
    readSource("app/globals.css"),
  ]);

  assert.match(app, /OpeningIntro/);
  assert.match(app, /LumNearo welcome, part/);
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
  assert.match(statusRoute, /in_progress/);
  assert.match(statusRoute, /assignedProviderId/);
  assert.match(responseRoute, /quoteAmount/);
  assert.match(responseRoute, /availability/);
});

test("LumNearo is installable and avoids invented marketplace totals", async () => {
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
