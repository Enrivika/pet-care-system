import { Routes, Route, Navigate } from 'react-router-dom';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Pets from './pages/Pets';
import Calendar from './pages/Calendar';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import PetProfile from './pages/PetProfile';
import HealthRecords from './pages/HealthRecords';

function App() {
  return (
    <Routes>
      {/* Публичные страницы */}
      <Route path="/login" element={<Auth />} />
      <Route path="/register" element={<Auth />} />
      <Route path="/auth" element={<Auth />} />

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
      
      <Route path="/health" element={
        <ProtectedRoute>
          <Layout>
            <HealthRecords />
          </Layout>
        </ProtectedRoute>
      } />
    </Routes>
  );
}

export default App;