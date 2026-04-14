set shell := ["bash", "-cu"]

install:
  mise install

self-check:
  npm run repo:self-check

supply-chain:
  npm run repo:supply-chain

ci: self-check supply-chain
