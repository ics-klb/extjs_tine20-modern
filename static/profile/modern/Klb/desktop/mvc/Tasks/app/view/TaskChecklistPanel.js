/*
 * CLK 2.3.8
 * 
 * @license     http://www.gnu.org/licenses/agpl.html AGPL Version 3
 * @author      Philipp Schuele <p.schuele@metaways.de>
 * @copyright   Copyright (c) 2009-2012 Metaways Infosystems GmbH (http://www.metaways.de)
 */
 
Ext.ns('KlbDesktop.MVC.Tasks', 'KlbDesktop.MVC.Tasks.ChecklistPanel', 'KlbDesktop.MVC.Tasks.view.LinkGridPanel');
         
/**
 * Alarm Panel
 * 
 * @namespace   Klb.system.widgets.dialog
 * @class       Klb.system.widgets.dialog.NotesPanel
 * @extends     Ext.Panel
 * 
 * @TODO add validation (notes after notetime)
 */


KlbDesktop.MVC.Tasks.view.LinkGridPanel.initActions = function() {

    var app = Klb.system.appMgr.get(this.recordClass.getMeta('appName'));
    if (! app) {
        return;
    }

    if (app.i18n) {
        var recordName = app.i18n.n_(
            this.recordClass.getMeta('recordName'), this.recordClass.getMeta('recordsName'), 1
        );
    } else {
        var recordName = this.recordClass.getMeta('recordName');
    }

    var addActionText = app.addButtonText && app.i18n 
                                          ? app.i18n._hidden(app.addButtonText) 
                                          : Ext.String.format(this.app.i18n._('Add new {0}'), recordName);
    this.actionAdd = new Ext.Action({
        requiredGrant: 'editGrant',
        text: addActionText,
        tooltip: addActionText,
        iconCls: 'action_add',
        disabled: ! (this.record && this.record.get('container_id') 
            && this.record.get('container_id').account_grants 
            && this.record.get('container_id').account_grants.editGrant),
        scope: this,
        handler: function(_button, _event) {
            var editWindow = this.recordEditDialogOpener({
                listeners: {
                    scope: this,
                    'update': this.onUpdate
                }
            });
        }
    });
    
    this.actionUnlink = new Ext.Action({
        requiredGrant: 'editGrant',
        text: Ext.String.format(this.app.i18n._('Unlink {0}'), recordName),
        tooltip: Ext.String.format(this.app.i18n._('Unlink selected {0}'), recordName),
        disabled: true,
        iconCls: 'action_remove',
        onlySingle: true,
        scope: this,
        handler: function(_button, _event) {
            var selectedRows = this.getSelectionModel().getSelection();
            for (var i = 0; i < selectedRows.length; ++i) {
                this.store.remove(selectedRows[i]);
            }           
        }
    });
    
    this.actionEdit = new Ext.Action({
        requiredGrant: 'editGrant',
        text: Ext.String.format(this.app.i18n._('Edit {0}'), recordName),
        tooltip: Ext.String.format(this.app.i18n._('Edit selected {0}'), recordName),
        disabled: true,
        iconCls: 'actionEdit',
        onlySingle: true,
        scope: this,
        handler: function(_button, _event) {
            var selectedRows = this.getSelectionModel().getSelection();
            var record = selectedRows[0];
            // unset record id for new records
            if (record.phantom) {
                record.id = 0;
            }
            var editWindow = this.recordEditDialogOpener({
                record: record,
                listeners: {
                    scope: this,
                    'update': this.onUpdate
                }
            });
        }
    });

    // init toolbars and ctx menut / add actions
    this.bbar = [ 
        this.actionAdd,
        this.actionUnlink
    ];
    
    this.actions = [
        this.actionEdit,
        this.actionUnlink
    ];
    
    if (this.otherActions) {
        this.actions = this.actions.concat(this.otherActions);
    }

    this.contextMenu = new Ext.menu.Menu({
        items: this.actions.concat(['-', this.actionAdd])
    });
    
    this.actions.push(this.actionAdd);
};

/**
 * init store
 * 
 */ 
KlbDesktop.MVC.Tasks.view.LinkGridPanel.initStore = function() {
    
    this.store = new Ext.data.JsonStore({
        fields: (this.storeFields) ? this.storeFields : this.recordClass
    });

    // focus+select new record
    this.store.on('add', function(store, records, index) {
        (function() {
            if (this.rendered) {
                this.getView().focusRow(index);
                this.getSelectionModel().selectRow(index);
            }
        }).defer(300, this);
    }, this);
};

/**
 * init ext grid panel
 * 
 * TODO         add grants for linked entries to disable EDIT?
 */
