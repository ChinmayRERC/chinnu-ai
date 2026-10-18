# HealthifyMe research → original Chinnu AI v0.3 features

Provider update: v0.4 retains these wellness features but uses NVIDIA speech/text/vision through automatic app sessions. Earlier Gemini references below record the v0.3 implementation. No API key or access code is requested from users. See `NVIDIA-VOICE.md`.

## Evidence boundary

Target: `/Users/chinmaya/Downloads/naturalgym/Healthifyme_v31.5_1791393326_latestmodapks.com.xapk`

SHA-256: `559e918e73a0b89efcec46a591c17bd2e265461dfea10a90ba5dc4eff9e0a5ff`.

REA reinspection: `ev_237c2091c01f6c8c75286983aa2ce0761398b02c22942625f0ad307fd2c13864`; inventory: `ev_90a686d1923c122242137b2d316e4d83410bac6db2e57db843216c6ac33b1976`.

Base APK SHA-256: `b2dc63a44d1cf022262dd4207afad47ee55280addd51eba7b0c9690b661464b0`.

Previous base inspection: `ev_e8cecb78512bde7decae100bd2a467bcca10e04504248e6eedfe65a613a3d997`.

The earlier detailed artifact report remains in `../healthifyme-xapk-feature-technical-report.md`. This pass reused its authenticated identities and rechecked focused resource paths. Archive entries, resource names and DEX strings are static evidence, not proof of execution or account availability. JADX/Apktool decompilation was not performed. No HealthifyMe code, art, data, branding, credentials or services were copied into Chinnu.

## Implementation matrix

