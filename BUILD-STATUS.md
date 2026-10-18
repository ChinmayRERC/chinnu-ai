# Chinnu AI v0.3.0 — build and deployment status

Verified 2026-10-18.

## v0.3 local verification and expansion

- Current APK: versionCode 4, versionName 0.3.0, 21,351,451 bytes.
- SHA-256: `ed17ca058565d76787c5107b11b8c13eaff4e97d826cf024c451f470ca4ee7bf`.
- Light-theme UI and animated CHINNU-AI launch; native splash and system bars updated.
- Nutrition, recipes, food-photo review, barcode label lookup, health logs, goals, plans, reminders, reports, challenges and backups implemented. Exact parity limits and REA Evidence are in `HEALTHIFY-FEATURE-PARITY.md`.
- Twenty-four unit tests passed, including migration, retained food-log composition, transactional meal logging, backup validation/restore and complete deletion.
- Five browser integration tests passed, including the new food/water/reminder/plan flows. Light home and health screenshots were inspected.
- Frontend production build and backend TypeScript check passed. New routes are lazy-loaded.
- Android build passed after explicitly downloading and checking the timed-out Kotlin compiler dependency against Maven Central's published SHA-1.
- Android reminders use inexact scheduling; the exact-alarm permission is removed from the merged app manifest.
- The phone was disconnected at this stage. Installation and v0.3 public endpoint verification are pending; the receipt below records the earlier v0.2 deployment.

## Delivered

The following entries record the prior v0.2 delivery, retained until the v0.3 cloud/device checks complete.

- Android testing APK: `../chinnu-ai-debug.apk`, versionCode 3, versionName 0.2.0.
- APK size: 21,412,204 bytes.
- SHA-256: `1995c32c62bbf453a29502fb668dfa84dcc26d6b754074430d3f98b3ddcedf55`.
- Installed and launched on Oppo CPH1933 / A5 2020, Android 11.
- Web app and HTTP/WebSocket backend: https://chinnu-ai.onrender.com
- Render service: `srv-dbacm1vbtjjs73eldevg`; region Singapore; free compute.
- Verified live deployment: `dep-dbacplcs728c738uh42g`, application source commit `9723e28`.
- Authorized private source repository: https://github.com/ChinmayRERC/chinnu-ai

## Agent and visual instruction scope

- Persistent text/voice app agent with an action audit.
- Navigation, exercise setup, original step-image/animated guides, session status/control, spoken-cue toggles, breathing timer, explicit check-ins, progress, local plan suggestions, latest report and confirmed PDF export/data deletion.
- Six gym and eight yoga configurations plus seated breathing, with expert-validation-pending labels.
- Guides are original schematic illustrations with written steps and cautions, not filmed demonstrations or validated scoring references.
- Automatic native Android speech for measured coaching, with Gemini proactive correction audio when connected.
- Camera/file-picker permission gestures and export/deletion confirmations remain on device. The agent cannot bypass conservative restrictions or control unrelated apps.

## Executed verification

- Frontend TypeScript and Vite production build: passed.
- Backend TypeScript check: passed.
- Fourteen deterministic unit tests: passed.
- Three Chrome browser integration tests: passed, covering onboarding, journal persistence, demo labels, automatic-coaching defaults, actionable connection diagnostics, agent navigation, schematic guides and restricted exercises.
- Android `assembleDebug`: passed with Java 21 and SDK 36; APK installed successfully.
- APK signature verification: v2 signature verified, one debug signer.
- Render public `/health`: HTTP 200, version 0.2.0, 16 action types and voiceConfigured true.
- Real Gemini text-agent requests returned `navigate/Progress` and `show_guide/squat` actions.
- Actual phone → public Render → Gemini → app: request opened squat instructions and reference image on the Oppo; a second request navigated to Progress.
- Public Render `wss://.../voice` authenticated. A typed live request caused a Settings tool call; the synthetic client supplied a tool result, then received generated audio. This verifies the remote voice/tool protocol, not microphone recognition accuracy.
- Native Android speech engine accepted a test cue. Proactive Gemini correction audio was separately tested using clearly synthetic measurements.
- No microphone recording or health-screening answers were submitted on the user's behalf during automated verification.

## Deployment details

Paid service creation was rejected because the workspace needs payment information. A free service was deployed instead; cold starts can delay a connection. Client requests allow a bounded 65-second warm-up. Enable billing and select an always-on instance for reliable low-latency sessions.

The Render GitHub integration could not directly fetch the private repository. A repo-specific read-only SSH deploy key and GitHub host-key pinning are stored as Render secret files. The official Render Express example supplies a public bootstrap; the build fetches actual Chinnu source privately. Render strips nested `.git` directories from restored build caches, so the build replaces its exclusively generated `chinnu-source` directory before a fresh clone. Autodeploy is off; deployments are explicit.

Gemini Live model: `gemini-2.5-flash-native-audio-preview-12-2025` (connection/audio tested). Text-agent model: `gemini-3.8-flash` (actual tool output tested); older `gemini-2.5-flash` text access was rejected as retired for this project.

The phone's backend URL is the public HTTPS service, not localhost. Provider and deployment credentials remain in ignored owner-readable `.env` and server-side Render settings, not the APK/repository. Source commits were scanned for the configured credentials before initial publication.

## Remaining limitations

- This is an agent-enabled alpha, not a medically validated or production-complete trainer.
- Real-person exercise accuracy, speaker echo/barge-in and sustained 15+ FPS on the Oppo have not been established.
- Native camera/microphone capture, worker inference, SQLite, calibration/body-proportion adaptation, robust progression, automatic live-degradation rest prompts and native iOS remain unimplemented. Native Android TTS is implemented.
- Some yoga rules cover only a subset of the pose; Child's pose has a rest timer with no alignment score.
- The animation is an original sketch, not actual exercise footage. No video/image is uploaded to the backend.
- A user must complete screening and grant camera/microphone consent. Cloud voice and requested app results reach Gemini under provider terms. Local reports remain on device.
- Open-source Kokoro/Whisper/LLM options are researched in `RENDER-MODELS.md`, not deployed. Render runs the gateway/web app; Gemini runs at its provider.
- Runtime-critical dependency findings from the first installation were resolved. Three moderate development-tool advisories remain in the Capacitor CLI/xcode/uuid chain.

See `AGENT-COMMANDS.md` for supported commands and `README.md` for build/run instructions.
