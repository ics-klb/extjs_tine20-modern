/*
 * IcsDesktop 2.4.0
 * 
 * @package     Modern
 * @subpackage  TaskBar
 * @copyright   Copyright (c) 2018 LLC ICS (http://www.icstime.com)
 * @license     http://www.gnu.org/licenses/agpl.html AGPL Version 3
 */

Ext.define('Klb.system.ux.desktop.TaskBar', {
    extend: 'Ext.toolbar.Toolbar', // TODO - make this a basic hbox panel...
    requires: [
        'Klb.system.ux.desktop.StartMenu'
    ],
    alias: 'widget.taskbar',
    cls: 'ux-taskbar',
    alwaysOnTop: true,
    dock: 'bottom',
    initComponent: function () {

      var me = this;
        me.startMenu  = Ext.create('Klb.system.ux.desktop.StartMenu', me.startConfig);
        me.quickStart = Ext.create('Ext.toolbar.Toolbar', me.getQuickStart());
        me.windowBar  = Ext.create('Ext.toolbar.Toolbar', me.getWindowBarConfig());
        me.tray       = Ext.create('Ext.toolbar.Toolbar', me.getTrayConfig());
        me.messageLog = Ext.create('Ext.toolbar.Toolbar', me.getWindowMessageLog());

        me.items = [
            {
                xtype: 'button',
                cls: 'ux-start-button',
                iconCls: 'ux-start-button-icon',
                menuAlign: 'bl-tl',
                menu: me.startMenu,
                text: _('#Desktop/Start'),
                height: 28
            }
            , me.quickStart,
            {
                xtype: 'splitter', html: '&#160;',
                height: 14, width: 2, // TODO - there should be a CSS way here
                cls: 'x-toolbar-separator x-toolbar-separator-horizontal'
            }
            , me.windowBar
            , '-'
            , me.tray
        ];
        me.callParent();
    },

    afterLayout: function () {
        var me = this;
        me.callParent();
        me.windowBar.el.on('contextmenu', me.onButtonContextMenu, me);
    },

    getQuickStart: function () {
        var me = this, ret = {
            id : "id_quickLaunch",
            minWidth: 20,
            width: Ext.themeName === 'neptune' ? 70 : 60,
            items: [],
            enableOverflow: true
        };

        Ext.each(this.quickStart, function (item) {
            ret.items.push({
                tooltip: { text: item.name, align: 'bl-tl' },
                overflowText: item.name,
                iconCls: item.iconCls,
                module: item.module,
                handler: me.onQuickStartClick,
                scope: me
            });
        });

        return ret;
    },

    /**
     * This method returns the configuration object for the Tray toolbar.
     */
    getTrayConfig: function () {
        var ret = {
            items: this.trayItems
        };
        delete this.trayItems;
        return ret;
    },

    getWindowBarConfig: function () {
        return {
            flex: 1,
            cls: 'ux-desktop-windowbar',
            items: [ '&#160;' ],
            layout: { overflowHandler: 'Scroller' }
        };
    },

    getWindowMessageLog: function () {

    },

    getWindowBtnFromEl: function (el) {
        var c = this.windowBar.getChildByElement(el);
        return c || null;
    },

    onQuickStartClick: function (btn) {
        var module = this.app.getModule(btn.module),
            window;

        if (module) {
            window = module.createWindow();
            window.show();
        }
    },

    onButtonContextMenu: function (e) {
        var me = this, t = e.getTarget(), btn = me.getWindowBtnFromEl(t);
        if (btn) {
            e.stopEvent();
            me.windowMenu.theWin = btn.win;
            me.windowMenu.showBy(t);
        }
    },

    onWindowBtnClick: function (btn) {
        var win = btn.win;

        if (win.minimized || win.hidden) {
            btn.disable();
            win.show(null, function() {
                btn.enable();
            });
        } else if (win.active) {
            btn.disable();
            win.on('hide', function() {
                btn.enable();
            }, null, {single: true});
            win.minimize();
        } else {
            win.toFront();
        }
    },

    addTaskButton: function(win) {
        var config = {
            iconCls: win.iconCls,
            enableToggle: true,
            toggleGroup: 'all',
            width: 140,
            margins: '0 2 0 3',
            text: Ext.util.Format.ellipsis(win.title, 20),
            listeners: {
                click: this.onWindowBtnClick,
                scope: this
            },
            win: win
        };

        var cmp = this.windowBar.add(config);
        cmp.toggle(true);
        return cmp;
    },

    removeTaskButton: function (btn) {
        var found, me = this;
        me.windowBar.items.each(function (item) {
            if (item === btn) {
                found = item;
            }
            return !found;
        });
        if (found) {
            me.windowBar.remove(found);
        }
        return found;
    },

    setActiveButton: function(btn) {
        if (btn) {
            btn.toggle(true);
        } else {
            this.windowBar.items.each(function (item) {
                if (item.isButton) {
                    item.toggle(false);
                }
            });
        }
    }
});


