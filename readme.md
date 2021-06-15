# copy-progress

## CLI Usage

### Installation

```bash
npm install -g copy-progress
```

#### Npm 6

If you are using npm version 6 you will also have to install a peer dependency:

```bash
npm install -g rxjs@6
```

It is recommend to update to Npm 7:

```bash
npm install -g npm@7
```

### Usage

```bash
copy-progress -o mySourceFolder -o myDestinationFolder
```
![Copy Example](https://github.com/Roaders/copy-progress/raw/master/assets/copy-simple.gif)

#### ETA

ETA can be displayed with `-e` or `--eta`. This is best used for copying larger files:

```bash
copy-progress -o mySourceFolder -o myDestinationFolder -e
```

#### Bars

By default a file count and a bytes progress bar can be displayed. This can be changed with the  `--bar` or `-b` argument using either `files` or `bytes`:

```bash
copy-progress -o mySourceFolder -o myDestinationFolder -b files
```
![Copy Example](https://github.com/Roaders/copy-progress/raw/master/assets/copy-files-bar.gif)

```bash
copy-progress -o mySourceFolder -o myDestinationFolder -b bytes
```
![Copy Example](https://github.com/Roaders/copy-progress/raw/master/assets/copy-files-bytes.gif)

[//]: ####ts-command-line-args_write-markdown_replaceBelow

### Options

| Argument | Alias | Type | Description |
|-|-|-|-|
| **sourceDir** | **s** | string | The source path to copy from. Must be specified if 'glob' is not specified |
| **glob** | **g** | string | glob pattern to copy. Must be specified if 'sourceDir' is not specified. For example: 'myFolder/**/*.js' |
| **outDir** | **o** | string | folder to copy to. |
| **concurrentCopy** | | number | number of concurrent copy operations to perform. Defaults to 1 |
| **eta** | **e** | boolean | shows ETA of copy completion. For a lot of small files can be very inaccurate |
| **chunk** | **c** | boolean | Copies the files in chunks using a readFileStream and a writeFileStream. 'highWaterMark' determines chink size |
| **highWaterMark** | **w** | '1kb' \| '4Mb' \| '1GB' | Highwatermark used for chunk size when copy method is 'chunk'. Defaults to '1048576'. |
| **bar** | **b** | 'bytes' \| 'files' | Shows either file count progress bar or bytes progress bar. If omitted both bars show |
| **help** | **h** | boolean | shows this help guide |

[//]: ####ts-command-line-args_write-markdown_replaceAbove
  

[//]: ####ts-command-line-args_generated-by-footer
Markdown Generated by [ts-command-line-args](https://www.npmjs.com/package/ts-command-line-args)