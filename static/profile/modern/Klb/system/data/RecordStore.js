/* 
 * Modern 3.0
 * 
 * @license     http://www.gnu.org/licenses/agpl.html AGPL Version 3
 * @author      Cornelius Weiss <config.weiss@metaways.de>
 * @copyright   Copyright (c) 2007-2008 Metaways Infosystems GmbH (http://www.metaways.de)
 */
Ext.define('Klb.system.data.RecordStoreTree', {
    extend: 'Ext.data.TreeStore',
    xtype: 'klbrecordtreestore',
    constructor: function (config) {
        config = config || {};

        this.callParent([config]);
    }
});

Ext.define('Klb.system.data.RecordStore', {
    extend: 'Ext.data.Store',
    xtype: 'klbrecordstore',
    constructor: function (config) {
        config = config || {};
        config.batchTransactions = false;

        config.appName = config.recordClass.getMeta('appName');
        config.modelName = config.recordClass.getMeta('modelName');

        if (typeof(config.reader) == 'undefined') {
            config.reader = new Ext.data.JsonReader({
                rootProperty: config.root || 'results',
                totalProperty: config.totalProperty || 'totalcount',
                id: config.recordClass.getMeta('idProperty')
            }, config.recordClass);
        }
        
        if (typeof(config.writer) == 'undefined' && ! config.readOnly) {
            config.writer = new Ext.data.JsonWriter({
            });
        }

        if (typeof(config.proxy) == 'undefined') {
            config.proxy = new Klb.system.data.RecordProxy({
                recordClass: config.recordClass
            });
        }
        
        this.callParent([config]);
    }
});
