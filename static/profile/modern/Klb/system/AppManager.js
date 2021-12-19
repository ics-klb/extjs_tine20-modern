/*
 * Modern 3.1.0
 * 
 * @license     http://www.gnu.org/licenses/agpl.html AGPL Version 3
 * @author      Cornelius Weiss <c.weiss@metaways.de>
 * @copyright   Copyright (c) 2007-2011 Metaways Infosystems GmbH (http://www.metaways.de)
 */
Ext.ns('Klb.system');

Ext.define('Klb.system.AppManager', {
    extend: 'Ext.util.Observable',
    
    constructor: function(config) {
        config = config || {};
        /**
         * @property apps
         */
        this.apps    = Ext.create('Ext.util.MixedCollection', {});
        this.modules = Ext.create('Ext.util.MixedCollection', {});
        this.windows = Ext.create('Ext.util.MixedCollection', {});

        this.callParent([config]);

        // fill this.apps with registry data
        var enabledApps = Klb.App.Api.registry.get('userApplications');
        var app;
        for(var i=0; i<enabledApps.length; i++) {
            app = enabledApps[i];
            // if the app is not in the namespace, we don't initialise it we don't have a Modern 'Application'
            if (!this.apps.get(app.name) && ! app.name.match(/(Api)/)) {
                app.appName = app.name;
                app.isInitialised = false;
                this.apps.add(app.appName, app);
            }
            this.apps.sortByKey("ASC", function (app1, app2) {
                return parseInt(app1.order, 10) - parseInt(app2.order, 10);
            });
        }
    },
    /**
     * @cfg {Klb.Application}
     */
    prefixApp: 'KlbDesktop.MVC', // KlbDesktop.Apps
    defaultApp: null,
    /**
     * @property activeApp
     */
    activeApp: null,

    /**
     * activate application
     */
    activate: function(app) {
        if (app || (app = this.getDefault()) ) {
            if (app == this.getActive()) {
                // app is already active, nothing to do
                return true;
            }

            if (this.activeApp) {
                if ((this.fireEvent('beforedeactivate', this.activeApp) === false || this.activeApp.onBeforeDeActivate() === false)) {
                    return false;
                }
                this.activeApp.onDeActivate();
                this.fireEvent('deactivate', this.activeApp);
                this.activeApp = null;
            }
            if (this.fireEvent('beforeactivate', app) === false || app.onBeforeActivate() === false) {
                return false;
            }
            var mainscreen = app.getMainScreen();
            if (mainscreen) {
                mainscreen.show();
            } else {
                // app has no mainscreen / perhaps it has been disabled
                return false;
            }
          this.activeApp = app;
          app.onActivate();
          this.fireEvent('activate', app);
        }
    },
    /**
     * returns an appObject
     */
    _setApp: function(appName, appObj ) {
        if (Ext.isObject(appName) && appName.hasOwnProperty('appName')) {
            appName = appName.appName;
        }

        var app = this.apps.get(appName);
        if ( !app ) {
            appObj.isInitialised = true; 
            appObj.status = 'enabled';
            this.apps.add(appName, appObj);
        }
        return this.apps.get(appName);        
    },
    
    _setModule: function(appName, appObj) {
        if (Ext.isObject(appName) && appName.hasOwnProperty('appName')) {
            appName = appName.appName;
        }

        var app = this.modules.get(appName);
        if ( app ) {
            appObj.isInitialised = true; 
            appObj.status = 'enabled';
            this.modules.add(appName, appObj);
        }
        return this.modules.get(appName);                
    },

    set: function(appName, appObj, appType ) {
       appType = appType || 'app'; 

       if ( appType == 'module' ) {
           app = this._setModule(appName, appObj);
       }
        else {
           app = this._setApp(appName, appObj);
       }
       return app;
    },

    _getApp: function(appName) {
        if (Ext.isObject(appName) && appName.hasOwnProperty('appName')) {
            appName = appName.appName;
        }
        if (! this.isEnabled(appName)) {
            return false;
        }

        var app = this.apps.get(appName);
        if (! app.isInitialised) {

            var appObj = this.getAppObj(app);
            appObj.isInitialised = true;
            Ext.applyIf(appObj, app);
            this.apps.replace(appName, appObj);
        }
        
        return this.apps.get(appName);        
    },
    
    _getModule: function(appName) {
        if (Ext.isObject(appName) && appName.hasOwnProperty('appName')) {
            appName = appName.appName;
        }

        var app = this.modules.get(appName);
        if (app && !app.isInitialised) {

            var appObj = this.getModuleObj( Ext.getClassName(app) );
            appObj.isInitialised = true;
            Ext.applyIf(appObj, app);
            this.modules.replace(appName, appObj);
        }        
        return this.modules.get(appName);        
    },
    
    get: function(appName, appType) {
        appType = appType || 'app'; 
       if ( appType == 'module' ) {
           app = this._getModule(appName);
       }
        else {
           app = this._getApp(appName);
       }
       return app;
    },

    /**
     * returns appObject
     */
    getByModule: function(moduleName) {
        var app = this.modules.get(moduleName);
        if (!app ) { app = this.getModuleObj(moduleName); }        
        return app ? app : false;        
    },

    getByName: function(appName) {
        var app = this.apps.get(appName);
       
        return app ? app : false;
    },
    
    getById: function(applicationId) {
        var appObj = null;
        Ext.each(Klb.App.Api.registry.get('userApplications'), function(rawApp) {
            if (rawApp.id === applicationId) {
                appObj = this.get(rawApp.appName);
                return false;
            }
        }, this);

        return appObj;
    },
    
    /**
     * returns currently activated app
     */
    getActive: function() {
        return this.activeApp;
    },
    
    /**
     * returns appObject of default app
     */
    getDefault: function() {
        var defaultAppName = (Klb.App.Api.registry.get('preferences') &&
            Klb.App.Api.registry.get('preferences').get('defaultapp')) ?
            Klb.App.Api.registry.get('preferences').get('defaultapp') :
            this.defaultAppName;

        this.defaultApp = this.get(defaultAppName) ||
            this.apps.find(function(app)
                             { return app.hasMainScreen} );

        if (! this.defaultApp) {
            // no global exception concept yet...
            //throw Ext.Error('no apps enabled', 620);
            Ext.MessageBox.show({
                title: _('Missing Applications'), 
                msg: _('There are no applications enabled for you. Please contact your administrator.'),
                buttons: Ext.Msg.OK,
                icon: Ext.MessageBox.WARNING
            });
        }
        return this.defaultApp;
    },
    
    /**
     * set default app for this session
     */
    setDefault: function(app) {
        if (Ext.isString(app)) {
            app = this.get(app);
        }
        
        if (app) {
            this.defaultApp = app;
        }
    },
    
    /**
     * returns a list of all apps for current user
     */
    getAll: function() {
        this.initAll();
        return this.apps;
    },
    
    /**
     * checks wether a given app is enabled for current user or not
     */
    isEnabled: function(appName) {
        var app = this.apps.get(appName);

        return app ? app.status == 'enabled' : false;
    },
    
    /**
     * initialises all enabled apps
     * @private
     */
    initAll: function() {
        this.apps.each(function(app) {
            this.get(app.appName);
        }, this);
    },
    
    getModuleObj: function(appName) {    
//       var modulepath = Klb.Functions.getModulePath( appName );
        var moduleclass = 'KlbDesktop.Modules.' + appName;
        if ( Ext.isDefined(moduleclass) ) {

                var app = Ext.create(moduleclass, {});
                    app.init();
                    app.isInitialised = true;
                this.modules.add(appName, app);
            }
      return this.modules.get(appName);  
    },
                
    /**
     * @private
     */
    getAppObj: function(app) {

       try{
            // legacy
            if (typeof(Klb.App[app.appName].getPanel) == 'function') {
                // make a legacy Klb.Application
                return this.getLegacyApp(app);
            }
            
          var   appObj = {}
              , classApp = this.prefixApp + '.' + app.appName + '.Core';

              if ( Ext.isDefined(classApp) && !Klb.App[app.appName].isMVC() ) {
    console.log('create 1:  ' + classApp);
                        Klb.App[app.appName].setMVC( Ext.create(classApp, {}) );
                }

            var appObj = Klb.App[app.appName].getMVC('Application')
                                        ? Ext.create( Klb.App[app.appName].getMVC('Application'), app)
                                        : Ext.create('Klb.system.Application', { appName: app.appName } ); //new Klb.system.Application(app);

        } catch(e) {
              console.error('Initialising of Application "' + app.appName + '" failed with the following message:' + e);
              console.warn(e);
           return false;
         }
            return appObj;

    },
    
    /**
     * @private
     */
    getLegacyApp: function(app) {
        var appPanel = Klb.App[app.appName].getPanel();
        var appObj =  new Klb.system.Application(app);
        var mainScreen = new Klb.system.widgets.MainScreen({app: appObj});
        
        Ext.apply(mainScreen, {
            appPanel: appPanel,
            getContainerTreePanel: function() {
                return this.appPanel;
            },
            getWestPanel: function() {
                return this.appPanel;
            },
            show: function() {
                // remove favorite toolbar for legacy modules
                var westPanelToolbar = Ext.getCmp('west').getTopToolbar();
                westPanelToolbar.removeAll();
                westPanelToolbar.hide();
                westPanelToolbar.doLayout();

                Klb.system.MainScreen.setActiveTreePanel(appPanel, true);
                appPanel.fireEvent('beforeexpand', appPanel);
            }
        });
        Ext.apply(appObj, {
            mainScreen: mainScreen
        });
        appPanel.on('render', function(p) {
            p.header.remove();
            // additionally to removing the DOM node, we also need to reset the 
            // header class variable, as IE evals "if (this.header)" to true otherwise 
            p.header = false;
            p.doLayout();
        });
        
        return appObj;
    },

    // Manager MVC
    addWindow: function(win) {
          this.windows.add(win);
        return this;
    },
    delWindow: function(win) {
          this.windows.remove(win);
        return this;
    },
    collectionWindow: function() {
        return this.windows;        
    },
    countWindow: function() {
        return this.windows.getCount();
    },
    getWindowZIndex: function() {

        var windows = this.windows;
        // TODO - there has to be a better way to get this...
        return (windows.getCount() && windows.getAt(0).zIndexManager) || null;        
    },
    existWindow: function(id) {
        return this.windows.containsKey(id);
    },    
    getWindow: function(id) {
        return this.windows.get(id);
    },
    
    getConfigApplication: function(config) {
        Ext.applyIf(config || {}, {
            animCollapse:false,
            constrainHeader:true,
            width: 800, minWidth: 550, height: 450,
            layout: { type: 'border', padding: 0 },
            singleton: false
        });
        return config;
    },

    i18n: function( appname, apptype, recordId){
        apptype = apptype || 'alias';
        if ( arguments.length > 1 ) {
                // обрабатываем параметры для случая получения описания из хранилища
        }
        return _(appname, apptype, recordId);
    },

    loadAppCss : function( appclass, filename){
        var filecss= Ext.Loader.getPath('KlbDesktop.MVC') + '/'+appclass+'/resources/css/' + filename+'.css';
 
        KlbSys.loadCss(filecss, appclass);
    },

    existAppWindow: function(config) {
       return config.winid && this.getWindow(config.winid) ? true : false;
    },
    
    getAppWindow: function(config) {

        config.winid = config.winid || 'blank';        
        config.scope = config.scope || this;        

        var me = this,
            win = this.getWindow(config.winid) || Ext.getCmp(config.winid);

        if(!win){
            var appFolder = Klb.Functions.setMVCPath( config.app.mvclass.name );

            config.app.config.paths  = [ appFolder ];
            config.app.config.id     = config.winid;
            config.app.config.title  = config.name;
            config.app.config.name   = config.app.mvclass.name;
 
            win = me.showApplication({ app: config.app, onLaunch: config.onLaunch }, config.scope );
            if (config.onCreate) {
                config.onCreate(win);
            }
        }

        return win;        
    },

    showApplication: function(options, scope){

        var me = this,
            app = options.app,
            win = Klb.system.windowMgr.createWindowApp( false, { mvclass: app.mvclass, config: app.config }),
            cfg;
        var mvclass        = app.mvclass.name + '',
            mvccontrollers = app.mvclass.controllers,
            arr = app.mvclass.name.split("."),   // mvc class
            appclass = arr[2];

        try {

            if ( arr.length < 2  || isnull(win) ) return false;
            if ( win ) {
               cfg = app.config;
               options.onLaunch = options.onLaunch || Ext.emptyFn;

                if ( cfg.hasOwnProperty('css') )  { me.loadAppCss(appclass, cfg.css); }
                Klb.system.Common.onApplication({
                    name:        mvclass,
                    application: win,
                    id:          win.id+'_mvc',
                    appFolder:   Ext.Loader.getPath('KlbDesktop.MVC') + '/'+appclass+'/app',
                    autoCreateViewport: options.autoCreateViewport || true,
                    controllers: mvccontrollers,
                    launch:      options.onLaunch
                });

               me.fireEvent('viewappadded', cfg, win);
            } else {

                me.showNotification({
                    title: 'Error showApplication',
                    message: "The application was not found! please report this problem to your administration."
                });
                return false;
            }

        } catch (e) {
            Klb.Logger.err('Could not create  KlbDesktop.AppsManager ' + config.name + ' winid: ' + config.winid );
            Klb.Logger.err(e.stack ? e.stack : e);
        }

        return win;
    },

    showNotification: function(options){

        options.title = options.title || '';
        options.message = options.message || '';
        options.callback = options.callback || Ext.emptyFn;
        options.callbackScope = options.callbackScope || Ext.emptyFn;

        var defaults = {
            buttons: Ext.Msg.OK,
            icon: Ext.MessageBox.WARNING,
            fn: options.callback,
            scope: options.callbackScope
        };
        
         Ext.MessageBox.show(Ext.apply(defaults, {
            title: options.title,
            msg: options.title
         }));
    },    
});
