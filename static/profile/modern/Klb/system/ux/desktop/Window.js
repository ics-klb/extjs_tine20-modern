/*
 * IcsDesktop 2.4.0
 * 
 * @package     Modern
 * @subpackage  JS Library
 * @copyright   Copyright (c) 2018 LLC ICS (http://www.icstime.com)
 * @license     http://www.gnu.org/licenses/agpl.html AGPL Version 3
 */

Ext.define('Klb.system.ux.desktop.Window',{
    extend: 'Klb.system.Abstract.Window',
    requires: ["Ext.ux.statusbar.StatusBar"],

    mvclass: null,

    border: false,
    html: '&#160;',
    // scrollable: {
    //     direction: 'vertical',
    //     directionLock: true
    // },
    columnLines: true,
    containerScroll: true,

    title: "Default title Application",   
    stateful: false,
    bottomstatus: false,
    isWindow: true,
    isAnimate: false,
    minimizable: true,
    maximizable: true,

    width:  Klb.Common.DEFAULT_WINDOW_WIDTH,
    height: Klb.Common.DEFAULT_WINDOW_HEIGHT,
    plugins: 'responsive',
    responsiveConfig: {
        'width < 1000':                  Ext.bind(this.onViewportResize, this),
        'width >= 1000 && width < 1600': Ext.bind(this.onViewportResize, this),
        'width >= 1600':                 Ext.bind(this.onViewportResize, this)
    },

    constrain  : true,
    bodyPadding: 1,

    initComponent: function() {
        var me = this;

        if ( me.bottomstatus ) {
            me.statusBar = Ext.create('Ext.ux.statusbar.StatusBar', {
                 dock: "bottom",
                 defaultText: "Ready",
                 iconCls: 'x-status-valid'
            });            
            me.dockedItems = [me.statusBar ];
        }
                              
        Klb.system.appMgr.addWindow(this);
        me.callParent();

    },

    afterRender: function () {
        var me = this;
        me.callParent(arguments);

        me.syncSize();
         // resize events.
         Ext.on(me.resizeListeners = { resize: me.onViewportResize, scope: me, buffer: 3 });
        // me.mask(_('Loading ...') );
        // if (me.isMasked() ) me.unmask();
    },
    
    onViewportResize: function () {
        this.syncSize();
    },

    syncSize: function () {
        var me = this,
            width = Ext.Element.getViewportWidth(),
            height = Ext.Element.getViewportHeight(),            
            header = me.header;

        me.el.disableShadow();
//      me.setSize(Math.floor(width *0.97 ), Math.floor(height * 0.97  ));
//      me.setXY([ Math.floor(width ), Math.floor(height) ]);
        me.syncMonitorWindowResize();
        me.el.enableShadow();
    },
 
    doClose : function ()  {

          this.doClose = Ext.emptyFn; // dblclick can call again...
          this.el.disableShadow();
          this.el.fadeOut({
            listeners: {
                scope: this,
                afteranimate: function () {
                    this.destroy();
                    Klb.system.appMgr.delWindow(this);
                }
            }
        });
    }
});


Ext.define('Klb.system.ux.desktop.SaveCancelToolbar', {
    extend: 'Ext.toolbar.Toolbar',
    alias: 'widget.savecanceltoolbar',
    ui: 'footer',
    initComponent: function() {
        var me = this;

        Ext.applyIf(me, {
            layout: {
                pack: 'end',
                type: 'hbox'
            },
            items: [
                {
                    xtype: 'button',
                    action: 'save',
                    width: 80,
                    text: 'Save'
                },
                {
                    xtype: 'button',
                    action: 'cancel',
                    width: 80,
                    text: 'Cancel'
                }
            ]
        });
        me.callParent(arguments);
    }
});

Ext.define('Klb.system.ux.desktop.TriCheckbox', {
  extend: 'Ext.form.field.ComboBox',
  alias: 'widget.tricheckbox',
  store: [[1, "Yes"], [0, "No"]],
  forceSelection: 1
});