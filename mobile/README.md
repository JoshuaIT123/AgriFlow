# AgriFlow - Mobile App

AgriFlow connects farmers and buyers for agricultural trade, with payments
settled over the Bitcoin Lightning Network. This is the Android mobile client.

## Features
- Farmer dashboard - list products, manage offers, track trades
- Buyer dashboard - browse listings, make offers, pay via Lightning
- Trade & payment screens - Lightning invoice display (QR) and status tracking

## Project structure
- `app/` - Android application source
- `assets/` - images, icons, and other static assets
- `gradle/` - Gradle wrapper files

## Prerequisites
- Android Studio: https://developer.android.com/studio
- A Gemini API key (used for AI-assisted features - see `.env.example`)

## Run locally
1. Open Android Studio.
2. Select Open and choose this `mobile/` directory.
3. Allow Android Studio to resolve/fix any project incompatibilities on import.
4. Create a `.env` file in this directory and set `GEMINI_API_KEY` to your key
   (see `.env.example` for the expected format).
5. Remove the line `signingConfig = signingConfigs.getByName("debugConfig")`
   from `app/build.gradle.kts` before building a release/signed build.
6. Run on an emulator or physical device.

## Publishing
If this app has already been published, request an upload key reset in
Google Play Console before re-signing and re-uploading:
https://support.google.com/googleplay/android-developer/answer/9842756#zippy=%2Crequest-an-upload-key-reset

## Related
- Backend/API - see `../02-backend-api/`
- Lightning integration - see `../03-lightning-engineer/`
- Full system architecture - see `../docs/architecture.md`
