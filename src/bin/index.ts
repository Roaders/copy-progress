#!/usr/bin/env node

import { from, Observable } from 'rxjs';
import { map, mergeMap, shareReplay } from 'rxjs/operators';
import { createScanResult, fileStreamCopy, streamScanPathResults } from '../helpers';
import { MultiBar, SingleBar } from 'cli-progress';
import { parse } from 'ts-command-line-args';
import { commandName, ICommandLineArgs, usageGuideInfo } from '../markdown.constants';
import { ICopyStats, IFilesProgress, IFileStats, IStreamProgress, ProgressCopyFileFunction } from '../contracts';
import glob, { IOptions } from 'glob';
import print from 'message-await';
import chalk from 'chalk';
import { join, relative, basename, resolve } from 'path';
import prettyBytes from 'pretty-bytes';
import ms from 'ms';
import { copyFiles } from '../';
import { Stats } from 'fs';

const barNameLength = 10;

let progressBar: MultiBar;

async function copyDirProgress() {
    const args = parse<ICommandLineArgs>(usageGuideInfo.arguments, usageGuideInfo.parseOptions);

    const files = await loadFiles(args);

    const copyStats = files.pipe(
        map<IFileStats, ICopyStats>((fileDetails) => ({
            ...fileDetails,
            destination: join(args.outDir, relative(args.sourceDir, fileDetails.source)),
            force: args.force,
        })),
        shareReplay()
    );

    let progressStream: Observable<IStreamProgress | IFilesProgress>;

    const options = { concurrentCopy: args.concurrentCopy, force: args.force };

    if (args.chunk) {
        const copyFunction: ProgressCopyFileFunction<IStreamProgress> = (
            source: string,
            destination: string,
            stats: Stats
        ) => {
            return fileStreamCopy(source, destination, stats, args.force, args.highWaterMark);
        };

        progressStream = copyFiles(copyStats, { ...options, copyFunction });
    } else {
        progressStream = copyFiles(copyStats, options);
    }

    const { filesBar, bytesBar, progressBar } = createProgressBars(args);

    const start = Date.now();

    let totalFiles = 0;
    let totalBytes = 0;

    const fileBarLookup: Record<string, SingleBar | undefined> = {};

    progressStream.subscribe({
        next: (result) => {
            if (result.type === 'fileStreamProgress') {
                let bar = fileBarLookup[result.stats.source];

                if (bar == null && result.remaining > 0) {
                    bar = progressBar.create(result.length, 0, { barName: barTitle(basename(result.stats.source)) });
                    fileBarLookup[result.stats.source] = bar;
                } else if (bar == null) {
                    return;
                }

                bar.update(result.transferred, {
                    formattedValue: prettyBytes(result.transferred),
                    formattedTotal: prettyBytes(result.length),
                    speed: `${prettyBytes(result.speed)}/s`,
                });

                if (result.remaining === 0) {
                    progressBar.remove(bar);
                }
                return;
            }

            if (filesBar != null) {
                filesBar.setTotal(result.totalFiles);
                filesBar.update(result.completedFiles, {
                    formattedValue: result.completedFiles,
                    formattedTotal: result.totalFiles,
                    speed: '',
                });
            }
            if (bytesBar != null) {
                bytesBar.setTotal(result.totalBytes);
                bytesBar.update(result.completedBytes, {
                    formattedValue: prettyBytes(result.completedBytes),
                    formattedTotal: prettyBytes(result.totalBytes),
                    speed:
                        result.elapsed > 0 ? `${prettyBytes(result.completedBytes / (result.elapsed / 1000))}/s` : '',
                });
            }

            totalFiles = result.totalFiles;
            totalBytes = result.totalBytes;
        },
        complete: () => {
            progressBar.stop();

            const elapsed = Date.now() - start;

            console.log(' ');
            console.log(`${chalk.green('Complete')}`);
            console.log(`${totalFiles} files (${prettyBytes(totalBytes)}) copied in ${ms(elapsed)}`);
        },
    });
}

function createProgressBars(args: ICommandLineArgs) {
    const etaFormat = args.eta ? ' | ETA: {eta}s' : '';
    const speedFormat = args.speed ? ` {speed}` : '';

    progressBar = new MultiBar({
        hideCursor: true,
        format: `{barName} [{bar}] {percentage}%${etaFormat} | {formattedValue}/{formattedTotal}${speedFormat}`,
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
        const cwd = resolve(args.sourceDir);
        console.log(`Awaiting glob: ${cwd} : ${args.glob}`);

        const filesList = await print(`Scanning ${args.glob}`, { format: chalk.blue }).await(
            promisifyGlob(args.glob, { cwd, root: cwd })
        );
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

function promisifyGlob(pattern: string, options: IOptions = {}): Promise<string[]> {
    return new Promise((resolve, reject) => {
        glob(pattern, options, (err, files) => {
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
process.on('uncaughtException', (exception) => {
    exitHandler(false);
    throw exception;
});

copyDirProgress();
