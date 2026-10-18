# NVIDIA voice and automatic app sessions · v0.4

## User experience

No API key or application access code is requested from users. The app creates a short-lived session automatically and uses the same Render URL for text, speech and selected-photo requests. Operator credentials remain on Render. Microphone/photo consent remains explicit.

The operator can use one `NVIDIA_API_KEY` for the hosted services. Both supplied credentials were valid for the text catalog; a single credential was additionally tested against both speech services. No credential value is documented here or included in the APK/source.

## Verified provider capabilities

- **Magpie:** gRPC `RivaSpeechSynthesis` at `grpc.nvcf.nvidia.com:443`, function `877104f7-e885-42b9-8de8-f6e4c6303969`. The config lists `Magpie-Multilingual.EN-US.Aria.Calm`; synthesis is mono PCM16 at 22,050 Hz.
- **Parakeet:** gRPC `RivaSpeechRecognition`, function `d3fe9151-442b-4204-a70d-5fcc597fd610`. The config exposed `parakeet-tdt-0.6b-en-US-asr-offline`, English only. Short finalized utterances are submitted using Recognize; this is not a word-by-word streaming recognizer.
- **Nemotron decisions (backend v0.4.1):** primary `nvidia/nemotron-3.5-super-vl-120b-a12b`, fallback `nvidia/nemotron-3-super-120b-a12b`. Thinking is disabled, decision output is capped at 512 tokens, and the entire decision has a 19-second deadline (8-second primary attempt, up to 10-second fallback). Both full-contract tests returned the correct Health action: primary about 0.9 seconds, forced-failure fallback about 1.4 seconds. These are individual observations, not latency guarantees. The earlier lightning model is no longer primary.
- **Vision:** `nvidia/nemotron-3.5-super-vl-120b-a12b` accepted a synthetic image and returned a description. Actual food-image accuracy is not established; nutrition estimates always require review.

## Pipeline

```text
Microphone permission + cloud consent
  -> local PCM16 16 kHz capture
  -> short utterance with coarse energy/silence endpointing (max 12 s)
  -> Parakeet Recognize
  -> fast explicit-command router OR Nemotron tool call
  -> app validates and executes action
  -> actual app result
  -> Magpie voice receipt
```

During processing/playback microphone transmission pauses to reduce echo. **Interrupt · listen** cancels the current cloud job and playback. This is turn-based speech, not simultaneous Gemini Live or background always-listening behavior. Coarse endpointing is not a breathing/emotion detector and needs real noisy-gym testing.

Immediate measured form cues can also use native Android TTS without internet. Camera/workout videos stay local. Cloud recordings, text requests, requested app results and selected food images are subject to NVIDIA's terms; Chinnu intentionally does not log or persist their content.

## Anonymous-session controls

- Random short-lived server token, cached by the client (no permanent key in browser/APK).
- 12 session-creation attempts/IP/minute; 100 active session records maximum.
- 60 authorized HTTP requests/session; 2 concurrent voice sessions.
- Voice lifetime 10 minutes, maximum 40 turns, bounded input/output message sizes and 12-second input segments.
- Default 300 provider calls/day/process; operator-configurable. In-memory counters reset on restart. Production distribution needs persistent quota accounting and provider-side limits.
- No unrestricted shell or cross-app automation. Existing confirmation and screening restrictions remain enforced locally.

NVIDIA Build credentials are testing credentials with provider quotas/expiration. Render credits do not pay NVIDIA charges, and testing access is not a promise of unlimited free production usage. The service remains on Render free compute, which can cold-start.

## Operator configuration

Use `.env.example` for local development. In Render configure `NVIDIA_API_KEY`, `TEXT_PROVIDER=nvidia`, `PUBLIC_APP_SESSIONS=true` and the documented model/voice fields. `scripts/configure-nvidia-render.mjs` updates only these individual env keys and never prints values. Legacy Gemini env vars may remain for rollback, but the deployed primary text/image/speech configuration is NVIDIA.

`render.yaml` contains no secrets and was validated with Render's Blueprint API. The existing API-created service uses the private-source bootstrap described in `AGENT-COMMANDS.md`, so that service's settings remain the operational source of truth; the standalone Blueprint is for a normal connected repository deployment.

## Verification commands

```sh
node --env-file=.env --import tsx scripts/verify-nvidia.ts
node --env-file=.env --import tsx scripts/verify-voice-flow.ts
# After deploy:
node --env-file=.env --import tsx scripts/verify-voice-flow.ts https://chinnu-ai.onrender.com
node --env-file=.env --import tsx scripts/verify-browser-voice.ts
```

These tests use generated synthetic test speech, never an unconsented microphone recording. End-to-end local verification passed: Magpie generated “Open my progress”, Parakeet transcribed it, the server requested a Progress action, the test client acknowledged it, and Magpie returned a spoken receipt.

The same protocol test passed against the public Render service. A separate real Chrome browser test used a generated WAV as a fake microphone: the actual AudioWorklet path sent speech, Parakeet transcribed it, the app navigated to Progress, and audio was delivered to browser playback. No credential/access code was entered into that test client. The Oppo v0.4 Settings screen and text navigation were also checked without an access-code input. These tests do not establish recognition quality for the user's real microphone, accent or noisy gym.

Source protocol notices are in `server/protos/`. HTTP/model interfaces and hosted function IDs can change; retest rather than assuming a catalog listing proves speech access.

## Provider timeout fix

`server/model-client.ts` owns bounded requests and validates the provider envelope. It rejects `[ERROR: Agent failed ... processsingleitemagent ...]`, empty/None completions, non-success statuses and invalid app tool arguments. A provider error disguised as HTTP 200 is never spoken as a normal assistant response. At most two distinct models are tried; a user interrupt stops the request rather than triggering another model. Each fallback consumes another provider-budget unit. Content-free timing/model outcome logs support diagnosis without recording user text, keys or audio.

The large image-reasoning example (thinking enabled, 16,384 tokens and streaming reasoning) is not used for action selection. Selected food photos remain a separate, consented vision request. If both decision models are busy, no proposed action is executed; the voice gateway speaks a concise failure and continues listening when its speech provider remains available.
