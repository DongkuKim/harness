# Security

This starter focuses on basic supply-chain and secret hygiene.

## Included Checks

- `gitleaks` for secret scanning
- `osv-scanner` for dependency vulnerability scanning
- `pnpm audit` for Node package alerts

## Expectations

- do not commit secrets
- keep dependencies current
- prefer explicit provider boundaries for auth, telemetry, and feature flags
