# CHINNU-AI · v0.4

Android-first, local-camera training and personal wellness with an NVIDIA-backed voice agent.

**Live app:** https://chinnu-ai.onrender.com · **Private source:** https://github.com/ChinmayRERC/chinnu-ai

## For app users

Open the app, complete local onboarding and tap **Ask Chinnu**. Type a request or consent to cloud microphone processing and tap **Talk to Chinnu**. **There is no API-key or application-access-code setup for users.** The operator configures one NVIDIA credential on Render; short-lived app sessions are created automatically.

NVIDIA speech is currently English: Parakeet recognizes short utterances after a pause; Nemotron handles complex requests; Magpie speaks calm replies. Explicit commands such as “Open my progress”, “Pause”, “Show me how to do a squat” and a specified water amount use a fast validated command path without an unnecessary LLM hop. App results are acknowledged before the assistant confirms them.

Echo cancellation suppresses Chinnu's own output, while sustained user speech automatically interrupts playback and resumes listening; **Interrupt · listen** remains available as a manual fallback. This is a short-utterance voice pipeline, not always-listening background Siri integration. Camera permissions, file selection and destructive/export confirmations remain on device.

## Features

- Original responsive light interface, animated CHINNU-AI launch, native light splash and system bars.
- Six gym and eight yoga reference configurations plus seated breathing posture; original step illustrations and schematic animated guides.
- Local MediaPipe skeleton tracking, aspect-correct joint angles, One Euro smoothing, confidence gating, phase-based reps, tracked hold timers, prioritized correction cues and session reports.
- Local selected-video analysis (browser-supported codecs; two minutes/150 MB), per-rep estimates, flags and temporary annotated snapshots. No exercise-video upload.
- Native Android spoken cues work without cloud service. Alignment estimates are prototypes needing expert validation, not safety or medical scores.
- Nutrition diary with 26 rounded generic starter foods, custom labels, favorites, portions, macros/fiber and known-data micronutrient coverage. Six original recipes support ingredient review and atomic logging.
- Optional selected food-photo estimate through NVIDIA vision, with separate consent and review before saving. Manual Open Food Facts barcode-digit lookup.
- Manual water, weight, sleep episodes, additional steps, waist, activity duration and glucose notes; optional user-chosen goals.
- User-built meal/workout/yoga plans, pause/resume and private completion dates; no automatic prescribed calorie deficits.
- In-app reminders and opt-in daily inexact Android notifications.
- Progress, real-data weekly reports, private challenges, check-ins, journal, PDF timeline, validated JSON backup/restore, complete local deletion and non-content diagnostics.
- In-app agent navigation, visual guides, session controls/status, wellness logging, reminders and requested progress summaries. See `AGENT-COMMANDS.md`.

## Architecture

```text
Phone camera / selected workout video
  -> local MediaPipe -> confidence gate / smoothing / geometry
  -> phase + rule engine -> local measured cue / report / IndexedDB

Opt-in microphone -> AudioWorklet PCM -> Render WebSocket
  -> short-utterance endpointing -> NVIDIA Parakeet ASR
  -> fast explicit-command router or NVIDIA Nemotron tool calling
  -> validated action executed on device -> actual action result
  -> NVIDIA Magpie TTS -> browser audio playback

Text requests -> Render HTTP agent -> same action boundary
Selected, separately consented food photo -> NVIDIA vision -> reviewed estimate
```

Render hosts the web app, model/WASM assets and gateway. NVIDIA performs hosted speech/text/vision inference. No large model or GPU inference runs on the small Render instance. NVIDIA testing quotas/expiry and Render hosting usage are separate; neither is unlimited production service.

## Development

```sh
npm ci
npm run dev
```

Open localhost for camera use, or HTTPS for phone/browser testing. Plain LAN HTTP is not a secure camera context. Bundled model/WASM assets support local APK pose inference.

Operator backend setup:

```sh
cp .env.example .env
# Privately configure NVIDIA_API_KEY once. Never paste it into the app.
node --env-file=.env --import tsx server/index.ts
```

The deployed configuration uses:

- Decision primary: `nvidia/nemotron-3.5-super-vl-120b-a12b`, thinking disabled and 512 output tokens.
- Decision fallback: `nvidia/nemotron-3-super-120b-a12b`; at most one different-model fallback, with a 13-second total deadline. HTTP-200 error strings, empty replies and invalid app tools are rejected. Recoverable provider failures keep the voice session listening.
- Speech recognition: hosted Parakeet TDT English offline recognizer.
- Speech output: English text with the hosted endpoint's verified `Magpie-Multilingual.HI-IN.Aria` voice for Indian-accented delivery, streamed as PCM at 22,050 Hz.
- Selected-photo vision: `nvidia/nemotron-3.5-super-vl-120b-a12b`.
- `PUBLIC_APP_SESSIONS=true`, one anonymous app session per client cache, per-IP session throttles, 60 HTTP actions per session, two concurrent cloud voice sessions, thirty-minute voice lifetime, 120 turns per voice session and a default 300 provider-call/day process budget.

