You are working inside the existing Javic Collection e-commerce project.

Your task is to add a complete Point of Sale application and a complete Reports & Ledger module to the existing project. This is not a separate unrelated system. It must reuse the existing website’s products, product images, variants, sizes, pricing, inventory, customers, authentication, orders, and database structure wherever appropriate.

The POS application will be accessed through:

https://pos.javic.co.ke

The POS must also be installable as a Progressive Web Application on laptops, tablets, and mobile phones.

Do not redesign or rewrite the existing Javic Collection website. Inspect the current project architecture, framework, database, authentication, APIs, routes, styling system, and deployment configuration before making changes. Extend what is already present.

Do not blindly create a new standalone application with duplicated products, inventory, users, or customers.

The POS and the main website must operate as parts of the same business system.

IMPORTANT IMPLEMENTATION RULES

1. Build every feature described in this prompt now.
2. Split payments are part of the initial implementation and must not be postponed.
3. Do not label any requested feature as a future feature.
4. Do not copy the colours, branding, typography, or exact appearance of the provided POS reference screenshot.
5. Use the existing Javic Collection design system, colours, typography, buttons, spacing, cards, forms, and responsive patterns.
6. The screenshot is only a workflow and layout reference.
7. Do not use placeholder data when real project data is available.
8. Do not create duplicate product, inventory, customer, or order sources.
9. Do not modify existing online-store behaviour unless the changes are necessary to support the shared POS system.
10. Preserve existing functionality and backward compatibility.

==================================================
1. PROJECT OBJECTIVE
==================================================

Create a dedicated POS module that allows authorised Javic Collection staff to:

- Sell products in the physical shop.
- Search and select products.
- Select exact image-based variants.
- Select sizes.
- Add products to a cart.
- Sell using retail or wholesale prices.
- Apply controlled discounts.
- Create and select customers.
- Give eligible customers credit.
- Receive customer debt repayments.
- Hold and resume orders.
- Accept cash, M-Pesa, credit, and split payments.
- Work during temporary internet outages.
- Synchronise offline transactions when connectivity returns.
- View a complete Reports & Ledger history covering both online and physical-shop activity.

The main online website will continue handling online shopping.

The POS will handle physical-shop transactions while sharing the same underlying business data.

==================================================
2. REQUIRED APPLICATION STRUCTURE
==================================================

Inspect the current project before deciding the exact internal folder structure.

Create a clean POS application entry point that can be deployed to:

pos.javic.co.ke

Depending on the existing project architecture, this may be implemented using:

- A dedicated POS module.
- A dedicated route group.
- A separate application package within the same repository.
- A dedicated frontend entry point.
- A sub-application sharing the existing backend and database.

Choose the implementation that best fits the existing project.

Do not duplicate the entire project.

The POS must share or securely access:

- Products
- Product images
- Product variants
- Sizes
- Categories
- Retail prices
- Wholesale prices
- Inventory
- Customers
- Users and staff
- Orders
- Payments
- Discounts
- Credit accounts
- Audit records

Separate POS-specific frontend files where necessary, but keep shared business logic centralised.

==================================================
3. PRIMARY POS NAVIGATION
==================================================

Create a left-side navigation menu containing:

- Make Sale
- Held Orders
- Customers
- Credit Accounts
- Reports & Ledger
- Sync Status
- POS Settings
- Logout

Only show menu items that the logged-in user has permission to access.

The sidebar must be collapsible on smaller screens.

On mobile devices, use a drawer, slide-out menu, or another responsive navigation method consistent with the existing Javic Collection interface.

==================================================
4. POS HEADER
==================================================

The POS header must display:

- “Welcome to Javic Collection”
- Current outlet or branch
- Logged-in cashier’s name
- Cashier’s role
- Online, offline, or synchronising status
- Notification indicator
- Logout option

The current cashier must be clearly identifiable throughout the session.

Every sale, discount, price override, credit transaction, repayment, cancellation, refund, stock movement, and ledger action must record the responsible user.

==================================================
5. MAKE SALE SCREEN
==================================================

The main Make Sale screen should contain:

- Product search
- Category filter
- Barcode entry or barcode scanning
- Product results
- Product cards
- Shopping cart
- Held-order access
- Customer selection
- Current connectivity status

The general desktop layout should be:

- Sidebar on the left.
- Product-selection area in the centre.
- Cart on the right.

