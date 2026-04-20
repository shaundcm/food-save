import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useApolloClient } from '@apollo/client';
import { User } from '../lib/types';

interface AuthContextValue {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(!!localStorage.getItem('token'));
  const client = useApolloClient();

  // On mount: if token exists, fetch current user from /graphql directly
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (!storedToken) {
      setLoading(false);
      return;
    }

    const apiUrl = import.meta.env.VITE_API_URL || '/graphql';
setLoading(true);
fetch(apiUrl, {
  method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${storedToken}`,
      },
      body: JSON.stringify({
        query: `query Me {
          me {
            id email name role phone address latitude longitude
            organization isActive createdAt unreadNotificationCount
          }
        }`,
      }),
    })
      .then(r => r.json())
      .then(data => {
        if (data?.data?.me) {
          setUser(data.data.me);
          setToken(storedToken);
        } else {
          // Token invalid
          localStorage.removeItem('token');
          setToken(null);
          setUser(null);
        }
      })
      .catch(() => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
      })
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback((newToken: string, newUser: User) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(newUser);
    setLoading(false);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setLoading(false);
    client.clearStore();
  }, [client]);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
