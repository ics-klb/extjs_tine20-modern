
/**
 * filter own records
 * 
 * @namespace   Klb.system.widgets.grid
 * @class       Klb.system.widgets.grid.OwnRecordFilter
 * @extends     Klb.system.widgets.grid.ForeignRecordFilter
 * 
 * @constructor
 */
Ext.define('Klb.system.widgets.grid.OwnRecordFilter', {
    extend: 'Klb.system.widgets.grid.ForeignRecordFilter',
    
    isGeneric: false,

    initComponent: function() {
        this.label = this.ftb.generateTitle();
        this.field = this.ownRecordClass.getMeta('idProperty');
        this.defaultOperator = 'definedBy';
        this.foreignRecordClass = this.ownRecordClass;
        
        Klb.system.widgets.grid.OwnRecordFilter.superclass.initComponent.call(this);
    },
    
    getFilterData: function(filterRecord) {
        var data = {
            field: this.field,
            id: filterRecord.id,
            label: filterRecord.toolbar ? filterRecord.toolbar.title : null
        };
        
        if (filterRecord.get('operator') == 'equals') {
            Ext.apply(data, {
                operator: 'equals',
                value: filterRecord.formFields.value.getValue()[0].value
            });
        } else {
            Ext.apply(data, {
                condition: filterRecord.condition || 'AND', 
                filters: this.getRelatedRecordValue(filterRecord)
            });
        }
        
        return data;
    },
    
    setFilterData: function(filterRecord, filterData) {
        // work around store compare bug
        if (Ext.isObject(filterData.filters)) {
            filterData.filters.toString = this.objectToString
        }
        
        if (filterData.operator == 'equals') {
            filterData.operator = 'AND';
            
            filterData.value = [{
                field: ':' + this.field,
                operator: 'equals',
                value: filterData.value
            }];
            filterData.value.toString = this.objectToString;
            
            filterRecord.set('operator', 'AND');
            filterRecord.set('value', filterData.value);
        } else {
            filterRecord.condition = filterData.condition || 'AND';
        }
        
        //filterRecord.set('value', filterData.filters);
        this.setRelatedRecordValue(filterRecord);
    },
    
    setRelatedRecordValue: function(filterRecord) {
        
        if (filterRecord.data.filters) {
            filterRecord.set('value', filterRecord.data.filters);
            delete filterRecord.data.filters;
        }
        
        Klb.system.widgets.grid.OwnRecordFilter.superclass.setRelatedRecordValue.apply(this, arguments);
    }
});

Klb.system.statics.Filters.add('ownrecord', 'Klb.system.widgets.grid.OwnRecordFilter');

