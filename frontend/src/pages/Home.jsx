import { lazy } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import Landing from './Landing.jsx';

const Dashboard = lazy(() => import('./Dashboard.jsx'));

// Adresse « / » : le tableau de bord pour un compte connecté, la présentation du site sinon.
// Pendant la vérification de la connexion, la présentation reste affichée : c'est celle du rendu pré-généré.
export default function Home() {
  const { user } = useAuth();
  return user ? <Dashboard /> : <Landing />;
}
