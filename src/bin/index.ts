#!/usr/bin/env node

import { from, merge, Observable } from 'rxjs';
import { mergeMap, shareReplay } from 'rxjs/operators';
import { createResult, streamProgress, streamScanPathResults, streamTotal } from '../helpers';
import { MultiBar } from 'cli-progress';
import { CopyFileHelper } from '../helpers/copy-file.helper';
import { parse } from 'ts-command-line-args';
import { commandName, ICommandLineArgs, usageGuideInfo } from '../markdown.constants';
import { ScanResult } from '../contracts';
import glob from 'glob';
import print from 'message-await';
import chalk from 'chalk';
import { resolve } from 'path';
import prettyBytes from 'pretty-bytes';
import ms from 'ms';

const barNameLength = 10;

let progressBar: MultiBar;

async function copyDirProgress() {
    const args = parse<ICommandLineArgs>(usageGuideInfo.arguments, usageGuideInfo.parseOptions);
    const copyHelper = new CopyFileHelper(args);
    const { files } = await loadFiles(args);

    console.log(' ');

    const etaFormat = args.eta ? ' | ETA: {eta}s' : '';

    progressBar = new MultiBar({
        hideCursor: true,
        format: `{barName} [{bar}] {percentage}%${etaFormat} | {formattedValue}/{formattedTotal}`,
    });
    const filesBar = progressBar.create(0, 0, { barName: barTitle('Files:') });
    const bytesBar = progressBar.create(0, 0, { barName: barTitle('Bytes:') });

    const totals = streamTotal(files);
    const copyResults = files.pipe(mergeMap((result) => copyHelper.performCopy(result), args.concurrentCopy));
    const progress = streamProgress(merge(copyResults, totals));

    const start = Date.now();

    let totalFiles = 0;
    let totalBytes = 0;

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

            totalFiles = result.totalFiles;
            totalBytes = result.totalBytes;
        },
        undefined,
        () => {
            progressBar.stop();

            const elapsed = Date.now() - start;

            console.log(' ');
            console.log(`${chalk.green('Complete')}`);
            console.log(`${totalFiles} files (${prettyBytes(totalBytes)}) copied in ${ms(elapsed)}`);
        }
    );
}

async function loadFiles(args: ICommandLineArgs): Promise<{ files: Observable<ScanResult> }> {
    let files: Observable<ScanResult>;

    if (args.glob != null) {
        const filesList = await print(`Scanning ${args.glob}`, { format: chalk.blue }).await(promisifyGlob(args.glob));
        files = from(filesList).pipe(mergeMap(createResult), shareReplay());
    } else if (args.sourceDir) {
        console.log(chalk.blue(`Scanning ${args.sourceDir}...`));
        const root = resolve(args.sourceDir);
        files = streamScanPathResults(root).pipe(shareReplay());
    } else {
        console.log(
            `${chalk.red('ERR:')} 'sourceDir' or 'glob' must be specified. Please see '${commandName} -h' for help.`
        );
        process.exit(1);
    }

    return { files };
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

function exitHandler(exit: boolean) {
    if (progressBar != undefined) {
        progressBar.stop();
    }
    if (exit) {
        process.exit();
    }
}

//do something when app is closing
process.on('exit', () => exitHandler(false));
//catches ctrl+c event
process.on('SIGINT', () => exitHandler(true));
// catches "kill pid" (for example: nodemon restart)
process.on('SIGUSR1', () => exitHandler(true));
process.on('SIGUSR2', () => exitHandler(true));
//catches uncaught exceptions
process.on('uncaughtException', () => exitHandler(true));

copyDirProgress();
