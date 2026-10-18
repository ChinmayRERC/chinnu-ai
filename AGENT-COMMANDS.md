# Chinnu AI app-agent commands

Chinnu uses natural-language tool calling, not exact keyword matching. These examples describe the supported in-app action scope, similar to familiar assistant commands. This Android application does not integrate Apple's Siri or control unrelated apps.

## Navigation and instructions

- “Open my progress.”
- “Go to my journal.”
- “Open settings.”
- “Show me how to do a squat.”
- “Show the Warrior II guide.”
- “Open Mountain pose.”
- “What should I practice today?”

Guides include original schematic step images, animated playback, written instructions, camera setup and cautions. Animation is a sketch, not filmed trainer footage. All threshold/illustration references require qualified expert review.

## Camera, videos and session controls

- “Open the camera.” (opens setup; tap the camera button for permission)
- “Analyze a video.” (opens the local picker flow; tap to choose a file)
- “Pause my practice.”
- “Resume.”
- “Finish this session.”
- “Stop, that hurts.”
- “Mute spoken coaching.”
- “Turn spoken coaching on.”
- “How many reps have I done?” / “Explain my current measured form.”

Open an exercise before requesting camera/video input. Finish the current session before switching exercises or leaving the trainer; the agent will not silently discard a recording. Raw camera frames and selected videos remain local.

## Habits and progress

- “Open Nutrition.” / “Open Health.” / “Open Plans.” / “Open More.”
- “Log 250 milliliters of water.”
- “Record my weight as 70 kilograms.”
- “Log 7 hours of sleep.”
- “Add 500 additional steps.”
- “Search for banana in my food catalog.” Then “Log 100 grams of banana as a snack.”
- “Show my daily health summary.”
- “Remind me to take a movement break at 18:00 daily.” (in-app reminder; Android notification scheduling requires its on-device button)

- “Start the breathing timer.”
- “Stop the breathing timer.”
- “How many real sessions have I completed?”
- “Show my latest report.”
- “Log a check-in: energy 3, soreness 2, sleep 7 hours, mood okay.”
- “Export my timeline.” (on-device confirmation)
- “Delete my local data.” (on-device confirmation)

The agent asks for missing check-in values rather than inventing them. Health notes/results requested through cloud agent tools are sent to the model only as part of that request. Deletion disconnects the microphone. Conservative-mode exercise restrictions apply equally to voice, text and touch.

Food logging requires an exact catalog ID, meal and gram amount. Ask for quantity if absent. Units are canonical: water ml, weight kg, sleep hours, steps additional count, waist cm, activity minutes and glucose mg/dL manual note. Do not infer quantities, nutrition, sensor connection or treatment. Food-photo selection and cloud-image consent are separate on-device actions, not background agent access.

## Tool execution protocol

`src/agent/actions.ts` is the local validation boundary. Gemini emits an `app_action` or `control_session` tool request. The backend validates and forwards it; the device executes an allowed action and returns an actual result. Only then does the voice model receive the tool response. Unsupported, failed, timed-out or cancelled actions are returned as such.

The text-agent endpoint returns schema-validated proposed actions; the client executes them locally and displays actual outcome messages. An action audit in the agent panel shows what actually happened.

## Permission and capability boundaries

- No shell execution, arbitrary URLs, phone-wide automation, credential changes or treatment recommendations.
- No automatic camera/microphone consent or bypassing file-picker gestures.
- No diagnosis, force/load assessment or breath detection.
- No background microphone: cloud voice disconnects when the app is hidden.
- The app can show an exercise guide without claiming it verified the user's pose.

## Deployment

App/backend: https://chinnu-ai.onrender.com

Source: private https://github.com/ChinmayRERC/chinnu-ai

Render free tier was used because the paid service creation was rejected for missing payment information. Free-service wake-up may take about a minute; the client allows a bounded 65-second connection request. An always-on paid instance requires billing activation.

Render's GitHub integration could not fetch the private repo directly. The service uses the official public Render Express example only as a bootstrap, then clones the private Chinnu repo using a repository-scoped read-only SSH deploy key and pinned GitHub host keys. Application code is built from `main`. No general GitHub access token is stored on Render. Autodeploy is disabled; trigger deployments explicitly after publishing changes.

Render hosts the web frontend, model/WASM assets, HTTP agent API and WebSocket voice gateway. Gemini inference runs at the provider; local pose inference remains on the phone. The APK is built locally, not on the 512 MB Render runtime.
