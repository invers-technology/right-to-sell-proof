#!/bin/sh
# Coordinator for the Rts20 10-party Groth16 Phase-2 ceremony.
# Run once before contributor #1 (INIT), once after #10 (FINALIZE).
set -eu

LOGS=mpc_logs
METRICS=$LOGS/mpc_metrics.jsonl
BEACON_HEX=c1ba4f7b5234b7bce4cabf8f2d9a4b8d7e40a4b6d2c3f9a5e6b8d1c9a7f2e3b4
BEACON_ITERS=10
mkdir -p "$LOGS" setup_params verification_keys

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
    event=$1; shift
    json="{\"event\":\"$event\",\"ts\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\""
    for kv in "$@"; do
        k=${kv%%=*}; v=${kv#*=}
        if printf '%s' "$v" | grep -qE '^-?[0-9]+(\.[0-9]+)?$'; then
            json="$json,\"$k\":$v"
        else
            v=$(printf '%s' "$v" | sed 's/\\/\\\\/g; s/"/\\"/g')
            json="$json,\"$k\":\"$v\""
        fi
    done
    printf '%s}\n' "$json" >> "$METRICS"
}
run_timed() {
    tag=$1; log=$2; tf=$LOGS/$1.time; rc=0; shift 2
    echo "[coordinator] $tag ..."
    echo "[coordinator] command: $*"
    t0=$(date -u +%s)
    /usr/bin/time -v -o "$tf" "$@" > "$log" 2>&1 || rc=$?
    t1=$(date -u +%s)
    if [ "$rc" -ne 0 ]; then
        echo "[coordinator] ERROR: '$tag' failed (exit code $rc)" >&2
        echo "[coordinator] command: $*" >&2
        echo "[coordinator] --- log output ($log) ---" >&2
        cat "$log" >&2
        echo "[coordinator] --- end of log ---" >&2
    fi
    log_event run_timed tag="$tag" exit_code="$rc" \
        wall_seconds="$((t1 - t0))" \
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
    if [ "$rc" -ne 0 ]; then
        exit "$rc"
    fi
}

log_event system_info role=coordinator hostname="$(hostname)" kernel="$(uname -r)" \
    vcpus="$(nproc)" mem_kb="$(awk '/MemTotal/{print $2}' /proc/meminfo)" \
    aws_instance_id="$(aws_meta instance-id)" aws_instance_type="$(aws_meta instance-type)" \
    aws_region="$(aws_meta placement/region)" aws_az="$(aws_meta placement/availability-zone)" \
    node_version="$(node --version 2>/dev/null || echo)" \
    snarkjs_version="$(yarn --silent snarkjs --version 2>/dev/null | tail -n1 || echo)" \
    circom_version="$(circom --version 2>/dev/null | head -n1 || echo)" \
    git_sha="$(git rev-parse HEAD 2>/dev/null || echo)"

if [ ! -f setup_params/rts20_0000.zkey ]; then
    echo "[coordinator] phase = INIT"
    [ -f setup_params/pot21_final.ptau ] || { echo "ERROR: setup_params/pot21_final.ptau missing" >&2; exit 1; }
    [ -f circuits/rts20.circom ] || { echo "ERROR: circuits/rts20.circom missing" >&2; exit 1; }
    run_timed circom_compile_rts20 "$LOGS/circom_compile_rts20.log" \
        circom circuits/rts20.circom --r1cs --wasm -l node_modules
    log_event r1cs_file bytes="$(filesize rts20.r1cs)" sha256="$(sha256 rts20.r1cs)"
    log_event ptau_file bytes="$(filesize setup_params/pot21_final.ptau)" sha256="$(sha256 setup_params/pot21_final.ptau)"
    run_timed groth16_setup_rts20 "$LOGS/groth16_setup_rts20.log" \
        yarn --silent snarkjs groth16 setup rts20.r1cs setup_params/pot21_final.ptau setup_params/rts20_0000.zkey
    log_event zkey_file role=initial idx=0000 \
        bytes="$(filesize setup_params/rts20_0000.zkey)" sha256="$(sha256 setup_params/rts20_0000.zkey)"
    echo "[coordinator] INIT done -> setup_params/rts20_0000.zkey"

elif [ -f setup_params/rts20_0010.zkey ] && [ ! -f setup_params/rts20_final.zkey ]; then
    echo "[coordinator] phase = FINALIZE"
    run_timed zkey_beacon_rts20 "$LOGS/zkey_beacon_rts20.log" \
        yarn --silent snarkjs zkey beacon setup_params/rts20_0010.zkey setup_params/rts20_final.zkey \
        "$BEACON_HEX" "$BEACON_ITERS" -n="Final Beacon Rts20"
    log_event zkey_file role=final idx=final \
        bytes="$(filesize setup_params/rts20_final.zkey)" sha256="$(sha256 setup_params/rts20_final.zkey)"
    vrc=0
    run_timed zkey_verify_rts20 "$LOGS/zkey_verify_rts20.log" \
        yarn --silent snarkjs zkey verify rts20.r1cs setup_params/pot21_final.ptau setup_params/rts20_final.zkey || vrc=$?
    log_event verify_result exit_code="$vrc"
    run_timed zkey_export_vk_rts20 "$LOGS/zkey_export_vk_rts20.log" \
        yarn --silent snarkjs zkey export verificationkey setup_params/rts20_final.zkey verification_keys/verification20.json
    log_event vkey_file bytes="$(filesize verification_keys/verification20.json)" sha256="$(sha256 verification_keys/verification20.json)"
    [ "$vrc" -eq 0 ] && echo "[coordinator] FINALIZE done, zkey verify OK" || echo "[coordinator] FINALIZE done, zkey verify FAILED ($vrc)" >&2

else
    echo "[coordinator] phase = NONE (nothing to do)"
    echo "current setup_params/rts20_*.zkey files:"
    ls setup_params/rts20_*.zkey 2>/dev/null || echo "  (none)"
    echo "Expected triggers:"
    echo "  INIT     runs when rts20_0000.zkey is absent"
    echo "  FINALIZE runs when rts20_0010.zkey is present and rts20_final.zkey is absent"
fi
