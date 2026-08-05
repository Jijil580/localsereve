import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const sourceRoot = new URL("../", import.meta.url);
const readSource = (path) => readFile(new URL(path, sourceRoot), "utf8");

test("Nearlio exposes an explicit terms consent flow", async () => {
  const app = await readSource("app/localserve-app.tsx");

  assert.match(app, /name="acceptedTerms"/);
  assert.match(app, /type="checkbox" required/);
  assert.match(app, /Read terms/);
  assert.match(app, /unwanted messages and misuse of contact details/i);
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
  assert.match(app, /onClick=\{openRequest\}>Post a request/);
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

test("mobile users can sign out and change the provider search location", async () => {
  const [app, styles] = await Promise.all([
    readSource("app/localserve-app.tsx"),
    readSource("app/globals.css"),
  ]);

  assert.match(app, /className="mobile-signout" onClick=\{signOut\}/);
  assert.match(app, />Logout<\/button>/);
  assert.match(app, /className="search-location-mobile" onClick=\{props\.openLocation\}/);
  assert.match(app, /SEARCHING NEAR/);
  assert.match(styles, /\.mobile-nav\.signed-in\{grid-template-columns:repeat\(6,1fr\)\}/);
  assert.match(styles, /\.search-location-mobile\{display:flex/);
});

test("opening uses a mobile-first Nearlio service montage", async () => {
  const [app, styles] = await Promise.all([
    readSource("app/localserve-app.tsx"),
    readSource("app/globals.css"),
  ]);

  assert.match(app, /OpeningIntro/);
  assert.match(app, /Welcome to Nearlio by Lumier/);
  assert.match(app, /near-lio-carpenter\.jpg/);
  assert.match(app, /near-lio-tile-worker\.jpg/);
  assert.match(app, /near-lio-photographer\.jpg/);
  assert.match(app, />Skip<\/button>/);
  assert.match(app, /HOW TO USE NEARLIO/);
  assert.match(app, /BENEFITS FOR EVERYONE/);
  assert.match(app, /SIMPLE FROM START TO FINISH/);
  assert.match(app, /SAFETY AND VERIFICATION/);
  assert.match(app, /REQUEST AND RESPOND/);
  assert.match(app, /setIntroVisible\(false\), 90000/);
  assert.match(styles, /\.intro-chapter-6/);
  assert.match(styles, /intro-progress-fill 15s/);
  assert.match(styles, /grid-template-columns:repeat\(6,1fr\)/);
  assert.match(styles, /@media\(min-width:761px\)/);
  assert.match(styles, /prefers-reduced-motion:reduce/);
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
