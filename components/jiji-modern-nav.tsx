'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Menu, X, ChevronDown } from 'lucide-react'

export default function JijiModernNav() {
  const [isOpen, setIsOpen] = useState(false)
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)

  const mainMenu = [
    { label: 'Home', href: '/' },
    { label: 'Services', href: '/services', submenu: [
      { label: 'Express', href: '/services/express' },
      { label: 'Standard', href: '/services/standard' },
      { label: 'Fragile', href: '/services/fragile' },
      { label: 'Temperature Control', href: '/services/temperature' },
      { label: 'Bulk', href: '/services/bulk' },
      { label: 'Port Services', href: '/services/port' },
    ]},
    { label: 'Tracking', href: '/tracking' },
    { label: 'Blog', href: '/blog' },
    { label: 'About', href: '/about' },
    { label: 'Contact', href: '/contact' },
  ]

  return (
    <nav className="jiji-modern-nav">
      {/* Logo Section */}
      <Link href="/" className="jiji-nav-logo">
        <span className="jiji-nav-text">Jiji Freight</span>
      </Link>

      {/* Desktop Menu */}
      <div className="jiji-nav-desktop">
        {mainMenu.map((item) => (
          <div key={item.label} className="jiji-nav-item" onMouseLeave={() => setActiveDropdown(null)}>
            <Link href={item.href} className="jiji-nav-link">
              {item.label}
              {item.submenu && <ChevronDown className="w-4 h-4 ml-1" />}
            </Link>
            
            {/* Dropdown Menu */}
            {item.submenu && (
              <div className="jiji-nav-dropdown" onMouseEnter={() => setActiveDropdown(item.label)} onMouseLeave={() => setActiveDropdown(null)}>
                {item.submenu.map((subitem) => (
                  <Link key={subitem.label} href={subitem.href} className="jiji-dropdown-item">
                    {subitem.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Mobile Menu Button */}
      <button className="jiji-nav-mobile-btn" onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="jiji-nav-mobile">
          {mainMenu.map((item) => (
            <div key={item.label} className="jiji-mobile-item">
              <Link href={item.href} className="jiji-mobile-link" onClick={() => !item.submenu && setIsOpen(false)}>
                {item.label}
              </Link>
              {item.submenu && (
                <div className="jiji-mobile-submenu">
                  {item.submenu.map((subitem) => (
                    <Link key={subitem.label} href={subitem.href} className="jiji-mobile-sublink" onClick={() => setIsOpen(false)}>
                      {subitem.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <style>{navStyles}</style>
    </nav>
  )
}

const navStyles = `
.jiji-modern-nav {
  position: sticky;
  top: 0;
  z-index: 40;
  background: white;
  border-bottom: 1px solid #E5E7EB;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1.5rem;
  max-width: 100%;
}

.jiji-nav-logo {
  text-decoration: none;
  font-weight: 700;
  font-size: 1.25rem;
  color: #1E90FF;
  font-family: Georgia, serif;
  letter-spacing: 0.05em;
  white-space: nowrap;
  flex-shrink: 0;
}

.jiji-nav-desktop {
  display: none;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
  justify-content: center;
}

@media (min-width: 768px) {
  .jiji-nav-desktop {
    display: flex;
  }
}

.jiji-nav-item {
  position: relative;
  display: flex;
  align-items: center;
}

.jiji-nav-link {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.5rem 1rem;
  color: #003D7A;
  text-decoration: none;
  font-weight: 500;
  font-size: 0.95rem;
  transition: color 0.2s ease;
  border-radius: 4px;
}

.jiji-nav-link:hover {
  color: #1E90FF;
  background-color: rgba(30, 144, 255, 0.05);
}

.jiji-nav-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  min-width: 200px;
  background: white;
  border: 1px solid #E5E7EB;
  border-radius: 6px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  padding: 0.5rem 0;
  margin-top: 0.5rem;
  opacity: 0;
  pointer-events: none;
  transform: translateY(-5px);
  transition: all 0.2s ease;
}

.jiji-nav-item:hover .jiji-nav-dropdown {
  opacity: 1;
  pointer-events: auto;
  transform: translateY(0);
}

.jiji-dropdown-item {
  display: block;
  padding: 0.75rem 1.25rem;
  color: #003D7A;
  text-decoration: none;
  font-size: 0.9rem;
  transition: all 0.2s ease;
}

.jiji-dropdown-item:hover {
  background-color: rgba(30, 144, 255, 0.1);
  color: #1E90FF;
  padding-left: 1.5rem;
}

.jiji-nav-mobile-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  cursor: pointer;
  color: #003D7A;
  padding: 0.5rem;
  margin-left: auto;
}

@media (min-width: 768px) {
  .jiji-nav-mobile-btn {
    display: none;
  }
}

.jiji-nav-mobile {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border-bottom: 1px solid #E5E7EB;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  z-index: 50;
}

.jiji-mobile-item {
  display: flex;
  flex-direction: column;
  border-bottom: 1px solid #E5E7EB;
}

.jiji-mobile-link {
  display: block;
  padding: 1rem 1.5rem;
  color: #003D7A;
  text-decoration: none;
  font-weight: 500;
  transition: background-color 0.2s ease;
}

.jiji-mobile-link:active {
  background-color: rgba(30, 144, 255, 0.1);
}

.jiji-mobile-submenu {
  display: flex;
  flex-direction: column;
  background-color: #F5F7FA;
}

.jiji-mobile-sublink {
  display: block;
  padding: 0.75rem 2rem;
  color: #1E90FF;
  text-decoration: none;
  font-size: 0.9rem;
  transition: background-color 0.2s ease;
}

.jiji-mobile-sublink:active {
  background-color: rgba(30, 144, 255, 0.1);
}
`
