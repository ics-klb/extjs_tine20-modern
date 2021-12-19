/*
 * Modern 3.0
 * 
 * @license     http://www.gnu.org/licenses/agpl.html AGPL Version 3
 * @author      Philipp Schuele <p.schuele@metaways.de>
 * @copyright   Copyright (c) 2010 Metaways Infosystems GmbH (http://www.metaways.de)
 */
Ext.ns('Klb.system.widgets.grid');

/**
 * Picker GridPanel
 * 
 * @namespace   Klb.system.widgets.grid
 * @class       Klb.system.widgets.grid.PickerGridPanel
 * @extends     Ext.grid.GridPanel
 * 
 * <p>Picker GridPanel</p>
 * <p><pre>
 * </pre></p>
 * 
 * @license     http://www.gnu.org/licenses/agpl.html AGPL Version 3
 * @author      Philipp Schuele <p.schuele@metaways.de>
 * @copyright   Copyright (c) 2010 Metaways Infosystems GmbH (http://www.metaways.de)
 * 
 * @param       {Object} config
 * @constructor
 * Create a new Klb.system.widgets.grid.PickerGridPanel
 */
Ext.define('Klb.system.widgets.grid.PickerGridPanel', {
    extend: 'Klb.abstract.GridBase',
    xtype: 'wdgt.pickergrid',
    /**
     * @cfg {bool}
     * enable bottom toolbar
     */
    enableBbar: true,

    /**
     * @cfg {bool}
     * enable top toolbar (with search combo)
     */
    enableTbar: true,
    
    /**
     * store to hold records
     * 
     * @type Ext.data.Store
     * @property store
     */
    store: null,
    
    /**
     * record class
     * @cfg {Klb.system.data.Record} recordClass
     */
    recordClass: null,
    
    /**
     * defaults for new records of this.recordClass
     * @cfg {Object} recordClass
     */
    recordDefaults: null,
    
    /**
     * record class
     * @cfg {Klb.system.data.Record} recordClass
     */
    searchRecordClass: null,
    
    /**
     * search combo class
     * @cfg {} searchComboClass
     */
    searchComboClass: null,
    
    /**
     * search combo config
     * @cfg {} searchComboConfig
     */
    searchComboConfig: null,
    
    /**
     * is the row selected after adding?
     * @type Boolean
     */
    selectRowAfterAdd: true,
    
    /**
     * is the row highlighted after adding?
     * @type Boolean
     */
    highlightRowAfterAdd: false,
    
    /**
     * @type Ext.Menu
     * @property contextMenu
     */
    contextMenu: null,
    
    /**
     * @cfg {Array} contextMenuItems
     * additional items for contextMenu
     */
    contextMenuItems: null,
    
    /**
     * @cfg {Array} Array of column's config objects where the config options are in
     */
    configColumns: null,
    
    /**
     * @private
     */
    initComponent: function() {
        this.contextMenuItems = (this.contextMenuItems !== null) ? this.contextMenuItems : [];
        this.configColumns = (this.configColumns !== null) ? this.configColumns : [];
        this.searchComboConfig = this.searchComboConfig || {};
        
        this.labelField = this.labelField ? this.labelField : (this.recordClass && this.recordClass.getMeta ? this.recordClass.getMeta('titleProperty') : null);
        this.autoExpandColumn = this.autoExpandColumn? this.autoExpandColumn : this.labelField;

        this.initStore();
        this.initActionsAndToolbars();
        this.initGrid();

        this.callParent();
    },

    /**
     * init store
     * @private
     */
    initStore: function() {
        
        if (!this.store) {
            this.store = Ext.create('Klb.system.data.JsonStore', {
                baseParams: {
                    // method: this.recordClass.getMeta('appName') + '.' + this.recordClass.getMeta('modelName');
                },
                fields: this.recordClass
            });
        }
        
        // focus+select new record
        this.store.on('add', function(store, records, index) {
            (function() {
                if (this.rendered) {
                    if (this.selectRowAfterAdd) {
                        this.getView().focusRow(index);
                        this.getSelectionModel().selectRow(index);
                    } else if (this.highlightRowAfterAdd && records.length === 1){
                        // some eyecandy
                        var row = this.getView().getRow(index);
                        Ext.fly(row).highlight();
                    }
                }
            }).defer(300, this);
        }, this);
    },

    /**
     * init actions and toolbars
     */
    initActionsAndToolbars: function() {
        
        this.actionRemove = new Ext.Action({
            text: _('Remove record'),
            disabled: true,
            scope: this,
            handler: this.onRemove,
            iconCls: 'action_deleteContact'
        });
        
        var contextItems = [this.actionRemove];
        this.contextMenu = new Ext.menu.Menu({
            items: contextItems.concat(this.contextMenuItems)
        });
        
        // removes temporarly added items
        this.contextMenu.on('hide', function() {
            if(this.contextMenu.hasOwnProperty('tempItems') && this.contextMenu.tempItems.length) {
                Ext.each(this.contextMenu.tempItems, function(item) {
                    this.contextMenu.remove(item.itemId);
                }, this);
            }
            this.contextMenu.tempItems = [];
        }, this);
        
        if (this.enableBbar) {
            this.bbar = new Ext.Toolbar({
                items: [
                    this.actionRemove
                ].concat(this.contextMenuItems)
            });
        }

        if (this.enableTbar) {
            this.initTbar();
        }
    },
    
    /**
     * init top toolbar
     */
    initTbar: function() {
        this.tbar = new Ext.Toolbar({
            items: [
                this.getSearchCombo()
            ],
            listeners: {
                scope: this,
                resize: this.onTbarResize
            }
        });
    },
    
    onTbarResize: function(tbar) {
        if (tbar.items.getCount() == 1) {
            var combo = tbar.items.get(0),
                gridWidth = this.getGridEl().getWidth(),
                offsetWidth = combo.getEl() ? combo.getEl().getLeft() - this.getGridEl().getLeft() : 0;
            
            if (tbar.items.getCount() == 1) {
                tbar.items.get(0).setWidth(gridWidth - offsetWidth);
            }
        }
    },
    
    /**
     * init grid (column/selection model, ctx menu, ...)
     */
    initGrid: function() {
        this.cm = this.getColumnModel();
        
        this.selModel = new Ext.selection.RowModel({multiSelect:true});
        
        // remove non-plugin config columns
        var nonPluginColumns = [];
        for (var i=0; i < this.configColumns.length; i++) {
            if (!this.configColumns[i].init || typeof(this.configColumns[i].init) != 'function') {
                nonPluginColumns.push(this.configColumns[i]);
            }
        }
        for (var i=0; i < nonPluginColumns.length; i++) {
            this.configColumns.remove(nonPluginColumns[i]);
        }
        this.plugins = this.configColumns;
    
        // on selectionchange handler
        this.selModel.on('selectionchange', function(sm) {
            var rowCount = sm.getCount();
            this.actionRemove.setDisabled(rowCount == 0);
        }, this);
        
        // on rowcontextmenu handler
        this.on('rowcontextmenu', this.onRowContextMenu.bind(this), this);
    },
    
    /**
     * take columns property if defined, otherwise create columns from record class propery
     * @return {}
     */
    getColumnModel: function() {
        if (! this.columns) {
            var labelColumn = {id: this.labelField, header:  Ext.String.format(_('Selected  {0}'), this.recordClass.getMeta('recordsName')), dataIndex: this.labelField};
            if (this.labelRenderer != Ext.emptyFn) {
                labelColumn.renderer = this.labelRenderer;
            }
            this.columns = [ labelColumn ];
        }
        
        return new Ext.grid.ColumnManager({
            defaults: {
                sortable: false
            },
            columns: this.columns
        });
    },
    
    /**
     * that's the context menu handler
     * @param {} grid
     * @param {} row
     * @param {} e
     */
    onRowContextMenu: function(grid, row, e) {
        e.stopEvent();
        
        this.fireEvent('beforecontextmenu', grid, row, e);
        
        var selModel = grid.getSelectionModel();
        if(!selModel.isSelected(row)) {
            selModel.selectRow(row);
        }
        
        this.contextMenu.showAt(e.getXY());
    },
    
    /**
     * @return {Klb.system.widgets.form.RecordPickerComboBox|this.searchComboClass}
     */
    getSearchCombo: function() {
        var searchComboClass = (this.searchComboClass !== null) ? this.searchComboClass : Klb.system.widgets.form.RecordPickerComboBox;
        
        // added reference to searchcombo
        this.searchCombo = new searchComboClass(Ext.apply({
            blurOnSelect: true,
            recordClass: (this.searchRecordClass !== null) ? this.searchRecordClass : this.recordClass,
            emptyText: _('Search for records ...'),
            listeners: {
                scope: this,
                'select': this.onAddRecordFromCombo
            }
        }, this.searchComboConfig));
        
        return this.searchCombo;
    },
    
    /**
     * Is called when a record gets selected in the picker combo
     * 
     * @param {Ext.form.field.ComboBox} picker
     * @param {Record} recordToAdd
     */
    onAddRecordFromCombo: function(picker, recordToAdd) {
        // sometimes there are no record data given
        if (! recordToAdd) {
           return;
        }
        
        var record = new this.recordClass(Ext.applyIf(recordToAdd.data, this.recordDefaults || {}), recordToAdd.id);
        
        // check if already in
        if (! this.store.getById(record.id)) {
            this.store.add([record]);
        }
        
        picker.reset();
    },
    
    /**
     * remove handler
     * 
     * @param {} button
     * @param {} event
     */
    onRemove: function(button, event) {
        var selectedRows = this.getSelectionModel().getSelection();
        for (var i = 0; i < selectedRows.length; ++i) {
            this.store.remove(selectedRows[i]);
        }
    },
    
    /**
     * key down handler
     * @private
     */
    onKeyDown: function(e){
        if (e.ctrlKey) {
            switch (e.getKey()) {
                case e.A:
                    // select all records
                    this.getSelectionModel().selectAll(true);
                    e.preventDefault();
                    break;
            }
        } else {
            switch (e.getKey()) {
                case e.DELETE:
                    // delete selected record(s)
                    this.onRemove();
                    break;
            }
        }
    }
});

//Ext.reg('wdgt.pickergrid', Klb.system.widgets.grid.PickerGridPanel);
