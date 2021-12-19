/*
 * Modern 3.0.1
 * 
 * @package     Klb
 * @subpackage  Modern Desktop
 * @license     http://www.gnu.org/licenses/agpl.html AGPL Version 3
 * @update      2016 LLC ICS (http://www.icstime.com)
 */
function strtolower (str) { return (str + '').toLowerCase(); };
function undef(v)         { return typeof v === "undefined"; };
function isnull(name)     { return (typeof (name) == 'undefined' || name == null || name == ''); };
function inlang(name)     { return name; };
function is_number(val)   { return (typeof(val) === 'number' || typeof(val) === 'string') && val !== '' && !isNaN(val); };
function ucfirst(str)     { str += ''; var f = str.charAt(0).toUpperCase(); return f + str.substr(1); };
function i18n(string)     { return string; }
function _roundPercent(value, xtype) {
    xtype = xtype ? xtype : false;
    return xtype ? Math.round( parseFloat(value) ): (Math.round(parseFloat(value)*100))/100;
}

if ( ExtJsVersion != '4.2.1' ) {
    Ext.preg = Ext.emptyFn; // Ext.PluginMgr.create;
}

Ext.preg = Ext.emptyFn;

/**
 * additional date patterns
 * @see{Date}
 */
Date.patterns = {
    ISO8601Long:"Y-m-d H:i:s",
    ISO8601Short:"Y-m-d",
    ISO8601Time:"H:i:s",
    ShortDate: "n/j/Y",
    MediumDate: 'd/m/Y',
    MediumDateTime: 'd/m/Y H:i',
    LongDate: "l, F d, Y",
    FullDateTime: "l, F d, Y g:i:s A",
    MonthDay: "F d",
    ShortTime: "g:i A",
    LongTime: "g:i:s A",
    SortableDateTime: "Y-m-d\\TH:i:s",
    UniversalSortableDateTime: "Y-m-d H:i:sO",
    YearMonth: "F, Y"
};

var Klb = Klb || {}; var KlbSys = KlbSys || {};
Ext.apply(Klb, { system: { debug: false, statics: {}, Setting: {} }, App: { Api: {} }, Controller: {}, Setting: {}, Functions: {}, util: {}, clientVersion: {} } );

/**
 * title of app (gets set at build time)
*/
Klb.version  = KlbSys.version;
Klb.title    = KlbSys.title;
Klb.weburl   = KlbSys.indexUrl;
Klb.helpUrl  = KlbSys.helpUrl;
Klb.extjsUrl = KlbSys.extjsUrl;

Klb.clientVersion.buildType        = 'none';
Klb.clientVersion.buildDate        = 'none';
Klb.clientVersion.buildRevision    = 'none';
Klb.clientVersion.codeName         = 'none';
Klb.clientVersion.packageString    = 'none';
Klb.clientVersion.releaseTime      = 'none';
/**
 * quiet logging in release mode
 */
Ext.Loader.setConfig({
    enabled: true,
    disableCaching: !KlbSys.debug,
    paths: KlbSys.paths
});
Ext.LOGLEVEL = Klb.clientVersion.buildType === 'RELEASE' ? 0 : 7;


Klb.system.Setting.languages = [
    ['ru',  'Russian'],
    ['en',  'English', 'ascii'],
    ['de',  'German'],
    ['ukr', 'Ukrainian']
];
Klb.system.Setting.Widget = { page: {grid_size: 10 } }
Klb.system.Setting.curDate = new Date();

Klb.system.loadCss = function (url, id) {

    var filecss=document.createElement("link");
    filecss.setAttribute("rel", "stylesheet");
    filecss.setAttribute("type", "text/css");
    filecss.setAttribute("href", url);
    if ( id  && !document.getElementById(id) ) {
        filecss.setAttribute("id", id);
        document.getElementsByTagName("head")[0].appendChild( filecss );
    } else {
        document.getElementsByTagName("head")[0].appendChild( filecss );
    }
    return this;
};

/**
 * @class Klb.system.Core
 * @namespace Klb.system
 * @sigleton
 */
Ext.define('Klb.system.Ajax', {
    extend : 'Ext.data.Connection',
    alias: 'proxy.klbajax',
    xtype: 'klbajax',
    singleton: true,
    mixins : {
         observable : "Ext.util.Observable"
    },
    autoAbort : false,
    /**
     * @property connection
     */
    connection: Ext.create('Ext.data.Connection')
});

