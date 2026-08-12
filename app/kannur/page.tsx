import type { Metadata } from "next";
import Link from "next/link";
import SeoProviderCard from "../seo-provider-card";
import { displayKannurLocality, getKannurProviders } from "../../lib/public-providers";
import { SITE_URL, findSeoServiceByName } from "../../lib/seo-services";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Local Service Professionals in Kannur",
  description: "Find electricians, interlock paving professionals, hollow-brick workers and other published local service providers across Kannur on Nearleo.",
  alternates: { canonical: "/kannur" },
  openGraph: {
    title: "Local Service Professionals in Kannur | Nearleo",
    description: "Browse public Nearleo provider profiles serving Kannur, Mattannur, Iritty and surrounding areas.",
    url: `${SITE_URL}/kannur`,
  },
};

export default async function KannurPage() {
  const providers = await getKannurProviders().catch(() => []);
  const availableServices = Array.from(new Set(providers.map((provider) => provider.service)))
    .map((name) => findSeoServiceByName(name))
    .filter((service) => service !== undefined);
  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "@id": `${SITE_URL}/kannur/#page`,
      name: "Local Service Professionals in Kannur",
      description: "Public Nearleo provider profiles serving Kannur district.",
      url: `${SITE_URL}/kannur`,
      isPartOf: { "@id": `${SITE_URL}/#website` },
      about: { "@type": "AdministrativeArea", name: "Kannur, Kerala" },
    },
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: "Nearleo professionals in Kannur",
      numberOfItems: providers.length,
      itemListElement: providers.map((provider, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: `${provider.business} - ${provider.service}`,
        url: `${SITE_URL}/professionals/${provider.id}`,
      })),
    },
  ];

  return (
    <main className="seo-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }} />
      <header className="seo-header">
        <Link className="seo-brand" href="/" aria-label="Nearleo home"><span>N</span><strong>Nearleo<small>by Lumier</small></strong></Link>
        <Link className="seo-home-link" href="/services">All services</Link>
      </header>

      <nav className="seo-breadcrumb" aria-label="Breadcrumb"><Link href="/">Home</Link><span>/</span><b>Kannur</b></nav>

      <section className="seo-hero seo-location-hero">
        <div>
          <span className="seo-kicker">Serving Kannur district</span>
          <h1>Find local service professionals in Kannur</h1>
          <p>Browse public Nearleo profiles for professionals serving Kannur, Mattannur, Iritty and nearby communities. Compare their service, experience, location and verification status before sending a request.</p>
          <div className="seo-hero-actions"><Link className="seo-primary-link" href="/?service=All%20services">Search all professionals</Link><Link className="seo-secondary-link" href="/services">Browse service guides</Link></div>
        </div>
        <aside className="seo-location-summary">
          <span>Live Kannur directory</span>
          <strong>{providers.length}</strong>
          <p>published provider {providers.length === 1 ? "profile" : "profiles"}</p>
          <small>Private phone and WhatsApp details remain protected.</small>
        </aside>
      </section>

      {availableServices.length > 0 && <section className="seo-location-services">
        <div className="seo-section-heading"><span>Services available now</span><h2>Explore professionals by service</h2></div>
        <div>{availableServices.map((service) => <Link href={`/services/${service.slug}/kannur`} key={service.slug}><b>{service.name}</b><span>View in Kannur →</span></Link>)}</div>
      </section>}

      <section className="seo-provider-directory" aria-labelledby="kannur-provider-title">
        <div className="seo-section-heading"><span>Public profiles</span><h2 id="kannur-provider-title">Professionals serving Kannur</h2></div>
        {providers.length > 0 ? <div className="seo-provider-list">{providers.map((provider) => <SeoProviderCard provider={provider} key={provider.id} />)}</div> : <div className="seo-empty-directory"><h3>Provider profiles are being updated</h3><p>Open Nearleo to search the complete directory or register as a professional in Kannur.</p></div>}
      </section>

      <section className="seo-local-coverage">
        <div className="seo-section-heading"><span>Local coverage</span><h2>Kannur areas represented on Nearleo</h2></div>
        <div>{Array.from(new Set(providers.map((provider) => displayKannurLocality(provider.locality)))).map((locality) => <span key={locality}>⌖ {locality}</span>)}</div>
      </section>

      <section className="seo-cta"><div><span>Need a local professional?</span><h2>Describe your requirement on Nearleo</h2></div><Link href="/?service=All%20services">Find help now</Link></section>
      <footer className="seo-footer">© 2026 Nearleo · Powered by Lumier Technologies</footer>
    </main>
  );
}
