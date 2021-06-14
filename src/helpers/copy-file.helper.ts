import { from, merge, Observable, isObservable } from 'rxjs';
import mkdirp from 'mkdirp';
import { filter, map, mergeMap, shareReplay, takeLast } from 'rxjs/operators';
import { dirname } from 'path';
import { ICopyFileProgressOptions, ICopyOptions, ICopyStats } from '../contracts';
import { isDefined, isICopyStats } from './type-predicates';

export class CopyFileHelper {
    constructor(private readonly options: Required<ICopyOptions | ICopyFileProgressOptions<unknown>>) {}

    private readonly dirLookup: Record<string, Observable<string | undefined> | undefined> = {};

    public performCopy(copyDetails: ICopyStats): Observable<ICopyStats> {
        const dirPath = dirname(copyDetails.destination);

        const copyFileStream = this.createDirectory(dirPath).pipe(
            mergeMap(() => this.copyFileAsync(copyDetails)),
            shareReplay()
        );

        return merge(
            copyFileStream.pipe(
                filter(isDefined),
                filter((result) => !isICopyStats(result))
            ),
            copyFileStream.pipe(
                takeLast(1),
                map(() => copyDetails)
            )
        ) as any;
    }

    private createDirectory(outPath: string): Observable<string | undefined> {
        return (this.dirLookup[outPath] = this.dirLookup[outPath] || createDirAsync(outPath));
    }

    private copyFileAsync(copyDetails: ICopyStats): Observable<unknown> {
        const copyResult = this.options.copyFunction(copyDetails.source, copyDetails.destination, copyDetails.stats);

        if (isObservable(copyResult)) {
            return copyResult;
        } else {
            return from(copyResult).pipe(map(() => undefined));
        }
    }
}

function createDirAsync(outPath: string): Observable<string | undefined> {
    return from(mkdirp(outPath)).pipe(shareReplay());
}