Ext.define('Klb.system.Events', { 
    _observers : [],  // массив подписчиков
    init:  Ext.emptyFn,
    defaul_events: {
        onStart: "onStart",
        onStarting: "onStarting",
        onReceived: "onReceived",
        onError: "onError",
        onConnectionSlow: "onConnectionSlow",
        onReconnecting: "onReconnecting",
        onReconnect: "onReconnect",
        onStateChanged: "onStateChanged",
        onDisconnect: "onDisconnect"
    },

    signal: function (eventName, data) {
        for (var i in this._observers) { // перебираю массив подписчиков
           if (this._observers[i].eventName == eventName ) // проверяю подписчиков на тип события
            {
                var item = this._observers[i];
                    if (!isnull(item.fn) ) {
                        var fn = Ext.resolveMethod(item.fn, item.obj);
                        fn(item.data);
                    } else
                        item.obj.fireEvent('Ev_'+type, item.obj, item.data); // вызываю событие
            }
        }
    },
    slot: function (eventName, obj, fn, data) {
           // Check if we've been passed a "config style" event.
            if (typeof eventName !== 'string') {
                Ext.EventManager.prepareListenerConfig(eventName);
                return;
            }
        if ( !isnull(obj) )
        {
              this._observers.push({eventName: eventName, obj: obj, id: obj.id || 0, fn: fn || null, data: data || null }); // упаковываю подписчика в массив
//              obj.on('beforedestroy', this.unslot, this,{ id: obj.id } );
        }
    },
    unslot:function(obj, data) {
        for (var i = 0; i < this._observers.length; i++ ) {
           if (this._observers[i].id == data.id) {
             {
               this._observers.splice(i,1);
               i--; // у объекта с id =  data.id может быть несколько
             }
          }
        }
        var e=1;
    }
});

Klb.Msg =  {
    Confirm: function(title, text, callback, scope, options) {
        callback = callback || Ext.emptyFn;
        title = title || _('Warning');
        Ext.Msg.confirm( title
                , text, callback, scope || this);
    },

    Alert: function(title, text, callback, scope) {
        callback = callback || Ext.emptyFn;
        title = title || _('Warning');
        scope = scope || this;
        Ext.MessageBox.alert(title, text, callback, scope);
    },
    Toast: function(title, text) {
        Ext.toast({
            title: title,
            html:  text,
            align: 't',
            bodyPadding: 10
        });
    },
    WaitUpdate: function(text) {

      Ext.Msg.updateText(text);
    },
    Wait: function(status, title, text) {
        status = status || false;
        title = title || _('Please wait!');
        text  = text ||  _('Updating...');
        if (status) {
          Ext.Msg.wait( text, title, {
            interval: 500,
            duration: 5000,
            increment: 5
           });
       } else {
           Ext.Msg.hide();
       }
    }
};


Ext.Loader.loadScript({ url: KlbSys.paths['Klb'] + '/library/CryptoJS/core.js'});
Ext.Loader.loadScript({ url: KlbSys.paths['Klb'] + '/library/CryptoJS/sha1.js' });
Ext.Loader.loadScript({ url: KlbSys.paths['Klb'] + '/library/CryptoJS/enc-base64.js'});
Ext.Loader.loadScript({ url: KlbSys.paths['Klb'] + '/system/extFixes.js'});
Ext.Loader.loadScript({ url: KlbSys.paths['Klb'] + '/system/Abstract.js'});
Ext.Loader.loadScript({ url: KlbSys.paths['Klb'] + '/system/Locale.js'});
Ext.Loader.loadScript({ url: KlbSys.paths['Klb'] + '/system/Locale/Gettext.js'});
Ext.Loader.loadScript({ url: KlbSys.paths['Klb'] + '/system/ux/Function.deferByTickets.js'});
Ext.Loader.loadScript({ url: KlbSys.paths['Klb'] + '/system/ux/Notification/Notification.js'});
Ext.Loader.loadScript({ url: KlbSys.paths['Klb'] + '/system/ux/Printer/Printer-all.js'});
Ext.Loader.loadScript({ url: KlbSys.paths['Klb'] + '/system/ux/grid/RowExpander.js'});
Ext.Loader.loadScript({ url: KlbSys.paths['Klb'] + '/system/ux/grid/grid/Printer.js'});

