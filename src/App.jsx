import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { ToastProvider } from "./context/ToastContext";
import { ConversationProvider } from "./context/ConversationContext";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Workspace from "./pages/Workspace";

function PrivateRoute({ children }) {
  const { token } = useAuth();
  return token ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <ConversationProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route
                  path="/workspace/:id"
                  element={
                    <PrivateRoute>
                      <Workspace />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/*"
                  element={
                    <PrivateRoute>
                      <Home />
                    </PrivateRoute>
                  }
                />
              </Routes>
            </BrowserRouter>
          </ConversationProvider>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;