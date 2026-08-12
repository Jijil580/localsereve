import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import SeoProviderCard from "../../seo-provider-card";
import { displayKannurLocality, getKannurProviders, getPublicProvider } from "../../../lib/public-providers";
import { SITE_URL, findSeoServiceByName } from "../../../lib/seo-services";

export const dynamic = "force-dynamic";

type PublicProfilePageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: PublicProfilePageProps): Promise<Metadata> {
  const { id } = await params;
  const provider = await getPublicProvider(id).catch(() => null);
  if (!provider) return {};
  const locality = displayKannurLocality(provider.locality);
  const title = `${provider.business} - ${provider.service} in ${locality}`;
  const description = `${provider.name} provides ${provider.service.toLowerCase()} services in ${locality}. View the public profile, experience and verification status on Nearleo.`;
  return {
    title,
    description,
    alternates: { canonical: `/professionals/${provider.id}` },
    openGraph: {
      title: `${title} | Nearleo`,
      description,
      url: `${SITE_URL}/professionals/${provider.id}`,
      type: "profile",
      images: provider.photoUrl ? [{ url: provider.photoUrl, alt: `${provider.name}, ${provider.service}` }] : [{ url: "/og-blue.png", alt: "Nearleo local services" }],
    },
  };
}

export default async function PublicProfilePage({ params }: PublicProfilePageProps) {
  const { id } = await params;
  const provider = await getPublicProvider(id).catch(() => null);
  if (!provider) notFound();
  const locality = displayKannurLocality(provider.locality);
  const service = findSeoServiceByName(provider.service);
  const relatedProviders = (await getKannurProviders(provider.service).catch(() => [])).filter((item) => item.id !== provider.id).slice(0, 3);
  const profileUrl = `${SITE_URL}/professionals/${provider.id}`;
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
      <header className="seo-header"><Link className="seo-brand" href="/" aria-label="Nearleo home"><span>N</span><strong>Nearleo<small>by Lumier</small></strong></Link><Link className="seo-home-link" href="/kannur">Kannur directory</Link></header>
      <nav className="seo-breadcrumb" aria-label="Breadcrumb"><Link href="/">Home</Link><span>/</span><Link href="/kannur">Kannur</Link><span>/</span><b>{provider.business}</b></nav>

      <section className="public-profile-hero">
        <div className="public-profile-image">
          {provider.photoUrl ? <img src={provider.photoUrl} alt={`${provider.name}, ${provider.service} in ${locality}`} /> : <span>{provider.initials}</span>}
          <b className={provider.verified ? "verified" : "unverified"}>{provider.verified ? "✓ Nearleo verified" : "Unverified profile"}</b>
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
          <div className="seo-hero-actions"><Link className="seo-primary-link" href={`/?service=${encodeURIComponent(provider.service)}`}>Request {provider.service.toLowerCase()} service</Link>{service && <Link className="seo-secondary-link" href={`/services/${service.slug}/kannur`}>View Kannur listings</Link>}</div>
          <small className="public-contact-note">Private phone and WhatsApp details are shared only through Nearleo&apos;s permission-based contact process.</small>
        </div>
      </section>

      {provider.portfolioUrls.length > 0 && <section className="public-profile-gallery">
        <div className="seo-section-heading"><span>Uploaded by the professional</span><h2>Recent work</h2></div>
        <div>{provider.portfolioUrls.map((url, index) => <img src={url} alt={`${provider.service} recent work by ${provider.business}, image ${index + 1}`} key={url} />)}</div>
      </section>}

      <section className="public-profile-safety">
        <div><span aria-hidden="true">✓</span><p><b>Check the verification badge</b>A verified badge means Nearleo administration approved the submitted verification details.</p></div>
        <div><span aria-hidden="true">₹</span><p><b>Confirm the final price</b>Discuss work, materials, timing and payment directly before the job begins.</p></div>
        <div><span aria-hidden="true">⌖</span><p><b>Protect your privacy</b>Nearleo does not publish the professional&apos;s private WhatsApp number on this page.</p></div>
      </section>

      {relatedProviders.length > 0 && <section className="seo-provider-directory"><div className="seo-section-heading"><span>More nearby options</span><h2>Related professionals in Kannur</h2></div><div className="seo-provider-list">{relatedProviders.map((item) => <SeoProviderCard provider={item} key={item.id} />)}</div></section>}

      <section className="seo-cta"><div><span>Connect through Nearleo</span><h2>Send a clear service request</h2></div><Link href={`/?service=${encodeURIComponent(provider.service)}`}>Open Nearleo</Link></section>
      <footer className="seo-footer">© 2026 Nearleo · Powered by Lumier Technologies</footer>
    </main>
  );
}
