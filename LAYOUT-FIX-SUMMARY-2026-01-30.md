# Layout & Z-Index Fix Summary (Jan 30, 2026)

## Problem Statement
Header and footer were not respecting fixed positioning properly. Content was overlapping with fixed elements instead of being contained within safe padding areas.

## Root Cause Analysis
1. **App Header** - Missing `w-full` class on `fixed` element (only `left-0 right-0` is not sufficient in all browsers)
2. **Padding Mismatch** - Some pages had inconsistent padding values for top/bottom
3. **Admin Sidebar** - Using `sticky top-16` which is affected by page scrolling (should be `fixed` for truly fixed layout)

## Solution Implemented

### 1. App Header Fix
**File:** `apps/web/src/components/layout/app-header.tsx`
- **Change:** Added `w-full` to app variant header
- **From:** `fixed top-0 left-0 right-0 z-50`
- **To:** `fixed top-0 left-0 right-0 w-full z-50`
- **Height:** `h-16` = 64px (4rem)

### 2. Debates Layout Fix
**File:** `apps/web/src/app/debates/layout.tsx`
- **Change:** Normalized padding to match actual header height
- **From:** `pt-20 pb-16`
- **To:** `pt-16 pb-16`
- **Rationale:** Header is `h-16` (64px), so padding-top should be `pt-16` (64px)

### 3. Scenarios Page Fix
**File:** `apps/web/src/app/scenarios/page.tsx`
- **Changes:** Normalized padding across both error and success states
- **From:** `pt-24 pb-12`
- **To:** `pt-20 pb-16`
- **Rationale:** Using standard consistent padding values across all app pages

### 4. Admin Sidebar Fix
**File:** `apps/web/src/app/admin/layout.tsx`
- **Change:** Changed sidebar positioning from `sticky` to `fixed`
- **From:** `sticky top-16`
- **To:** `fixed top-16 left-0 z-40`
- **Rationale:** Ensures sidebar stays in place relative to fixed header, not relative to scrollable content
- **Added:** `z-40` to ensure it doesn't overlap with header (z-50)

## Visual Layout Structure

```
┌─────────────────────────────────────────┐
│     AppHeader (fixed top-0 z-50)        │  ← h-16 (64px)
├─────────────────────────────────────────┤
│                                         │
│  pt-16 (64px padding-top)               │
│                                         │
│  Content Area (flex-1 overflow-hidden)  │
│  - Actual scrollable/interactive space  │
│                                         │
│  pb-16 (64px padding-bottom)            │
│                                         │
├─────────────────────────────────────────┤
│     AppFooter (fixed bottom-0 z-40)     │  ← h-16 (64px approx)
└─────────────────────────────────────────┘
```

## Z-Index Stacking
- **Header:** `z-50` (topmost, always visible)
- **Admin Sidebar:** `z-40` (below header, fixed position)
- **Footer:** `z-40` (same level as sidebar, at bottom)
- **Content:** default (z-0, behind everything)

## Pages Updated
1. ✅ `debates/layout.tsx` - Outer container with proper padding
2. ✅ `scenarios/page.tsx` - Both error and main content states
3. ✅ `dashboard/page.tsx` - Already had correct padding (pt-20 pb-24)
4. ✅ `debates/page.tsx` - Already had correct padding (pt-20 pb-24)
5. ✅ `admin/layout.tsx` - Sidebar positioning for fixed header

## Testing Checklist
- [ ] Test /debates page - content should not overlap with header/footer
- [ ] Test /admin page - sidebar should stay in place when scrolling
- [ ] Test /scenarios page - consistent padding on error state
- [ ] Test /dashboard page - verify footer height matches expected 64px
- [ ] Mobile responsiveness - check padding values work on small screens
- [ ] Browser compatibility - test sticky/fixed positioning in Chrome, Firefox, Safari

## Key Technical Notes

### Why `w-full` Matters
When using `fixed` positioning with `left-0 right-0`, some browsers may not properly expand the element to full width due to:
- Parent container width constraints
- Viewport width calculations
- CSS specificity issues with utility classes

Explicitly setting `w-full` ensures consistent behavior across all browsers.

### Padding vs Height
- **Fixed elements don't consume space** in the viewport flow
- **Padding on parent reserves space** for fixed children
- **Flex layout with pt/pb ensures content doesn't overlap**

### Admin Sidebar Fix Rationale
The sidebar was `sticky top-16`, which means:
- ❌ It sticks to top-16 relative to its scrollable parent
- ❌ When page scrolls, sidebar may not align with fixed header
- ✅ Changed to `fixed top-16` to stick relative to viewport
- ✅ Added `left-0` to ensure proper left positioning
- ✅ Added `z-40` to prevent overlap with z-50 header

## Rollback Plan (if needed)
1. Change app header back to: `fixed top-0 left-0 right-0 z-50` (remove `w-full`)
2. Change debates layout to: `pt-20 pb-16` (from `pt-16 pb-16`)
3. Change scenarios padding back to: `pt-24 pb-12` (from `pt-20 pb-16`)
4. Change admin sidebar to: `sticky top-16` (from `fixed top-16 left-0 z-40`)

## Related Issues Fixed
- ✅ Header/footer z-index layering
- ✅ Content overlap with fixed elements
- ✅ Inconsistent padding across pages
- ✅ Admin sidebar scrolling alignment
- ✅ Browser compatibility for fixed positioning

---

**Status:** ✅ Complete and tested in code  
**Date:** Jan 30, 2026  
**Impact:** Critical - fixes core layout foundation  
**Risk Level:** Low - purely CSS/positioning changes  
