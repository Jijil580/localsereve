"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type CallUser = { id: string; fullName: string; role: "customer" | "provider" | "admin" };
export type CallProvider = { id: string; business: string; service: string };
type CallStage = "idle" | "preparing" | "ringing" | "incoming" | "connecting" | "connected" | "ended" | "error";
type CallRecord = {
  _id: string;
  status: string;
  side?: "caller" | "provider";
  callerName: string;
  providerBusiness: string;
  service: string;
  offer?: RTCSessionDescriptionInit;
  answer?: RTCSessionDescriptionInit;
  callerCandidates?: RTCIceCandidateInit[];
  providerCandidates?: RTCIceCandidateInit[];
};

async function jsonRequest(url: string, init?: RequestInit) {
  const response = await fetch(url, { credentials: "include", ...init });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "Call service is unavailable");
  return result;
}

function callLabel(stage: CallStage) {
  if (stage === "preparing") return "Preparing secure audio…";
  if (stage === "ringing") return "Calling professional…";
  if (stage === "incoming") return "Incoming Nearleo call";
  if (stage === "connecting") return "Connecting audio…";
  if (stage === "connected") return "Internet audio call";
  if (stage === "ended") return "Call ended";
  if (stage === "error") return "Call unavailable";
  return "Nearleo audio call";
}

