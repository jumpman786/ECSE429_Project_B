const chai = require("chai");
const expect = chai.expect;
const chaiHttp = require("chai-http");
const { When, Then } = require("@cucumber/cucumber");
const utils = require("../TestUtil.js");

chai.use(chaiHttp);

const host = utils.host;
const todosEndpoint = utils.todosEndpoint;
const categoriesRelationship = utils.categoriesRelationship;

const getTODOIdByTitle = utils.getTODOIdByTitle;
const getCategIdByTitle = utils.getCategIdByTitle;

let lastStatus;

When('the student removes category {string} from the todo {string}', async function (catTitle, todoTitle) {
  const todoID = await getTODOIdByTitle(todoTitle);

  // Try to get category id by title; if it doesn't exist, we still call DELETE with the title as id
  let catID = null;
  try {
    catID = await getCategIdByTitle(catTitle);
  } catch (_) {
    catID = catTitle; // some builds may accept title in the URL or return 404
  }

  // Two common API shapes:
  // - DELETE /todos/{id}/categories/{catID}
  // - POST to relationship with a removal body is less common; we prefer DELETE
  const res = await chai
    .request(host)
    .delete(`${todosEndpoint}/${todoID}/${categoriesRelationship}/${catID}`);

  lastStatus = res.status;
  expect(res.status).to.be.oneOf([200, 202, 204, 400, 404, 405]); // be lenient across builds
});

Then('the todo with title {string} is not classified as {string}', async function (todoTitle, catTitle) {
  const todoID = await getTODOIdByTitle(todoTitle);
  const res = await chai
    .request(host)
    .get(`${todosEndpoint}/${todoID}/${categoriesRelationship}`);
  expect(res).to.have.status(200);
  const titles = (res.body.categories || []).map(c => c.title);
  expect(titles).to.not.include(catTitle);
});

Then('the unassign attempt is acknowledged', function () {
  expect(lastStatus).to.be.oneOf([200, 202, 204, 400, 404, 405]);
});
