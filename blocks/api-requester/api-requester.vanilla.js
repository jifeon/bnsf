/**@module api-requester*/
modules.define('api-requester', ['i-bem'], function (provide, BEM) {
    "use strict";

    /**
     * @class ApiRequester
     * @param {RouterBase} router
     * @throws if router is absent
     * @extends BEM
     * @exports
     */
    provide(BEM.decl(this.name, /**@lends ApiRequester.prototype*/{

        onSetMod: {
            js: {
                /**
                 * @constructs
                 */
                inited: function () {
                    if (!this.params.router) {
                        throw new Error('Required parameter router is not found');
                    }
                }
            }
        },

        /**
         * @param {String} route
         * @param {?Object} [routeParameters]
         * @returns {vow:Promise}
         */
        get: function (route, routeParameters) {
            return this.sendRequest('get', route, routeParameters);
        },

        /**
         * @param {String} route
         * @param {?Object} [routeParameters]
         * @param {Object} [body]
         * @returns {vow:Promise}
         */
        post: function (route, routeParameters, body) {
            return this.sendRequest('post', route, routeParameters, body);
        },

        /**
         * @param {String} route
         * @param {?Object} [routeParameters]
         * @param {Object} [body]
         * @returns {vow:Promise}
         */
        put: function (route, routeParameters, body) {
            return this.sendRequest('put', route, routeParameters, body);
        },

        /**
         * @param {String} route
         * @param {?Object} [routeParameters]
         * @param {Object} [body]
         * @returns {vow:Promise}
         */
        patch: function (route, routeParameters, body) {
            return this.sendRequest('patch', route, routeParameters, body);
        },

        /**
         * @param {String} route
         * @param {?Object} [routeParameters]
         * @returns {vow:Promise}
         */
        del: function (route, routeParameters) {
            return this.sendRequest('delete', route, routeParameters);
        },

        /**
         * @param {String} method
         * @param {String} route
         * @param {?Object} [routeParameters]
         * @param {String|Object} [body]
         * @returns {vow:Promise}
         */
        sendRequest: function (method, route, routeParameters, body) {

        }

    }));

});
