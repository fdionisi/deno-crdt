import { Crdt, DispatchOperation } from "../../types.ts";

import { Id } from "./id.ts";
import { Operation } from "./operation.ts";
import { BASE, MAX, MIN, Tree } from "./tree.ts";

export type Dispatcher = DispatchOperation<Operation>;

function doubledBase(depth: number) {
  return Math.min(BASE * Math.pow(2, depth), MAX);
}

function randomBiasedInt(a: number, b: number, bias: number) {
  return Math.floor(Math.pow(Math.random(), bias) * (b - (a + 1))) + a + 1;
}

function randomAlternation(bias: number) {
  return Math.random() > 0.5 ? bias : 1 / bias;
}

export class Document implements Crdt<string, Operation> {
  #replicaId: number;
  #clock = 0;
  #bias = 15;
  #dispatchOperation: Dispatcher;

  #tree: Tree;

  constructor(replicaId: number, dispatchOperation: Dispatcher) {
    this.#replicaId = replicaId;
    this.#dispatchOperation = dispatchOperation;

    this.#tree = new Tree(this.#replicaId, this.#positionGenerator);
  }

  get replicaId(): number {
    return this.#replicaId;
  }

  get length(): number {
    return this.#tree.toString().length;
  }

  insert(characters: string, position: number): void {
    let ops: Operation[] = [];
    for (let [index, character] of Object.entries(characters)) {
      let op = this.#tree.localInsert(
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

    for (let i = 0; i < length; i++) {
      let op = this.#tree.localDelete(position);
      if (op) {
        ops.push(op);
      }
    }

    this.#dispatchOperation(ops);
  }

  applyOperations(operations: Operation[]): void {
    let ops = operations.filter((op) => op.replicaId !== this.replicaId);
    if (ops.length === 0) {
      return;
    }

    ops.forEach(this.#tree.receive);
  }

  toString() {
    return this.#tree.value();
  }

  #positionGenerator = (previousPos: Id[], nextPos: Id[]): Id[] => {
    let position = [];

    let maxLength = Math.max(previousPos.length, nextPos.length);
    var samePrefixes = true;

    for (var depth = 0; depth < maxLength + 1; depth++) {
      const DEPTH_MAX = doubledBase(depth);
      const prevId = previousPos[depth] || new Id(MIN, -1, -1);
      const nextId = (samePrefixes && nextPos[depth])
        ? nextPos[depth]
        : new Id(DEPTH_MAX, -1, -1); // base doubling

      const diff = nextId.num - prevId.num;

      if (diff > 1) { // enough room for number between prevInt and nextInt
        position.push(this.#idGenerator(prevId.num, nextId.num));
        break;
      } else {
        if (prevId.replicaId === -1 && depth > 0) {
          prevId.replicaId = this.replicaId;
        }
        position.push(prevId);
        if (prevId.compare(nextId) !== 0) {
          samePrefixes = false;
        }
      }
    }

    return position;
  };

  #idGenerator = (previousNum: number, nextNumber: number): Id => {
    let int = randomBiasedInt(
      previousNum,
      nextNumber,
      randomAlternation(this.#bias),
    );
    return new Id(int, this.#replicaId, this.#clock++);
  };
}
