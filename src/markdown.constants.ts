import chalk from 'chalk';
import { UsageGuideConfig } from 'ts-command-line-args';

export type BarMode = 'files' | 'bytes' | 'both';

export type ICommandLineArgs = {
    sourceDir?: string;
    glob?: string;
    outDir: string;
    help: boolean;
    concurrentCopy: number;
    eta: boolean;
    bar: BarMode;
};

export const commandName = 'copy-progress';
const defaultConcurrentCopy = 1;

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
        bar: {
            type: parseBar,
            alias: 'b',
            defaultValue: 'both',
            description: 'Shows either file count progress bar or bytes progress bar. If omitted both bars show',
        },
        help: { type: Boolean, alias: 'h', description: 'shows this help guide' },
    },
    parseOptions: {
        optionsHeaderLevel: 3,
        optionsHeaderText: 'All Options',
        helpArg: 'help',
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
