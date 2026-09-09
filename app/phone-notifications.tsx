"use client";
import { useEffect, useState } from "react";

export async function disconnectPhoneNotifications() {
  if (!("serviceWorker" in navigator)) return;
  const registration = await navigator.serviceWorker.getRegistration();
  const subscription = await registration?.pushManager?.getSubscription();
  if (!subscription) return;
  const response = await fetch("/api/push", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ endpoint: subscription.endpoint }) });
  if (!response.ok) throw new Error("Could not turn off notifications. Please try again.");
  await subscription.unsubscribe();
}

export default function PhoneNotifications({ userId }: { userId: string }) {
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [hint, setHint] = useState("");
  const [publicKey, setPublicKey] = useState("");
  const [supported, setSupported] = useState(false);
  useEffect(() => {
    let active = true;
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    if (ios && !window.matchMedia("(display-mode: standalone)").matches && !(navigator as Navigator & { standalone?: boolean }).standalone) {
      setHint("On iPhone, use Share → Add to Home Screen, open Nearleo from there, then enable notifications."); return;
    }
    const available = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
    setSupported(available);
    if (!available) { setHint("Open Nearleo in Chrome or another browser that supports phone notifications."); return; }
    const prepare = async () => {
      const response = await fetch("/api/push", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      if (active) setPublicKey(data.publicKey);
      const registration = await navigator.serviceWorker.register("/sw.js");
      const subscription = await registration.pushManager.getSubscription();
      if (subscription && Notification.permission === "granted") {
        const saved = await fetch("/api/push", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(subscription) });
        if (!saved.ok) throw new Error("Unable to reconnect phone notifications.");
        if (active) setEnabled(true);
      }
    };
    prepare().catch(error => { if (active) setHint(error.message || "Please reload to enable notifications."); });
    return () => { active = false; };
  }, [userId]);
  async function toggle() {
    setBusy(true); setHint("");
    try {
      if (enabled) { await disconnectPhoneNotifications(); setEnabled(false); return; }
      const permission = await Notification.requestPermission();
      if (permission !== "granted") { setHint("Enable notifications in your browser’s site settings, then try again."); return; }
      const registration = await navigator.serviceWorker.ready;
      const bytes = Uint8Array.from(atob(publicKey.replace(/-/g, "+").replace(/_/g, "/")), char => char.charCodeAt(0));
      const subscription = await registration.pushManager.getSubscription() || await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: bytes });
      const response = await fetch("/api/push", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(subscription) });
      if (!response.ok) { await subscription.unsubscribe(); throw new Error("Could not save notifications. Please try again."); }
      setEnabled(true); setHint("You’ll receive new requests, replies and messages on this phone.");
    } catch (error) { setHint(error instanceof Error ? error.message : "Could not enable notifications."); }
    finally { setBusy(false); }
  }
  return <section className="phone-notifications" aria-label="Phone notifications"><div><strong>Phone notifications</strong><small>{enabled ? "Enabled on this device" : "Get alerts for requests, replies and messages"}</small></div>{supported && <button type="button" disabled={busy || !publicKey} onClick={toggle}>{busy ? "Please wait…" : enabled ? "Turn off" : "Enable notifications"}</button>}{hint && <p role="status">{hint}</p>}</section>;
}
