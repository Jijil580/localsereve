import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import fs from "node:fs";
import ts from "typescript";
import webPush from "web-push";
import { ObjectId } from "mongodb";
import crypto from "node:crypto";

const source = fs.readFileSync(new URL("../lib/web-push.ts", import.meta.url), "utf8");
function loadPush(db, send = async () => {}) {
  const exports = {};
  const code = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, esModuleInterop: true } }).outputText;
  vm.runInNewContext(code, { exports, Buffer, URL, console: { warn() {} }, require(name) {
    if (name === "web-push") return { ...webPush, sendNotification: send };
    if (name === "mongodb") return { ObjectId };
    if (name === "node:crypto") return crypto;
    if (name === "./mongodb") return { getMongoDb: async () => db };
    throw new Error(name);
  } });
  return exports;
}
const subscription = { endpoint: "https://fcm.googleapis.com/fcm/send/test", keys: { auth: Buffer.alloc(16, 2).toString("base64url"), p256dh: webPush.generateVAPIDKeys().publicKey } };
test("push subscriptions reject arbitrary hosts, credentials and malformed encryption keys", () => {
  const { validSubscription } = loadPush({});
  assert.equal(validSubscription(subscription), true);
  for (const endpoint of ["http://fcm.googleapis.com/send/x", "https://localhost/x", "https://fcm.googleapis.com.evil.test/x", "https://user:pass@fcm.googleapis.com/x", "https://fcm.googleapis.com:8443/x"]) assert.equal(validSubscription({ ...subscription, endpoint }), false);
  assert.equal(validSubscription({ ...subscription, keys: { ...subscription.keys, auth: "short" } }), false);
});
test("delivery targets recipient devices and removes only expired subscriptions", async () => {
  const userId = new ObjectId(); const deleted = []; const sent = [];
  const rows = ["expired", "temporary", "ok"].map(id => ({ _id: id, userId, subscription: { ...subscription, endpoint: subscription.endpoint + id } }));
  const db = { collection(name) { return name === "pushSettings" ? { findOne: async () => webPush.generateVAPIDKeys() } : {
    find(query) { assert.equal(String(query.userId.$in[0]), String(userId)); return { toArray: async () => rows }; },
    deleteOne: async query => deleted.push(query),
  }; } };
  const { notifyPhones } = loadPush(db, async (sub, payload, options) => {
    sent.push(JSON.parse(payload)); assert.equal(options.TTL, 3600);
    if (sub.endpoint.endsWith("expired")) throw { statusCode: 410 };
    if (sub.endpoint.endsWith("temporary")) throw { statusCode: 503 };
  });
  await notifyPhones([String(userId)], { title: "New message", body: "Open chat", url: "/?notification=messages", tag: "chat-1" });
  assert.equal(sent.length, 3); assert.equal(deleted.length, 1); assert.equal(deleted[0]._id, "expired");
});
test("service worker displays push and opens only same-origin destinations", async () => {
  const events = {}; const displayed = []; const opened = [];
  const self = { location: { origin: "https://www.nearleo.com" }, addEventListener: (name, fn) => events[name] = fn,
    registration: { showNotification: async (...args) => displayed.push(args) },
    clients: { matchAll: async () => [], openWindow: async url => opened.push(url) } };
  vm.runInNewContext(fs.readFileSync(new URL("../public/sw.js", import.meta.url), "utf8"), { self, URL });
  let pending;
  const url = "/?notification=messages&requestId=123&providerId=456";
  events.push({ data: { json: () => ({ title: "New reply", body: "Read reply", url }) }, waitUntil: p => pending = p }); await pending;
  assert.equal(displayed[0][0], "New reply");
  events.notificationclick({ notification: { close() {}, data: { url } }, waitUntil: p => pending = p }); await pending;
  assert.equal(opened[0], "https://www.nearleo.com" + url);
  events.notificationclick({ notification: { close() {}, data: { url: "https://evil.test" } }, waitUntil: p => pending = p });
  assert.equal(opened.length, 1);
});
