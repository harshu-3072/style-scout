## Add Foreign Key Constraints to All Tables

Add missing FK constraints so all tables are properly linked in the database:

### Migration SQL:
1. **profiles.user_id** → `auth.users(id)` ON DELETE CASCADE
2. **addresses.user_id** → `auth.users(id)` ON DELETE CASCADE  
3. **cart_items.user_id** → `auth.users(id)` ON DELETE CASCADE
4. **wishlist.user_id** → `auth.users(id)` ON DELETE CASCADE
5. **orders.user_id** → `auth.users(id)` ON DELETE CASCADE
6. **orders.address_id** → `addresses(id)` ON DELETE SET NULL
7. **order_items.order_id** → `orders(id)` ON DELETE CASCADE
8. **saved_looks.user_id** → `auth.users(id)` ON DELETE CASCADE
9. **wardrobe_items.user_id** → `auth.users(id)` ON DELETE CASCADE

### Also add missing triggers:
- `updated_at` trigger on `profiles` and `orders` tables (if not already attached)

### Also attach the `on_auth_user_created` trigger:
- Re-create the trigger on `auth.users` to auto-create profiles (the function exists but trigger may be missing)

This ensures referential integrity and cascading deletes when a user is removed.