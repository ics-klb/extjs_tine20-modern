/*
 * Modern 3.0
 * 
 * @package     Modern
 * @subpackage  data
 * @license     http://www.gnu.org/licenses/agpl.html AGPL Version 3
 * @author      Cornelius Weiss <c.weiss@metaways.de>
 * @copyright   Copyright (c) 2007-2008 Metaways Infosystems GmbH (http://www.metaways.de)
 *
 */
 
Ext.ns('Klb.system.data');

/**
 * Abstract Backdend for an model/datatype of an application
 * 
 * @namespace   Klb.system.data
 * @class       Klb.system.data.AbstractBackend
 * @extends     Ext.data.DataProxy
 * @constructor 
 */
Ext.define('Klb.system.data.AbstractBackend', {
    extend: 'Ext.data.Proxy',
    /**
     * @cfg {String} appName
     * internal/untranslated app name (required)
     */
    appName: null,
    /**
     * @cfg {String} modelName
     * name of the model/record  (required)
     */
    modelName: null,
    /**
     * @cfg {Ext.data.Model} recordClass
     * record definition class  (required)
     */
    recordClass: null,
    /**
     * @cfg {String} idProperty
     * property of the id of the record
     */
    idProperty: 'id',
    
    /**
     * loads a single 'full featured' record
     * 
     * @param   {Ext.data.Model} record
     * @param   {Object} options
     * @return  {Number} Klb.system.Ajax transaction id
     * @success {Ext.data.Model}
     */
    loadRecord: function(record, options) {
        options.success.defer(1000, options.scope, record);
    },
    
    /**
     * searches all (lightweight) records matching filter
     * 
     * @param   {Object} filter
     * @param   {Object} paging
     * @param   {Object} options
     * @return  {Number} Klb.system.Ajax transaction id
     * @success {Object} root:[recrods], totalcount: number
     */
    searchRecords: function(filter, paging, options) {
        options.success.defer(1000, options.scope, [{records: [], success: 1, totalRecords: 0}]);
    },
    
    /**
     * saves a single record
     * 
     * @param   {Ext.data.Model} record
     * @param   {Object} options
     * @return  {Number} Klb.system.Ajax transaction id
     * @success {Ext.data.Model}
     */
    saveRecord: function(record, options) {
        record.commit(true);
        options.success.defer(1000, options.scope, [record]);
    },
    
    /**
     * deletes multiple records identified by their ids
     * 
     * @param   {Array} records Array of records or ids
     * @param   {Object} options
     * @return  {Number} Klb.system.Ajax transaction id
     * @success 
     */
    deleteRecords: function(records, options) {
        options.success.defer(1000, options.scope);
    },
    
    /**
     * updates multiple records with the same data
     * 
     * @param   {Array} filter filter data
     * @param   {Object} updates
     * @return  {Number} Klb.system.Ajax transaction id
     * @success
     */
    updateRecords: function(filter, updates, options) {
        options.success.defer(1000, options.scope, []);
    },
    
    /**
     * returns an array of ids
     * 
     * @private 
     * @param  {Ext.data.Model|Array}
     * @return {Array} of ids
     */
    getRecordIds : function(records) {
        var ids = [];
        
        if (! Ext.isArray(records)) {
            records = [records];
        }
        
        for (var i=0; i<records.length; i++) {
            ids.push(records[i].id ? records[i].id : records.id);
        }
        
        return ids;
    },
    
    /**
     * reqired method for Ext.data.Proxy, used by store
     * @todo read the specs and implement success/fail handling
     * @todo move reqest to searchRecord
     */
    load : function(params, reader, callback, scope, arg){
        if(this.fireEvent("beforeload", this, params) !== false){
            
            // move paging to own object
            var paging = {
                sort:  params.sort,
                dir:   params.dir,
                start: params.start,
                limit: params.limit
            };
            
            this.searchRecords(params.filter, paging, {
                scope: this,
                success: function(records) {
                    callback.call(scope||this, records, arg, true);
                }
            });
            
        } else {
            callback.call(scope||this, null, arg, false);
        }
    },
    
    /**
     * returns reader
     * 
     * @return {Ext.data.DataReader}
     */
    getReader: function() {
        
    },
    
    
    /**
     * is request still loading?
     * 
     * @param  {Number} Klb.system.Ajax transaction id
     * @return {Bool}
     */
    isLoading: function(tid) {
        
    }
    
});
