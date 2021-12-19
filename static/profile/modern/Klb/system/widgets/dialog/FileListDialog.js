
Ext.ns('Klb.system.widgets.dialog');
/**
 * @namespace   Klb.system.widgets.dialog
 * @class       Klb.system.widgets.dialog.FileListDialog
 * @extends     Ext.form.Panel
 */
Ext.define('Klb.system.widgets.dialog.FileListDialog', {
    extend: 'Ext.form.Panel',
    constructor: function (config) {
        this.callParent([config]);

        this.options = config.options || {};
        this.scope = config.scope || window;
    },
    /**
     * @cfg {Array} options
     * @see {Ext.fom.CheckBoxGroup}
     */   
    options: null,
    /**
     * @cfg {Object} scope
     */
    scope: null,
    /**
     * @cfg {String} questionText defaults to _('What would you like to do?')
     */
    questionText: null,
    /**
     * @cfg {String} invalidText defaults to _('You need to select an option!')
     */
    invalidText: null,
    /**
     * @cfg {Function} handler
     */
    handler: Ext.emptyFn,
    /**
     * @cfg {Boolean} allowCancel
     */
    allowCancel: false,
    
    windowNamePrefix: 'FileListDialog',
    bodyStyle:'padding:5px',
    layout: 'fit',
    border: false,
    cls: 'tw-editdialog',
    anchor:'100% 100%',
    deferredRender: false,
    buttonAlign: null,
    bufferResize: 500,
    
    initComponent: function() {
        // init buttons and tbar
        this.initButtons();
        
        this.itemsName = this.id + '-fileList';
        
        // get items for this dialog
        this.items = [{
            layout: 'hbox',
            border: false,
            layoutConfig: {
                align:'stretch'
            },
            items: [{
                border: false,
                layout: 'fit',
                flex: 1,
                autoScroll: true,
                items: [{
                    xtype: 'label',
                    border: false,
                    cls: 'ext-mb-text',
                    html: this.text
                }]
            }]
        }];
        
        this.callParent();
    },
    
    /**
     * init buttons
     * use preference settings for order of yes and no buttons
     */
    initButtons: function () {
        this.fbar = ['->'];
        
        var noBtn = {
            xtype: 'button',
            text: _('No'),
            minWidth: 70,
            scope: this,
            handler: this.onCancel,
            iconCls: 'action_cancel'
        };
        
        var yesBtn = {
            xtype: 'button',
            text: _('Yes'),
            minWidth: 70,
            scope: this,
            handler: this.onOk,
            iconCls: 'action_applyChanges'
        }; 
        
        if (Klb.App.Api.registry && Klb.App.Api.registry.get('preferences') && Klb.App.Api.registry.get('preferences').get('dialogButtonsOrderStyle') === 'Windows') {
            this.fbar.push(yesBtn, noBtn);
        }
        else {
            this.fbar.push(noBtn, yesBtn);
        }
    },
    
    onOk: function() {
        this.handler.call(this.scope, 'yes');
        this.window.close();
    },
    
    onCancel: function() {
        this.handler.call(this.scope, 'no');
        this.window.close();
    }
});

Klb.system.widgets.dialog.FileListDialog.openWindow = function (config) {
    var window = Klb.system.WindowFactory.getWindow({
        width: config.width || 400,
        height: config.height || 150,
        closable: false,
        name: Klb.system.widgets.dialog.FileListDialog.windowNamePrefix + Ext.id(),
        contentPanelConstructor: 'Klb.system.widgets.dialog.FileListDialog',
        contentPanelConstructorConfig: config,
        modal: true
    });
    return window;
}
