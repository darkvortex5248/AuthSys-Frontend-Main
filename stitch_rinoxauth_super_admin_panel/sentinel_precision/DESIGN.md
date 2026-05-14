---
name: Sentinel Precision
colors:
  surface: '#0b1326'
  surface-dim: '#0b1326'
  surface-bright: '#31394d'
  surface-container-lowest: '#060e20'
  surface-container-low: '#131b2e'
  surface-container: '#171f33'
  surface-container-high: '#222a3d'
  surface-container-highest: '#2d3449'
  on-surface: '#dae2fd'
  on-surface-variant: '#bdc8d1'
  inverse-surface: '#dae2fd'
  inverse-on-surface: '#283044'
  outline: '#87929a'
  outline-variant: '#3e484f'
  surface-tint: '#7bd0ff'
  primary: '#8ed5ff'
  on-primary: '#00354a'
  primary-container: '#38bdf8'
  on-primary-container: '#004965'
  inverse-primary: '#00668a'
  secondary: '#4edea3'
  on-secondary: '#003824'
  secondary-container: '#00a572'
  on-secondary-container: '#00311f'
  tertiary: '#ffbcbf'
  on-tertiary: '#67001b'
  tertiary-container: '#ff929a'
  on-tertiary-container: '#8c0028'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#c4e7ff'
  primary-fixed-dim: '#7bd0ff'
  on-primary-fixed: '#001e2c'
  on-primary-fixed-variant: '#004c69'
  secondary-fixed: '#6ffbbe'
  secondary-fixed-dim: '#4edea3'
  on-secondary-fixed: '#002113'
  on-secondary-fixed-variant: '#005236'
  tertiary-fixed: '#ffdadb'
  tertiary-fixed-dim: '#ffb2b7'
  on-tertiary-fixed: '#40000d'
  on-tertiary-fixed-variant: '#92002a'
  background: '#0b1326'
  on-background: '#dae2fd'
  surface-variant: '#2d3449'
typography:
  headline-lg:
    fontFamily: Inter
    fontSize: 30px
    fontWeight: '700'
    lineHeight: 38px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 18px
  label-md:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  code-sm:
    fontFamily: jetbrainsMono
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 18px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  sidebar-width: 260px
  sidebar-collapsed: 64px
  header-height: 64px
  container-gap: 24px
  section-padding: 32px
  gutter: 16px
---

## Brand & Style

The design system is engineered for high-stakes enterprise environments where clarity, security, and data density are paramount. The brand personality is authoritative yet unobtrusive, prioritizing functional efficiency over decorative flourish.

The aesthetic follows a **Corporate Modern** approach infused with **Glassmorphism** and **Minimalist** principles. It utilizes a deep-space color palette to reduce eye strain during long monitoring sessions, while employing subtle translucency and precision borders to define hierarchy without adding visual bulk. The result is a UI that feels sophisticated, secure, and technologically advanced.

## Colors

The color palette is anchored by the "Deep Slate" neutral, providing a low-light foundation that makes data points pop.

- **Primary**: A precise Sky Blue (#38bdf8) used for active states, primary actions, and focus indicators.
- **Success (Emerald)**: Used for healthy system statuses, active sessions, and "Authorized" labels.
- **Danger (Rose)**: Reserved for critical alerts, security breaches, and destructive actions.
- **Warning (Amber)**: Used for throttled requests, expiring certificates, or non-critical system latency.
- **Surface**: Backgrounds utilize a tiered slate system (Slate 900 for the base, Slate 800 for cards) to create logical separation.

## Typography

This design system utilizes **Inter** for all UI elements to ensure maximum legibility at small sizes. The scale is intentionally compact to support high-density data views.

- **Headlines**: Use tight letter spacing and heavier weights to provide clear section anchoring.
- **Body Text**: The default size is 14px (`body-md`) to balance readability with information density.
- **Labels**: Small, all-caps labels with increased tracking are used for table headers and non-interactive metadata.
- **Monospace**: **JetBrains Mono** is introduced for API keys, logs, and technical identifiers to ensure character distinction.

## Layout & Spacing

The layout is a **Fixed-Fluid Hybrid**. A fixed-width collapsible sidebar sits on the left, while the main content area utilizes a fluid grid that adapts to the available viewport.

- **Grid System**: A 12-column grid with 16px gutters. In data-heavy views, content may span all 12 columns to accommodate complex tables.
- **Sidebar**: Features grouped navigation items. When collapsed, it shows only icons; when expanded, it reveals full labels and nested sub-menus.
- **Header**: Sticky glassmorphic bar containing breadcrumbs, global search, and system status indicators.
- **Density**: The spacing rhythm follows a strict 4px baseline. Padding within cards and tables should be minimized to allow more information to be visible above the fold.

## Elevation & Depth

Visual hierarchy is achieved through **Tonal Layering** and **Subtle Outlines** rather than heavy shadows.

- **Surface Levels**: Level 0 is the Deep Slate background. Level 1 is the main content card. Level 2 is for modals and popovers.
- **Borders**: All containers use a 1px solid border (#1e293b). This creates "hard" separation that is more effective in dark themes than shadows.
- **Glassmorphism**: Applied to the Sidebar and Top Header using a `backdrop-filter: blur(12px)` and a semi-transparent slate fill (80% opacity). This creates a sense of depth and allows the content to feel "anchored" to the background.
- **Focus States**: Active elements receive a thin, high-contrast primary blue outer glow (2px spread, 20% opacity) to signify interaction.

## Shapes

The design system uses **Soft (0.25rem)** roundedness to maintain a rigid, professional structure.

- **Standard Elements**: Buttons, input fields, and status badges use a 4px (0.25rem) radius.
- **Containers**: Large cards and the main sidebar use an 8px (0.5rem) radius to provide a slightly softer frame for the overall layout.
- **Interactive States**: Radio buttons are circular, while checkboxes maintain the 4px radius for a consistent structural language.

## Components

### Data Tables
Tables are the core of the admin panel. They feature sticky headers, row-hover highlights in a subtle slate-800, and "Zebra" striping only for extremely wide datasets. Cell padding is condensed (8px vertical).

### Buttons
- **Primary**: Solid Sky Blue with white text.
- **Secondary**: Ghost style with 1px Slate-700 borders, turning Slate-600 on hover.
- **Action**: High-density icon buttons for common table tasks (Edit, Delete, Copy).

### Status Badges
Small, pill-shaped indicators using a low-opacity background of the status color with a high-contrast text label (e.g., Emerald background @ 15% with solid Emerald text).

### Form Inputs
Inputs are dark-filled (Slate-950) with 1px borders. The focus state transitions the border to Primary Blue. Labels are positioned above the input in `label-md` style.

### Collapsible Sidebar
Uses accordion-style grouping for "Authentication," "Users," "Logs," and "System Settings." Active states are marked with a vertical primary-color bar on the left edge.

### Global Search (Command Palette)
A centered, modal-based search triggered by `Cmd+K`. It utilizes heavy glassmorphism and features "Instant Results" categorized by resource type.