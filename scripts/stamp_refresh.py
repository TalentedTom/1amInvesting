"""
Write a top-level `__lastRefresh` timestamp into data.js. Run as the last
step of the cron pipeline so every workflow run produces a meaningful diff
and commits — gives a predictable refresh cadence even when no formatted
price changed.

The frontend ignores keys it doesn't know about (it only iterates the
en/zh-CN/pl language arrays), so adding this top-level field is invisible
in the table. It's purely a "this run happened" marker. If we ever want to
display "last updated X minutes ago" in the UI, it's already here.

This script also serves a side benefit: scheduled GitHub Actions workflows
in repos with sparse commit activity can get throttled or paused by
GitHub. A refresh-stamping commit on every tick keeps the repo "active"
and reduces the chance of cron drift.
"""

import datetime
import json
import re
import sys
from pathlib import Path

DATA_JS = Path(__file__).resolve().parent.parent / "data.js"


def main():
    raw = DATA_JS.read_text(encoding="utf-8")
    m = re.match(r"^\s*window\.PORTFOLIO_DATA\s*=\s*", raw)
    if not m:
        print("data.js missing the `window.PORTFOLIO_DATA = ` prefix", file=sys.stderr)
        sys.exit(1)
    prefix = m.group(0)
    body = raw[m.end():].rstrip()
    if body.endswith(";"):
        body = body[:-1].rstrip()
    data = json.loads(body)

    # ISO 8601 UTC, second precision. Always different from the previous
    # run's value, guaranteeing the workflow's `git diff` step sees a change.
    data["__lastRefresh"] = (
        datetime.datetime.now(datetime.timezone.utc)
        .strftime("%Y-%m-%dT%H:%M:%SZ")
    )

    DATA_JS.write_text(
        prefix + json.dumps(data, ensure_ascii=False, indent=4) + ";",
        encoding="utf-8",
    )
    print(f"Stamped __lastRefresh = {data['__lastRefresh']}")


if __name__ == "__main__":
    main()
