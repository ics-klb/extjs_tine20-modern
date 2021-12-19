/*
 * Klb Desktop 3.0.1
 * 
 * @package     Modern
 * @subpackage  Content.Common
 * @copyright   Copyright (c) 2018 LLC ICS (http://www.icstime.com)
 * @license     http://www.gnu.org/licenses/agpl.html AGPL Version 3
 */

Ext.ns('KlbDesktop.MVC.Filemanager');

/**
 * File grid panel
 * 
 * @namespace   KlbDesktop.MVC.Filemanager
 * @class       KlbDesktop.MVC.Filemanager.NodeGridPanel
 * @extends     Klb.system.widgets.grid.GridPanel
 */
Ext.define('KlbDesktop.MVC.Filemanager.view.NodeGridPanel', {
    extend:  'Klb.system.widgets.grid.GridPanel',
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
    showTopToolbar: null,
    
    /**
     * config values
     * @private
     */
    deferredRender: false,
    autoExpandColumn: 'name',
    showProgress: true,

    hasDetailsPanel: false,
    evalGrants: true,
    
    /**
     * grid specific
     * @private
     */
    defaultSortInfo: {field: 'name', direction: 'DESC'},
    gridConfig: {
        autoExpandColumn: 'name',
        enableFileDialog: false,
        enableDragDrop: true,
        ddGroup: 'fileDDGroup'
    },
     
    ddGroup : 'fileDDGroup',  
    currentFolderNode : '/',
    
    /**
     * inits this cmp
     * @private
     */
    initComponent: function() {
        var me = this;

        me.plugins = me.plugins || [];
        me.recordClass = KlbDesktop.MVC.Filemanager.Model.Node;
        me.recordProxy = KlbDesktop.MVC.Filemanager.fileRecordBackend;

        me.gridConfig.columns = me.getColumnModel();
        
        me.defaultFilters = [
            {field: 'query', operator: 'contains', value: ''},
            {field: 'path', operator: 'equals', value: '/'}
        ];
        
        me.filterToolbar = me.filterToolbar || me.getFilterToolbar();
        me.filterToolbar.getQuickFilterPlugin().criteriaIgnores.push({field: 'path'});

        me.plugins.push(me.filterToolbar);
        me.plugins.push({
            ptype: 'ux.browseplugin',
            multiple: true,
            scope: me,
            enableFileDialog: false,
            handler: me.onFilesSelect
        });
        
        me.callParent();

        me.getStore().on('load', me.onLoad);
        Klb.system.uploadManager.on('update', me.onUpdate);
    },
    
    initFilterPanel: function() {},
    
    /**
     * after render handler
     */
    afterRender: function() {
        this.callParent();
        this.action_upload.setDisabled(true);
        this.initDropTarget();
        this.currentFolderNode = this.app.getMainScreen().getWestPanel().getContainerTreePanel().getRootNode();        
    },
    
    /**
     * returns cm
     * 
     * @return Ext.grid.ColumnModel
     * @private
     * 
     * TODO    add more columns
     */
    getColumnModel: function(){

        var _columns = [{
                header: this.app.i18n._('Tags'),
                dataIndex: 'tags',
                width: 20,
                renderer: Klb.system.Common.tagsRenderer,
                sortable: false,
                hidden: false
            }, {
                header: this.app.i18n._("Name"),
                width: 170,
                flex: 1,
                sortable: true,
                dataIndex: 'name',
                renderer: Ext.ux.PercentRendererWithName
            }, {
                header: this.app.i18n._("Size"),
                width: 40,
                sortable: true,
                dataIndex: 'size',
                renderer: Klb.system.Common.byteRenderer
            }, {
                header: this.app.i18n._("Contenttype"),
                width: 50,
                sortable: true,
                dataIndex: 'contenttype',
                renderer: function(value, metadata, record) {                    
                    var app = Klb.system.appMgr.get('Filemanager');
                    if(record.data.type == 'folder') {
                        return app.i18n._("Folder");
                    }
                    else {
                        return value;
                    }
                }
            }, {
                header: this.app.i18n._("Creation Time"),
                width: 50,
                sortable: true,
                dataIndex: 'creation_time',
                renderer: Klb.system.Common.dateTimeRenderer
            }, {
                header: this.app.i18n._("Created By"),
                width: 50,
                sortable: true,
                dataIndex: 'created_by',
                renderer: Klb.system.Common.usernameRenderer
            }, {
                header: this.app.i18n._("Last Modified Time"),
                width: 80,
                sortable: true,
                dataIndex: 'last_modified_time',
                renderer: Klb.system.Common.dateTimeRenderer
            }, {
                header: this.app.i18n._("Last Modified By"),
                width: 50,
                sortable: true,
                dataIndex: 'last_modified_by',
                renderer: Klb.system.Common.usernameRenderer 
            }, {
                header: this.app.i18n._("Revision"),
                width: 10,
                sortable: true,
                dataIndex: 'revision',
                renderer: function(value, metadata, record) {
                    if(record.data.type == 'folder') {
                        return '';
                    }
                    else {
                        return value;
                    }
                }
            } 
        ];
        
        // var headerCt = Ext.create('Ext.grid.header.Container', {
        var headerCt =  {
            defaults: {
                flex: 1,
                sealed: true,
                sortable: true,
                resizable: true,
                resizeHandles: true
            },
            items: _columns
        };
        return headerCt;
    },
    
    /**
     * status column renderer
     * @param {string} value
     * @return {string}
     */
    statusRenderer: function(value) {
        return this.app.i18n._hidden(value);
    },
    
    /**
     * init ext grid panel
     * @private
     */
    initGrid: function() {
        this.callParent();
        
        if (this.usePagingToolbar) {
           this.initPagingToolbar();
        }
    },
    
    /**
     * inserts a quota Message when using old Browsers with html4upload
     */
    initPagingToolbar: function() {
        if(!this.pagingToolbar || !this.pagingToolbar.rendered) {
            Ext.Function.defer(this.initPagingToolbar, 50, this);
            return;
        }
        // old browsers
        if (!((! Ext.isGecko && window.XMLHttpRequest && window.File && window.FileList) || (Ext.isGecko && window.FileReader))) {
            var text = Ext.create('Ext.panel.Panel', {padding: 2, html: Ext.String.format(this.app.i18n._('The max. Upload Filesize is {0} MB'), Klb.App.Api.registry.get('maxFileUploadSize') / 1048576 )});
            this.pagingToolbar.insert(12, new Ext.Toolbar.Separator());
            this.pagingToolbar.insert(12, text);
            this.pagingToolbar.doLayout();
        }
    },
    
    /**
     * returns filter toolbar -> supress OR filters
     * @private
     */
    getFilterToolbar: function(config) {
        config = config || {};
        var plugins = [];
        if (! Ext.isDefined(this.hasQuickSearchFilterToolbarPlugin) || this.hasQuickSearchFilterToolbarPlugin) {
            this.quickSearchFilterToolbarPlugin = Ext.create('Klb.system.widgets.grid.FilterToolbarQuickFilterPlugin');
            plugins.push(this.quickSearchFilterToolbarPlugin);
        }

        config = Ext.apply(config, {
            cls: 'tw-ftb-filterpanel',
            app: this.app,
            recordClass:  this.recordClass,
            filterModels: this.recordClass.getFilterModel().concat(this.getCustomfieldFilters()),
            defaultFilter: 'query',
            filters: this.defaultFilters || [],
            plugins: plugins
        });

        return Ext.create('Klb.system.widgets.grid.FilterToolbar', config);
    },
    
    /**
     * returns add action / test
     * 
     * @return {Object} add action config
     */
    getAddAction: function () {
        return {
            requiredGrant: 'addGrant',
            actionType: 'add',
            text: this.app.i18n._('Upload'),
            handler: this.onFilesSelect,
            disabled: true,
            scope: this,
            plugins: [{
                ptype: 'ux.browseplugin',
                multiple: true,
                enableFileDrop: false,
                disable: true
            }],
            iconCls: this.app.appName + 'IconCls'
        };
    },
    
    /**
     * init actions with actionToolbar, contextMenu and actionUpdater
     * @private
     */
    initActions: function() {

        this.action_upload = Ext.create('Ext.Action', this.getAddAction());
        
        this.action_editFile = Ext.create('Ext.Action', {
            requiredGrant: 'editGrant',
            allowMultiple: false,
            text:    this.app.i18n._('Edit Properties'),
            handler: this.onEditFile,
            iconCls: 'action_edit_file',
            disabled: false,
            actionType: 'edit',
            scope: this
        });

        this.action_createFolder = Ext.create('Ext.Action', {
            requiredGrant: 'addGrant',
            actionType: 'reply',
            allowMultiple: true,
            text:    this.app.i18n._('Create Folder'),
            handler: this.onCreateFolder,
            iconCls: 'action_create_folder',
            disabled: false,
            scope: this
        });
        
        this.action_goUpFolder = Ext.create('Ext.Action', {
//            requiredGrant: 'readGrant',
            allowMultiple: true,
            actionType: 'goUpFolder',
            text:    this.app.i18n._('Folder Up'),
            handler: this.onLoadParentFolder,
            iconCls: 'action_filemanager_folder_up',
            disabled: true,
            scope: this
        });
        
        this.action_download = Ext.create('Ext.Action', {
            requiredGrant: 'readGrant',
            actionType: 'download',
            text:    this.app.i18n._('Save locally'),
            handler: this.onDownload,
            iconCls: 'action_filemanager_save_all',
            allowMultiple: false,
            disabled: true,
            scope: this
        });
        
        this.action_deleteRecord = Ext.create('Ext.Action', {
            requiredGrant: 'deleteGrant',
            singularText: this.app.i18n._('Delete'),
            pluralText:   this.app.i18n._('Delete'),
            translationObject: this.i18nDeleteActionText ? this.app.i18n : Klb.system.translation,
            text:    this.app.i18n._('Delete'),
            handler: this.onDeleteRecords,
            allowMultiple: true,
            disabled: true,
            iconCls: 'action_delete',
            scope: this
        });
     
        this.contextMenu = KlbDesktop.MVC.Filemanager.view.GridContextMenu.getMenu({
            nodeName: KlbDesktop.MVC.Filemanager.Model.Node.getRecordName(),
            actions: ['delete', 'rename', 'download', 'resume', 'pause', 'edit'],
            scope: this,
            backend: 'Filemanager',
            backendModel: 'Node'
        });
        
        this.folderContextMenu = KlbDesktop.MVC.Filemanager.view.GridContextMenu.getMenu({
            nodeName: this.app.i18n._(this.app.getMainScreen().getWestPanel().getContainerTreePanel().containerName),
            actions: ['delete', 'rename'],
            scope: this,
            backend: 'Filemanager',
            backendModel: 'Node'
        });
          
        this.actionUpdater.addActions(this.contextMenu.items);
        this.actionUpdater.addActions(this.folderContextMenu.items);
        
        this.actionUpdater.addActions([
           this.action_createFolder,
           this.action_goUpFolder,
           this.action_download,
           this.action_deleteRecord,
           this.action_editFile
       ]);
 
    },
    
    /**
     * get the right contextMenu
     */
    getContextMenu: function(grid, row, e) {
        var r = this.store.getById( row.getId() ),
            type = r ? r.get('type') : null;
            
        return type === 'folder' ? this.folderContextMenu : this.contextMenu;
    },
    
    /**
     * get action toolbar
     * 
     * @return {Ext.Toolbar}
     */
    getActionToolbar: function() {
        if (! this.actionToolbar) {
            this.actionToolbar = Ext.create('Ext.toolbar.Toolbar', {
                defaults: {height: 55},
                items: [{
                    xtype: 'buttongroup',
                    columns: 8,
                    defaults: {minWidth: 60},
                    items: [
                       this.splitAddButton ?
                       Ext.apply(new Ext.button.Split(this.action_upload), {
                           scale: 'medium',
                           rowspan: 2,
                           iconAlign: 'top',
                           arrowAlign:'right',
                           menu: new Ext.menu.Menu({
                               items: [],
                               plugins: [{
                                   ptype: 'ux.itemregistry',
                                   key:   'Klb.system.widgets.grid.GridPanel.addButton'
                               }]
                           })
                       }) :
                        new Klb.abstract.TollbarButton(this.action_upload),

                        new Klb.abstract.TollbarButton(this.action_editFile),
                        new Klb.abstract.TollbarButton(this.action_deleteRecord),
                        new Klb.abstract.TollbarButton(this.action_createFolder),
                        new Klb.abstract.TollbarButton(this.action_goUpFolder),
                        new Klb.abstract.TollbarButton(this.action_download)
                 ]
                }, this.getActionToolbarItems()]
            });
            
            if (this.filterToolbar && typeof this.filterToolbar.getQuickFilterField == 'function') {
                 this.actionToolbar.add('->', this.filterToolbar.getQuickFilterField());
            }
        }
        
        return this.actionToolbar;
    },
    
    /**
     * opens the edit dialog
     */
    onEditFile: function() {
        var sel = this.getGrid().getSelectionModel().getSelection();

        if(sel.length == 1) {
            var record = new KlbDesktop.MVC.Filemanager.Model.Node(sel[0].data),
                win = KlbDesktop.MVC.Filemanager.NodeEditDialog.openWindow({record: record});
        
            win.on('saveAndClose', function() {
                this.getGrid().store.reload();
            }, this);
        }
    },
    
    /**
     * create folder in current position
     * 
     * @param {Ext.Component} button
     * @param {Ext.EventObject} event
     */
    onCreateFolder: function(button, event) {
        var app = this.app,
            nodeName = KlbDesktop.MVC.Filemanager.Model.Node.getContainerName();
        
        Ext.MessageBox.prompt(_('New Folder'), _('Please enter the name of the new folder:'), function(_btn, _text) {
            var currentFolderNode = app.getMainScreen().getCenterPanel().currentFolderNode;
            if(currentFolderNode && currentFolderNode.getData() && _btn == 'ok') {
                if (! _text) {
                    Ext.Msg.alert(Ext.String.format(_('No {0} added'), nodeName), Ext.String.format(_('You have to supply a {0} name!'), nodeName));
                    return;
                }
                
                var filename = currentFolderNode.data.path + '/' + _text;
                KlbDesktop.MVC.Filemanager.fileRecordBackend.createFolder(filename);
            }
        }, this);  
    },
    
    /**
     * delete selected files / folders
     * 
     * @param {Ext.Component} button
     * @param {Ext.EventObject} event
     */
    onDeleteRecords: function(button, event) {
        var app = this.app,
            nodeName = '',
            sm = app.getMainScreen().getCenterPanel().selectionModel,
            nodes = sm.getSelection();
        
        if(nodes && nodes.length) {
            for(var i=0; i<nodes.length; i++) {
                var currNodeData = nodes[i].data;
                
                if(typeof currNodeData.name == 'object') {
                    nodeName += currNodeData.name.name + '<br />';
                }
                else {
                    nodeName += currNodeData.name + '<br />';
                }
            }
        }
        
        this.conflictConfirmWin = Klb.system.widgets.dialog.FileListDialog.openWindow({
            modal: true,
            allowCancel: false,
            height: 180,
            width: 300,
            title: app.i18n._('Do you really want to delete the following files?'),
            text: nodeName,
            scope: this,
            handler: function(button){
                if (nodes && button == 'yes') {
                    this.store.remove(nodes);
                    this.pagingToolbar.disable();
                    KlbDesktop.MVC.Filemanager.fileRecordBackend.deleteItems(nodes);
                }
                
                for(var i=0; i<nodes.length; i++) {
                    var node = nodes[i];
                    
                    if(node.fileRecord) {
                        var upload = Klb.system.uploadManager.getUpload(node.fileRecord.get('uploadKey'));
                        upload.setPaused(true);
                        Klb.system.uploadManager.unregisterUpload(upload.id);
                    }
                    
                }
            }
        }, this);
    },
    
    /**
     * go up one folder
     * 
     * @param {Ext.Component} button
     * @param {Ext.EventObject} event
     */
    onLoadParentFolder: function(button, event) {
        var app = this.app,
            currentFolderNode = app.getMainScreen().getCenterPanel().currentFolderNode,
            treePanel = app.getMainScreen().getWestPanel().getContainerTreePanel();

        if(currentFolderNode && currentFolderNode.parentNode) {
            app.getMainScreen().getCenterPanel().currentFolderNode = currentFolderNode.parentNode;
            // currentFolderNode.parentNode.select();
            treePanel.setNodeBySelect(currentFolderNode.parentNode);
        }
    },
    
    /**
     * grid row doubleclick handler
     * 
     * @param {KlbDesktop.MVC.Filemanager.NodeGridPanel} grid
     * @param {} row record
     * @param {Ext.EventObjet} e
     */
    onRowDblClick: function(view, record, item, index, e, eOpts) {
        var app = this.app;
        
        if(record.data.type == 'file') {
            var downloadPath = record.data.path,
                downloader = new Ext.ux.file.Download({
                params: {
                    method: 'Filemanager.downloadFile',
                    requestType: 'HTTP',
                    id: '',
                    path: downloadPath
                }
            }).start();
        }
        
        else if (record.data.type == 'folder'){
            var treePanel = app.getMainScreen().getWestPanel().getContainerTreePanel();
            
            var currentFolderNode,
                stored = treePanel.getStore();
            if(record.data.path == '/personal/system') {
                currentFolderNode = treePanel.getNodeById('personal');
            }
            else if(record.data.path == '/shared') {
                currentFolderNode = treePanel.getNodeByPath('/shared');  // stored.getNodeById('shared');
            }
            else if(record.data.path == '/personal') {
                currentFolderNode = treePanel.getNodeByPath('/personal'); // stored.getNodeById('otherUsers');
            }
            else {
                currentFolderNode = treePanel.getNodeById(record.id);
            }
            if(currentFolderNode) {
                treePanel.setNodeBySelect(currentFolderNode);
                treePanel.setNodeByExpand(currentFolderNode);

                app.getMainScreen().getCenterPanel().currentFolderNode = currentFolderNode;
            } else {
                // get ftb path filter
                this.filterToolbar.filterStore.each(function(filter) {
                    var field = filter.get('field');
                    if (field === 'path') {
                        filter.set('value', '');
                        filter.set('value', record.data);
                        filter.formFields.value.setValue(record.get('path'));
                        
                        this.filterToolbar.onFiltertrigger();
                        return false;
                    }
                }, this);
            }
        }
    }, 
        
    /**
     * on upload failure
     * 
     * @private
     */
    onUploadFail: function () {
        Ext.MessageBox.alert(
            _('Upload Failed'), 
            _('Could not upload file. Filesize could be too big. Please notify your Administrator. Max upload size: ') 
            + Klb.system.Common.byteRenderer(Klb.App.Api.registry.get('maxFileUploadSize')) 
        ).setIcon(Ext.MessageBox.ERROR);
        
        var app = Klb.system.appMgr.get('Filemanager'),
            grid = app.getMainScreen().getCenterPanel();
        grid.pagingToolbar.enable();
    },
    
    /**
     * on remove handler
     * 
     * @param {} button
     * @param {} event
     */
    onRemove: function (button, event) {
        var selectedRows = this.selectionModel.getSelections();
        for (var i = 0; i < selectedRows.length; i += 1) {
            this.store.remove(selectedRows[i]);
            var upload = Klb.system.uploadManager.getUpload(selectedRows[i].get('uploadKey'));
            upload.setPaused(true);
        }
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
                file.set('status', 'complete');
                file.set('nodeRecord', new KlbDesktop.MVC.Filemanager.Model.Node(file.data));
                this.store.add(file);
            }
        }
    },
    
    /**
     * copies uploaded temporary file to target location
     * 
     * @param upload  {Ext.ux.file.Upload}
     * @param file  {Ext.ux.file.Upload.file} 
     */
    onUploadComplete: function(upload, file) {
        var app = Klb.system.appMgr.get('Filemanager'),
            grid = app.getMainScreen().getCenterPanel();
        
        // check if we are responsible for the upload
        if (upload.fmDirector != grid) return;
        
        // $filename, $type, $tempFileId, $forceOverwrite
        Klb.system.Ajax.request({
            timeout: 10*60*1000, // Overriding Ajax timeout - important!
            params: {
                method: 'Filemanager.createNode',
                filename: upload.id,
                type: 'file',
                tempFileId: file.get('id'),
                forceOverwrite: true
            },
            success: grid.onNodeCreated.bind(this, upload, true),
            failure: grid.onNodeCreated.bind(this, upload, true)
        });
        
    },
    
    /**
     * TODO: move to Upload class or elsewhere??
     * updating fileRecord after creating node
     * 
     * @param response
     * @param request
     * @param upload
     */
    onNodeCreated: function(upload, status, response, request) {
        var record = Ext.util.JSON.decode(response.responseText);
                
        var fileRecord = upload.fileRecord;
            fileRecord.beginEdit();
            fileRecord.set('contenttype', record.contenttype);
            fileRecord.set('created_by', Klb.App.Api.registry.get('currentAccount'));
            fileRecord.set('creation_time', record.creation_time);
            fileRecord.set('revision', record.revision);
            fileRecord.set('last_modified_by', record.last_modified_by);
            fileRecord.set('last_modified_time', record.last_modified_time);
            fileRecord.set('name', record.name);
            fileRecord.set('path', record.path);
            fileRecord.set('status', 'complete');
            fileRecord.set('progress', 100);
            fileRecord.commit(false);
       
        upload.fireEvent('update', 'uploadfinished', upload, fileRecord);
        
        var app = Klb.system.appMgr.get('Filemanager'),
            grid = app.getMainScreen().getCenterPanel();
        
        var allRecordsComplete = true,
            storeItems = grid.getStore().getRange();
        for(var i=0; i<storeItems.length; i++) {
            if(storeItems[i].get('status') && storeItems[i].get('status') !== 'complete') {
                allRecordsComplete = false;
                break;
            }
        }
        
        if(allRecordsComplete) {
            grid.pagingToolbar.enable();
        }
    },
    
    /**
     * upload new file and add to store
     * 
     * @param {ux.BrowsePlugin} fileSelector
     * @param {} e
     */
    onFilesSelect: function (fileSelector, event) {
        var app = Klb.system.appMgr.get('Filemanager'),
            grid = app.getMainScreen().getCenterPanel(),
            targetNode = grid.currentFolderNode,
            gridStore = grid.store,
            rowIndex = false,
            targetFolderPath = grid.currentFolderNode.attributes
                                    ? grid.currentFolderNode.attributes.nodeRecord.get('path')
                                    : grid.currentFolderNode.get('path'),
            addToGrid = true,
            dropAllowed = false,
            nodeRecord = null;
        
        if(event && event.getTarget()) {
            rowIndex = grid.getView().findItemByChild(event.getTarget());
        }
        
        
        if(targetNode.attributes) {
            nodeRecord = targetNode.attributes.nodeRecord;
        }
        
        if( rowIndex && rowIndex > -1) {
            var newTargetNode = gridStore.getAt(rowIndex);
            if(newTargetNode && newTargetNode.data.type == 'folder') {
                targetFolderPath = newTargetNode.data.path;
                addToGrid = false;
                nodeRecord = new KlbDesktop.MVC.Filemanager.Model.Node(newTargetNode.data);
            }
        }
        
        if(!nodeRecord.isDropFilesAllowed()) {
            Ext.MessageBox.alert(
                    _('Upload Failed'), 
                    app.i18n._('Putting files in this folder is not allowed!')
            ).setIcon(Ext.MessageBox.ERROR);
            
            return;
        }    
        
        var files = fileSelector.getFileList();
        
        if(files.length > 0) {
            grid.pagingToolbar.disable();
        }
        
        var filePathsArray = [], uploadKeyArray = [];
        
        Ext.each(files, function (file) {
            var fileRecord = KlbDesktop.MVC.Filemanager.Model.Node.createFromFile(file),
                filePath = targetFolderPath + '/' + fileRecord.get('name');
            
            fileRecord.set('path', filePath);
            var existingRecordIdx = gridStore.find('name', fileRecord.get('name'));
            if(existingRecordIdx < 0) {
                gridStore.add(fileRecord);
            }
            
            var upload = new Ext.ux.file.Upload({
                fmDirector: grid,
                file: file,
                fileSelector: fileSelector,
                id: filePath
            });
            
            var uploadKey = Klb.system.uploadManager.queueUpload(upload);
            
            filePathsArray.push(filePath);
            uploadKeyArray.push(uploadKey);
            
        }, this);
        
        var params = {
                filenames: filePathsArray,
                type: "file",
                tempFileIds: [],
                forceOverwrite: false
        };
        KlbDesktop.MVC.Filemanager.fileRecordBackend.createNodes(params, uploadKeyArray, true);
    },
    
    /**
     * download file
     * 
     * @param {} button
     * @param {} event
     */
    onDownload: function(button, event) {
        
        var app = Klb.system.appMgr.get('Filemanager'),
            grid = app.getMainScreen().getCenterPanel(),
            selectedRows = grid.selectionModel.getSelections();
        
        var fileRow = selectedRows[0];
               
        var downloadPath = fileRow.data.path;
        var downloader = new Ext.ux.file.Download({
            params: {
                method: 'Filemanager.downloadFile',
                requestType: 'HTTP',
                id: '',
                path: downloadPath
            }
        }).start();
    },
    
    /**
     * grid on load handler
     * 
     * @param grid
     * @param records
     * @param options
     */
    onLoad: function(store, records, options){
        var app = Klb.system.appMgr.get('Filemanager'),
            grid = app.getMainScreen().getCenterPanel();
        
        for(var i=records.length-1; i>=0; i--) {
            var record = records[i];
            if(record.get('type') == 'file' && (!record.get('size') || record.get('size') == 0)) {
                var upload = Klb.system.uploadManager.getUpload(record.get('path'));

                if(upload) {
                      if(upload.fileRecord && record.get('name') == upload.fileRecord.get('name')) {
                          grid.updateNodeRecord(record, upload.fileRecord);
                          grid.store.afterEdit(record);
                      }
                }
            }
        }
    },
    
    /**
     * update grid nodeRecord with fileRecord data
     * 
     * @param nodeRecord
     * @param fileRecord
     */
    updateNodeRecord: function(nodeRecord, fileRecord) {
        for(var field in fileRecord.fields) {
            nodeRecord.set(field, fileRecord.get(field));
        }
        nodeRecord.fileRecord = fileRecord;
    },
    
    /**
     * upload update handler
     * 
     * @param change {String} kind of change
     * @param upload {Ext.ux.file.Upload} upload
     * @param fileRecord {file} fileRecord
     * 
     */
    onUpdate: function(change, upload, fileRecord) {
        var app = Klb.system.appMgr.get('Filemanager'),
            grid = app.getMainScreen().getCenterPanel(),
            rowsToUpdate = grid.getStore().query('name', fileRecord.get('name'));
        
        if(change == 'uploadstart') {
            Klb.system.uploadManager.onUploadStart();
        }
        else if(change == 'uploadfailure') {
            grid.onUploadFail();
        }

        var record = rowsToUpdate.getAt(0);
        if( record ) {

            if(change == 'uploadcomplete') {
                grid.onUploadComplete(upload, fileRecord);
            }
            else if(change == 'uploadfinished') {
                record.set('size', fileRecord.get('size'));
                record.set('contenttype', fileRecord.get('contenttype'));
                grid.store.afterEdit(record);
            }

            record.commit(false);
        }
    },
    
    /**
     * init grid drop target
     * 
     * @TODO DRY cleanup
     */
    initDropTarget: function(){
        var me = this,
            ddrow = new Ext.dd.DropTarget(me.getEl(), {
            ddGroup : 'fileDDGroup',  
            
            notifyDrop : function(dragSource, e, data){
                
                if(data.node && data.node.attributes && !data.node.attributes.nodeRecord.isDragable()) {
                    return false;
                }
                
                var app = Klb.system.appMgr.get(KlbDesktop.MVC.Filemanager.fileRecordBackend.appName),
                    grid = app.getMainScreen().getCenterPanel(),
                    treePanel = app.getMainScreen().getWestPanel().getContainerTreePanel(),
                    dropIndex = grid.getView().findItemByChild(e.target),
                    target = grid.getStore().getAt(dropIndex),
                    nodes = data.selections ? data.selections : [data.node];
                
                if((!target || target.data.type === 'file') && grid.currentFolderNode) {
                    target = grid.currentFolderNode;
                }

                if(!target) {
                    return false;
                }

                for(var i=0; i<nodes.length; i++) {
                    if(nodes[i].id == target.id) {
                        return false;
                    }
                }
                
                var targetNode = treePanel.getNodeById(target.id);
                if(targetNode && targetNode.isAncestor(nodes[0])) {
                    return false;
                }
                
                KlbDesktop.MVC.Filemanager.fileRecordBackend.copyNodes(nodes, target, !e.ctrlKey);
                return true;
            },
            
            notifyOver : function( dragSource, e, data ) {
                if(data.node && data.node.attributes && !data.node.attributes.nodeRecord.isDragable()) {
                    return false;
                }
                
                var app = Klb.system.appMgr.get(KlbDesktop.MVC.Filemanager.fileRecordBackend.appName),
                    grid = app.getMainScreen().getCenterPanel(),
                    dropIndex = grid.getView().findItemByChild(e.target),
                    treePanel = app.getMainScreen().getWestPanel().getContainerTreePanel(),
                    target = grid.getStore().getAt(dropIndex),
                    nodes  = data.selections ? data.selections : [data.node];
                
                if((!target || (target.data && target.data.type === 'file')) && grid.currentFolderNode) {
                    target = grid.currentFolderNode;
                }
                
                if(!target) {
                    return false;
                }
                
                for(var i=0; i<nodes.length; i++) {
                    if(nodes[i].id == target.id) {
                        return false;
                    }
                }
                
                var targetNode = treePanel.getNodeById(target.id);
                if(targetNode && targetNode.isAncestor(nodes[0])) {
                    return false;
                }
                return this.dropAllowed;
            }
        });
    }
});
