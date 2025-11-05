// steps/Story2StepDefs.js
const chai = require("chai");
const expect = chai.expect;
const chaiHttp = require("chai-http");
const { Given, When, Then } = require("@cucumber/cucumber");
const utils = require("../TestUtil.js");

chai.use(chaiHttp);

const host = utils.host;
const todosEndpoint = utils.todosEndpoint;
const projectsEndpoint = utils.projectsEndpoint;
const projectTasksRelationship = utils.projectTasksRelationship; // usually "tasks"
const todoProjRelationship = utils.todoProjRelationship;         // usually "tasksof"

const getTODOIdByTitle = utils.getTODOIdByTitle;
const getProjIdByCourseName = utils.getProjIdByCourseName;

let response;
let returnCode = utils.returnCode;
let errorMessage = utils.errorMessage;

// -------------------------------
// Helpers
// -------------------------------
async function findProjectIdByTitleSafe(title) {
  try {
    const id = await getProjIdByCourseName(title);
    return id;
  } catch (_) {
    return null;
  }
}

async function listProjectTasks(projID) {
  const res = await chai
    .request(host)
    .get(`${projectsEndpoint}/${projID}/${projectTasksRelationship}`);
  expect(res).to.have.status(200);
  const tasks = res.body.todos || res.body.tasks || res.body || [];
  // normalize to array of objects with id
  return tasks.map(t => (t && typeof t === "object") ? (t.id ?? t.todo?.id ? { id: t.todo.id, title: t.todo?.title } : t) : t);
}

async function clearProjectTasks(projID) {
  const tasks = await listProjectTasks(projID);
  for (const t of tasks) {
    const tid = t.id ?? t?.todo?.id;
    if (!tid) continue;
    const delRes = await chai
      .request(host)
      .delete(`${projectsEndpoint}/${projID}/${projectTasksRelationship}/${tid}`);
    // Different builds: accept common success codes (and occasional idempotent-ish responses)
    expect([200, 202, 204, 409]).to.include(delRes.status);
  }
}

async function ensureProjectReset(row) {
  const title = row.title;
  const body = {
    title,
    completed: row.completed === "true",
    description: row.description,
    active: row.active === "true",
  };

  // If project exists, update its fields (best-effort) and clear tasks.
  let projID = await findProjectIdByTitleSafe(title);
  if (projID) {
    // Try PATCH first (some builds prefer PATCH)
    let up = await chai
      .request(host)
      .patch(`${projectsEndpoint}/${projID}`)
      .set("Content-Type", "application/json")
      .send(body);
    if (![200, 201, 204].includes(up.status)) {
      // Fallback to PUT with same body
      up = await chai
        .request(host)
        .put(`${projectsEndpoint}/${projID}`)
        .set("Content-Type", "application/json")
        .send(body);
      expect([200, 201, 204]).to.include(up.status);
    }
    await clearProjectTasks(projID);
    return projID;
  }

  // Otherwise create it fresh
  const res = await chai.request(host).post(projectsEndpoint).send(body);
  expect([200, 201]).to.include(res.status);

  // Resolve created id by title (portable across builds)
  projID = await getProjIdByCourseName(title);
  // Ensure it starts clean (in case server seeded defaults)
  await clearProjectTasks(projID);
  return projID;
}

// -------------------------------
// GIVENs
// -------------------------------
Given(
  "course todo list projects with the following details exist",
  async function (dataTable) {
    for (const row of dataTable.hashes()) {
      await ensureProjectReset(row);
    }
  }
);

// (NEW) create course list step for Alternate Flow (kept for backwards compatibility)
Given(
  "the student creates a course todo list with name {string} and description {string}",
  async function (course, description) {
    // Create-or-reset behavior for the single course
    await ensureProjectReset({
      title: course,
      completed: "false",
      description,
      active: "true",
    });
  }
);

// -------------------------------
// WHENs
// -------------------------------
When(
  "a student adds a TODO with title {string} to a course todo list with name {string}",
  async function (todoTitle, course) {
    const todoID = await getTODOIdByTitle(todoTitle);
    const projID = await getProjIdByCourseName(course);

    response = await chai
      .request(host)
      .post(`${projectsEndpoint}/${projID}/${projectTasksRelationship}`)
      .set("Content-Type", "application/json")
      .send({ id: todoID });

    returnCode.value = response.status;
    errorMessage.value = response.body?.errorMessages?.[0] || response.body?.errorMessage || "";
    expect([200, 201, 409]).to.include(response.status); // idempotent add accepted
  }
);

When(
  "a student adds a TODO with id {string} to a course todo list with name {string}",
  async function (todoId, course) {
    const projID = await getProjIdByCourseName(course);

    response = await chai
      .request(host)
      .post(`${projectsEndpoint}/${projID}/${projectTasksRelationship}`)
      .set("Content-Type", "application/json")
      .send({ id: todoId });

    returnCode.value = response.status;
    errorMessage.value = response.body?.errorMessages?.[0] || response.body?.errorMessage || "";
  }
);

// -------------------------------
// THENs
// -------------------------------
Then(
  "the TODO with title {string} is added as a task of the course todo list with name {string}",
  async function (todoTitle, course) {
    // verify via the todo -> projects relationship
    const todoID = await getTODOIdByTitle(todoTitle);
    const res2 = await chai
      .request(host)
      .get(`${todosEndpoint}/${todoID}/${todoProjRelationship}`);

    expect(res2).to.have.status(200);
    const titles = (res2.body.projects || []).map((p) => p.title);
    expect(titles).to.include(course);
  }
);
