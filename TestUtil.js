// TestUtil.js
// Shared helpers + constants for step-defs across stories 1–15

const chai = require("chai");
const expect = chai.expect;
const chaiHttp = require("chai-http");
chai.use(chaiHttp);

// ---- Base host (change if your server listens elsewhere) ----
const host = process.env.TODO_HOST || "http://localhost:4567";

// ---- Core endpoints (TodoManager canonical) ----
const todosEndpoint = "/todos";
const projectsEndpoint = "/projects";
const categoriesEndpoint = "/categories";

// ---- Relationship segment names (canonical for TodoManager) ----
// /todos/{id}/categories    -> add/remove/list categories linked to a TODO
// /projects/{id}/tasks      -> add/remove/list tasks under a project
// /todos/{id}/tasksof       -> list projects a TODO belongs to
const categoriesRelationship = "categories";
const projectTasksRelationship = "tasks";
const todoProjRelationship = "tasksof";

// ---- Shared status/message holders (mutated by steps) ----
const returnCode = { value: 0 };
const errorMessage = { value: "" };

// ----------------------------
// Normalizers & helpers
// ----------------------------

/** Normalize a "list" response into an array of objects for a resource key. */
function normalizeList(body, key) {
  if (!body) return [];
  if (Array.isArray(body)) return body;
  // most servers wrap as {todos:[...]}, {projects:[...]}, {categories:[...]} or {tasks:[...]}
  if (Array.isArray(body[key])) return body[key];
  if (Array.isArray(body.tasks)) return body.tasks; // sometimes tasks under projects
  // Occasionally servers return single item inside wrapper
  if (body[key] && body[key][0]) return body[key];
  return [];
}

/** Normalize a single get of a TODO (server might wrap it). */
function normalizeTodo(body) {
  if (!body) return {};
  if (body.title) return body;
  if (body.todos && body.todos[0]) return body.todos[0];
  return body;
}

/** Fetch all TODOs (array of {id,title,doneStatus,description}) */
async function fetchAllTodos() {
  const res = await chai.request(host).get(todosEndpoint);
  expect(res).to.have.status(200);
  return normalizeList(res.body, "todos");
}

/** Fetch all Projects (array of {id,title,...}) */
async function fetchAllProjects() {
  const res = await chai.request(host).get(projectsEndpoint);
  expect(res).to.have.status(200);
  return normalizeList(res.body, "projects");
}

/** Fetch all Categories (array of {id,title,...}) */
async function fetchAllCategories() {
  const res = await chai.request(host).get(categoriesEndpoint);
  expect(res).to.have.status(200);
  return normalizeList(res.body, "categories");
}

/** Get TODO id by exact title (throws with helpful message if not found). */
async function getTODOIdByTitle(title) {
  const todos = await fetchAllTodos();
  const hit = todos.find(t => (t.title || "").trim() === title.trim());
  expect(hit, `Could not find TODO with title ${title}`).to.exist;
  return hit.id;
}

/** Get Project id by exact course name (title). */
async function getProjIdByCourseName(courseTitle) {
  const projects = await fetchAllProjects();
  const hit = projects.find(p => (p.title || "").trim() === courseTitle.trim());
  expect(hit, `Could not find project with title ${courseTitle}`).to.exist;
  return hit.id;
}

/** Get Category id by exact title; creates it if missing (best effort). */
async function getCategIdByTitle(catTitle) {
  // Look first
  let cats = await fetchAllCategories();
  let hit = cats.find(c => (c.title || "").trim() === catTitle.trim());
  if (hit) return hit.id;

  // Create (idempotent-ish)
  const res = await chai
    .request(host)
    .post(categoriesEndpoint)
    .set("Content-Type", "application/json")
    .send({ title: catTitle });

  expect(res.status).to.be.oneOf([201, 200, 400]);
  // Re-fetch to ensure presence
  cats = await fetchAllCategories();
  hit = cats.find(c => (c.title || "").trim() === catTitle.trim());
  expect(hit, `Category '${catTitle}' was not found after creation`).to.exist;
  return hit.id;
}

/** Utility: list categories attached to a TODO id (returns array of titles). */
async function listCategoryTitlesForTodo(todoId) {
  const res = await chai
    .request(host)
    .get(`${todosEndpoint}/${todoId}/${categoriesRelationship}`);
  expect(res).to.have.status(200);
  const cats = normalizeList(res.body, "categories");
  return cats.map(c => c.title);
}

/** Utility: list TODO ids for a project id */
async function listTodoIdsForProject(projId) {
  const res = await chai
    .request(host)
    .get(`${projectsEndpoint}/${projId}/${projectTasksRelationship}`);
  expect(res).to.have.status(200);
  const todos = res.body?.todos || res.body?.tasks || [];
  return todos.map(t => t.id ?? t.todo?.id).filter(Boolean);
}

/** Utility: list project titles a TODO belongs to */
async function listProjectTitlesForTodo(todoId) {
  const res = await chai
    .request(host)
    .get(`${todosEndpoint}/${todoId}/${todoProjRelationship}`);
  expect(res).to.have.status(200);
  const projs = normalizeList(res.body, "projects");
  return projs.map(p => p.title);
}

module.exports = {
  // host & endpoints
  host,
  todosEndpoint,
  projectsEndpoint,
  categoriesEndpoint,

  // relationships
  categoriesRelationship,
  projectTasksRelationship,
  todoProjRelationship,

  // shared mutable holders
  returnCode,
  errorMessage,

  // finders
  getTODOIdByTitle,
  getProjIdByCourseName,
  getCategIdByTitle,

  // extra helpers (used by some stories; handy for debugging)
  normalizeTodo,
  listCategoryTitlesForTodo,
  listTodoIdsForProject,
  listProjectTitlesForTodo,
};
