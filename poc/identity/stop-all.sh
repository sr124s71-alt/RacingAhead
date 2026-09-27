#!/usr/bin/env bash
# Stops every service started by start-all.sh, including its restart loop.
ROOT="$(cd "$(dirname "$0")" && pwd)"

kill_tree() {
  local pid=$1 child
  for child in $(pgrep -P "$pid" 2>/dev/null); do kill_tree "$child"; done
  kill "$pid" 2>/dev/null
}

for f in "$ROOT"/.run/*.pid; do
  [ -e "$f" ] || continue
  name=$(basename "$f" .pid)
  kill_tree "$(cat "$f")" && echo "stopped $name"
  rm -f "$f"
done
echo "Done. PostgreSQL is left running."
