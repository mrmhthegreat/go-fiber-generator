#!/usr/bin/env python3
"""
Master Generator — Unified Go Code Generator
Orchestrates all sub-generators using master_config.yaml.

Sub-generators and what they own:
    app_generate                →  config, database, redis, swagger, main.go,
                                   routes, contexthelpers, Dockerfile, Makefile…
    repo_model_config_generate  →  models, repositories, DTOs, responses
    auth_generate               →  JWT, email/password, social auth, web auth
    rbac_generate               →  RBAC  (reads top-level config.rbac)
    imap_generate               →  IMAP incoming email
    helpers_generate            →  FCM, sendMail, saveUploadFile, storage provider
    middleware_generator        →  middleware.go
    chat_websocket_generator    →  chat, websocket, notifications

Usage:
    python master_generator.py --config master_config.yaml
    python master_generator.py --config master_config.yaml --output ./generated
    python master_generator.py --config master_config.yaml --dry-run
"""

import argparse
import sys
import subprocess
from pathlib import Path

SCRIPT_DIR    = Path(__file__).parent
TEMPLATE_BASE = SCRIPT_DIR / "tool" / "templates"


# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────

def _call(module_name: str, config_path: str, output_dir: str, errors: list,
          templates_dir: str = None):
    """Import a sub-generator module and call its run() function."""
    td = templates_dir or str(TEMPLATE_BASE)
    try:
        mod = __import__(module_name)
    except ImportError as e:
        errors.append(f"[{module_name}] import failed: {e}")
        return
    try:
        mod.run(config_path=config_path, templates_dir=td, output_dir=output_dir)
    except Exception as e:
        errors.append(f"[{module_name}] run() failed: {e}")
        import traceback; traceback.print_exc()


def run_formatter(output_dir: str, errors: list):
    fmt = SCRIPT_DIR / "format_generated_code.py"
    if not fmt.exists():
        return
    try:
        result = subprocess.run(
            [sys.executable, str(fmt), output_dir],
            capture_output=True, text=True, check=False,
        )
        if result.stdout:
            print(result.stdout, end="")
        if result.returncode != 0:
            errors.append(f"[formatter] {result.stderr.strip()}")
    except Exception as e:
        errors.append(f"[formatter] {e}")


def run_model_generator(config_path: str, output_dir: str, errors: list):
    try:
        from repo_model_config_generate import ModelGenerator
        ModelGenerator(
            config_path=config_path,
            templates_dir=str(TEMPLATE_BASE / "internal"),
            output_dir=str(Path(output_dir) / "internal"),
        ).generate_all()
    except ImportError as e:
        errors.append(f"[models] import failed: {e}")
    except Exception as e:
        errors.append(f"[models] failed: {e}")


def run_middleware_generator(config_path: str, output_dir: str, errors: list):
    try:
        from middleware_generator import MiddlewareGenerator
        MiddlewareGenerator(
            config_path=config_path,
            template_dir=str(TEMPLATE_BASE / "middleware"),
            output_dir=output_dir,
        ).generate()
    except ImportError as e:
        errors.append(f"[middleware] import failed: {e}")
    except Exception as e:
        errors.append(f"[middleware] failed: {e}")


def run_chat_ws_generator(config_path: str, output_dir: str, errors: list):
    try:
        from chat_websocket_notification_generator import ChatWebSocketGenerator
        ChatWebSocketGenerator(
            config_path=config_path,
            template_dir=str(TEMPLATE_BASE),
            output_dir=output_dir,
        ).generate()
    except ImportError as e:
        errors.append(f"[chat/ws] import failed: {e}")
    except Exception as e:
        errors.append(f"[chat/ws] failed: {e}")


# ─────────────────────────────────────────────────────────────────────────────
# Master orchestrator
# ─────────────────────────────────────────────────────────────────────────────

