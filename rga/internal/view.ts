import { DoublyLinkedList } from "./doubly-linked-list.ts";
import { Data, Node } from "./node.ts";
import { Tree } from "./tree.ts";

export class View {
  #leftView = new DoublyLinkedList();

  nodeAtPosition(position: number): [Node, number] {
    let currentPosition = 0;
    let currentNode: Node;
    let positionWithinNode = 0;
    this.#leftView.traverse((node) => {
      if (currentPosition < position) {
        positionWithinNode = position - currentPosition;
        currentPosition = currentPosition + node.data.key.length;
        currentNode = node;
      }
    });
    return [currentNode!, positionWithinNode];
  }

  toString(): string {
    let string = "";
    this.#leftView.traverse((node) => {
      string = string + node.data.value;
    });
    return string;
  }

  synchronize(tree: Tree): DoublyLinkedList {
    this.#leftView = new DoublyLinkedList();
    let node = tree.doublyLinkedList.head;
    while (node) {
      if (node.data.visible) {
        this.#leftView.add(new Node(Data.fromJSON(node.data.toJSON())));
      }
      node = node.next;
    }
    return this.#leftView;
  }
}
