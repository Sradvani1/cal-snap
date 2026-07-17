#!/usr/bin/env python3
"""Rewrite interpolated String(localized:) and Text() catalog calls to String(format:)."""

from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

STRING_PATTERN = re.compile(
    r'String\(localized:\s*"([^"]+)"((?:\s\\?\([^)]+\))+)\s*\)'
)

TEXT_PATTERN = re.compile(
    r'Text\("([^"]+)"((?:\s\\?\([^)]+\))+)\)'
)


def extract_args(suffix: str) -> list[str]:
    return re.findall(r"\\?\(([^)]+)\)", suffix)


def format_string_call(key: str, args: list[str]) -> str:
    if not args:
        return f'String(localized: "{key}")'
    args_str = ", ".join(args)
    return f'String(format: String(localized: "{key}"), {args_str})'


def format_text_call(key: str, args: list[str]) -> str:
    if not args:
        return f'Text("{key}")'
    inner = format_string_call(key, args)
    return f"Text({inner})"


def transform(content: str) -> tuple[str, int]:
    count = 0

    def replace_string(m: re.Match[str]) -> str:
        nonlocal count
        count += 1
        return format_string_call(m.group(1), extract_args(m.group(2)))

    def replace_text(m: re.Match[str]) -> str:
        nonlocal count
        key = m.group(1)
        if not key.replace(".", "").replace("_", "").isalnum() or " " in key:
            return m.group(0)
        count += 1
        return format_text_call(key, extract_args(m.group(2)))

    content = STRING_PATTERN.sub(replace_string, content)
    content = TEXT_PATTERN.sub(replace_text, content)
    return content, count


def main() -> None:
    total = 0
    for path in sorted(ROOT.glob("CalSnap/**/*.swift")) + sorted(ROOT.glob("CalSnapWidget/**/*.swift")):
        if "Tests" in path.parts:
            continue
        original = path.read_text(encoding="utf-8")
        updated, count = transform(original)
        if count:
            path.write_text(updated, encoding="utf-8")
            print(f"{path.relative_to(ROOT)}: {count} fixes")
            total += count
    print(f"Total: {total} fixes")


if __name__ == "__main__":
    main()
