# Valentine Crush first-trial disposition

Disposition: exclude embedded Valentine Crush and seasonal-game reward acceptance from the first native/FIFO trial. Do not restore automatic local points or trust arbitrary iframe claims. A production scoring integration needs separately approved scope; no game implementation or points behavior changed in this assessment.

## Source evidence

PR23 review: https://github.com/KYRECAi/kyrec-family-guardian/pull/23#discussion_r4379153687.

Merged `2071dbc7e685cc522051fd04940a4297255ea24d` and candidate `b7bd59e9fa5dd46d2152e773b51265fd1a53b1ae` have identical `ValentineCrush` components: only a back link and a cross-origin iframe to `https://sky-green-terra-kite.grok.me/`, with autoplay permission. The prior component called `addGameScore("valentine", total)` at round completion; that call was removed. There is no completion-message listener or alternative result bridge in this component. The games/points pages still display `gameBest.valentine`, and the points page still promises seasonal-game contributions. The mismatch remains unresolved.

## Local runtime reproduction

`GUARDIAN_TEST_CHROMIUM=/usr/bin/chromium node scripts/valentine-score-disposition.mjs` renders the actual component and real Guardian store in an isolated built harness. The iframe response is synthetic; it sends a completion message from the expected cross-origin frame. Seeded best=12 and points=34 remain unchanged. No page errors. This confirms the host has no message/result integration; it does not claim to complete or inspect the live remote game's own protocol. The harness is a reproduction of a known regression, not a green acceptance test for rewards.

The native bundle's existing CSP also deliberately blocks remote frames. Enabling this iframe in a privileged native document would conflict with the verified no-remote-executable-content boundary. Therefore it is not part of the first native account/story acceptance scope regardless of scoring.

## Separate repair requirements

A future scoped proposal must define the embedded game's actual result contract, server-side completion evidence, allowed household/child scope, one-time/replay handling and durable adult review before consequential points. Even origin/source checks and a bounded numeric score do not make a browser message authoritative. Do not wire iframe messages directly to the existing client-side `addGameScore` helper.

This issue is separate from Core PR76's repaired durable adult-goal review paths. Nothing here changes or reverses those repairs, enables rewards, resolves review threads or claims live delivery.
