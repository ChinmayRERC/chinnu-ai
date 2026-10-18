# Agent decision timeout fix · backend v0.4.1

## Observed problem

The reported provider output was `[ERROR: Agent failed (Function processsingleitemagent timed out after 90.0 seconds), API failed (API request returned None after all retries)]`.

The old adapter trusted a successful HTTP response's completion content and could treat a provider failure string as assistant text. It also had a single decision model, no distinct-model fallback, and insufficiently explicit page routing for water/sleep logs.

## Structural fix

- Provider-envelope validation and bounded request ownership moved to `server/model-client.ts`.
- Decision primary: `nvidia/nemotron-3.5-super-vl-120b-a12b`.
- One fallback: `nvidia/nemotron-3-super-120b-a12b`.
- Thinking off, non-streamed decisions, 512-token action output, parallel tool calls disabled.
- 8-second primary attempt; up to 10-second fallback; 19-second overall deadline, including response-body reading.
- No repeated same-model loops. Client cancellation does not start a fallback.
- HTTP-200 error text, empty/None envelopes, unrecognized tools, malformed/invalid actions and claims of completed actions without tools are rejected before execution.
- Fallback consumes a second provider-budget unit; existing app-side validation and confirmations remain.
- If decision service is unavailable, HTTP gives a concise 502 and voice can speak a short failure without terminating its whole conversation. No raw provider failure or reasoning text is presented as an answer.
- Page meanings are described at the owning action schema and in the agent prompt: water/sleep/weight logs belong to Health, not Today.

## Verification

- Existing credential lists models and successfully invokes both selected endpoints. Catalog presence alone was not accepted as proof: several smaller entries returned account-specific 404s.
- Full app contract, non-quick paraphrase “Could you take me to the screen where I can log my sleep and water?”: primary returned `navigate/Health`, HTTP 200, about 933 ms.
- Deliberately nonexistent primary, same full contract and request: the real fallback returned `navigate/Health`, HTTP 200, about 1,441 ms.
- Regression tests cover the exact reported error string, HTTP-200 provider failures, invalid tools, empty responses, cancellation, no repeated model, bounded timeout fallback and low generation settings.

These measurements are individual checks under current provider conditions, not a guarantee that external APIs always respond within a second. The client deadline bounds waiting, not provider-side inference cancellation or billing.

Production deployment `dep-dbafoteq1p3s73bgp2l0` is live. The same paraphrase returned HTTP 200 and executed Health navigation in an isolated browser in ~1,450 ms. A public voice connection requested Health, received an explicit synthetic tool result, then generated 133,120 PCM bytes of spoken receipt. Both-failure recovery was verified locally: the friendly failure did not close the voice session and a subsequent quick command worked.

This is a backward-compatible server patch. Existing v0.4 APK/browser clients can use it without re-entering credentials or reinstalling; refresh the browser for up-to-date assets if needed. Magpie and Parakeet speech providers are unchanged.
