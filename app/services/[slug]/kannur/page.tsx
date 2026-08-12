import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import SeoProviderCard from "../../../seo-provider-card";
import { displayKannurLocality, getKannurProviders } from "../../../../lib/public-providers";
import { SITE_URL, findSeoService } from "../../../../lib/seo-services";

export const dynamic = "force-dynamic";

type KannurServicePageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: KannurServicePageProps): Promise<Metadata> {
  const { slug } = await params;
  const service = findSeoService(slug);
  if (!service) return {};
  const providers = await getKannurProviders(service.name).catch(() => []);
  const title = service.kannurSearchTitle ?? `${service.name} in Kannur`;
  return {
    title,
    description: `Find ${service.name.toLowerCase()} profiles serving Kannur district. Compare public details, location and verification status on Nearleo.`,
    alternates: { canonical: `/services/${service.slug}/kannur` },
    robots: { index: providers.length > 0, follow: true },
    openGraph: {
      title: `${title} | Nearleo`,
      description: `${providers.length} published ${service.name.toLowerCase()} ${providers.length === 1 ? "profile" : "profiles"} currently serving Kannur on Nearleo.`,
      url: `${SITE_URL}/services/${service.slug}/kannur`,
    },
  };
}

export default async function KannurServicePage({ params }: KannurServicePageProps) {
  const { slug } = await params;
  const service = findSeoService(slug);
  if (!service) notFound();
  const providers = await getKannurProviders(service.name).catch(() => []);
  const pageUrl = `${SITE_URL}/services/${service.slug}/kannur`;
  const localities = Array.from(new Set(providers.map((provider) => displayKannurLocality(provider.locality))));
  const searchTitle = service.kannurSearchTitle ?? `${service.name} in Kannur`;
  const hasIrittyProvider = providers.some((provider) => /iritty/i.test(provider.locality));
  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "Service",
      "@id": `${pageUrl}/#service`,
      name: searchTitle,
      description: service.summary,
      areaServed: { "@type": "AdministrativeArea", name: "Kannur, Kerala" },
      provider: { "@id": `${SITE_URL}/#organization` },
      url: pageUrl,
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Kannur", item: `${SITE_URL}/kannur` },
        { "@type": "ListItem", position: 3, name: service.name, item: pageUrl },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: `${service.name} profiles in Kannur`,
      numberOfItems: providers.length,
      itemListElement: providers.map((provider, index) => ({ "@type": "ListItem", position: index + 1, name: provider.business, url: `${SITE_URL}/professionals/${provider.id}` })),
    },
  ];

  return (
    <main className="seo-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }} />
      <header className="seo-header"><Link className="seo-brand" href="/" aria-label="Nearleo home"><span>N</span><strong>Nearleo<small>by Lumier</small></strong></Link><Link className="seo-home-link" href="/kannur">Kannur directory</Link></header>
      <nav className="seo-breadcrumb" aria-label="Breadcrumb"><Link href="/">Home</Link><span>/</span><Link href="/kannur">Kannur</Link><span>/</span><b>{service.name}</b></nav>

      <section className="seo-hero seo-location-hero">
        <div>
          <span className="seo-kicker">Local service in Kannur</span>
          <h1>Find {searchTitle.toLowerCase()}</h1>
          <p>{service.summary} The profiles below are currently published on Nearleo and list a service area within Kannur district.</p>
          <div className="seo-hero-actions"><Link className="seo-primary-link" href={`/?service=${encodeURIComponent(service.name)}`}>Search {service.name.toLowerCase()} profiles</Link><Link className="seo-secondary-link" href={`/services/${service.slug}`}>Read service guide</Link>{service.slug === "interlock-paving" && hasIrittyProvider && <Link className="seo-secondary-link" href="/services/interlock-paving/iritty">Interlock workers in Iritty</Link>}</div>
        </div>
        <aside className="seo-location-summary"><span>Currently published</span><strong>{providers.length}</strong><p>{service.name.toLowerCase()} {providers.length === 1 ? "profile" : "profiles"}</p><small>{localities.length ? localities.join(" · ") : "Kannur district"}</small></aside>
      </section>

      <section className="seo-provider-directory" aria-labelledby="local-service-provider-title">
        <div className="seo-section-heading"><span>Compare public details</span><h2 id="local-service-provider-title">{service.name} profiles serving Kannur</h2></div>
        {providers.length > 0 ? <div className="seo-provider-list">{providers.map((provider) => <SeoProviderCard provider={provider} key={provider.id} />)}</div> : <div className="seo-empty-directory"><h3>No published profiles yet</h3><p>Search Nearleo or return later as new Kannur professionals publish their profiles.</p></div>}
      </section>

      <section className="seo-content-grid seo-local-content">
        <article><span className="seo-kicker">Common requirements</span><h2>Work people commonly request</h2><ul>{service.commonNeeds.map((need) => <li key={need}>{need}</li>)}</ul></article>
        <article><span className="seo-kicker">Before hiring</span><h2>Confirm the work details</h2><p>Discuss the exact scope, materials, expected finish, timing and final price with the professional before work begins.</p></article>
        <article><span className="seo-kicker">Verification clarity</span><h2>Check the status badge</h2><p>A green verified badge means Nearleo administration approved the submitted verification details. Profiles without it remain clearly marked unverified.</p></article>
      </section>

      <section className="seo-cta"><div><span>Serving Kannur</span><h2>Find the right {service.name.toLowerCase()} for your requirement</h2></div><Link href={`/?service=${encodeURIComponent(service.name)}`}>Search now</Link></section>
      <footer className="seo-footer">© 2026 Nearleo · Powered by Lumier Technologies</footer>
    </main>
  );
}
