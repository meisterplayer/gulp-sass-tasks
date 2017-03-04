const gulp = require('gulp');
const base = require('gulp-base');
const sass = require('gulp-sass');
const through = require('through2');
const rename = require('gulp-rename');
const plumber = require('gulp-plumber');
const cssBase64 = require('gulp-css-base64');

/**
 * Default options used by the createCompileSass function.
 * @typedef {Object} defaultOptions
 * @property {String} [bundleName='bundle.css'] - Name of the css file.
 * @property {function} [log=console.log] - Function to be called when logging task progress.
 * @property {function} [logError=console.error] - Function to be called when logging errors.
 * @property {Boolean} [minified=true] - Flag indicating whether to minify the css or not.
 * @property {function} [onEnd=()=>{}] - Function that gulp pipes the final css file into.
 */
const defaultOpts = {
    bundleName: 'bundle.css',
    log: console.log,
    logError: console.error,
    minified: true,
    onEnd: () => through.obj((file, enc, cb) => { cb(null, file); }),
};

/**
* Higher order function to create gulp function that compile sass files.
 * @param  {String} inPath        File to be used as the entry point.
 * @param  {String} outPath       Directory path to which the compiled file should be written.
 * @param  {defaultOptions} [userOpts={}] Optional overrides of the default config.
 * @return {function}             Function that can be used as a gulp task to compile sass.
 */
function createCompileSass(inPath, outPath, userOpts = {}) {
    if (!inPath) {
        throw new Error('Input path argument is required');
    }

    if (!outPath) {
        throw new Error('Output path argument is required');
    }

    const opts = Object.assign({}, defaultOpts, userOpts);
    const { bundleName, log, logError, minified, onEnd } = opts;

    return function compileSass() {
        const startTime = process.hrtime();
        log({
            message: 'Sass: starting',
            eventType: 'start',
            timeStamp: startTime,
        });

        return gulp.src(inPath)
            .pipe(plumber({
                errorHandler: (err) => {
                    logError({
                        message: 'Sass: error',
                        eventType: 'error',
                        timeStamp: process.hrtime(),
                        err,
                    });
                    this.emit('end');
                },
            }))
            .pipe(sass({ outputStyle: minified ? 'compressed' : 'nested' }))
            // Set the base paths to the root directory so resource paths make sense
            .pipe(base('./'))
            .pipe(rename((path) => { path.dirname = './'; }))
            .pipe(cssBase64())
            .pipe(rename(bundleName))
            .pipe(gulp.dest(outPath))
            .pipe(through.obj((file, enc, done) => {
                log({
                    message: 'Sass: finished',
                    eventType: 'end',
                    timeStamp: process.hrtime(),
                    startTime,
                });

                done(null, file);
            }))
            .pipe(onEnd());
    };
}

module.exports = {
    createCompileSass,
};
