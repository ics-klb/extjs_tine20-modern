/*
 * Modern 3.0.1
 * 
 * @package     System
 * @subpackage  Abstract
 * @copyright   Copyright (c) 2018 LLC ICS (http://www.icstime.com)
 * @license     http://www.gnu.org/licenses/agpl.html AGPL Version 3
 */

Ext.ns('Klb.abstract', 'Klb.system.Abstract', 'Klb.abstract.store', 'KlbDesktop.MVC');

Ext.define("Klb.abstract.Abstract",      { extend: "Object" });
Ext.define('Klb.abstract.AppController', { extend: 'Ext.app.Controller'});
Ext.define('Klb.abstract.Model',     { extend: 'Ext.data.Model',  xtype: 'klbmodel', identifier: 'uuid' });
Ext.define('Klb.abstract.StoreData', { extend: 'Ext.data.Store',  xtype: 'klbstore', identifier: 'uuid', proxy: 'memory', rootProperty: 'results' });
Ext.define('Klb.abstract.StoreTree', {
    extend: 'Ext.data.TreeStore',
    xtype: 'klbtreestore',
    proxy: 'memory',
    identifier: 'uuid',
    getAt: function (index) {
        var current = 0;
        return (function find(nodes) {
          var i, len = nodes.length;
          for (i = 0; i < len; i++) {
            if (current === index) {
              return nodes[i];
            }
            current++;
            var found = find(nodes[i].childNodes);
            if (found) {
              return found;
            }
          }
        }(this.tree.root.childNodes));
    }
});

Ext.define('Klb.abstract.Module',{
  extend : 'Ext.ux.desktop.Module',
  id : null,
  launcher : null,
  loaded : false,
  init : Ext.emptyFn, 
  createWindow : function() { 
    this.app.createWindow(this.id);
  },
  handleRequest : Ext.emptyFn,
  
  getId: function() {
    return this.id;
  }
});

Ext.define('Klb.abstract.TollbarButton', {
    extend: 'Ext.button.Button',
    rowspan: 2,
    scale: 'medium',
    iconAlign: 'top'
});

Ext.define('Klb.abstract.Panel',{
    extend : 'Ext.panel.Panel',
    alias: 'widget.klbpanel',
    dockedItems: [{
        xtype: 'toolbar',
        dock: 'top'
    }],
    getTopToolbar: function() {
        var items = this.getDockedItems('toolbar[dock="top"]');
        return items ? items[0] : null;
    }
});

Ext.define('Klb.abstract.TreePanel',{ extend: 'Ext.tree.Panel' });

Ext.define('Klb.abstract.Grid',{
    extend : 'Ext.grid.Panel',
    viewConfig: {
        trackOver: false,
        emptyText: 'No matching results'
    },
    initComponent: function() {
        var me = this;
        if(me.paging){
            me.dockedItems = [{
                xtype   : "pagingtoolbar",
                store   : me.store,
                dock    : "bottom",
                displayInfo : true
            }];
        }

        me.callParent();
    }
});

Ext.define('Klb.abstract.Form',{
    extend        : 'Ext.form.Panel',
    columns       : 1,
    border        : false,
    defaultType   : 'textfield',
    fieldDefaults : {
        labelAlign: 'left',
        msgTarget : 'side',
        width     : 180
    },
    layout        : 'anchor',
    bodyPadding   : 5,
    autoScroll    : true,

    initComponent    : function(){
        this.layout.columns = this.columns;
        this.callParent();
    }
});

Ext.define('Klb.abstract.LocalStorage', {
    extend    : 'Ext.data.proxy.LocalStorage',
    constructor : function() {
        var me = this;
        me.callParent();
    }
});

Ext.define('Klb.abstract.ProxyAjax',{
    extend        : 'Ext.data.proxy.Ajax',
    constructor    : function() {
        var me = this;
        me.callParent();
    }
});

Ext.define('Klb.abstract.Window', { extend : 'Ext.window.Window', layout: 'fit'  });
Ext.define('Klb.abstract.ModalWindow',{
    extend: 'Ext.window.Window',
    cls   : "window-modal",
    layout: 'fit',
    modal : true,
    draggable   : false,
    resizable   : false,
    bodyPadding : 10
});

Ext.define('Klb.abstract.Viewport', {
   extend: 'Ext.container.Container',
   layout: { type: 'border', padding: 0 }
});

