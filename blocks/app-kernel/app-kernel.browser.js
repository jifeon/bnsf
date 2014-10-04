/**@module app-kernel*/
modules.define('app-kernel', [
    'i-bem__dom', 'app-api-requester', 'app-navigation'
], function (provide, BEMDOM, apiRequester, navigation, appKernelDecl) {
    "use strict";

    /**
     * @class AppKernel
     * @extends BEM.DOM
     * @exports
     */
    provide(BEMDOM.decl(this.name, appKernelDecl).decl(/**@lends AppKernel.prototype*/{

        onSetMod: {
            js: {
                /**
                 * @constructs
                 */
                inited: function () {
                    this.__base();
                    this._cacheCurrentPage(this.params.currentPage);
                }
            }
        },

        /**
         * @param {RequestData} data
         * @returns {RequestData}
         * @protected
         */
        _fillRequestData: function (data) {
            data = this.__base(data);
            data.apiRequester = apiRequester;
            return data;
        },

        /**
         * @param {String} pageName
         * @private
         */
        _cacheCurrentPage: function (pageName) {
            this._currentPage = this.findBlockInside(pageName);
            this._currentPageName = pageName;
        },

        /**
         * @param {String} page
         * @returns {boolean}
         * @private
         */
        _isPartialUpdateAvailable: function (page) {
            return this._currentPageName === page && typeof this._currentPage.update === 'function';
        },

        /**
         * @param {String} page
         * @param {Object} data
         * @returns {vow:Promise}
         * @protected
         */
        _processPage: function (page, data) {
            //abort all app requests on page change
            apiRequester.abort();
            if (this._isPartialUpdateAvailable(page)) {
                return this._postProcessPage(this._currentPage.update(data), data);
            } else {
                return this.__base(page, data);
            }
        },

        /**
         * @param {Object} data
         * @protected
         */
        _onPageProcessSuccess: function (data) {
            navigation.navigate(data);
        },

        /**
         * @param {String} html
         * @param {Object} data
         * @param {Function} Page
         * @protected
         */
        _writeResponse: function (html, data, Page) {
            BEMDOM.replace(this._currentPage.domElem, html);
            this._cacheCurrentPage(Page.getName());
            document.title = Page.getTitle();
        },

        /**
         * @param {String} url
         * @param {RequestData} data
         * @protected
         */
        _redirect: function (url, data) {
            window.location = url;
        }
    }));
});