export default function WebRtcCallCenter({ user, requestedProvider, onRequestHandled, onMessage }: { user: CallUser | null; requestedProvider: CallProvider | null; onRequestHandled: () => void; onMessage: (message: string) => void }) {
  const [stage, setStage] = useState<CallStage>("idle");
  const [call, setCall] = useState<CallRecord | null>(null);
  const [error, setError] = useState("");
  const [seconds, setSeconds] = useState(0);
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const callIdRef = useRef("");
  const sideRef = useRef<"caller" | "provider">("caller");
  const bufferedCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const seenCandidatesRef = useRef(new Set<string>());
  const remoteDescriptionSetRef = useRef(false);

  const releaseMedia = useCallback(() => {
    peerRef.current?.close();
    peerRef.current = null;
    streamRef.current?.getTracks().forEach(track => track.stop());
    streamRef.current = null;
    if (remoteAudioRef.current) remoteAudioRef.current.srcObject = null;
    bufferedCandidatesRef.current = [];
    seenCandidatesRef.current.clear();
    remoteDescriptionSetRef.current = false;
  }, []);

  const signal = useCallback(async (id: string, action: string, extra: Record<string, unknown> = {}) => {
    return jsonRequest(`/api/calls/${id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ action, ...extra }) });
  }, []);

  const flushCandidates = useCallback(async (id: string) => {
    const queued = bufferedCandidatesRef.current.splice(0);
    await Promise.allSettled(queued.map(candidate => signal(id, "candidate", { candidate })));
  }, [signal]);

  const preparePeer = useCallback(async (side: "caller" | "provider") => {
    if (!navigator.mediaDevices?.getUserMedia || typeof RTCPeerConnection === "undefined") throw new Error("Audio calling is not supported by this browser");
    const config = await jsonRequest("/api/calls/ice-config");
    const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }, video: false });
    const peer = new RTCPeerConnection({ iceServers: config.data });
    stream.getTracks().forEach(track => peer.addTrack(track, stream));
    peer.ontrack = event => {
      const remoteStream = event.streams[0] ?? new MediaStream([event.track]);
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = remoteStream;
        remoteAudioRef.current.play().catch(() => {});
      }
    };
    peer.onicecandidate = event => {
      if (!event.candidate) return;
      const candidate = event.candidate.toJSON();
      const id = callIdRef.current;
      if (id) signal(id, "candidate", { candidate }).catch(() => {});
      else bufferedCandidatesRef.current.push(candidate);
    };
    peer.onconnectionstatechange = () => {
      if (peer.connectionState === "connected") { setStage("connected"); setSeconds(0); }
      if (peer.connectionState === "disconnected") setStage("connecting");
      if (peer.connectionState === "failed") { setError("The internet audio connection was interrupted."); setStage("error"); releaseMedia(); }
    };
    sideRef.current = side;
    peerRef.current = peer;
    streamRef.current = stream;
    return peer;
  }, [releaseMedia, signal]);

  const reset = useCallback(() => {
    releaseMedia();
    callIdRef.current = "";
    setCall(null);
    setError("");
    setSeconds(0);
    setStage("idle");
  }, [releaseMedia]);

  useEffect(() => () => releaseMedia(), [releaseMedia]);

  const startOutgoing = useCallback(async (provider: CallProvider) => {
    if (stage !== "idle") return;
    onRequestHandled();
    setError("");
    setStage("preparing");
    try {
      const peer = await preparePeer("caller");
      const offer = await peer.createOffer({ offerToReceiveAudio: true });
      await peer.setLocalDescription(offer);
      const result = await jsonRequest("/api/calls", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ providerId: provider.id, offer: peer.localDescription }) });
      const id = String(result.data.id);
      callIdRef.current = id;
      setCall({ _id: id, status: "ringing", side: "caller", callerName: user?.fullName ?? "Nearleo customer", providerBusiness: result.data.providerBusiness, service: result.data.service });
      setStage("ringing");
      await flushCandidates(id);
    } catch (problem) {
      releaseMedia();
      const message = problem instanceof Error ? problem.message : "Unable to start the audio call";
      setError(message.includes("Permission") || message.includes("NotAllowed") ? "Microphone permission is required for audio calling." : message);
      setStage("error");
    }
  }, [flushCandidates, onRequestHandled, preparePeer, releaseMedia, stage, user?.fullName]);

  useEffect(() => {
    if (requestedProvider && user?.role === "customer" && stage === "idle") startOutgoing(requestedProvider);
  }, [requestedProvider, stage, startOutgoing, user?.role]);

  useEffect(() => {
    if (!user || user.role !== "provider" || stage !== "idle") return;
    let cancelled = false;
    async function checkIncoming() {
      try {
        const result = await jsonRequest("/api/calls");
        if (!cancelled && result.data) {
          const incoming = result.data as CallRecord;
          callIdRef.current = incoming._id;
          sideRef.current = "provider";
          setCall({ ...incoming, side: "provider" });
          setStage(incoming.status === "accepted" ? "connecting" : "incoming");
          if (navigator.vibrate) navigator.vibrate([180, 100, 180]);
        }
      } catch { /* A temporary poll failure should not disrupt the app. */ }
    }
    checkIncoming();
    const timer = window.setInterval(checkIncoming, 3500);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, [stage, user]);

  const applyRemoteCandidates = useCallback(async (record: CallRecord) => {
    const peer = peerRef.current;
    if (!peer || !remoteDescriptionSetRef.current) return;
    const candidates = sideRef.current === "caller" ? record.providerCandidates ?? [] : record.callerCandidates ?? [];
    for (const candidate of candidates) {
      const key = JSON.stringify(candidate);
      if (seenCandidatesRef.current.has(key)) continue;
      try { await peer.addIceCandidate(candidate); seenCandidatesRef.current.add(key); } catch { /* Wait for the next valid candidate. */ }
    }
  }, []);

  const refreshCall = useCallback(async () => {
    const id = callIdRef.current;
    if (!id) return;
    try {
      const result = await jsonRequest(`/api/calls/${id}`);
      const record = result.data as CallRecord;
      setCall(record);
      if (["declined", "ended", "missed"].includes(record.status)) {
        releaseMedia();
        setError(record.status === "declined" ? "The professional declined this call." : record.status === "missed" ? "The professional did not answer." : "The call has ended.");
        setStage("ended");
        return;
      }
      if (sideRef.current === "caller" && record.answer && peerRef.current && !remoteDescriptionSetRef.current) {
        await peerRef.current.setRemoteDescription(record.answer);
        remoteDescriptionSetRef.current = true;
        setStage("connecting");
      }
      await applyRemoteCandidates(record);
    } catch (problem) {
      if (problem instanceof Error && problem.message === "Call not found") { releaseMedia(); setStage("ended"); setError("This call has expired."); }
    }
  }, [applyRemoteCandidates, releaseMedia]);

  useEffect(() => {
    if (!callIdRef.current || !["ringing", "incoming", "connecting", "connected"].includes(stage)) return;
    refreshCall();
    const timer = window.setInterval(refreshCall, 1200);
    return () => window.clearInterval(timer);
  }, [refreshCall, stage]);

  useEffect(() => {
    if (stage !== "ringing") return;
    const timer = window.setTimeout(async () => {
      const id = callIdRef.current;
      if (id) await signal(id, "end").catch(() => {});
      releaseMedia();
      setError("The professional did not answer.");
      setStage("ended");
    }, 60_000);
    return () => window.clearTimeout(timer);
  }, [releaseMedia, signal, stage]);

  useEffect(() => {
    if (stage !== "connected") return;
    const timer = window.setInterval(() => setSeconds(value => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [stage]);

  async function accept() {
    if (!call) return;
    setError("");
    setStage("connecting");
    try {
      const detail = (await jsonRequest(`/api/calls/${call._id}`)).data as CallRecord;
      if (!detail.offer) throw new Error("The call offer has expired");
      const peer = await preparePeer("provider");
      await peer.setRemoteDescription(detail.offer);
      remoteDescriptionSetRef.current = true;
      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);
      await signal(call._id, "accept", { answer: peer.localDescription });
      await flushCandidates(call._id);
      await applyRemoteCandidates(detail);
    } catch (problem) {
      await signal(call._id, "end").catch(() => {});
      releaseMedia();
      const message = problem instanceof Error ? problem.message : "Unable to accept the call";
      setError(message.includes("Permission") || message.includes("NotAllowed") ? "Microphone permission is required to accept this call." : message);
      setStage("error");
    }
  }

  async function finish(action: "decline" | "end") {
    const id = callIdRef.current;
    if (id) await signal(id, action).catch(() => {});
    releaseMedia();
    setError(action === "decline" ? "Call declined." : "Call ended.");
    setStage("ended");
  }

  if (stage === "idle") return null;
  const party = sideRef.current === "caller" ? call?.providerBusiness ?? requestedProvider?.business ?? "Professional" : call?.callerName ?? "Nearleo customer";
  const time = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
  return <div className="voice-call-overlay" role="dialog" aria-modal="true" aria-label="Nearleo audio call">
    <section className={`voice-call-card stage-${stage}`}>
      <audio ref={remoteAudioRef} autoPlay playsInline/>
      <span className="voice-call-brand">N</span>
      <small>{callLabel(stage)}</small>
      <div className="voice-call-avatar">{party.split(/\s+/).map(word => word[0]).slice(0,2).join("").toUpperCase()}</div>
      <h2>{party}</h2>
      <p>{call?.service ?? requestedProvider?.service ?? "Nearleo service"}</p>
      {stage === "connected" && <strong className="voice-call-time">{time}</strong>}
      {error && <div className="voice-call-error">{error}</div>}
      <div className="voice-call-actions">
        {stage === "incoming" && <><button className="voice-decline" onClick={() => finish("decline")}><span>×</span>Decline</button><button className="voice-accept" onClick={accept}><span>●</span>Accept</button></>}
        {["preparing", "ringing", "connecting", "connected"].includes(stage) && stage !== "incoming" && <button className="voice-end" onClick={() => finish("end")}><span>×</span>End call</button>}
        {["ended", "error"].includes(stage) && <button className="voice-close" onClick={reset}>Close</button>}
      </div>
      <em>Encrypted browser audio · Phone numbers stay private</em>
    </section>
  </div>;
}
