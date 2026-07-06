import { createContext, useContext, useState, useEffect } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import axios from "axios";

const API = "http://127.0.0.1:8000";
const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [username, setUsername] = useState(localStorage.getItem("username") || null);
  const { isAuthenticated, user, isLoading } = useAuth0();

  // Handle Auth0 social login
  useEffect(() => {
    if (isAuthenticated && user && !token) {
      const socialUsername = user.nickname || user.name || user.email?.split("@")[0];
      const socialPassword = user.sub.replace("|", "_");

      // Try signup first, then login
      axios.post(`${API}/auth/signup`, {
        username: socialUsername,
        password: socialPassword
      }).catch(() => {
        // User already exists — that's fine
      }).finally(() => {
        // Login to get JWT token
        axios.post(`${API}/auth/login`,
          new URLSearchParams({ username: socialUsername, password: socialPassword }),
          { headers: { "Content-Type": "application/x-www-form-urlencoded" }}
        ).then(res => {
          setToken(res.data.access_token);
          setUsername(socialUsername);
          localStorage.setItem("token", res.data.access_token);
          localStorage.setItem("username", socialUsername);
        }).catch(err => {
          console.error("Social login failed:", err);
        });
      });
    }
  }, [isAuthenticated, user]);

  const login = (token, username) => {
    setToken(token);
    setUsername(username);
    localStorage.setItem("token", token);
    localStorage.setItem("username", username);
  };

  const logout = () => {
    setToken(null);
    setUsername(null);
    localStorage.removeItem("token");
    localStorage.removeItem("username");
  };

  if (isLoading) return (
    <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center">
      <div className="text-center">
        <div className="text-6xl mb-4">🔮</div>
        <p className="text-gray-400">Loading GenBI...</p>
      </div>
    </div>
  );

  return (
    <AuthContext.Provider value={{ token, username, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}