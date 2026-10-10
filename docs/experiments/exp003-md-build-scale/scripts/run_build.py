"""一次规模构建：生成内容 → next build（/usr/bin/time -l）→ 产物挪到 runs/N<N>/ 保留。

用法: python3 -I run_build.py <N> [--md]
- 超过 900 s 杀掉整个进程组并记 timeout。
- 另起线程每 0.5 s 采样整棵进程树的 RSS 之和（/usr/bin/time 的 maxrss 只是单个进程峰值）。
"""
import json
import os
import signal
import subprocess
import sys
import threading
import time

EXP = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = os.path.join(EXP, "site")
SCRIPTS = os.path.join(EXP, "scripts")
TIMEOUT = 900


def tree_rss(root):
    out = subprocess.run(["/bin/ps", "-axo", "pid=,ppid=,rss="], capture_output=True, text=True).stdout
    kids = {}
    rss = {}
    for line in out.splitlines():
        parts = line.split()
        if len(parts) != 3:
            continue
        pid, ppid, r = map(int, parts)
        kids.setdefault(ppid, []).append(pid)
        rss[pid] = r
    total, count, stack = 0, 0, [root]
    while stack:
        p = stack.pop()
        total += rss.get(p, 0)
        count += 1
        stack.extend(kids.get(p, []))
    return total * 1024, count


def main():
    n = int(sys.argv[1])
    run_dir = os.path.join(EXP, "runs", "N%d" % n)
    os.makedirs(run_dir, exist_ok=True)
    # 起点干净：克隆里不留旧 .next / out（挪走，不删）
    for name in (".next", "out"):
        p = os.path.join(SITE, name)
        if os.path.exists(p):
            dest = os.path.join(EXP, "runs", "_moved-%s-%d" % (name.strip("."), int(time.time())))
            os.rename(p, dest)
            print("moved", p, "->", dest)

    gen_cmd = [sys.executable, "-I", os.path.join(SCRIPTS, "gen.py"), str(n), SITE]
    if "--md" in sys.argv:
        gen_cmd += ["--md", os.path.join(SITE, "content-md")]
    t0 = time.monotonic()
    gen = subprocess.run(gen_cmd, capture_output=True, text=True, check=True)
    gen_secs = time.monotonic() - t0
    gen_summary = json.loads(gen.stdout.strip().splitlines()[-1])

    env = dict(os.environ, NEXT_TELEMETRY_DISABLED="1")
    time_file = os.path.join(run_dir, "time.txt")
    log = open(os.path.join(run_dir, "build.log"), "w")
    cmd = ["/usr/bin/time", "-l", "-o", time_file, "./node_modules/.bin/next", "build"]
    t0 = time.monotonic()
    proc = subprocess.Popen(cmd, cwd=SITE, env=env, stdout=log, stderr=subprocess.STDOUT, start_new_session=True)
    peak = {"bytes": 0, "procs": 0, "samples": 0}
    stop = threading.Event()

    def sampler():
        while not stop.is_set():
            b, c = tree_rss(proc.pid)
            peak["samples"] += 1
            if b > peak["bytes"]:
                peak["bytes"] = b
            if c > peak["procs"]:
                peak["procs"] = c
            stop.wait(0.5)

    th = threading.Thread(target=sampler, daemon=True)
    th.start()
    timed_out = False
    try:
        rc = proc.wait(timeout=TIMEOUT)
    except subprocess.TimeoutExpired:
        timed_out = True
        os.killpg(proc.pid, signal.SIGKILL)
        rc = proc.wait()
    wall = time.monotonic() - t0
    stop.set()
    th.join()
    log.close()

    maxrss = None
    real = None
    if os.path.exists(time_file):
        for line in open(time_file):
            parts = line.split()
            if "maximum resident set size" in line:
                maxrss = int(parts[0])
            if len(parts) >= 2 and parts[1] == "real":
                real = float(parts[0])

    # 产物保留：out → runs/N/out，.next → runs/N/dotnext
    for name, dest in (("out", "out"), (".next", "dotnext")):
        p = os.path.join(SITE, name)
        if os.path.exists(p):
            os.rename(p, os.path.join(run_dir, dest))

    rec = {"N": n, "exit_code": rc, "timed_out": timed_out, "wall_secs_python": round(wall, 2),
           "time_real_secs": real, "time_maxrss_bytes_single_process": maxrss,
           "sampled_tree_rss_peak_bytes": peak["bytes"], "sampled_tree_peak_procs": peak["procs"],
           "rss_samples": peak["samples"], "gen_secs": round(gen_secs, 2), "gen": gen_summary}
    with open(os.path.join(run_dir, "run.json"), "w") as f:
        json.dump(rec, f, ensure_ascii=False, indent=1)
    print(json.dumps(rec, ensure_ascii=False))


if __name__ == "__main__":
    main()
