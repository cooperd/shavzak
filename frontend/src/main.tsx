import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AuthProvider } from '@descope/react-sdk'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import App from './App.tsx'

const queryClient = new QueryClient();


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider projectId={import.meta.env.VITE_DESCOPE_PROJECT_ID}
      oidcConfig={true}>
      <QueryClientProvider client={queryClient}>

        <App />
      </QueryClientProvider>
    </AuthProvider>
  </StrictMode>
)
