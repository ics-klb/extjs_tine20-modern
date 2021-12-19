/*
 * Modern 3.1.0
 * 
 * @license     http://www.gnu.org/licenses/agpl.html AGPL Version 3
 * @author      Philipp Schüle <p.schuele@metaways.de>
 * @copyright   Copyright (c) 2010-2011 Metaways Infosystems GmbH (http://www.metaways.de)
 * @version     $Id
 */
 
Ext.ns('Klb.system.widgets.grid');

/**
 * @namespace   Klb.system.widgets.grid
 * @class       Klb.system.widgets.grid.FileUploadGrid
 * @extends     Ext.grid.GridPanel
 * 
 * @author      Philipp Schüle <p.schuele@metaways.de>
 * @copyright   Copyright (c) 2010-2011 Metaways Infosystems GmbH (http://www.metaways.de)
 * @license     http://www.gnu.org/licenses/agpl.html AGPL Version 3
 * 
 * @param       {Object} config
 * 
 * @constructor Create a new  Klb.system.widgets.grid.FileUploadGrid
**/
Ext.define('Klb.system.widgets.grid.FileUploadGrid', {
    extend: 'Klb.abstract.GridBase',
    requires: [
        'Ext.ux.file.Upload',
        'Ext.ux.file.BrowsePlugin',
        'Ext.grid.column.Action',
        'Ext.ProgressBarWidget'
    ],
    /**
     * @cfg filesProperty
     * @type String
     */
    filesProperty: 'files',
    
    /**
     * @cfg showTopToolbar
     * @type Boolean
     * TODO     think about that -> when we deactivate the top toolbar, we lose the dropzone for files!
     */
    //showTopToolbar: null,
    
    /**
     * config values
     * @private
     */
    header: false,
    border: false,
    deferredRender: false,
    autoExpandColumn: 'name',
    showProgress: true,
    
    i18nFileString: null,
    
    /**
     * init
     * @private
     */
    initComponent: function () {
        this.i18nFileString = this.i18nFileString ? this.i18nFileString : _('File');
        
        this.record = this.record || null;
        if ( this.record ) {
            this.id = this.id + this.record.getId();
        }
        
     // init actions
        this.actionUpdater = new Klb.system.widgets.ActionUpdater({
            containerProperty: 'container_id', 
            evalGrants: false
        });
        
        this.initToolbarAndContextMenu();
        this.initStore();
        this.initColumnModel();
        this.initSelectionModel();
        
//        this.plugins = [ new Ext.ux.grid.GridViewMenuPlugin({}) ];
        this.enableHdMenu = false;
      
        this.on('rowcontextmenu', function (grid, row, e) {
            e.stopEvent();
            var selModel = grid.getSelectionModel();
            if (! selModel.isSelected(row)) {
                selModel.selectRow(row);
            }
            this.contextMenu.showAt(e.getXY());
        }, this);

        if (! this.record || this.record.id == 0) {
            this.on('rowdblclick', function (grid, row, e) {
                e.stopEvent();
                this.onDownload();
            }, this);
        }

        this.callParent();
    },
    
    /**
     * on upload failure
     * @private
     */
    onUploadFail: function (uploader, fileRecord) {
        
        var dataSize;
        if (fileRecord.html5upload) {
            dataSize = dataSize = Klb.App.Api.registry.get('maxPostSize');
        }
        else {
            dataSize = Klb.App.Api.registry.get('maxFileUploadSize');
        }
        
        Ext.MessageBox.alert(
            _('Upload Failed'), 
            _('Could not upload file. Filesize could be too big. Please notify your Administrator. Max upload size:') + ' ' + parseInt(dataSize, 10) / 1048576 + ' MB'
        ).setIcon(Ext.MessageBox.ERROR);
        
      this.getStore().remove(fileRecord);
      if(this.loadMask) this.loadMask.hide();
    },
    
    /**
     * on remove
     * @param {} button
     * @param {} event
     */
    onRemove: function (button, event) {
        
        var selected = this.getSelectionModel().getSelection(); // getSelected() - private
        if ( selected )
        for (var i = 0; i < selected.length; i += 1) {
            
             this.store.remove(selected[i]);
             if ( selected[i].get('uploadKey') )  { // uploaded session window
                var upload = Klb.system.uploadManager.getUpload(selected[i].get('uploadKey'));
                     upload.setPaused(true);
             }
        }
    },
    
    
    /**
     * on pause
     * @param {} button
     * @param {} event
     */
    onPause: function (button, event) {
 
        var selectedRows = this.getSelectionModel().getSelection();
        for(var i=0; i < selectedRows.length; i++) {
            var upload = Klb.system.uploadManager.getUpload(selectedRows[i].get('uploadKey'));
            upload.setPaused(true);
        }       
        this.getSelectionModel().deselectRange(0, this.getSelectionModel().getCount());
    },

    
    /**
     * on resume
     * @param {} button
     * @param {} event
     */
    onResume: function (button, event) {

        var selectedRows = this.getSelectionModel().getSelection();
        for(var i=0; i < selectedRows.length; i++) {
            var upload = Klb.system.uploadManager.getUpload(selectedRows[i].get('uploadKey'));
            upload.resumeUpload();
        }
        this.getSelectionModel().deselectRange(0, this.getSelectionModel().getCount());
    },

    
    /**
     * init toolbar and context menu
     * @private
     */
    initToolbarAndContextMenu: function () {
        
        this.action_add = new Ext.Action(this.getAddAction());

        this.action_remove = new Ext.Action({
            text:  Ext.String.format(_('Remove {0}'), this.i18nFileString),
            iconCls: 'action_remove',
            scope: this,
            disabled: true,
            handler: this.onRemove
        });
        
        this.action_pause = new Ext.Action({
            text: _('Pause upload'),
            iconCls: 'action_pause',
            scope: this,
            handler: this.onPause,
            actionUpdater: this.isPauseEnabled
        });
        
        this.action_resume = new Ext.Action({
            text: _('Resume upload'),
            iconCls: 'action_resume',
            scope: this,
            handler: this.onResume,
            actionUpdater: this.isResumeEnabled
        });
        
        this.dockedItems = [{
                xtype: 'toolbar',
                dock: 'top',
                items: [
                    this.action_add,
                    this.action_remove
                ]
          }];
        
        this.contextMenu = new Ext.menu.Menu({
            items:  [
                 this.action_remove,
                 this.action_pause,
                 this.action_resume
            ]
        });
        
        this.actionUpdater.addActions([
            this.action_pause,
            this.action_resume
        ]);

    },
    
    /**
     * init store
     * @private
     */
    initStore: function () {
        this.store = new Ext.data.SimpleStore({
            fields: Ext.ux.file.Upload.file
        });

        this.store.on('add', this.onStoreAdd, this);

        this.loadRecord(this.record);
    },

    onStoreAdd: function(store, records, idx) {
        Ext.each(records, function (attachment) {
            if (attachment.get('url')) {
                // we can't use Ext.data.connection here as we can't control xhr obj. directly :-(
                var me = this,
                    url = attachment.get('url'),
                    name = url.split('/').pop(),
                    xhr = new XMLHttpRequest();

                xhr.open('GET', url, true);
                xhr.responseType = 'blob';

                store.suspendEvents();
                attachment.set('name', name);
                attachment.set('type', name.split('.').pop());
                store.resumeEvents();

                xhr.onprogress = function (e) {
                    var progress = Math.floor(100 * e.loaded / e.total) + '% loaded';
                    console.log(e);
                };

                xhr.onload = function (e) {
                       attachment.set('type', xhr.response.type);
                       attachment.set('size', xhr.response.size);

                    var upload = Ext.create('Ext.ux.file.Upload',{
                        file: new File([xhr.response], name),
                        type: xhr.response.type,
                        size: xhr.response.size
                    });
                    // work around chrome bug which dosn't take type from blob
                    upload.file.fileType = xhr.response.type;

                    var uploadKey = Klb.system.uploadManager.queueUpload(upload);
                    var fileRecord = Klb.system.uploadManager.upload(uploadKey);

                    upload.on('uploadfailure', me.onUploadFail, me);
                    upload.on('uploadcomplete', me.onUploadComplete, fileRecord);
                    upload.on('uploadstart', Klb.system.uploadManager.onUploadStart, me);

                    store.remove(attachment);
                    store.add(fileRecord);

                };

                xhr.send();

            }
        }, this);
    },

    /**
     * On download attached file from panel
     */
    onDownload: function() {
        var selectedRows = this.getSelectionModel().getSelection();

        selectedRows.forEach(function (attachement) {
            new Ext.ux.file.Download({
                params: {
                    requestType: 'HTTP',
                    method: 'Api.downloadTempfile',
                    tmpFileId: attachement.get('id')
                }
            }).start();
        });
    },

    /**
     * returns add action
     * 
     * @return {Object} add action config
     */
    getAddAction: function () {

        action_add = {
            text:  Ext.String.format(_('Add {0}'), this.i18nFileString),
            iconCls: 'action_add',
            scope: this,
            plugins: [{
                ptype: 'ux.browseplugin',
                multiple: true,
                dropElSelector: 'div[id=' + this.id + ']'
            }],
            handler: this.onFilesSelect
        };
        
       return action_add;
    },
    
    /**
     * populate grid store
     *
     * @param {} record
     */
    loadRecord: function (record) {
        if (record && record.get(this.filesProperty)) {
            var files = record.get(this.filesProperty);
            for (var i = 0; i < files.length; i += 1) {
                var file = new Ext.ux.file.Upload.file(files[i]);
                file.data.status = 'complete';
                this.store.add(file);
            }
        }
    },
    
    /**
     * init cm
     * @private
     */
    initColumnModel: function () {
        this.columns = this.getColumns(); // new Ext.grid.ColumnManager(this.getColumns());
    },
    
    getColumns: function() {

        var columns = [{
            resizable: true,
            dataIndex: 'name',
            width: 300,
            header: _('name'),
            renderer: Ext.ux.PercentRendererWithName
        }, {
            resizable: true,
            dataIndex: 'size',
            width: 70,
            header: _('size'),
            renderer: Ext.util.Format.fileSize
        }, {
            resizable: true,
            dataIndex: 'type',
            width: 70,
            header: _('type')
            // TODO show type icon?
            //renderer: Ext.util.Format.fileSize
        }];
        
        return columns;
    },

    /**
     * selModel: {
     *         selType: 'cellmodel',
     *         mode   : 'MULTI'
     *     }
     * init sel model
     * @private
       */
    initSelectionModel: function () {
        this.selModel = Ext.create('Ext.selection.CellModel', { mode: 'MULTI'} );
        
        this.selModel.on('selectionchange', function (selModel) {
            var rowCount = selModel.getCount();
            this.action_remove.setDisabled(rowCount === 0);
            this.actionUpdater.updateActions(selModel);

        }, this);
    },
    
    /**
     * upload new file and add to store
     * 
     * @param {} btn
     * @param {} e
     */
    onFilesSelect: function (fileSelector, e) {

        var files = fileSelector.getFileList();
        Ext.each(files, function (file) {

            var upload = new Ext.ux.file.Upload({
                file: file,
                fileSelector: fileSelector
            });

            upload.on('uploadfailure', this.onUploadFail, this);
            upload.on('uploadcomplete', this.onUploadComplete, fileRecord);
            upload.on('uploadstart', Klb.system.uploadManager.onUploadStart, this);

            var uploadKey = Klb.system.uploadManager.queueUpload(upload);
            var fileRecord = Klb.system.uploadManager.upload(uploadKey);

            if(fileRecord.get('status') !== 'failure' ) {
                this.store.add(fileRecord);
            }
        }, this);
        
    },
    
    onUploadComplete: function(upload, fileRecord) {
    
            fileRecord.beginEdit();
            fileRecord.set('status', 'complete');
            fileRecord.set('progress', 100);
            fileRecord.commit(false);
        Klb.system.uploadManager.onUploadComplete();
    },
    
    /**
     * returns true if files are uploading atm
     * 
     * @return {Boolean}
     */
    isUploading: function () {
        var uploadingFiles = this.store.query('status', 'uploading');
        return (uploadingFiles.getCount() > 0);
    },
    
    isPauseEnabled: function(action, grants, records) {
         
        for(var i=0; i<records.length; i++) {
            if(records[i].get('type') === 'folder') {
                action.hide();
                return;
            }
        }
        
        for(var i=0; i < records.length; i++) {
            if(!records[i].get('status') || (records[i].get('type ') !== 'folder' && records[i].get('status') !== 'paused'
                    &&  records[i].get('status') !== 'uploading' && records[i].get('status') !== 'pending')) {
                action.hide();
                return;
            }
        }
        
        action.show();
        
        for(var i=0; i < records.length; i++) {
            if(records[i].get('status')) {
                action.setDisabled(false);
            }
            else {
                action.setDisabled(true);
            }
            if(records[i].get('status') && records[i].get('status') !== 'uploading'){
                action.setDisabled(true);
            }
            
        }             
    },

    isResumeEnabled: function(action, grants, records) {
        for(var i=0; i<records.length; i++) {
            if(records[i].get('type') === 'folder') {
                action.hide();
                return;
            }
        }
       
        for(var i=0; i < records.length; i++) {
            if(!records[i].get('status') || (records[i].get('type ') !== 'folder' &&  records[i].get('status') !== 'uploading' 
                    &&  records[i].get('status') !== 'paused' && records[i].get('status') !== 'pending')) {
                action.hide();
                return;
            }
        }
        
        action.show();
        
        for(var i=0; i < records.length; i++) {
            if(records[i].get('status')) {
                action.setDisabled(false);
            }
            else {
                action.setDisabled(true);
            }
            if(records[i].get('status') && records[i].get('status') !== 'paused'){
                action.setDisabled(true);
            }
            
        }   
    }
});
