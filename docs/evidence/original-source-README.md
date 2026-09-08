# NOVA · STAN AI — Family Guardian

A Capacitor project that wraps the KYREC Family Guardian app into an installable
Android APK. The whole app lives in `www/index.html` (one self-contained file).

- App name: **NOVA**
- App ID: `au.kyrec.familyguardian`
- Web content: `www/`

---

## What you need first (one-time setup)

1. **Node.js** (LTS) — https://nodejs.org
2. **Android Studio** — https://developer.android.com/studio
   (installs the Android SDK + build tools you need)
3. **Java JDK 17+** — Android Studio bundles one; that's fine.

You already have `adb` from your Android platform-tools, which you'll use at the end.

---

## Build the APK (5 commands)

Open a terminal **inside this folder** and run:

```bash
npm install            # 1. pull in Capacitor
npx cap add android    # 2. generate the native android/ project
npx cap sync           # 3. copy www/ into the app
npx cap open android   # 4. opens Android Studio
```

Then in **Android Studio**: menu **Build → Build App Bundle(s) / APK(s) → Build APK(s)**.
When it finishes, click **locate** — the file is:

```
android/app/build/outputs/apk/debug/app-debug.apk
```

### Prefer the command line? Skip Android Studio:

```bash
cd android
./gradlew assembleDebug        # on Windows: gradlew.bat assembleDebug
```

Same output path as above.

---

## Install it on your phone

```bash
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

(That's the same command style as your `stan-app.apk` install.)

---

## Updating the app later

Edit `www/index.html`, then just:

```bash
npx cap sync
```

...and rebuild. That's the whole loop.

---

## Optional polish

**Change the app name** — edit `appName` in `capacitor.config.json`, then
`npx cap sync`.

**Add your own launcher icon** — put a 1024×1024 PNG at `resources/icon.png`, then:

```bash
npm install @capacitor/assets --save-dev
npx capacitor-assets generate --iconBackgroundColor '#7C5CFC'
```

**Release (signed) APK** — the debug APK installs fine for testing. For the Play
Store you'll generate a signed release build; Android Studio's
**Build → Generate Signed Bundle / APK** walks you through creating a keystore.

---

## Notes

- The app runs fully offline. The only online piece is the Poppins web-font
  `@import`; without a connection it falls back to the system font and still
  looks right.
- Family names, locations, points and scores are the concept/example data from
  your mockups.
- Characters render as gradient medallions. To use your actual Stan/Nova 3D
  renders, drop transparent PNGs into `www/` and swap the medallion markup in
  `index.html`.
