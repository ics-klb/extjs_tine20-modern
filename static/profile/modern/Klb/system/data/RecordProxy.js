/*
 * Modern 3.0
 * 
 * @license     http://www.gnu.org/licenses/agpl.html AGPL Version 3
 * @author      Cornelius Weiss <c.weiss@metaways.de>
 * @copyright   Copyright (c) 2007-2013 Metaways Infosystems GmbH (http://www.metaways.de)
 *
 */
 
Ext.ns('Klb.system.data', 'Klb.system.data.proxy');

/**
 * @namespace   Klb.system.data
 * @class       Klb.system.data.RecordProxy
 * @extends     Ext.data.DataProxy
 * @author      Cornelius Weiss <c.weiss@metaways.de>
 * 
 * Generic record proxy for an model/datatype of an application
 * 
 * @constructor
 * @param {Object} config Config Object
 */
Ext.define('Klb.system.data.RecordProxy', {
    extend: 'Ext.data.proxy.Server',
    requires : ['Ext.util.MixedCollection', 'Ext.data.Request'],
    alias : 'proxy.klbproxyserver',
    xtype: 'klbproxyserver',
    prefix: {
        method: {
            load:       '.get',
            save:       '.save',
            search:     '.search',
            delete:     '.delete',
            updateMultiple: '.updateMultiple'
        }
    },

    getParams:  Ext.emptyFn,

    constructor: function (config) {
        var me = this;
        // we support all actions
        config = config || {};
        config.api = {read: true, create: true, update: true, destroy: true};
        config.$configPrefixed = false;

        console.log(config);
        me.appName   = config.appName ? config.appName : config.recordClass.getMeta('appName');
        me.modelName = config.modelName ? config.modelName : config.recordClass.getMeta('modelName');
        me.idProperty = config.idProperty ? config.idProperty : config.recordClass.getMeta('idProperty');

        me.callParent([config]);
        me.requestsStore = Ext.getStore('requestsStore') || Ext.create('Ext.data.ArrayStore', {
            // store configs
            autoDestroy: true,
            storeId: 'requestsStore',
            idIndex: 0,
            fields: [{name: 'id', type: 'number'}, {name: 'params', type: 'string'}]
        });

        var confReader = {
            $configPrefixed: false,
            messageProperty: 'msg',
            rootProperty: config.rootProperty ? config.rootProperty : 'results',
            totalProperty: 'totalcount'
        };

        if ( config.modelClass ) {
            confReader.model =  config.modelClass;
        } else if (  this.model ) {
            confReader.model = this.model;
        } else if (config.recordClass) {
            confReader.model =  Ext.getClassName(config.recordClass);
        } else if (  config.fields ) {
            confReader.fields = config.fields;
        };

        this.reader = Ext.create('Ext.data.reader.Json', confReader);
        this.jsonReader = new Ext.data.JsonReader({
                $configPrefixed: false,
                idProperty: this.idProperty,
                rootProperty: config.rootProperty ? config.rootProperty : 'results',
                totalProperty: 'totalcount'
            }, this.recordClass || {} );
    },

    recordClass: null,

    /**
     * @type String 
     * @property appName
     * internal/untranslated app name
     */
    appName: null,

    /**
     * @type String 
     * @property idProperty
     * property of the id of the record
     */
    idProperty: null,
    
    /**
     * @type String 
     * @property modelName
     * name of the model/record 
     */
    modelName: null,
    
    /**
     * id of last transaction
     */
    transId: null,

    requestsStore: null,

    operation: null,

    /**
     * Aborts any outstanding request.
     * @param {Number} transactionId (Optional) defaults to the last transaction
     */
    abort: function(transactionId) {
        this.removeRequest(transactionId.requestId);
        return Klb.system.Ajax.abort(transactionId);
    },

    /**
     * loads a single 'full featured' record
     * 
     * @param   {Ext.data.Model} record
     * @param   {Object} options
     * @return  {Number} Klb.system.Ajax transaction id
     * @success {Ext.data.Model}
     */
    loadRecord: function(record, options) {

        options = options || {};
        options.params = options.params || {};
        options.beforeSuccess = function(response) {
            var _result;
              if ( this.recordReader ) { _result = this.recordReader(response); }
                else { _result = this.recordProxy.recordReader(response); }

            return [_result];
        };
        var p = options.params;
        p.method = p.method || this.appName + this.prefix.method.load + this.modelName;
        p.id = p.id || record.get(this.idProperty);

        options.params = p;

        return this.doXHTTPRequest(options);
    },
    
    /**
     * searches all (lightweight) records matching filter
     * 
     * @param   {Object} filter
     * @param   {Object} paging
     * @param   {Object} options
     * @return  {Number} Klb.system.Ajax transaction id
     * @success {Object} root:[records], totalcount: number
     */
    searchRecords: function(filter, paging, options) {

        options = options || {};
        options.params = options.params || {};
        
        var p = options.params;

        p.method = p.method || this.appName + this.prefix.method.search + this.modelName + 's';
        p.filter = p.filter || (filter) ? filter : [];
        p.paging = p.paging || paging;

        options.params = p;

        options.beforeSuccess = function(response) {
            var data, result, readOptions = null;
                // this.jsonReader.readRecords(recordData);
                if (response.responseText) {
                    result = this.reader.getResponseData(response);
                    if (result && result.__$isError) {
                        return new Ext.data.ResultSet({
                            total: 0,
                            count: 0,
                            records: [],
                            success: false,
                            message: result.msg
                        });
                    } else {
                        data = this.reader.readRecords(result, readOptions);
                    }
                } else {
                    data = this.reader.readRecords(response, readOptions);
                }

            this.reader.jsonData = {
               filter: result && result.filter  ? result.filter : false
            };
            
            
            return [data];
        };
        // increase timeout as this can take a longer (1 minute)
        options.timeout = 60000;
        
        return this.doXHTTPRequest(options);
    },
    
    /**
     * saves a single record
     * 
     * @param   {Ext.data.Model} record
     * @param   {Object} options
     * @param   {Object} additionalArguments
     * @return  {Number} Klb.system.Ajax transaction id
     * @success {Ext.data.Model}
     */
    saveRecord: function(operation, options, additionalArguments) {
        
        options = options || {};
        options.params = options.params || {};
        options.beforeSuccess = function(response) {
            var _result;
            if ( this.recordReader ) _result = this.recordReader(response);
                else _result = this.recordProxy.recordReader(response);
            return [_result];
        };
        
        var p = options.params;
        p.method = this.appName + this.prefix.method.save + this.modelName;
        p.recordData = operation.data ? operation.data : operation.getParams();
        if (additionalArguments) {
            Ext.apply(p, additionalArguments);
        }
        // increase timeout as this can take a longer (5 minutes)
        options.timeout = 300000;
        
        return this.doXHTTPRequest(options);
    },
    
    /**
     * deletes multiple records identified by their ids
     * 
     * @param   {Array} records Array of records or ids
     * @param   {Object} options
     * @param   {Object} additionalArguments
     * @return  {Number} Klb.system.Ajax transaction id
     * @success 
     */
    deleteRecords: function(records, options, additionalArguments) {
        
        options = options || {};
        options.params = options.params || {};
        options.params.method = this.appName + this.prefix.method.delete + this.modelName + 's';
        options.params.ids = this.getRecordIds(records);
        if (additionalArguments) {
            Ext.apply(options.params, additionalArguments);
        }
        // increase timeout as this can take a long time (2 mins)
        options.timeout = 120000;
        
        return this.doXHTTPRequest(options);
    },

    /**
     * deletes multiple records identified by a filter
     * 
     * @param   {Object} filter
     * @param   {Object} options
     * @return  {Number} Klb.system.Ajax transaction id
     * @success 
     */
    deleteRecordsByFilter: function(filter, options) {
        
        options = options || {};
        options.params = options.params || {};
        options.params.method = this.appName + this.prefix.method.delete + this.modelName + 'sByFilter';
        options.params.filter = filter;
        // increase timeout as this can take a long time (5 mins)
        options.timeout = 300000;

        return this.doXHTTPRequest(options);
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
        
        options = options || {};
        options.params = options.params || {};
        options.params.method = this.appName + this.prefix.method.updateMultiple + this.modelName + 's';
        options.params.filter = filter;
        options.params.values = updates;
        options.beforeSuccess = function(response) {
            return [Ext.util.JSON.decode(response.responseText)];
        };
        
        return this.doXHTTPRequest(options);
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
     * required method for Ext.data.Proxy, used by store
     */
    load: function(operation, callback, scope, arg){

        if(this.fireEvent("beforeload", this, operation) !== false){
            var _params = operation._params ? operation._params : (operation.params || {} );
            if (operation._filters && operation._filters.length ){
                  operation.filters = operation._filters;
            }
            operation.filters = [];
            var _filters   =  _params.filter  ? _params.filter : [],
                _sorters   =  _params.sorters ? _params.sorters : this.getSortParam(),
                _direction =  _params.sorters ? _params.dir     : operation.dir,
                _limit = operation._limit !== undefined  ? operation._limit : operation.limit,
                _start = operation._start !== undefined ? operation._start : operation.start,
                _page =  operation._page  !== undefined  ? operation._page : operation.page;

            // move paging to own object
            var _paging = {
                sort:  _sorters != 'sort' ? _sorters || '' : '',
                dir:   _direction || "DESC",
                start: _start || 0,
                limit: _limit || 25,
                page:  _page || 1
            };

            if ( _filters.length ) {
                  for ( var _item in  _filters) { operation.filters.push(_filters[_item]); }
            }  

             _filters = operation.getFilters();
            this.searchRecords(_filters, _paging, {
                scope: this,
                success: function(result) {  // see  Ext.data.proxy.Server::processResponse ( line 102063): function(success, operation, request, response, callback, scope) {
                        Ext.apply(operation, {
                              resultSet: result,
                              records: result.records
                        });
                        if (operation.setCompleted) operation.setCompleted();
                        if (operation.setSuccessful) operation.setSuccessful();
 
                        if (operation) { callback.call(scope||this, operation); }
                        operation = false;
                },
                failure: function(exception) {
                    //@todo compute traditional options/request/response here -> dont' waste time ondepricated stuff
                    //this.fireEvent('exception', this, 'remote', 'read', options, response, arg);
                    this.fireEvent('loadexception', this, 'remote',  exception, arg);
                    operation = false;
                }
            });

        } else {
            callback.call(scope||this, operation, arg, false);
        }
    },
    
    /**
     * do the request
     * 
     * @param {} action
     * @param {} rs
     * @param {} params
     * @param {} reader
     * @param {} callback
     * @param {} scope
     * @param {} options
     */
    doRequest: function(operation, callback, scope) { // action, rs, params, reader, callback, scope, options
        if ( !callback || !scope ) {
            scope = operation.getInternalScope();
            callback = operation.getInternalCallback();
        }

        var opts = {
            params:   operation._params || operation.params ||  {},
            callback: callback,
            scope: scope
        };

        if ( operation ) {
           this.operation = operation;
        } else {
            this.operation = new Ext.data.Operation({
                action: operation.action,
                $configPrefixed: false
            });
        }
        /**
         * @property {Boolean} [$configPrefixed]
         * The value `true` causes `config` values to be stored on instances using a
         * property name prefixed with an underscore ("_") character. A value of `false`
         * stores `config` values as properties using their exact name (no prefix).
         * @private
         * @since 5.0.0
         */        
        this.operation.$configPrefixed  = false;

        switch (this.operation.action) {
            case 'create':
                this.saveRecord(operation, opts);
                break;
            case 'read':
                this.load(operation, callback, scope, {} );
                break;
            case 'update':
                this.saveRecord(operation, opts);
                break;
            case 'destroy':
                this.deleteRecords(operation, opts);
                break;
        }
    },

    
    /**
     * returns reader
     * 
     * @return {Ext.data.DataReader}
     */
    getOperation: function() {
        this.operation = this.operation ? this.operation :  new Ext.data.Operation({});
        return this.operation;
    },

    getReader: function() {
        return this.reader;
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
        var data = this.reader.readRecords(recordData);
        
        var record = data.records[0];
        var recordId = record.get(record.idProperty);
        
        record.id = recordId ? recordId : 0;
        
        return record;
    },
    
    /**
     * is request still loading?
     * 
     * @param  {Number} Klb.system.Ajax transaction id
     * @return {Bool}
     */
    isLoading: function(tid) {
        return Klb.system.Ajax.isLoading(tid);
    },
    
    /**
     * performs an Ajax request
     */
    doXHTTPRequest: function(options) {
        options.params = options.getParams ? options.getParams():  options.params;
        options.callback = options.getCallback ? options.getCallback() : options.callback;

        var requestOptions = {
            scope: options.scope || this,
            params: options.params,
            callback: options.callback,
            nonblocking: !!options.nonblocking,
            success: function(response, jsonrpcoptions) {
 
                if (options.nonblocking != true && this.removeRequest ){
                    this.removeRequest(response.requestId);
                }
                if (typeof options.success == 'function') {
                    var args = [];
                    if (typeof options.beforeSuccess == 'function') {
                        args = options.beforeSuccess.call(this, response);
                    }

                    args.push(response, jsonrpcoptions);
                    options.success.apply(options.scope, args);
                }
            },
            // note incoming options are implicitly json-rpc converted
            failure: function (response, jsonrpcoptions) {
                var responseData = Ext.decode(response.responseText),
                    exception = responseData.data ? responseData.data : responseData;

                exception.request = jsonrpcoptions.jsonData;
                exception.response = response.responseText;
                if (options.nonblocking != true && this.removeRequest ){
                    this.removeRequest(response.requestId);
                }
                if (typeof options.failure == 'function') {
                    var args = [];
                    if (typeof options.beforeFailure == 'function') {
                        args = options.beforeFailure.call(this, response);
                    } else {
                        args = [exception];
                    }
                    Klb.Logger.debug('Klb.system.data.RecordProxy::doXHTTPRequest -> call failure fn');
                    options.failure.apply(options.scope, args);
                }
                // requests with callback need to define their own exception handling
                else if (! options.callback) {
                    Klb.Logger.debug('Klb.system.data.RecordProxy::doXHTTPRequest -> handle exception');
                    this.handleRequestException(exception);
                } else {
                    Klb.Logger.debug('Klb.system.data.RecordProxy::doXHTTPRequest -> call callback fn');
                }
            }
        };

        if (options.timeout) {
            requestOptions.timeout = options.timeout;
        }

        return this.sendRequest(requestOptions);
    },

    /**
     * Fires a request
     * @param {Ext.data.Request} request The request
     * @return {Ext.data.Request} The request
     * @private
     */
    sendRequest: function(request) {

        var jsonParams = Ext.util.JSON.encode(request.params).replace(/"id":"(ext-comp-|ext-record-)[0-9]+"/g,'"id":""');
        if (true || this.requestsStore.findExact('params', jsonParams) == -1)
        {
            this.transId = Klb.system.Ajax.request(request);
            if (request.nonblocking != true){
                this.requestsStore.add({
                    id: this.transId.id,
                    params: jsonParams
                });
            }
        } else {
            Klb.Logger.debug('Request not made: ' + jsonParams);
        }
        return this.transId;
    },

    removeRequest: function(tId)
    {
        var position = this.requestsStore.findExact(tId);
        this.requestsStore.removeAt(position);
    },
    
    /**
     * default exception handler
     * 
     * @param {Object} exception
     */
    handleRequestException: function(exception) {

        Klb.system.ExceptionHandler.handleRequestException(exception);
    }
});

Ext.define('Klb.system.data.CrudProxy', {
    extend : 'Ext.data.proxy.Ajax',

    alias : 'proxy.klbproxycrud',
    xtype:  'klbproxycrud',
    passStoreParams : false,
    appendId: true,
    timeout : undefined,


    recordClass: null,
    baseParams: null,
    appName: null,
    modelName: null,
    idProperty: null,

    constructor : function(config) {		
        var me = this;
        config = config || {};
        config.url = config.url || KlbSys.requestUrl;

        var _method = config.baseParams.method;
        if (_method) {
            config.method = _method;
            var _i = _method.indexOf('.');
            config.appName =  _method.substring(0, _i);
            config.modelName = _method.substring(_i+1);
            config.idProperty = 'id';

            delete config.baseParams.method;
        }

        if ( typeof(config.reader) == 'undefined' ) {
            config.reader = new Ext.data.JsonReader({
                rootProperty: config.root || 'results',
                totalProperty: config.totalProperty || 'totalcount'
            });
        }
        if (typeof(config.writer) == 'undefined' && ! config.readOnly) {
            config.writer = new Ext.data.JsonWriter({});
        }

        me.callParent([config]);

        me.extraParams = config.extraParams || {};
    },

    doRequest : function(operation, callback, scope) {
         var me = this,
             writer  = me.getWriter(),
             request = me.buildRequest(operation, callback, scope),
             method  = 'POST',
             jsonData, params;

         request.beforeSuccess = function(response) {
             return [this.reader.read(response)];
         };

         request.timeout = 60000;
         if (writer && operation.allowWrite()) {
             request = writer.write(request);
         }

         request.setConfig({
             binary              : me.getBinary(),
             timeout             : me.getTimeout(),
             scope               : me,
             success             : me.processResponse,
             callback            : me.createRequestCallback(request, operation),
             method              : method,
             useDefaultXhrHeader : me.getUseDefaultXhrHeader(),
             disableCaching      : false // explicitly set it to false, ServerProxy handles caching
         });

         params = request.getParams();
         if (params) {
             jsonData = request.getJsonData();
             if (jsonData) {
                 jsonData = Ext.Object.merge({}, jsonData, params);
             } else {
                 jsonData = params;
             }
             request.setJsonData(jsonData);
             request.setParams(undefined);
         }

        return me.sendRequest(request);
    },

    /**
     * Fires a request
     * @param {Ext.data.Request} request The request
     * @return {Ext.data.Request} The request
     * @private
     */
    sendRequest: function(request) {
        request.setRawRequest( Klb.system.Ajax.request(request.getCurrentConfig()));
        this.lastRequest = request;
        return request;
    },

    processResponse : function(success, operation, request, response, callback, scope) {
            var me = this, reader, result = {}, records, length, mc, record;
            console.log('Klb.system.data.CrudProxy::processResponse request');
            if (success === true) {
                    reader = me.getReader();
                    var data = {},
                        response = response || [],
                        responseData = Ext.decode(response.responseText);
                    // data[reader.totalProperty] = response.length;
                    // there's to hierarchy in dwr response response == data
                    // data[reader.root] = response;
                    if (responseData.error) {
                        responseData.result = new Ext.data.ResultSet({
                            total: 0,
                            count: 0,
                            records: [],
                            success: false,
                            message: responseData.error.message
                        });
                    }
                    result = reader.readRecords(responseData.result);

                    if (result.success !== false) {
                            // see comment in buildRequest for why we include the response
                            // object here
                            // Ext.apply(operation, {
                            //         response : response,
                            //         resultSet : result,
                            //         records: result.records
                            // });

                            operation.setResultSet(result);
                            if (operation.setRecords  )  operation.setRecords(result.records);
                            if (operation.setSuccessful) operation.setSuccessful();
                            if (operation.setCompleted) operation.setCompleted();

                            this.operation = false;
                    } else {
                            operation.setException(result.message);
                            me.fireEvent('exception', this, response, operation);
                            this.operation = false;
                    }
            } else {
                    me.setException(operation, response);
                    me.fireEvent('exception', this, response, operation);
            }

            // this callback is the one that was passed to the 'read' or 'write'
            // function above
            if (typeof callback === 'function') {
                    callback.call(scope || me, operation);
            }

        me.afterRequest(request, success);

       return null;
    },
        
    buildRequest: function(operation, options) {
        var params = Ext.applyIf(operation.params || {}, this.extraParams || {}), request;

        options = options || {};
        options.params = {};
        //copy any sorters, filters etc into the params so they can be sent over the wire
        params = Ext.applyIf(params, this.getProxyParams(operation));

        options.method = params.method || this.appName + this.prefix.method.search + this.modelName + 's';
        options.params.filter = params.filter || [];
        options.params.paging = params.paging || {};

        if (operation.id && !options.params.id) {
            options.id = operation.id;
        }
        options.jsonrpc  = '2.0';

        request = Ext.create('Ext.data.Request', {
            params    : options,
            records   : operation.records,
            operation : operation
        });

        /*
         * Save the request on the Operation. Operations don't usually care about Request and Response data, but in the
         * ServerProxy and any of its subclasses we add both request and response as they may be useful for further processing
         */
        operation.request = request;

        return request;
    },
    
    getProxyParams: function(operation) {
        var me             = this,
            params         = operation.params || {},
            isDef         = Ext.isDefined,
            groupers      = operation.groupers,
            sorters       = operation.sorters,
            filter        = params.filter;
            paging        = params.paging || {};

        if ( !paging.limit )
            Ext.apply( params.paging, {
        	    page :  operation.page,
        	    start : operation.start,
        	    limit : operation.limit
            });

        if (groupers && groupers.length > 0) {
        	Ext.apply(paging , {
        		grouper : me.encodeSorters(grouper)
        	});
        }

        if ( !paging.sort && sorters && sorters.length > 0) {
           	Ext.apply(paging , {
           		sort: me.encodeSorters(sorters)
           	});
        }

        params.paging = paging;
        return params;
    },
    
    encodeSorters: function(sorters) {
        var min = [],
            length = sorters.length,
            i = 0;

        for (; i < length; i++) {
            min[i] = {
                property : sorters[i].property,
                direction: sorters[i].direction
            };
        }
        return this.applyEncoding(min);

    },
    
    applyEncoding: function(value){
        return Ext.encode(value);
    }
});
