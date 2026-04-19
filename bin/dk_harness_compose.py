from __future__ import annotations

import json
import shutil
import stat
from dataclasses import dataclass
from pathlib import Path
from typing import Any


REPO_ROOT = Path(__file__).resolve().parent.parent
MODULES_ROOT = REPO_ROOT / "templates" / "modules"

BASE_PACKAGE_JSON = {
    "version": "0.0.1",
    "private": True,
    "scripts": {
        "build": "turbo build",
        "lint": "just lint",
        "typecheck": "just typecheck",
        "test": "just test",
        "ux": "just ux",
        "supply-chain": "just supply-chain",
        "ci": "just ci",
    },
    "devDependencies": {
        "@axe-core/playwright": "^4.11.0",
        "@biomejs/biome": "^1.9.4",
        "@lhci/cli": "^0.15.1",
        "@playwright/test": "^1.51.1",
        "@testing-library/jest-dom": "^6.8.0",
        "@testing-library/react": "^16.3.0",
        "@vitejs/plugin-react": "^5.0.4",
        "@workspace/eslint-config": "workspace:*",
        "@workspace/typescript-config": "workspace:*",
        "dependency-cruiser": "^17.1.0",
        "jsdom": "^26.1.0",
        "knip": "^5.44.4",
        "prettier": "^3.8.1",
        "prettier-plugin-tailwindcss": "^0.7.2",
        "start-server-and-test": "^3.0.2",
        "turbo": "^2.8.17",
        "typescript": "5.9.3",
        "vite-tsconfig-paths": "^5.1.4",
        "vitest": "^3.2.4",
    },
    "packageManager": "pnpm@9.15.9",
    "engines": {
        "node": ">=20",
    },
}


@dataclass(frozen=True)
class ModuleEmit:
    source: str
    target: str


@dataclass(frozen=True)
class ModuleDefinition:
    name: str
    kind: str
    runtime: str
    repeatable: bool
    default_app_id: str | None
    requires: tuple[str, ...]
    conflicts: tuple[str, ...]
    emits: tuple[ModuleEmit, ...]
    check_metadata: dict[str, Any]
    documentation: dict[str, Any]
    module_root: Path


@dataclass(frozen=True)
class ModuleInstance:
    definition: ModuleDefinition
    app_id: str | None

    @property
    def is_runnable(self) -> bool:
        return bool(self.definition.check_metadata.get("runnable"))

    @property
    def runtime(self) -> str:
        return self.definition.runtime

    @property
    def tokens(self) -> dict[str, str]:
        app_id = self.app_id or ""
        return {
            "__APP_ID__": app_id,
            "__APP_TITLE__": humanize_identifier(app_id) if app_id else "",
            "__APP_PACKAGE_NAME__": app_id,
            "__AXUM_PACKAGE_NAME__": f"{app_id}-server" if app_id else "axum-server",
        }


def humanize_identifier(value: str) -> str:
    if not value:
        return value

    special_words = {
        "api": "API",
        "axum": "Axum",
        "fastapi": "FastAPI",
        "nextjs": "Next.js",
        "web": "Web",
    }

    words = []
    for raw_word in value.replace("_", "-").split("-"):
        key = raw_word.lower()
        words.append(special_words.get(key, raw_word.capitalize()))
    return " ".join(words)


def slugify_project_name(value: str) -> str:
    cleaned = []
    for char in value.lower():
        if char.isalnum():
            cleaned.append(char)
            continue
        if char in {"-", "_"}:
            cleaned.append("-")
            continue
        cleaned.append("-")

    slug = "".join(cleaned).strip("-")
    while "--" in slug:
        slug = slug.replace("--", "-")
    return slug or "composable-monorepo"


def load_module_definitions() -> dict[str, ModuleDefinition]:
    definitions: dict[str, ModuleDefinition] = {}

    for manifest_path in sorted(MODULES_ROOT.glob("*/module.json")):
        payload = json.loads(manifest_path.read_text())
        emits = tuple(
            ModuleEmit(source=entry["source"], target=entry["target"])
            for entry in payload.get("emits", [])
        )
        definition = ModuleDefinition(
            name=payload["name"],
            kind=payload["kind"],
            runtime=payload["runtime"],
            repeatable=payload["repeatable"],
            default_app_id=payload.get("default_app_id"),
            requires=tuple(payload.get("requires", [])),
            conflicts=tuple(payload.get("conflicts", [])),
            emits=emits,
            check_metadata=payload.get("check_metadata", {}),
            documentation=payload.get("documentation", {}),
            module_root=manifest_path.parent,
        )
        definitions[definition.name] = definition

    return definitions


