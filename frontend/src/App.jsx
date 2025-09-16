import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "react-hot-toast";

import Navbar from "@/components/Navbar";
import ProtectedRoute from "@/components/ProtectedRoute";

import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import AdminRegisterPage from "@/pages/AdminRegisterPage";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import StudentDashboard from "@/pages/student/StudentDashboard";
import HomePage from "@/pages/HomePage";
import NotFoundPage from "@/pages/NotFoundPage";

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50 font-sans">
          <Toaster position="top-center" reverseOrder={false} />
          <Navbar />
          <main className="container mx-auto p-4 md:p-6">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/register/admin" element={<AdminRegisterPage />} />

              <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
              </Route>

              <Route element={<ProtectedRoute allowedRoles={["user"]} />}>
                <Route
                  path="/student/dashboard"
                  element={<StudentDashboard />}
                />
              </Route>

              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
