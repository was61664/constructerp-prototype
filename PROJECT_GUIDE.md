# ConstructERP — Project Guide

> Status date: 2026-09-21 · Branch: `Dev-Mustafa`
> Live prototype: <https://was61664.github.io/constructerp-prototype/>

---

# PART 0 — UI Rebuild Brief (active work)

## 0.1 The brief as given

> Build an Angular UI with a professional, "classic SaaS dashboard" aesthetic
> (think 2019–2021 era design — clean and flat, NOT the newer rounded/dynamic
> Material 3 look, and NOT dated skeuomorphic/gradient styles from 10+ years ago).
>
> ### Stack & Architecture
>
> - Angular (latest stable version)
> - Angular Material (latest package version), but configure theming using the
>   LEGACY M2 theming API (mat.define-light-theme, mat.define-palette, etc.)
>   — do NOT use the default M3 theme tokens. Justify this explicitly in a
>   comment at the top of the theme file so future devs don't "upgrade" it.
> - Standalone components (current Angular convention), OnPush change detection
>   where practical
> - SCSS with a single source-of-truth theme file (\_theme.scss or similar,
>   matching whatever naming convention already exists in this repo — check
>   before introducing a new file name)
> - Strict TypeScript, no `any`
>
> ### Design Spec
>
> - Background: white / very light gray (#FAFAFA or #F5F5F5), NOT pure white
>   everywhere — use white for cards/surfaces to create subtle depth without
>   shadows-as-decoration
> - Primary palette: corporate blue/gray (e.g. primary #1976D2-ish blue, gray
>   neutrals for text/borders) — flat colors, no gradients
> - Buttons: standard rectangular or slightly-rounded (4px radius max) Material
>   raised/stroked buttons — no pill-shaped or glassmorphic buttons
> - Cards: 1px light border OR a subtle 1-2px box-shadow (not both), flat fill
> - Typography: Tajawal (Google Font) for all UI text — load it properly via
>   index.html or @angular/material typography config, not inline @import in
>   every component
> - Layout: standard fixed sidebar + top toolbar dashboard pattern, generous
>   whitespace, no dense/compact spacing
>
> ### Code Quality Requirements
>
> - Follow whatever naming conventions, folder structure, and module patterns
>   already exist in this project — inspect existing files first, do not
>   invent new nomenclature
> - Reusable, single-responsibility components; no god-components
> - Scalable folder structure (feature-based, not type-based, unless the repo
>   already uses type-based)
> - Accessible: proper aria labels, sufficient color contrast, keyboard nav
> - Add brief comments only where intent isn't obvious from code
>
> ### Before You Code
>
> List the components/files you plan to create/modify and the theming
> approach you'll use, and wait for my confirmation before implementation.

**Note on the confirmation gate:** the brief asks to wait for confirmation, but the
instruction accompanying it was "put this in the first of the .md file and start
implementing the UI and give me the run URL". Implementation therefore proceeded
without a separate confirmation round. The plan below is recorded as-built.

## 0.2 Conventions found in the repo (inspected before coding)

These were checked first, as the brief requires. Nothing new was invented where a
convention already existed.

| Question             | What the repo already does                                                         | Decision                                                        |
| -------------------- | ---------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| Component file names | `app.ts` / `app.html` / `app.scss`, class `App` — Angular 20 suffix-less style | Followed: `dashboard.ts` → `class Dashboard`, never `*.component.ts` |
| Folder structure     | Flat `src/app/` — only one component existed, so no structure to follow          | Introduced feature-based folders (brief's default)               |
| Styles               | One global `src/styles.scss`, no partials existed                                | Added `src/styles/` with `_theme.scss` + `_tokens.scss`     |
| Icons                | `@lucide/angular` already a dependency                                            | Kept. No Material Icons font added — flat line icons suit the era |
| Templates            | `templateUrl` + `styleUrl`                                                       | Followed for features/layout; inline only for trivial presentational components |
| i18n                 | Hand-rolled EN/AR dictionaries + RTL                                               | Preserved and moved into `core/i18n/`                          |
| Currency             | KWD via `DEFAULT_CURRENCY_CODE` + `Intl`                                       | Preserved                                                       |
| Strictness           | `strict: true` already on                                                        | Kept; no `any` introduced                                     |

## 0.3 Theming approach

Angular Material 20.2.14 defaults to **Material 3**, whose rounded, tonal, dynamic-color
look is explicitly ruled out by the brief. In this version the legacy Material 2 API is
still shipped, but **re-exported under an `m2-` prefix**
(`node_modules/@angular/material/core/m2/_index.scss` is forwarded as `m2-*`).

So the function names in the brief map like this:

| Brief                        | Actual API in Material 20.2.14  |
| ---------------------------- | ------------------------------- |
| `mat.define-palette`       | `mat.m2-define-palette`       |
| `mat.define-light-theme`   | `mat.m2-define-light-theme`   |
| `mat.define-typography-config` | `mat.m2-define-typography-config` |
| `mat.$blue-palette`        | `mat.$m2-blue-palette`        |

`mat.all-component-themes($theme)` still accepts an M2 theme object and emits M2 tokens —
that is what produces the flat 2019-era component look (4px radii, flat fills, classic
elevation scale) instead of M3 tokens.

This is deliberate and is documented in a header comment in `_theme.scss` so a future
developer does not "modernise" it and silently change the entire product's appearance.

## 0.4 Files created / modified

**Theme & global (single source of truth)**

- `src/styles/_theme.scss` — **new.** M2 palettes, Tajawal typography config, theme object, justification comment
- `src/styles/_tokens.scss` — **new.** Layout/surface/border/spacing tokens consumed by components
- `src/styles.scss` — modified. Applies the theme, global resets, layout utilities
- `src/index.html` — modified. Tajawal loaded once via `<link>` (not per-component `@import`)
- `angular.json` — modified. `stylePreprocessorOptions.includePaths` so components `@use 'tokens'`

**Core (models, data, services)**

- `core/models/` — `equipment.ts`, `project.ts`, `equipment-request.ts`, `rental.ts`, `inspection.ts`, `transport-move.ts`, `navigation.ts`, `index.ts`
- `core/i18n/` — `translations.ts` (UI strings), `data-labels.ts` (data-value labels)
- `core/services/i18n.ts` — language signal, direction, `t()`, `text()`, number/currency/date formatting
- `core/services/erp-store.ts` — signal-based store, localStorage persistence, all CRUD
- `core/services/navigation.ts` — module + nav-group definitions with routes

**Layout (shell)**

- `layout/shell/` — sidenav container wiring toolbar + sidebar + `<router-outlet>`
- `layout/top-toolbar/` — search, language toggle, notifications, primary action
- `layout/sidebar-nav/` — grouped navigation, active-route highlighting

**Shared presentational components**

- `shared/components/page-header/` — title, subtitle, action slot
- `shared/components/section-card/` — the bordered white surface used everywhere
- `shared/components/kpi-card/` — dashboard metric tile
- `shared/components/status-chip/` — flat 3px status label (not a pill chip)
- `shared/components/meter-bar/` — labelled progress bar
- `shared/components/confirm-dialog/` — replaces `window.confirm()`

**Features (one folder per module)**

- `features/dashboard/`, `features/projects/`, `features/equipment/`, `features/requests/`, `features/rentals/`, `features/transport/`, `features/inspections/`, `features/costs/`, `features/reports/`
- Form dialogs co-located with their feature: `projects/project-form-dialog/`, `equipment/equipment-form-dialog/`, `requests/request-form-dialog/`

**App root (modified)**

- `app.ts` / `app.html` / `app.scss` — reduced from a 1,206-line god-component to a thin shell host
- `app.routes.ts` — real lazy routes replacing the empty array
- `app.config.ts` — animations provider added, KWD default kept
- `app.spec.ts` — updated for the new structure

## 0.5 What this rebuild does and does not change

**Does:** UI architecture, visual design, routing, component structure, accessibility.

**Does not:** introduce a backend, a database, or authentication. Data still comes from
the mock store in `localStorage`. Every item in Part 1's department TODO lists below
remains open except the frontend-architecture ones noted as done.

## 0.6 As-built notes

Things that differ from the plan in §0.4, or that a reviewer should know.

**Dependencies added**

| Package                | Version      | Why that version                                                              |
| ---------------------- | ------------ | ----------------------------------------------------------------------------- |
| `@angular/material`  | `20.2.14`  | Newest of the v20 line. Material trails core (20.3.x) by a minor — normal.     |
| `@angular/cdk`       | `20.2.14`  | Must match Material exactly (hard peer).                                       |
| `@angular/animations` | `20.3.26` | Must match `@angular/core` **exactly**; the newest 20.3.31 refuses to install. |

**Naming**

- `features/equipment/equipment.ts` exports **`EquipmentPage`**, not `Equipment` —
  `Equipment` is already the domain model's name. The file name still follows the repo's
  suffix-less convention.

**Extra files not in the original plan**

- `src/styles/_dialog-form.scss` — a `dialog-form` mixin shared by the three entity form
  dialogs, so the two-column grid is not copy-pasted into three stylesheets.
- `shared/services/confirm.ts` — wraps the confirm dialog so every destructive action
  routes through one translated code path.
- `features/requests/request-stage-tracker/` and `features/requests/request-checklist/` —
  the requests screen needed these to avoid becoming a mini god-component.

**angular.json changes**

- `stylePreprocessorOptions.includePaths: ["src/styles"]` on both `build` and `test`,
  so components write `@use 'tokens' as *` rather than counting `../`s.
- Initial bundle budget raised from 500 kB → 1 MB warning / 1.5 MB error. The 500 kB
  figure was set for an app with no UI library. Current production build is **758 kB raw,
  158 kB estimated transfer (gzipped)** — normal for Material. Flagged here rather than
  silently buried: if bundle size becomes a real concern, the lever is replacing
  `mat.all-component-themes` with per-component theme mixins, which trades ~60 kB of CSS
  for a list that must be maintained by hand.

**Two real bugs found and fixed during the build**

1. **Material ignored the runtime language switch.** CDK's `Directionality` reads the
   document direction **once**, at service construction. Toggling to Arabic left it on
   `ltr`, so the sidenav reserved its margin on the wrong side (page content slid under
   the drawer) and dialogs opened with an explicit `dir="ltr"` that overrode the
   document. Fixed in `core/services/i18n.ts` by pushing the new direction into
   `Directionality.valueSignal` and emitting `change`.
2. **Arabic-Indic digits mangled record identifiers.** Localizing the digits in
   `PRJ-1001` made the bidi algorithm reorder the run, displaying `١٠٠١-PRJ`.
   Identifiers are codes, not quantities, so `I18nService.code()` returns them untouched
   and the `.code` class isolates the span (`unicode-bidi: isolate`).

**Verified**

- `npm run build` (production): clean, no warnings.
- `npm test`: 12/12 passing (shell, i18n, and store behaviour).
- All nine routes render with no console or page errors, in both languages.
- Arabic RTL checked on the dashboard, tables, dialogs, and at 820px width.

## 0.7 Dark mode

Added after the initial rebuild, following the same pattern as the light theme rather
than bolting on a second stylesheet.

**How the tokens work — read `styles/_tokens.scss` before changing a colour**

Colours are CSS custom properties (light on `:root`, dark on `:root.theme-dark`). The
SCSS variables are thin aliases resolving to `var(--x)`. That indirection is the whole
trick: `background: $surface` in any component already compiles to `var(--surface)`, so
**no component stylesheet needed editing** to gain dark mode. The constraint it buys:
these tokens can no longer be passed through Sass colour functions (`darken()`,
`rgba($surface, .5)`) — Sass sees an opaque `var()` string. Need a variant? Add it as its
own token, in both themes.

Non-colour tokens (spacing, radius, dimensions) stay plain SCSS — they do not change
between themes.

**Material's half**

`_theme.scss` gains `$constructerp-dark-theme` via `mat.m2-define-dark-theme`, with
palettes stepped to a lighter hue (the 300 stop): `#1976D2` only reaches ~3:1 on a dark
surface. `styles.scss` emits it under one selector with **`mat.all-component-colors`**,
not `all-component-themes` — so the dark theme adds a colour pass, not a duplicate of
every component's typography and density. Total cost: **+3.3 kB gzipped.**

**Three states, not two**

| State  | Behaviour                                             |
| ------ | ----------------------------------------------------- |
| Light  | Explicit. Persisted. Ignores the OS.                  |
| Dark   | Explicit. Persisted. Ignores the OS.                  |
| System | Default. Follows the OS **live**, no reload required. |

`ThemeService` keeps `preference` (what the user chose, including `system`, persisted)
separate from `resolved` (what is painted, never persisted).

> **Do not collapse those two.** Persisting the resolved value is the classic bug in this
> feature, and the first implementation here had it: the effect wrote storage on its first
> run, so a fresh visit froze whatever the OS happened to say at that moment and the app
> stopped following the OS forever — including across reloads — even though the user had
> never chosen anything. Storage is now written **only** in `select()`. There is a
> regression test named "should NOT write storage until the user makes an explicit
> choice"; if you are tempted to move persistence back into the effect, that test is why.

**Flash prevention**

A small inline script in `index.html` applies the theme class before first paint, so a
dark-mode machine does not flash white during boot. It is intentionally inline and
dependency-free — an external file would be another round trip before paint. It decides
only the first frame; `ThemeService` takes over from there.

**Overlay surfaces**

Dialogs, menus and select panels are pinned to our own `--surface`. Material's M2 dark
palette uses a neutral grey for elevated surfaces, which sits at a visibly different hue
from our blue-tinted surface — left alone, a dialog looks like it came from a different
product than the cards behind it. Those overrides need **two-class selectors**
(`.mat-mdc-dialog-container .mat-mdc-dialog-surface`) to match the specificity Material
itself uses; a single-class rule silently loses the cascade.

**Verified end-to-end** (Playwright, emulating OS theme changes): fresh visit follows the
OS; OS changes mid-session are followed with no reload; an explicit choice overrides the
OS and survives reload; returning to System resumes following immediately. Checked in
dark + Arabic RTL together, and in dialogs and dropdown panels.

## 0.8 Colour system: white canvas / black canvas

The palette was revised after review. It now runs **pure white** in light and **pure
black** in dark, with the rest of each palette kept neutral so nothing fights the base.

> **This deliberately departs from §0.1's brief**, which asked for a light-grey canvas
> and explicitly said "NOT pure white everywhere — use white for cards to create subtle
> depth". That depth cue is gone by choice. The consequence is structural, so respect it:
> **the 1px borders are now load-bearing.** With canvas and cards at the same colour they
> are the only thing separating a card from the page. Do not "clean up" borders on
> surfaces in this system — the layout dissolves without them.

| Role                 | Light                       | Dark                          |
| -------------------- | --------------------------- | ----------------------------- |
| Canvas               | `#ffffff`                 | `#000000`                   |
| Card surface         | `#ffffff`                 | `#0c0c0e`                   |
| Sunken (table heads) | `#f6f7f8`                 | `#141418`                   |
| Row hover            | `#f1f3f5`                 | `#1c1c21`                   |
| Border               | `#e3e5e8`                 | `#26262b`                   |
| Text primary         | `#1a1a1a`                 | `#f0f0f2`                   |
| Brand                | `#1976d2`                 | `#5aa3f0`                   |

Dark surfaces are **not** pure `#000`: a black card on a black page with a dark border is
genuinely hard to locate, and the status tints need somewhere to sit. `#0c0c0e` reads as a
true black theme while keeping cards findable.

**The luminance ladder is the rule to preserve.** Each step — canvas → surface → sunken →
hover — moves consistently in one direction: darker in light mode, lighter in dark mode.
That is what makes a hovered row feel raised rather than dented.

Measured contrast, both themes (all AA, 4.5:1 minimum):

| Pair                      | Light     | Dark      |
| ------------------------- | --------- | --------- |
| text-primary on surface   | 17.4:1    | 17.2:1    |
| text-secondary on surface | 6.3:1     | 8.3:1     |
| text-hint on surface      | 4.9:1     | 5.3:1     |
| brand on surface          | 4.6:1     | 7.4:1     |
| text-secondary on hover   | 5.7:1     | 7.2:1     |

**Bug fixed in the same pass.** Dark-mode table rows were rendering in Material's own
neutral `#424242` — lighter than our surface and a different hue — while `:hover`
resolved to our darker hover token. The result: hovering a row made it go *darker* than
the table, and the grid read as grey against near-black cards. Material paints tables
from `--mat-table-background-color`, which its M2 dark palette sets to that grey;
`styles.scss` now overrides that token and makes rows transparent so the surface shows
through. Overriding the token is more reliable than out-specifying the cascade.

## 0.9 Loading states: the gear

The app has **one** loading indicator — a turning gear (`LucideCog`), shown inside the
button whose action is running. There is no other spinner; if you add a loading state
anywhere, use this.

`shared/components/busy-icon/` projects the button's normal icon and swaps it for the
gear while busy:

```html
<button mat-raised-button [disabled]="busy.any" [attr.aria-busy]="busy.is('create')">
  <app-busy-icon [busy]="busy.is('create')">
    <svg lucidePlus size="16" aria-hidden="true"></svg>
  </app-busy-icon>
  <span>{{ i18n.t('addProject') }}</span>
</button>
```

`shared/utils/busy-state.ts` tracks **which single action** is running, keyed by record
id, so exactly one button turns rather than every button on the screen. It clears in a
`finally` — a rejected save must not leave the gear turning with the UI disabled forever.
There is a test for that.

**This required making the app asynchronous.** A gear needs something to wait on, and the
store wrote to localStorage synchronously. `core/data/erp-gateway.ts` is now the seam:
every write returns a Promise, and store mutations are `async`. Replacing localStorage
with `HttpClient` means rewriting that one class — no store method and no component
changes shape.

Mutations are **optimistic**: the signal updates before the commit is awaited, so the
table shows the change immediately while the button spins. A real backend must roll the
signal back or surface the error if the commit fails; the gateway currently swallows it.

> **`MOCK_LATENCY_MS = 450` in `erp-gateway.ts` is artificial and must be deleted when
> the real API lands.** localStorage returns within a frame, so without it the busy state
> is real but invisible — reviewers cannot see how saving will feel and the loading UI
> cannot be demonstrated. It is the only fake timing in the app. Set it to `0` to remove
> the delay immediately.

Accessibility: the acted-on button carries `aria-busy="true"`, and every competing action
button is disabled for the duration, which also prevents double-submits. Under
`prefers-reduced-motion` the gear steps round in eight discrete clicks instead of
sweeping — it still reads as "working", without the smooth rotation that triggers
vestibular discomfort.

## 0.10 Responsive & mobile

Audited at 375px (iPhone SE), 390px (iPhone 14), 768px and 1024px, across all nine
routes, in both languages and both themes.

| Behaviour            | Result                                                            |
| -------------------- | ----------------------------------------------------------------- |
| Sideways page panning | None, on any route at any width                                   |
| Sidebar              | Fixed ≥1024px; overlay drawer with a hamburger below              |
| Wide tables          | Scroll inside their own card                                      |
| Dialogs              | Single column below 560px; `94vw` max width                     |
| Tap targets          | All ≥44×44 on touch devices                                      |
| Search box           | Hidden below 1024px (it is disabled in this phase anyway)          |

**Bug found and fixed during the audit.** On `/projects` and `/equipment` the entire page
panned sideways on a phone — toolbar, header and all — by ~594px. Material's drawer
content is `overflow: auto`, and a wide table inside a card leaked its width into that
container even though `.table-scroll` was scrolling correctly on its own. `.shell-content`
is now explicitly `overflow-x: hidden`: the shell scrolls vertically only, and horizontal
scrolling belongs to `.table-scroll` and nowhere else.

> Worth knowing for the audit method: `element.scrollLeft = 9999` **succeeds even on
> `overflow: hidden`**, so it cannot be used to detect whether a user can pan. The real
> test is computed `overflow-x` being `auto`/`scroll` *while* `scrollWidth > clientWidth`.
> An earlier pass using `scrollLeft` reported false results in both directions.

Also adjusted: page gutters drop from 24px to 16px below 600px (24px each side costs 13%
of a 375px screen), and text buttons get a 44px minimum height under
`@media (pointer: coarse)` — Material ships them at 36px, which is below a comfortable
tap target. Icon buttons were already 48px.

### Tables become card lists on small screens

Every record table now switches to a **stacked card list below 700px** — one card per
record, each field labelled next to its own value. Converted: Inspections, Rentals,
Transport, Projects, Equipment.

A table row on a 375px screen forces sideways panning to read one record, and the column
header — the thing that says what a value *means* — scrolls out of view. Stacking removes
both problems.

- `core/services/layout.ts` exposes `isCompact()` (700px, chosen because that is where
  the widest table stops being readable, not because it is a device boundary).
- `shared/components/record-card/` renders one record: title, optional code subtitle, a
  `fields` array, and slots `[cardStatus]`, `[cardActions]` plus default content for
  richer pieces like a meter bar. The `card` prefix on the slots avoids colliding with
  real input names — `status` is already an input on `app-status-chip`.
- Templates use `@if (layout.isCompact())`, **not** a CSS `display` swap, so only one
  layout is ever in the DOM. Assistive technology never meets each record twice.
- Equipment hides its detail panel in compact mode: the card already carries every field
  the panel showed, so keeping both would duplicate the record.

Verified at 375/390/768/1440px across all nine routes, in both languages and both themes:
cards below 700px, tables above, no sideways panning anywhere, no console errors.

**Toolbar at 375px.** The five controls totalled ~382px and clipped the primary action's
label. The notifications bell is hidden below 600px — it is non-functional in this phase,
so dropping it costs nothing and buys back the 48px that keeps "New Request" readable.

**Still open.** Requests already uses cards at every width, so it needed no conversion,
but its stage tracker is cramped on a phone. Dashboard and Costs are chart/meter screens
and were already fluid.

**Known cosmetic limits**

- The toolbar search box and notifications bell are rendered **disabled**, because
  neither has anything behind it yet. That is deliberate: a control that looks live and
  does nothing is worse than one that says it is unavailable. Same for the two
  `Export Report` buttons.

---

# PART 1 — Project Guide

> **Read this first.** Part 1 below is the **original audit of the prototype**, written before any
> of the backend existed. It is kept as the record of what was wrong and why, and much of it has
> since been fixed.
>
> Two things to know before reading it:
>
> - **§5 is current.** It was rewritten to describe the backend as built. Everything else in Part 1
>   describes the prototype as it was found.
> - **Its `src/app/app.ts#L...` links are dead.** That file was a 3,256-line god component; it is now
>   a 26-line shell and the app lives under `src/app/features/`, `core/` and `shared/`. The line
>   numbers in those links refer to the original file and resolve to nothing.
>
> For current state, read Part 0 and §5. For the reasoning behind a specific decision, read the
> department section here.

This document describes **what the project was when audited**, **how to run it**, **what technology
it should use going forward**, and a **TODO list broken down by department**. Each department section
is self-contained so it can be handed to the person who owns that area.

---

## 1. What this project is

ConstructERP is a **construction equipment ERP**. It tracks heavy equipment (owned and rented),
the request → approval → receiving → inspection cycle that must complete before an asset can be
used, vendor rentals, transport moves, inspections with photo/video/signature evidence, and the
resulting cost allocation per project.

**When this was written**, what existed was a clickable UI prototype: a single Angular page with nine
module screens, bilingual English/Arabic with full RTL, hard-coded mock data, and mock CRUD saving to
the browser's `localStorage`. No backend, no database, no authentication, no real reporting.

**Since then**, eight of the nine modules have been moved onto a .NET 10 / SQL Server backend in a
separate repository, and the UI has been rebuilt into feature folders. Inspections is the only module
still on in-memory data. Authentication and reporting remain unbuilt. See §5 for the current state.

### The nine modules (all present in the UI)

| Module        | Screen purpose                                             | Data state                           |
| ------------- | ---------------------------------------------------------- | ------------------------------------ |
| Dashboard     | KPI tiles, utilization bars, next actions                  | Computed from mock arrays            |
| Projects      | Portfolio, budget vs. spend, linked activity counts        | Mock + CRUD                          |
| Requests      | 4-stage flow with pre-request and pre-receiving checklists | Mock + CRUD                          |
| Equipment     | Asset register + detail panel                              | Mock + CRUD                          |
| Rentals       | Vendor commitments, return dates, overdue flag             | Mock,**read-only**             |
| Transport     | Delivery/return routes, cost share donut                   | **Hard-coded in the template** |
| Inspections   | Media counts, inspector, pass/attention/pending signature  | Mock,**read-only**             |
| Project Costs | Equipment / transport / extras split per project           | Derived from projects                |
| Reports       | Three static report cards                                  | **Static text only**           |

### Business rule already modelled in the UI

An asset cannot move to `Working` until: the request is **approved**, delivery is **received**, and
the **pre-use inspection passes**. This rule is currently only visual — nothing enforces it in code.
It is the single most important rule to implement server-side.

---

## 2. Current technology

| Area             | What is used                                                         | Version / detail                                      |
| ---------------- | -------------------------------------------------------------------- | ----------------------------------------------------- |
| Language         | TypeScript                                                           | `~5.9.2`, `strict` mode on                        |
| Framework        | Angular (standalone components, signals)                             | `^20.3.0`                                           |
| Change detection | Zone.js with`eventCoalescing`                                      | `zone.js ~0.15.0`                                   |
| Routing          | `@angular/router` provided but **`routes` array is empty** | [app.routes.ts](src/app/app.routes.ts)                 |
| Forms            | `FormsModule` (template-driven `ngModel`)                        | `^20.3.0`                                           |
| Icons            | `@lucide/angular`                                                  | `^1.25.0`                                           |
| Styling          | Hand-written SCSS, no UI library                                     | [app.scss](src/app/app.scss), 1,201 lines              |
| i18n             | Hand-rolled dictionaries inside the component                        | Not`@angular/localize`, not `ngx-translate`       |
| Currency         | `DEFAULT_CURRENCY_CODE: 'KWD'` + `Intl.NumberFormat`             | [app.config.ts:14](src/app/app.config.ts#L14)          |
| Persistence      | `localStorage` keys `constructerp.*`                             | [app.ts:1157-1183](src/app/app.ts#L1157-L1183)         |
| Tests            | Karma + Jasmine, 1 spec file                                         | [app.spec.ts](src/app/app.spec.ts), 122 lines          |
| CI/CD            | GitHub Actions → GitHub Pages on push to`main`                    | [deploy-pages.yml](.github/workflows/deploy-pages.yml) |
| Node             | 22 (in CI)                                                           |                                                       |

**Database: none.** **Backend: none.** **Auth: none.**

### Code size

```
src/app/app.ts      1,206 lines   ← types, translations, mock data, all logic, all CRUD
src/app/app.scss    1,201 lines   ← every style for every module
src/app/app.html      849 lines   ← all nine modules in one @switch block
src/app/app.spec.ts   122 lines
```

Everything lives in **one component**. That is the defining structural problem of the codebase.

---

## 3. Project level assessment

**Level 1 of 5 — Interactive UI prototype / demo.**

| Level | Meaning                                                         | ConstructERP             |
| ----- | --------------------------------------------------------------- | ------------------------ |
| 1     | Clickable prototype, mock data, no backend                      | ✅**You are here** |
| 2     | Real backend + database, single tenant, basic auth              | Next target              |
| 3     | Production MVP: roles, audit, file storage, real reports        |                          |
| 4     | Multi-tenant, integrations (accounting, GPS/telematics), mobile |                          |
| 5     | Scaled product: SLAs, observability, offline field app          |                          |

**What it is good for today:** stakeholder demos, validating the request→inspection flow with site
managers, confirming Arabic/RTL expectations, and agreeing on screens before the backend is built.

**What it must not be used for:** anything real. Data lives in one browser, is lost when cache is
cleared, is not shared between users, and has no validation or permissions.

Estimated effort to reach Level 2 (real backend + DB + auth, same nine modules):
**roughly 8–12 developer-weeks** for one full-stack developer, assuming the UI stays as-is.

---

## 4. How to run it

```bash
npm ci          # install exact dependency versions
npm start       # dev server on http://localhost:4200
npm run build   # production build into dist/
npm test        # Karma + Jasmine in Chrome
```

Deployment is automatic: any push to `main` triggers
[deploy-pages.yml](.github/workflows/deploy-pages.yml), which builds with
`--base-href /constructerp-prototype/` and publishes `dist/constructerp-prototype/browser` to
GitHub Pages. Work happens on `Dev-Mustafa`; merging to `main` publishes.

**Resetting the prototype data:** open DevTools → Application → Local Storage → delete the
`constructerp.projects`, `constructerp.equipment`, and `constructerp.equipmentRequests` keys, then
reload. The original mock data returns.

---

## 5. Backend stack (as built)

This section described a *recommendation* while the backend was still hypothetical. The backend now
exists, so it records what was actually chosen and why the choices differ from the original advice.

**The backend is a separate repository:** `constructerp-api`, not a folder inside this one. Nothing
in this repo builds or deploys it.

| Layer | Built with | Why |
| --- | --- | --- |
| **Database** | **SQL Server 2022** | Chosen over the originally recommended PostgreSQL: it was already installed locally and matches the Microsoft stack in use elsewhere. The JSONB argument for Postgres never applied — checklists became real `request_checks` rows, not a JSON payload. |
| ORM | EF Core 10, code-first migrations | Schema versioned in git; three migrations so far. |
| Backend | .NET 10 minimal APIs, REST + JSON | `ConstructErp.Api` → `Infrastructure` → `Application` → `Domain`. |
| Money | `decimal(18,3)` everywhere | KWD has three decimal places. Enforced by a convention in `ConfigureConventions` and guarded by a schema test that queries `INFORMATION_SCHEMA`. |
| Text | `NVARCHAR` everywhere | `VARCHAR` under SQL Server's default collation destroys Arabic. Also guarded by a schema test asserting zero `varchar`/`char`/`text` columns. |
| Keys | GUID v7 primary keys, real foreign keys | The prototype joined equipment to projects on the project *name*. |
| Soft delete | `deleted_at` + global query filter | Rows are hidden from every query, never destroyed. |
| Tests | xUnit + `WebApplicationFactory` against **real SQL Server** | A per-run database, not an in-memory provider — the schema guarantees above are only meaningful against the real engine. |
| CI | GitHub Actions with a SQL Server service container | |
| Frontend | Angular 20, unchanged | Restructured, not replaced. |
| Local dev | SQL Server + `dotnet run`. **No Docker.** | Both were already installed; a container added a moving part without adding anything. |

**Still to choose:** file storage for inspection media (S3, Azure Blob, or self-hosted MinIO), auth
and roles, and a background-job runner for overdue alerts. None of these are built.

### Module status

| Module | Backed by | Notes |
| --- | --- | --- |
| Projects | SQL Server | Spend totals summed from cost entries, never stored. |
| Equipment | SQL Server | Real FK to projects. |
| Requests | SQL Server | Workflow enforced by `RequestWorkflow`. |
| Costs | SQL Server | Entries listed, added and removed from the Costs screen. |
| Rentals + Vendors | SQL Server | Status derived from dates by `RentalSchedule`. |
| Transport | SQL Server | Status derived from event timestamps by `TransportSchedule`. |
| **Inspections** | **In-memory seed** | The last module not migrated. Blocked on the file-storage decision above. |

### The pattern worth keeping

Three modules had a **stored status that somebody typed**, and all three were wrong in the same way —
the record only changed when a person remembered to change it. Each was replaced by storing the
*facts* and deriving the status:

- A rental is `Overdue` because its return date passed and no return was recorded.
- A move is `In Transit` because a departure was recorded against it.
- A request is `Ready to Use` because approval, receipt and inspection all happened.

In each case the status column was **removed from the schema**, and a test asserts it never comes
back. If a fourth module grows a status field, this is the question to ask first: is it a fact, or
somebody's opinion about facts recorded elsewhere?

---

## 6. Departments

Each department below has: what exists now, and what to do. Check items off in order — they are
roughly dependency-ordered within each department.

---

### 6.1 Frontend Architecture

**Now:** one `App` component holds every type, every translation, every mock record, and every CRUD
method. Routing is installed but unused — module switching is a `@switch` on a signal, so there are
no URLs, no deep links, no browser back button, and no lazy loading. `dataVersion` is a counter
signal bumped manually to force `computed()` re-evaluation, because the data arrays are plain
arrays rather than signals.

**TODO**

- [ ] Fill [app.routes.ts](src/app/app.routes.ts): one lazy route per module (`/dashboard`, `/projects`, `/equipment`, `/requests`, `/rentals`, `/transport`, `/inspections`, `/costs`, `/reports`).
- [ ] Split [app.html](src/app/app.html) into nine feature components; keep only the shell (sidebar, topbar, search) in `App`.
- [ ] Split [app.scss](src/app/app.scss): shared tokens/mixins in a global file, the rest co-located with each component.
- [ ] Extract shared UI into presentational components: `panel`, `kpi-tile`, `status-badge`, `progress-bar`, `data-row`.
- [ ] Convert `projects`, `equipment`, `equipmentRequests` to `signal<T[]>` and **delete the `dataVersion` counter** ([app.ts:507](src/app/app.ts#L507)) along with the four `this.dataVersion()` calls that exist only to trigger recomputation.
- [ ] Replace the mock arrays with injectable services (`ProjectService`, `EquipmentService`, …) so swapping `localStorage` for HTTP touches one file per domain.
- [ ] Move the `Equipment`, `Rental`, `Inspection`, `EquipmentRequest`, `ProjectRecord` types into `src/app/core/models/`.
- [ ] Add `@defer` or route-level lazy loading once modules are separate components.
- [ ] Decide on zoneless change detection (`provideZonelessChangeDetection`) once everything is signal-based — the app is already close.

---

### 6.2 Backend & API

**Now:** does not exist. All data is client-side.

**TODO**

- [ ] Create the ASP.NET Core 9 solution: `Api`, `Application`, `Domain`, `Infrastructure`.
- [ ] Define DTOs mirroring the existing TS types so the UI contract does not change.
- [ ] CRUD endpoints for: projects, equipment, requests, rentals, vendors, transport moves, inspections, cost entries.
- [ ] Implement the **state machine** for `EquipmentRequest`: `Draft → Submitted → Approved → Received → Inspection Pending → Ready to Use`. Reject any transition that skips a stage.
- [ ] Enforce server-side: equipment cannot become `Working` without an approved request + recorded receiving + passed inspection.
- [ ] Validate the six pre-request checks and six pre-receiving checks as real rules, not booleans the client sets. Today any client can set `passed: true` on all of them.
- [ ] Endpoint for dashboard aggregates (total equipment, rental count, daily spend, average utilization) — do not compute these in the browser over a full table.
- [ ] Media upload endpoints returning pre-signed S3/MinIO URLs.
- [ ] Swagger/OpenAPI + generated TypeScript client.
- [ ] Global error handling, `ProblemDetails` responses, request logging with correlation IDs.
- [ ] Pagination, filtering, and sorting on every list endpoint — the prototype renders full arrays.

---

### 6.3 Database

**Now:** three `localStorage` keys holding JSON blobs, written on every change by an `effect()`
([app.ts:844-847](src/app/app.ts#L844-L847)). No relations, no constraints, no history.

**TODO**

- [x] Stand up SQL Server 2022 locally (no Docker — it was already installed).
- [x] Model the schema; enforce foreign keys. `inspection.equipment_id` remains, with inspections.
- [x] Use `decimal(18,3)` for all money columns (KWD = 3 decimals). Guarded by a schema test.
- [x] Use real `date` / `datetimeoffset` columns — never display strings.
- [x] Add `created_at`, `updated_at`, `created_by`, `updated_by` to every table.
- [x] Soft delete (`deleted_at`) with a global query filter, instead of hard delete.
- [ ] `audit_log` table capturing every status transition on requests, equipment, and inspections. Construction disputes are settled with audit trails.
- [x] EF Core migrations from day one; never edit the schema by hand.
- [x] Runtime seeder loading the prototype's data. `HasData` cannot seed complex properties (dotnet/efcore#31254), and every name here is a `LocalizedText`.
- [x] Indexes on `equipment.status`, `equipment.project_id`, `requests.status`, `rentals (returned_on, expected_return_on)` (the overdue query) and `transport_moves (departed_at, scheduled_for)` (the running-late query).
- [ ] Backup and restore procedure, tested at least once before go-live.

---

### 6.4 Localization & RTL

**Now:** the strongest part of the prototype. Four hand-written dictionaries in
[app.ts:123-466](src/app/app.ts#L123-L466): `translations` (UI strings), `moduleLabels`,
`navGroupLabels`, and `displayText` (data-value translations). Arabic-Indic digit conversion via
`localizeDigits`, direction applied to `<html>` and `<body>` through an `effect()`. Currency
formatting switches between `en-KW` and `ar-KW`.

**Problem:** `displayText` translates **data values** — project names, vendor names, equipment names,
status labels. Once data comes from a database this stops working entirely; a project a user creates
will never have an Arabic translation.

**TODO**

- [ ] Move translations out of the component into JSON resource files.
- [ ] Choose the long-term approach: `@angular/localize` (compile-time, two builds) or a runtime service (one build, live toggle). **A runtime service is recommended** — the live language toggle is a demo feature worth keeping.
- [ ] Separate the two concerns: **UI labels** stay in resource files; **enum values** (`Working`, `Idle`, `Approved`, …) become coded values with per-language labels from the API; **user-entered data** (project/vendor/equipment names) gets `name_en` + `name_ar` columns.
- [ ] Persist the language choice (`localStorage` or user profile) — it currently resets to English on every reload.
- [ ] Replace `formatDateLabel`'s hard-coded `Jul` regex ([app.ts:1100](src/app/app.ts#L1100)) with `Intl.DateTimeFormat` over real `Date` values.
- [ ] Decide on the Hijri calendar: display-only, or a real requirement? Ask the client before building.
- [ ] Audit every icon and directional arrow for RTL mirroring (`LucideChevronRight` in particular).
- [ ] Test Arabic on a real Windows/Android device — font rendering differs from the dev machine.

---

### 6.5 Equipment & Fleet

**Now:** five mock assets, full CRUD, a detail panel, utilization bars, five statuses. Utilization is
a manually entered number.

**TODO**

- [ ] Equipment categories/types as a managed lookup table, not a free-text `type` field.
- [ ] Asset profile: serial number, manufacturer, model, year, plate/registration, purchase date, book value.
- [ ] Documents per asset: registration, insurance, operator certificates — with expiry dates and alerts.
- [ ] Calculate utilization from actual working hours or assignment days instead of typed input.
- [ ] Maintenance schedule: service intervals, due dates, maintenance history, downtime tracking.
- [ ] Assignment history — which project held the asset, and when.
- [ ] QR code or barcode per asset for site scanning.
- [ ] Availability calendar to prevent double-booking the same asset across two projects.
- [ ] Bulk import from Excel — the client will have an existing asset list.

---

### 6.6 Requests & Approvals

**Now:** two mock requests, four stages, twelve checklist booleans, full CRUD. Stage and status are
free-form fields — nothing prevents setting a request to `Ready to Use` directly.

**TODO**

- [ ] Server-enforced state machine (see 6.2); the UI must only offer legal transitions.
- [ ] Real approval routing: who approves what, and value thresholds (e.g. above 5,000 KWD requires a second approver).
- [ ] Approval delegation for leave/absence.
- [ ] Rejection with a mandatory reason, and resubmission flow.
- [ ] Automatic checklist evaluation — `Equipment available` and `No idle similar equipment` should be queries, not checkboxes.
- [ ] Notifications: email/in-app on submit, approve, reject, and receiving.
- [ ] SLA timers and an escalation path for requests pending too long.
- [ ] Full audit trail per request: who did what, when, from which stage.
- [ ] Attachments on the request itself (scope drawings, site permits).

---

### 6.7 Projects & Cost Control

**Now:** three mock projects with `budget`, `equipmentSpend`, `transportSpend`, `extraSpend`,
`progress` — all typed manually. Linked activity counts are computed by matching **project name
strings** ([app.ts:1051-1061](src/app/app.ts#L1051-L1061)), which silently breaks when a project is
renamed.

**TODO**

- [ ] Link by project **ID**, never by name string.
- [ ] Derive spend from actual cost entries instead of manual totals.
- [ ] Cost entry model: date, project, equipment, category, amount, source document.
- [ ] Budget lines per category with variance reporting and over-budget alerts.
- [ ] Cost allocation rules: how a shared asset's daily cost is split between two projects.
- [ ] Project phases/WBS, if the client needs cost broken down below project level.
- [ ] Derive `progress` from something real (milestones, completed work) or label it clearly as a manual entry.
- [ ] Project close-out: settle rentals, return assets, produce a final cost report.
- [ ] Currency review — KWD is hard-coded throughout; confirm whether multi-currency is ever needed.

---

### 6.8 Rentals & Procurement

**Now:** three mock rentals, **read-only** (no CRUD). Vendors are plain strings. `Overdue` is a
status typed into the mock data, not a calculation.

**TODO**

- [ ] Vendor master: contacts, commercial registration, payment terms, rate card, performance rating.
- [ ] Full CRUD for rentals — currently the only main entity with no edit path.
- [ ] Rental contract: start date, end date, daily/weekly/monthly rate, mobilization and demobilization fees, extension terms.
- [ ] **Calculate** overdue status from `return_date < today`; add a scheduled job for reminders.
- [ ] Rental extension and early-return workflows with cost recalculation.
- [ ] Vendor invoice matching: rental → delivery note → invoice → payment.
- [ ] Rent-vs-buy comparison report — the prototype already tracks utilization, which is the input for it.
- [ ] Alert when an idle owned asset exists while the same type is being rented externally.

---

### 6.9 Transportation & Logistics

**Now:** the weakest module. Three routes and a 24% donut are **hard-coded directly in the HTML**
([app.html:711-751](src/app/app.html#L711-L751)) with no backing data model at all.

**TODO**

- [ ] Create the `TransportMove` model: from, to, equipment, date, carrier, cost, status, ETA.
- [ ] Replace the hard-coded template block with real data.
- [ ] Replace the static donut with a real chart driven by transport cost vs. total equipment spend.
- [ ] Link every move to a request and a project, so transport cost lands in project costs automatically.
- [ ] Carrier/transporter master with rates by route.
- [ ] Trip statuses: planned, dispatched, in transit, delivered, returned.
- [ ] Delivery note with driver, receiver, timestamps, and signature.
- [ ] Permits for oversize loads — likely a real requirement for a 120T crane.
- [ ] GPS/telematics integration is a Level 4 item; note it, do not build it now.

---

### 6.10 Inspections & QHSE

**Now:** three mock inspection records, **read-only**. Media is a **string** — `'8 photos, 1 video'` —
not actual files. Signature status exists as a label only.

**TODO**

- [ ] Real media upload: photos and video to S3/MinIO, thumbnails, and a gallery viewer.
- [ ] Digital signature capture (canvas), stored with the timestamp and signer identity.
- [ ] Configurable inspection templates per equipment type rather than a fixed checklist.
- [ ] Inspection types: pre-use, periodic, post-incident, pre-return.
- [ ] Defect/finding records with severity, assignee, and follow-up until closure.
- [ ] Block the `Ready to Use` transition when an inspection has open critical findings.
- [ ] Certificate expiry tracking (lifting gear in particular — usually a legal requirement).
- [ ] Mobile-friendly inspection form — this is filled in on-site, on a phone, often with poor signal.
- [ ] Offline capture with queued sync. Site connectivity is the number-one reason field ERP modules fail.
- [ ] PDF inspection report with embedded photos and signature.

---

### 6.11 Reporting & Analytics

**Now:** three static cards with fixed text and a note saying reporting is not implemented
([app.ts:223](src/app/app.ts#L223)). The dashboard KPIs are real but computed in the browser over
five mock rows.

**TODO**

- [ ] Move all aggregation server-side (SQL views or a read model).
- [ ] Build the three promised reports for real: equipment utilization summary, rental spend & overdue returns, inspection compliance register.
- [ ] Add: project cost breakdown, idle asset report, transport cost analysis, vendor spend, maintenance cost per asset.
- [ ] Date-range, project, and equipment-type filters on every report.
- [ ] Export to Excel (ClosedXML) and PDF (QuestPDF) — **the `Export Report` button currently does nothing**.
- [ ] Real charts (ngx-charts or ECharts) replacing the CSS bars and the hard-coded donut.
- [ ] Scheduled email reports (weekly fleet summary to management).
- [ ] Executive dashboard with trends over time — everything today is a single point in time.

---

### 6.12 Identity, Access & Security

**Now:** nothing. No login, no users, no roles, no permissions. Anyone with the URL sees and edits
everything.

**TODO**

- [ ] Login, logout, session handling, password reset.
- [ ] Role model: Admin, Project Manager, Site Engineer, Inspector, Procurement, Viewer.
- [ ] Permission matrix per module and per action (who approves, who receives, who inspects, who sees cost).
- [ ] Row-level scoping: a site engineer sees only their assigned projects.
- [ ] Route guards on the frontend **and** authorization on every endpoint — frontend guards are not security.
- [ ] Replace `window.confirm()` deletes ([app.ts:1131-1133](src/app/app.ts#L1131-L1133)) with a proper dialog, and restrict delete to privileged roles.
- [ ] Audit log for authentication events and permission changes.
- [ ] Security headers, HTTPS enforcement, rate limiting.
- [ ] Data retention and privacy review — inspection media may contain identifiable workers.

---

### 6.13 DevOps & Infrastructure

**Now:** one GitHub Actions workflow building the frontend and publishing to GitHub Pages on every
push to `main`. No environments, no secrets, no backend to deploy.

**TODO**

- [ ] Environments: dev, staging, production, with per-environment configuration.
- [ ] Frontend environment files for the API base URL — nothing is configurable today.
- [ ] Object storage for inspection media (S3, Azure Blob or MinIO) — still undecided.
- [ ] Backend build/test/deploy pipeline.
- [ ] Automated database migrations on deploy, with a rollback plan.
- [ ] A staging URL for client review, separate from the public Pages demo.
- [ ] Keep the GitHub Pages demo alive, pointed at seeded data — it is useful for sales.
- [ ] Centralized logging and error tracking (Sentry or Application Insights).
- [ ] Health checks and uptime monitoring.
- [ ] Backup automation with a **restore drill**, not just backups.

---

### 6.14 Quality & Testing

**Now:** one spec file, 122 lines, covering component creation, heading text, module navigation, and
direction/lang attributes. No lint configuration. Prettier is configured in
[package.json](package.json) but there is no `format` script. No e2e tests.

**TODO**

- [ ] Add ESLint (`ng add @angular-eslint/schematics`) and a `lint` npm script.
- [ ] Add `"format": "prettier --write ."` — the config is already there, unused.
- [ ] Run lint, format check, and tests in CI **before** the deploy job. Today an unbuildable-quality commit still deploys.
- [ ] Unit tests for business logic as it moves into services — the checklist and state-machine rules especially.
- [ ] Backend unit and integration tests, including the request state machine.
- [ ] E2E tests (Playwright) for the critical path: create request → approve → receive → inspect → ready.
- [ ] Test the Arabic/RTL path explicitly — the spec only asserts `ltr` today.
- [ ] Accessibility audit: keyboard navigation, focus management, contrast, screen-reader labels on the icon-only buttons.
- [ ] Responsive testing on real tablets and phones — inspections happen on-site.
- [ ] Coverage thresholds in CI once a real suite exists.

---

### 6.15 Product & Documentation

**Now:** the default Angular CLI README plus this guide. No requirements document, no data
dictionary, no user manual.

**TODO**

- [ ] Write the requirements document; validate it against the prototype with actual site staff.
- [ ] Data dictionary: every entity, every field, every status value, every business rule.
- [ ] Record the decisions behind the checklists — why those six checks, who defined them.
- [ ] Replace the CLI boilerplate in [README.md](README.md) with a real project overview.
- [ ] Architecture decision records (ADRs) for: database choice, i18n approach, auth approach.
- [ ] User manual per role, in **Arabic and English** — site staff will need Arabic.
- [ ] Training plan and pilot project for rollout.
- [ ] Data migration plan from whatever the client uses now (almost certainly Excel).

---

## 7. What to do next — recommended order

**Phase 0 — Validate (1–2 weeks, no code)**

1. Demo the prototype to real site staff and management; record what is wrong.
2. Confirm the request/approval rules and the twelve checklist items against actual practice.
3. Confirm Arabic requirements: is it mandatory for all users, and is the Hijri calendar needed?
4. Get the client's current asset list — it determines the real data model.

**Phase 1 — Foundations (3–4 weeks)**

1. Restructure the frontend: routes, feature components, services (§6.1). Do this **before** adding
   features — every week of delay makes the split harder.
2. ~~Stand up the backend skeleton, database, and migrations~~ — done; see §5.
3. Build auth and roles (§6.12). Retrofitting permissions is far more expensive than building them in.

**Phase 2 — Core modules (4–6 weeks)**

1. Projects and Equipment against the real API.
2. Requests with the server-enforced state machine — this is the heart of the system.
3. Rentals with vendors and calculated overdue status.

**Phase 3 — Field modules (3–4 weeks)**

 1. Inspections with real media upload and signatures.
 2. Transport with a real data model.
 3. Mobile/offline handling for site use.

**Phase 4 — Value (2–3 weeks)**

 1. Real reports and exports.
 2. Notifications and scheduled alerts.
 3. Executive dashboard with trends.

---

## 8. Known issues in the current code

Small, specific, and worth fixing whether or not the rewrite happens.

| Issue                                                                 | Location                                              |
| --------------------------------------------------------------------- | ----------------------------------------------------- |
| `Export Report` button does nothing                                 | [app.html](src/app/app.html) header                    |
| Transport module is hard-coded HTML with no model                     | [app.html:711-751](src/app/app.html#L711-L751)         |
| Reports module is static text                                         | [app.html:811-845](src/app/app.html#L811-L845)         |
| Rentals and Inspections have no CRUD                                  | [app.ts:730-779](src/app/app.ts#L730-L779)             |
| Search box in the header is not wired to anything                     | [app.html](src/app/app.html) header                    |
| Notifications bell is decorative                                      | [app.html](src/app/app.html) header                    |
| Project links match on**name strings**, breaking on rename      | [app.ts:1051-1061](src/app/app.ts#L1051-L1061)         |
| Dates are display strings;`formatDateLabel` hard-codes `Jul`      | [app.ts:1095-1107](src/app/app.ts#L1095-L1107)         |
| `dataVersion` counter is a workaround for non-signal arrays         | [app.ts:507](src/app/app.ts#L507)                      |
| Deletes use`window.confirm()` and are unrecoverable                 | [app.ts:1131-1133](src/app/app.ts#L1131-L1133)         |
| Language resets to English on every reload                            | [app.ts:504](src/app/app.ts#L504)                      |
| `routes` array is empty — no URLs, no deep links, no back button   | [app.routes.ts](src/app/app.routes.ts)                 |
| Checks panel always reads`equipmentRequests[0]`, ignoring selection | [app.html:482-501](src/app/app.html#L482-L501)         |
| `localStorage` writes on every change with no quota handling        | [app.ts:1173-1183](src/app/app.ts#L1173-L1183)         |
| No lint config; Prettier configured but has no script                 | [package.json](package.json)                           |
| CI deploys without running tests first                                | [deploy-pages.yml](.github/workflows/deploy-pages.yml) |

---

## 9. Summary

| Question                  | Answer                                                                                        |
| ------------------------- | --------------------------------------------------------------------------------------------- |
| **What is it?**     | Construction equipment ERP — UI prototype stage                                              |
| **Language**        | TypeScript 5.9 (frontend); C# recommended for the backend                                     |
| **Framework**       | Angular 20.3, standalone components + signals                                                 |
| **Database**        | **SQL Server 2022**, EF Core 10, three migrations applied |
| **Backend**         | None today. ASP.NET Core 9 Web API recommended                                                |
| **Storage**         | SQL Server for all modules but Inspections. Media storage still undecided |
| **Auth**            | None. Must be built before any real use                                                       |
| **Tools**           | Angular CLI, Lucide icons, SCSS, Karma/Jasmine, GitHub Actions, GitHub Pages                  |
| **Level**           | **1 of 5** — clickable prototype                                                       |
| **Biggest risk**    | Everything lives in one 1,206-line component. Split it before adding features                 |
| **Biggest gap**     | No backend, no database, no authentication                                                    |
| **Strongest asset** | The Arabic/RTL implementation and the request→inspection flow design                         |
