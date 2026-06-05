# TradieTrack Lite — Visual & UX Overhaul

This document explains the design decisions behind the v2.1 visual
overhaul. Read it before changing tokens, components, or screens so the
premium feel is preserved.

## 1. Brand positioning

> A clean pocket notebook for tradies, rebuilt as a premium mobile app.

The product is not a SaaS dashboard, not a generic contractor app, and
not a toy. Every choice below is in service of feeling like a serious
mobile tool that a tradie can rely on at a job site.

## 2. Brand mark and app icon

- A precise geometric **T monogram** in soft warm white
  (`#F4EFE4`) on deep warm charcoal (`#1A1814`), with a small
  restrained status dot in utility green (`#7DBDA9`).
- Avoids every cliché the brief warned against: no hammer, no helmet,
  no busy toolbox, no cartoon mascot, no generic checklist.
- The status dot doubles as a brand cue: green = on track, the same
  green used in the app's accent palette. The mark is constructed, not
  illustrated — it reads as a productivity tool, not a decoration.
- iOS adds its own rounded mask; Android adaptive icon uses a
  transparent foreground layered over `#1A1814` so the same SVG works
  for both platforms.

## 3. Splash screen

- Deep warm charcoal background (`#131210`) with the same T monogram
  and a single muted accent dot under the wordmark.
- Wordmark "TradieTrack" in tight 800-weight sans, set with negative
  tracking. Tagline "Local jobs. No login." in a muted warm grey, 32px
  below the wordmark.
- The splash is intentionally calm. The transition into the app is
  brief and uninterrupted, so the visual identity carries through.

## 4. Color system

### Light mode

| Token | Value | Use |
| --- | --- | --- |
| `background` | `#F2EEE5` | warm off-white app background |
| `canvas` | `#EAE3D4` | alternate surface band |
| `surface` | `#FBF8F1` | default card |
| `surfaceRaised` | `#FFFFFF` | elevated card / input |
| `surfaceInset` | `#ECE5D3` | sunken input / notice |
| `ink` | `#1A1814` | primary text |
| `text` | `#2A2620` | body text |
| `muted` | `#6B655A` | secondary text |
| `subtle` | `#948D7E` | labels, metadata |
| `accent` | `#1F4F45` | primary action (utility green) |
| `accentInk` | `#0F2A24` | text on accent |
| `amber` | `#A86B1B` | work amber, warnings, overdue |
| `danger` | `#8E332A` | destructive |

The palette is built around warm neutrals with a single restrained
utility-green accent. There is no second brand colour. Amber is
reserved for warnings and overdue states. The accent is used only on
primary CTAs, active filter chips, reminder highlights, and focus
states.

### Dark mode

| Token | Value | Use |
| --- | --- | --- |
| `background` | `#131210` | deep warm charcoal (not pure black) |
| `surface` | `#1E1B17` | card |
| `surfaceRaised` | `#26231E` | elevated card / input |
| `surfaceInset` | `#181613` | sunken input |
| `ink` | `#F4EFE4` | primary text (soft warm white) |
| `accent` | `#7DBDA9` | tuned for dark contrast |
| `amber` | `#D4A268` | tuned for dark contrast |

Dark mode is not an inversion. It is a separately tuned palette that
uses deep warm charcoal surfaces, elevated dark-slate cards, and a
softer, more luminous accent. No pure black, no pure white cards, no
generic gray UI.

### Status colours

Every status (`pending`, `in_progress`, `completed`) has a tuned
`fg`/`bg`/`border` triple in both themes. Status chips and the
JobCard rail pull from this table so colours stay in sync with the
active theme.

## 5. Typography

A custom scale tuned for mobile reading at arm's length and outdoors:

| Token | Size / line | Use |
| --- | --- | --- |
| `display` | 34 / 40 | large headers (rarely used) |
| `title` | 28 / 34 | screen titles |
| `subtitle` | 20 / 26 | section / report titles |
| `cardTitle` | 17 / 24 | job title in a card |
| `body` | 15 / 22 | body copy |
| `bodyEmphasis` | 15 / 22 / 600 | emphasized body |
| `callout` | 14 / 20 | secondary callouts |
| `footnote` | 13 / 18 | metadata |
| `caption` | 12 / 16 | inline labels |
| `micro` | 11 / 14 / 700 / 0.6 tracking | section eyebrows, status chips |
| `mono` | 14 / 20 / tabular-nums | durations, codes |

- Strong tracking on labels (`micro` uses 0.6 letter-spacing and
  uppercase) so eyebrows and chips read as designed, not as defaults.
- Negative tracking on large titles gives the type a confident,
  modern feel.
- `mono` is reserved for time/duration readouts so the column of
  logged time aligns across cards.

## 6. Spacing, radii, elevation

- Spacing scale: `4, 6, 8, 12, 16, 20, 24, 32, 40, 56`
  (`theme/spacing.js`).
- Radii: `xs 6`, `sm 10`, `md 14`, `lg 18`, `xl 24`, `pill 999`.
  Cards use `md`, dialogs use `lg`/`xl`, chips use `pill`.
