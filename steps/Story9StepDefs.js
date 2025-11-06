// steps/Story9StepDefs.js
const chai = require("chai");
const expect = chai.expect;
const chaiHttp = require("chai-http");
const { When, Then } = require("@cucumber/cucumber");
const utils = require("../TestUtil.js");

chai.use(chaiHttp);

const host = utils.host;
const todosEndpoint = utils.todosEndpoint;
const projectsEndpoint = utils.projectsEndpoint;
const projectTasksRelationship = utils.projectTasksRelationship;

const getTODOIdByTitle = utils.getTODOIdByTitle;
const getProjIdByCourseName = utils.getProjIdByCourseName;

let response;
let returnCode = utils.returnCode;
let errorMessage = utils.errorMessage;

// keep the id of the last deleted todo so we can assert by ID (titles may be duplicated on the server)
let lastDeletedId = null;
let lastDeletedTitle = null;

When('the student deletes TODO {string}', async function (todoTitle) {
  const todoID = await getTODOIdByTitle(todoTitle);

  response = await chai.request(host).delete(`${todosEndpoint}/${todoID}`);
  expect([200, 204]).to.include(response.status);

  lastDeletedId = todoID;
  lastDeletedTitle = todoTitle;

  returnCode.value = response.status;
  errorMessage.value =
    response.body?.errorMessages?.[0] || response.body?.errorMessage || "";
});

When('the student deletes TODO id {string}', async function (id) {
  // Do not assert success here — this scenario expects an error code.
  try {
    response = await chai.request(host).delete(`${todosEndpoint}/${id}`);
    returnCode.value = response.status;
    errorMessage.value =
      response.body?.errorMessages?.[0] || response.body?.errorMessage || "";
  } catch (e) {
    // superagent throws on 4xx/5xx; normalize to 400/404 for CommonErrorSteps
    returnCode.value = e.status ?? 404;
    errorMessage.value = "";
  }
});

Then('the TODO titled {string} is no longer present', async function (_title) {
  // Titles can be duplicated; verify by ID instead.
  expect(lastDeletedId, "Internal: lastDeletedId not set").to.exist;

  // Try to GET the specific ID — should be gone (404/400)
  let got;
  try {
    got = await chai.request(host).get(`${todosEndpoint}/${lastDeletedId}`);
  } catch (e) {
    // expected for many builds
    got = { status: e.status || 404 };
  }
  expect([400, 404]).to.include(got.status);

  // Also verify the ID is not in the list anymore (if the list endpoint returns all)
  const list = await chai.request(host).get(todosEndpoint);
  expect(list).to.have.status(200);
  const ids = (list.body.todos || []).map(t => t.id);
  expect(ids).to.not.include(lastDeletedId);
});

Then('course {string} no longer lists {string} among its tasks', async function (course, _title) {
  expect(lastDeletedId, "Internal: lastDeletedId not set").to.exist;

  const projID = await getProjIdByCourseName(course);
  const res = await chai.request(host).get(`${projectsEndpoint}/${projID}/${projectTasksRelationship}`);
  expect(res).to.have.status(200);
  const tasks = res.body.todos || res.body.tasks || [];
  const taskIds = tasks.map(t => t.id ?? t.todo?.id).filter(Boolean);
  expect(taskIds).to.not.include(lastDeletedId);
});
