export enum Ordering {
  Lower = -1,
  Equal = 0,
  Greater = 1,
}

export interface IdJSON {
  num: number;
  replicaId: number;
  clock: number;
}

export class Id {
  #num: number;

  #replicaId: number;
  #clock: number;

  constructor(num: number, replicaId: number, clock: number) {
    this.#num = num;
    this.#replicaId = replicaId;
    this.#clock = clock;
  }

  get num(): number {
    return this.#num;
  }

  get replicaId(): number {
    return this.#replicaId;
  }

  set replicaId(replicaId: number) {
    this.#replicaId = replicaId;
  }

  get clock(): number {
    return this.#clock;
  }

  compare(other: Id): Ordering {
    if (this.num > other.num) {
      return Ordering.Greater;
    } else if (this.num < other.num) {
      return Ordering.Lower;
    } else {
      if (this.replicaId > other.replicaId) {
        return Ordering.Greater;
      } else if (this.replicaId < other.replicaId) {
        return Ordering.Lower;
      } else {
        if (this.clock > other.clock) {
          return Ordering.Greater;
        } else if (this.clock < other.clock) {
          return Ordering.Lower;
        } else {
          return Ordering.Equal;
        }
      }
    }
  }

  toString() {
    return `${this.#num}/${this.#replicaId}/${this.#clock}`;
  }

  toJSON(): IdJSON {
    return {
      num: this.#num,
      replicaId: this.#replicaId,
      clock: this.#clock,
    };
  }

  static fromJSON(jsonChar: IdJSON): Id {
    return new Id(jsonChar.num, jsonChar.replicaId, jsonChar.clock);
  }
}
