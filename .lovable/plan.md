
# Face Recognition Attendance — Implementation Plan

A fully client-side face recognition system using **face-api.js** (free, MIT licensed, runs in-browser via TensorFlow.js). No images are stored — only a 128-float "face descriptor" per user is saved in the database. Matching also happens in the browser; the server only stores descriptors and receives the final attendance row.

## 1. Backend (Lovable Cloud)

One migration adds face enrollment storage and an attendance-method tag.

**`profiles` table — new columns**
- `face_descriptor` (`jsonb`) — the averaged 128-float Master Face Descriptor (null until user enrolls).
- `face_enrolled_at` (`timestamptz`) — when enrollment was completed.

**`attendance` table — new column**
- `method` (`text`, default `'qr'`) — values: `'qr' | 'face' | 'manual'`. Lets reports distinguish how a row was captured. Existing rows default to `'qr'`.

**`events` table — new column**
- `attendance_mode` (`text`, default `'qr'`) — `'qr' | 'face'`. Chosen at event creation, decides which UI organizers see.

RLS stays the same (existing INSERT policy on `attendance` already allows club admins to insert, which is exactly who runs the scanner). No new policies needed — face matching happens client-side, so the server just receives a normal authenticated insert.

## 2. Models hosting

Download these weight files from the official `face-api.js` repo (`/weights`) and commit them to `public/models/` so they're served from the app origin (no CORS, free):
- `ssd_mobilenetv1_model-weights_manifest.json` + shard
- `face_landmark_68_model-weights_manifest.json` + shard
- `face_recognition_model-weights_manifest.json` + shard

Approx total ~6 MB, loaded once and cached by the browser.

## 3. Shared face utilities — `src/lib/face/`

- `faceApiLoader.ts` — singleton that lazy-loads the three nets from `/models`. Exposes `ensureFaceModels()` returning a `Promise<void>`. Guarantees we only download weights once per session.
- `faceDescriptor.ts`
  - `computeDescriptorFromImage(img: HTMLImageElement | HTMLVideoElement)` → `Float32Array | null`.
  - `averageDescriptors(arr: Float32Array[])` → `Float32Array` (element-wise mean; the "Master Descriptor").
  - `serialize(d)` / `deserialize(json)` for JSONB round-trips.
- `useFaceMatcher.ts` — React hook: takes `Array<{ userId, name, descriptor }>` and returns a memoised `faceapi.FaceMatcher` with distance threshold **0.45**.

Dependencies: `bun add face-api.js`. No native build steps needed.

## 4. Phase 1 — Face enrollment in Profile (Personal mode)

New component `src/components/profile/FaceSetupCard.tsx`, rendered inside `src/pages/Profile.tsx` under a "Face Setup" Neo-Brutal card.

UI states:
1. **Not enrolled** — three numbered photo slots (1/2/3). Each slot has two buttons: **Snap** (opens inline webcam preview) and **Upload**. Slots show a preview thumbnail once filled.
2. **Processing** — after all three are captured, click **Generate Face ID**. We run `computeDescriptorFromImage` on each, validate that a single face was detected in every photo (otherwise show a Neo-Brutal error and ask to redo that slot), then `averageDescriptors`.
3. **Enrolled** — green "Face ID active" badge, timestamp, and **Re-enroll** button (resets and overwrites the JSONB).

On save: `supabase.from('profiles').update({ face_descriptor: Array.from(master), face_enrolled_at: new Date().toISOString() }).eq('user_id', user.id)`.

Privacy copy: a small note under the card explains "Your photos are processed locally in your browser and never uploaded. Only an anonymous mathematical fingerprint is saved." No photos ever touch the server or storage buckets.

## 5. Phase 2 — Event creation: pick attendance method

