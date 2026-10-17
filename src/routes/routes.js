const { Router } = require("express");
const userMiddleware = require("../middleware/user");
const userController = require("../controllers/user");

const urlCheckMiddleware = require("../middleware/urlCheck");
const urlCheckController = require("../controllers/urlCheck");

const authMiddleware = require("../middleware/auth");

const router = Router();

router.post("/users", userMiddleware.validateRegister, userController.create);
router.post("/users/login", userMiddleware.validateLogin, userController.login);

router.post("/urls/check", authMiddleware.auth, urlCheckMiddleware.validateUrl, urlCheckController.check);

module.exports = router;