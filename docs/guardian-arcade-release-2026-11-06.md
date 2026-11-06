# Guardian arcade integration — 6 November 2026

Owner: Eli Mercer, Head of Game & App Development. Michael Willard requested that Moneybags Bonus and Valentine Crush be prepared for Guardian, then explicitly requested both games live.

## Scope and behavior

The existing Moneybags Bonus and Valentine Crush games are retained. Guardian's Moneybags catch-game placeholder and external Valentine iframe are replaced by a shared arcade player pointing at the production game releases:

- Moneybags Bonus: `https://kyrecai.github.io/`
- Valentine Crush: `https://kyrecai.github.io/valentine/`

The player offers back, pause, loading, timeout/offline recovery, personal best and round results. The account/household boundary creates a fresh random embedded session. The games receive no account ID, family information, credentials, budget data or chat context. Origin, frame source, game, protocol version and session must all match before accepting a message. Results contain a local run identifier, score, coin count, level and completion state only.

Arcade results update `arcadeBest` in the existing account-isolated local store. They never call `addGameScore`, add Family Points, manufacture savings, grant a budget bonus or invoke Core. Earned Moneybags rewards remain dependent on verified budget eligibility, approved Family Points and adult/Core authority; this change does not implement or bypass that gate.

## Validation and limits

- Game-engine checks exercise collection, pause/resume, successful/failed rounds, replay, saved progress, corrupt storage and unavailable audio.
- Transport checks reject other frames, origins, sessions, games and malformed result values; unexpected authority fields are discarded.
- Guardian's existing test suite, the new arcade tests, type checking and production build pass.
- An isolated harness renders the actual `ArcadePlayer` with synthetic callbacks, without bypassing production account or household gates. Its review controls and files are excluded from the production app and game publishing.
- Real iPhone/iPad hardware and store-signed app builds are not available in this environment. Browser viewport checks are not native-device acceptance.
- The hosted games need a connection. Offline play and a native WKWebView transport are not implemented here. Opaque/file/custom-protocol parent origins fail closed.
- Guardian's wider hosted account/Core readiness remains governed by the existing release HOLD. Publishing the standalone game assets does not release family accounts, Core, AWS or the mobile app stores.

## Release and recovery

Publish game assets to the existing `KYRECAi/KYRECAi.github.io` hosting repository. Keep the old hashed bundles, artwork and historical records. Store the previous Pages commit and the release commit in the release receipt. Revert the release commit (or restore its parent tree in a new commit) if game startup, assets or controls regress. No new paid service, DNS, database or production secret is required.

The source game repositories retain their normal app-builder entry points; `build:guardian` is an additional static export of the existing gameplay. The original approved art is copied without redesign. Each static release includes an asset digest manifest and source reference.

## Resolved findings

- Guardian originally routed Moneybags to a generic catch game.
- Valentine originally opened a separate Grok host without a result/pause bridge.
- Both games used the same local save namespace; isolated game and embedded-session keys replace it.
- Game scores and example Family Points were conflated in the old integration example; this release uses game points only.
- Missing AudioContext could interrupt start; audio now degrades safely.
- An initial shared test had an incorrect TypeScript narrowing; it was corrected and both game type checks pass.
- The static HTML export initially retained `game.html`; the export now also writes `index.html` and is checked through the built output.

Status: game release candidate; app integration source prepared. The final live URLs and commit receipt must be verified after publication.
