# NVD — National Vulnerability Database

NIST's National Vulnerability Database. Every CVE (Common Vulnerabilities and Exposures) ever published — software vulnerabilities, severity scores (CVSS), affected products (CPEs), references. The authoritative source for "is this software version vulnerable?" Free, no auth (light rate limit; key recommended).

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1394+ live data sources.

## Why this matters for AI agents

For security analysis, supply-chain risk assessment, or "what CVEs affect dependency X?" the NVD is the source. Where commercial vulnerability databases add curation, the NVD is the raw federal record. Pair with [USPTO patents](/docs/reference/patents) for security IP, [SEC EDGAR](/docs/reference/edgar) for breach disclosures.

Common flows:

- **CVE lookup.** Find specific CVE by ID for full record.
- **Search by product / version.** "What CVEs affect Apache Log4j 2.x?" → keyword + CPE filter.
- **Recent CVEs by severity.** Critical and high-severity disclosures published recently.
- **CVSS scoring.** Each CVE has CVSS v2, v3.0, and v3.1 scores; agents should use v3.x for current analysis.

## Auth

NVD's REST API is free; an unauthenticated client gets ~5 requests per 30s. Get a free API key at https://nvd.nist.gov/developers/request-an-api-key for ~50 requests per 30s. Pass via `_apiKey`.

## Severity classes (CVSS v3)

| Score | Class |
|---|---|
| 0.1–3.9 | Low |
| 4.0–6.9 | Medium |
| 7.0–8.9 | High |
| 9.0–10.0 | Critical |

For agent triage, "High and Critical, last 90 days" is the common attention slice.

## Common pitfalls

- **CPE matching is fiddly.** CPE (Common Platform Enumeration) is the controlled vocabulary for "this CVE affects this product version." Software names in CPE often differ from how marketing names them. Use NVD's CPE search to find the right CPE before searching CVEs.
- **CVE coverage isn't complete.** Some bugs are quietly patched without CVE assignment. Conversely, not every CVE is exploitable in practice. Triage by environment.
- **Severity scoring is not exploitability.** A Critical CVSS score on a feature you don't use is irrelevant; a Medium CVSS on something exposed to the internet is worse than the score implies. Pair with EPSS (Exploit Prediction Scoring System) when available.
- **Reserved vs published.** Reserved CVEs ("RESERVED") are placeholders awaiting public disclosure. The actual content lives in `description` once published. Filter `vulnStatus` for what's actually known.
- **References lag.** Patches and exploit-detection signatures often appear before the NVD record updates. For real-time vulnerability response, layer GitHub Security Advisories or vendor channels on top.
- **Modified vs published date.** The "modified" date often reflects re-scoring or reference updates, not new findings. For "what was disclosed this week," sort by `publishedDate`.

## Quick Start

Add to your MCP client (Claude Desktop, Cursor, Windsurf, etc.):

```json
{
  "mcpServers": {
    "nvd": {
      "url": "https://gateway.pipeworx.io/nvd/mcp"
    }
  }
}
```

Or connect to the full Pipeworx gateway for access to all 1394+ data sources:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English:

```
ask_pipeworx({ question: "your question about Nvd data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [Docs and guides](https://pipeworx.io/docs)
- [pipeworx.io](https://pipeworx.io)

## License

MIT
