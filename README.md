# Collection of CRDT written in TypeScript

## Implementation
-   [x] [Woot](woot/mod.ts)
    Implementation of [Oster et al.](https://hal.inria.fr/inria-00071240/document) algorithm.

    Code inspired by:
    -   https://github.com/siuying/woot-doc
    -   https://github.com/t-mullen/woot-crdt
    -   https://github.com/TGOlson/woot-js

-   [x] [Logoot](logoot/mod.ts)
    Implementation of [Weiss et al.](https://hal.inria.fr/inria-00432368/document) algorithm.

    Code inspired by:
    -   https://github.com/t-mullen/logoot-crdt

-   [ ] RGA (In progress)

-   [ ] Chronofold

## Development
```sh
# Test algorithms
deno test

# Run benchmarks
deno run benches/crdt.ts
```