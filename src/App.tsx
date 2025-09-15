import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import ErrorBoundary from './components/ErrorBoundary';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import LevelSelect from './pages/LevelSelect';
import GameWrapper from './pages/GameWrapper';
import GameModeSelect from './pages/GameModeSelect';
import Tutorial from './pages/Tutorial';
import AdminDashboard from './pages/AdminDashboard';

function LevelSelectWrapper() {
  const location = useLocation();
  const mode = (location.state?.mode || 'truth') as 'truth' | 'dare';
  return <LevelSelect mode={mode} />;
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          } />
          <Route path="/game-mode" element={
            <ProtectedRoute>
              <GameModeSelect />
            </ProtectedRoute>
          } />
          <Route path="/tutorial" element={
            <ProtectedRoute>
              <Tutorial />
            </ProtectedRoute>
          } />
          <Route path="/levels" element={
            <ProtectedRoute>
              <LevelSelectWrapper />
            </ProtectedRoute>
          } />
          <Route path="/game/:mode/:level" element={
            <ProtectedRoute>
              <GameWrapper />
            </ProtectedRoute>
          } />
          <Route path="/admin" element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          } />
        </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
