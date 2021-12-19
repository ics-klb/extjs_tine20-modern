/*
 * IcsDesktop 2.4.0
 * 
 * @package     Modern
 * @subpackage  JS Library
 * @copyright   Copyright (c) 2018 LLC ICS (http://www.icstime.com)
 * @license     http://www.gnu.org/licenses/agpl.html AGPL Version 3
 */

Ext.define('Klb.system.ux.desktop.App', {
   
    extend: "Ext.app.Application",
    mixins: {
        observable: 'Ext.util.Observable'
    },
    requires: [
          'Ext.container.Viewport'
        , 'Klb.system.ux.desktop.Desktop'
        , 'Klb.system.ux.desktop.TaskbarContainer'
        , 'Klb.system.ux.desktop.WindowManager'
        , 'Klb.system.ux.desktop.Store'
    ],
    isReady: false,
    modules: null,
    useQuickTips: true,
    
    styles : null,
    startConfig : null,
    gadgets: null,

    sidebaropened: false, 
    sidebarcollapsed: false,

    getModules: Ext.emptyFn,
    getLaunchers : Ext.emptyFn,
    getStyles : Ext.emptyFn,

    getGadgets: Ext.emptyFn,
    isSidebarOpen: Ext.emptyFn,
    isWizardComplete: Ext.emptyFn,

    constructor: function (config) {
        var me = this;
          config = config || {};

        me.controllers = new Ext.util.MixedCollection(); // add bags
        me.mixins.observable.constructor.call(this, config);

        if (Ext.isReady) {
             Ext.Function.defer(me.init, 50, me);
        } else {
             Ext.onReady(me.init, me);
        }
    },

    initComponent: function() { 

 
    },

    init: function() {
        var me = this;
//            me.startConfig = me.startConfig || me.;
            me.styles = me.styles || me.getStyles();
            me.launchers = me.launchers || me.getLaunchers();
            me.gadgets = me.gadgets || me.getGadgets();
            me.sidebaropened = me.sidebaropened || me.isSidebarOpen();
            if (me.useQuickTips) {
                Ext.tip.QuickTipManager.init();
            }
            me.desktop = new Klb.system.ux.desktop.Desktop( me.getDesktopConfig() );

            me.initModules();
            me.initGadgets();

            me.viewport = new Ext.container.Viewport({
                  layout: 'fit'
                , items: [ me.desktop ]
            });
            Ext.EventManager.on(window, 'beforeunload', me.onUnload, me);
            me.isReady = true;
            me.fireEvent('ready', me);
    },

    initGadgets: Ext.emptyFn,

    initModules : function(modules) {

        var me = this;
        me.modules = me.getModules();
        if ( me.modules ) {
            Ext.each(modules, function (module) {
                module.app = me;
            });
        }
    },

    getDesktopConfig: function () {
        var me = this, cfg = {
               app: me
             , taskbarConfig: me.getTaskbarConfig()
        };

        Ext.apply(cfg, me.desktopConfig);
        return cfg;
    },
    
    /**
     * This method returns the configuration object for the Start Button.
     */
    getStartConfig: function () {
        var me = this, appName, app,
            cfg = {
                app: me,
                menu: []
            },
            launcher;

        Ext.apply(cfg, me.startConfig);

        var modules = Klb.system.appDesktop.getModules();
        if (modules)
          for(var i=0; i < modules.getCount(); i++) {
              appName = modules.getAt(i).get('app');
              app = Klb.system.appMgr.getByModule( appName );
              if ( app && app.launcher ) 
               {
//                  app.launcher.handler = app.launcher.handler || Ext.bind(me.createWindow, me, [appName]);
                  cfg.menu.push(app.launcher);
               }
          };
        return cfg;
    },

     /**
      * This method returns the configuration object for the TaskBar.
      */
    getTaskbarConfig: function () {
        var me = this, cfg = {
            app: me,
            startConfig: me.getStartConfig()
        };

        Ext.apply(cfg, me.taskbarConfig);
        return cfg;
    },

    getModule : function(name) {

        var ms = this.modules;
        if ( ms ) {
            for (var i = 0, len = ms.length; i < len; i++) {
                var m = ms[i];
                if (m.id == name || m.appType == name) {
                    return m;
                }
            }
        }
        return null;
    },

    getDesktop : function() {
        return this.desktop;
    },

   /**
    * Execute an application
    * @param {Ext.menu.Item} item The item licked in the menu
    */
    runApplication    : function(item) {
        var app = item.initialConfig,
            me    = this;
        me.desktop.windowMgr.loader.show();
    },

    loadCss : function(filename){
        if ( !filename ) return false;
        var modulepath = Klb.Functions.getModulePath( filename );  
        filecss= Klb.Common.MODULES_RESOURCE_PATH+modulepath.subpath+'/resources/'+modulepath.name+'.css';
 
        var fileref=document.createElement("link");
            fileref.setAttribute("rel", "stylesheet");
            fileref.setAttribute("type", "text/css");
            fileref.setAttribute("href", filecss);
        document.getElementsByTagName("head")[0].appendChild( fileref );
    },

    loadAppCss : function( appclass, filename){
        var filecss= Ext.Loader.getPath('KlbDesktop.MVC') + '/'+appclass+'/resources/css/' + filename+'.css';

        var fileref=document.createElement("link");
            fileref.setAttribute("rel", "stylesheet");
            fileref.setAttribute("type", "text/css");
            fileref.setAttribute("href", filecss);
        document.getElementsByTagName("head")[0].appendChild(fileref);
    },

    getConfigApplication: function(config) {
       Ext.applyIf(config || {}, {
             animCollapse:false,
             constrainHeader:true,
             singleton: false,
             minWidth: 250, minHeight: 250
           // layout: { type: 'border', padding: 0 },
       });
      return config;
    },

    getModuleWindow: function(params) {
        if ( isnull(params.modclass)  ) return false;
         var me = this; 
         var win = Klb.system.appMgr.getWindow(params.windowId);
       if (!win) {
            win = me.desktop.createWidgetModule({
                   id:     params.windowId,
                   title:  params.title,
                   iconCls: params.iconCls
              }, { 
                modclass: params.modclass 
              });

            Klb.system.appMgr.addWindow(win);
          }
         if ( !isnull(win) )  win.show();
       return win;
    },

    getAppWindow: function(config ) {
        var me = this;
        config = config || {};
        config.scope = config.scope || this;
        config.onLaunch = function() { 
                this.viewport  = Ext.ComponentQuery.query('viewport')[0];
        };    
        config.onCreate = function(win) {
            me.desktop.add(win);
            Klb.system.windowMgr.loader.hide();            
        };

        var win =  Klb.system.appMgr.getAppWindow(config);

         if ( win ) {

            win.show();
            win.maximize();
        }
        return win;
    },
 
    destroyController: function(controller){
        var me = this;
        
        //remove from collection
        me.controllers.remove(controller);
        for(var i=0,len=controller.selectors.length;i<len;i++){
            var obj = controller.selectors[i];
            for(var s in obj){
                for(var ev in obj[s]){
                    //remove selectors from event bus
                    delete me.eventbus.bus[ev][s];
                }
                
            }
        }
        delete controller;
    },

    createWindow: function(module) {

        var win = module.createWindow();
            win.show();
       return win || null;
    },

    /**
     * This function allow you to display notifications in the desktop
     * @param {Object} config The message to show
     */
    showNotificationObj: function(data){
        //Notification
 
    },

    showNotification: function(title, message, ico){
        //Notification
        Ext.create('widget.uxNotification', {
            title: title,
            position: 'br',
            cls: 'ux-notification-light',
            autoCloseDelay: 4500,
            spacing: 10,
            html: message,
            iconH: ico
        }).show();
    },

    onPermissionsError: function(data){

        me.showNotification('Error', data.msg, '');
    },
 
    onReady : function(fn, scope) {

        if (this.isReady) {
            fn.call(scope, this);
        } else {
            this.on({
                ready: fn,
                scope: scope,
                single: true
            });
        }
    },

    onError : function(data){

        Ext.Msg.alert("Error!","Sorry but there was an error loading the initial configuration.");
    },

    onUnload : function(e) {

        if (this.fireEvent('beforeunload', this) === false) {
            e.stopEvent();
        }
    }

});
