/*
 * Modern 3.1.0
 * 
 * @package     Modern
 * @license     http://www.gnu.org/licenses/agpl.html AGPL Version 3
 * @author      Alexander Stintzing <a.stintzing@metaways.de>
 * @copyright   Copyright (c) 2012 Metaways Infosystems GmbH (http://www.metaways.de)
 *
 */

Ext.ns('Klb.system.widgets.editDialog');

/**
 * @namespace   Klb.system.widgets.editDialog
 * @class       Klb.system.widgets.dialog.AddRelationsDialogPlugin
 * @author      Alexander Stintzing <a.stintzing@metaways.de>
 * 
 * @plugin for Klb.system.widgets.editDialog
 */
Klb.system.widgets.dialog.AddRelationsEditDialogPlugin = function(config) {
    Ext.apply(this, config);
};

Klb.system.widgets.dialog.AddRelationsEditDialogPlugin.prototype = {
    /**
     * the recordClass of the calling component
     * @type {Ext.data.Model} recordClass
     */
    recordClass: null,
    
    /**
     * the editDialog the plugin is applied to
     * @type {Klb.system.widgets.dialog.EditDialog} editDialog
     */
    editDialog : null,
    
    /**
     * relations to add
     * @type {Array}
     */
    addRelations: null,
    
    /**
     * the selection filter
     * @type {Object} selectionFilter
     */
    selectionFilter: null,
    
    /**
     * the application name of the calling component
     * @type {String} callingApp
     */
    callingApp: null,
    
    /**
     * the model name of the calling component
     * @type {String} callingModel
     */
    callingModel: null,
    
    /**
     * the configuration for the relations
     * @type {Object} relationConfig
     */
    relationConfig: null,
    
    /**
     * the record proxy of the calling app
     * @type {Klb.system.data.RecordProxy} recordProxy
     */
    recordProxy: null,
    
    /**
     * initializes the plugin
     * @var {Klb.system.widgets.dialog.EditDialog} ed
     */    
    init: function(ed) {
        
        ed.on('load', function(editDialog, record, ticketFn) {
            this.interceptor = ticketFn();
            this.fetchRecords();
        }, this);
        
        Klb.Logger.info('Init plugin "Klb.system.widgets.dialog.AddRelationsDialogPlugin"...');
        // fetch default relation config is none is given
        this.relationConfig = this.relationConfig ? this.relationConfig : {};
        Ext.each(ed.app.getRegistry().get('relatableModels'), function(rc) {
            if(rc.relatedApp == this.callingApp && rc.relatedModel == this.callingModel) {
                Ext.applyIf(this.relationConfig, rc['default']);
                return false;
            }
        }, this);
        
        this.editDialog = ed;
        this.recordClass = Klb.App[this.callingApp].Model[this.callingModel];
        this.recordProxy = new Klb.system.data.RecordProxy({
            recordClass: this.recordClass
        });
    },
    
    /**
     * hook in after this.editDialog.initRecord
     */
    fetchRecords: function() {
        if(Ext.isBoolean(this.addRelations)) {
            Klb.Logger.debug('Fetching additional records...');
            this.recordProxy.searchRecords(this.selectionFilter, null, {
                scope: this,
                success: function(result) {
                    this.addRelationsOnLoad(result.records);
                }
            });
        } else {
            var records = [];
            Ext.each(this.addRelations, function(plainRecord) {
                records.push(this.recordProxy.recordReader({responseText: Ext.encode(plainRecord)}));
            }, this)
            this.addRelationsOnLoad(records);
        }
    },
    
    /**
     * adds the relations to the record
     * @param {Array} records
     */
    addRelationsOnLoad: function(records) {
        var ownIdProperty = this.editDialog.recordClass.getMeta('idProperty'),
            foreignIdProperty = this.recordClass.getMeta('idProperty');

        var addRelations = [];
        Ext.each(records, function(record) {
            var add = true;
            Ext.each(this.editDialog.record.get('relations'), function(existingRelation) {
                if((record.get(foreignIdProperty) == existingRelation.related_record[foreignIdProperty])) {
                    add = false;
                    return;
                }
            }, this);

            if(add) {
                if(record.data.hasOwnProperty('relations')) {
                    delete record.data.relations;
                }
                var relation = {
                    own_backend: "Sql",
                    own_degree: "sibling",
                    own_id: this.editDialog.record.get(ownIdProperty),
                    own_model: this.editDialog.app.name + '_Model_' + this.editDialog.recordClass.getMeta('modelName'),
                    related_backend: "sql",
                    related_id: record.get(foreignIdProperty),
                    related_model: this.callingApp + '_Model_' + this.callingModel,
                    related_record: record.data,
                    remark: "",
                    type: ""
                };
                Ext.apply(relation, this.relationConfig);
                addRelations.push(relation);
            }
        }, this);
        var existing = this.editDialog.record.data.hasOwnProperty('relations') ? this.editDialog.record.data.relations : [];
        Ext.each(existing, function(existingRecord) {
            if(existingRecord.related_record.hasOwnProperty('relation')) {
                delete existingRecord.related_record.relation;
            }
        }, this);

        this.editDialog.record.set('relations', existing.concat(addRelations));
        this.interceptor();
    }
};

Ext.ComponentManager.create('adddependence_edit_dialog', Klb.system.widgets.dialog.AddRelationsEditDialogPlugin);