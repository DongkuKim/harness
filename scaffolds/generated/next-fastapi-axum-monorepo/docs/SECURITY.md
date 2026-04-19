# Security

This scaffold focuses on basic supply-chain and secret hygiene.

## Included Checks

- `gitleaks` for secret scanning
- `osv-scanner` for dependency vulnerability scanning
- `pnpm audit` for Node package alerts
- runtime-specific checks can add `pip-audit`, `cargo deny`, and `cargo audit`

## Expectations

- do not commit secrets
- keep dependencies current
