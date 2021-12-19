/*
 * Modern 3.0.1
 * 
 * @package     system
 * @subpackage  Record
 * @copyright   Copyright (c) 2018 LLC ICS (http://www.icstime.com)
 * @license     http://www.gnu.org/licenses/agpl.html AGPL Version 3
 */

Ext.ns('Klb.system', 'Klb.system.data');
/**
 * @namespace Klb.system.data
 * @class     Klb.system.data.Record
 * @extends   Ext.data.Model
 * 
 * Baseclass of Modern 3.0 models
 */
 Ext.define('Klb.system.data.RecordStoreTree', {
    extend: 'Ext.data.TreeStore',
    xtype: 'klbrecordtreestore',
    identifier: 'uuid',
    app: null,
    method: null,
    preloadChildren: true, 
    autoLoad: false,   

    constructor: function (config) {

        config = config || {};
        if (!config.fields) config.fields = [ {name: 'text', type: 'string'} ];
        if (!config.url) config.url = KlbSys.requestUrl;
//console.log( '----------------RecordStoreTree-------------------------' );
//console.log( 'Klb.system.data.RecordStoreTree::constructor' ); console.log( config );
        if ( config.recordClass ) 
        {
                this.appName = config.recordClass.getMeta('appName');
                this.modelName = config.recordClass.getMeta('modelName');
                var configProxy = {
                        url: config.url,
                        recordClass: config.recordClass,
                        getProxyParams: config.getProxyParams.bind(this)
                    };
                if (config.root) configProxy.root = config.root;
                  
            if (typeof(config.proxy) == 'undefined') {
                  config.proxy = new Klb.system.data.CrudProxy(configProxy);
            }
        } 
          else {

            if ( typeof(config.reader) == 'undefined' ) {
                config.reader = new Ext.data.JsonReader({
                    root: config.root || 'results',
                    total: 'totalcount', // ExtJs 4 
                    totalProperty: config.totalProperty || 'totalcount'
                });
            }
            if (typeof(config.writer) == 'undefined' && ! config.readOnly) {
                config.writer = new Ext.data.JsonWriter({});
            }
            if (typeof(config.proxy) == 'undefined') {
                config.proxy = new Ext.data.proxy.Ajax({
                     url: config.url,
                     api: {read: true, create: true, update: true, destroy: true}
                });
            };
        }
        
        this.callParent([config]);
    },

    getProxyParams: function(node) {
        node = node || {};
        return {
            method: this.method,
            filter: this.filter
        };
    }
});


Ext.define('Klb.system.data.JsonStore', {
    extend: 'Ext.data.Store',
    xtype: 'klbjsonstore',
    idProperty: 'id',
    identifier: 'uuid',
    proxy: {
        type: 'memory',
        url: KlbSys.requestUrl,
        writer: 'json',
        reader: {
            type: 'json',
            rootProperty: 'results',
            totalProperty: 'totalcount'
        }
    },

    constructor: function(config) {

        config = config || {};
        if ( config.baseParams ) {
            config = Ext.apply({
                proxy: {
                    type: 'klbproxycrud', // create read update destroy
                    baseParams: config.baseParams || '',
                }
            }, config);
            delete config.baseParams;
        }

        this.callParent([config]);
    },
    getUrl: function() {

        return this.url;
    }
});

Ext.define('Klb.system.data.RecordStore', {
    extend: 'Ext.data.Store',
    xtype: 'klbrecordstore',
    identifier: 'uuid',
    constructor: function (config) {
        config = config || {};
        config.batchTransactions = false;

        if (config.recordClass) {
            config.appName = config.recordClass.getMeta('appName');
            config.modelName = config.recordClass.getMeta('modelName');
        }

        if (typeof(config.reader) == 'undefined') {
            var  cfgReader = {
                url:   KlbSys.requestUrl,
                method: 'POST',
                rootProperty:  config.root || 'results',
                totalProperty: config.totalProperty || 'totalcount',
                idProperty:    config.recordClass ? config.recordClass.getMeta('idProperty') : 'id'
            };
            config.reader = new Ext.data.JsonReader(cfgReader, config.recordClass || {} );
        }
        
        if (typeof(config.writer) == 'undefined' && ! config.readOnly) {
            config.writer = new Ext.data.JsonWriter({
                url:   KlbSys.requestUrl,
                method: 'POST'
            });
        }

        if (typeof(config.proxy) == 'undefined') {
            var  cfgProxy = { url:         KlbSys.requestUrl };
                if ( config.recordClass ) cfgProxy.recordClass = config.recordClass;
                if ( config.appName )   cfgProxy.appName = config.appName;
                if ( config.modelName ) cfgProxy.modelName = config.modelName;
            config.proxy = new Klb.system.data.RecordProxy( cfgProxy );
        }
        
        this.callParent([config]);
    }
});

