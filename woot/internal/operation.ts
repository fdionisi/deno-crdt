import { Char, CharJSON } from "./char.ts";

export interface OperationJSON {
  type: OperationType;
  char: CharJSON;
}

export enum OperationType {
  Insert,
  Delete,
}

export class Operation {
  #type: OperationType;
  #char: Char;

  constructor(type: OperationType, char: Char) {
    this.#type = type;
    this.#char = char;
  }

  get type(): OperationType {
    return this.#type;
  }

  get char(): Char {
    return this.#char;
  }

  toJSON(): OperationJSON {
    return {
      type: this.#type,
      char: this.#char.toJSON(),
    };
  }

  static fromJSON(operation: OperationJSON): Operation {
    let type = operation.type;
    return new Operation(type, Char.fromJSON(operation.char));
  }
}