On tablets and mobile devices, adapt the layout without removing functionality.

Do not copy the visual styling from the reference screenshot.

==================================================
6. PRODUCT SEARCH AND PRODUCT CARDS
==================================================

Allow products to be searched using:

- Product name
- Item code
- SKU
- Brand, if available
- Category
- Variant details
- Barcode
- Size
- Keywords already supported by the current project

Each product card should display:

- Main product image
- Product name
- Item code or SKU where appropriate
- Retail price
- Wholesale price indicator where applicable
- Available stock
- Low-stock status where applicable
- Quick-select action

Do not display out-of-stock variants as available.

If a product is completely unavailable, clearly mark it as out of stock.

==================================================
7. IMAGE-BASED PRODUCT VARIANTS
==================================================

The existing product structure uses images as important identifiers for variants.

Preserve this behaviour.

When a cashier selects a product, open a product-selection modal or drawer showing:

- Product name
- Main image
- All available variant images
- Selected variant image
- Available sizes for the selected image variant
- Stock available for each size
- Retail unit price
- Wholesale unit price
- Quantity selector
- Add to cart button

The cashier must select the exact variant image being purchased.

When the cashier selects a variant image:

- Update the available sizes.
- Update stock availability.
- Update applicable pricing.
- Update the selected variant identifier.
- Prevent unavailable sizes from being selected.

Where a product does not have variants, proceed directly to size selection or quantity selection as appropriate.

Where a product requires a size, do not allow it to be added to the cart without selecting a size.

Where a product requires a variant image, do not allow it to be added without selecting the exact image variant.

==================================================
8. CART LINE DATA
==================================================

Every cart line must retain enough information to identify exactly what was sold.

Store or reference:

- Product ID
- Product name
- Item code
- SKU where available
- Selected variant ID
- Selected image or media ID
- Selected image URL or stored media reference
- Selected size
- Quantity
- Retail unit price
- Wholesale unit price
- Price mode
- Original unit price
- Actual unit price charged
- Line subtotal
- Line discount
- Cart-level discount allocation
- Tax information, if taxes exist in the current system
- Final line total
- Cashier who added or modified the item
- Timestamp added
- Outlet
- Device identifier where relevant

The selected image variant and size must also be saved in the final order.

The order history and receipt must show the exact variant and size purchased.

==================================================
9. CART FEATURES
==================================================

The cart must support:

- Increasing quantity
- Decreasing quantity
- Editing quantity directly
- Removing items
- Changing size
- Changing image variant
- Viewing the selected variant image
- Applying retail pricing
- Applying wholesale pricing
- Applying line-level discounts
- Applying cart-level discounts
- Selecting an existing customer
- Creating a customer
- Holding an order
- Resuming a held order
- Cancelling a cart
- Proceeding to payment

Show:

- Number of items
- Total quantity
- Subtotal
- Discounts
- Credit applied, where relevant
- Amount payable
- Payment allocation
- Change due
- Final total

When a size or variant is changed, validate stock again.

==================================================
10. RETAIL AND WHOLESALE PRICING
==================================================

Implement a clear cart-level pricing control with:

- Retail
- Wholesale

The cashier must be able to switch the cart between retail and wholesale pricing where authorised.

When wholesale is selected:

- Apply the stored wholesale price to eligible items.
- Clearly show that wholesale pricing is active.
- Preserve the original retail price for reporting.
- Recalculate totals immediately.
- Record who activated wholesale pricing.
- Record when it was activated.

Support automatic wholesale-price activation when configured quantity thresholds are reached.

Also allow authorised staff to activate wholesale pricing manually.

If an item does not have a wholesale price, do not invent one. Use the configured fallback behaviour and clearly display the result.

Do not permanently change the product’s stored retail or wholesale price when changing a sale’s pricing mode.

==================================================
11. DISCOUNTS AND PRICE OVERRIDES
==================================================

Support:

- Percentage cart discounts
- Fixed-amount cart discounts
- Percentage line discounts
- Fixed-amount line discounts
- Manual unit-price overrides for authorised users

Every discount or override must record:

- Original amount
- Discount type
- Discount value
- Final amount
- Reason
- Cashier
- Approving manager, when approval is required
- Date and time
- Outlet
- Device

Configure permission-based limits.

For example:

- Cashiers may apply discounts up to a configured amount or percentage.
- Larger discounts require manager approval.
- Manual price overrides may require a supervisor PIN or approval workflow.

