# Go Fiber Generator — README

Professional Go Fiber backend generator. This repository contains a set of Python generators and Jinja2 templates that produce a complete Go project scaffold (config, models, repositories, DTOs, controllers, middleware, infra, web templates, docs, etc.).

## Quick links
- Generator orchestrator: [`MasterGenerator`](master_generator.py) — see [master_generator.py](master_generator.py)  
- Main configuration: [master_config.yaml](master_config.yaml)  
- App generator: [app_generate.py](app_generate.py)  
- Model/repo/dto generator: [`ModelGenerator.generate_all`](repo_model_config_generate.py) — see [repo_model_config_generate.py](repo_model_config_generate.py)  
- Route documentation generator: [`RouteGenerator.generate`](routes.py) — see [routes.py](routes.py)  
- Templates directory: [`tool/templates`](tool/templates)  
- Format helper: [format_generated_code.py](format_generated_code.py)  
- Example infra README template: [tool/templates/infra/README.md.j2](tool/templates/infra/README.md.j2)

---

## Overview

This workspace is a generator toolset that reads a YAML configuration (canonical: [master_config.yaml](master_config.yaml)) and renders a ready-to-run Go backend using Jinja2 templates under `tool/templates/`. The generator is split into focused scripts so you can run full generation or only the parts you need.

Main capabilities:
- Generate app scaffold (config, database, main, routes, infra) — via [app_generate.py](app_generate.py)
- Generate models, repositories, DTOs, responses — via [repo_model_config_generate.py](repo_model_config_generate.py)
- Generate authentication (JWT, email/password, social, web) — via [auth_generate.py](auth_generate.py)
- Generate RBAC service and controller — via [rbac_generate.py](rbac_generate.py)
- Generate IMAP, chat/websocket, notifications — via [imap_generate.py](imap_generate.py) and [chat_websocket_genrator.py](chat_websocket_genrator.py)
- Generate middleware code and docs — via [middleware_generator.py](middleware_generator.py)
- Helpers (storage, FCM, email) — via [storage_generate.py](storage_generate.py) and related scripts

---

## Prerequisites

- Python 3.8+
- Jinja2 and PyYAML installed (used by the generators)
- Go toolchain for the generated project (go 1.20+ recommended)
- Optional: Docker for container builds

Install Python deps quickly:
```bash
python -m pip install jinja2 pyyaml
```

---

## Quickstart — Generate full project

1. Edit your configuration: start from [master_config.yaml](master_config.yaml).
2. Run the master orchestrator to generate all parts:

```bash
python master_generator.py --config master_config.yaml --output ./generated
```

`master_generator.py` calls the individual generators in order (see the class [`MasterGenerator`](master_generator.py)). The generated project will be placed in `./generated/` by default.

---

## Run single generators

- App scaffold:
```bash
python app_generate.py --config master_config.yaml --templates ./tool/templates --output ./generated
```

- Models / Repos / DTOs / Controllers:
```bash
python repo_model_config_generate.py --config master_config.yaml --templates ./tool/templates --output ./generated --module github.com/your/module
```
See [`ModelGenerator.generate_all`](repo_model_config_generate.py) for how models/controllers are produced.

- Auth:
```bash
python auth_generate.py --config master_config.yaml --templates ./tool/templates --output ./generated
```

- Middleware docs:
```bash
python middleware_generator.py --config master_config.yaml --templates ./tool/templates --output ./generated --docs
```

- Route documentation:
```bash
python routes.py --auth-config authenticaton_config.yaml --chat-config chat_noti_web.yaml --middleware-config middleware_config.yaml --repo-config repo_model_config.yaml -o complete_routes.yaml
```
See [`RouteGenerator.generate`](routes.py).

---

## Templates and customization

- Templates live in: `tool/templates`. Inspect and modify to change the generated Go code and web templates.
  - Example: `tool/templates/pkg/dto/dto.go.j2` generates DTO structs.
  - Example infra templates: `tool/templates/infra/*` (Dockerfile, Makefile, README, .gitignore)
- The generator functions use Jinja2; keep the template variables in sync with your `master_config.yaml`.

---

## Generated project notes

- The generated Go project expects standard layout per `tool/templates/infra/README.md.j2`.
- To run the generated app:
  - Change to generated folder:
    ```bash
    cd generated
    go mod tidy
    go run ./cmd/server/main.go
    ```
  - Or use the generated `Makefile`:
    ```bash
    make run
    ```

- To format generated Go code run the included formatter script:
```bash
python format_generated_code.py ./generated
```

---

## Files of interest in this workspace

- [master_generator.py](master_generator.py) — master orchestrator that runs all generators
- [master_config.yaml](master_config.yaml) — canonical configuration used by generators
- [app_generate.py](app_generate.py) — creates top-level app scaffold (config, main, infra)
- [repo_model_config_generate.py](repo_model_config_generate.py) — generates models, repos, DTOs, controllers
- [auth_generate.py](auth_generate.py), [rbac_generate.py](rbac_generate.py), [imap_generate.py](imap_generate.py)
- [middleware_generator.py](middleware_generator.py) — middleware code + docs
- [routes.py](routes.py) — generate consolidated route documentation
- [tool/templates](tool/templates) — Jinja2 templates used to render Go project
- [format_generated_code.py](format_generated_code.py) — helper to format generated .go files
- [.gitignore](.gitignore) — repository ignore rules (generated infra also includes a `.gitignore` template)

---

## Contributing

- Update or add templates in `tool/templates` and test by running the appropriate generator.
- Keep `master_config.yaml` up-to-date and add configuration examples under `configexample/`.
- When adding new generator scripts, follow existing patterns (build_context, get_templates, run/render_all).

---

## Troubleshooting

- Missing template errors: confirm `--templates` path points to `tool/templates`.
- Template variable errors: inspect the config keys used by the template and ensure defaults exist in the generator's `build_context`.
- If a generator aborts, check its printed error and the stack trace — generators exit with a non-zero code on fatal template/write errors.

---

## License

MIT

---

If you want, I can:
- generate a minimal `.env.example` and `.gitignore` in `generated/`;
- or produce a short CONTRIBUTING.md based on the