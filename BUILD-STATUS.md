# Chinnu AI v0.3.0 — build and deployment receipt

Verified 2026-10-18.

## Delivered artifacts

- Web app and HTTP/WebSocket backend: https://chinnu-ai.onrender.com
- Render service: `srv-dbacm1vbtjjs73eldevg`, Singapore, free compute.
- Verified live deployment: `dep-dbadvhc9v7es738552pg`, application commit `7064cf9`.
- Private source: https://github.com/ChinmayRERC/chinnu-ai
- Android APK: `../chinnu-ai-debug.apk`, versionCode 4, versionName 0.3.0.
- APK size: 21,351,451 bytes.
- SHA-256: `ed17ca058565d76787c5107b11b8c13eaff4e97d826cf024c451f470ca4ee7bf`.
- APK Signature Scheme v2 verification passed, one debug signer.

## v0.3 product additions

- Original soft light theme, consistent responsive navigation/cards/forms, light native splash/system bars and animated CHINNU-AI wordmark. Reduced-motion preference is respected.
- Nutrition diary with 26 generic rounded starter entries, custom labels, favorites, search, gram portions, meal types, edit/delete, macros/fiber and known-data micronutrient coverage.
- Six original recipes with ingredient review, preparation steps and atomic logging.
- Optional separately consented food-photo review through Gemini; estimates never log automatically. Product label lookup via manually entered Open Food Facts barcode digits.
- Manual water, weight, sleep-episode, additional-step, waist, activity-minute and glucose-note trackers, chosen goals and history.
- Editable meal/workout/yoga plans, pause/resume, conservative-mode restrictions and personal completion dates.
- In-app due reminders plus opt-in daily Android local notifications. Inexact scheduling is used; exact-alarm permission is absent from the final APK.
- Seven-day real-data reports, private challenges, editable profile, PDF timeline, JSON backup/validated restore, FAQ, diagnostics and explicit disconnected-integration status.
- Wellness-aware text/voice agent: logging, search, daily summary, reminder creation and neutral eating-break timer in addition to existing navigation/training tools.
- Existing database v1 migrates to v2; deletion and exports include new tables and cancel native schedules where appropriate.

## Executed verification

- Frontend TypeScript and production Vite build: passed.
- Backend TypeScript check: passed.
- Twenty-four unit tests: passed. Include geometry/phase handling, spoken coaching scheduling, agent boundaries, v1 database migration, nutrition/source snapshot preservation, atomic meal logging, metric units/ranges, restricted plans/fasting, backup restore and complete table deletion.
- Five Chrome integration tests: passed. Cover onboarding, conservative restrictions, journal persistence, real/demo separation, cloud connection diagnostics, agent actions/guides, light UI, meal portion editing, saved water logs, in-app reminders, saved plans and honest integration status.
- Mobile-width light Home and Health screenshots inspected.
- Android `assembleDebug`: passed with Java 21 / Android SDK 36. A timed-out Kotlin compiler dependency was fetched explicitly and checked against Maven Central's published SHA-1 before completing the build.
- Merged APK permission inventory inspected: camera/microphone/internet, notification/boot/wake permissions; no exact-alarm permission.
- Public Render health: HTTP 200, version 0.3.0, light theme, 24 agent action types, voiceConfigured true, videoUpload false.
- Actual public Gemini agent returned `log_water` amount 250; the isolated test browser executed it and displayed 250 ml in Health. No test water entry was inserted into the user's phone data.
- Actual Gemini agent returned Nutrition navigation. One earlier local provider request failed transiently; subsequent direct and public tests passed. Manual app controls remain the fallback.
- Food-photo endpoint rejects a non-consented request (HTTP 400).
- Public food-photo endpoint accepted a synthetic original drawing, returned HTTP 200 with Unknown food, unverified true and requiresReview true. This verifies schema/review flow, not real-food recognition accuracy.
- Existing Gemini Live voice/audio tool round trip and native Android TTS were verified during v0.2; v0.3 retains that integration. No new real-microphone accuracy claim.

## Phone installation status

After the phone reconnected, v0.3 was installed with `adb install -r` on Oppo CPH1933 / A5 2020, Android 11. Package manager confirms versionCode 4 and versionName 0.3.0. The existing profile loaded without onboarding being reset. The new food/meal/metric/goal/reminder/plan/fast tables are present (Dexie schema v2 is represented internally as IndexedDB version 20).

Physical-device checks passed for the light theme, Nutrition and Health navigation, public Render health (HTTP 200 / version 0.3.0), native notification plugin availability and granted display permission. A temporary inexact reminder was accepted, observed in pending schedules, and cancelled immediately; no test reminder or synthetic health record was left behind. The phone was returned to Today. Actual later notification delivery under battery restrictions remains unverified.

The APK's public backend is already https://chinnu-ai.onrender.com. No local Mac backend or USB forwarding is needed for cloud requests after updating. A new browser/device needs the application's access code entered privately in Settings, not the Gemini key.

## Service and capability limits

- This is an expanded alpha, not complete HealthifyMe service parity. Exact source feature mapping is in `HEALTHIFY-FEATURE-PARITY.md`.
- No HealthifyMe source, graphics, food database, user identity or service credentials were copied.
- Human coaching, payments, social accounts/chat, real wearable/CGM sync, NFC/widgets and background Auto Snap are not connected. Their requirements/status are shown in More → Integrations.
- Food estimates are rounded/unverified; allergies, hidden ingredients and portions cannot be established from a photograph. Generic entries lack most micronutrients. Missing values are not treated as zero.
- Exercise alignment thresholds remain expert-validation-pending. Real-person accuracy, reliable camera-view recognition and sustained 15+ FPS on Oppo remain unverified.
- Native camera/microphone capture, worker inference, SQLite migration, true calibration/progression, live form-breakdown rest detection and native iOS remain future work. Android TTS and local notifications are native plugins.
- Native reminder scheduling/cancellation and v0.3 phone navigation are verified. Later notification delivery under battery restrictions, native PDF download/share and sustained live-camera performance still need testing.
- Profiles/history stay in device IndexedDB; web/APK storage is separate. Food-photo/voice/request data reach the provider only through their relevant user actions/consent. Chinnu does not persist selected media on the backend; provider terms still apply.
- Render paid service creation was rejected for missing billing details; free compute is deployed and can cold-start. The client allows a bounded 65-second connection warm-up.
- Render builds private source with a repo-scoped read-only SSH deploy key, not a general GitHub token. Autodeploy is off; explicit deployments are used.
- Gemini Live native-audio model remains `gemini-2.5-flash-native-audio-preview-12-2025`; text/image model is `gemini-3.8-flash`, tested for this account.
- Three moderate development-tool advisories remain in the Capacitor CLI/xcode/uuid chain; no runtime-critical advisory was left from the initial dependency installation.

See `README.md`, `AGENT-COMMANDS.md`, `HEALTHIFY-FEATURE-PARITY.md` and `RENDER-MODELS.md` for operation, commands, research provenance and remaining work.
