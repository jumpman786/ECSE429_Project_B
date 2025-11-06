// steps/Story10StepDefs.js
const chai = require("chai");
const expect = chai.expect;
const chaiHttp = require("chai-http");
const { When, Then } = require("@cucumber/cucumber");
const utils = require("../TestUtil.js");

chai.use(chaiHttp);

const host = utils.host;
const todosEndpoint = utils.todosEndpoint;

let response;
let returnCode = utils.returnCode;
let errorMessage = utils.errorMessage;
let lastCreatedTitle = null;

When('the student creates a TODO titled {string} with description {string}', async function (title, description) {
  response = await chai
    .request(host)
    .post(todosEndpoint)
    .set("Content-Type", "application/json")
    .send({ title, description });

  returnCode.value = response.status;
  errorMessage.value = response.body?.errorMessages?.[0] || response.body?.errorMessage || "";

  // accept 200/201 for normal success, but don't assert here—Then steps will decide
  expect([200, 201]).to.include(response.status);
  lastCreatedTitle = title;
});

When('the student creates a TODO with an invalid payload', async function () {
  // Missing title is invalid on most builds
  response = await chai
    .request(host)
    .post(todosEndpoint)
    .set("Content-Type", "application/json")
    .send({ description: "no title provided", doneStatus: false });

  returnCode.value = response.status;
  errorMessage.value = response.body?.errorMessages?.[0] || response.body?.errorMessage || "";
});

Then('the creation is accepted or gracefully rejected as duplicate', async function () {
  // Typical servers return 200/201 on first create, 400 or 409 on duplicate;
  // some accept duplicates (still 200/201). Treat all as handled.
  expect([200, 201, 400, 409]).to.include(returnCode.value);
  // If success, verify it exists
  if ([200, 201].includes(returnCode.value) && lastCreatedTitle) {
    const list = await chai.request(host).get(todosEndpoint);
    expect(list).to.have.status(200);
    const titles = (list.body.todos || []).map(t => t.title);
    expect(titles).to.include(lastCreatedTitle);
  }
});
