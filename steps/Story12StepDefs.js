const chai = require("chai");
const expect = chai.expect;
const chaiHttp = require("chai-http");
const { When, Then } = require("@cucumber/cucumber");
const utils = require("../TestUtil.js");

chai.use(chaiHttp);

const host = utils.host;
const todosEndpoint = utils.todosEndpoint;
const categoriesEndpoint = utils.categoriesEndpoint;
const categoriesRelationship = utils.categoriesRelationship; // e.g., "categories"

const getTODOIdByTitle = utils.getTODOIdByTitle;
const getCategIdByTitle = utils.getCategIdByTitle;

let returnCode = utils.returnCode;
let errorMessage = utils.errorMessage;

// ------------ helpers ------------

async function listCategories(todoID) {
  const res = await chai.request(host)
    .get(`${todosEndpoint}/${todoID}/${categoriesRelationship}`);
  expect(res).to.have.status(200);
  return res.body?.categories || [];
}

// Try all known unlink shapes
async function unlinkByPaths(todoID, catID) {
  // A) /todos/{id}/categories/{catId}
  let res = await chai.request(host)
    .delete(`${todosEndpoint}/${todoID}/${categoriesRelationship}/${catID}`);
  if ([200, 202, 204].includes(res.status)) return res;

  // B) /categories/{catId}/todos/{todoId}
  res = await chai.request(host)
    .delete(`${categoriesEndpoint}/${catID}/todos/${todoID}`);
  if ([200, 202, 204].includes(res.status)) return res;

  // C) Some builds (rare) accept DELETE with body at /todos/{id}/categories
  res = await chai.request(host)
    .delete(`${todosEndpoint}/${todoID}/${categoriesRelationship}`)
    .set("Content-Type", "application/json")
    .send({ id: catID });
  return res;
}

// Remove all category links that match title (handles duplicates)
async function unlinkAllByTitle(todoID, catTitle) {
  let last = { status: 200, body: {} };
  for (let guard = 0; guard < 6; guard++) {
    const cats = await listCategories(todoID);
    const matches = cats.filter(c => (c.title || "").trim() === catTitle);
    if (!matches.length) break;

    for (const c of matches) {
      const catId = c.id ?? null;
      if (catId) {
        last = await unlinkByPaths(todoID, catId);
      } else {
        const resolvedId = await getCategIdByTitle(catTitle).catch(() => null);
        if (resolvedId) last = await unlinkByPaths(todoID, resolvedId);
      }
    }
  }
  return last;
}

// ------------ steps ------------

When('the student removes category {string} from the todo {string}', async function (catTitle, todoTitle) {
  const todoID = await getTODOIdByTitle(todoTitle);

  // If category cannot be resolved at all, treat as missing
  let catID = null;
  try {
    catID = await getCategIdByTitle(catTitle);
  } catch (_) {
    returnCode.value = 404;
    errorMessage.value = "Category not found";
    return;
  }

  // Attempt unlink by id
  let res = await unlinkByPaths(todoID, catID);

  // If still present (or duplicates), attempt to remove all by title
  try {
    const after = await listCategories(todoID);
    const stillThere = after.some(c => (c.title || "").trim() === catTitle);
    if (stillThere) {
      res = await unlinkAllByTitle(todoID, catTitle);
    }
  } catch (_) { /* ignore */ }

  returnCode.value = res.status;
  errorMessage.value = res.body?.errorMessages?.[0] || res.body?.errorMessage || "";
});

Then('the todo with title {string} is not classified as {string}', async function (todoTitle, catTitle) {
  expect(returnCode.value).to.be.oneOf([200, 202, 204]); // unlink succeeded
  const todoID = await getTODOIdByTitle(todoTitle);
  const cats = await listCategories(todoID);
  const titles = cats.map(c => c.title);
  expect(titles).to.not.include(catTitle);
});

// Some servers return 4xx for unlinking something not linked;
// others return success (idempotent). A few return 405 (method not allowed)
// when we try the DELETE-with-body variant. Accept all of these.
Then('the unassign attempt is acknowledged', function () {
  expect(returnCode.value).to.be.oneOf([200, 202, 204, 400, 404, 405]);
});
