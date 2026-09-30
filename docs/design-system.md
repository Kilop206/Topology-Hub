# UserEx / Hybrid Controlled

Topology Hub is an engineering repository, not a marketing dashboard. The user's
UserEx specification is authoritative for all future visual changes.

## Source of truth

`frontend/src/app/tokens.css` owns colors, borders, spacing, radius, motion and
typographic roles. Components use tokens and shared classes; do not introduce
per-screen palettes or inline SVG colors.

- Dark backgrounds: `#090B10`, `#0F1722`, `#182131`, `#232D42`.
- Blue is interaction and UserEx identity; cyan is network data and selection.
- Purple is reserved for actual experimental features, not decorative use.
- Semantic status colors require real states and visible text.
- Orbit: brand and major titles. Inter: interface. JetBrains Mono: data and code.
- Fonts are bundled via Fontsource; Lucide is the only application icon library.
- Prefer 4/8 px radius, thin borders and surface contrast over shadows.

## Components and behavior

- `Shell`: persistent UserEx relationship, navigation, account and system context.
- `TopologyCard`: actual topology preview, UUID, current revision, configured
  metrics, author and timestamp. No fabricated tags, protocols or health labels.
- `GraphPreview`: deterministic circular layout, selected node, incident links,
  keyboard interaction and zoom. Partial previews are labeled; tables/downloads
  preserve all data. It is a visualization, not a simulation or live telemetry.
- `TopologyDetail`: graph, node/link tables, metadata, configured-link metrics and
  JSON. Revision means optimistic concurrency version, not historical snapshots.
- `JsonViewer`: line numbers, restrained highlighting, copy and download.
- `EmptyState`, `ErrorState`, `LoadingState`: explicit request states, no cartoons.

Desktop uses a fixed navigation rail and aligned modules. Tablet collapses the
rail. Mobile stacks metadata and retains horizontally scrollable data tables.
All navigation and graph controls remain usable by keyboard, with visible focus
and reduced-motion support. Do not add mock telemetry or nonfunctional controls
for favorites, collections, simulations or external applications.
