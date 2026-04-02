# @pipeworx/mcp-nvd

MCP server for CVE vulnerability data via the [NIST National Vulnerability Database API](https://nvd.nist.gov/developers). Free, no authentication required.

## Tools

| Tool | Description |
|------|-------------|
| `search_cves` | Search CVE vulnerabilities by keyword (returns ID, description, severity, CVSS score) |
| `get_cve` | Fetch a specific CVE by ID (e.g. "CVE-2021-44228") |
| `recent_cves` | Fetch CVEs published within a date range |

## Quickstart via Pipeworx Gateway

```bash
curl -X POST https://gateway.pipeworx.io/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "nvd__get_cve",
      "arguments": { "cve_id": "CVE-2021-44228" }
    },
    "id": 1
  }'
```

## License

MIT
