import { resolve, join } from 'path';
import { stat, readdir } from 'fs';
import { promisify } from 'util';
import { ScanResult } from '../contracts';
import { Observable, from, of, merge } from 'rxjs';
import { mergeMap } from 'rxjs/operators';

const statAsync = promisify(stat);
const readdirAsync = promisify(readdir);

export function scanPath(path: string): Observable<ScanResult> {
    path = resolve(path);

    return from(createResult(path)).pipe(mergeMap(scanResult));
}

function scanResult(result: ScanResult): Observable<ScanResult> {
    if (result.isDirectory) {
        return merge(of(result), scanDirectory(result));
    } else {
        return of(result);
    }
}

function scanDirectory(directory: ScanResult): Observable<ScanResult> {
    return from(readdirAsync(directory.path)).pipe(
        mergeMap((paths) => from(paths.map((basename) => join(directory.path, basename))), 1),
        mergeMap(createResult, 1),
        mergeMap(scanResult, 1)
    );
}

async function createResult(path: string): Promise<ScanResult> {
    const stats = await statAsync(path);
    return {
        path,
        stats,
        isFile: stats.isFile(),
        isDirectory: stats.isDirectory(),
    };
}
