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

let returnCode = utils.returnCode; // shared
let errorMessage = utils.errorMessage;

let lastDeleted = { id: null, title: null };

When('the student deletes TODO {string}', async function (title) {
  const id = await getTODOIdByTitle(title);
  const res = await chai.request(host).delete(`${todosEndpoint}/${id}`);
  returnCode.value = res.status;
  errorMessage.value = res.body?.errorMessages?.[0] || res.body?.errorMessage || "";
  lastDeleted = { id, title };
});

When('the student deletes TODO id {string}', async function (id) {
  const res = await chai.request(host).delete(`${todosEndpoint}/${id}`);
  returnCode.value = res.status;
  errorMessage.value = res.body?.errorMessages?.[0] || res.body?.errorMessage || "";
  lastDeleted = { id, title: null };
});

Then('the TODO titled {string} is no longer present', async function (_title) {
  // Verify by ID absence to handle duplicate titles in seed data.
  expect(returnCode.value).to.be.oneOf([200, 202, 204]);
  const res = await chai.request(host).get(`${todosEndpoint}/${lastDeleted.id}`);
  // Some servers return 404/400; others 200 with a body missing.
  expect(res.status).to.be.oneOf([400, 404]);
});

Then('course {string} no longer lists {string} among its tasks', async function (course, _title) {
  const projID = await getProjIdByCourseName(course);
  const res = await chai.request(host).get(`${projectsEndpoint}/${projID}/${projectTasksRelationship}`);
  expect(res).to.have.status(200);
  const tasks = res.body.todos || res.body.tasks || [];
  const ids = tasks.map(t => t.id);
  expect(ids).to.not.include(lastDeleted.id);
});
