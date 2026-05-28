import { createContext, useContext, useState } from "react";

const AuthContext = createContext(null);

function isTokenValid(token) {
  if (!token) return false;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => {
    const t = localStorage.getItem("accessToken");
    return isTokenValid(t) ? t : null;
  });

  const [user, setUser] = useState(() => {
    const t = localStorage.getItem("accessToken");
    if (!isTokenValid(t)) {
      localStorage.removeItem("accessToken");
      return null;
    }
    try {
      const payload = JSON.parse(atob(t.split(".")[1]));
      return { id: payload.sub, role: payload.role };
    } catch {
      return null;
    }
  });

  const login = (accessToken) => {
    localStorage.setItem("accessToken", accessToken);
    setToken(accessToken);
    try {
      const payload = JSON.parse(atob(accessToken.split(".")[1]));
      setUser({ id: payload.sub, role: payload.role });
    } catch {
      setUser(null);
    }
  };

  const logout = () => {
    localStorage.removeItem("accessToken");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ token, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}