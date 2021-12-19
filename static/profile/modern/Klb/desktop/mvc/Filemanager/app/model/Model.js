/*
 * Klb Desktop 3.0.1
 * 
 * @package     Filemanager
 * @subpackage  Model
 * @copyright   Copyright (c) 2018 LLC ICS (http://www.icstime.com)
 * @license     http://www.gnu.org/licenses/agpl.html AGPL Version 3
 */

Ext.ns('KlbDesktop.MVC.Filemanager.Model', 'KlbDesktop.MVC.Filemanager.model.Model');

KlbDesktop.MVC.Filemanager.Model.NodeArray = Klb.system.Model.modlogFields.concat([
    { name: 'id' },
    { name: 'name' },
    { name: 'path' },
    { name: 'size' },
    { name: 'revision' },
    { name: 'type' },
    { name: 'contenttype' },
    { name: 'description' },
    { name: 'account_grants' },
    { name: 'description' },
    { name: 'object_id'},
    
    { name: 'relations' },
    { name: 'customfields' },
    { name: 'notes' },
    { name: 'tags' }
]);
    
Klb.system.data.Record.createMeta('KlbDesktop.MVC.Filemanager.Model.Node', KlbDesktop.MVC.Filemanager.Model.NodeArray, {
    appName: 'Filemanager',
    modelName: 'Node',
    idProperty: 'id',
    titleProperty: 'name',
    // ngettext('File', 'Files', n); gettext('File');
    recordName: 'File',
    recordsName: 'Files',
    // ngettext('Folder', 'Folders', n); gettext('Folder');
    containerName: 'Folder',
    containersName: 'Folders',
    
    /**
     * checks whether creating folders is allowed
     */
    isCreateFolderAllowed: function() {
        var grants = this.get('account_grants');
        
        if(!grants && !(this.data.id == 'personal' || this.data.id == 'shared') ) {
            return false;
        }
        else if(!grants && (this.data.id === 'personal' 
            || (this.data.id === 'shared' && (Klb.system.Common.hasRight('admin', this.appName) 
            || Klb.system.Common.hasRight('manage_shared_folders', this.appName))))) {
            return true;
        } else if (!grants) {
            return false;
        }
        
        return this.get('type') == 'file' ? grants.editGrant : grants.addGrant;
    },
    
    isDropFilesAllowed: function() {
        var grants = this.get('account_grants');
        if(!grants) {
            return false;
        }
        else if(!grants.addGrant) {
            return false;
        }
        return true;
    },
    
    isDragable: function() {
        var grants = this.get('account_grants');
        
        if(!grants) {
            return false;
        }
        
        if(this.get('id') === 'personal' || this.get('id') === 'shared' || this.get('id') === 'otherUsers') {
            return false;
        }
        
        return true;
    }
});

/**
 * create Node from File
 * @param {File} file
 */
KlbDesktop.MVC.Filemanager.Model.Node.createFromFile = function(file) {
    return new KlbDesktop.MVC.Filemanager.Model.Node({
        name: file.name ? file.name : file.fileName,  // safari and chrome use the non std. fileX props
        size: file.size || 0,
        type: 'file',
        contenttype: file.type ? file.type : file.fileType, // missing if safari and chrome 
        revision: 0
    });
};

/**
 * default FilemanagerRecord backend
 */
KlbDesktop.MVC.Filemanager.fileRecordBackend = Ext.create('Klb.system.data.RecordProxy', {
    appName: 'Filemanager',
    modelName: 'Node',
    modelClass: 'KlbDesktop.MVC.Filemanager.Model.Node',
    recordClass: KlbDesktop.MVC.Filemanager.Model.Node
});