/**
 * @class Klb.system.ux.desktop.MessageLog
 * @extends Ext.toolbar.TextItem
 * This class displays a Message Log on the toolbar.
 */
Ext.define('Klb.system.ux.desktop.MessageLog', {
    extend: 'Klb.system.Abstract.GridBase',
    alias: 'widget.gridmessagelog',

    store: Ext.data.StoreManager.lookup('MessageLogStore'),
    columns: [
             {header: "Message",  dataIndex: 'message', flex: 1},
             {header: "Date", dataIndex: 'date', width: 300},
             {header: "Severity", dataIndex: 'severity'}
        ],
    proxy: {
       type: 'memory',
       reader: {
           type: 'json',
           root: 'items'
       }
    },
    sorters: [{
        property: 'date',
        direction:'DESC'
     }]
});

Ext.define('Klb.system.ux.desktop.TrayMessageLog', {
    extend: 'Ext.toolbar.TextItem',
    alias: 'widget.traymessagelog',
 
    cls: 'ux-desktop-traymessagelog', 
    messageLog: {},

    initComponent: function () {
        var me =this;
            me.callParent(); 
            me.messageLog = me.createMessageLog();

        me.showMessageLog();
    },

    createMessageLog: function () {
        return Ext.create("Klb.system.ux.desktop.MessageLog", {
            height: 200,
            hidden: true,
            split: true,
            title: "Message Log",
            titleCollapse: true,
            collapsible: true,
            region: 'south',
            opacity: 1,
            listeners: {
                beforecollapse: Ext.bind(
                    function (obj) {
                        this.hideMessageLog();
                        return false;
                    },
                    this)
            }
        });
    },
    log: function (message) {
        var me =this;
            me.logMessage(message, "none");
    },
    logMessage: function (message, severity) {
        if ( message != "Ready." ) {
         var r = Ext.ModelManager.create({
             message: message,
             severity: severity,
             date: new Date()
         }, 'Klb.models.Message');

         this.messageLog.getStore().add(r);
        }
    },
    hideMessageLog: function () {
        this.messageLog.hide();
    },
    showMessageLog: function () {

        this.messageLog.show();
    },
    toggleMessageLog: function () {
        if (this.messageLog.isHidden()) {
            this.showMessageLog();
        } else {
            this.hideMessageLog();
        }
    },
    afterRender: function () {
        var me = this;
        me.callParent();
    },
    onDestroy: function () {
        var me = this;
        me.callParent();
    }
});

/**
 * @class Klb.system.ux.desktop.TrayClock
 * @extends Ext.toolbar.TextItem
 * This class displays a clock on the toolbar.
 */
Ext.define('Klb.system.ux.desktop.TrayClock', {
    extend: 'Ext.toolbar.TextItem',

    alias: 'widget.trayclock',
    cls: 'ux-desktop-trayclock',
    html: '&#160;',
    timeFormat: 'g:i A',
    tpl: '{time}',

    initComponent: function () {
        var me = this;

        me.callParent();

        if (typeof(me.tpl) == 'string') {
            me.tpl = new Ext.XTemplate(me.tpl);
        }
    },

    afterRender: function () {
        var me = this;
        Ext.Function.defer(me.updateTime, 100, me);
        me.callParent();
    },

    onDestroy: function () {
        var me = this;
        if (me.timer) {
            window.clearTimeout(me.timer);
            me.timer = null;
        }
        me.callParent();
    },

    updateTime: function () {
        var me = this, time = Ext.Date.format(new Date(), me.timeFormat),
            text = me.tpl.apply({ time: time });
        if (me.lastText != text) {
            me.setText(text);
            me.lastText = text;
        }
        me.timer = Ext.Function.defer(me.updateTime, 10000, me);
    }
});


/**
 * @class Klb.system.ux.desktop.TrayLangButton
 * @extends Ext.toolbar.TextItem
 */
Ext.define('Klb.system.ux.desktop.TrayLangButton', {
    extend: 'Ext.toolbar.TextItem',

    alias: 'widget.traylangbutton',
    cls: 'ux-desktop-traylangbutton',
    html: '&#160;',

    timeFormat: 'g:i',
    tpl: '{time}',

    initComponent: function () {
        var me = this;

        me.callParent();

        if (typeof(me.tpl) == 'string') {
            me.tpl = new Ext.XTemplate(me.tpl);
        }
    } 
});

Ext.define('Klb.system.ux.desktop.TrayNetConnect', {
    extend: 'Ext.toolbar.TextItem',
    alias: 'widget.traynetconnect',

    cls: 'ux-desktop-traynetconnect',
    html: '&#160;',

    initComponent: function () {
        var me = this;

        me.callParent();

        if (typeof(me.tpl) == 'string') {
            me.tpl = new Ext.XTemplate(me.tpl);
        }
    }

});