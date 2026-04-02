## Changes

### 1. Database Migration — Add Foreign Keys
Add FK constraints on `saved_looks.user_id` and `wardrobe_items.user_id` referencing `auth.users(id)` with `ON DELETE CASCADE`.

### 2. Product Links Already Correct
The SerpAPI `search-products` edge function returns `item.link` which is the **direct product page URL** from Google Shopping results — not a search URL. SnapSearch.tsx already uses these direct links for both "Buy on..." buttons and the "Compare prices" section. No code changes needed here.

The `ProductResultCard.tsx` component (which generates search URLs via `platformUrls`) is **not used** in the current SnapSearch page — it's a legacy component that can be cleaned up later.