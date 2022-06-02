import { join } from 'path';
import { stat, readdir } from 'fs';
import { promisify } from 'util';
import { ScanOptions, IFileStats } from '../contracts';
import { Observable, from, of, merge } from 'rxjs';
import { mergeMap } from 'rxjs/operators';

const statAsync = promisify(stat);
const readdirAsync = promisify(readdir);

const defaultScanOptions: Required<ScanOptions> = {
    concurrency: 1,
};

/**
 * Scans a folder and returns all files and folders within with path and stats object
 * @param path path to scan
 * @param options
 * @returns Observable of IFileStats results
 */
export function streamScanPathResults(path: string, options?: ScanOptions): Observable<IFileStats> {
    const requiredOptions = { ...defaultScanOptions, ...options };

    return scanDirectory(path, requiredOptions);
}

function scanResult(result: IFileStats, options: Required<ScanOptions>): Observable<IFileStats> {
    if (result.stats.isDirectory()) {
        return merge(of(result), scanDirectory(result.source, options));
    }

    return of(result);
}

function scanDirectory(directoryPath: string, options: Required<ScanOptions>): Observable<IFileStats> {
    return from(readdirAsync(directoryPath)).pipe(
        mergeMap((paths) => from(paths.map((filePath) => join(directoryPath, filePath))), options.concurrency),
        mergeMap(createScanResult, options.concurrency),
        mergeMap((result) => scanResult(result, options), options.concurrency)
    );
}

export async function createScanResult(sourcePath: string): Promise<IFileStats> {
    const stats = await statAsync(sourcePath);

    return {
        source: sourcePath,
        stats,
    };
}