Do not allow the final payable amount to become negative.

Do not silently overwrite the original price.

==================================================
12. CUSTOMER MANAGEMENT
==================================================

Customers from the online website and physical shop must appear in one shared customer system.

The POS must allow staff to:

- Search existing customers
- Filter customers
- View customer details
- View purchase history
- View online orders
- View POS purchases
- View outstanding credit
- View available credit
- View repayments
- Create a new customer
- Edit permitted customer details
- Attach a customer to a sale
- Enable credit where authorised

A physical-shop customer record may contain:

- Full name
- Phone number
- National ID or identification number
- Email address
- Address
- Location
- Customer type
- Notes
- Date created
- Origin: website, POS, or admin
- Credit-enabled status
- Credit limit
- Outstanding balance
- Available credit
- Account status
- Staff member who created the customer
- Outlet where the customer was created

Validate phone numbers and prevent unnecessary duplicates.

Search for possible matching customers before creating a new record.

Sensitive information such as national ID numbers must be permission-controlled and protected appropriately.

==================================================
13. CUSTOMER CREDIT AND DEBT
==================================================

Implement a complete customer credit-account system.

Credit is not merely a payment label.

Each eligible customer must have:

- Credit enabled or disabled
- Credit limit
- Current outstanding balance
- Available credit
- Credit status
- Transaction history
- Repayment history

Use the calculation:

Available credit = Credit limit - Outstanding credit balance

Example:

Credit limit: KSh 15,000
Outstanding balance: KSh 5,000
Available credit: KSh 10,000

If the customer takes another KSh 4,000 on credit:

New outstanding balance: KSh 9,000
Remaining available credit: KSh 6,000

A credit transaction must record:

- Customer
- Order
- Total order amount
- Amount placed on credit
- Date and time
- Due date where applicable
- Cashier
- Outlet
- Notes
- Payment allocation
- Outstanding balance after the transaction
- Device identifier
- Online or offline origin
- Sync status
- Credit status

Credit statuses should include:

- Active
- Partially paid
- Settled
- Overdue
- Written off
- Reversed

Only authorised users may:

- Enable credit
- Disable credit
- Change a credit limit
- Approve an amount above a cashier’s limit
- Override a credit limit
- Write off credit
- Reverse a repayment
- Adjust a credit balance

Every adjustment must create a ledger record.

Do not silently edit previous credit transactions.

==================================================
14. CUSTOMER DEBT REPAYMENTS
==================================================

Create a repayment interface where authorised staff can receive payments against a customer’s outstanding balance.

Repayments must support:

- Cash
- M-Pesa
- Split payment between cash and M-Pesa

For every repayment, record:

- Customer
- Amount paid
- Payment method or methods
- Cash amount
- M-Pesa amount
- M-Pesa transaction reference
- Previous outstanding balance
- New outstanding balance
- Cashier
- Outlet
- Date and time
- Notes
- Device
- Sync status
- Reversal status

A repayment must reduce the customer’s outstanding balance.

Do not allow repayment amounts to exceed the customer’s balance unless the system deliberately supports customer account credit and that behaviour already exists.

Generate a repayment receipt.

==================================================
15. HELD ORDERS
==================================================

Allow cashiers to hold an incomplete order.

A held order must preserve:

- Cart items
- Exact selected variants
- Sizes
- Quantities
- Pricing mode
- Discounts
- Customer
- Notes
- Cashier
- Outlet
- Date and time
- Hold reason
- Device
- Offline status

Create a Held Orders screen where users can:

- Search held orders
- Filter by cashier
- Filter by customer
- Filter by date
- Resume an order
- Cancel a held order
- View the order contents

When resuming a held order:

- Revalidate current prices.
- Revalidate stock.
- Warn about unavailable items.
- Warn about changed prices.
- Preserve an audit record of any changes.

==================================================
16. PAYMENT INTERFACE
==================================================

Selecting “Process Payment” must open a dedicated payment screen or modal.

Supported payment methods must include from the first implementation:

- Cash
- M-Pesa
- Customer Credit
- Split Payment

Split payment is mandatory.

Do not postpone split payment.

Do not mark split payment as a later enhancement.

==================================================
17. CASH PAYMENTS
==================================================

For cash payments, allow the cashier to enter:

- Amount received

Calculate:

Change due = Cash received - Cash amount allocated to the sale

