import { Id, IdJSON } from "./id.ts";

export interface OperationJSON {
  type: OperationType;
  replicaId: number;
  position: IdJSON[];
  value?: string;
}

export enum OperationType {
  Insert,
  Delete,
}

export class Operation {
  #type: OperationType;
  #replicaId: number;
  #position: Id[];
  #value?: string;

  constructor(
    type: OperationType,
    replicaId: number,
    position: Id[],
    value?: string,
  ) {
    this.#type = type;
    this.#replicaId = replicaId;
    this.#position = position;
    this.#value = value;
  }

  get type(): OperationType {
    return this.#type;
  }

  get replicaId(): number {
    return this.#replicaId;
  }

  get position(): Id[] {
    return this.#position.slice();
  }

  get value(): string | undefined {
    return this.#value;
  }

  equalPosition(other: Operation): boolean {
    if (this.#position.length !== other.#position.length) {
      return false;
    }

    return !this.#position.some((id, index) => {
      return id.compare(other.#position[index]) !== 0;
    });
  }

  toJSON(): OperationJSON {
    return {
      type: this.#type,
      replicaId: this.#replicaId,
      position: this.#position.map((i) => i.toJSON()),
      value: this.#value,
    };
  }

  static fromJSON(operation: OperationJSON): Operation {
    let type = operation.type;
    let replicaId = operation.replicaId;
    let position = operation.position.map(Id.fromJSON);
    let value = operation.value;
    return new Operation(type, replicaId, position, value);
  }
}
