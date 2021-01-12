export type CrdtClass<T, O> = new (
  replicaId: number,
  dispatchOperation: (ops: O[]) => void,
) => Crdt<T, O>;

export interface Crdt<T, O> {
  readonly replicaId: number;
  readonly length: number;

  insert(value: T, position: number): void;
  delete(index: number, length?: number): void;

  toString(): string;

  applyOperations(ops: O[]): void;
}

export type DispatchOperation<O> = (ops: O[]) => void;

export type Maybe<T> = T | null | undefined;
