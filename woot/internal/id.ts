export interface IdJSON {
  replicaId: number;
  clock: number;
}

export class Id {
  #replicaId: number;
  #clock: number;

  constructor(replicaId: number, clock: number) {
    this.#replicaId = replicaId;
    this.#clock = clock;
  }

  get replicaId(): number {
    return this.#replicaId;
  }

  get clock(): number {
    return this.#clock;
  }

  toString() {
    return `${this.#replicaId}/${this.#clock}`;
  }

  equals(other: Id) {
    return this.#replicaId === other.#replicaId && this.#clock === other.#clock;
  }

  isLessThan(other: Id) {
    return this.#replicaId < other.#replicaId ||
      (this.#replicaId === other.#replicaId && this.#clock < other.#clock);
  }

  toJSON(): IdJSON {
    return {
      "replicaId": this.#replicaId,
      "clock": this.#clock,
    };
  }

  static fromJSON(jsonChar: IdJSON): Id {
    return new Id(jsonChar.replicaId, jsonChar.clock);
  }
}
