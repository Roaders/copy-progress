import { from, Observable } from 'rxjs';
import { copyFile as fsCopyFile } from 'fs';
import mkdirp from 'mkdirp';
import chalk from 'chalk';
import { map, mergeMap, shareReplay } from 'rxjs/operators';
import { dirname } from 'path';
import { ICopyStats } from '../contracts';

export class CopyFileHelper {
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

    private copyFileAsync(source: string, destination: string): Observable<void> {
        return new Observable<void>((subscriber) => {
            fsCopyFile(source, destination, (err) => {
                if (err != null) {
                    console.log(`${chalk.red('Error: ')} could not copy '${source}'`);
                    subscriber.error(err);
                }
                subscriber.next();
                subscriber.complete();
            });
        });
    }
}

function createDirAsync(outPath: string): Observable<string | undefined> {
    return from(mkdirp(outPath)).pipe(shareReplay());
}
