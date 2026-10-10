#!/bin/bash
# 用法: bash fetch.sh <URL> <子目录名>
# 只做一次公开 GET；每个响应进 resources/md-render-yang-20261010/ 下新建的空子目录；计数与计时写进 curl-log.tsv
set -u
ROOT=/Users/nv/proj.xt.com/manzi-blog
OUT="$ROOT/resources/md-render-yang-20261010/$2"
LOG="$ROOT/_tmp/20261010-md-rendering/yang/curl-log.tsv"
case "$1" in https://yangzhiping.com/*) ;; *) echo "拒绝：非 yangzhiping.com URL"; exit 2;; esac
if [ -e "$OUT" ]; then echo "拒绝：$OUT 已存在"; exit 3; fi
mkdir -p "$OUT"
N=$(( $(grep -c . "$LOG" 2>/dev/null || echo 0) + 1 ))
USED=$(awk -F'\t' '{s+=1+$8} END{print s+0}' "$LOG" 2>/dev/null || echo 0)
if [ $((USED + 1)) -gt 25 ]; then echo "拒绝：请求数将超过 25"; rmdir "$OUT"; exit 4; fi
W=$(curl --compressed -L -sS --max-time 60 -D "$OUT/headers.txt" -o "$OUT/body.txt" \
  -w '%{http_code}\t%{time_starttransfer}\t%{time_total}\t%{size_download}\t%{num_redirects}\t%{url_effective}' "$1")
RC=$?
printf '%s\t%s\t%s\t%s\trc=%s\t%s\n' "$N" "$(date -u +%H:%M:%S)" "$2" "$W" "$RC" "$1" >> "$LOG"
tail -1 "$LOG"
