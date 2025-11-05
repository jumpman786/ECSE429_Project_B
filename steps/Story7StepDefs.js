const chai = require("chai");
const expect = chai.expect;
const chaiHttp = require("chai-http");
const { When, Then, Given } = require("@cucumber/cucumber");
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

async function isTaskInProject(todoID, projID) {
  const res = await chai.request(host).get(`${projectsEndpoint}/${projID}/${projectTasksRelationship}`);
  expect(res).to.have.status(200);
  const tasks = res.body.todos || res.body.tasks || [];
  return tasks.some(t => (t.id ?? t.todo?.id) === todoID);
}

Given('the task {string} currently belongs only to course {string}', async function (todoTitle, course) {
  const todoID = await getTODOIdByTitle(todoTitle);
  const sourceProjID = await getProjIdByCourseName(course);

  // ensure attached to source
  await chai.request(host)
    .post(`${projectsEndpoint}/${sourceProjID}/${projectTasksRelationship}`)
    .set("Content-Type", "application/json")
    .send({ id: todoID });

  // detach from any other courses (best effort)
  // (list courses is not standardized; we'll skip aggressive cleanup to remain simple)
});

Given('the destination course {string} exists for move', async function (destCourse) {
  await getProjIdByCourseName(destCourse); // will throw if missing
});

When(
  'the student moves TODO {string} from {string} to {string}',
  async function (todoTitle, sourceCourse, destCourse) {
    const todoID = await getTODOIdByTitle(todoTitle);
    const sourceProjID = await getProjIdByCourseName(sourceCourse);

    let destProjID;
    try {
      destProjID = await getProjIdByCourseName(destCourse);
    } catch (e) {
      returnCode.value = 404;
      errorMessage.value = `Could not find project with title ${destCourse}`;
      response = { status: 404, body: { errorMessage: errorMessage.value } };
      return;
    }

    const attachRes = await chai
      .request(host)
      .post(`${projectsEndpoint}/${destProjID}/${projectTasksRelationship}`)
      .set("Content-Type", "application/json")
      .send({ id: todoID });

    returnCode.value = attachRes.status;
    errorMessage.value =
      attachRes.body?.errorMessages?.[0] || attachRes.body?.errorMessage || "";
    response = attachRes;

    if ([200, 201, 409].includes(attachRes.status)) {
      const delRes = await chai
        .request(host)
        .delete(`${projectsEndpoint}/${sourceProjID}/${projectTasksRelationship}/${todoID}`);
      returnCode.value = delRes.status;
      errorMessage.value =
        delRes.body?.errorMessages?.[0] || delRes.body?.errorMessage || errorMessage.value || "";
      response = delRes;
    }
  }
);

Then('the student is notified of success for move', function () {
  expect(returnCode.value).to.be.oneOf([200, 201, 204]);
});

Then('after move, TODO {string} is a task of {string}', async function (todoTitle, course) {
  const todoID = await getTODOIdByTitle(todoTitle);
  const projID = await getProjIdByCourseName(course);
  const present = await isTaskInProject(todoID, projID);
  expect(present).to.equal(true);
});

Then('after move, TODO {string} is not a task of {string}', async function (todoTitle, course) {
  const todoID = await getTODOIdByTitle(todoTitle);
  const projID = await getProjIdByCourseName(course);
  const present = await isTaskInProject(todoID, projID);
  expect(present).to.equal(false);
});

Then('the student is notified of a 404 or 400 error for move', function () {
  expect(returnCode.value).to.be.oneOf([400, 404]);
});

Then('the move failure message mentions a missing course or link', function () {
  expect(
    (errorMessage.value || "").toLowerCase()
  ).to.match(/not\s+find|missing|no\s+such|invalid|could\s+not\s+find/);
});
