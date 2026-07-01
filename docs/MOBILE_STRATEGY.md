# Mobile Strategy

## Recommendation: PWA-first, then native (React Native) when justified

| Option | Verdict |
|---|---|
| Web only | Insufficient — no install, no push, weak retention, no GPS-dwell background. |
| **PWA (now)** ✅ | Installable, offline shell, add-to-home-screen, web-push-capable, zero app-store friction. Ships from the same codebase today. |
| Native iOS/Android (later) | Justified once retention + push + camera/GPS-dwell demand it. React Native/Expo reuses the React skills + the headless service layer + Truth API. |

### Why PWA first
- The product's core loops (feed, search, contribute, share) are all web-deliverable.
- Fastest path to an installable, notification-capable app with no store review.
- The service layer is already headless + provider-abstracted, so a later native shell consumes the same API/domain logic.

### What shipped (this PR)
- `manifest.webmanifest` (name, icons, standalone display, theme, app shortcuts to Feed/Search/Contribute).
- `sw.js` service worker — **network-first for navigations** (never pins a stale build), cache-first for static assets, offline fallback. Registered in production only.
- Mobile/theme/apple meta + maskable SVG icon.

### Follow-ups (assets/infra, not blockers)
- Add PNG icons (192/512) for maximum install-prompt compatibility (Chrome prefers PNG). SVG works broadly today.
- **Web push** notifications (the retention lever) — wire to the existing `notification` table once a push provider/VAPID keys are chosen (vendor decision).
- Evaluate React Native/Expo shell when native camera capture + background GPS-dwell verification become priorities.
