import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate, Link, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import Spinner from "@/components/Spinner";

const LoginPage = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [role, setRole] = useState("user");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || null;

  const { email, password } = formData;

  const onChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { user } = await login(email, password, role);
      toast.success("Logged in successfully!");

      if (from) {
        navigate(from, { replace: true });
      } else {
        if (user.role === "admin") {
          navigate("/admin/dashboard");
        } else {
          navigate("/student/dashboard");
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.msg || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center mt-10">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold text-center text-gray-800">Login</h1>
        <div className="flex justify-center border-b">
          <button
            onClick={() => setRole("user")}
            className={`flex-1 text-center font-medium px-4 py-3 transition-colors ${
              role === "user"
                ? "border-b-2 border-blue-500 text-blue-600"
                : "text-gray-500 hover:bg-gray-100"
            }`}
          >
            Student / Employee
          </button>
          <button
            onClick={() => setRole("admin")}
            className={`flex-1 text-center font-medium px-4 py-3 transition-colors ${
              role === "admin"
                ? "border-b-2 border-blue-500 text-blue-600"
                : "text-gray-500 hover:bg-gray-100"
            }`}
          >
            Admin / Teacher
          </button>
        </div>
        <form onSubmit={onSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={email}
              onChange={onChange}
              required
              className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              type="password"
              name="password"
              value={password}
              onChange={onChange}
              required
              className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 flex justify-center"
          >
            {loading ? <Spinner /> : "Login"}
          </button>
        </form>
        <p className="text-center text-sm text-gray-600">
          {role === "user"
            ? "Don't have an account?"
            : "Need an admin account?"}{" "}
          <Link
            to={role === "user" ? "/register" : "/register/admin"}
            className="font-medium text-blue-600 hover:underline"
          >
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
