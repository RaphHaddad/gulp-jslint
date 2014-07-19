/**
 * gulp.jslint.js
 * Copyright (C) 2014 Karim Alibhai.
 **/

(function () {
    "use strict";

    // load up colorful strings
    require('colors');

    var path = require('path'),
        evtStr = require('event-stream'),
        jslint = require('jslint'),
        JSLINT = null,
        doLint = function (options) {
            return function (src, fn) {
                var retVal, js,
                    lint = function (err) {
                        var myRet;

                        // prepare for linting exports
                        src.jslint = {};

                        if (err || !JSLINT) {
                            myRet = fn(err || new Error('gulp-jslint: failed to load JSLINT.'));
                        } else {
                            // convert to string
                            js = src.contents.toString('utf8');

                            // lint the file
                            src.jslint.edition = JSLINT.edition;
                            src.jslint.success = JSLINT(js, options);
                            src.jslint.errors = JSLINT.errors;

                            if (options.reporter !== 'default') {
                                // only support paths to reporter, or
                                // pre-loaded reporters
                                try {
                                    if (typeof options.reporter === 'string') {
                                        options.reporter = require(options.reporter);
                                    } else if (typeof options.reporter !== 'function') {
                                        options.reporter = 'default';
                                    }
                                } catch (err_a) {
                                    fn(err_a);
                                }
                            }

                            // load the default reporter
                            if (options.reporter === 'default') {
                                options.reporter = function (evt) {
                                    var msg = '       ', i;

                                    // shorten path
                                    evt.file = evt.file.replace(path.join(path.resolve('./'), '/'), '');

                                    // colorify
                                    evt.file = evt.pass ? evt.file.green : evt.file.red;

                                    // print file name
                                    msg += evt.file;

                                    // add reasons to errors
                                    if (!evt.pass) {
                                        for (i = 0; i < evt.errors.length; i += 1) {
                                            if (evt.errors[i]) {
                                                msg += ('\n           ' +
                                                    evt.errors[i].line + ':' +
                                                    evt.errors[i].character + ': ' +
                                                    evt.errors[i].reason).red;
                                            }
                                        }
                                    }

                                    // write to screen
                                    console.log(msg);
                                };
                            }

                            // pass error handling onto reporter
                            options.reporter({
                                pass: src.jslint.success,
                                file: src.path,
                                errors: JSLINT.errors
                            });

                            // decide where to go
                            if (src.jslint.success) {
                                myRet = fn(null, src);
                            } else {
                                fn(new Error('gulp-jslint: failed to lint file.'));
                            }
                        }

                        return myRet;
                    };

                if (src.isStream()) {
                    retVal = fn(new Error('gulp-jslint: bad file input.'));
                } else {
                    if (!src.isNull()) {
                        if (JSLINT === null) {
                            JSLINT = jslint.load('latest');
                        }

                        retVal = lint(null);
                    }

                    return retVal;
                }
            };
        };



    module.exports = function (options) {
        // fallback to object
        options = options || {};

        // set default reporter
        options.reporter = options.reporter || 'default';

        // force boolean
        options.errorsOnly = options.hasOwnProperty('errorsOnly') && options.errorsOnly === true;

        // begin linting
        return evtStr.map(doLint(options));
    };
}());