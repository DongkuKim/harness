# __APP_TITLE__

FastAPI app for the composable monorepo scaffold.

## Commands

```bash
uv run fastapi dev app/main.py
uv run fastapi run app/main.py
uv run ruff check .
uv run ruff format .
uv run basedpyright
uv run deptry .
uv run lint-imports
uv run pytest -n auto
tmp=$(mktemp) && uv export --format requirements-txt --group dev --no-hashes > "$tmp" && uvx pip-audit -r "$tmp"; status=$?; rm -f "$tmp"; exit $status
```
