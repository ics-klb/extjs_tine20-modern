/*
 * Modern 3.1.0
 * 
 * @license     http://www.gnu.org/licenses/agpl.html AGPL Version 3
 * @author      Cornelius Weiss <c.weiss@metaways.de>
 * @copyright   Copyright (c) 2007-2010 Metaways Infosystems GmbH (http://www.metaways.de)
 *
 */
Ext.ns('Klb.system.widgets.grid');

/**
 * @namespace   Klb.system.widgets.grid
 * @class       Klb.system.widgets.grid.FilterButton
 * @extends     Ext.button.Button
 * <p>Toggle Button to be used as filter</p>
 * @constructor
 */
Ext.define('Klb.system.widgets.grid.FilterButton', {
    extend: 'Ext.button.Button',
    constructor: function (config) {
        config = config || {};
        Ext.apply(this, config);
        
        Klb.system.widgets.grid.FilterButton.superclass.constructor.call(this);
        Ext.applyIf(this, new Klb.system.widgets.grid.FilterPlugin());
    },
    xtype: 'filterbutton',
    /**
     * @cfg {String} field the filed to filter
     */
    field: null,
    /**
     * @cfg {String} operator operator of filter (defaults 'equals')
     */
    operator: 'equals',
    /**
     * @cfg {Bool} invert true if loging should be inverted (defaults false)
     */
    invert: false,
    
    /**
     * @private only toggle actions make sense as filters!
     */
    enableToggle: true,
    
    /**
     * @private
     */
    getValue: function() {
        return {field: this.field, operator: this.operator, value: this.invert ? !this.pressed : this.pressed};
    },
    
    /**
     * @private
     */
    setValue: function(filters) {
        for (var i=0; i<filters.length; i++) {
            if (filters[i].field == this.field) {
                this.toggle(this.invert ? !filters[i].value : !!filters[i].value);
                break;
            }
        }
    },
    
    /**
     * @private
     */
    handler: function() {
        this.onFilterChange();
    }
});

//Ext.reg('wdgt.filterbutton', Klb.system.widgets.grid.FilterButton);
