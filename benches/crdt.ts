import {
  bench,
  runBenchmarks,
} from "https://deno.land/std@0.81.0/testing/bench.ts";

import { makeSuite } from "../tests/internal/suite.ts";

import { Document as Logoot } from "../logoot/mod.ts";
import { Document as Woot } from "../woot/mod.ts";

let {
  makeDocuments: makeLogoot,
  executeRandomMethod: executeRandomLogootMethod,
} = makeSuite(Logoot);

let { makeDocuments: makeWoot, executeRandomMethod: executeRandomWootMethod } =
  makeSuite(Woot);

const DOCS = 20;
const ROUNDS = 200;
const RUNS = 100;

bench({
  name: `Woot: ${ROUNDS} random operations on ${DOCS} documents`,
  runs: RUNS,
  async func(b): Promise<void> {
    await makeWoot(DOCS, async ([doc]): Promise<void> => {
      b.start();
      for (let i = 0; i < ROUNDS; i++) {
        executeRandomWootMethod(doc);
      }
      b.stop();
    });
  },
});

bench({
  name: `Logoot: ${ROUNDS} random operations on ${DOCS} documents`,
  runs: RUNS,
  async func(b): Promise<void> {
    await makeLogoot(DOCS, async ([doc]): Promise<void> => {
      b.start();
      for (let i = 0; i < ROUNDS; i++) {
        executeRandomLogootMethod(doc);
      }
      b.stop();
    });
  },
});

bench({
  name: `Woot: ${ROUNDS} toString`,
  runs: RUNS,
  async func(b): Promise<void> {
    await makeWoot(1, async ([doc]): Promise<void> => {
      for (let i = 0; i < ROUNDS; i++) {
        doc.insert("a", i);
      }
      b.start();
      doc.toString();
      b.stop();
    });
  },
});

bench({
  name: `Logoot: ${ROUNDS} toString`,
  runs: RUNS,
  async func(b): Promise<void> {
    await makeLogoot(1, async ([doc]): Promise<void> => {
      for (let i = 0; i < ROUNDS; i++) {
        doc.insert("a", i);
      }
      b.start();
      doc.toString();
      b.stop();
    });
  },
});

runBenchmarks();
