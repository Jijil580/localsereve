import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL, seoServices } from "../../lib/seo-services";

export const metadata: Metadata = {
  title: "Local Services Near You",
  description:
    "Browse local service professionals on Nearleo, including plumbers, electricians, carpenters, cleaners, technicians and more.",
  alternates: { canonical: "/services" },
  openGraph: {
    title: "Browse Local Services Near You | Nearleo",
    description: "Explore local service categories and find professionals near your location on Nearleo.",
    url: `${SITE_URL}/services`,
  },
};

export default function ServicesPage() {
  return (
    <main className="seo-page">
      <header className="seo-header">
        <Link className="seo-brand" href="/" aria-label="Nearleo home">
          <span>N</span>
          <strong>Nearleo</strong>
        </Link>
        <Link className="seo-home-link" href="/">Find professionals</Link>
      </header>

      <section className="seo-hero seo-directory-hero">
        <span className="seo-kicker">Nearleo service directory</span>
        <h1>Local services for everyday needs</h1>
        <p>Explore popular categories, compare available profiles and choose the right professional for your requirement and location.</p>
      </section>

      <section className="seo-directory" aria-labelledby="service-directory-title">
        <div className="seo-section-heading">
          <span>Browse by category</span>
          <h2 id="service-directory-title">Find a service professional near you</h2>
        </div>
        <div className="seo-directory-grid">
          {seoServices.map((service, index) => (
            <Link href={`/services/${service.slug}`} key={service.slug}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <div><h3>{service.name}</h3><p>{service.summary}</p></div>
              <b aria-hidden="true">→</b>
            </Link>
          ))}
        </div>
      </section>

      <section className="seo-cta">
        <div><span>Need help now?</span><h2>Search all published Nearleo profiles</h2></div>
        <Link href="/?service=All%20services">Explore professionals</Link>
      </section>
      <footer className="seo-footer">© 2026 Nearleo · Powered by Lumier Technologies</footer>
    </main>
  );
}