def parse_module_specs(module_specs: list[str], definitions: dict[str, ModuleDefinition]) -> list[ModuleInstance]:
    if not module_specs:
        raise SystemExit("At least one --module flag is required.")

    instances: list[ModuleInstance] = []
    seen_non_repeatable: set[str] = set()
    seen_app_ids: dict[str, str] = {}

    for raw_spec in module_specs:
        name, app_id = split_module_spec(raw_spec)
        definition = definitions.get(name)
        if definition is None:
            known = ", ".join(sorted(definitions))
            raise SystemExit(f"Unknown module: {name}\nKnown modules: {known}")

        if definition.repeatable:
            effective_app_id = app_id or definition.default_app_id
            if not effective_app_id:
                raise SystemExit(f"Module {name} requires an explicit app id.")
        else:
            if app_id:
                raise SystemExit(f"Module {name} does not accept an app id.")
            if name in seen_non_repeatable:
                raise SystemExit(f"Module {name} may only be selected once.")
            seen_non_repeatable.add(name)
            effective_app_id = definition.default_app_id

        if effective_app_id:
            owner = seen_app_ids.get(effective_app_id)
            if owner:
                raise SystemExit(
                    f"App id {effective_app_id!r} is already used by module {owner}; "
                    "all runnable module ids must be unique."
                )
            seen_app_ids[effective_app_id] = name

        instances.append(ModuleInstance(definition=definition, app_id=effective_app_id))

    validate_module_selection(instances)
    return instances


def split_module_spec(raw_spec: str) -> tuple[str, str | None]:
    if ":" not in raw_spec:
        return raw_spec, None
    name, app_id = raw_spec.split(":", 1)
    if not name or not app_id:
        raise SystemExit(f"Invalid module spec: {raw_spec!r}. Expected <module> or <module>:<app-id>.")
    return name, app_id


def validate_module_selection(instances: list[ModuleInstance]) -> None:
    selected_names = [instance.definition.name for instance in instances]
    core_count = selected_names.count("core-monorepo")
    if core_count != 1:
        raise SystemExit("Composition must include core-monorepo exactly once.")

    selected_name_set = set(selected_names)
    for instance in instances:
        missing = [name for name in instance.definition.requires if name not in selected_name_set]
        if missing:
            raise SystemExit(
                f"Module {instance.definition.name} requires: {', '.join(sorted(missing))}"
            )

        conflicts = [name for name in instance.definition.conflicts if name in selected_name_set]
        if conflicts:
            raise SystemExit(
                f"Module {instance.definition.name} conflicts with: {', '.join(sorted(conflicts))}"
            )


def ensure_destination(path: Path, force: bool) -> None:
    if not path.exists():
        path.parent.mkdir(parents=True, exist_ok=True)
        return

    if not path.is_dir():
        raise SystemExit(f"Destination exists and is not a directory: {path}")

    if any(path.iterdir()):
        if not force:
            raise SystemExit(
                f"Destination is not empty: {path}\nRe-run with --force to replace it."
            )
        shutil.rmtree(path)
        path.parent.mkdir(parents=True, exist_ok=True)


def compose_scaffold(instances: list[ModuleInstance], destination: Path, *, force: bool) -> None:
    ensure_destination(destination, force)
    destination.mkdir(parents=True, exist_ok=True)

    for instance in instances:
        for emit in instance.definition.emits:
            source_path = instance.definition.module_root / emit.source
            target_path = destination / replace_tokens(emit.target, instance.tokens)
            copy_path_with_tokens(source_path, target_path, instance.tokens)

    build_shared_root_files(instances, destination)


def copy_path_with_tokens(source: Path, destination: Path, tokens: dict[str, str]) -> None:
    if source.is_dir():
        for child in sorted(source.rglob("*")):
            relative_path = child.relative_to(source)
            rendered_relative_path = replace_tokens(str(relative_path), tokens)
            target_path = destination / rendered_relative_path

            if child.is_dir():
                target_path.mkdir(parents=True, exist_ok=True)
                continue

            target_path.parent.mkdir(parents=True, exist_ok=True)
            copy_file_with_tokens(child, target_path, tokens)
        return

    destination.parent.mkdir(parents=True, exist_ok=True)
    copy_file_with_tokens(source, destination, tokens)


