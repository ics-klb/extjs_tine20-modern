/*
 * Modern 3.1.0
 * 
 * @package     Modern
 * @license     http://www.gnu.org/licenses/agpl.html AGPL Version 3
 * @author      Alexander Stintzing <a.stintzing@metaways.de>
 * @copyright   Copyright (c) 2012-2013 Metaways Infosystems GmbH (http://www.metaways.de)
 *
 */
Ext.ns('Klb.system');
/**
 * Modern Application Starter
 * 
 * @namespace   Klb.system
 * @function    Klb.MailAccounting.MailAggregateGridPanel
 * @license     http://www.gnu.org/licenses/agpl.html AGPL Version 3
 * @author      Alexander Stintzing <a.stintzing@metaways.de>
 */
Ext.define("Klb.system.ApplicationStarter", {
    extend: "Object",
    singleton: true,
    /**
     * the applictions the user has access to
     */
    userApplications: null,
    /**
     * type mapping
     */
    types: {
        'date':     'date',
        'datetime': 'date',
        'time':     'date',
        'string':   'string',
        'text':     'string',
        'boolean':  'bool',
        'integer':  'int',
        'float':    'float'
    },
    /**
     * initializes the starter
     */
    init: function() {
        // Wait until appmgr is initialized
        if (! Klb.system.hasOwnProperty('appMgr')) {
            Ext.Function.defer(Klb.system.ApplicationStarter.init, 100);
            return;
        }

        if (! this.userApplications || this.userApplications.length == 0) {
            Klb.system.ApplicationStarter.userApplications = Klb.App.Api.registry.get('userApplications');
            Klb.system.ApplicationStarter.createStructure(true);
        }
    },
    
    /**
     * returns the field
     */
    getField: function(fieldDefinition, key) {
        // default type is auto
        var field = {name: key};
        if (fieldDefinition.type) {
            // add pre defined type
            field.type = this.types[fieldDefinition.type];
            switch (fieldDefinition.type) {
                case 'datetime':
                    field.dateFormat = Ext.Date.patterns.ISO8601Long;
                    break;
                case 'date':
                    field.dateFormat = Ext.Date.patterns.ISO8601Long;
                    break;
                case 'time':
                    field.dateFormat = Ext.Date.patterns.ISO8601Time;
                    break;
                case 'record':
                case 'records':
                    fieldDefinition.config.modelName = fieldDefinition.config.modelName.replace(/_/, '');
                    field.type = fieldDefinition.config.appName + '.' + fieldDefinition.config.modelName;
                    break;
            }
            // allow overwriting date pattern in model
            if (fieldDefinition.hasOwnProperty('dateFormat')) {
                field.dateFormat = fieldDefinition.dateFormat;
            }
        }
        // TODO: create field registry, add fields here
        return field;
    },
    /**
     * returns the grid renderer
     */
    getGridRenderer: function(config, field, appName, modelName) {
        var gridRenderer = null;
        if (config && field) {
            switch (config.type) {
                case 'record':
                    gridRenderer = function(value, row, record) {
                        var foreignRecordClass = Klb.App[config.config.appName].Model[config.config.modelName];
                        var titleProperty = foreignRecordClass.getMeta('titleProperty');
                      return record.get(field) ? Ext.util.Format.htmlEncode(record.get(field)[titleProperty]) : '';
                    };
                    break;
                case 'integer':
                    if (config.hasOwnProperty('specialType')) {
                        switch (config.specialType) {
                            case 'bytes1000':
                                gridRenderer = function(a,b,c) {
                                    return Klb.system.Common.byteRenderer(a, b, c, 2, true);
                                };
                                break;
                            case 'bytes':
                                gridRenderer = function(a,b,c) {
                                    return Klb.system.Common.byteRenderer(a, b, c, 2, false);
                                };
                                break;
                            case 'minutes':
                                gridRenderer = Klb.system.Common.minutesRenderer;
                                break;
                            case 'seconds':
                                gridRenderer = Klb.system.Common.secondsRenderer;
                                break;
                            case 'usMoney':
                                gridRenderer = Ext.util.Format.usMoney;
                                break;
                            case 'euMoney':
                                gridRenderer = Ext.util.Format.euMoney;
                                break;
                            default:
                                gridRenderer = Ext.util.Format.htmlEncode;
                        }
                    }
                    break;
                case 'user':
                    gridRenderer = Klb.system.Common.usernameRenderer;
                    break;
                case 'keyfield': 
                    gridRenderer = Klb.system.widgets.keyfield.Renderer.get(appName, config.name);
                    break;
                case 'date':
                    gridRenderer = Klb.system.Common.dateRenderer;
                    break;
                case 'datetime':
                    gridRenderer = Klb.system.Common.dateTimeRenderer;
                    break;
                case 'time':
                    gridRenderer = Klb.system.Common.timeRenderer;
                    break;
                case 'tag':
                    gridRenderer = Klb.system.Common.tagsRenderer;
                    break;
                case 'container':
                    gridRenderer = Klb.system.Common.containerRenderer;
                    break;
                case 'boolean':
                    gridRenderer = Klb.system.Common.booleanRenderer;
                    break;
                default:
                    gridRenderer = Ext.util.Format.htmlEncode;
                 }
           }
        return gridRenderer;
    },

    /**
     * used in getFilter for mapping types to filter
     * 
     * @type 
     */
    filterMap: function(type, fieldconfig, filter, filterconfig, appName, modelName, modelConfig) {

        switch (type) {
            case 'string':
            case 'text':
            case 'user':
                break;
            case 'boolean': 
                filter.valueType = 'bool'
                filter.defaultValue = false;
                break;
            case 'record':
                filterconfig.options.modelName = filterconfig.options.modelName.replace(/_/, '');
                var foreignApp = filterconfig.options.appName;
                var foreignModel = filterconfig.options.modelName;
                // create generic foreign id filter
                var filterclass = Ext.extend(Klb.system.widgets.grid.ForeignRecordFilter, {
                    foreignRecordClass: foreignApp + '.' + foreignModel,
                    linkType: 'foreignId',
                    ownField: fieldconfig.key,
                    label: filter.label
                });
                // register foreign id field as appName.modelName.fieldKey
                var fc = appName + '.' + modelName + '.' + fieldconfig.key;
                Klb.system.statics.FiltersToolbar[fc] = filterclass;
                filter = {filtertype: fc};
                break;
            case 'tag': 
                filter = {filtertype: 'apibase.tag', app: appName};
                break;
            case 'container':
                var applicationName = filterconfig.appName ? filterconfig.appName : appName;
                var modelName = filterconfig.modelName ? filterconfig.modelName : modelName;
                filter = {
                    filtertype: 'Klb.widget.container.filtermodel', 
                    app: applicationName, 
                    recordClass: applicationName + '.' + modelName,
                    field: fieldconfig.key,
                    label: fieldconfig.label,
                    callingApp: appName
                };
                break;
            case 'keyfield':
                filter.filtertype = 'Klb.widget.keyfield.filter';
                filter.app = {name: appName};
                filter.keyfieldName = fieldconfig.name;
                break;
            case 'date':
                filter.valueType = 'date';
                break;
            case 'datetime':
                filter.valueType = 'date';
                break;
            case 'integer':
                filter.valueType = 'number';
        }
        return filter;
    },
    
    /**
     * returns filter
     */
    getFilter: function(fieldKey, filterconfig, modelConfig) {
        // take field label if no filterlabel is defined
        var fieldconfig = modelConfig.fields[fieldKey];
        var appName = modelConfig.appName;
        var modelName = modelConfig.modelName;

        var app = Klb.system.appMgr.get(appName),
            fieldTypeKey = (fieldconfig && fieldconfig.type) ? fieldconfig.type : (filterconfig && filterconfig.type) ? filterconfig.type : 'default',
            label = (filterconfig && filterconfig.hasOwnProperty('label')) ? filterconfig.label : (fieldconfig && fieldconfig.hasOwnProperty('label')) ? fieldconfig.label : null,
            globalI18n = ((filterconfig && filterconfig.hasOwnProperty('useGlobalTranslation')) || (fieldconfig && fieldconfig.hasOwnProperty('useGlobalTranslation')));

        if (! label) {
            return null;
        }
        // prepare filter
        var filter = {
            label: globalI18n ? _(label) : app.i18n._(label),
            field: fieldKey
        };

        if (filterconfig) {
            if (filterconfig.hasOwnProperty('options') && (filterconfig.options.hasOwnProperty('jsFilterType') || filterconfig.options.hasOwnProperty('jsFilterValueType'))) {
                Klb.Logger.err('jsFilterType and jsFilterValueType are deprecated. Use jsConfig.<property> instead.');
            }
            // if js filter is defined in filterconfig.options, take this and return
            if (filterconfig.hasOwnProperty('jsConfig')) {
                Ext.apply(filter, filterconfig.jsConfig);
                return filter;
            } 

            try {
                filter = this.filterMap(fieldTypeKey, fieldconfig, filter, filterconfig, appName, modelName, modelConfig);
            } catch (e) {
                var keys = filterconfig.filter.split('_'),
                    filterkey = keys[0].toLowerCase() + '.' + keys[2].toLowerCase();
                    filterkey = filterkey.replace(/filter/g, '');
    
                if ( Klb.system.widgets.grid.FilterToolbar && Klb.system.statics.FiltersToolbar[filterkey]) {
                    filter = {filtertype: filterkey};
                } else { // set to null if no filter could be found
                    filter = null;
                }
            }
        }
        return filter;
    },
    
    /**
     * if application starter should be used, here the js contents are (pre-)created
     */
    getApplications: function() {
      return this.userApplications;
    },
    
    /**
     * if application starter should be used, here the js contents are (pre-)created
     */
    createStructure: function(initial) {
        var start = new Date();
        Ext.each(this.userApplications, function(app) {
            var appName = app.name;
            Ext.ns('Klb.App.' + appName);

            var models = Klb.App[appName].registry ? Klb.App[appName].registry.get('models') : null;
            if (models) {

                Klb.App[appName].isAuto = true;
                var contentTypes = [];
                // create translation
                Klb.App[appName].i18n = new Klb.system.Locale.Gettext();
                Klb.App[appName].i18n.textdomain(appName);
                // iterate models of this app
                Ext.iterate(models, function(modelName, modelConfig) {
                    var containerProperty = modelConfig.hasOwnProperty('containerProperty') ? modelConfig.containerProperty : null;

                    modelName = modelName.replace(/_/, '');
                    Ext.namespace('Klb.App.' + appName, 'Klb.App.' + appName + '.Model');
                    var modelArrayName = modelName + 'Array',
                        modelArray = [];

                    if (modelConfig.createModule) {
                        contentTypes.push(modelConfig);
                    }
                    // iterate record fields
                    Ext.each(modelConfig.fieldKeys, function(key) {
                        // add field to model array
                        modelArray.push(this.getField(modelConfig.fields[key], key));
                        if (modelConfig.fields[key].label) {
                         // register grid renderer
                            if (initial && false) {
                                var renderer = this.getGridRenderer(modelConfig.fields[key], key, appName, modelName);
                                if (renderer) {
                                    if (! Klb.system.widgets.grid.RendererManager.has(appName, modelName, key)) {
                                        Klb.system.widgets.grid.RendererManager.register(appName, modelName, key, renderer);
                                    }
                                }
                            }
                        }
                    }, this);

                    // iterate virtual record fields
                    if (modelConfig.virtualFields && modelConfig.virtualFields.length) {
                        Ext.each(modelConfig.virtualFields, function(field) {
                            modelArray.push(this.getField(field, field.key));
                        }, this);
                    }
                    // collect the filterModel
                    var filterModel = [];
                    Ext.iterate(modelConfig.filterModel, function(key, filter) {
                        var f = this.getFilter(key, filter, modelConfig);
                        
                        if (f) {
                            Klb.system.widgets.grid.FilterRegistry.register(appName, modelName, f);
                            filterModel.push(f);
                        }
                    }, this);

                    // TODO: registry looses info if gridpanel resides in an editDialog
                    // delete filterModel as all filters are in the filter registry now
                    // delete modelConfig.filterModel;
                    Klb.App[appName].Model[modelArrayName] = modelArray;

                    // create model
                    if (! Klb.App[appName].Model.hasOwnProperty(modelName)) {
                        Klb.system.data.Record.createMeta('Klb.App.'+appName+'.Model.'+modelName,
                                Klb.App[appName].Model[modelArrayName], 
                                Ext.copyTo({}, modelConfig, 
                                'defaultFilter,appName,modelName,recordName,recordsName,titleProperty,containerProperty,containerName,containersName,group')
                        );
                        Klb.App[appName].Model[modelName].getFilterModel = function() {
                            return filterModel;
                        }
                    }

                    Ext.ns('Klb.App.' + appName);
                    // create recordProxy
                    var recordProxyName = modelName.toLowerCase() + 'Backend';
                    if (! Klb.App[appName].hasOwnProperty(recordProxyName)) {
                        Klb.App[appName][recordProxyName] = new Klb.system.data.RecordProxy({
                            appName: appName,
                            modelName: modelName,
                            recordClass: Klb.App[appName].Model[modelName]
                        });
                    }

                    // overwrite function
                    Klb.App[appName].Model[modelName].getDefaultData = function() {
                        if (! dd) {
                            var dd = Ext.decode(Ext.encode(modelConfig.defaultData));
                        }

                        // find container by selection or use defaultContainer by registry
                        if (modelConfig.containerProperty) {
                            if (! dd.hasOwnProperty(modelConfig.containerProperty)) {
                                var app = Klb.system.appMgr.get(appName),
                                    registry = app.getRegistry(),
                                    ctp = app.getMainScreen().getWestPanel().getContainerTreePanel();

                                var container = (ctp ? ctp.getDefaultContainer() : null) || (registry ? registry.get("default" + modelName + "Container") : null);
                                if (container) {
                                    dd[modelConfig.containerProperty] = container;
                                }
                            }
                        }
                        return dd;
                    };

                    // create filter panel
                    var filterPanelName = modelName + 'FilterPanel';
                    if (! Klb.App[appName].hasOwnProperty(filterPanelName)) {
                        Klb.App[appName][filterPanelName] = function(c) {
                            Ext.apply(this, c);
                            Klb.App[appName][filterPanelName].superclass.constructor.call(this);
                        };
                        Ext.extend(Klb.App[appName][filterPanelName], Klb.system.widgets.persistentfilter.PickerPanel);
                    }
                    // create container tree panel, if needed
                    if (containerProperty) {
                        var containerTreePanelName = modelName + 'TreePanel';
                        if (! Klb.App[appName].hasOwnProperty(containerTreePanelName)) {
                            Klb.App[appName][containerTreePanelName] = Ext.extend(Klb.system.widgets.container.TreePanel, {
                                filterMode: 'filterToolbar',
                                recordClass: Klb.App[appName].Model[modelName]
                            });
                        }
                    }
                    
                    // create main screen
                    if(! Klb.App[appName].hasOwnProperty('MainScreen')) {
                        Klb.App[appName].MainScreen = Ext.extend(Klb.system.widgets.MainScreen, {
                            app: appName,
                            contentTypes: contentTypes,
                            activeContentType: modelName
                        });
                    }
                    
                    // create editDialog openWindow function only if edit dialog exists
                    var editDialogName = modelName + 'EditDialog';

                    if (Klb.App[appName].hasOwnProperty(editDialogName)) {
                        var edp = Klb.App[appName][editDialogName].prototype;
                        if (containerProperty) {
                            edp.showContainerSelector = true;
                        }
                        Ext.apply(edp, {
                            modelConfig:      Ext.encode(modelConfig),
                            modelName:        modelName,
                            recordClass:      Klb.App[appName].Model[modelName],
                            recordProxy:      Klb.App[appName][recordProxyName],
                            appName:          appName,
                            windowNamePrefix: modelName + 'EditWindow_'
                        });
                        if (! Ext.isFunction(Klb.App[appName][editDialogName].openWindow)) {
                            Klb.App[appName][editDialogName].openWindow  = function (cfg) {
                                var id = (cfg.record && cfg.record.id) ? cfg.record.id : 0;
                                var window = Klb.WindowFactory.getWindow({
                                    width: edp.windowWidth ? edp.windowWidth : 600,
                                    height: edp.windowHeight ? edp.windowHeight : 230,
                                    name: edp.windowNamePrefix + id,
                                    contentPanelConstructor: 'Klb.App.' + appName + '.' + editDialogName,
                                    contentPanelConstructorConfig: cfg
                                });
                                return window;
                            };
                        }
                    }
                    // create Gridpanel
                    var gridPanelName = modelName + 'GridPanel', 
                        gpConfig = {
                            modelConfig: modelConfig,
                            app: Klb.App[appName], 
                            recordProxy: Klb.App[appName][recordProxyName],
                            recordClass: Klb.App[appName].Model[modelName]
                        };
                        
                    if (! Klb.App[appName].hasOwnProperty(gridPanelName)) {
                        Klb.App[appName][gridPanelName] = Ext.extend(Klb.system.widgets.grid.GridPanel, gpConfig);
                    } else {
                        Ext.apply(Klb.App[appName][gridPanelName].prototype, gpConfig);
                    }
                }, this);
            }
        }, this);

        var stop = new Date();
    }
});
