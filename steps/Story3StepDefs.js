const chai = require("chai");
const expect = chai.expect;
const chaiHttp = require("chai-http");
const { When, Then } = require("@cucumber/cucumber");
const utils = require("../TestUtil.js");

chai.use(chaiHttp);

const host = utils.host;
const todosEndpoint = utils.todosEndpoint;

let response;
let returnCode = utils.returnCode;
let errorMessage = utils.errorMessage;

// ---------- helpers ----------
async function getTodoByTitle(title) {
  const list = await chai.request(host).get(todosEndpoint);
  expect(list).to.have.status(200);
  const todo = (list.body.todos || []).find(t => t.title === title);
  expect(todo, `Could not find TODO with title ${title}`).to.exist;
  return todo; // {id,title,doneStatus,description}
}

async function putFullTodo(todo) {
  return chai.request(host)
    .put(`${todosEndpoint}/${todo.id}`)
    .set("Content-Type", "application/json")
    .send({
      title: todo.title ?? "",
      doneStatus: todo.doneStatus ?? false,
      description: todo.description ?? ""
    });
}

async function patchTodo(id, body) {
  return chai.request(host)
    .patch(`${todosEndpoint}/${id}`)
    .set("Content-Type", "application/json")
    .send(body);
}

async function setDoneStatusByTitle(title, valueBool) {
  const todo = await getTodoByTitle(title);

  // Try full PUT first (boolean)
  let res = await putFullTodo({
    id: todo.id,
    title: todo.title,
    doneStatus: valueBool,
    description: todo.description || ""
  });

  // Fallback to string boolean
  if (res.status === 400 || res.status === 415) {
    res = await chai.request(host)
      .put(`${todosEndpoint}/${todo.id}`)
      .set("Content-Type", "application/json")
      .send({
        title: todo.title,
        doneStatus: valueBool ? "true" : "false",
        description: todo.description || ""
      });
  }

  // Fallback to PATCH
  if (res.status === 400 || res.status === 415) {
    res = await patchTodo(todo.id, { doneStatus: valueBool });
  }

  return res;
}

// ---------- WHEN ----------
When('the student marks TODO {string} as done', async function (title) {
  response = await setDoneStatusByTitle(title, true);
  returnCode.value = response.status;
  errorMessage.value =
    response.body?.errorMessages?.[0] || response.body?.errorMessage || "";
});

When('the student marks TODO id {string} as done', async function (id) {
  // Try to fetch current (if id exists) to build a valid PUT
  let current = null;
  try {
    const res = await chai.request(host).get(`${todosEndpoint}/${id}`);
    if (res.status === 200) current = res.body;
  } catch (_) { /* ignore */ }

  let res;
  if (current && current.id) {
    // PUT with boolean true
    res = await chai.request(host)
      .put(`${todosEndpoint}/${id}`)
      .set("Content-Type", "application/json")
      .send({
        title: current.title ?? "",
        doneStatus: true,
        description: current.description ?? ""
      });
    // Fallback to string "true"
    if (res.status === 400 || res.status === 415) {
      res = await chai.request(host)
        .put(`${todosEndpoint}/${id}`)
        .set("Content-Type", "application/json")
        .send({
          title: current.title ?? "",
          doneStatus: "true",
          description: current.description ?? ""
        });
    }
  } else {
    // Invalid id path → server should reply 400/404; our CommonErrorSteps will assert that
    res = await chai.request(host)
      .put(`${todosEndpoint}/${id}`)
      .set("Content-Type", "application/json")
      .send({ doneStatus: true });
  }

  response = res;
  returnCode.value = res.status;
  errorMessage.value =
    res.body?.errorMessages?.[0] || res.body?.errorMessage || "";
});

// ---------- THEN ----------
Then('TODO {string} has doneStatus {string}', async function (title, expectedStr) {
  const list = await chai.request(host).get(todosEndpoint);
  expect(list).to.have.status(200);
  const todo = (list.body.todos || []).find(t => t.title === title);
  expect(todo, `Could not find TODO with title ${title}`).to.exist;

  const actual = (todo.doneStatus ?? "").toString().toLowerCase();
  expect(actual).to.equal(expectedStr.toLowerCase());
});
