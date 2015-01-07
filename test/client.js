var assert = require('assert'),
    replaceCSS = require('./helpers').replaceCSS,
    phantomHelpers = {
        /**
         * @param {Array.<function|{fn: function, argument: *}>} functions to call one by one
         * @param {Array} [answers] of functions
         * @param {function} callback
         */
        evaluate: function (functions, answers, callback) {
            if (!callback) {
                callback = answers;
                answers = [];
            }
            var fn = functions.shift();
            phantomHelpers.config.page.evaluate(fn.fn || fn, function (response) {
                answers.push(response);
                if (functions.length) {
                    phantomHelpers.evaluate(functions, answers, callback);
                } else {
                    callback(null, answers);
                }
            }, fn.argument);
        },

        _WAIT_STEP: 50,

        /**
         * @param {function} fn
         * @param {*} answer which we're waiting for
         * @param {number} time ms, max to wait
         * @param {function} callback
         * @param {*} [argument] for fn
         */
        waitFor: function (fn, answer, time, callback, argument) {
            var WAIT_STEP = this._WAIT_STEP;
            phantomHelpers.config.page.evaluate(fn, function (response) {
                var answerToCheck = response.test || response;
                if (answerToCheck === answer) {
                    callback(null, response);
                } else if (!time) {
                    callback(new Error("Can't get " + answer + " in time, get " + answerToCheck + " instead"), response);
                } else {
                    var timeout;
                    if (time < WAIT_STEP) {
                        timeout = time;
                        time = 0;
                    } else {
                        timeout = WAIT_STEP;
                        time -= WAIT_STEP;
                    }
                    setTimeout(function () {
                        phantomHelpers.waitFor(fn, answer, time, callback, argument);
                    }, timeout);
                }
            }, argument);
        }
    },

    /**
     * @param {string} title
     * @param {object} [config] for vows
     * @returns {object} config for vows
     */
    checkTitle = function (title, config) {
        config = config || {};
        config.topic = function () {
            phantomHelpers.evaluate([function () {
                return document.title;
            }], this.callback);
        };
        config['should be "' + title + '"'] = function (realTitle) {
            assert.equal(title, realTitle);
        };
        return config;
    },

    startNavigation = function (options, callback) {
        phantomHelpers.evaluate([
            {
                fn: function (options) {
                    var $link = window.$('a[href="' + options.path + '"]').click();
                    window.reloadTest = options.random;
                    return $link.length;
                },
                argument: options
            }
        ], callback);
    },

    waitForEndOfNavigation = function (path, time, callback) {
        phantomHelpers.waitFor(function () {
            return {
                test: location.href.toString(),
                data: window.reloadTest
            };
        }, 'http://localhost:3000' + path, time, callback);
    },

    /**
     * @param {number} random
     * @param {boolean} [withReload]
     * @returns {function}
     */
    assertPageNavigationEnd = function (random, withReload) {
        return function (err, answer) {
            if (withReload) {
                assert.notEqual(err, null);
                assert.notEqual(answer.data, random);
            } else {
                assert.equal(err, null);
                assert.equal(answer.data, random);
            }
        };
    },

    /**
     * @param {string} path
     * @param {number} time ms, max time to wait
     * @param {boolean} [withReload=false]
     * @param {object} config for vows
     * @returns {object} config for vows
     */
    checkNavigation = function (path, time, withReload, config) {
        if (!config) {
            config = withReload;
            withReload = false;
        }
        var random = Math.random(),
            output = {
                topic: function () {
                    startNavigation({ path: path, random: random }, this.callback);
                }
            };
        output['should find the link to ' + path] = function (answers) {
            assert.ok(answers[0]);
        };
        config.topic = function () {
            waitForEndOfNavigation(path, time, this.callback);
        };
        if (withReload) {
            config['should reload page'] = assertPageNavigationEnd(random, withReload);
        } else {
            config['should not reload page'] = assertPageNavigationEnd(random);
        }
        output['wait for url ' + path] = config;
        return output;
    },

    /**
     * @param {string} content
     * @param {object} [config] for vows
     * @returns {object} config for vows
     */
    checkContent = function (content, config) {
        config = config || {};
        config.topic = function () {
            phantomHelpers.evaluate([{
                fn: function (content) {
                    var regExp = new RegExp(content, 'g');
                    return regExp.test(document.getElementsByTagName('body')[0].innerHTML);
                },
                argument: content
            }], this.callback);
        };
        config['should contain "' + content + '"'] = function (answers) {
            assert.equal(answers[0], true);
        };
        return config;
    },

    /**
     * @param {object} config for vows
     * @returns {object} config for vows
     */
    prepareMainPage = function (config) {
        return {
            topic: function () {
                var _this = this;
                phantomHelpers.config.page.open('http://localhost:3000/', function (status) {
                    _this.callback(null, status);
                });
            },
            'should get status success': function (status) {
                assert.equal(status, 'success');
            },
            jquery: {
                topic: function () {
                    phantomHelpers.waitFor(function () {
                        return typeof window.$;
                    }, 'function', 100, this.callback);
                },
                'should have jquery': function (err, answer) {
                    assert.equal(err, null);
                },
                title: checkTitle('main page', config)
            }
        };
    };

exports.getFirstConfig = function (phantomConfig) {
    phantomHelpers.config = phantomConfig;
    return prepareMainPage({
        'navigation to static page': checkNavigation('/another-page/file', 200, {
            title: checkTitle('another page', {
                'navigation back to main page': checkNavigation('/', 200, {
                    title: checkTitle('main page', {
                        'navigation to dynamic page': checkNavigation('/dynamic-page', 1000, {
                            title: checkTitle('dynamic page'),
                            content: checkContent('node_modules'),
                            'navigation back to main page': checkNavigation('/', 200, {
                                title: checkTitle('main page', {
                                    'navigation to dynamic page with get params': checkNavigation('/dynamic-page-with-params', 1000, {
                                        title: checkTitle('dynamic page with get params'),
                                        content: checkContent('node_modules'),
                                        'navigation back to main page': checkNavigation('/', 200, {
                                            title: checkTitle('main page', {
                                                'navigation to dynamic page with css param': checkNavigation('/dynamic-page-with-params?tech=css', 1000, {
                                                    title: checkTitle('404 not found'),
                                                    content: checkContent('404 not found')
                                                })
                                            })
                                        })
                                    })
                                })
                            })
                        })
                    })
                })
            })
        })
    });
};

var random = Math.random();
exports.getSecondConfig = function (phantomConfig) {
    phantomHelpers.config = phantomConfig;
    return prepareMainPage({
        'navigation to dynamic page with css param while css exist': {
            topic: replaceCSS(function (callback) {
                var path = '/dynamic-page-with-params?tech=css';
                startNavigation({
                    path: path,
                    random: random
                }, function () {
                    waitForEndOfNavigation(path, 1000, callback);
                });
            }),
            'should not reload page': assertPageNavigationEnd(random),
            'navigation back to main page': checkNavigation('/', 200, {
                title: checkTitle('main page', {
                    'navigation to redirect page': checkNavigation('/page-with-redirect', 100, true, {
                        title: checkTitle('main page')
                    })
                })
            })
        }
    });
};