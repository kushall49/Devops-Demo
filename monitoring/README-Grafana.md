# Grafana + Prometheus — Setup & Demo

Quick guide to finish the demo: install/start Grafana, import the dashboard, and test CI annotations.

Prerequisites
- Prometheus running and scraping the backend at `http://localhost:9090`.
- Backend exposing `/metrics` on `http://localhost:5000`.
- Grafana installed and reachable (default port `3000` or `3001` depending on installer). The repo contains a provisioned dashboard at `monitoring/grafana/dashboards/smartcal-dashboard.json`.

Start Grafana (Windows)
- If you used `winget`: wait for the installer to finish, then open Services and start the `grafana` service or run in PowerShell:

```powershell
Start-Service grafana
Get-Service grafana
```

- Or run the server directly (adjust path if different):

```powershell
& "C:\Program Files\GrafanaLabs\grafana\bin\grafana-server.exe" --config "C:\Program Files\GrafanaLabs\grafana\conf\grafana.ini"
```

Import dashboard & datasource
1. Open Grafana in your browser (e.g. `http://localhost:3001` or `http://localhost:3000`).
2. Confirm the Prometheus datasource exists (Configuration → Data sources → Prometheus → URL `http://localhost:9090`). If not, add it.
3. Import the dashboard JSON: Create → Import → Upload `monitoring/grafana/dashboards/smartcal-dashboard.json` or paste JSON.

Key PromQL queries (use these in panels or for ad-hoc checks)
- Total API requests (RPS):

  sum(rate(smartcal_http_requests_total[1m]))

- Failed requests (per second):

  sum(rate(smartcal_http_requests_failed_total[1m]))

- Error rate (%):

  100 * sum(rate(smartcal_http_requests_failed_total[1m])) / sum(rate(smartcal_http_requests_total[1m]))

- Average latency (over 5m):

  rate(smartcal_http_response_time_seconds_sum[5m]) / rate(smartcal_http_response_time_seconds_count[5m])

- p95 latency (use histogram buckets):

  histogram_quantile(0.95, sum(rate(smartcal_http_response_time_seconds_bucket[5m])) by (le))

- Business metrics (events/tasks created):

  sum(rate(smartcal_events_created_total[1m]))
  sum(rate(smartcal_tasks_created_total[1m]))

- Process metrics (memory / CPU):

  smartcal_process_resident_memory_bytes
  rate(smartcal_process_cpu_seconds_total[1m])

CI → Grafana annotations (GitHub Actions)
- Workflow added at `.github/workflows/grafana-annotation.yml` posts an annotation after the build/deploy step.
- Required GitHub secrets:
  - `GRAFANA_URL` — full Grafana URL (e.g. `http://grafana.example.com` or `http://localhost:3001`).
  - `GRAFANA_API_KEY` — Grafana API key with Editor role (create in Grafana: Server Admin → API Keys).

Local test curl example (replace API key & URL):

```bash
TIMEMS=$(date +%s)000
curl -s -X POST "http://localhost:3001/api/annotations" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <API_KEY>" \
  -d '{"time':"'$TIMEMS'","isRegion":false,"tags":["ci","deploy"],"text":"Local test deploy"}'
```

Verification
- After posting an annotation, open the imported dashboard and check the time range containing the annotation. Grafana shows annotations as vertical markers on timeseries panels.

Next steps I can take now
- Wait for `winget` to finish and attempt to start Grafana locally, then import/verify `monitoring/grafana/dashboards/smartcal-dashboard.json` (requires Grafana install to complete).
- Or, if you prefer, I can walk you step-by-step while you finish the installer.

If you want me to start Grafana now, say "Start Grafana" and I'll attempt to start the service and verify the dashboard.
