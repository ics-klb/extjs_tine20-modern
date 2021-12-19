/* 
 * Modern 3.0
 * 
 * @license     http://www.gnu.org/licenses/agpl.html AGPL Version 3
 * @author      Cornelius Weiss <c.weiss@metaways.de>
 * @copyright   Copyright (c) 2007-2008 Metaways Infosystems GmbH (http://www.metaways.de)
 */

Ext.ns('Klb.system.widgets.form');

/**
 * @namespace   Klb.system.widgets.form
 * @author      Cornelius Weiss <c.weiss@metaways.de>
 * @class       Klb.system.widgets.form.RecordPickerComboBox
 * @extends     Ext.form.field.ComboBox
 * 
 * <p>Abstract base class for recordPickers like account/group pickers </p>
 * 
 * Usage:
 * <pre><code>
var resourcePicker = new Klb.system.widgets.form.RecordPickerComboBox({
    recordClass: Klb.Calendar.Model.Resource
});
   </code></pre>
 */
Ext.define('Klb.system.widgets.form.RecordPickerComboBox', {
    extend: 'Ext.ux.form.ClearableComboBox',
    xtype: 'apirecordpickercombobox',
    /**
     * @cfg {bool} blurOnSelect
     * blur this combo when record got selected, useful to be used in editor grids (defaults to false)
     */
    blurOnSelect: false,
    
    /**
     * @cfg {Klb.system.data.Record} recordClass
     * model of record to be picked (required) 
     */
    recordClass: null,
    
    /**
     * @cfg {Klb.system.data.RecordProxy} recordProxy
     * record backend 
     */
    recordProxy: null,
    
    /**
     * @property app
     * @type Klb.system.Application
     */
    app: null,
    
    /**
     * @type Klb.system.data.Record selectedRecord
     * @property selectedRecord 
     * The last record which was selected
     */
    selectedRecord: null,
    
    /**
     * sort by field
     * 
     * @type String 
     */
    sortBy: null,
    
    /**
     * @type string
     * @property lastStoreTransactionId
     */
    lastStoreTransactionId: null,
    
    /**
     * if set to false, it is not possible to add the same record handled in this.editDialog
     * this.editDialog must also be set
     * 
     * @cfg {Boolean} allowLinkingItself
     */
    allowLinkingItself: null,
    
    /**
     * the editDialog, the form is nested in. Just needed if this.allowLinkingItself is set to false
     * 
     * @type Klb.system.widgets.dialog.EditDialog editDialog
     */
    editDialog: null,
    
    /**
     * always use additional filter
     * 
     * @type {Array}
     */
    additionalFilters: null,
    
    triggerAction: 'all',
    pageSize: 10,
    minChars: 3,
    forceSelection: true,
    
    initComponent: function () {
        this.app = Klb.system.appMgr.get(this.recordClass.getMeta('appName'));
        this.displayField = this.recordClass.getMeta('titleProperty');
        this.valueField = this.recordClass.getMeta('idProperty');
        this.disableClearer = ! this.allowBlank;
        
        this.loadingText = _('Searching...');
        
        if (this.mode != 'local') {
            this.store = new Klb.system.data.RecordStore(Ext.copyTo({
                baseParams: {
                },
                readOnly: true,
                proxy: this.recordProxy || undefined
            }, this, 'totalProperty,root,recordClass'));
        }
        
        this.on('beforequery', this.onBeforeQuery, this);
        this.store.on('beforeloadrecords', this.onStoreBeforeLoadRecords, this);
        this.initTemplate();
        
        this.callParent();
    },
    
    /**
     * respect record.getTitle method
     */
    initTemplate: function() {
        if (! this.tpl) {
            this.tpl = new Ext.XTemplate('<tpl for="."><div class="x-combo-list-item">{[this.getTitle(values.' + this.recordClass.getMeta('idProperty') + ')]}</div></tpl>', {
                getTitle: (function(id) {
                    var record = this.getStore().getById(id),
                        title = record ? record.getTitle() : '&nbsp';
                    
                    return Ext.util.Format.htmlEncode(title);
                }).bind(this)
            });
        }
    },
    
    
    /**
     * prepare paging and sort
     * 
     * @param {Ext.data.Store} store
     * @param {Object} options
     */
    onBeforeLoad: function (store, options) {
        Klb.system.widgets.form.RecordPickerComboBox.superclass.onBeforeLoad.call(this, store, options);
        
        this.lastStoreTransactionId = options.transactionId = Ext.id();
        
        var paging = {
            // TODO do we need to set start & limit here?
            start: options.params.start,
            limit: options.params.limit,
            // if sort is not set, use display field as default sort
            sort: (this.sortBy) ? this.sortBy : this.displayField,
            dir: 'ASC'
        };
        
        Ext.applyIf(options.params, paging);
        
        // TODO is this needed?
        options.params.paging = paging;
    },
    
    /**
     * onStoreBeforeLoadRecords
     * 
     * @param {Object} o
     * @param {Object} options
     * @param {Boolean} success
     * @param {Ext.data.Store} store
     */
    onStoreBeforeLoadRecords: function(o, options, success, store) {
        if (! this.lastStoreTransactionId || options.transactionId && this.lastStoreTransactionId !== options.transactionId) {
            Klb.Logger.debug('Klb.system.widgets.form.RecordPickerComboBox::onStoreBeforeLoadRecords cancelling old transaction request.');
            return false;
        }
    },
    
    /**
     * use beforequery to set query filter
     * 
     * @param {Object} qevent
     */
    onBeforeQuery: function (qevent) {
        var filter = [
            {field: 'query', operator: 'contains', value: qevent.query }
        ];
        if (this.additionalFilters !== null && this.additionalFilters.length > 0) {
            for (var i = 0; i < this.additionalFilters.length; i++) {
                filter.push(this.additionalFilters[i]);
            }
        }
        this.store.baseParams.filter = filter;
    },
    
    /**
     * relay contextmenu events
     * 
     * @param {Ext.Container} ct
     * @param {Number} position
     * @private
     */
    onRender : function(ct, position){
        Klb.system.widgets.form.RecordPickerComboBox.superclass.onRender.call(this, ct, position);
        
        var c = this.getEl();
 
        this.mon(c, {
            scope: this,
            contextmenu: Ext.emptyFn
        });
 
        this.relayEvents(c, ['contextmenu']);
    },
    
    /**
     * store a copy of the selected record
     * 
     * @param {Klb.system.data.Record} record
     * @param {Number} index
     */
    onSelect: function (record, index) {
        this.selectedRecord = record;
        return Klb.system.widgets.form.RecordPickerComboBox.superclass.onSelect.call(this, record, index);
    },
    
    /**
     * on keypressed("enter") event to add record
     * 
     * @param {Klb.Addressbook.SearchCombo} combo
     * @param {Event} event
     */ 
    onSpecialkey: function (combo, event) {
        if (event.getKey() === event.ENTER) {
            var id = combo.getValue();
            var record = this.store.getById(id);
            this.onSelect(record);
        }
    },
    
    /**
     * set value and prefill store if needed
     * 
     * @param {mixed} value
     */
    setValue: function (value) {
        if (value) {
            
            // value is a record
            if (typeof(value.get) === 'function') {
                if (this.store.indexOf(value) < 0) {
                    this.store.addSorted(value);
                }
                value = value.get(this.valueField);
            }
            
            // value is a js object
            else if (Ext.isObject(value)) {
                var record = this.recordProxy ? this.recordProxy.recordReader({responseText: Ext.encode(value)}) : new this.recordClass(value)
                if (! this.store.getById(value.id)) {
                    this.store.addSorted(record);
                }
                value = value[this.valueField] || '';
            }
            
            // value is the current id
            else if (Ext.isPrimitive(value) && value == this.getValue()) {
                return this.setValue(this.selectedRecord);
            }
        }
        
        var r = this.findRecord(this.valueField, value),
            text = value;
        
        if (r){
            text = r.getTitle();
            this.selectedRecord = r;
            if (this.allowLinkingItself === false) {
                // check if editDialog exists
                if (this.editDialog && this.editDialog.record && r.getId() == this.editDialog.record.getId()) {
                    Ext.MessageBox.show({
                        title: _('Failure'),
                        msg: _('You tried to link a record with itself. This is not allowed!'),
                        buttons: Ext.MessageBox.OK,
                        icon: Ext.MessageBox.ERROR  
                    });
                    return;
                }
            }
            
        } else if (Ext.isDefined(this.valueNotFoundText)){
            text = this.valueNotFoundText;
        }
        this.lastSelectionText = text;
        if (this.hiddenField){
            this.hiddenField.value = Ext.value(value, '');
        }

        Klb.system.widgets.form.RecordPickerComboBox.superclass.setValue.call(this, text);
        this.value = value;
        return this;
    }
});
