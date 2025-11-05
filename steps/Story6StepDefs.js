const chai = require("chai");
const expect = chai.expect;
const chaiHttp = require("chai-http");
const { When, Then } = require("@cucumber/cucumber");
const utils = require("../TestUtil.js");

chai.use(chaiHttp);

const host = utils.host;
const todosEndpoint = utils.todosEndpoint;

const getTODOIdByTitle = utils.getTODOIdByTitle;

let response;
let returnCode = utils.returnCode;
let errorMessage = utils.errorMessage;

function normalizeTodoGet(body) {
  if (body?.title) return body;
  if (body?.todos && body.todos[0]) return body.todos[0];
  return body;
}

When(
  'the student changes the description of TODO {string} to {string}',
  async function (todoTitle, newDescription) {
    const todoID = await getTODOIdByTitle(todoTitle);

    const currentRes = await chai.request(host).get(`${todosEndpoint}/${todoID}`);
    expect(currentRes).to.have.status(200);
    const current = normalizeTodoGet(currentRes.body) || {};

    const doneStatus = typeof current.doneStatus !== "undefined" ? current.doneStatus : false;

    const payloadVariants = [
      { title: current.title || todoTitle, doneStatus, description: newDescription },
      { title: current.title || todoTitle, doneStatus: doneStatus ? "true" : "false", description: newDescription },
      { title: current.title || todoTitle, description: newDescription },
    ];

    let last;
    for (const body of payloadVariants) {
      last = await chai
        .request(host)
        .put(`${todosEndpoint}/${todoID}`)
        .set("Content-Type", "application/json")
        .send(body);

      if ([200, 201, 204].includes(last.status)) break;
    }

    response = last;
    returnCode.value = response.status;
    errorMessage.value =
      response.body?.errorMessages?.[0] || response.body?.errorMessage || "";
  }
);

When(
  'the student updates TODO {string} with an invalid payload',
  async function (todoTitle) {
    const todoID = await getTODOIdByTitle(todoTitle);

    response = await chai
      .request(host)
      .put(`${todosEndpoint}/${todoID}`)
      .set("Content-Type", "application/json")
      .send({ title: null });

    returnCode.value = response.status;
    errorMessage.value =
      response.body?.errorMessages?.[0] || response.body?.errorMessage || "";
  }
);

Then(
  'TODO {string} has description {string}',
  async function (todoTitle, expectedDesc) {
    expect(returnCode.value).to.be.oneOf([200, 201, 204]);

    const todoID = await getTODOIdByTitle(todoTitle);
    const res = await chai.request(host).get(`${todosEndpoint}/${todoID}`);
    expect(res).to.have.status(200);

    const obj = normalizeTodoGet(res.body) || {};
    expect(obj.description ?? "").to.equal(expectedDesc);
  }
);
