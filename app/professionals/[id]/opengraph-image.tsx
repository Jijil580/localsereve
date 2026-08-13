import { ImageResponse } from "next/og";
import { notFound } from "next/navigation";
import { displayKannurLocality, getPublicProvider } from "../../../lib/public-providers";
import { SITE_URL } from "../../../lib/seo-services";

export const alt = "Nearleo professional profile";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const revalidate = 300;

export default async function OpenGraphProfileImage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const provider = await getPublicProvider(id).catch(() => null);
  if (!provider) notFound();
  const locality = displayKannurLocality(provider.locality);
  const photoUrl = provider.photoUrl ? `${SITE_URL}${provider.photoUrl}` : null;
  const rating = provider.reviews > 0 ? provider.rating.toFixed(1) : "New";

  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", padding: 42, color: "#071f45", background: "linear-gradient(125deg,#ffffff 0%,#edf5ff 68%,#d8e9ff 100%)", fontFamily: "Arial, sans-serif" }}>
      <div style={{ width: 445, height: "100%", display: "flex", position: "relative", overflow: "hidden", borderRadius: 34, background: "linear-gradient(145deg,#1769e0,#0b3d91)", boxShadow: "0 24px 60px rgba(11,61,145,.24)" }}>
        {photoUrl ? <img src={photoUrl} alt="" width="445" height="546" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 112, fontWeight: 800 }}>{provider.initials}</div>}
        <div style={{ position: "absolute", inset: 0, display: "flex", background: "linear-gradient(180deg,rgba(5,25,55,.02) 35%,rgba(5,25,55,.90) 100%)" }} />
        <div style={{ position: "absolute", left: 24, top: 24, display: "flex", padding: "11px 16px", borderRadius: 999, color: "white", background: provider.verified ? "#087c59" : "#596b82", fontSize: 18, fontWeight: 800 }}>{provider.verified ? "✓ Nearleo verified" : "Unverified profile"}</div>
        <div style={{ position: "absolute", left: 24, right: 24, bottom: 24, display: "flex", gap: 9 }}>
          {[{ value: provider.likes, label: "Likes" }, { value: rating, label: provider.reviews > 0 ? "Rating" : "Profile" }, { value: provider.completedJobs, label: "Works done" }].map(item => <div key={item.label} style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", padding: "13px 12px", border: "1px solid rgba(255,255,255,.24)", borderRadius: 15, color: "white", background: "rgba(5,27,61,.80)" }}><b style={{ fontSize: 25 }}>{item.value}</b><span style={{ marginTop: 3, color: "#ccdbef", fontSize: 13 }}>{item.label}</span></div>)}
        </div>
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "12px 18px 12px 50px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}><span style={{ width: 58, height: 58, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 17, color: "white", background: "#1769e0", fontSize: 35, fontWeight: 900 }}>N</span><div style={{ display: "flex", flexDirection: "column" }}><b style={{ fontSize: 31 }}>Nearleo</b><span style={{ color: "#1769e0", fontSize: 15, fontWeight: 700 }}>by Lumier</span></div></div>
        <div style={{ display: "flex", alignSelf: "flex-start", marginTop: 57, padding: "11px 16px", borderRadius: 12, color: "white", background: "#1769e0", fontSize: 20, fontWeight: 800 }}>{provider.service}</div>
        <h1 style={{ margin: "18px 0 9px", maxWidth: 605, color: "#071f45", fontSize: 54, lineHeight: 1.03, letterSpacing: -2 }}>{provider.business}</h1>
        <p style={{ margin: 0, color: "#345170", fontSize: 25, fontWeight: 700 }}>{provider.name}</p>
        <p style={{ margin: "22px 0 0", color: "#526a88", fontSize: 21 }}>⌖ {locality}</p>
        <div style={{ marginTop: "auto", display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 24, borderTop: "2px solid #d4e3f6" }}><span style={{ color: "#526a88", fontSize: 18 }}>View the complete professional profile</span><b style={{ color: "#1769e0", fontSize: 21 }}>nearleo.com →</b></div>
      </div>
    </div>,
    size,
  );
}