For a cash-only sale, the cash allocation equals the full amount payable.

Do not complete a cash-only sale when the amount received is less than the amount payable.

Display the change clearly before completing the sale.

Record:

- Cash amount allocated
- Cash received
- Change given
- Cashier
- Outlet
- Date and time
- Device

==================================================
18. M-PESA PAYMENTS
==================================================

For M-Pesa payments, record:

- Amount
- Transaction reference
- Customer phone number where needed
- Payment time
- Verification status
- Cashier
- Outlet
- Device
- Sync status

M-Pesa statuses may include:

- Pending
- Confirmed
- Failed
- Reversed
- Pending offline verification

Prevent duplicate use of the same confirmed M-Pesa transaction reference where possible.

When the POS is offline:

- Allow authorised entry of an M-Pesa reference.
- Mark it as pending offline verification.
- Do not falsely mark it as externally confirmed.
- Queue it for verification when connectivity returns.
- Clearly warn the cashier about the pending status.

==================================================
19. CREDIT PAYMENTS
==================================================

Credit payment can only be used when:

- A customer is selected.
- The customer has credit enabled.
- The customer account is active.
- The customer has sufficient available credit, unless an authorised override is approved.
- The cashier has permission to process credit sales.

Before processing credit, display:

- Credit limit
- Outstanding balance
- Available credit
- Credit amount being requested
- New projected outstanding balance
- Remaining projected available credit

Require manager approval when the configured rules demand it.

==================================================
20. SPLIT PAYMENTS
==================================================

Implement split payment as a core payment method.

Allow one order to be paid using any supported combination of:

- Cash
- M-Pesa
- Customer Credit

Examples:

Example 1:
Order total: KSh 10,000
Cash: KSh 5,000
M-Pesa: KSh 5,000

Example 2:
Order total: KSh 10,000
Cash: KSh 3,000
M-Pesa: KSh 4,000
Credit: KSh 3,000

Example 3:
Order total: KSh 10,000
Cash: KSh 7,000
Credit: KSh 3,000

The payment screen must allow the cashier to add, remove, and edit payment allocations.

Each payment allocation must contain:

- Payment method
- Amount
- Payment-specific details
- Status
- Reference
- Timestamp

Validation rules:

1. The total allocated payment must exactly equal the final amount payable before the order can be completed.
2. Credit allocation requires an eligible selected customer.
3. Credit allocation must respect the available credit limit unless an authorised override is approved.
4. M-Pesa allocation requires the required reference or verification information.
5. Cash allocation may include a cash-received amount.
6. Only the cash portion can generate change.
7. The non-cash portions must not be used when calculating change.
8. The same M-Pesa reference must not be reused improperly.
9. Negative allocations are not allowed.
10. Zero-value allocations should not be saved.
11. Removing a payment allocation must immediately recalculate the outstanding amount.
12. The interface must clearly show:
    - Order total
    - Amount allocated
    - Remaining amount
    - Cash received
    - Change due

Example of cash change during split payment:

Order total: KSh 10,000
M-Pesa allocation: KSh 4,000
Cash allocation required: KSh 6,000
Cash received: KSh 7,000
Change due: KSh 1,000

Store every payment component separately while linking them to the same order.

The receipt must show each payment method and amount separately.

The Reports & Ledger section must also show the split-payment breakdown.

Complete the sale using a server-side or database transaction so that:

- The order is created.
- Order items are created.
- Payments are recorded.
- Credit balances are updated.
- Inventory is reduced.
- Ledger records are created.

These related actions must not be partially saved.

==================================================
21. ORDER COMPLETION
==================================================

When a sale is completed:

- Generate a unique order number.
- Record the channel as POS or physical shop.
- Record the outlet.
- Record the cashier.
- Record the device.
- Record whether it was created online or offline.
- Save all items and selected variants.
- Save all payment allocations.
- Update inventory.
- Update customer credit where applicable.
- Create ledger entries.
- Create an audit entry.
- Generate a receipt.

The receipt should include:

- Javic Collection details
- Outlet
- Order number
- Date and time
- Cashier
- Customer where selected
- Product name
- Selected variant
- Size
- Quantity
- Original price
- Discount
- Final line amount
- Retail or wholesale mode
- Subtotal
- Total discount
- Final total
- Cash payment
- M-Pesa payment
- Credit payment
- Cash received
- Change
- Outstanding customer credit after sale where appropriate

