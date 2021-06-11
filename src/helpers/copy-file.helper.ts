import { join, relative } from 'path';
import { from, Observable } from 'rxjs';
import { ScanResult } from '../contracts';
import { copyFile as fsCopyFile } from 'fs';
import mkdirp from 'mkdirp';
import { map } from 'rxjs/operators';
import chalk from 'chalk';
import { ICommandLineArgs } from '../markdown.constants';

export class CopyFileHelper {
    constructor(private args: ICommandLineArgs) {}

    public performCopy(result: ScanResult): Observable<ScanResult> {
        const sourcePath = relative(process.cwd(), result.sourcePath);
        const outPath = join(this.args.outDir, sourcePath);

        switch (result.pathType) {
            case 'directory':
                return this.createDirectory(result, outPath);
            case 'file':
                return this.copyFileAsync(result, outPath);
        }
    }

    private createDirectory(result: ScanResult, outPath: string): Observable<ScanResult> {
        return from(mkdirp(outPath)).pipe(map(() => result));
    }

    private copyFileAsync(result: ScanResult, outPath: string): Observable<ScanResult> {
        return new Observable<ScanResult>((subscriber) => {
            fsCopyFile(result.sourcePath, outPath, (err) => {
                if (err != null) {
                    console.log(`${chalk.red('Error: ')} could not copy '${result.sourcePath}'`);
                    console.log(result);
                    subscriber.error(err);
                }
                subscriber.next(result);
                subscriber.complete();
            });
        });
    }
}
