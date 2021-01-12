import { Id } from "./id.ts";
import { Node } from "./node.ts";
import { Operation, OperationType } from "./operation.ts";

export const MIN = 0;
export const MAX = Number.MAX_SAFE_INTEGER;
export const BASE = Math.pow(2, 8);

type PositionGenerator = (previous: Id[], next: Id[]) => Id[];

export class Tree {
  #root: Node;

  #deleteQueue: Operation[] = [];

  #replicaId: number;
  #positionGenerator: PositionGenerator;

  constructor(replicaId: number, positionGenerator: PositionGenerator) {
    this.#root = Tree.root();
    this.#replicaId = replicaId;
    this.#positionGenerator = positionGenerator;
  }

  get length(): number {
    return this.#root.length;
  }

  localDelete(index: number): Operation | undefined {
    let node = this.#root.getChildByOrder(index + 1);
    if (!(node && node.id) || node.id.replicaId === -1) {
      return;
    }

    let position = node.getPosition();
    node.setEmpty(true);
    node.trimEmpty();

    return new Operation(OperationType.Delete, this.#replicaId, position);
  }

  localInsert(value: string, index: number): Operation | undefined {
    let idx = Math.min(index, this.length);

    let prev = this.#root.getChildByOrder(idx);
    let next = this.#root.getChildByOrder(idx + 1);

    if (!(prev && next)) {
      return;
    }

    let prevPos = prev.getPosition();
    let nextPos = next.getPosition();

    let position = this.#positionGenerator(prevPos, nextPos);

    let node = this.#root.getChildByPosition(position, true)!;
    node.value = value;
    node.setEmpty(false);

    return new Operation(
      OperationType.Insert,
      this.#replicaId,
      position,
      value,
    );
  }

  receive = (operation: Operation): void => {
    switch (operation.type) {
      case OperationType.Insert: {
        return this.#integrateInsert(operation);
      }
      case OperationType.Delete: {
        return this.#integrateDelete(operation);
      }
    }
  };

  value(): string {
    let arr: string[] = [];
    this.#root.walk((node) => {
      if (!node.isEmpty() && node.value !== null) {
        arr.push(node.value);
      }
    });

    return arr.join("");
  }

  #integrateDelete = (operation: Operation): void => {
    let node = this.#root.getChildByPosition(operation.position, false);
    if (node && !node.isEmpty()) {
      node.setEmpty(true);
      node.trimEmpty();
    } else {
      if (
        !this.#deleteQueue.some((op) => {
          return operation.equalPosition(op);
        })
      ) {
        this.#deleteQueue.push(operation);
      }
    }
  };

  #integrateInsert = (operation: Operation): void => {
    let deleteQueueIndex = this.#deleteQueue.findIndex((op) => {
      return operation.equalPosition(op);
    });

    if (deleteQueueIndex > -1) {
      this.#deleteQueue.splice(deleteQueueIndex, 1);
      return;
    }

    let existingNode = this.#root.getChildByPosition(
      operation.position,
      false,
    );
    if (existingNode) {
      return;
    }

    let node = this.#root.getChildByPosition(operation.position, true)!;
    node.value = operation.value!;
    node.setEmpty(false);
  };

  static root(): Node {
    let root = new Node(null);
    root.setEmpty(true);
    root.addChild(new Node(new Id(MIN, -1, -1)));
    root.addChild(new Node(new Id(BASE, -1, -1)));

    return root;
  }
}
