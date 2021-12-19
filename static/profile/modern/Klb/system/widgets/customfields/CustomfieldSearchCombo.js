/*
 * Modern 3.1.0
 * 
 * @license     http://www.gnu.org/licenses/agpl.html AGPL Version 3
 * @author      Philipp Schuele <p.schuele@metaways.de>
 * @copyright   Copyright (c) 2009-2010 Metaways Infosystems GmbH (http://www.metaways.de)
 *
 */
 
Ext.ns('Klb.system.widgets', 'Klb.system.widgets.customfields');

/**
 * CustomfieldsSearchCombo
 * 
 * @namespace   Klb.system.widgets.customfields
 * @class       Klb.system.widgets.customfields.CustomfieldSearchCombo
 * @extends     Ext.form.field.ComboBox
 * 
 * <p>Customfields Search Combo</p>
 * <p>
 * searches for custom field values 
 * 
 * <pre>
 * </pre></p>
 * 
 * @license     http://www.gnu.org/licenses/agpl.html AGPL Version 3
 * @author      Philipp Schuele <p.schuele@metaways.de>
 * @copyright   Copyright (c) 2009-2010 Metaways Infosystems GmbH (http://www.metaways.de)
 * 
 * @param       {Object} config
 * @constructor
 * Create a new Klb.system.widgets.customfields.CustomfieldSearchCombo
 */
Klb.system.widgets.customfields.CustomfieldSearchCombo = Ext.extend(Ext.form.field.ComboBox, {
    xtype: 'customfieldsearchcombo',
    /**
     * @property customfieldId
     * @type String
     */
    customfieldId: null,
    
    /**
     * config
     */
    forceSelection: false,
    triggerAction: 'all',
    minChars: 1,
    pageSize: 10,
    displayField: 'value',
    valueField: 'value',
    enableKeyEvents: true,
    
    /**
     * @private
     */
    initComponent: function() {
        this.store = new Klb.system.data.JsonStore({
            model: 'Klb.system.Model.CustomfieldValue',
            baseParams: {
                method: 'Api.searchCustomFieldValues',
                sort: 'value',
                dir: 'ASC'
            },
            root: 'results',
            totalProperty: 'totalcount'
        });
        
        this.on('beforequery', this.onBeforeQuery, this);
        this.on('keypress', this.syncValues, this, {buffer: 500});
        
        this.callParent();
    },
    
    /**
     * prepare paging
     * 
     * @param {Ext.data.Store} store
     * @param {Object} options
     */
    onBeforeLoad: function(store, options) {
        options.params.paging = {
            start: options.params.start,
            limit: options.params.limit
        };
    },
    
    /**
     * sync values so values don't get lost if no value is explicitly selected
     * this happens e.g. when ctrl+enter after searching
     */
    syncValues: function() {
        var val = this.getRawValue();
        this.setValue(val);
    },
     
    /**
     * use beforequery to set query filter
     * 
     * @param {Object} qevent
     */
    onBeforeQuery: function(qevent){
        this.store.baseParams.filter = [
            {field: 'customfield_id',   operator: 'equals',     value: this.customfieldId },
            {field: 'value',            operator: 'group',      value: '' },
            {field: 'value',            operator: 'contains', value: qevent.query }
        ];
    }
});

//Ext.reg('customfieldsearchcombo', Klb.system.widgets.customfields.CustomfieldSearchCombo);
