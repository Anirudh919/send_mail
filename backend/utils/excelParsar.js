const XLSX = require("xlsx");

const parseExcelFile = (buffer) => {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

  return rows
    .map((row) => ({
      name: row.Name?.trim(),
      email: row.Email?.trim(),
    }))
    .filter((r) => r.email);
};

module.exports = parseExcelFile;
