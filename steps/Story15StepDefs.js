const chai = require("chai");
const expect = chai.expect;
const chaiHttp = require("chai-http");
const { When } = require("@cucumber/cucumber");
const utils = require("../TestUtil.js");

chai.use(chaiHttp);

const host = utils.host;
const todosEndpoint = utils.todosEndpoint;
const getTODOIdByTitle = utils.getTODOIdByTitle;

let returnCode = utils.returnCode;
let errorMessage = utils.errorMessage;

async function fetchById(id) {
  try {
    const res = await chai.request(host).get(`${todosEndpoint}/${id}`);
    if (res.status === 200) return res.body.title ? res.body : (res.body.todos?.[0] || res.body);
  } catch (_) {}
  return null;
}

When('the student marks TODO {string} as not done', async function (title) {
  const id = await getTODOIdByTitle(title);
  const current = await fetchById(id);

  let res = await chai.request(host)
    .put(`${todosEndpoint}/${id}`)
    .set("Content-Type", "application/json")
    .send({
      title: current?.title ?? title,
      doneStatus: false,
      description: current?.description ?? ""
    });

  if ([400, 415].includes(res.status)) {
    res = await chai.request(host)
      .put(`${todosEndpoint}/${id}`)
      .set("Content-Type", "application/json")
      .send({
        title: current?.title ?? title,
        doneStatus: "false",
        description: current?.description ?? ""
      });
  }
  if ([400, 415].includes(res.status)) {
    res = await chai.request(host)
      .patch(`${todosEndpoint}/${id}`)
      .set("Content-Type", "application/json")
      .send({ doneStatus: false });
  }

  returnCode.value = res.status;
  errorMessage.value =
    res.body?.errorMessages?.[0] || res.body?.errorMessage || "";
  expect(res.status).to.be.oneOf([200, 201, 204]);
});

When('the student marks TODO id {string} as not done', async function (id) {
  let current = await fetchById(id);
  let res;

  if (current?.id) {
    res = await chai.request(host)
      .put(`${todosEndpoint}/${id}`)
      .set("Content-Type", "application/json")
      .send({
        title: current.title ?? "",
        doneStatus: false,
        description: current.description ?? ""
      });
    if ([400, 415].includes(res.status)) {
      res = await chai.request(host)
        .patch(`${todosEndpoint}/${id}`)
        .set("Content-Type", "application/json")
        .send({ doneStatus: false });
    }
  } else {
    res = await chai.request(host)
      .put(`${todosEndpoint}/${id}`)
      .set("Content-Type", "application/json")
      .send({ doneStatus: false });
  }

  returnCode.value = res.status;
  errorMessage.value =
    res.body?.errorMessages?.[0] || res.body?.errorMessage || "";
});
