import { from, merge, Observable, of } from 'rxjs';
import { map, mergeMap, shareReplay } from 'rxjs/operators';
import { IProgress, CopyDetails, ICopyStats, ICopyOptions } from './contracts';
import { createScanResult, streamProgress, streamTotal } from './helpers';
import { CopyFileHelper } from './helpers/copy-file.helper';
import { isICopyStats } from './helpers/type-predicates';

export * from './helpers';

export const defaultOptions: Required<ICopyOptions> = {
    concurrentCopy: 1,
};

export function copyFiles(
    files: Array<CopyDetails> | Observable<CopyDetails>,
    options?: ICopyOptions
): Observable<IProgress> {
    const requiredOptions = { ...defaultOptions, ...options };
    const copyHelper = new CopyFileHelper();

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
