import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { NotesProvider } from '@/context/NotesContext';
import AuthPage from '@/pages/AuthPage';
import AuthCallback from '@/pages/AuthCallback';
import Dashboard from '@/components/dashboard/Dashboard';
import ProtectedRoute from '@/components/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <NotesProvider>
        <Router>
          <div className="App">
            <Routes>
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </div>
        </Router>
      </NotesProvider>
    </AuthProvider>
  );
}

export default App;
