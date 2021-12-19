/*
 * Modern 3.0
 * 
 * @license     http://www.gnu.org/licenses/agpl.html AGPL Version 3
 * @author      Philipp Schüle <p.schuele@metaways.de>
 * @copyright   Copyright (c) 2011 Metaways Infosystems GmbH (http://www.metaways.de)
 */
Ext.ns('Klb.system.widgets.grid');

/**
 * Link GridPanel
 * 
 * @namespace   Klb.system.widgets.grid
 * @class       Klb.system.widgets.grid.LinkGridPanel
 * @extends     Klb.system.widgets.grid.PickerGridPanel
 * 
 * <p>Link GridPanel</p>
 * <p><pre>
 * </pre></p>
 * 
 * @license     http://www.gnu.org/licenses/agpl.html AGPL Version 3
 * @author      Philipp Schüle <p.schuele@metaways.de>
 * 
 * @param       {Object} config
 * @constructor
 * Create a new Klb.system.widgets.grid.LinkGridPanel
 */
Ext.define('Klb.system.widgets.grid.LinkGridPanel', {
    extend: 'Klb.system.widgets.grid.PickerGridPanel',
    xtype: 'wdgt.linkgrid',
    /**
     * @cfg for PickerGridPanel
     */
    recordClass: Klb.system.Model.Relation,
    autoExpandColumn: 'name',
    enableTbar: true,
    clicksToEdit: 1,
    selectRowAfterAdd: false,

    /**
     * the record
     * @type Record 
     */
    record: null,
    
    /**
     * relation types can be stored in keyfield
     * @type 
     */
    relationTypesKeyfieldName: null,
    
    /**
     * relation types for combobox in editor grid
     * @type Array
     */
    relationTypes: null,
    
    /**
     * default relation type
     * @type String
     */
    defaultType: '',
    
    /**
     * @type Modern.Application 
     */
    app: null,
    
    typeColumnHeader: null,
    
    /**
     * @return Ext.grid.ColumnManager
     * @private
     */
    getColumnModel: function () {
        
        this.typeEditor = (this.relationTypesKeyfieldName) 
            ? new Klb.system.widgets.keyfield.ComboBox({
                app: this.app.appName,
                keyFieldName: this.relationTypesKeyfieldName
            }) 
            : (this.relationTypes) 
                ? new Ext.form.field.ComboBox({
                    displayField: 'label',
                    valueField: 'relation_type',
                    mode: 'local',
                    triggerAction: 'all',
                    lazyInit: false,
                    autoExpand: true,
                    blurOnSelect: true,
                    listClass: 'x-combo-list-small',
                    store: new Ext.data.SimpleStore({
                        fields: ['label', 'relation_type'],
                        data: this.relationTypes
                    })
                }) 
                : null;
        
        return new Ext.grid.ColumnManager({
            defaults: {
                sortable: true
            },
            columns:  [
                {   id: 'name', header: _('Name'), dataIndex: 'related_record', renderer: this.relatedRecordRender, scope: this}, {
                    id: 'type', 
                    header: (this.typeColumnHeader) ? this.typeColumnHeader : _('Type'), 
                    dataIndex: 'type', 
                    width: 100, 
                    sortable: true,
                    renderer: (this.relationTypesKeyfieldName) 
                        ? Klb.system.widgets.keyfield.Renderer.get(this.app.appName, this.relationTypesKeyfieldName) 
                        : this.relationTypeRenderer,
                    scope: this,
                    editor: this.typeEditor
                }
            ].concat(this.configColumns)
        });
    },
    
    /**
     * related record renderer
     * 
     * @param {Record} value
     * @return {String}
     */
    relatedRecordRender: function(value) {
        var result = '';
        
        if (value) {
            result = Ext.util.Format.htmlEncode(value.get(this.searchRecordClass.getMeta('titleProperty')));
        }
        
        return result;
    },
    
    /**
     * type renderer
     * 
     * @param {String} value
     * @return {String}
     */
    relationTypeRenderer: function(value) {
        var result = '';
        
        if (value) {
            result = this.app.i18n._(Ext.util.Format.capitalize(value));
        }
        
        return result;
    },
    
    /**
     * is called after selecting a record in the combo
     * 
     * @param {Klb.system.widgets.form.RecordPickerComboBox} picker the triggering combo box
     * @param {Klb.system.data.Record} recordToAdd
     */
    onAddRecordFromCombo: function(picker, recordToAdd) {

        // if no record is given, do nothing
        if (! recordToAdd) {
            return;
        }
        
        var record = new Klb.system.Model.Relation(Ext.apply({
            related_record: new this.newRecordClass(recordToAdd.data, recordToAdd.id),
            related_id: recordToAdd.id,
            own_id: (this.record) ? this.record.id : null
        }, picker.relationDefaults), recordToAdd.id);
        
        Klb.Logger.debug('Adding new relation:');
        Klb.Logger.debug(record);

        // check if already in
        if (this.store.findExact('related_id', recordToAdd.id) === -1) {
            this.store.add([record]);
        }
        
        picker.reset();
    },
    
    /**
     * populate store and set record
     * 
     * @param {Record} record
     */
    onRecordLoad: function(record) {
        if (this.record) {
            return;
        }
        
        this.record = record;

        Klb.Logger.debug('Loading relations into store...');
        if (record.get('relations') && record.get('relations').length > 0) {
            var relationRecords = [];
            Ext.each(record.get('relations'), function(relation) {
                relation.related_record = new this.searchRecordClass(
                    relation.related_record, 
                    relation.related_id
                );
                relationRecords.push(new Klb.system.Model.Relation(relation, relation.id));
                
            }, this);
            this.store.add(relationRecords);
        }
        
        // activate highlighting after initial load
        (function() {
            this.highlightRowAfterAdd = true;
        }).defer(400, this);
        
        // TODO perhaps we should filter all that do not match the model
    },
    
    /**
     * get relations data as array
     * 
     * @return {Array}
     */
    getData: function() {
        var relations = [];
        this.store.each(function(record) {
            record.data.related_record = record.data.related_record.data;
            relations.push(record.data);
        }, this);
        
        return relations;
    }
});
