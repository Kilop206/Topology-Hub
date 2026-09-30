# UserEx Topology Hub — engineering workspace

The user’s UserEx specification is authoritative. The interface is a working
network repository: content comes before decoration.

## Tokens and typography

`frontend/src/app/tokens.css` owns the palette, spacing, radii, motion and layout
dimensions. Components reference these tokens; do not introduce local palettes.

- Dark backgrounds remain #090B10 / #0F1722 / #182131 / #232D42.
- Inter is the primary interface font, including topology names and headings.
- Orbit identifies the UserEx brand. JetBrains Mono is for IDs, JSON, technical
  numbers and revisions, not navigation, buttons, form labels or descriptions.
- Blue identifies actions and selection. Cyan is reserved for network/code data.
  Green, amber and red require an actual semantic state.
- Thin dividers, 4px corners and alignment define structure. Avoid nested cards,
  decorative slash-labels, all-caps chrome, slogans and persistent success badges.

## Architecture and behavior

- `Shell`: compact sidebar with UserEx, navigation, KNS and account. Mobile uses
  an accessible disclosure menu, retaining all destinations and account actions.
- `Catalogue`: heading, repository tabs, search, filters, ordering and count.
  Default ordering retains backend pagination. Alternate ordering and filters
  fetch all matching pages before sorting, so controls never affect only one page.
  Server-side ordering/filtering would improve scalability for large repositories;
  the API and DTO contracts are unchanged.
- `TopologyCard`: horizontal repository object, actual graph preview, name,
  description, visibility, configured link metrics, revision/date and author.
  Collection view is explicitly separate from the object component.
- `GraphPreview`: existing SVG renderer, controlled or local selection, keyboard
  node/link inspection, drag-to-pan, zoom, fit, layout, labels and fullscreen.
  `graph-layout.ts` calculates deterministic positions. Automatic mode uses BFS
  layers for small networks and a grid above 128 nodes. Circular/grid are explicit
  alternatives. Full canvas supports the API limits (5,000 nodes / 20,000 links);
  small previews show up to 32 nodes / 100 links and label partial data.
- `TopologyInspector`: topology data when unselected, node connections or link
  configuration on selection. Collapsible on small screens; selection reopens it.
  No invented node names, IPs, health, protocols or simulation telemetry.
- `TopologyDetail`: compact actions above canvas/inspector, followed by overview,
  nodes, links, JSON and current revision. Revision history is not available from
  the API and is stated explicitly; current revision is not a history snapshot.
- `TopologyEditor`: save in the heading, metadata/JSON alongside network preview,
  import preserved, syntax errors near the editor and authoritative API validation
  on save. Extra JSON fields remain untouched.
- `JsonViewer`: line numbers, restrained highlighting, copy/download.
- Request states are first-class. Keyboard focus, tab navigation and reduced
  motion are preserved. Tables scroll horizontally; the canvas has fullscreen.

## Scope

No backend routes, models, security, session handling or DTOs were changed.
OAuth still requires provider credentials. Rich node attributes, revision history
and measured telemetry depend on actual backend data rather than UI placeholders.
