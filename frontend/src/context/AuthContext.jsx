import React, { createContext, useState, useEffect, useContext } from "react";
import api from "../services/api";

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const res = await api.get("/auth/me");
          setUser(res.data);
        } catch (err) {
          localStorage.removeItem("token");
          setUser(null);
        }
      }
      setLoading(false);
    };
    loadUser();
  }, []);

  const login = async (email, password, role) => {
    const res = await api.post(`/auth/login/${role}`, { email, password });
    localStorage.setItem("token", res.data.token);
    const userRes = await api.get("/auth/me", {
      headers: { "x-auth-token": res.data.token },
    });
    setUser(userRes.data);
    return { token: res.data.token, user: userRes.data };
  };

  const register = async (name, email, password, faceDescriptor) => {
    const res = await api.post("/auth/register/user", {
      name,
      email,
      password,
      faceDescriptor,
    });
    localStorage.setItem("token", res.data.token);
    const userRes = await api.get("/auth/me", {
      headers: { "x-auth-token": res.data.token },
    });
    setUser(userRes.data);
    return { token: res.data.token, user: userRes.data };
  };

  const registerAdmin = async (name, email, password) => {
    const res = await api.post("/auth/register/admin", {
      name,
      email,
      password,
    });
    localStorage.setItem("token", res.data.token);
    const userRes = await api.get("/auth/me", {
      headers: { "x-auth-token": res.data.token },
    });
    setUser(userRes.data);
    return { token: res.data.token, user: userRes.data };
  };
  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    logout,
    register,
    registerAdmin,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
