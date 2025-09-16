import Excel from "exceljs";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const generateExcel = async (data, sessionName) => {
  const workbook = new Excel.Workbook();
  const worksheet = workbook.addWorksheet("Attendance");

  worksheet.columns = [
    { header: "Name", key: "name", width: 30 },
    { header: "Email", key: "email", width: 30 },
    { header: "Timestamp", key: "timestamp", width: 25 },
  ];

  worksheet.getRow(1).font = { bold: true };

  data.forEach((record) => {
    worksheet.addRow({
      name: record.user.name,
      email: record.user.email,
      timestamp: record.timestamp,
    });
  });

  const dir = path.join(__dirname, "..", "reports");
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const safeSessionName = sessionName.replace(/[\s/\\?%*:|"<>]/g, "_");
  const fileName = `Attendance-${safeSessionName}-${Date.now()}.xlsx`;
  const filePath = path.join(dir, fileName);

  await workbook.xlsx.writeFile(filePath);
  return fileName;
};

export default generateExcel;
