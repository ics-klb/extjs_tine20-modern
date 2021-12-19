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
 * @namespace   Klb.system.widgets.relation
 * @class       Klb.system.widgets.relation.Manager
 * @author      Alexander Stintzing <a.stintzing@metaways.de>
 */
Klb.system.widgets.relation.Manager = function() {

    var items = {};
    var ignoreApplications = ['Admin', 'Setup', 'Api', 'ActiveSync'];

    return {
        /**
         * returns the relations config
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
                    if(ignoreModels.indexOf(relation.relatedApp + '_Model_' + relation.relatedModel) == -1) {
                        usedRelations.push(relation);
                    }
                }, this);
            } else {
                return allRelations;
            }
            
            return usedRelations;
        },

        /**
         * returns the relations config existence
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
         * creates the relations config if found in registry
         * @param Klb.system.data.Record recordClass
         * @param {String} key
         * @return {Boolean}
         */
        create: function(recordClass, key) {
            var registered = [];
            if(!items[key]) items[key] = [];

            // add generic relations when no config exists
            Klb.system.data.RecordMgr.each(function(rec) {
                if (Klb.system.Common.hasRight('run', rec.getMeta('appName')) && (ignoreApplications.indexOf(rec.getMeta('appName')) == -1) && (rec.getFieldNames().indexOf('relations') > -1)) {
                    items[key].push({
                        ownModel: recordClass.getMeta('recordName'),
                        relatedApp: rec.getMeta('appName'),
                        relatedModel: rec.getMeta('modelName'),
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
        },
        
        getRelationDefaults: function(record) {
            return {
                own_backend: 'Sql',
                noted_backend: 'Sql',
                own_id: (record) ? record.id : null
            };
        },        

        getFilersFromRelation: function(operator, record, modelRecord, options) {
            // @TODO whipe some models?
//            this.fullModelName = this.recordClass.getMeta('appName') + '_Model_' + this.recordClass.getMeta('modelName');           
            var _output = { operator: operator, Model: modelRecord, Filters: [], Relations: [] },
                _relatedModel, _relatedRecord, 
                _keyApp, _filter, _filtersRelated = [];

                options = options || {}; // { field: 'id', operator: 'equals', linkType = "relation" };

             var _relations = record.get('relations');
             if ( _relations  && _relations.length > 0 ) {
                   Ext.each( _relations, function(item) {    
//console.log(item);
                       _relatedModel = item.related_model;
                       _relatedRecord = item.related_record;
                       _keyApp = _relatedModel.split('_');

                       if ( options && options.type == 'foreign' )
                       {
                               _filter = {
                                    field: "foreignRecord",         
                                    operator: "AND",
                                    filters: { linkType: "foreignId",  // relation foreignId
                                               appName:  _keyApp[0],
                                               modelName: _keyApp[2],
                                               filterName:  _keyApp[2] + 'QueryFilter',                                     
                                               value: {
                                                  field: "id", 
                                                  operator: 'equals',
                                                  value: item.related_id
                                               }
                                    }
                               };
                       }  else {
                         _filter = {
                             field:'id', operator:'equals', value: item.related_id
                          };
                      };

                     _filtersRelated.push( _filter );
//                     _filtersRelated.push( { condition: 'OR', filters: _filter } );
                     
                        var _recordRelation = new Klb.system.Model.Relation(Ext.apply({
                                 related_record: Ext.create(modelRecord, { data: _relatedRecord.data, id: item.id} ),
                                 related_id: item.related_id,
                                 own_id: record.id ? record.id : null
                           }, this.getRelationDefaults() ), item.id);

                    _output.Relations.push( _recordRelation );

                   }, this);

//                   _output.Filters = _filtersRelated;
                _output.Filters.push( { condition: 'OR', filters: _filtersRelated } );
              }

            
          return _output;
        }
        
    };

}();