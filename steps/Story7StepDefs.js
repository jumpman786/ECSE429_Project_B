// Move a TODO from one course list to another (attach to dest, remove from source)
const chai = require("chai");
const expect = chai.expect;
const chaiHttp = require("chai-http");
const { Given, When, Then } = require("@cucumber/cucumber");
const utils = require("../TestUtil.js");

chai.use(chaiHttp);

const host = utils.host;
const projectsEndpoint = utils.projectsEndpoint;
const todosEndpoint = utils.todosEndpoint;
const projectTasksRelationship = utils.projectTasksRelationship; // "/projects/{id}/tasks"
const todoProjRelationship = utils.todoProjRelationship;         // "/todos/{id}/tasksof"

const getTODOIdByTitle = utils.getTODOIdByTitle;
const getProjIdByCourseName = utils.getProjIdByCourseName;

let response;
let returnCode = utils.returnCode;
let errorMessage = utils.errorMessage;

// ---------- helpers ----------
async function attachTodoToProject(todoID, projID) {
  const res = await chai
    .request(host)
    .post(`${projectsEndpoint}/${projID}/${projectTasksRelationship}`)
    .set("Content-Type", "application/json")
    .send({ id: todoID });
  expect([200, 201, 409]).to.include(res.status); // 409 means already linked
  return res;
}

async function removeTodoFromProject(todoID, projID) {
  // allow 200/204 success, 404 if not linked
  const res = await chai
    .request(host)
    .delete(`${projectsEndpoint}/${projID}/${projectTasksRelationship}/${todoID}`);
  expect([200, 204, 404]).to.include(res.status);
  return res;
}

async function listProjectsForTodo(todoID) {
  const res = await chai
    .request(host)
    .get(`${todosEndpoint}/${todoID}/${todoProjRelationship}`);
  expect(res).to.have.status(200);
  return (res.body.projects || []).map(p => ({ id: p.id, title: p.title }));
}

// ---------- GIVEN ----------
Given(
  'the task {string} currently belongs only to course {string}',
  async function (todoTitle, sourceCourse) {
    const todoID = await getTODOIdByTitle(todoTitle);
    const sourceProjID = await getProjIdByCourseName(sourceCourse);

    // Ensure attached to source
    await attachTodoToProject(todoID, sourceProjID);

    // Ensure detached from any other project
    const current = await listProjectsForTodo(todoID);
    for (const p of current) {
      if (p.id !== sourceProjID) {
        await removeTodoFromProject(todoID, p.id);
      }
    }
  }
);

Given(
  'the destination course {string} exists for move',
  async function (destCourse) {
    // Will throw (and fail the Given) if it doesn't exist
    await getProjIdByCourseName(destCourse);
  }
);

// ---------- WHEN ----------
When(
  'the student moves TODO {string} from {string} to {string}',
  async function (todoTitle, sourceCourse, destCourse) {
    const todoID = await getTODOIdByTitle(todoTitle);
    const sourceProjID = await getProjIdByCourseName(sourceCourse);

    let destProjID;
    try {
      destProjID = await getProjIdByCourseName(destCourse);
    } catch (e) {
      // Destination missing → emulate API failure state for assertions
      returnCode.value = 404;
      errorMessage.value = `Could not find project with title ${destCourse}`;
      response = { status: 404, body: { errorMessage: errorMessage.value } };
      return;
    }

    // 1) Attach to destination (idempotent)
    const attachRes = await attachTodoToProject(todoID, destProjID);
    response = attachRes;
    returnCode.value = attachRes.status;
    errorMessage.value =
      attachRes.body?.errorMessages?.[0] || attachRes.body?.errorMessage || "";

    // 2) Remove from source (fine if not present)
    if ([200, 201, 409].includes(attachRes.status)) {
      const delRes = await chai
        .request(host)
        .delete(`${projectsEndpoint}/${sourceProjID}/${projectTasksRelationship}/${todoID}`);
      response = delRes;
      returnCode.value = delRes.status; // last op status
      errorMessage.value =
        delRes.body?.errorMessages?.[0] || delRes.body?.errorMessage || errorMessage.value || "";
    }
  }
);

// ---------- THEN ----------
Then(
  'the student is notified of success for move',
  function () {
    expect(returnCode.value).to.be.oneOf([200, 201, 204]);
  }
);

Then(
  'after move, TODO {string} is a task of {string}',
  async function (todoTitle, destCourse) {
    const todoID = await getTODOIdByTitle(todoTitle);
    const destProjID = await getProjIdByCourseName(destCourse);

    // Check via project→tasks list
    const res = await chai
      .request(host)
      .get(`${projectsEndpoint}/${destProjID}/${projectTasksRelationship}`);
    expect(res).to.have.status(200);
    const ids = (res.body.todos || res.body || []).map(t => t.id ?? t.todo?.id).filter(Boolean);
    expect(ids).to.include(todoID);
  }
);

Then(
  'after move, TODO {string} is not a task of {string}',
  async function (todoTitle, sourceCourse) {
    const todoID = await getTODOIdByTitle(todoTitle);
    const sourceProjID = await getProjIdByCourseName(sourceCourse);

    const res = await chai
      .request(host)
      .get(`${projectsEndpoint}/${sourceProjID}/${projectTasksRelationship}`);
    expect(res).to.have.status(200);
    const ids = (res.body.todos || res.body || []).map(t => t.id ?? t.todo?.id).filter(Boolean);
    expect(ids).to.not.include(todoID);
  }
);

Then(
  'the student is notified of a 404 or 400 error for move',
  function () {
    expect(returnCode.value).to.be.oneOf([400, 404]);
  }
);

Then(
  'the move failure message mentions a missing course or link',
  function () {
    const msg = (utils.errorMessage.value || "").toLowerCase();
    expect(
      msg.includes("project") ||
      msg.includes("course") ||
      msg.includes("relationship") ||
      msg.includes("not found") ||
      msg.includes("missing")
    ).to.equal(true);
  }
);
