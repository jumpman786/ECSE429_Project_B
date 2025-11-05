const chai = require("chai");
const expect = chai.expect;
const chaiHttp = require("chai-http");
const { When, Then } = require("@cucumber/cucumber");
const utils = require("../TestUtil.js");

chai.use(chaiHttp);

const host = utils.host;
const todosEndpoint = utils.todosEndpoint;

const getTODOIdByTitle = utils.getTODOIdByTitle;

let fetched = {};
let returnCode = utils.returnCode;
let errorMessage = utils.errorMessage;

When('the student fetches TODO {string}', async function (title) {
  const id = await getTODOIdByTitle(title);
  const res = await chai.request(host).get(`${todosEndpoint}/${id}`);
  returnCode.value = res.status;
  fetched = res.body.title ? res.body : (res.body.todos ? res.body.todos[0] : res.body);
});

When('the student fetches TODO id {string}', async function (id) {
  const res = await chai.request(host).get(`${todosEndpoint}/${id}`);
  returnCode.value = res.status;
  errorMessage.value = res.body?.errorMessages?.[0] || res.body?.errorMessage || "";
  if (res.status === 200) fetched = res.body.title ? res.body : (res.body.todos ? res.body.todos[0] : res.body);
});

Then('the fetched TODO has a non-empty id', function () {
  expect(returnCode.value).to.equal(200);
  expect(fetched).to.be.an("object");
  expect(String(fetched.id || "")).to.have.length.greaterThan(0);
});

Then('the fetched TODO has title {string}', function (title) {
  expect(fetched.title).to.equal(title);
});
