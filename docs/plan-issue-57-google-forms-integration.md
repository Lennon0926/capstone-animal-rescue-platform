# Plan: Issue #57 — Google Forms Adoption Application Integration

## Context

The platform needs a way for visitors to apply to adopt an animal. Instead of building a custom form backend, Google Forms is used as the intake method (zero infra cost, reliable, familiar UX). The feature requires an "Apply to Adopt" button on the animal detail page and on animal cards, with the animal's ID and name pre-filled in the form URL via query parameters. The form URL is configured through an environment variable.

**Branch:** `feature/57-google-forms-adoption-integration`

### Key Findings from Codebase

- `apps/web/.env.example` **already** has `NEXT_PUBLIC_GOOGLE_FORM_URL` defined
- `docs/GOOGLE_FORMS_INTEGRATION.md` **exists** but is incomplete — missing URL param format, field mappings, and the example component uses placeholder entry IDs
- Animal detail component (`apps/web/components/Animal/AnimalInfoPage/animalInfo.tsx`) has a hardcoded `<Link href="/adopt">` button that must be replaced with the Google Form CTA
- Animal cards (`apps/web/components/LandingPage/Animals/animalsSection.tsx`) have "Conoce Más" links but no adopt CTA yet
- Project uses **CSS Modules** + **design tokens** (`var(--color-*)`, `var(--space-*)`) consistently

---

## Implementation Steps

### Step 1 — Create URL Builder Utility

**File:** `apps/web/hooks/useAdoptionFormUrl.ts` *(new)*

Create a pure function (not a hook, no React dependency) that centralizes Google Form URL construction:

```ts
/**
 * Builds the pre-filled Google Form URL for adoption applications.
 * Returns null when NEXT_PUBLIC_GOOGLE_FORM_URL is not configured.
 *
 * Replace ANIMAL_ID and ANIMAL_NAME with the real Google Form entry IDs
 * found via the form's pre-fill tool (see docs/GOOGLE_FORMS_INTEGRATION.md).
 */
export function buildAdoptionFormUrl(
  animalId: number,
  animalName: string
): string | null {
  const base = process.env.NEXT_PUBLIC_GOOGLE_FORM_URL;
  if (!base) return null;

  const params = new URLSearchParams({
    "entry.ANIMAL_ID": String(animalId),
    "entry.ANIMAL_NAME": animalName,
  });

  return `${base}?${params.toString()}`;
}
```

> `entry.ANIMAL_ID` and `entry.ANIMAL_NAME` are placeholders. They must be replaced with the real numeric entry IDs from the Google Form (e.g. `entry.123456789`). See the updated documentation for how to find them.

---

### Step 2 — Update Animal Detail Page

**File:** `apps/web/components/Animal/AnimalInfoPage/animalInfo.tsx`

Replace the `.actions` block:

```tsx
// BEFORE
<div className={styles.actions}>
  <Link href="/adopt" className={styles.adoptButton}>
    Iniciar Proceso de Adopción
  </Link>
</div>
```

```tsx
// AFTER
import { buildAdoptionFormUrl } from "@/hooks/useAdoptionFormUrl";

// Inside AnimalInfo component:
const formUrl = buildAdoptionFormUrl(animal.aid, animal.name);

<div className={styles.actions}>
  {animal.status === "available" && (
    formUrl ? (
      <a
        href={formUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={styles.applyButton}
      >
        Solicitar Adopción
      </a>
    ) : (
      <Link href="/adopt" className={styles.adoptButton}>
        Iniciar Proceso de Adopción
      </Link>
    )
  )}
</div>
```

**Behavior:**
- `status === "available"` + form URL configured → Google Form link (new tab)
- `status === "available"` + no form URL → fallback to existing `/adopt` link
- Any other status → nothing rendered

---

**File:** `apps/web/components/Animal/AnimalInfoPage/animalInfo.module.css`

Add `.applyButton` (accent color to distinguish from the primary button):

```css
.applyButton {
  display: inline-block;
  padding: var(--space-4) var(--space-8);
  background: var(--color-accent);
  color: var(--color-text-inverse);
  border-radius: var(--radius-lg);
  text-decoration: none;
  font-weight: var(--font-weight-semibold);
  box-shadow: var(--shadow-md);
  transition: all var(--transition-fast);
}

.applyButton:hover {
  opacity: 0.9;
  color: var(--color-text-inverse);
  transform: translateY(-2px);
}
```

---

### Step 3 — Add Adoption CTA to Animal Cards

**File:** `apps/web/components/LandingPage/Animals/animalsSection.tsx`

Add "Adoptar" button in each card below "Conoce Más", conditioned on:
1. Animal status is `"Available"`
2. `buildAdoptionFormUrl` returns a non-null URL