Support:

- Printing
- Browser print
- PDF receipt where the existing system supports it
- Sharing or downloading according to existing project capabilities

==================================================
22. INVENTORY BEHAVIOUR
==================================================

The main website or administration system remains the primary place for adding and managing inventory.

The POS must consume the same inventory data.

When a POS sale is completed:

- Reduce inventory for the exact selected product variant and size.
- Record the inventory movement.
- Link the inventory movement to the order.
- Record the cashier.
- Record the outlet.
- Record the source as POS.
- Record whether the movement was created offline and later synchronised.

Do not reduce a generic product total when variant-level or size-level stock exists.

Inventory reports must distinguish:

- Stock added from admin
- Online sale deductions
- POS sale deductions
- Returns
- Refunds
- Adjustments
- Damaged items
- Reversals
- Offline synchronisation entries

==================================================
23. RETURNS, REFUNDS, AND REVERSALS
==================================================

Implement controlled return, refund, and sale-reversal workflows.

Do not allow completed orders to be silently edited or deleted.

A return or refund must create linked reversal records.

Record:

- Original order
- Product
- Variant
- Size
- Quantity
- Original payment method
- Refund method
- Reason
- Cashier
- Approver
- Date and time
- Inventory effect
- Credit effect
- Ledger entry

Credit-sale refunds must correctly reduce or reverse customer debt.

Split-payment refunds must preserve the original payment allocation and record how the refund was issued.

==================================================
24. REPORTS & LEDGER MODULE
==================================================

Create a complete Reports & Ledger module.

This must not be a basic sales chart page.

It must behave as a historical business ledger that combines activities from:

- Main website
- POS
- Admin system
- Inventory management
- Customer credit
- Payment processing
- Offline synchronisation

The ledger must be chronological and auditable.

==================================================
25. LEDGER EVENT TYPES
==================================================

Include ledger events for:

- Inventory added
- Inventory removed
- Inventory adjusted
- Stock transferred
- Online sale
- POS sale
- Wholesale sale
- Retail sale
- Held order created
- Held order resumed
- Held order cancelled
- Order cancelled
- Return
- Refund
- Sale reversed
- Discount applied
- Manual price override
- Cash payment
- M-Pesa payment
- Credit issued
- Split payment processed
- Customer repayment
- Credit adjustment
- Credit-limit change
- Customer created
- Customer updated
- Offline transaction created
- Offline transaction synchronised
- Sync conflict
- M-Pesa verification update
- User login where appropriate
- Shift opened or closed if shifts already exist or are added
- Permission-sensitive administrative action

Each ledger entry should show:

- Date and time
- Event type
- Source
- Channel
- Outlet
- User or cashier
- Customer
- Order
- Product
- Variant
- Size
- Quantity
- Debit amount where applicable
- Credit amount where applicable
- Total amount
- Payment method
- Split-payment breakdown
- Reference number
- Notes
- Previous value
- New value
- Device
- Online or offline origin
- Synchronisation status
- Related-record links

==================================================
26. REPORT FILTERS
==================================================

Allow reports and ledger records to be filtered by:

- Date range
- Today
- This week
- This month
- Custom period
- Online sales
- POS sales
- Retail sales
- Wholesale sales
- Outlet
- Cashier
- Customer
- Product
- Category
- Variant
- Size
- Payment method
- Cash payments
- M-Pesa payments
- Credit payments
- Split payments
- Discounts
- Credit transactions
- Repayments
- Inventory movements
- Held orders
- Cancelled orders
- Returns
- Refunds
- Sync status
- Device
- Event type

Provide search by:

- Order number
- Customer name
- Phone number
- Item code
- SKU
- M-Pesa reference
- Receipt number
- Ledger reference

==================================================
27. REPORT SUMMARIES
==================================================

Provide report summaries for:

- Total POS sales
- Total online sales
- Total combined sales
- Retail sales
- Wholesale sales
- Cash collected
- M-Pesa collected
- Credit issued
- Credit repaid
- Outstanding customer credit
- Discounts given
- Returns
- Refunds
- Sales by cashier
- Sales by outlet
- Sales by product
- Sales by variant
- Sales by size
- Stock added
- Stock sold
- Stock adjusted
- Offline transactions
- Failed or conflicted synchronisations

For split payments, do not count one order multiple times in sales totals.

Sales totals should use the order total once.