def copy_file_with_tokens(source: Path, destination: Path, tokens: dict[str, str]) -> None:
    try:
        text = source.read_text()
    except UnicodeDecodeError:
        shutil.copy2(source, destination)
        return

    destination.write_text(replace_tokens(text, tokens))
    shutil.copystat(source, destination)


def replace_tokens(value: str, tokens: dict[str, str]) -> str:
    rendered = value
    for key, replacement in tokens.items():
        rendered = rendered.replace(key, replacement)
    return rendered


def build_shared_root_files(instances: list[ModuleInstance], destination: Path) -> None:
    project_name = slugify_project_name(destination.name)
    write_json(destination / "package.json", build_root_package_json(project_name, instances))
    (destination / "mise.toml").write_text(build_mise_toml(instances))
    (destination / "justfile").write_text(build_justfile(instances))
    (destination / "pnpm-workspace.yaml").write_text(build_pnpm_workspace())
    write_json(destination / "turbo.json", build_turbo_json())
    (destination / ".github" / "workflows").mkdir(parents=True, exist_ok=True)
    (destination / ".github" / "workflows" / "ci.yml").write_text(build_ci_workflow(instances))
    (destination / "README.md").write_text(build_readme(instances))
    (destination / "ARCHITECTURE.md").write_text(build_architecture(instances))
    (destination / "docs" / "RELIABILITY.md").write_text(build_reliability(instances))
    (destination / "AGENTS.md").write_text(build_agents())


def build_root_package_json(project_name: str, instances: list[ModuleInstance]) -> dict[str, Any]:
    package_json = json.loads(json.dumps(BASE_PACKAGE_JSON))
    package_json["name"] = project_name

    dev_filters = [instance.app_id for instance in instances if instance.definition.name == "frontend-nextjs"]
    dev_filters.extend(
        instance.app_id
        for instance in instances
        if instance.definition.name == "backend-fastapi"
    )

    if dev_filters:
        filters = " ".join(f"--filter={filter_name}" for filter_name in dev_filters)
        package_json["scripts"]["dev"] = f"turbo dev {filters}"
    else:
        package_json["scripts"]["dev"] = "echo \"No turbo-managed dev tasks are configured for this scaffold.\""

    if any(instance.definition.name == "frontend-nextjs" for instance in instances):
        package_json["scripts"]["format"] = "pnpm --filter web format"
    else:
        package_json["scripts"]["format"] = "echo \"No frontend module selected; nothing to format.\""

    return package_json


def build_mise_toml(instances: list[ModuleInstance]) -> str:
    lines = [
        "[tools]",
        'node = "20"',
        'pnpm = "9.15.9"',
    ]

    if any(instance.runtime == "python" for instance in instances):
        lines.extend(
            [
                'python = "3.11"',
                'uv = "latest"',
            ]
        )

    if any(instance.runtime == "rust" for instance in instances):
        lines.append('rust = "stable"')

    return "\n".join(lines) + "\n"


