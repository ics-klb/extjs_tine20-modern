/*
 * Modern 3.0
 * 
 * @license     http://www.gnu.org/licenses/agpl.html AGPL Version 3
 * @author      Philipp Schüle <p.schuele@metaways.de>
 * @copyright   Copyright (c) 2010-2012 Metaways Infosystems GmbH (http://www.metaways.de)
 * 
 * TODO         container filter should extend this
 */
Ext.ns('Klb.system.widgets.grid');

/**
 * @namespace   Klb.system.widgets.grid
 * @class       Klb.system.widgets.grid.PickerFilter
 * @extends     Klb.system.widgets.grid.FilterModel
 */
Ext.define('Klb.system.widgets.grid.PickerFilter', {
    extend: 'Klb.system.widgets.grid.FilterModel',
    /**
     * @property Klb.system.Application app
     */
    app: null,
    
    /**
     * @cfg field
     * @type String
     */
    field: '',

    /**
     * @cfg defaultOperator
     * @type String
     */
    defaultOperator: 'in',

    /**
     * @cfg defaultValue
     * @type String
     */
    defaultValue: '',

    /**
     * @cfg label
     * @type String
     */
    label: '',

    /**
     * @cfg filterValueWidth
     * @type Integer
     */
    filterValueWidth: 250,

    /**
     * @cfg multiselectField
     */
    multiselectFieldConfig: null,
    
    /**
     * record picker
     * 
     * @type Klb.system.widgets.form.RecordPickerComboBox
     */
    picker: null,
    
    /**
     * record class
     * 
     * @type Klb.system.data.Record
     */
    recordClass: null,
    
    /**
     * @private
     */
    initComponent: function() {
        this.operators = this.operators || ['equals', 'not', 'in', 'notin'];
        
        // TODO invent a picker registry
        if (this.picker === null) {
            this.picker = (this.recordClass == Klb.Addressbook.Model.Contact) ?  Klb.Addressbook.SearchCombo : Klb.system.widgets.form.RecordPickerComboBox;
        }
        this.multiselectFieldConfig = this.multiselectFieldConfig || {
            selectionWidget: new this.picker ({
                app: this.app,
                recordClass: this.recordClass,
                blurOnSelect: true
            }),
            recordClass: this.recordClass,
            isSelectionVisible: function() {
                return this.selectionWidget.isExpanded();
            }
        };
        
        Klb.system.widgets.grid.PickerFilter.superclass.initComponent.call(this);
    },
    
    /**
     * called on operator change of a filter row
     * @private
     * 
     * TODO keep value widget if old operator / new operator use the same widget?
     */
    onOperatorChange: function(filter, newOperator, keepValue) {
        var oldOperator = filter.formFields.operator.getValue(),
            oldValues = [].concat(filter.formFields.value.getValue()),
            oldValuesStore = filter.formFields.value.store,
            el = Ext.select('tr[id=' + this.ftb.frowIdPrefix + filter.id + '] td[class^=tw-ftb-frow-value]', this.ftb.el).first();
        
        // make sure we have the old value record datas
        Ext.each(oldValues, function(value, idx) {
            try {
                if (Ext.isPrimitive(value)) {
                    oldValues[idx] = oldValuesStore.getById(value).data
                }
            } catch (e) {
                Klb.Logger.warn('Klb.system.widgets.grid.PickerFilter::onOperatorChange could not get record data');
            }
        }, this);
        
        Klb.system.widgets.grid.PickerFilter.superclass.onOperatorChange.apply(this, arguments);
        
        // NOTE: removeMode got introduced on ext3.1 but is not documented
        //       'childonly' is no ext mode, we just need something other than 'container'
        if (filter.formFields.value && Ext.isFunction(filter.formFields.value.destroy)) {
            filter.formFields.value.removeMode = 'childsonly';
            filter.formFields.value.destroy();
            delete filter.formFields.value;
        }
        
        filter.formFields.value = this.valueRenderer(filter, el);
        
        // retain value(s) on operator change (single -> multi, multi -> multi)
        if (['in', 'notin'].indexOf(newOperator) > -1) {
            filter.formFields.value.setValue(oldValues);
        }
    },
    
    /**
     * value renderer
     * 
     * @param {Ext.data.Model} filter line
     * @param {Ext.Element} element to render to 
     */
    valueRenderer: function(filter, el) {
        if (filter.formFields.value) {
            return filter.formFields.value;
        }

        var operator = filter.get('operator') ? filter.get('operator') : this.defaultOperator,
            value;
            
        Klb.Logger.debug('Klb.system.widgets.grid.PickerFilter::valueRenderer() - Creating new value field for ' + operator + ' operator.')

        switch(operator) {
            case 'equals':
            case 'not':
                value = this.getPicker(filter, el);
                break;
            default:
                value = this.getPickerGridLayerCombo(filter, el);
        }

        value.on('specialkey', function(field, e){
             if (e.getKey() == e.ENTER){
                 this.onFiltertrigger();
             }
        }, this);
        value.on('select', this.onFiltertrigger, this);
        
        return value;
    },
    
    /**
     * get record picker
     * 
     * @param {Ext.data.Model} filter line
     * @param {Ext.Element} element to render to 
     * 
     */
    getPicker: function(filter, el) {
        Klb.Logger.debug('Klb.system.widgets.grid.PickerFilter::getPicker()');
        
        var result = new this.picker ({
            app: this.app,
            recordClass: this.recordClass,
            filter: filter,
            blurOnSelect: true,
            width: this.filterValueWidth,
//            listWidth: 500,
//            listAlign: 'tr-br',
            id: 'tw-ftb-frow-valuefield-' + filter.id,
            value: filter.data.value ? filter.data.value : this.defaultValue,
            renderTo: el
        });
        
        return result;
    },

    /**
     * get picker grid layer combo
     * 
     * @param {Ext.data.Model} filter line
     * @param {Ext.Element} element to render to 
     * 
     */
    getPickerGridLayerCombo: function(filter, el) {
        return new Klb.system.widgets.grid.PickerFilterValueField(Ext.apply({
            app: this.app,
            filter: filter,
            width: this.filterValueWidth,
            id: 'tw-ftb-frow-valuefield-' + filter.id,
            value: filter.data.value ? filter.data.value : this.defaultValue,
            renderTo: el
        }, this.multiselectFieldConfig));
    }
});

