"use client";

import { useEffect, useState } from "react";

type ShareProfileProps = {
  authenticated: boolean;
  profileUrl: string;
  providerName: string;
  business: string;
  service: string;
  locality: string;
  loginHref?: string;
  compact?: boolean;
  onAuthRequired?: () => void;
};

export default function ShareProfile({
  authenticated,
  profileUrl,
  providerName,
  business,
  service,
  locality,
  loginHref = "/?contactLogin=1",
  compact = false,
  onAuthRequired,
}: ShareProfileProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shareToken, setShareToken] = useState("");
  const title = `${business} - ${service} in ${locality}`;
  const shareText = `View ${providerName}'s ${service} profile in ${locality} on Nearleo.`;
  const shareUrl = shareToken ? `${profileUrl}${profileUrl.includes("?") ? "&" : "?"}shared=${shareToken}` : profileUrl;
  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedMessage = encodeURIComponent(`${shareText}\n${shareUrl}`);

  useEffect(() => {
    if (!authenticated || typeof window === "undefined") return;
    const url = new URL(window.location.href);
    if (url.searchParams.get("share") !== "1") return;
    setShareToken(String(Date.now()));
    setOpen(true);
    url.searchParams.delete("share");
    window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
  }, [authenticated]);

  function requireLogin() {
    if (authenticated) return true;
    if (typeof window !== "undefined") {
      const returnUrl = new URL(profileUrl, window.location.origin);
      returnUrl.searchParams.set("share", "1");
      window.sessionStorage.setItem("nearleo-share-after-login", `${returnUrl.pathname}${returnUrl.search}`);
    }
    if (onAuthRequired) onAuthRequired();
    else if (typeof window !== "undefined") window.location.assign(loginHref);
    return false;
  }

  function toggleShare() {
    if (!requireLogin()) return;
    if (!open) setShareToken(String(Date.now()));
    setOpen(current => !current);
  }

  async function shareToApps() {
    if (!requireLogin()) return;
    if (navigator.share) {
      try {
        await navigator.share({ title, text: shareText, url: shareUrl });
        return;
      } catch (problem) {
        if (problem instanceof DOMException && problem.name === "AbortError") return;
      }
    }
    await copyLink();
  }

  async function copyLink() {
    if (!requireLogin()) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      window.prompt("Copy this Nearleo profile link", shareUrl);
    }
  }

  return (
    <section className={`profile-share${compact ? " compact" : ""}`}>
      {!compact && <div className="profile-share-heading"><span>SHARE PROFILE</span><h3>Recommend this professional</h3><p>The shared link displays the provider photo, service and profile summary.</p></div>}
      <button className="profile-share-main" type="button" onClick={toggleShare} aria-expanded={open}>
        <span aria-hidden="true">↗</span><b>{authenticated ? "Share profile" : "Log in to share profile"}</b><i aria-hidden="true">{open ? "−" : "+"}</i>
      </button>
      {!authenticated && !compact && <small className="profile-share-login-note">Sharing is available after login for customers and professionals.</small>}
      {open && authenticated && <div className="profile-share-options" aria-label="Share provider profile">
        <button className="share-any" type="button" onClick={shareToApps}><span>↗</span><b>Share to any app</b><small>Mobile share menu</small></button>
        <a className="share-whatsapp" href={`https://wa.me/?text=${encodedMessage}`} target="_blank" rel="noreferrer"><img src="/icons/whatsapp.svg" alt="" aria-hidden="true"/><b>WhatsApp</b></a>
        <a className="share-facebook" href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`} target="_blank" rel="noreferrer"><span>f</span><b>Facebook</b></a>
        <a className="share-x" href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodedUrl}`} target="_blank" rel="noreferrer"><span>𝕏</span><b>X</b></a>
        <a className="share-email" href={`mailto:?subject=${encodeURIComponent(title)}&body=${encodedMessage}`}><span>✉</span><b>Email</b></a>
        <button className="share-copy" type="button" onClick={copyLink}><span>⧉</span><b>{copied ? "Link copied" : "Copy link"}</b></button>
      </div>}
    </section>
  );
}
