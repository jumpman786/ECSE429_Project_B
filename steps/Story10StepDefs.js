const chai = require("chai");
const expect = chai.expect;
const chaiHttp = require("chai-http");
const { When, Then } = require("@cucumber/cucumber");
const utils = require("../TestUtil.js");

chai.use(chaiHttp);

const host = utils.host;
const projectsEndpoint = utils.projectsEndpoint;

const getProjIdByCourseName = utils.getProjIdByCourseName;

async function getProjectObj(id) {
  const res = await chai.request(host).get(`${projectsEndpoint}/${id}`);
  expect(res).to.have.status(200);
  return res.body.title ? res.body : (res.body.projects ? res.body.projects[0] : res.body);
}

When('the student sets course {string} active to {string}', async function (course, activeStr) {
  const projID = await getProjIdByCourseName(course);
  const current = await getProjectObj(projID);
  const active = activeStr.toLowerCase() === "true";

  // PUT full project object variants
  const variants = [
    { title: current.title || course, description: current.description || "", completed: !!current.completed, active },
    { title: current.title || course, description: current.description || "", completed: current.completed ? "true" : "false", active },
    { title: current.title || course, description: current.description || "", active }
  ];

  let last;
  for (const body of variants) {
    last = await chai.request(host).put(`${projectsEndpoint}/${projID}`)
      .set("Content-Type", "application/json")
      .send(body);
    if ([200,201,204].includes(last.status)) break;
  }
  expect([200,201,204]).to.include(last.status);
});

Then('course {string} has active {string}', async function (course, expected) {
  const projID = await getProjIdByCourseName(course);
  const obj = await getProjectObj(projID);
  const actual = (obj.active ?? "").toString().toLowerCase();
  expect(actual).to.equal(expected.toLowerCase());
});
