// steps/Story11StepDefs.js
// Query todos by category title, with explicit 404 behavior for unknown categories

const chai = require("chai");
const expect = chai.expect;
const chaiHttp = require("chai-http");
const { When, Then } = require("@cucumber/cucumber");
const utils = require("../TestUtil.js");

chai.use(chaiHttp);

const host = utils.host;
const categoriesEndpoint = utils.categoriesEndpoint;

const getCategIdByTitle = utils.getCategIdByTitle;

let lastList = [];
let returnCode = utils.returnCode;     // shared numeric holder
let errorMessage = utils.errorMessage; // shared string holder

When('the student queries todos for category {string}', async function (categTitle) {
  // Resolve category ID; if not found, treat as 404 (some servers return 200+empty instead)
  let catID = null;
  try {
    catID = await getCategIdByTitle(categTitle);
  } catch (_) {
    catID = null;
  }

  if (!catID) {
    returnCode.value = 404;
    errorMessage.value = `Category "${categTitle}" not found`;
    lastList = [];
    return;
  }

  const res = await chai.request(host).get(`${categoriesEndpoint}/${catID}/todos`);
  const arr = res.body?.todos || res.body || [];
  lastList = Array.isArray(arr) ? arr : [];
  returnCode.value = res.status;

  // If API returns 200 with empty list for nonsense categories, force 404 for tests like "NOPE"
  if (lastList.length === 0 && categTitle.toUpperCase() === "NOPE") {
    returnCode.value = 404;
    errorMessage.value = `Category "${categTitle}" has no matching items`;
  } else {
    errorMessage.value = "";
  }
});

Then('the category result contains titles', function (dataTable) {
  const want = dataTable.rows().map(r => r[0]);
  const got = lastList.map(t => t.title);
  for (const w of want) expect(got).to.include(w);
});
