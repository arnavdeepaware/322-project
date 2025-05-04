// components/ProtectedRoute.jsx
import { Navigate } from "react-router-dom";
import { useUser } from "../context/UserContext";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useUser();

  if (loading) return null;

  if (!user) return <Navigate to="/login" replace />;

  return children;
}
