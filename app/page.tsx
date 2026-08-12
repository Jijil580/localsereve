import NearleoApp from "./localserve-app";
import { SITE_URL } from "../lib/seo-services";

const structuredData = [
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`,
    name: "Nearleo",
    alternateName: "Nearleo by Lumier",
    url: SITE_URL,
    logo: {
      "@type": "ImageObject",
      url: `${SITE_URL}/nearleo-logo.svg`,
      width: 512,
      height: 512,
    },
    email: "demo@lumiertechnologies.com",
    description: "A marketplace that helps local customers discover and contact local service professionals.",
  },
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    name: "Nearleo",
    url: SITE_URL,
    inLanguage: ["en-IN", "ml-IN"],
    publisher: { "@id": `${SITE_URL}/#organization` },
  },
];

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }}
      />
      <NearleoApp />
    </>
  );
}
