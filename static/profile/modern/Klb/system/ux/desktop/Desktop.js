/*
 * IcsDesktop 2.4.0
 * 
 * @package     Modern
 * @subpackage  JS Library
 * @copyright   Copyright (c) 2018 LLC ICS (http://www.icstime.com)
 * @license     http://www.gnu.org/licenses/agpl.html AGPL Version 3
 */

Ext.define('Klb.system.ux.desktop.Gadget', {
    extend: 'Ext.panel.Panel',
    task: Ext.emptyFn,
    constructor: function (config) { 
      var me = this;
        config = config || {};
        config.anchor = '100%';
        config.cls = 'x-gadget';
       me.callParent(config);
    }
});

Ext.define('Klb.system.ux.desktop.Desktop', {
    extend: 'Ext.panel.Panel',
    alias: 'widget.desktop',
    mixins: [
          'Ext.mixin.Responsive',
          'Ext.util.MixedCollection'
    ],    
    uses: [
      'Ext.menu.Menu',
      'Ext.view.View', // dataview
      'Klb.system.ux.desktop.WindowManager',

      'Klb.system.ux.desktop.TaskBar',
      'Klb.system.ux.desktop.Wallpaper',
      'Klb.system.ux.desktop.ShortcutModel'
     ],

     activeWindowCls: 'ux-desktop-active-win',
     inactiveWindowCls: 'ux-desktop-inactive-win',

     border: false,
     html: '&#160;',
     layout: 'fit',

     xTickSize: 1,
     yTickSize: 1,

     app: 'klbbase.desktop',
     panels: {},
     getGadgets: Ext.emptyFn,
     isSidebarOpen: Ext.emptyFn,

    launchers: {
        autorun: [],
        quickstart: [],
        shortcut: []
    },

    logoutConfig: {
        handler: function(){ window.location = Klb.Common.DESKTOP_LOGOUT_URL; },
        iconCls: 'icon-logout',
        text: 'Logout'
    },
     /**
      * @cfg {Array|Store} shortcuts
      * The items to add to the DataView. This can be a {@link Ext.data.Store Store} or a
      * simple array. Items should minimally provide the fields in the
      * {@link Klb.system.ux.desktop.ShorcutModel ShortcutModel}.
      */
    shortcuts: null,

     /**
      * @cfg {String} shortcutItemSelector
      * This property is passed to the DataView for the desktop to select shortcut items.
      * If the {@link #shortcutTpl} is modified, this will probably need to be modified as
      * well.
      */
    shortcutItemSelector: 'div.ux-desktop-shortcut',

     /**
      * @cfg {String} shortcutTpl
      * This XTemplate is used to render items in the DataView. If this is changed, the
      * {@link shortcutItemSelect} will probably also need to changed.
      */
    shortcutTpl: [
       '<tpl for=".">',
            '<div class="ux-desktop-shortcut" id="{name}-shortcut">',
                '<div class="ux-desktop-shortcut-icon {iconCls}">',
                    '<img src="', Ext.BLANK_IMAGE_URL, '" title="{name}">',
                '</div>',
                '<span class="ux-desktop-shortcut-text">{name}</span>',
            '</div>',
        '</tpl>',
        '<div class="x-clear"></div>'
     ],

     /**
      * @cfg {Object} taskbarConfig
      * The config object for the TaskBar.
      */
    sidebar: null,
    sidelog: null,
    windowMenu: null,
    taskbarConfig: null,

    msgCt:null,
    msgId:'',
    m:null,

    responsiveConfig: {
        landscape: 
        {
            region: 'west'
        },
        portrait: 
        {
            region: 'north'
        }, 
        'desktop || width > 800': {
            region: 'west'
        },
        '!(desktop || width > 800)': {
            region: 'north'
        }
    },

    initComponent: function () {

      var me = this;
        me.contextMenu  = Ext.create('Ext.menu.Menu', me.createDesktopMenu());
        me.windowMenu   = Ext.create('Ext.menu.Menu', me.createWindowMenu());
        me.bbar = me.taskbar = Ext.create('Klb.system.ux.desktop.TaskBar', me.taskbarConfig);
        me.taskbar.windowMenu = me.windowMenu;

        Klb.system.windowMgr = Ext.create('Klb.system.ux.desktop.WindowManager', {taskbar: me.taskbar});

        me.items = [
                   { xtype: 'wallpaper', id: me.id+'_wallpaper'},
                     me.createDataView()
                ];

        me.callParent();

        me.shortcutsView = me.items.getAt(1);
        me.shortcutsView.on('itemclick', me.onShortcutItemClick, me);
        me.shortcutsView.on('viewready',function(){
              //short-cut.color
              var color = Klb.system.Core.getAccount('color'),
                  items = Ext.DomQuery.select('div.ux-desktop-shortcut-text');
              Ext.each(items, function(item, i) {
                   item.id = item.innerHTML;
                   if ( color ) Ext.fly(item.id).setStyle('color', color);
              });
        });

        var wallpaper = me.wallpaper;
        me.wallpaper = me.items.getAt(0);
        if (wallpaper) {
             me.setWallpaper(wallpaper, me.wallpaperStretch);
        }

        Ext.getCmp("id_shortcut_dataview").on('viewready', me.resizeDesktop, me);
        Ext.EventManager.onWindowResize(function () {
            me.resizeDesktop();
        }, this); 
    },

    afterRender: function () {
          var me = this;
          me.callParent();
       me.el.on('contextmenu', me.onDesktopMenu, me);
       if ( me.shortcuts ) { 
           me.shortcuts.on('datachanged', me.resizeDesktop,me); 
       }
     },

     resizeDesktop:function(){
          /*
            * this method update de icons location in desktop when resize de window
             */
          var dv = Ext.getCmp('id_shortcut_dataview'),
            dv_w = dv.getWidth(),
            dv_h = dv.getHeight(),
            t=0,  l=0, t_add=0;

        Ext.getCmp('id_shortcut_dataview').getStore().each(function(r){
            var id=r.data.name;
            if (id!=undefined)
            {
                 id=id+"-shortcut";
                 Ext.get(id).setTop(t);
                 Ext.get(id).setLeft(l);
                 t_add=Ext.get(id).getHeight();
                 t=t+84;
                 if (t+t_add>dv_h){
                      l=l+68;
                      t=0;
                 }
            }
          },this);
    },

// --------------------- Auto Run  after loaded
    initAutoRun : function(){

        var mIds = this.launchers.autorun;
        if(mIds && mIds.length > 0){
            this.app.onReady(function(){
                for(var i = 0, len = mIds.length; i < len; i++){
                    var m = this.app.getModule(mIds[i]);
                    if(m){
                        m.autorun = true;
                        this.launchWindow(mIds[i]);
                    }
                }
            }, this);
        }
    },
    /**
     * @param {string} id The id of the module to add.
     */
    addAutoRun : function(id){

        var m = this.app.getModule(id);
        var c = this.getLauncher('autorun');
                
        if(c && m && !m.autorun){
            m.autorun = true;
            c.push(id);
        }
    },

    /**
     * @param {string} id The id of the module to remove.
     */
    removeAutoRun : function(id){

        var m = this.app.getModule(id);
        var c = this.getLauncher('autorun');

        if(c && m && m.autorun){
            var i = 0;

            while(i < c.length){
                if(c[i] == id){
                    c.splice(i, 1);
                }else{
                    i++;
                }
            }

            m.autorun = null;
        }
    },
    /**
     * @param {String} key The launcher key.  Options are: 'autorun', 'quickstart' and 'shortcut'.
     */
    getLauncher : function(key){
        return this.launchers[key];
    },

    /**
     * @param {String} key The launcher key.  Options are: 'autorun', 'quickstart' and 'shortcut'.
     * @param {String} id The module id to add.
     */
    addToLauncher : function(key, id){
        var c = this.getLauncher(key);
        if(c){
            c.push(id);
        }
    },

    /**
     * @param {String} key The launcher key.  Options are: 'autorun', 'quickstart' and 'shortcut'.
     * @param {String} id The module id to remove.
     */
    removeFromLauncher : function(key, id){
        var c = this.getLauncher(key);
        if(c){
            var i = 0;
            while(i < c.length){
                if(c[i] == id){
                    c.splice(i, 1);
                }else{
                    i++;
                }
            }
        }
    },

     //------------------------------------------------------
     // Overrideable configuration creation methods
     createDataView: function () {
          var me = this;
          return {
                xtype: 'dataview',
                id:'id_shortcut_dataview',
                overItemCls: 'x-view-over',
                trackOver: true,
                itemSelector: me.shortcutItemSelector,
                store: me.shortcuts,
                style: {
                     position: 'absolute'
                },
                x: 0,  y: 0,
                tpl: new Ext.XTemplate(me.shortcutTpl)
                ,items:        [{
            xtype:'buttongroup',
            items: [{
                text: 'Cut',
                iconCls: 'add24',
                scale: 'medium'
            },{
                text: 'Copy',
                iconCls: 'add24',
                scale: 'medium'
            },{
                text: 'Paste',
                iconCls: 'add24',
                scale: 'medium',
                menu: [{text: 'Paste Menu Item'}]
            }]
        }]
          };
     },

     createDesktopMenu: function () {
          var me = this, ret = {
                items: me.contextMenuItems || []
          };

          if (ret.items.length) {
                ret.items.push('-');
          }

          /*** Language options ***/
          me.tileText     = _("#Desktop/tile") ;
          me.cascadeText  = _("#Desktop/cascade") ;
          ret.items.push(
          {
                text:  me.tileText, 
                handler: me.tileWindows, 
                scope: me, 
                minWindows: 1
          },
          {
                text:  me.cascadeText, 
                handler: me.cascadeWindows, 
                scope: me, 
                minWindows: 1
          })

          return ret;
     }, 

     createWindowMenu: function () {
          var me = this;

          /*** Language options ***/
          me.restoreText  = _("#Desktop/restore") ;
          me.minimizeText = _("#Desktop/minimize") ; 
          me.maximizeText = _("#Desktop/maximize") ; 
          me.closeText    = _("#Desktop/close") ; 

          return {
                defaultAlign: 'br-tr',
                items: [
                     { text: me.restoreText,  handler: me.onWindowMenuRestore,  scope: me },
                     { text: me.minimizeText, handler: me.onWindowMenuMinimize, scope: me },
                     { text: me.maximizeText,  handler: me.onWindowMenuMaximize,  scope: me },
                     '-',
                     { text: me.closeText,  handler: me.onWindowMenuClose,  scope: me }
                ],
                listeners: { 
                        beforeshow: me.onWindowMenuBeforeShow, 
                        hide: me.onWindowMenuHide, scope: me }
          };
     },

     buildSidebar: function () {
        this.sidebar = Ext.create('Klb.system.ux.desktop.Sidebar', {
              desktopEl: Ext.get("x-desktop"), 
              sidebarEl: Ext.get('ux-sidebar'),
              sidebarBgEl: Ext.get('ux-sidebar-background'),
              logoEl: Ext.get('kolobiz-logo'),
                app: this.app
      });
     },
     //------------------------------------------------------
     // Event handler methods

     onDesktopMenu: function (e) {
          var me = this, menu = me.contextMenu;
          e.stopEvent();
          if (!menu.rendered) {
                menu.on('beforeshow', me.onDesktopMenuBeforeShow, me);
          }
          menu.showAt(e.getXY());
          menu.doConstrain();
     },

     onDesktopMenuBeforeShow: function (menu) {
          var me = this, count = Klb.system.windowMgr.getCount();

          menu.items.each(function (item) {
                var min = item.minWindows || 0;
                item.setDisabled(count < min);
          });
     },

     onShortcutItemClick: function (dataView, record) {
          var me = this, module = me.app.getModule(record.data.module),
          win = module && module.createWindow();

          if (win) {
              me.restoreWindow(win);
          }
     },

     onWindowClose: function(win) {
          var me = this;

            me.taskbar.removeTaskButton(win.taskButton);
            me.updateActiveWindow();
     },

     //------------------------------------------------------
     // Window context menu handlers

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
          win.toFront();
     },

     onWindowMenuMinimize: function () {
          var me = this, win = me.windowMenu.theWin;

          win.minimize();
     },

     onWindowMenuRestore: function () {
          var me = this, win = me.windowMenu.theWin;

          me.restoreWindow(win);
     },

    //------------------------------------------------------
    getWallpaper: function () {
          return this.wallpaper.wallpaper;
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

    setWallpaper: function (wallpaper, stretch) {
          this.wallpaper.setWallpaper(wallpaper, stretch);

          return this;
    },

     //------------------------------------------------------
     // Window management methods
    getWidgetModule: function(id) {
        return Klb.system.windowMgr.getWindow(id);
    },

     createWidgetModule: function(config, params) {
         config = config || {};
         var me = this, win;
                 var app = Klb.system.appMgr.getByModule( params.modclass );
                     config.width = config.width ||  800;
                     config.height = config.height ||  450;
                     config.layout = config.layout ||  'fit';
                
                     win = app.createWindow(config, false);
        return win;
     },

     createWindow: function(config, cls) {
          var me = this, win;
          if ( undef( config.iconCls) ) config.iconCls = "icon-admin";
 
              me.loading = _("#Desktop/loading"); 
              me.notification(me.loading, config.title, config.iconCls); 
                         config.width = config.width || 800;
                         config.height = config.height || 450;
                         config.layout = config.layout || 'fit';

        return Klb.system.windowMgr.createWindow(config, cls);
    },

    cascadeWindows: function() {
        Klb.system.windowMgr.cascadeWindows();
    },

    lastActiveWindow: function () {
        return Klb.system.windowMgr.lastActiveWindow;
    },
    getActiveWindow: function () {
        return Klb.system.windowMgr.getActiveWindow();
    },

    getWindow: function(id) {
        return Klb.system.windowMgr.getWindow(id);
    },

    minimizeWindow: function(win) {
        return Klb.system.windowMgr.minimizeWindow(win);
    },

    restoreWindow: function (win) {
        return Klb.system.windowMgr.restoreWindow(win); 
    },

     tileWindows: function() {

          return Klb.system.windowMgr.tileWindows(); 
//          var me = this, availWidth = me.body.getWidth(true);
//          var x = me.xTickSize, y = me.yTickSize, nextY = y;

//          Klb.system.appMgr.collectionWindow().each(function(win) {
//                if (win.isVisible() && !win.maximized) {
//                     var w = win.el.getWidth();

//                      Wrap to next row if we are not at the line start and this Window will
//                      go off the end
//                     if (x > me.xTickSize && x + w > availWidth) {
//                          x = me.xTickSize;
//                          y = nextY;
//                     }

//                     win.setPosition(x, y);
//                     x += w + me.xTickSize;
//                     nextY = Math.max(nextY, y + win.el.getHeight() + me.yTickSize);
//                }
//          });
     },

//     updateActiveWindow: function () {
//          var me = this, activeWindow = me.getActiveWindow(), last = me.lastActiveWindow();
//          if (activeWindow === last) {
//                return;
//          }

//          if (last) {
//                if (last.el.dom) {
//                     last.addCls(me.inactiveWindowCls);
//                     last.removeCls(me.activeWindowCls);
//                }
//                last.active = false;
//          }

//          me.lastActiveWindow = activeWindow;

//          if (activeWindow) {
//                activeWindow.addCls(me.activeWindowCls);
//                activeWindow.removeCls(me.inactiveWindowCls);
//                activeWindow.minimized = false;
//                activeWindow.active = true;
//          }

//          me.taskbar.setActiveButton(activeWindow && activeWindow.taskButton);
//     },

    createSidePanel : function(){ 
      var me = this;

        me.panels.side = Ext.create("Ext.panel.Panel",{
                  messageBusListeners:[{fn:initSlidePanel,name:"App.Desktop.ready"}],
                  floating:true,frame:true,hidden:true
                , plugins:[Ext.create("Ext.ux.MouseDistanceSensor",{threshold:25,opacity:false,minOpacity:0.0,maxOpacity:1.0,listeners:{far:{fn:function(item){this.component.el.alignTo(Ext.net.Desktop.desktop.body, 'tl-tr', [0, 0], true);}},near:{fn:function(item,sensorEl){this.component.el.alignTo(Ext.net.Desktop.desktop.body, 'tr-tr', [0, 0], true);}}}})]
                , renderTo:"App.ctl02_Container"
                , width:250,shadow:false
                , items:[{title:"Section 1",iconCls:"#User"},{title:"Section 2",iconCls:"#UserB"},{title:"Section 3",iconCls:"#UserB"},{title:"Section 4",iconCls:"#UserB"},{title:"Section 5",iconCls:"#UserB"}]
                , layout:"accordion",title:"Slide panel"});
     },

     createBox : function(t, s){
          return '<div class="msg"><h3>' + t + '</h3><p>' + s + '</p></div>';
     },

     notification:function(title, msg, ico){
     var meApp = Klb.system.appDesktop.getApp(); 
          meApp.showNotification(title, msg, ico);
    },

    /**
      * Returns the Start Menu items and toolItems configs
      */
     buildStartItemConfig : function(){
          var ms = this.app.modules;
          var sortFn = this.startMenuSortFn;

          if(ms){
            var launcherPaths;
                var paths;
                var sm = {menu: {items: []}}; // Start Menu
                var smi = sm.menu.items;

                smi.push({text: 'startmenu', menu: {items: []}});
                smi.push({text: 'startmenutool', menu: {items: []}});

                for(var i = 0, iLen = ms.length; i < iLen; i++){ // loop through the modules
                if(ms[i].launcherPaths){
                    launcherPaths = ms[i].launcherPaths;

                    for(var id in launcherPaths){ // loop through the module's launcher paths
                        paths = launcherPaths[id].split('/');

                        if(paths.length > 0){
                            if(id === 'startmenu'){
                                simplify(smi[0].menu, paths, ms[i].launcher);
                                sort(smi[0].menu);
                            }else if(id === 'startmenutool'){
                                simplify(smi[1].menu, paths, ms[i].launcher);
                                sort(smi[1].menu);
                            }
                        }
                    }
                     }
                }

                return {
                     items: smi[0].menu.items,
                     toolItems: smi[1].menu.items
                };
          }

       return null;
                
          /**
            * Creates nested arrays that represent the Start Menu.
            *
            * @param {array} pMenu The Start Menu
            * @param {array} paths The menu texts
            * @param {object} launcher The launcher config
            */
          function simplify(pMenu, paths, launcher){
                var newMenu;
                var foundMenu;

                for(var i = 0, len = paths.length; i < len; i++){
                if(paths[i] === ''){
                    continue;
                }

                     foundMenu = findMenu(pMenu.items, paths[i]); // text exists?

                     if(!foundMenu){
                          newMenu = {
                                iconCls: 'ux-start-menu-submenu',
                                handler: function(){ return false; },
                                menu: {items: []},
                                text: paths[i]
                          };
                          pMenu.items.push(newMenu);
                          pMenu = newMenu.menu;
                     }else{
                          pMenu = foundMenu;
                     }
                }

                pMenu.items.push(launcher);
          }

          /**
            * Returns the menu if found.
            * @param {array} pMenu The parent menu to search
            * @param {string} text
            */
          function findMenu(pMenu, text){
                for(var j = 0, jlen = pMenu.length; j < jlen; j++){
                     if(pMenu[j].text === text){
                          return pMenu[j].menu; // found the menu, return it
                     }
                }
                return null;
          }

          /**
            * @param {array} menu The nested array to sort
            */
          function sort(menu){
                var items = menu.items;
                for(var i = 0, ilen = items.length; i < ilen; i++){
                     if(items[i].menu){
                          sort(items[i].menu); // use recursion to iterate nested arrays
                     }
                     bubbleSort(items, 0, items.length); // sort the menu items
                }
          }

          /**
            * @param {array} items Menu items to sort
            * @param {integer} start The start index
            * @param {integer} stop The stop index
            */
          function bubbleSort(items, start, stop){
                for(var i = stop - 1; i >= start;  i--){
                     for(var j = start; j <= i; j++){
                          if(items[j+1] && items[j]){
                                if(sortFn(items[j], items[j+1])){
                                     var tempValue = items[j];
                                     items[j] = items[j+1];
                                     items[j+1] = tempValue;
                                }

                          }
                     }
                }
                return items;
          }
     }
});
