# Chinnu AI

Android-first, local-camera movement companion with optional Gemini conversational voice through a Render-ready Node backend.

Live web app/backend: **https://chinnu-ai.onrender.com**. Private source: https://github.com/ChinmayRERC/chinnu-ai. The deployed free service can have cold starts; an always-on paid service requires enabling Render billing. See `AGENT-COMMANDS.md` for the deployment's private-source build route.

## v0.3 wellness and light design

- Original polished light theme, native light splash and animated **CHINNU-AI** launch, including reduced-motion handling.
- Nutrition: 26 rounded generic starter foods, custom labels, favorites/search, gram portions, editable meal diary, macros/fiber and optional known-data micronutrient totals. Six original recipes support ingredient review and atomic diary logging.
- Optional food-photo estimate through Gemini only after separate photo consent; every result requires review. Manual Open Food Facts barcode lookup is available when a complete label exists. Exercise videos remain local.
- Health: manual water, weight, sleep, additional steps, waist, activity duration and glucose notes, history and user-chosen goals. No sensor, medical score, inferred calories burned or diagnosis is fabricated.
- Plans: editable meal/workout/yoga routines, pause/resume, conservative restrictions and personal completion dates.
- Reminders: in-app banners and opt-in Android daily inexact notifications through Capacitor. Refresh notification schedules after changes.
- More: seven-day reports, private real-data challenges, profile editor, validated JSON backup/restore, FAQ, non-content diagnostics and honest integration status.
- Agent actions cover food/water/metric logging, food search, daily summary, reminders and a neutral eating-break timer as well as navigation and movement tools.
- Existing v1 history migrates to database v2. Delete/export/backup cover the new tables. No application/provider access keys are backed up.

See `HEALTHIFY-FEATURE-PARITY.md` for the REA evidence, implemented counterparts and remaining service/integration gaps. This is an original implementation, not copied HealthifyMe source, graphics or food data.

## v0.2 agent and visual instruction update

The floating **Ask Chinnu** agent accepts text requests and opt-in live microphone conversation across app pages. It can navigate, open exercises, show original step illustrations/animated guides, control training, mute/unmute coaching, run the gentle breathing timer, save explicitly supplied check-ins, read real progress, suggest a local plan, show reports and request PDF export/data deletion. Tool results come from the app before the voice model may claim success. Camera/file-picker gestures and destructive/export confirmations remain on device. This is an in-app agent, not Siri or an OS-wide assistant.

Each configured exercise has three instructions, a camera-placement note, cautions and an original schematic guide. The animated guide is an illustration, not filmed footage, motion capture, a diagnosis or a validated scoring reference. It can remain visible while live tracking is active.

Web frontend and HTTP/WebSocket backend can run on the same Render service using `npm ci --include=dev && npm run build` and `npm run server`. The web client defaults to its HTTPS origin. APKs use public `VITE_API_URL` or an explicitly saved backend URL; provider credentials never use a VITE-prefixed variable.

Voice/text request and requested app-result data go to the AI provider. Camera frames remain local. Review `src/agent/actions.ts` for the exact supported action boundary; unsupported actions fail rather than executing arbitrary code.

## Run

```sh
npm ci
npm run dev
```

Open `http://localhost:5173`. Camera/microphone require localhost or HTTPS; plain LAN HTTP is not a secure camera context. The APK bundles model/WASM assets for local inference.

## Android

Built APK: `android/app/build/outputs/apk/debug/app-debug.apk`.

An easy-to-find copy is delivered at `../chinnu-ai-debug.apk`. This is a debug-signed testing build, not a Play Store production release.

Build prerequisites: Node 24+, Android SDK 36/build tools, compatible Java 21, and accepted Android SDK licenses.

