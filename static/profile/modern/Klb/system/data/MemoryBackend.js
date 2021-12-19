
/**
 * @namespace   Klb.system.data
 * @class       Klb.system.data.MemoryBackend
 * @extends     Klb.system.data.AbstractBackend
 */

Ext.define('Klb.system.data.MemoryBackend,', {
    extend: 'Klb.system.data.AbstractBackend',
    
    constructor: function (config) {
        Klb.system.data.MemoryBackend.superclass.constructor.call(this);
        Ext.apply(this, config);

        this.jsonReader = new Ext.data.JsonReader({
            id: this.idProperty,
            root: 'results',
            totalProperty: 'totalcount'
        }, this.recordClass);        
    },
    
    list: {},

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
        console.log(filter);
        var records = [];
        for (var id in this.list) {
            records.push(this.recordReader({responseText: this.list[id]}));
        }
        
        options.success.defer(500, options.scope, [{records: records, success: 1, totalRecords: records.length}]);
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
        if (! record.data.id) {
            record.set('id', Ext.id());
        }
        
        this.list[record.data.id] = Ext.util.JSON.encode(record.data);
        
        options.success.defer(500, options.scope, [this.recordReader({responseText: this.list[record.data.id]})]);
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
     * reads a single 'fully featured' record from json data
     * 
     * NOTE: You might want to overwride this method if you have a more complex record
     * 
     * @param  XHR response
     * @return {Ext.data.Model}
     */
    recordReader: function(response) {
        var recordData = Ext.util.JSON.decode('{"results": [' + response.responseText + ']}');
        var data = this.jsonReader.readRecords(recordData);
        
        var record = data.records[0];
        var recordId = record.get(record.idProperty);
        
        record.id = recordId ? recordId : 0;
        
        return record;
    }
    
});
