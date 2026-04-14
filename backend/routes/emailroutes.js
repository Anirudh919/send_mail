const express = require('express');
const multer = require('multer');
const sendBulkEmails = require('../controller/emailcontroller.js');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post(
  "/send",
  upload.fields([
    { name: "recipients", maxCount: 1 },
    { name: "messageFormat", maxCount: 1 },
    { name: "attachments", maxCount: 5 }
  ]),
  sendBulkEmails
);

module.exports = router;