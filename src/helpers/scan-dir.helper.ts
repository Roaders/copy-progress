import { resolve, join } from 'path';
import { stat, readdir } from 'fs';
import { promisify } from 'util';
import { ScanOptions, ScanResult } from '../contracts';
import { Observable, from, of, merge } from 'rxjs';
import { mergeMap, toArray } from 'rxjs/operators';

const statAsync = promisify(stat);
const readdirAsync = promisify(readdir);

const defaultScanOptions: Required<ScanOptions> = {
    concurrency: 1,
};

export function streamScanPathResults(path: string, options?: ScanOptions): Observable<ScanResult> {
    const requiredOptions = { ...defaultScanOptions, ...options };
    path = resolve(path);

    return from(createResult(path)).pipe(mergeMap((result) => scanResult(result, requiredOptions)));
}

export function scanPathAsync(path: string, options?: ScanOptions): Promise<ScanResult[]> {
    return streamScanPathResults(path, options).pipe(toArray()).toPromise();
}

function scanResult(result: ScanResult, options: Required<ScanOptions>): Observable<ScanResult> {
    const resultObservable = of(result);

    if (result.isDirectory) {
        return merge(resultObservable, scanDirectory(result, options));
    }

    return resultObservable;
}

function scanDirectory(directory: ScanResult, options: Required<ScanOptions>): Observable<ScanResult> {
    return from(readdirAsync(directory.path)).pipe(
        mergeMap((paths) => from(paths.map((basename) => join(directory.path, basename))), options.concurrency),
        mergeMap(createResult, options.concurrency),
        mergeMap((result) => scanResult(result, options), options.concurrency)
    );
}

export async function createResult(path: string): Promise<ScanResult> {
    const stats = await statAsync(path);
    return {
        type: 'scanResult',
        path,
        stats,
        isFile: stats.isFile(),
        isDirectory: stats.isDirectory(),
    };
}
