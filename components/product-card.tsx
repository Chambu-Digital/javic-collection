'use client'

import { useState } from 'react'
import { Star, ShoppingCart, Heart, Eye, Plus, Minus, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCartStore } from '@/lib/cart-store'
import { useToast } from '@/components/ui/custom-toast'
import Link from 'next/link'

interface Product {
  id: string
  name: string
  price: number
  oldPrice?: number
  rating: number
  reviews: number
  image: string
  inStock: boolean
  isNew?: boolean
  isBestseller?: boolean
  stockQuantity?: number
}

interface ProductCardProps {
  product: Product
  viewMode?: 'grid' | 'list'
}

export default function ProductCard({ product, viewMode = 'grid' }: ProductCardProps) {
  const [isFavorite, setIsFavorite] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const [isAddingToCart, setIsAddingToCart] = useState(false)
  const [justAdded, setJustAdded] = useState(false)

  const { addItem } = useCartStore()
  const toast = useToast()

  const discountPercentage = product.oldPrice
    ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
    : 0

  const handleAddToCart = async () => {
    if (!product.inStock) return
    setIsAddingToCart(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 500))
      addItem({ id: product.id, name: product.name, price: product.price, image: product.image, quantity })
      setJustAdded(true)
      toast.success(`${product.name} added to cart!`, `Quantity: ${quantity}`)
      setTimeout(() => setJustAdded(false), 2000)
    } catch {
      toast.error('Failed to add item to cart')
    } finally {
      setIsAddingToCart(false)
    }
  }

  const handleQuantityChange = (change: number) => {
    const next = quantity + change
    if (next >= 1 && next <= (product.stockQuantity || 99)) setQuantity(next)
  }

  /* ─── LIST VIEW ─── */
  if (viewMode === 'list') {
    return (
      <>
        <style>{cardStyles}</style>
        <div className="pcard-list">
          {/* Image */}
          <Link href={`/product/${product.id}`} className="pcard-list-img-link">
            <div className="pcard-list-img-wrap">
              <img src={product.image || '/placeholder.svg'} alt={product.name} className="pcard-list-img" />
              <div className="pcard-list-overlay" />
              {discountPercentage > 0 && (
                <span className="pcard-badge">{`-${discountPercentage}%`}</span>
              )}
            </div>
          </Link>

          {/* Body */}
          <div className="pcard-list-body">
            <div className="pcard-list-top">
              <div className="pcard-cat-row">
                {product.isNew && <span className="pcard-pill new">New</span>}
                {product.isBestseller && <span className="pcard-pill best">Bestseller</span>}
              </div>
              <Link href={`/product/${product.id}`}>
                <h3 className="pcard-list-name">{product.name}</h3>
              </Link>

              {/* Stars */}
              <div className="pcard-stars-row">
                {Array(5).fill(0).map((_, i) => (
                  <Star key={i} className={`pcard-star ${i < Math.floor(product.rating) ? 'filled' : ''}`} />
                ))}
                <span className="pcard-reviews">{product.rating} ({product.reviews})</span>
              </div>

              <span className={`pcard-stock-label ${product.inStock ? 'in' : 'out'}`}>
                {product.inStock ? '● In Stock' : '● Out of Stock'}
              </span>
            </div>

            <div className="pcard-list-bottom">
              <div className="pcard-price-row">
                <span className="pcard-price">KSH {product.price.toLocaleString()}</span>
                {product.oldPrice && <span className="pcard-old">KSH {product.oldPrice.toLocaleString()}</span>}
              </div>

              <div className="pcard-list-actions">
                <button onClick={() => setIsFavorite(!isFavorite)} className={`pcard-fav-btn ${isFavorite ? 'active' : ''}`}>
                  <Heart size={16} />
                </button>
                <Link href={`/product/${product.id}`}>
                  <button className="pcard-eye-btn"><Eye size={16} /></button>
                </Link>

                {/* Qty */}
                <div className="pcard-qty">
                  <button className="pcard-qty-btn" onClick={() => handleQuantityChange(-1)} disabled={quantity <= 1}>
                    <Minus size={11} />
                  </button>
                  <span className="pcard-qty-num">{quantity}</span>
                  <button className="pcard-qty-btn" onClick={() => handleQuantityChange(1)} disabled={quantity >= (product.stockQuantity || 99)}>
                    <Plus size={11} />
                  </button>
                </div>

                <button
                  className={`pcard-cart-btn ${justAdded ? 'added' : ''}`}
                  disabled={!product.inStock || isAddingToCart}
                  onClick={handleAddToCart}
                >
                  {isAddingToCart
                    ? <><span className="pcard-spinner" /> Adding…</>
                    : justAdded
                    ? <><Check size={14} /> Added!</>
                    : <><ShoppingCart size={14} /> Add to Cart</>
                  }
                </button>
              </div>
            </div>
          </div>
        </div>
      </>
    )
  }

  /* ─── GRID VIEW ─── */
  return (
    <>
      <style>{cardStyles}</style>
      <div
        className="pcard-grid"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Image */}
        <Link href={`/product/${product.id}`} className="pcard-img-link">
          <div className="pcard-img-wrap">
            <img src={product.image || '/placeholder.svg'} alt={product.name} className="pcard-img" />
            <div className="pcard-img-overlay" />

            {/* Badges */}
            <div className="pcard-badges">
              {product.isNew         && <span className="pcard-badge-tag new">New</span>}
              {product.isBestseller  && <span className="pcard-badge-tag best">Bestseller</span>}
              {discountPercentage > 0 && <span className="pcard-badge-tag disc">-{discountPercentage}%</span>}
            </div>

            {/* Favourite */}
            <button
              onClick={(e) => { e.preventDefault(); setIsFavorite(!isFavorite) }}
              className={`pcard-fav-icon ${isFavorite ? 'active' : ''}`}
            >
              <Heart size={15} />
            </button>

            {/* Gold corners */}
            <div className="pcard-corner tl" />
            <div className="pcard-corner br" />

            {/* Hover overlay actions */}
            <div className={`pcard-hover-actions ${isHovered ? 'show' : ''}`}>
              <Link href={`/product/${product.id}`}>
                <button className="pcard-action-btn">
                  <Eye size={15} />
                  <span>Quick View</span>
                </button>
              </Link>
              <button
                className={`pcard-action-btn cart ${justAdded ? 'added' : ''}`}
                disabled={!product.inStock || isAddingToCart}
                onClick={handleAddToCart}
              >
                {isAddingToCart
                  ? <><span className="pcard-spinner sm" /> Adding…</>
                  : justAdded
                  ? <><Check size={14} /> Added!</>
                  : <><ShoppingCart size={14} /> Add to Cart</>
                }
              </button>
            </div>
          </div>
        </Link>

        {/* Card body */}
        <div className="pcard-body">
          <div className="pcard-body-top">
            <Link href={`/product/${product.id}`}>
              <h3 className="pcard-name">{product.name}</h3>
            </Link>

            {/* Stars */}
            <div className="pcard-stars-row">
              {Array(5).fill(0).map((_, i) => (
                <Star key={i} className={`pcard-star ${i < Math.floor(product.rating) ? 'filled' : ''}`} />
              ))}
              <span className="pcard-reviews">({product.reviews})</span>
            </div>

            {/* Price */}
            <div className="pcard-price-row">
              <span className="pcard-price">KSH {product.price.toLocaleString()}</span>
              {product.oldPrice && <span className="pcard-old">KSH {product.oldPrice.toLocaleString()}</span>}
            </div>

            {/* Stock */}
            <div className="pcard-stock-row">
              <span className={`pcard-stock-label ${product.inStock ? 'in' : 'out'}`}>
                {product.inStock
                  ? product.stockQuantity && product.stockQuantity <= 5
                    ? `Only ${product.stockQuantity} left!`
                    : '● In Stock'
                  : '● Out of Stock'
                }
              </span>
              {product.stockQuantity && product.stockQuantity <= 5 && product.inStock && (
                <span className="pcard-low-stock">Low Stock</span>
              )}
            </div>
          </div>

          {/* Qty + Add to cart */}
          {product.inStock && (
            <div className="pcard-qty-row">
              <span className="pcard-qty-label">Qty</span>
              <div className="pcard-qty">
                <button className="pcard-qty-btn" onClick={() => handleQuantityChange(-1)} disabled={quantity <= 1}>
                  <Minus size={11} />
                </button>
                <span className="pcard-qty-num">{quantity}</span>
                <button className="pcard-qty-btn" onClick={() => handleQuantityChange(1)} disabled={quantity >= (product.stockQuantity || 99)}>
                  <Plus size={11} />
                </button>
              </div>
            </div>
          )}

          <button
            className={`pcard-add-btn ${justAdded ? 'added' : ''} ${!product.inStock ? 'disabled' : ''}`}
            disabled={!product.inStock || isAddingToCart}
            onClick={handleAddToCart}
          >
            <span className="pcard-add-inner">
              {isAddingToCart
                ? <><span className="pcard-spinner" /> Adding…</>
                : justAdded
                ? <><Check size={15} /> Added to Cart!</>
                : product.inStock
                ? <><ShoppingCart size={15} /> Add to Cart</>
                : 'Out of Stock'
              }
            </span>
            <span className="pcard-add-shimmer" />
          </button>
        </div>

        {/* Bottom bar */}
        <div className="pcard-bar" />
      </div>
    </>
  )
}

const cardStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=Josefin+Sans:wght@200;300;400&display=swap');

  :root {
    --pc-pink:    #FF0080;
    --pc-magenta: #CC0066;
    --pc-deep:    #990044;
    --pc-gold:    #E8C87A;
    --pc-gold-lt: #F5DFA0;
    --pc-green:   #22a855;
  }

  /* ════════════════════════════
     GRID CARD
  ════════════════════════════ */
  .pcard-grid {
    background: white;
    border: 1px solid rgba(232,200,122,0.2);
    border-radius: 12px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    transition: transform 0.35s cubic-bezier(0.4,0,0.2,1), box-shadow 0.35s ease, border-color 0.3s;
    position: relative;
  }
  .pcard-grid:hover {
    transform: translateY(-5px);
    border-color: rgba(232,200,122,0.5);
    box-shadow: 0 14px 44px rgba(153,0,68,0.13), 0 4px 12px rgba(0,0,0,0.06);
  }

  /* Image */
  .pcard-img-link { display: block; text-decoration: none; }
  .pcard-img-wrap {
    position: relative;
    aspect-ratio: 1;
    overflow: hidden;
    background: linear-gradient(135deg, #fff0f6, #fce4f0);
  }
  .pcard-img {
    width: 100%; height: 100%;
    object-fit: cover;
    transition: transform 0.6s cubic-bezier(0.4,0,0.2,1);
  }
  .pcard-grid:hover .pcard-img { transform: scale(1.07); }
  .pcard-img-overlay {
    position: absolute; inset: 0;
    background: linear-gradient(to bottom, transparent 50%, rgba(26,0,16,0.15) 100%);
    opacity: 0;
    transition: opacity 0.35s;
  }
  .pcard-grid:hover .pcard-img-overlay { opacity: 1; }

  /* Badges (left stack) */
  .pcard-badges {
    position: absolute;
    top: 10px; left: 10px;
    display: flex;
    flex-direction: column;
    gap: 5px;
  }
  .pcard-badge-tag {
    font-family: 'Josefin Sans', sans-serif;
    font-weight: 400;
    font-size: 9px;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    padding: 3px 9px;
    border-radius: 2px;
    color: white;
  }
  .pcard-badge-tag.new  { background: var(--pc-green); }
  .pcard-badge-tag.best { background: linear-gradient(135deg, var(--pc-magenta), var(--pc-pink)); }
  .pcard-badge-tag.disc {
    background: linear-gradient(135deg, var(--pc-magenta), var(--pc-pink));
    box-shadow: 0 2px 8px rgba(255,0,128,0.3);
  }

  /* Favourite */
  .pcard-fav-icon {
    position: absolute;
    top: 10px; right: 10px;
    width: 34px; height: 34px;
    border-radius: 50%;
    background: rgba(255,255,255,0.9);
    border: 1px solid rgba(232,200,122,0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #aaa;
    cursor: pointer;
    transition: all 0.25s ease;
    box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  }
  .pcard-fav-icon:hover, .pcard-fav-icon.active {
    color: var(--pc-magenta);
    border-color: rgba(204,0,102,0.3);
    background: white;
  }
  .pcard-fav-icon.active svg { fill: var(--pc-magenta); }

  /* Gold corners */
  .pcard-corner {
    position: absolute;
    width: 13px; height: 13px;
    opacity: 0;
    transition: opacity 0.3s;
    pointer-events: none;
  }
  .pcard-grid:hover .pcard-corner { opacity: 1; }
  .pcard-corner.tl { top: 8px; right: 46px; border-top: 1.5px solid var(--pc-gold); border-right: 1.5px solid var(--pc-gold); }
  .pcard-corner.br { bottom: 8px; left: 8px; border-bottom: 1.5px solid var(--pc-gold); border-left: 1.5px solid var(--pc-gold); }

  /* Hover action overlay */
  .pcard-hover-actions {
    position: absolute;
    inset: 0;
    background: rgba(26,0,16,0.35);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
    opacity: 0;
    transition: opacity 0.3s ease;
    backdrop-filter: blur(2px);
  }
  .pcard-hover-actions.show { opacity: 1; }

  .pcard-action-btn {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 10px 22px;
    background: rgba(255,255,255,0.92);
    border: 1px solid rgba(232,200,122,0.4);
    border-radius: 2px;
    font-family: 'Josefin Sans', sans-serif;
    font-weight: 400;
    font-size: 10.5px;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: #333;
    cursor: pointer;
    transition: all 0.25s ease;
    white-space: nowrap;
  }
  .pcard-action-btn:hover {
    background: white;
    border-color: var(--pc-gold);
    color: var(--pc-magenta);
  }
  .pcard-action-btn.cart {
    background: linear-gradient(135deg, var(--pc-magenta), var(--pc-pink));
    border-color: transparent;
    color: white;
  }
  .pcard-action-btn.cart:hover {
    box-shadow: 0 4px 16px rgba(255,0,128,0.4);
    transform: scale(1.03);
    color: white;
  }
  .pcard-action-btn.cart.added {
    background: var(--pc-green);
    border-color: transparent;
    color: white;
  }
  .pcard-action-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none !important; }

  /* Body */
  .pcard-body {
    padding: 14px 16px 16px;
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0;
  }
  .pcard-body-top { flex: 1; }

  .pcard-name {
    font-family: 'Cormorant Garamond', serif;
    font-weight: 600;
    font-size: 16px;
    color: #1a0010;
    margin: 0 0 8px;
    line-height: 1.3;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-decoration: none;
    cursor: pointer;
    transition: color 0.2s;
  }
  .pcard-name:hover { color: var(--pc-magenta); }

  /* Stars */
  .pcard-stars-row {
    display: flex;
    align-items: center;
    gap: 3px;
    margin-bottom: 10px;
  }
  .pcard-star {
    width: 13px; height: 13px;
    color: #ddd;
    fill: #ddd;
    transition: color 0.15s;
  }
  .pcard-star.filled { color: var(--pc-gold); fill: var(--pc-gold); }
  .pcard-reviews {
    font-family: 'Josefin Sans', sans-serif;
    font-weight: 300;
    font-size: 10px;
    letter-spacing: 0.06em;
    color: #aaa;
    margin-left: 3px;
  }

  /* Price */
  .pcard-price-row {
    display: flex;
    align-items: baseline;
    gap: 7px;
    margin-bottom: 8px;
    flex-wrap: wrap;
  }
  .pcard-price {
    font-family: 'Cormorant Garamond', serif;
    font-weight: 700;
    font-size: 20px;
    color: var(--pc-magenta);
    line-height: 1;
  }
  .pcard-old {
    font-family: 'Josefin Sans', sans-serif;
    font-weight: 300;
    font-size: 11px;
    text-decoration: line-through;
    color: #ccc;
  }

  /* Stock */
  .pcard-stock-row {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
  }
  .pcard-stock-label {
    font-family: 'Josefin Sans', sans-serif;
    font-weight: 300;
    font-size: 10.5px;
    letter-spacing: 0.08em;
  }
  .pcard-stock-label.in  { color: var(--pc-green); }
  .pcard-stock-label.out { color: #e53e3e; }
  .pcard-low-stock {
    font-family: 'Josefin Sans', sans-serif;
    font-weight: 400;
    font-size: 9px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #c05621;
    background: rgba(237,137,54,0.1);
    border: 1px solid rgba(237,137,54,0.25);
    border-radius: 20px;
    padding: 2px 8px;
  }

  /* Qty */
  .pcard-qty-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
  }
  .pcard-qty-label {
    font-family: 'Josefin Sans', sans-serif;
    font-weight: 300;
    font-size: 10px;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: #999;
  }
  .pcard-qty {
    display: flex;
    align-items: center;
    gap: 0;
    border: 1px solid rgba(232,200,122,0.35);
    border-radius: 3px;
    overflow: hidden;
  }
  .pcard-qty-btn {
    width: 30px; height: 30px;
    background: none;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #888;
    transition: all 0.2s;
  }
  .pcard-qty-btn:hover:not(:disabled) { background: rgba(204,0,102,0.06); color: var(--pc-magenta); }
  .pcard-qty-btn:disabled { opacity: 0.3; cursor: not-allowed; }
  .pcard-qty-num {
    font-family: 'Josefin Sans', sans-serif;
    font-weight: 400;
    font-size: 13px;
    color: #333;
    min-width: 32px;
    text-align: center;
    border-left: 1px solid rgba(232,200,122,0.25);
    border-right: 1px solid rgba(232,200,122,0.25);
    padding: 0 4px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  /* Add to Cart button */
  .pcard-add-btn {
    position: relative;
    overflow: hidden;
    width: 100%;
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    margin-top: auto;
  }
  .pcard-add-btn.disabled { cursor: not-allowed; opacity: 0.5; }
  .pcard-add-inner {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: 100%;
    padding: 13px;
    background: linear-gradient(135deg, var(--pc-magenta) 0%, var(--pc-pink) 50%, var(--pc-magenta) 100%);
    background-size: 200% 100%;
    border-radius: 2px;
    font-family: 'Josefin Sans', sans-serif;
    font-weight: 400;
    font-size: 11px;
    letter-spacing: 0.25em;
    text-transform: uppercase;
    color: white;
    transition: all 0.35s ease;
    position: relative;
    z-index: 1;
  }
  .pcard-add-btn:not(.disabled):hover .pcard-add-inner {
    background-position: 100% 0;
    box-shadow: 0 4px 20px rgba(255,0,128,0.4);
    transform: translateY(-1px);
  }
  .pcard-add-btn.added .pcard-add-inner {
    background: var(--pc-green);
  }
  .pcard-add-btn.disabled .pcard-add-inner {
    background: #e5e5e5;
    color: #aaa;
  }
  .pcard-add-shimmer {
    position: absolute;
    top: 0; left: -100%;
    width: 60%; height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent);
    transform: skewX(-20deg);
    transition: left 0.55s ease;
    z-index: 2;
  }
  .pcard-add-btn:not(.disabled):hover .pcard-add-shimmer { left: 150%; }

  /* Bottom bar */
  .pcard-bar {
    height: 2px;
    background: linear-gradient(90deg, var(--pc-gold), var(--pc-pink));
    transform: scaleX(0);
    transform-origin: left;
    transition: transform 0.4s cubic-bezier(0.4,0,0.2,1);
    flex-shrink: 0;
  }
  .pcard-grid:hover .pcard-bar { transform: scaleX(1); }

  /* ════════════════════════════
     LIST CARD
  ════════════════════════════ */
  .pcard-list {
    background: white;
    border: 1px solid rgba(232,200,122,0.2);
    border-radius: 12px;
    overflow: hidden;
    display: flex;
    align-items: stretch;
    transition: transform 0.3s ease, box-shadow 0.3s, border-color 0.3s;
    position: relative;
  }
  .pcard-list:hover {
    transform: translateX(4px);
    border-color: rgba(232,200,122,0.5);
    box-shadow: 0 6px 28px rgba(153,0,68,0.1);
  }
  .pcard-list::before {
    content: '';
    position: absolute;
    left: 0; top: 0; bottom: 0;
    width: 3px;
    background: linear-gradient(to bottom, var(--pc-gold), var(--pc-pink));
    transform: scaleY(0);
    transition: transform 0.35s ease;
    border-radius: 0 2px 2px 0;
  }
  .pcard-list:hover::before { transform: scaleY(1); }

  .pcard-list-img-link { display: block; flex-shrink: 0; text-decoration: none; }
  .pcard-list-img-wrap {
    position: relative;
    width: 150px; height: 150px;
    overflow: hidden;
    background: linear-gradient(135deg, #fff0f6, #fce4f0);
  }
  @media (min-width: 768px) { .pcard-list-img-wrap { width: 190px; height: 180px; } }
  .pcard-list-img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.5s ease; }
  .pcard-list:hover .pcard-list-img { transform: scale(1.05); }
  .pcard-list-overlay {
    position: absolute; inset: 0;
    background: linear-gradient(to right, transparent 60%, rgba(26,0,16,0.1));
    opacity: 0;
    transition: opacity 0.3s;
  }
  .pcard-list:hover .pcard-list-overlay { opacity: 1; }
  .pcard-badge {
    position: absolute; top: 10px; left: 10px;
    background: linear-gradient(135deg, var(--pc-magenta), var(--pc-pink));
    color: white;
    font-family: 'Josefin Sans', sans-serif;
    font-weight: 400;
    font-size: 9px;
    letter-spacing: 0.1em;
    padding: 3px 8px;
    border-radius: 2px;
  }

  .pcard-list-body {
    flex: 1;
    padding: 18px 20px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }
  .pcard-list-top { display: flex; flex-direction: column; gap: 6px; }

  .pcard-cat-row { display: flex; gap: 6px; flex-wrap: wrap; }
  .pcard-pill {
    font-family: 'Josefin Sans', sans-serif;
    font-weight: 400;
    font-size: 9px;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    padding: 3px 9px;
    border-radius: 2px;
    color: white;
  }
  .pcard-pill.new  { background: var(--pc-green); }
  .pcard-pill.best { background: linear-gradient(135deg, var(--pc-magenta), var(--pc-pink)); }

  .pcard-list-name {
    font-family: 'Cormorant Garamond', serif;
    font-weight: 700;
    font-size: 19px;
    color: #1a0010;
    margin: 0;
    text-decoration: none;
    cursor: pointer;
    line-height: 1.25;
    transition: color 0.2s;
    display: block;
  }
  .pcard-list-name:hover { color: var(--pc-magenta); }

  .pcard-list-bottom { display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
  .pcard-list-actions { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }

  .pcard-fav-btn, .pcard-eye-btn {
    width: 36px; height: 36px;
    border-radius: 50%;
    background: none;
    border: 1px solid rgba(232,200,122,0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #aaa;
    cursor: pointer;
    transition: all 0.25s;
    flex-shrink: 0;
  }
  .pcard-fav-btn:hover, .pcard-eye-btn:hover {
    color: var(--pc-magenta);
    border-color: rgba(204,0,102,0.3);
    background: rgba(204,0,102,0.04);
  }
  .pcard-fav-btn.active { color: var(--pc-magenta); }
  .pcard-fav-btn.active svg { fill: var(--pc-magenta); }

  .pcard-cart-btn {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 10px 20px;
    background: linear-gradient(135deg, var(--pc-magenta), var(--pc-pink));
    background-size: 200% 100%;
    border: none;
    border-radius: 2px;
    font-family: 'Josefin Sans', sans-serif;
    font-weight: 400;
    font-size: 10.5px;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: white;
    cursor: pointer;
    transition: all 0.3s ease;
    white-space: nowrap;
  }
  .pcard-cart-btn:hover:not(:disabled) {
    background-position: 100% 0;
    box-shadow: 0 4px 16px rgba(255,0,128,0.35);
    transform: translateY(-1px);
  }
  .pcard-cart-btn.added { background: var(--pc-green); }
  .pcard-cart-btn:disabled { opacity: 0.5; cursor: not-allowed; }

  /* Spinner */
  .pcard-spinner {
    display: inline-block;
    width: 13px; height: 13px;
    border: 2px solid rgba(255,255,255,0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: pcSpin 0.7s linear infinite;
    flex-shrink: 0;
  }
  .pcard-spinner.sm { width: 11px; height: 11px; }
  @keyframes pcSpin { to { transform: rotate(360deg); } }
`