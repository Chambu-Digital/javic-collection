'use client'

import { useState, useEffect } from 'react'
import { ArrowUp } from 'lucide-react'

export default function BackToTop() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const toggleVisibility = () => {
      // Show button when page is scrolled down 400px
      if (window.scrollY > 400) {
        setIsVisible(true)
      } else {
        setIsVisible(false)
      }
    }

    window.addEventListener('scroll', toggleVisibility)

    return () => {
      window.removeEventListener('scroll', toggleVisibility)
    }
  }, [])

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }

  return (
    <>
      <style>{styles}</style>
      <button
        onClick={scrollToTop}
        className={`back-to-top-btn ${isVisible ? 'visible' : ''}`}
        aria-label="Back to top"
      >
        <span className="back-to-top-inner">
          <ArrowUp size={20} strokeWidth={2.5} />
        </span>
        <span className="back-to-top-ring" />
        <span className="back-to-top-pulse" />
      </button>
    </>
  )
}

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Josefin+Sans:wght@400&display=swap');

  :root {
    --btt-pink: #FF0080;
    --btt-magenta: #CC0066;
    --btt-gold: #E8C87A;
  }

  .back-to-top-btn {
    position: fixed;
    bottom: 32px;
    right: 32px;
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--btt-magenta), var(--btt-pink));
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 40;
    opacity: 0;
    visibility: hidden;
    transform: translateY(20px) scale(0.8);
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 
      0 8px 24px rgba(204, 0, 102, 0.3),
      0 4px 12px rgba(0, 0, 0, 0.1);
  }

  .back-to-top-btn.visible {
    opacity: 1;
    visibility: visible;
    transform: translateY(0) scale(1);
  }

  .back-to-top-btn:hover {
    transform: translateY(-4px) scale(1.05);
    box-shadow: 
      0 12px 32px rgba(204, 0, 102, 0.4),
      0 6px 16px rgba(0, 0, 0, 0.15);
  }

  .back-to-top-btn:active {
    transform: translateY(-2px) scale(1.02);
  }

  .back-to-top-inner {
    position: relative;
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    transition: transform 0.3s ease;
  }

  .back-to-top-btn:hover .back-to-top-inner {
    transform: translateY(-2px);
  }

  /* Rotating ring */
  .back-to-top-ring {
    position: absolute;
    inset: -4px;
    border: 2px solid transparent;
    border-top-color: var(--btt-gold);
    border-right-color: var(--btt-gold);
    border-radius: 50%;
    opacity: 0;
    transition: opacity 0.3s ease;
    animation: bttRotate 3s linear infinite;
  }

  .back-to-top-btn:hover .back-to-top-ring {
    opacity: 0.7;
  }

  @keyframes bttRotate {
    to { transform: rotate(360deg); }
  }

  /* Pulse effect */
  .back-to-top-pulse {
    position: absolute;
    inset: 0;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--btt-magenta), var(--btt-pink));
    opacity: 0;
    animation: bttPulse 2s ease-out infinite;
  }

  @keyframes bttPulse {
    0% {
      opacity: 0.6;
      transform: scale(1);
    }
    100% {
      opacity: 0;
      transform: scale(1.5);
    }
  }

  /* Mobile adjustments */
  @media (max-width: 768px) {
    .back-to-top-btn {
      bottom: 24px;
      right: 24px;
      width: 48px;
      height: 48px;
    }

    .back-to-top-inner svg {
      width: 18px;
      height: 18px;
    }
  }

  /* Ensure it doesn't overlap with WhatsApp float */
  @media (max-width: 768px) {
    .back-to-top-btn {
      bottom: 90px; /* Above WhatsApp button */
    }
  }
`
