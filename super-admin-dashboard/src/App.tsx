import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { DashboardLayout } from './layouts/DashboardLayout';
import { Login } from './pages/Login';
import { Overview } from './pages/Overview';
import { Users } from './pages/Users';
import { AuditLogs } from './pages/AuditLogs';
import { LoginLogs } from './pages/LoginLogs';
import { Metrics } from './pages/Metrics';
import { LiveMonitor } from './pages/LiveMonitor';
import { HousesSheet } from './pages/HousesSheet';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route path="/" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
            <Route index element={<Overview />} />
            <Route path="users" element={<Users />} />
            <Route path="houses" element={<HousesSheet />} />
            <Route path="audit-logs" element={<AuditLogs />} />
            <Route path="login-logs" element={<LoginLogs />} />
            <Route path="metrics" element={<Metrics />} />
            <Route path="live-monitor" element={<LiveMonitor />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
