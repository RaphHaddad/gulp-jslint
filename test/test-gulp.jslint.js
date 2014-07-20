/**
 * test-gulp.jslint
 * Some basic tests to ensure that
 * package is working as intended.
 *
 * Copyright (C) 2014 Karim Alibhai.
 **/
/*jslint nomen:true*/

(function () {
    "use strict";

    var fs = require('fs'),
        path = require('path'),
        test = require('tape'),
        Vinyl = require('vinyl'),
        jslint = require('../gulp.jslint.js'),
        lint = function (why, file, dir) {
            var goodCode = true;

            // directives
            dir = dir || {};

            // create test
            test(why, function (t) {
                t.plan(1);

                // hook in custom reporter
                dir.reporter = function (evt) {
                    if (goodCode && evt.pass) {
                        t.ok(true, 'lint passed (' + file + ')');
                    } else {
                        t.ok(!goodCode, 'lint failed (' + file + ')');
                    }
                };

                // create stream
                var str = jslint(dir);

                // read in sample file
                fs.readFile(path.resolve(__dirname, './' + file), function (err, data) {
                    if (err) {
                        t.fail(err);
                    } else {
                        // prepare callback
                        str.on('error', function (err) {
                            err = String(err);

                            if (err.indexOf('failed') === -1) {
                                t.fail(err);
                            }
                        });

                        // push file into stream
                        str.write(new Vinyl({
                            base: __dirname,
                            cwd: path.resolve(__dirname, '../'),
                            path: path.join(__dirname, file),
                            contents: data
                        }));
                    }
                });
            });

            // allow test to expect failure
            return {
                fail: function () {
                    goodCode = false;
                }
            };
        };

    // basic linting tests
    lint('with good code', 'test-good.js');
    lint('with bad code', 'test-nomen.js').fail();
    lint('with directives', 'test-nomen.js', {
        nomen: true
    });

    // test core stuff
    test('custom reporter via string', function (t) {
        t.plan(3);

        var str = jslint({
            reporter: path.resolve(__dirname, './test-reporter.js')
        });

        str.on('data', function () {
            t.ok(global.GULP_JSLINT_REPORTER, 'reporter fired');
            t.ok(global.GULP_JSLINT_REPORTER.hasOwnProperty('pass'), 'lint status is in event data');
            t.ok(global.GULP_JSLINT_REPORTER.hasOwnProperty('file'), 'source file is in event data');
        });

        fs.readFile(path.resolve(__dirname, './test-good.js'), function (err, data) {
            if (err) {
                t.fail(err);
            } else {
                str.write(new Vinyl({
                    base: __dirname,
                    cwd: path.resolve(__dirname, '../'),
                    path: path.join(__dirname, 'test-good.js'),
                    contents: data
                }));
            }
        });
    });
    test('custom reporter via function', function (t) {
        t.plan(3);

        var str = jslint({
            reporter: function (evt) {
                t.ok(true, 'reporter fired');
                t.ok(evt.hasOwnProperty('pass'), 'lint status is in event data');
                t.ok(evt.hasOwnProperty('file'), 'source file is in event data');
            }
        });

        fs.readFile(path.resolve(__dirname, './test-good.js'), function (err, data) {
            if (err) {
                t.fail(err);
            } else {
                str.write(new Vinyl({
                    base: __dirname,
                    cwd: path.resolve(__dirname, '../'),
                    path: path.join(__dirname, 'test-good.js'),
                    contents: data
                }));
            }
        });
    });
}());