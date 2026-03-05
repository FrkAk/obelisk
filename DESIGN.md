# Obelisk Design System

Cool monochrome + Editorial serif + System-adaptive + Refined Liquid Glass.
Inspired by iOS 26 Apple Maps — expensive, elegant, authentic, reduced digital fatigue.

---

## Color Palette — Cool Monochrome + Amber Accent

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `background` | `#FFFFFF` | `#0A0A0A` | Page bg |
| `surface` | `#F5F5F7` | `#141414` | Cards, glass fill |
| `elevated` | `#FFFFFF` | `#1C1C1E` | Elevated surfaces |
| `border` | `rgba(0,0,0,0.06)` | `rgba(255,255,255,0.06)` | Subtle dividers |
| `border-strong` | `rgba(0,0,0,0.12)` | `rgba(255,255,255,0.12)` | Emphasized |
| `text-primary` | `#1D1D1F` | `#F5F5F7` | Headlines, body |
| `text-secondary` | `#6E6E73` | `#A1A1A6` | Captions, metadata |
| `text-tertiary` | `#86868B` | `#6E6E73` | Placeholders |
| `accent` | `#C49A6C` | `#D4AA7C` | Brand amber |
| `accent-subtle` | `rgba(196,154,108,0.12)` | `rgba(212,170,124,0.12)` | Accent bgs |
| `location` | `#3478F6` | `#5E9EFF` | User location |

## Category Colors (5 Muted Groups)

| Group | Categories | Color |
|-------|-----------|-------|
| Heritage | history, architecture, culture, education | `#8B8680` |
| Gastronomy | food, nightlife, shopping | `#A89080` |
| Nature | nature, views, sports, health | `#7A8B7A` |
| Discovery | art, hidden | `#C49A6C` |
| Utility | transport, services | `#8890A0` |

## Typography

Three fonts via `next/font/google`:

| Font | Role | Usage |
|------|------|-------|
| **Instrument Serif** | Display | POI names, brand, titles |
| **Sora** | UI sans | Buttons, labels, metadata |
| **Source Serif 4** | Reading | Remark body, stories, local tips |

### CSS Variables

```css
--font-display: 'Instrument Serif', serif;
--font-ui: 'Sora', sans-serif;
--font-reading: 'Source Serif 4', serif;
```

## Liquid Glass Material

Refined, not removed. Crisp, not muddy.

| Property | Standard | Sheet |
|----------|----------|-------|
| Blur | 16px | 24px |
| Saturation | 150% | 150% |
| Light bg | white @ 65-75% | white @ 70-80% |
| Dark bg | near-black @ 70-80% | near-black @ 75-85% |
| Border | 1px @ 6% opacity | 1px @ 6% opacity |

- Shadows carry depth hierarchy (not blur)
- Sheets: floating state with gap + full rounded corners (iOS 26)
- Progressive corner morphing as sheet expands (rounded → straight)

## Motion

Weighted, not bouncy. Higher damping across all presets.

| Preset | Stiffness | Damping | Use |
|--------|-----------|---------|-----|
| snappy | 400 | 38 | Buttons, quick feedback |
| smooth | 200 | 30 | Content transitions |
| gentle | 150 | 28 | Entries, reveals |
| liquid | 180 | 28 | Sheet transitions |
| quick | 500 | 40 | Micro-interactions |

### Motion Rules

- Entries: fade + subtle translate (no scale bounce)
- Hover: shadow shift, scale 1.005 max
- Tap: scale 0.985
- Sheet: smooth spring with corner radius animation
- Echoes activation: the ONE place for ambient animation (subtle pulse)

## Shadows

```css
--shadow-sm: 0 1px 3px rgba(0,0,0,0.04);
--shadow-md: 0 4px 12px rgba(0,0,0,0.06);
--shadow-lg: 0 8px 24px rgba(0,0,0,0.08);
--shadow-xl: 0 12px 32px rgba(0,0,0,0.12);
--shadow-float: 0 8px 32px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.04);
```
