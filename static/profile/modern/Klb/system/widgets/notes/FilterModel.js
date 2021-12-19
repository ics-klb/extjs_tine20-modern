/*
 * Modern 3.1.0
 * 
 * @license     http://www.gnu.org/licenses/agpl.html AGPL Version 3
 * @author      Cornelius Weiss <c.weiss@metaways.de>
 * @copyright   Copyright (c) 2007-2011 Metaways Infosystems GmbH (http://www.metaways.de)
 */

Ext.ns('Klb.system.widgets', 'Klb.system.widgets.notes');

/**
 * @namespace   Klb.system.widgets.notes
 * @class       Klb.system.widgets.notes.FilterModel
 * @extends     Klb.system.widgets.grid.FilterModel
 * 
 * @todo CARE FOR SHEET DESTRUCTON!
 * @todo CARE FOR OPERATOR CHANGE
 */

Ext.define('Klb.system.widgets.notes.FilterModel', {
    extend: 'Klb.system.widgets.grid.FilterModel',

    /**
     * @cfg {Klb.system.Application} app
     */
    app: null,
    
    valueType: 'note',
    field: 'note',

    /**
     * @private
     */
    initComponent: function() {
        this.label = _('Notes');

        // @TODO whipe some models?
        var notedModels = [];
        Klb.system.data.RecordMgr.eachKey(function(operator, record) {
            if (record.hasField('notes') && Ext.isFunction(record.getFilterModel)) {
                var label = Klb.system.appMgr.get(record.getMeta('appName')).i18n._hidden(record.getMeta('recordsName'));
                
                notedModels.push({operator: operator, label: label});
            }
        }, this);

        this.notedModelStore = this.fieldStore = new Klb.system.data.JsonStore({
            fields: ['operator', 'label'],
            data: notedModels
        });

        this.defaultOperator = this.notedModelStore.getAt(0).get('operator');

        Klb.system.widgets.notes.FilterModel.superclass.initComponent.call(this);
        
    },
    
    onDefineRelatedRecord: function(filter) {
        var operator = filter.formFields.operator.getValue();
        console.log(operator);
        console.log(Klb.system.data.RecordMgr.get(operator));
        
        if (! filter.sheet) {
            filter.sheet = new Klb.system.widgets.grid.FilterToolbar({
                recordClass: Klb.system.data.RecordMgr.get(operator),
                defaultFilter: 'query'
            });
            
            this.ftb.addFilterSheet(filter.sheet);
        }
        
        this.ftb.setActiveSheet(filter.sheet);
        filter.formFields.value.setText(_('Defined by ...'));
    },
    
    /**
     * operator renderer
     * 
     * @param {Ext.data.Model} filter line
     * @param {Ext.Element} element to render to 
     */
    operatorRenderer: function (filter, el) {
        var operator = new Ext.form.field.ComboBox({
            filter: filter,
            width: 80,
            id: 'tw-ftb-frow-operatorcombo-' + filter.id,
            mode: 'local',
            lazyInit: false,
            emptyText: _('select a operator'),
            forceSelection: true,
            typeAhead: true,
            triggerAction: 'all',
            store: this.notedModelStore,
            displayField: 'label',
            valueField: 'operator',
            value: filter.get('operator') ? filter.get('operator') : this.defaultOperator,
            renderTo: el
        });
        operator.on('select', function(combo, newRecord, newKey) {
            if (combo.value != combo.filter.get('operator')) {
                this.onOperatorChange(combo.filter, combo.value);
            }
        }, this);

        return operator;
    },
    
    /**
     * value renderer
     * 
     * @param {Ext.data.Model} filter line
     * @param {Ext.Element} element to render to 
     */
    valueRenderer: function(filter, el) {
        var value = new Ext.button.Button({
            text: _('Define ...'),
            filter: filter,
            width: this.filterValueWidth,
            id: 'tw-ftb-frow-valuefield-' + filter.id,
            renderTo: el,
            value: filter.data.value ? filter.data.value : this.defaultValue,
            handler: this.onDefineRelatedRecord.bind(this, [filter]),
            scope: this,
            getValue: function() {}
        });
        
        // show button
        el.addClass('x-btn-over');
        
        return value;
    }
});

Klb.system.statics.Filters.add('apibase.notes', 'Klb.system.widgets.notes.FilterModel');
