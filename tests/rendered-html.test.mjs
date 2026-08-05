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
