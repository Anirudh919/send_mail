const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const emailRoutes = require("./routes/emailroutes");

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("✅ Local Email Sender Running");
});

app.use("/api/email", emailRoutes);

app.listen(process.env.PORT, () => {
  console.log(`✅ Server running on http://localhost:${process.env.PORT}`);
});
