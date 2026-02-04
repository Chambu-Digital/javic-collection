# Permission System Documentation

## Overview

The admin panel now uses a granular permission system that allows fine-grained control over what each admin user can access and do. This system is designed to be:

- **Secure**: Only authorized users can access specific features
- **Flexible**: Easy to add new permissions for new features
- **Scalable**: Supports role-based and custom permissions
- **User-friendly**: Clear permission management interface

## Permission Structure

### Permission Format
Permissions follow the format: `resource.action`

Examples:
- `products.view` - View products
- `products.create` - Create new products
- `orders.manage` - Manage orders
- `reviews.moderate` - Moderate reviews

### Available Permissions

#### Dashboard
- `dashboard.view` - Access admin dashboard

#### Product Management
- `products.view` - View products list
- `products.create` - Create new products
- `products.edit` - Edit existing products
- `products.delete` - Delete products
- `categories.view` - View categories
- `categories.manage` - Manage categories

#### Order Management
- `orders.view` - View orders
- `orders.manage` - Manage orders (update status, etc.)
- `orders.export` - Export order data

#### Customer Management
- `customers.view` - View customer list
- `customers.manage` - Manage customer accounts
- `reviews.view` - View reviews
- `reviews.moderate` - Moderate reviews (approve/reject)

#### Content Management
- `blog.view` - View blog posts
- `blog.create` - Create blog posts
- `blog.edit` - Edit blog posts
- `blog.delete` - Delete blog posts

#### Analytics & Reports
- `reports.view` - View reports
- `reports.export` - Export reports

#### System Management
- `shipping.view` - View shipping areas
- `shipping.manage` - Manage shipping areas
- `settings.view` - View settings
- `settings.manage` - Manage settings

#### Admin Management (Super Admin Only)
- `admins.view` - View admin users
- `admins.create` - Create admin users
- `admins.manage` - Manage admin users
- `requests.view` - View admin requests
- `requests.manage` - Manage admin requests

## Role-Based Permissions

### Super Admin
- Has ALL permissions by default
- Can manage other admins
- Can assign permissions to other users

### Admin
- Has basic permissions for most features
- Cannot manage other admins by default
- Can be granted additional permissions

### Custom Permissions
- Individual users can be granted specific permissions
- Custom permissions are added on top of role permissions
- Useful for specialized roles (e.g., content manager, customer support)

## Using Permissions in Code

### 1. Permission Guard Component

Wrap entire pages or sections with permission requirements:

```tsx
import PermissionGuard from '@/components/admin/permission-guard'
import { PERMISSIONS } from '@/lib/permissions'

export default function ProductsPage() {
  return (
    <PermissionGuard permissions={[PERMISSIONS.PRODUCTS_VIEW]}>
      <div>
        {/* Your page content */}
      </div>
    </PermissionGuard>
  )
}
```

### 2. Permission Check Component

Conditionally render elements based on permissions:

```tsx
import { PermissionCheck } from '@/components/admin/permission-guard'
import { PERMISSIONS } from '@/lib/permissions'

<PermissionCheck permissions={[PERMISSIONS.PRODUCTS_CREATE]}>
  <Button>Create Product</Button>
</PermissionCheck>
```

### 3. Permission Hooks

Use hooks for more complex permission logic:

```tsx
import { useHasPermission, useHasAnyPermission } from '@/lib/use-permissions'
import { PERMISSIONS } from '@/lib/permissions'

function MyComponent() {
  const canEdit = useHasPermission(PERMISSIONS.PRODUCTS_EDIT)
  const canManageContent = useHasAnyPermission([
    PERMISSIONS.BLOG_EDIT,
    PERMISSIONS.PRODUCTS_EDIT
  ])

  return (
    <div>
      {canEdit && <EditButton />}
      {canManageContent && <ContentPanel />}
    </div>
  )
}
```

## Navigation System

The admin sidebar automatically filters navigation items based on user permissions:

```tsx
// Navigation items are defined with required permissions
{
  name: 'Products',
  href: '/admin/products',
  icon: Package,
  permissions: [PERMISSIONS.PRODUCTS_VIEW],
}
```

If a user doesn't have the required permissions, the navigation item won't appear.

## Managing Permissions

### 1. Via Admin Interface
- Go to Admin → Admins
- Click on a user to edit their permissions
- Use the permission editor to grant/revoke permissions

### 2. Via API
```typescript
// Update user permissions
PUT /api/admin/permissions
{
  "userId": "user_id",
  "permissions": ["products.view", "products.create"]
}
```

### 3. Programmatically
```typescript
import User from '@/models/User'

// Grant permissions to a user
await User.findByIdAndUpdate(userId, {
  permissions: ['products.view', 'products.create', 'orders.view']
})
```

## Migration

### From Old Permission System
Run the migration script to convert existing permissions:

```bash
npm run migrate:permissions
```

This will:
- Convert old nested permissions to new flat permissions
- Preserve existing permission settings
- Add default permissions based on user roles

### Adding New Features

When adding new features:

1. **Define permissions** in `lib/permissions.ts`:
```typescript
export const PERMISSIONS = {
  // ... existing permissions
  NEW_FEATURE_VIEW: 'new-feature.view',
  NEW_FEATURE_MANAGE: 'new-feature.manage',
}
```

2. **Add to navigation** in `lib/admin-navigation.ts`:
```typescript
{
  name: 'New Feature',
  href: '/admin/new-feature',
  icon: NewIcon,
  permissions: [PERMISSIONS.NEW_FEATURE_VIEW],
}
```

3. **Protect the page**:
```tsx
<PermissionGuard permissions={[PERMISSIONS.NEW_FEATURE_VIEW]}>
  {/* Page content */}
</PermissionGuard>
```

4. **Update role permissions** if needed:
```typescript
export const ROLE_PERMISSIONS = {
  admin: [
    // ... existing permissions
    PERMISSIONS.NEW_FEATURE_VIEW,
  ],
}
```

## Best Practices

1. **Principle of Least Privilege**: Grant only the minimum permissions needed
2. **Regular Audits**: Review user permissions periodically
3. **Role-Based First**: Use roles for common permission sets, custom permissions for exceptions
4. **Clear Naming**: Use descriptive permission names that clearly indicate what they allow
5. **Documentation**: Document any custom permission logic or special cases

## Troubleshooting

### User Can't Access Feature
1. Check if user has required permissions
2. Verify navigation item has correct permissions
3. Check if page is wrapped with PermissionGuard
4. Ensure API endpoints have permission checks

### Permission Not Working
1. Verify permission constant is correctly defined
2. Check if permission is included in role permissions
3. Ensure user has been assigned the permission
4. Clear browser cache and reload

### Migration Issues
1. Backup database before running migration
2. Check migration logs for errors
3. Verify old permissions are preserved in `legacyPermissions`
4. Test with a single user first

## Security Considerations

1. **Server-Side Validation**: Always validate permissions on the server
2. **API Protection**: Protect all API endpoints with permission checks
3. **Client-Side**: Use permission checks for UI only, not security
4. **Audit Logging**: Log permission changes and access attempts
5. **Regular Updates**: Keep permission system updated with new features