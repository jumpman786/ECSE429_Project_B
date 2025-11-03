// TestUtil.js
const chai = require("chai");
const chaiHttp = require("chai-http");
chai.use(chaiHttp);

// ---- Base host & endpoints ----
const host = "http://localhost:4567";

const todosEndpoint = "/todos";
const projectsEndpoint = "/projects";
const categoriesEndpoint = "/categories";

// Relationship segment names (server v3)
const categoriesRelationship = "categories"; // /todos/{id}/categories
const todoProjRelationship = "tasksof";      // /todos/{id}/tasksof  (todo -> projects)
const projectTasksRelationship = "tasks";    // /projects/{id}/tasks (project -> todos)

// Shared mutable slots for step assertions
const returnCode = { value: null };
const errorMessage = { value: "" };

// ---- Helper lookups ----
async function getTODOIdByTitle(title) {
  const res = await chai.request(host).get(todosEndpoint);
  chai.expect(res).to.have.status(200);
  const item = (res.body.todos || []).find(t => t.title === title);
  chai.expect(item, `Could not find TODO with title ${title}`).to.exist;
  return item.id;
}

async function getProjIdByCourseName(name) {
  const res = await chai.request(host).get(projectsEndpoint);
  chai.expect(res).to.have.status(200);
  const item = (res.body.projects || []).find(p => p.title === name);
  chai.expect(item, `Could not find project with title ${name}`).to.exist;
  return item.id;
}

async function getCategIdByTitle(title) {
  const res = await chai.request(host).get(categoriesEndpoint);
  chai.expect(res).to.have.status(200);
  const item = (res.body.categories || []).find(c => c.title === title);
  chai.expect(item, `Could not find category ${title}`).to.exist;
  return item.id;
}

module.exports = {
  host,
  todosEndpoint,
  projectsEndpoint,
  categoriesEndpoint,
  categoriesRelationship,
  todoProjRelationship,
  projectTasksRelationship,
  getTODOIdByTitle,
  getProjIdByCourseName,
  getCategIdByTitle,
  returnCode,
  errorMessage
};