KlbDesktop.MVC.Tasks.view.LinkGridPanel.initGrid = function() {
    this.cm = this.getColumnModel();
    
    this.selModel = new Ext.grid.RowSelectionModel({multiSelect:true});
    this.enableHdMenu = false;
    this.plugins = this.plugins || [];
    this.plugins.push(new Ext.ux.grid.GridViewMenuPlugin({}));

    // on selectionchange handler
    this.selModel.on('selectionchange', function(sm) {
        var rowCount = sm.getCount();
        var selectedRows = this.getSelectionModel().getSelection();
        if (selectedRows.length > 0) {
            var selectedRecord = selectedRows[0];
        }
        if (this.record && (this.record.get('container_id') && this.record.get('container_id').account_grants)) {
            for (var i=0; i < this.actions.length; i++) {
                this.actions[i].setDisabled(
                    ! this.record.get('container_id').account_grants.editGrant 
                    || (this.actions[i].initialConfig.onlySingle && rowCount != 1)
                    || (this.actions[i] == this.actionEdit && selectedRecord && selectedRecord.phantom == true)
                );
            }
        }
        
    }, this);
    
    // on rowcontextmenu handler
    this.on('rowcontextmenu', function(grid, row, e) {
        e.stopEvent();
        var selModel = grid.getSelectionModel();
        if(!selModel.isSelected(row)) {
            selModel.selectRow(row);
        }
        
        this.contextMenu.showAt(e.getXY());
    }, this);
    
    // doubleclick handler
    this.on('rowdblclick', function(grid, row, e) {
        var selectedRows = grid.getSelectionModel().getSelection();
        record = selectedRows[0];
        if (! record.phantom && this.recordEditDialogOpener != Ext.emptyFn) {
            var editWindow = this.recordEditDialogOpener({
                record: record,
                listeners: {
                    scope: this,
                    'update': this.onUpdate
                }
            });
        }
    }, this);
};

KlbDesktop.MVC.Tasks.ChecklistPanel = Ext.extend(Ext.Panel, {
    
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

        this.items = this.checklistGrid = new KlbDesktop.MVC.Tasks.ChecklistPanel.GridPanel();
 
        this.checklistGrid.on('beforeedit', this.onBeforeEdit, this);
        this.checklistGrid.on('afteredit', this.onAfterEdit, this);
        this.callParent();
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
                var remarkDate = Date.parseDate(remarkTime, Date.patterns.ISO8601Long);
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

Ext.define('KlbDesktop.MVC.Tasks.ChecklistPanel.GridPanel', {
    extend:  'Klb.system.widgets.grid.GridPanel',

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
     * @type Tine.Crm.Model.Lead
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
     * @cfg {Tine.Addressbook.Model.Contact} recordClass
     */
    recordClass: null,

    /**
     * @private
     */
    initComponent: function() {
        // init properties
        this.app = this.app ? this.app : Klb.system.appMgr.get('Tasks');
        this.title = this.app.i18n._('Checklist');
        this.recordEditDialogOpener = KlbDesktop.MVC.Tasks.TaskEditDialog.openWindow;
        this.recordClass = KlbDesktop.MVC.Tasks.Model.Checklist;

        this.storeFields = KlbDesktop.MVC.Tasks.Model.ChecklistArray;
        this.storeFields.push({name: 'relation'});   // the relation object 
        this.storeFields.push({name: 'relation_type'});

        // create delegates
        this.initStore   = KlbDesktop.MVC.Tasks.view.LinkGridPanel.initStore.createDelegate(this);
        this.initActions = KlbDesktop.MVC.Tasks.view.LinkGridPanel.initActions.createDelegate(this);
        this.initGrid    = KlbDesktop.MVC.Tasks.view.LinkGridPanel.initGrid.createDelegate(this);
//        this.onUpdate    = KlbDesktop.MVC.Tasks.view.LinkGridPanel.onUpdate.createDelegate(this);
        // call delegates
        this.initStore();
        this.initActions();
        this.initGrid();

        // init store stuff
        this.store.setDefaultSort('due', 'asc');

        this.view = new Ext.grid.GridView({
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
            var dom = cell.child('div:last');
            while (cell.first()) {
                cell = cell.first();
                cell.on('click', function(e){
                    e.stopPropagation();
                    grid.fireEvent('celldblclick', grid, row, 1, e);
                });
            }
        }, this);
 
        KlbDesktop.MVC.Tasks.ChecklistPanel.GridPanel.superclass.initComponent.call(this);
    },
    
    /**
     * @return Ext.grid.ColumnModel
     * @private
     */
    getColumnModel: function() {
        return new Ext.grid.ColumnModel({
            defaults: {
                sortable: true
            },
            columns: [
                 {
                    id: 'summary',
                    header: this.app.i18n._("Summary"),
                    width: 100,
                    dataIndex: 'summary',
                    quickaddField: new Ext.form.TextField({
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
        task = KlbDesktop.MVC.Tasks.JsonBackend.recordReader(response);

        Klb.Logger.debug('Tine.Task.Task.GridPanel::onUpdate - Task has been updated:');
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

