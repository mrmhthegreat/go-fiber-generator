
import os
import sys
import argparse
import yaml
from jinja2 import Environment, FileSystemLoader


def _make_env(template_dir: str) -> Environment:
    env = Environment(loader=FileSystemLoader(template_dir), keep_trailing_newline=True,)
    env.filters['snake_case'] = lambda s: s.lower().replace(' ', '_')
    env.filters['camel_case'] = lambda s: ''.join(w.capitalize() for w in s.split('_'))
    env.filters['title']      = lambda s: s.title()
    env.filters['lower']      = lambda s: s.lower()
    env.filters['replace']    = lambda s, old, new: s.replace(old, new)
    return env


def render_all(context: dict, templates: list[tuple[str, str]]):
    """Render (template_path, output_path) pairs with the shared context."""
    ctx = {'config': context, **context}
    _env_cache: dict[str, Environment] = {}

    for t_path, o_path in templates:
        if not os.path.exists(t_path):
            print(f"  ⚠️  Template not found (skipping): {t_path}")
            continue
        tmpl_dir  = os.path.dirname(t_path)
        tmpl_name = os.path.basename(t_path)
        if tmpl_dir not in _env_cache:
            _env_cache[tmpl_dir] = _make_env(tmpl_dir)
        try:
            rendered = _env_cache[tmpl_dir].get_template(tmpl_name).render(**ctx)
            os.makedirs(os.path.dirname(o_path), exist_ok=True)
            with open(o_path, 'w') as f:
                f.write(rendered)
            print(f"  ✅ {o_path}")
        except Exception as e:
            print(f"  ❌ Error rendering {t_path}: {e}")
            import traceback; traceback.print_exc()
