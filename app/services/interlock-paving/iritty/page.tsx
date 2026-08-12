import type { Metadata } from "next";
import Link from "next/link";
import SeoProviderCard from "../../../seo-provider-card";
import { getKannurProviders } from "../../../../lib/public-providers";
import { SITE_URL } from "../../../../lib/seo-services";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const providers = (await getKannurProviders("Interlock paving").catch(() => [])).filter((provider) => /iritty/i.test(provider.locality));
  return {
    title: "Interlock Workers in Iritty",
    description: "Find interlock workers in Iritty, Kannur. View published interlock paving professional profiles, locations and verification status on Nearleo.",
    alternates: { canonical: "/services/interlock-paving/iritty" },
    robots: { index: providers.length > 0, follow: true },
    openGraph: {
      title: "Interlock Workers in Iritty | Nearleo",
      description: "Browse interlock paving professionals serving Iritty and nearby Kannur areas on Nearleo.",
      url: `${SITE_URL}/services/interlock-paving/iritty`,
    },
  };
}

export default async function IrittyInterlockPage() {
  const providers = (await getKannurProviders("Interlock paving").catch(() => [])).filter((provider) => /iritty/i.test(provider.locality));
  const pageUrl = `${SITE_URL}/services/interlock-paving/iritty`;
  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "Service",
      "@id": `${pageUrl}/#service`,
      name: "Interlock Workers in Iritty",
      description: "Published interlock paving professionals serving Iritty, Kannur.",
      areaServed: { "@type": "City", name: "Iritty, Kannur, Kerala" },
      provider: { "@id": `${SITE_URL}/#organization` },
      url: pageUrl,
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Kannur", item: `${SITE_URL}/kannur` },
        { "@type": "ListItem", position: 3, name: "Interlock paving in Kannur", item: `${SITE_URL}/services/interlock-paving/kannur` },
        { "@type": "ListItem", position: 4, name: "Interlock workers in Iritty", item: pageUrl },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: "Interlock paving professionals in Iritty",
      numberOfItems: providers.length,
      itemListElement: providers.map((provider, index) => ({ "@type": "ListItem", position: index + 1, name: provider.business, url: `${SITE_URL}/professionals/${provider.id}` })),
    },
  ];

  return (
    <main className="seo-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }} />
      <header className="seo-header"><Link className="seo-brand" href="/" aria-label="Nearleo home"><span>N</span><strong>Nearleo<small>by Lumier</small></strong></Link><Link className="seo-home-link" href="/kannur">Kannur directory</Link></header>
      <nav className="seo-breadcrumb" aria-label="Breadcrumb"><Link href="/">Home</Link><span>/</span><Link href="/kannur">Kannur</Link><span>/</span><Link href="/services/interlock-paving/kannur">Interlock paving</Link><span>/</span><b>Iritty</b></nav>

      <section className="seo-hero seo-location-hero">
        <div>
          <span className="seo-kicker">Interlock paving · Iritty, Kannur</span>
          <h1>Find interlock workers in Iritty</h1>
          <p>Browse published Nearleo profiles for interlock paving professionals serving Iritty and nearby Kannur communities. Check location, profile details and verification status before requesting work.</p>
          <div className="seo-hero-actions"><Link className="seo-primary-link" href="/?service=Interlock%20paving">Search interlock paving</Link><Link className="seo-secondary-link" href="/services/interlock-paving/kannur">View all Kannur listings</Link></div>
        </div>
        <aside className="seo-location-summary"><span>Serving Iritty</span><strong>{providers.length}</strong><p>published interlock {providers.length === 1 ? "profile" : "profiles"}</p><small>Contact details remain permission-based.</small></aside>
      </section>

      <section className="seo-provider-directory" aria-labelledby="iritty-provider-title">
        <div className="seo-section-heading"><span>Local results</span><h2 id="iritty-provider-title">Interlock paving professionals in Iritty</h2></div>
        {providers.length > 0 ? <div className="seo-provider-list">{providers.map((provider) => <SeoProviderCard provider={provider} key={provider.id} />)}</div> : <div className="seo-empty-directory"><h3>No published Iritty profiles yet</h3><p>Return to the Kannur directory to browse nearby interlock professionals.</p></div>}
      </section>

      <section className="seo-content-grid seo-local-content">
        <article><span className="seo-kicker">Common projects</span><h2>Interlock work in Iritty</h2><ul><li>Driveway and courtyard paving</li><li>Pathway interlock installation</li><li>Relaying and paver repairs</li></ul></article>
        <article><span className="seo-kicker">Compare clearly</span><h2>Discuss the site and materials</h2><p>Confirm the area, paver type, ground preparation, drainage, edge finishing, labour and complete price before work begins.</p></article>
        <article><span className="seo-kicker">Nearleo status</span><h2>Look for the verification badge</h2><p>Verified and unverified providers are clearly labelled so customers can make an informed choice.</p></article>
      </section>

      <section className="seo-cta"><div><span>Interlock paving in Iritty</span><h2>Send your requirement through Nearleo</h2></div><Link href="/?service=Interlock%20paving">Search now</Link></section>
      <footer className="seo-footer">© 2026 Nearleo · Powered by Lumier Technologies</footer>
    </main>
  );
}
