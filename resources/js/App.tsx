import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Pets from './pages/Pets';
import Calendar from './pages/Calendar';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import PetProfile from './pages/PetProfile';

function App() {
  return (
    <Routes>
      {/* Публичные страницы */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Защищённые страницы с Layout */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Layout>
            <Dashboard />
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/pets" element={
        <ProtectedRoute>
          <Layout>
            <Pets />
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/calendar" element={
        <ProtectedRoute>
          <Layout>
            <Calendar />
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="/pets/:id" element={
        <ProtectedRoute>
          <Layout>
            <PetProfile />
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;