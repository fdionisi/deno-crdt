import { Crdt, DispatchOperation } from "../../types.ts";
import { Key } from "./key.ts";
import {
  Operation,
  OperationDelete,
  OperationInsert,
  OperationMessage,
  OperationType,
} from "./operation.ts";
import { Tree } from "./tree.ts";
import { View } from "./view.ts";

export type Dispatcher = DispatchOperation<Operation>;

export class Document implements Crdt<any, any> {
  #replicaId: number;
  #dispatchOperation: Dispatcher;

  #tree: Tree;
  #view = new View();

  constructor(replicaId: number, dispatchOperation: Dispatcher) {
    this.#replicaId = replicaId;
    this.#dispatchOperation = dispatchOperation;

    this.#tree = new Tree(this.#replicaId);
  }

  get replicaId(): number {
    return this.#replicaId;
  }

  get length(): number {
    return this.#view.toString().length;
  }

  insert(characters: string, position: number): void {
    let ops: OperationInsert[] = this.#generateOps(
      this.toString(),
      characters,
      position,
    ) as any;
    for (let op of ops) {
      this.#tree.localInsert(
        op.targetKey,
        op.position,
        op.data.value,
        op.key,
      );
    }

    this.#dispatchOperation(ops);
    this.#view.synchronize(this.#tree);
  }

  delete(position: number, length = 1): void {
    throw new Error("Unimplemented");
    // let ops: Operation[] = [];

    // // XXX: runs backwards to avoid changing the visible index
    // for (let i = length - 1; i >= 0; i--) {
    //   let op = this.#tree.localDelete(position + i + 1);
    //   if (op) {
    //     ops.push(op);
    //   }
    // }

    // this.#dispatchOperation(ops);
    // this.#view.synchronize(this.#tree)
  }

  applyOperations(operations: Operation[]): void {
    let ops = operations;
    // let ops = operations.filter((op) =>
    //   op.char.id.replicaId !== this.#replicaId
    // );

    if (ops.length === 0) {
      return;
    }

    operations.forEach(this.#tree.receive);
  }

  toString(): string {
    return this.#view.toString();
  }

  #diffToOps = (start: number, end: number, newText: string): Operation[] => {
    let result = [];

    let targetNode, positionWithinNode;

    // KEY
    // Definition 3. Identifier IDÞ of each node is a five-tuple hs, ssv, site, offset, len where
    // (1) s is the identifier of session, a global increas- ing number.
    // (2) ssv is the sum of state vector of an operation.
    // (3) site is the unique identifier of the site.
    // (4) offset is the length from the leftmost position of the current node to the leftmost position of the original node.
    // - - - - | - - - | - - - - |
    //
    // (5) len is the length of string contained in the current node.

    // DELETE (tar key; pos; del len; key)
    // deletion

    if (end - start !== 0) {
      [targetNode, positionWithinNode] = this.#view.nodeAtPosition(start + 1);
      let key = Key.fromJSON({
        session: 1,
        ssv: this.#tree.incrementVectorClock(),
        replicaId: this.#replicaId,
        offset: 0,
        length: end - start,
      });

      result.push(
        new OperationMessage(
          OperationType.Delete,
          this.#replicaId,
          targetNode?.data.key!,
          positionWithinNode,
          { delLength: end - start },
          key,
        ) as OperationDelete,
      );
    }

    // INSERT (targetKey, positionWithinNode, str, key)
    // insertion
    if (newText.length) {
      [targetNode, positionWithinNode] = this.#view.nodeAtPosition(start);
      let key = Key.fromJSON(
        {
          session: 1,
          ssv: this.#tree.incrementVectorClock(),
          replicaId: this.#replicaId,
          offset: 0,
          length: newText.length,
        },
      );

      result.push(
        new OperationMessage(
          OperationType.Insert,
          this.#replicaId,
          targetNode?.data.key!,
          positionWithinNode,
          { value: newText },
          key,
        ) as OperationInsert,
      );
    }

    return result;
  };

  #getDiff = (
    oldText: string,
    newText: string,
    cursor: number,
  ): [number, number, string] => {
    let delta = newText.length - oldText.length;
    let limit = Math.max(0, cursor - delta);
    let end = oldText.length;
    while (
      end > limit && oldText.charAt(end - 1) === newText.charAt(end + delta - 1)
    ) {
      end -= 1;
    }
    let start = 0;
    let startLimit = cursor - Math.max(0, delta);
    while (
      start < startLimit && oldText.charAt(start) === newText.charAt(start)
    ) {
      start += 1;
    }
    return [start, end, newText.slice(start, end + delta)];
  };

  #generateOps = (
    oldText: string,
    newText: string,
    cursor: number,
  ): Operation[] => {
    return this.#diffToOps(...this.#getDiff(oldText, newText, cursor));
  };
}
