import { Id, IdJSON } from "./id.ts";

export interface CharJSON {
  id: IdJSON;
  visible: boolean;
  value: string;
  previous: IdJSON;
  next: IdJSON;
}

export class Char {
  #id: Id;
  #value: string;
  #visible: boolean;
  #previous: Id;
  #next: Id;

  constructor(id: Id, value: string, previous: Id, next: Id) {
    this.#id = id;
    this.#value = value;
    this.#previous = previous;
    this.#next = next;
    this.#visible = true;
  }

  get id(): Id {
    return this.#id;
  }

  get visible(): boolean {
    return this.#visible;
  }

  set visible(value: boolean) {
    this.#visible = value;
  }

  get value(): string {
    return this.#value;
  }

  get previous(): Id {
    return this.#previous;
  }

  get next(): Id {
    return this.#next;
  }

  toJSON(): CharJSON {
    return {
      id: this.#id.toJSON(),
      value: this.#value,
      previous: this.#previous.toJSON(),
      next: this.#next.toJSON(),
      visible: this.#visible,
    };
  }

  static fromJSON(json: CharJSON): Char {
    let id = Id.fromJSON(json.id);
    let previous = Id.fromJSON(json.previous);
    let next = Id.fromJSON(json.next);
    let char = new Char(id, json.value, previous, next);
    char.#visible = json.visible;
    return char;
  }

  static genesis(): [Char, Char] {
    return [Char.begin(), Char.end()];
  }

  private static begin() {
    let id = new Id(-1, 0);
    return new Char(id, "", id, id);
  }

  private static end() {
    let id = new Id(-1, 1);
    return new Char(id, "", id, id);
  }
}