Budgets are in-memory and reset with an instance restart. Production abuse protection needs persistent/distributed accounting and provider-side quota controls. Legacy Gemini text/image support remains an explicit operator-only alternative; it is not the selected deployed provider. There is no Gemini live-voice route in v0.4.

## Android

```sh
JAVA_HOME=/path/to/jdk21 npm run android:apk
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

Easy-to-find copy: `../chinnu-ai-debug.apk`. It is debug-signed, not a Play Store production release. Requires compatible Java 21, Android SDK 36/build tools and accepted SDK licenses. Android Studio's bundled Java 25 is incompatible with the current Gradle wrapper; set `JAVA_HOME` explicitly. The build may download missing Gradle/Android dependencies.

Camera/microphone currently use WebView APIs; native Android TTS and local notifications are Capacitor plugins. History uses IndexedDB, with v1→v2 migration. Android backup is disabled. Native SQLite, CameraX/inference worker and native audio capture are future adapters, not implemented claims.

## Render

Current service: `srv-dbacm1vbtjjs73eldevg`, https://chinnu-ai.onrender.com, Singapore. It uses the free plan because the account rejected paid-instance creation without payment details; cold starts may delay the first connection by about a minute. The client permits a bounded 65-second warm-up.

Source is built from the owner's authorized private repo using a repository-scoped read-only deploy key. See `AGENT-COMMANDS.md`. Autodeploy is disabled; deployment is explicit. `scripts/configure-nvidia-render.mjs` updates individual NVIDIA settings without replacing unrelated env variables; values are not logged. `scripts/render-deploy.mjs deploy` triggers a build. The Blueprint describes a normal directly connected Git deployment; it is not the active source of truth for the API-created service's bootstrap/private-fetch build command.

Public HTML is served no-store so a refresh obtains the current client. APK updates still require installing the new APK.

## Verification

```sh
npm test
npm run build
npx playwright test
npx tsc --noEmit --strict --skipLibCheck --esModuleInterop --target ES2022 --module ESNext --moduleResolution Bundler server/index.ts
# Operator credentials required; only generated synthetic speech is used:
node --env-file=.env --import tsx scripts/verify-nvidia.ts
node --env-file=.env --import tsx scripts/verify-voice-flow.ts
```

`BUILD-STATUS.md` records actually executed tests and deployment/device state. Synthetic TTS→ASR tests do not establish real-microphone recognition accuracy. Main speech services, actual tool round trips and provider entitlements must be retested after credential/model changes.

## Privacy and limitations

- Camera/workout video never leaves the device. Frame snapshots are temporary; measurements persist locally. No recording is enabled without its user action/consent.
- Microphone audio, text requests, requested app results and explicitly selected food photos reach NVIDIA through Render. Chinnu does not intentionally log/store their content. Provider/platform terms and retention are separate.
- Browser and APK histories are separate; no account/cloud history sync. Backups exclude provider credentials and media. Exported files are user controlled.
- Voice recognition is English and turn-based. Adaptive energy endpointing still needs real noisy-gym testing. Sustained speech can interrupt a reply automatically, with an explicit interrupt fallback. Stop/Pain buttons always remain local.
- Provider latency, rate limits, free-service cold starts and trial expiry affect cloud availability. Local training/manual diaries/native spoken cues remain available.
- Some yoga checks measure only a small subset of alignment. Child's pose is a rest timer, not alignment scoring. No breath, load, force, spinal curvature, injury or diagnosis detection. Hip hinge is unloaded practice.
- Threshold validation, calibration/body-proportion adaptation, robust progression, automatic live-degradation rest prompts, iOS native, widgets and wearable/CGM integrations remain unfinished.
- Food values are estimates, not a medical diet. Review actual labels/allergens. No micronutrient value is invented when missing. Photo estimates cannot establish portions/hidden ingredients/allergens and never auto-log.
- Human coaches, payments, social accounts and real connected health sensors are not supplied by an APK's feature inventory. `HEALTHIFY-FEATURE-PARITY.md` labels current implementation and real integration gaps.

## References / notices

Original implementation; no HealthifyMe source, media, branding, credentials or food database is copied. REA findings are product research with evidence/limitations in `HEALTHIFY-FEATURE-PARITY.md`.

- NVIDIA Build Magpie: https://build.nvidia.com/nvidia/magpie-tts-multilingual
- NVIDIA Build Parakeet: https://build.nvidia.com/nvidia/parakeet-tdt-0_6b-v2
- Protocol definitions and notices: `server/protos/`, NVIDIA Riva common (MIT plus preserved Apache attribution).
- MediaPipe sample/model notices: `public/mediapipe-LICENSE.txt`, https://github.com/google-ai-edge/mediapipe-samples
- Capacitor: https://github.com/ionic-team/capacitor (MIT).
- Open Food Facts labels are third-party crowdsourced data; verify package values and applicable reuse terms before broader distribution.
