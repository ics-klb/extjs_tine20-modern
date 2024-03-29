/*
 * IcsDesktop 2.4.0
 * 
 * @package     Modern
 * @subpackage  JS Library
 * @copyright   Copyright (c) 2018 LLC ICS (http://www.icstime.com)
 * @license     http://www.gnu.org/licenses/agpl.html AGPL Version 3
 */

Ext.define('Klb.system.ux.desktop.UpdateManager', {
    extend: 'Ext.util.Observable',

    updateManager: null,

    defaultUrl: null,
    el: null,

    constructor: function (config) {
        var me = this;
          config = config || {};
          config.el = Ext.get( config.el );

            if( !config.forceNew && el.updateManager ){
                return el.updateManager;
            }
            /**
             * The Element object
             * @type Ext.Element
             */
            me.el = el;
            /**
             * Cached url to use for refreshes. Overwritten every time update() is called unless "discardUrl" param is set to true.
             * @type String
             */
 

            me.addListener({
                 scope: this,
                /**
                 * @event beforeupdate
                 * Fired before an update is made, return false from your handler and the update is cancelled.
                 * @param {Ext.Element} el
                 * @param {String/Object/Function} url
                 * @param {String/Object} params
                 */
                "beforeupdate": true,
                /**
                 * @event update
                 * Fired after successful update is made.
                 * @param {Ext.Element} el
                 * @param {Object} oResponseObject The response Object
                 */
                "update": true,
                /**
                 * @event failure
                 * Fired on update failure.
                 * @param {Ext.Element} el
                 * @param {Object} oResponseObject The response Object
                 */
                "failure": true
            });

            var d = Klb.system.ux.desktop.UpdateManager.defaults;
            /**
             * Blank page URL to use with SSL file uploads (Defaults to Ext.UpdateManager.defaults.sslBlankUrl or "about:blank").
             * @type String
             */
            this.sslBlankUrl = d.sslBlankUrl;
            /**
             * Whether to append unique parameter on get request to disable caching (Defaults to Ext.UpdateManager.defaults.disableCaching or false).
             * @type Boolean
             */
            this.disableCaching = d.disableCaching;
            /**
             * Text for loading indicator (Defaults to Ext.UpdateManager.defaults.indicatorText or '&lt;div class="loading-indicator"&gt;Loading...&lt;/div&gt;').
             * @type String
             */
            this.indicatorText = d.indicatorText;
            /**
             * Whether to show indicatorText when loading (Defaults to Ext.UpdateManager.defaults.showLoadIndicator or true).
             * @type String
             */
            this.showLoadIndicator = d.showLoadIndicator;
            /**
             * Timeout for requests or form posts in seconds (Defaults to Ext.UpdateManager.defaults.timeout or 30 seconds).
             * @type Number
             */
            this.timeout = d.timeout;

            /**
             * True to process scripts in the output (Defaults to Ext.UpdateManager.defaults.loadScripts (false)).
             * @type Boolean
             */
            this.loadScripts = d.loadScripts;

            /**
             * Transaction object of current executing transaction
             */
            this.transaction = null;

            /**
             * @private
             */
            this.autoRefreshProcId = null;
            /**
             * Delegate for refresh() prebound to "this", use myUpdater.refreshDelegate.createCallback(arg1, arg2) to bind arguments
             * @type Function
             */
            this.refreshDelegate = this.refresh.createDelegate(this);
            /**
             * Delegate for update() prebound to "this", use myUpdater.updateDelegate.createCallback(arg1, arg2) to bind arguments
             * @type Function
             */
            this.updateDelegate = this.update.createDelegate(this);
            /**
             * Delegate for formUpdate() prebound to "this", use myUpdater.formUpdateDelegate.createCallback(arg1, arg2) to bind arguments
             * @type Function
             */
            this.formUpdateDelegate = this.formUpdate.createDelegate(this);
            /**
             * @private
             */
            this.successDelegate = this.processSuccess.createDelegate(this);
            /**
             * @private
             */
            this.failureDelegate = this.processFailure.createDelegate(this);

            if(!this.renderer){
             /**
              * The renderer for this UpdateManager. Defaults to {@link Ext.UpdateManager.BasicRenderer}.
              */
            this.renderer = new Ext.UpdateManager.BasicRenderer();
            }
            
            Ext.UpdateManager.superclass.constructor.call(this);
    },
    /**
     * Get the Element this UpdateManager is bound to
     * @return {Ext.Element} The element
     */
    getEl : function(){
        return this.el;
    },
    /**
     * Performs an async request, updating this element with the response. If params are specified it uses POST, otherwise it uses GET.
     * @param {Object/String/Function} url The url for this request or a function to call to get the url or a config object containing any of the following options:
<pre><code>
um.update({<br/>
    url: "your-url.php",<br/>
    params: {param1: "foo", param2: "bar"}, // or a URL encoded string<br/>
    callback: yourFunction,<br/>
    scope: yourObject, //(optional scope)  <br/>
    discardUrl: false, <br/>
    nocache: false,<br/>
    text: "Loading...",<br/>
    timeout: 30,<br/>
    scripts: false<br/>
});
</code></pre>
     * The only required property is url. The optional properties nocache, text and scripts
     * are shorthand for disableCaching, indicatorText and loadScripts and are used to set their associated property on this UpdateManager instance.
     * @param {String/Object} params (optional) The parameters to pass as either a url encoded string "param1=1&amp;param2=2" or an object {param1: 1, param2: 2}
     * @param {Function} callback (optional) Callback when transaction is complete - called with signature (oElement, bSuccess, oResponse)
     * @param {Boolean} discardUrl (optional) By default when you execute an update the defaultUrl is changed to the last used url. If true, it will not store the url.
     */
    update : function(url, params, callback, discardUrl){
        if(this.fireEvent("beforeupdate", this.el, url, params) !== false){
            var method = this.method, cfg;
            if(typeof url == "object"){ // must be config object
                cfg = url;
                url = cfg.url;
                params = params || cfg.params;
                callback = callback || cfg.callback;
                discardUrl = discardUrl || cfg.discardUrl;
                if(callback && cfg.scope){
                    callback = callback.createDelegate(cfg.scope);
                }
                if(typeof cfg.method != "undefined"){method = cfg.method;};
                if(typeof cfg.nocache != "undefined"){this.disableCaching = cfg.nocache;};
                if(typeof cfg.text != "undefined"){this.indicatorText = '<div class="loading-indicator">'+cfg.text+"</div>";};
                if(typeof cfg.scripts != "undefined"){this.loadScripts = cfg.scripts;};
                if(typeof cfg.timeout != "undefined"){this.timeout = cfg.timeout;};
            }
            this.showLoading();
            if(!discardUrl){
                this.defaultUrl = url;
            }
            if(typeof url == "function"){
                url = url.call(this);
            }

            method = method || (params ? "POST" : "GET");
            if(method == "GET"){
                url = this.prepareUrl(url);
            }

            var o = Ext.apply(cfg ||{}, {
                url : url,
                params: params,
                success: this.successDelegate,
                failure: this.failureDelegate,
                callback: undefined,
                timeout: (this.timeout*1000),
                argument: {"url": url, "form": null, "callback": callback, "params": params}
            });

            this.transaction = Ext.Ajax.request(o);
        }
    },

    /**
     * Performs an async form post, updating this element with the response. If the form has the attribute enctype="multipart/form-data", it assumes it's a file upload.
     * Uses this.sslBlankUrl for SSL file uploads to prevent IE security warning. See YUI docs for more info.
     * @param {String/HTMLElement} form The form Id or form element
     * @param {String} url (optional) The url to pass the form to. If omitted the action attribute on the form will be used.
     * @param {Boolean} reset (optional) Whether to try to reset the form after the update
     * @param {Function} callback (optional) Callback when transaction is complete - called with signature (oElement, bSuccess, oResponse)
     */
    formUpdate : function(form, url, reset, callback){
        if(this.fireEvent("beforeupdate", this.el, form, url) !== false){
            if(typeof url == "function"){
                url = url.call(this);
            }
            form = Ext.getDom(form)
            this.transaction = Ext.Ajax.request({
                form: form,
                url:url,
                success: this.successDelegate,
                failure: this.failureDelegate,
                timeout: (this.timeout*1000),
                argument: {"url": url, "form": form, "callback": callback, "reset": reset}
            });
            this.showLoading.defer(1, this);
        }
    },

    /**
     * Refresh the element with the last used url or defaultUrl. If there is no url, it returns immediately
     * @param {Function} callback (optional) Callback when transaction is complete - called with signature (oElement, bSuccess)
     */
    refresh : function(callback){
        if(this.defaultUrl == null){
            return;
        }
        this.update(this.defaultUrl, null, callback, true);
    },

    /**
     * Set this element to auto refresh.
     * @param {Number} interval How often to update (in seconds).
     * @param {String/Function} url (optional) The url for this request or a function to call to get the url (Defaults to the last used url)
     * @param {String/Object} params (optional) The parameters to pass as either a url encoded string "&param1=1&param2=2" or as an object {param1: 1, param2: 2}
     * @param {Function} callback (optional) Callback when transaction is complete - called with signature (oElement, bSuccess)
     * @param {Boolean} refreshNow (optional) Whether to execute the refresh now, or wait the interval
     */
    startAutoRefresh : function(interval, url, params, callback, refreshNow){
        if(refreshNow){
            this.update(url || this.defaultUrl, params, callback, true);
        }
        if(this.autoRefreshProcId){
            clearInterval(this.autoRefreshProcId);
        }
        this.autoRefreshProcId = setInterval(this.update.createDelegate(this, [url || this.defaultUrl, params, callback, true]), interval*1000);
    },

    /**
     * Stop auto refresh on this element.
     */
     stopAutoRefresh : function(){
        if(this.autoRefreshProcId){
            clearInterval(this.autoRefreshProcId);
            delete this.autoRefreshProcId;
        }
    },

    isAutoRefreshing : function(){
       return this.autoRefreshProcId ? true : false;
    },
    /**
     * Called to update the element to "Loading" state. Override to perform custom action.
     */
    showLoading : function(){
        if(this.showLoadIndicator){
            this.el.update(this.indicatorText);
        }
    },

    /**
     * Adds unique parameter to query string if disableCaching = true
     * @private
     */
    prepareUrl : function(url){
        if(this.disableCaching){
            var append = "_dc=" + (new Date().getTime());
            if(url.indexOf("?") !== -1){
                url += "&" + append;
            }else{
                url += "?" + append;
            }
        }
        return url;
    },

    /**
     * @private
     */
    processSuccess : function(response){
        this.transaction = null;
        if(response.argument.form && response.argument.reset){
            try{ // put in try/catch since some older FF releases had problems with this
                response.argument.form.reset();
            }catch(e){}
        }
        if(this.loadScripts){
            this.renderer.render(this.el, response, this,
                this.updateComplete.createDelegate(this, [response]));
        }else{
            this.renderer.render(this.el, response, this);
            this.updateComplete(response);
        }
    },

    updateComplete : function(response){
        this.fireEvent("update", this.el, response);
        if(typeof response.argument.callback == "function"){
            response.argument.callback(this.el, true, response);
        }
    },

    /**
     * @private
     */
    processFailure : function(response){
        this.transaction = null;
        this.fireEvent("failure", this.el, response);
        if(typeof response.argument.callback == "function"){
            response.argument.callback(this.el, false, response);
        }
    },

    /**
     * Set the content renderer for this UpdateManager. See {@link Ext.UpdateManager.BasicRenderer#render} for more details.
     * @param {Object} renderer The object implementing the render() method
     */
    setRenderer : function(renderer){
        this.renderer = renderer;
    },

    getRenderer : function(){
       return this.renderer;
    },

    /**
     * Set the defaultUrl used for updates
     * @param {String/Function} defaultUrl The url or a function to call to get the url
     */
    setDefaultUrl : function(defaultUrl){
        this.defaultUrl = defaultUrl;
    },

    /**
     * Aborts the executing transaction
     */
    abort : function(){
        if(this.transaction){
            Ext.Ajax.abort(this.transaction);
        }
    },

    /**
     * Returns true if an update is in progress
     * @return {Boolean}
     */
    isUpdating : function(){
        if(this.transaction){
            return Ext.Ajax.isLoading(this.transaction);
        }
        return false;
    }, 
    
    setInterval: function() {

       setInterval(function() {
            chartService.getNextSiteInfo(function(result) {
                data = data.slice();
                data.push(result);
                var toDate = timeAxis.toDate,
                    lastDate = Ext.Date.parse(result.date, "Y-m-d"),
                    markerIndex = chart.markerIndex || 0;
                if (+toDate < +lastDate) {
                    markerIndex = 1;
                    timeAxis.toDate = lastDate;
                    timeAxis.fromDate = Ext.Date.add(Ext.Date.clone(timeAxis.fromDate), Ext.Date.DAY, 1);
                    chart.markerIndex = markerIndex;
                }
                store.loadData(data); 
            });
        }, 1000);
    }
});