var express = require("express");
var bodyParser = require("body-parser");
var router = express.Router();
const { body, validationResult } = require("express-validator");
const blacklist = "{}$";
const Report = require("../../models/Report");

// create application/json parser
var jsonParser = bodyParser.json();

// create application/x-www-form-urlencoded parser
var urlencodedParser = bodyParser.urlencoded({ extended: false });

// @route     GET api/courseInstance
// @desc      Test route
// @access    Public
router.get("/", urlencodedParser, async function (req, res, next) {
  var courseCode = req.query.courseCode;
  //check if courseID was provided
  if (!courseCode) {
    try {
      const report = await Report.find();

      res.json(report);
    } catch (err) {
      console.error(err.message);

      res.status(500).send("Server Error");
    }
  } else {
    try {
      // Get all instances of a single course

      const report = await Report.find({ courseCode: courseCode });

      res.json(report);
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
  "/",
  [
    body("courseCode", "Invalid input").trim().escape(),
    body("question1.answer", "Invalid input")
      .trim()
      .escape()
      .blacklist(blacklist),
    body("question2.answer", "Invalid input")
      .trim()
      .escape()
      .blacklist(blacklist),
    body("question3.answer", "Invalid input")
      .trim()
      .escape()
      .blacklist(blacklist),
    body("question4.answer", "Invalid input")
      .trim()
      .escape()
      .blacklist(blacklist),
  ],

  jsonParser,
  async (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      // There are errors. Render form again with sanitized values/errors messages.
      // Error messages can be returned in an array using `errors.array()`.
      console.log("Found validation errors");
      return res.status(422).json({ errors: errors.array() });
    } else {
      // Data from form is valid. Store in database
      console.log(req.body);
      const {
        courseCode,
        author,
        question1,
        question2,
        question3,
        question4,
      } = req.body;

      try {
        const newReport = new Report({
          courseCode: courseCode,
          author: author,
          question1: question1,
          question2: question2,
          question3: question3,
          question4: question4,
        });
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
