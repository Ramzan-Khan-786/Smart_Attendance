import React from "react";
import { useState, useEffect } from "react";
import api from "@/services/api";
import { Download } from "lucide-react";
import toast from "react-hot-toast";
import Spinner from "@/components/Spinner";

const PastSessions = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState(null);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const res = await api.get("/admin/sessions/previous");
      setSessions(res.data);
    } catch (err) {
      toast.error("Failed to fetch session history.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleDownload = async (session) => {
    setDownloadingId(session._id);
    try {
      const response = await api.get(
        `/admin/sessions/download/${session._id}`,
        {
          responseType: "blob",
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      // Create a clean filename
      const filename = `Attendance-${session.name.replace(
        /\s+/g,
        "_"
      )}-${session._id.substring(0, 6)}.xlsx`;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();

      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      if (error.response && error.response.status === 404) {
        toast.error("No attendance records found to generate a report.");
      } else {
        toast.error("File download failed.");
      }
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Session History</h2>
      <div className="overflow-x-auto border rounded-lg">
        <table className="min-w-full bg-white">
          <thead className="bg-gray-50">
            <tr>
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Session Name
              </th>
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Location
              </th>
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Report
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading && (
              <tr>
                <td colSpan="4" className="text-center py-4 text-gray-500">
                  Loading history...
                </td>
              </tr>
            )}
            {!loading && sessions.length === 0 && (
              <tr>
                <td colSpan="4" className="text-center py-4 text-gray-500">
                  No past sessions found.
                </td>
              </tr>
            )}
            {!loading &&
              sessions.map((session) => (
                <tr key={session._id}>
                  <td className="py-3 px-4 whitespace-nowrap font-medium text-gray-800">
                    {session.name}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap text-gray-600">
                    {session.location?.name || "N/A"}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap text-gray-600">
                    {new Date(session.startTime).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <button
                      onClick={() => handleDownload(session)}
                      disabled={downloadingId === session._id}
                      className="text-blue-600 hover:underline flex items-center gap-1.5 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {downloadingId === session._id ? (
                        <>
                          <Spinner size="small" /> Downloading...
                        </>
                      ) : (
                        <>
                          <Download size={16} /> Download
                        </>
                      )}
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PastSessions;
