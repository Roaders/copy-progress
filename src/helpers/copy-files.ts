import { Observable, from, merge, of } from 'rxjs';
import { mergeMap, shareReplay, map } from 'rxjs/operators';
import { ICopyOptions, CopyDetails, IProgress, ICopyStats } from '../contracts';
import { CopyFileHelper } from './copy-file.helper';
import { streamProgress, streamTotal } from './progress.helper';
import { createScanResult } from './scan-dir.helper';
import { isICopyStats } from './type-predicates';
import { promisify } from 'util';
import { copyFile } from 'fs';

export const defaultOptions: Required<ICopyOptions> = {
    concurrentCopy: 1,
    copyFunction: promisify(copyFile),
};

export function copyFiles(
    files: Array<CopyDetails> | Observable<CopyDetails>,
    options?: ICopyOptions
): Observable<IProgress> {
    const requiredOptions = { ...defaultOptions, ...options };
    const copyHelper = new CopyFileHelper(requiredOptions);

    const copyStats = (Array.isArray(files) ? from(files) : files).pipe(mergeMap(convertToCopyStats), shareReplay());
    const totals = streamTotal(copyStats);
    const copyResults = copyStats.pipe(
        mergeMap((copyDetails) => copyHelper.performCopy(copyDetails), requiredOptions.concurrentCopy)
    );

    return streamProgress(merge(copyResults, totals));
}

function convertToCopyStats(value: CopyDetails): Observable<ICopyStats> {
    return isICopyStats(value)
        ? of(value)
        : from(createScanResult(value.source)).pipe(map((fileStats) => ({ ...value, ...fileStats })));
}
