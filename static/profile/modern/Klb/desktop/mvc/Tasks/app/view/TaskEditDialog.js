/*
 * Klb Desktop 3.0.1
 * 
 * @package     Modern
 * @subpackage  Content.Common
 * @copyright   Copyright (c) 2018 LLC ICS (http://www.icstime.com)
 * @license     http://www.gnu.org/licenses/agpl.html AGPL Version 3
 */

Ext.ns('KlbDesktop.MVC.Tasks');

/**
 * @namespace   KlbDesktop.MVC.Tasks
 * @class       KlbDesktop.MVC.Tasks.view.TaskEditDialog
 * @extends     Klb.system.widgets.dialog.EditDialog
 *
 * @param       {Object} config
 * @constructor
 * Create a new KlbDesktop.MVC.Tasks.view.TaskEditDialog
 */
Ext.define('KlbDesktop.MVC.Tasks.view.TaskEditDialog', {
    extend:  'Klb.system.widgets.dialog.EditDialog',
    alternateClassName: 'KlbDesktop.MVC.Tasks.TaskEditDialog',
    /**
     * @cfg {Number} containerId
     */
    containerId: -1,
    
    /**
     * @cfg {String} relatedApp
     */
    relatedApp: '',
    
    /**
     * @private
     */
    labelAlign: 'side',
    
    /**
     * @private
     */
    windowNamePrefix: 'TasksEditWindow_',
    appName: 'Tasks',
    recordClass: KlbDesktop.MVC.Tasks.Model.Task,
    recordProxy: KlbDesktop.MVC.Tasks.JsonBackend,
    showContainerSelector: true,
    tbarItems: [{xtype: 'activitiesaddbutton'}],
       alarmPanel: false,
       remarkPanel: false,
       checklistPanel: false,
    /**
     * @private
     */
    initComponent: function() {

        if(!this.record) {
            this.record = Ext.create(this.recordClass, this.recordClass.getDefaultData());
        }
        this.alarmPanel = new Klb.system.widgets.dialog.AlarmPanel({});
//        this.remarkPanel = new Klb.system.widgets.dialog.RemarksPanel({});

        this.callParent();
    },
    
    /**
     * executed when record is loaded
     * @private
     */
    onRecordLoad: function() {
        // interrupt process flow until dialog is rendered
        if (! this.rendered) {
            Ext.Function.defer(this.onRecordLoad, 250, this);
            return;
        }

        this.callParent(arguments);
        this.handleCompletedDate();

        // update tabpanels
        this.alarmPanel.onRecordLoad(this.record);
    },
    
    /**
     * executed when record is updated
     * @private
     */
    onRecordUpdate: function() {
        this.callParent(arguments);
        this.alarmPanel.onRecordUpdate(this.record);
    },
    
    /**
     * handling for the completed field
     * @private
     */
    handleCompletedDate: function() {

        var statusStore = Klb.system.widgets.keyfield.StoreMgr.get('Tasks', 'taskStatus'),
            status = this.getForm().findField('status').getValue(),
            statusRecord = statusStore.getById(status),
            completedField = this.getForm().findField('completed');

        if (statusRecord) {
            if (statusRecord.get('is_open') !== 0) {
                completedField.setValue(null);
                completedField.setDisabled(true);
            } else {
                if (! Ext.isDate(completedField.getValue())){
                    completedField.setValue(new Date());
                }
                completedField.setDisabled(false);
            }
        }
        
    },
    
    /**
     * checks if form data is valid
     * 
     * @return {Boolean}
     */
    isValid: function() {
        var isValid = true;

        if (this.attachmentGrid.isUploading()) {
            isValid = false;
            this.validationErrorMessage = this.app.i18n._('Files are still uploading.');
            return isValid;
        } 

        var dueField = this.getForm().findField('due'),
            dueDate = dueField.getValue(),
            alarms = this.alarmPanel.alarmGrid.getFromStoreAsArray();

        if (! Ext.isEmpty(alarms) && ! Ext.isDate(dueDate)) {
            dueField.markInvalid(this.app.i18n._('You have to supply a due date, because an alarm ist set!'));
            
            isValid = false;
        }
        
        return isValid && KlbDesktop.MVC.Tasks.view.TaskEditDialog.superclass.isValid.apply(this, arguments);
    },
    /**
     * init attachment grid 
     */
    initAttachmentGrid: function() {
        if (! this.attachmentGrid) {
        
            this.attachmentGrid = new Klb.system.widgets.grid.FileUploadGrid({
                fieldLabel: this.app.i18n._('Attachments'),
                hideLabel: true,
                filesProperty: 'attachments',
                anchor: '100% 95%'

            });
        }
    },
    initchecklistGrid: function() { 

        this.checklistPanel = Ext.create('KlbDesktop.MVC.Tasks.view.ChecklistPanel', { record: this.record });
    },
    /**
     * returns dialog
     * 
     * NOTE: when this method gets called, all initalisation is done.
     * @private
     */
    getFormItems: function() {

        this.initAttachmentGrid();

        return {
            xtype: 'tabpanel',
            border: false,
            plain:true,
            activeTab: 0,
            // plugins: [{
            //     ptype : 'ux.tabpanelkeyplugin'
            // }],
            items:[{
                title: this.app.i18n.n_('Task', 'Tasks', 1),
                border: false,
                autoScroll: true,
                frame: true,
                layout: 'border',
                default: {
                   xtype: 'container'
                },
                items: [{
                    region: 'center',
                    xtype: 'columnform',
                    labelAlign: 'top',
                    formDefaults: {
                        xtype:'textfield',
                        anchor: '100%',
                        labelSeparator: '',
                        columnWidth: .333
                    },
                    items: [[{
                        columnWidth: 1,
                        fieldLabel: this.app.i18n._('Summary'),
                        name: 'summary',
                        listeners: {render: function(field){field.focus(false, 250);}},
                        allowBlank: false
                    }],[ Ext.create('Ext.ux.form.DateTimeField', {
                                fieldLabel: this.app.i18n._('Creation Time'), 
                                allowBlank: true,
                                name: 'started_by',
                         }),{
                                fieldLabel: this.app.i18n._('Duration '), 
                                name: 'end_scheduled',
                                anchor: '95%',
                                minValue: 0
                         }, {
                                xtype: 'mirrortextfield',
                                fieldLabel: this.app.i18n._('Web'),
                                // labelIcon: Klb.Common.DESKTOP_RESOURCE_PATH + '/images/oxygen/16x16/actions/network.png',
                                name: 'url',
                                maxLength: 128,
                                listeners: {
                                    scope: this,
                                    focus: function (field) {
                                        if (! field.getValue()) {
                                            field.setValue('http://www.');
                                            Ext.Function.defer(field.selectText, 100, field, [7, 11]);
                                        }
                                    },
                                    blur: function (field) {
                                        if (field.getValue() === 'http://www.') {
                                            field.setValue(null);
                                            field.validate();
                                        }
                                        if (field.getValue().indexOf('http://http://') == 0 || field.getValue().indexOf('http://https://') == 0) {
                                            field.setValue(field.getValue().substr(7));
                                            field.validate();
                                        }
                                        if (field.getValue().indexOf('http://www.http://') == 0 || field.getValue().indexOf('http://www.https://') == 0) {
                                            field.setValue(field.getValue().substr(11));
                                            field.validate();
                                        }
                                    }
                                }
                         }
                      ], [ Ext.create('Ext.ux.form.DateTimeField', {
                            allowBlank: true,
                            defaultTime: '12:00',
                            fieldLabel: this.app.i18n._('Due date'),
                            name: 'due'
                        }),
                           Ext.create('Klb.system.widgets.keyfield.ComboBox', {
                            fieldLabel: this.app.i18n._('Priority'),
                            name: 'priority',
                            app: 'Tasks',
                            keyFieldName: 'taskPriority',
                            value: 'NORMAL'
                        }),
                        // Klb.system.widgets.form.RecordPickerManager.get('Addressbook', 'Contact', {
                        //     userOnly: true,
                        //     fieldLabel: this.app.i18n._('Organizer'),
                        //     emptyText: _('Add Responsible ...'),
                        //     useAccountRecord: true,
                        //     name: 'organizer',
                        //     allowEmpty: true
                        // })
                    ], [{
                        columnWidth: 1,
                        fieldLabel: this.app.i18n._('Notes'),
                        emptyText: this.app.i18n._('Enter description...'),
                        name: 'description',
                        xtype: 'textarea',
                        flex: 1,
                        height: 120,
                        anchor: '100% 100%'
                    }], [
                        Ext.create('Ext.ux.PercentCombo', {
                            fieldLabel: this.app.i18n._('Percentage'),
                            editable: false,
                            name: 'percent'
                        }),
                        Ext.create('Klb.system.widgets.keyfield.ComboBox', {
                            app: 'Tasks',
                            keyFieldName: 'taskStatus',
                            fieldLabel: this.app.i18n._('Status'),
                            name: 'status',
                            allowBlank: false,
                            listeners: {scope: this, 'change': this.handleCompletedDate}
                        }),
                        Ext.create('Ext.ux.form.DateTimeField', {
                            allowBlank: true,
                            defaultTime: '12:00',
                            fieldLabel: this.app.i18n._('Completed'),
                            name: 'completed'
                        })
                    ]]
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
                        new Klb.system.widgets.activities.ActivitiesPanel({
                            app: 'Tasks',
                            showAddNoteForm: false,
                            border: false,
                            bodyStyle: 'border:1px solid #B5B8C8;'
                        }),
                        new Klb.system.widgets.tags.TagsPanel({
                            app: 'Tasks',
                            border: false,
                            bodyStyle: 'border:1px solid #B5B8C8;'
                        })
                    ]
                } 
                ]
            }, new Klb.system.widgets.activities.ActivitiesTabPanel({
                app: this.appName,
                record_id: (this.record) ? this.record.id : '',
                record_model: this.appName + '_Model_' + this.recordClass.getMeta('modelName')
            })
              , this.alarmPanel 
//              , this.remarkPanel
            ]
        };
    }
});

/**
 * Task Edit Popup
 *
 * @param   {Object} config
 * @return  {Ext.ux.Window}
 */
KlbDesktop.MVC.Tasks.view.TaskEditDialog.openWindow = function (config) {
    var id = (config.record && config.record.id) ? config.record.id : 0;
    var window = Klb.system.WindowFactory.getWindow({
        width: 900,
        height: 490,
        name: KlbDesktop.MVC.Tasks.view.TaskEditDialog.prototype.windowNamePrefix + id,
        contentPanelConstructor: 'KlbDesktop.MVC.Tasks.view.TaskEditDialog',
        contentPanelConstructorConfig: config
    });
    return window;
}