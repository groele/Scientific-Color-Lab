# Scientific Color Lab Agent Rules

## Product Intent

- Scientific Color Lab is a scientific color workspace for papers, figures, mechanism diagrams, heatmaps, line plots, and online academic documents.
- Prioritize research workflow fit, perceptual color logic, interaction speed, and restrained editorial presentation in that order.
- Avoid generic consumer color-picker patterns, rainbow defaults, red/green dependence, and noisy UI ornament.

## Architecture Boundaries

- `src/app` owns the application shell, routing boundaries, and workspace-level chrome.
- `src/pages` owns route pages. Keep page files thin and compose business components there.
- `src/components/ui` owns reusable primitives and global interaction infrastructure such as toast, language switcher, and input controls.
- `src/components/color` owns the shared swatch primitive and color-specific interactions.
- `src/components/workspace`, `src/components/library`, `src/components/analyzer`, and `src/components/export` own business-facing panels and views.
- `src/domain` owns pure color math, diagnostics, pairing logic, template query logic, and export serialization. Do not move OKLCH logic into React components.
- `src/stores` owns orchestration state. Components should trigger store actions, not reach into Dexie directly.
- `src/db` owns Dexie schemas and repositories.

## Swatch Interaction Contract

- `ColorSwatchButton` is the universal interactive swatch primitive. Do not invent alternate click behavior in feature components.
- Single click on any swatch must immediately copy `#RRGGBB` and show a lightweight toast.
- Double click on any swatch must promote it to the current main color when the context supports that action.
- `Shift + Click` on any swatch must toggle a favoriteable asset path without blocking dialogs.
- Alternate copies for RGB, HSL, Lab, OKLCH, and CSS must be surfaced through the overflow menu or an equivalent contextual action.
- Any new swatch-bearing surface must opt into the same behavior through `useColorActions()`.

## Color-System Rules

- Treat OKLCH / OKLab as the canonical internal representation for generation, interpolation, diagnostics, and storage.
- Do not use HSL as primary generation logic. HSL is display/export only.
- Every visible color object must expose HEX, RGB, HSL, Lab, OKLCH, alpha, CSS-ready values, tags, usage, notes, and timestamps.
- Preserve gamut mapping status explicitly through `gamutStatus`.

## Scientific Safety Rules

- Sequential maps must remain monotonic in lightness.
- Diverging maps should use a quieter midpoint and balanced endpoints.
- Cyclic maps should close smoothly at the endpoints.
- Qualitative palettes should stay compact and sufficiently separated in Delta E.
- New defaults must avoid jet/rainbow behavior and red/green conflict warnings under the diagnostics engine.

## Styling Rules

- Use Tailwind utilities and the local shadcn-style primitives before adding new UI primitives.
- Preserve the three-panel desktop workspace and readable stacked mobile behavior.
- Prefer neutral surfaces, black-first typography, subtle borders, and limited accent use.
- Do not hardcode arbitrary UI colors when a tokenized semantic role already exists.

## Internationalization Rules

- All UI labels, toast messages, help text, status states, and export naming must be routed through the bilingual i18n layer.
- English and Simplified Chinese are first-class. Do not ship new English-only system copy.
- User-facing export and install flows must respect the persisted language preference.

## Persistence And Delivery Rules

- Persist language, copy behavior, diagnostics thresholds, welcome-state, recent project, favorites, export profiles, and library assets locally.
- PWA installability is a release feature, not a demo extra. Keep manifest/service-worker-safe assumptions when changing startup or asset paths.
- Desktop packaging is not part of the current release, but do not introduce architecture that assumes a permanent backend or browser-only globals in domain code.

## Figma And Design-System Rules

- This repository currently has no connected Figma MCP server. Do not claim MCP-generated design rules or Figma sync if they were not actually used.
- Design-system guidance in this repo is manual and code-first.
- If Figma is connected later, treat it as reference input and translate it into this repo's tokens, Tailwind conventions, and reusable component boundaries.
