var express = require("express");
var router = express.Router();

const { body, validationResult } = require("express-validator");
const blacklist = "{}$";
const Report = require("../models/Report");
const Course = require("../models/Course");

// @route     GET /reports
// @desc      Test route
// @access    Public
router.get("/:courseId?", async function (req, res, next) {
  var courseID = req.params.courseId;
  var responsible = req.query.responsible;
  //check if courseID was provided
  if (responsible == "true") {
    try {
      const courseInstances = await Course.aggregate([
        {
          $match: {
            "instances.responsible": req.user.username,
          },
        },
        {
          $project: {
            _id: 1,
            name: 1,
            nameEng: 1,
            extent: 1,
            date: 1,
            extentUnit: 1,
            instances: {
              $filter: {
                input: "$instances",
                as: "instance",
                cond: {
                  $in: [req.user.username, "$$instance.responsible"],
                },
              },
            },
          },
        },
      ]);

      res.json(courseInstances);
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server Error");
    }
  } else if (courseID) {
    try {
      // Get all entries in Courses

      const course = await Course.findById(courseID);

      res.json(course);
    } catch (err) {
      console.error(err.message);

      res.status(500).send("Server Error");
    }
  }
});
// @route    POST api/users
// @desc     Posts form
// @access   Public
router.post(
  "/:courseId/:instanceId",
  [
    body("questions.*.answer", "Invalid input")
      .trim()
      .escape()
      .blacklist(blacklist)
      .isLength({
        min: 1,
        max: 10,
      }),
  ],
  async (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req);
    var courseID = req.params.courseId;
    var instanceID = req.params.instanceId;
    var author = req.user.name;
    var edit = req.query.edit;

    if (!errors.isEmpty()) {
      // There are errors. Render form again with sanitized values/errors messages.
      // Error messages can be returned in an array using `errors.array()`.
      console.log("Found validation errors");
      return res.status(422).json({
        errors: errors.array(),
      });
    } else {
      // Data from form is valid. Store in database
      console.log(req.body);
      const { questions } = req.body;
      try {
        const newReport = new Report({
          author: author,
          questions: questions,
        });
        // If edit is true, push a new report to the "reports"-array
        if ((edit = "true")) {
          Course.findOneAndUpdate(
            {
              _id: courseID,
              "instances._id": instanceID,
            },
            {
              $push: {
                "instances.$.report": newReport,
              },
            }
          ).exec();
        }
        // Add a new report
        else {
          Course.findOneAndUpdate(
            {
              _id: courseID,
              "instances._id": instanceID,
            },
            {
              $set: {
                "instances.$.report": newReport,
              },
            }
          ).exec();
        }

        const report = await newReport.save();
        res.json(report);
        console.log("Report posted to DB");
      } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
      }
    }
  }
);

module.exports = router;
