const { Router } = require("express");
const webRiskMiddleware = require("../middleware/webRisk");
const webRiskController = require("../controllers/webRisk");

const router = Router();

router.post("/urls/check", webRiskMiddleware.validateUrl, webRiskController.check);

module.exports = router;