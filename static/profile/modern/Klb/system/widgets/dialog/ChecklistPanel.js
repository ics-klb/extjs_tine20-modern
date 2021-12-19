/*
 * Modern 3.1.0
 * 
 * @license     http://www.gnu.org/licenses/agpl.html AGPL Version 3
 * @author      Philipp Schuele <p.schuele@metaways.de>
 * @copyright   Copyright (c) 2009-2012 Metaways Infosystems GmbH (http://www.metaways.de)
 */
 
Ext.ns('Klb.system.widgets', 'Klb.system.widgets.dialog');

/**
 * Alarm Panel
 * 
 * @namespace   Klb.system.widgets.dialog
 * @class       Klb.system.widgets.dialog.NotesPanel
 * @extends     Ext.panel.Panel
 * 
 * @TODO add validation (notes after notetime)
 */
Ext.define('Klb.system.widgets.dialog.ChecklistPanel', {
    extend: 'Ext.panel.Panel',
    /**
     * @cfg {string} name of notes field
     */
    recordAlarmField: 'dtstart',
    
    //private
    layout      : 'fit',
    border      : true,
    frame       : true,

    initComponent: function() {
        this.title = _('Checklist');

        this.items = this.checklistGrid = new Klb.system.widgets.dialog.ChecklistPanel.GridPanel();
 
//        this.checklistGrid.on('beforeedit', this.onBeforeEdit, this);
//        this.checklistGrid.on('afteredit', this.onAfterEdit, this);
        Klb.system.widgets.dialog.AlarmPanel.superclass.initComponent.call(this);
 
    },
 
    onNewentry: function(recordData) {
        if (recordData.minutes_before == 'custom' && ! Ext.isDate(recordData.remark_time)) {
            return false;
        }
        
        Klb.system.widgets.grid.QuickaddGridPanel.prototype.onNewentry.apply(this.checklistGrid, arguments);
        this.checklistGrid.store.sort('minutes_before', 'ASC');
    },

    onBeforeEdit: function(o) {
        if (o.field == 'remark_time') {
            var minutesBefore = o.record.get('minutes_before'),
                remarkTime = o.record.get('remark_time');
            
            // allow status setting if status authkey is present
            if (minutesBefore != 'custom') {
                o.cancel = true;
            } else if (remarkTime && ! Ext.isDate(remarkTime)) {
                var remarkDate = Ext.Date.parse(remarkTime, Date.patterns.ISO8601Long);
                o.record.set('remark_time', '');
                o.record.set('remark_time', remarkDate);
            }
        }
    },

    onAfterEdit: function(o) {
        if (o.record.get('minutes_before') == 'custom' && ! Ext.isDate(o.record.get('remark_time'))) {
            var remarkFieldDate = this.record ? this.record.get(this.recordAlarmField) : null;
            
            o.record.set('remark_time', Ext.isDate(remarkFieldDate) ? remarkFieldDate.clone() : new Date());
        }
        
        if (o.record.get('minutes_before') != 'custom') {
            o.record.set('remark_time', '');
        }
        
        this.checklistGrid.store.sort('minutes_before', 'ASC');
    },

    /**
     * on record load event
     * 
     * @param {Object} record
     */
    onRecordLoad: function(record) {
        this.record = record;
        this.checklistGrid.store.removeAll();
        this.checklistGrid.setStoreFromArray(record.get('remarks') || []);

        this.checklistGrid.store.sort('minutes_before', 'ASC');
    },

    /**
     * on record update event
     * 
     * @param {Object} record
     */
    onRecordUpdate: function(record) {
        // we need to initialze remarks because stringcompare would detect no change of the arrays
        record.set('remarks', '');
        record.set('remarks', this.checklistGrid.getFromStoreAsArray());
    },
    
    /**
     * disable contents not panel
     */
    setDisabled: function(v) {
        this.el[v ? 'mask' : 'unmask']();
    }
});


