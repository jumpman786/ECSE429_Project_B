// performance/perf_todos.js
// Measure create / update / delete for TODOS vs N and over time.
// Writes CSV to evidence/perf_todos.csv

const fs = require("fs");
const path = require("path");
const { performance } = require("perf_hooks");
const os = require("os");
const chai = require("chai");
const chaiHttp = require("chai-http");

chai.use(chaiHttp);
const expect = chai.expect;

const host = "http://localhost:4567";
const todosEndpoint = "/todos";
const client = () => chai.request(host);

// different data sizes — you can tweak these if it’s too slow
const SIZES = [10, 50, 100, 200];
const RUNS_PER_SIZE = 5;

const OUT_PATH = path.join(__dirname, "..", "evidence", "perf_todos.csv");

// ------------- helpers -------------

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

async function getAllTodos() {
  const res = await client().get(todosEndpoint);
  expect(res.status).to.equal(200);
  return res.body.todos || [];
}

async function clearTodos() {
  const todos = await getAllTodos();
  for (const t of todos) {
    const res = await client().delete(`${todosEndpoint}/${t.id}`);
    expect([200, 202, 204, 404]).to.include(res.status);
  }
}

function recordCSV(entity, operation, n, runIndex, durationMs) {
  const mem = process.memoryUsage().rss; // resident set size in bytes
  const cpu = os.loadavg()[0]; // 1-min load avg (approx CPU)
  const ts = new Date().toISOString();

  const line = `${entity},${operation},${n},${runIndex},${durationMs.toFixed(
    3
  )},${mem},${cpu.toFixed(4)},${ts}\n`;
  fs.appendFileSync(OUT_PATH, line, "utf8");
}

// create N todos, return array of ids + duration (ms)
async function createTodos(n) {
  const ids = [];
  const start = performance.now();

  for (let i = 0; i < n; i++) {
    const body = {
      title: `perf_todo_${Date.now()}_${i}`,
      doneStatus: false,
      description: "perf run"
    };
    const res = await client()
      .post(todosEndpoint)
      .set("Content-Type", "application/json")
      .send(body);

    expect([200, 201]).to.include(res.status);
    const created = (res.body.todos && res.body.todos[0]) || res.body;
    ids.push(created.id);
  }

  const end = performance.now();
  return { ids, durationMs: end - start };
}

// patch description on all ids
async function updateTodos(ids) {
  const start = performance.now();

  for (const id of ids) {
    const body = {
      description: "updated description perf"
    };
    const res = await client()
      .patch(`${todosEndpoint}/${id}`)
      .set("Content-Type", "application/json")
      .send(body);

    expect([200, 201, 204, 400, 405]).to.include(res.status);

  }

  const end = performance.now();
  return end - start;
}

// delete all ids
async function deleteTodos(ids) {
  const start = performance.now();

  for (const id of ids) {
    const res = await client().delete(`${todosEndpoint}/${id}`);
    expect([200, 202, 204, 404]).to.include(res.status);
  }

  const end = performance.now();
  return end - start;
}

// ------------- main runner -------------

async function run() {
  ensureHeader();
  console.log("== Performance: TODOS ==");
  console.log(`CSV output → ${OUT_PATH}`);

  for (const n of SIZES) {
    console.log(`\n### N = ${n} ###`);
    for (let runIndex = 1; runIndex <= RUNS_PER_SIZE; runIndex++) {
      console.log(`Run ${runIndex}/${RUNS_PER_SIZE}`);

      // keep environment clean for each run
      await clearTodos();
      await sleep(300);

      // CREATE
      const { ids, durationMs: createMs } = await createTodos(n);
      recordCSV("todos", "create", n, runIndex, createMs);
      console.log(
        `create: N=${n}, run=${runIndex}, duration=${createMs.toFixed(2)} ms`
      );

      // UPDATE
      const updateMs = await updateTodos(ids);
      recordCSV("todos", "update", n, runIndex, updateMs);
      console.log(
        `update: N=${n}, run=${runIndex}, duration=${updateMs.toFixed(2)} ms`
      );

      // DELETE
      const deleteMs = await deleteTodos(ids);
      recordCSV("todos", "delete", n, runIndex, deleteMs);
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
  console.error("Perf TODOS failed:", err);
  process.exit(1);
});
