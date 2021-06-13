#!/usr/bin/env node

import { from, Observable } from 'rxjs';
import { map, mergeMap, shareReplay } from 'rxjs/operators';
import { createScanResult, streamScanPathResults } from '../helpers';
import { MultiBar, SingleBar } from 'cli-progress';
import { parse } from 'ts-command-line-args';
import { commandName, ICommandLineArgs, usageGuideInfo } from '../markdown.constants';
import { ICopyStats, IFileStats } from '../contracts';
import glob from 'glob';
import print from 'message-await';
import chalk from 'chalk';
import { join } from 'path';
import prettyBytes from 'pretty-bytes';
import ms from 'ms';
import { copyFiles } from '../';

const barNameLength = 10;

let progressBar: MultiBar;

async function copyDirProgress() {
    const args = parse<ICommandLineArgs>(usageGuideInfo.arguments, usageGuideInfo.parseOptions);
    const files = await loadFiles(args);

    console.log(' ');

    const copyStats = files.pipe(
        map<IFileStats, ICopyStats>((fileDetails) => ({
            ...fileDetails,
            destination: join(args.outDir, fileDetails.source),
        })),
        shareReplay()
    );

    const progressStream = copyFiles(copyStats);
    const { filesBar, bytesBar } = createProgressBars(args);

    const start = Date.now();

    let totalFiles = 0;
    let totalBytes = 0;

    progressStream.subscribe(
        (result) => {
            if (filesBar != null) {
                filesBar.setTotal(result.totalFiles);
                filesBar.update(result.completedFiles, {
                    formattedValue: result.completedFiles,
                    formattedTotal: result.totalFiles,
                });
            }
            if (bytesBar != null) {
                bytesBar.setTotal(result.totalBytes);
                bytesBar.update(result.completedBytes, {
                    formattedValue: prettyBytes(result.completedBytes),
                    formattedTotal: prettyBytes(result.totalBytes),
                });
            }

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

function createProgressBars(args: ICommandLineArgs) {
    const etaFormat = args.eta ? ' | ETA: {eta}s' : '';

    progressBar = new MultiBar({
        hideCursor: true,
        format: `{barName} [{bar}] {percentage}%${etaFormat} | {formattedValue}/{formattedTotal}`,
    });

    let filesBar: SingleBar | undefined;
    let bytesBar: SingleBar | undefined;

    if (args.bar === 'files' || args.bar === 'both') {
        filesBar = progressBar.create(0, 0, { barName: barTitle('Files:') });
    }

    if (args.bar === 'bytes' || args.bar === 'both') {
        bytesBar = progressBar.create(0, 0, { barName: barTitle('Bytes:') });
    }

    return { progressBar, filesBar, bytesBar };
}

async function loadFiles(args: ICommandLineArgs): Promise<Observable<IFileStats>> {
    let files: Observable<IFileStats>;

    if (args.glob != null) {
        const filesList = await print(`Scanning ${args.glob}`, { format: chalk.blue }).await(promisifyGlob(args.glob));
        files = from(filesList).pipe(mergeMap(createScanResult));
    } else if (args.sourceDir) {
        console.log(chalk.blue(`Scanning ${args.sourceDir}...`));
        files = streamScanPathResults(args.sourceDir);
    } else {
        console.log(
            `${chalk.red('ERR:')} 'sourceDir' or 'glob' must be specified. Please see '${commandName} -h' for help.`
        );
        process.exit(1);
    }

    return files;
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