KlbDesktop.MVC.Filemanager.fileRecordBackendExtend =  {
    /**
     * creating folder
     * 
     * @param name      folder name
     * @param options   additional options
     * @returns
     */
    createFolder: function(name, options) {
        
        options = options || {};
        var params = {
                application : this.appName,
                filename : name,
                type   : 'folder',
                method : this.appName + ".createNode"  
        };

        options.params = params;
        options.beforeSuccess = function(response) {
            var folder = this.recordReader(response);
            folder.set('client_access_time', new Date());
            return [folder];
        };

        options.success = function(result){
            var app = Klb.system.appMgr.get(KlbDesktop.MVC.Filemanager.fileRecordBackend.appName),
                grid       = app.getMainScreen().getCenterPanel(),
                parentNode = grid.currentFolderNode,
                nodeData   = Ext.util.JSON.decode(result),
                newNode    = app.getMainScreen().getWestPanel().getContainerTreePanel().createTreeNode(nodeData, parentNode);

            if(parentNode) {
                parentNode.appendChild(newNode);
            }
            grid.getStore().reload();
            this.fireEvent('containeradd', nodeData);
        };

        return this.doXHTTPRequest(options);
    },

    /**
     * is automatically called in generic GridPanel
     */
    saveRecord: function(record, request) {
        if( record.hasOwnProperty('fileRecord') ) {
            return;
        } else {
            Klb.system.data.RecordProxy.prototype.saveRecord.call(this, record, request);
        }
    },

    /**
     * deleting file or folder
     * 
     * @param items     files/folders to delete
     * @param options   additional options
     * @returns
     */
    deleteItems: function(items, options) {
        options = options || {};

        var filenames = new Array();
        var nodeCount = items.length;
        for(var i=0; i<nodeCount; i++) {
            filenames.push(items[i].data.path );
        }

        var params = {
            // application: this.appName,
            filenames: filenames,
            method: this.appName + ".deleteNodes",
            timeout: 300000 // 5 minutes
        };

        options.params = params;
        options.beforeSuccess = function(response) {
            var folder = this.recordReader(response);
            folder.set('client_access_time', new Date());
            return [folder];
        };

        options.success = (function(argBind, result){
            var app = Klb.system.appMgr.get(KlbDesktop.MVC.Filemanager.fileRecordBackend.appName),
                grid = app.getMainScreen().getCenterPanel(),
                treePanel = app.getMainScreen().getWestPanel().getContainerTreePanel(),
                nodeData = argBind.items;
            
            for(var i=0; i<nodeData.length; i++) {
                var treeNode = treePanel.store.getNodeById(nodeData[i].id);
                if(treeNode) {
                    treeNode.parentNode.removeChild(treeNode);
                }
            }

            grid.getStore().remove(nodeData);
            grid.selectionModel.deselectRange(0, grid.getStore().getCount());
            grid.pagingToolbar.enable();
//            this.fireEvent('containerdelete', nodeData);
            
        }).bind(this, {items: items});

        return this.doXHTTPRequest(options);
    },
    
    /**
     * copy/move folder/files to a folder
     * 
     * @param items files/folders to copy
     * @param targetPath
     * @param move
     */
    copyNodes: function(items, target, move, params) {
        
        var containsFolder = false,
            message = '',
            app = Klb.system.appMgr.get(KlbDesktop.MVC.Filemanager.fileRecordBackend.appName);        

        if(!params) {
        
            if(!target || !items || items.length < 1) {
                return false;
            }
            
            var sourceFilenames = new Array(),
            destinationFilenames = new Array(),
            forceOverwrite = false,
            treeIsTarget = false,
            treeIsSource = false,
            targetPath;
            
            if(target.data) {
                targetPath = target.data.path;
            }
            else {
                targetPath = target.attributes.path;
                treeIsTarget = true;
            }
            
            for(var i=0; i<items.length; i++) {
                
                var item = items[i];
                var itemData = item.data;
                if(!itemData) {
                    itemData = item.attributes;
                    treeIsSource = true;
                }
                sourceFilenames.push(itemData.path);
                
                var itemName = itemData.name;
                if(typeof itemName == 'object') {
                    itemName = itemName.name;
                }
                
                destinationFilenames.push(targetPath + '/' + itemName);
                if(itemData.type == 'folder') {
                    containsFolder = true;
                }
            };
            
            var method = "Filemanager.copyNodes",
                message = app.i18n._('Copying data .. {0}');
            if(move) {
                method = "Filemanager.moveNodes";
                message = app.i18n._('Moving data .. {0}');
            }
            
            params = {
                    application: this.appName,
                    sourceFilenames: sourceFilenames,
                    destinationFilenames: destinationFilenames,
                    forceOverwrite: forceOverwrite,
                    method: method
            };
            
        }
        else {
            message = app.i18n._('Copying data .. {0}');
            if(params.method == 'Filemanager.moveNodes') {
                message = app.i18n._('Moving data .. {0}');
            }
        }
        
        this.loadMask = new Ext.LoadMask(app.getMainScreen().getCenterPanel().getEl(), {msg: Ext.String.format(_('Please wait')) + '. ' + Ext.String.format(message, '' )});
        app.getMainScreen().getWestPanel().setDisabled(true);
        app.getMainScreen().getNorthPanel().setDisabled(true);
        this.loadMask.show();
        
        Klb.system.Ajax.request({
            params: params,
            timeout: 300000, // 5 minutes
            scope: this,
            success: function(result, request){
                
                this.loadMask.hide();
                app.getMainScreen().getWestPanel().setDisabled(false);
                app.getMainScreen().getNorthPanel().setDisabled(false);
                
                var nodeData = Ext.util.JSON.decode(result.responseText),
                    treePanel = app.getMainScreen().getWestPanel().getContainerTreePanel(),
                    grid = app.getMainScreen().getCenterPanel();
             
                // Tree refresh
                if(treeIsTarget) {
                    
                    for(var i=0; i<items.length; i++) {
                        
                        var nodeToCopy = items[i];
                        
                        if(nodeToCopy.data && nodeToCopy.data.type !== 'folder') {
                            continue;
                        }
                        
                        if(move) {
                            var copiedNode = treePanel.cloneTreeNode(nodeToCopy, target),
                                nodeToCopyId = nodeToCopy.id,
                                removeNode = treePanel.getNodeById(nodeToCopyId);
                            
                            if(removeNode && removeNode.parentNode) {
                                removeNode.parentNode.removeChild(removeNode);
                            }
                            
                            target.appendChild(copiedNode);
                            copiedNode.setId(nodeData[i].id);
                        } 
                        else {
                            var copiedNode = treePanel.cloneTreeNode(nodeToCopy, target);
                            target.appendChild(copiedNode);
                            copiedNode.setId(nodeData[i].id);
                            
                        }
                    }
                }
               
                // Grid refresh
                grid.getStore().reload();
            },
            failure: function(response, request) {
                var nodeData = Ext.util.JSON.decode(response.responseText),
                    request = Ext.util.JSON.decode(request.jsonData);
                
                this.loadMask.hide();
                app.getMainScreen().getWestPanel().setDisabled(false);
                app.getMainScreen().getNorthPanel().setDisabled(false);
                
                KlbDesktop.MVC.Filemanager.fileRecordBackend.handleRequestException(nodeData.data, request);
            }
        });
               
    },
    
    /**
     * upload file 
     * 
     * @param {} params Request parameters
     * @param String uploadKey
     * @param Boolean addToGridStore 
     */
    createNode: function(params, uploadKey, addToGridStore) {
        var app = Klb.system.appMgr.get('Filemanager'),
            grid = app.getMainScreen().getCenterPanel(),
            gridStore = grid.getStore();
        
        params.application = 'Filemanager';
        params.method = 'Filemanager.createNode';
        params.uploadKey = uploadKey;
        params.addToGridStore = addToGridStore;
        
        var onSuccess = (function(response, request){
            
            var nodeData = Ext.util.JSON.decode(request.responseText),
                fileRecord = Klb.system.uploadManager.upload(this.uploadKey);
            
            if(addToGridStore) {
                var recordToRemove = gridStore.query('name', fileRecord.get('name'));
                if(recordToRemove.items[0]) {
                    gridStore.remove(recordToRemove.items[0]);
                }
                
                fileRecord = KlbDesktop.MVC.Filemanager.fileRecordBackend.updateNodeRecord(nodeData[i], fileRecord);
                var nodeRecord = new KlbDesktop.MVC.Filemanager.Model.Node(nodeData[i]);
                
                nodeRecord.fileRecord = fileRecord;
                gridStore.add(nodeRecord);
                
            }
        }).bind(this, {uploadKey: uploadKey, addToGridStore: addToGridStore});
        
        var onFailure = (function(response, request) {
            
            var nodeData = Ext.util.JSON.decode(response.responseText),
                request = Ext.util.JSON.decode(request.jsonData);
            
            nodeData.data.uploadKey = this.uploadKey;
            nodeData.data.addToGridStore = this.addToGridStore;
            KlbDesktop.MVC.Filemanager.fileRecordBackend.handleRequestException(nodeData.data, request);
            
        }).bind(this, {uploadKey: uploadKey, addToGridStore: addToGridStore});
        
        Klb.system.Ajax.request({
            params: params,
            timeout: 300000, // 5 minutes
            scope: this,
            success: onSuccess || Ext.emptyFn,
            failure: onFailure || Ext.emptyFn
        });
    },
    
    /**
     * upload files
     * 
     * @param {} params Request parameters
     * @param [] uploadKeyArray
     * @param Boolean addToGridStore 
     */
    createNodes: function(params, uploadKeyArray, addToGridStore) {
        var me = this,
            app = Klb.system.appMgr.get('Filemanager'),
            grid = app.getMainScreen().getCenterPanel(),
            gridStore = grid.store;
        
        params.application = 'Filemanager';
        params.method = 'Filemanager.createNodes';
        params.uploadKeyArray = uploadKeyArray;
        params.addToGridStore = addToGridStore;
        
        
        var onSuccess = (function(argBind, response, request){
            
            var nodeData = Ext.util.JSON.decode(response.responseText);
            if (argBind.uploadKeyArray )
                for(var i=0; i< argBind.uploadKeyArray.length; i++) {
                    var fileRecord = Klb.system.uploadManager.upload(argBind.uploadKeyArray[i]);

                    if(addToGridStore) {
                        fileRecord = KlbDesktop.MVC.Filemanager.fileRecordBackend.updateNodeRecord(nodeData[i], fileRecord);
                        var nodeRecord = new KlbDesktop.MVC.Filemanager.Model.Node(nodeData[i]);

                        nodeRecord.fileRecord = fileRecord;

                        var existingRecordIdx = gridStore.find('name', fileRecord.get('name'));
                        if(existingRecordIdx > -1) {
                            gridStore.removeAt(existingRecordIdx);
                            gridStore.insert(existingRecordIdx, nodeRecord);
                        } else {
                            gridStore.add(nodeRecord);
                        }
                    }
                }
            
        }).bind(me, {uploadKeyArray: uploadKeyArray, addToGridStore: addToGridStore});
        
        var onFailure = (function(argBind, response, request) {
            
            var nodeData = Ext.util.JSON.decode(response.responseText),
                request = Ext.util.JSON.decode(request.jsonData);
            
            nodeData.data.uploadKeyArray = this.uploadKeyArray;
            nodeData.data.addToGridStore = this.addToGridStore;
            KlbDesktop.MVC.Filemanager.fileRecordBackend.handleRequestException(nodeData.data, request);
            
        }).bind(me, {uploadKeyArray: uploadKeyArray, addToGridStore: addToGridStore});
        
        Klb.system.Ajax.request({
            params: params,
            timeout: 300000, // 5 minutes
            scope: this,
            success: onSuccess || Ext.emptyFn,
            failure: onFailure || Ext.emptyFn
        });
        
        
    },
    
    /**
     * exception handler for this proxy
     * 
     * @param {Tine.Exception} exception
     */
    handleRequestException: function(exception, request) {
        KlbDesktop.MVC.Filemanager.handleRequestException(exception, request);
    },
    
    /**
     * updates given record with nodeData from from response
     */
    updateNodeRecord : function(nodeData, nodeRecord) {
        
        for(var field in nodeData) {
            nodeRecord.set(field, nodeData[field]);
        };
        
        return nodeRecord;
    }
};

