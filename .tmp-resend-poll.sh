#!/usr/bin/env bash
cd /d/Projects/coinblink-main
set -a; . ./.env >/dev/null 2>&1; set +a
for i in $(seq 1 8); do
  sleep 300
  curl -s -X POST -H "Authorization: Bearer $RESEND_API_KEY" \
    "https://api.resend.com/domains/6da54fbe-2f5a-4eda-908c-8ae5edbf7b44/verify" -o /dev/null
  STATUS=$(curl -s -H "Authorization: Bearer $RESEND_API_KEY" \
    "https://api.resend.com/domains/6da54fbe-2f5a-4eda-908c-8ae5edbf7b44" \
    | /d/DevCache/npm/_npx/992a19d7d9bf36d4/node_modules/node/bin/node.exe -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{const j=JSON.parse(s);console.log(j.status+' '+j.records.map(r=>r.type+':'+r.name+'='+r.status).join(' '));});")
  echo "$(date -u +%H:%M:%S) $STATUS" >> .tmp-resend-poll.log
  case "$STATUS" in verified*) break;; esac
done