def build_justfile(instances: list[ModuleInstance]) -> str:
    has_frontend = any(instance.definition.name == "frontend-nextjs" for instance in instances)
    fastapi_instances = [instance for instance in instances if instance.definition.name == "backend-fastapi"]
    axum_instances = [instance for instance in instances if instance.definition.name == "backend-axum"]

    sections = ['set shell := ["bash", "-cu"]', ""]

    install_lines = [
        "mise install",
        "pnpm install",
    ]
    install_lines.extend(
        f"(cd apps/{instance.app_id} && uv sync --group dev)"
        for instance in fastapi_instances
    )
    if axum_instances:
        install_lines.extend(
            [
                "rustup toolchain install nightly --component rust-src",
                "cargo install cargo-nextest cargo-udeps cargo-deny cargo-audit --locked",
            ]
        )
    if has_frontend:
        install_lines.append("pnpm exec playwright install chromium")
    sections.extend(render_just_target("install", install_lines))

    lint_lines = []
    if has_frontend:
        lint_lines.extend(
            [
                "pnpm --filter web lint",
                "pnpm --dir packages/ui exec depcruise --config dependency-cruiser.cjs src",
            ]
        )
    lint_lines.extend(f"pnpm --filter {instance.app_id} lint" for instance in fastapi_instances)
    if axum_instances:
        app_paths = " ".join(f"apps/{instance.app_id}" for instance in axum_instances)
        lint_lines.append(f"node ./scripts/check-rust-layers.mjs {app_paths}")
        for instance in axum_instances:
            lint_lines.extend(
                [
                    f"(cd apps/{instance.app_id} && cargo fmt --check)",
                    f"(cd apps/{instance.app_id} && cargo clippy --all-targets --all-features -- -D warnings)",
                    f"(cd apps/{instance.app_id} && cargo +nightly udeps --all-targets)",
                ]
            )
    sections.extend(render_just_target("lint", lint_lines))

    typecheck_lines = []
    if has_frontend:
        typecheck_lines.append("pnpm --filter web typecheck")
    typecheck_lines.extend(f"pnpm --filter {instance.app_id} typecheck" for instance in fastapi_instances)
    typecheck_lines.extend(
        f"(cd apps/{instance.app_id} && cargo check --all-targets)" for instance in axum_instances
    )
    sections.extend(render_just_target("typecheck", typecheck_lines))

    test_lines = []
    if has_frontend:
        test_lines.append("pnpm --filter web test")
    test_lines.extend(f"pnpm --filter {instance.app_id} test" for instance in fastapi_instances)
    test_lines.extend(
        f"(cd apps/{instance.app_id} && cargo nextest run)" for instance in axum_instances
    )
    sections.extend(render_just_target("test", test_lines))

    if has_frontend:
        ux_lines = ["pnpm --filter web ux"]
    else:
        ux_lines = ['@echo "No UX-capable modules selected."']
    sections.extend(render_just_target("ux", ux_lines))

    supply_chain_lines = [
        "gitleaks dir . --config .gitleaks.toml",
        "osv-scanner scan source -r .",
        "pnpm audit --audit-level=high",
    ]
    supply_chain_lines.extend(
        f"pnpm --filter {instance.app_id} supply-chain" for instance in fastapi_instances
    )
    for instance in axum_instances:
        supply_chain_lines.extend(
            [
                f"(cd apps/{instance.app_id} && cargo deny check)",
                f"(cd apps/{instance.app_id} && cargo audit)",
            ]
        )
    sections.extend(render_just_target("supply-chain", supply_chain_lines))

    sections.extend(render_just_target("ci", ["lint", "typecheck", "test", "ux", "supply-chain"], depends=True))
    return "\n".join(sections).rstrip() + "\n"


def render_just_target(name: str, lines: list[str], *, depends: bool = False) -> list[str]:
    if depends:
        dependency_list = " ".join(lines)
        return [f"{name}: {dependency_list}", ""]

    rendered = [f"{name}:"]
    if lines:
        rendered.extend(f"  {line}" for line in lines)
    else:
        rendered.append('  @echo "Nothing to do."')
    rendered.append("")
    return rendered


def build_pnpm_workspace() -> str:
    return 'packages:\n  - "apps/*"\n  - "packages/*"\n'


def build_turbo_json() -> dict[str, Any]:
    return {
        "$schema": "https://turbo.build/schema.json",
        "ui": "tui",
        "tasks": {
            "build": {
                "dependsOn": ["^build"],
                "inputs": ["$TURBO_DEFAULT$", ".env*"],
                "outputs": [".next/**", "!.next/cache/**"],
            },
            "lint": {
                "dependsOn": ["^lint"],
            },
            "format": {
                "dependsOn": ["^format"],
            },
            "typecheck": {
                "dependsOn": ["^typecheck"],
            },
            "test": {
                "dependsOn": ["^test"],
            },
            "dev": {
                "cache": False,
                "persistent": True,
            },
        },
    }


def build_ci_workflow(instances: list[ModuleInstance]) -> str:
    has_frontend = any(instance.definition.name == "frontend-nextjs" for instance in instances)
    has_fastapi = any(instance.runtime == "python" for instance in instances)
    has_axum = any(instance.runtime == "rust" for instance in instances)
    fastapi_instances = [instance for instance in instances if instance.definition.name == "backend-fastapi"]

    lines = [
        "name: CI",
        "",
        "on:",
        "  pull_request:",
        "  push:",
        "    branches:",
        "      - main",
        "",
        "jobs:",
    ]

    lines.extend(render_ci_job("fast", instances, has_frontend, has_fastapi, has_axum, fastapi_instances))
    lines.extend(render_ci_job("test", instances, has_frontend, has_fastapi, has_axum, fastapi_instances))
    if has_frontend:
        lines.extend(render_ci_job("ux", instances, has_frontend, has_fastapi, has_axum, fastapi_instances))
    lines.extend(render_ci_job("supply-chain", instances, has_frontend, has_fastapi, has_axum, fastapi_instances))
    return "\n".join(lines) + "\n"


