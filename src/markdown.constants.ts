import { UsageGuideConfig } from 'ts-command-line-args';
import { ICommandLineArgs } from './contracts';

export const commandName = 'copy-progress';

export const usageGuideInfo: UsageGuideConfig<ICommandLineArgs> = {
    arguments: {
        sourceDir: { type: String, alias: 's', optional: true },
        glob: { type: String, alias: 'g', optional: true },
        help: { type: Boolean, alias: 'h' },
    },
    parseOptions: {
        helpArg: 'help',
    },
};
