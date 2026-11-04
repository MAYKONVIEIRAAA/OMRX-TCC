
require("dotenv").config();

const path = require("path");
const express = require("express");
const routes = require("./routes/routes");

const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, "../frontend/src")));
app.use(routes);

const PORT = process.env.PORT || 3000;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;
