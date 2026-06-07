const nodemailer = require("nodemailer");
const mammoth = require("mammoth");
const { htmlToText } = require("html-to-text");
const parseExcelFile = require("../utils/excelParsar.js");
const path = require("path");
const imagePath = path.join(__dirname, "../assets/signature.jpeg");

console.log("Image Path:", imagePath);
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

    const signatureAttachment = {
      filename: "signature.jpeg",
      path: path.join(__dirname, "../assets/Sign.png"),
      cid: "roiLogo"
    };


    const signatureHtml = `
<br>

<table cellpadding="0" cellspacing="0" border="0"
       style="font-family:Arial,sans-serif;width:900px;max-width:900px;">

  <tr>

    <!-- Logo -->
    <td width="280" valign="middle">
      <img src="cid:roiLogo"
           width="250"
           alt="ROI Logo"
           style="display:block;">
    </td>

    <!-- Name -->
    <td width="280" valign="middle">

      <div style="
          font-size:28px;
          font-weight:700;
          color:#000;
          line-height:1.15;
          margin-bottom:10px;">
          Abhishek Chauhan
      </div>

      <div style="
          font-size:18px;
          color:#000;
          line-height:1.4;">
          Business Executive
      </div>

    </td>

    <!-- Contact -->
    <td width="340" valign="middle">

      <table cellpadding="0" cellspacing="0" border="0">

        <tr>
          <td width="40" style="padding-bottom:18px;">
            <img src="cid:phoneIcon" width="28">
          </td>

          <td style="
              font-size:18px;
              font-weight:700;
              color:#000;
              padding-bottom:18px;">
              +91 97573 78444
          </td>
        </tr>

        <tr>
          <td width="40" style="padding-bottom:18px;">
            <img src="cid:mailIcon" width="28">
          </td>

          <td style="
              font-size:18px;
              font-weight:700;
              color:#000;
              padding-bottom:18px;">
              <a href="mailto:abhishek@returnonideas.in"
                 style="color:#000;text-decoration:none;">
                 abhishek@returnonideas.in
              </a>
          </td>
        </tr>

        <tr>
          <td width="40">
            <img src="cid:webIcon" width="28">
          </td>

          <td style="
              font-size:18px;
              font-weight:700;
              color:#000;">
              <a href="https://www.roiassured.com"
                 style="color:#000;text-decoration:none;">
                 www.roiassured.com
              </a>
          </td>
        </tr>

      </table>

    </td>

  </tr>

</table>

<div style="
    width:900px;
    background:#f4b217;
    color:#000;
    font-size:22px;
    font-weight:700;
    text-align:center;
    padding:14px 10px;
    margin-top:20px;">
    Pan-India Reach | 50+ Cities Executed | 10K+ Campaigns Delivered
</div>
`;

    // 📌 Email Signature
    //     const signatureHtml = `
    // <br>
    // <table cellpadding="0" cellspacing="0" border="0" style="font-family: Arial, sans-serif;width:75%;max-width:750px;">
    //   <tr>
    //     <td width="260" valign="middle">
    //       <img src="cid:roiLogo" width="220" alt="ROI Logo" style="display:block;">
    //     </td>

    //     <td width="500" valign="middle"
    //         style="padding-left:20px;">
    //       <div style=" font-size:20px;
    //         font-weight:700;
    //         color:#000;
    //         line-height:1.2;">
    //         Abhishek Chauhan
    //       </div>

    //       <div style="font-size:14px;
    //         color:#000;
    //         margin-top:8px;">
    //         Business Executive
    //       </div>
    //       </td>

    //       <td valign="middle" style="padding-left:30px;">

    //       <table cellpadding="0" cellspacing="0">

    //         <tr>
    //           <td style="padding:8px 10px 8px 0;font-size:25px;">
    //   <img src="cid:phoneIcon" width="18" style="vertical-align:middle;">
    //   </td>
    //    <td style="
    //             font-size:20px;
    //             font-weight:bold;
    //             color:#000;">
    //             +91 97573 78444
    //           </td>
    //         </tr>

    //      <tr>
    //           <td style="padding:8px 10px 8px 0;font-size:25px;">
    //   <img src="cid:mailIcon" width="18" style="vertical-align:middle;">
    //   </td>
    //           <td style="
    //             font-size:20px;
    //             font-weight:bold;
    //             color:#000;">
    //             <a href="mailto:abhishek@returnonideas.in"
    //                style="color:#000;text-decoration:none;">
    //               abhishek@returnonideas.in
    //             </a>
    //           </td>
    //         </tr>
    //   <tr>
    //           <td style="padding:8px 10px 8px 0;font-size:25px;">
    //   <img src="cid:webIcon" width="18" style="vertical-align:middle;">
    //    </td>
    //           <td style="
    //             font-size:20px;
    //             font-weight:bold;
    //             color:#000;">
    //             <a href="https://www.roiassured.com"
    //                style="color:#000;text-decoration:none;">
    //               www.roiassured.com
    //             </a>
    //           </td>
    //         </tr>
    //         </table>
    //     </td>
    //   </tr>
    // </table>

    // <div style="
    //  background:#f4b217;
    //   color:#000;
    //   font-weight:700;
    //   font-size:24px;
    //   text-align:center;
    //   padding:12px;
    //   margin-top:15px;
    // ">
    // Pan-India Reach | 50+ Cities Executed | 10K+ Campaigns Delivered
    // </div>
    // `;

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
          html: personalizedHtml + signatureHtml,
          text: htmlToText(personalizedHtml),
          attachments: [
            ...attachments,
            signatureAttachment,
            {
              filename: "phone.png",
              path: path.join(__dirname, "../assets/phone.png"),
              cid: "phoneIcon"
            },
            {
              filename: "mail.png",
              path: path.join(__dirname, "../assets/email.png"),
              cid: "mailIcon"
            },
            {
              filename: "web.png",
              path: path.join(__dirname, "../assets/network.png"),
              cid: "webIcon"
            }
          ]
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
