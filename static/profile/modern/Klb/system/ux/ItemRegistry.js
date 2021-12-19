Ext.ns('Ext.ux');

/**
 * plugin to insert additional registered items into a container
 *
 * @namespace   Ext.ux
 * @class       Ext.ux.ItemRegistry
 * @autor       Cornelius Weiss <c.weiss@metaways.de>
 * @license     BSD, MIT and GPL
 */

Ext.define('Ext.ux.ItemRegistry', {
    extend: 'Ext.util.Observable',
    xtype: 'ux.itemregistry',
    alias: 'plugin.ux.itemregistry',
    constructor: function (config) {

        config = config || {};
        Ext.apply(this, config);

        this.callParent(arguments);
    },

    /**
     * @cfg {String} key
     * key the items are registered under. If no key is given, the itemId
     * of the component will be used
     */
    key: null,

    itemMap: {},

    init: function(cmp) {
        this.cmp = cmp;

        if (! this.key) {
            this.key = cmp.getItemId();
        }
        
        // give static item pos to existing items
        this.cmp.items.each(function(item, idx) {
            if (! item.hasOwnProperty('registerdItemPos')) {
                item.registerdItemPos = idx * 10;
            }
        }, this);

        var regItems = this.itemMap[this.key] || [];
 
        Ext.each(regItems, function(reg) {
            var addItem = this.getItem(reg),
                addPos = null;

            // insert item 
            this.cmp.items.each(function(item, idx) {
                if (addItem.registerdItemPos < item.registerdItemPos) {
                    this.cmp.insert(idx, addItem);
                    addPos = idx;
                    return false;
                }
                return true;
            }, this);

            if (! Ext.isNumber(addPos)) {
                this.cmp.add(addItem);
            }
        }, this);
    },

    getItem: function(reg) {
        var def = reg.item,
            item;
            
        if (typeof def === 'function') {
            item = new def(this.config);
        } else {
            if (Ext.isString(def)) {
                def = {xtype: def};
            }
            
            item = this.cmp.lookupComponent(def);
        }

        item.registerdItemPos = reg.pos ? reg.pos : this.cmp.items.length * 10;
        
        return item;
    }
}, function() {

    Ext.ux.ItemRegistry.itemMap = {};

    Ext.ux.ItemRegistry.registerItem = function(key, item, pos) {
        if (! this.itemMap.hasOwnProperty(key)) {
            this.itemMap[key] = [];
        }

        this.itemMap[key].push({
            item: item,
            pos: pos
        });
    };

});

// Ext.PluginManager.setConfig('ux.itemregistry', 'Ext.ux.ItemRegistry');
