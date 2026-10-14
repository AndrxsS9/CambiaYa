#!/usr/bin/env bash
# CambiaYa — Resource sampler (Linux / WSL)
# Samples CPU, RAM, disk IOPS and network every 5 seconds.
#
# Usage:
#   chmod +x measure_linux.sh
#   ./measure_linux.sh -o results/run1.csv -d 660
#
set -euo pipefail

OUT="cambiaYa_metrics.csv"
DURATION=660
INTERVAL=5
DISK_DEV="sda"    # change to nvme0n1 or your actual device
NET_DEV="eth0"    # change to your network interface

while getopts "o:d:i:k:n:" opt; do
  case $opt in
    o) OUT="$OPTARG";;
    d) DURATION="$OPTARG";;
    i) INTERVAL="$OPTARG";;
    k) DISK_DEV="$OPTARG";;
    n) NET_DEV="$OPTARG";;
  esac
done

echo "timestamp,cpu_pct,mem_used_mb,disk_read_iops,disk_write_iops,net_in_kbps,net_out_kbps" > "$OUT"

echo "Sampling every ${INTERVAL}s for ${DURATION}s → $OUT"
echo "Disk: $DISK_DEV   Network: $NET_DEV"

end_time=$((SECONDS + DURATION))

while [ $SECONDS -lt $end_time ]; do
    sleep "$INTERVAL"

    ts=$(date '+%Y-%m-%d %H:%M:%S')
    cpu=$(top -bn1 | grep "Cpu(s)" | awk '{print $2 + $4}')
    mem=$(free -m | awk '/Mem:/{print $3}')

    disk_stats=$(grep "^$DISK_DEV " /proc/diskstats 2>/dev/null || echo "0 0 0 0 0 0 0 0 0 0 0 0 0 0")
    reads=$(echo $disk_stats | awk '{print $4}')
    writes=$(echo $disk_stats | awk '{print $8}')

    net_stats=$(grep "^ *$NET_DEV:" /proc/net/dev | awk '{print $2, $10}')
    net_in=$(echo $net_stats | awk '{print int($1/1024)}')
    net_out=$(echo $net_stats | awk '{print int($2/1024)}')

    echo "$ts,$cpu,$mem,$reads,$writes,$net_in,$net_out" >> "$OUT"
    echo "$ts  CPU=${cpu}%  RAM=${mem}MB  DiskR=${reads}  DiskW=${writes}  NetIn=${net_in}kB  NetOut=${net_out}kB"
done

echo "Done. Data saved to $OUT"
