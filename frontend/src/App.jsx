import { useState, useRef } from "react";
import { BrowserRouter, Routes, Route } from "react-router";
import Editor from "./features/editor/components/Editor";
import "./App.css";
import TextBlock from "./components/TextBlock";
import MainLayout from "./layouts/MainLayout";
import EditorPage from "./pages/EditorPage";
import HomePage from "./pages/HomePage";
import AccountPage from "./pages/AccountPage";
import TokensPage from "./pages/TokensPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<HomePage />} />
          <Route path="/editor" element={<EditorPage />} />
          <Route path="/account" element={<AccountPage />} />
          <Route path="/tokens" element={<TokensPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
