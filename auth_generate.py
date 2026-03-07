#!/usr/bin/env python3
"""
Auth Generator — JWT, email/password, social auth, web auth, app check tokens.
Reads from: config.authentication

Usage (standalone):
    python auth_generate.py --config config.yaml --templates ./tool/templates --output ./generated

Usage (imported):
    from auth_generate import run
    run(config_path, templates_dir, output_dir)
"""

import os
import sys
import argparse
import yaml
from jinja2 import Environment, FileSystemLoader
from help_utils import render_all

def build_context(config_path: str) -> dict:
    with open(config_path, 'r') as f:
        config = yaml.safe_load(f)

    proj = config.setdefault('project', {})
    proj.setdefault('module',          'github.com/user/project')
    proj.setdefault('user_model_name', 'User')
    proj.setdefault('repository_name', 'UserRepository')

    auth = config.setdefault('authentication', {})
    auth.setdefault('repo_var',         'authRepo')
    auth.setdefault('session',          {'enabled': True})
    auth.setdefault('jwt',              {'enabled': False})
    auth.setdefault('refresh_token',    {'enabled': False})
    auth.setdefault('web_auth',         {'enabled': False})
    auth.setdefault('app_check_tokens', [])
    auth.setdefault('social_auth', {
        'google':   {'enabled': False},
        'facebook': {'enabled': False},
    })

    ep = auth.setdefault('email_password', {'enabled': False, 'endpoints': []})
    ep.setdefault('email_verification', {'enabled': False, 'endpoints': []})
    ep.setdefault('forgot_password',    {'enabled': False, 'endpoints': []})
    ep.setdefault('change_password',    {'enabled': False, 'endpoints': []})

    ident = auth.setdefault('identifier', {'login_methods': [], 'register_fields': []})

    # computed helpers
    register_fields = ident.get('register_fields', [])
    login_methods   = ident.get('login_methods',   [])
   
    # Helper function: Get all file upload fields
    config['_has_file_uploads']     = any(f.get('file_upload') for f in register_fields)
    config['_file_upload_fields']   = [f for f in register_fields if f.get('file_upload')]
    config['_enabled_login_method'] = next((m for m in login_methods if m.get('enabled')), None)
    
    return config

# ─────────────────────────────────────────────────────────────────────────────
# Template decision table
# ─────────────────────────────────────────────────────────────────────────────

def get_templates(config: dict, t: str, o: str) -> list[tuple[str, str]]:
    auth   = config['authentication']
    social = auth.get('social_auth', {})

    result = [
        (f'{t}/pkg/dto/auth_dto.go.j2',                        f'{o}/pkg/dto/auth_dto.go'),
        (f'{t}/internal/api/handlers/auth_controller.go.j2',         f'{o}/internal/api/handlers/auth_controller.go'),
        (f'{t}/pkg/jwt/jwt.go.j2',                              f'{o}/pkg/jwt/jwt.go'),
        (f'{t}/pkg/auth/helpers.go.j2',                              f'{o}/pkg/auth/helpers.go'),
        (f'{t}/internal/repository/auth_repository.go.j2',                  f'{o}/internal/repository/auth_repository.go'),
    ]

    if social.get('google', {}).get('enabled') or social.get('facebook', {}).get('enabled'):
        result.append((
            f'{t}/internal/api/handlers/social_auth.go.j2',
            f'{o}/internal/api/handlers/social_auth.go',
        ))

    if auth.get('app_check_tokens'):
        result.append((
            f'{t}/internal/controllers/app_check_token.go.j2',
            f'{o}/internal/controllers/app_check_token.go',
        ))

    if auth.get('web_auth', {}).get('enabled'):
        result.append((
            f'{t}/internal/web/auth/web_auth_handler.go.j2',
            f'{o}/internal/web/auth/web_auth_handler.go',
        ))

    return result


# ─────────────────────────────────────────────────────────────────────────────
# Entry points
# ─────────────────────────────────────────────────────────────────────────────

def run(config_path: str, templates_dir: str, output_dir: str):
    config    = build_context(config_path)
    templates = get_templates(config, templates_dir, output_dir)
    render_all(config, templates)


def main():
    parser = argparse.ArgumentParser(description='Generate Go auth files from YAML config')
    parser.add_argument('--config',    required=True)
    parser.add_argument('--templates', default='./tool/templates')
    parser.add_argument('--output',    default='./generated')
    args = parser.parse_args()

    if not os.path.exists(args.config):
        print(f"❌ Config not found: {args.config}"); sys.exit(1)

    print("=" * 60)
    print("  AUTH GENERATOR")
    print("=" * 60)
    run(args.config, args.templates, args.output)
    print("=" * 60 + "\n  DONE\n" + "=" * 60)


if __name__ == "__main__":
    main()
