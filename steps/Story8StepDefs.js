const chai = require("chai");
const expect = chai.expect;
const chaiHttp = require("chai-http");
const { When, Then } = require("@cucumber/cucumber");
const utils = require("../TestUtil.js");

chai.use(chaiHttp);

const host = utils.host;
const todosEndpoint = utils.todosEndpoint;
const projectsEndpoint = utils.projectsEndpoint;
const categoriesEndpoint = utils.categoriesEndpoint;
const categoriesRelationship = utils.categoriesRelationship;

const getProjIdByCourseName = utils.getProjIdByCourseName;
const getCategIdByTitle = utils.getCategIdByTitle;

let response;
let returnCode = utils.returnCode;
let errorMessage = utils.errorMessage;

async function listProjectTasks(projID) {
  const res = await chai.request(host).get(`${projectsEndpoint}/${projID}/tasks`);
  expect(res).to.have.status(200);
  return res.body.todos || res.body.tasks || [];
}

async function tagTodoWithCategory(todoID, categoryID) {
  const res = await chai
    .request(host)
    .post(`${todosEndpoint}/${todoID}/${categoriesRelationship}`)
    .set("Content-Type", "application/json")
    .send({ id: categoryID });
  expect(res.status).to.be.oneOf([200, 201, 409]);
  return res;
}

When(
  'the student sets the priority {string} on all tasks in {string}',
  async function (priority, course) {
    const projID = await getProjIdByCourseName(course);
    const tasks = await listProjectTasks(projID);

    if (!tasks.length) {
      returnCode.value = 200;
      errorMessage.value = `NO_TASKS:${course}`;
      return;
    }

    const catID = await getCategIdByTitle(priority);
    for (const t of tasks) {
      await tagTodoWithCategory(t.id, catID);
    }
    returnCode.value = 200;
    errorMessage.value = "";
  }
);

Then(
  'every task in {string} is classified as priority {string}',
  async function (course, priority) {
    const projID = await getProjIdByCourseName(course);
    const tasks = await listProjectTasks(projID);
    expect(tasks.length, "Expected course to have tasks").to.be.greaterThan(0);

    for (const t of tasks) {
      const res = await chai
        .request(host)
        .get(`${todosEndpoint}/${t.id}/${categoriesRelationship}`);
      expect(res).to.have.status(200);
      const titles = (res.body.categories || []).map((c) => c.title);
      expect(titles, `Task ${t.title} missing ${priority}`).to.include(priority);
    }
  }
);

Then(
  'the student is notified that no tasks were updated in {string}',
  function (course) {
    expect(returnCode.value).to.equal(200);
    expect(errorMessage.value).to.equal(`NO_TASKS:${course}`);
  }
);
