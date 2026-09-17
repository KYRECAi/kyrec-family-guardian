# KYREC Family Guardian

This private repository contains the supplied Family Guardian Capacitor prototype. **KYREC Family Guardian** is the current product name. `NOVA`, `NOVA · STAN AI`, and the npm package name `nova-family-guardian` are historical names retained from the supplied source; they are not a product rename or a statement that Nova is the whole product.

## Current status

The checked-in app is a visual, local prototype. It provides six rendered areas and a few in-memory interactions, but it is not connected to a backend, KYREC Core, authentication, device location, notifications, durable storage, or production permission controls. Text and controls that imply safety, privacy, maps, points, companion intelligence, or saved family preferences are demonstration UI unless the [source inventory](docs/audits/source-inventory-2026-09-16.md) explicitly records verified behavior.

**Release status: HOLD.** Do not represent this prototype as an operational family-safety product.

## Preserved source and identity

The extracted files from the supplied `nova-family-guardian.zip` are preserved in the repository. The import manifest records the original archive hash and byte-for-byte hashes of the five supplied files. The source README is retained separately so this project README can describe the repository without rewriting historical evidence:

- [Original-source README](docs/evidence/original-source-README.md)
- [Source import manifest](docs/evidence/source-import-manifest-2026-09-08.md)
- [Current source inventory](docs/audits/source-inventory-2026-09-16.md)
- [Initial source audit](docs/audits/current-source-audit-2026-09-08.md)

The original ZIP binary is not present in this checkout, so it has not been recreated or falsely labelled as the original archive. The manifest preserves its recorded SHA-256 (`a68abb9f…d736d74f`) and provenance. If the original binary becomes available, preserve it unchanged under `docs/evidence/` and verify that full hash before committing it.

The following identities come from the supplied source and must not be changed without explicit approval:

| Identity | Preserved value |
|---|---|
| Capacitor app ID / Android application ID | `au.kyrec.familyguardian` |
| Historical configured app name | `NOVA` |
| Historical npm package name | `nova-family-guardian` |
| Web output directory | `www` |

No signing keystore, signing configuration, store listing identifier, or store credential was supplied. This repository therefore preserves identity by making no signing or store changes; it does **not** establish that a release is signed or store-ready.

## Architecture

```text
package.json                         Capacitor 6 dependencies and lifecycle scripts
capacitor.config.json                Stable app ID, historical app name, webDir
www/index.html                       Entire prototype: HTML + CSS + JavaScript + mock data
        |
        +-- browser (direct local preview)
        |
        +-- npx cap add/sync android  Generates ignored android/ wrapper locally
```

The UI is a single-page app without a framework or build/transpile step. `www/index.html` owns state, rendering, navigation, styling, demonstration data, and event delegation. State lasts only for the current page session. Capacitor copies `www/` into a generated native project. The `android/` directory is intentionally ignored because it was not one of the five supplied source files; generate it locally rather than treating it as preserved source.

There is currently no API layer. Any future KYREC Core connection must follow this boundary and must not embed privileged credentials in this client:

```text
Family Guardian client -> approved Family Guardian server/API route -> KYREC Core
```

## Prerequisites

- Node.js LTS and npm
- JDK 17 or newer for Android builds
- Android Studio with an Android SDK and build tools (for Android work)

## Setup and local preview

Install the pinned-compatible dependency ranges declared by the supplied source:

```bash
npm install
```

There is no web build command. To inspect the prototype in a browser, serve the repository root and open `/www/` (serving avoids browser-specific restrictions associated with `file://`):

```bash
npx --yes serve .
```

The page requests the Poppins font from Google Fonts. With no network it falls back to a system sans-serif font; the app data itself remains local demonstration data.

## Android development

Generate and synchronize the local Android wrapper:

```bash
npm run add:android
npm run sync
```

Then either open it in Android Studio:

```bash
npm run open:android
```

or attempt a debug APK build:

```bash
npm run build:apk
```

The expected debug output is `android/app/build/outputs/apk/debug/app-debug.apk`. That path is generated and ignored. These commands create a debug development project; they do not provide or alter a release signing identity or store identity. A successful APK build and device install have not been established by this documentation update.

After changing web source, run `npm run sync` before rebuilding Android. Do not run `add:android` over an existing native project unless its state and any native changes have first been reviewed.

## Verified prototype surface

The implementation contains Home, Map, Stats, Chars, Games, and More tabs. Verified source-level interactions are tab/shortcut navigation, a local game score/combo button, local mood selection, and local privacy-style toggles. None persists after reload. Several visible buttons and cards have no action, including notification/header icons, companion actions, game cards, and **Save my family's choices**.

For the complete path/control matrix, mock-data notes, companion asset status, Android file status, and known defects, see the [source inventory](docs/audits/source-inventory-2026-09-16.md).

## Available checks

No automated test or lint suite is supplied. A syntax-only check can be run by extracting the inline script to a temporary file and invoking `node --check`; the audit inventory records the exact command used. Capacitor configuration can be inspected with:

```bash
npx cap doctor
```

Passing a syntax or configuration check does not verify product behavior, permissions, privacy controls, Android packaging, signing, or release readiness.
