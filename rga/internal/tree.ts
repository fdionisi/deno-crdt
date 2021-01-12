import {
  DoublyLinkedList,
  DoublyLinkedListJSON,
} from "./doubly-linked-list.ts";
import { Key } from "./key.ts";
import { Data, Node } from "./node.ts";
import {
  Operation,
  OperationDelete,
  OperationInsert,
  OperationMessage,
  OperationType,
} from "./operation.ts";
import { VectorClock } from "./vector-clock.ts";

export interface TreeJSON {
  replicaId: number;
  session: number;
  table: Array<[string, any]>;
  doublyLinkedList: DoublyLinkedListJSON;
}

export class Tree {
  #replicaId: number;
  #session: number;

  #table = new Map<string, Node>();
  #vectorClock = new VectorClock();

  doublyLinkedList = new DoublyLinkedList();

  constructor(replicaId: number, session = 1) {
    this.#replicaId = replicaId;
    this.#session = session;
  }

  incrementVectorClock(replicaId?: number): number {
    if (replicaId) {
      this.#vectorClock.increment(replicaId);
    } else {
      this.#vectorClock.increment(this.#replicaId);
    }
    return this.#vectorClock.sum();
  }

  localDelete(
    targetKey: Key,
    position: number,
    delLength: number,
    key: Key,
  ): void {
    let targetNode = targetKey && this.#table.get(targetKey.toString())!;
    let length = targetNode.data.key.length;

    // only tombstones! algorithm 6 on page 5 is different
    // in this regards, adds all created subnodes to keyList
    let keyList: Key[] = [];

    if (position === 1 && delLength === length) {
      keyList = keyList.concat(this.#deleteWholeNode(targetNode!));
    } else if (position === 1 && delLength < length) {
      keyList = keyList.concat(this.#deletePriorNode(targetNode!, delLength));
    }

    if (position > 1 && position + delLength - 1 === length) {
      keyList = keyList.concat(this.#deleteLastNode(targetNode!, position - 1));
    }

    if (position > 1 && position + delLength - 1 < length) {
      keyList = keyList.concat(
        this.#deleteMiddleNode(targetNode!, position, delLength),
      );
    }

    // Different than algorithm presented on page 5, we're ignoring pos > 1
    if (position + delLength - 1 > length) {
      keyList = keyList.concat(
        this.#deleteMultipleNode(targetNode!, position, delLength),
      );
    }
  }

  localInsert(
    targetKey: Key,
    position: number,
    str: string,
    key: Key,
  ): void {
    let data = new Data(key, str, 1);
    let newNode = new Node(data);

    let targetNode = targetKey && this.#table.get(targetKey.toString());

    if (!targetNode && position === 0) {
      this.doublyLinkedList.addToHead(newNode);
    } else {
      if (position === targetNode?.data.key.length) {
        this.doublyLinkedList.insertAfter(newNode, targetNode);
      } else {
        let fNode, lNode;
        [fNode, lNode] = this.#splitTwoNode(targetNode!, position);
        this.doublyLinkedList.insertBefore(fNode, targetNode!);
        this.doublyLinkedList.insertAfter(newNode, fNode);
        this.doublyLinkedList.insertAfter(lNode, newNode);
        this.doublyLinkedList.remove(targetNode!);
        this.#table.set(fNode.data.key.toString(), fNode);
        this.#table.set(lNode.data.key.toString(), lNode);
      }
    }

    this.#table.set(key.toString(), newNode);
  }

  receive = (operation: Operation): void => {
    switch (operation.type) {
      case OperationType.Insert: {
        this.#remoteInsert(
          operation.targetKey,
          operation.position,
          operation.data.value,
          operation.key,
        );
        break;
      }
      case OperationType.Delete: {
        this.#remoteDelete(
          operation.position,
          operation.data.delLength,
          operation.data.keyList,
          operation.key,
        );
        break;
      }
    }

    this.incrementVectorClock(operation.key.replicaId);
  };

  toJSON(): TreeJSON {
    return {
      replicaId: this.#replicaId,
      session: this.#session,
      table: [...this.#table.entries()],
      doublyLinkedList: this.doublyLinkedList.toJSON(),
    };
  }

  // Which id is predecessor, based on definition 4 on page 11
  predecessorId(id1: Key, id2: Key) {
    if (id1.session < id2.session) {
      return id1;
    } else if (id1.session === id2.session) {
      if (id1.ssv < id2.ssv) {
        return id1;
      } else if (id1.ssv === id2.ssv) {
        if (id1.replicaId < id2.replicaId) {
          return id1;
        } else if (id1.replicaId === id2.replicaId) {
          if (id1.offset > id2.offset) {
            return id1;
          } else {
            return id2;
          }
        } else {
          return id2;
        }
      } else {
        return id2;
      }
    } else {
      return id2;
    }
  }

  // Based on definition 5, page 11
  //   predecessorNode(node1: Node, node2: Node) {
  //     if (this.predecessorId(node1.data.key, node2.data.key) === node1.data.key) {
  //       return node2;
  //     } else {
  //       return node1;
  //     }
  //   }

  #findNode = (
    targetKey: Key | undefined,
    position: number,
  ): Node | undefined => {
    if (!targetKey) {
      return;
    }

    let targetNode = this.#table.get(targetKey.toString());

    while (targetNode?.data.flag === 1) {
      if (position <= targetNode.data.list[0].data.key.length) {
        targetNode = targetNode.data.list[0];
      } else if (
        position <=
          targetNode.data.list[1].data.key.offset +
            targetNode.data.list[1].data.key.length
      ) {
        targetNode = targetNode.data.list[1];
      } else {
        targetNode = targetNode.data.list[2];
      }
    }

    return targetNode;
  };

  #deleteLastNode = (targetNode: Node, position: number): [Key] => {
    let fNode, lNode;
    [fNode, lNode] = this.#splitTwoNode(targetNode, position);
    lNode.data.setVisible(0);

    this.doublyLinkedList.insertBefore(fNode, targetNode);
    this.doublyLinkedList.insertAfter(lNode, fNode);
    this.doublyLinkedList.remove(targetNode);
    this.#table.set(fNode.data.key.toString(), fNode);
    this.#table.set(lNode.data.key.toString(), lNode);

    return [targetNode.data.key];
  };

