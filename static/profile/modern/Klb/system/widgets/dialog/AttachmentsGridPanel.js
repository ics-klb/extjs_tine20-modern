
/*
 * Modern 3.0
 *
 * @package     Modern
 * @license     http://www.gnu.org/licenses/agpl.html AGPL Version 3
 * @author      Philipp Schüle <p.schuele@metaways.de>
 * @copyright   Copyright (c) 2013 Metaways Infosystems GmbH (http://www.metaways.de)
 *
 * TODO maybe we should generalize parts of this and have a common parent for this and Klb.system.widgets.relation.GenericPickerGridPanel
 * TODO add more columns
 * TODO allow to edit description
 */
Ext.ns('Klb.system.widgets.dialog');

/**
 * @namespace   Klb.system.widgets.dialog
 * @class       Klb.system.widgets.dialog.AttachmentsGridPanel
 * @extends     Klb.system.widgets.grid.FileUploadGrid
 * @author      Philipp Schüle <p.schuele@metaways.de>
 */
Ext.define('Klb.system.widgets.dialog.AttachmentsGridPanel', {
    extend: 'Klb.system.widgets.grid.FileUploadGrid',
    requires: ['Klb.system.widgets.dialog.MultipleEditDialogPlugin', 'Ext.ux.file.Download'],

    /**
     * @cfg for FileUploadGrid
     */
    filesProperty: 'attachments',

    /**
     * The calling EditDialog
     * @type Klb.system.widgets.dialog.EditDialog
     */
    editDialog: null,

    /**
     * title
     * 
     * @type String
     */
    title: null,

    /**
     * the record
     * @type Record
     */
    record: null,

    /**
     * @type Api.Application
     */
    app: null,
    
    /* config */
    frame: true,
    border: true,
    autoScroll: true,
    layout: { type: 'fit', padding: 0 },
    handlerUrl: Ext.empty,

    /**
     * initializes the component
     */
    initComponent: function() {

        this.record = this.editDialog.record;
        this.app = this.editDialog.app;

        this.title = this.i18nTitle = _('Attachments');
        this.i18nFileString = _('Attachment');

        Klb.system.widgets.dialog.MultipleEditDialogPlugin.prototype.registerSkipItem(this);

        this.editDialog.on('save', this.onSaveRecord, this);
        this.editDialog.on('load', this.onLoadRecord, this);

        this.callParent();

        this.initActions();
    },
    
    /**
     * get columns
     * @return Array
     */
    getColumns: function() {
                            
        var columns = [
         {
            xtype: 'actioncolumn',
            width: 30,
            header: _('Url'),
            icon: Klb.Common.RESOURCE_PATH + 'images/icons/zoom.png',
            handler: Ext.bind(this.handlerUrl, this)
        },            
            {
            resizable: true,
            dataIndex: 'name',
            width: 150,
            flex: 1,
            header: _('Name'),
            renderer: Ext.ux.PercentRendererWithName,
            sortable: true
        }, {
            resizable: true,
            dataIndex: 'size',
            width: 80,
            header: _('Size'),
            renderer: Ext.util.Format.fileSize,
            sortable: true
        }, {
            resizable: true,
            dataIndex: 'contenttype',
            width: 80,
            header: _('Content Type'),
            sortable: true
        },{  header: _('Creation Time'),   dataIndex: 'creation_time',  renderer: Klb.system.Common.dateRenderer,     width: 80,
            sortable: true },
          {  header: _('Created By'),      dataIndex: 'created_by',     renderer: Klb.system.Common.usernameRenderer, width: 80,
            sortable: true }
        ];
        
        return columns;
    },
    
    /**
     * init store
     * @private
     */
    initStore: function () {
        this.store = new Ext.data.SimpleStore({
            fields: Klb.system.Model.Node
        });
    },
    
    /**
     * initActions
     */
    initActions: function () {
        this.action_download = new Ext.Action({
            requiredGrant: 'readGrant',
            allowMultiple: false,
            actionType: 'download',
            text: _('Download'),
            handler: this.onDownload,
            iconCls: 'action_download',
            scope: this,
            disabled:true
        });
        this.actionUpdater.addActions([this.action_download]);
//        this.addDocked( this.action_download, 'top');
        this.contextMenu.add(this.action_download);        
        this.on('rowdblclick', this.onDownload.bind(this), this);
    },
    
    renderUrl: function(value, metaData, record, rowIndex, colIndex, store, view) {

        return new Ext.ux.util.ImageURL({
                                id: record.get('id'),
                                width: 100,
                                height: 70,
                                ratiomode: 0
                            }).toString();
        
    },

    /**
     * is called from onApplyChanges of the edit dialog per save event
     * 
     * @param {Klb.system.widgets.dialog.EditDialog} dialog
     * @param {Klb.system.data.Record} record
     * @param {Function} ticket
     * @return {Boolean}
     */
    onSaveRecord: function(dialog, record, ticket) {

        var interceptor = ticket();
        if (record.data.hasOwnProperty('attachments')) {
            delete record.data.attachments;
        }
        var attachments = this.getData();
            record.set('attachments', attachments);

        interceptor();
    },
    
    /**
     * updates the title ot the tab
     * @param {Integer} count
     */
    updateTitle: function(count) {

        count = Ext.isNumber(count) ? count : this.store.getCount();
        this.setTitle(this.i18nTitle + ' (' + count + ')');
    },
    
    /**
     * populate store
     * 
     * @param {EditDialog} dialog
     * @param {Record} record
     * @param {Function} ticketFn
     */
    addFromRecord: function(record) {
        var attachments = record.get('attachments');
    
        if (attachments && attachments.length > 0) {
            this.updateTitle(attachments.length);
            var attachmentRecords = [];
            
            Ext.each(attachments, function(attachment) {
                attachmentRecords.push(new Klb.system.Model.Node(attachment, attachment.id));
            }, this);
            this.store.add(attachmentRecords);
        } else {
            this.updateTitle(0);
        }
        
        // add other listeners after population
        if (this.store) {
            this.store.on('update', this.updateTitle, this);
            this.store.on('add', this.updateTitle, this);
            this.store.on('remove', this.updateTitle, this);
        }        
    },

    onLoadRecord: function(dialog, record, ticketFn) {
        this.store.removeAll();
        var interceptor = ticketFn();
        this.addFromRecord(record);
        interceptor();
    },

    /**
     * get attachments data as array
     * 
     * @return {Array}
     */
    getData: function() {
        var attachments = [];
        
        this.store.each(function(attachment) {
            attachments.push(attachment.data);
        }, this);

        return attachments;
    },
    
    /**
     * download file
     * 
     * @param {} button
     * @param {} event
     */
    onDownload: function(button, event) {
        var selectedRows = this.getSelectionModel().getSelection(),
            fileRow = selectedRows[0],
            recordId = this.record.id;
        
        // TODO should be done by action updater
        if (! recordId || Ext.isObject(fileRow.get('tempFile'))) {
            Klb.Logger.debug('Klb.system.widgets.dialog.AttachmentsGridPanel::onDownload - file not yet available for download');
            return;
        }
        
        Klb.Logger.debug('Klb.system.widgets.dialog.AttachmentsGridPanel::onDownload - selected file:');
        Klb.Logger.debug(fileRow);
        
        var downloader = new Ext.ux.file.Download({
            params: {
                method: 'Api.downloadRecordAttachment',
                requestType: 'HTTP',
                nodeId: fileRow.id,
                recordId: recordId,
                modelName: this.app.name + '_Model_' + this.editDialog.modelName
            }
        }).start();
    }
});
