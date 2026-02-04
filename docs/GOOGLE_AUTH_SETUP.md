# Google OAuth Setup Guide

## 1. Create Google OAuth Credentials

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Google Identity** API (not Google+ API)
4. Go to "Credentials" in the left sidebar
5. Click "Create Credentials" → "OAuth 2.0 Client IDs"
6. Configure the OAuth consent screen if prompted:
   - User Type: External
   - Add your email as a test user during development
7. For Application type, select "Web application"
8. **IMPORTANT**: Add authorized JavaScript origins:
   - `http://localhost:3000` (for development)
   - `https://yourdomain.com` (for production)
9. **Leave "Authorized redirect URIs" EMPTY** (not needed for this implementation)

## 2. Common Issues & Solutions

### FedCM Error: "Error retrieving a token"
This usually means:
- ✅ **Domain not authorized**: Make sure `http://localhost:3000` is in "Authorized JavaScript origins"
- ✅ **Wrong API enabled**: Enable "Google Identity" API, not "Google+ API"
- ✅ **OAuth consent screen**: Must be configured with your email as test user
- ✅ **Client ID format**: Should look like `123456789-abc123.apps.googleusercontent.com`

### Testing the Setup
1. Open browser dev tools (F12)
2. Go to `/account/login`
3. Click "Continue with Google"
4. Check console for detailed error messages

## 3. Update Environment Variables

Your `.env.local` already has:
```env
NEXT_PUBLIC_GOOGLE_CLIENT_ID=776513330557-ciamb2fo6730rq09s1l1ri1jssb9osi0.apps.googleusercontent.com
```

## 4. Verify Google Cloud Console Settings

Make sure these are set correctly:
- **Authorized JavaScript origins**: `http://localhost:3000`
- **Authorized redirect URIs**: Leave empty
- **OAuth consent screen**: Configured with test users
- **API enabled**: Google Identity API

## 3. Test the Integration

1. Start your development server: `npm run dev`
2. Navigate to `/account/login` or `/account/register`
3. Click the "Continue with Google" button
4. Complete the Google sign-in flow
5. You should be redirected to `/account` upon successful authentication

## 4. User Experience

- **New Users**: When a user signs in with Google for the first time, a new account is automatically created with their Google profile information
- **Existing Users**: If a user already has an account with the same email address, their local account will be linked with their Google account
- **Profile Information**: Google users will have their profile picture and verified email status automatically set
- **Admin Access**: Google Auth is only available for regular users (customers), not admin accounts

## 5. Security Features

- Google ID tokens are verified server-side for security
- JWT tokens are still used for session management
- HTTP-only cookies prevent XSS attacks
- Email verification is automatically handled for Google users

## 6. Troubleshooting

- **"Invalid client" error**: Check that your Google Client ID is correct and the domain is authorized
- **"Unauthorized" error**: Ensure your redirect URIs are properly configured in Google Cloud Console
- **Button not appearing**: Check that the Google script is loading and your Client ID is set in environment variables