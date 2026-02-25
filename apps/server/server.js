const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env.local") });

const express = require("express");
const cors = require("cors");

const app = express();
const port = Number(process.env.PORT) || 4000;

app.use(cors());

app.get("/", (req, res) => {
  res.json({ message: "This is the Capstone Animal Rescue Platform" });
});

app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});
