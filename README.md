# LocalServe

LocalServe is a responsive marketplace for discovering, comparing and booking nearby service professionals. This first production-shaped release includes customer discovery, provider profiles, filters, saved providers, service requests, quotations, booking status, messaging, multilingual UI foundations and customer/provider/admin dashboards.

## Local development

Requirements: Node.js 22.13 or later.

```bash
npm install
npm run db:generate
npm run dev
```

Open the local URL printed by the development server. The demo content is intentionally realistic and safe to replace with database records.

## Architecture

- Vinext/Next.js, React, TypeScript and Tailwind CSS
- Cloudflare D1 through Drizzle ORM for relational application data
- R2 binding for portfolio media and verification documents
- Server-side identity checks for protected write APIs
- Responsive single-product interface with accessible forms and keyboard focus states
- English, Hindi and Malayalam translation module

The relational schema covers users, addresses, provider profiles, categories, services, portfolios and media, requests, quotations, bookings and status history, conversations, messages, reviews, payments, subscriptions, notifications, verification documents and audit logs.

## Production integrations

Configure maps/geocoding, SMS/OTP, email, WhatsApp and a PCI-compliant payment gateway through hosted environment variables. Never store card numbers or identity documents in the database; store private files in protected object storage and retain only access-controlled metadata.

## Deployment

Run `npm run build`. The included hosting manifest declares the `DB` database and `MEDIA` object-storage bindings. Deploy through OpenAI Sites so migrations and runtime bindings are applied consistently.
