import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { ToastProvider } from '@/components/Toast';
import PrivateRoute from '@/components/PrivateRoute';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import Produits from '@/pages/Produits';
import Mouvements from '@/pages/Mouvements';
import Rapports from '@/pages/Rapports';

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/"
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/produits"
              element={
                <PrivateRoute>
                  <Produits />
                </PrivateRoute>
              }
            />
            <Route
              path="/mouvements"
              element={
                <PrivateRoute>
                  <Mouvements />
                </PrivateRoute>
              }
            />
            <Route
              path="/rapports"
              element={
                <PrivateRoute>
                  <Rapports />
                </PrivateRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}