```sh
JAVA_HOME=/path/to/jdk21 npm run android:apk
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

The build script uses `JAVA_HOME` if set, otherwise attempts Android Studio's bundled JDK. Java 25 is incompatible with the bundled Gradle 8.14.3; choose Java 21 explicitly. Build commands may download Gradle and missing Android components. The APK has now been installed and launched on an Oppo A5 2020 / Android 11. Actual movement accuracy and sustained performance still need testing.

## Implemented

- Responsive dark interface: Today, Train, Progress, Journal, Settings.
- Consent, local profile, conservative screening and restricted movement selection.
- Local MediaPipe Pose Landmarker with confidence gating and skeleton overlay.
- Shared angle/phase/rule pipeline for live camera and local video.
- Declarative configurations: six gym movements, eight yoga poses, seated breathing.
- One Euro feature smoothing; complete-cycle reps; hold timer; sustained correction cues.
- Measured correction explanations, estimated scores, tracking coverage, per-rep reports, form-breakdown summary.
- Temporary flagged snapshots (not persisted), local session history, clearly labeled demo history.
- Local check-ins, journal, PDF export and deletion.
- Gentle 4-in/6-out breathing timer (no breath sensing or retention).
- Rules-based daily suggestion based on goal, restrictions, latest soreness check-in.
- Automatic prioritized spoken corrections using native Android TextToSpeech (browser speech fallback) and opt-in Gemini conversation.
- Sustained-correction repetition, tracking-loss instructions and spaced encouragement with cooldowns; proactive Gemini audio from measured coaching events.
- Backend diagnostics explain USB localhost dependency and provide connection/speaker tests in Settings. See `RENDER-MODELS.md` for permanent deployment and open-model options.
- Render backend with Gemini Live relay, temporary access tokens, per-session bounds, and pause/resume/stop/pain tools.
- AI explanation/summary/plan endpoints. These are backend capabilities; the current UI does not invoke the text endpoints or apply cloud-generated plans.

## Render and Gemini voice

1. Put this source in a Git repository you control. No commit or push was performed automatically.
2. In Render, create a Blueprint using `render.yaml` (small paid service). Review the plan's charges before deploying.
3. Set `GEMINI_API_KEY` in Render environment secrets. Render credits and Gemini API billing are separate.
4. Set or retrieve `APP_ACCESS_CODE`. This is a temporary demo gate, not production user authentication.
5. Verify your account supports `GEMINI_LIVE_MODEL`. Defaults are configurable and not a guarantee of provider availability.
6. Check `/health`. `voiceConfigured` must be true.
7. In the app's Settings, enter the HTTPS Render URL and application access code. Never enter the Gemini API key in the app.
8. Start a training session, tap Connect, review cloud-processing consent, and enable the microphone.

Voice audio and current measurement context reach Render and Gemini only when the user enables cloud voice. Video never enters the backend. Provider terms govern audio processing/retention. Application content is not intentionally logged, but platform/provider retention is separate.

For local backend development:

```sh
cp .env.example .env
# Edit .env privately with your credentials.
node --env-file=.env --import tsx server/index.ts
```

Use `http://localhost:10000` only on the same desktop browser, or expose a trusted HTTPS development endpoint for phone testing. No secrets are bundled in the frontend.

## Architecture

```text
Camera / selected video
  -> PoseEstimator (MediaPipe Web in this release)
  -> confidence gate -> One Euro smoothing
  -> aspect-correct angles -> phase state machine -> rules
  -> rep/hold records -> cue -> report -> local IndexedDB

Opt-in microphone -> AudioWorklet PCM -> authenticated Render WebSocket
  -> Gemini Live -> audio/captions + constrained session commands
```

`src/pose`, `src/exercises`, `src/feedback`, `src/ui`, `src/storage`, `server`, and `tests` own their respective boundaries. Adding a movement using the existing feature primitives requires JSON, not engine changes.

## Verification

```sh
npm run build
npm test
npx playwright test
npx tsc --noEmit --strict --skipLibCheck --esModuleInterop --target ES2022 --module ESNext --moduleResolution Bundler server/index.ts
```

