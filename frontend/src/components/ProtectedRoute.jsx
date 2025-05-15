// components/ProtectedRoute.jsx
import { Navigate } from "react-router-dom";
import { useUser } from "../context/UserContext";

export default function ProtectedRoute({ children }) {
  const { user, guest, loading } = useUser();

  if (loading) return null;

  // allow real users or guests
  if (!user && !guest) return <Navigate to="/login" replace />;

  return children;
}
