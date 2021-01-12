import { delay } from "https://deno.land/x/std@0.81.0/async/delay.ts";
import {
  assert,
  assertEquals,
} from "https://deno.land/x/std@0.81.0/testing/asserts.ts";

import { Document } from "../chronofold/mod.ts";
import { makeSuite } from "./internal/suite.ts";

let { executeRandomMethod, makeDocuments, makeDocumentsWithDelay } = makeSuite(
  Document,
);

Deno.test({
  name: "Chronofold insert",
  async fn() {
    await makeDocuments(2, async ([doc1, doc2]) => {
      console.log("");
      doc1.insert("abc", 0);
      doc2.insert("xyz", 0);
      doc1.insert("123", 1);
      doc2.insert("m", 3);
      doc2.insert("f", doc2.toString().length);

      assertEquals(doc1.toString(), doc2.toString());
      assertEquals(doc1.toString(), "x12m3yzabcf");
    });
  },
});

Deno.test({
  name: "Chronofold delete",
  async fn() {
    await makeDocuments(2, async ([doc1, doc2]) => {
      doc1.insert("abcdefg", 0);
      doc2.delete(2);
      doc1.delete(1, 3);
      doc1.delete(0);
      doc2.delete(doc2.toString().length - 1);

      assertEquals(doc1.toString(), doc2.toString());
      assertEquals(doc1.toString(), "f");
    });
  },
});

Deno.test({
  name: "Chronofold randomized operations",
  async fn() {
    await makeDocuments(5, async (docs) => {
      let rounds = 200;

      for (let i = 0; i < rounds; i++) {
        docs.forEach((doc) => {
          executeRandomMethod(doc);
        });
      }

      let finalValue = docs[0].toString();

      assert(
        !docs.some((doc) => doc.toString() !== finalValue),
        "all nodes converged",
      );
    });
  },
});

Deno.test({
  name: "Chronofold randomized operations with delay",
  async fn() {
    await makeDocumentsWithDelay(2, async (docs) => {
      let rounds = 50;

      for (let i = 0; i < rounds; i++) {
        docs.forEach((doc) => {
          executeRandomMethod(doc);
        });
      }

      await delay(2000);
      let finalValue = docs[0].toString();

      assert(
        !docs.some((doc) => doc.toString() !== finalValue),
        "all nodes converged",
      );
    });
  },
});
