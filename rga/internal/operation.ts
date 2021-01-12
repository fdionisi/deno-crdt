import { Key, KeyJSON } from "./key.ts";

export type OperationInsert = OperationMessage<
  OperationType.Insert,
  { value: string }
>;
export type OperationDelete = OperationMessage<
  OperationType.Delete,
  { delLength: number; keyList: Key[] }
>;

export type Operation =
  | OperationInsert
  | OperationDelete;

export enum OperationType {
  Insert,
  Delete,
}
export interface OperationJSON {
  type: OperationType;
  replicaId: number;
  targetKey: KeyJSON;
  position: number;
  data: any;
  key: KeyJSON;
}

export class OperationMessage<T extends OperationType, D> {
  #type: T;
  #replicaId: number;
  #targetKey: Key;
  #position: number;
  #data: D;
  #key: Key;

  constructor(
    type: T,
    replicaId: number,
    targetKey: Key,
    position: number,
    data: any,
    key: Key,
  ) {
    this.#type = type;
    this.#replicaId = replicaId;
    this.#targetKey = targetKey;
    this.#position = position;
    this.#data = data;
    this.#key = key;
  }

  get type(): T {
    return this.#type;
  }

  get replicaId(): number {
    return this.#replicaId;
  }

  get targetKey(): Key {
    return this.#targetKey;
  }

  get position(): number {
    return this.#position;
  }

  get data(): D {
    return this.#data;
  }

  get key(): Key {
    return this.#key;
  }

  toJSON(): OperationJSON {
    return {
      type: this.#type,
      replicaId: this.#replicaId,
      targetKey: this.#targetKey.toJSON(),
      position: this.#position,
      data: this.#data,
      key: this.#key.toJSON(),
    };
  }

  static fromJSON(operation: OperationJSON): OperationMessage<any, any> {
    let type = operation.type;
    let replicaId = operation.replicaId;
    return new OperationMessage(
      type,
      replicaId,
      Key.fromJSON(operation.targetKey),
      operation.position,
      operation.data,
      Key.fromJSON(operation.key),
    );
  }
}
