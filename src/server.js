
require("dotenv").config();

const express = require("express");
const routes = require("./routes/routes");

const app = express();

app.use(express.json());
app.use(routes);

app.get("/", (req, res) => {
  res.send("Hello world!");
});

const PORT = process.env.PORT || 3000;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;