Ext.define('Klb.system.data.Record', {
    extend: 'Ext.data.Model',
    identifier: 'uuid',
    constructor: function (data, id) {
        var me = this,
            config = { id: id, data: data };

        me.callParent([config]);
        if (id || id === 0) {
            me.id = id;
        } else if ( data && data[me.idProperty]) {
            me.id = data[me.idProperty];
        } else if (!me.id ) {
            me.id = ++Ext.data.Model.AUTO_ID;
        }
        me.data = data;
        me.ctime = new Date().getTime();
    },
 
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
    fields: null,
    /**
     * @cfg {String} idProperty
     * property of the id of the record
     */
    idProperty: 'id',
    /**
     * @cfg {String} titleProperty
     * property of the title attibute, used in generic getTitle function  (required)
     */
    titleProperty: null,
    /**
     * @cfg {String} recordName
     * untranslated record/item name
     */
    recordName: 'record',
    /**
     * @cfg {String} recordName
     * untranslated records/items (plural) name
     */
    recordsName: 'records',
    /**
     * @cfg {String} containerProperty
     * name of the container property
     */
    containerProperty: null,
    /**
     * @cfg {String} containerName
     * untranslated container name
     */
    containerName: 'container',
    /**
     * @cfg {string} containerName
     * untranslated name of container (plural)
     */
    containersName: 'containers',
    /**
     * default filter
     * @type {string}
     */
    defaultFilter: null,
    
    cfExp: /^#(.+)/,
    
    /**
     * Get the value of the {@link Ext.data.Field#name named field}.
     * @param {String} name The {@link Ext.data.Field#name name of the field} to get the value of.
     * @return {Object} The value of the field.
     */
    get: function(name) {
        var cfName = String(name).match(this.cfExp);        
        if (cfName) {
            return this.data.customfields ? this.data.customfields[cfName[1]] : null;
        }        
        return this.data[name];
    },
    
    /**
     * Set the value of the {@link Ext.data.Field#name named field}.
     * @param {String} name The {@link Ext.data.Field#name name of the field} to get the value of.
     * @return {Object} The value of the field.
     */
    setOld: function(name, value) {
        var me = this, 
            encode = Ext.isPrimitive(value) ? String : Ext.encode,
            current = me.get(name),
            cfName;
            
        if (encode(current) == encode(value)) {
            return;
        }
        me.dirty = true;
        if (!me.modified) {
            me.modified = {};
        }
        if (me.modified[name] === undefined) {
            me.modified[name] = current;
        }
        
        if (cfName = String(name).match(me.cfExp)) {
            me.data.customfields = me.data.customfields || {};
            me.data.customfields[cfName[1]] = value;
        } else {
            me.data[name] = value;
        }
        
        if (!me.editing && me.afterEdit ) {
            me.afterEdit();
        }
    },
    
    /**
     * returns title of this record
     * 
     * @return {String}
     */
    getTitle: function() {
        var s = this.titleProperty ? this.titleProperty.split('.') : [null];
        return (s.length > 0 && this.get(s[0]) && this.get(s[0])[s[1]]) ? this.get(s[0])[s[1]] : s[0] ? this.get(this.titleProperty) : '';
    },
    /**
     * returns the id of the record
     */
    getId: function() {
        return this.get(this.idProperty ? this.idProperty : 'id');
    },
    /**
     * converts data to String
     * 
     * @return {String}
     */
    toString: function() {
        return Ext.encode(this.data);
    },

    getModelRelatation: function(model) {
        var _items = [],
            _relations = this.get('relations');
            if ( Ext.isArray(_relations) )
            Ext.Array.each(_relations, function( _item, index ) {
                if ( _item && _item.related_model && _item.related_model == model ) {
                    _items.push( _item.related_record );
                }
            });
        return _items;
    },

    getIdsRelatation: function(model) {
        var _Ids = [],
            _relations = this.get('relations');
            if ( Ext.isArray(_relations) )
            Ext.Array.each(_relations, function( _item, index ) {
                if ( _item && _item.related_model && _item.related_model == model ) 
                {
                    _Ids.push( _item.related_record.id );
                }
            });            
        return _Ids;
    },    
    /**
     * returns true if given record obsoletes this one
     * 
     * @param {Klb.system.data.Record} record
     * @return {Boolean}
     */
    isObsoletedBy: function(record) {
        if (record.modelName !== this.modelName || record.getId() !== this.getId()) {
            throw new Ext.Error('Records could not be compared');
        }
        
        if (this.constructor.hasField('seq') && record.get('seq') != this.get('seq')) {
            return record.get('seq') > this.get('seq');
        }
        
        return (this.constructor.hasField('last_modified_time')) ? record.get('last_modified_time') > this.get('last_modified_time') : true;
    }      
});

