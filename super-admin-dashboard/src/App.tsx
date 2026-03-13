import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { DashboardLayout } from './layouts/DashboardLayout';
import { Overview } from './pages/Overview';
import { Users } from './pages/Users';
import { AuditLogs } from './pages/AuditLogs';
import { LoginLogs } from './pages/LoginLogs';
import { Metrics } from './pages/Metrics';
import { LiveMonitor } from './pages/LiveMonitor';
import { HousesSheet } from './pages/HousesSheet';
import { UserReports } from './pages/UserReports';
import { PropertyReports } from './pages/PropertyReports';
import { SupportRequests } from './pages/SupportRequests';
import { FraudAlerts } from './pages/FraudAlerts';
import { SuspiciousIPs } from './pages/SuspiciousIPs';
import { PropertyFraudAlerts } from './pages/PropertyFraudAlerts';
import { Growth } from './pages/Growth';

import { ErrorBoundary } from './components/ErrorBoundary';
import { Login } from './pages/Login';

function App() {
  return (
    <Router>
      <AuthProvider>
        <ErrorBoundary>
          <Routes>
            <Route path="/login" element={<Login />} />
            
            <Route path="/" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
              <Route index element={<Overview />} />
              
              {/* User Management */}
              <Route path="users" element={<Users />} />
              
              {/* Properties Management */}
              <Route path="houses" element={<HousesSheet />} />
              <Route path="houses-sheet" element={<HousesSheet />} />
              
              {/* Reports & Support */}
              <Route path="reports/users" element={<UserReports />} />
              <Route path="reports/properties" element={<PropertyReports />} />
              <Route path="reports/support" element={<SupportRequests />} />
              
              {/* System Monitoring */}
              <Route path="login-logs" element={<LoginLogs />} />
              <Route path="fraud-alerts" element={<FraudAlerts />} />
              <Route path="property-fraud" element={<PropertyFraudAlerts />} />
              <Route path="suspicious-ips" element={<SuspiciousIPs />} />
              <Route path="audit-logs" element={<AuditLogs />} />
              <Route path="live-monitor" element={<LiveMonitor />} />
              
              {/* Analytics */}
              <Route path="metrics" element={<Metrics />} />
              <Route path="growth" element={<Growth />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ErrorBoundary>
      </AuthProvider>
    </Router>
  );
}

export default App;