def render_ci_job(
    job_name: str,
    instances: list[ModuleInstance],
    has_frontend: bool,
    has_fastapi: bool,
    has_axum: bool,
    fastapi_instances: list[ModuleInstance],
) -> list[str]:
    lines = [
        f"  {job_name}:",
        "    runs-on: ubuntu-latest",
        "    steps:",
        "      - uses: actions/checkout@v4",
        "      - uses: actions/setup-node@v4",
        "        with:",
        "          node-version: 20",
    ]

    if job_name == "supply-chain":
        lines.extend(
            [
                "      - uses: actions/setup-go@v5",
                "        with:",
                '          go-version: "1.24"',
            ]
        )

    if has_fastapi:
        lines.extend(
            [
                "      - uses: actions/setup-python@v5",
                "        with:",
                '          python-version: "3.11"',
            ]
        )

    if has_axum:
        if job_name == "fast":
            lines.extend(
                [
                    "      - uses: dtolnay/rust-toolchain@nightly",
                    "        with:",
                    "          components: rustfmt,clippy,rust-src",
                ]
            )
        else:
            lines.extend(
                [
                    "      - uses: dtolnay/rust-toolchain@stable",
                ]
            )

    lines.extend(
        [
            "      - uses: extractions/setup-just@v2",
            "      - uses: pnpm/action-setup@v4",
            "        with:",
            "          version: 9.15.9",
        ]
    )

    if has_fastapi:
        lines.append("      - uses: astral-sh/setup-uv@v6")

    rust_tools = []
    if has_axum:
        if job_name == "fast":
            rust_tools = ["cargo-udeps"]
        elif job_name == "test":
            rust_tools = ["cargo-nextest"]
        elif job_name == "supply-chain":
            rust_tools = ["cargo-deny", "cargo-audit"]

    if rust_tools:
        lines.extend(
            [
                "      - uses: taiki-e/install-action@v2",
                "        with:",
                f"          tool: {','.join(rust_tools)}",
            ]
        )

    lines.append("      - run: pnpm install")

    if has_fastapi and job_name in {"fast", "test", "supply-chain"}:
        for instance in fastapi_instances:
            lines.append(f"      - run: (cd apps/{instance.app_id} && uv sync --group dev)")

    if job_name == "supply-chain":
        lines.extend(
            [
                "      - run: |",
                "          curl -fsSL https://github.com/gitleaks/gitleaks/releases/download/v8.30.1/gitleaks_8.30.1_linux_x64.tar.gz \\",
                '            | tar -xz -C "$RUNNER_TEMP"',
                '          install "$RUNNER_TEMP/gitleaks" /usr/local/bin/gitleaks',
                "      - run: |",
                "          curl -fsSL https://github.com/google/osv-scanner/releases/download/v2.3.5/osv-scanner_linux_amd64 \\",
                '            -o "$RUNNER_TEMP/osv-scanner"',
                '          install "$RUNNER_TEMP/osv-scanner" /usr/local/bin/osv-scanner',
            ]
        )

    if job_name == "ux":
        lines.extend(
            [
                "      - run: pnpm exec playwright install --with-deps chromium",
                "      - run: just ux",
            ]
        )
    elif job_name == "fast":
        lines.extend(
            [
                "      - run: just lint",
                "      - run: just typecheck",
            ]
        )
    elif job_name == "test":
        lines.append("      - run: just test")
    else:
        lines.append("      - run: just supply-chain")

    lines.append("")
    return lines


