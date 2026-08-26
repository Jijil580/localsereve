# Nearleo

**Where Local Experts Meet Local Customers**

Nearleo is a responsive marketplace by Lumier for discovering, comparing and booking nearby service professionals. This production-ready release includes customer discovery, provider profiles, filters, saved providers, service requests, quotations, booking status, messaging, multilingual UI and customer/provider/admin dashboards.

## Local development

Requirements: Node.js 22.13 or later.

```bash
npm install
npm run db:generate
npm run dev
```

Open the local URL printed by the development server. The demo content is intentionally realistic and safe to replace with database records.

## Architecture

- Next.js, React, TypeScript and Tailwind CSS
- MongoDB Atlas for persistent marketplace data
- Cloud object storage for portfolio media and verification documents
- Server-side identity checks for protected write APIs
- Responsive single-product interface with accessible forms and keyboard focus states
- English, Hindi and Malayalam translation module

The relational schema covers users, addresses, provider profiles, categories, services, portfolios and media, requests, quotations, bookings and status history, conversations, messages, reviews, payments, subscriptions, notifications, verification documents and audit logs.

## Production integrations

Configure maps/geocoding, SMS/OTP, email, WhatsApp and a PCI-compliant payment gateway through hosted environment variables. Never store card numbers or identity documents in the database; store private files in protected object storage and retain only access-controlled metadata.

## Vercel deployment

Import the GitHub repository in Vercel or run `vercel --prod`. Configure `MONGODB_URI`, `MONGODB_DB` and `AUTH_SECRET` in Vercel before enabling live write operations. Run `npm run build` before deployment.

## Android and iPhone apps

Nearleo includes Capacitor projects for Android and iOS under `android/` and `ios/`. Both apps securely load the production marketplace at `https://nearleo.com`, so authentication, requests, messages, maps and live tracking use the same backend as the website.

```bash
npm install
npm run mobile:sync
npm run mobile:android
```

The Android project requires Android Studio with Java 21 and Android SDK 36. Every mobile-source push also creates a downloadable test APK in the GitHub Actions workflow named **Build Nearleo Android APK**.

For iPhone, run `npm run mobile:ios` on macOS and complete signing in Xcode with an Apple Developer account. Apple devices use an IPA/App Store build rather than an APK.
