const mongoose = require('mongoose')
require('dotenv').config({ path: '.env.local' })

// Define schemas directly in the script
const CountySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  code: { type: String, required: true, unique: true, uppercase: true, trim: true, maxlength: 5 },
  defaultShippingFee: { type: Number, required: true, min: 0, default: 0 },
  estimatedDeliveryDays: { type: Number, required: true, min: 1, max: 30, default: 3 },
  isActive: { type: Boolean, default: true }
}, { timestamps: true })

const AreaSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  countyId: { type: mongoose.Schema.Types.ObjectId, ref: 'County', required: true },
  countyName: { type: String, required: true, trim: true },
  shippingFee: { type: Number, required: true, min: 0, default: 0 },
  estimatedDeliveryDays: { type: Number, required: true, min: 1, max: 30, default: 2 },
  isActive: { type: Boolean, default: true }
}, { timestamps: true })

const County = mongoose.model('County', CountySchema)
const Area = mongoose.model('Area', AreaSchema)

const kenyaLocationData = [
  {
    county: { name: "Nairobi", code: "NRB", defaultShippingFee: 200, estimatedDeliveryDays: 1 },
    areas: [
      { name: "CBD", shippingFee: 150, estimatedDeliveryDays: 1 },
      { name: "Westlands", shippingFee: 200, estimatedDeliveryDays: 1 },
      { name: "Karen", shippingFee: 250, estimatedDeliveryDays: 1 },
      { name: "Langata", shippingFee: 200, estimatedDeliveryDays: 1 },
      { name: "Kasarani", shippingFee: 200, estimatedDeliveryDays: 1 },
      { name: "Embakasi", shippingFee: 200, estimatedDeliveryDays: 1 },
      { name: "Kibra", shippingFee: 180, estimatedDeliveryDays: 1 },
      { name: "Eastleigh", shippingFee: 180, estimatedDeliveryDays: 1 },
      { name: "South C", shippingFee: 200, estimatedDeliveryDays: 1 },
      { name: "South B", shippingFee: 200, estimatedDeliveryDays: 1 },
      { name: "Kilimani", shippingFee: 200, estimatedDeliveryDays: 1 },
      { name: "Lavington", shippingFee: 220, estimatedDeliveryDays: 1 },
      { name: "Kileleshwa", shippingFee: 200, estimatedDeliveryDays: 1 },
      { name: "Parklands", shippingFee: 200, estimatedDeliveryDays: 1 },
      { name: "Runda", shippingFee: 250, estimatedDeliveryDays: 1 },
      { name: "Muthaiga", shippingFee: 250, estimatedDeliveryDays: 1 }
    ]
  },
  {
    county: { name: "Mombasa", code: "MSA", defaultShippingFee: 300, estimatedDeliveryDays: 2 },
    areas: [
      { name: "Mombasa Island", shippingFee: 250, estimatedDeliveryDays: 2 },
      { name: "Likoni", shippingFee: 300, estimatedDeliveryDays: 2 },
      { name: "Changamwe", shippingFee: 300, estimatedDeliveryDays: 2 },
      { name: "Kisauni", shippingFee: 300, estimatedDeliveryDays: 2 },
      { name: "Nyali", shippingFee: 280, estimatedDeliveryDays: 2 },
      { name: "Bamburi", shippingFee: 300, estimatedDeliveryDays: 2 },
      { name: "Old Town", shippingFee: 250, estimatedDeliveryDays: 2 }
    ]
  },
  {
    county: { name: "Kiambu", code: "KBU", defaultShippingFee: 250, estimatedDeliveryDays: 2 },
    areas: [
      { name: "Thika", shippingFee: 200, estimatedDeliveryDays: 1 },
      { name: "Ruiru", shippingFee: 180, estimatedDeliveryDays: 1 },
      { name: "Kikuyu", shippingFee: 200, estimatedDeliveryDays: 1 },
      { name: "Limuru", shippingFee: 220, estimatedDeliveryDays: 2 },
      { name: "Kiambu Town", shippingFee: 200, estimatedDeliveryDays: 1 },
      { name: "Juja", shippingFee: 200, estimatedDeliveryDays: 1 },
      { name: "Kabete", shippingFee: 180, estimatedDeliveryDays: 1 },
      { name: "Karuri", shippingFee: 200, estimatedDeliveryDays: 1 }
    ]
  },
  {
    county: { name: "Nakuru", code: "NKR", defaultShippingFee: 350, estimatedDeliveryDays: 3 },
    areas: [
      { name: "Nakuru Town", shippingFee: 300, estimatedDeliveryDays: 2 },
      { name: "Naivasha", shippingFee: 320, estimatedDeliveryDays: 3 },
      { name: "Gilgil", shippingFee: 350, estimatedDeliveryDays: 3 },
      { name: "Molo", shippingFee: 380, estimatedDeliveryDays: 3 },
      { name: "Njoro", shippingFee: 350, estimatedDeliveryDays: 3 }
    ]
  },
  {
    county: { name: "Machakos", code: "MCK", defaultShippingFee: 280, estimatedDeliveryDays: 2 },
    areas: [
      { name: "Machakos Town", shippingFee: 250, estimatedDeliveryDays: 2 },
      { name: "Athi River", shippingFee: 200, estimatedDeliveryDays: 1 },
      { name: "Mavoko", shippingFee: 200, estimatedDeliveryDays: 1 },
      { name: "Syokimau", shippingFee: 180, estimatedDeliveryDays: 1 },
      { name: "Mlolongo", shippingFee: 180, estimatedDeliveryDays: 1 }
    ]
  },
  {
    county: { name: "Kajiado", code: "KJD", defaultShippingFee: 300, estimatedDeliveryDays: 2 },
    areas: [
      { name: "Kajiado Town", shippingFee: 280, estimatedDeliveryDays: 2 },
      { name: "Ngong", shippingFee: 220, estimatedDeliveryDays: 1 },
      { name: "Ongata Rongai", shippingFee: 200, estimatedDeliveryDays: 1 },
      { name: "Kitengela", shippingFee: 220, estimatedDeliveryDays: 1 }
    ]
  },
  {
    county: { name: "Kisumu", code: "KSM", defaultShippingFee: 400, estimatedDeliveryDays: 3 },
    areas: [
      { name: "Kisumu Central", shippingFee: 350, estimatedDeliveryDays: 3 },
      { name: "Kisumu East", shippingFee: 380, estimatedDeliveryDays: 3 },
      { name: "Kisumu West", shippingFee: 380, estimatedDeliveryDays: 3 }
    ]
  },
  {
    county: { name: "Uasin Gishu", code: "UGS", defaultShippingFee: 450, estimatedDeliveryDays: 3 },
    areas: [
      { name: "Eldoret", shippingFee: 400, estimatedDeliveryDays: 3 },
      { name: "Moiben", shippingFee: 450, estimatedDeliveryDays: 3 },
      { name: "Turbo", shippingFee: 450, estimatedDeliveryDays: 3 }
    ]
  }
]

async function seedLocations() {
  try {
    console.log('Connecting to MongoDB...')
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('Connected to MongoDB')

    // Clear existing data
    console.log('Clearing existing location data...')
    await Area.deleteMany({})
    await County.deleteMany({})

    console.log('Seeding counties and areas...')
    
    for (const locationData of kenyaLocationData) {
      // Create county
      const county = new County(locationData.county)
      await county.save()
      console.log(`Created county: ${county.name}`)

      // Create areas for this county
      for (const areaData of locationData.areas) {
        const area = new Area({
          ...areaData,
          countyId: county._id,
          countyName: county.name
        })
        await area.save()
        console.log(`  Created area: ${area.name}`)
      }
    }

    console.log('Location seeding completed successfully!')
    
    // Display summary
    const countyCount = await County.countDocuments()
    const areaCount = await Area.countDocuments()
    console.log(`\nSummary:`)
    console.log(`- Counties: ${countyCount}`)
    console.log(`- Areas: ${areaCount}`)

  } catch (error) {
    console.error('Error seeding locations:', error)
  } finally {
    await mongoose.disconnect()
    console.log('Disconnected from MongoDB')
  }
}

// Run the seeding
seedLocations()