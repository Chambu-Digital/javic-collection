/**
 * BEFORE vs AFTER Example: Admin Orders Page
 * 
 * This file shows the difference between traditional fetching and TanStack Query
 */

// ============================================================
// ❌ BEFORE: Traditional useState + useEffect approach
// ============================================================

'use client'
import { useState, useEffect } from 'react'

export function AdminOrdersPageBefore() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // Problem 1: Must re-fetch on every dependency change
  useEffect(() => {
    fetchOrders()
  }, [currentPage, statusFilter, searchTerm])

  const fetchOrders = async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(searchTerm && { search: searchTerm })
      })
      
      const res = await fetch(`/api/admin/orders?${params}`)
      
      if (!res.ok) {
        throw new Error('Failed to fetch orders')
      }
      
      const data = await res.json()
      setOrders(data.orders || [])
      setTotalPages(data.pagination?.pages || 1)
    } catch (error) {
      setError(error as Error)
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }

  // Problem 2: Must manually refetch after mutations
  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })
      
      if (res.ok) {
        // Must manually refetch all data
        fetchOrders()
      } else {
        alert('Failed to update order status')
      }
    } catch {
      alert('Failed to update order status')
    }
  }

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>

  return (
    <div>
      <input 
        value={searchTerm} 
        onChange={(e) => setSearchTerm(e.target.value)} 
        placeholder="Search orders..."
      />
      
      <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
        <option value="all">All</option>
        <option value="pending">Pending</option>
        <option value="completed">Completed</option>
      </select>

      {orders.map(order => (
        <div key={order._id}>
          <h3>{order.orderNumber}</h3>
          <button onClick={() => handleStatusChange(order._id, 'completed')}>
            Mark Complete
          </button>
        </div>
      ))}

      <button onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1}>
        Previous
      </button>
      <button onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage >= totalPages}>
        Next
      </button>
    </div>
  )
}

// ============================================================
// ✅ AFTER: With TanStack Query
// ============================================================

'use client'
import { useState } from 'react'
import { useOrders, useUpdateOrderStatus } from '@/lib/hooks/use-orders'

export function AdminOrdersPageAfter() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)

  // Benefit 1: Automatic caching, deduplication, and background refetching
  const { data, isLoading, error, refetch } = useOrders({
    page: currentPage,
    limit: 20,
    ...(statusFilter !== 'all' && { status: statusFilter }),
    ...(searchTerm && { search: searchTerm })
  })

  // Benefit 2: Automatic cache invalidation after mutation
  const updateStatus = useUpdateOrderStatus()

  const handleStatusChange = (orderId: string, newStatus: string) => {
    updateStatus.mutate(
      { orderId, status: newStatus },
      {
        onSuccess: () => {
          // Cache is automatically invalidated and refetched!
          alert('Order status updated')
        },
        onError: () => {
          alert('Failed to update order status')
        }
      }
    )
  }

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>

  return (
    <div>
      <input 
        value={searchTerm} 
        onChange={(e) => setSearchTerm(e.target.value)} 
        placeholder="Search orders..."
      />
      
      <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
        <option value="all">All</option>
        <option value="pending">Pending</option>
        <option value="completed">Completed</option>
      </select>

      {/* Benefit 3: Easy manual refetch */}
      <button onClick={() => refetch()}>Refresh</button>

      {data?.orders.map(order => (
        <div key={order._id}>
          <h3>{order.orderNumber}</h3>
          <button 
            onClick={() => handleStatusChange(order._id, 'completed')}
            disabled={updateStatus.isPending}
          >
            {updateStatus.isPending ? 'Updating...' : 'Mark Complete'}
          </button>
        </div>
      ))}

      <button onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1}>
        Previous
      </button>
      <button onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage >= data?.totalPages}>
        Next
      </button>
    </div>
  )
}

// ============================================================
// 📊 BENEFITS COMPARISON
// ============================================================

