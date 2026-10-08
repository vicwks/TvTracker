import { createContext, useContext, useEffect, useState } from 'react';
import client from '../api/client.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = () => {
    return client
      .get('/auth/me')
      .then((res) => setUser(res.data))
      .catch(() => setUser(null));
  };

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, []);

  const login = async (username, password) => {
    const { data } = await client.post('/auth/login', { username, password });
    setUser(data);
    return data;
  };

  const register = async ({ email, username, password }) => {
    const { data } = await client.post('/auth/register', { email, username, password });
    setUser(data);
    return data;
  };

  const logout = async () => {
    await client.post('/auth/logout');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
