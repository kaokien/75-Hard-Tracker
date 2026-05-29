import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ClerkProvider } from '@clerk/clerk-react'
import { dark } from '@clerk/themes'
import './index.css'
import App from './App.tsx'

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!PUBLISHABLE_KEY) {
  throw new Error('Missing Clerk Publishable Key — add VITE_CLERK_PUBLISHABLE_KEY to .env.local')
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ClerkProvider
      publishableKey={PUBLISHABLE_KEY}
      appearance={{
        baseTheme: dark,
        variables: {
          colorPrimary: '#ff2d55',
          colorBackground: '#1c1c1e',
          colorInputBackground: '#2c2c2e',
          colorText: '#ffffff',
          colorTextSecondary: 'rgba(255,255,255,0.55)',
          borderRadius: '14px',
          fontFamily: '"SF Pro Display", "Inter", -apple-system, BlinkMacSystemFont, sans-serif',
        },
        elements: {
          card: {
            backgroundColor: 'rgba(28, 28, 30, 0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
          },
          formButtonPrimary: {
            background: 'linear-gradient(135deg, #ff2d55, #ff6b35)',
            fontWeight: '600',
            textTransform: 'none' as const,
            letterSpacing: '-0.01em',
          },
          headerTitle: {
            fontWeight: '700',
            letterSpacing: '-0.03em',
          },
          socialButtonsBlockButton: {
            border: '1px solid rgba(255,255,255,0.1)',
            backgroundColor: 'rgba(44, 44, 46, 0.6)',
          },
          footerActionLink: {
            color: '#ff2d55',
          },
        },
      }}
    >
      <App />
    </ClerkProvider>
  </StrictMode>,
)
