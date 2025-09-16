import React, { useState } from "react";
import LocationManager from "./components/LocationManager.jsx";
import SessionManager from "./components/SessionManager.jsx";
import AttendanceMonitor from "./components/AttendanceMoniter.jsx";
import PastSessions from "./components/PastSessions.jsx";
import { MapPin, Clock, Users, History } from "lucide-react";

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("session");

  const tabs = {
    session: <SessionManager />,
    monitor: <AttendanceMonitor />,
    locations: <LocationManager />,
    history: <PastSessions />,
  };

  const tabInfo = [
    { id: "session", name: "Session Control", icon: <Clock /> },
    { id: "monitor", name: "Live Attendance", icon: <Users /> },
    { id: "locations", name: "Manage Locations", icon: <MapPin /> },
    { id: "history", name: "Session History", icon: <History /> },
  ];

  return (
    <div className="flex flex-col md:flex-row gap-6">
      <aside className="md:w-64">
        <div className="p-4 bg-white rounded-lg shadow-md">
          <h2 className="text-lg font-bold mb-4 text-gray-800">Admin Menu</h2>
          <ul className="space-y-1">
            {tabInfo.map((tab) => (
              <li key={tab.id}>
                <button
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full text-left p-3 rounded-md flex items-center gap-3 transition-colors text-sm font-medium ${
                    activeTab === tab.id
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {tab.icon} {tab.name}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </aside>
      <main className="flex-1">
        <div className="p-6 bg-white rounded-lg shadow-md min-h-[30rem]">
          {tabs[activeTab]}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
