# Design System Document: The Scholarly Monolith

## 1. Overview & Creative North Star
The Creative North Star for this design system is **"The Digital Archivist."** 

In an academic context, project management is often chaotic. This system rejects the cluttered "productivity porn" of typical SaaS platforms. Instead, it draws inspiration from high-end editorial journals and architectural blueprints. We achieve a "Production-Ready" feel not through heavy borders or loud accents, but through **intentional atmospheric depth** and **typographic authority.** 

By utilizing a monochromatic blue-scale depth and precise vertical rhythm, we transform a utility tool into a premium workspace that commands focus and implies institutional trust.

---

## 2. Colors & Surface Philosophy
We move beyond flat UI by treating the screen as a series of physical planes.

### The "No-Line" Rule
**Prohibit 1px solid borders for sectioning.** Conventional lines create visual noise that exhausts the academic mind. Use background color shifts to define boundaries. 
*   *Implementation:* A side navigation menu should be `surface-container-low`, sitting against a main content area of `surface`.

### Surface Hierarchy & Nesting
Depth is achieved through the stacking of Material-derived surface tiers.
*   **Base Layer:** `surface` (#f7f9ff) – The infinite canvas.
*   **Sectional Layer:** `surface-container-low` (#edf4ff) – Used for large logical groupings.
*   **Interactive Layer:** `surface-container-lowest` (#ffffff) – Used for primary cards or data entry modules to provide a "lifted" appearance against the background.
*   **Emphasis Layer:** `surface-container-highest` (#cee5ff) – Used for active states or highlighted research nodes.

### The "Glass & Gradient" Rule
To avoid a "stale" corporate look, use glassmorphism for floating utility elements (modals, popovers). Use a semi-transparent `surface-container-lowest` with a `blur-xl` backdrop.
*   **Signature Textures:** Apply a subtle linear gradient from `primary` (#00152a) to `primary-container` (#102a43) on primary CTAs to give them a "weight" that feels significant and permanent.

---

## 3. Typography: The Editorial Voice
We use **Inter** as our sole typeface, relying on extreme scale and weight contrast to establish hierarchy rather than color.

*   **The Display Scale:** `display-lg` (3.5rem) should be used sparingly for "Dashboard Overviews" or "Project Milestones," set with a tight letter-spacing (-0.02em).
*   **The Title Scale:** `title-lg` (1.375rem) serves as the primary anchor for data cards.
*   **The Label Scale:** `label-md` (0.75rem) is our workhorse for metadata. It should always be uppercase with a +0.05em letter-spacing to mimic the look of an archival stamp.

The relationship between `headline-sm` and `body-md` is the core of the system: headers should feel architectural, while body text provides high-legibility "reading" comfort.

---

## 4. Elevation & Depth
We eschew the 2010s "Drop Shadow" for **Tonal Layering.**

*   **The Layering Principle:** Place a `surface-container-lowest` card on a `surface-container-low` background. This creates a soft, natural "step" in the UI.
*   **Ambient Shadows:** If an element must float (e.g., a "New Project" FAB), use a shadow color tinted with `on-surface` (#001d32) at 6% opacity with a 32px blur. It should look like a soft shadow on a heavy piece of paper, not a digital glow.
*   **The "Ghost Border" Fallback:** If a border is required for accessibility, use `outline-variant` (#c3c6ce) at 20% opacity. **Never use 100% opaque borders.**

---

## 5. Components

### Structured Forms
*   **Input Fields:** Use `surface-container-lowest` for the fill. The bottom-border only (2px) should use `outline-variant` in the default state and `secondary` (#44617d) on focus.
*   **Labels:** Always use `label-md` positioned exactly `spacing-2` above the input.

### Status Badges (The "Quiet Alert")
Badges should not scream. They should exist as subtle markers.
*   **Approved:** Background: `primary-fixed` (#d1e4ff), Text: `on-primary-fixed` (#011d35).
*   **Pending:** Background: `tertiary-fixed` (#ffddb4), Text: `on-tertiary-fixed` (#291800).
*   **Rejected:** Background: `error-container` (#ffdad6), Text: `on-error-container` (#93000a).

### Data Cards & Lists
*   **Forbid Divider Lines:** Use `spacing-6` of vertical white space to separate list items or cards. 
*   **Interactivity:** On hover, a card should transition from `surface-container-lowest` to `surface-container-high`. This provides a "tactile" feedback loop without moving the element.

### Academic Timeline (Custom Component)
A vertical track using `outline-variant` (20% opacity) with `primary` nodes. Use `body-sm` for date markers and `title-sm` for milestone titles to create an "Academic Roadmap" feel.

---

## 6. Do’s and Don’ts

### Do:
*   **Do** use `primary` (#00152a) for high-impact text and `secondary` (#44617d) for supporting information.
*   **Do** lean into `spacing-10` and `spacing-12` for layout margins to give the content "room to think."
*   **Do** use the `xl` (0.75rem) roundedness for cards to soften the institutional feel, but keep buttons at `md` (0.375rem) for a sharper, more professional edge.

### Don’t:
*   **Don't** use pure black (#000000). Use `primary` or `on-background` to maintain the deep blue tonal integrity.
*   **Don't** use icons without labels in the navigation. In an academic system, clarity beats "minimalist" ambiguity.
*   **Don't** use standard "Warning Yellow." Use the `tertiary` (#201100) and `tertiary-fixed` (#ffddb4) tokens to stay within the "Scholarly Monolith" palette.