const chai = require("chai");
const expect = chai.expect;
const chaiHttp = require("chai-http");
const { When, Then } = require("@cucumber/cucumber");
const utils = require("../TestUtil.js");

chai.use(chaiHttp);

const host = utils.host;
const projectsEndpoint = utils.projectsEndpoint;

const getProjIdByCourseName = utils.getProjIdByCourseName;

let lastList = [];
let returnCode = utils.returnCode;

// ---------- WHEN ----------
When('the student queries incomplete tasks for {string}', async function (course) {
  try {
    const projID = await getProjIdByCourseName(course);
    const res = await chai.request(host).get(`${projectsEndpoint}/${projID}/tasks`);
    expect(res).to.have.status(200);
    const tasks = res.body.todos || res.body.tasks || [];
    // normalize doneStatus and filter
    lastList = tasks.filter(
      t => (t.doneStatus ?? "false").toString().toLowerCase() !== "true"
    );
    returnCode.value = 200;
  } catch (e) {
    // if project not found, ensure CommonErrorSteps can assert 400/404
    returnCode.value = 404;
    lastList = [];
  }
});

// ---------- THEN ----------
Then('the result contains only tasks with doneStatus {string}', function (expectedStr) {
  const val = expectedStr.toLowerCase();
  for (const t of lastList) {
    const ds = (t.doneStatus ?? "").toString().toLowerCase();
    expect(ds).to.equal(val);
  }
});

Then('the result contains the titles', function (dataTable) {
  const want = dataTable.rows().map(r => r[0]);
  const got = lastList.map(t => t.title);
  for (const w of want) expect(got).to.include(w);
});

Then('the result is empty', function () {
  expect(lastList.length).to.equal(0);
});
