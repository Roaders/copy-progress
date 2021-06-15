import chalk from 'chalk';
import { UsageGuideConfig } from 'ts-command-line-args';

export type BarMode = 'files' | 'bytes' | 'both';

export interface ICommandLineArgs {
    sourceDir?: string;
    glob?: string;
    outDir: string;
    concurrentCopy: number;
    help: boolean;
    eta: boolean;
    bar: BarMode;
    chunk: boolean;
    highWaterMark: number;
}
export const kilobyte = 1024;
export const commandName = 'copy-progress';
const defaultConcurrentCopy = 1;
const oneMb = kilobyte * kilobyte;
const defaultHighWaterMark = oneMb;

export const usageGuideInfo: UsageGuideConfig<ICommandLineArgs> = {
    arguments: {
        sourceDir: {
            type: String,
            alias: 's',
            optional: true,
            description: `The source path to copy from. Must be specified if 'glob' is not specified`,
        },
        glob: {
            type: String,
            alias: 'g',
            optional: true,
            description:
                "glob pattern to copy. Must be specified if 'sourceDir' is not specified. For example: 'myFolder/**/*.js'",
        },
        outDir: { type: String, alias: 'o', description: 'folder to copy to.' },
        concurrentCopy: {
            type: Number,
            defaultValue: defaultConcurrentCopy,
            description: `number of concurrent copy operations to perform. Defaults to ${defaultConcurrentCopy}`,
        },
        eta: {
            type: Boolean,
            alias: 'e',
            description: 'shows ETA of copy completion. For a lot of small files can be very inaccurate',
        },
        chunk: {
            type: Boolean,
            alias: 'c',
            description: `Copies the files in chunks using a readFileStream and a writeFileStream. 'highWaterMark' determines chink size`,
        },
        highWaterMark: {
            type: parseBytes,
            typeLabel: `'1kb' \\| '4Mb' \\| '1GB'`,
            alias: 'w',
            defaultValue: defaultHighWaterMark,
            description: `Highwatermark used for chunk size when copy method is 'chunk'. Defaults to '${defaultHighWaterMark}'.`,
        },
        bar: {
            type: parseBar,
            alias: 'b',
            typeLabel: "'bytes' \\| 'files'",
            defaultValue: 'both',
            description: 'Shows either file count progress bar or bytes progress bar. If omitted both bars show',
        },
        help: { type: Boolean, alias: 'h', description: 'shows this help guide' },
    },
    parseOptions: {
        optionsHeaderLevel: 3,
        helpArg: 'help',
        headerContentSections: [
            {
                header: `copy-progress`,
                includeIn: 'cli',
                content:
                    'Copies files using either a source folder or a glob pattern. Copy progress is displayed in the terminal using progress bars and an optional ETA indicator.',
            },
        ],
    },
};

function parseBar(input: string): BarMode {
    const barMode = input as BarMode;
    switch (input as BarMode) {
        case 'bytes':
        case 'files':
            return barMode;

        default:
            console.log(`${chalk.red('Error: ')} 'bar' must be either 'files' or 'bytes'`);
            process.exit(1);
    }
}

const bytesRegExp = /^([\d.]+)(\w+)$/;
const unitLookup: Record<string, number> = {
    kB: kilobyte,
    MB: kilobyte * kilobyte,
    GB: kilobyte * kilobyte * kilobyte,
};

export function parseBytes(stringValue: string): number {
    const regExpResult = bytesRegExp.exec(stringValue);
    const unitValue = regExpResult?.[2] != null ? unitLookup[regExpResult[2]] : undefined;
    const value = regExpResult?.[1] != null ? parseFloat(regExpResult[1]) : undefined;

    if (regExpResult == null || unitValue == null || value == null || isNaN(value)) {
        const units = Object.keys(unitLookup);
        console.log(
            `${chalk.red(
                'ERROR: '
            )} Could not parse bytes from '${stringValue}'. Should be in the form '2.3kB'. Supported units: ${units}`
        );
        process.exit();
    }

    return value * unitValue;
}
