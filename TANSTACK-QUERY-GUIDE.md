# TanStack Query (React Query) Implementation Guide

## 🎯 What TanStack Query Does

TanStack Query solves these problems:
- ✅ **Request Deduplication**: Multiple components requesting the same data = 1 API call
- ✅ **Automatic Caching**: Data is cached and reused across your app
- ✅ **Background Refetching**: Keeps data fresh automatically
- ✅ **Optimistic Updates**: UI updates instantly, syncs with server later
- ✅ **Loading & Error States**: Built-in handling for all async states
- ✅ **Pagination & Infinite Scroll**: Easy to implement

---

## 📦 Installation (Already Done)

```bash
npm install @tanstack/react-query @tanstack/react-query-devtools
```

---

## 🏗️ Setup (Already Done)

1. **Query Client** (`lib/query-client.ts`) - Configured with optimal defaults
2. **Query Provider** (`components/providers/query-provider.tsx`) - Wraps your app
3. **Root Layout** - QueryProvider added to `app/layout.tsx`

---

## 🚀 Usage Examples

### 1. Basic Query - Fetch Products

**Before (Traditional fetch):**
```tsx
'use client'
import { useEffect, useState } from 'react'

export default function ProductList() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch('/api/products')
      .then(res => res.json())
      .then(data => {
        setProducts(data.products)
        setLoading(false)
      })
      .catch(err => {
        setError(err)
        setLoading(false)
      })
  }, [])

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>

  return (
    <div>
      {products.map(product => (
        <div key={product._id}>{product.name}</div>
      ))}
    </div>
  )
}
```

**After (With TanStack Query):**
```tsx
'use client'
import { useProducts } from '@/lib/hooks/use-products'

export default function ProductList() {
  const { data, isLoading, error } = useProducts({ limit: 20 })

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>

  return (
    <div>
      {data?.products.map(product => (
        <div key={product._id}>{product.name}</div>
      ))}
    </div>
  )
}
```

---

### 2. Request Deduplication (The Big Win!)

**Scenario**: 3 components on the same page all need products

```tsx
// Component 1: Product List
function ProductList() {
  const { data } = useProducts() // API call made
  return <div>{/* render products */}</div>
}

// Component 2: Product Count
function ProductCount() {
  const { data } = useProducts() // Uses cached data! No API call
  return <div>Total: {data?.total}</div>
}

// Component 3: Product Filter
function ProductFilter() {
  const { data } = useProducts() // Uses cached data! No API call
  return <div>{/* render filters */}</div>
}
```

**Result**: Only 1 API call is made, data is shared across all 3 components!

---

### 3. Filtering & Pagination

```tsx
'use client'
import { useProducts } from '@/lib/hooks/use-products'
import { useState } from 'react'

export default function FilteredProducts() {
  const [category, setCategory] = useState('lingerie')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useProducts({ 
    category, 
    page, 
    limit: 12 
  })

  return (
    <div>
      <select onChange={(e) => setCategory(e.target.value)}>
        <option value="lingerie">Lingerie</option>
        <option value="sleepwear">Sleepwear</option>
      </select>

      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {data?.products.map(product => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      )}

      <button onClick={() => setPage(p => p - 1)} disabled={page === 1}>
        Previous
      </button>
      <button onClick={() => setPage(p => p + 1)} disabled={page >= data?.totalPages}>
        Next
      </button>
    </div>
  )
}
```

---

### 4. Single Product with Automatic Caching

```tsx
'use client'
import { useProduct } from '@/lib/hooks/use-products'

export default function ProductDetails({ productId }: { productId: string }) {
  const { data: product, isLoading, error } = useProduct(productId)

  if (isLoading) return <ProductSkeleton />
  if (error) return <ErrorMessage error={error} />
  if (!product) return <div>Product not found</div>

  return (
    <div>
      <h1>{product.name}</h1>
      <p>{product.description}</p>
      <p className="text-2xl font-bold">${product.price}</p>
      <AddToCartButton product={product} />
    </div>
  )
}
```

---

### 5. Mutations - Creating Orders

```tsx
'use client'
import { useCreateOrder } from '@/lib/hooks/use-orders'
import { useRouter } from 'next/navigation'

export default function CheckoutButton({ cart }: { cart: any }) {
  const router = useRouter()
  const createOrder = useCreateOrder()

  const handleCheckout = () => {
    createOrder.mutate(
      {
        items: cart.items,
        customer: cart.customer,
        total: cart.total,
      },
      {
        onSuccess: (data) => {
          router.push(`/checkout/success?order=${data.orderNumber}`)
        },
        onError: (error) => {
          alert('Failed to create order: ' + error.message)
        },
      }
    )
  }

  return (
    <button 
      onClick={handleCheckout} 
      disabled={createOrder.isPending}
    >
      {createOrder.isPending ? 'Processing...' : 'Place Order'}
    </button>
  )
}
```

---

### 6. Optimistic Updates - Stock Updates

```tsx
'use client'
import { useUpdateProductStock } from '@/lib/hooks/use-products'

export default function AddToCartButton({ product }: { product: Product }) {
  const updateStock = useUpdateProductStock()

  const handleAddToCart = () => {
    // Optimistically update the UI immediately
    updateStock.mutate(
      { productId: product._id, quantity: -1 },
      {
        onError: (error) => {
          alert('Failed to add to cart')
        }
      }
    )
  }

  return (
    <button onClick={handleAddToCart}>
      Add to Cart
    </button>
  )
}
```

