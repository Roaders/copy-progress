import { from, merge, Observable, isObservable } from 'rxjs';
import mkdirp from 'mkdirp';
import { filter, map, mergeMap, shareReplay, takeLast } from 'rxjs/operators';
import { dirname } from 'path';
import { ICopyFileProgressOptions, ICopyOptions, ICopyStats } from '../contracts';
import { isDefined, isICopyStats } from './type-predicates';
import chalk from 'chalk';

export class CopyFileHelper<TProgress, TOptions extends Required<ICopyOptions | ICopyFileProgressOptions<TProgress>>> {
    constructor(private readonly options: TOptions) {}

    private readonly dirLookup: Record<string, Observable<string | undefined> | undefined> = {};

    public performCopy(copyDetails: ICopyStats): Observable<ICopyStats | TProgress> {
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
        );
    }

    private createDirectory(outPath: string): Observable<string | undefined> {
        try {
            return (this.dirLookup[outPath] = this.dirLookup[outPath] || createDirAsync(outPath));
        } catch (e) {
            console.log(`${chalk.red('ERR: ')}Error creating directory: ${outPath}`);
            throw e;
        }
    }

    private copyFileAsync(copyDetails: ICopyStats): Observable<undefined | TProgress> {
        const copyResult = this.options.copyFunction(
            copyDetails.source,
            copyDetails.destination,
            copyDetails.stats,
            copyDetails.force
        );

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
