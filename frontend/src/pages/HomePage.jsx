import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ArrowRight } from "lucide-react";

const HomePage = () => {
  const { user } = useAuth();

  return (
    <div className="text-center mt-16 md:mt-24">
      <h1 className="text-4xl md:text-6xl font-extrabold mb-4 text-gray-800">
        Welcome to <span className="text-blue-600">AttendSys</span>
      </h1>
      <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
        The smart, automated attendance system powered by geofencing and face
        recognition. Streamline your process, ensure accuracy, and save time.
      </p>
      <div>
        {!user ? (
          <div className="space-x-4">
            <Link
              to="/login"
              className="bg-blue-600 text-white font-semibold py-3 px-8 rounded-lg hover:bg-blue-700 transition duration-300 inline-flex items-center gap-2"
            >
              Get Started <ArrowRight size={20} />
            </Link>
          </div>
        ) : (
          <div className="space-x-4">
            <Link
              to={
                user.role === "admin"
                  ? "/admin/dashboard"
                  : "/student/dashboard"
              }
              className="bg-green-600 text-white font-semibold py-3 px-8 rounded-lg hover:bg-green-700 transition duration-300 inline-flex items-center gap-2"
            >
              Go to Dashboard <ArrowRight size={20} />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;