class MasterGenerator:
    def __init__(self, config_path: str, output_dir: str = "./generated", dry_run: bool = False):
        self.config_path   = str(Path(config_path).resolve())
        self.output_dir    = str(Path(output_dir).resolve())
        self.templates_dir = str(TEMPLATE_BASE)
        self.dry_run       = dry_run
        self.errors: list  = []

    def run(self):
        print(f"\n{'='*60}")
        print(f"  Master Generator")
        print(f"  Config:  {self.config_path}")
        print(f"  Output:  {self.output_dir}")
        print(f"{'='*60}")

        if self.dry_run:
            print("\n[DRY-RUN] Would invoke:")
            print("  1. app_generate               → config, redis, swagger, main.go, routes, infra")
            print("  2. repo_model_config_generate → models, repos, DTOs, responses")
            print("  3. auth_generate              → JWT, email/pw, social, web auth")
            print("  4. rbac_generate              → RBAC models, service, controller")
            print("  5. imap_generate              → IMAP service, controller")
            print("  6. helpers_generate           → FCM, sendMail, saveUploadFile")
            print("  7. middleware_generator       → middleware.go")
            print("  8. chat_websocket_generator   → chat, websocket, notifications")
            print("  9. format_generated_code      → format all .go files")
            return True

        c = self.config_path
        o = self.output_dir
        t = self.templates_dir
        e = self.errors

        print("\n[1/8] App scaffold (config, redis, swagger, main.go, routes, infra)")
        _call('app_generate', c, o, e, t)

        print("\n[2/8] Models, repositories, DTOs, responses")
        run_model_generator(c, o, e)

        print("\n[3/8] Auth (JWT, email/password, social, web auth)")
        _call('auth_generate', c, o, e, t)

        print("\n[4/8] RBAC")
        _call('rbac_generate', c, o, e, t)

        print("\n[5/8] IMAP")
        _call('imap_generate', c, o, e, t)

        print("\n[6/8] Helpers (FCM, sendMail, saveUploadFile)")
        _call('helpers_generate', c, o, e, t)

        print("\n[7/8] Middleware")
        run_middleware_generator(c, o, e)

        print("\n[8/8] Chat, WebSocket, notifications")
        run_chat_ws_generator(c, o, e)

        print("\n🔧 Formatting generated Go files...")
        run_formatter(o, e)

        print(f"\n{'='*60}")
        if self.errors:
            print(f"  ⚠️  Completed with {len(self.errors)} error(s):")
            for err in self.errors:
                print(f"     • {err}")
        else:
            print("  ✅ All generators completed successfully")
        print(f"{'='*60}\n")

        return len(self.errors) == 0


# ─────────────────────────────────────────────────────────────────────────────
# CLI
# ─────────────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Master Go Code Generator")
    parser.add_argument("--config", "-c", default="master_config.yaml")
    parser.add_argument("--output", "-o", default="./generated")
    parser.add_argument("--dry-run", action="store_true",
                        help="Preview what would be generated without writing files")
    parser.add_argument("--validate", action="store_true",
                        help="Validate config and show feature plan, then exit (no generation)")
    parser.add_argument("--list-features", "-l", action="store_true",
                        help="Show what will and won't be generated, then exit")
    parser.add_argument("--strict", action="store_true",
                        help="Treat config warnings as errors and block generation")
    parser.add_argument("--skip-validate", action="store_true",
                        help="Skip validation and generate immediately (not recommended)")
    args = parser.parse_args()

    if not Path(args.config).exists():
        print(f"❌ Config not found: {args.config}")
        sys.exit(1)

    # --validate or --list-features: just show info and exit, no generation
    if args.validate or args.list_features:
        try:
            from validate_config import validate, print_feature_list, print_validation_results
            cfg, r = validate(args.config, strict=args.strict)
            print_feature_list(cfg)
            print_validation_results(r, strict=args.strict)
            sys.exit(1 if (r.errors or (args.strict and r.warnings)) else 0)
        except ImportError:
            print("⚠️  validate_config.py not found — skipping validation")
            sys.exit(0)

    # Always validate before generation unless --skip-validate
    if not args.skip_validate:
        try:
            from validate_config import validate_or_exit
            validate_or_exit(args.config, strict=args.strict)
        except ImportError:
            print("⚠️  validate_config.py not found — skipping pre-generation validation")

    ok = MasterGenerator(args.config, args.output, args.dry_run).run()
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
