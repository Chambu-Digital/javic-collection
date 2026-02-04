'use client'

export default function CheckoutForm({
  formData,
  setFormData,
}: {
  formData: {
    firstName: string
    lastName: string
    email: string
    phone: string
    address: string
    city: string
    postalCode: string
    country: string
  }
  setFormData: (data: any) => void
}) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
  }

  return (
    <form className="space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold mb-2 text-card-foreground">
            First Name
          </label>
          <input
            type="text"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="John"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2 text-card-foreground">
            Last Name
          </label>
          <input
            type="text"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Doe"
            required
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold mb-2 text-card-foreground">
            Email
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="john@example.com"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2 text-card-foreground">
            Phone Number
          </label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="+254 712 345 678"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold mb-2 text-card-foreground">
          Street Address
        </label>
        <input
          type="text"
          name="address"
          value={formData.address}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="123 Main Street"
          required
        />
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-semibold mb-2 text-card-foreground">
            City
          </label>
          <input
            type="text"
            name="city"
            value={formData.city}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Nairobi"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2 text-card-foreground">
            Postal Code
          </label>
          <input
            type="text"
            name="postalCode"
            value={formData.postalCode}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="00100"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2 text-card-foreground">
            Country
          </label>
          <select
            name="country"
            value={formData.country}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option>Kenya</option>
            <option>Uganda</option>
            <option>Tanzania</option>
            <option>Rwanda</option>
          </select>
        </div>
      </div>
    </form>
  )
}
