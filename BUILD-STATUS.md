# Build status — 2026-10-18

## Delivered

- `../chinnu-ai-debug.apk` — v0.1.1 (versionCode 2), 21,252,895 bytes; debug signed.
- SHA-256: `02ca9c9a3a12c728e58ad3dffbb43599a8af680f19eaf24c529c1a4875d7b870`.
- Web production build in `dist/`.
- React/Capacitor source, local pose model/WASM, movement engine, storage, reports, journal and optional cloud voice integration.
- Render Blueprint and backend source, not deployed.

## Executed verification

- TypeScript frontend and production Vite build: passed.
- Backend TypeScript check: passed.
- Eleven deterministic engine/coaching/connectivity unit tests: passed.
- Two Chrome browser integration tests: passed. Covered onboarding, conservative movement restrictions, persisted journal, labeled demo history and trainer opening without automatic cloud microphone activation.
- Android `assembleDebug`: passed with isolated Java 21 and Android SDK 36.
- APKSigner: APK Signature Scheme v2 verified, one signer.
- Local backend health endpoint: HTTP 200.
- Voice session without credentials: HTTP 503 with actionable configuration error.

## Device and Gemini connection update

- v0.1.1 fixes generic fetch errors with specific localhost/Render diagnostics and a Test backend action.
- Automatic spoken coaching is on by default, including persistent corrections, tracking-loss instructions and spaced measured-alignment encouragement.
- Android-native TextToSpeech works independently of backend reachability; native engine accepted the test phrase.
- Proactive Gemini correction audio was verified with a labeled synthetic measurement event through the updated relay.
- Cause of reported failure: phone disconnected from ADB while configured for the USB-only localhost backend. Reconnected and forwarding restored; phone health request now returns HTTP 200.

- Installed and launched successfully on connected Oppo CPH1933 (A5 2020), Android 11.
- Gemini model-list authentication: HTTP 200.
- Gemini Live setup handshake: confirmed.
- Local voice relay received generated PCM audio at 24 kHz.
- Phone WebView reached local backend `/health`: HTTP 200, voiceConfigured true.
- Phone WebView authenticated and received generated voice audio through the USB-forwarded backend.
- No microphone recording, health screening answers, or local-camera consent were submitted on the user's behalf. The app is at onboarding.
- Local URL and demo access code were configured in phone app storage. The provider key remains in ignored `.env` with owner-only permissions, not in the APK.
- Debug builds permit HTTP only for localhost/127.0.0.1 through a debug-only network configuration; release defaults remain HTTPS-only.
- Local backend runs on port 10000; USB uses `adb reverse tcp:10000 tcp:10000`. Keep the Mac running and phone connected until a Render service is deployed.

## Not yet verified or complete

- No real-person camera session or microphone conversation tested yet; no performance or real-video accuracy claim.
- Provider-generated audio transport verified, but speaker playback/echo/user interruption still need a real microphone session.
- No Render deployment credentials supplied; no services created and no credits spent.
- Native camera/microphone capture, worker inference, SQLite migration, real calibration/progression, automatic live-degradation rest prompts and native iOS are not implemented in this alpha. Native Android speech output is implemented. See README for full limitations.
- All movement thresholds remain expert-validation-pending.
- npm audit leaves three moderate development-tool findings in the Capacitor CLI/xcode/uuid dependency chain. Runtime critical findings from initial installation were resolved by updating jsPDF and Vitest. Production code does not invoke the affected xcode CLI dependency.

## Immediate next actions

1. Complete onboarding on the Oppo and explicitly enable camera/voice to test actual camera operation and audio playback.
2. Deploy the Render Blueprint from a repository you control and configure Gemini privately in Render environment settings.
3. Enter Render URL and demo access code in app Settings; consent to cloud audio during a session.
4. Validate actual live/video results and voice interaction before expanding to production readiness.
