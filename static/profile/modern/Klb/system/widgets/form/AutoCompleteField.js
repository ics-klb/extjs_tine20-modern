/* 
 * Modern 3.1.0
 * 
 * @license     http://www.gnu.org/licenses/agpl.html AGPL Version 3
 * @author      Cornelius Weiss <c.weiss@metaways.de>
 * @copyright   Copyright (c) 2007-2011 Metaways Infosystems GmbH (http://www.metaways.de)
 */

Ext.ns('Klb.system.widgets.form');

Ext.define('Klb.system.widgets.form.AutoCompleteField', {
    extend: 'Ext.extend(Ext.form.field.ComboBox',

    xtype: 'AutoCompleteField',
    /**
     * @cfg {String} property 
     * property to autocomplete (required)
     */
    property: null,
    
    /**
     * @cfg {Ext.data.Model} recordClass
     * record definition class  (required)
     */
    recordClass: null,
    
    /**
     * config
     */
    forceSelection: false,
    triggerAction: 'all',
    minChars: 3,
    queryParam: 'startswith',
    hideTrigger: true,
    
    /**
     * @private
     */
    initComponent: function() {
        if (! this.property && this.name) {
            this.property = this.name;
        }
        
        this.displayField = this.valueField = this.property;
        
        this.store = new Klb.system.data.JsonStore({
            fields: [this.property],
            baseParams: {
                method: this.recordClass.getMeta('appName') + '.autoComplete' + this.recordClass.getMeta('modelName') + 'Property',
                property: this.property,
                sort: this.property,
                dir: 'ASC'
            },
            root: 'results',
            totalProperty: 'totalcount'
        });
        
        
        Klb.system.widgets.form.AutoCompleteField.superclass.initComponent.call(this);
    }
});