def build_readme(instances: list[ModuleInstance]) -> str:
    has_frontend = any(instance.definition.name == "frontend-nextjs" for instance in instances)
    fastapi_instances = [instance for instance in instances if instance.definition.name == "backend-fastapi"]
    axum_instances = [instance for instance in instances if instance.definition.name == "backend-axum"]
    app_paths = [f"`apps/{instance.app_id}`" for instance in runnable_instances(instances)]

    lines = [f"# {scaffold_title(instances)}", ""]

    if app_paths:
        lines.append(
            f"This scaffold ships a README-aligned harness for {', '.join(app_paths)}."
        )
    else:
        lines.append("This scaffold ships a README-aligned harness for the shared workspace packages.")
    lines.append("")
    lines.append(
        "The scaffold root `mise.toml` is the source of truth for the local toolchain; "
        "run `mise install` before `just install` if you are not already inside a mise-managed shell."
    )
    lines.extend(
        [
            "",
            "## Harness Commands",
            "",
            "Run all top-level checks from the scaffold root:",
            "",
            "```bash",
            "just install",
            "just lint",
            "just typecheck",
            "just test",
            "just ux",
            "just supply-chain",
            "just ci",
            "```",
            "",
            "`packages/ui` is still generated and updated through `shadcn` commands, but its internal layer boundaries are checked as part of the harness.",
            "",
            "## What Each Lane Covers",
            "",
            f"- `just lint`: {readme_lane_summary('lint', instances)}",
            f"- `just typecheck`: {readme_lane_summary('typecheck', instances)}",
            f"- `just test`: {readme_lane_summary('test', instances)}",
            f"- `just ux`: {readme_lane_summary('ux', instances)}",
            f"- `just supply-chain`: {readme_lane_summary('supply-chain', instances)}",
        ]
    )

    if app_paths:
        lines.extend(["", "## Apps", ""])
        for instance in runnable_instances(instances):
            lines.append(f"- `apps/{instance.app_id}`: {instance.definition.documentation['app_summary']}")

    if has_frontend:
        lines.extend(
            [
                "",
                "## Adding Components",
                "",
                "To add components to your app, run the following command at the root of your `web` app:",
                "",
                "```bash",
                "pnpm dlx shadcn@latest add button -c apps/web",
                "```",
                "",
                "This places generated UI components in `packages/ui/src/ui`.",
                "",
                "## Using Components",
                "",
                "Import shared components from the `ui` package.",
                "",
                "```tsx",
                'import { Button } from "@workspace/ui/ui/button"',
                "```",
            ]
        )

    if fastapi_instances:
        lines.extend(["", "## Running The FastAPI Backends", ""])
        for instance in fastapi_instances:
            lines.extend(
                [
                    f"Start `apps/{instance.app_id}` from the monorepo root:",
                    "",
                    "```bash",
                    f"pnpm --filter {instance.app_id} dev",
                    "```",
                    "",
                    "Or run it directly from the Python app:",
                    "",
                    "```bash",
                    f"cd apps/{instance.app_id}",
                    "uv run fastapi dev app/main.py",
                    "```",
                    "",
                ]
            )

    if axum_instances:
        lines.extend(["", "## Running The Axum Backends", ""])
        for instance in axum_instances:
            lines.extend(
                [
                    "```bash",
                    f"cd apps/{instance.app_id}",
                    "cargo run",
                    "```",
                    "",
                ]
            )

    return "\n".join(lines).rstrip() + "\n"


def readme_lane_summary(lane: str, instances: list[ModuleInstance]) -> str:
    has_frontend = any(instance.definition.name == "frontend-nextjs" for instance in instances)
    fastapi_instances = [instance for instance in instances if instance.definition.name == "backend-fastapi"]
    axum_instances = [instance for instance in instances if instance.definition.name == "backend-axum"]

    parts: list[str] = []
    if lane == "lint":
        if has_frontend:
            parts.append("Biome, dependency-cruiser, and knip for `apps/web`; dependency-cruiser layer checks for `packages/ui`")
        if fastapi_instances:
            parts.extend(
                f"Ruff, deptry, and import-linter for `apps/{instance.app_id}`"
                for instance in fastapi_instances
            )
        if axum_instances:
            parts.extend(
                f"a custom Rust layer boundary check plus rustfmt, clippy, and cargo-udeps for `apps/{instance.app_id}`"
                for instance in axum_instances
            )
    elif lane == "typecheck":
        if has_frontend:
            parts.append("`tsc --noEmit` for `apps/web`")
        parts.extend(
            f"`basedpyright` for `apps/{instance.app_id}`"
            for instance in fastapi_instances
        )
        parts.extend(
            f"`cargo check` for `apps/{instance.app_id}`"
            for instance in axum_instances
        )
    elif lane == "test":
        if has_frontend:
            parts.append("Vitest smoke coverage for `apps/web`")
        parts.extend(
            f"`pytest` coverage for `apps/{instance.app_id}`"
            for instance in fastapi_instances
        )
        parts.extend(
            f"`cargo nextest` coverage for `apps/{instance.app_id}`"
            for instance in axum_instances
        )
    elif lane == "ux":
        if has_frontend:
            parts.append("Playwright, axe, and Lighthouse against the running Next.js app")
        else:
            parts.append("no-op when no UX-capable modules are selected")
    elif lane == "supply-chain":
        parts.append("gitleaks, osv-scanner, and `pnpm audit`")
        parts.extend(
            f"`pip-audit` for `apps/{instance.app_id}`"
            for instance in fastapi_instances
        )
        parts.extend(
            f"`cargo deny` and `cargo audit` for `apps/{instance.app_id}`"
            for instance in axum_instances
        )

    return "; ".join(parts)


