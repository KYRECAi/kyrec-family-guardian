# KYREC Family Guardian

Private product repository for the KYREC Family Guardian mobile concept.

## Current prototype

The app is a self-contained Capacitor web experience with Home, Map, Stats,
Companions, Games and privacy-choice screens. All family, location, safety and
score content is sample data: there is no authentication, live monitoring,
backend or KYREC Core connection yet.

Privacy choices are saved only in local storage on the current device. Mood
check-ins intentionally remain in memory and disappear when the app closes.

## Run locally

```bash
npm install
npm test
npm run sync
```

Serve `www/` with any static web server to preview the concept in a browser.
The Capacitor app ID remains `au.kyrec.familyguardian`.

## Release status

**HOLD.** This is an interactive concept, not a safety, emergency, medical or
law-enforcement service. Authentication, household permissions, an approved
Family Guardian server boundary, Core integration and device-level release QA
are still required before production use.
