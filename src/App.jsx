import { Toaster } from "sonner"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider } from '@/lib/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import Layout from './components/Layout';
import SaveStatusIndicator from './components/SaveStatusIndicator';
import { useEffect, lazy, Suspense } from 'react';
import { loadSettings } from '@/lib/settingsStore';
import { initThemeEngine } from '@/lib/themeEngine';
import { startContentSyncEngine } from '@/lib/contentSyncEngine';
import LogoLoader from './components/LogoLoader';
import SyncStatusBadge from './components/SyncStatusBadge';
import InstallPrompt from './components/InstallPrompt';

// Apply theme immediately from localStorage before any renders
try {
  const lsMode = localStorage.getItem("devs_theme_mode") || (localStorage.getItem("devs_dark_mode") === "true" ? "dark" : "light");
  if (lsMode === "dark") document.documentElement.classList.add("dark");
  else if (lsMode === "light") document.documentElement.classList.remove("dark");
} catch(e) {}

// Lazy-load pages for faster initial load
const Home = lazy(() => import('./pages/Home'));
const Books = lazy(() => import('./pages/Books'));
const BookDetails = lazy(() => import('./pages/BookDetails'));
const Favorites = lazy(() => import('./pages/Favorites'));
const Admin = lazy(() => import('./pages/Admin'));
const Settings = lazy(() => import('./pages/Settings'));
const DevPanel = lazy(() => import('./pages/DevPanel'));
const ReadBook = lazy(() => import('./pages/ReadBook'));
const Videos = lazy(() => import('./pages/Videos'));
const About = lazy(() => import('./pages/About'));
const Contact = lazy(() => import('./pages/Contact'));
const Login = lazy(() => import('./pages/Login'));

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <LogoLoader size={72} />
  </div>
);

// The site itself is public — no login required to browse books/videos.
// Only /admin, /settings and /dev are gated behind the admin login.
const App1 = () => {
  useEffect(() => {
    loadSettings();
    initThemeEngine();
  }, []);

  // Start the smart content sync engine (books/videos caching for offline use)
  useEffect(() => {
    const cleanup = startContentSyncEngine();
    return cleanup;
  }, []);

  return (
    <>
      <SaveStatusIndicator />
      <SyncStatusBadge />
      <InstallPrompt />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/books" element={<Books />} />
            <Route path="/book/:id" element={<BookDetails />} />
            <Route path="/favorites" element={<Favorites />} />
            <Route path="/read/:id" element={<ReadBook />} />
            <Route path="/videos" element={<Videos />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />

            {/* Admin-only area */}
            <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
              <Route path="/admin" element={<Admin />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/dev" element={<DevPanel />} />
            </Route>

            <Route path="*" element={<PageNotFound />} />
          </Route>
        </Routes>
      </Suspense>
    </>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <App1 />
        </Router>
        <Toaster position="bottom-center" richColors />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App
