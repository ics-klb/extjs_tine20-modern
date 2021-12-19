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
 * @namespace KlbDesktop.MVC.Filemanager
 * @class KlbDesktop.MVC.Filemanager.Application
 * @extends Klb.system.Application
 */

Ext.define('KlbDesktop.MVC.Filemanager.Core', {
    extend: "Object",
    constructor: function () {
        this.registry = new Ext.util.MixedCollection();
        var prefixCls = 'KlbDesktop.MVC.Filemanager',
            _registry = this.registry;

        _registry.add('Application',  prefixCls + '.Application');
        _registry.add('MainScreen' ,  prefixCls + '.MainScreen');
        _registry.add('Models',       prefixCls + '.Model');
        _registry.add('CenterPanel',  prefixCls + '.view.NodeGridPanel');
        _registry.add('TreePanel'  ,  prefixCls + '.view.NodeTreePanel');
        _registry.add('EditDialog',   prefixCls + '.view.NodeEditDialog');
        _registry.add('FilterPanel',  prefixCls + '.view.PathFilterModel');
    }
});

Ext.define('KlbDesktop.MVC.Filemanager.Application', {
    extend: 'Klb.system.Application',
    alternateClassName: 'KlbDesktop.MVC.Filemanager.controller.Application',
    requires: [
          'Klb.system.widgets.dialog.FileListDialog'
        , 'KlbDesktop.MVC.Filemanager.view.NodeGridPanel'
        , 'KlbDesktop.MVC.Filemanager.view.NodeTreePanel'
        , 'KlbDesktop.MVC.Filemanager.view.NodeEditDialog'
        , 'KlbDesktop.MVC.Filemanager.view.GridContextMenu'
        , 'KlbDesktop.MVC.Filemanager.view.PathFilterModel'
        , 'KlbDesktop.MVC.Filemanager.view.PathFilterPlugin'

        , 'KlbDesktop.MVC.Filemanager.view.SearchCombo'
    ],

    /**
     * @return {Boolean}
     */
    init: function () {
        Klb.Logger.info('Initialize Filemanager');
        
        if (! Klb.system.Common.hasRight('manage', 'Filemanager', 'main_screen')) {
            Klb.Logger.debug('No mainscreen right for Filemanager');
            this.hasMainScreen = false;
        }
        return true;
    },
    
    /**
     * Get translated application title of this application
     * 
     * @return {String}
     */
    getTitle : function() {
        return this.i18n.gettext('Filemanager');
    }
});

/*
 * register additional action for genericpickergridpanel
*/ 
Klb.system.widgets.relation.MenuItemManager.register('Filemanager', 'Node', {
    text: _('Save locally'),
    iconCls: 'action_filemanager_save_all',
    requiredGrant: 'readGrant',
    actionType: 'download',
    allowMultiple: false,
    handler: function(action) {
        var node = action.grid.store.getAt(action.gridIndex).get('related_record');
        var downloadPath = node.path;
        var downloader = new Ext.ux.file.Download({
            params: {
                method: 'Filemanager.downloadFile',
                requestType: 'HTTP',
                id: '',
                path: downloadPath
            }
        }).start();
    }
});


/**
 * @namespace KlbDesktop.MVC.Filemanager
 * @class KlbDesktop.MVC.Filemanager.MainScreen
 * @extends Klb.system.widgets.MainScreen
 */
Ext.define('KlbDesktop.MVC.Filemanager.MainScreen', {
    extend: 'Klb.system.widgets.MainScreen',

    activeContentType: 'Node'
});

/**
 * generic exception handler for filemanager
 * 
 * @param {Klb.system.Exception} exception
 */
KlbDesktop.MVC.Filemanager.handleRequestException = function(exception, request) {
    
    var app = Klb.system.appMgr.get('Filemanager'),
        existingFilenames = [],
        nonExistantFilenames = [],
        i,
        filenameWithoutPath = null;
    
    switch(exception.code) {
        // overwrite default 503 handling and add a link to the wiki
        case 503:
            Ext.MessageBox.show({
                buttons: Ext.Msg.OK,
                icon:    Ext.MessageBox.WARNING,
                title: _('Service Unavailable'), 
                msg: Ext.String.format( app.i18n._('The Filemanager is not configured correctly. Please refer to the CLK 2.3.8 Admin FAQ for configuration advice or contact your administrator.') )
             });
            break;
            
        case 901: 
            if (request) {
                Klb.Logger.debug('KlbDesktop.MVC.Filemanager.handleRequestException - request exception:');
                Klb.Logger.debug(exception);
                
                if (exception.existingnodesinfo) {
                    for (i = 0; i < exception.existingnodesinfo.length; i++) {
                        existingFilenames.push(exception.existingnodesinfo[i].name);
                    }
                }
                
                this.conflictConfirmWin = Klb.system.widgets.dialog.FileListDialog.openWindow({
                    modal: true,
                    allowCancel: false,
                    height: 180,
                    width: 300,
                    title: app.i18n._('Files already exists') + '. ' + app.i18n._('Do you want to replace the following file(s)?'),
                    text: existingFilenames.join('<br />'),
                    scope: this,
                    handler: function(button) {
                        var params = request.params,
                            uploadKey = exception.uploadKeyArray;
                        params.method = request.method;
                        params.forceOverwrite = true;
                        
                        if (button == 'no') {
                            Klb.Logger.debug('KlbDesktop.MVC.Filemanager.handleRequestException::' + params.method + ' -> only non-existant nodes.');
                            Ext.each(params.filenames, function(filename) {
                                filenameWithoutPath = filename.match(/[^\/]*$/);
                                if (filenameWithoutPath && existingFilenames.indexOf(filenameWithoutPath[0]) === -1) {
                                    nonExistantFilenames.push(filename);
                                }
                            });
                            params.filenames = nonExistantFilenames;
                            uploadKey = nonExistantFilenames;
                        } else {
                            Klb.Logger.debug('KlbDesktop.MVC.Filemanager.handleRequestException::' + params.method + ' -> replace all existing nodes.');
                        }
                        
                        if (params.method == 'Filemanager.copyNodes' || params.method == 'Filemanager.moveNodes' ) {
                            KlbDesktop.MVC.Filemanager.fileRecordBackend.copyNodes(null, null, null, params);
                        } else if (params.method == 'Filemanager.createNodes' ) {
                            KlbDesktop.MVC.Filemanager.fileRecordBackend.createNodes(params, uploadKey, exception.addToGridStore);
                        }
                    }
                });
                
            } else {
                Ext.Msg.show({
                  title:   app.i18n._('Failure on create folder'),
                  msg:     app.i18n._('Item with this name already exists!'),
                  icon:    Ext.MessageBox.ERROR,
                  buttons: Ext.Msg.OK
               });
            }
            break;
            
        default:
            Klb.system.ExceptionHandler.handleRequestException(exception);
            break;
    }
};
