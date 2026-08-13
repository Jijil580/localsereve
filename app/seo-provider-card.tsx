import Link from "next/link";
import { displayKannurLocality, type PublicProvider } from "../lib/public-providers";
import LocationPinIcon from "./location-pin";

export default function SeoProviderCard({ provider }: { provider: PublicProvider }) {
  return (
    <article className="seo-provider-card">
      <div className="seo-provider-photo">
        {provider.photoUrl ? (
          <img src={provider.photoUrl} alt={`${provider.name}, ${provider.service} in ${displayKannurLocality(provider.locality)}`} />
        ) : (
          <span aria-hidden="true">{provider.initials}</span>
        )}
        <b className={provider.verified ? "verified" : "unverified"}>{provider.verified ? "✓ Verified" : "Unverified"}</b>
      </div>
      <div className="seo-provider-copy">
        <span>{provider.service}</span>
        <h3>{provider.business}</h3>
        <p className="seo-provider-name">{provider.name}</p>
        <p className="seo-provider-location"><LocationPinIcon/>{displayKannurLocality(provider.locality)}</p>
        <div className="seo-provider-metrics" aria-label="Provider profile summary"><span><i>♥</i><b>{provider.likes}</b><small>{provider.likes===1?"Like":"Likes"}</small></span><span><i>★</i><b>{provider.reviews>0?provider.rating.toFixed(1):"New"}</b><small>{provider.reviews>0?`${provider.reviews} reviews`:"No ratings"}</small></span><span><i>✓</i><b>{provider.completedJobs}</b><small>{provider.completedJobs===1?"Work done":"Works done"}</small></span></div>
        <div className="seo-provider-facts">
          {provider.experience > 0 && <span><b>{provider.experience}</b> years experience</span>}
          {provider.startingPrice > 0 && <span>Starts at <b>₹{provider.startingPrice}</b></span>}
          {provider.available && <span><b>Available</b> now</span>}
        </div>
        <Link href={`/professionals/${provider.id}`}>View public profile <span aria-hidden="true">→</span></Link>
      </div>
    </article>
  );
}