```tsx
import { buildAdoptionFormUrl } from "@/hooks/useAdoptionFormUrl";

// Inside card map:
{animal.status === "Available" && (() => {
  const url = buildAdoptionFormUrl(animal.id, animal.name);
  return url ? (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={styles.adoptCta}
    >
      Adoptar
    </a>
  ) : null;
})()}
```

**File:** `apps/web/components/LandingPage/Animals/animalsSection.module.css`

Add `.adoptCta` style:

```css
.adoptCta {
  display: inline-block;
  margin-top: var(--space-2);
  padding: var(--space-2) var(--space-5);
  background: var(--color-accent);
  color: var(--color-text-inverse);
  border-radius: var(--radius-md);
  text-decoration: none;
  font-size: var(--text-sm);
  font-weight: var(--font-weight-semibold);
  transition: all var(--transition-fast);
}

.adoptCta:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}
```

---

### Step 4 — Update Documentation

**File:** `docs/GOOGLE_FORMS_INTEGRATION.md`

Add or update the following sections:

#### URL Parameter Format
```
https://docs.google.com/forms/d/e/{FORM_ID}/viewform?entry.{ANIMAL_ID_ENTRY}={animalId}&entry.{ANIMAL_NAME_ENTRY}={animalName}
```

**How to find entry IDs:**
1. Open your Google Form
2. Click the three-dot menu → "Get pre-filled link"
3. Fill in sample values and click "Get Link"
4. The URL will contain `entry.XXXXXXXXX=value` — those numbers are your entry IDs

#### Field Mappings Table

| URL Param | Form Field | Type |
|-----------|-----------|------|
| `entry.ANIMAL_ID_ENTRY` | Animal ID (hidden) | Short answer |
| `entry.ANIMAL_NAME_ENTRY` | Animal Name (pre-filled) | Short answer |

#### Fallback Behavior
When `NEXT_PUBLIC_GOOGLE_FORM_URL` is not set in the environment:
- Animal detail page falls back to the internal `/adopt` page link
- Animal cards do not show the "Adoptar" CTA
- No errors are thrown

---

## Critical Files Summary

| File | Action |
|------|--------|
| `apps/web/hooks/useAdoptionFormUrl.ts` | **Create** — URL builder utility |
| `apps/web/components/Animal/AnimalInfoPage/animalInfo.tsx` | **Modify** — conditional Google Form CTA |
| `apps/web/components/Animal/AnimalInfoPage/animalInfo.module.css` | **Modify** — add `.applyButton` |
| `apps/web/components/LandingPage/Animals/animalsSection.tsx` | **Modify** — add "Adoptar" CTA to cards |
| `apps/web/components/LandingPage/Animals/animalsSection.module.css` | **Modify** — add `.adoptCta` |
| `docs/GOOGLE_FORMS_INTEGRATION.md` | **Modify** — URL param format, field mappings, fallback docs |
| `apps/web/.env.example` | **No change** — already has `NEXT_PUBLIC_GOOGLE_FORM_URL` |

---

## Acceptance Criteria Verification

| Criterion | How to verify |
|-----------|--------------|
| "Apply to Adopt" button on detail page | Visit `/animalInfo/{id}` for an available animal — button is visible |
| Button opens Google Form in new tab | Click button — new tab opens with the form URL |
| Animal ID/name pre-filled | Inspect the URL in the new tab — query params contain `entry.*` values |
| Form URL configurable via env var | Set `NEXT_PUBLIC_GOOGLE_FORM_URL` — button appears; remove it — fallback shows |
| Fallback when URL not configured | Unset env var → detail page shows `/adopt` link; cards hide CTA |
| CTA on animal cards | Visit home page → available animal cards show "Adoptar" button |
| Documentation updated | `docs/GOOGLE_FORMS_INTEGRATION.md` has URL param format and field mapping table |

### Manual Test Steps
1. Copy env example and configure:
   ```bash
   cp apps/web/.env.example apps/web/.env.local
   # Set: NEXT_PUBLIC_GOOGLE_FORM_URL=https://docs.google.com/forms/d/e/TEST/viewform
   ```
2. Start dev server: `./dev.sh` or `pnpm dev` inside `apps/web`
3. Navigate to `/animalInfo/{id}` for an available animal → verify "Solicitar Adopción" button opens a new tab with pre-filled params
4. Navigate to home page → verify available animal cards show "Adoptar" button
5. Remove `NEXT_PUBLIC_GOOGLE_FORM_URL` from `.env.local`, restart → verify:
   - Detail page shows "Iniciar Proceso de Adopción" (→ `/adopt`)
   - Cards show no adopt CTA
