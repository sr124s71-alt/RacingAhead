#!/usr/bin/env bash
# SportSeek Shared Identity POC - start everything and keep it running (macOS / Linux).
#   ./start-all.sh             start the API, the Lit web app and the Expo app
#   ./start-all.sh --no-expo   skip the Expo (React Native) app
#   ./start-all.sh --no-browser
# Each service runs in a background loop that restarts it if it stops. Logs: logs/<service>.log
# Stop everything with ./stop-all.sh
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
RUN="$ROOT/.run"
LOGS="$ROOT/logs"
mkdir -p "$RUN" "$LOGS"
EXPO=1
BROWSER=1
for a in "$@"; do
  case "$a" in
    --no-expo) EXPO=0 ;;
    --no-browser) BROWSER=0 ;;
  esac
done

port_open() { (exec 3<>"/dev/tcp/127.0.0.1/$1") 2>/dev/null; }

echo "Checking prerequisites..."
command -v dotnet >/dev/null || { echo "[X] The .NET SDK was not found. Install the .NET 8 SDK."; exit 1; }
command -v node >/dev/null || { echo "[X] Node.js was not found. Install Node.js 20 or later."; exit 1; }
if ! port_open 5432; then
  echo "[X] PostgreSQL is not running on localhost:5432."
  echo "    macOS (Homebrew): brew services start postgresql   Linux: sudo service postgresql start"
  exit 1
fi
echo "[ok] .NET, Node.js and PostgreSQL"

[ -d "$ROOT/web-lit/node_modules" ] || (echo "Installing web app packages..." && cd "$ROOT/web-lit" && npm install --no-audit --no-fund)
[ "$EXPO" = 0 ] || [ -d "$ROOT/app/node_modules" ] || (echo "Installing Expo app packages..." && cd "$ROOT/app" && npm install --no-audit --no-fund)

# launch <name> <port> <dir> <command...>: runs the command in a restart loop, detached from this shell.
launch() {
  local name=$1 port=$2 dir=$3
  shift 3
  if port_open "$port"; then
    echo "[ok] $name is already running on port $port"
    return
  fi
  echo "Starting $name on port $port (log: logs/$name.log)"
  nohup bash -c '
    name=$1 dir=$2 log=$3; shift 3
    run=0
    while true; do
      run=$((run + 1))
      echo "===== $(date "+%F %T") starting $name (run $run) =====" >> "$log"
      echo "$(date "+%F %T") start $name (run $run)" >> "'"$LOGS"'/restarts.log"
      (cd "$dir" && exec "$@") >> "$log" 2>&1 &
      child=$!
      trap "kill $child 2>/dev/null; exit 0" TERM INT
      wait $child && code=0 || code=$?
      echo "$(date "+%F %T") $name stopped, exit code $code" >> "'"$LOGS"'/restarts.log"
      echo "===== $name stopped (exit code $code), restarting in 5 seconds =====" >> "$log"
      sleep 5
    done
  ' _ "$name" "$dir" "$LOGS/$name.log" "$@" >/dev/null 2>&1 &
  echo $! > "$RUN/$name.pid"
}

launch api 5080 "$ROOT/api" dotnet run --launch-profile http
launch web 8082 "$ROOT/web-lit" npm run serve
[ "$EXPO" = 0 ] || CI=1 launch expo 8081 "$ROOT/app" npx expo start --web --port 8081

echo "Waiting for the Identity API (the first start builds it and creates the database)..."
for _ in $(seq 1 180); do
  curl -sf -m 3 http://127.0.0.1:5080/api/config >/dev/null && { echo "[ok] Identity API is up"; break; }
  sleep 1
done

cat <<INFO

 Running (each service restarts automatically if it stops):
   Demo stage (Lit web app)   http://localhost:8082
   Identity API               http://localhost:5080/api/config
INFO
[ "$EXPO" = 0 ] || echo "   Expo app (React Native)    http://localhost:8081/?app=stage"
echo
echo " Admin demo number: +91 90000 00001     Stop everything: ./stop-all.sh"

if [ "$BROWSER" = 1 ]; then
  (command -v open >/dev/null && open http://localhost:8082) || (command -v xdg-open >/dev/null && xdg-open http://localhost:8082) || true
fi
