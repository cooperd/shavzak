import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AuthProvider } from '@descope/react-sdk'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <AuthProvider projectId={import.meta.env.VITE_DESCOPE_PROJECT_ID}
                    oidcConfig={true}>
        <App />
      </AuthProvider>
    </StrictMode>
)