Payment-method totals should use the individual payment allocations.

==================================================
28. LEDGER IMMUTABILITY
==================================================

Historical ledger records must not be silently edited or deleted.

When a correction is required:

- Create a reversal entry.
- Create an adjustment entry.
- Link it to the original entry.
- Record the reason.
- Record the responsible user.
- Record approval where required.

Keep a complete audit trail.

==================================================
29. PWA REQUIREMENTS
==================================================

Make the POS installable as a PWA.

Implement:

- Web application manifest
- Application name
- Short name
- Icons based on approved Javic Collection branding
- Theme settings based on the existing site
- Standalone display mode
- Service worker
- Install prompt handling where appropriate
- Offline application shell
- Cached assets
- Cached product images
- Connectivity detection
- Background or queued synchronisation
- Update notification when a new application version is available

Do not allow outdated cached frontend code to corrupt transactions after a deployment.

Implement an appropriate cache versioning and update strategy.

==================================================
30. OFFLINE DATA
==================================================

The POS should continue supporting essential sales operations during temporary internet loss.

Cache or store the necessary data locally using an appropriate browser database such as IndexedDB, depending on the current stack.

Offline-capable data should include:

- Product catalogue
- Product images
- Variants
- Sizes
- Last-known prices
- Last-known inventory
- Selected customer records
- Customer credit data where permitted
- Held orders
- Offline carts
- Completed offline sales
- Payment allocations
- Pending M-Pesa references
- Repayments where permitted
- Sync queue
- Device information

Clearly show the last successful sync time.

==================================================
31. OFFLINE TRANSACTION IDENTIFIERS
==================================================

Every offline-created record must receive a globally unique client-generated identifier.

Use idempotency keys or equivalent identifiers so synchronisation cannot create duplicate:

- Orders
- Payments
- Credit transactions
- Repayments
- Inventory movements
- Ledger events

If the same queued transaction is sent more than once, the server must recognise it and avoid duplication.

==================================================
32. OFFLINE STOCK HANDLING
==================================================

When offline, clearly warn the cashier that inventory quantities are based on the last successful synchronisation.

Allow configured offline selling behaviour.

On synchronisation:

- Compare the offline sale against current server stock.
- Process valid transactions.
- Flag overselling conflicts.
- Do not silently discard the sale.
- Create a sync-conflict record.
- Allow an authorised user to resolve the conflict.
- Preserve the original offline transaction.

==================================================
33. OFFLINE CUSTOMER CREDIT HANDLING
==================================================

Offline credit sales require stricter controls.

When the POS is offline:

- Show that the displayed credit balance is from the last synchronisation.
- Apply a configured offline credit policy.
- Prevent or limit offline credit transactions when data is too old.
- Allow only authorised users to override the restriction.
- Record any override.
- Queue the credit transaction for validation.

When synchronising:

- Compare the offline transaction with the current customer balance.
- Detect whether another device used the customer’s available credit.
- Flag any credit-limit conflict.
- Do not silently change the original sale.
- Create a visible resolution workflow.
- Preserve the audit trail.

==================================================
34. SYNCHRONISATION
==================================================

Create a Sync Status screen showing:

- Online or offline state
- Last successful sync
- Pending records
- Successfully synced records
- Failed records
- Conflicted records
- Retry option
- Record type
- Local reference
- Server reference
- Error details
- Resolution status

Synchronisation should be automatic when connectivity returns.

Also provide a manual retry action.

Use safe ordering so related data synchronises correctly.

For example:

1. Customer creation
2. Order
3. Order items
4. Payments
5. Credit transaction
6. Inventory movement
7. Ledger records

Use server-side idempotency and validation.

==================================================
35. AUTHENTICATION AND OFFLINE SECURITY
==================================================

Use the existing Javic Collection authentication system.

Do not create an insecure parallel login system.

Support secure POS sessions.

Where offline access is permitted:

- Use secure local session handling.
- Do not store plain-text passwords.
- Do not expose full sensitive customer data unnecessarily.
- Apply automatic session locking.
- Require re-authentication for sensitive actions where appropriate.
- Protect local offline data.
- Clear sensitive local data during authorised logout where appropriate.

==================================================
36. ROLES AND PERMISSIONS
==================================================

Implement or extend role-based access control.

Suggested roles include:

- Cashier
- Senior Cashier
- Supervisor
- Manager
- Administrator

Permissions should separately control:

