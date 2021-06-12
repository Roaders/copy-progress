import { from, Observable, of } from 'rxjs';
import { map, mergeMap, tap } from 'rxjs/operators';
import { IProgress, CopyDetails, ICopyStats } from './contracts';
import { createScanResult, streamScanPathResults } from './helpers';
import { isICopyStats } from './helpers/type-predicates';

export * from './helpers';

export function copyFiles(files: Array<CopyDetails> | Observable<CopyDetails>): Observable<IProgress> {
    const t = (Array.isArray(files) ? from(files) : files).pipe(
        mergeMap(convertToCopyStats),
        tap((value) => console.log(value))
    );
}

function convertToCopyStats(value: CopyDetails): Observable<ICopyStats> {
    return isICopyStats(value)
        ? of(value)
        : from(createScanResult(value.source)).pipe(map((fileStats) => ({ ...value, ...fileStats })));
}

streamScanPathResults('node_modules').subscribe((path) => console.log(path.source));
