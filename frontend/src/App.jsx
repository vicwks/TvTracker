import { lazy, Suspense, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import { useI18n } from './i18n/LanguageContext.jsx';
import { applyHead, pageMeta } from './seo/meta.js';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Home from './pages/Home.jsx';
import NotFound from './pages/NotFound.jsx';
// Pages légales : petites, et sans elles le pied de page se décalerait au chargement.
import { Cgu, MentionsLegales } from './pages/Legal.jsx';

// Chaque page est chargée à la demande : le premier écran ne télécharge que le code de sa page.
const Discover = lazy(() => import('./pages/Discover.jsx'));
const ShowDetail = lazy(() => import('./pages/ShowDetail.jsx'));
const MovieDetail = lazy(() => import('./pages/MovieDetail.jsx'));
const Watchlist = lazy(() => import('./pages/Watchlist.jsx'));
const CalendarPage = lazy(() => import('./pages/CalendarPage.jsx'));
const Stats = lazy(() => import('./pages/Stats.jsx'));
const Friends = lazy(() => import('./pages/Friends.jsx'));
const Settings = lazy(() => import('./pages/Settings.jsx'));

// Pages d'accès sans barre de navigation : elles ont leur propre mise en page.
const AUTH_PATHS = ['/login', '/register'];

export default function App() {
  const { pathname } = useLocation();
  const { lang } = useI18n();

  // Changer de page repart du haut : une fiche ouverte depuis le bas d'une liste s'affiche en haut.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  // Titre, description et robots propres à la page (les pages privées ne sont pas indexées).
  useEffect(() => {
    applyHead(pageMeta(pathname, lang));
  }, [pathname, lang]);

  const isAuthPage = AUTH_PATHS.includes(pathname);

  return (
    <AuthProvider>
      <div className="min-h-screen bg-ink">
        {!isAuthPage && <Navbar />}
        {/* Fond d'encre pendant le chargement d'une page : pas d'écran blanc entre deux pages. */}
        <Suspense fallback={<div className="min-h-[60dvh] bg-ink" />}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/cgu" element={<Cgu />} />
            <Route path="/mentions-legales" element={<MentionsLegales />} />

            <Route path="/" element={<Home />} />
            <Route path="/discover" element={<ProtectedRoute><Discover /></ProtectedRoute>} />
            <Route path="/search" element={<Navigate to="/discover" replace />} />
            <Route path="/show/:id" element={<ProtectedRoute><ShowDetail /></ProtectedRoute>} />
            <Route path="/shows" element={<Navigate to="/watchlist" replace />} />
            <Route path="/movies" element={<Navigate to="/watchlist" replace />} />
            <Route path="/movie/:id" element={<ProtectedRoute><MovieDetail /></ProtectedRoute>} />
            <Route path="/watchlist" element={<ProtectedRoute><Watchlist /></ProtectedRoute>} />
            <Route path="/calendar" element={<ProtectedRoute><CalendarPage /></ProtectedRoute>} />
            <Route path="/stats" element={<ProtectedRoute><Stats /></ProtectedRoute>} />
            <Route path="/friends" element={<ProtectedRoute><Friends /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
        {!isAuthPage && <Footer />}
      </div>
    </AuthProvider>
  );
}
