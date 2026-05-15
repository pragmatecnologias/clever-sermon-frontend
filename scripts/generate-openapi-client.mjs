import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const outFile = path.resolve(process.cwd(), 'src/lib/api/openapi-client.ts');
const specUrl = process.env.OPENAPI_SPEC_URL || `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api/v1'}/../api-docs-json`;

const template = String.raw`const DEFAULT_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api/v1'

type JsonRecord = Record<string, unknown>

type RequestOptions = {
  token?: string
  params?: Record<string, string | number | boolean | undefined>
  body?: unknown
}

const buildUrl = (path: string, params?: RequestOptions['params']) => {
  const url = new URL(path.startsWith('http') ? path : \`${'${DEFAULT_BASE_URL}'}\${path}\`)
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value === undefined || value === null) return
    url.searchParams.set(key, String(value))
  })
  return url.toString()
}

export interface WorkspaceApiClientOptions {
  baseUrl?: string
  token?: string
}

export const createWorkspaceApiClient = (options: WorkspaceApiClientOptions = {}) => {
  const baseUrl = options.baseUrl || DEFAULT_BASE_URL
  const request = async <T>(path: string, requestOptions: RequestOptions = {}, method = 'GET') => {
    const response = await fetch(
      buildUrl(path.startsWith('http') ? path : \`\${baseUrl}\${path}\`, requestOptions.params),
      {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(requestOptions.token || options.token ? { Authorization: \`Bearer \${requestOptions.token || options.token}\` } : {}),
        },
        body: requestOptions.body === undefined ? undefined : JSON.stringify(requestOptions.body),
      },
    )
    if (!response.ok) {
      throw new Error(\`Request failed: \${response.status}\`)
    }
    return response.json() as Promise<T>
  }

  return {
    getWorkspaceState: (workspaceId: string) =>
      request<JsonRecord>(\`/workspaces/\${workspaceId}/state\`, {}, 'GET'),
    getGenerationJobStatus: (workspaceId: string, jobId: string) =>
      request<JsonRecord>(\`/workspaces/\${workspaceId}/jobs/\${jobId}\`, {}, 'GET'),
    generateStudyReport: (workspaceId: string, payload: JsonRecord, asyncMode = true) =>
      request<JsonRecord>(\`/workspaces/\${workspaceId}/study-report\`, {
        body: payload,
        params: asyncMode ? { async: 'true' } : undefined,
      }, 'POST'),
    generateOutlines: (workspaceId: string, payload: JsonRecord, asyncMode = true) =>
      request<JsonRecord>(\`/workspaces/\${workspaceId}/outlines\`, {
        body: payload,
        params: asyncMode ? { async: 'true' } : undefined,
      }, 'POST'),
    generateSermonCore: (workspaceId: string, payload: JsonRecord, asyncMode = true) =>
      request<JsonRecord>(\`/workspaces/\${workspaceId}/sermon-core\`, {
        body: payload,
        params: asyncMode ? { async: 'true' } : undefined,
      }, 'POST'),
    generateApplications: (workspaceId: string, payload: JsonRecord, asyncMode = true) =>
      request<JsonRecord>(\`/workspaces/\${workspaceId}/applications\`, {
        body: payload,
        params: asyncMode ? { async: 'true' } : undefined,
      }, 'POST'),
    generateDiscussionQuestions: (workspaceId: string, payload: JsonRecord, asyncMode = true) =>
      request<JsonRecord>(\`/workspaces/\${workspaceId}/discussion-questions\`, {
        body: payload,
        params: asyncMode ? { async: 'true' } : undefined,
      }, 'POST'),
    generateIllustrations: (workspaceId: string, payload: JsonRecord, asyncMode = true) =>
      request<JsonRecord>(\`/workspaces/\${workspaceId}/illustrations\`, {
        body: payload,
        params: asyncMode ? { async: 'true' } : undefined,
      }, 'POST'),
    generateCitations: (workspaceId: string, payload: JsonRecord, asyncMode = true) =>
      request<JsonRecord>(\`/workspaces/\${workspaceId}/citations\`, {
        body: payload,
        params: asyncMode ? { async: 'true' } : undefined,
      }, 'POST'),
    generateMediaSuggestions: (workspaceId: string, payload: JsonRecord, asyncMode = true) =>
      request<JsonRecord>(\`/workspaces/\${workspaceId}/media-suggestions\`, {
        body: payload,
        params: asyncMode ? { async: 'true' } : undefined,
      }, 'POST'),
    runIntegrityCheck: (workspaceId: string, asyncMode = true) =>
      request<JsonRecord>(\`/workspaces/\${workspaceId}/integrity-check\`, {
        params: asyncMode ? { async: 'true' } : undefined,
      }, 'POST'),
    recordClaimReview: (workspaceId: string, payload: JsonRecord) =>
      request<JsonRecord>(\`/workspaces/\${workspaceId}/claim-reviews\`, { body: payload }, 'POST'),
    recordIntegrityIssueReview: (workspaceId: string, payload: JsonRecord) =>
      request<JsonRecord>(\`/workspaces/\${workspaceId}/integrity-issue-reviews\`, { body: payload }, 'POST'),
  }
}

export const workspaceApiClient = createWorkspaceApiClient()
`;

const main = async () => {
  const response = await fetch(specUrl);
  if (!response.ok) {
    throw new Error(`Unable to fetch OpenAPI spec from ${specUrl}: ${response.status}`);
  }
  const spec = await response.json();
  const paths = Object.keys(spec?.paths || {});
  if (!paths.includes('/api/v1/workspaces/{id}/state') && !paths.some((item) => item.includes('/workspaces/{id}/state'))) {
    throw new Error('OpenAPI spec does not include workspace state endpoint.');
  }
  await mkdir(path.dirname(outFile), { recursive: true });
  await writeFile(outFile, template, 'utf8');
  console.log(`Generated OpenAPI client at ${outFile}`);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
