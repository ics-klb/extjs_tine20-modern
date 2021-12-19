/*
 * Modern 3.1.0
 * 
 * @license     http://www.gnu.org/licenses/agpl.html AGPL Version 3
 * @author      Cornelius Weiss <c.weiss@metaways.de>
 * @copyright   Copyright (c) 2007-2010 Metaways Infosystems GmbH (http://www.metaways.de)
 *
 */
Ext.ns('Klb.system.widgets', 'Klb.system.widgets.grid');

/**
 * grid details panel
 * 
 * @namespace   Klb.system.widgets.grid
 * @class       Klb.system.widgets.grid.DetailsPanel
 * @extends     Ext.panel.Panel
 * 
 * <p>Grid Details Panel</p>
 * <p><pre>
 * </pre></p>
 * 
 * @license     http://www.gnu.org/licenses/agpl.html AGPL Version 3
 * @author      Cornelius Weiss <c.weiss@metaways.de>
 * @copyright   Copyright (c) 2007-2009 Metaways Infosystems GmbH (http://www.metaways.de)
 * 
 * @param       {Object} config
 * @constructor
 * Create a new Klb.system.widgets.grid.DetailsPanel
 */

Ext.define('Klb.system.widgets.grid.DetailsPanel', {
    extend: 'Ext.panel.Panel',
    /**
     * @cfg {Number} defaultHeight
     * default Heights
     */
    defaultHeight: 125,
    
    /**
     * @property grid
     * @type Klb.system.widgets.grid.GridPanel
     */
    grid: null,

    /**
     * @property record
     * @type Klb.system.data.Record
     */
    record: null,
    
    /**
     * @property defaultInfosPanel holds panel for default information
     * @type Ext.panel.Panel
     */
    defaultInfosPanel: null,
    
    /**
     * @property singleRecordPanel holds panel for single record details
     * @type Ext.panel.Panel
     */
    singleRecordPanel: null,
    
    /**
     * @property multiRecordsPanel holds panel for multi selection aggregates/information
     * @type Ext.panel.Panel
     */
    multiRecordsPanel: null,
            
    /**
     * @private
     */
    border: false,
    autoScroll: true,
    layout: 'card',
    activeItem: 0,
    
    /**
     * get panel for default information
     * 
     * @return {Ext.panel.Panel}
     */
    getDefaultInfosPanel: function() {
        if (! this.defaultInfosPanel) {
            this.defaultInfosPanel = new Ext.panel.Panel(this.defaults);
        }
        return this.defaultInfosPanel;
    },
    
    /**
     * get panel for single record details
     * 
     * @return {Ext.panel.Panel}
     */
    getSingleRecordPanel: function() {
        if (! this.singleRecordPanel) {
            this.singleRecordPanel = new Ext.panel.Panel(this.defaults);
        }
        return this.singleRecordPanel;
    },
    
    /**
     * get panel for multi selection aggregates/information
     * 
     * @return {Ext.panel.Panel}
     */
    getMultiRecordsPanel: function() {
        if (! this.multiRecordsPanel) {
            this.multiRecordsPanel = new Ext.panel.Panel(this.defaults);
        }
        return this.multiRecordsPanel;
    },
        
    /**
     * inits this details panel
     */
    initComponent: function() {
        
        this.items = [
            this.getDefaultInfosPanel(),
            this.getSingleRecordPanel(),
            this.getMultiRecordsPanel()
        ];
        
        // NOTE: this defaults overwrites configs in already instanciated configs -> see docu
        Ext.each(this.items, function(item) {
            Ext.applyIf(item, {
                border: false,
                autoScroll: true,
                layout: 'fit'
            });
        }, this);
        
        Klb.system.widgets.grid.DetailsPanel.superclass.initComponent.apply(this, arguments);
    },
    
    /**
     * update template
     * 
     * @param {Klb.system.data.Record} record
     * @param {Mixed} body
     */
    updateDetails: function(record, body) {
        this.tpl.overwrite(body, record.data);
    },
    
    /**
     * show default template
     * 
     * @param {Mixed} body
     */
    showDefault: function(body) {
        if (this.defaultTpl) {
            this.defaultTpl.overwrite(body);
        }
    },
    
    /**
     * show template for multiple rows
     * 
     * @param {Ext.grid.RowSelectionModel} sm
     * @param {Mixed} body
     */
    showMulti: function(sm, body) {
        if (this.multiTpl) {
            this.multiTpl.overwrite(body);
        }
    },
    
    /**
     * bind grid to details panel
     * 
     * @param {Klb.system.widgets.grid.GridPanel} grid
     */
    doBind: function(grid) {
        this.grid = grid;
        
        /*
        grid.getSelectionModel().on('selectionchange', function(sm) {
            if (this.updateOnSelectionChange) {
                this.onDetailsUpdate(sm);
            }
        }, this);
        */
        
        grid.store.on('load', function(store) {
            this.onDetailsUpdate(grid.getSelectionModel());
        }, this);
    },
    
    /**
     * update details panel
     * 
     * @param {Ext.grid.RowSelectionModel} sm
     */
    onDetailsUpdate: function(sm) {
        var count = sm.getCount();
        if (count === 0 || sm.isFilterSelect) {
            if(this.layout && Ext.isFunction(this.layout.setActiveItem)) {
                this.layout.setActiveItem(this.getDefaultInfosPanel());
            }
            this.showDefault(this.getDefaultInfosPanel().body);
            this.record = null;
        } else if (count === 1) {
            this.layout.setActiveItem(this.getSingleRecordPanel());
            this.record = sm.getSelected();
            this.updateDetails(this.record, this.getSingleRecordPanel().body);
        } else if (count > 1) {
            this.layout.setActiveItem(this.getMultiRecordsPanel());
            this.record = sm.getSelected();
            this.showMulti(sm, this.getMultiRecordsPanel().body);
        }
    },
    
    /**
     * get load mask
     * 
     * @return {Ext.LoadMask}
     */
    getLoadMask: function() {
        if (! this.loadMask) {
            this.loadMask = new Ext.LoadMask(this.el);
        }
        
        return this.loadMask;
    },
    
    /**
     * Wraps the items with default layout
     * 
     * @param {Array} items
     * @return {Object}
     */
    wrapPanel: function(items, labelWidth) {
        return {
            layout: 'fit',
            border: false,
            items: [{
                layout: 'vbox',
                border: false,
                layoutConfig: {
                    align:'stretch'
                },
                items: [{
                    layout: 'hbox',
                    flex: 1,
                    border: false,
                    layoutConfig: {
                        padding:'5',
                        align:'stretch'
                    },
                    defaults:{
                        margins:'0 5 0 0'
                    },
                    items: [{
                        flex: 2,
                        layout: 'ux.display',
                        labelWidth: labelWidth,
                        padding: 10,
                        layoutConfig: {
                            background: 'solid',
                            margins: '0 5 0 0'
                        },
                        items: items
                    }]
                }]
            }]
        }
    }
});
