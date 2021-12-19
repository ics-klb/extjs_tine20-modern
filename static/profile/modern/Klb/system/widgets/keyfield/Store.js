/* 
 * Modern 3.0
 * 
 * @license     http://www.gnu.org/licenses/agpl.html AGPL Version 3
 * @author      Cornelius Weiss <c.weiss@metaways.de>
 * @copyright   Copyright (c) 2011 Metaways Infosystems GmbH (http://www.metaways.de)
 */
 
Ext.ns('Klb.system.widgets.keyfield');
/**
 * @namespace   Klb.system.widgets.keyfield
 * @class       Klb.system.widgets.keyfield.Store
 * @extends     Klb.system.data.JsonStore
 */
Ext.define('Klb.system.widgets.keyfield.Store', {
    extend: 'Ext.data.Store',    
    /**
     * @cfg {String/Application} app
     */
    app: null,
    
    /**
     * @cfg {String} keyFieldName 
     * name of key field
     */
    keyFieldName: null,
    
    /**
     * @property keyFieldConfig
     * @type Object
     */
    keyFieldConfig: null,

    constructor: function (config) {
        // init app
        config.app = Ext.isString(config.app) ? Klb.system.appMgr.get(config.app) : config.app;

        // get keyField config
        config.keyFieldConfig = config.app.getRegistry().get('config')[config.keyFieldName];

        // init data / translate values
        var data = config.keyFieldConfig && config.keyFieldConfig.value && config.keyFieldConfig.value.records ? config.keyFieldConfig.value.records : [];
        Ext.each(data, function(d) {
            d.i18nValue = d.value ? config.app.i18n._hidden(d.value) : "";
        });
        config.data = data;

        if (! config.keyFieldConfig) {
            throw ('No keyfield config found for ' + config.keyFieldName + ' in ' + config.app.appName + ' registry.');
        }

        var modelName = config.keyFieldConfig.definition && config.keyFieldConfig.definition.options ? config.keyFieldConfig.definition.options['recordModel'] : "Api_Config_KeyFieldRecord",
            modelParts = modelName.split('_'),
            recordClass = Klb.App[modelParts[0]] && Klb.App[modelParts[0]]['Model'] && Klb.App[modelParts[0]]['Model'][modelParts[2]] ? Klb.App[modelParts[0]]['Model'][modelParts[2]] : null;

        config.fields = recordClass ? recordClass : ['id', 'value', 'icon', 'system', 'i18nValue'];

        this.callParent([config]);
    }
});

/**
 * manages key field stores
 * 
 * @namespace   Klb.system.widgets.keyfield
 * @class       Klb.system.widgets.keyfield.StoreMgr
 * @singleton
 */
Klb.system.widgets.keyfield.StoreMgr = function(){
    var stores = {};
    
    return {
        /**
         * returns key field record store
         * 
         * @param {String/Application} app
         * @param {String} keyFieldName 
         * @return Ext.data.Store
         */
        get: function(app, keyFieldName) {
            var appName = Ext.isString(app) ? app : app.appName,
                key = appName + '_' + keyFieldName;
                
            if (! stores[key]) {
                stores[key] = new Klb.system.widgets.keyfield.Store({
                    app: app,
                    keyFieldName: keyFieldName
                });
            }
            
            return stores[key];
        }
    };
}();
