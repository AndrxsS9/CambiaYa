# CambiaYa — Resource sampler (Windows PowerShell)
# Samples CPU, RAM, disk IOPS and network every 5 seconds.
# Run this in a separate terminal while Locust is running.
#
# Usage:
#   .\measure_windows.ps1 -OutFile results\run1.csv -Duration 660
#
param(
    [string]$OutFile = "cambiaYa_metrics.csv",
    [int]$Duration = 660,       # seconds — 11 min (matches a 10-min Locust run + warmup)
    [int]$Interval = 5
)

$header = "timestamp,cpu_pct,mem_used_mb,disk_read_iops,disk_write_iops,net_in_kbps,net_out_kbps"
Set-Content -Path $OutFile -Value $header

$end = (Get-Date).AddSeconds($Duration)
$prevDiskRead  = (Get-Counter '\PhysicalDisk(_Total)\Disk Reads/sec').CounterSamples[0].CookedValue
$prevDiskWrite = (Get-Counter '\PhysicalDisk(_Total)\Disk Writes/sec').CounterSamples[0].CookedValue
$prevNetIn     = (Get-Counter '\Network Interface(*)\Bytes Received/sec').CounterSamples | Measure-Object CookedValue -Sum | Select-Object -ExpandProperty Sum
$prevNetOut    = (Get-Counter '\Network Interface(*)\Bytes Sent/sec').CounterSamples | Measure-Object CookedValue -Sum | Select-Object -ExpandProperty Sum

Write-Host "Sampling every ${Interval}s for ${Duration}s → $OutFile"

while ((Get-Date) -lt $end) {
    Start-Sleep -Seconds $Interval

    $cpu     = (Get-CimInstance Win32_Processor | Measure-Object LoadPercentage -Average).Average
    $mem     = [math]::Round((Get-CimInstance Win32_OperatingSystem).TotalVisibleMemorySize / 1KB -
                              (Get-CimInstance Win32_OperatingSystem).FreePhysicalMemory / 1KB)
    $diskR   = [math]::Round((Get-Counter '\PhysicalDisk(_Total)\Disk Reads/sec').CounterSamples[0].CookedValue, 1)
    $diskW   = [math]::Round((Get-Counter '\PhysicalDisk(_Total)\Disk Writes/sec').CounterSamples[0].CookedValue, 1)
    $netIn   = [math]::Round(((Get-Counter '\Network Interface(*)\Bytes Received/sec').CounterSamples | Measure-Object CookedValue -Sum | Select-Object -ExpandProperty Sum) / 1KB, 1)
    $netOut  = [math]::Round(((Get-Counter '\Network Interface(*)\Bytes Sent/sec').CounterSamples | Measure-Object CookedValue -Sum | Select-Object -ExpandProperty Sum) / 1KB, 1)
    $ts      = (Get-Date -Format "yyyy-MM-dd HH:mm:ss")

    "$ts,$cpu,$mem,$diskR,$diskW,$netIn,$netOut" | Add-Content -Path $OutFile
    Write-Host "$ts  CPU=${cpu}%  RAM=${mem}MB  DiskR=${diskR}iops  DiskW=${diskW}iops  NetIn=${netIn}kbps  NetOut=${netOut}kbps"
}

Write-Host "`nDone. Data saved to $OutFile"
