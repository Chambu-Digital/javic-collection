# Shipping Fee Logic

## How Shipping Fees Work

### County-Level Fees
Every county has a `defaultShippingFee` that applies to all areas within that county unless overridden.

### Area-Level Fees (Optional)
Areas can optionally set their own `shippingFee`. There are three scenarios:

#### 1. Area Fee NOT Set (undefined/null)
```
Area: { name: "Westlands", shippingFee: undefined }
County: { name: "Nairobi", defaultShippingFee: 200 }
Result: Customer pays KES 200 (county default)
```

#### 2. Area Fee Set to 0 (Free Shipping)
```
Area: { name: "CBD", shippingFee: 0 }
County: { name: "Nairobi", defaultShippingFee: 200 }
Result: Customer pays KES 0 (free shipping for CBD)
```

#### 3. Area Fee Set to Custom Amount
```
Area: { name: "Karen", shippingFee: 300 }
County: { name: "Nairobi", defaultShippingFee: 200 }
Result: Customer pays KES 300 (area-specific fee)
```

## Implementation

### Database Model
```typescript
// Area model
{
  name: string
  countyId: ObjectId
  shippingFee?: number  // Optional - undefined means use county default
  estimatedDeliveryDays: number
  isActive: boolean
}
```

### Calculation Logic
```typescript
// 1. Check if area has explicit fee (including 0)
if (area.shippingFee !== undefined && area.shippingFee !== null) {
  return area.shippingFee  // Use area fee (could be 0 for free)
}

// 2. Fall back to county default
return county.defaultShippingFee
```

## Admin Usage

### Creating an Area

**Use County Default:**
```json
POST /api/admin/areas
{
  "name": "Westlands",
  "countyId": "...",
  "estimatedDeliveryDays": 2
  // shippingFee not provided - will use county default
}
```

**Free Shipping:**
```json
POST /api/admin/areas
{
  "name": "CBD",
  "countyId": "...",
  "shippingFee": 0,  // Explicitly set to 0
  "estimatedDeliveryDays": 1
}
```

**Custom Fee:**
```json
POST /api/admin/areas
{
  "name": "Karen",
  "countyId": "...",
  "shippingFee": 300,
  "estimatedDeliveryDays": 2
}
```

### Updating an Area

**Change to County Default:**
```json
PUT /api/admin/areas/:id
{
  "shippingFee": null  // Remove area-specific fee
}
```

**Change to Free Shipping:**
```json
PUT /api/admin/areas/:id
{
  "shippingFee": 0
}
```

## Files Modified

- `models/Area.ts` - Made shippingFee optional
- `lib/shipping-utils.ts` - Updated calculation logic
- `app/api/orders/create/route.ts` - Updated order creation logic
- `lib/use-shipping.ts` - Updated frontend hook
- `app/api/admin/areas/route.ts` - Updated area creation validation

## Testing Scenarios

1. **Area without fee** → Should use county default
2. **Area with fee = 0** → Should be free shipping
3. **Area with custom fee** → Should use area fee
4. **Area not found** → Should use county default
5. **County not found** → Should handle gracefully
