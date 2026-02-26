# estrapatch

A privacy-first, client-side estradiol patch tracker and pharmacokinetic (PK) simulator. Track your patch applications, visualize estimated serum E2 levels, and plan your schedule — all without any data leaving your device.

**Live app:** [estrapatch.vercel.app](https://estrapatch.vercel.app)

## Features

- **Patch tracking** — Log when you apply and remove patches, with body placement mapping
- **E2 level estimation** — Real-time pharmacokinetic simulation based on FDA clinical study data, using superposition of individual patch contributions over a rolling 28-day window
- **Multi-dose support** — Choose from 5 FDA-approved dose levels (0.025 - 0.1 mg/day) with dose-proportional scaling
- **What-If simulator** — Experiment with different patch schedules and doses to see projected E2 levels, with optional "Show Patches" bar chart visualization
- **Smart recommendations** — Get context-aware suggestions on when to apply or remove patches, accounting for E2 ramp-up after application
- **Removal reminders** — Browser notifications when a patch is due for removal
- **Data export/import** — Back up and restore your data as JSON
- **Installable PWA** — Add to your home screen for an app-like experience
- **100% client-side** — All data stored in IndexedDB via Dexie. Nothing is sent to any server.

## Tech Stack

- [Next.js](https://nextjs.org) 16 (App Router, static export)
- [React](https://react.dev) 19
- [TypeScript](https://www.typescriptlang.org)
- [Tailwind CSS](https://tailwindcss.com) 4
- [Dexie](https://dexie.org) (IndexedDB wrapper)
- [Recharts](https://recharts.org) (charting)
- Deployed on [Vercel](https://vercel.com)

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Disclaimer

estrapatch is **not a medical device**. E2 level estimates are based on published pharmacokinetic models from FDA clinical studies and are provided for informational and educational purposes only. Actual serum levels vary significantly based on individual physiology. Always consult a qualified healthcare provider for medical decisions regarding hormone therapy.

## Feature Requests and Bug Reports

Have an idea for a new feature or found a bug? Please [open an issue](https://github.com/scott-yj-yang/estrapatch/issues) on GitHub! Community feedback helps make estrapatch better for everyone.

## Acknowledgements

The pharmacokinetic simulator in estrapatch was inspired by and builds upon the work of [hypothete/e2-patch-simulator](https://github.com/hypothete/e2-patch-simulator) by [@hypothete](https://github.com/hypothete). Their open-source E2 patch simulator provided the foundational algorithm for the rolling-schedule superposition model used here. Thank you for making this work available to the community.

## Terms of Use

See [TERMS_OF_USE.md](TERMS_OF_USE.md) for the full terms. In short: estrapatch is not a medical device, comes with no warranty, and you use it at your own risk.

## License

This project is licensed under the [Apache License 2.0](LICENSE).
