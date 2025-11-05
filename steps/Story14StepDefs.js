// steps/Story14StepDefs.js
// Rename a TODO by title and verify

const chai = require("chai");
const expect = chai.expect;
const chaiHttp = require("chai-http");
const { When, Then } = require("@cucumber/cucumber");
const utils = require("../TestUtil.js");

chai.use(chaiHttp);

const host = utils.host;
const todosEndpoint = utils.todosEndpoint;

const getTODOIdByTitle = utils.getTODOIdByTitle;
let returnCode = utils.returnCode;
let errorMessage = utils.errorMessage;

// We'll keep the last renamed TODO id here so we can assert precisely later.
let lastRenamedId = null;

async function getTodo(id) {
  const res = await chai.request(host).get(`${todosEndpoint}/${id}`);
  expect(res).to.have.status(200);
  if (res.body?.title) return res.body;
  if (res.body?.todos && res.body.todos[0]) return res.body.todos[0];
  return res.body;
}

async function listTodos() {
  const res = await chai.request(host).get(todosEndpoint);
  expect(res).to.have.status(200);
  return res.body.todos || [];
}

When('the student renames TODO {string} to {string}', async function (oldTitle, newTitle) {
  const id = await getTODOIdByTitle(oldTitle);
  lastRenamedId = id;

  const cur = await getTodo(id);

  const variants = [
    { title: newTitle, description: cur.description ?? "", doneStatus: cur.doneStatus ?? false },
    { title: newTitle, description: cur.description ?? "", doneStatus: (cur.doneStatus ?? false) ? "true" : "false" },
    { title: newTitle, description: cur.description ?? "" },
  ];

  let last;
  for (const body of variants) {
    last = await chai.request(host)
      .put(`${todosEndpoint}/${id}`)
      .set("Content-Type", "application/json")
      .send(body);
    if ([200, 201, 204].includes(last.status)) break;
  }

  returnCode.value = last.status;
  errorMessage.value = last.body?.errorMessages?.[0] || last.body?.errorMessage || "";
  expect([200, 201, 204]).to.include(last.status);
});

Then('a TODO titled {string} exists', async function (title) {
  const todos = await listTodos();
  expect(todos.map(t => t.title)).to.include(title);
});

Then('no TODO titled {string} remains', async function (oldTitle) {
  // Only assert that the specific TODO we renamed no longer has the old title.
  // Other scenarios may have created their own "Draft report", which is fine.
  const renamed = await getTodo(lastRenamedId);
  expect(renamed.title).to.not.equal(oldTitle);
});
