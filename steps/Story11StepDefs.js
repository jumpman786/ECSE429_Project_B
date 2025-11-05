const chai = require("chai");
const expect = chai.expect;
const chaiHttp = require("chai-http");
const { When, Then } = require("@cucumber/cucumber");
const utils = require("../TestUtil.js");

chai.use(chaiHttp);

const host = utils.host;
const todosEndpoint = utils.todosEndpoint;
const categoriesEndpoint = utils.categoriesEndpoint;
const categoriesRelationship = utils.categoriesRelationship;

const getCategIdByTitle = utils.getCategIdByTitle;

let lastCategoryQuery = [];

async function listTodos() {
  const res = await chai.request(host).get(todosEndpoint);
  expect(res).to.have.status(200);
  return res.body.todos || [];
}

async function todoHasCategory(todoId, catTitle) {
  const res = await chai.request(host)
    .get(`${todosEndpoint}/${todoId}/${categoriesRelationship}`);
  if (res.status !== 200) return false;
  const titles = (res.body.categories || []).map(c => c.title);
  return titles.includes(catTitle);
}

When('the student queries tasks by category {string}', async function (catTitle) {
  // If category doesn't exist, treat as empty result (no 404 here to avoid API lookup throw)
  try { await getCategIdByTitle(catTitle); } catch (_) { lastCategoryQuery = []; return; }

  const all = await listTodos();
  lastCategoryQuery = [];
  for (const t of all) {
    const ok = await todoHasCategory(t.id, catTitle);
    if (ok) lastCategoryQuery.push(t);
  }
});

Then('the category result contains the titles', function (dataTable) {
  const want = dataTable.rows().map(r => r[0]);
  const got = lastCategoryQuery.map(t => t.title);
  for (const w of want) expect(got).to.include(w);
});

Then('the category result is empty', function () {
  expect(lastCategoryQuery.length).to.equal(0);
});
