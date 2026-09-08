# Current Family Guardian source audit — 2026-09-08

## Evidence and scope

Audited archive: `nova-family-guardian.zip`  
Archive SHA-256: `a68abb9fb25da906ae534f9a3c5d8076cdd884e2d074512ff4cb8d87d736d74f`

The original archive was not modified. Only the five original project files are imported. Generated `node_modules`, Android output and audit-install artifacts are excluded.

## Verified source position

- Package: `nova-family-guardian` version `1.0.0`, private.
- Capacitor app ID: `au.kyrec.familyguardian` (unchanged).
- Historical configured app name: `NOVA`.
- Web directory: `www`.
- Main implementation: one self-contained `www/index.html`.
- Screen areas present: Home, Map, Stats, Chars, Games and More.
- Demonstrated interactions: tab navigation, in-memory controls/mood selection and a simple tap-score game.
- Demonstration family, location and score values are hard-coded/in-memory.
- No app backend, authentication, durable storage, device location, notifications or KYREC Core call exists.
- No automated test suite or lint script exists.
- The only detected network reference in the supplied implementation is a Google Fonts stylesheet import.
- No client API key or Core credential was detected.

## Checks performed

| Check | Result |
|---|---|
| ZIP integrity | PASS |
| Original file checksums captured | PASS |
| JavaScript syntax extraction + `node --check` | PASS |
| `npm install --ignore-scripts` in disposable audit copy | PASS |
| Capacitor Android project generation | PASS |
| Capacitor Android sync | PASS |
| Automated app tests | NOT AVAILABLE |
| Full Android/Gradle APK build | NOT PROVEN |

The APK build could not be established in the audit environment: the Gradle 8.2.1 distribution download was blocked by network reachability, and an Android SDK was not configured.

## Dependency finding

The disposable install reported 99 packages and two audit findings:

- High: direct `@capacitor/cli` line.
- Critical: transitive `tar` line.

The automated recommendation moves to Capacitor CLI 8.5.1, a major-version change. Do not apply it without a controlled compatibility upgrade and rebuild.

## Product and privacy position

This is a useful visual/interaction prototype, not a connected Family Guardian release. Features implying maps, safety, family controls, money or companion intelligence are currently visual or local demonstrations. They must not be represented as operational.

## Release gate

**HOLD**

Release remains blocked until a controlled dependency plan, real product authentication/permissions, the Family Guardian server boundary, Core integration, automated regression coverage, a successful Android build and device verification exist.
