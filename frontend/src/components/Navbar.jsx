import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { LogOut, User, LayoutDashboard, Home } from "lucide-react";

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex justify-between items-center py-3">
          <Link
            to="/"
            className="text-2xl font-bold text-blue-600 tracking-tight"
          >
            AttendSys
          </Link>
          <nav className="flex items-center space-x-4 md:space-x-6">
            <Link
              to="/"
              className="text-gray-600 hover:text-blue-600 transition-colors flex items-center gap-2"
            >
              <Home size={18} />
              <span className="hidden sm:inline">Home</span>
            </Link>
            {user ? (
              <>
                <Link
                  to={
                    user.role === "admin"
                      ? "/admin/dashboard"
                      : "/student/dashboard"
                  }
                  className="font-medium text-gray-600 hover:text-blue-600 transition-colors flex items-center gap-2"
                >
                  <LayoutDashboard size={18} />
                  <span className="hidden sm:inline">Dashboard</span>
                </Link>
                <span className="text-gray-400 hidden sm:inline">|</span>
                <div className="flex items-center gap-2 text-gray-700">
                  <User size={20} />
                  <span className="font-semibold">{user.name}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="bg-red-500 text-white px-3 py-2 rounded-md hover:bg-red-600 transition-colors flex items-center space-x-2 text-sm"
                >
                  <LogOut size={16} />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="font-medium text-gray-600 hover:text-blue-600 transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm font-semibold"
                >
                  Register
                </Link>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
