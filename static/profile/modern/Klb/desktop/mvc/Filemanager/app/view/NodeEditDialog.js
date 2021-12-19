/*
 * Klb Desktop 3.0.1
 * 
 * @package     Filemanager
 * @subpackage  view.NodeEditDialog
 * @copyright   Copyright (c) 2018 LLC ICS (http://www.icstime.com)
 * @license     http://www.gnu.org/licenses/agpl.html AGPL Version 3
 */

Ext.ns('KlbDesktop.MVC.Filemanager');

/**
 * @namespace   KlbDesktop.MVC.Filemanager
 * @class       KlbDesktop.MVC.Filemanager.NodeEditDialog
 * @extends     Klb.system.widgets.dialog.EditDialog
 *
 * @param       {Object} config
 * @constructor
 * Create a new KlbDesktop.MVC.Filemanager.NodeEditDialog
 */
Ext.define('KlbDesktop.MVC.Filemanager.view.NodeEditDialog', {
    extend: 'Klb.system.widgets.dialog.EditDialog',
    alternateClassName: 'KlbDesktop.MVC.Filemanager.NodeEditDialog',
    /**
     * @private
     */
    windowNamePrefix: 'NodeEditWindow_',
    appName: 'Filemanager',
    recordClass: KlbDesktop.MVC.Filemanager.Model.Node,
    recordProxy: KlbDesktop.MVC.Filemanager.fileRecordBackend,
    tbarItems: null,
    evalGrants: true,
    showContainerSelector: false,
    
    initComponent: function() {
        this.app = Klb.system.appMgr.get('Filemanager');
        this.downloadAction = Ext.create('Ext.Action', {
            requiredGrant: 'readGrant',
            allowMultiple: false,
            actionType: 'download',
            text: this.app.i18n._('Save locally'),
            handler: this.onDownload,
            iconCls: 'action_filemanager_save_all',
            disabled: false,
            scope: this
        });
        
        this.tbarItems = [{xtype: 'activitiesaddbutton'}, this.downloadAction];
        
        this.callParent();
    },
    
    /**
     * download file
     */
    onDownload: function() {
        var downloader = new Ext.ux.file.Download({
            params: {
                method: 'Filemanager.downloadFile',
                requestType: 'HTTP',
                path: '',
                id: this.record.get('id')
            }
        }).start();
    },
    
    /**
     * returns dialog
     * @return {Object}
     * @private
     */
    getFormItems: function() {
        var formFieldDefaults = {
            xtype:'textfield',
            anchor: '100%',
            labelSeparator: '',
            columnWidth: .5,
            readOnly: true,
            disabled: true
        };
        
        return [{
            xtype: 'tabpanel',
            border: false,
            plain:  true,
            // plugins: [{
            //     ptype : 'ux.tabpanelkeyplugin'
            // }],
            activeTab: 0,

            items:[{
                title: this.app.i18n._('Node'),
                // autoScroll: true,
                border: false,
                // frame: true,
                layout: 'border',
                items: [{
                    region: 'center',
                    // layout: 'fit',
                    layout: {
                        type: 'vbox',
                        pack: 'start',
                        align: 'stretch'
                    },
                    border: false,
                    items: [{
                        xtype: 'fieldset',
                        layout: 'fit',
                        autoHeight: true,
                        title: this.app.i18n._('Node'),
                        items: [{
                            xtype: 'columnform',
                            labelAlign: 'top',
                            formDefaults: formFieldDefaults,
                            items: [[{
                                    fieldLabel: this.app.i18n._('Name'),
                                    name: 'name',
                                    allowBlank: false,
                                    readOnly: false,
                                    columnWidth: .75,
                                    disabled: false
                                }, {
                                    fieldLabel: this.app.i18n._('Type'),
                                    name: 'contenttype',
                                    columnWidth: .25
                                }]
                                // , [ Klb.system.widgets.form.RecordPickerManager.get('Addressbook', 'Contact', {
                                //     userOnly: true,
                                //     useAccountRecord: true,
                                //     blurOnSelect: true,
                                //     fieldLabel: this.app.i18n._('Created By'),
                                //     name: 'created_by'
                                // }), {
                                //     fieldLabel: this.app.i18n._('Creation Time'),
                                //     name: 'creation_time',
                                //     xtype: 'datefield'
                                // }
                                // ],
                                // [ Klb.system.widgets.form.RecordPickerManager.get('Addressbook', 'Contact', {
                                //     userOnly: true,
                                //     useAccountRecord: true,
                                //     blurOnSelect: true,
                                //     fieldLabel: this.app.i18n._('Modified By'),
                                //     name: 'last_modified_by'
                                // }), {
                                //     fieldLabel: this.app.i18n._('Last Modified'),
                                //     name: 'last_modified_time',
                                //     xtype: 'datefield'
                                // }
                                // ]
                            ]
                        }]
                    }
                    
                    ]
                }, {
                    // activities and tags
                    layout: 'accordion',
                    animate: true,
                    region: 'east',
                    width: 210,
                    split: true,
                    collapsible: true,
                    collapseMode: 'mini',
                    header: false,
                    margins: '0 5 0 5',
                    border: true,
                    items: [
                        new Ext.Panel({
                            title: this.app.i18n._('Description'),
                            iconCls: 'descriptionIcon',
                            layout: 'fit',
                            labelAlign: 'top',
                            border: false,
                            items: [{
                                style: 'margin-top: -1px; border 0px;',
                                labelSeparator: '',
                                xtype: 'textarea',
                                flex: 1,
                                name: 'description',
                                hideLabel: true,
                                grow: false,
                                preventScrollbars: false,
                                anchor: '100% 100%',
                                emptyText: this.app.i18n._('Enter description'),
                                maxLength: 255,
                                requiredGrant: 'editGrant'
                            }]
                        }),
                        new Klb.system.widgets.activities.ActivitiesPanel({
                            app: 'Filemanager',
                            showAddNoteForm: false,
                            border: false,
                            bodyStyle: 'border:1px solid #B5B8C8;'
                        }),
                        new Klb.system.widgets.tags.TagsPanel({
                            app: 'Filemanager',
                            border: false,
                            bodyStyle: 'border:1px solid #B5B8C8;'
                        })
                    ]
                }]
            }, 
            new Klb.system.widgets.activities.ActivitiesTabPanel({
                app: this.appName,
                record_id: this.record.id,
                record_model: this.appName + '_Model_' + this.recordClass.getMeta('modelName')
                })
            ]
        }];
    }
}, function() {

    /**
     * Filemanager Edit Popup
     *
     * @param   {Object} config
     * @return  {Ext.ux.Window}
     */
    KlbDesktop.MVC.Filemanager.view.NodeEditDialog.openWindow = function (config) {
        var id = (config.record && config.record.id) ? config.record.id : 0;
        var window = Klb.system.WindowFactory.getWindow({
            width: 800,
            height: 570,
            name: KlbDesktop.MVC.Filemanager.NodeEditDialog.prototype.windowNamePrefix + id,
            contentPanelConstructor: 'KlbDesktop.MVC.Filemanager.view.NodeEditDialog',
            contentPanelConstructorConfig: config
        });

        return window;
    }
});

