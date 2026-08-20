import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SITE_URL, findSeoService, seoServices } from "../../../lib/seo-services";

type ServicePageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return seoServices.map((service) => ({ slug: service.slug }));
}

export async function generateMetadata({ params }: ServicePageProps): Promise<Metadata> {
  const { slug } = await params;
  const service = findSeoService(slug);
  if (!service) return {};

  const title = `${service.name} Near You`;
  return {
    title,
    description: `${service.summary} Browse profiles and send a service request on Nearleo.`,
    alternates: { canonical: `/services/${service.slug}` },
    openGraph: {
      title: `${title} | Nearleo`,
      description: service.summary,
      url: `${SITE_URL}/services/${service.slug}`,
      type: "website",
    },
  };
}

export default async function ServicePage({ params }: ServicePageProps) {
  const { slug } = await params;
  const service = findSeoService(slug);
  if (!service) notFound();

  const pageUrl = `${SITE_URL}/services/${service.slug}`;
  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "Service",
      "@id": `${pageUrl}/#service`,
      name: service.name,
      description: service.summary,
      areaServed: { "@type": "Country", name: "India" },
      provider: { "@id": `${SITE_URL}/#organization` },
      url: pageUrl,
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Services", item: `${SITE_URL}/services` },
        { "@type": "ListItem", position: 3, name: service.name, item: pageUrl },
      ],
    },
  ];

  const searchUrl = `/?service=${encodeURIComponent(service.name)}`;
  const related = seoServices.filter((item) => item.slug !== service.slug).slice(0, 6);

  return (
    <main className="seo-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }}
      />
      <header className="seo-header">
        <Link className="seo-brand" href="/" aria-label="Nearleo home">
          <span>N</span>
          <strong>Nearleo</strong>
        </Link>
        <Link className="seo-home-link" href="/services">All services</Link>
      </header>

      <nav className="seo-breadcrumb" aria-label="Breadcrumb">
        <Link href="/">Home</Link><span>/</span><Link href="/services">Services</Link><span>/</span><b>{service.name}</b>
      </nav>

      <section className="seo-hero">
        <div>
          <span className="seo-kicker">Local help through Nearleo</span>
          <h1>Find a {service.name.toLowerCase()} near you</h1>
          <p>{service.summary}</p>
          <div className="seo-hero-actions">
            <Link className="seo-primary-link" href={searchUrl}>View {service.name.toLowerCase()} profiles</Link>
            <Link className="seo-secondary-link" href="/">Open Nearleo</Link>
          </div>
        </div>
        <aside>
          <span>Nearleo helps you</span>
          <ul>
            <li>Browse published professional profiles</li>
            <li>See verification status clearly</li>
            <li>Set your location and search radius</li>
            <li>Request contact without exposing WhatsApp details automatically</li>
          </ul>
        </aside>
      </section>

      <section className="seo-content-grid">
        <article>
          <span className="seo-kicker">Common requirements</span>
          <h2>What can a {service.name.toLowerCase()} help with?</h2>
          <ul>{service.commonNeeds.map((need) => <li key={need}>{need}</li>)}</ul>
        </article>
        <article>
          <span className="seo-kicker">Choose confidently</span>
          <h2>Check the profile before contacting</h2>
          <p>Review the professional&apos;s service, location, experience, description, recent work and verification status when available. Discuss scope, price, timing and materials directly before work begins.</p>
        </article>
        <article>
          <span className="seo-kicker">Privacy-aware contact</span>
          <h2>Contact professionals directly</h2>
          <p>Open a Nearleo provider profile to call, start a WhatsApp chat or send an email directly. Use contact details only for genuine service enquiries.</p>
        </article>
      </section>

      <section className="seo-how">
        <div className="seo-section-heading"><span>Simple process</span><h2>How to find the right local professional</h2></div>
        <ol>
          <li><b>01</b><div><h3>Set your location</h3><p>Use your device location or search for an area, then choose a suitable radius.</p></div></li>
          <li><b>02</b><div><h3>Compare profiles</h3><p>Review published details and look for the green verified badge when identity has been approved.</p></div></li>
          <li><b>03</b><div><h3>Send a clear request</h3><p>Describe the work, preferred date and urgency so professionals can respond accurately.</p></div></li>
        </ol>
      </section>

      <section className="seo-related">
        <div className="seo-section-heading"><span>More categories</span><h2>Explore other local services</h2></div>
        <div>{related.map((item) => <Link href={`/services/${item.slug}`} key={item.slug}>{item.name}<span>→</span></Link>)}</div>
      </section>

      <section className="seo-cta">
        <div><span>Ready to search?</span><h2>Find {service.name.toLowerCase()} profiles on Nearleo</h2></div>
        <Link href={searchUrl}>Search now</Link>
      </section>
      <footer className="seo-footer">© 2026 Nearleo · Powered by Lumier Technologies</footer>
    </main>
  );
}