  #deleteMiddleNode = (
    targetNode: Node,
    position: number,
    delLength: number,
  ): [Key] => {
    let [fNode, mNode, lNode] = this.#splitThreeNode(
      targetNode,
      position,
      delLength,
    );
    mNode.data.setVisible(0);

    this.doublyLinkedList.insertBefore(fNode, targetNode);
    this.doublyLinkedList.insertAfter(mNode, fNode);
    this.doublyLinkedList.insertAfter(lNode, mNode);
    this.doublyLinkedList.remove(targetNode);
    this.#table.set(fNode.data.key.toString(), fNode);
    this.#table.set(mNode.data.key.toString(), mNode);
    this.#table.set(lNode.data.key.toString(), lNode);

    return [targetNode.data.key];
  };

  #deleteMultipleNode = (
    targetNode: Node,
    position: number,
    delLength: number,
  ): Key[] => {
    let keyList: Key[] = [];

    if (delLength < (targetNode.data.key.length - position)) {
      return keyList;
    }

    let node: Node | null = targetNode;
    if (position > 1 && delLength > (node.data.key.length - position)) {
      keyList = keyList.concat(this.#deleteLastNode(node, position - 1));
      delLength = delLength - (node.data.key.length - position + 1);
      node = node.next;
    }

    while (node && delLength >= node.data.key.length) {
      if (node.data.visible) {
        keyList = keyList.concat(this.#deleteWholeNode(node));
        delLength = delLength - node.data.key.length;
      }
      node = node.next;
    }

    if (delLength > 0) {
      keyList = keyList.concat(this.#deletePriorNode(node!, delLength));
    }

    return keyList;
  };

  #deletePriorNode = (targetNode: Node, delLength: number): [Key] => {
    let fNode, lNode;
    [fNode, lNode] = this.#splitTwoNode(targetNode, delLength);
    fNode.data.setVisible(0);

    this.doublyLinkedList.insertBefore(fNode, targetNode);
    this.doublyLinkedList.insertAfter(lNode, fNode);
    this.doublyLinkedList.remove(targetNode);
    this.#table.set(fNode.data.key.toString(), fNode);
    this.#table.set(lNode.data.key.toString(), lNode);

    return [targetNode.data.key];
  };

  #deleteWholeNode = (targetNode: Node): [Key] => {
    targetNode.data.setVisible(0);
    return [targetNode.data.key];
  };

  #recursiveDelete = (
    position: number,
    delLength: number,
    targetNode: Node,
  ): void => {
    let l = targetNode.data.key.length;

    if (!targetNode.data.flag) {
      if (position === 1 && delLength === l) {
        this.#deleteWholeNode(targetNode);
      } else if (position === 1 && delLength < l) {
        this.#deletePriorNode(targetNode, delLength);
      } else if (position > 1 && position + delLength - 1 === l) {
        this.#deleteLastNode(targetNode, position - 1);
      } else {
        this.#deleteMiddleNode(targetNode, position, delLength);
      }
    } else {
      let sub1 = targetNode.data.list[0];
      let sub2 = targetNode.data.list[1];
      let sub3 = targetNode.data.list[2];

      let l1 = sub1.data.key.length;
      let l2 = sub2.data.key.length;

      if (position <= l1 && position + delLength - 1 <= l1) {
        this.#recursiveDelete(position, delLength, sub1);
      } else if (position <= l1 && delLength - (l1 - position + 1) <= l2) {
        this.#recursiveDelete(position, l1 - position + 1, sub1);
        this.#recursiveDelete(1, delLength - (l1 - position + 1), sub2);
      } else if (position <= l1 && delLength - (l1 - position + 1) > l2) {
        let p = l1 - position + 1;
        this.#recursiveDelete(position, p, sub1);
        this.#recursiveDelete(1, l2, sub2);
        this.#recursiveDelete(1, delLength - p - l2, sub3);
      } else if (
        position > l1 && position - l1 <= l2 &&
        position - l1 + delLength - 1 <= l2
      ) {
        let p = position - l1;
        this.#recursiveDelete(p, delLength, sub2);
      } else if (
        position > l1 && position - l1 <= l2 &&
        position - l1 + delLength - 1 > l2
      ) {
        let p = position - l1;
        this.#recursiveDelete(p, l2 - p + 1, sub2);
        this.#recursiveDelete(1, delLength - (l2 - p + 1), sub3);
      } else {
        let q = position - l1 - l2;
        this.#recursiveDelete(q, delLength, sub3);
      }
    }
  };

  #remoteDelete = (
    position: number,
    delLength: number,
    keyList: Key[],
    key: Key,
  ): void => {
    let count = keyList.length;
    let targetNode = keyList[0] && this.#table.get(keyList[0].toString())!;

    if (count === 1) {
      this.#recursiveDelete(position, delLength, targetNode);
    } else {
      this.#recursiveDelete(
        position,
        targetNode?.data.key.length - position + 1,
        targetNode,
      );

      let sumLength = targetNode?.data.key.length - position + 1;
      let p = 1;

      for (let i = 1; i < count - 1; i++) {
        let tempNode = this.#table.get(keyList[i].toString())!;
        this.#recursiveDelete(p, keyList[i].length, tempNode);
        sumLength += keyList[i].length;
      }

      let lastLength = delLength - sumLength;

      let lastNode = this.#table.get(keyList[count - 1].toString())!;

      this.#recursiveDelete(p, lastLength, lastNode);
    }
  };

  #remoteInsert = (
    targetKey: Key,
    position: number,
    str: string,
    key: Key,
    deep?: boolean,
  ): void => {
    let newNode = new Node(
      new Data(
        key,
        str,
        1,
      ),
    );
    let targetNode;

    // if (deep) {
    //   console.log('hello2')
    targetNode = this.#findNode(targetKey, position);
    // } else {
    //   console.log('hello1')
    //   targetNode = this.hashTable[hashKey(targetKey)]
    // }

    if (targetNode) {
      if (position === targetNode.data.key.length) {
        let previous;
        let current = targetNode.next;

        while (current) {
          if (key === this.predecessorId(key, current.data.key)) {
            previous = current;
            current = current.next;
          } else {
            current = null;
          }
        }

        if (previous) {
          this.doublyLinkedList.insertAfter(newNode, previous);
        } else {
          this.doublyLinkedList.insertAfter(newNode, targetNode);
        }
      } else {
        let fNode, lNode;
        [fNode, lNode] = this.#splitTwoNode(
          targetNode,
          position - targetNode.data.key.offset,
        );
        this.doublyLinkedList.insertBefore(fNode, targetNode);
        this.doublyLinkedList.insertAfter(newNode, fNode);
        this.doublyLinkedList.insertAfter(lNode, newNode);
        this.doublyLinkedList.remove(targetNode);
        this.#table.set(fNode.data.key.toString(), fNode);
        this.#table.set(lNode.data.key.toString(), lNode);
      }
    } else {
      let previous;
      let current = this.doublyLinkedList.head;

      while (current) {
        if (key === this.predecessorId(key, current.data.key)) {
          previous = current;
          current = current.next;
        } else {
          current = null;
        }
      }

      if (previous) {
        this.doublyLinkedList.insertAfter(newNode, previous);
      } else {
        this.doublyLinkedList.addToHead(newNode);
      }
    }

    this.#table.set(newNode.data.key.toString(), newNode);
  };

  #splitTwoNode = (targetNode: Node, position: number): [Node, Node] => {
    let fNode = Node.fromJSON(targetNode.toJSON());

    // fNode.data.key.offset = targetNode.data.key.offset
    // if (fNode.data.key.offset > 0) {
    fNode.data.key.setLength(position);
    // } else {
    //   fNode.data.key.length = position
    // }

    fNode.data.setValue(targetNode.data.value.substr(0, fNode.data.key.length));

    let lNode = Node.fromJSON(targetNode.toJSON());
    lNode.data.key.setOffset(
      targetNode.data.key.offset + fNode.data.key.length,
    );
    lNode.data.key.setLength(
      targetNode.data.key.length - fNode.data.key.length,
    );

    console.log(lNode.data.key.length < 0, "ERROR");
    lNode.data.setValue(targetNode.data.value.substr(
      fNode.data.key.length,
      targetNode.data.key.length - fNode.data.key.length,
    ));

    targetNode.data.setFlag(1);
    targetNode.data.setList([fNode, lNode]);

    return [fNode, lNode];
  };

  #splitThreeNode = (
    targetNode: Node,
    position: number,
    delLength: number,
  ): [Node, Node, Node] => {
    let fNode = Node.fromJSON(targetNode.toJSON());
    fNode.data.key.setOffset(targetNode.data.key.offset);
    fNode.data.key.setLength(position - 1);
    fNode.data.setValue(targetNode.data.value.substr(0, fNode.data.key.length));

    let mNode = Node.fromJSON(targetNode.toJSON());
    mNode.data.key.setOffset(targetNode.data.key.offset + position - 1);
    mNode.data.key.setLength(delLength);
    mNode.data.setValue(targetNode.data.value.substr(
      fNode.data.key.length,
      mNode.data.key.length,
    ));

    let lNode = Node.fromJSON(targetNode.toJSON());
    lNode.data.key.setOffset(mNode.data.key.offset + delLength);
    lNode.data.key.setLength(
      targetNode.data.key.length - fNode.data.key.length -
        mNode.data.key.length,
    );
    lNode.data.setValue(targetNode.data.value.substr(
      fNode.data.key.length + mNode.data.key.length,
      lNode.data.key.length,
    ));

    targetNode.data.setFlag(1);
    targetNode.data.setList([fNode, mNode, lNode]);
    return [fNode, mNode, lNode];
  };

  static fromJSON(json: TreeJSON): Tree {
    let tree = new Tree(json.replicaId, json.session);
    tree.doublyLinkedList = DoublyLinkedList.fromJSON(json.doublyLinkedList);
    tree.#table = new Map(json.table);
    return tree;
  }
}
