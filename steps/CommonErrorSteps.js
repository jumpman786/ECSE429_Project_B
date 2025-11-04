const { Then } = require("@cucumber/cucumber");
const chai = require("chai");
const expect = chai.expect;
const utils = require("../TestUtil.js");

// Shared holders (set by your When steps)
const returnCode = utils.returnCode;     // { value: number }
const errorMessage = utils.errorMessage; // { value: string }

// One global assertion for 400/404
Then("the student is notified of a 404 or 400 error", function () {
  expect(returnCode.value, "Expected HTTP 400 or 404").to.be.oneOf([400, 404]);
});
