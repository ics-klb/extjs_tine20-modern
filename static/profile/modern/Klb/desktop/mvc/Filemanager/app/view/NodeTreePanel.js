/*
 * Klb Desktop 3.0.1
 * 
 * @package     Modern
 * @subpackage  Filemanager.NodeTreePanel
 * @copyright   Copyright (c) 2018 LLC ICS (http://www.icstime.com)
 * @license     http://www.gnu.org/licenses/agpl.html AGPL Version 3
 */

Ext.ns('KlbDesktop.MVC.Filemanager');

/**
 * @namespace KlbDesktop.MVC.Filemanager
 * @class KlbDesktop.MVC.Filemanager.NodeTreePanel
 * @extends Klb.system.widgets.container.TreePanel
 */

Ext.define('KlbDesktop.MVC.Filemanager.view.NodeTreePanel', {
    extend: 'Klb.system.widgets.container.TreePanel',
    alternateClassName: 'KlbDesktop.MVC.Filemanager.NodeTreePanel',

    requires: [
        'Ext.ux.file.Download'
      , 'Ext.ux.file.BrowsePlugin'
    ],

    filterMode : 'filterToolbar',
    
    recordClass : KlbDesktop.MVC.Filemanager.Model.Node,
    
    allowMultiSelection : false,
    defaultContainerPath: '/personal',
    ddGroup: 'fileDDGroup',
    enableDD: true,
       
    initComponent: function() {
        var me = this;

        me.on('containeradd',    me.onFolderAdd,    me);
        me.on('containerrename', me.onFolderRename, me);
        me.on('containerdelete', me.onFolderDelete, me);
        // me.on('nodedragover',    me.onNodeDragOver, me);
        
        Klb.system.uploadManager.on('update', me.onUpdate);

        me.plugins = me.plugins || [];
        me.plugins.push(me.cellEditingPlugin = Ext.create('Ext.grid.plugin.CellEditing'));
        me.plugins.push({
            ptype : 'ux.browseplugin',
            enableFileDialog: false,
            multiple: true,
            handler : me.dropIntoTree
        });

        me.model = 'KlbDesktop.MVC.Filemanager.Model.NodeTree';
        me.treeLoader = Ext.apply(KlbDesktop.MVC.Filemanager.fileRecordBackend, {
            getParams: me.onBeforeLoad.bind(me),
            inspectCreateNode: me.onBeforeCreateNode.bind(me)
        });

        me.callParent(arguments);

        // init drop zone
        me.dropConfig = {
            ddGroup: this.ddGroup || 'fileDDGroup',
            appendOnly: this.ddAppendOnly === true,
            /**
             * @todo check acl!
             */
            onNodeOver : function(n, dd, e, data) {
                
                var preventDrop = false,
                    selectionContainsFiles = false;
                
                if(dd.dragData.selections) {
                    for(var i=0; i<dd.dragData.selections.length; i++) {
                        if(n.node.id == dd.dragData.selections[i].id) {
                            preventDrop = true;
                        }
                        if(dd.dragData.selections[i].data.type == 'file') {
                            selectionContainsFiles = true;
                        }
                    }
                }
                else if(dd.dragData.node && dd.dragData.node.id == n.node.id) {
                    preventDrop = true;
                } 
                
                if(selectionContainsFiles && !n.node.attributes.account_grants) {
                    preventDrop = true;
                }
                
                if(n.node.isAncestor(dd.dragData.node)) {
                    preventDrop = true;
                }
                
                return n.node.attributes.nodeRecord.isCreateFolderAllowed() 
                    && (!dd.dragData.node || dd.dragData.node.attributes.nodeRecord.isDragable())
                    && !preventDrop ? 'apibase-tree-drop-move' : false; // x-dd-drop-ok
            },
            
            isValidDropPoint: function(n, op, dd, e){
                
                var preventDrop = false,
                selectionContainsFiles = false;
                
                if(dd.dragData.selections) {
                    for(var i=0; i<dd.dragData.selections.length; i++) {
                        if(n.node.id == dd.dragData.selections[i].id) {
                            preventDrop = true;
                        }
                        if(dd.dragData.selections[i].data.type == 'file') {
                            selectionContainsFiles = true;
                        }
                    }
                }
                else if(dd.dragData.node && dd.dragData.node.id == n.node.id) {
                    preventDrop = true;
                } 
                
                if(selectionContainsFiles && !n.node.attributes.account_grants) {
                    preventDrop = true;
                }
                
                if(n.node.isAncestor(dd.dragData.node)) {
                    preventDrop = true;
                }
                
                return n.node.attributes.nodeRecord.isCreateFolderAllowed()
                        && (!dd.dragData.node || dd.dragData.node.attributes.nodeRecord.isDragable())
                        && !preventDrop;
            },
            completeDrop: function(de) {
                var ns = de.dropNode, p = de.point, t = de.target;
                t.ui.endDrop();
                this.tree.fireEvent("nodedrop", de);
            }
        };
        
        this.dragConfig = {
            ddGroup: this.ddGroup || 'fileDDGroup',
            scroll: this.ddScroll,
            // tree node dragzone modified, dragged node doesn't get selected
            // @param e
            onInitDrag: function(e) {
                var data = this.dragData;
                this.tree.eventModel.disable();
                this.proxy.update("");
                data.node.ui.appendDDGhost(this.proxy.ghost.dom);
                this.tree.fireEvent("startdrag", this.tree, data.node, e);
            }
        };

        // me.on('beforeitemclick', me.onBeforeCreateNode, me);
    },
    
    /**
     * Klb.system.widgets.tree.FilterPlugin
     * returns a filter plugin to be used in a grid
     */
    // Klb.system.widgets.tree.FilterPlugin
    // KlbDesktop.MVC.Filemanager.PathFilterPlugin
    getFilterPlugin: function() {
        if (!this.filterPlugin) {
            this.filterPlugin = new KlbDesktop.MVC.Filemanager.view.PathFilterPlugin({
                treePanel: this,
                field: 'path',
                nodeAttributeField: 'path'
            });
        }
        
        return this.filterPlugin;
    },
    
    /**
     * returns the personal root path
     * @returns {String}
     */
    getRootPath: function() {
        return Klb.system.Container.getMyFileNodePath();
    },
    
    /**
     * returns params for async request
     * 
     * @param {Ext.tree.TreeNode} node
     * @return {Object}
     */
    onBeforeLoad: function(node) {
        
        var path = node.attributes ? node.attributes.nodeRecord.get('path') : node.get('path'),
            type = Klb.system.Container.path2type(path),
            owner = Klb.system.Container.pathIsPersonalNode(path),
            loginName = Klb.App.Api.registry.get('currentAccount').accountLoginName;
        
        if (type === 'personal' && owner != loginName) {
            type = 'otherUsers';
        }
        
        var newPath = path;
        
        if (type === 'personal' && owner) {
            var pathParts = path.toString().split('/');
            newPath = '/' + pathParts[1] + '/' + loginName;
            if(pathParts[3]) {
                newPath += '/' + pathParts[3];
            }
        }
        
        var params = {
            method: 'Filemanager.searchNodes',
            // application: this.app.appName,
            // owner: owner,
            filter: [
                 {field: 'path', operator:'equals', value: newPath},
                 {field: 'type', operator:'equals', value: 'folder'}
            ],
            paging: {dir: 'ASC', limit: 50, sort: 'name', start: 0}
        };
        
        return params;
    },

    /**
     * @private
     *
     * Called from a node's appendChild method.
     */
    onNodeAppend: function(parent, node, index) {
        this.onNodeInsert(parent, node, index);
    },

    /**
     * initiates tree context menues
     * 
     * @private
     */
    initContextMenu: function() {
        
        this.contextMenuUserFolder = Klb.system.widgets.tree.ContextMenu.getMenu({
            nodeName: this.app.i18n._(this.containerName),
            actions: ['add', 'reload', 'delete', 'rename', 'properties'],
            scope: this,
            backend: 'Filemanager',
            backendModel: 'Node'
        });
            
        this.contextMenuRootFolder = Klb.system.widgets.tree.ContextMenu.getMenu({
            nodeName: this.app.i18n._(this.containerName),
            actions: ['add', 'reload'],
            scope: this,
            backend: 'Filemanager',
            backendModel: 'Node'
        });
        
        this.contextMenuOtherUserFolder = Klb.system.widgets.tree.ContextMenu.getMenu({
            nodeName: this.app.i18n._(this.containerName),
            actions: ['reload'],
            scope: this,
            backend: 'Filemanager',
            backendModel: 'Node'
        });
        
        this.contextMenuContainerFolder = Klb.system.widgets.tree.ContextMenu.getMenu({
            nodeName: this.app.i18n._(this.containerName),
            actions: ['add', 'reload', 'delete', 'rename', 'grants', 'properties'],
            scope: this,
            backend: 'Filemanager',
            backendModel: 'Node'
        });
        
        this.contextMenuReloadFolder = Klb.system.widgets.tree.ContextMenu.getMenu({
            nodeName: this.app.i18n._(this.containerName),
            actions: ['reload', 'properties'],
            scope: this,
            backend: 'Filemanager',
            backendModel: 'Node'
        });
    },
    
    /**
     * @private
     * - select default path
     */
    afterRender: function() {
        this.callParent(arguments);
    },
    
    /**
     * show context menu
     * 
     * @param {Ext.tree.TreeNode} node
     * @param {Ext.EventObject} event
     */
    onContextMenu: function(view, record, item, index, event, eOpts) {
        
        var currentAccount = Klb.App.Api.registry.get('currentAccount');

        var me = this,
            sm = me.getSelectionModel(),
            node = sm.getLastSelected(),
            owner;

        // this.ctxNode = record;
        this.ctxNode = node;
        var container = node.attributes.nodeRecord.data,
            path = container.path;
        
        if (! Ext.isString(path) || node.isRoot() ) {
            return;
        }
        
        Klb.Logger.debug('KlbDesktop.MVC.Filemanager.NodeTreePanel::onContextMenu - context node:');

        if (node.id == 'otherUsers' || (node.parentNode && node.parentNode.id == 'otherUsers')) {

            me.contextMenuOtherUserFolder.showAt(event.getXY());
        } else if (node.id == 'personal' || node.id == 'shared') {

            me.contextMenuRootFolder.showAt(event.getXY());
        } else if (path.match(/^\/shared/) 
                && (Klb.system.Common.hasRight('admin', me.app.appName)
                    || Klb.system.Common.hasRight('manage_shared_folders', me.app.appName))
                    || container.account_grants && container.account_grants.adminGrant
                )
        {
            if (typeof container.name == 'object') {
                me.contextMenuContainerFolder.showAt(event.getXY());
            } else {
                me.contextMenuUserFolder.showAt(event.getXY());
            }
        } else if (path.match(/^\/shared/)){

            me.contextMenuReloadFolder.showAt(event.getXY());
        } else if (path.match(/^\/personal/) && path.match('/personal/' + currentAccount.accountLoginName)) {

            if (typeof container.name == 'object') {
                me.contextMenuContainerFolder.showAt(event.getXY());
            } else {
                me.contextMenuUserFolder.showAt(event.getXY());
            }
        } else if (path.match(/^\/personal/) && container.account_grants) {

            me.contextMenuUserFolder.showAt(event.getXY());
        }
        return false;
    },
    
    /**
     * updates grid actions
     * @todo move to grid / actionUpdater
     * 
     * @param {} sm     SelectionModel
     * @param {Ext.tree.TreeNode} node
     */
    updateActions: function(sm, node) {
        var grid = this.app.getMainScreen().getCenterPanel();
        
        grid.action_deleteRecord.disable();
        grid.action_upload.disable();
        
        if(!!node && !!node.isRoot() ) {
            grid.action_goUpFolder.disable();
        }
        else {
            grid.action_goUpFolder.enable();
        }

        grid.action_createFolder.enable();
        if(node && node.attributes && node.attributes.nodeRecord.isCreateFolderAllowed()) {
            grid.action_createFolder.enable();
        }
        else {
            grid.action_createFolder.disable();
        }
        
        if(node && node.attributes && node.attributes.nodeRecord.isDropFilesAllowed()) {
            grid.action_upload.enable();
        }
        else {
            grid.action_upload.disable();
        }

        // this.refreshView();
    },
    
    /**
     * called when tree selection changes
     * 
     * @param {} sm     SelectionModel
     * @param {Ext.tree.TreeNode} node
     */
    onSelectionChange: function(sm, node) {
        this.updateActions(sm, node);
        var grid = this.app.getMainScreen().getCenterPanel();
        
        grid.currentFolderNode = node;
        this.callParent(arguments);
    },
    
    /**
     * convert filesystem path to treePath
     * 
     * NOTE: only the first depth gets converted!
     *       fs pathes of not yet loaded tree nodes can't be converted!
     * 
     * @param {String} containerPath
     * @return {String} tree path
     */
    getTreePath: function(path) {
        var treePath = '/' + this.getRootNode().id;
        
        if (path && path != '/') {
            if (path == '/personal') {
                treePath += '/otherUsers';
            }
            
            treePath += String(path).replace('personal/'  + Klb.App.Api.registry.get('currentAccount').accountLoginName, 'personal');
        }
        
        return treePath;
    },
    
    /**
     * Expands a specified path in this TreePanel. A path can be retrieved from a node with {@link Ext.data.Node#getPath}
     * 
     * NOTE: path does not consist of id's starting from the second depth
     * 
     * @param {String} path
     * @param {String} attr (optional) The attribute used in the path (see {@link Ext.data.Node#getPath} for more info)
     * @param {Function} callback (optional) The callback to call when the expand is complete. The callback will be called with
     * (bSuccess, oLastNode) where bSuccess is if the expand was successful and oLastNode is the last node that was expanded.
     */
    // !!!!!!!!!!!!!!ИСПРАВИТЬ ПОД НОВЫЙ ДВИЖОК!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!1
    expandPath: function(path, attr, callback){
        var keys = path.split(this.pathSeparator),
            curNode = this.root,
            curPath = curNode.path;

        var index = 1;
        var f = function(){
            if(++index == keys.length){
                if(callback){
                    callback(true, curNode);
                }
                return;
            }
            
            if (index > 2) {
                var c = curNode.findChild('path', curPath + '/' + keys[index]);
            } else {
                var c = curNode.findChild('id', keys[index]);
            }
            if(!c){
                if(callback){
                    callback(false, curNode);
                }
                return;
            }
            curNode = c;
            curPath = c.attributes.nodeRecord.get('path');
            c.expand(false, false, f);
        };
        
       // curNode.expand(false, false, f);
        this.callParent(arguments);
        // this.view.expand(curNode);
    },
    
    /**
     * files/folder got dropped on node
     * 
     * @param {Object} dropEvent
     * @private
     */
    onBeforeNodeDrop: function(dropEvent) {
        var nodes, target = dropEvent.target;
        
        if(dropEvent.data.selections) {
            nodes = dropEvent.data.grid.selModel.selections.items;
        }    
            
        if(!nodes && dropEvent.data.node) {
            nodes = [dropEvent.data.node];
        }
        
        KlbDesktop.MVC.Filemanager.fileRecordBackend.copyNodes(nodes, target, !dropEvent.rawEvent.ctrlKey);
        
        dropEvent.dropStatus = true;
        return true;
    },
    
    /**
     * folder delete handler
     */
    onFolderDelete: function(node) {
        var grid = this.app.getMainScreen().getCenterPanel();
        if(grid.currentFolderNode.isAncestor && typeof grid.currentFolderNode.isAncestor == 'function' 
            && grid.currentFolderNode.isAncestor(node)) {
            node.parentNode.select();
        }
        grid.getStore().reload();
    },
    
    /**
     * clone a tree node / create a node from grid node
     * 
     * @param node
     * @returns {Ext.tree.AsyncTreeNode}
     */
    cloneTreeNode: function(node, target) {
        var targetPath = target.attributes.nodeRecord.get('path'),
            newPath = '',
            copy;
        
        if(node.attributes) {
            var nodeName = node.attributes.name;
            if(typeof nodeName == 'object') {
                nodeName = nodeName.name;
            }
            newPath = targetPath + '/' + nodeName;
            
            copy = new Ext.tree.AsyncTreeNode({text: node.text, path: newPath, name: node.attributes.name
                , nodeRecord: node.attributes.nodeRecord, account_grants: node.attributes.account_grants});
        }
        else {
            var nodeName = node.data.name;
            if(typeof nodeName == 'object') {
                nodeName = nodeName.name;
            }
            
            var nodeData = Ext.copyTo({}, node.data, KlbDesktop.MVC.Filemanager.Model.Node.prototype.getFieldNames());
            var newNodeRecord = new KlbDesktop.MVC.Filemanager.Model.Node(nodeData);
             
            newPath = targetPath + '/' + nodeName;
            copy = new Ext.tree.AsyncTreeNode({text: nodeName, path: newPath, name: node.data.name
                , nodeRecord: newNodeRecord, account_grants: node.data.account_grants});
        }
                
        copy.attributes.nodeRecord.beginEdit();
        copy.attributes.nodeRecord.set('path', newPath);
        copy.attributes.nodeRecord.endEdit();
        
        copy.parentNode = target;
        return copy;
    },
    
    /**
     * create Tree node by given node data
     * 
     * @param nodeData
     * @param target
     * @returns {Ext.tree.AsyncTreeNode}
     */
    createTreeNode: function(nodeData, target) {
        var me = this,
            nodeName = nodeData.name;

        if(typeof nodeName == 'object') {
            nodeName = nodeName.name;
        }
        
        var newNodeRecord = new KlbDesktop.MVC.Filemanager.Model.Node(nodeData);
        
        var newNode = Ext.create(me.model, {
            text: nodeName,
            path: nodeData.path,
            name: nodeData.name,
            loaded: true,
            id:   nodeData.id
        });

        newNode.attributes = newNode.attributes || {};
            newNode.attributes.nodeRecord = newNodeRecord;
            newNode.attributes.account_grants  = nodeData.account_grants;
            newNode.attributes.nodeRecord.beginEdit();
            newNode.attributes.nodeRecord.set('path', nodeData.path);
            newNode.attributes.nodeRecord.endEdit();


        var current = target  && target.findChild
                      ?  target.findChild('path', newNode.get('path'), false)
                      :  null;

            if ( !target) {
                var app = Klb.system.appMgr.get(me.appName),
                    grid = app.getMainScreen().getCenterPanel(),
                    target = grid.currentFolderNode;
            }

            if ( !current) {
                target.appendChild(newNode);
            } else {
                target.replaceChild(newNode, current);
            }

        return newNode;
    },
    
    /**
     * TODO: move to Upload class or elsewhere??
     * updating fileRecord after creating node
     * 
     * @param response
     * @param request
     * @param upload
     */
    onNodeCreated: function(response, request, upload) {
       
        var app = Klb.system.appMgr.get('Filemanager'),
        grid = app.getMainScreen().getCenterPanel();
        
        var record = Ext.util.JSON.decode(response.responseText);
        
        var fileRecord = upload.fileRecord;
        
            fileRecord.beginEdit();
            fileRecord.set('contenttype', record.contenttype);
            fileRecord.set('created_by', Klb.App.Api.registry.get('currentAccount'));
            fileRecord.set('creation_time', record.creation_time);
            fileRecord.set('revision', record.revision);
            fileRecord.set('last_modified_by', record.last_modified_by);
            fileRecord.set('last_modified_time', record.last_modified_time);
            fileRecord.set('status', 'complete');
            fileRecord.set('progress', 100);
            fileRecord.set('name', record.name);
            fileRecord.set('path', record.path);
            fileRecord.commit(false);
        
        upload.fireEvent('update', 'uploadfinished', upload, fileRecord);
        
        grid.pagingToolbar.refresh.enable();
        
    },
    
    /**
     * copies uploaded temporary file to target location
     * 
     * @param upload    {Ext.ux.file.Upload}
     * @param file  {Ext.ux.file.Upload.file} 
     */
    onUploadComplete: function(upload, file) {
        var app = Klb.system.appMgr.get('Filemanager'),
            treePanel = app.getMainScreen().getWestPanel().getContainerTreePanel();
        
     // check if we are responsible for the upload
        if (upload.fmDirector != treePanel) return;
        
        // $filename, $type, $tempFileId, $forceOverwrite
        Ext.Ajax.request({
            timeout: 10*60*1000, // Overriding Ajax timeout - important!
            params: {
                method: 'Filemanager.createNode',
                filename: upload.id,
                type: 'file',
                tempFileId: file.get('id'),
                forceOverwrite: true
            },
            success: treePanel.onNodeCreated.createDelegate(this, [upload], true), 
            failure: treePanel.onNodeCreated.createDelegate(this, [upload], true)
        });
        
    },
    
    /**
     * on upload failure
     * 
     * @private
     */
    onUploadFail: function () {
        Ext.MessageBox.alert(
            _('Upload Failed'), 
            _('Could not upload file. Filesize could be too big. Please notify your Administrator. Max upload size: ') + Klb.App.Api.registry.get('maxFileUploadSize')
        ).setIcon(Ext.MessageBox.ERROR);
    },
    
    /**
     * add folder handler
     */
    onFolderAdd: function(nodeData) {
        
        var app = Klb.system.appMgr.get('Filemanager'),
            grid = app.getMainScreen().getCenterPanel();
        
        grid.getStore().reload();
        if(nodeData.error) {
            Klb.Logger.debug(nodeData);
        }
    },
    
    /**
     * handles renaming of a tree node / aka folder
     */
    onFolderRename: function(nodeData, node, newName) {
        var app = Klb.system.appMgr.get('Filemanager'),
            grid = app.getMainScreen().getCenterPanel();
        
        if(nodeData[0]) {
            nodeData = nodeData[0];
        };
        
        node.attributes.nodeRecord.beginEdit();
        node.attributes.nodeRecord.set('name', newName);
        node.attributes.nodeRecord.set('path', nodeData.path);
        node.attributes.nodeRecord.commit(false);
        
        if(typeof node.attributes.name == 'object') {
            node.attributes.name.name = newName;
        }
        else {
            node.attributes.name = newName;
        }
        
        grid.currenFolderNode = node;
        
        KlbDesktop.MVC.Filemanager.NodeTreePanel.superclass.onSelectionChange.call(this, this.getSelectionModel(), node);
        
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
            treePanel = app.getMainScreen().getWestPanel().getContainerTreePanel(),
            rowsToUpdate = grid.getStore().query('name', fileRecord.get('name'));
        
        if(change == 'uploadstart') {
            Klb.system.uploadManager.onUploadStart();
        }
        else if(change == 'uploadfailure') {
            treePanel.onUploadFail();
        }
        
        if(rowsToUpdate.get(0)) {
            if(change == 'uploadcomplete') {
                treePanel.onUploadComplete(upload, fileRecord);
            }
            else if(change == 'uploadfinished') {
                rowsToUpdate.get(0).set('size', upload.fileSize);
                rowsToUpdate.get(0).set('contenttype', fileRecord.get('contenttype'));
            }
            rowsToUpdate.get(0).afterEdit();
            rowsToUpdate.get(0).commit(false);
        }       
    },
    
    /**
     * handels tree drop of object from outside the browser
     * 
     * @param fileSelector
     * @param targetNodeId
     */
    dropIntoTree: function(fileSelector, event) {
              
        var treePanel = fileSelector.component,
            app = treePanel.app,
            grid = app.getMainScreen().getCenterPanel(),
            targetNode,
            targetNodePath;
            
        
        var targetNodeId;
        var treeNodeAttribute = event.getTarget('div').attributes['ext:tree-node-id'];
        if(treeNodeAttribute) {
            targetNodeId = treeNodeAttribute.nodeValue;
            targetNode = treePanel.getNodeById(targetNodeId);
            targetNodePath = targetNode.attributes.nodeRecord.get('path');
            
        };
        
        if(!targetNode.attributes.nodeRecord.isDropFilesAllowed()) {
            Ext.MessageBox.alert(
                    _('Upload Failed'), 
                    app.i18n._('Putting files in this folder is not allowed!')
                ).setIcon(Ext.MessageBox.ERROR);
            
            return;
        };
      
        var files = fileSelector.getFileList(),
            filePathsArray = [],
            uploadKeyArray = [],
            addToGridStore = false;
        
        Ext.each(files, function (file) {
            
            var fileName = file.name || file.fileName,
                filePath = targetNodePath + '/' + fileName;
            
            var upload = new Ext.ux.file.Upload({
                fmDirector: treePanel,
                file: file,
                fileSelector: fileSelector,
                id: filePath
            });
            
            var uploadKey = Klb.system.uploadManager.queueUpload(upload);
            
            filePathsArray.push(filePath);
            uploadKeyArray.push(uploadKey);
            
            addToGridStore = grid.currentFolderNode.id === targetNodeId;
            
        }, this);
        
        var params = {
                filenames: filePathsArray,
                type: "file",
                tempFileIds: [],
                forceOverwrite: false
        };
        KlbDesktop.MVC.Filemanager.fileRecordBackend.createNodes(params, uploadKeyArray, addToGridStore);
    }
});
