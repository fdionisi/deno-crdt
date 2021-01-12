import { Key, KeyJSON } from "./key.ts";

export interface DataJSON {
  key: KeyJSON;
  value: string;
  visible: number;
  flag?: number;
  list: NodeJSON[];
}

export interface NodeJSON {
  data: any;
  previous?: NodeJSON;
  next?: NodeJSON;
}

export class Data {
  #key: Key;
  #value: string;
  #visible: number;
  #flag?: number;
  #list: Node[];

  constructor(
    key: Key,
    value: string,
    visible: number,
    flag?: number,
    list: Node[] = [],
  ) {
    this.#key = key;
    this.#value = value;
    this.#visible = visible;
    this.#list = list;
  }

  get key(): Key {
    return this.#key;
  }

  get value(): string {
    return this.#value;
  }

  get visible(): number {
    return this.#visible;
  }

  get flag(): number | undefined {
    return this.#flag;
  }

  get list(): Node[] {
    return this.#list;
  }

  setFlag(flag: number): void {
    this.#flag = flag;
  }

  setList(list: Node[]): void {
    this.#list = list;
  }

  setValue(value: string): void {
    this.#value = value;
  }

  setVisible(visible: number): void {
    this.#visible = visible;
  }

  toJSON(): DataJSON {
    return {
      key: this.#key.toJSON(),
      value: this.#value,
      visible: this.#visible,
      flag: this.#flag,
      list: this.#list.map((node) => node.toJSON()),
    };
  }

  static fromJSON(json: DataJSON): Data {
    return new Data(
      Key.fromJSON(json.key),
      json.value,
      json.visible,
      json.flag,
      json.list.map((node) => Node.fromJSON(node)),
    );
  }
}

export class Node {
  #data: Data;

  #previous: Node | null = null;
  #next: Node | null = null;

  constructor(data: Data) {
    this.#data = data;
  }

  get data(): Data {
    return this.#data;
  }

  get previous(): Node | null {
    return this.#previous;
  }

  get next(): Node | null {
    return this.#next;
  }

  setPrevious(previous: Node | null) {
    this.#previous = previous;
  }

  setNext(next: Node | null) {
    this.#next = next;
  }

  toJSON(): NodeJSON {
    return {
      data: this.#data.toJSON(),
      previous: this.previous?.toJSON(),
      next: this.next?.toJSON(),
    };
  }

  static fromJSON(json: NodeJSON): Node {
    let node = new Node(Data.fromJSON(json.data));
    json.next && node.setNext(Node.fromJSON(json.next));
    json.previous && node.setPrevious(Node.fromJSON(json.previous));

    return node;
  }
}
