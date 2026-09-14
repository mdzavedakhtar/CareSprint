/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import { authAPI } from "../services/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Prevent old auth requests from overwriting a newer login.
  const authVersion = useRef(0);

  const fetchUser = async () => {
    const currentVersion = ++authVersion.current;

    try {
      const response = await authAPI.me();

      // Ignore stale request result.
      if (currentVersion !== authVersion.current) {
        return null;
      }

      if (response.data.success) {
        setUser(response.data.user);
        return response.data.user;
      }

      setUser(null);
      return null;
    } catch {
      // Ignore stale request error.
      if (currentVersion !== authVersion.current) {
        return null;
      }

      setUser(null);
      return null;
    } finally {
      if (currentVersion === authVersion.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    let ignore = false;
    authAPI.me().then((response) => {
      if (!ignore && response.data?.success) {
        setUser(response.data.user);
      } else if (!ignore) {
        setUser(null);
      }
    }).catch(() => {
      if (!ignore) setUser(null);
    }).finally(() => {
      if (!ignore) setLoading(false);
    });
    return () => { ignore = true; };
  }, []);

  const login = async (credentials) => {
    // Invalidate any previous fetchUser request.
    authVersion.current += 1;

    const response = await authAPI.login(credentials);

    if (!response.data.success) {
      return response.data;
    }

    const loggedInUser = response.data.user;

    // Immediately update user from login response.
    setUser(loggedInUser);

    // Keep loading false after successful login.
    setLoading(false);

    return {
      ...response.data,
      user: loggedInUser,
    };
  };

  const logout = async () => {
    // Invalidate any pending auth request.
    authVersion.current += 1;

    try {
      await authAPI.logout();
    } finally {
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch {
        // Ignore storage access errors
      }
      setUser(null);
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        refreshUser: fetchUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;
};