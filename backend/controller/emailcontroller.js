const nodemailer = require("nodemailer");
const mammoth = require("mammoth");
const { htmlToText } = require("html-to-text");
const parseExcelFile = require("../utils/excelParsar.js");

const sendBulkEmails = async (req, res) => {
  try {
    const recipientsFile = req.files?.recipients?.[0];
    const messageFile = req.files?.messageFormat?.[0];
    const attachmentFiles = req.files?.attachments || [];
    const manualSubject = req.body.subject;

    if (!recipientsFile || !messageFile) {
      return res.status(400).json({ error: "Excel or Message file missing" });
    }

    // 📌 Parse Excel
    const recipients = parseExcelFile(recipientsFile.buffer);
    if (!recipients.length) {
      return res.status(400).json({ error: "No valid emails in Excel" });
    }

    // 📌 Convert DOCX → HTML
    const result = await mammoth.convertToHtml({
      buffer: messageFile.buffer
    });
    let htmlBody = result.value;

    // 📌 Convert HTML → Plain text (safe subject extraction)
    const plainText = htmlToText(htmlBody, { wordwrap: false });

    const lines = plainText
      .split("\n")
      .map(l => l.trim())
      .filter(Boolean);

    // 📌 Extract subject ONLY from first line
    let subject = "No Subject";

    if (manualSubject && manualSubject.trim() !== "") {
      subject = manualSubject.trim();
    }

    if (lines[0]?.toLowerCase().startsWith("subject")) {
      subject = lines[0]
        .replace(/subject\s*[-:]\s*/i, "")
        .trim();

      // Remove subject paragraph from HTML body
      htmlBody = htmlBody.replace(/<p>\s*Subject.*?<\/p>/i, "");
    }

    // 📌 Nodemailer config
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    // 📌 Attachments (PDFs)
    const attachments = attachmentFiles.map(file => ({
      filename: file.originalname,
      content: file.buffer
    }));

    let success = 0;
    let failed = [];

    // 📌 Send emails
    for (const user of recipients) {
      const personalizedHtml = htmlBody.replace(
        /Dear\s*<\/p>/i,
        `Dear ${user.name || "Sir/Madam"},</p>`
      );

      try {
        await transporter.sendMail({
          from: `${process.env.FROM_NAME} <${process.env.EMAIL_USER}>`,
          to: user.email,
          subject,
          html: personalizedHtml,
          text: htmlToText(personalizedHtml),
          attachments
        });

        success++;
      } catch (err) {
        failed.push({ email: user.email, error: err.message });
      }
    }

    res.json({
      total: recipients.length,
      success,
      failed: failed.length,
      failedList: failed
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


module.exports = sendBulkEmails;
