"use client";

import { useEffect, useState } from "react";

export default function InitialLoadingScreen() {
  const [phase, setPhase] = useState<"visible" | "leaving" | "hidden">("visible");

  useEffect(() => {
    const beginExit = window.setTimeout(() => setPhase("leaving"), 650);
    const remove = window.setTimeout(() => setPhase("hidden"), 1050);
    return () => {
      window.clearTimeout(beginExit);
      window.clearTimeout(remove);
    };
  }, []);

  if (phase === "hidden") return null;

  return (
    <div
      className={`nearleo-page-loader ${phase === "leaving" ? "is-leaving" : ""}`}
      role="status"
      aria-label="Nearleo is loading"
    >
      <div className="nearleo-loader-brand">
        <span className="nearleo-loader-mark" aria-hidden="true">N</span>
        <strong>Nearleo</strong>
        <i className="nearleo-loader-progress" aria-hidden="true" />
      </div>
    </div>
  );
}
