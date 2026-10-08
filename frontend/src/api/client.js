import axios from 'axios';

const client = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

// Si la session a expiré (401) en dehors des routes d'authentification elles-mêmes,
// on renvoie directement vers la page de connexion.
client.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || '';
    const isAuthRoute = url.startsWith('/auth/');
    if (error.response?.status === 401 && !isAuthRoute && window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default client;
