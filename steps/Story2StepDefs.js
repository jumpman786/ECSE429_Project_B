const chai = require("chai");
const expect = chai.expect;
const chaiHttp = require("chai-http");
const { Given, When, Then } = require("@cucumber/cucumber");
const utils = require("../TestUtil.js");

chai.use(chaiHttp);

const host = utils.host;
const todosEndpoint = utils.todosEndpoint;
const projectsEndpoint = utils.projectsEndpoint;
const projectTasksRelationship = utils.projectTasksRelationship;
const todoProjRelationship = utils.todoProjRelationship; // used for verification from todo side
const getTODOIdByTitle = utils.getTODOIdByTitle;
const getProjIdByCourseName = utils.getProjIdByCourseName;

let response;
let returnCode = utils.returnCode;
let errorMessage = utils.errorMessage;

Given(
  "course todo list projects with the following details exist",
  async function (dataTable) {
    for (const row of dataTable.hashes()) {
      const body = {
        title: row.title,
        completed: row.completed === "true",
        description: row.description,
        active: row.active === "true",
      };
      response = await chai.request(host).post(projectsEndpoint).send(body);
      expect(response).to.have.status(201);
    }
  }
);

// (NEW) create course list step for Alternate Flow
Given(
  "the student creates a course todo list with name {string} and description {string}",
  async function (course, description) {
    const body = {
      title: course,
      completed: false,
      description,
      active: true,
    };
    response = await chai.request(host).post(projectsEndpoint).send(body);
    expect(response).to.have.status(201);
  }
);

When(
  "a student adds a TODO with title {string} to a course todo list with name {string}",
  async function (todoTitle, course) {
    const todoID = await getTODOIdByTitle(todoTitle);
    const projID = await getProjIdByCourseName(course);

    response = await chai
      .request(host)
      .post(`${projectsEndpoint}/${projID}/${projectTasksRelationship}`)
      .send({ id: todoID });

    returnCode.value = response.status;
    errorMessage.value = response.body?.errorMessages?.[0] || "";
  }
);

// (NEW) add by explicit ID for Error Flow
When(
  "a student adds a TODO with id {string} to a course todo list with name {string}",
  async function (todoId, course) {
    const projID = await getProjIdByCourseName(course);

    response = await chai
      .request(host)
      .post(`${projectsEndpoint}/${projID}/${projectTasksRelationship}`)
      .send({ id: todoId });

    returnCode.value = response.status;
    errorMessage.value = response.body?.errorMessages?.[0] || "";
  }
);

Then(
  "the TODO with title {string} is added as a task of the course todo list with name {string}",
  async function (todoTitle, course) {
    // verify via the todo -> projects relationship
    const todoID = await getTODOIdByTitle(todoTitle);
    const res2 = await chai
      .request(host)
      .get(`${todosEndpoint}/${todoID}/${todoProjRelationship}`);

    expect(res2).to.have.status(200);
    const titles = (res2.body.projects || []).map(p => p.title);
    expect(titles).to.include(course);
  }
);
