# All Friends — Style Primer

## Brand Direction

**App personality:** Friendly app that helps you be a better friend.

**Vibe:** Warm, approachable, human. Think Duolingo, Headspace, Notion—not Linear or Stripe. This is a personal tool for nurturing relationships, not enterprise software.

**Key principles:**
- Warm over cold
- Rounded over sharp
- Playful over corporate
- Human over mechanical

---

## Color Palette

### Primary Colors

| Name | Hex | Usage |
|------|-----|-------|
| Coral | `#FF6B6B` | Primary buttons, key accents, brand color |
| Coral Dark | `#E85555` | Hover states for coral elements |
| Coral Light | `#FFE5E5` | Subtle backgrounds, highlights |

### Secondary Colors

| Name | Hex | Usage |
|------|-----|-------|
| Teal | `#4ECDC4` | Secondary accents, success states, icons |
| Teal Dark | `#3DB9B1` | Hover states for teal elements |
| Teal Light | `#E0F7F5` | Subtle backgrounds, cards |

### Neutrals

| Name | Hex | Usage |
|------|-----|-------|
| Gray 900 | `#1A1A2E` | Headings, primary text |
| Gray 700 | `#4A4A5A` | Body text |
| Gray 500 | `#7A7A8A` | Secondary text, placeholders |
| Gray 200 | `#E5E5EA` | Borders, dividers |
| Gray 100 | `#F5F5F7` | Page backgrounds, card backgrounds |
| White | `#FFFFFF` | Card backgrounds, contrast elements |

### Semantic Colors

| Name | Hex | Usage |
|------|-----|-------|
| Success | `#4ECDC4` | Use teal |
| Warning | `#FFB86C` | Amber/orange for warnings |
| Error | `#FF6B6B` | Use coral for errors |

---

## Typography

### Font Stack

**Primary font:** `'DM Sans', 'Inter', system-ui, sans-serif`

DM Sans is warmer and friendlier than Inter alone. If not available, fall back to Inter.

### Type Scale

| Element | Size | Weight | Line Height |
|---------|------|--------|-------------|
| H1 (Hero) | 48px / 3rem | 700 | 1.1 |
| H2 (Section) | 32px / 2rem | 600 | 1.2 |
| H3 (Card title) | 20px / 1.25rem | 600 | 1.3 |
| Body | 16px / 1rem | 400 | 1.6 |
| Body Small | 14px / 0.875rem | 400 | 1.5 |
| Caption | 12px / 0.75rem | 500 | 1.4 |

### Text Colors

- Headings: Gray 900 (`#1A1A2E`)
- Body: Gray 700 (`#4A4A5A`)
- Secondary/muted: Gray 500 (`#7A7A8A`)
- Links: Coral (`#FF6B6B`)

---

## Spacing & Radius

### Border Radius

| Element | Radius |
|---------|--------|
| Buttons | 12px |
| Cards | 16px |
| Input fields | 10px |
| Avatars/icons | 50% (circle) or 12px |
| Modals | 20px |

**Note:** Round everything more than you think. Sharp corners feel corporate.

### Spacing Scale

Use an 8px base: `4, 8, 12, 16, 24, 32, 48, 64, 96`

---

## Components

### Buttons

**Primary Button (Coral)**
```css
background: #FF6B6B;
color: white;
padding: 12px 24px;
border-radius: 12px;
font-weight: 600;
transition: all 0.2s ease;

/* Hover */
background: #E85555;
transform: translateY(-1px);
box-shadow: 0 4px 12px rgba(255, 107, 107, 0.3);
```

**Secondary Button (Outline)**
```css
background: transparent;
color: #1A1A2E;
border: 2px solid #E5E5EA;
padding: 12px 24px;
border-radius: 12px;
font-weight: 600;

/* Hover */
border-color: #FF6B6B;
color: #FF6B6B;
```

**Ghost Button**
```css
background: transparent;
color: #7A7A8A;
padding: 8px 16px;

/* Hover */
color: #FF6B6B;
background: #FFE5E5;
```

### Cards

```css
background: white;
border-radius: 16px;
padding: 24px;
border: 1px solid #E5E5EA;
box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);

/* Hover (if interactive) */
border-color: #4ECDC4;
box-shadow: 0 4px 16px rgba(78, 205, 196, 0.15);
transform: translateY(-2px);
```

### Feature Cards (Landing Page)

- Add a subtle teal or coral accent (left border, icon background, or top gradient)
- Each card should have an icon with a colored background circle
- Example icon treatment:

```css
.icon-wrapper {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: #E0F7F5; /* Teal light */
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-wrapper svg {
  color: #4ECDC4; /* Teal */
  width: 24px;
  height: 24px;
}
```

