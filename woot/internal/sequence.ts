import { Char } from "./char.ts";
import { Id } from "./id.ts";
import { Operation, OperationType } from "./operation.ts";

type IdGenerator = () => Id;

type SubSequence = Array<Char>;

export class Sequence extends Array<Char> {
  #idGenerator: IdGenerator;

  #charById = new Map<string, Char>();

  #pool = new Set<Operation>();

  constructor(idGenerator: IdGenerator) {
    super();
    this.#idGenerator = idGenerator;
    this.push(
      ...Char.genesis().map((c) => {
        this.#charById.set(c.id.toString(), c);
        return c;
      }),
    );
  }

  localDelete(index: number): Operation | undefined {
    let char = this.#ithVisible(index);

    if (!char) {
      return;
    }

    let operation = new Operation(OperationType.Delete, char);
    this.#execute(operation);
    return operation;
  }

  localInsert(value: string, index: number): Operation | undefined {
    let prevChar = this.#ithVisible(index);
    let nextChar = this.#ithVisible(index + 1);

    if (!(prevChar && nextChar)) {
      return;
    }

    let operation = new Operation(
      OperationType.Insert,
      new Char(
        this.#idGenerator(),
        value,
        prevChar.id,
        nextChar.id,
      ),
    );

    this.#execute(operation);
    return operation;
  }

  receive = (operation: Operation): void => {
    if (this.#isExecutable(operation)) {
      this.#execute(operation);
    } else {
      this.#pool.add(operation);
    }
  };

  value(): string {
    return this.#visibleElements().map((char) => char.value).join("");
  }

  #contains = (char: Char): boolean => {
    return this.#charById.has(char.id.toString());
  };

  #execute = (operation: Operation): void => {
    if (operation.type === OperationType.Delete) {
      this.#integrateDelete(operation);
    } else {
      this.#integrateInsertion(operation);
    }

    // check pool after execution
    let op = [...this.#pool].find((x) => this.#isExecutable(x));
    if (!op) {
      return;
    }
    this.#pool.delete(op);
    this.#execute(op);
  };

  #ithVisible = (index: number): Char | undefined => {
    return this.#visibleElements()[index];
  };

  #insertInSequence = (character: Char, index: number): void => {
    this.splice(index, 0, character);
  };

  #integrateDelete = (operation: Operation): void => {
    let id = operation.char.id;
    if (id.replicaId === -1) {
      return;
    }

    let char = this.#charById.get(operation.char.id.toString());
    if (!char) {
      return;
    }

    char.visible = false;
  };

  #integrateInsertion = (op: Operation): void => {
    if (this.#contains(op.char)) {
      return;
    }

    let previous = this.#charById.get(op.char.previous.toString());
    let next = this.#charById.get(op.char.next.toString());

    if (!(previous && next)) {
      return;
    }

    this.#recursiveIntegrate(
      op.char,
      previous,
      next,
    );
  };

  #isExecutable = (op: Operation): boolean => {
    if (op.type === OperationType.Delete) {
      return this.#contains(op.char);
    } else {
      let previous = this.#charById.get(op.char.previous.toString());
      let next = this.#charById.get(op.char.next.toString());
      return Boolean(previous && next);
    }
  };

  #recursiveIntegrate = (char: Char, prev: Char, next: Char) => {
    let lowerBound = this.findIndex((c) => prev.id.equals(c.id));
    let upperBound = this.findIndex((c) => next.id.equals(c.id));

    let SP = this.#subSequence(lowerBound + 1, upperBound);

    if (SP.length === 0) {
      this.#insertInSequence(char, upperBound);
      this.#charById.set(char.id.toString(), char);
    } else {
      let L: Char[] = [];

      L.push(prev);

      SP.forEach((dChar) => {
        let dPrevChar = this.#charById.get(dChar.previous.toString());
        let dNextChar = this.#charById.get(dChar.next.toString());

        if (!(dPrevChar && dNextChar)) {
          return;
        }

        let dPrevIndex = SP.findIndex((c) => dPrevChar!.id.equals(c.id));
        let dNextIndex = SP.findIndex((c) => dNextChar!.id.equals(c.id));
        if (dPrevIndex <= lowerBound && dNextIndex <= upperBound) {
          L.push(dChar);
        }
      });

      L.push(next);

      let i = 1;
      while (i < L.length - 1 && L[i].id.isLessThan(char.id)) {
        i = i + 1;
      }

      this.#recursiveIntegrate(char, L[i - 1], L[i]);
    }
  };

  #subSequence = (start: number, end: number): SubSequence => {
    return this.slice(start, end);
  };

  #visibleElements = (): SubSequence => {
    return this.filter((char) => char.visible);
  };
}
