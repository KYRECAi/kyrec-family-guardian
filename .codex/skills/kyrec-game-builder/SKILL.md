---
name: kyrec-game-builder
description: Design, build, test and hand over KYREC games in Codex while preserving approved companion designs, Family Guardian integration, family-controlled rewards, product evidence and commercial release discipline.
---

# KYREC Game Builder — Codex Skill

## Skill control
- Version: 1.1
- Classification: INTERNAL CONTROLLED

## Authority
Michael Willard is Founder and final authority for game scope, public release, major spend and risk acceptance.

Jax owns game concept, player problem/value, mechanics, MVP boundaries, engagement design and product acceptance.

Adrian owns code architecture, platform integration, security, build/release engineering, testing and recovery.

Approved character artwork and character locks remain design authority. Codex must not redesign locked characters.

## Core game rule
KYREC does not build filler games.

Every game must pass:
1. Real purpose
2. Clear KYREC fit
3. Good gameplay
4. Safe family mechanics
5. Growth or strategic value
6. Professional quality

## Approved Family Guardian game structure
### First playable release
**Moneybags Bonus**

This is the first core Family Guardian game, not merely a seasonal event.

Moneybags Bonus should unlock from verified family budget wins, approved Family Points and family-controlled reward authority.

The game must not create, award or unlock consequential Family Points outside the approved authority model.

### Approved game modes
1. **KYREC Family Quest** — cooperative family missions, teamwork, shared goals and meaningful rewards.
2. **KYREC Family Defenders** — age-appropriate online and real-world safety learning through choices, scenarios and family discussion.
3. **KYREC Routine Rush** — gamified mornings, routines, handovers and shared responsibilities designed to reduce everyday pressure.

### Seasonal games after Moneybags Bonus foundation
- Christmas Train
- Easter Hunt
- Valentine’s Love Dash

Do not move seasonal games ahead of Moneybags Bonus without explicit Founder approval.

## Companion rules
Family Guardian companions:
- Stan
- Nova
- Pulse
- Moneybags
- Scout

Biko is separate and belongs to **KYREC Business by Biko**.

Do not invent new Family Guardian companions.

## Character integrity
When approved reference art is supplied, preserve silhouette, face/eyes, proportions, colour placement, identifying armour/body forms, accessories, defining symbols and personality/role boundaries.

A new pose or animation is allowed only if the character remains unmistakably the approved character.

Do not replace a locked character with a generic AI-generated robot.

## Use this skill when
Use for game concepts, playable prototypes, game loops, scoring, rewards, Family Points integration, Moneybags Bonus, seasonal games, companion animation, touch controls, mobile game UI, game-state persistence, sound/music logic, game QA, app integration, release builds and handovers.

## 1. Start with the game job
Before coding define:
- PLAYER
- PURPOSE
- CORE LOOP
- WIN
- FAIL
- SESSION LENGTH
- REWARD
- FAMILY VALUE
- OUT OF SCOPE

## 2. Avoid manipulative game design
Do not use dark patterns, infinite-pressure streaks, deceptive loot mechanics, fake scarcity, compulsive reward loops, emotional guilt, pay-to-win mechanics for children or public shaming between family members.

KYREC games should encourage play, cooperation and return value without trying to dominate attention.

## 3. Moneybags Bonus authority wall
Moneybags gameplay can display and consume approved game-state data, but:
- recommendation != points authority
- eligibility != unlock authority
- game completion != automatic financial authority
- child action != adult approval
- one workspace/family must not affect another

If the Core authority token/decision is absent or invalid, the game must fail safely and clearly.

## 4. Build prototype before polish
First playable must prove movement/input, core loop, scoring, win/fail, restart, no soft-lock, mobile usability, state reset and reward boundary.

Only then add advanced animation, particles, sound, richer scenes, extra levels and cosmetic polish.

## 5. Mobile-first controls
Use large touch targets, thumb-friendly controls, readable score/status, obvious pause/restart, safe-area/notch awareness, small-phone testing and no required hover states.

## 6. Game-state design
Separate local visual state, current session state, persistent player progress, Family Guardian account state, Family Points/reward authority state and KYREC Core-derived state.

Never trust client-side values for consequential rewards.

## 7. Audio and music
Use only assets KYREC owns, has generated lawfully, or has licensed. Do not embed unlicensed commercial music.

## 8. Safety-learning games
For Family Defenders, keep scenarios age-appropriate, avoid unnecessary fear, do not claim the game prevents every emergency, encourage trusted-adult discussion and clearly separate practice scenarios from emergency services.

## 9. Cooperative family games
Prefer shared goals, turn-taking, collective wins, fair contribution, multiple ways to help, no sibling humiliation, no scoring of private feelings and correction/appeal where outcome data is used.

## 10. Testing matrix
Test start, input, scoring, collisions/interactions, win, fail, restart, pause/resume, repeated sessions, small phone, larger phone, orientation, safe areas, touch accuracy, background/resume, missing assets, audio unavailable, no network, interrupted session, stale state and invalid local state where relevant.

For reward authority test eligible, ineligible, child-only attempt, wrong workspace/family, repeated claim, expired claim, offline claim and already-consumed authority.

Record failed tests as well as passing tests.

## 11. Game acceptance gate
Before calling a game approved for integration:
- core loop is fun enough to replay
- no soft-locks
- mobile controls are usable
- character visuals match approved references
- rewards obey Family Guardian authority rules
- no secrets are in client code
- no unlicensed assets
- privacy boundaries pass
- real-device test completed where possible
- source committed
- exact resume point recorded
- Jax product acceptance obtained
- Adrian engineering gate passed
- Michael approves release

Use PLAYABLE PROTOTYPE, INTERNAL ALPHA, FAMILY TEST, RELEASE CANDIDATE or HOLD.

## Codex task close format
**GAME**  
**MODE**  
**PLAYER / PURPOSE**  
**STARTING BRANCH / COMMIT**  
**CORE LOOP**  
**FILES CHANGED**  
**ASSETS USED**  
**WHAT NOW WORKS**  
**TESTS RUN**  
**PASS**  
**FAIL**  
**REWARD / FAMILY POINTS IMPACT**  
**PRIVACY / SECURITY IMPACT**  
**PERFORMANCE NOTES**  
**KNOWN OPEN ISSUES**  
**ENDING COMMIT**  
**BUILD STATUS**  
**EXACT RESUME POINT**  
**NEXT ACTION / OWNER**  
**MICHAEL APPROVAL REQUIRED: YES / NO**

## Phone approval requirement
Before a source ZIP is treated as the primary review handover, create a phone-viewable playable approval build/viewer where technically practical, allowing Michael to Approve / Needs Changes / Hold and add notes.

## Control line
> Make the game genuinely fun. Keep the family in control. Preserve the characters. Prove the reward boundary. Release nothing that is only pretty but not properly playable.
