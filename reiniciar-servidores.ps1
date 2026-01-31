# Reiniciar Backend e Frontend - RenoveJa+
$ErrorActionPreference = "SilentlyContinue"
$base = $PSScriptRoot

Write-Host "Fechando processos nas portas 8001, 8081, 19000, 19001..."
$ports = @(8001, 8081, 19000, 19001)
foreach ($port in $ports) {
    $conn = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
    if ($conn) {
        $pids = $conn.OwningProcess | Select-Object -Unique
        foreach ($pid in $pids) {
            Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
            Write-Host "  Porta $port liberada (PID $pid)"
        }
    }
}
Start-Sleep -Seconds 2

Write-Host "Iniciando BACKEND..."
Start-Process cmd -ArgumentList "/k", "cd /d `"$base\backend`" && python -m uvicorn server:app --reload --host 0.0.0.0 --port 8001"
Start-Sleep -Seconds 4
Write-Host "Iniciando FRONTEND..."
Start-Process cmd -ArgumentList "/k", "cd /d `"$base\frontend`" && yarn start"

Write-Host ""
Write-Host "Backend:  http://localhost:8001  |  Docs: http://localhost:8001/docs"
Write-Host "Frontend: http://localhost:8081"
Write-Host "Duas janelas CMD foram abertas. Aguarde ~10 segundos para subirem."
