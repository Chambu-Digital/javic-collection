'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useUserStore } from '@/lib/user-store'
import GoogleSignInButton from '@/components/auth/google-sign-in-button'
import { useToast } from '@/components/ui/custom-toast'

export default function LoginPage() {
  const router = useRouter()
  const { user, setUser } = useUserStore()
  const { success: showSuccessToast, error: showErrorToast } = useToast()
  const [returnTo, setReturnTo] = useState<string>('/')
  const [isLoading, setIsLoading] = useState(false)

  // Get return URL from query params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const returnUrl = urlParams.get('returnTo')
    console.log('Login page - URL search params:', window.location.search)
    console.log('Login page - returnTo param:', returnUrl)
    if (returnUrl) {
      const decodedUrl = decodeURIComponent(returnUrl)
      console.log('Login page - decoded returnTo:', decodedUrl)
      setReturnTo(decodedUrl)
    }
  }, [])

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      router.push(returnTo)
    }
  }, [user, router, returnTo])

  if (user) {
    return null // Will redirect
  }

  return (
    <>
      <style>{pageStyles}</style>
      <div className="login-root">
        {/* Decorative background */}
        <div className="login-bg-orb left" aria-hidden="true" />
        <div className="login-bg-orb right" aria-hidden="true" />
        
        <div className="login-container">
          {/* Logo */}
          <div className="login-header">
            <Link href="/" className="login-logo-link">
              <div className="login-logo-wrap">
                <img 
                  src="/javic-logo1.png" 
                  alt="Javic Collection" 
                  className="login-logo-img"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = "/javiclogo.png";
                  }}
                />
              </div>
              <div className="login-brand">
                <span className="login-brand-name">JAVIC</span>
                <span className="login-brand-sub">Collection</span>
              </div>
            </Link>
            <p className="login-tagline">Sign in to your account</p>
          </div>

          <Card className="login-card">
            <CardHeader className="login-card-header">
              <CardTitle className="login-card-title">Welcome Back</CardTitle>
              <p className="login-card-desc">
                Sign in to access your orders, favorites, and exclusive offers
              </p>
            </CardHeader>
            
            <CardContent className="login-card-content">
              <GoogleSignInButton
                returnTo={returnTo}
                onSuccess={() => { showSuccessToast('Welcome back!') }}
                onError={(error) => {
                  console.error('Login error:', error)
                  showErrorToast(error || 'Google sign-in failed. Please try again.')
                }}
              />
            </CardContent>
          </Card>

          {/* Footer Links */}
          <div className="login-footer">
            <p className="login-footer-text">
              Don't have an account?{' '}
              <Link
                href={`/account/register${returnTo !== '/' ? `?returnTo=${encodeURIComponent(returnTo)}` : ''}`}
                className="login-footer-link"
              >
                Sign up
              </Link>
            </p>
            
            <div className="login-footer-nav">
              <Link href="/" className="login-footer-nav-link">
                ← Back to store
              </Link>
              <span className="login-footer-dot">•</span>
              <Link href="/track-order" className="login-footer-nav-link">
                Track Order
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

const pageStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=Josefin+Sans:wght@300;400;500&display=swap');

  .login-root {
    min-height: 100vh;
    background: linear-gradient(135deg, #1A0010 0%, #2d0020 50%, #1A0010 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    position: relative;
    overflow: hidden;
  }

  .login-bg-orb {
    position: absolute;
    width: 500px;
    height: 500px;
    border-radius: 50%;
    pointer-events: none;
    opacity: 0.12;
  }
  .login-bg-orb.left {
    top: -150px;
    left: -100px;
    background: radial-gradient(circle, #FF0066, transparent 70%);
  }
  .login-bg-orb.right {
    bottom: -150px;
    right: -100px;
    background: radial-gradient(circle, #FF4D94, transparent 70%);
  }

  .login-container {
    width: 100%;
    max-width: 440px;
    position: relative;
    z-index: 1;
  }

  .login-header {
    text-align: center;
    margin-bottom: 32px;
  }

  .login-logo-link {
    display: inline-flex;
    align-items: center;
    gap: 12px;
    text-decoration: none;
    margin-bottom: 12px;
  }

  .login-logo-wrap {
    height: 52px;
    display: flex;
    align-items: center;
  }

  .login-logo-img {
    height: 100%;
    width: auto;
    object-fit: contain;
  }

  .login-brand {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }

  .login-brand-name {
    font-family: 'Cormorant Garamond', serif;
    font-size: 28px;
    font-weight: 700;
    color: white;
    letter-spacing: 0.1em;
    line-height: 1;
  }

  .login-brand-sub {
    font-family: 'Josefin Sans', sans-serif;
    font-size: 10px;
    font-weight: 300;
    letter-spacing: 0.3em;
    text-transform: uppercase;
    color: #FF4D94;
  }

  .login-tagline {
    font-family: 'Josefin Sans', sans-serif;
    font-size: 13px;
    font-weight: 300;
    letter-spacing: 0.08em;
    color: rgba(255, 255, 255, 0.6);
    margin-top: 8px;
  }

  .login-card {
    background: white;
    border-radius: 12px;
    border: 1px solid rgba(232, 200, 122, 0.2);
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    overflow: hidden;
  }

  .login-card-header {
    text-align: center;
    padding: 32px 32px 20px;
  }

  .login-card-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 28px;
    font-weight: 700;
    color: #1A0010;
    margin-bottom: 8px;
  }

  .login-card-desc {
    font-family: 'Josefin Sans', sans-serif;
    font-size: 13px;
    font-weight: 300;
    color: #6B4055;
    line-height: 1.6;
    letter-spacing: 0.02em;
  }

  .login-card-content {
    padding: 0 32px 32px;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .login-form {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .login-form-field {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .login-label {
    font-family: 'Josefin Sans', sans-serif;
    font-size: 12px;
    font-weight: 500;
    color: #1A0010;
    letter-spacing: 0.02em;
  }

  .login-input {
    font-family: 'Josefin Sans', sans-serif;
    font-size: 13px;
    padding: 10px 14px;
    border: 1px solid #EED4DE;
    border-radius: 6px;
    background: #FFF5F8;
    color: #1A0010;
    transition: all 0.2s;
  }

  .login-input:focus {
    outline: none;
    border-color: #FF0066;
    box-shadow: 0 0 0 3px rgba(255, 0, 102, 0.1);
  }

  .login-input::placeholder {
    color: #b89fc5;
  }

  .login-password-wrapper {
    position: relative;
    display: flex;
    align-items: center;
  }

  .login-password-toggle {
    position: absolute;
    right: 12px;
    background: none;
    border: none;
    color: #6B4055;
    cursor: pointer;
    padding: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: color 0.2s;
  }

  .login-password-toggle:hover {
    color: #FF0066;
  }

  .login-password-toggle:focus {
    outline: none;
    color: #FF0066;
  }

  .login-forgot-link-wrap {
    text-align: right;
  }

  .login-forgot-link {
    font-family: 'Josefin Sans', sans-serif;
    font-size: 12px;
    color: #FF0066;
    text-decoration: none;
    transition: color 0.2s;
  }

  .login-forgot-link:hover {
    color: #FF4D94;
    text-decoration: underline;
  }

  .login-submit-btn {
    width: 100%;
    padding: 12px 24px;
    background: linear-gradient(135deg, #FF0066, #FF4D94);
    color: white;
    font-family: 'Josefin Sans', sans-serif;
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 4px 12px rgba(255, 0, 102, 0.3);
  }

  .login-submit-btn:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(255, 0, 102, 0.4);
  }

  .login-submit-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .login-divider {
    display: flex;
    align-items: center;
    gap: 12px;
    margin: 8px 0;
  }

  .login-divider-line {
    flex: 1;
    height: 1px;
    background: linear-gradient(90deg, transparent, #EED4DE, transparent);
  }

  .login-divider-text {
    font-family: 'Josefin Sans', sans-serif;
    font-size: 11px;
    font-weight: 300;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: #6B4055;
  }

  .login-info-box {
    display: flex;
    gap: 12px;
    padding: 14px 16px;
    background: linear-gradient(135deg, rgba(255, 0, 102, 0.04), rgba(255, 77, 148, 0.06));
    border: 1px solid rgba(255, 0, 102, 0.15);
    border-radius: 8px;
  }

  .login-info-icon {
    font-size: 16px;
    flex-shrink: 0;
  }

  .login-info-text {
    font-family: 'Josefin Sans', sans-serif;
    font-size: 11.5px;
    font-weight: 300;
    color: #6B4055;
    line-height: 1.6;
    letter-spacing: 0.02em;
    margin: 0;
  }

  .login-footer {
    margin-top: 24px;
    text-align: center;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .login-footer-text {
    font-family: 'Josefin Sans', sans-serif;
    font-size: 13px;
    font-weight: 300;
    color: rgba(255, 255, 255, 0.7);
    letter-spacing: 0.02em;
  }

  .login-footer-link {
    color: #FF4D94;
    font-weight: 500;
    text-decoration: none;
    transition: color 0.2s;
  }

  .login-footer-link:hover {
    color: #FF0066;
    text-decoration: underline;
  }

  .login-footer-nav {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    font-family: 'Josefin Sans', sans-serif;
    font-size: 12px;
  }

  .login-footer-nav-link {
    color: rgba(255, 255, 255, 0.6);
    text-decoration: none;
    transition: color 0.2s;
    letter-spacing: 0.02em;
  }

  .login-footer-nav-link:hover {
    color: #FF4D94;
  }

  .login-footer-dot {
    color: rgba(255, 255, 255, 0.3);
  }
`