def build_architecture(instances: list[ModuleInstance]) -> str:
    has_frontend = any(instance.definition.name == "frontend-nextjs" for instance in instances)
    fastapi_instances = [instance for instance in instances if instance.definition.name == "backend-fastapi"]
    axum_instances = [instance for instance in instances if instance.definition.name == "backend-axum"]

    lines = [
        "# Architecture",
        "",
        "## Repository Shape",
        "",
        "- `packages/ui`: the shared UI package used by runnable apps",
        "- `packages/eslint-config`: shared lint config",
        "- `packages/typescript-config`: shared TypeScript config",
    ]

    if has_frontend:
        lines.insert(4, "- `apps/web`: the main Next.js application")
    for instance in fastapi_instances:
        lines.insert(4, f"- `apps/{instance.app_id}`: a FastAPI backend service")
    for instance in axum_instances:
        lines.insert(4, f"- `apps/{instance.app_id}`: an Axum backend service")

    if has_frontend:
        lines.extend(
            [
                "",
                "## Web App Layers",
                "",
                "`apps/web` uses `dependency-cruiser` to enforce:",
                "",
                "- `app`",
                "- `components`",
                "- `hooks`",
                "- `lib`",
                "",
                "The important constraints are:",
                "",
                "- `components` must not import `app`",
                "- `hooks` may only import `lib`",
                "- `lib` stays leaf-like",
            ]
        )

    lines.extend(
        [
            "",
            "## Shared UI Domain Stack",
            "",
            "`packages/ui` follows the business-domain stack:",
            "",
            "- `Types`",
            "- `Config`",
            "- `Repo`",
            "- `Service`",
            "- `Runtime`",
            "- `UI`",
            "",
            "Cross-cutting concerns must enter through:",
            "",
            "- `src/providers`",
            "",
            "Provider-only support code lives in:",
            "",
            "- `src/utils`",
            "",
            "The stack is mechanically enforced by `packages/ui/dependency-cruiser.cjs`.",
        ]
    )

    if fastapi_instances:
        lines.extend(
            [
                "",
                "## FastAPI Service Layers",
                "",
                "Each FastAPI app uses a directional split enforced by `import-linter`:",
                "",
                "- `app.api`",
                "- `app.core`",
                "- `app.domain`",
                "",
                "Lower layers must not import higher ones.",
            ]
        )
        lines.extend(f"- applies to `apps/{instance.app_id}`" for instance in fastapi_instances)

    if axum_instances:
        lines.extend(
            [
                "",
                "## Rust Service Layers",
                "",
                "Each Axum service uses a directional backend split:",
                "",
                "- `api`",
                "- `core`",
                "- `domain`",
                "",
                "Lower layers must not import higher ones.",
                "`src/main.rs` stays focused on startup and bootstrapping.",
                "",
                "The Rust layer check lives in `scripts/check-rust-layers.mjs` and is run against the selected Axum app paths.",
            ]
        )

    if not fastapi_instances and not axum_instances:
        lines.extend(
            [
                "",
                "## No Backend By Default",
                "",
                "This scaffold does not include a separate API server or database by default.",
            ]
        )

    return "\n".join(lines).rstrip() + "\n"


