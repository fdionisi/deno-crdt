export class VectorClock {
  #clocks = new Map<number, number>();

  increment(nodeId: number): void {
    if (this.#clocks.has(nodeId)) {
      this.#clocks.set(nodeId, this.#clocks.get(nodeId)! + 1);
    } else {
      this.#clocks.set(nodeId, 1);
    }
  }

  value(nodeId: number): number | undefined {
    return this.#clocks.get(nodeId);
  }

  sum() {
    let clocks = [...this.#clocks.values()];
    if (clocks.length === 0) {
      return 0;
    } else {
      return clocks.reduce((a, b) => a + b);
    }
  }
}
