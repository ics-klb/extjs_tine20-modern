/*
 * Modern 3.0
 * 
 * @package     Modern
 * @license     http://www.gnu.org/licenses/agpl.html AGPL Version 3
 * @author      Alexander Stintzing <a.stintzing@metaways.de>
 * @copyright   Copyright (c) 2009-2012 Metaways Infosystems GmbH (http://www.metaways.de)
 *
 */

Ext.ns('Klb.system.widgets.relation');

/**
 * @namespace   Klb.system.widgets.remarks
 * @class       Klb.system.widgets.remarks.Manager
 * @author      Alexander Stintzing <a.stintzing@metaways.de>
 */
Klb.system.widgets.remarks.Manager = function() {

    var items = {};
    var ignoreApplications = ['Admin', 'Setup', 'Modern', 'ActiveSync'];

    return {
        /**
         * returns the remarks config
         * @param {String/Klb.system.Application} app
         * @param {String/Klb.system.data.Record} recordClass
         * @param {Array} ignoreModels the php model names to ignore (they won't be returned)
         */
        get: function(app, recordClass, ignoreModels) {
            var key = this.getKey(app, recordClass);

            // create if not cached
            if(items[key] === undefined) {
                this.create(recordClass, key);
            }
            
            var allRelations = items[key];
            var usedRelations = [];
            // sort out ignored models
            if (ignoreModels) {
                Ext.each(allRelations, function(relation) {
                    if(ignoreModels.indexOf(relation.remarkdApp + '_Model_' + relation.remarkdModel) == -1) {
                        usedRelations.push(relation);
                    }
                }, this);
            } else {
                return allRelations;
            }
            
            return usedRelations;
        },

        /**
         * returns the remarks config existence
         * @param {String/Klb.system.Application} app
         * @param {String/Klb.system.data.Record} recordClass
         * @return {Boolean}
         */
        has: function(app, recordClass) {
            var key = this.getKey(app, recordClass);
            
            // create if not cached
            if(items[key] === undefined) this.create(recordClass, key);
            return items[key] ? true : false;
        },

        /**
         * creates the remarks config if found in registry
         * @param Klb.system.data.Record recordClass
         * @param {String} key
         * @return {Boolean}
         */
        create: function(recordClass, key) {
            var registered = [];
            if(!items[key]) items[key] = [];

            // add generic remarks when no config exists
            Klb.system.data.RecordMgr.each(function(rec) {
                if (Klb.system.Common.hasRight('run', rec.getMeta('appName')) && (ignoreApplications.indexOf(rec.getMeta('appName')) == -1) && (rec.prototype.getFieldNames().indexOf('remarks') > -1)) {
                    items[key].push({
                        ownModel: recordClass.getMeta('recordName'),
                        remarkdApp: rec.getMeta('appName'),
                        remarkdModel: rec.getMeta('modelName'),
                        text: rec.getRecordName() + ' (' + rec.getAppName() + ')'
                    });
                }
            });

            // set to false, so not try again
            if(items[key].length == 0) items[key] = false;
        },

        /**
         * returns the key (appName + modelName)
         * @param {String/Klb.system.Application} appName
         * @param {String/Klb.system.data.Record} modelName
         * @return {String}
         */
        getKey: function(appName, modelName) {
            var appName = Klb.system.Common.resolveApp(appName);
            var modelName = Klb.system.Common.resolveModel(modelName);
            return appName + modelName;
        }
    };

}();
