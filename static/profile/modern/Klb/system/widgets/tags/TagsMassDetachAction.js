/*
 * Modern 3.0
 * 
 * @license     http://www.gnu.org/licenses/agpl.html AGPL Version 3
 * @author      Cornelius Weiss <c.weiss@metaways.de>
 * @copyright   Copyright (c) 2007-2008 Metaways Infosystems GmbH (http://www.metaways.de)
 *
 */
 
Ext.ns('KlbDesktop.widgets', 'Klb.system.widgets.tags');

/**
 * @namespace   Klb.system.widgets.tags
 * @class       Klb.system.widgets.tags.TagsMassDetachAction
 * @extends     Ext.Action
 */
Ext.define('Klb.system.widgets.tags.TagsMassDetachAction', {
    extend:  'Ext.Action', 
    /**
     * called when tags got updates
     * 
     * @type Function
     */
    updateHandler: Ext.emptyFn,
    
    /**
     * scope of update handler
     * 
     * @type Object
     */
    updateHandlerScope: null,
    
    /**
     * @cfg {mixed} selectionModel
     * 
     * selection model (required)
     */
    selectionModel: null,
    
    /**
     * @cfg {function} recordClass
     * 
     * record class of records to filter for (required)
     */
    recordClass: null,
    
    formPanel: null,
    
    constructor: function (config) {
        config.text = config.text ? config.text : _('Detach tag(s)');
        config.iconCls = 'action_tag_delete';
        config.handler = this.handleClick.bind(this);
        Ext.apply(this, config);

        this.callParent([config]);
    },

    initFormPanel: function() {
        this.formPanel = new Klb.system.widgets.tags.TagToggleBox({
            selectionModel: this.selectionModel,
            recordClass: this.recordClass,
            callingAction: this,
            mode: 'detach'
        });
        
        this.formPanel.on('cancel', function() {
            this.clearListeners();
            this.win.close();
        });
        
        this.formPanel.on('updated', function() {
            this.callingAction.onSuccess();
        });
        
    },
     
    handleClick: function() {
        this.initFormPanel();
        this.win = KlbDesktop.WindowFactory.getWindow({
            layout: 'fit',
            width: 300,
            height: 150,
            modal: true,       
            title: _('Select Tag(s) to detach'),
            items: this.formPanel

        });
        
        this.formPanel.win = this.win;
        
    },
 
    onSuccess: function() {
        this.updateHandler.call(this.updateHandlerScope || this);
        this.win.close();
    }
});
