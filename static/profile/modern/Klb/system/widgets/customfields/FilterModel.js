/*
 * Modern 3.1.0
 * 
 * @license     http://www.gnu.org/licenses/agpl.html AGPL Version 3
 * @author      Cornelius Weiss <c.weiss@metaways.de>
 * @copyright   Copyright (c) 2007-2011 Metaways Infosystems GmbH (http://www.metaways.de)
 */

Ext.ns('Klb.system.widgets', 'Klb.system.widgets.customfields');

/**
 * @namespace   Klb.system.widgets.customfields
 * @class       Klb.system.widgets.customfields.FilterModel
 * @extends     Klb.system.widgets.grid.FilterModel
 */
Ext.define('Klb.system.widgets.customfields.FilterModel', {
    extend: 'Klb.system.widgets.grid.FilterModel',
    /**
     * @cfg {Klb.system.Application} app
     */
    app: null,
    
    /**
     * @cfg {Record} cfConfig
     */
    cfConfig: null,
    
    valueType: 'customfield',
    
    /**
     * @private
     */
    initComponent: function() {
        this.field = 'customfield:' + this.cfConfig.id;
        this.cfDefinition = this.cfConfig.get('definition');
        this.label =  this.cfDefinition.label;
        
        switch (this.cfDefinition.type) {
            case 'record':
            case 'keyField':
                this.operators = ['equals', 'not', 'in', 'notin'];
                this.defaultOperator = 'equals';
                this.valueRenderer = this.cfValueRenderer;
                break;
            case 'integer':
                this.operators = ['equals', 'greater', 'less'];
                this.defaultOperator = 'equals';
                break;
            case 'bool':
            case 'boolean':
                this.valueType = 'bool';
                this.defaultOperator = 'equals';
                this.defaultValue = '0';
                break;
            case 'date':
            case 'datetime':
                this.valueType = 'date';
                this.defaultOperator = 'within';
        }
        
        Klb.system.widgets.customfields.FilterModel.superclass.initComponent.call(this);
    },
    
    /**
     * returns valueType of given filter
     * 
     * added for cf of type record and keyField
     * 
     * @param {Record} filter
     * @return {String}
     */
    getValueType: function (filter) {
        var operator  = filter.get('operator') ? filter.get('operator') : this.defaultOperator,
            valueType = 'selectionComboBox';
        
        switch (operator) 
        {
        case 'in':
        case 'notin':
            valueType = 'FilterModelMultipleValueField';
            break;
        }
        
        return valueType;
    },
    
    /**
     * called on operator change of a filter row
     * 
     * modified for cf of type record and keyField
     * 
     * @private
     */
    onOperatorChange: function (filter, newOperator) {
        this.supr().onOperatorChange.call(this, filter, newOperator);
        
        if (['record', 'keyField'].indexOf(this.cfDefinition.type) !== -1) {
            var valueType = this.getValueType(filter);
            
            for (var valueField in filter.valueFields) {
                if (filter.valueFields.hasOwnProperty(valueField)) {
                    filter.valueFields[valueField][valueField === valueType ? 'show' : 'hide']();
                }
            }
            
            filter.formFields.value = filter.valueFields[valueType];
            if (valueType === 'selectionComboBox' && Ext.isArray(filter.formFields.value.value)) {
                filter.formFields.value.setValue(filter.formFields.value.value[0]);
            }
        }
    },
        
    /**
     * cf value renderer
     * 
     * @param {Ext.data.Model} filter line
     * @param {Ext.Element} element to render to 
     */
    cfValueRenderer: function(filter, el) {        
        var valueType   = this.getValueType(filter),
            fieldWidth  = 200;
                    
        filter.valueFields = {};
        
        filter.valueFields.selectionComboBox = Klb.system.widgets.customfields.Field.get(this.app, this.cfConfig, {
            hidden: valueType !== 'selectionComboBox',
            width: fieldWidth,
            minListWidth: 350,
            value: filter.data.value ? filter.data.value : this.defaultValue,
            resizable: true,
            filter: filter,
            id: 'tw-ftb-frow-valuefield-' + filter.id,
            renderTo: el,
            listeners: {
                scope: this,
                'specialkey': function (field, e) {
                    if (e.getKey() === e.ENTER) {
                        this.onFiltertrigger();
                    }
                },
                'select': this.onFiltertrigger
            }
        });
        
        switch (this.cfDefinition.type)
        {
        case 'record':
            filter.valueFields.FilterModelMultipleValueField = new Klb.system.FilterModelMultipleValueField({
                hidden: valueType !== 'FilterModelMultipleValueField',
                recordClass: eval(this.cfDefinition.recordConfig.value.records),
                valuesAsArray: true,
                self: this,
                filter: filter,
                width: fieldWidth,
                value: filter.data.value ? filter.data.value : this.defaultValue,
                renderTo: el,
                listeners: {
                    scope: this,
                    'specialkey': function (field, e) {
                        if (e.getKey() === e.ENTER) {
                            this.onFiltertrigger();
                        }
                    },
                    'select': this.onFiltertrigger
                }
            });
            break;
            
        case 'keyField':
            var valuesArr = [];
            filter.valueFields.selectionComboBox.store.each(function (rec) {
                valuesArr.push([rec.get(filter.valueFields.selectionComboBox.valueField), rec.get(filter.valueFields.selectionComboBox.displayField)]);
            });
        
            filter.valueFields.FilterModelMultipleValueField = new Klb.system.FilterModelSmallMultipleValueField({
                hidden: valueType !== 'FilterModelMultipleValueField',
                filter: filter,
                filterModel: this,
                width: fieldWidth,
                store: valuesArr,
                value: filter.data.value ? filter.data.value : this.defaultValue,
                renderTo: el,
                listeners: {
                    'specialkey': function (field, e) {
                        if (e.getKey() === e.ENTER) {
                            this.onFiltertrigger();
                        }
                    },
                    'select': this.onFiltertrigger,
                    scope: this
                }
            });
            break;
        }
        
        return filter.valueFields[valueType];
    }
});


Klb.system.statics.Filters.add('apibase.customfield', 'Klb.system.widgets.customfields.FilterModel');