Edit `src/pages/CreateEvent.tsx`:
- Replace the existing "QR code generation" step with a final **Attendance Method** toggle (Neo-Brutal segmented control): **QR Code** | **Face ID**.
- Everything before it (name, type, dates, time, location, participants) stays unchanged.
- On submit, write `attendance_mode` along with the existing payload.
  - If `qr`: keep current `qr_token` generation + post-create QR display screen exactly as today.
  - If `face`: skip QR generation, show a "Face ID attendance enabled — open scanner from event card" success screen with a **Open Scanner** button that navigates to `/events/:id/face-scan`.

The event card / event detail dialog gets a small badge showing the chosen mode ("QR" or "Face ID").

## 6. Phase 2 — Live scanner: `FaceScanner.tsx`

New route `/events/:eventId/face-scan`, gated to club admins (president / vice_president / secretary) of the event's club, mirroring the existing QR management access rule.

Component layout (Neo-Brutal: `#F4EFE7` page bg, 2px black borders, hard `4px 4px 0 #111` shadows, Space Grotesk):

```text
+---------------------------------------------+
|  ← Back   Event name           [● LIVE]     |
+---------------------------------------------+
|                                             |
|        [   <video> webcam feed   ]          |
|        [  overlay: scanning box  ]          |
|                                             |
|  Status: Scanning…  |  Matched today: 12    |
+---------------------------------------------+
|  Recently marked: Aarav S. • Priya K. • …   |
+---------------------------------------------+
```

Lifecycle:
1. On mount: `ensureFaceModels()`, then `getUserMedia({ video: { facingMode: 'user' } })` into a hidden `<video>` element; show "Allow camera" error UI on rejection.
2. Fetch eligible members for the event's club (respecting `access_type`): `club_members` join `profiles` where `face_descriptor IS NOT NULL`. Build `FaceMatcher` once with threshold `0.45`.
3. Pre-fetch today's `attendance` rows for the event into a `Set<userId>` so re-detections are silently ignored.
4. **Scan loop** (`setInterval` 500 ms, cleared on unmount, paused while a match is being processed):
   - `faceapi.detectSingleFace(video, new TinyOptions).withFaceLandmarks().withFaceDescriptor()`
   - If detected: `matcher.findBestMatch(descriptor)`.
   - If `match.label !== 'unknown'` AND `match.distance < 0.45` AND user not already marked:
     - Insert `{ event_id, student_id: matchedUserId, method: 'face', status: 'present' }` into `attendance`.
     - Add to local marked-set.
     - Trigger the **success overlay**: full-card green flash (`#22C55E`) with a big check + "Marked: <Name>", auto-dismiss after 1.8 s, scanner paused during that window.
   - On duplicate-key error or unique-violation: ignore silently.
5. On unmount: stop all media tracks and clear interval.

Performance notes: SSD MobileNet at 500 ms intervals on a single face is comfortably real-time on a laptop; the matcher is initialised once.

## 7. Existing flows that stay untouched

- QR flow (`MarkAttendance.tsx`, QR generation in `CreateEvent.tsx`, QR management UI) continues to work for events created with `attendance_mode = 'qr'`.
- Attendance history, exports, dashboards, feedback, audit log all read the same `attendance` rows — they just get an extra `method` column that reports can optionally surface.
- All design tokens, mobile layouts, navigation rules, and the existing Neo-Brutalism style are reused; no new fonts or colors.

## 8. Technical summary (for reference)

```text
profiles.face_descriptor : jsonb   // number[128]
profiles.face_enrolled_at: timestamptz
events.attendance_mode   : 'qr'|'face'  default 'qr'
attendance.method        : 'qr'|'face'|'manual'  default 'qr'

threshold = 0.45    interval = 500ms    models in /public/models
```

## 9. Out of scope (explicit)

- No server-side face matching, no edge function for recognition — everything runs in the browser, keeping it free.
- No storage of training photos; only the averaged descriptor.
- No biometric data export endpoints.
- No changes to manual attendance, feedback, reporting columns, or auth.

---

Approve this plan and I'll implement it in the order: migration → models + utilities → Profile enrollment card → CreateEvent toggle → FaceScanner page + route.
