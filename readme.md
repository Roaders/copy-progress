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


