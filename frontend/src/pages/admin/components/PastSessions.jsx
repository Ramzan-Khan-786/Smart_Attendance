import React from "react";
import { useState, useEffect } from "react";
import api from "@/services/api"; // Your pre-configured Axios instance
import { Download } from "lucide-react";
import toast from "react-hot-toast";
import Spinner from "@/components/Spinner"; // Your custom spinner component

const PastSessions = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState(null); // Tracks which report is being downloaded

  // Function to fetch the session history from the backend
  const fetchSessions = async () => {
    try {
      setLoading(true);
      const res = await api.get("/admin/sessions/previous");
      setSessions(res.data);
    } catch (err) {
      toast.error("Failed to fetch session history.");
      console.error("Fetch Sessions Error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch sessions when the component mounts
  useEffect(() => {
    fetchSessions();
  }, []);

  /**
   * Handles the file download process by calling the secure backend API endpoint.
   * @param {string} sessionId - The ID of the session to track UI state.
   * @param {string} filename - The name of the file to download.
   */
  const handleDownload = async (sessionId, filename) => {
    if (!filename) {
      toast.error("No report available for this session.");
      return;
    }

    setDownloadingId(sessionId); // Set loading state for the specific button

    try {
      // Step 1: Hit the secure backend API route to get the file
      const response = await api.get(`/admin/sessions/download/${filename}`, {
        responseType: "blob", // This is crucial for handling file data
      });

      // Step 2: Create a temporary URL for the blob data received from the backend
      const url = window.URL.createObjectURL(new Blob([response.data]));

      // Step 3: Create a temporary link element to trigger the download
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename); // Set the filename for the download prompt
      document.body.appendChild(link);

      // Step 4: Programmatically click the link to start the download
      link.click();

      // Step 5: Clean up the temporary link and blob URL to free up memory
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download Error:", error);
      toast.error("File download failed. The report may no longer exist.");
    } finally {
      setDownloadingId(null); // Reset the loading state for the button
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
                    {session.excelPath ? (
                      <button
                        onClick={() =>
                          handleDownload(session._id, session.excelPath)
                        }
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
                    ) : (
                      <span className="text-gray-400 text-sm">No Report</span>
                    )}
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
