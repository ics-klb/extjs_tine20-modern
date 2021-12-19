/*
 * Modern 3.1.0
 *
 * @license     http://www.gnu.org/licenses/agpl.html AGPL Version 3
 * @author      Philipp Schüle <p.schuele@metaways.de>
 * @copyright   Copyright (c) 2009-2012 Metaways Infosystems GmbH (http://www.metaways.de)
 *
 */
Ext.ns('Klb.system.widgets', 'Klb.system.widgets.tree');

/**
 * returns generic tree context menu with
 * - create/add
 * - rename
 * - delete
 * - edit grants
 *
 * ctxNode class var is required in calling class
 */
Klb.system.widgets.tree.ContextMenu = {

    /**
     * create new Ext.menu.Menu with actions
     *
     * @param {} config has the node name, actions, etc.
     * @return {}
     */
    getMenu: function(config) {

        this.config = config;

        /****************** create ITEMS array ****************/

        this.action_addfolder = new Ext.Action({
            text: Ext.String.format(_('New Folder {0}'), this.config.nodeName),
            iconCls: 'action_delegate',
            handler: this.addFolder,
            requiredGrant: 'addGrant',
            scope: this.config
        });

        this.action_add = new Ext.Action({
            text:  Ext.String.format(_('Add {0}'), this.config.nodeName),
            iconCls: 'action_add',
            handler: this.addNode,
            requiredGrant: 'addGrant',
            scope: this.config
        });

        this.action_rename = new Ext.Action({
            text:  Ext.String.format(_('Rename {0}'), this.config.nodeName),
            iconCls: 'action_rename',
            handler: this.renameNode,
            scope: this.config,
            requiredGrant: 'editGrant',
            allowMultiple: false
        });

        this.action_delete = new Ext.Action({
            text:  Ext.String.format(Klb.system.translation.ngettext('Delete {0}', 'Delete {0}', 1), this.config.nodeName),
            iconCls: 'action_delete',
            handler: this.deleteNode,
            scope: this.config,
            requiredGrant: 'deleteGrant',
            allowMultiple: true
        });

        this.action_grants = new Ext.Action({
            text:  Ext.String.format(_('Manage {0} Permissions'), this.config.nodeName),
            iconCls: 'action_managePermissions',
            handler: this.managePermissions,
            requiredGrant: 'editGrant',
            scope: this.config
        });

        this.action_properties = new Ext.Action({
            text:  Ext.String.format(_('{0} Properties'), this.config.nodeName),
            iconCls: 'action_manageProperties',
            handler: this.manageProperties,
            requiredGrant: 'readGrant',
            scope: this.config
        });

        // TODO is edit grant required?
        this.action_changecolor = new Ext.Action({
            text:  Ext.String.format(_('Set {0} color'), this.config.nodeName),
            iconCls: 'action_changecolor',
//            requiredGrant: 'editGrant',
            allowMultiple: true,
            menu: Ext.create('Ext.picker.Color', {
                    scope: this,
                    listeners: {
                        select: this.changeNodeColor,
                        scope: this.config
                    }
                })             
        });

        this.action_reload = new Ext.Action({
            text:  Ext.String.format(_('Reload {0}'), this.config.nodeName),
            iconCls: 'x-tbar-loading',
            handler: this.reloadNode,
            scope: this.config
        });

        // TODO move the next 3 to Filemanager!
        this.action_resume = new Ext.Action({
            text:  Ext.String.format(_('Resume upload'), config.nodeName),
            iconCls: 'action_resume',
            handler: this.onResume,
            scope: this.config,
            actionUpdater: this.isResumeEnabled
        });
        this.action_editFile = new Ext.Action({
            requiredGrant: 'editGrant',
            allowMultiple: false,
            text: _('Edit Properties'),
            handler: this.onEditFile,
            iconCls: 'action_edit_file',
            actionType: 'edit',
            scope: this
        });
        this.action_pause = new Ext.Action({
            text:  Ext.String.format(_('Pause upload'), config.nodeName),
            iconCls: 'action_pause',
            handler: this.onPause,
            actionUpdater: this.isPauseEnabled,
            scope: this.config
        });

        this.action_download = new Ext.Action({
            text:  Ext.String.format(_('Download'), config.nodeName),
            iconCls: 'action_filemanager_save_all',
            handler: this.downloadFile,
            actionUpdater: this.isDownloadEnabled,
            scope: this.config
        });

        var items = [];
        for (var i=0; i < config.actions.length; i++) {
            switch(config.actions[i]) {
                case 'add':
                    items.push(this.action_add);
                    break;
                case 'addfolder':
                    items.push(this.action_addfolder);
                    break;
                case 'delete':
                    items.push(this.action_delete);
                    break;
                case 'rename':
                    items.push(this.action_rename);
                    break;
                case 'properties':
                    items.push(this.action_properties);
                    break;
                case 'changecolor':
                    items.push(this.action_changecolor);
                    break;
                case 'grants':
                    items.push(this.action_grants);
                    break;
                case 'reload':
                    items.push(this.action_reload);
                    break;
                case 'resume':
                    items.push(this.action_resume);
                    break;
                case 'pause':
                    items.push(this.action_pause);
                    break;
                case 'download':
                    items.push(this.action_download);
                    break;
                case 'edit':
                    items.push(this.action_editFile);
                    break;
                default:
                    // add custom actions
                    items.push(new Ext.Action(config.actions[i]));
            }
        }


        /******************* return menu **********************/

        return new Ext.menu.Menu({
            items: items
        });
    },

    /**
     * create tree node
     */
    addFolder: function() {

        Ext.MessageBox.prompt( String.format(_('New Folder {0}'), this.nodeName)
            , Ext.String.format(_('Please enter the name of the new {0}:'), this.nodeName)
            , function(_btn, _text) {

                if( this.scope.ctxNode && _btn == 'ok') {

                    if (! _text) {
                        Ext.Msg.alert(Ext.String.format(_('No {0} added'), this.nodeName), v.format(_('You have to supply a {0} name!'), this.nodeName));
                        return;
                    }
                    Ext.MessageBox.wait(_('Please wait'), Ext.String.format(_('Creating {0}...' ), this.nodeName));
                    var parentNode = this.scope.ctxNode;

                    var params = {
                        method: this.backend + '.add' + this.backendModel,
                        name: _text
                    };

                    // TODO try to generalize this and move app specific stuff to app

                    if (this.backendModel == 'Node') {
                        params.application = this.scope.app.appName || this.scope.appName;
                        var filename = parentNode.attributes.nodeRecord.data.path + '/' + _text;
                        params.filename = filename;
                        params.type = 'folder';
                        params.method = this.backend + ".createNode";
                    }
                    else if (this.backendModel == 'Container') {

                        params.application = this.scope.app.appName || this.scope.appName;
                        params.containerType = Klb.system.Container.path2type(parentNode.attributes.path);
                        params.modelName = this.scope.app.getMainScreen().getActiveContentType();
                        params.leaf = 'folder';
//                    params.leaf = attr.hasOwnProperty('leaf') ? !!(attr.leaf == 1) :  !!attr.account_grants,
                        params.parentid = parentNode.attributes.id == 'shared' ? 0 : parentNode.attributes.id;
                    }
                    else if (this.backendModel == 'Folder') {

                        var parentFolder = Klb.system.appMgr.get('Expressomail').getFolderStore().getById(parentNode.attributes.folder_id);
                        params.parent = parentFolder.get('globalname');
                        params.accountId = parentFolder.get('account_id');
                    }
                    Klb.system.Ajax.request({
                        params: params,
                        scope: this,
                        success: function(result, request){
                            var nodeData = Ext.util.JSON.decode(result.responseText);

                            // TODO add + icon if it wasn't expandable before
                            if(nodeData.type == 'folder') {
                                var nodeData = Ext.util.JSON.decode(result.responseText),
                                    app = Klb.system.appMgr.get(this.scope.app.appName),
                                    newNode = app.getMainScreen().getWestPanel().getContainerTreePanel().createTreeNode(nodeData, parentNode);
                                parentNode.appendChild(newNode);
                            }
                            else {
                                var newNode = this.scope.loader.createNode(nodeData);
                                parentNode.appendChild(newNode);
                            }

                            parentNode.expand();
                            this.scope.fireEvent('containeradd', nodeData);

                            Ext.MessageBox.hide();
                        },
                        failure: function(result, request) {
                            var nodeData = Ext.util.JSON.decode(result.responseText);

                            var appContext = Klb.App[this.scope.app.appName];
                            if(appContext && appContext.handleRequestException) {
                                appContext.handleRequestException(nodeData.data);
                            }
                        }
                    });

                }
            }, this);
    },

    /**
     * create tree node
     */
    addNode: function() {
        var me = this,
            _nodeName = this.nodeName;
                
        Ext.MessageBox.prompt( Ext.String.format(_('New {0}'), _nodeName),  Ext.String.format(_('Please enter the name of the new {0}:'), _nodeName), function(_btn, _text) {
            var _scope = this.scope,
                _backend = this.backend;

            if( _scope.ctxNode && _btn == 'ok') {
                if (! _text) {
                    Ext.Msg.alert( Ext.String.format(_('No {0} added'), _nodeName),  Ext.String.format(_('You have to supply a {0} name!'), _nodeName));
                    return;
                }
                Ext.MessageBox.wait(_('Please wait'),  Ext.String.format(_('Creating {0}...' ), _nodeName));
                var parentNode = _scope.ctxNode;

                var params = {
                    method: _backend + '.add' + this.backendModel,
                    name: _text
                };

                // TODO try to generalize this and move app specific stuff to app

                if (this.backendModel == 'Node') {
                    params.application = _scope.app.appName || _scope.appName;
                    var filename = parentNode.attributes.nodeRecord.data.path + '/' + _text;
                    params.filename = filename;
                    params.type = 'folder';
                    params.method = _backend + ".createNode";
                }
                else if (this.backendModel == 'Container') {
                    params.application = _scope.app.appName || _scope.appName;
                    params.containerType = Klb.system.Container.path2type(parentNode.attributes.path);
                    params.modelName = _scope.app.getMainScreen().getActiveContentType();
                    params.parentid = parentNode.attributes.path == '/shared' ? 'dasd:d"' : parentNode.attributes.id;
                    params.leaf = 'file';
                }
                else if (this.backendModel == 'Folder') {
                    var parentFolder = Klb.system.appMgr.get('Expressomail').getFolderStore().getById(parentNode.attributes.folder_id);
                    params.parent = parentFolder.get('globalname');
                    params.accountId = parentFolder.get('account_id');
                }

                Klb.system.Ajax.request({
                    params: params,
                    scope: this,
                    success: function(result, request){
                        var nodeData = Ext.util.JSON.decode(result.responseText);

                        // TODO add + icon if it wasn't expandable before
                        if(nodeData.type == 'folder') {
                            var nodeData = Ext.util.JSON.decode(result.responseText),
                                app = Klb.system.appMgr.get(this.scope.app.appName),
                                newNode = app.getMainScreen().getWestPanel().getContainerTreePanel().createTreeNode(nodeData, parentNode);
                            parentNode.appendChild(newNode);
                        }
                        else {
                            var newNode = this.scope.createNode(nodeData);
                            parentNode.appendChild(newNode);
                        }

                        parentNode.expand();
                        this.scope.fireEvent('containeradd', nodeData);

                        Ext.MessageBox.hide();
                    },
                    failure: function(result, request) {
                        var nodeData = Ext.util.JSON.decode(result.responseText);

                        var appContext = Klb.App[this.scope.app.appName];
                        if(appContext && appContext.handleRequestException) {
                            appContext.handleRequestException(nodeData.data);
                        }
                    }
                });

            }
        }, this);
    },

    /**
     * rename tree node
     */
    renameNode: function() {
        if (this.scope.ctxNode) {

            var node = this.scope.ctxNode;
            Ext.MessageBox.show({
                title:  Ext.String.format(_('Rename {0}'), this.nodeName),
                msg:  Ext.String.format(_('Please enter the new name of the {0}:'), this.nodeName),
                buttons: Ext.MessageBox.OKCANCEL,
                value: node.text,
                fn: function(_btn, _text){
                    if (_btn == 'ok') {
                        if (! _text) {
                            Ext.Msg.alert( Ext.String.format(_('Not renamed {0}'), this.nodeName),  Ext.String.format(_('You have to supply a {0} name!'), this.nodeName));
                            return;
                        }

                        var params = {
                            method: this.backend + '.rename' + this.backendModel,
                            newName: _text
                        };

                        params.application = this.scope.app.appName || this.scope.appName;

                        if (this.backendModel == 'Node') {
                            var filename = node.attributes.path;
                            params.sourceFilenames = [filename];

                            var targetFilename = "/";
                            var sourceSplitArray = filename.split("/");
                            for (var i=1; i<sourceSplitArray.length-1; i++) {
                                targetFilename += sourceSplitArray[i] + '/';
                            }

                            params.destinationFilenames = [targetFilename + _text];
                            params.method = this.backend + '.moveNodes';
                        }

                        // TODO try to generalize this
                        if (this.backendModel == 'Container') {
                            params.containerId = node.attributes.container.id;
                        } else if (this.backendModel == 'Folder') {
                            var folder = Klb.system.appMgr.get('Expressomail').getFolderStore().getById(node.attributes.folder_id);
                            params.oldGlobalName = folder.get('globalname');
                            params.accountId = folder.get('account_id');
                        }

                        Klb.system.Ajax.request({
                            params: params,
                            scope: this,
                            success: function(_result, _request){

                                var nodeData = Ext.util.JSON.decode(_result.responseText);
                                node.setText(_text);

                                this.scope.fireEvent('containerrename', nodeData, node, _text);
                            },
                            failure: function(result, request) {

                                var nodeData = Ext.util.JSON.decode(result.responseText);
                                var appContext = Klb.App[this.scope.app.appName];
                                if(appContext && appContext.handleRequestException) {
                                    appContext.handleRequestException(nodeData.data);
                                }
                            }
                        });
                    }
                },
                scope: this,
                prompt: true,
                icon: Ext.MessageBox.QUESTION
            });
        }
    },

    /**
     * delete tree node
     */
    deleteNode: function() {

        if (this.scope.ctxNode) {
            var node = this.scope.ctxNode;

            Klb.Logger.debug('Klb.system.widgets.tree.ContextMenu::deleteNode()');
            Klb.Logger.debug(node);

            Ext.MessageBox.confirm(_('Confirm'),  Ext.String.format(_('Do you really want to delete the {0} "{1}"?'), this.nodeName, node.text), function(_btn){
                if ( _btn == 'yes') {

                    var params = {
                        method: this.backend + '.delete' + this.backendModel
                    };

                    if (this.backendModel == 'Node') {

                        var filenames = [node.attributes.path];
                        params.application = this.scope.app.appName || this.scope.appName;
                        params.filenames = filenames;
                        params.method = this.backend + ".deleteNodes";

                    } else if (this.backendModel == 'Container') {
                        params.containerId = node.attributes.container.id;
                    } else if (this.backendModel == 'Folder') {
                        var folder = Klb.system.appMgr.get('Expressomail').getFolderStore().getById(node.attributes.folder_id);
                        params.folder = folder.get('globalname');
                        params.accountId = folder.get('account_id');
                    } else {
                        // use default json api style
                        params.ids = [node.id];
                        params.method = params.method + 's';
                    }

                    Klb.system.Ajax.request({
                        params: params,
                        scope: this,
                        success: function(_result, _request){

                            if(node) {
                                if(node.isSelected()) {
                                    this.scope.getSelectionModel().select(node.parentNode);
                                    this.scope.fireEvent('click', node.parentNode, Ext.EventObject.setEvent());
                                }

                                node.remove();
                                if (this.backendModel == 'Container') {
                                    this.scope.fireEvent('containerdelete', node.attributes.container);
                                } else if (this.backendModel == 'Node') {
                                    this.scope.fireEvent('containerdelete', node);
                                } else {
                                    this.scope.fireEvent('containerdelete', node.attributes);
                                }
                            }

                        },
                        failure: function(result, request) {
                            var nodeData = Ext.util.JSON.decode(result.responseText);
                            var appContext = Klb.App[this.scope.app.appName];
                            if(appContext && appContext.handleRequestException) {
                                appContext.handleRequestException(nodeData.data);
                            }
                        }
                    });
                }
            }, this);
        }
    },

    /**
     * change tree node color
     */
    changeNodeColor: function(cp, color) {
        if (this.scope.ctxNode) {
            var node = this.scope.ctxNode;
            node.getUI().addClass("x-tree-node-loading");
                Klb.system.Ajax.request({
                    params: {
                        method: this.backend + '.set' + this.backendModel + 'Color',
                        containerId: node.attributes.container.id,
                        color: '#' + color
                    },
                    scope: this,
                    success: function(_result, _request){
                        var nodeData = Ext.util.JSON.decode(_result.responseText);
                        node.getUI().colorNode.setStyle({color: nodeData.color});
                        node.attributes.color = nodeData.color;
                        this.scope.fireEvent('containercolorset', nodeData);
                        node.getUI().removeClass("x-tree-node-loading");
                    },
                    failure: function(result, request) {
                        var nodeData = Ext.util.JSON.decode(result.responseText);

                        var appContext = Klb.App[this.scope.app.appName];
                        if(appContext && appContext.handleRequestException) {
                            appContext.handleRequestException(nodeData.data);
                        }
                    }
                });

        }
    },

    /**
     * manage permissions
     *
     */
    managePermissions: function() {

        if (this.scope.ctxNode) {
            var node = this.scope.ctxNode,
                grantsContainer;
            if(node.attributes.nodeRecord && node.attributes.nodeRecord.data.name) {
                grantsContainer = node.attributes.nodeRecord.data.name;
            } else if(node.attributes.container) {
                grantsContainer = node.attributes.container;
            }

            var window = Klb.system.widgets.container.GrantsDialog.openWindow({
                title:  Ext.String.format(_('Manage Permissions for {0} "{1}"'), this.nodeName, Ext.util.Format.htmlEncode(grantsContainer.name)),
                containerName: this.nodeName,
                grantContainer: grantsContainer,
                app: this.scope.app.appName
            });
        }

    },

    /**
     * manage properties
     *
     */
    manageProperties: function() {
        if (this.scope.ctxNode) {
            var node = this.scope.ctxNode,
                grantsContainer;
            if(node.attributes.nodeRecord && node.attributes.nodeRecord.data.name) {
                grantsContainer = node.attributes.nodeRecord.data.name;
            } else if(node.attributes.container) {
                grantsContainer = node.attributes.container;
            }

            var window = Klb.system.widgets.container.PropertiesDialog.openWindow({
                title:  Ext.String.format(_('Properties for {0} "{1}"'), this.nodeName, Ext.util.Format.htmlEncode(grantsContainer.name)),
                containerName: this.nodeName,
                grantContainer: grantsContainer,
                app: this.scope.app.appName
            });
        }
    },

    /**
     * reload node
     */
    reloadNode: function() {
        if (this.scope.ctxNode) {
            var tree = this.scope;
            tree.ctxNode.load(function(node) {
                node.expand();
                node.select();
                // update grid
                tree.filterPlugin.onFilterChange();
            });
        }
    }

};
