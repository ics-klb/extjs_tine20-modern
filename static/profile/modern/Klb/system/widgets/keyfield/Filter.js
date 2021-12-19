/*
 * Modern 3.1.0
 * 
 * @license     http://www.gnu.org/licenses/agpl.html AGPL Version 3
 * @author      Philipp Schüle <p.schuele@metaways.de>
 * @copyright   Copyright (c) 2011 Metaways Infosystems GmbH (http://www.metaways.de)
 */
Ext.ns('Klb.system.widgets.keyfield');

/**
 * @namespace   Klb.Tasks
 * @class       Klb.system.widgets.keyfield.Filter
 * @extends     Klb.system.widgets.grid.FilterModel
 * 
 * @author      Philipp Schüle <p.schuele@metaways.de>
 */
Ext.define('Klb.system.widgets.keyfield.Filter', {
    extend: 'Klb.system.widgets.grid.FilterModel',
    require: [
           'Klb.system.widgets.grid.FilterModel' 
         , 'Klb.system.widgets.grid.FilterPlugin'
    ],

    /**
     * @property Klb.system.Application app
     */
    app: null,
    
    /**
     * @cfg
     * @type String
     */
    keyfieldName: null,
    
    defaultOperator: 'in',
    
    /**
     * @private
     */
    initComponent: function() {
        this.operators = ['in', 'notin'];

        Klb.system.widgets.keyfield.Filter.superclass.initComponent.call(this);
        
    },
    
    /**
     * value renderer
     * 
     * @param {Ext.data.Model} filter line
     * @param {Ext.Element} element to render to 
     */
    valueRenderer: function(filter, el) {
        var value = new Klb.system.widgets.keyfield.FilterValueField({
            app: this.app,
            filter: filter,
            width: 200,
            id: 'tw-ftb-frow-valuefield-' + filter.id,
            value: filter.data.value ? filter.data.value : this.defaultValue,
            renderTo: el,
            keyfieldName: this.keyfieldName
        });
        value.on('specialkey', function(field, e){
             if(e.getKey() == e.ENTER){
                 this.onFiltertrigger();
             }
        }, this);
        value.on('select', this.onFiltertrigger, this);
        
        return value;
    }
});

/**
 * @namespace   Klb.Tasks
 * @class       Klb.system.widgets.keyfield.FilterValueField
 * @extends     Ext.ux.form.LayerCombo
 * 
 * @author      Philipp Schüle <p.schuele@metaways.de>
 * 
 * TODO think about using Klb.system.widgets.grid.PickerFilterValueField
 */
Ext.define('Klb.system.widgets.keyfield.FilterValueField', {
    extend: 'Ext.ux.form.LayerCombo',
    hideButtons: false,
    formConfig: {
        labelAlign: 'left',
        labelWidth: 30
    },
    
    /**
     * @property Klb.system.Application app
     */
    app: null,
    
    /**
     * @cfg
     * @type String
     */
    keyfieldName: null,
    
    getFormValue: function() {
        var ids = [];
        var keyfieldStore = Klb.system.widgets.keyfield.StoreMgr.get(this.app.name, this.keyfieldName);
        
        var formValues = this.getInnerForm().getForm().getValues();
        for (var id in formValues) {
            if (formValues[id] === 'on' && keyfieldStore.getById(id)) {
                ids.push(id);
            }
        }
        
        return ids;
    },
    
    getItems: function() {
        var items = [];
        Klb.system.widgets.keyfield.StoreMgr.get(this.app.name, this.keyfieldName).each(function(keyfieldRecord) {
            var checkbox = {
                xtype: 'checkbox',
                boxLabel: keyfieldRecord.get('i18nValue'),
                icon: keyfieldRecord.get('icon'),
                name: keyfieldRecord.get('id')
            };
            
            if (checkbox.icon) {
                checkbox.boxLabel = '<img src="' + keyfieldRecord.get('icon') + '" class="apibase-keyfield-icon"/>' + checkbox.boxLabel;
            }
            
            items.push(checkbox);
        }, this);
        
        return items;
    },
    
    /**
     * @param {String} value
     * @return {Ext.form.Field} this
     */
    setValue: function(value) {
        value = Ext.isArray(value) ? value : [value];
        
        var keyfieldRecordText = [];
        this.currentValue = [];
        
        Klb.system.widgets.keyfield.StoreMgr.get(this.app.name, this.keyfieldName).each(function(keyfieldRecord) {
            var id = keyfieldRecord.get('id');
            var name = keyfieldRecord.get('i18nValue');
            if (value.indexOf(id) >= 0) {
                keyfieldRecordText.push(name);
                this.currentValue.push(id);
            }
        }, this);
        
        this.setRawValue(keyfieldRecordText.join(', '));
        
        return this;
    },
    
    /**
     * sets values to innerForm
     */
    setFormValue: function(value) {
        this.getInnerForm().getForm().items.each(function(item) {
            item.setValue(value.indexOf(item.name) >= 0 ? 'on' : 'off');
        }, this);
    }
});

Klb.system.statics.Filters.add('Klb.widget.keyfield.filter', 'Klb.system.widgets.keyfield.Filter');
