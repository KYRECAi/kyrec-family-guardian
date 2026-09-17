# Supplied source inventory — 2026-09-16

## Scope and evidence

This inventory describes the extracted Capacitor source currently checked in from the historical `nova-family-guardian.zip`. It separates code that is present from behavior that has actually been verified. The original ZIP binary is not available in this checkout. Its recorded size, SHA-256, integrity result, and per-file hashes remain in `docs/evidence/source-import-manifest-2026-09-08.md`; no substitute archive has been manufactured.

Current product name: **KYREC Family Guardian**. Historical source labels such as `NOVA`, `NOVA · STAN AI`, and `nova-family-guardian` are evidence from the supplied prototype, not current naming authority.

## Source file inventory

### `package.json`

- Historical package identity: `nova-family-guardian`, version `1.0.0`, private.
- Runtime dependencies: `@capacitor/core` and `@capacitor/android`, both with the supplied `^6.1.2` range.
- Development dependency: `@capacitor/cli` with the supplied `^6.1.2` range.
- Scripts: `add:android`, `sync`, `open:android`, and `build:apk`.
- No `test`, `lint`, web build, formatting, or type-check script is present.
- No application backend or SDK for authentication, storage, maps, notifications, analytics, or KYREC Core is declared.

### `capacitor.config.json`

- `appId`: `au.kyrec.familyguardian` — preserved and unchanged.
- `appName`: `NOVA` — retained historical source naming.
- `webDir`: `www`.
- Android WebView scheme: HTTPS.
- No plugin, signing, server URL, store, or environment configuration is present.

### `www/index.html`

- One 500-line, self-contained HTML document holds the markup shell, CSS, demonstration data, page renderer, state, and event handlers.
- External resource: a Google Fonts CSS import for Poppins. A local/system sans-serif fallback is declared.
- In-memory state: active tab, game score, combo count, selected mood, and four toggle values.
- Rendering uses string templates assigned through `innerHTML`; there is no UI framework, router, module system, or compilation step.
- Events use document-level click delegation, plus keyboard handling for the custom switches.
- No fetch/XHR/WebSocket call, Capacitor plugin invocation, durable browser storage, native bridge logic, or server integration is present.

### Historical README and repository documentation

- `docs/evidence/original-source-README.md` preserves the README delivered with the archive rather than silently replacing it.
- `docs/evidence/source-import-manifest-2026-09-08.md` records archive/file hashes and source-to-repository paths.
- `docs/audits/current-source-audit-2026-09-08.md` records the original import checks and release gate.
- Root `README.md` is repository guidance derived from, but clearly separate from, the historical README.

## Android project files

No `android/` directory was included among the five archived source files recorded by the import manifest, and no Android project is tracked now. `.gitignore` excludes `android/` as generated output. Consequently, the repository currently contains:

- the Capacitor Android dependency;
- scripts to generate, sync, open, and build an Android wrapper; and
- the fixed Capacitor app ID used when that wrapper is generated.

It does **not** currently contain or prove:

- an Android manifest or Gradle project;
- Java/Kotlin native source;
- native icons or splash assets;
- release build types or signing configuration;
- a keystore, certificate fingerprint, application signing proof, AAB/APK, Play listing, package ownership, or store credentials.

Capacitor can generate standard Android files locally with `npm run add:android`, after which `npm run sync` copies `www/`. Generated files are not historical source and must be reviewed separately before any decision to track them. Generating a debug wrapper does not change or prove an established release signing/store identity.

## Screens and displayed content

| Tab / screen | Present content | Data status |
|---|---|---|
| Home | Greeting, “everyone is safe” status, space-port hub, four orbit shortcuts, eight app shortcuts | All text/status is static demonstration content |
| Map (“Our Family”) | Arrival/departure cards, stylized CSS map, four family pins, safe-zone labels, member strip, points | Not a geographic map; family/location/safety values are hard-coded |
| Stats | Family score, activity tiles, weekly chart, driving donut, family comparison | Hard-coded metrics and claims; no collection or calculation pipeline |
| Chars | Stan hero, Nova and Moneybags cards, locked Scout and Pulse cards, levels/XP, notices | Visual concepts only; emoji/gradient placeholders, no companion service |
| Games | Tap-to-catch panel and four seasonal/weekly cards | Only the catch score/combo changes locally; all other scores/details are static |
| More | Mood choices, four privacy-style switches, privacy text, save button | Mood/switches change memory only; save button has no handler |

## Navigation paths

There is no URL router, history state, deep link, back-stack, or distinct route. Every path below sets a numeric tab in memory and re-renders the single document.

| Origin | Control | Destination |
|---|---|---|
| Bottom navigation (all screens) | Home / Map / Stats / Chars / Games / More | Corresponding tab 0–5 |
| Home orbit | Stan Chat | Chars |
| Home orbit | Check-in | Map |
| Home orbit | Alerts | Map |
| Home orbit | Safe Zones | Map |
| Home hub | Live Map | Map |
| Home grid | Map / Zones | Map |
| Home grid | Stan / Nova | Chars |
| Home grid | Family / Drive | Stats |
| Home grid | Calendar / More | More |

