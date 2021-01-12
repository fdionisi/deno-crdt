export interface KeyJSON {
  replicaId: number;
  session: number;
  ssv: number;
  offset: number;
  length: number;
}

export class Key {
  #replicaId: number;
  #session: number;
  #ssv: number;
  #offset: number;
  #length: number;

  constructor(
    replicaId: number,
    session: number,
    ssv: number,
    offset: number,
    length: number,
  ) {
    this.#session = session;
    this.#ssv = ssv;
    this.#replicaId = replicaId;
    this.#offset = offset;
    this.#length = length;
  }

  get replicaId(): number {
    return this.#replicaId;
  }

  get session(): number {
    return this.#session;
  }

  get ssv(): number {
    return this.#ssv;
  }

  get offset(): number {
    return this.#offset;
  }

  get length(): number {
    return this.#length;
  }

  setLength(length: number): void {
    this.#length = length;
  }

  setOffset(offset: number): void {
    this.#offset = offset;
  }

  toJSON(): KeyJSON {
    return {
      replicaId: this.#replicaId,
      session: this.#session,
      ssv: this.#ssv,
      offset: this.#offset,
      length: this.#length,
    };
  }

  toString(): string {
    return [
      this.#replicaId,
      this.#session,
      this.#ssv,
      this.#offset,
      this.#length,
    ].join(",");
  }

  static fromJSON(json: KeyJSON): Key {
    return new Key(
      json.replicaId,
      json.session,
      json.ssv,
      json.offset,
      json.length,
    );
  }

  static fromString(key: string): Key {
    let [replicaId, session, ssv, offset, length] = key.split(",").map((k) =>
      parseInt(k)
    );
    return new Key(replicaId!, session!, ssv!, offset!, length!);
  }
}
