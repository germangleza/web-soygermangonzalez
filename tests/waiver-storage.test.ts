import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@vercel/blob', () => ({ get: vi.fn(), list: vi.fn(), put: vi.fn() }));
import { get, list, put } from '@vercel/blob';
import { parseReport, publishReport, readReports, reportMetrics } from '../src/lib/waiver-reports';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

describe('weekly report storage', () => {
  it('writes one private object per season and week so a retry replaces the same report', async () => {
    vi.stubEnv('BLOB_READ_WRITE_TOKEN', 'test');
    vi.stubEnv('NBAFANTASY_REDIS_URL', '');
    const report = parseReport(2026, 5, 'Added\t35\t16\tDropped\t27');
    await publishReport(report);
    expect(put).toHaveBeenCalledWith(
      'guillotina/87354/reports/2026/5.json', JSON.stringify(report),
      { access: 'private', contentType: 'application/json', addRandomSuffix: false, allowOverwrite: true },
    );
    expect(reportMetrics(report.moves).weightedCost).toBe(2);
  });

  it('loads all history pages, reads overwrites fresh and sorts newest first', async () => {
    vi.stubEnv('BLOB_READ_WRITE_TOKEN', 'test');
    vi.stubEnv('NBAFANTASY_REDIS_URL', '');
    const older = parseReport(2026, 5, 'Added\t35\t16');
    const newer = parseReport(2026, 6, 'Added\t35\t16');
    vi.mocked(list)
      .mockResolvedValueOnce({ blobs: [{ pathname: 'older' }], hasMore: true, cursor: 'next' } as any)
      .mockResolvedValueOnce({ blobs: [{ pathname: 'newer' }], hasMore: false } as any);
    for (const report of [older, newer]) {
      vi.mocked(get).mockResolvedValueOnce({
        statusCode: 200, stream: new Response(JSON.stringify(report)).body,
      } as any);
    }
    expect((await readReports()).map(({ week }) => week)).toEqual([6, 5]);
    expect(list).toHaveBeenLastCalledWith({ prefix: 'guillotina/87354/reports/', cursor: 'next' });
    expect(get).toHaveBeenCalledWith('older', { access: 'private', useCache: false });
  });

  it('fails a write when storage has not been configured', async () => {
    vi.stubEnv('BLOB_READ_WRITE_TOKEN', '');
    vi.stubEnv('NBAFANTASY_REDIS_URL', '');
    await expect(publishReport(parseReport(2026, 5, 'Added\t35\t16'))).rejects.toThrow('not configured');
  });
});
