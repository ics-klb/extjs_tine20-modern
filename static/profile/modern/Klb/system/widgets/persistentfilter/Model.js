/*
 * Modern 3.0
 * 
 * @license     http://www.gnu.org/licenses/agpl.html AGPL Version 3
 * @author      Cornelius Weiss <c.weiss@metaways.de>
 * @copyright   Copyright (c) 2010 Metaways Infosystems GmbH (http://www.metaways.de)
 */
Ext.ns('Klb.system.widgets.persistentfilter.Model');


/**
 * @namespace   Klb.system.widgets.persistentfilter
 * @class       Klb.system.widgets.persistentfilter.Model.PersistentFilter
 * @extends     Klb.system.data.Record
 * 
 * <p>Model of a Persistent Filter</p>
 * 
 * @author      Cornelius Weiss <c.weiss@metaways.de>
 * @license     http://www.gnu.org/licenses/agpl.html AGPL Version 3
 * 
 * @param       {Object} data
 * @constructor
 * Create a new Klb.system.widgets.persistentfilter.Model.PersistentFilter Record
 */
Ext.ns('Klb.system.widgets.persistentfilter', 'Klb.system.widgets.persistentfilter.Model');

Klb.system.data.Record.createMeta('Klb.system.widgets.persistentfilter.Model.PersistentFilter', Klb.system.Model.genericFields.concat([
    {name: 'id'},
    {name: 'application_id'},
    {name: 'account_id'},
    {name: 'model'},
    {name: 'filters'},
    {name: 'name'},
    {name: 'description'}
]), {
    appName: 'Api',
    modelName: 'PersistentFilter',
    idProperty: 'id',
    titleProperty: 'name',

    recordName: 'Favorite',
    recordsName: 'Favorites',
    
    /**
     * is a shared persistent filter
     * 
     * @return {Boolean}
     */
    isShared: function() {
        return this.get('account_id') === null;
    },
    
    /**
     * is a persistent filter (localized) which is shipped
     * 
     * @return {Boolean}
     */
    isShipped: function() {
        return ((this.get('account_id') === null) && (this.get('created_by') === null));
    },  
    
    /**
     * is default of current user
     * 
     * @return {Boolean}
     */
    isDefault: function() {
        var app = Klb.system.appMgr.getById(this.get('application_id'));
        return this.app && this.get('id') === app.getRegistry().get('preferences').get('defaultpersistentfilter');
    }
});

/**
 * @namespace   Klb.system.widgets.persistentfilter
 * 
 * @param       {String} appName
 * @return      {model.PersistentFilter} or null
 */
Klb.system.widgets.persistentfilter.Model.PersistentFilter.getDefaultFavorite = function(appName, modelName) {
    var app = Klb.system.appMgr.get(appName),
        appPrefs = app.getRegistry().get('preferences'),
        defaultFavoriteId = appPrefs ? appPrefs.get('defaultpersistentfilter') : null;
   
    if (defaultFavoriteId === '_lastusedfilter_') {
        var filterData = Ext.state.Manager.get(appName + '-' + modelName + '-lastusedfilter');
        
        return filterData ? new Klb.system.widgets.persistentfilter.Model.PersistentFilter({
            'filters': filterData,
            'name': '_lastusedfilter_'
        }) : null;
        
    }
    return defaultFavoriteId ? Klb.system.widgets.persistentfilter.Store.getPersistentFilterStore().getById(defaultFavoriteId) : null
};

/**
 * @namespace   Klb.system.widgets.persistentfilter
 * @class       Klb.system.data.RecordProxy
 * @singelton   Klb.system.widgets.persistentfilter.Model.persistentFilterProxy
 * 
 * <p>Backend for Persistent Filter</p>
 * 
 * @author      Cornelius Weiss <c.weiss@metaways.de>
 * @license     http://www.gnu.org/licenses/agpl.html AGPL Version 3
 */
Klb.system.widgets.persistentfilter.Model.persistentFilterProxy = new Klb.system.data.RecordProxy({
    appName: 'Api_PersistentFilter',
    modelName: 'PersistentFilter',
    recordClass: Klb.system.widgets.persistentfilter.Model.PersistentFilter
});
