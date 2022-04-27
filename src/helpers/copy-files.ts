import { Observable, from, merge, of, EMPTY } from 'rxjs';
import { mergeMap, shareReplay, map, filter } from 'rxjs/operators';
import {
    ICopyOptions,
    CopyDetails,
    IFilesProgress,
    ICopyStats,
    ICopyFileProgressOptions,
    ProgressCopyFileFunction,
    IStreamProgress,
    RequiredOptions,
} from '../contracts';
import { CopyFileHelper } from './copy-file.helper';
import { streamProgress, streamTotal } from './progress.helper';
import { createScanResult } from './scan-dir.helper';
import { isICopyStats } from './type-predicates';
import { promisify } from 'util';
import { constants, copyFile, createReadStream, createWriteStream, Stats } from 'fs';
import progress from 'progress-stream';

export const defaultOptions: Required<ICopyOptions> = {
    concurrentCopy: 1,
    copyFunction: (source: string, destination: string) =>
        promisify(copyFile)(source, destination, constants.COPYFILE_EXCL),
};

type FilesSource = Array<CopyDetails> | Observable<CopyDetails>;

export function copyFiles<TFileProgress>(
    files: FilesSource,
    options: ICopyFileProgressOptions<TFileProgress>
): Observable<IFilesProgress | TFileProgress>;
export function copyFiles(files: FilesSource, options?: ICopyOptions): Observable<IFilesProgress>;
export function copyFiles<TProgress, TOptions extends ICopyOptions | ICopyFileProgressOptions<TProgress>>(
    files: FilesSource,
    options?: TOptions
): Observable<IFilesProgress | TProgress> {
    const requiredOptions = { ...defaultOptions, ...options };
    const copyHelper = new CopyFileHelper<TProgress, RequiredOptions<TProgress, TOptions>>(
        requiredOptions as RequiredOptions<TProgress, TOptions>
    );

    const copyStats = (Array.isArray(files) ? from(files) : files).pipe(
        mergeMap(convertToCopyStats),
        filter((file) => file.stats.isFile()),
        shareReplay()
    );
    const totals = streamTotal(copyStats);
    const copyResults = copyStats.pipe(
        mergeMap((copyDetails) => copyHelper.performCopy(copyDetails), requiredOptions.concurrentCopy),
        shareReplay()
    );
    const filesProgress = streamProgress(merge(copyResults.pipe(filter(isICopyStats)), totals));
    const fileProgress = copyResults.pipe(mergeMap((result) => (isICopyStats(result) ? EMPTY : of(result))));

    return merge(filesProgress, fileProgress);
}

/**
 * Copies a single file and provides progress information
 * @param source file source path
 * @param destination file destination path
 * @param stats Stats object containing information about the file
 * @returns Observable
 */
export const fileCopyProgress: ProgressCopyFileFunction<IStreamProgress> = (
    source: string,
    destination: string,
    stats: Stats
) => {
    return fileStreamCopy(source, destination, stats);
};

export function fileStreamCopy(
    source: string,
    destination: string,
    stats: Stats,
    highWaterMark?: number
): Observable<IStreamProgress> {
    return new Observable<IStreamProgress>((subscriber) => {
        createReadStream(source, { highWaterMark })
            .pipe(
                progress({ length: stats.size }).on('progress', (event) =>
                    subscriber.next({ ...event, type: 'fileStreamProgress', stats: { source, stats } })
                )
            )
            .pipe(createWriteStream(destination, { flags: 'wx' }))
            .once('error', (err) => subscriber.error(err))
            .once('finish', () => subscriber.complete());
    });
}

function convertToCopyStats(value: CopyDetails): Observable<ICopyStats> {
    return isICopyStats(value)
        ? of(value)
        : from(createScanResult(value.source)).pipe(map((fileStats) => ({ ...value, ...fileStats })));
}