Ext.require([
          'Ext.ux.Log'
        , 'Ext.ux.WindowFactory' 
        , 'Ext.ux.PopupWindow' 
        , 'Ext.ux.PopupWindowMgr' 
        , 'Ext.ux.form.DateTimeField' 
        , 'Ext.ux.file.UploadManager' 
        
    /* Base Core Object */
        , 'Klb.system.configManager'    
        , 'Klb.system.Common'
        , 'Klb.system.Container'
        , 'Klb.system.ExceptionDialog'
        , 'Klb.system.ExceptionHandler'
        , 'Klb.system.data.RecordProxy'
        , 'Klb.system.data.Record'
        , 'Klb.system.Models'
        , 'Klb.system.StateProvider'
    /* Application */
        , 'Klb.system.Application'
        , 'Klb.system.ApplicationStarter'
        , 'Klb.system.AppManager'

], function() {


    Klb.system.statics.Filters = Ext.create('Ext.util.MixedCollection', {});
    
    Ext.define('Klb.system.Core',{
        extend: 'Ext.Base',
        singleton: true,
        requires: [
            /* if logined */
              'Klb.system.LoginPanel'
//            , 'Klb.system.ExpiredPasswordChangeDialog'
            , 'Klb.system.MainScreen'
            /* locale */
            , 'Klb.system.Locale'
            , 'Klb.system.Locale.Gettext'
            /* widgets */
            , 'Klb.system.widgets.MainScreen'
            , 'Klb.system.widgets.ActionUpdater'
            /* desktop */
            , 'Klb.core.Direct'
            , 'KlbDesktop.App'
            , 'KlbDesktop.AppExtDeskop'
        ],
        /**
         * @cfg {String} getAllRegistryDataMethod
         */
        getAllRegistryDataMethod: 'Api.getAllRegistryData',

        /**
         * @cfg {Boolean} stateful
         */
        stateful: true,

        /**
         * @cfg {String} requestUrl
         */
        requestUrl: KlbSys.requestUrl,

        lang: [ 'Ru', 'En', 'De' ],

        appEvents: null,

        constructor: function(config){
           var me = this, 
               config = config || {};
           me.callParent([config]);
        },
        /**
         * list of initialised items
         */
        initList: {
            initLog:      false,
            initLibs:     false,
            initWindow:   false,
            initModules:  false,
            initViewport: false,
            initRegistry: false
        },

        initModules: function () {

        },

        initEvents: function () {

            Klb.system.appEvents  = Ext.create('Klb.system.Events', {});
            Klb.system.appEvents.init();
        },

        initLang: function () {
            var head = document.getElementsByTagName("head")[0],
                scriptTag = document.createElement("script");

            scriptTag.setAttribute("src", KlbSys.requestUrl + '?method=Api.getJsTranslations');
            scriptTag.setAttribute("type", "text/javascript");
            head.appendChild(scriptTag);
        },
        initLog: function () {

            Ext.ux.Log.setPrio(Ext.LOGLEVEL);
            Klb.Logger = Ext.ux.Log; 
 
            this.initList.initLog = true;
        },

        initWindow: function () {

            Ext.getBody().on('keydown', function (e) {
                if (e.ctrlKey && e.getKey() === e.A && ! (e.getTarget('form') || e.getTarget('input') || e.getTarget('textarea'))) {
                    // disable the native 'select all'
                    e.preventDefault();
                } else if (e.getKey() === e.BACKSPACE && ! (e.getTarget('form') || e.getTarget('input') || e.getTarget('textarea'))) {
                    // disable the native 'history back'
                    e.preventDefault();
                } else if (!window.isMainWindow && e.ctrlKey && e.getKey() === e.T) {
                    // disable the native 'new tab' if in popup window
                    e.preventDefault();
                }
            });

            // disable generic drops
            Ext.getBody().on('dragover', function (e) {
                e.stopPropagation();
                e.preventDefault();
                e.browserEvent.dataTransfer.dropEffect = 'none';
            }, this);

            //init window is done in Ext.ux.PopupWindowMgr. yet
            this.initList.initWindow = true;
        },

        initDebugConsole: function () {

            var map = new Ext.KeyMap(Ext.getDoc(), [{
                key: [122], // F11
                ctrl: true,
                fn: Klb.system.Common.showDebugConsole
            }]);
        },

        initAjax: function () {

            // Ext.Ajax.url = KlbSys.requestUrl;
            // Ext.Ajax.method = 'POST';
            // Ext.Ajax.defaultHeaders = {
            //     'X-Extend-Request-Type' : 'JSON'
            // };

            Klb.system.Ajax.url = KlbSys.requestUrl;
            Klb.system.Ajax.method = 'POST';
            Klb.system.Ajax.defaultHeaders = {
                'X-Extend-Request-Type' : 'JSON'
            };
            Klb.system.Ajax.transactions = {};
            /**
             * inspect all requests done via the ajax singleton
             */
            Klb.system.Ajax.on('beforerequest', function (connection, options) {
               if ( Ext.getCmp('tray_netconnect') ) Ext.getCmp('tray_netconnect').addCls('tray_netconnect_on');
                options.headers = options.headers || {};
                options.headers['X-Extend-JsonKey'] = Klb.App.Api.registry && Klb.App.Api.registry.get ? Klb.App.Api.registry.get('jsonKey') : '';
                options.headers['X-Extend-TransactionId'] = Klb.system.data.Record.generateUID();
                options.url = Ext.urlAppend((options.url ? options.url : KlbSys.requestUrl),  'transactionid=' + options.headers['X-Extend-TransactionId']);
                // convert non Ext.direct request to jsonrpc
                // - convert params
                if (options.params && !options.isUpload) {
                    var params = {};
                    
                    var def = Klb.App.Api.registry && Klb.App.Api.registry.get && Klb.App.Api.registry.get('serviceMap') 
                                        ? Klb.App.Api.registry.get('serviceMap').services[options.params.method] : false;
                    if (def) { // отключаем фильтрацию парамеров
                        // sort parms according to def
                        for (var i = 0, p; i < def.parameters.length; i += 1) {
                            p = def.parameters[i].name;
                            params[p] = options.params[p];
                        }
                    } else {
                        for (var param in options.params) {
                            if (options.params.hasOwnProperty(param) && param !== 'method') {
                                params[param] = options.params[param];
                            }
                        }
                    }
                    options.jsonData = Ext.encode({
                        jsonrpc: '2.0',
                        method: options.params.method,
                        params: params,
                        id: ++Ext.data.Connection.requestId
                    });

                    options.cbs = {};
                    options.cbs.success  = options.success  || null;
                    options.cbs.failure  = options.failure  || null;
                    options.cbs.callback = options.callback || null;

                    options.isImplicitJsonRpc = true;
                    delete options.params;
                    delete options.success;
                    delete options.failure;
                    delete options.callback;
                }
                Klb.system.Ajax.transactions[options.headers['X-Extend-TransactionId']] = {
                    date: new Date(),
                    json: options.jsonData
                };
                if ( Ext.getCmp('tray_netconnect') )
                    Ext.getCmp('tray_netconnect').addCls('ajax_connect');
            });
            /**
             * inspect completed responses => staus code == 200
             */
            Klb.system.Ajax.on('requestcomplete', function (connection, response, options) {
                if ( Ext.getCmp('tray_netconnect') ) Ext.getCmp('tray_netconnect').removeCls('tray_netconnect_on');
                delete Klb.system.Ajax.transactions[options.headers['X-Extend-TransactionId']];
                if(Ext.Object.getSize(Ext.Ajax.requests)<=1 && Ext.getCmp('tray_netconnect') ){
                     Ext.getCmp('tray_netconnect').removeCls('ajax_connect');
                }

                // detect resoponse errors (e.g. html from xdebug) and convert into error response
                if (! options.isUpload && ! response.responseText.match(/^([{\[])|(<\?xml)+/)) {
                    var exception = {
                        code: response.responseText !== "" ? 530 : 540,
                        message: response.responseText !== "" ? 'illegal json data in response' : 'empty response',
                        traceHTML: response.responseText,
                        request: options.jsonData,
                        response: response.responseText
                    };

                    // Fatal error: Allowed memory size of n bytes exhausted (tried to allocate m bytes) 
                    if (response.responseText.match(/^Fatal error: Allowed memory size of /m)) {
                        Ext.apply(exception, {
                            code: 550,
                            message: response.responseText
                        });
                    }
                    
                    // encapsulate as jsonrpc response
                    var requestOptions = Ext.decode(options.jsonData);
                    response.responseText = Ext.encode({
                        jsonrpc: requestOptions.jsonrpc,
                        id: requestOptions.id,
                        error: {
                            code: -32000,
                            message: exception.message,
                            data: exception
                        }
                    });
                }
                
                // strip jsonrpc fragments for non Ext.direct requests
                if (options.isImplicitJsonRpc) {
                    var jsonrpc = Ext.decode(response.responseText);
                    if (jsonrpc.result) {
                        response.responseText = Ext.encode(jsonrpc.result);
                        
                        if (options.cbs.success) {
                            options.cbs.success.call(options.scope, response, options);
                        }
                        if (options.cbs.callback) {
                            options.cbs.callback.call(options.scope, options, true, response);
                        }
                    } else {

                        response.responseText = Ext.encode(jsonrpc.error);

                        if (options.cbs.failure) {
                            options.cbs.failure.call(options.scope, response, options);
                        } else if (options.cbs.callback) {
                            options.cbs.callback.call(options.scope, options, false, response);
                        } else {
                            var responseData = Ext.decode(response.responseText);
                            exception = responseData.data ? responseData.data : responseData;
                            exception.request = options.jsonData;
                            exception.response = response.responseText;
                            Klb.system.ExceptionHandler.handleRequestException(exception);
                        }
                    }
                }
            });
            
            /**
             * inspect request exceptions
             *  - convert to jsonrpc compatiple exceptional states
             *  - call generic exception handler if no handler is defined in request options
             */
            Klb.system.Ajax.on('requestexception', function (connection, response, options) {
                delete Klb.system.Ajax.transactions[options.headers['X-Extend-TransactionId']];
                // map connection errors to errorcode 510 and timeouts to 520
                var errorCode = response.status > 0 ? response.status :
                                (response.status === 0 ? 510 : 520);

Klb.Logger.showBox(response.responseText, 'Ajax Request Exception');
                // convert into error response
                if (! options.isUpload) {
                    var exception = {
                        code: errorCode,
                        message: 'request exception: ' + response.statusText,
                        traceHTML: response.responseText,
                        request: options.jsonData,
                        requestHeaders: options.headers,
                        openTransactions: Klb.system.Ajax.transactions,
                        response: response.responseText
                    };

                    // encapsulate as jsonrpc response
                    var requestOptions = Ext.decode(options.jsonData);
                    response.responseText = Ext.encode({
                        jsonrpc: requestOptions.jsonrpc,
                        id: requestOptions.id,
                        error: {
                            code: -32000,
                            message: exception.message,
                            data: exception
                        }
                    });
                }

                // NOTE: Klb.data.RecordProxy is implicitRPC atm.
                if (options.isImplicitJsonRpc) {
                    var jsonrpc = Ext.decode(response.responseText);
                        response.responseText = Ext.encode(jsonrpc.error);
                    if (options.cbs.failure) {
                        options.cbs.failure.call(options.scope, response, options);
                    } else if (options.cbs.callback) {
                        options.cbs.callback.call(options.scope, options, false, response);
                    } else {
                        var responseData = Ext.decode(response.responseText);
                            exception = responseData.data ? responseData.data : responseData;
                        Klb.system.ExceptionHandler.handleRequestException(exception);
                    }
                } else if (! options.failure && ! options.callback) {
                    Klb.system.ExceptionHandler.handleRequestException(exception);
                }
            });
        }, // initAjax
        /**
         * init registry
         */
        initRegistry: function () {

            Klb.system.Ajax.request({
                timeout: 12000, // 2 minutes
                params: {
                    method: Klb.system.Core.getAllRegistryDataMethod
                },
                failure: function () {
                    // if registry could not be loaded, this is mostly due to missconfiguaration don't send error reports for that!
                    Klb.system.ExceptionHandler.handleRequestException({
                        code: 503
                    });
                },
                success: function (response, request) {
                    var registryData = Ext.util.JSON.decode(response.responseText);
                    for (var app in registryData) {
                        if (registryData.hasOwnProperty(app)) {
                            var appData = registryData[app];
                            if ( !Klb.App[app] )   Klb.App[app] = Ext.create('Klb.system.AppRegistry', { data: appData });
                              else if ( !Klb.App[app].registry )
                                 Ext.apply(Klb.App[app], Ext.create('Klb.system.AppRegistry', { data: appData }) );
                                else {
                                    for (var key in appData) {
                                        if (appData.hasOwnProperty(key)) {
                                            if (key === 'preferences') {
                                                var prefs = new Ext.util.MixedCollection();
                                                for (var pref in appData[key]) {
                                                    if (appData[key].hasOwnProperty(pref)) {
                                                        prefs.add(pref, appData[key][pref]);
                                                    }
                                                }

                                                prefs.on('replace', Klb.system.Core.onPreferenceChange);
                                                Klb.App[app].registry.add(key, prefs);
                                            } else {
                                                Klb.App[app].registry.add(key, appData[key]);
                                            }
                                        }
                                    }
                                }
                        }
                    }
                    // update window factory window type (required after login)
                    if (Klb.App.Api.isReg('preferences')) {
                        var windowType = Klb.App.Api.getReg('preferences').get('windowtype');

                        // init ApplicationStarter on Ext window once
                            Klb.system.ApplicationStarter.init(); 
                        if (Klb.WindowFactory && Klb.WindowFactory.windowType !== windowType) {
                            Klb.WindowFactory.windowType = windowType;
                        }
                    }
                    Klb.system.Core.overrideFields();
                    Klb.system.Core.initList.initRegistry = true;
                }
            });
        },
        /**
         * Applying registry entries to Modern classes
         */
        overrideFields: function () {

            Ext.override(Ext.ux.file.Upload, {
                maxFileUploadSize: Klb.App.Api.registry.get('maxFileUploadSize'),
                maxPostSize: Klb.App.Api.registry.get('maxPostSize')
            });
        },
        
        /**
         * executed when a value in Api registry/preferences changed
         * @param {string} key
         * @param {value} oldValue
         * @param {value} newValue
         */
        onPreferenceChange: function (key, oldValue, newValue) {
            return;
            switch (key) {
                case 'windowtype':
                case 'confirmLogout':
                case 'timezone':
                case 'locale':

                    // reload mainscreen
                    var reload = new Ext.util.DelayedTask(function(){window.location.reload(key == 'locale');},this);
                    reload.delay(500);
                    break;
            }
        },
        /**
         * initialise application manager
         */
        initAppMgr: function () {

                if (! Ext.isIE9 && ! Ext.isIE && ! window.isMainWindow) {
                    // return app from main window for non-IE browsers
                    Klb.system.appMgr = Ext.ux.PopupWindowMgr.getMainWindow().Klb.system.appMgr;
                } else {

                    Klb.system.appMgr = Ext.create('Klb.system.AppManager', {});
                }
            return this;
        },
        /**
         * initialise upload manager
         */
        initUploadMgr: function () {

                Klb.system.uploadManager = new Ext.ux.file.UploadManager();
            return this;
        },
        /**
         * initialise window and windowMgr (only popup atm.)
         */
        initWindowMgr: function () {
            /**
             * init the window handling
             */
            Ext.ux.PopupWindow.prototype.url = KlbSys.requestUrl ;
            /**
             * initialise window types
             */
            var windowType = (Klb.App.Api.registry.get('preferences') && Klb.App.Api.registry.get('preferences').get('windowtype')) 
                                    ? Klb.App.Api.registry.get('preferences').get('windowtype') : 'Browser';

            Klb.system.WindowFactory = new Ext.ux.WindowFactory({
                windowType: windowType
            });
            /**
             * register MainWindow
             */
            if (window.isMainWindow) {
                Ext.ux.PopupWindowMgr.register({
                    name: window.name,
                    popup: window,
                    contentPanelConstructor: 'Klb.system.MainScreen'
                });
            }
        },
        /**
         * initialise state provider
         */
        initState: function () {

            if (Klb.system.Core.stateful === true) {
                if (window.isMainWindow || Ext.isIE) {
                    // NOTE: IE is as always pain in the ass! cross window issues prohibit serialisation of state objects
                    Ext.state.Manager.setProvider(new Klb.system.StateProvider());
                } else {
                    var mainWindow = Ext.ux.PopupWindowMgr.getMainWindow();
                        Ext.state.Manager = mainWindow.Ext.state.Manager;
                }
            }
        },
        /**
         * add provider to Ext.direct based on Modern servicemap
         */
        initExtDirect: function () {

            var sam = Klb.App.Api.registry.get('serviceMap') || {};
            Ext.direct.Provider(Ext.apply(sam, {
                'type'     : 'jsonrpcprovider',
                'namespace': 'Api',
                'url'      :  KlbSys.requestUrl// sam.target
            }));
            return this;
        },
        /**
         * init external libraries
         */
        initLibs: function () {
                if (OpenLayers) {
                    // http://openlayers.org/ fix OpenLayers script location to find images/themes/...
                    OpenLayers._getScriptLocation = function () {
                        return Ext.Loader.getPath('Klb.library') + '/OpenLayers/OpenLayers.js';
                    };
                }
            return this;
        },

        /**
         * config locales
         */
        initLocale: function () {

            Klb.system.translation = new Klb.system.Locale.Gettext();
            Klb.system.translation.textdomain('Api');
            window._ = function (msgid) {
                var _i = msgid.indexOf('#'),
                    _appName = 'Api';
                if ( Ext.isString(msgid) && _i == 0 ) 
                {
                    _i = msgid.indexOf('/'),
                    _appName = msgid.substring(1, _i);
                     msgid = msgid.substring(_i+1);
                }
                return Klb.system.translation.dgettext(_appName, msgid);
            };
//            Klb.system.Locale.prototypeTranslation();
            return this;
        },
        /**
         * Each window has exactly one viewport containing a card layout in its lifetime
         * The default card is a splash screen.
         * 
         * defautl wait panel (picture only no string!)
         */
        initBootSplash: function () {

            this.splash = {
                xtype: 'container',
                id: 'modern-viewport-waitcycle',
                border: false,
                layout: 'fit',
                width: 16,
                height: 16,
                // the content elements come from the initial html so they are displayed fastly
                contentEl: Ext.select('div[class^=modern-viewport-]')
            };
            return this;            
        },

        renderWindow: function () {

            if ( this.winLogin() ) {
                 this.initDesktop();
            }
            return this;
        },

        loginBox: function ( status ) {
             var el  = Ext.get(KlbSys.loadingmask); if (el) el.destroy();
             var win = Ext.getCmp('idWinLogin');
          if ( !status ) {
             if ( win ) win.hide().destroy();
             return false;
          }
          if( win == undefined ) {
             var win = Ext.create('Klb.abstract.Window', {
                        id : 'idWinLogin',
                        title: _("Modern KoloBizCom System")  + ' - ' + KlbSys.version,
                        modal: true,
                        y: '5%',
                        width: 570, height: 200, minWidth: 450, minHeight: 180,
                        layout: 'border', plain: false, closable: false,
                        items: [{
                                  xtype: 'panel', 
                                  region: 'west', width: 240, bodyPadding: 12,
                                  html: '<img src="'+KlbSys.loginLogo+'"  width="200" id="img-avatar"/>',
                                  background: '#FFFFF' 
                                },
                                Klb.Controller.LoginPanel.getLoginPanel()
                         ]
                       }
                );
            }
          return win.show();
        },

        initAfterLogined: function () {
                Klb.system.Core.initList.initRegistry = false;
                Klb.system.Core.initRegistry();
                var waitForRegistry = function () {
                    if (Klb.system.Core.initList.initRegistry) {
                        Ext.MessageBox.hide();
                        Klb.system.Core.initExtDirect();
                        Klb.system.Core.doLogin();
                    } else {
                        Ext.Function.defer(waitForRegistry, 100);
                    }
                };
                waitForRegistry();            
        },

        doLogin: function () {
            Klb.system.Core.initState();
            Klb.system.Core.renderWindow();
        },

        /**
         * logout user & redirect
         */
        requestLogout: function () {

            Ext.MessageBox.wait(_('Logging you out...'), _('Please wait!'));
            Klb.system.Ajax.request( {
                params : { method : 'Api.logout' },
                callback : function(options, Success, response) {
                     Klb.system.Core.doLogout();
                }
            });            
        },

        doLogout: function () {

            // clear the authenticated mod_ssl session
            if (document.all == null) {
                if ( window.crypto && Ext.isFunction(window.crypto.logout) ) {
                    window.crypto.logout();
                }
            } else {
                document.execCommand('ClearAuthenticationCache');
            }
            // remove the event handler the reload() trigers the unload event
            var redirect = Klb.App.Api.registry.get('redirectUrl'),
                modSsl =  Klb.App.Api.registry.get('modSsl'),
                redirectUrlmodSsl = Klb.App.Api.registry.get('redirectUrlmodSsl');

            if ( modSsl && redirectUrlmodSsl != '' ) {
                window.location.assign(redirectUrlmodSsl);
            } else {
                if (redirect && redirect != '') {
                     window.location.assign(redirect);
                } else {
                   window.location.reload();
                }
            }
        },

        isLogined: function () {

            return  Klb.App.Api && Klb.App.Api.registry.get('currentAccount') ? true : false
        },

        suspendLayouts: function (status) {
            if (status)  {
                  Ext.suspendLayouts();
            } else {
                 Ext.resumeLayouts(true);        
            }
        },
        waitLoading: function (status) {            
            if ( status ) {

                Klb.Msg.Wait(true,  _('Please wait!'), Ext.String.format(_('Login successful. Loading {0}...'), Klb.title) );
            } else {
                Klb.Msg.Wait(false);
            }
        },

        getAccount: function (field) {
            var result = null;
            if ( Klb.App.Api.registry ) {
               field = field || false;
               result = !field ? Klb.App.Api.registry.get('currentAccount')
                                 : Klb.App.Api.registry.get('currentAccount')[field];
            } 
           return result ;
        },
        
        getLoginPanel: function () {
            if (! Klb.Controller.LoginPanel ) {
                Klb.Controller.LoginPanel = Ext.create('Klb.system.LoginPanel', {
                    defaultUsercompany: Klb.App.Api.registry.get('defaultUsercompany'),
                    defaultUsername: Klb.App.Api.registry.get('defaultUsername'),
                    defaultPassword: Klb.App.Api.registry.get('defaultPassword'),
                    scope: this,
                    onLogin: function (response) {
                       Klb.system.Core.initAfterLogined();
                    }
                });
            }    
            return Klb.Controller.LoginPanel;
        },
        
        winLogin: function () {
            // check if user is already logged in
            if ( !this.isLogined() ) {
                this.getLoginPanel();
                Klb.system.Core.loginBox(true);
              return false;
            }

                this.loginBox(false);
                // todo: find a better place for stuff to do after successfull login
                this.initAppMgr();
                this.initUploadMgr();
                // fetch window config from WindowMgr
                var c = Ext.ux.PopupWindowMgr.get(window) || {};
                // set window title
                window.document.title = c.title ? c.title : window.document.title;
                // finally render the window contents in a new card  
                window.initializationComplete = true;
           return true;
        },

        initDesktop: function () {
            if ( ! Klb.App.Api.registry.get('currentAccount') ) return false;

            this.waitLoading(true);
            
            Klb.system.appMainScreen = new Klb.system.MainScreen();
            if ( KlbSys.appType == 'desktop' )  {
               this.buildDesktop(); 
            } 
             else {              
               this.buildDashboard();
             }
        },

        buildDashboard: function () {
            Klb.Msg.WaitUpdate( _('Загрузка рабочего стола...') );

            Ext.application({
                name: 'Dashboard',
                extend: 'Dashboard.Application',
                requires: [
                    'Dashboard.*'
                ]
            });

//         Klb.system.appDesktop = new KlbDesktop.AppDashboard();
        },

        buildDesktop: function () {
            
            Klb.Msg.WaitUpdate( _('Loading Desktop ...') );
            Klb.system.appDesktop = new KlbDesktop.AppExtDeskop();
            Klb.system.appDesktop.loadDesktop( Klb.App.Api.registry.get('currentAccount'), Klb.system.ApplicationStarter.getApplications() );
        },

         // Last stage of initialisation, to be done after Klb.onReady!
        onLangFilesLoad: function () {

            Ext.ux.form.DateTimeField.prototype.format = Klb.system.Locale.getTranslationData('Date', 'medium')
                                    + ' ' + Klb.system.Locale.getTranslationData('Time', 'medium');
        },

        loadingSystem: function() {

            Klb.system.Core.initLang();
            Klb.system.Core.initLog();
            Klb.system.Core.initWindow();
            Klb.system.Core.initDebugConsole();
            Klb.system.Core.initBootSplash();
            Klb.system.Core.initLocale();
            Klb.system.Core.initAjax();
            Klb.Msg.WaitUpdate( _('Инициализация модулей...') );
            Klb.system.Core.initRegistry();
//        Klb.system.Core.initLibs();
            var waitForInits = function () {

                if (! Klb.system.Core.initList.initRegistry) {
                    Ext.Function.defer(waitForInits, 100);
                } else {
                    Klb.system.Core.initExtDirect();
                    Klb.system.Core.initState();
                    Klb.system.Core.initEvents();
                    Klb.system.Core.initWindowMgr();
                    Klb.system.Core.onLangFilesLoad();
                    Klb.system.Core.renderWindow();
                    Klb.helpUrl = Klb.App.Api.registry.get('helpUrl') || Klb.helpUrl;
                }
            };
            waitForInits();
        }
   });

   Ext.onReady(function () {

       Klb.system.Core.loadingSystem();
    });

});// Ext.require

