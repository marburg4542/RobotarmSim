// src/App.jsx
import React, { useState, useEffect, createContext } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Homepage from './components/Homepage';
import AboutUs from './components/AboutUs';
import LoginPage from './components/Login';
import SettingsPage from './components/Settings';
import ResetPasswordPage from './components/ResetPassword';

// แชร์สถานะการล็อกอิน
export const AuthContext = createContext();

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    !!sessionStorage.getItem('token')
  );

  const location = useLocation();

  useEffect(() => {
    const onStorage = () =>
      setIsAuthenticated(!!sessionStorage.getItem('token'));
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, setIsAuthenticated }}>
      <div className="min-h-screen flex flex-col">
        {/* Navbar จะรับรู้สถานะ login จาก AuthContext */}
        <Navbar />
        <div className="relative flex-1 bg-base-100">
          <main className="h-full">
            <Routes>
              <Route
                path="/"
                element={
                  isAuthenticated
                    ? <Navigate to="/homepage" replace />
                    : <Navigate to="/login" replace />
                }
              />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
              
              <Route
                path="/homepage"
                element={isAuthenticated ? <Homepage /> : <Navigate to="/login" replace />}
              />
              <Route
                path="/settings"
                element={isAuthenticated ? <SettingsPage /> : <Navigate to="/login" replace />}
              />
              
              <Route
                path="*"
                element={
                  isAuthenticated
                    ? <Navigate to="/homepage" replace />
                    : <Navigate to="/login" replace />
                }
              />
            </Routes>
          </main>
        </div>
      </div>
    </AuthContext.Provider>
  );
}