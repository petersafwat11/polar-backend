const express = require("express");

const courseController = require("../controllers/courseController");

const router = express.Router();

router
  .route("/")
  .get(courseController.getAllCourses)
  .post(courseController.makeCourse)
  .delete(courseController.deleteCourses);
router
  .route("/:id")
  .patch(courseController.updateCourse)
  .get(courseController.getCourse)
  .delete(courseController.deleteCourse);

module.exports = router;
