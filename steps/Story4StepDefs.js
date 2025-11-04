// Remove a TODO from a course list + related checks (ID-based assertions)
const chai = require("chai");
const expect = chai.expect;
const chaiHttp = require("chai-http");
const { Given, When, Then } = require("@cucumber/cucumber");
const utils = require("../TestUtil.js");

chai.use(chaiHttp);

const host = utils.host;
const todosEndpoint = utils.todosEndpoint;
const projectsEndpoint = utils.projectsEndpoint;
const todoProjRelationship = utils.todoProjRelationship;        // "tasksof"
const projectTasksRelationship = utils.projectTasksRelationship; // "tasks"

const getTODOIdByTitle = utils.getTODOIdByTitle;
const getProjIdByCourseName = utils.getProjIdByCourseName;

let response;
let returnCode = utils.returnCode;
let errorMessage = utils.errorMessage;

// Helpers
async function attach(todoID, projID) {
  const res = await chai
    .request(host)
    .post(`${projectsEndpoint}/${projID}/${projectTasksRelationship}`)
  .set("Content-Type", "application/json")
    .send({ id: todoID });
  expect([200, 201, 409]).to.include(res.status);
  return res;
}
async function attachTodoToProject(todoTitle, course) {
  const todoID = await getTODOIdByTitle(todoTitle);
  const projID = await getProjIdByCourseName(course);
  await attach(todoID, projID);
  return { todoID, projID };
}
async function listTodoIdsForProject(projID) {
  const res = await chai
    .request(host)
    .get(`${projectsEndpoint}/${projID}/${projectTasksRelationship}`);
  expect(res).to.have.status(200);
  const todos = res.body.todos || res.body || [];
  return todos.map(t => t.id ?? t.todo?.id).filter(Boolean);
}

// GIVEN
Given('the TODO {string} is attached to course {string}', async function (todoTitle, course) {
  await attachTodoToProject(todoTitle, course);
});
Given('the TODO {string} is also attached to course {string}', async function (todoTitle, course) {
  await attachTodoToProject(todoTitle, course);
});

// WHEN
When('the student removes TODO {string} from {string}', async function (todoTitle, course) {
  const todoID = await getTODOIdByTitle(todoTitle);
  const projID = await getProjIdByCourseName(course);

  response = await chai
    .request(host)
    .delete(`${projectsEndpoint}/${projID}/${projectTasksRelationship}/${todoID}`);

  returnCode.value = response.status;
  errorMessage.value =
    response.body?.errorMessages?.[0] || response.body?.errorMessage || "";
});

// THEN
Then('TODO {string} is no longer a task of {string}', async function (todoTitle, course) {
  const todoID = await getTODOIdByTitle(todoTitle);
  const projID = await getProjIdByCourseName(course);
  const ids = await listTodoIdsForProject(projID);
  expect(ids).to.not.include(todoID);
});
Then('TODO {string} is still a task of {string}', async function (todoTitle, course) {
  const todoID = await getTODOIdByTitle(todoTitle);
  const projID = await getProjIdByCourseName(course);
  const ids = await listTodoIdsForProject(projID);
  expect(ids).to.include(todoID);
});

// NOTE: generic 404/400 step is in CommonErrorSteps.js
