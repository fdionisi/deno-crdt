import { Crdt } from "../../types.ts";

import { Id } from "./id.ts";
import { Operation } from "./operation.ts";
import { Sequence } from "./sequence.ts";

export type DispatchOperation = (op: Operation[]) => void;

export class Document implements Crdt<string, Operation> {
  #replicaId: number;
  #operationCounter = 0;
  #dispatchOperation: DispatchOperation;

  #sequence: Sequence;

  constructor(replicaId: number, dispatchOperation: DispatchOperation) {
    this.#replicaId = replicaId;
    this.#dispatchOperation = dispatchOperation;

    this.#sequence = new Sequence(this.#idGenerator);
  }

  get replicaId(): number {
    return this.#replicaId;
  }

  get length(): number {
    return this.#sequence.toString().length;
  }

  insert(characters: string, position: number): void {
    let ops: Operation[] = [];
    for (let [index, character] of Object.entries(characters)) {
      let op = this.#sequence.localInsert(
        character,
        position + parseInt(index),
      );
      if (op) {
        ops.push(
          op,
        );
      }
    }

    this.#dispatchOperation(ops);
  }

  delete(position: number, length = 1): void {
    let ops: Operation[] = [];

    // XXX: runs backwards to avoid changing the visible index
    for (let i = length - 1; i >= 0; i--) {
      let op = this.#sequence.localDelete(position + i + 1);
      if (op) {
        ops.push(op);
      }
    }

    this.#dispatchOperation(ops);
  }

  applyOperations(operations: Operation[]): void {
    let ops = operations.filter((op) =>
      op.char.id.replicaId !== this.#replicaId
    );

    if (ops.length === 0) {
      return;
    }

    ops.forEach(this.#sequence.receive);
  }

  toString() {
    return this.#sequence.value();
  }

  #idGenerator = (): Id => {
    this.#operationCounter += 1;
    return new Id(this.#replicaId, this.#operationCounter);
  };
}
