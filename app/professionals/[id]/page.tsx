import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import SeoProviderCard from "../../seo-provider-card";
import ShareProfile from "../../share-profile";
import { getSession } from "../../../lib/auth";
import { displayKannurLocality, getKannurProviders, getPublicProvider } from "../../../lib/public-providers";
import { SITE_URL, findSeoServiceByName } from "../../../lib/seo-services";

export const dynamic = "force-dynamic";

type PublicProfilePageProps = { params: Promise<{ id: string }>; searchParams?: Promise<{ shared?: string | string[] }> };

export async function generateMetadata({ params, searchParams }: PublicProfilePageProps): Promise<Metadata> {
  const { id } = await params;
  const query = await searchParams;
  const provider = await getPublicProvider(id).catch(() => null);
  if (!provider) return {};
  const locality = displayKannurLocality(provider.locality);
  const title = `${provider.business} - ${provider.service} in ${locality}`;
  const description = `${provider.name} provides ${provider.service.toLowerCase()} services in ${locality}. View the public profile, experience and verification status on Nearleo.`;
  const socialImage = `/professionals/${provider.id}/share-card.png?v=${provider.updatedAt?.getTime() ?? 1}&design=2`;
  const sharedValue = Array.isArray(query?.shared) ? query?.shared[0] : query?.shared;
  const socialPageUrl = `${SITE_URL}/professionals/${provider.id}${sharedValue && /^\d{10,}$/.test(sharedValue) ? `?shared=${sharedValue}` : ""}`;
  return {
    title,
    description,
    alternates: { canonical: `/professionals/${provider.id}` },
    openGraph: {
      title: `${title} | Nearleo`,
      description,
      url: socialPageUrl,
      type: "website",
      siteName: "Nearleo",
      locale: "en_IN",
      images: [{ url: socialImage, secureUrl: socialImage, type: "image/png", width: 1200, height: 630, alt: `${provider.business}, ${provider.service} in ${locality}` }],
    },
    twitter: { card: "summary_large_image", title: `${title} | Nearleo`, description, images: [socialImage] },
  };
}

