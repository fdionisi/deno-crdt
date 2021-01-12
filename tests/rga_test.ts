import { delay } from "https://deno.land/x/std@0.81.0/async/delay.ts";
import {
  assert,
  assertEquals,
} from "https://deno.land/x/std@0.81.0/testing/asserts.ts";

import { Document } from "../rga/mod.ts";
import { makeSuite } from "./internal/suite.ts";

let { executeRandomMethod, makeDocuments, makeDocumentsWithDelay } = makeSuite(
  Document,
);

Deno.test({
  name: "Rga insert",
  async fn() {
    await makeDocuments(2, async ([doc1, doc2]) => {
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
