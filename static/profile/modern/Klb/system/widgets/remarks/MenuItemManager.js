/*
 * Modern 3.0
 * 
 * @package     Modern
 * @license     http://www.gnu.org/licenses/agpl.html AGPL Version 3
 * @author      Alexander Stintzing <a.stintzing@metaways.de>
 * @copyright   Copyright (c) 2012 Metaways Infosystems GmbH (http://www.metaways.de)
 *
 */

Ext.ns('Klb.system.widgets.relation');

/**
 * @namespace   Klb.system.widgets.remarks
 * @class       Klb.system.widgets.remarks.MenuItemManager
 * @author      Alexander Stintzing <a.stintzing@metaways.de>
 */
Klb.system.widgets.remarks.MenuItemManager = function() {
    var items = {};
    return {
        /**
         * registers the menuitem. just add the config for this action as item.
         * @param {String} appName
         * @param {String} modelName
         * @param {Object} itemConfig
         */
        register: function(appName, modelName, itemConfig) {
            var key = appName + modelName;
            
            if(!items[key]) {
                items[key] = [];
            }
            
            items[key].push(itemConfig);
        },
        
        /**
         * returns registered menuitems. add runtime config here.
         * @param {String} appName
         * @param {String} modelName
         * @param {Object} config
         * @return {Array}
         */
        get: function(appName, modelName, config) {
            var key = appName + modelName;
            var ret = [];

            if(items[key]) {
                Ext.each(items[key], function(item) {
                    ret.push(new Ext.Action(Ext.apply({}, item, config)));
                });
            }
            return ret;
        }
    }
}();