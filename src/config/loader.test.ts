import { describe, expect, test } from 'bun:test';
import { listConfiguredApps, loadConfig } from './loader';

describe('loadConfig', () => {
  test('given existing app, when loading config, then returns config with correct appName', async () => {
    const config = await loadConfig('runmist');

    expect(config.appName).toBe('runmist');
  });

  test("given non-existent app, when loading config, then throws 'No loadtest config found'", async () => {
    await expect(loadConfig('nonexistent-app')).rejects.toThrow(
      'No loadtest config found'
    );
  });

  test('given non-existent app, when loading config, then error includes expected file path', async () => {
    await expect(loadConfig('nonexistent-app')).rejects.toThrow(
      'apps/nonexistent-app/loadtest.config.ts'
    );
  });

  test('given existing app, when loading config, then has publicEndpoints array', async () => {
    const config = await loadConfig('runmist');

    expect(Array.isArray(config.publicEndpoints)).toBe(true);
    expect(config.publicEndpoints.length).toBeGreaterThan(0);
  });

  test('given existing app, when loading config, then has modes for quick, full, and stress', async () => {
    const config = await loadConfig('runmist');

    expect(config.modes.quick).toBeDefined();
    expect(config.modes.full).toBeDefined();
    expect(config.modes.stress).toBeDefined();
  });
});

describe('listConfiguredApps', () => {
  test('given apps directory, when listing, then returns array containing runmist', async () => {
    const apps = await listConfiguredApps();

    expect(apps).toContain('runmist');
  });

  test('given apps directory, when listing, then includes both runmist and weatherdestination', async () => {
    const apps = await listConfiguredApps();

    expect(apps).toContain('runmist');
    expect(apps).toContain('weatherdestination');
  });

  test('given apps directory, when listing, then returns only strings', async () => {
    const apps = await listConfiguredApps();

    expect(apps.length).toBeGreaterThan(0);
    for (const app of apps) {
      expect(typeof app).toBe('string');
    }
  });
});
