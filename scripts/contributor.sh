#! /bin/bash
# Contributor N (1..10) for the Rts20 10-party Groth16 Phase-2 ceremony.
# Run with bash (not sh). Prereq: yarn install done; /usr/bin/time installed.
set -euo pipefail
[ -n "${BASH_VERSION:-}" ] || { echo "ERROR: run with bash, not sh: bash $0 $*" >&2; exit 1; }

N=${1:-}
[[ "$N" =~ ^([1-9]|10)$ ]] || { echo "usage: bash $0 <N>   where N in 1..10" >&2; exit 64; }

LOGS=mpc_logs
METRICS=$LOGS/mpc_metrics.jsonl
PREV=$(printf %04d $((N-1)))
CURR=$(printf %04d "$N")
ZIN=setup_params/rts20_${PREV}.zkey
ZOUT=setup_params/rts20_${CURR}.zkey
CLOG=$LOGS/zkey_contribute_rts20_${N}.log
mkdir -p "$LOGS" setup_params

command -v yarn          >/dev/null || { echo "ERROR: yarn not on PATH"  >&2; exit 1; }
command -v /usr/bin/time >/dev/null || { echo "ERROR: /usr/bin/time missing (sudo dnf install -y time)" >&2; exit 1; }
[ -d node_modules ]                 || { echo "ERROR: node_modules missing (run 'yarn install')"        >&2; exit 1; }
[ -f "$ZIN"  ] || { echo "ERROR: expected input $ZIN not found (copy it in from contributor $((N-1)) or coordinator)" >&2; exit 1; }
[ ! -f "$ZOUT" ] || { echo "ERROR: $ZOUT already exists, refusing to overwrite" >&2; exit 1; }

sha256()   { sha256sum "$1" | awk '{print $1}'; }
filesize() { stat -c%s "$1"; }
aws_meta() {
    local t; t=$(curl -sf -m 2 -X PUT http://169.254.169.254/latest/api/token \
        -H "X-aws-ec2-metadata-token-ttl-seconds: 300" 2>/dev/null || true)
    [ -z "$t" ] && return 0
    curl -sf -m 2 -H "X-aws-ec2-metadata-token: $t" \
        "http://169.254.169.254/latest/meta-data/$1" 2>/dev/null || true
}
log_event() {
    local event=$1 kv k v json; shift
    json="{\"event\":\"$event\",\"ts\":\"$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)\""
    for kv in "$@"; do
        k=${kv%%=*}; v=${kv#*=}
        if [[ $v =~ ^-?[0-9]+(\.[0-9]+)?$ ]]; then json+=",\"$k\":$v"
        else v=${v//\\/\\\\}; v=${v//\"/\\\"}; json+=",\"$k\":\"$v\""; fi
    done
    printf '%s}\n' "$json" >> "$METRICS"
}
run_timed() {
    local tag=$1 log=$2 tf=$LOGS/$1.time t0 t1 rc=0; shift 2
    echo "[contributor #$N] $tag ..."
    t0=$(date -u +%s.%N)
    /usr/bin/time -v -o "$tf" "$@" > "$log" 2>&1 || rc=$?
    t1=$(date -u +%s.%N)
    log_event run_timed tag="$tag" exit_code="$rc" \
        wall_seconds="$(awk "BEGIN{print $t1-$t0}")" \
        user_cpu="$(awk '/User time/{print $4}' "$tf" 2>/dev/null || echo 0)" \
        sys_cpu="$(awk '/System time/{print $4}' "$tf" 2>/dev/null || echo 0)" \
        cpu_percent="$(awk -F'[ %]' '/Percent of CPU/{print $(NF-1)}' "$tf" 2>/dev/null || echo 0)" \
        max_rss_kb="$(awk '/Maximum resident set size/{print $NF}' "$tf" 2>/dev/null || echo 0)" \
        major_faults="$(awk -F': *' '/Major .* page faults/{print $2}' "$tf" 2>/dev/null || echo 0)" \
        minor_faults="$(awk -F': *' '/Minor .* page faults/{print $2}' "$tf" 2>/dev/null || echo 0)" \
        vol_ctx="$(awk -F': *' '/Voluntary context switches/{print $2}' "$tf" 2>/dev/null || echo 0)" \
        invol_ctx="$(awk -F': *' '/Involuntary context switches/{print $2}' "$tf" 2>/dev/null || echo 0)" \
        fs_inputs="$(awk -F': *' '/File system inputs/{print $2}' "$tf" 2>/dev/null || echo 0)" \
        fs_outputs="$(awk -F': *' '/File system outputs/{print $2}' "$tf" 2>/dev/null || echo 0)"
    return "$rc"
}

echo "[contributor #$N] $ZIN -> $ZOUT"
log_event system_info role=contributor contributor_index="$N" hostname="$(hostname)" kernel="$(uname -r)" \
    vcpus="$(nproc)" mem_kb="$(awk '/MemTotal/{print $2}' /proc/meminfo)" \
    aws_instance_id="$(aws_meta instance-id)" aws_instance_type="$(aws_meta instance-type)" \
    aws_region="$(aws_meta placement/region)" aws_az="$(aws_meta placement/availability-zone)" \
    node_version="$(node --version 2>/dev/null || echo)" \
    snarkjs_version="$(yarn --silent snarkjs --version 2>/dev/null | tail -n1 || echo)" \
    git_sha="$(git rev-parse HEAD 2>/dev/null || echo)"

log_event zkey_file role=input idx="$PREV" bytes="$(filesize "$ZIN")" sha256="$(sha256 "$ZIN")"

ENTROPY=$(openssl rand -hex 64)
log_event entropy contributor_index="$N" entropy_source=urandom entropy_bytes=64 \
    entropy_sha256="$(printf '%s' "$ENTROPY" | sha256sum | awk '{print $1}')"

run_timed "zkey_contribute_rts20_${N}" "$CLOG" \
    yarn --silent snarkjs zkey contribute "$ZIN" "$ZOUT" \
        --name="contributor-${N}@$(hostname)" -v -e="$ENTROPY"
unset ENTROPY

log_event zkey_file role=output idx="$CURR" bytes="$(filesize "$ZOUT")" sha256="$(sha256 "$ZOUT")"

CH=$(awk '
    /[Cc]ontribution [Hh]ash/ { f=1; n=0; next }
    f && n<4 { gsub(/[^0-9a-fA-F]/,""); s=s $0; n++ }
    f && n==4 { print s; exit }' "$CLOG")
log_event contribution_hash contributor_index="$N" \
    contributor_name="contributor-${N}@$(hostname)" \
    input_zkey="$ZIN" output_zkey="$ZOUT" contribution_hash="$CH"

echo "[contributor #$N] done -> $ZOUT"