Klb.system.widgets.dialog.ChecklistPanel.GridPanel = Ext.extend(Ext.ux.grid.QuickaddGridPanel, {
    /**
     * grid config
     * @private
     */
    autoExpandColumn: 'summary',
    quickaddMandatory: 'summary',
    clicksToEdit: 1,
    enableColumnHide:false,
    enableColumnMove:false,

    /**
     * The record currently being edited
     * 
     * @type Klb.Crm.Model.Lead
     * @property record
     */
    record: null,
    
    /**
     * store to hold all contacts
     * 
     * @type Ext.data.Store
     * @property store
     */
    store: null,
 
    /**
     * @type Ext.Menu
     * @property contextMenu
     */
    contextMenu: null,

    /**
     * @type Array
     * @property otherActions
     */
    otherActions: null,
    
    /**
     * @type function
     * @property recordEditDialogOpener
     */
    recordEditDialogOpener: null,

    /**
     * record class
     * @cfg {Klb.Addressbook.Model.Contact} recordClass
     */
    recordClass: null,

    /**
     * @private
     */
    initComponent: function() {
        // init properties
        this.app = this.app ? this.app : Klb.system.appMgr.get('Crm');
        this.title = this.app.i18n._('Tasks');
        this.recordEditDialogOpener = Klb.Tasks.TaskEditDialog.openWindow;
        this.recordClass = Klb.Tasks.Model.Task;

        this.storeFields = Klb.Tasks.Model.TaskArray;
        this.storeFields.push({name: 'relation'});   // the relation object 
        this.storeFields.push({name: 'relation_type'});

        // create delegates
        this.initStore = Klb.Crm.LinkGridPanel.initStore.bind(this);
        this.initActions = Klb.Crm.LinkGridPanel.initActions.bind(this);
        this.initGrid = Klb.Crm.LinkGridPanel.initGrid.bind(this);
//        this.onUpdate = Klb.Crm.LinkGridPanel.onUpdate.bind(this);

//         call delegates
        this.initStore();
        this.initActions();
        this.initGrid();

        // init store stuff
        this.store.setDefaultSort('due', 'asc');

        this.view = new Ext.grid.View({
            autoFill: true,
            forceFit:true,
            ignoreAdd: true,
            emptyText: this.app.i18n._('No Tasks to display'),
            onLoad: Ext.emptyFn,
            listeners: {
                beforerefresh: function(v) {
                    v.scrollTop = v.scroller.dom.scrollTop;
                },
                refresh: function(v) {
                    v.scroller.dom.scrollTop = v.scrollTop;
                }
            }
        });

        this.on('newentry', function(taskData){
            var newTask = taskData;
            newTask.relation_type = 'task';

            // get first responsible person and add it to task as organizer
            var i = 0;
            while (this.record.data.relations.length > i && this.record.data.relations[i].type != 'responsible') {
                i++;
            }
            if (this.record.data.relations[i] 
                    && this.record.data.relations[i].type == 'responsible' && this.record.data.relations[i].related_record.account_id != '') 
            {
                newTask.organizer = this.record.data.relations[i].related_record.account_id;
            }
console.log(newTask);
            // add new task to store
            this.store.loadData([newTask], true);
 
            return true;
        }, this);

        // hack to get percentage editor working
        this.on('rowclick', function(grid,row,e) {
console.log('Task rowclick');
            var cell = Ext.get(grid.getView().getCell(row,1));
            var dom = cell.child('div:last-child');
            while (cell.first()) {
                cell = cell.first();
                cell.on('click', function(e){
                    e.stopPropagation();
                    grid.fireEvent('celldblclick', grid, row, 1, e);
                });
            }
        }, this);
 
        Klb.Crm.Task.GridPanel.superclass.initComponent.call(this);
    },
    
    /**
     * @return Ext.grid.ColumnManager
     * @private
     */
    getColumnModel: function() {
        return new Ext.grid.ColumnManager({
            defaults: {
                sortable: true
            },
            columns: [
                 {
                    id: 'summary',
                    header: this.app.i18n._("Summary"),
                    width: 100,
                    dataIndex: 'summary',
                    quickaddField: new Ext.form.field.Text({
                        emptyText: this.app.i18n._('Add a task...')
                    })
                }, {
                    id: 'due',
                    header: this.app.i18n._("Due Date"),
                    width: 55,
                    dataIndex: 'due',
                    renderer: Klb.system.Common.dateRenderer,
                    editor: new Ext.ux.form.ClearableDateField({
                        //format : 'd.m.Y'
                    }),
                    quickaddField: new Ext.ux.form.ClearableDateField({
                        //value: new Date(),
                        //format : "d.m.Y"
                    })
                }, {
                    id: 'priority',
                    header: this.app.i18n._("Priority"),
                    width: 45,
                    dataIndex: 'priority',
                    renderer: Klb.system.widgets.keyfield.Renderer.get('Tasks', 'taskPriority'),
                    editor: {
                        xtype: 'widget-keyfieldcombo',
                        app: 'Tasks',
                        keyFieldName: 'taskPriority'
                    },
                    quickaddField: new Klb.system.widgets.keyfield.ComboBox({
                        app: 'Tasks',
                        keyFieldName: 'taskPriority',
                        value: 'NORMAL'
                    })
                }, {
                    id: 'percent',
                    header: this.app.i18n._("Percent"),
                    width: 50,
                    dataIndex: 'percent',
                    renderer: Ext.ux.PercentRenderer,
                    editor: new Ext.ux.PercentCombo({
                        autoExpand: true,
                        blurOnSelect: true
                    }),
                    quickaddField: new Ext.ux.PercentCombo({
                        autoExpand: true
                    })
                }, {
                    id: 'status',
                    header: this.app.i18n._("Status"),
                    width: 45,
                    dataIndex: 'status',
                    renderer: Klb.system.widgets.keyfield.Renderer.get('Tasks', 'taskStatus'),
                    editor: {
                        xtype: 'widget-keyfieldcombo',
                        app: 'Tasks',
                        keyFieldName: 'taskStatus'
                    },
                    quickaddField: new Klb.system.widgets.keyfield.ComboBox({
                        app: 'Tasks',
                        keyFieldName: 'taskStatus',
                        value: 'NEEDS-ACTION'
                    })
                }
            ]}
        );
    },

    /**
     * update event handler for related tasks
     * 
     * TODO use generic function
     */
    onUpdate: function(task) {

        var response = {
            responseText: task
        };
        task = Klb.Tasks.JsonBackend.recordReader(response);

        Klb.Logger.debug('Klb.Task.Task.GridPanel::onUpdate - Task has been updated:');
        Klb.Logger.debug(task);
        
        // remove task relations to prevent cyclic relation structure
        task.data.relations = null;
        
        var myTask = this.store.getById(task.id);

        if (myTask) {
            // copy values from edited task
            myTask.beginEdit();
            for (var p in task.data) {
                myTask.set(p, task.get(p));
            }
            myTask.endEdit();
            
        } else {
            task.data.relation_type = 'task';
            this.store.add(task);
        }      
    }
});
