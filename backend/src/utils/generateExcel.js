// src/utils/generateExcel.js

import ExcelJS from "exceljs";
import path from "path";
import fs from "fs/promises"; // Use the promise-based version for async operations
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Generates an Excel report from attendance records.
 * @param {Array} data - Array of attendance objects, populated with user info.
 * @param {string} sessionName - The name of the session.
 * @returns {Promise<string|null>} The filename of the generated report, or null on failure.
 */
const generateExcel = async (data, sessionName) => {
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Attendance");

    // Define columns with headers
    worksheet.columns = [
      { header: "Name", key: "name", width: 30 },
      { header: "Email", key: "email", width: 35 },
      { header: "Check-in Time", key: "checkInTime", width: 25 },
    ];

    // Style the header row for better visibility
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, size: 12 };
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFD3D3D3" }, // Light grey background
      };
      cell.alignment = { vertical: "middle", horizontal: "center" };
    });

    // Add data rows with robust error checking and formatting
    data.forEach((record) => {
      worksheet.addRow({
        // FIX #2: Use optional chaining (?.) to prevent crashes if user is null
        name: record.user?.name || "N/A - User Deleted",
        email: record.user?.email || "N/A - User Deleted",
        // FIX #4: Format the timestamp into a human-readable string for India timezone
        checkInTime: new Date(record.checkInTime).toLocaleString("en-IN", {
          timeZone: "Asia/Kolkata",
        }),
      });
    });

    // --- FIX #1: Correct path calculation ---
    // Go up TWO directories from `src/utils` to the project root
    const reportsDir = path.resolve(__dirname, "..", "..", "reports");

    // FIX #3: Use asynchronous mkdir to ensure the directory exists
    await fs.mkdir(reportsDir, { recursive: true });

    // Sanitize the session name to create a valid filename
    const safeSessionName = sessionName.replace(/[\s/\\?%*:|"<>]/g, "_");
    const fileName = `Attendance-${safeSessionName}-${Date.now()}.xlsx`;
    const filePath = path.join(reportsDir, fileName);

    // Write the file to disk
    await workbook.xlsx.writeFile(filePath);

    console.log(`Successfully generated report: ${filePath}`);
    return fileName; // Return just the filename
  } catch (error) {
    console.error("FATAL: Could not generate Excel report.", error);
    return null; // Return null if generation fails
  }
};

export default generateExcel;
