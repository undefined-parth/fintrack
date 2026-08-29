---
name: FinTrack
description: Personal finance dashboard with a premium, technical-luxury dark aesthetic.
colors:
  primary: '#a78bfa'
  secondary: '#34d399'
  tertiary: '#fb7185'
  warning: '#f59e0b'
  neutral-bg: '#09090b'
  neutral-surface: '#18181b'
  neutral-surface-variant: '#1c1c1f'
  neutral-ink: '#fafafa'
  neutral-ink-muted: '#a1a1aa'
  outline: '#71717a'
  outline-variant: '#3f3f46'
typography:
  display:
    fontFamily: 'Sora, DM Sans, system-ui, sans-serif'
    fontSize: 'clamp(1.5rem, 4vw, 2.5rem)'
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: '-0.02em'
  body:
    fontFamily: 'DM Sans, system-ui, sans-serif'
    fontSize: '14px'
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 'normal'
  mono:
    fontFamily: 'JetBrains Mono, ui-monospace, monospace'
    fontSize: '12px'
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: 'normal'
rounded:
  sm: '6px'
  md: '12px'
  lg: '16px'
  full: '9999px'
spacing:
  xs: '4px'
  sm: '8px'
  md: '16px'
  lg: '24px'
  xl: '32px'
components:
  card:
    backgroundColor: '{colors.neutral-surface}'
    rounded: '{rounded.lg}'
    padding: '20px'
    border: '1px solid rgba(63, 63, 70, 0.15)'
  button-primary:
    backgroundColor: '{colors.primary}'
    textColor: '#1e1b2e'
    rounded: '{rounded.md}'
    padding: '10px 20px'
  button-primary-hover:
    backgroundColor: '#c084fc'
---

# Design System: FinTrack

## 1. Overview

**Creative North Star: "The Obsidian Ledger"**

FinTrack employs a premium, high-density dashboard system built on a deep zinc-black base ("Obsidian"). It avoids glowing neon sci-fi extremes or saturated pastel creams, choosing instead a restrained dark canvas where data and structural hierarchy carry the premium feel. The UI features crisp boundaries, a monospace focus for numbers, and a single soft violet accent color.

### Key Characteristics:

- **Obsidian Dark Canvas**: Very dark near-black backgrounds (`#09090b`) with a subtle radial gradient highlight in primary violet.
- **Monospace Financials**: Financial indicators, currencies, and numbers are rendered in monospace to emphasize structured precision.
- **Fine Borders over Cast Shadows**: Structural layout blocks are defined by thin, semi-transparent border lines (`border-outline-variant/15`) rather than heavy drop shadows.

## 2. Colors

The color palette is split into a dark Obsidian neutral base, a soft violet primary brand color, and semantic indicators for transactions (Emerald for income, Rose Coral for expense).

### Primary

- **Soft Violet** (`#a78bfa`): Used for active highlights, focus rings, primary actions, and primary status markers.

### Secondary

- **Emerald** (`#34d399`): Semantic color indicating positive cash flow, income transactions, active accounts, and positive growth.

### Tertiary

- **Rose Coral** (`#fb7185`): Semantic color indicating negative cash flow, expenses, debt liabilities, and warnings.

### Neutral

- **Obsidian Background** (`#09090b`): The dark workspace canvas.
- **Zinc Surface** (`#18181b`): The surface container color for cards, panels, and sidebars.
- **On-Surface Ink** (`#fafafa`): High-contrast text ink.
- **Ink Muted** (`#a1a1aa`): Medium-contrast text for helper labels, subtitles, and secondary info.

### Named Rules

**The Rarity Rule.** Primary violet is used on ≤10% of any given screen. Visual weight should remain dark and neutral, ensuring that interactive highlights stand out clearly.
**The No-Faux-Grey Rule.** Text on tinted cards should not use pure neutral grey. Instead, use transparent black/white mixes or tinted versions of the container to prevent a washed-out appearance.

## 3. Typography

**Display Font:** Sora (with DM Sans, system-ui fallback)
**Body Font:** DM Sans (with system-ui fallback)
**Label/Mono Font:** JetBrains Mono (for numbers, currencies, dates, and codes)

### Hierarchy

- **Display** (Bold (700), clamp(1.5rem, 4vw, 2.5rem), line-height: 1.2): Used for primary page titles.
- **Headline** (Semi-Bold (600), 18px, line-height: 1.3): Used for main card or section headers.
- **Title** (Medium (500), 14px, line-height: 1.4): Used for item names, form labels.
- **Body** (Regular (400), 14px, line-height: 1.5): Used for descriptions and general interface text.
- **Label / Mono** (Medium (500), 12px, line-height: 1.4): Used for monetary values, transaction records, and metadata tags.

## 4. Elevation

Depth is created primarily using tonal layering (nesting `#18181b` containers inside a `#09090b` canvas) combined with thin, low-opacity border strokes (`border border-outline-variant/15`). Traditional heavy box shadows are omitted to maintain a clean, flat design.

### Shadow Vocabulary

- **Interactive Focus Glow** (`0 0 40px rgba(167, 139, 250, 0.15)`): Used on active items like profile states or active hover transitions.

### Named Rules

**The Flat-By-Default Rule.** Containers do not float or cast shadows at rest. They are layered flat via background color variation and outline borders.

## 5. Components

### Cards / Containers

- **Corner Style**: Rounded Large (`16px`).
- **Background**: Zinc Surface (`#18181b`).
- **Border**: 1px solid container stroke (`rgba(63, 63, 70, 0.15)`).
- **Internal Padding**: Spacing Large (`20px`).

### Buttons

- **Shape**: Rounded Medium (`12px`).
- **Primary**: Soft Violet (`#a78bfa`) background with deep dark text (`#1e1b2e`).
- **Hover/Focus**: Shifts background brightness (`#c084fc`) with a subtle transition (`transition-all duration-200`).

### Inputs / Fields

- **Style**: Thin border stroke, dark background, rounded medium.
- **Focus**: Border shifts to primary violet, with a custom outline focus ring.

### Navigation

- **Sidebar**: Thick border-r (`border-outline-variant/15`), dark surface (`#09090b`). Navigation links use a transparent indicator (`bg-primary/10`) on active states.

## 6. Do's and Don'ts

### Do:

- **Do** render all currency amounts, transactions, interest rates, and numeric dates using the `JetBrains Mono` font for clean vertical alignment.
- **Do** use thin, transparent borders (`border border-outline-variant/15`) to delineate card layouts rather than rely on shadows.
- **Do** constrain uppercase text headings to letter-spacing of `tracking-wider` or `tracking-[0.15em]` and keep sizes small (under 12px).

### Don't:

- **Don't** use over-rounded corners (32px or more) on cards, inputs, or dashboard components. Limit standard card radii to `16px`.
- **Don't** use side-stripe borders (e.g. `border-left-4`) as colored accent lines on cards or notification banners.
- **Don't** use gradient text under any circumstances.
- **Don't** use low-contrast grey text for descriptions or body copy. Ensure it remains above 4.5:1 contrast against dark backgrounds.
