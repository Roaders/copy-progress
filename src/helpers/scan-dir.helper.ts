import { resolve, join } from 'path';
import { stat, readdir } from 'fs';
import { promisify } from 'util';
import { PathType, ScanOptions, ScanResult } from '../contracts';
import { Observable, from, of, merge } from 'rxjs';
import { mergeMap, toArray } from 'rxjs/operators';
import chalk from 'chalk';

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

    if (result.pathType === 'directory') {
        return merge(resultObservable, scanDirectory(result, options));
    }

    return resultObservable;
}

function scanDirectory(directory: ScanResult, options: Required<ScanOptions>): Observable<ScanResult> {
    return from(readdirAsync(directory.sourcePath)).pipe(
        mergeMap((paths) => from(paths.map((basename) => join(directory.sourcePath, basename))), options.concurrency),
        mergeMap(createResult, options.concurrency),
        mergeMap((result) => scanResult(result, options), options.concurrency)
    );
}

export async function createResult(sourcePath: string): Promise<ScanResult> {
    const stats = await statAsync(sourcePath);

    let pathType: PathType;

    if (stats.isDirectory() && stats.isFile()) {
        console.log(`${chalk.red('ERROR:')} '${sourcePath}' is both a file and a directory`);
        process.exit(1);
    } else if (stats.isDirectory()) {
        pathType = 'directory';
    } else if (stats.isFile()) {
        pathType = 'file';
    } else {
        console.log(`${chalk.red('ERROR:')} '${sourcePath}' is neither a file or a directory`);
        process.exit(1);
    }

    return {
        type: 'scanResult',
        sourcePath,
        stats,
        pathType,
    };
}