/*
┌─────────────────────────────────────────────────────────────────────────┐
│                          BEFORE vs AFTER                                 │
├─────────────────────────────────────────────────────────────────────────┤
│ Feature                   │ Before          │ After (TanStack Query)   │
├───────────────────────────┼─────────────────┼─────────────────────────┤
│ Lines of Code             │ ~80 lines       │ ~40 lines                │
│ Manual Refetch Needed     │ Yes             │ No (automatic)           │
│ Loading State Management  │ Manual          │ Automatic                │
│ Error Handling            │ Manual          │ Automatic                │
│ Request Deduplication     │ No              │ Yes                      │
│ Background Refetching     │ No              │ Yes                      │
│ Optimistic Updates        │ Hard to do      │ Built-in                 │
│ Cache Management          │ None            │ Automatic                │
│ Retry Failed Requests     │ No              │ Yes (3 retries)          │
│ DevTools for Debugging    │ No              │ Yes                      │
└─────────────────────────────────────────────────────────────────────────┘

CODE REDUCTION:
- Before: ~80 lines for basic CRUD
- After: ~40 lines for the same functionality
- 50% less code!

PERFORMANCE:
- Before: 3 components = 3 API calls
- After: 3 components = 1 API call (deduplication)
- 66% fewer API calls!

USER EXPERIENCE:
- Before: Loading spinner every time
- After: Instant data from cache + background update
- Feels instant!
*/

// ============================================================
// 🎯 REAL-WORLD SCENARIO: Multiple Components
// ============================================================

// Imagine you have 3 components on the admin dashboard:

// 1. Orders List
function OrdersList() {
  const { data } = useOrders({ limit: 20 })
  return <div>{data?.orders.length} orders</div>
}

// 2. Orders Count Badge
function OrdersCountBadge() {
  const { data } = useOrders({ limit: 20 }) // Uses cache! No API call
  return <div>Total: {data?.total}</div>
}

// 3. Pending Orders Widget
function PendingOrdersWidget() {
  const { data } = useOrders({ limit: 20 }) // Uses cache! No API call
  const pending = data?.orders.filter(o => o.status === 'pending')
  return <div>Pending: {pending?.length}</div>
}

// RESULT:
// - Before: 3 API calls to /api/admin/orders
// - After: 1 API call to /api/admin/orders
// - Data is shared across all components!

// ============================================================
// 🚀 ADVANCED: Optimistic Updates
// ============================================================

function OrderItemWithOptimisticUpdate({ order }: { order: Order }) {
  const queryClient = useQueryClient()
  const updateStatus = useUpdateOrderStatus()

  const handleComplete = () => {
    // Optimistic update: UI updates IMMEDIATELY
    updateStatus.mutate(
      { orderId: order._id, status: 'completed' },
      {
        // Update UI before server responds
        onMutate: async () => {
          // Cancel outgoing refetches
          await queryClient.cancelQueries({ queryKey: ['orders'] })
          
          // Snapshot current data
          const previousOrders = queryClient.getQueryData(['orders'])
          
          // Optimistically update cache
          queryClient.setQueryData(['orders'], (old: any) => ({
            ...old,
            orders: old.orders.map((o: Order) =>
              o._id === order._id ? { ...o, status: 'completed' } : o
            )
          }))
          
          return { previousOrders }
        },
        // If error, rollback
        onError: (err, variables, context) => {
          queryClient.setQueryData(['orders'], context?.previousOrders)
        },
        // Always refetch to ensure consistency
        onSettled: () => {
          queryClient.invalidateQueries({ queryKey: ['orders'] })
        }
      }
    )
  }

  return (
    <div>
      <h3>{order.orderNumber}</h3>
      <button onClick={handleComplete}>
        Mark Complete (Instant UI Update!)
      </button>
    </div>
  )
}

// ============================================================
// 📖 MIGRATION CHECKLIST
// ============================================================

/*
TO MIGRATE A COMPONENT TO TANSTACK QUERY:

1. ✅ Install packages (already done)
2. ✅ Add QueryProvider to root layout (already done)
3. ✅ Create custom hook (e.g., useOrders)
4. Replace useState + useEffect with useQuery
5. Replace manual mutations with useMutation
6. Remove manual refetch calls (automatic now!)
7. Test in browser
8. Check TanStack DevTools to verify caching

EXAMPLE MIGRATION STEPS:

STEP 1: Find this pattern
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  useEffect(() => { fetchData() }, [])

STEP 2: Replace with
  const { data, isLoading } = useYourHook()

STEP 3: Remove manual refetch after mutations
  Before: fetchData()
  After: (automatic via onSuccess in useMutation)

DONE! 🎉
*/
