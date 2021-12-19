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
 * File grid panel
 * 
 * @namespace   KlbDesktop.MVC.Tasks
 * @class       KlbDesktop.MVC.Tasks.TaskGridPanel
 * @extends     Klb.system.widgets.grid.GridPanel
 */
Ext.define('KlbDesktop.MVC.Tasks.view.TaskGridPanel', {
    extend:  'Klb.system.widgets.grid.GridPanel',
    /**
     * @private grid cfg
     */
    defaultSortInfo: {field: 'due', dir: 'ASC'},
    gridConfig: {
        clicksToEdit: 'auto',
        quickaddMandatory: 'summary',
        resetAllOnNew: false,
        autoExpandColumn: 'summary',
        // drag n drop
        enableDragDrop: true,
        ddGroup: 'containerDDGroup'
    },

    // specialised translations
    // ngettext('Do you really want to delete the selected task?', 'Do you really want to delete the selected tasks?', n);
    i18nDeleteQuestion: ['Do you really want to delete the selected task?', 'Do you really want to delete the selected tasks?'],
    
    /**
     * @private
     */
    initComponent: function() {
        var me = this;

        /**
         * record class
         * @cfg {KlbDesktop.MVC.Tasks.Model.Task} recordClass
         */
        me.recordClass = KlbDesktop.MVC.Tasks.Model.Task;
        me.recordProxy = KlbDesktop.MVC.Tasks.fileRecordBackend;
        me.gridConfig.columns = this.getColumnModel();

        me.defaultFilters = [
            {field: 'container_id', operator: 'equals', value: {path: Klb.system.Container.getMyNodePath()}}
        ];

        me.callParent();
    },
    
    /**
     * returns cm
     * @return Ext.grid.ColumnModel
     * @private
     */
    getColumnModel: function(){

        var _columns  = [
            {  header: this.app.i18n._('Tags'), width: 50,  dataIndex: 'tags', sortable: false,
                renderer: Klb.system.Common.tagsRenderer },
            {  header: this.app.i18n._('Lead'), dataIndex: 'relations', sortable: false, hidden: true,
                renderer: this.leadRenderer },
            {  header: this.app.i18n._("Summary"), width: 400, flex: 1, dataIndex: 'summary',
                quickaddField:  Ext.create('Ext.form.TextField', {
                    emptyText: this.app.i18n._('Add a task...')
                }) },
            {  header: this.app.i18n._("Creation Time"),  width: 120, dataIndex: 'started_by',
                renderer: Klb.system.Common.dateTimeRenderer
            }, {
                header: this.app.i18n._("Due Date"), width: 120, dataIndex: 'due',
                renderer: Klb.system.Common.dateTimeRenderer,
                editor: new Ext.ux.form.DateTimeField({
                    defaultTime: '12:00',
                    allowBlank: true
                }),
                quickaddField:  Ext.create('Ext.ux.form.DateTimeField', {
                    defaultTime: '12:00',
                    allowBlank: true
                })
            }, {
                header: this.app.i18n._("Priority"), width: 65,  dataIndex: 'priority',
                renderer: Klb.system.widgets.keyfield.Renderer.get('Tasks', 'taskPriority'),
                editor: {
                    xtype: 'widget-keyfieldcombo',
                    app: 'Tasks',
                    keyFieldName: 'taskPriority'
                },
                quickaddField:  Ext.create('Klb.system.widgets.keyfield.ComboBox', {
                   app: 'Tasks',
                   keyFieldName: 'taskPriority',
                   value: 'NORMAL'
               })
            }, {
                header: this.app.i18n._("Percent"),
                width: 50,
                dataIndex: 'percent',
                renderer: Ext.ux.PercentRenderer,
                editor: new Ext.ux.PercentCombo({
                    autoExpand: true,
                    blurOnSelect: true
                }),
               quickaddField: Ext.create('Ext.ux.PercentCombo', {
                   autoExpand: true
               })
            }, {
                header: this.app.i18n._("Status"),
                width: 85,
                dataIndex: 'status',
                renderer: Klb.system.widgets.keyfield.Renderer.get('Tasks', 'taskStatus'),
                editor: {
                    xtype: 'widget-keyfieldcombo',
                    app: 'Tasks',
                    keyFieldName: 'taskStatus'
                },
               quickaddField:  Ext.create('Klb.system.widgets.keyfield.ComboBox', {
                   app: 'Tasks',
                   keyFieldName: 'taskStatus',
                   value: 'NEEDS-ACTION'
               })
            }, {
                header: this.app.i18n._("Creation Time"), width: 90, dataIndex: 'creation_time', hidden: true,
                renderer: Klb.system.Common.dateTimeRenderer
            }, {
                header: this.app.i18n._("Completed"), width: 90, dataIndex: 'completed', hidden: true,
                renderer: Klb.system.Common.dateTimeRenderer
            }
            // , {
                // id: 'organizer',
                // header: this.app.i18n._('Responsible'), width: 200,  dataIndex: 'organizer',
                // renderer: Klb.system.Common.accountRenderer,
//                quickaddField: Klb.system.widgets.form.RecordPickerManager.get('Addressbook', 'Contact', {
//                    userOnly: true,
//                    useAccountRecord: true,
//                    blurOnSelect: true,
//                    selectOnFocus: true,
//                    allowEmpty: true,
//                    value: Klb.App.Api.registry.get('currentAccount')
//                })
//             }
        ];
        // TODO add customfields and modlog columns, atm they break the layout :(
        //.concat(this.getModlogColumns().concat(this.getCustomfieldColumns()))

        // var headerCt = Ext.create('Ext.grid.header.Container', {
        var headerCt =  {
            defaults: {
                sealed: true,
                sortable: true,
                resizable: true
            },
            items: _columns
        };
        return headerCt;
    },

    getViewAddConfig: function () {
        return  {
            plugins: {
                ptype: 'gridviewdragdrop',
                    ddGroup: 'task',
                    dragText: 'Drag task to change list',
                    enableDrop: false
            }
        };
    },

    /**
     * Handles the CellEditing plugin's "edit" event
     * @private
     * @param {Ext.grid.plugin.CellEditing} editor
     * @param {Object} e                                an edit event object
     */
    handleCellEdit: function(editor, e) {
        this.fireEvent('recordedit', e.record);
    },

    /**
     * return lead name for first linked Crm_Model_Lead
     * 
     * @param {Object} data
     * @return {String} lead name
     */
    leadRenderer: function(data) {
    
        if( Ext.isArray(data) && data.length > 0) {
            var index = 0;
            // get correct relation type from data (contact) array and show first matching record (org_name + n_fileas)
            while (index < data.length && data[index].related_model != 'Crm_Model_Lead') {
                index++;
            }
            if (data[index]) {
                var name = (data[index].related_record.lead_name !== null ) ? data[index].related_record.lead_name : '';
                return Ext.util.Format.htmlEncode(name);
            }
        }
    },    

    /**
     * Return CSS class to apply to rows depending upon due status
     * 
     * @param {KlbDesktop.MVC.Tasks.Model.Task} record
     * @param {Integer} index
     * @return {String}
     */
    getViewRowClass: function(record, index) {
        var due = record.get('due');
         
        var className = '';
        
        if(record.get('status') == 'COMPLETED') {
            className += 'tasks-grid-completed';
        } else  if (due) {
            var dueDay = due.format('Y-m-d');
            var today = new Date().format('Y-m-d');

            if (dueDay == today) {
                className += 'tasks-grid-duetoday';
            } else if (dueDay < today) {
                className += 'tasks-grid-overdue';
            }
            
        }
        return className;
    }
});