export default async function PublicProfilePage({ params }: PublicProfilePageProps) {
  const { id } = await params;
  const provider = await getPublicProvider(id).catch(() => null);
  if (!provider) notFound();
  const viewer = await getSession();
  const locality = displayKannurLocality(provider.locality);
  const service = findSeoServiceByName(provider.service);
  const relatedProviders = (await getKannurProviders(provider.service).catch(() => [])).filter((item) => item.id !== provider.id).slice(0, 3);
  const profileUrl = `${SITE_URL}/professionals/${provider.id}`;
  const whatsappNumber = provider.phone.replace(/\D/g, "");
  const whatsappInternational = whatsappNumber.length === 10 ? `91${whatsappNumber}` : whatsappNumber;
  const whatsappMessage = encodeURIComponent(`Hello ${provider.name}, I found your ${provider.service} profile on Nearleo.`);
  const contactLoginHref = `/?contactLogin=1&service=${encodeURIComponent(provider.service)}`;
  const profileDescription = provider.description || `${provider.name} has published a ${provider.service.toLowerCase()} service profile for customers in ${locality}.`;
  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "ProfilePage",
      "@id": `${profileUrl}/#profile`,
      name: `${provider.business} on Nearleo`,
      url: profileUrl,
      dateModified: provider.updatedAt?.toISOString(),
      mainEntity: {
        "@type": "Person",
        name: provider.name,
        jobTitle: provider.service,
        description: profileDescription,
        image: provider.photoUrl ? `${SITE_URL}${provider.photoUrl}` : undefined,
        workLocation: { "@type": "Place", name: locality },
        worksFor: { "@type": "Organization", name: provider.business },
        telephone: viewer ? provider.phone : undefined,
        email: viewer ? provider.email || undefined : undefined,
        sameAs: [provider.instagramUrl, provider.facebookUrl, provider.youtubeUrl].filter(Boolean),
        aggregateRating: provider.reviews > 0 ? { "@type": "AggregateRating", ratingValue: provider.rating, reviewCount: provider.reviews, bestRating: 5 } : undefined,
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Kannur professionals", item: `${SITE_URL}/kannur` },
        { "@type": "ListItem", position: 3, name: provider.business, item: profileUrl },
      ],
    },
  ];

  return (
    <main className="seo-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }} />
      <header className="seo-header"><Link className="seo-brand" href="/" aria-label="Nearleo home"><span>N</span><strong>Nearleo</strong></Link><Link className="seo-home-link" href="/kannur">Kannur directory</Link></header>
      <nav className="seo-breadcrumb" aria-label="Breadcrumb"><Link href="/">Home</Link><span>/</span><Link href="/kannur">Kannur</Link><span>/</span><b>{provider.business}</b></nav>

      <section className="public-profile-hero">
        <div className="public-profile-image">
          {provider.photoUrl ? <img src={provider.photoUrl} alt={`${provider.name}, ${provider.service} in ${locality}`} /> : <span>{provider.initials}</span>}
          <b className={provider.verified ? "verified" : "unverified"}>{provider.verified ? "✓ Nearleo verified" : "Unverified profile"}</b>
          <div className="public-profile-banner-metrics" aria-label="Provider profile summary"><div><i>♥</i><span><b>{provider.likes}</b><small>{provider.likes===1?"Like":"Likes"}</small></span></div><div><i>★</i><span><b>{provider.reviews>0?provider.rating.toFixed(1):"New"}</b><small>{provider.reviews>0?`${provider.reviews} reviews`:"No ratings yet"}</small></span></div><div><i>✓</i><span><b>{provider.completedJobs}</b><small>{provider.completedJobs===1?"Work done":"Works done"}</small></span></div></div>
        </div>
        <div className="public-profile-intro">
          <span className="seo-kicker">{provider.service} · {locality}</span>
          <h1>{provider.business}</h1>
          <p className="public-profile-person">Professional profile of <b>{provider.name}</b></p>
          <p>{profileDescription}</p>
          <div className="public-profile-facts">
            <div><span>Service</span><b>{provider.service}</b></div>
            <div><span>Service area</span><b>{locality}</b></div>
            {provider.experience > 0 && <div><span>Experience</span><b>{provider.experience} years</b></div>}
            {provider.startingPrice > 0 && <div><span>Starting price</span><b>₹{provider.startingPrice}</b></div>}
            <div><span>Availability</span><b>{provider.available ? "Available" : "Ask provider"}</b></div>
          </div>
          <section className="public-contact-section"><div className="provider-contact-heading"><span>CONTACT NOW</span><h2>Contact {provider.service}</h2></div>{!viewer&&<p className="contact-login-note">Log in to call, WhatsApp or mail this provider.</p>}<div className="public-direct-contact">{viewer?<><a className="phone" href={`tel:${provider.phone}`}><span>☎</span><b>Call</b></a><a className="whatsapp" href={`https://wa.me/${whatsappInternational}?text=${whatsappMessage}`} target="_blank" rel="noreferrer"><img src="/icons/whatsapp.svg" alt="" aria-hidden="true"/><b>WhatsApp</b></a>{provider.email&&<a className="email" href={`mailto:${provider.email}?subject=${encodeURIComponent(`${provider.service} enquiry from Nearleo`)}`}><span>✉</span><b>Mail</b></a>}</>:<><Link className="phone login-required" href={contactLoginHref}><span>☎</span><b>Call</b></Link><Link className="whatsapp login-required" href={contactLoginHref}><img src="/icons/whatsapp.svg" alt="" aria-hidden="true"/><b>WhatsApp</b></Link><Link className="email login-required" href={contactLoginHref}><span>✉</span><b>Mail</b></Link></>}</div></section>
          <ShareProfile authenticated={Boolean(viewer)} profileUrl={profileUrl} providerName={provider.name} business={provider.business} service={provider.service} locality={locality} loginHref={contactLoginHref}/>
          <div className="seo-hero-actions"><Link className="seo-primary-link" href={`/?service=${encodeURIComponent(provider.service)}`}>Request {provider.service.toLowerCase()} service</Link>{service && <Link className="seo-secondary-link" href={`/services/${service.slug}/kannur`}>View Kannur listings</Link>}</div>
          {[provider.instagramUrl,provider.facebookUrl,provider.youtubeUrl].some(Boolean)&&<div className="public-social-links"><span>Follow this professional</span>{provider.instagramUrl&&<a href={provider.instagramUrl} target="_blank" rel="noreferrer">Instagram</a>}{provider.facebookUrl&&<a href={provider.facebookUrl} target="_blank" rel="noreferrer">Facebook</a>}{provider.youtubeUrl&&<a href={provider.youtubeUrl} target="_blank" rel="noreferrer">YouTube</a>}</div>}
        </div>
      </section>

      {provider.portfolioUrls.length > 0 && <section className="public-profile-gallery">
        <div className="seo-section-heading"><span>Uploaded by the professional</span><h2>Recent work</h2></div>
        <div>{provider.portfolioUrls.map((url, index) => <img src={url} alt={`${provider.service} recent work by ${provider.business}, image ${index + 1}`} key={url} />)}</div>
      </section>}

      <section className="public-profile-safety">
        <div><span aria-hidden="true">✓</span><p><b>Check the verification badge</b>A verified badge means Nearleo administration approved the submitted verification details.</p></div>
        <div><span aria-hidden="true">₹</span><p><b>Confirm the final price</b>Discuss work, materials, timing and payment directly before the job begins.</p></div>
        <div><span aria-hidden="true">★</span><p><b>Check customer reviews</b>Use recent ratings and written feedback together with the verification badge before hiring.</p></div>
      </section>

      {relatedProviders.length > 0 && <section className="seo-provider-directory"><div className="seo-section-heading"><span>More nearby options</span><h2>Related professionals in Kannur</h2></div><div className="seo-provider-list">{relatedProviders.map((item) => <SeoProviderCard provider={item} key={item.id} />)}</div></section>}

      <section className="seo-cta"><div><span>Connect through Nearleo</span><h2>Send a clear service request</h2></div><Link href={`/?service=${encodeURIComponent(provider.service)}`}>Open Nearleo</Link></section>
      <footer className="seo-footer">© 2026 Nearleo · Powered by Lumier Technologies</footer>
    </main>
  );
}
