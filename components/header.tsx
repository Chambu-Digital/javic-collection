'use client'

import { useState, useEffect } from 'react'
import { ShoppingCart, User, Search, Menu, Zap, X, ChevronDown, Phone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ICategory } from '@/models/Category'
import { getProductDisplayImage, getProductDisplayPrice } from '@/lib/product-utils'
import { useCartStore } from '@/lib/cart-store'
import { useUserStore } from '@/lib/user-store'
import CartSidebar from '@/components/cart-sidebar'

export default function Header() {
  const { getTotalItems, isLoaded } = useCartStore()
  const { user, checkAuth, isLoaded: userLoaded } = useUserStore()
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [showCategories, setShowCategories] = useState(false)
  const [categories, setCategories] = useState<ICategory[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)

  useEffect(() => {
    fetchCategories()
    if (!userLoaded) {
      checkAuth()
    }
  }, [checkAuth, userLoaded])

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories')
      if (response.ok) {
        const data = await response.json()
        setCategories(data)
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      setShowSearchResults(false)
      setIsSearchOpen(false)
      window.location.href = `/search?q=${encodeURIComponent(searchQuery.trim())}`
    }
  }

  const handleSearchChange = async (value: string) => {
    setSearchQuery(value)
    
    if (value.trim().length < 2) {
      setShowSearchResults(false)
      setSearchResults([])
      return
    }

    setSearchLoading(true)
    try {
      const response = await fetch(`/api/products?search=${encodeURIComponent(value.trim())}&catalog=true&limit=5`)
      if (response.ok) {
        const data = await response.json()
        setSearchResults(data.products || [])
        setShowSearchResults(true)
      }
    } catch (error) {
      console.error('Error searching:', error)
    } finally {
      setSearchLoading(false)
    }
  }

  const selectSearchResult = (product: any) => {
    setShowSearchResults(false)
    setSearchQuery('')
    setIsSearchOpen(false)
    window.location.href = `/product/${product._id}`
  }

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false)
  }

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border shadow-sm">
      {/* Contact Bar */}
      <div className="bg-primary/5 border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center py-2">
            <a 
              href="tel:+254713065412" 
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors duration-200"
            >
              <Phone className="w-4 h-4" />
              <span className="font-medium">+254 713 065 412</span>
            </a>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Header */}
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 flex-shrink-0 min-w-0">
            <div className="relative min-w-max">
              <img 
                src="/electromatt-logo-compact.svg" 
                alt="Javic Collection Logo" 
                className="h-8 w-auto lg:h-10 transition-transform duration-200 hover:scale-105 max-w-none"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.nextElementSibling?.classList.remove('hidden');
                }}
              />
              <div className="hidden flex items-center gap-2">
                <Zap className="w-8 h-8 lg:w-10 lg:h-10 text-primary" />
                <h1 className="text-lg lg:text-3xl font-black text-primary uppercase tracking-wide">
                  JAVIC COLLECTION
                </h1>
              </div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-8">
            <div className="relative">
              <Button
                variant="ghost"
                className="flex items-center gap-1 text-sm font-medium"
                onMouseEnter={() => setShowCategories(true)}
                onMouseLeave={() => setShowCategories(false)}
              >
                Categories
                <ChevronDown className="w-4 h-4 transition-transform duration-200" />
              </Button>
            
              {showCategories && (
                <div
                  className="absolute top-full left-0 mt-2 bg-background border border-border rounded-lg shadow-lg py-2 min-w-48 z-50"
                  onMouseEnter={() => setShowCategories(true)}
                  onMouseLeave={() => setShowCategories(false)}
                >
                  {categories.map((category) => (
                    <Link
                      key={category._id}
                      href={`/category/${category.slug}`}
                      className="block px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors duration-200"
                    >
                      {category.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
            
            {/* <Link href="/products">
              <Button variant="ghost" className="text-sm font-medium">
                Products
              </Button>
            </Link> */}
            
            {/* <Link href="/blog">
              <Button variant="ghost" className="text-sm font-medium">
                Blog
              </Button>
            </Link> */}
          </nav>

          {/* Desktop Search Bar */}
          <div className="hidden md:flex flex-1 max-w-md mx-8 relative">
            <form onSubmit={handleSearch} className="w-full">
              <div className="relative flex items-center bg-muted/50 border border-border rounded-full px-4 py-2.5 focus-within:border-primary/50 focus-within:bg-background transition-all duration-200">
                <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Search electronics..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onFocus={() => searchResults.length > 0 && setShowSearchResults(true)}
                  onBlur={() => setTimeout(() => setShowSearchResults(false), 200)}
                  className="flex-1 bg-transparent ml-3 outline-none text-sm text-foreground placeholder:text-muted-foreground"
                />
                {searchLoading && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary flex-shrink-0"></div>
                )}
              </div>
            </form>

            {/* Desktop Search Results */}
            {showSearchResults && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-background border border-border rounded-lg shadow-lg py-2 z-50 max-h-96 overflow-y-auto">
                {searchResults.map((product) => {
                  const displayImage = getProductDisplayImage(product)
                  const { price } = getProductDisplayPrice(product)
                  
                  return (
                    <div
                      key={product._id}
                      onClick={() => selectSearchResult(product)}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-muted cursor-pointer transition-colors duration-200"
                    >
                      <img
                        src={displayImage}
                        alt={product.name}
                        className="w-10 h-10 object-cover rounded-md flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-foreground truncate">{product.name}</p>
                        <p className="text-xs text-muted-foreground">{product.category}</p>
                      </div>
                      <p className="text-sm font-bold text-primary flex-shrink-0">KSH {price.toLocaleString()}</p>
                    </div>
                  )
                })}
                
                {searchQuery.trim() && (
                  <div className="border-t border-border mt-2 pt-2">
                    <button
                      onClick={() => handleSearch({ preventDefault: () => {} } as any)}
                      className="w-full text-left px-4 py-2 text-sm text-primary hover:bg-muted transition-colors duration-200"
                    >
                      View all results for "{searchQuery}"
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2 lg:gap-4">
            {/* Mobile Search Toggle */}
            <Button 
              variant="ghost" 
              size="icon"
              className="md:hidden"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
            >
              <Search className="w-5 h-5" />
            </Button>

            {/* User Account */}
            <div className="hidden sm:block">
              {user ? (
                <Link href="/account">
                  <Button variant="ghost" size="icon" className="relative">
                    <User className="w-5 h-5" />
                    <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full w-2 h-2"></span>
                  </Button>
                </Link>
              ) : (
                <Link href="/account/login">
                  <Button variant="ghost" size="icon">
                    <User className="w-5 h-5" />
                  </Button>
                </Link>
              )}
            </div>

            {/* Cart */}
            <CartSidebar>
              <Button variant="ghost" size="icon" className="relative">
                <ShoppingCart className="w-5 h-5" />
                {isLoaded && getTotalItems() > 0 && (
                  <span className="absolute -top-2 -right-2 bg-secondary text-secondary-foreground text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center min-w-[20px] h-5">
                    {getTotalItems()}
                  </span>
                )}
              </Button>
            </CartSidebar>

            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Search */}
        {isSearchOpen && (
          <div className="md:hidden border-t border-border">
            <div className="py-4">
              <form onSubmit={handleSearch} className="relative">
                <div className="flex items-center bg-muted/50 border border-border rounded-full px-4 py-2.5 focus-within:border-primary/50 focus-within:bg-background transition-all duration-200">
                  <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <input
                    type="text"
                    placeholder="Search electronics..."
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    onFocus={() => searchResults.length > 0 && setShowSearchResults(true)}
                    onBlur={() => setTimeout(() => setShowSearchResults(false), 200)}
                    className="flex-1 bg-transparent ml-3 outline-none text-sm text-foreground placeholder:text-muted-foreground"
                    autoFocus
                  />
                  {searchLoading && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary flex-shrink-0"></div>
                  )}
                </div>

                {/* Mobile Search Results */}
                {showSearchResults && searchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-background border border-border rounded-lg shadow-lg py-2 z-50 max-h-64 overflow-y-auto">
                    {searchResults.map((product) => {
                      const displayImage = getProductDisplayImage(product)
                      const { price } = getProductDisplayPrice(product)
                      
                      return (
                        <div
                          key={product._id}
                          onClick={() => selectSearchResult(product)}
                          className="flex items-center gap-3 px-4 py-3 hover:bg-muted cursor-pointer transition-colors duration-200"
                        >
                          <img
                            src={displayImage}
                            alt={product.name}
                            className="w-8 h-8 object-cover rounded flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm text-foreground truncate">{product.name}</p>
                            <p className="text-xs text-muted-foreground">{product.category}</p>
                          </div>
                          <p className="text-sm font-bold text-primary flex-shrink-0">KSH {price.toLocaleString()}</p>
                        </div>
                      )
                    })}
                    
                    {searchQuery.trim() && (
                      <div className="border-t border-border mt-2 pt-2">
                        <button
                          onClick={() => handleSearch({ preventDefault: () => {} } as any)}
                          className="w-full text-left px-4 py-2 text-sm text-primary hover:bg-muted transition-colors duration-200"
                        >
                          View all results for "{searchQuery}"
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </form>
            </div>
          </div>
        )}

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-border">
            <div className="py-4 space-y-1">
              {/* User Account */}
              {user ? (
                <Link href="/account" onClick={closeMobileMenu}>
                  <Button variant="ghost" className="justify-start w-full h-12">
                    <User className="w-4 h-4 mr-3" /> 
                    My Account
                  </Button>
                </Link>
              ) : (
                <Link href="/account/login" onClick={closeMobileMenu}>
                  <Button variant="ghost" className="justify-start w-full h-12">
                    <User className="w-4 h-4 mr-3" /> 
                    Sign In
                  </Button>
                </Link>
              )}
              
              {/* Navigation Links */}
              <Link href="/products" onClick={closeMobileMenu}>
                <Button variant="ghost" className="justify-start w-full h-12">
                  Products
                </Button>
              </Link>
              
              <Link href="/blog" onClick={closeMobileMenu}>
                <Button variant="ghost" className="justify-start w-full h-12">
                  Blog
                </Button>
              </Link>
              
              {/* Categories */}
              {categories.length > 0 && (
                <div className="border-t border-border pt-4 mt-4">
                  <p className="text-sm font-semibold text-muted-foreground px-4 py-2 uppercase tracking-wide">
                    Categories
                  </p>
                  <div className="space-y-1">
                    {categories.map((category) => (
                      <Link
                        key={category._id}
                        href={`/category/${category.slug}`}
                        onClick={closeMobileMenu}
                        className="block px-4 py-3 text-sm text-foreground hover:bg-muted transition-colors duration-200 rounded-md mx-2"
                      >
                        {category.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
