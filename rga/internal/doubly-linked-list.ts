import { Node, NodeJSON } from "./node.ts";

export interface DoublyLinkedListJSON {
  head?: NodeJSON;
  tail?: NodeJSON;
}

export class DoublyLinkedList {
  #head: Node | null = null;
  #tail: Node | null = null;

  #numberOfValues: number = 0;

  get head(): Node | null {
    return this.#head;
  }

  get tail(): Node | null {
    return this.#tail;
  }

  add(node: Node): void {
    if (!this.#head) {
      this.#head = node;
      this.#tail = node;
    } else if (this.#tail) {
      node.setPrevious(this.#tail);
      this.#tail.setNext(node);
      this.#tail = node;
    }

    this.#numberOfValues++;
  }

  addToHead(node: Node): void {
    if (!this.#head) {
      this.add(node);
    } else {
      this.insertBefore(node, this.#head);
    }
  }

  addToTail(node: Node): void {
    if (!this.#tail) {
      this.add(node);
    } else {
      this.insertAfter(node, this.#tail);
    }
  }

  remove(node: Node): void {
    let current = this.#head;
    while (current) {
      if (current.data === node.data) {
        if (current === this.#head && current === this.#tail) {
          this.#head = null;
          this.#tail = null;
        } else if (current === this.#head) {
          this.#head = this.#head.next;
          this.#head?.setPrevious(null);
        } else if (current === this.#tail) {
          this.#tail = this.#tail.previous;
          this.#tail?.setNext(null);
        } else {
          current.previous?.setNext(current.next);
          current.next?.setPrevious(current.previous);
        }

        this.#numberOfValues--;
      }
      current = current.next;
    }
  }

  insertAfter(node: Node, toNode: Node): void {
    let current = this.#head;
    while (current) {
      if (current.data === toNode.data) {
        if (current === this.#tail) {
          this.add(node);
        } else {
          current.next?.setPrevious(node);
          node.setPrevious(current);
          node.setNext(current.next);
          current.setNext(node);
          this.#numberOfValues++;
        }
      }

      current = current.next;
    }
  }

  insertBefore(node: Node, toNode: Node): void {
    let current = this.#head;
    while (current) {
      if (current.data === toNode.data) {
        if (current === this.#head) {
          current.setPrevious(node);
          this.#head = node;
          node.setNext(current);
          this.#numberOfValues++;
        } else if (current.previous !== null) {
          this.insertAfter(node, current.previous);
        }
      }
      current = current.next;
    }
  }

  traverse(fn: (node: Node) => void): void {
    let current = this.#head;
    while (current) {
      if (fn) {
        fn(current);
      }
      current = current.next;
    }
  }

  traverseReverse(fn: (node: Node) => void): void {
    let current = this.#tail;
    while (current) {
      if (fn) {
        fn(current);
      }
      current = current.previous;
    }
  }

  length(): number {
    return this.#numberOfValues;
  }

  toString(): string {
    let string = "";
    let current = this.#head;
    while (current) {
      string += `${current.data} `;
      current = current.next;
    }
    return string.trim();
  }

  nodes() {
    let nodes = [];
    let current = this.#head;
    while (current) {
      nodes.push(current);
      current = current.next;
    }
    return nodes;
  }

  toJSON() {
    return {
      head: this.#head?.toJSON(),
      tail: this.#tail?.toJSON(),
    };
  }

  static fromJSON(json: DoublyLinkedListJSON): DoublyLinkedList {
    let doublyLinkedList = new DoublyLinkedList();
    json.head && doublyLinkedList.addToHead(Node.fromJSON(json.head));
    json.tail && doublyLinkedList.addToHead(Node.fromJSON(json.tail));
    return doublyLinkedList;
  }
}