Browser tests use installed Google Chrome. Unit fixtures exercise numeric geometry, counting, confidence loss, time gaps and breakdown detection; they do not establish real-video accuracy.

## Important limitations / remaining full-product work

- This is a working alpha, not the complete validated product from the long-term plan.
- Native CameraX/MediaPipe, native microphone capture, SQLite and native PDF sharing are not implemented. Native Android speech output is implemented; camera/microphone still use browser APIs and IndexedDB in Capacitor. PDF download behavior needs phone testing.
- MediaPipe inference currently runs on the main thread. 15+ FPS on Oppo A5 2020 has not been demonstrated. Worker/native migration and sustained benchmarks remain.
- Camera-view verification is manual. Full-body checks and brightness checks are heuristics, not guarantees.
- All exercise thresholds need qualified expert validation. Some yoga rules assess only a small subset of the pose. Child's pose is a rest timer with no alignment score.
- No load, force, spinal curvature, breathing, injury, or diagnosis detection. Hip hinge is unloaded practice only.
- Calibration/body-proportion adaptation, side-specific rep inventories, robust progression and automatic rest-day planning are not yet implemented. Height/experience are stored but do not change thresholds.
- Form breakdown is shown after the session. Automatic live sharp-degradation rest prompts are not implemented; Pain / Stop is always visible.
- Voice requires network, credentials and a supported provider model. Gemini Live setup and generated audio delivery through the backend to the phone WebView are verified; microphone/speaker interaction is not yet tested. Voice reconnection is manual, not automatic; speech interruption relies on provider events.
- Voice tools pause/resume/stop/pain only; voice-based exercise switching is not implemented. Local stop remains available when speech recognition fails.
- Uploaded clips play and analyze in real time; support is limited to browser-decodable clips up to two minutes/150 MB. Frame-rate consistency is not guaranteed on slow devices.
- Hold timers do not prove full pose recognition. Scores are rule-based estimates, not safety or clinical metrics.
- History stores measurements locally; snapshots are discarded on leaving the trainer. OS/browser storage retention applies. Android app backup is disabled.
- Sleep/food tips include a public basis. Android local reminders now work; native iOS packaging and offline PWA service-worker caching remain future work.
- Cloud plan endpoint is an educational text proposal only and is not applied by the app; no unvalidated AI plan silently changes training.
- Coach handoff is a local export stub, marked Coming soon. No accounts, bookings, payments or wearables are connected. The food catalog is a small rounded starter plus custom/imported labels, not a comprehensive licensed diet database.

## Native migration

Replace `PoseEstimator` with adapters that normalize coordinates, timestamps, confidence, orientation and landmark identity. Android: CameraX + MediaPipe Tasks/LiteRT. iOS: Vision/Core ML with an explicit landmark mapping. Apple Vision does not provide an identical 33-landmark schema: unavailable features must remain unknown, not fabricated. Keep the downstream phase/rule engine and fixtures shared. Add local repository adapters for SQLite without changing UI data semantics.

## Three-minute demo

0:00–0:25: onboarding, screening and privacy.
0:25–1:15: squat frame check, reps, measured cue, pause/stop.
1:15–1:55: short local video, temporary snapshot, per-rep report.
1:55–2:25: Mountain hold and confidence loss behavior.
2:25–3:00: progress, labeled demo history, journal and PDF.

Cloud voice is an optional additional demonstration only after actual provider setup is verified.

## References and notices

- MediaPipe samples: https://github.com/google-ai-edge/mediapipe-samples (Apache-2.0).
- MediaPipe Tasks Vision npm package and bundled WASM: preserve upstream notices.
- Pose model: https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task
- Capacitor: https://github.com/ionic-team/capacitor (MIT).
- Render WebSockets: https://render.com/docs/websocket
- Pose Trainer was research context only; no GPL project code was copied.
- No HealthifyMe code, assets, credentials or branding are used.

Review dependency/model licenses before public distribution. The original HealthifyMe reverse-engineering report is separate product research, not source for copied code.
