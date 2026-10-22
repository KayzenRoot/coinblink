"""Future offline Codex JSONL accounting only. It never calls agents or tests."""
import argparse, hashlib, json
from pathlib import Path
p=argparse.ArgumentParser()
p.add_argument("--run-id",required=True)
p.add_argument("--jsonl",required=True)
p.add_argument("--out",required=True)
args=p.parse_args()
raw=Path(args.jsonl).read_bytes()
usage=[]; failed=0; malformed=0; sessions=0
for line in raw.decode("utf-8-sig",errors="replace").splitlines():
    if not line.strip():continue
    try: obj=json.loads(line)
    except ValueError: malformed+=1;continue
    kind=obj.get("type")
    if kind=="turn.completed" and isinstance(obj.get("usage"),dict):usage.append(obj["usage"])
    if kind=="turn.failed":failed+=1
    if kind=="thread.started":sessions+=1
keys=("input_tokens","cached_input_tokens","output_tokens","reasoning_output_tokens")
counts={k:sum(u[k] for u in usage) if usage and all(type(u.get(k)) is int and u[k]>=0 for u in usage) else None for k in keys}
payload={
  "run_id":args.run_id,"state":"CAPTURED_LOG_ONLY",
  "sha256_jsonl":hashlib.sha256(raw).hexdigest(),
  "turns_completed":len(usage),"turns_failed":failed,"malformed_lines":malformed,"thread_count":sessions,
  "usage":counts,"cost_usd":None,"seconds_active":None,"seconds_wall":None,
  "seconds_ci_wait":None,"judge_pass":None,
  "telemetry_complete":bool(usage) and failed==0 and malformed==0 and sessions<=1,
  "note":"Partial telemetry is not zero. No billing or subagent estimate inferred."
}
target=Path(args.out)
if target.exists():raise SystemExit("Output already exists")
target.parent.mkdir(parents=True,exist_ok=True)
target.write_text(json.dumps(payload,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
print("CAPTURE_CREATED_NOT_VALIDATED",target)