Alternate icon backgrounds between `#E0F7F5` (teal light) and `#FFE5E5` (coral light) for visual variety.

---

## Landing Page Specific

### Hero Section

**Current problem:** Empty, cold, corporate.

**Fix:**
1. Add a warm gradient background:
   ```css
   background: linear-gradient(135deg, #FFF5F5 0%, #E0F7F5 100%);
   ```
   
2. Add an illustration or app screenshot
   - Option A: Simple illustration of people/connections
   - Option B: Stylized screenshot of the app with a slight tilt/shadow
   - Option C: Abstract friendly shapes (circles, waves) in coral/teal

3. Rewrite headline for warmth:
   - Current: "Your Personal Relationship Manager"
   - Better: "Be the friend you wish you had"
   - Or: "Remember the little things about the people you love"

4. Rewrite subhead:
   - Current: "Stay connected with the people who matter most..."
   - Better: "Life gets busy. All Friends helps you stay close to the people you care about—with gentle reminders, conversation notes, and a little help remembering what matters."

### Feature Cards Grid

**Current problem:** All cards look identical, no visual hierarchy.

**Fix:**
1. Add colored icon backgrounds (alternating coral light / teal light)
2. Consider making 1-2 "hero" features larger or highlighted
3. Add subtle hover animations

### CTA Section

**Current problem:** Plain "Get Started for Free" on white.

**Fix:**
1. Add a warm background:
   ```css
   background: linear-gradient(135deg, #FF6B6B 0%, #4ECDC4 100%);
   ```
2. White text on gradient
3. Slightly playful copy: "Ready to be a better friend?" or "Your relationships will thank you."

---

## Tailwind Config (if using Tailwind)

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        coral: {
          50: '#FFE5E5',
          100: '#FFCCCC',
          200: '#FF9999',
          300: '#FF6B6B',  // Primary
          400: '#E85555',
          500: '#D14545',
        },
        teal: {
          50: '#E0F7F5',
          100: '#B3EBE6',
          200: '#80DED5',
          300: '#4ECDC4',  // Primary
          400: '#3DB9B1',
          500: '#2CA59D',
        },
        gray: {
          100: '#F5F5F7',
          200: '#E5E5EA',
          500: '#7A7A8A',
          700: '#4A4A5A',
          900: '#1A1A2E',
        },
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
        '3xl': '20px',
      },
      fontFamily: {
        sans: ['DM Sans', 'Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
}
```

---

## CSS Variables (if using CSS variables)

```css
:root {
  /* Primary */
  --color-coral: #FF6B6B;
  --color-coral-dark: #E85555;
  --color-coral-light: #FFE5E5;
  
  /* Secondary */
  --color-teal: #4ECDC4;
  --color-teal-dark: #3DB9B1;
  --color-teal-light: #E0F7F5;
  
  /* Neutrals */
  --color-gray-900: #1A1A2E;
  --color-gray-700: #4A4A5A;
  --color-gray-500: #7A7A8A;
  --color-gray-200: #E5E5EA;
  --color-gray-100: #F5F5F7;
  --color-white: #FFFFFF;
  
  /* Semantic */
  --color-success: var(--color-teal);
  --color-warning: #FFB86C;
  --color-error: var(--color-coral);
  
  /* Radius */
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 20px;
  
  /* Shadows */
  --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.04);
  --shadow-md: 0 4px 16px rgba(0, 0, 0, 0.08);
  --shadow-coral: 0 4px 12px rgba(255, 107, 107, 0.3);
  --shadow-teal: 0 4px 12px rgba(78, 205, 196, 0.3);
}
```

---

## Checklist for Claude Code

- [ ] Update Tailwind config with new color palette
- [ ] Replace all `bg-black` buttons with coral (`bg-coral-300`)
- [ ] Add `font-family: 'DM Sans'` (add Google Font import)
- [ ] Increase border-radius on all buttons and cards
- [ ] Add gradient background to hero section
- [ ] Add colored backgrounds to feature card icons
- [ ] Update hover states to use coral/teal
- [ ] Warm up the copy (see suggestions above)
- [ ] Add subtle box-shadows to cards
- [ ] Consider adding an illustration to the hero section
- [ ] Update the footer CTA section with gradient background

---

## Reference Apps for Inspiration

- **Duolingo** — Playful, colorful, encouraging
- **Headspace** — Warm, calming, human illustrations
- **Notion** — Clean but friendly, good use of illustrations
- **Raycast** — Modern but approachable
- **Linear** — Too cold, avoid this direction

---

## What NOT to Do

- No sharp corners (don't use `rounded-none` or `rounded-sm`)
- No pure black text (use `gray-900` instead of `#000`)
- No corporate stock photos
- No cold blues or enterprise grays as primary colors
- No tiny, utilitarian icons—give them presence with backgrounds
