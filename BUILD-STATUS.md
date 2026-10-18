# CHINNU-AI v0.4.0 — NVIDIA deployment receipt

Verified 2026-10-18.

## Active delivery

- Web app/backend: https://chinnu-ai.onrender.com/?v=0.4
- Render service `srv-dbacm1vbtjjs73eldevg`, Singapore, free compute.
- Live deployment `dep-dbaffce7bikc73eeeou0`, source commit `74a1f7e`.
- Private repository: https://github.com/ChinmayRERC/chinnu-ai
- APK: `../chinnu-ai-debug.apk`, 21,351,911 bytes.
- APK SHA-256: `3629109cadede95b526c8e271e1391b085375bbb24ccebc646c61bf642d0949d`.
- Installed as an update on Oppo A5 2020 / CPH1933: versionCode 5, versionName 0.4.0. Existing local data retained.

## Removed user setup requirement

- No provider-key or application-access-code input in the app UI.
- Anonymous short-lived server sessions connect automatically. Operator credentials remain on Render, never in the frontend/APK.
- The active Render configuration selects NVIDIA text/image models, Parakeet ASR and Magpie TTS. Old Gemini environment variables are preserved for operator rollback but are not the selected deployed route. No Gemini live-voice route remains in v0.4.
- HTML responses are no-store. `?v=0.4` bypasses any old browser cache; APK clients need the installed update.

## Verified NVIDIA services

- One supplied NVIDIA credential successfully accessed both speech services and the hosted model catalog; Render is configured with one primary NVIDIA_API_KEY.
- Magpie gRPC synthesis generated PCM16 audio at 22,050 Hz. Calm voice `Magpie-Multilingual.EN-US.Aria.Calm` is present in actual provider config and was tested.
- Parakeet exposed an English offline recognizer and correctly transcribed generated speech “Open my progress.”
- Nemotron text model `nvidia/nemotron-3.5-lightning-30b-a3b` returned a valid navigation tool call and a short response with thinking disabled. Initial general-model latency was about 12–18 seconds; fast explicit commands avoid this LLM hop.
- Vision model `nvidia/nemotron-3.5-super-vl-120b-a12b` accepted a synthetic drawing and returned a description. Food recognition/nutrition accuracy is not established by that synthetic check.

## Executed checks

- Frontend TypeScript/Vite production build passed.
- Backend TypeScript check passed.
- 32 unit tests passed: prior movement/wellness/migration/backup tests plus anonymous-session expiry/throttling/budgets, audio bounds/resampling and quick-command negation/quantity boundaries.
- 5 Chrome integration tests passed; access-code field absence is asserted in Settings.
- Render Blueprint API validation returned HTTP 200, valid true. Current service is API-managed; standalone Blueprint is not being synced over the custom private-source bootstrap.
- Android `assembleDebug` passed and APK update installation succeeded.
- Public Render health reports version 0.4.0, NVIDIA voice/text, anonymousSessions true and videoUpload false.
- Local and public Render synthetic speech protocol tests passed: automatic session → Magpie-generated test audio → Parakeet → Progress tool → synthetic client acknowledgement → Magpie spoken receipt.
- Real deployed Chrome fake-microphone test passed: actual AudioWorklet capture/resampling, WebSocket audio, Parakeet transcription, actual Progress navigation and 299,008 audio bytes delivered to browser. No real microphone recording or access code was used.
- Actual Oppo Settings shows zero application-access-code inputs and the NVIDIA voice heading. A text request navigated to Progress with an automatic public session. Phone was returned to Today.

## Retained functionality and data

The v0.3 light UI, CHINNU-AI launch animation, local camera/video pose pipeline, illustrated exercise guides, nutrition diary, recipes, manual health logs, plans, reminders, progress, journal, PDF and backup flows remain. Database v2 is unchanged; no migration/reset was needed for v0.4. Earlier native Android speech and notification scheduling/cancellation checks passed; no test health record/reminder was left in the user's phone.

## Operational limits

- NVIDIA Build keys are testing credentials with quotas and expiration, not unlimited free production inference. Provider and Render usage are separate.
- Speech is English, short-utterance/turn-based. It is not word-by-word streaming ASR or simultaneous full-duplex Gemini Live. Microphone transmission pauses during processing/playback; Interrupt stops speech and resumes listening.
- Coarse energy endpointing, real microphone quality, noisy-gym accuracy, echo and speaker loudness need hands-on testing. Automated speech tests used synthetic audio, not the user's voice.
- In-memory controls: 12 session attempts/IP/minute, 100 app sessions, 60 HTTP actions/session, two voice sessions, ten-minute voice lifetime, 40 turns/session and a default 300 provider-call/day/process budget. Counters reset on restart; persistent production abuse accounting remains future work.
- Render free compute can cold-start. Paid compute is still blocked by missing workspace billing details.
- Local camera, manual logs and Android spoken cues remain available if cloud voice disconnects or quota is exhausted.
- Exercise thresholds are unvalidated prototypes. Native camera/microphone optimization, calibration/progression, expert validation and real wearable/CGM/human-coach/payment/social integrations remain unfinished. See `HEALTHIFY-FEATURE-PARITY.md`.
- Three moderate dev-tool advisories remain in Capacitor CLI's xcode/uuid chain; runtime-critical findings from initial setup were resolved.

See `NVIDIA-VOICE.md` and `README.md` for actual configuration, privacy behavior and verification commands.