/**
 * @namespace   Klb.system.widgets.grid
 * @class       Klb.system.widgets.grid.PickerFilterValueField
 * @extends     Ext.ux.form.LayerCombo
 */
Klb.system.widgets.grid.PickerFilterValueField = Ext.extend(Ext.ux.form.LayerCombo, {
    layerHeight: 200,
    hideButtons: false,
    formConfig: {
        labelAlign: 'left',
        labelWidth: 30
    },
    labelField: 'name',
    recordClass: null,
    valueStore: null,

    selectionWidget: null,
    labelRenderer: Ext.emptyFn,
    
    /**
     * init
     */
    initComponent: function() {
        this.on('beforecollapse', this.onBeforeCollapse, this);
        if (! this.store) {
            this.store = new Ext.data.SimpleStore({
                fields: this.recordClass
            });
        }
        
        Klb.system.widgets.grid.PickerFilterValueField.superclass.initComponent.call(this);
    },
    
    /**
     * get form values
     * 
     * @return {Array}
     */
    getFormValue: function() {
        var values = [];

        this.store.each(function(record) {
            values.push(record.data);
        }, this);
        
        return values;
    },
    
    /**
     * get items
     * 
     * @return {Array}
     */
    getItems: function() {
        var me = this,
            items = [];

        this.initSelectionWidget();
        
        this.pickerGridPanel = new Klb.system.widgets.grid.PickerGridPanel({
            height: this.layerHeight || 'auto',
            recordClass: this.recordClass,
            store: this.store,
            autoExpandColumn: this.labelField,
            getColumnModel: this.getColumnModel.bind(this),
            initActionsAndToolbars: function() {
                Klb.system.widgets.grid.PickerGridPanel.prototype.initActionsAndToolbars.call(this);
                this.tbar = new Ext.Toolbar({
                    layout: 'fit',
                    items: [ me.selectionWidget ]
                });
            }
        });
        
        items.push(this.pickerGridPanel);
        
        return items;
    },
    
    /**
     * init selection widget
     */
    initSelectionWidget: function() {
        this.selectionWidget.on('select', this.onRecordSelect, this);
    },
    
    /**
     * @return Ext.grid.ColumnManager
     */
    getColumnModel: function() {
        var labelColumn = {id: this.labelField, header:  Ext.String.format(_('Selected  {0}'), this.recordClass.getMeta('recordsName')), dataIndex: this.labelField};
        if (this.labelRenderer != Ext.emptyFn) {
            labelColumn.renderer = this.labelRenderer;
        }
        
        return new Ext.grid.ColumnManager({
            defaults: {
                sortable: false
            },
            columns:  [ labelColumn ]
        });
    },
    
    /**
     * record select
     * 
     * @param {String} field
     * @param {Object} recordData
     */
    onRecordSelect: function(field, recordData) {
        this.addRecord(recordData);
        this.selectionWidget.suspendEvents();
        this.selectionWidget.clearValue();
        this.selectionWidget.resumeEvents();
    },
    
    /**
     * adds record from selection widget to store
     * 
     * @param {Object} recordData
     */
    addRecord: function(recordData) {
Klb.Logger.debug('Klb.system.widgets.grid.PickerFilterValueField::addRecord()');
Klb.Logger.debug(recordData);
        
        var data = (recordData.data) ? recordData.data : recordData.attributes ? recordData.attributes : recordData;
        
        var existingRecord = this.store.getById(recordData.id);
        if (! existingRecord) {
            this.store.add(new this.recordClass(data));
            
        } else {
            var idx = this.store.indexOf(existingRecord);
            var row = this.pickerGridPanel.getView().getRow(idx);
            Ext.fly(row).highlight();
        }
        
        if (this.selectionWidget.selectPanel) {
            this.selectionWidget.selectPanel.close();
        }
    },
    
    /**
     * @param {String} value
     * @return {Ext.form.Field} this
     */
    setValue: function(value) {
        value = Ext.isArray(value) ? value : [value];
        
Klb.Logger.debug('Klb.system.widgets.grid.PickerFilterValueField::setValue()');
Klb.Logger.debug(value);
        
        var recordText = [];
        this.currentValue = [];
        
        this.store.removeAll();
        var record, id, text;
        for (var i=0; i < value.length; i++) {
            text = this.getRecordText(value[i]);
            if (text && text !== '') {
                recordText.push(text);
            }
        }
        
        this.setRawValue(recordText.join(', '));
        
        return this;
    },
    
    /**
     * get text from record defined by value (id or something else)
     * 
     * @param {String|Object} value
     * @return {String}
     */
    getRecordText: function(value) {
        var id = (Ext.isString(value)) ? value : value.id,
            record = (this.valueStore) ? this.valueStore.getById(id) : ((! Ext.isString(value)) ? new this.recordClass(value, id) : null);
            
Klb.Logger.debug('Klb.system.widgets.grid.PickerFilterValueField::getRecordText()');
Klb.Logger.debug(record);
            
        if (! record) {
            return '';
        }
        
        // always copy/clone record because it can't exist in 2 different stores
        this.store.add(record.copy());
        this.currentValue.push(record.id);
        
        var text = record.get(this.labelField);
        text = (this.labelRenderer != Ext.emptyFn) ? this.labelRenderer(text) : text;
        
        return text;
    },
    
    /**
     * cancel collapse if ctx menu or record selection is shown
     * 
     * @return Boolean
     */
    onBeforeCollapse: function() {
        var result = true;
        
        if (this.pickerGridPanel) {
            var contextMenuVisible = this.pickerGridPanel.contextMenu && ! this.pickerGridPanel.contextMenu.hidden,
                selectionVisible = this.isSelectionVisible();
            result = ! (contextMenuVisible || selectionVisible);
        }
        
        Klb.Logger.debug('Klb.system.widgets.grid.PickerFilterValueField::onBeforeCollapse() - collapse: ' + result);
        
        return result;
    },
    
    /**
     * is selection visible ?
     * - overwrite this when extending to make sure that the selection widget is no longer visible on collapse
     * 
     * @return {Boolean}
     */
    isSelectionVisible: function() {
        return false;
    }
});

Klb.system.statics.Filters.add('apibase.pickerfilter', 'Klb.system.widgets.grid.PickerFilter');

