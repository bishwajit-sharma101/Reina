import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
// 1. Import the Provider
import { GoogleOAuthProvider } from '@react-oauth/google'


createRoot(document.getElementById('root')).render(
  // 2. Wrap your App
  <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
    <App />
  </GoogleOAuthProvider>
)