Ext.define('Klb.abstract.ViewportModern', {
    extend: 'Ext.container.Container',
    appName: false,

    layout: { type: 'border', padding: 0 },
    initComponent: function() {
        var me = this;

        var app = Klb.system.appMgr.get(me.appName),
            viewApp = app.getMainScreen();

        app.setViewport(this);
        me.setupMainItems();
        me.callParent();
    },

    afterRender: function() {
        this.callParent();
        this.setupView();
    },

    clearView: function(_items) {
        this.down("[reference=mainview-moduletree]").removeAll();
        this.down("[reference=mainview-north]").removeAll();
        this.down("[reference=mainview-west]").removeAll();
    },
    setViewNorth: function(_items) {
          _items = _items || [];
          this.down("[reference=mainview-north]").add(_items);
        return this;
    },
    setViewCenter: function(_items) {
          _items = _items || [];
          this.down("[reference=mainview-center]").add(_items);
        return this;
    },
    setViewWest: function(_items) {
           _items = _items || [];
           var west = this.down("[reference=mainview-west]");
           west.add(_items);
        return this;
    },
    setViewModuletree: function(_items) {
          _items = _items || [];
          this.down("[reference=mainview-moduletree]").add(_items);
        return this;
    },
    setViewCardstree: function(_items) {
          _items = _items || [];
          this.down("[reference=mainview-treecards]").add(_items);
        return this;
    },

    setupMainItems: function() {

        this.items = [{
            xtype: 'panel',
            cls: 'apibase-mainscreen-centerpanel',
            reference : 'mainview-container',
            layout: 'border',
            bodyBorder: false,
            defaults: {
                collapsible: false,
                xtype: 'panel',
                split: false,
                header: false
            },
            items: [
            {
                cls: 'apibase-mainscreen-centerpanel-north',
                region: 'north',
                activeItem: 0,
                height: 60,
                reference : 'mainview-north',
                items: []
            }, {
                cls: 'apibase-mainscreen-centerpanel-center',
                region:     'center',
                reference : 'mainview-center',
                flex: 1,
                defaults: {
                    bodyPadding: 0,
                    border: false
                },
                activeItem: 0,
                items: []
            }, {
                cls: 'apibase-mainscreen-centerpanel-west',
                region: 'west',
                reference : 'mainview-west',
                stateful: false,
                split: true,
                width: 270,
                minSize: 100,
                maxSize: 700,
                listeners: {
                   afterrender: function() {
                       // add to scrollmanager
                       if (arguments[0] && arguments[0].hasOwnProperty('body')) {
                           Ext.dd.ScrollManager.register(arguments[0].body);
                       }
                   }
               },
                autoScroll: true,
                tbar: [{
                     buttonAlign : 'center'
                }],
                items: [{
                    xtype: 'container',
                    reference : 'mainview-moduletree',
                    cls: 'apibase-mainscreen-centerpanel-west-modules',
                    autoScroll: false,
                    autoHeight: true,
                    layout: 'card',
                    flex: 1,
                    activeItem: 0,
                    items: []
                }, {
                    xtype: 'container',
                    reference : 'mainview-treecards',
                    cls: 'apibase-mainscreen-centerpanel-west-treecards',
                    border: false,
                    autoScroll: false,
                    layout: 'card',
                    flex: 1,
                    activeItem: 0,
                    items: []
                } ]
            }
            ]
        }];

      return this;
    }
});

Ext.define('Klb.abstract.MVCViewport', {
    extend: 'Ext.container.Viewport', 
    constrain: true,
    constrainHeader: true,
    animCollapse: false,    
    singleton: false,

    initComponent: function(){
       var me = this;
           me.createView(me.winid);
    },
    createView: function(winid, items){
        
        var view =  Klb.system.appMgr.getWindow(winid);
        if ( !view) {
              view =  Klb.system.windowMgr.createWindow({ title: 'Klb.abstract.Viewport - not found Id ' + winid  }, false);
        } 
        view.update('');
        view.add( this.items );
    }
});

Ext.define('Klb.abstract.GridBase', {
    extend: 'Ext.grid.Panel'
});

Ext.define('Klb.abstract.Controller', {
    extend: 'Ext.app.Controller',
    conf:{},
    app: { records: {} },

    init: function() {
        var me = this, actions = {};
        me.callParent();

      if (me.conf.control !== false) {
            me.control({
                "button[action=new]": {
                    click : me.add
                },
                "button[action=save]" : {
                    click : me.save
                },
                "button[action=delete]" : {
                    click : me.remove
                }
            });
       }
    },

    getStoreId: function(storeId) {
        return Klb.Store.get(storeId);
    },

    control: function(actions) {
        var me = this;
            me.callParent(arguments);
    },
    
    /**
     * This method display an error message in the status bar of the main window
     * @param {String} msg The message to display
     */
    showError : function(msg){
        this.win.statusBar.setStatus({
            text    : msg,
            iconCls : "x-status-error"
        });
    },

    /**
     * This method display a success message in the status bar of the main window
     * @param {String} msg The message to display
     */
    showMessage    : function(msg) { 
        this.win.statusBar.setStatus({
            text: msg,
            iconCls: "x-status-valid"
        });
    },

    setViewport: Ext.emptyFn,
    /**
     * An abstract method. This method is executed when the user clicks in any button
     * withing the main window than contain a property "action" equals to "new".
     */
    add : Ext.emptyFn,
    /**
     * An abstract method. This method is executed when the user clicks in any button
     * withing the main window than contain a property "action" equals to "save".
     */
    save : Ext.emptyFn,
    /**
     * An abstract method. This method is executed when the user clicks in any button
     * withing the main window than contain a property "action" equals to "delete".
     */
    remove : Ext.emptyFn
});

