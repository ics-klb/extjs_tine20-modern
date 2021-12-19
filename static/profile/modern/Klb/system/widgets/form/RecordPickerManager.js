/*
 * Modern 3.0
 * 
 * @package     Modern
 * @license     http://www.gnu.org/licenses/agpl.html AGPL Version 3
 * @author      Alexander Stintzing <alex@stintzing.net>
 * @copyright   Copyright (c) 2009-2011 Metaways Infosystems GmbH (http://www.metaways.de)
 *
 */

Ext.ns('Klb.system.widgets.form', 'Klb.system.widgets.form.RecordPickerManager');
 
 /**
 * @namespace   Klb.system.widgets.form
 * @class       Klb.system.widgets.form.RecordPickerManager
 * @author      Alexander Stintzing <a.stintzing@metaways.de>
 */

Klb.system.widgets.form.RecordPickerManager = function() {

    var items = {};
  
    return {
        /**
         * returns a registered recordpicker or creates the default one
         * @param {String/Modern.Application} appName      expands to recordClass: Klb.App[appName].Model[modelName],
         * @param {String/Modern.data.Record} modelName               recordProxy: Klb.App[appName][modelName.toLowerCase() + 'Backend'])
         * @param {Object} config       additional Configuration
         * @return {Object} recordpicker
         */
        get: function(appName, modelName, config) {
            config = config || {};
    
            var appName = Ext.isString(appName) ? appName : appName.appName,
                modelName = Ext.isFunction(modelName) ? modelName.getMeta('modelName') : modelName,
                key = appName+modelName;

            if(items[key]) {   // if registered
                if(Ext.isString(items[key])) { // xtype
                    return Ext.ComponentMgr.create(config, items[key]);
                } else {
                    return new items[key](config);
                }
            } else {    // not registered, create default
                var defaultconfig = {
                    recordClass: Klb.system.data.RecordMgr.get(appName, modelName),
                    recordProxy: Klb.App[appName][modelName.toLowerCase() + 'Backend'],
                    loadingText: _('Searching...')
                };
                Ext.apply(defaultconfig, config);
                return new Klb.system.widgets.form.RecordPickerComboBox(defaultconfig);
            }
        },
        
        /**
         * Registers a component
         * @param {String} appName          the application registered for
         * @param {String} modelName        the registered model name
         * @param {String/Object} component the component or xtype to register 
         */
        register: function(appName, modelName, component) {
            
            if(!Klb.hasOwnProperty('log')) {
                Ext.Function.defer(this.register, 100, this, [appName, modelName, component]);
                return false;
            }
            
            var appName = Ext.isString(appName) ? appName : appName.appName,
                modelName = Ext.isFunction(modelName) ? modelName.getMeta('modelName') : modelName,
                key = appName+modelName;

            if(!items[key]) {
                Klb.Logger.debug('RecordPickerManager::registerItem: ' + appName + modelName);
                items[key] = component;
            }
        }
    };
}();