| HealthifyMe packaged feature category / representative evidence | Chinnu implementation | Status and limits |
|---|---|---|
| Dashboard, goals, insight cards (`menu_dashboard.xml`, tracker layouts) | Original light Today dashboard, wellness totals, practice recommendations, feature navigation | Working from local logs; no fabricated health score |
| Food search and logs (`activity_search_food.xml`, `activity_food_logs.xml`) | Searchable local starter catalog, custom foods, per-meal diary, dates, portion edit/delete | Working; 26 rounded generic examples, not the proprietary large database |
| Liked/recent foods (`activity_liked_foods.xml`, `recently_tracked_food_header.xml`) | Favorites and logged meal history | Favorites and diary working; dedicated recent-food shortcut not implemented |
| Portions and PFCF (`bottom_sheet_food_quantity_picker.xml`, `fragment_pfcf_foods.xml`) | Gram portions, calories/protein/fat/carbs/fiber totals | Working arithmetic; nutrition estimates require label verification |
| Micronutrients (`layout_micronutrient_item.xml`) | Optional sodium/calcium/iron label fields and known-data coverage totals | Working for entered labels; no invented missing values or deficiency diagnosis |
| Recipes (`activity_recipe_search.xml`, `activity_recipe_detail.xml`) | Six original searchable recipes, ingredient nutrition, steps, diary logging | Working starter collection; no claimed catalog parity |
| Food photos/Snap (`layout_dashboard_food_snap_component.xml`, `auto_snap.apk`) | User-selected, explicitly consented food-photo estimate through Gemini, review/edit before save | Implemented; no background gallery scanning or automatic meal logging; cloud provider terms apply |
| Barcode/product info (`activity_food_info.xml`, barcode SDK identifiers) | Manual barcode-digit lookup through Open Food Facts and reviewable product label | Working network-dependent lookup; no native camera barcode scanner |
| Diet/meal plans (`activity_diy_diet_plan.xml`, `activity_personalized_plans.xml`) | Editable meal-plan builder, selected foods/grams/meal types, pause/resume/delete, log meals after confirmation | Working user-created plans; no clinical diet prescription or automatic deficits |
| Workout/yoga plans (`activity_diy_workout_plan.xml`, `activity_yoga_plan.xml`) | Exercise search, camera guides, user-created sets/reps/holds, saved routines and completion dates | Working; set targets are notes, not a fully automated multi-exercise circuit |
| Ria assistant (`vh_ria_diet_plan.xml`, assistant layouts) | Chinnu text/voice app agent with actual tool results | Working cloud integration plus offline measured spoken coaching; not HealthifyMe Ria |
| Human diet/fitness/yoga coaching, calls and scheduling | Coach handoff export and honest integration requirements | Not connected; no practitioners, bookings, paid consultations or call service available |
| Weight/measurements (`activity_weight_tracker.xml`, `activity_manual_weight_log.xml`) | Dated kg weight and cm waist logs, history and chosen weight goal | Working manual journal; no smart-scale/body-composition inference |
| Water (`activity_water_tracker.xml`, `activity_water_goal_edit.xml`) | Manual ml additions, daily totals, optional chosen goal and reminders | Working; no automatically prescribed intake |
| Sleep (`activity_sleep_tracker_main.xml`, `activity_sleep_track_log_entry.xml`) | Sleep-episode duration log, daily totals and optional target | Working manual data; no wearable sleep staging |
| Steps and activity (`layout_steps_tracker_progress.xml`, integration namespaces) | Additional-step counts and activity-minute diary | Working manual data; no automatic pedometer or calorie-burn claim |
| Intermittent fasting (`res/menu/intermittent_fasting_menu.xml`) | Neutral start/stop time-since-meal journal | Working without a target; blocked by flagged screening; not a fasting program |
| CGM/metabolic features (`cgm_tracker.xml`, `activity_metabolic_score.xml`) | Manual glucose reading notes, unit/source labeling | Manual journal only; no sensor sync, glucose prediction, metabolic score or clinical interpretation |
| Health Connect/Fit/Samsung/Fitbit/Garmin/scale SDKs | Integrations screen lists exact prerequisites and current disconnected state | Not connected; requires native adapters, provider registration, permission and device testing |
| Reminders (`activity_reminder_v2.xml`, `fragment_water_reminder.xml`) | In-app due banners plus opt-in Android daily local notifications | Working scheduling implementation; inexact timing and OS/battery restrictions apply; no server push |
| Weekly reports (`layout_weekly_report_*.xml`) | Real seven-day food/water/sleep/steps/session table, PDF timeline and JSON export | Working; unknown/unlogged data is marked; no causal or clinical conclusions |
| Challenges/streaks/levels (`activity_challenge_progress.xml`) | Private real-data three-day logging/movement challenges, streaks and routine completion | Working private milestones; no fake public rankings, prizes or weight-loss contests |
| Community, group chat, teams, feeds, referrals | Clear disconnected status; user-controlled report export | No multi-user account, identity, moderation or social backend |
| Plans/subscriptions/payments (`activity_plan_detail.xml`, Stripe/Juspay assets) | Saved free user routines; no paywalls | No billing products, premium trials, payment capture or subscription entitlements |
| Profile/preferences | Name, goal, experience, height; diet/allergy notes and own numeric goals | Working locally; no phone OTP/login, account merge or cloud profile sync |
| Help/support | Local FAQ, privacy explanation, non-content diagnostic export | Working local help; no live support personnel or ticket server |
| Backups | Versioned JSON export and validated replacement import | Working with row/unit/range limits; no API credentials/media in backup |
| UI/launch | Original soft light theme, typography, responsive cards, native light splash and animated CHINNU-AI reveal | Implemented; respects reduced-motion preference |
| Widgets/NFC/background Auto Snap | Integration status only | Requires additional native implementation; not represented as active |

## Data and trust decisions

- Existing IndexedDB v1 data migrates to v2 without losing profile/session/journal records.
- Food logs store a nutrition/source snapshot, so later catalog edits do not rewrite old diary entries.
- Recipes and multi-food meal plans log atomically; a missing ingredient aborts the whole operation.
- New health/meal data are included in export, backup, restore and delete-all. Native reminders are cancelled during deletion/restore.
- Food photos are not persisted; selected compressed photos are sent only after separate consent. Exercise video never uploads.
- Photo estimates cannot reliably establish portions, hidden ingredients or allergens. User review is required before creating/logging a food.
- No personal progress, nutrition totals or social activity is seeded as real data.
- All camera alignment references remain expert-validation-pending. This expansion does not make the app a medical device.

## Work still needed for full service parity

Real accounts/social features, human coaching operations, billing and entitlements, wearable/CGM adapters, a licensed/comprehensively sourced food database, large recipe/media content, camera barcode scanning, native widgets/NFC, local camera/audio optimization and expert exercise validation remain independent projects. They cannot be recovered by copying SDK names or an APK's resource inventory. Chinnu exposes this status instead of claiming complete HealthifyMe parity.
