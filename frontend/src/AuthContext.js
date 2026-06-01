import React, { createContext, useContext, useMemo, useState } from 'react';

const AuthContext = createContext({
  token: null,
  user: null,
  setSession: () => {},
  signOut: () => {},
});

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);

  const value = useMemo(() => ({
    token,
    user,
    setSession: ({ token: nextToken, user: nextUser }) => {
      setToken(nextToken);
      setUser(nextUser);
    },
    signOut: () => {
      setToken(null);
      setUser(null);
    },
  }), [token, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

export function getAuthConfig(token) {
  return token ? { headers: { Authorization: `Bearer ${token}` } } : undefined;
}
