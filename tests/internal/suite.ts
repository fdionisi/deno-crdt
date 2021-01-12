import { Crdt, CrdtClass } from "../../types.ts";

type Document = Crdt<any, any>;

enum Method {
  Insert = "insert",
  Delete = "delete",
}

function getRandomMethod(document: Document): Method {
  if (document.length === 0) {
    return Method.Insert;
  }

  let methods = [Method.Insert, Method.Delete];
  return methods[Math.floor(Math.random() * methods.length)];
}

export function makeSuite(Doc: CrdtClass<any, any>) {
  return {
    async makeDocuments(
      n: number,
      test: (docs: Document[]) => Promise<void>,
    ): Promise<void> {
      let documents: Document[] = [];

      for (let i = 0; i < n; i++) {
        documents.push(
          new Doc(i, (ops) => {
            documents.forEach((doc) => {
              doc.applyOperations(ops);
            });
          }),
        );
      }

      await test(documents);
    },
    async makeDocumentsWithDelay(
      n: number,
      test: (docs: Document[]) => Promise<void>,
    ) {
      let documents: Document[] = [];

      for (var i = 0; i < n; i++) {
        let queue = new Map<number, any[]>();
        documents.push(
          new Doc(i, (ops) => {
            documents.forEach((doc) => {
              if (!queue.has(doc.replicaId)) {
                queue.set(doc.replicaId, []);
              }

              let delayedOperations = queue.get(doc.replicaId)!;
              delayedOperations.push(...ops);

              setTimeout(() => {
                delayedOperations.forEach((op) => {
                  // setTimeout(() => {
                  doc.applyOperations([op]);
                  // }, Math.random() * 250);
                });

                delayedOperations.splice(0);
              }, Math.random() * 500);
            });
          }),
        );
      }

      await test(documents);
    },
    executeRandomMethod(document: Document) {
      let method = getRandomMethod(document);
      switch (method) {
        case Method.Insert: {
          let toInsert = Math.random().toString();
          let position = Math.floor(Math.random() * 100);

          return document.insert(toInsert, position);
        }
        case Method.Delete: {
          let position = Math.floor(Math.random() * 100);
          return document.delete(position, 1);
        }
      }
    },
  };
}
