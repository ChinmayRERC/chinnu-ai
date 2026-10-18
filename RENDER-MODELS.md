# Render deployment and model choices

## Current deployment

Render service `srv-dbacm1vbtjjs73eldevg` is deployed at https://chinnu-ai.onrender.com. It hosts the web frontend and HTTP/WebSocket backend. The private source is https://github.com/ChinmayRERC/chinnu-ai. A repository-scoped read-only deploy key supports private-source builds because the workspace's GitHub integration did not grant direct access.

The phone backend is now configured to the Render HTTPS URL. USB localhost remains an optional development route only. Camera inference and Android speech output remain on device.

Automatic Android spoken corrections work independently of the backend. Gemini conversation and agent requests use the Render service. Paid service creation was rejected for missing payment information; the free tier was used. Upgrade to an always-on plan after billing activation to avoid cold-start delays.

## Deploy the prepared backend

1. Source was published to the owner's private repository with explicit authorization. For a fresh deployment, use your own authorized repository and GitHub connection, or the scoped deploy-key route documented in `AGENT-COMMANDS.md`.
2. In https://dashboard.render.com/, choose New → Blueprint and select the repository containing `render.yaml`.
3. Review the `starter` paid-service cost before deployment. Build: `npm ci`; start: `npm run server`; health path: `/health`.
4. Enter `GEMINI_API_KEY` privately in Render Environment settings. Never put it into the APK, source repository or chat.
5. Set `APP_ACCESS_CODE` or retrieve the Blueprint-generated value. This is a demo access gate, not production account authentication.
6. Retain the currently tested `GEMINI_LIVE_MODEL`, or choose another model supported by the API project. `GEMINI_VOICE` can select a provider-supported voice (default Aoede).
7. Wait for `/health` to return HTTP 200 and `voiceConfigured: true`.
8. On the phone: Settings → Backend URL → `https://YOUR-SERVICE.onrender.com`; enter the service's application access code; Save; Test backend.
9. Open a practice, enable the microphone with consent, and test a conversation. Once deployed, USB and the Mac are no longer required for cloud voice.

For automated deployment, add `RENDER_API_KEY` privately to the ignored `.env` and authorize a source repository/image publishing route. Do not share the key in chat.

## Model selection by responsibility

| Responsibility | Recommended now | Open-source/open-weight option | Deployment judgment |
|---|---|---|---|
| Real-time joint locations and angles | Bundled MediaPipe Pose Landmarker Lite | MediaPipe/BlazePose | Keep on device: predictable latency and no video transfer. Larger generic vision models do not replace angle estimation. |
| Natural two-way conversation | Gemini Live native audio (already transport-tested) | Separate STT + small LLM + TTS pipeline | Gemini requires API usage billing; Render hosts the gateway, not Gemini weights. |
| Repeated immediate corrections | Native Android TextToSpeech | OS-selected local speech engine | Implemented. No Render dependency; uses installed phone voice, not Gemini's voice. |
| More natural self-hosted speech output | Optional future Kokoro-82M service | `hexgrad/Kokoro-82M`, Apache-2.0 weights | Good CPU candidate for short cues. Benchmark latency and RAM on a dedicated service; do not assume it fits 512 MB. Not deployed/integrated yet. |
| Speech recognition without proprietary API | Optional future faster-whisper | Whisper tiny/base/small through CTranslate2 INT8 | CPU-capable. Start with tiny/base for experiments; accuracy, languages and real-time speed need testing. Not deployed/integrated yet. |
| Self-hosted text assistant | Optional future quantized small instruct model | llama.cpp with a suitably licensed small model | CPU works, but model size/context/concurrency dominate RAM and latency. Runtime MIT license does not determine weights' license. Not deployed/integrated yet. |
| Session planning and explanation | Existing Gemini text endpoints | Small LLM through an authenticated API | Proposals must remain constrained by the local exercise engine. Current app does not apply cloud-generated plans. |
| Selected food-photo estimate | Gemini image-capable text model with separate photo consent | A separately hosted multimodal model could replace it | v0.3 implements single-photo review; no automatic logging or exercise-video upload. Image estimates are unverified and must be edited/confirmed. |

## Budget reality

The current public Render price page lists approximately $7/month for 512 MB, $25/month for 2 GB, and $85/month for 4 GB services; workspace and external model API charges are separate. Credits may have eligibility/expiry rules; the account balance has not been inspected.

A small gateway plus an external audio provider is the first choice for reliability. A 512 MB service should not be treated as a GPU machine or an all-in-one ML server. The public pricing reviewed lists CPU/RAM plans; GPU access has not been verified for this account.

Deploying several independent models can exhaust a $50 hosting balance quickly and introduce multiple latency stages. Evaluate one additional model at a time with measured first-audio latency, steady throughput, peak memory and actual billed usage. Running open weights does not make infrastructure free.

## Tests completed for the voice update

- Native Android speech plugin compiled and installed on Oppo A5 2020 / Android 11.
- Android speech engine accepted a test cue. Actual speaker loudness/quality is a user check.
- Phone WebView reaches the local backend: HTTP 200, voiceConfigured true.
- Updated Gemini relay produced correction audio from a labeled synthetic measured deviation. This was not a real-person movement test.
- Eleven unit tests and two Chrome integration tests passed, including repeated-cue cooldowns, low-confidence behavior, URL restrictions and actionable disconnected-USB error.

## Sources reviewed

- Render plans: https://render.com/pricing
- WebSockets: https://render.com/docs/websocket
- Kokoro model card: https://huggingface.co/hexgrad/Kokoro-82M
- faster-whisper, CPU INT8 and benchmarks: https://github.com/SYSTRAN/faster-whisper
- llama.cpp runtime and hardware backends: https://github.com/ggml-org/llama.cpp

Upstream benchmark claims are not measurements of this app or a Render instance.