- Elevation is two-tier (`card`, `lift`). Shadows are colour-tinted
  to `ink` in light mode and pure black in dark mode, and they are
  intentionally subtle. Premium feel comes from restraint, not
  drama.
- Inputs are `52px` min-height; primary buttons `56px`; secondary
  buttons `48px`; icon buttons `44px`. Tap targets stay large enough
  for gloves.

## 7. Theme system architecture

- `theme/tokens.js` — shared design tokens (typography, spacing,
  radii, motion, layout). These do not change between themes.
- `theme/themes.js` — `lightTheme` and `darkTheme` objects, each
  containing its own `colors`, `shadow`, `gradient`, and `status`
  table. Themes are equal in care; dark is not an inversion.
- `theme/storage.js` — persists the user preference (`system`,
  `light`, `dark`) to `expo-file-system` so the choice survives a
  relaunch. Skipped in tests to keep React state deterministic.
- `theme/ThemeProvider.js` — React context that:
  - reads the system colour scheme via `useColorScheme()`,
  - reads/writes the user's preference override,
  - exposes `theme`, `colors`, `status`, `typography`, `spacing`,
    `radii`, `motion`, `layout`, plus `setMode` / `toggleMode` /
    `preference` / `resolvedMode`.
- The `NavigationContainer` is re-wired with React Navigation's
  `DefaultTheme` / `DarkTheme` and a colour override so the navigation
  chrome (background, card, text, border) tracks the active theme.
- The `StatusBar` bar style is updated on theme change.

## 8. Icon system

Icons are an abstraction over `@expo/vector-icons` Ionicons. The
`<Icon name="…" />` component accepts semantic names (e.g.
`add`, `bell`, `camera`, `check`, `play`, `sparkle`, `warning`,
`forward`) and maps them to the right Ionicons glyph. Components
never reference Ionicons directly, so the icon font can be swapped
later without touching screens.

A `BrandMark` component renders the same T monogram as the app icon,
sized to the context (empty states, headers, app store screenshots).
This gives a recognisable visual continuity from the home screen into
the brand surfaces.

## 9. Component library

`components/ui.js` exports the full design system. Everything in the
app is built from these primitives:

- `AppShell` — safe-area wrapper with optional built-in `ScrollView`
  and `refreshControl`.
- `ScreenHeader` — eyebrow + title + subtitle + optional right slot
  (used for status chip / settings button).
- `Section` — eyebrow / title / subtitle + content area; supports
  an "inset" tone for quieter blocks.
- `JobCard` — the job list card. Restrained 3px status rail,
  monogram-style status chip, photo / reminder / logged-time
  metadata, and a pressable surface that respects the active theme.
- `StatusChip`, `ChipButton`, `IconButton` — chip family.
- `PrimaryButton`, `SecondaryButton` — the CTA family. Tones
  (`accent` / `ink` / `danger`) keep the call to action obvious
  without leaking brand colour into other surfaces.
- `FormInput`, `TextArea` — single-line / multi-line inputs with
  helper text, error, left icon, and right adornment slots.
- `SearchBar` — search field with clear button.
- `DateTimePickerRow` — date picker trigger.
- `PhotoGrid` + `PhotoTile` — 3-up photo grid with add / delete /
  preview.
- `ReportActionCard` — dark surface that hosts the share-report CTA.
  Visually weighted to feel like a tool surface, not an ad.
- `UpgradeCard` — the ad-free upsell. Dark when locked, accent-tinted
  when unlocked. One-tap entry point to the ad-free screen.
- `AdContainer` — small "Sponsored" labelled wrapper for the AdMob
  banner. Ads sit on a calm inset surface so they read as a
  container, not as content.
- `LocalStorageNotice` — restrained trust message with a shield /
  warning / info tone.
- `InfoRow` — labelled key/value row with optional action link.
- `StatTile` — small stat card for the dashboard / detail header.
- `RowAction` — single-line action row.
- `Divider`, `EmptyState`, `ThemeToggle` — utility components.

Components consume the theme via the `useTheme` hook and rebuild
their `StyleSheet` against the active theme. This keeps the runtime
overhead trivial and the API clean.

## 10. Screen-level decisions

### Jobs list

- Single `FlatList` with a sticky-feeling header. Section stats
  (Active / Done / Overdue) live as a 3-up `StatTile` row above the
  list.
- Search is always visible; the status filter row sits directly
  beneath it. Both wrap to a second line on small screens.
- Each `JobCard` is a single tap target. A long press opens the
  delete confirmation (preserved from the prior behaviour, useful
  on-site).
- Ad banner appears only when there is at least one job, and only
  once, in the list header — never between cards, never during
  scroll.
- The list footer carries a small "Export a backup regularly" trust
  reminder in `subtle` colour.
- Empty state shows the brand monogram, copy that explains the
  local-first promise, and a primary "Add first job" CTA.

### Create job

- Two sections: **Work** (name, address, notes) and **Customer**
  (name, phone, email). Address is required because reports and
  reminders depend on it.
