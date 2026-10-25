# Guardian installed app development

The mobile build packages the existing Guardian interface on the device. It does
not publish a website or load the interface from a hosted `server.url`.

The app identity remains `au.kyrec.familyguardian`; the display name is
**KYREC Family Guardian**. Android and iOS use Capacitor 8.4.3. Native projects are
generated from the pinned packages and the committed configuration.

## Build

```sh
npm ci
npm run build:mobile
npm run mobile:prepare -- android
npm run mobile:android
```

Use JDK 21 and Android SDK 36. The Android
project is `android/`. From that directory, build a debug APK with
`./gradlew assembleDebug` (`gradlew.bat assembleDebug` on Windows).

For iOS, use `npm run mobile:prepare -- ios` and `npm run mobile:ios` on a Mac
with Xcode 26 or newer. CI compiles an unsigned simulator app; that is not an
installable iPhone/TestFlight release. Device distribution still requires the
owner's Apple signing and provisioning setup.

`npm run test:mobile` checks the packaged static assets at phone and desktop
sizes, privacy navigation, credential-entry blocking and absence of API calls.
Screenshots and the verdict are written under `artifacts/mobile-package/`.

## This milestone and the next one

**Release status: HOLD for real family use.** This milestone provides the native
packaging and build path. Mobile sign-in is deliberately unavailable and the
development screen says so. No fake user, fake verification or fake Core
response is supplied. Existing browser/server behavior remains available for
development; there is no website deployment in this change.

Before enabling account entry, implement and verify the app-facing authenticated
API transport and secure mobile session storage. Existing server functions and
cookie-based same-origin authentication cannot simply be pointed at Core from
the phone. Privileged Core, AI-provider and database credentials must remain
server-side. The service boundary is mobile app -> authenticated Guardian API
-> permitted Core operation.

The first connected acceptance flow is install, register, verify, sign in,
talk to Stan, explicitly approve a memory, restart and recall only that user's
approved memory, then forget/revoke. Current email verification uses links;
numeric verification codes are not implemented by this packaging change.
Current companion chat does not retrieve approved Core memory yet.

The GitHub workflow builds a debug Android APK and an unsigned iOS simulator
app. Neither job deploys AWS resources, a website or an app-store release.