- Make sale
- Use wholesale pricing
- Apply small discount
- Apply large discount
- Override price
- Approve discounts
- View customers
- Create customers
- View identification details
- Enable customer credit
- Change credit limits
- Process credit sales
- Override credit limits
- Receive repayments
- Reverse repayments
- Hold orders
- Cancel held orders
- Process returns
- Process refunds
- Reverse sales
- View own reports
- View outlet reports
- View all reports
- Export reports
- Resolve sync conflicts
- Access POS settings

Do not rely only on hiding frontend buttons.

Enforce permissions on the server.

==================================================
37. AUDIT TRAIL
==================================================

Create audit records for sensitive actions, including:

- Login
- Logout
- Discount
- Price override
- Wholesale activation
- Credit enablement
- Credit-limit change
- Credit sale
- Credit override
- Repayment
- Repayment reversal
- Refund
- Return
- Sale reversal
- Held-order cancellation
- Sync-conflict resolution
- Customer detail changes
- Inventory adjustments
- Permission changes

Record:

- User
- Role
- Action
- Target record
- Previous value
- New value
- Date and time
- Outlet
- Device
- IP address where available
- Reason
- Approver

==================================================
38. UI AND RESPONSIVE DESIGN
==================================================

Use the existing Javic Collection visual system.

Do not use the reference screenshot’s colours.

The POS should be:

- Fast
- Touch-friendly
- Keyboard-friendly
- Responsive
- Clear during busy sales
- Usable on laptops
- Usable on tablets
- Usable on mobile phones

Use large enough tap targets.

Do not hide critical totals.

Keep the cart accessible throughout the sale.

Provide clear states for:

- Loading
- Empty results
- Out of stock
- Offline
- Synchronising
- Sync failed
- Payment incomplete
- Payment complete
- Credit limit exceeded
- Pending M-Pesa verification
- Held order
- Discount approval required

==================================================
39. PERFORMANCE
==================================================

Optimise the POS for fast shop use.

Implement:

- Debounced search
- Pagination or virtualised product lists where necessary
- Optimised product images
- Lazy loading
- Efficient local caching
- Indexed database queries
- Minimal unnecessary network requests
- Optimistic UI only where it is safe
- Clear recovery when server validation fails

The product catalogue and cart should remain responsive with a large number of products.

==================================================
40. DATABASE AND API DESIGN
==================================================

Inspect the existing database before creating new tables.

Reuse current tables and relationships where appropriate.

Add migrations only where necessary.

Potential new or extended entities may include:

- POS outlets
- POS devices
- POS sessions
- Held orders
- Payment allocations
- Customer credit accounts
- Credit transactions
- Repayments
- Ledger entries
- Audit entries
- Offline sync queue records
- Sync conflicts
- Approval records
- Discount reasons
- Price overrides

Do not create duplicate customer, product, inventory, or order models unless the existing architecture genuinely requires an adapter layer.

All monetary values must be handled safely using the current project’s proper money or decimal conventions.

Do not use floating-point arithmetic for financial totals.

==================================================
41. TRANSACTION SAFETY
==================================================

Completing a sale must be atomic.

The following actions should succeed or fail together:

- Order creation
- Order-item creation
- Payment-allocation creation
- Credit-account update
- Credit-transaction creation
- Inventory deduction
- Ledger creation
- Audit creation

Do not leave partially completed sales.

Use database transactions and idempotency protection.

Apply the same principle to:

- Refunds
- Returns
- Repayments
- Reversals
- Offline synchronisation

==================================================
42. VALIDATION
==================================================

Validate all important rules on both frontend and backend.

Validate:

- Product exists
- Variant exists
- Size exists
- Stock availability
- Quantity
- Prices
- Discount limits
- Wholesale eligibility
- Customer status
- Credit eligibility
- Credit limit
- Payment allocation total
- M-Pesa reference requirements
- Cash received
- User permissions
- Outlet access
- Device status
- Offline data version
- Idempotency key
- Sync conflict conditions

Never trust totals submitted only by the frontend.

Recalculate final totals on the server.

==================================================
43. REPORT EXPORTS
==================================================

Where compatible with the existing system, allow authorised users to export reports in useful formats such as:

- CSV
- Excel
- PDF

Exports must respect active filters.

Exports must include:

- Report generation date
- Date range
- Filters used
- Outlet
- User who generated the export

