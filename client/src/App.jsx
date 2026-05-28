import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DoctorDashboard from "./pages/DoctorDashboard";
import AssistantDashboard from "./pages/AssistantDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import PatientDashboard from "./pages/PatientDashboard";
import PatientProfilePage from "./pages/PatientProfilePage";

const ROLE_DASHBOARD = {
  DOCTOR: "/dashboard/doctor",
  ASSISTANT: "/dashboard/assistant",
  ADMIN: "/dashboard/admin",
  PATIENT: "/dashboard/patient",
};

// Rută protejată
function PrivateRoute({ children, allowedRoles }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/login" replace />;
  return children;
}

// Rută publică (redirect dacă deja autentificat)
function PublicRoute({ children }) {
  const { user } = useAuth();
  if (user) {
    return <Navigate to={ROLE_DASHBOARD[user.role] ?? "/login"} replace />;
  }
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Redirect root → login */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* Rute publice */}
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

      {/* Rute protejate */}
      <Route
        path="/dashboard/doctor"
        element={
          <PrivateRoute allowedRoles={["DOCTOR"]}>
            <DoctorDashboard />
          </PrivateRoute>
        }
      />
      <Route
        path="/dashboard/assistant"
        element={
          <PrivateRoute allowedRoles={["ASSISTANT"]}>
            <AssistantDashboard />
          </PrivateRoute>
        }
      />
      <Route
        path="/dashboard/admin"
        element={
          <PrivateRoute allowedRoles={["ADMIN"]}>
            <AdminDashboard />
          </PrivateRoute>
        }
      />
      <Route
        path="/dashboard/patient"
        element={
          <PrivateRoute allowedRoles={["PATIENT"]}>
            <PatientDashboard />
          </PrivateRoute>
        }
      />
      <Route
        path="/doctor/patients/:patientId"
        element={
          <PrivateRoute allowedRoles={["DOCTOR", "ASSISTANT", "ADMIN"]}>
            <PatientProfilePage />
          </PrivateRoute>
        }
      />

      {/* 404 */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}