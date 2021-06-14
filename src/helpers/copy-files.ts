import { Observable, from, merge, of } from 'rxjs';
import { mergeMap, shareReplay, map, filter } from 'rxjs/operators';
import {
    ICopyOptions,
    CopyDetails,
    IFilesProgress,
    ICopyStats,
    ICopyFileProgressOptions,
    ProgressCopyFileFunction,
    IStreamProgress,
} from '../contracts';
import { CopyFileHelper } from './copy-file.helper';
import { streamProgress, streamTotal } from './progress.helper';
import { createScanResult } from './scan-dir.helper';
import { isICopyStats } from './type-predicates';
import { promisify } from 'util';
import { copyFile, createReadStream, createWriteStream, Stats } from 'fs';
import progress from 'progress-stream';

export const defaultOptions: Required<ICopyOptions> = {
    concurrentCopy: 1,
    copyFunction: (source: string, destination: string) => promisify(copyFile)(source, destination),
};

type FilesSource = Array<CopyDetails> | Observable<CopyDetails>;

export function copyFiles<TFileProgress>(
    files: FilesSource,
    options: ICopyFileProgressOptions<TFileProgress>
): Observable<IFilesProgress | TFileProgress>;
export function copyFiles(files: FilesSource, options?: ICopyOptions): Observable<IFilesProgress>;
export function copyFiles(
    files: FilesSource,
    options?: ICopyOptions | ICopyFileProgressOptions<unknown>
): Observable<IFilesProgress> {
    const requiredOptions = { ...defaultOptions, ...options };
    const copyHelper = new CopyFileHelper(requiredOptions);

    const copyStats = (Array.isArray(files) ? from(files) : files).pipe(mergeMap(convertToCopyStats), shareReplay());
    const totals = streamTotal(copyStats);
    const copyResults = copyStats.pipe(
        mergeMap((copyDetails) => copyHelper.performCopy(copyDetails), requiredOptions.concurrentCopy),
        shareReplay()
    );
    const progress = streamProgress(merge(copyResults.pipe(filter(isICopyStats)), totals));

    return merge(progress, copyResults.pipe(filter((result) => !isICopyStats(result)))) as any;
}

export const fileStreamCopy: ProgressCopyFileFunction<IStreamProgress> = (
    source: string,
    destination: string,
    stats: Stats
) => {
    return new Observable<IStreamProgress>((subscriber) => {
        createReadStream(source)
            .pipe(
                progress({ length: stats.size }).on('progress', (event) =>
                    subscriber.next({ ...event, type: 'fileStreamProgress', stats: { source, stats } })
                )
            )
            .pipe(createWriteStream(destination))
            .once('error', (err) => subscriber.error(err))
            .once('finish', () => subscriber.complete());
    });
};

function convertToCopyStats(value: CopyDetails): Observable<ICopyStats> {
    return isICopyStats(value)
        ? of(value)
        : from(createScanResult(value.source)).pipe(map((fileStats) => ({ ...value, ...fileStats })));
}
