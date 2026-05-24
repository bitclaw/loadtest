/**
 * Reusable ScenarioResult and LoadTestResults test data.
 */
export const PASSING_SCENARIO = {
    endpoint: '/dashboard',
    label: 'Dashboard',
    method: 'GET',
    concurrency: 10,
    durationSec: 5,
    totalRequests: 500,
    successCount: 495,
    failCount: 5,
    successRate: 99,
    throughput: 150,
    p50: 80,
    p95: 200,
    p99: 350,
    min: 20,
    max: 450,
    avg: 100,
    statusCodes: { 200: 495, 500: 5 },
    avgBodySize: 1024
};
export const FAILING_P95_SCENARIO = {
    endpoint: '/slow',
    label: 'Slow endpoint',
    method: 'GET',
    concurrency: 50,
    durationSec: 5,
    totalRequests: 300,
    successCount: 297,
    failCount: 3,
    successRate: 99,
    throughput: 150,
    p50: 400,
    p95: 900,
    p99: 1200,
    min: 100,
    max: 1500,
    avg: 450,
    statusCodes: { 200: 297, 504: 3 },
    avgBodySize: 2048
};
export const FAILING_SUCCESS_RATE_SCENARIO = {
    endpoint: '/flaky',
    label: 'Flaky endpoint',
    method: 'GET',
    concurrency: 10,
    durationSec: 5,
    totalRequests: 200,
    successCount: 170,
    failCount: 30,
    successRate: 85,
    throughput: 150,
    p50: 100,
    p95: 300,
    p99: 400,
    min: 30,
    max: 500,
    avg: 120,
    statusCodes: { 200: 170, 500: 30 },
    avgBodySize: 512
};
export const FAILING_THROUGHPUT_SCENARIO = {
    endpoint: '/bottleneck',
    label: 'Bottleneck',
    method: 'GET',
    concurrency: 10,
    durationSec: 5,
    totalRequests: 100,
    successCount: 98,
    failCount: 2,
    successRate: 98,
    throughput: 20,
    p50: 100,
    p95: 300,
    p99: 400,
    min: 30,
    max: 500,
    avg: 120,
    statusCodes: { 200: 98, 503: 2 },
    avgBodySize: 768
};
export const MULTI_VIOLATION_SCENARIO = {
    endpoint: '/broken',
    label: 'Broken endpoint',
    method: 'GET',
    concurrency: 100,
    durationSec: 5,
    totalRequests: 100,
    successCount: 60,
    failCount: 40,
    successRate: 60,
    throughput: 20,
    p50: 500,
    p95: 1500,
    p99: 2000,
    min: 200,
    max: 3000,
    avg: 700,
    statusCodes: { 200: 60, 500: 30, 503: 10 },
    avgBodySize: 256
};
export const PASSING_RESULTS = {
    baseUrl: 'http://localhost:3001',
    startedAt: '2025-01-01T00:00:00.000Z',
    completedAt: '2025-01-01T00:01:00.000Z',
    scenarios: [PASSING_SCENARIO]
};
export const FAILING_RESULTS = {
    baseUrl: 'http://localhost:3001',
    startedAt: '2025-01-01T00:00:00.000Z',
    completedAt: '2025-01-01T00:01:00.000Z',
    scenarios: [FAILING_P95_SCENARIO, FAILING_SUCCESS_RATE_SCENARIO]
};
export const EMPTY_RESULTS = {
    baseUrl: 'http://localhost:3001',
    startedAt: '2025-01-01T00:00:00.000Z',
    completedAt: '2025-01-01T00:01:00.000Z',
    scenarios: []
};
