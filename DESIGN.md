# GiProy product interface contract

## Design thesis

GiProy is an operational construction system. Its interface must disappear into
the work: reliable, compact, legible and coordinated. BIM is an integrated
project workbench, not a catalogue of disconnected specialist panels.

## Visual language

- Use the existing neutral zinc/white surfaces and GiProy safety orange for the
  current location, focus and the single primary action.
- Use one sans-serif product family. Labels and operational values use a fixed
  type scale; tabular figures are preferred for costs, quantities and dates.
- Borders establish technical hierarchy. Shadows are reserved for overlays.
- Use Lucide outline icons consistently. Never use emoji as structural icons.
- Semantic states always combine color with text or an icon.

## Product density

- Use a 4/8 px spacing rhythm and compact controls for fine pointers.
- Preserve a minimum 44 px hit area for coarse pointers through input-aware
  styles; functionality must never depend on hover.
- Empty, loading, error, disabled and read-only states are first-class states.
- Motion communicates state only, normally 150-250 ms, transform/opacity only,
  and respects `prefers-reduced-motion`.

## BIM workbench contract

- Physical baseline: 1920x1080. The shell must also adapt to larger displays,
  higher device pixel ratios and browser zoom by measuring usable CSS space.
- Primary flows: Planificación y costes, Modelo, Coordinación, Seguimiento and
  Entrega. Role/capability filters may alter available tools, never the global
  information architecture.
- Planificación y costes is the default flow because 4D/5D coordination is the
  product priority.
- Primary header maximum: 88 px. The model viewport keeps at least 65% of the
  available width at the baseline.
- Mount at most one side panel. The model explorer and contextual tool replace
  one another; they never overlap or squeeze the viewport together.
- The 4D/5D lower workbench is 220-260 px when expanded and 40 px collapsed.
- Drawers are for search/history, a full workbench is for complex administration,
  and a modal is only for one bounded decision. Never stack modals.
- BIM remains optional. Projects without BIM continue to use budget and Gantt
  without contamination or dead navigation.
- If OmniClass is disabled, show a prominent warning explaining the structural
  divergence. New BIM activation should propose OmniClass enabled by default.
- Safari receives a divergence warning and a Chromium recommendation on macOS
  and iPadOS.

## Quality gates

- Verify at 1920x1080 and the documented DPI matrix; test overflow, focus order,
  keyboard access, coarse-pointer targets, reduced motion and real panel content.
- New BIM tools must enter through the tool registry/context selector. Adding a
  top-level tab or an independently positioned panel requires a design review.
