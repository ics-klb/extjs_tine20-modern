/*
 * IcsDesktop 2.4.0
 * 
 * @package     Modern
 * @subpackage  JS Library
 * @copyright   Copyright (c) 2018 LLC ICS (http://www.icstime.com)
 * @license     http://www.gnu.org/licenses/agpl.html AGPL Version 3
 */

Ext.define("Klb.system.ux.desktop.WindowManager",{
     extend : "Ext.Component",
     requires : [
            "Klb.system.ux.desktop.LoadingModule"
          , "Klb.system.ux.desktop.Window"
     ],

     xTickSize: 1,
     yTickSize: 1,

     lastActiveWindow	: null,
     activeWindowCls     	: 'ux-desktop-active-win',
     inactiveWindowCls	: 'ux-desktop-inactive-win',

     initComponent: function() {

     	this.loader = Ext.create("Klb.system.ux.desktop.LoadingModule",{
          	hidden	: true
          });
     	this.callParent();
     },

     /**
      * Creates the main window for an application. If the application is configured as "singleton" this method return the same windows every time.
      * @param {Object} app The configuration object for the application
      * @return {Bleext.desktop.Window} Return a window
      */ 
     createWindowApp: function(app, options){
          var config = options.config;
          if( !options.mvclass && isnull(app) ){
               return false;
          }

        return this.createWindow(config, app);
     },

     createWindow: function(config, app) {
          if (isnull(config.title) ) alert(' Error: title manager');

         config.width  = config.width || 1024;
         config.height = config.height || 600;
         config.x = config.x || 0;
         config.y = config.y || 0;
         config.title = config.title || 'CLK v2.3.8';
         config.singleton = config.singleton || true;

          var me = this, win,
              cfg = Ext.applyIf(config || {}, {
                    stateful: false,
                    isWindow: true,
                    animCollapse:false,
                    constrainHeader: true,
                    schema: {
                         id:  this.winid + this.id  || this.id
                    }
               });

          //if only one instance of the application is allowed
          if(cfg.singleton && Klb.system.appMgr.existWindow(cfg.id)){
               return Klb.system.appMgr.getWidow(cfg.id);
          }
          
          app = app || "Klb.system.ux.desktop.Window";
          win =  Ext.create(app, cfg);

          win.taskButton = me.taskbar.addTaskButton(win);
          win.animateTarget = win.taskButton.el;

          win.on({
               activate: me.updateActiveWindow,
               beforeshow: me.updateActiveWindow,
               deactivate: me.updateActiveWindow,
               minimize: me.minimizeWindow,
               destroy: me.onWindowClose,
               scope: me
          });

          win.on({
               afterrender: function () {
//                    win.dd.xTickSize = win.xTickSize;
//                    win.dd.yTickSize = win.yTickSize;
                    if (win.resizer) {
                         win.resizer.widthIncrement = me.xTickSize;
                         win.resizer.heightIncrement = me.yTickSize;
                    }
               },
               single: true
          });
          return win;
     },

     getWindow: function(id){
          return Klb.system.appMgr.getWindow(id);
     },
     minimizeWindow: function(win){
          win.minimized = true;
          win.hide();
     },
     
     onWindowClose: function(win) {
          var me = this;

          me.taskbar.removeTaskButton(win.taskButton);
          me.updateActiveWindow();
     },
     
     updateActiveWindow: function () {
          var me = this, 
            activeWindow = me.getActiveWindow(), 
            last = me.lastActiveWindow;
          if (activeWindow === last) {
               return;
          }

          if (last && typeof last.el != 'undefined' ) {
               if (last.el.dom) {
                    last.addCls(me.inactiveWindowCls);
                    last.removeCls(me.activeWindowCls);
               }
               last.active = false;
          }

          me.lastActiveWindow = activeWindow;

          if (activeWindow) {
               activeWindow.addCls(me.activeWindowCls);
               activeWindow.removeCls(me.inactiveWindowCls);
               activeWindow.minimized = false;
               activeWindow.active = true;
          }

          me.taskbar.setActiveButton(activeWindow && activeWindow.taskButton);
          // prepends the active app window's title to the Bleext desktop window title, e.g.: [app title] - desktop title
          if (!window.document.originalTitle) {
               window.document.originalTitle = window.document.title;
          }
          window.document.title = ((activeWindow && activeWindow.title) ? '['+ activeWindow.title +'] - ' : '') + window.document.originalTitle;
     },

     getActiveWindow: function () {
          var win = null,
               zmgr = this.getDesktopZIndexManager();

          if (zmgr) {
               // We cannot rely on activate/deactive because that fires against non-Window
               // components in the stack.

               zmgr.eachTopDown(function (comp) {
                    if (comp.isWindow && !comp.hidden) {
                         win = comp;
                         return false;
                    }
                    return true;
               });
          }

          return win;
     },
     
     getDesktopZIndexManager: function () {

          return Klb.system.appMgr.getWindowZIndex();
     },

     restoreWindow: function (win) {
          if (win.isVisible()) {
               win.restore();
               win.toFront();
          } else {
               win.show();
          }
          return win;
     },

     getCount : function(){
     	return Klb.system.appMgr.countWindow();
     },

     tileWindows: function() {
          var me = this, availWidth = me.body.getWidth(true);
          var x = me.xTickSize, y = me.yTickSize, nextY = y;

          Klb.system.appMgr.collectionWindow().each(function(win) {
               if (win.isVisible() && !win.maximized) {
                    var w = win.el.getWidth();

                    // Wrap to next row if we are not at the line start and this Window will go off the end
                    if (x > me.xTickSize && x + w > availWidth) {
                         x = me.xTickSize;
                         y = nextY;
                    }

                    win.setPosition(x, y);
                    x += w + me.xTickSize;
                    nextY = Math.max(nextY, y + win.el.getHeight() + me.yTickSize);
               }
          });
     },

     cascadeWindows: function() {
          var x = 0, y = 0,
               zmgr = this.getDesktopZIndexManager();

          zmgr.eachBottomUp(function(win) {
               if (win.isWindow && win.isVisible() && !win.maximized) {
                    win.setPosition(x, y);
                    x += 20;
                    y += 20;
               }
          });
     },

     setTickSize: function(xTickSize, yTickSize) {
          var me = this,
          xt = me.xTickSize = xTickSize,
          yt = me.yTickSize = (arguments.length > 1) ? yTickSize : xt;

          Klb.system.appMgr.collectionWindow().each(function(win) {
               var dd = win.dd, resizer = win.resizer;
               dd.xTickSize = xt;
               dd.yTickSize = yt;
               resizer.widthIncrement = xt;
               resizer.heightIncrement = yt;
          });
     },

     minimizeAllWindows: function() {
          var x = 0, y = 0,
               zmgr = this.getDesktopZIndexManager();

          zmgr.eachBottomUp(function(win) {
               if (win.isWindow && win.isVisible()) {
                    this.minimizeWindow(win);
               }
          },this);
     },

     closeAllWindows: function() {
          var x = 0, y = 0,
               zmgr = this.getDesktopZIndexManager();

          zmgr.eachBottomUp(function(win) {
               if (win.isWindow) {
                    win.close();
               }
          });
     },

     onWindowMenuBeforeShow: function (menu) {
          var items = menu.items.items, win = menu.theWin;
          items[0].setDisabled(win.maximized !== true && win.hidden !== true); // Restore
          items[1].setDisabled(win.minimized === true); // Minimize
          items[2].setDisabled(win.maximized === true || win.hidden === true); // Maximize
     },

     onWindowMenuClose: function () {
          var me = this, win = me.windowMenu.theWin;

          win.close();
     },

     onWindowMenuHide: function (menu) {
          menu.theWin = null;
     },

     onWindowMenuMaximize: function () {
          var me = this, win = me.windowMenu.theWin;

          win.maximize();
     },

     onWindowMenuMinimize: function () {
          var me = this, win = me.windowMenu.theWin;

          win.minimize();
     },

     onWindowMenuRestore: function () {
          var me = this, win = me.windowMenu.theWin;

          me.restoreWindow(win);
     }
});