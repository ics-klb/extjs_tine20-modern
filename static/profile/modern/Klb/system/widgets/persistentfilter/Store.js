/*
 * Modern 3.0
 * 
 * @license     http://www.gnu.org/licenses/agpl.html AGPL Version 3
 * @author      Cornelius Weiss <c.weiss@metaways.de>
 * @copyright   Copyright (c) 2010-2011 Metaways Infosystems GmbH (http://www.metaways.de)
 */
Ext.ns('Klb.system.widgets.persistentfilter.Store');

/**
 * @namespace   Klb.system.widgets.persistentfilter
 * @class       Klb.system.widgets.persistentfilter.Store.PersistentFilterStore
 * @extends     Ext.data.ArrayStore
 * 
 * <p>Store for Persistent Filter Records</p>
 * 
 * @author      Cornelius Weiss <c.weiss@metaways.de>
 * @license     http://www.gnu.org/licenses/agpl.html AGPL Version 3
 * 
 * @param       {Object} config
 * @constructor
 * Create a new Klb.system.widgets.persistentfilter.Store.PersistentFilterStore
 */

Ext.define('Klb.system.widgets.persistentfilter.Store.PersistentFilterStore', {
    extend: 'Ext.data.ArrayStore',
});

/**
 * @namespace   Klb.system.widgets.persistentfilter
 * 
 * get store of all persistent filters
 * 
 * @static
 * @singleton
 * @return {PersistentFilterStore}
 */
Klb.system.widgets.persistentfilter.Store.getPersistentFilterStore = function() {
    if (! Klb.system.widgets.persistentfilter.Store.persistentFilterStore) {
        if (window.isMainWindow) {
            var fields = Klb.system.widgets.persistentfilter.Model.PersistentFilter.getFieldDefinitions();
            
            // create store
            var s = Klb.system.widgets.persistentfilter.Store.persistentFilterStore
                = Ext.create('Klb.system.widgets.persistentfilter.Store.PersistentFilterStore', {
                fields: fields
            });
            
            // populate store
            var persistentFiltersData = Klb.App.Api.registry.get("persistentFilters").results;

            Ext.each(persistentFiltersData, function(data,index) {
                var filterRecord = new Klb.system.widgets.persistentfilter.Model.PersistentFilter(data);
                s.add(filterRecord);
            }, this);
        } else {
            // TODO test this in IE!
            var mainWindow = Ext.ux.PopupWindowMgr.getMainWindow();
            Klb.system.widgets.persistentfilter.Store.persistentFilterStore = mainWindow.Klb.system.widgets.persistentfilter.Store.getPersistentFilterStore();
        }
    }
    
    return Klb.system.widgets.persistentfilter.Store.persistentFilterStore;
}
