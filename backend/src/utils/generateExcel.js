import ExcelJS from "exceljs";

const generateExcelBuffer = async (data, sessionName) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(`Attendance - ${sessionName}`);

  worksheet.columns = [
    { header: "Name", key: "name", width: 30 },
    { header: "Email", key: "email", width: 35 },
    { header: "Timestamp", key: "timestamp", width: 25 },
  ];
  worksheet.getRow(1).font = { bold: true };

  data.forEach((record) => {
    worksheet.addRow({
      name: record.user?.name || "N/A",
      email: record.user?.email || "N/A",
      timestamp: new Date(record.timestamp).toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
      }),
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
};

export default generateExcelBuffer;