Ext.apply(KlbDesktop.MVC.Filemanager.fileRecordBackend, KlbDesktop.MVC.Filemanager.fileRecordBackendExtend);

/**
 * get filtermodel of contact model
 * 
 * @namespace KlbDesktop.MVC.Filemanager.Model
 * @static
 * @return {Object} filterModel definition
 */ 
KlbDesktop.MVC.Filemanager.Model.Node.getFilterModel = function() {
    var app = Klb.system.appMgr.get('Filemanager');
       
    return [
        {label : _('Quick Search'), field : 'query', operators : [ 'contains' ]}, 
//        {label: app.i18n._('Type'), field: 'type'}, // -> should be a combo
        {label: app.i18n._('Contenttype'), field: 'contenttype'},
        {label: app.i18n._('Creation Time'), field: 'creation_time', valueType: 'date'},
        {filtertype : 'apibase.filemanager.pathfiltermodel', app : app}, 
        {filtertype : 'apibase.tag', app : app} 
    ];
};

Ext.define('KlbDesktop.MVC.Filemanager.Model.NodeTree', {
    extend: 'Klb.system.widgets.container.TreeModel',

    prepareDataNode: function(node) {
        var me = this;

        node = me.callParent(arguments);
        var attr = node.attributes;
            attr.leaf = false;

        if(attr.name && typeof attr.name == 'object') {
            Ext.apply(attr, {
                text: Ext.util.Format.htmlEncode(attr.name),
                qtip: Klb.system.Common.doubleEncode(attr.name)
            });
        }

        // copy 'real' data to a node record NOTE: not a full record as we have no record reader here
        var nodeData = Ext.copyTo({}, attr, KlbDesktop.MVC.Filemanager.Model.Node.getFieldNames());
            attr.nodeRecord = attr.nodeRecord || new KlbDesktop.MVC.Filemanager.Model.Node(nodeData);
        return node;
    },
});