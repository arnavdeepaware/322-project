import { BrowserRouter, Routes, Route } from "react-router";
import ProtectedRoute from "./components/ProtectedRoute";
import "./App.css";
import MainLayout from "./layouts/MainLayout";
import EditorPage from "./pages/EditorPage";
import HomePage from "./pages/HomePage";
import AccountPage from "./pages/AccountPage";
import TokensPage from "./pages/TokensPage";
import DocumentsPage from "./pages/DocumentsPage";
import LoginPage from "./pages/LoginPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<HomePage />} />
          <Route path="/editor" element={<EditorPage />} />
          <Route path="/documents" element={<DocumentsPage />} />
          <Route path="/account" element={<AccountPage />} />
          <Route path="/tokens" element={<TokensPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