Klb.system.data.Record.createMeta = function(recordname, fields, meta) {
//console.log( '-----------------------------------------' );
//console.log( 'Klb.system.data.Record.CreateModel::Meta' ); console.log( meta );
    var pextend = {};
    Ext.apply(pextend, meta);

    pextend.extend = pextend.extend || 'Klb.system.data.Record';
    pextend.modelClassName = 'Klb.system.data.Models.' + meta.appName +'.'+meta.modelName ;
    pextend.fields = fields;
    pextend.statics = pextend.statics || {};
 
//    pextend.fields = new Ext.util.MixedCollection(); // (false, function(field) { return field.name; });
//    for(var i = 0, len = fields.length; i < len; i++) {
//        pextend.fields.add(new Ext.data.Field(fields[i]));
//    }
    pextend.statics.hasField = function(name) {
        return !!this.fieldsMap[name];
    };
    pextend.statics.getField = function(name) {
        return this.fieldsMap[name];
    };
    pextend.statics.getMeta = function(name) {
        var value = null;
        switch(name) {
            case ('phpClassName'):
                value = pextend.appName + '_Model_' + pextend.modelName;
                break;
            default:
                value = pextend[name];
        }
        return value;
    };
    if ( ! pextend.statics.getDefaultData )
        pextend.statics.getDefaultData = function() {
            return {};
        };
    pextend.statics.getFieldDefinitions = function() {
        return this.fields.items;
    };
    pextend.statics.getFieldNames = function() {
        if (! this.fieldsarray) {
            var arr = this.fieldsarray = [];
            Ext.each(this.fields.items, function(item) {arr.push(item.name);});
        }
        return this.fieldsarray;
    };

    pextend.statics.getRecordName = function() {
        return this.$className;
    }
    pextend.statics.getRecordName = function() {
        var app = Klb.system.appMgr.get(this.prototype.appName),
            i18n = app && app.i18n ? app.i18n :Klb.system.translation;
            
        return i18n.n_(this.prototype.recordName, this.prototype.recordsName, 1);
    };
    pextend.statics.getRecordsName = function() {
        var app = Klb.system.appMgr.get(this.prototype.appName),
            i18n = app && app.i18n ? app.i18n :Klb.system.translation;
            
        return i18n.n_(this.prototype.recordName, this.prototype.recordsName, 50);
    };
    pextend.statics.getContainerName = function() {
        var app = Klb.system.appMgr.get(this.prototype.appName),
            i18n = app && app.i18n ? app.i18n :Klb.system.translation;
            
        return i18n.n_(this.prototype.containerName, this.prototype.containersName, 1);
    };
    pextend.statics.getContainersName = function() {
        var app = Klb.system.appMgr.get(this.prototype.appName),
            i18n = app && app.i18n ? app.i18n :Klb.system.translation;
            
        return i18n.n_(this.prototype.containerName, this.prototype.containersName, 50);
    };
    pextend.statics.getAppName = function() {
        return Klb.system.appMgr.get(pextend.appName)? Klb.system.appMgr.get(pextend.appName).i18n._(pextend.appName) : _(pextend.appName);
    };

    pextend.statics.getPhpClassName = function(app, model) {
        // without arguments the php class name of the this is returned
        if (!app && !model) {
            return pextend.getMeta('phpClassName');
        }
        // if var app is a record class, the getMeta method is called
        if (Ext.isFunction(app.getMeta)) {
            return app.getMeta('phpClassName');
        }
        var appName = (Ext.isObject(app) && app.hasOwnProperty('name')) ? app.name : app;
        return appName + '_Model_' + model;
    };

    // sanitize containerProperty label
    pextend.statics.containerProperty = function() {
        var containerProperty = pextend.getMeta('containerProperty');
        if (containerProperty) {
            var field = pextend.fields.get(containerProperty);
            if (field) {
                field.label = pextend.containerName;
            }
        }        
        return containerProperty;
    };
    var modelRecord = Ext.define(recordname,  pextend );
    Klb.system.data.RecordMgr.add(modelRecord);
    return modelRecord;
};

Klb.system.data.Record.generateUID = function(length) {
    var uid = String(CryptoJS.SHA1(String(Math.floor(Math.random()*Math.pow(10, 16))) + String(new Date().getMilliseconds())));

    if (length) {
        uid = uid.substring(0, length);
    }
    
    return uid;
};

Ext.define('Klb.system.data.RecordManager', {
    extend: "Ext.util.MixedCollection",

    add: function(record) {
        if (! Ext.isFunction(record.getMeta)) {
            throw new Ext.Error('only records of type Modern.data.Record could be added');
        }
        var appName = record.getMeta('appName'),
            modelName = record.getMeta('modelName');

        if (! appName && modelName) {
            throw new Ext.Error('appName and modelName must be in the metadatas');
        }
        
//console.log('register model "' + appName + '.' + modelName + '"');
        Klb.system.data.RecordManager.superclass.add.call(this, appName + '.' + modelName, record);
    },

    get: function(appName, modelName) {
        if (Ext.isFunction(appName.getMeta)) {
            return appName;
        }
        if (! modelName && appName.modelName) {
            modelName = appName.modelName;
        }
        if (appName.appName) {
            appName = appName.appName;
        }
        if (! Ext.isString(appName)) {
            throw new Ext.Error('appName must be a string');
        }
        Ext.each([appName, modelName], function(what) {
            if (! Ext.isString(what)) return;
            var parts = what.split(/(?:_Model_)|(?:\.)/);
            if (parts.length > 1) {
                appName = parts[0];
                modelName = parts[1];
            }
        });
        
        return Klb.system.data.RecordManager.superclass.get.call(this, appName + '.' + modelName);
    }
});

Klb.system.data.RecordMgr = new Klb.system.data.RecordManager(true);