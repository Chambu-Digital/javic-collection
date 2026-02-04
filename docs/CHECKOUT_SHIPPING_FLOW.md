# Checkout Shipping Fee Flow

## How It Works

The checkout uses the `useShippingCost` hook to dynamically calculate shipping based on the selected address.

### Flow:

1. **User selects/enters address** with county and area
2. **Hook fetches shipping data** from API
3. **Logic determines fee**:
   - If area has `shippingFee` set (including 0) → Use area fee
   - If area `shippingFee` is undefined/null → Use county default
   - If no address selected → Show placeholder (150)
4. **UI updates** to show calculated shipping cost
5. **Total recalculates** automatically

### Components Involved:

**`app/checkout/page.tsx`**
- Main checkout page
- Manages `calculatedShippingCost` state
- Passes shipping cost to order creation API

**`components/checkout/checkout-step-one.tsx`**
- Address selection/entry
- Uses `useShippingCost(county, area)` hook
- Shows real-time shipping cost as user selects location
- Calls `onShippingCostChange` to update parent

**`lib/use-shipping.ts`**
- React hook for shipping calculation
- Fetches counties and areas from API
- Implements the area fee logic
- Returns `{ shippingCost, loading, error }`

**`lib/shipping-utils.ts`**
- Server-side shipping utilities
- Used by order creation API
- Same logic as frontend hook

### User Experience:

```
1. User enters checkout
   └─> Shows "Select address" for shipping

2. User selects county
   └─> Areas load for that county

3. User selects area
   └─> Shipping cost calculates
   └─> Shows "FREE" if 0
   └─> Shows "KSH X" if > 0
   └─> Total updates automatically

4. User proceeds to review
   └─> Shipping cost is locked in

5. User places order
   └─> Shipping cost sent to API
   └─> API validates and creates order
```

### API Endpoints Used:

- `GET /api/locations/counties` - Get all counties with default fees
- `GET /api/locations/counties/:id/areas` - Get areas for county
- `POST /api/orders/create` - Create order with calculated shipping

### Validation:

The order creation API **recalculates** shipping on the server to prevent tampering:

```typescript
// Client sends shippingCost, but server validates it
const county = await County.findOne({ name: address.county })
const area = await Area.findOne({ name: address.area, countyId: county._id })

// Use area fee if set (including 0), otherwise county default
if (area && area.shippingFee !== undefined && area.shippingFee !== null) {
  shippingCost = area.shippingFee
} else {
  shippingCost = county.defaultShippingFee
}
```

## Testing:

1. **Area with no fee set** → Should show county default
2. **Area with fee = 0** → Should show "FREE"
3. **Area with custom fee** → Should show that amount
4. **Change county** → Shipping should update
5. **Change area** → Shipping should update
6. **Complete order** → Correct shipping in order total

## No Hardcoded Values!

All shipping costs are fetched from the database based on:
- County `defaultShippingFee`
- Area `shippingFee` (optional)

The only hardcoded value (150) is a **fallback** if API calls fail, ensuring checkout doesn't break.
