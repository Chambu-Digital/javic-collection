import CustomerReviews from '@/components/customer-reviews'

export default function AccountReviewsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Reviews</h1>
        <p className="text-gray-600">Manage your product reviews and write new ones</p>
      </div>
      
      <CustomerReviews />
    </div>
  )
}