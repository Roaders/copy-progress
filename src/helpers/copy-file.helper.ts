import { from, Observable } from 'rxjs';
import mkdirp from 'mkdirp';
import chalk from 'chalk';
import { map, mergeMap, shareReplay, tap } from 'rxjs/operators';
import { dirname } from 'path';
import { ICopyOptions, ICopyStats } from '../contracts';

export class CopyFileHelper {
    constructor(private readonly options: Required<ICopyOptions>) {}

    private readonly dirLookup: Record<string, Observable<string | undefined> | undefined> = {};

    public performCopy(copyDetails: ICopyStats): Observable<ICopyStats> {
        const dirPath = dirname(copyDetails.destination);

        return this.createDirectory(dirPath).pipe(
            mergeMap(() => this.copyFileAsync(copyDetails.source, copyDetails.destination)),
            map(() => copyDetails)
        );
    }

    private createDirectory(outPath: string): Observable<string | undefined> {
        return (this.dirLookup[outPath] = this.dirLookup[outPath] || createDirAsync(outPath));
    }

    private copyFileAsync(source: string, destination: string): Observable<unknown> {
        return from(this.options.copyFunction(source, destination)).pipe(
            tap(undefined, () => console.log(`${chalk.red('Error: ')} could not copy '${source}'`))
        );
    }
}

function createDirAsync(outPath: string): Observable<string | undefined> {
    return from(mkdirp(outPath)).pipe(shareReplay());
}
