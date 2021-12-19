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
 * @class       Klb.system.widgets.grid.FilterPlugin
 * @extends     Ext.util.Observable
 * <p>Base class for all grid filter plugins.</p>
 * @constructor
 */
Ext.define('Klb.system.widgets.grid.FilterPlugin', {
    extend: 'Ext.util.Observable',

    /**
     * @property {Ext.grid.GridPanel} grid
     */
    grid: null,
    
    /**
     * @property {Ext.data.Store} store
     */
    store: null,
    
    /**
     * @property {String} xtype
     */
    xtype: 'filterplugin',
    
    /**
     * main method which must return the filter object of this filter
     * 
     * @return {Object}
     */
    getValue: Ext.emptyFn,
    
    /**
     * returns gird panel this filterplugin is bound to/for
     * 
     * @return {Ext.panel.Panel}
     */
    getGridPanel: function() {
        return this.grid;
    },
    
    /**
     * main method which must set the filter from given data
     * 
     * @param {Array} all filters
     */
    setValue: Ext.emptyFn,
    
    /**
     * plugin method of Ext.grid.GridPanel
     * 
     * @param {Ext.grid.GridPanel} grid
     */
    init: function(grid) {
        this.grid = grid;
        this.store = grid.store;
        this.doBind();
    },
    
    /**
     * binds this plugin to the grid store
     */
    doBind: function() {
        this.store.on('beforeload', this.onBeforeLoad, this);
        this.store.on('load', this.onLoad, this);
    },
    
    /**
     * fires our change event
     */
    onFilterChange: function() {
        if (this.getGridPanel() && typeof this.getGridPanel().getView === 'function') {
            this.getGridPanel().getView().isPagingRefresh = true;
        }
        
        if (this.store) {
            this.store.load({});
        }
        
        this.fireEvent('change', this);
    },
    
    /**
     * called before store loads
     */
    onBeforeLoad: function(store, options) {
        options = options || {};
        options.params = options.params || {};
        options.params.filter = options.params.filter ? options.params.filter : [];
        
        var value = this.getValue();
        if (value && Ext.isArray(options.params.filter)) {
            value = Ext.isArray(value) ? value : [value];
            for (var i=0; i<value.length; i++) {
                options.params.filter.push(value[i]);
            }
        }
    },
    
    /**
     * called after store data loaded
     */
    onLoad: function(store, options) {
        if (store.proxy.reader && Ext.isArray(store.proxy.reader.jsonData.filter)) {
            // filter plugin has to 'pick' its records
            this.setValue(store.proxy.reader.jsonData.filter);
        }
    }
});
