// performance/perf_categories.js
// Measure create / update / delete for CATEGORIES.
// CSV → evidence/perf_categories.csv

const fs = require("fs");
const path = require("path");
const { performance } = require("perf_hooks");
const os = require("os");
const chai = require("chai");
const chaiHttp = require("chai-http");

chai.use(chaiHttp);
const expect = chai.expect;

const host = "http://localhost:4567";
const categoriesEndpoint = "/categories";
const client = () => chai.request(host);

const SIZES = [10, 50, 100, 200];
const RUNS_PER_SIZE = 5;

const OUT_PATH = path.join(__dirname, "..", "evidence", "perf_categories.csv");

// ---------- helpers ----------

function ensureHeader() {
  if (!fs.existsSync(OUT_PATH)) {
    fs.writeFileSync(
      OUT_PATH,
      "entity,operation,n_objects,run_index,duration_ms,mem_bytes,cpu_load,timestamp\n",
      "utf8"
    );
  }
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getAllCategories() {
  const res = await client().get(categoriesEndpoint);
  expect(res.status).to.equal(200);
  return res.body.categories || [];
}

async function clearCategories() {
  const cats = await getAllCategories();
  for (const c of cats) {
    const res = await client().delete(`${categoriesEndpoint}/${c.id}`);
    expect([200, 202, 204, 404]).to.include(res.status);
  }
}

function recordCSV(entity, operation, n, runIndex, durationMs) {
  const mem = process.memoryUsage().rss;
  const cpu = os.loadavg()[0];
  const ts = new Date().toISOString();
  const line = `${entity},${operation},${n},${runIndex},${durationMs.toFixed(
    3
  )},${mem},${cpu.toFixed(4)},${ts}\n`;
  fs.appendFileSync(OUT_PATH, line, "utf8");
}

async function createCategories(n) {
  const ids = [];
  const start = performance.now();

  for (let i = 0; i < n; i++) {
    const body = {
      title: `perf_cat_${Date.now()}_${i}`,
      description: "perf run"
    };
    const res = await client()
      .post(categoriesEndpoint)
      .set("Content-Type", "application/json")
      .send(body);

    expect([200, 201]).to.include(res.status);
    const created =
      (res.body.categories && res.body.categories[0]) || res.body;
    ids.push(created.id);
  }

  const end = performance.now();
  return { ids, durationMs: end - start };
}

async function updateCategories(ids) {
  const start = performance.now();

  for (const id of ids) {
    const body = { description: "updated description perf" };
    const res = await client()
      .patch(`${categoriesEndpoint}/${id}`)
      .set("Content-Type", "application/json")
      .send(body);
    expect([200, 201, 204, 400, 405]).to.include(res.status);

  }

  const end = performance.now();
  return end - start;
}

async function deleteCategories(ids) {
  const start = performance.now();

  for (const id of ids) {
    const res = await client().delete(`${categoriesEndpoint}/${id}`);
    expect([200, 202, 204, 404]).to.include(res.status);
  }

  const end = performance.now();
  return end - start;
}

// ---------- main ----------

async function run() {
  ensureHeader();
  console.log("== Performance: CATEGORIES ==");
  console.log(`CSV output → ${OUT_PATH}`);

  for (const n of SIZES) {
    console.log(`\n### N = ${n} ###`);
    for (let runIndex = 1; runIndex <= RUNS_PER_SIZE; runIndex++) {
      console.log(`Run ${runIndex}/${RUNS_PER_SIZE}`);

      await clearCategories();
      await sleep(300);

      const { ids, durationMs: createMs } = await createCategories(n);
      recordCSV("categories", "create", n, runIndex, createMs);
      console.log(
        `create: N=${n}, run=${runIndex}, duration=${createMs.toFixed(2)} ms`
      );

      const updateMs = await updateCategories(ids);
      recordCSV("categories", "update", n, runIndex, updateMs);
      console.log(
        `update: N=${n}, run=${runIndex}, duration=${updateMs.toFixed(2)} ms`
      );

      const deleteMs = await deleteCategories(ids);
      recordCSV("categories", "delete", n, runIndex, deleteMs);
      console.log(
        `delete: N=${n}, run=${runIndex}, duration=${deleteMs.toFixed(2)} ms`
      );

      await sleep(300);
    }
  }

  console.log("\nDone.");
  process.exit(0);
}

run().catch((err) => {
  console.error("Perf CATEGORIES failed:", err);
  process.exit(1);
});
