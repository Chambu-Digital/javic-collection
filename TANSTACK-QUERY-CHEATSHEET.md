# TanStack Query Cheat Sheet

## 📦 Quick Reference

### Basic Query
```tsx
const { data, isLoading, error, refetch } = useQuery({
  queryKey: ['todos'],
  queryFn: fetchTodos,
})
```

### Query with Parameters
```tsx
const { data } = useQuery({
  queryKey: ['product', productId], // Include params in key!
  queryFn: () => fetchProduct(productId),
  enabled: !!productId, // Only run if productId exists
})
```

### Basic Mutation
```tsx
const mutation = useMutation({
  mutationFn: createProduct,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['products'] })
  },
})

// Use it
mutation.mutate(newProduct)
```

---

## 🎯 Common Patterns

### 1. Loading & Error States
```tsx
const { data, isLoading, isError, error } = useProducts()

if (isLoading) return <Spinner />
if (isError) return <ErrorMessage error={error} />
return <ProductList products={data.products} />
```

### 2. Pagination
```tsx
const [page, setPage] = useState(1)
const { data } = useProducts({ page, limit: 20 })

<button onClick={() => setPage(p => p - 1)}>Previous</button>
<button onClick={() => setPage(p => p + 1)}>Next</button>
```

### 3. Search with Debounce
```tsx
const [search, setSearch] = useState('')
const debouncedSearch = useDebounce(search, 500)

const { data } = useProducts({ search: debouncedSearch })
```

### 4. Refetch Manually
```tsx
const { data, refetch } = useProducts()

<button onClick={() => refetch()}>Refresh</button>
```

### 5. Optimistic Update
```tsx
const mutation = useMutation({
  mutationFn: updateProduct,
  onMutate: async (newData) => {
    // Cancel outgoing queries
    await queryClient.cancelQueries({ queryKey: ['products'] })
    
    // Snapshot
    const previous = queryClient.getQueryData(['products'])
    
    // Optimistic update
    queryClient.setQueryData(['products'], (old) => ({
      ...old,
      products: old.products.map(p => 
        p.id === newData.id ? newData : p
      )
    }))
    
    return { previous }
  },
  onError: (err, newData, context) => {
    // Rollback
    queryClient.setQueryData(['products'], context.previous)
  },
  onSettled: () => {
    // Refetch to ensure consistency
    queryClient.invalidateQueries({ queryKey: ['products'] })
  },
})
```

### 6. Dependent Queries
```tsx
const { data: user } = useUser(userId)
const { data: projects } = useProjects(user?.id, {
  enabled: !!user?.id, // Only fetch if user is loaded
})
```

### 7. Parallel Queries
```tsx
const products = useProducts()
const categories = useCategories()
const orders = useOrders()

if (products.isLoading || categories.isLoading || orders.isLoading) {
  return <Loading />
}
```

### 8. Background Refetching
```tsx
const { data, isFetching } = useProducts()

// isFetching = true when refetching in background
// data still available from cache while refetching
{isFetching && <RefreshingIndicator />}
```

---

## ⚙️ Configuration Options

### Query Options
```tsx
useQuery({
  queryKey: ['todos'],
  queryFn: fetchTodos,
  
  // Caching
  staleTime: 5 * 60 * 1000,     // 5 minutes
  gcTime: 10 * 60 * 1000,       // 10 minutes (formerly cacheTime)
  
  // Refetching
  refetchOnMount: true,          // Refetch when component mounts
  refetchOnWindowFocus: false,   // Refetch when window gains focus
  refetchOnReconnect: true,      // Refetch when reconnecting
  refetchInterval: 30000,        // Refetch every 30 seconds
  
  // Retry
  retry: 3,                      // Retry 3 times on failure
  retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30000),
  
  // Conditional
  enabled: !!userId,             // Only run if condition is true
})
```

### Mutation Options
```tsx
useMutation({
  mutationFn: createTodo,
  
  // Lifecycle hooks
  onMutate: () => {},            // Before mutation
  onSuccess: () => {},           // On success
  onError: () => {},             // On error
  onSettled: () => {},           // Always runs (success or error)
  
  // Retry
  retry: 1,                      // Retry once on failure
})
```

---

## 🔑 Query Keys

Query keys are used for caching and invalidation:

