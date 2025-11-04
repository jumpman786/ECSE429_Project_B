// steps/Story6StepDefs.js
const chai = require("chai");
const expect = chai.expect;
const chaiHttp = require("chai-http");
const { Given, When, Then } = require("@cucumber/cucumber");
const utils = require("../TestUtil.js");

chai.use(chaiHttp);

const host = utils.host;
const todosEndpoint = utils.todosEndpoint;

const getTODOIdByTitle = utils.getTODOIdByTitle;

let response;
let returnCode = utils.returnCode;     // shared holder
let errorMessage = utils.errorMessage; // shared holder

// Normalize a GET /todos/{id} response across model variants.
function normalizeTodoGet(body) {
  if (body?.title) return body;
  if (body?.todos && body.todos[0]) return body.todos[0];
  return body;
}

// ----------------------------
// GIVEN (data seeding happens in Story1)
// ----------------------------

// ----------------------------
// WHEN
// ----------------------------

When(
  'the student changes the description of TODO {string} to {string}',
  async function (todoTitle, newDescription) {
    const todoID = await getTODOIdByTitle(todoTitle);

    // 1) Read current to build a full payload for PUT
    const currentRes = await chai.request(host).get(`${todosEndpoint}/${todoID}`);
    expect(currentRes).to.have.status(200);
    const current = normalizeTodoGet(currentRes.body) || {};

    // Some builds store doneStatus as boolean, others as "true"/"false" strings.
    // Preserve shape if possible; fallback to boolean false if absent.
    const doneStatus =
      typeof current.doneStatus !== "undefined" ? current.doneStatus : false;

    const payloadVariants = [
      // Prefer keeping the original type of doneStatus and include title + description
      { title: current.title || todoTitle, doneStatus, description: newDescription },

      // If server dislikes boolean/string mismatch, try string form:
      { title: current.title || todoTitle, doneStatus: doneStatus ? "true" : "false", description: newDescription },

      // Some builds require only title+description (no doneStatus)
      { title: current.title || todoTitle, description: newDescription },
    ];

    // Try PUT with a couple of payload variants until one succeeds
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

    // Construct something likely invalid across builds
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

// ----------------------------
// THEN
// ----------------------------

Then(
  'TODO {string} has description {string}',
  async function (todoTitle, expectedDesc) {
    // Accept success codes from prior step
    expect(returnCode.value).to.be.oneOf([200, 201, 204]);

    const todoID = await getTODOIdByTitle(todoTitle);
    const res = await chai.request(host).get(`${todosEndpoint}/${todoID}`);
    expect(res).to.have.status(200);

    const obj = normalizeTodoGet(res.body) || {};
    expect(obj.description ?? "").to.equal(expectedDesc);
  }
);

// Keep the generic "404 or 400" step in ONE file only (e.g., Story3StepDefs.js).
// Remove duplicates elsewhere to avoid ambiguity.