Do not expose fields the user is not authorised to view.

==================================================
44. TESTING REQUIREMENTS
==================================================

Add appropriate tests for:

- Product search
- Variant selection
- Size selection
- Cart calculations
- Wholesale pricing
- Discounts
- Price overrides
- Customer creation
- Credit calculations
- Credit limits
- Repayments
- Cash payment
- M-Pesa payment
- Credit payment
- Split payments
- Cash change in split payments
- Held orders
- Order completion
- Inventory deduction
- Returns
- Refunds
- Ledger entries
- Permission checks
- Offline order creation
- Synchronisation
- Idempotency
- Duplicate prevention
- Stock conflicts
- Credit conflicts

Important split-payment tests must include:

1. Cash and M-Pesa total equals order total.
2. Cash, M-Pesa, and credit total equals order total.
3. Payment total below order total is rejected.
4. Payment total above order total is rejected unless the excess is valid cash received for change.
5. Credit portion above available credit is rejected.
6. Credit cannot be used without a selected eligible customer.
7. Duplicate M-Pesa references are rejected or flagged.
8. Cash change is calculated using only the cash portion.
9. Payment allocations are correctly shown on the receipt.
10. Payment allocations are correctly shown in Reports & Ledger.
11. A failed allocation does not create a partial order.
12. Retrying an offline split-payment transaction does not duplicate the order.

==================================================
45. IMPLEMENTATION PROCESS
==================================================

Before coding:

1. Inspect the complete existing repository.
2. Identify the framework and project structure.
3. Identify the authentication system.
4. Identify the product and variant models.
5. Identify how product images currently identify variants.
6. Identify the size and stock structure.
7. Identify retail and wholesale pricing.
8. Identify current customer and order models.
9. Identify existing payment handling.
10. Identify the styling and component system.
11. Identify deployment and subdomain configuration.
12. Identify whether a service worker or PWA setup already exists.
13. Identify current report and audit functionality.

Then provide a concise implementation plan based on the actual repository.

After the plan, implement the system.

Do not stop after creating mock-ups, documentation, or placeholder screens.

Do not only provide code snippets.

Make the required changes in the project.

==================================================
46. REQUIRED DELIVERABLES
==================================================

Deliver:

- Working POS application
- POS routing and subdomain-ready configuration
- PWA manifest
- Service worker
- Offline storage
- Synchronisation system
- Make Sale screen
- Product-selection modal
- Image-variant selection
- Size selection
- Cart
- Retail and wholesale pricing
- Discount controls
- Customer management
- Credit accounts
- Repayment interface
- Held orders
- Cash payment
- M-Pesa payment
- Credit payment
- Split-payment interface
- Receipts
- Inventory integration
- Returns and refunds
- Reports & Ledger
- Audit trail
- Role permissions
- Sync Status screen
- Required database migrations
- Required APIs
- Automated tests
- Setup or deployment documentation
- Explanation of files added and modified

==================================================
47. FINAL ACCEPTANCE CRITERIA
==================================================

The implementation is complete only when:

1. The POS can run through pos.javic.co.ke.
2. The POS can be installed as a PWA.
3. It uses real products from the main website.
4. It uses the exact existing image-based product variants.
5. Cashiers can select the exact image and size being sold.
6. Completed sales reduce the correct variant and size inventory.
7. Retail and wholesale pricing both work.
8. Discounts are permission-controlled and audited.
9. Customers from the website and shop appear in one shared system.
10. Shop customers can be created.
11. Eligible customers can receive controlled credit.
12. Customer balances and available credit are calculated correctly.
13. Debt repayments can be recorded.
14. Orders can be held and resumed.
15. Cash payments work.
16. M-Pesa payments work.
17. Credit payments work.
18. Split payments using cash, M-Pesa, and credit work.
19. Split-payment allocations must exactly reconcile with the order total.
20. Split-payment details appear on receipts and reports.
21. The POS supports essential offline selling.
22. Offline transactions synchronise without duplication.
23. Stock and credit conflicts are visibly handled.
24. Reports distinguish website sales from POS sales.
25. The ledger includes inventory additions made through the main admin system.
26. The ledger includes sales, discounts, payments, credit, repayments, inventory movements, and synchronisation activity.
27. Historical records cannot be silently altered.
28. Role permissions are enforced on the server.
29. The interface uses Javic Collection’s existing visual identity.
30. Existing website functionality continues working.