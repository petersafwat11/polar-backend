const express = require("express");
const authController = require("../controllers/authController");

const router = express.Router();

// router.post("/signup", authController.signup);
router.post("/login", authController.login);
router.get("/logout", authController.logout);
router.post("/createAdmin", authController.createAdmin);

// router.post("/forgotPassword", authController.forgotPassword);
// router.patch("/resetPassword/:token", authController.resetPassword);

// Protect all routes after this middleware
// router.use(authController.protect);

router.patch("/updateMyPassword", authController.updatePassword);
// router.patch("/updateMe", userController.updateMe);
// router.delete("/deleteMe", userController.deleteMe);
router
  .route("/:id")
  // .get(userController.getUser)
  .patch(authController.adminProtection, authController.updateUser);
module.exports = router;
