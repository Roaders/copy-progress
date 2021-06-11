import { from, merge, Observable } from 'rxjs';
import { mergeMap, shareReplay } from 'rxjs/operators';
import { createResult, streamProgress, streamScanPathResults, streamTotal } from '../helpers';
import { MultiBar } from 'cli-progress';
import { copyFile } from '../helpers/copy-file.helper';
import { parse } from 'ts-command-line-args';
import { commandName, usageGuideInfo } from '../markdown.constants';
import { ICommandLineArgs, ScanResult } from '../contracts';
import glob from 'glob';
import print from 'message-await';
import chalk from 'chalk';
import { resolve } from 'path';
import prettyBytes from 'pretty-bytes';

const barNameLength = 10;

async function copyDirProgress() {
    const args = parse<ICommandLineArgs>(usageGuideInfo.arguments, usageGuideInfo.parseOptions);

    const scanResults = await loadFiles(args);

    const progressBar = new MultiBar({
        hideCursor: true,
        format: `{barName} [{bar}] {percentage}% | ETA: {eta}s | {formattedValue}/{formattedTotal}`,
    });
    const filesBar = progressBar.create(0, 0, { barName: barTitle('Files:') });
    const bytesBar = progressBar.create(0, 0, { barName: barTitle('Bytes:') });

    const totals = streamTotal(scanResults);
    const copyResults = scanResults.pipe(mergeMap(copyFile, 10));
    const progress = streamProgress(merge(copyResults, totals));

    progress.subscribe(
        (result) => {
            filesBar.setTotal(result.totalFiles);
            filesBar.update(result.completedFiles, {
                formattedValue: result.completedFiles,
                formattedTotal: result.totalFiles,
            });
            bytesBar.setTotal(result.totalBytes);
            bytesBar.update(result.completedBytes, {
                formattedValue: prettyBytes(result.completedBytes),
                formattedTotal: prettyBytes(result.totalBytes),
            });
        },
        undefined,
        () => progressBar.stop()
    );
}

async function loadFiles(args: ICommandLineArgs): Promise<Observable<ScanResult>> {
    if (args.glob != null) {
        const files = await print(`Scanning ${args.glob}`, { format: chalk.blue }).await(promisifyGlob(args.glob));
        return from(files).pipe(mergeMap(createResult), shareReplay());
    } else if (args.sourceDir) {
        return streamScanPathResults(resolve(args.sourceDir)).pipe(shareReplay());
    } else {
        console.log(
            `${chalk.red('ERR:')} 'sourceDir' or 'glob' must be specified. Please see '${commandName} -h' for help.`
        );
        process.exit(1);
    }
}

function barTitle(name: string): string {
    while (name.length < barNameLength) {
        name = name + ' ';
    }

    return name;
}

function promisifyGlob(pattern: string): Promise<string[]> {
    return new Promise((resolve, reject) => {
        glob(pattern, {}, (err, files) => {
            if (err != null) {
                reject(err);
            } else {
                resolve(files);
            }
        });
    });
}

copyDirProgress();
