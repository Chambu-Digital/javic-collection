'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useUserStore } from '@/lib/user-store'
import GoogleSignInButton from '@/components/auth/google-sign-in-button'
import { useToast } from '@/components/ui/custom-toast'

export default function RegisterPage() {
  const router = useRouter()
  const { user, setUser } = useUserStore()
  const { success: showSuccessToast, error: showErrorToast } = useToast()
  const [returnTo, setReturnTo] = useState<string>('/')
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: ''
  })

  // Get return URL from query params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const returnUrl = urlParams.get('returnTo')
    if (returnUrl) {
      setReturnTo(decodeURIComponent(returnUrl))
    }
  }, [])

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      router.push(returnTo)
    }
  }, [user, router, returnTo])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed')
      }

      // Update user store
      setUser(data.user)
      showSuccessToast('Account created successfully!')
      router.push(returnTo)
    } catch (error: any) {
      showErrorToast(error.message || 'Registration failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  if (user) {
    return null // Will redirect
  }

  return (
    <>
      <style>{pageStyles}</style>
      <div className="register-root">
        {/* Decorative background */}
        <div className="register-bg-orb left" aria-hidden="true" />
        <div className="register-bg-orb right" aria-hidden="true" />
        
        <div className="register-container">
          {/* Logo */}
          <div className="register-header">
            <Link href="/" className="register-logo-link">
              <div className="register-logo-wrap">
                <img 
                  src="/javic-logo1.png" 
                  alt="Javic Collection" 
                  className="register-logo-img"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = "/javiclogo.png";
                  }}
                />
              </div>
              <div className="register-brand">
                <span className="register-brand-name">JAVIC</span>
                <span className="register-brand-sub">Collection</span>
              </div>
            </Link>
            <p className="register-tagline">Create your account to get started</p>
          </div>

          <Card className="register-card">
            <CardHeader className="register-card-header">
              <CardTitle className="register-card-title">Create Account</CardTitle>
              <CardDescription className="register-card-desc">
                Join us and discover luxury lingerie, sleepwear, and intimate apparel
              </CardDescription>
            </CardHeader>
            
            <CardContent className="register-card-content">
              {/* Registration Form */}
              <form onSubmit={handleSubmit} className="register-form">
                <div className="register-form-row">
                  <div className="register-form-field">
                    <label htmlFor="firstName" className="register-label">First Name</label>
                    <Input
                      id="firstName"
                      name="firstName"
                      type="text"
                      required
                      value={formData.firstName}
                      onChange={handleChange}
                      className="register-input"
                      placeholder="Enter your first name"
                    />
                  </div>
                  <div className="register-form-field">
                    <label htmlFor="lastName" className="register-label">Last Name</label>
                    <Input
                      id="lastName"
                      name="lastName"
                      type="text"
                      required
                      value={formData.lastName}
                      onChange={handleChange}
                      className="register-input"
                      placeholder="Enter your last name"
                    />
                  </div>
                </div>

                <div className="register-form-field">
                  <label htmlFor="email" className="register-label">Email Address</label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="register-input"
                    placeholder="your.email@example.com"
                  />
                </div>

                <div className="register-form-field">
                  <label htmlFor="phone" className="register-label">Phone Number (Optional)</label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    className="register-input"
                    placeholder="+254 700 000 000"
                  />
                </div>

                <div className="register-form-field">
                  <label htmlFor="password" className="register-label">Password</label>
                  <div className="register-password-wrapper">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      required
                      minLength={6}
                      value={formData.password}
                      onChange={handleChange}
                      className="register-input"
                      placeholder="Minimum 6 characters"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="register-password-toggle"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                          <line x1="1" y1="1" x2="23" y2="23"/>
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                          <circle cx="12" cy="12" r="3"/>
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="register-submit-btn"
                >
                  {isLoading ? 'Creating Account...' : 'CREATE ACCOUNT'}
                </Button>
              </form>
              
              {/* Divider */}
              <div className="register-divider">
                <span className="register-divider-line" />
                <span className="register-divider-text">or continue with</span>
                <span className="register-divider-line" />
              </div>

              {/* Google Sign-In Button */}
              <GoogleSignInButton
                returnTo={returnTo}
                onSuccess={() => {
                  showSuccessToast('Welcome to JAVIC COLLECTION!')
                }}
                onError={(error) => {
                  console.error('Registration error:', error)
                  showErrorToast(error || 'Google sign-up failed. Please try again.')
                }}
              />
              
              {/* Benefits */}
              <div className="register-benefits">
                <div className="register-benefit-item">
                  <span className="register-benefit-text">Track your orders</span>
                </div>
                <div className="register-benefit-item">
                  <span className="register-benefit-text">Save your favorites</span>
                </div>
                <div className="register-benefit-item">
                  <span className="register-benefit-text">Exclusive offers</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Footer Links */}
          <div className="register-footer">
            <p className="register-footer-text">
              Already have an account?{' '}
              <Link
                href={`/account/login${returnTo !== '/' ? `?returnTo=${encodeURIComponent(returnTo)}` : ''}`}
                className="register-footer-link"
              >
                Sign in here
              </Link>
            </p>
            
            <div className="register-footer-nav">
              <Link href="/" className="register-footer-nav-link">
                ← Back to store
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

  .register-root {
    min-height: 100vh;
    background: linear-gradient(135deg, #1A0010 0%, #2d0020 50%, #1A0010 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    position: relative;
    overflow: hidden;
  }

  .register-bg-orb {
    position: absolute;
    width: 500px;
    height: 500px;
    border-radius: 50%;
    pointer-events: none;
    opacity: 0.12;
  }
  .register-bg-orb.left {
    top: -150px;
    left: -100px;
    background: radial-gradient(circle, #FF0066, transparent 70%);
  }
  .register-bg-orb.right {
    bottom: -150px;
    right: -100px;
    background: radial-gradient(circle, #FF4D94, transparent 70%);
  }

  .register-container {
    width: 100%;
    max-width: 440px;
    position: relative;
    z-index: 1;
  }

  .register-header {
    text-align: center;
    margin-bottom: 32px;
  }

  .register-logo-link {
    display: inline-flex;
    align-items: center;
    gap: 12px;
    text-decoration: none;
    margin-bottom: 12px;
  }

  .register-logo-wrap {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: linear-gradient(135deg, #FF0066, #FF4D94);
    padding: 2px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 8px 24px rgba(255, 0, 102, 0.3);
  }

  .register-logo-img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    border-radius: 50%;
  }

  .register-brand {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }

  .register-brand-name {
    font-family: 'Cormorant Garamond', serif;
    font-size: 28px;
    font-weight: 700;
    color: white;
    letter-spacing: 0.1em;
    line-height: 1;
  }

  .register-brand-sub {
    font-family: 'Josefin Sans', sans-serif;
    font-size: 10px;
    font-weight: 300;
    letter-spacing: 0.3em;
    text-transform: uppercase;
    color: #FF4D94;
  }

  .register-tagline {
    font-family: 'Josefin Sans', sans-serif;
    font-size: 13px;
    font-weight: 300;
    letter-spacing: 0.08em;
    color: rgba(255, 255, 255, 0.6);
    margin-top: 8px;
  }

  .register-card {
    background: white;
    border-radius: 12px;
    border: 1px solid rgba(232, 200, 122, 0.2);
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    overflow: hidden;
  }

  .register-card-header {
    text-align: center;
    padding: 32px 32px 20px;
  }

  .register-card-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 28px;
    font-weight: 700;
    color: #1A0010;
    margin-bottom: 8px;
  }

  .register-card-desc {
    font-family: 'Josefin Sans', sans-serif;
    font-size: 13px;
    font-weight: 300;
    color: #6B4055;
    line-height: 1.6;
    letter-spacing: 0.02em;
  }

  .register-card-content {
    padding: 0 32px 32px;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .register-form {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .register-form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }

  .register-form-field {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .register-label {
    font-family: 'Josefin Sans', sans-serif;
    font-size: 12px;
    font-weight: 500;
    color: #1A0010;
    letter-spacing: 0.02em;
  }

  .register-input {
    font-family: 'Josefin Sans', sans-serif;
    font-size: 13px;
    padding: 10px 14px;
    border: 1px solid #EED4DE;
    border-radius: 6px;
    background: #FFF5F8;
    color: #1A0010;
    transition: all 0.2s;
  }

  .register-input:focus {
    outline: none;
    border-color: #FF0066;
    box-shadow: 0 0 0 3px rgba(255, 0, 102, 0.1);
  }

  .register-input::placeholder {
    color: #b89fc5;
  }

  .register-password-wrapper {
    position: relative;
    display: flex;
    align-items: center;
  }

  .register-password-toggle {
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

  .register-password-toggle:hover {
    color: #FF0066;
  }

  .register-password-toggle:focus {
    outline: none;
    color: #FF0066;
  }

  .register-submit-btn {
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

  .register-submit-btn:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(255, 0, 102, 0.4);
  }

  .register-submit-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .register-divider {
    display: flex;
    align-items: center;
    gap: 12px;
    margin: 8px 0;
  }

  .register-divider-line {
    flex: 1;
    height: 1px;
    background: linear-gradient(90deg, transparent, #EED4DE, transparent);
  }

  .register-divider-text {
    font-family: 'Josefin Sans', sans-serif;
    font-size: 10px;
    font-weight: 300;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: #6B4055;
  }

  .register-benefits {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 16px;
    background: linear-gradient(135deg, rgba(255, 0, 102, 0.03), rgba(255, 77, 148, 0.05));
    border: 1px solid rgba(255, 0, 102, 0.1);
    border-radius: 8px;
  }

  .register-benefit-item {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .register-benefit-icon {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: linear-gradient(135deg, #FF0066, #FF4D94);
    color: white;
    font-size: 11px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .register-benefit-text {
    font-family: 'Josefin Sans', sans-serif;
    font-size: 12px;
    font-weight: 400;
    color: #6B4055;
    letter-spacing: 0.02em;
  }

  .register-footer {
    margin-top: 24px;
    text-align: center;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .register-footer-text {
    font-family: 'Josefin Sans', sans-serif;
    font-size: 13px;
    font-weight: 300;
    color: rgba(255, 255, 255, 0.7);
    letter-spacing: 0.02em;
  }

  .register-footer-link {
    color: #FF4D94;
    font-weight: 500;
    text-decoration: none;
    transition: color 0.2s;
  }

  .register-footer-link:hover {
    color: #FF0066;
    text-decoration: underline;
  }

  .register-footer-nav {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    font-family: 'Josefin Sans', sans-serif;
    font-size: 12px;
  }

  .register-footer-nav-link {
    color: rgba(255, 255, 255, 0.6);
    text-decoration: none;
    transition: color 0.2s;
    letter-spacing: 0.02em;
  }

  .register-footer-nav-link:hover {
    color: #FF4D94;
  }
`