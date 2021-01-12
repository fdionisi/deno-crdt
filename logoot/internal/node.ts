import { Id, IdJSON, Ordering } from "./id.ts";

export interface NodeJSON {
  id?: IdJSON;
  value?: string;
  children: NodeJSON[];
  size: number;
  empty: boolean;
}

export class Node {
  #id: Id | null;
  #value: string | null;

  #parent: Node | null = null;

  #children: Node[] = [];
  #size: number = 1;

  #empty: boolean = false;

  constructor(id: Id | null, value: string | null = null) {
    this.#id = id;
    this.#value = value;
  }

  get id(): Id | null {
    return this.#id;
  }

  get length(): number {
    return this.#size - 2;
  }

  get value(): string | null {
    return this.#value;
  }

  set value(value: string | null) {
    this.#value = value;
  }

  addChild(child: Node): Node {
    child.#parent = this as any;
    let index = this.#leftmostSearch(child);
    this.#children.splice(index, 0, child);
    this.adjustSize(child.#size);
    return child;
  }

  adjustSize(amount: number): void {
    this.#size += amount;
    if (this.#parent) {
      this.#parent.adjustSize(amount);
    }
  }

  getChildById(id: Id): Node | null {
    let index = this.#exactSearchById(id);
    if (index == null) {
      return null;
    }

    return this.#children[index] || null;
  }

  getChildByOrder(index: number): Node | null {
    if (index === 0 && !this.#empty) {
      return this as any;
    }

    let left = this.#empty ? 0 : 1;
    let right = left;
    for (let i = 0; i < this.#children.length; i++) {
      right += this.#children[i].#size;
      if (left <= index && right > index) {
        return this.#children[i].getChildByOrder(index - left);
      }
      left = right;
    }

    return null;
  }

  getChildByPosition(position: Id[], build: boolean) {
    let current: Node | null = this;
    let next = null;

    position.every((id) => {
      next = current!.getChildById(id);
      if (!next && !build) {
        current = null;
        return false;
      }
      if (!next && build) {
        next = new Node(id);
        current!.addChild(next);
        next.setEmpty(true);
      }
      current = next;
      return true;
    });

    return current;
  }

  getOrder(): number {
    // -1 to discount the left end node
    if (!this.#parent) {
      return -1;
    }
    let order = this.#parent.getOrder();
    if (!this.#parent.#empty) {
      order += 1;
    }

    for (let i = 0; i < this.#parent.#children.length; i++) {
      if (this.#parent.#children[i].id!.compare(this.id!) === Ordering.Equal) {
        break;
      }
      order += this.#parent.#children[i].#size;
    }

    return order;
  }

  getPosition(): Id[] {
    if (!this.#parent) {
      return [];
    }
    return this.#parent.getPosition().concat([this.id!]);
  }

  isEmpty(): boolean {
    return this.#empty;
  }

  removeChild(child: Node): Node | null {
    let index = this.#exactSearch(child);
    if (index === null) {
      return null;
    }

    this.#children.splice(index, 1);
    this.adjustSize(child.#size);
    return child;
  }

  setEmpty(bool = true): void {
    if (bool === this.#empty) {
      return;
    }

    this.#empty = bool;
    if (bool) {
      this.adjustSize(-1);
    } else {
      this.adjustSize(1);
    }
  }

  toJSON(): NodeJSON {
    return {
      id: this.#id?.toJSON(),
      value: this.#value || undefined,
      children: this.#children.map((c) => c.toJSON()),
      size: this.#size,
      empty: this.#empty,
    };
  }

  trimEmpty(): void {
    if (!this.#parent) {
      return;
    }

    if (this.#empty && this.#children.length === 0) {
      this.#parent.removeChild(this);
      this.#parent.trimEmpty();
    }
  }

  walk(fn: (node: Node) => void): void {
    fn(this as any);
    this.#children.forEach((child) => {
      child.walk(fn);
    });
  }

  #exactSearch = (child: Node): number | null => {
    if (!child.id) {
      return null;
    }
    return this.#exactSearchById(child.id);
  };

  #exactSearchById = (id: Id): number | null => {
    let left: number = 0;
    let right: number = this.#children.length - 1;
    let middle: number;

    while (left <= right) {
      middle = Math.floor((left + right) / 2);
      switch (this.#children[middle].id!.compare(id)) {
        case Ordering.Lower: {
          left = middle + 1;
          break;
        }
        case Ordering.Greater: {
          right = middle - 1;
          break;
        }
        case Ordering.Equal: {
          return middle;
        }
      }
    }

    return null;
  };

  #leftmostSearch = (child: Node): number => {
    let left: number = 0;
    let right: number = this.#children.length;
    let middle: number;

    while (left < right) {
      middle = Math.floor((left + right) / 2);
      if (this.#children[middle].id!.compare(child.id!) === Ordering.Lower) {
        left = middle + 1;
      } else {
        right = middle;
      }
    }

    return left;
  };
}
