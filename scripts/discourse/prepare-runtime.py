#!/usr/bin/env python3
"""Prepare our pinned extensions/specs inside an existing Discourse checkout.

Does not install dependencies, start servers, touch production or read secrets.
The same paths are used by hosted acceptance and a developer's local checkout.
"""
import argparse
import json
from pathlib import Path
import shutil
import subprocess

REPO = Path(__file__).resolve().parents[2]


def git(path, *args):
    return subprocess.check_output(
        ["git", "-C", str(path), *args], text=True
    ).strip()


def checkout_pin(target, item):
    if target.exists():
        if not (target / ".git").exists():
            raise RuntimeError(f"Refusing to overwrite non-Git directory: {target}")
        if git(target, "status", "--porcelain"):
            raise RuntimeError(f"Refusing to change dirty checkout: {target}")
        if git(target, "remote", "get-url", "origin") != item["repository"]:
            raise RuntimeError(f"Unexpected repository at {target}")
    else:
        target.mkdir(parents=True)
        subprocess.run(["git", "init", "--quiet", str(target)], check=True)
        subprocess.run(
            ["git", "-C", str(target), "remote", "add", "origin", item["repository"]],
            check=True,
        )
    try:
        current = git(target, "rev-parse", "--verify", "--quiet", "HEAD")
    except subprocess.CalledProcessError:
        current = None
    if current != item["commit"]:
        subprocess.run(
            ["git", "-C", str(target), "fetch", "--depth", "1", "origin", item["commit"]],
            check=True,
        )
        subprocess.run(
            ["git", "-C", str(target), "checkout", "--detach", item["commit"]], check=True
        )
    if git(target, "rev-parse", "HEAD") != item["commit"]:
        raise RuntimeError(f"Pin verification failed: {item['name']}")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--discourse-path", required=True, type=Path)
    args = parser.parse_args()
    target = args.discourse_path.resolve()
    lock = json.loads((REPO / "discourse/runtime.lock.json").read_text())
    if git(target, "rev-parse", "HEAD") != lock["discourse"]["commit"]:
        raise RuntimeError("Discourse revision differs from discourse/runtime.lock.json")
    for item in lock["plugins"]:
        checkout_pin(target / "plugins" / item["name"], item)
    for item in lock["components"]:
        checkout_pin(target / "tmp/that-space-components" / item["name"], item)
    # Discourse enables browser helpers based on actual spec/system paths.
    source = REPO / "tests/discourse"
    specs = list(source.glob("*_spec.rb"))
    if not specs or not any(p.name.endswith("_system_spec.rb") for p in specs):
        raise RuntimeError("Request and system acceptance specs are required")
    for kind in ("requests", "system"):
        destination = target / "spec" / kind / "that_space"
        destination.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source / "spec_helper.rb", destination / "spec_helper.rb")
    for spec in specs:
        kind = "system" if spec.name.endswith("_system_spec.rb") else "requests"
        shutil.copy2(spec, target / "spec" / kind / "that_space" / spec.name)
    print(f"Pinned Discourse and {len(lock['plugins'])} plugin / {len(lock['components'])} components prepared")


if __name__ == "__main__":
    main()