The shortcut labels do not open dedicated Stan chat, Nova, family, drive, calendar, alert, check-in, or safe-zone experiences; they redirect to the broader tab listed above.

## Functional controls verified from implementation

| Control | Implemented behavior | Persistence / external effect |
|---|---|---|
| Bottom tabs and Home shortcuts | Update `state.tab`, render selected page, reset body scroll | Memory only; no route or external effect |
| Catch candy button | Adds `50 * (floor(combo / 3) + 1)` to the score, increments combo, updates text, animates gain | Memory only; reset by page reload |
| Mood buttons | Set one mood and render an acknowledgement | Memory only; no storage or companion communication |
| Four switches | Toggle local boolean and re-render; Enter/Space supported while focused | Memory only; no permission or device setting changes |

## Controls that are visual or non-functional

- Header/menu, shield and notification icon containers are not buttons and have no handler.
- Map activity cards, pins, member cards, safe zones, and scores have no interaction.
- Stats cards and comparisons have no interaction or live data.
- Stan “Talk”, “Voice”, “Family Advice”, and “Safety” tiles have no handler.
- Stan/Nova/Moneybags notices and companion cards have no handler.
- Locked Scout/Pulse cards are display-only; no entitlement system exists.
- Seasonal game cards and their “Play” labels are non-interactive containers.
- **Save my family's choices** is a button with no handler; preferences are not saved.
- No sign-in, account creation, consent flow, family invitation, logout, deletion, export, emergency action, or support path exists.

## Mocked behavior and data

- Family members Annie, Michael, Grandma, and Kelly and their statuses are JavaScript constants.
- Locations, arrival/departure times, speed, safe zones, and the statement that everyone is safe are fictional/static presentation data.
- Points, rankings, levels, XP, trends, driving metrics, check-ins, phone touches, comparisons, and game results are static except for the local catch counter.
- Privacy copy such as “only you can see this,” “Shared by choice,” and toggle labels is not backed by authentication, authorization, consent records, encryption logic, persistence, or server enforcement in this source.
- Companion suggestions/notices are fixed strings; there is no model or API invocation.

## Companion assets and representation

- No raster, vector, audio, animation, font, or approved character asset file is included under `www/`.
- Stan, Nova, Moneybags, Scout, and Pulse are represented using emoji, text, initials, CSS gradients, and medallions.
- These are implementation placeholders, not proof of approved companion artwork.
- The source describes companion concepts but implements no companion intelligence.
- Historical screen copy for Pulse describes “Emotional wellness, mindfulness and family balance.” That text is inventoried as supplied; it must not be treated as authority to redefine Pulse's approved Family Flow direction.
- Historical screen copy for Moneybags is likewise preserved as supplied and does not replace the approved Family Money / Family Points / Bonus boundaries or adult-approval controls.

## Known defects, gaps, and risks

1. Safety, location, driving, family, privacy, and score claims look live although their values are mocked.
2. Preference switches resemble real controls but alter no permission, consent record, or service behavior.
3. The save button does nothing and provides no status or error feedback.
4. Multiple shortcuts over-promise dedicated features by landing on generic tabs.
5. Most action-looking cards/icons have no keyboard semantics or click behavior; custom orbit/app cells are non-semantic `div` elements.
6. Custom switches are keyboard-operable, but re-rendering after a key press discards focus. Mood selection state is visual and is not exposed with radio/pressed semantics.
7. No backend, authentication, authorization, role boundary, least-privilege companion context, consent audit trail, retention/deletion, revocation, or human-approval enforcement exists.
8. No real location, safe-zone, driving, alert, calendar, notification, voice, chat, advice, points, reward, unlock, or game service exists.
9. No automated tests, linting, type checks, dependency lockfile in source control, continuous integration, or reproducible build proof is supplied.
10. Android generation was previously demonstrated, but a complete Gradle APK build, device installation, offline device behavior, release signing, and store continuity are not proven.
11. The external Google Fonts request discloses a network request when reachable and means typography differs offline.
12. The dependency audit recorded high and critical findings in the original audit environment; a suggested CLI upgrade crossed a major Capacitor version and was not applied without compatibility work.
13. The static 9:41/5G status treatment and fixed-width phone presentation are mockup conventions, not native device status integration.
14. There is no error, loading, empty, offline, recovery, or session-expiry state.

## Verification performed for this inventory

- Confirmed repository file list and absence of tracked Android files with `git ls-files`.
- Confirmed source/archive records against the existing import manifest.
- Parsed `package.json` and `capacitor.config.json` as JSON.
- Checked the extracted inline JavaScript with Node's syntax checker.
- Searched source for network/API/native storage calls and inventoried event handlers and navigation targets.

These checks establish source presence and syntax only. They do not establish production functionality, privacy claims, safety outcomes, Android build success, signing continuity, store ownership, or release readiness.

## Release position

**HOLD.** The prototype remains suitable for controlled design/implementation work only. Before release it needs approved product scope, explicit mock/live presentation, identity and permission flows, privacy controls, server/Core boundaries, implemented services, automated regression coverage, dependency remediation, native build and device evidence, and verified signing/store continuity under human authority.
