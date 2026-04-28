import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Lesson from "@/pages/Lesson";
import Assessment from "@/pages/Assessment";
import Certificate from "@/pages/Certificate";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/lesson/:progressId" element={<Lesson />} />
          <Route path="/assessment/:progressId" element={<Assessment />} />
          <Route path="/certificate/:progressId" element={<Certificate />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