def build_reliability(instances: list[ModuleInstance]) -> str:
    has_frontend = any(instance.definition.name == "frontend-nextjs" for instance in instances)
    fastapi_instances = [instance for instance in instances if instance.definition.name == "backend-fastapi"]
    axum_instances = [instance for instance in instances if instance.definition.name == "backend-axum"]

    lines = [
        "# Reliability",
        "",
        "## Local Commands",
        "",
        "Run from the repository root. The committed `mise.toml` pins the local toolchain, so `mise install` should come first on a fresh machine:",
        "",
        "```bash",
        "mise install",
        "just install",
        "pnpm dev",
        "just lint",
        "just typecheck",
        "just test",
        "just ux",
        "just supply-chain",
        "just ci",
        "```",
    ]

    if fastapi_instances:
        lines.extend(
            [
                "",
                "Run a FastAPI app directly when needed:",
                "",
                "```bash",
            ]
        )
        lines.extend(f"pnpm --filter {instance.app_id} dev" for instance in fastapi_instances)
        lines.extend(["```"])

    if axum_instances:
        lines.extend(
            [
                "",
                "Run an Axum service directly when needed:",
                "",
                "```bash",
            ]
        )
        for instance in axum_instances:
            lines.extend([f"cd apps/{instance.app_id}", "cargo run"])
        lines.extend(["```"])

    lines.extend(
        [
            "",
            "## Lane Responsibilities",
            "",
            f"- `just lint`: {readme_lane_summary('lint', instances)}",
            f"- `just typecheck`: {readme_lane_summary('typecheck', instances)}",
            f"- `just test`: {readme_lane_summary('test', instances)}",
            f"- `just ux`: {readme_lane_summary('ux', instances)}",
            f"- `just supply-chain`: {readme_lane_summary('supply-chain', instances)}",
            "",
            "## CI",
            "",
            "GitHub Actions uses the generated lanes defined in `.github/workflows/ci.yml`.",
            "",
            "## Doc Gardening",
            "",
            "Doc gardening is a repeated manual task tracked in `docs/exec-plans/repeated-work.md`.",
        ]
    )
    return "\n".join(lines).rstrip() + "\n"


def build_agents() -> str:
    return "\n".join(
        [
            "# Project Context",
            "",
            "This file is a short table of contents for the scaffold knowledge base.",
            "",
            "## Architecture",
            "",
            "System structure and enforced dependency layers: [ARCHITECTURE.md](ARCHITECTURE.md)",
            "",
            "## Design",
            "",
            "Design notes and core beliefs: [docs/DESIGN.md](docs/DESIGN.md), [docs/design-docs/index.md](docs/design-docs/index.md)",
            "",
            "## Frontend",
            "",
            "Frontend conventions, UI package structure, and shared component rules: [docs/FRONTEND.md](docs/FRONTEND.md)",
            "",
            "## Product",
            "",
            "Starter goals and onboarding expectations: [docs/PRODUCT_SENSE.md](docs/PRODUCT_SENSE.md), [docs/product-specs/index.md](docs/product-specs/index.md)",
            "",
            "## Plans",
            "",
            "Execution plans and tech debt tracking: [docs/PLANS.md](docs/PLANS.md), [docs/exec-plans/tech-debt-tracker.md](docs/exec-plans/tech-debt-tracker.md)",
            "",
            "## Reliability",
            "",
            "Build, test, CI, and operational expectations: [docs/RELIABILITY.md](docs/RELIABILITY.md)",
            "",
            "## Quality And Security",
            "",
            "Quality rubric and security posture: [docs/QUALITY_SCORE.md](docs/QUALITY_SCORE.md), [docs/SECURITY.md](docs/SECURITY.md)",
            "",
            "## References And Generated Artifacts",
            "",
            "Reference material and generated snapshots: [docs/references/design-system-reference-llms.txt](docs/references/design-system-reference-llms.txt), [docs/generated/db-schema.md](docs/generated/db-schema.md)",
            "",
        ]
    )


def scaffold_title(instances: list[ModuleInstance]) -> str:
    has_frontend = any(instance.definition.name == "frontend-nextjs" for instance in instances)
    fastapi_count = sum(1 for instance in instances if instance.definition.name == "backend-fastapi")
    axum_count = sum(1 for instance in instances if instance.definition.name == "backend-axum")

    parts = []
    if has_frontend:
        parts.append("Next.js")
    if fastapi_count == 1:
        parts.append("FastAPI")
    elif fastapi_count > 1:
        parts.append(f"{fastapi_count}x FastAPI")
    if axum_count == 1:
        parts.append("Axum")
    elif axum_count > 1:
        parts.append(f"{axum_count}x Axum")

    if not parts:
        return "Composable Monorepo Scaffold"
    return " + ".join(parts) + " Monorepo Scaffold"


def runnable_instances(instances: list[ModuleInstance]) -> list[ModuleInstance]:
    return [instance for instance in instances if instance.is_runnable]


def write_json(path: Path, payload: dict[str, Any]) -> None:
    path.write_text(json.dumps(payload, indent=2) + "\n")

