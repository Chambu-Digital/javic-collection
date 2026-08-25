import Header from '@/components/header'
import Footer from '@/components/footer'

export default function Loading() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1 max-w-6xl mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-6 bg-muted rounded w-64 mb-8" />
          <div className="grid md:grid-cols-2 gap-8">
            <div className="h-96 bg-muted rounded" />
            <div className="space-y-4">
              <div className="h-8 bg-muted rounded w-3/4" />
              <div className="h-6 bg-muted rounded w-1/2" />
              <div className="h-12 bg-muted rounded w-1/3" />
              <div className="h-32 bg-muted rounded" />
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
