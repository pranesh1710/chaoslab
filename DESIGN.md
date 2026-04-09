# Design Brief

## Direction

**Control.** Dark engineering dashboard for SREs — production monitoring distilled. Minimalist, focused, zero decoration. Cyan alerts + red emergency stop dominate. Three-app SPA (Experiment Designer, Execution Monitor, Resilience Dashboard) with persistent sidebar.

## Tone

Brutalist engineering tool. Sharp radii (2px max), monochrome neutrals, high information density, and bold typography create a no-nonsense aesthetic. Emergency stop button is visually dominant — impossible to miss.

## Differentiation

Persistent emergency stop overlay (top-right, always visible). Real-time status badges with pulsing animations. Blast radius control visible in every experiment card. Resilience score prominently featured as the app's hero metric. No whitespace waste — SREs expect dense, scannable layouts.

## Color Palette

| Token        | OKLCH        | Role                          |
|--------------|--------------|-------------------------------|
| background   | 0.12 0 0     | Deep charcoal, primary surface |
| foreground   | 0.92 0 0     | Bright neutral text           |
| card         | 0.16 0 0     | Elevated surface              |
| primary      | 0.72 0.2 190 | Cyan — active/healthy states  |
| accent       | 0.72 0.2 190 | Same as primary               |
| muted        | 0.22 0 0     | Secondary UI, disabled        |
| destructive  | 0.65 0.2 25  | Red — emergency/critical      |
| border       | 0.28 0 0     | Subtle dividers               |

## Typography

- Display: **Space Grotesk** — geometric, modern, technical. Headings, hero metrics.
- Body: **General Sans** — clean, highly readable. UI labels, descriptions.
- Mono: **Geist Mono** — logs, code, metric values.
- Scale: hero `text-5xl md:text-7xl font-bold`, h2 `text-3xl font-bold`, label `text-xs font-semibold uppercase tracking-widest`, body `text-base`.

## Elevation & Depth

Minimal shadow hierarchy. Cards use `shadow-subtle` (1px, 15% opacity). Elevated overlays (emergency stop, modals) use `shadow-elevation` (4px, 30% opacity). Borders and contrast create depth, not blur or glow.

## Structural Zones

| Zone    | Background           | Border                        | Notes                                                |
|---------|----------------------|-------------------------------|------------------------------------------------------|
| Sidebar | `bg-sidebar` (0.14)  | `border-sidebar-border` right | Fixed left, dark charcoal, org logo + nav items      |
| Header  | `bg-background` (0.12) | `border-border` bottom        | Emergency stop button (red) top-right, breadcrumbs   |
| Content | `bg-background` (0.12) | —                            | Card-based layout, alternating `bg-card` for sections |
| Footer  | `bg-muted/30`        | `border-border` top           | Log stream, status indicators, semi-transparent      |

## Spacing & Rhythm

Dense information layout (12px gap between cards). Micro-spacing: 4px (input padding), 8px (button padding), 16px (section gap), 24px (major sections). Compact density for SRE workflow — no breathing room for non-critical UI.

## Component Patterns

- **Buttons**: Minimal (text-only) or filled (cyan primary, red destructive). No outlines. Sharp corners (0px radius).
- **Cards**: 2px border (`border-border`), no shadow by default. Hover state lifts to `shadow-subtle`.
- **Badges**: Status badges use `badge-status` utility (2px radius, semibold text). Active: cyan. Inactive: muted. Critical: red.
- **Experiment Cards**: Blast radius indicator on left edge (colored bar, 3px width). Primary action button (cyan) bottom-right.

## Motion

- **Entrance**: Fade in (200ms). No slide or bounce.
- **Hover**: Brightness shift (primary → primary/80) + shadow lift. 150ms smooth.
- **Status Animation**: Blinking badge for live states (`animation-status-blink`, 1.5s step). Pulsing dot for running experiments (`animation-pulse-subtle`, 2s cubic-bezier).
- **Decorative**: None. Motion reserved for state changes only.

## Constraints

- No gradients, no glow, no ambient effects. Flat surfaces only.
- Emergency stop is always a red button — never grey, never disabled. Kill switch must be instantly recognizable.
- Chart colors (palette-1 through -5) are high-contrast and distinguishable for resilience scores and timelines.
- Responsive breakpoints: `sm: 640px`, `md: 768px`, `lg: 1024px`. Mobile-first CSS.

## Signature Detail

Emergency stop button as a persistent, red, always-visible UI element anchored to the top-right. It interrupts the grid and breaks visual hierarchy intentionally — production safety takes visual priority over layout elegance.
