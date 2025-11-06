// steps/Story13StepDefs.js
const chai = require("chai");
const expect = chai.expect;
const chaiHttp = require("chai-http");
const { When, Then } = require("@cucumber/cucumber");
const utils = require("../TestUtil.js");

chai.use(chaiHttp);

const host = utils.host;
const projectsEndpoint = utils.projectsEndpoint;
const getProjIdByCourseName = utils.getProjIdByCourseName;

let returnCode = utils.returnCode;

function toBoolLike(v) {
  if (typeof v === "boolean") return v;
  if (typeof v === "string") return v.toLowerCase() === "true";
  return !!v;
}

async function readProject(id) {
  const r = await chai.request(host).get(`${projectsEndpoint}/${id}`);
  expect(r).to.have.status(200);
  return r.body?.projects?.[0] || r.body;
}

async function updateProjectActiveRobust(id, desiredBool) {
  const proj = await readProject(id);
  const title = proj.title ?? "";
  const description = proj.description ?? "";
  const completed = toBoolLike(proj.completed);
  const active = desiredBool;

  // PATCH boolean
  let res = await chai
    .request(host)
    .patch(`${projectsEndpoint}/${id}`)
    .set("Content-Type", "application/json")
    .send({ active });
  if ([200, 204].includes(res.status)) return res;

  // PATCH "true"/"false"
  res = await chai
    .request(host)
    .patch(`${projectsEndpoint}/${id}`)
    .set("Content-Type", "application/json")
    .send({ active: active ? "true" : "false" });
  if ([200, 204].includes(res.status)) return res;

  // PUT full
  res = await chai
    .request(host)
    .put(`${projectsEndpoint}/${id}`)
    .set("Content-Type", "application/json")
    .send({ title, description, completed, active });
  if ([200, 201, 204].includes(res.status)) return res;

  // PUT with string booleans
  res = await chai
    .request(host)
    .put(`${projectsEndpoint}/${id}`)
    .set("Content-Type", "application/json")
    .send({
      title,
      description,
      completed: completed ? "true" : "false",
      active: active ? "true" : "false",
    });
  return res;
}

When('the student sets course {string} active flag to {string}', async function (course, value) {
  const desired = value.toLowerCase() === "true";
  // If course does not exist, convert to error path for CommonErrorSteps
  let projID;
  try {
    projID = await getProjIdByCourseName(course);
  } catch (_) {
    returnCode.value = 404;
    return;
  }

  const res = await updateProjectActiveRobust(projID, desired);
  // Accept any typical success status
  returnCode.value = res.status;
  expect([200, 201, 204]).to.include(res.status);
});

Then('course {string} has active flag {string}', async function (course, expected) {
  const projID = await getProjIdByCourseName(course);
  const proj = await readProject(projID);
  const actual = toBoolLike(proj.active);
  expect(actual.toString()).to.equal((expected.toLowerCase() === "true").toString());
});