- Inputs use left icons (location, phone, email) for quick scan
  recognition. Errors are conversational, not legalistic ("An
  address keeps the job tied to a location.").
- The save action is a full-width primary button; the cancel is a
  full-width secondary button beneath it. No modal, no navigation
  drawer.

### Job detail

- Header carries the job name, the address as subtitle, and a
  status chip on the right.
- A 3-up `StatTile` row summarises photos, reminder state, and
  logged time.
- Sections: **Workflow** (status chips), **Job details** (name,
  address, notes), **Customer** (with inline Call / Message / Email
  buttons that appear only when a phone or email is set), **Time
  logged** (start, end, total in a dark `ink` surface), **Photos**
  (3-up grid + take-photo button), **Reminder** (state + set/clear),
  **Report** (`ReportActionCard`), and Save.
- `ReportActionCard` is a dark surface with a PDF badge, three
  metadata dots (Local / Private / Share sheet), and the share
  action. It reads like a tool surface, not an upsell.
- Photo capture is camera-first. The grid includes an "Add" tile
  that opens the camera; a tap on a photo opens a fullscreen
  preview modal with a calm overlay.

### Settings

- Theme is the first section. A `ThemeToggle` provides quick
  light/dark switching, and three `modeChip` pills let the user
  pick `Match system` / `Light` / `Dark`. The currently resolved
  mode is shown in subtle copy beneath.
- A backup row uses a `RowAction` for one-tap local export.
- An `UpgradeCard` (locked or unlocked) sits beneath, so the
  ad-free status is always visible without leaving Settings.
- Privacy and About sections use `InfoRow` for clean key/value
  pairs.
- Version is rendered from `package.json` automatically.

### Ad-free

- Starts with the `UpgradeCard` so the unlock state is visible at
  a glance.
- A "What you get" section enumerates the four privacy promises
  (no subscription, no account, no cloud sync, no ads) so the
  one-time nature is clear.
- Buy and Restore actions are full-width primary / secondary
  buttons at the bottom.

## 11. Ads

- Banner only, only on the Jobs list, only when jobs exist.
- The `AdContainer` keeps the ad inside a labelled inset box so it
  doesn't compete with real content. The "Sponsored" label is
  quietly visible.
- Buy / restore / save / report / delete / create flows never show
  ads.
- AdMob unit IDs come from environment variables; the dev fallback
  to Google's test IDs is preserved.

## 12. Accessibility

- Minimum tap target of `44px` for icon buttons and `52–56px` for
  inputs / primary buttons.
- Status chips include an inner dot in addition to colour so they
  remain distinguishable for colour-blind users.
- Icon buttons accept an `accessibilityLabel` and the default
  `Icon` component falls back to the semantic name.
- The remap of search to a real `TextInput` with a clear button
  gives screen readers the right role.
- Form helpers / errors use a real `Text` element so they are
  spoken by VoiceOver and TalkBack.

## 13. Trust and local-first messaging

- Every screen that handles jobs includes a `LocalStorageNotice`
  explaining that data stays on the device.
- The jobs list footer carries a small "Export a backup regularly"
  hint in `subtle` colour.
- The PDF report footer reads "On this device · No account
  required" so the local-first promise travels with the report.

## 14. Asset generation

- The icon, adaptive icon, and splash are all generated from
  sources in `assets/*-source.svg`.
- `npm run build:assets` (or `node scripts/build-assets.js`) renders
  the SVGs to PNG using `@resvg/resvg-js`. The script produces:
  - `assets/icon.png` (1024×1024, iOS + Android)
  - `assets/adaptive-icon.png` (1024×1024, Android adaptive foreground)
  - `assets/splash.png` (1242×2436, iPhone-X proportions)
  - `assets/icon-512.png` (512×512, optional store preview)
- Rerun the script whenever the source SVGs change.

## 15. Test changes

- `frontend.test.js` was rewritten to:
  - wrap screens in `ThemeProvider` (the new hook-based API),
  - mock `@expo/vector-icons` so the test renderer doesn't try to
    load the icon font,
  - assert the new status labels (`To do` / `In progress` / `Done`),
  - assert the new report HTML structure (status pill, grid of
    stat tiles, sectioned details),
  - assert that both `lightTheme` and `darkTheme` have tuned
    palettes for every status, and that they differ per status.
- `localJobs.test.js` was untouched (data-layer test).
- All 42 tests pass.

## 16. Do not change without reading this doc

- The accent is a single restrained green. Don't introduce a second
  brand colour.
- Dark mode is a separate palette. Don't invert or "auto-generate"
  it from light mode.
- Status colours live in `theme.status`, not in screens. Always go
  through the table.
- Components consume the theme via `useTheme`. Don't import
  `lightTheme.colors` directly from a screen — pass the theme in.
- The brand mark is geometric and constructed. Don't add drop
  shadows, glow, gradients, or illustrations to it.
- The app is local-first. Don't reintroduce cloud sync, account UI,
  or backend-dependent screens. The `LocalStorageNotice` text is
  not decoration — it is a product promise.