Ext.ns('Klb.core.Direct', 'Klb.Direct');

Ext.define('Klb.Direct.PollingProvider', { 
    extend: 'Ext.direct.PollingProvider',
    timeoutCache : {},

    type: 'polling', 
    pending: false,
    url: KlbSys.requestUrl,

    constructor : function(config){
      var me = this;
          config = config || {};

        me.callParent([config]);

        Ext.direct.Manager.addProvider( me );
        Ext.direct.Manager.getProvider( me.id ).disconnect();
    },

    connect_: function(){
        this.pending = false;
        this.addListener('data', this.onDataParser, this); 
        this.addListener('beforepoll', this.onBeforepoll, this); 
    },

    connect: function() {
        var me = this,
            url = me.url;

        me.connect_();
        if (url && !me.pollTask) {
            me.pollTask = Ext.TaskManager.start({
                run: me.runPoll,
                interval: me.interval,
                scope: me
            });

            me.fireEvent('connect', me);
        }
        //<debug>
        else if (!url) {
            Ext.Error.raise('Error initializing PollingProvider, no url configured.');
        }
        //</debug>
    },

    disconnect: function(){
        this.pending = false;
        this.removeListener('data', this.onDataParser);
        this.removeListener('beforepoll', this.onBeforepoll);  
        this.callParent();
    },

    setUrl : function(url, params) {
       if ( url ) {
            this.url = url;
            Ext.direct.Manager.getProvider( this.id ).url = url;
            if ( typeof params !== 'strings' ) {

//                for(arg in params ) 
                    this.baseParams = params; // [arg] = params[arg];

            }
       }
    },
    clearTimeoutCache : function()
    {
        this.timeoutCache = [];
    },
    /**
     * @private
     */
    onDataParser: function(provider, event ) {

    },
    /**
     * @private
     */
    onData: function(opt, success, response) {
        var me = this, 
            i, len, events;

        if (success) {
            events = me.createEvents(response);
            var eventName = '';
            for (i = 0, len = events.length; i < len; ++i) {
 
                if ( typeof events[i].name == 'string' ) eventName = events[i].name;
                  else eventName = false;  

                if ( eventName && events[i].hasOwnProperty(eventName) ) {
                        me.fireEvent(eventName, me, events[i][eventName] );
                } else 
                    me.fireEvent('data', me, events[i]);
            }
        }
        else {

            events = new Ext.direct.ExceptionEvent({
                data: null,
                code: Ext.direct.Manager.exceptions.TRANSPORT,
                message: 'Unable to connect to the server.',
                xhr: response
            });

            me.fireEvent('unsuccess', me, events);
            me.fireEvent('data', me, events);
        }
        me.pending = false;
    },
    /**
     * @private
     */
    onBeforepoll: function() { // запрет на повторній запросы при  pending
       return !this.pending;
    },

    runPoll: function() {
        var me = this,
            url = me.url;

        if (me.fireEvent('beforepoll', me) !== false) {
            if (Ext.isFunction(url)) {
                url(me.baseParams);
            }
            else {
                me.pending = true;
                Ext.Ajax.request({
                    url: url,
                    callback: me.onData,
                    scope: me,
                    params: me.baseParams,
                    timeout: 60 * 1000
                });
            }
            me.fireEvent('poll', me);
        }
    }
 
});

Ext.define('Klb.Direct.RemotingProvider', { 
    extend: 'Ext.direct.RemotingProvider',
    timeoutCache : {},
 
    url: KlbSys.requestUrl,

    constructor : function(config){
      var me = this;
          config = config || {};

        me.callParent([config]);
    },
    clearTimeoutCache : function()
    {
        this.timeoutCache = [];
    },
    connect: function(){
        this.addListener('data', this.onDataParser, this); 
        this.callParent();
    },

    disconnect: function(){
        this.removeListener('data', this.onDataParser); 
        this.callParent();
    },
    onDataParser: function( provider, event ) { 

    },

    setInterval: function(field) {
        var interval, provider;
        
        interval = parseInt(field.getValue());
        
        if (Ext.isNumeric(interval)) {
            provider = this.pollingProvider;
            
            provider.disconnect();
            
            // Accidentally (or intentionally) setting the interval to 0
            // will make the Polling provider to go frenzy and may cause
            // the browser to hang. So guard against it here.
            if (interval > 0) {
                provider.interval = interval * 1000;
                provider.connect();

                this.updateView('Polling interval set to ' + interval + ' seconds');
            }
            else {
                this.updateView('Polling was paused');
            }
        }
    }
});

