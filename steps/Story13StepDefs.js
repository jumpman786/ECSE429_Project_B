const chai = require("chai");
const expect = chai.expect;
const chaiHttp = require("chai-http");
const { When, Then } = require("@cucumber/cucumber");
const utils = require("../TestUtil.js");

chai.use(chaiHttp);

const host = utils.host;
const projectsEndpoint = utils.projectsEndpoint;
const projectTasksRelationship = utils.projectTasksRelationship;

const getProjIdByCourseName = utils.getProjIdByCourseName;

async function listTasks(projID) {
  const res = await chai.request(host).get(`${projectsEndpoint}/${projID}/${projectTasksRelationship}`);
  expect(res).to.have.status(200);
  return res.body.todos || res.body.tasks || [];
}

When('the student clears all tasks in course {string}', async function (course) {
  const projID = await getProjIdByCourseName(course);
  const tasks = await listTasks(projID);
  for (const t of tasks) {
    const del = await chai.request(host)
      .delete(`${projectsEndpoint}/${projID}/${projectTasksRelationship}/${t.id}`);
    expect([200,202,204,404]).to.include(del.status); // tolerate 404 if already removed
  }
});

Then('the course {string} has no tasks left', async function (course) {
  const projID = await getProjIdByCourseName(course);
  const tasks = await listTasks(projID);
  expect(tasks.length).to.equal(0);
});
