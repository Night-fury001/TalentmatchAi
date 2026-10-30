import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { NotificationProvider } from './context/NotificationContext.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import ScrollToTop from './components/ScrollToTop.jsx';
import './index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <ScrollToTop />
        <AuthProvider>
          <NotificationProvider>
            <App />
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  borderRadius: '1rem',
                  background: '#18181c',
                  color: '#fff',
                  fontSize: '0.875rem',
                },
                success: { iconTheme: { primary: '#34d399', secondary: '#18181c' } },
                error: { iconTheme: { primary: '#fb7185', secondary: '#18181c' } },
              }}
            />
          </NotificationProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>
);
