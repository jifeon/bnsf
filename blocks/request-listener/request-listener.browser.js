/**@module request-listener*/
modules.define('request-listener', ['jquery'], function (provide, $, RequestListener) {
    "use strict";

    /**
     * @class RequestListener
     * @extends BEM
     * @exports
     */
    provide(RequestListener.decl(/**@lends RequestListener.prototype*/{

        /**
         * @protected
         */
        _initListener: function () {
            var _this = this;
            $(document).delegate('a', 'click', function (e) {
                if (!e.metaKey && !e.ctrlKey && this.protocol === location.protocol
                    && this.host === location.host && !this.attributes.target) {
                    e.preventDefault();
                    _this._handleRequest({
                        request: {
                            url: this.pathname + this.search,
                            method: 'GET'
                        }
                    });
                }
            });
            $(window).on('popstate', function () {
                _this._handleRequest({
                    request: {
                        url: location.pathname + location.search,
                        isUrlUpdated: true,
                        method: 'GET'
                    }
                });
            });
        }

    }));

});