---

### 7. Real-time Order Tracking

```tsx
'use client'
import { useTrackOrder } from '@/lib/hooks/use-orders'

export default function OrderTracker({ orderNumber }: { orderNumber: string }) {
  const { data: order, isLoading } = useTrackOrder(orderNumber)
  // Auto-refetches every 5 minutes to show latest status!

  if (isLoading) return <div>Loading order...</div>

  return (
    <div>
      <h2>Order {orderNumber}</h2>
      <div className={`status-badge status-${order?.status}`}>
        {order?.status}
      </div>
      <Timeline order={order} />
    </div>
  )
}
```

---

### 8. Featured Products (Heavily Cached)

```tsx
'use client'
import { useFeaturedProducts } from '@/lib/hooks/use-products'

export default function FeaturedSection() {
  const { data, isLoading } = useFeaturedProducts({ limit: 8 })
  // Cached for 10 minutes - perfect for homepage

  if (isLoading) return <FeaturedSkeleton />

  return (
    <section>
      <h2>Featured Products</h2>
      <div className="grid grid-cols-4 gap-4">
        {data?.products.map(product => (
          <ProductCard key={product._id} product={product} />
        ))}
      </div>
    </section>
  )
}
```

---

## 🛠️ Available Hooks

### Products
- `useProducts(filters)` - Fetch products with filters
- `useProduct(id)` - Fetch single product by ID
- `useProductBySlug(slug)` - Fetch product by slug
- `useFeaturedProducts(options)` - Fetch featured products
- `useUpdateProductStock()` - Mutation for stock updates

### Categories
- `useCategories()` - Fetch all categories (heavily cached)
- `useCategory(id)` - Fetch single category

### Orders
- `useOrders(filters)` - Fetch orders with filters
- `useOrder(id)` - Fetch single order (auto-refreshes)
- `useTrackOrder(orderNumber)` - Track order by number
- `useCreateOrder()` - Mutation to create orders
- `useUpdateOrderStatus()` - Mutation to update order status

---

## 🎨 DevTools

In development, you'll see a **TanStack Query DevTools** button in the bottom-right corner.

Click it to see:
- All active queries
- Cache contents
- Query states (loading, error, success)
- Network activity
- Cache invalidation

---

## 🔧 Configuration

### Cache Times (in `lib/query-client.ts`)

```typescript
staleTime: 5 * 60 * 1000,  // Data is fresh for 5 minutes
gcTime: 10 * 60 * 1000,    // Keep unused data for 10 minutes
```

**Adjust per hook:**
```typescript
// Categories rarely change - cache longer
export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
    staleTime: 30 * 60 * 1000, // 30 minutes
  })
}

// Orders change frequently - shorter cache
export function useOrders() {
  return useQuery({
    queryKey: ['orders'],
    queryFn: fetchOrders,
    staleTime: 1 * 60 * 1000, // 1 minute
  })
}
```

---

## 📊 Performance Benefits

### Before TanStack Query
```
ProductList component → fetch(/api/products)
ProductCount component → fetch(/api/products)  
ProductFilter component → fetch(/api/products)

= 3 API calls, 3x DB queries
```

### After TanStack Query
```
ProductList component → fetch(/api/products)
ProductCount component → use cache
ProductFilter component → use cache

= 1 API call, 1x DB query ✅
```

---

## 🚨 Common Patterns

### Loading States
```tsx
const { data, isLoading, isFetching, error } = useProducts()

// isLoading: First load, no data yet
// isFetching: Refetching in background (data still available)
```

### Error Handling
```tsx
const { error, isError } = useProducts()

if (isError) {
  return <ErrorMessage error={error} />
}
```

### Refetching Manually
```tsx
const { data, refetch } = useProducts()

<button onClick={() => refetch()}>Refresh</button>
```

### Invalidating Cache
```tsx
const queryClient = useQueryClient()

// Invalidate all products queries
queryClient.invalidateQueries({ queryKey: ['products'] })

// Invalidate specific product
queryClient.invalidateQueries({ queryKey: ['product', productId] })
```

---

## 🎯 Next Steps

1. **Migrate existing components** to use the new hooks
2. **Create additional hooks** for other API endpoints (reviews, customers, etc.)
3. **Add infinite scroll** using `useInfiniteQuery`
4. **Implement search** with debounced queries
5. **Add prefetching** for better UX (hover to prefetch)

---

## 📚 Resources

- [TanStack Query Docs](https://tanstack.com/query/latest)
- [Query Keys Guide](https://tanstack.com/query/latest/docs/react/guides/query-keys)
- [Mutations Guide](https://tanstack.com/query/latest/docs/react/guides/mutations)

---

## 🎉 Benefits Summary

✅ **Fewer API calls** → Less load on MongoDB  
✅ **Faster UI** → Instant data from cache  
✅ **Better UX** → Background refetching keeps data fresh  
✅ **Less code** → No more manual loading/error states  
✅ **Optimistic updates** → Instant feedback  
✅ **Auto-retry** → Resilient to network issues  
