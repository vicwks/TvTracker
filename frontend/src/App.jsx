import { Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import { Cgu, MentionsLegales } from './pages/Legal.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Discover from './pages/Discover.jsx';
import Search from './pages/Search.jsx';
import ShowDetail from './pages/ShowDetail.jsx';
import MyShows from './pages/MyShows.jsx';
import MyMovies from './pages/MyMovies.jsx';
import MovieDetail from './pages/MovieDetail.jsx';
import Watchlist from './pages/Watchlist.jsx';
import CalendarPage from './pages/CalendarPage.jsx';
import Stats from './pages/Stats.jsx';
import Friends from './pages/Friends.jsx';

// Pages d'accès sans barre de navigation : elles ont leur propre mise en page.
const AUTH_PATHS = ['/login', '/register'];

export default function App() {
  const { pathname } = useLocation();
  const isAuthPage = AUTH_PATHS.includes(pathname);

  return (
    <AuthProvider>
      <div className="min-h-screen">
        {!isAuthPage && <Navbar />}
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/cgu" element={<Cgu />} />
          <Route path="/mentions-legales" element={<MentionsLegales />} />

          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/discover" element={<ProtectedRoute><Discover /></ProtectedRoute>} />
          <Route path="/search" element={<ProtectedRoute><Search /></ProtectedRoute>} />
          <Route path="/show/:id" element={<ProtectedRoute><ShowDetail /></ProtectedRoute>} />
          <Route path="/shows" element={<ProtectedRoute><MyShows /></ProtectedRoute>} />
          <Route path="/movies" element={<ProtectedRoute><MyMovies /></ProtectedRoute>} />
          <Route path="/movie/:id" element={<ProtectedRoute><MovieDetail /></ProtectedRoute>} />
          <Route path="/watchlist" element={<ProtectedRoute><Watchlist /></ProtectedRoute>} />
          <Route path="/calendar" element={<ProtectedRoute><CalendarPage /></ProtectedRoute>} />
          <Route path="/stats" element={<ProtectedRoute><Stats /></ProtectedRoute>} />
          <Route path="/friends" element={<ProtectedRoute><Friends /></ProtectedRoute>} />
        </Routes>
        {!isAuthPage && <Footer />}
      </div>
    </AuthProvider>
  );
}