```tsx
// Simple key
['todos']

// With parameters
['todo', todoId]

// With filters
['products', { category: 'shoes', page: 1 }]

// Hierarchical
['projects', projectId, 'tasks']
```

**Invalidation Examples:**
```tsx
// Invalidate all products queries
queryClient.invalidateQueries({ queryKey: ['products'] })

// Invalidate specific product
queryClient.invalidateQueries({ queryKey: ['product', productId] })

// Invalidate all queries that start with 'products'
queryClient.invalidateQueries({ queryKey: ['products'] })
```

---

## 🎨 Status Checks

```tsx
const { 
  data,           // The data returned from queryFn
  error,          // Error object if query failed
  
  // Boolean flags
  isLoading,      // First load, no data yet
  isError,        // Query failed
  isSuccess,      // Query succeeded
  isFetching,     // Fetching (including background refetch)
  isPending,      // Loading or fetching
  
  // For mutations
  isPending,      // Mutation in progress
  isSuccess,      // Mutation succeeded
  isError,        // Mutation failed
} = useQuery(...)
```

---

## 🛠️ Useful QueryClient Methods

```tsx
const queryClient = useQueryClient()

// Get cached data
const data = queryClient.getQueryData(['products'])

// Set cached data
queryClient.setQueryData(['products'], newData)

// Invalidate (mark as stale and refetch)
queryClient.invalidateQueries({ queryKey: ['products'] })

// Remove from cache
queryClient.removeQueries({ queryKey: ['products'] })

// Cancel queries
queryClient.cancelQueries({ queryKey: ['products'] })

// Prefetch data
queryClient.prefetchQuery({
  queryKey: ['products'],
  queryFn: fetchProducts,
})
```

---

## 📱 Your Custom Hooks

### Products
```tsx
useProducts(filters)
useProduct(id)
useProductBySlug(slug)
useFeaturedProducts({ limit: 8 })
useUpdateProductStock()
```

### Categories
```tsx
useCategories()
useCategory(id)
```

### Orders
```tsx
useOrders(filters)
useOrder(id)
useTrackOrder(orderNumber)
useCreateOrder()
useUpdateOrderStatus()
```

### Cart
```tsx
useCart()
useAddToCart()
useUpdateCartItem()
useRemoveFromCart()
useClearCart()
useCartItemCount()
useCartTotal()
```

---

## 🚨 Common Mistakes

### ❌ Don't do this
```tsx
// Changing state that's already in the query key
const [page, setPage] = useState(1)
const { data } = useProducts({ page })

// Then elsewhere:
setPage(2) // Query automatically refetches! Don't manually call fetchProducts()
```

### ✅ Do this instead
```tsx
// Just update the state, query handles the rest
setPage(2)
```

---

### ❌ Don't do this
```tsx
// Creating query client in component
function MyComponent() {
  const queryClient = new QueryClient() // ❌ Creates new client on every render!
  return <QueryClientProvider client={queryClient}>...</>
}
```

### ✅ Do this instead
```tsx
// Use the singleton from getQueryClient()
const queryClient = getQueryClient()
```

---

### ❌ Don't do this
```tsx
// Forgetting to include dependencies in query key
const { data } = useQuery({
  queryKey: ['products'], // ❌ Missing category!
  queryFn: () => fetchProducts(category),
})
```

### ✅ Do this instead
```tsx
const { data } = useQuery({
  queryKey: ['products', category], // ✅ Include all dependencies
  queryFn: () => fetchProducts(category),
})
```

---

## 🎯 Pro Tips

1. **Use the DevTools** - Press the floating button to see cache state
2. **Query keys should be unique** - Include all parameters that affect the data
3. **Invalidate wisely** - Don't invalidate everything, be specific
4. **Use optimistic updates** - For instant UI feedback
5. **Prefetch on hover** - For better UX on navigation
6. **Different staleTime for different data** - Categories = 30min, Orders = 1min
7. **Use enabled for conditional queries** - Don't fetch until you need to
8. **Mutations should invalidate related queries** - Keep data in sync

---

## 📚 Resources

- [Official Docs](https://tanstack.com/query/latest)
- [Query Keys Guide](https://tanstack.com/query/latest/docs/react/guides/query-keys)
- [Mutations Guide](https://tanstack.com/query/latest/docs/react/guides/mutations)
- [Optimistic Updates](https://tanstack.com/query/latest/docs/react/guides/optimistic-updates)
