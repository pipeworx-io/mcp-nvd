/**
 * NVD MCP — wraps the NIST National Vulnerability Database API (free, no auth)
 * https://services.nvd.nist.gov/rest/json
 *
 * Tools:
 * - search_cves: keyword search across CVE descriptions
 * - get_cve: fetch a specific CVE by ID
 * - recent_cves: fetch CVEs published within a date range
 */

interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

interface McpToolExport {
  tools: McpToolDefinition[];
  callTool: (name: string, args: Record<string, unknown>) => Promise<unknown>;
}

const BASE_URL = 'https://services.nvd.nist.gov/rest/json';

const tools: McpToolExport['tools'] = [
  {
    name: 'search_cves',
    description:
      'Search CVE vulnerabilities by keyword. Returns CVE ID, description, severity, and CVSS score.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Keyword(s) to search in CVE descriptions' },
        limit: {
          type: 'number',
          description: 'Maximum number of results to return (default 10, max 2000)',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_cve',
    description:
      'Fetch a specific CVE by its ID (e.g. "CVE-2021-44228"). Returns full details including description, severity, and affected products.',
    inputSchema: {
      type: 'object',
      properties: {
        cve_id: { type: 'string', description: 'CVE identifier, e.g. "CVE-2021-44228"' },
      },
      required: ['cve_id'],
    },
  },
  {
    name: 'recent_cves',
    description:
      'Fetch CVEs published within a date range. Dates must be ISO 8601 format with timezone (e.g. "2024-01-01T00:00:00.000Z").',
    inputSchema: {
      type: 'object',
      properties: {
        start: { type: 'string', description: 'Start date in ISO 8601 format (e.g. "2024-01-01T00:00:00.000Z")' },
        end: { type: 'string', description: 'End date in ISO 8601 format (e.g. "2024-01-31T23:59:59.000Z")' },
        limit: {
          type: 'number',
          description: 'Maximum number of results to return (default 10, max 2000)',
        },
      },
      required: ['start', 'end'],
    },
  },
];

async function callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  switch (name) {
    case 'search_cves':
      return searchCves(args.query as string, (args.limit as number) ?? 10);
    case 'get_cve':
      return getCve(args.cve_id as string);
    case 'recent_cves':
      return recentCves(args.start as string, args.end as string, (args.limit as number) ?? 10);
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

interface CveItem {
  cve: {
    id: string;
    published: string;
    lastModified: string;
    vulnStatus: string;
    descriptions: Array<{ lang: string; value: string }>;
    metrics?: {
      cvssMetricV31?: Array<{
        cvssData: { baseScore: number; baseSeverity: string; vectorString: string };
      }>;
      cvssMetricV2?: Array<{
        cvssData: { baseScore: number; vectorString: string };
        baseSeverity: string;
      }>;
    };
  };
}

function formatCve(item: CveItem) {
  const cve = item.cve;
  const desc = cve.descriptions.find((d) => d.lang === 'en')?.value ?? '';
  const v31 = cve.metrics?.cvssMetricV31?.[0];
  const v2 = cve.metrics?.cvssMetricV2?.[0];
  const score = v31?.cvssData.baseScore ?? v2?.cvssData.baseScore ?? null;
  const severity = v31?.cvssData.baseSeverity ?? v2?.baseSeverity ?? null;

  return {
    id: cve.id,
    published: cve.published,
    last_modified: cve.lastModified,
    status: cve.vulnStatus,
    description: desc,
    cvss_score: score,
    severity,
  };
}

async function searchCves(query: string, limit: number) {
  const params = new URLSearchParams({
    keywordSearch: query,
    resultsPerPage: String(Math.min(2000, Math.max(1, limit))),
  });

  const res = await fetch(`${BASE_URL}/cves/2.0?${params}`, {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) throw new Error(`NVD API error: ${res.status}`);

  const data = (await res.json()) as {
    totalResults: number;
    vulnerabilities: CveItem[];
  };

  return {
    total_results: data.totalResults,
    returned: data.vulnerabilities.length,
    cves: data.vulnerabilities.map(formatCve),
  };
}

async function getCve(cveId: string) {
  const params = new URLSearchParams({ cveId });

  const res = await fetch(`${BASE_URL}/cves/2.0?${params}`, {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) throw new Error(`NVD API error: ${res.status}`);

  const data = (await res.json()) as {
    totalResults: number;
    vulnerabilities: CveItem[];
  };

  if (data.totalResults === 0 || data.vulnerabilities.length === 0) {
    throw new Error(`CVE not found: ${cveId}`);
  }

  return formatCve(data.vulnerabilities[0]);
}

async function recentCves(start: string, end: string, limit: number) {
  const params = new URLSearchParams({
    pubStartDate: start,
    pubEndDate: end,
    resultsPerPage: String(Math.min(2000, Math.max(1, limit))),
  });

  const res = await fetch(`${BASE_URL}/cves/2.0?${params}`, {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) throw new Error(`NVD API error: ${res.status}`);

  const data = (await res.json()) as {
    totalResults: number;
    vulnerabilities: CveItem[];
  };

  return {
    total_results: data.totalResults,
    returned: data.vulnerabilities.length,
    cves: data.vulnerabilities.map(formatCve),
  };
}

export default { tools, callTool } satisfies McpToolExport;
