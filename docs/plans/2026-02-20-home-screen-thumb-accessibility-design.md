# Home Screen Thumb Accessibility Redesign

**Date:** 2026-02-20
**Status:** Approved

## Problem

The current HomeScreen layout has activity buttons at the top of a ScrollView. On modern tall phones, the top of the screen is the hardest area to reach one-handed. Additionally, the screen overflows and requires scrolling to see all content.

## Goals

1. Move buttons into the thumb-accessible zone (bottom portion of the screen)
2. Keep buttons as the primary visual element
3. Eliminate scroll — everything fits on one screen
4. Reduce recent activity to a secondary role, embedded directly in buttons

## Approved Design

### Layout

Single screen, no ScrollView. Uses `flex` to distribute space across any phone size.

```
┌──────────────────────────┐  ← SafeAreaView top
│  Log Activity            │
│  👶 Emma                 │  ← compact header (~60px)
├──────────────────────────┤
│  ┌──────────┐┌──────────┐│
│  │  🍼      ││  💧      ││
│  │  Feed    ││  Diaper  ││  ← flex row 1
│  │  2h ago  ││  45m ago ││
│  └──────────┘└──────────┘│
│  ┌──────────┐┌──────────┐│
│  │  😴      ││  💊      ││
│  │  Sleep   ││  Pump    ││  ← flex row 2 (thumb zone)
│  │  ——      ││  1h ago  ││
│  └──────────┘└──────────┘│
│      ┌──────────────┐     │
│      │  📈  Growth  │     │  ← row 3: centered, half-width
│      │    ——        │     │
│      └──────────────┘     │
└──────────────────────────┘  ← tab bar
```

### Button Design

Each button shows 3 pieces of info stacked vertically:
- **Icon** — large emoji (36px), top
- **Label** — activity name, bold white text
- **Time ago** — "2h ago" or "—" if never logged, secondary color

Visual style unchanged: glass card, color-tint background, glow border, shadow. Buttons use `flex: 1` to fill available vertical space — adapts to any screen height.

### Header

Compact (~60px total):
- Left: "Log Activity" title (~22px)
- Right: baby name pill (👶 Emma), tappable for BabySelector

### Removals

- Separate "Recent" section title and `sectionTitle` style
- Standalone `LastActivityCard` components from HomeScreen
- `ScrollView` wrapper
- Empty state cards (replaced by "—" inline in button)

## Code Changes

| File | Change |
|------|--------|
| `src/screens/HomeScreen.tsx` | Replace ScrollView + grid + cards with flex no-scroll layout |
| `src/components/ActivityButton.tsx` | Add `timeAgo?: string` prop, render below label |
| `src/components/LastActivityCard.tsx` | Unchanged — kept for potential Timeline use |

## Implementation Notes

- Use `flex: 1` on button rows and buttons themselves for screen-size adaptation
- `formatDistanceToNow` from `date-fns` already used in `LastActivityCard` — reuse for button time ago
- 5th button (Growth) centered in its row at ~50% width
- Gap between buttons: 10px
- Padding around grid: 16px
