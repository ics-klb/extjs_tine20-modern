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
Ext.define('Klb.system.widgets.dialog.RemarksPanel', {
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
        this.title = _('Remarks');

        this.items = this.remarkGrid = new Klb.system.widgets.grid.QuickaddGridPanel({
            autoExpandColumn: 'summary',
            quickaddMandatory: 'summary',
            clicksToEdit: 1,
            enableColumnHide:false,
            enableColumnMove:false,
            layout: 'fit',
            autoExpandColumn: 'remark_time',
            quickaddMandatory: 'minutes_before',
            frame: false,
            recordClass: Klb.system.Model.Remark,
            onNewentry: this.onNewentry.bind(this),
            cm: this.getColumnModel()
         });
        
        this.remarkGrid.on('beforeedit', this.onBeforeEdit, this);
        this.remarkGrid.on('afteredit', this.onAfterEdit, this);
        Klb.system.widgets.dialog.AlarmPanel.superclass.initComponent.call(this);
 
    },

    getColumnModel: function() {
        return new Ext.grid.ColumnManager({
            defaults: {
                sortable: true
            },
            columns: [
                 {
                    id: 'summary',
                    header: _("Summary"),
                    width: 100,
                    dataIndex: 'summary',
                    quickaddField: new Ext.form.field.Text({
                        emptyText: _('Add a task...')
                    })
                }, {
                    id: 'due',
                    header: _("Due Date"),
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
                    header: _("Priority"),
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
                    header: _("Percent"),
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
                    header: _("Status"),
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

    onNewentry: function(recordData) {
        if (recordData.minutes_before == 'custom' && ! Ext.isDate(recordData.remark_time)) {
            return false;
        }
        
        Klb.system.widgets.grid.QuickaddGridPanel.prototype.onNewentry.apply(this.remarkGrid, arguments);
        this.remarkGrid.store.sort('minutes_before', 'ASC');
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
        
        this.remarkGrid.store.sort('minutes_before', 'ASC');
    },
    
    minutesBeforeRenderer: function(value) {
        var string = null;
        Ext.each(this.remarkOptions, function(opt) {
            if (opt[0] == value) {
                string = opt[1];
                return false;
            }
        });
        
        if (! string ) {
            string =  Ext.String.format(_('{0} minutes before'), value);
        }
        
        return string;
    },
    
    remarkTimeRenderer: function(value, metaData, record) {
        return record.get('minutes_before') == 'custom' ? Klb.system.Common.dateTimeRenderer.apply(this, arguments) : '';
    },
    
    remarkAddRenderer: function(){
        return('');
    },
    
    /**
     * on record load event
     * 
     * @param {Object} record
     */
    onRecordLoad: function(record) {
        this.record = record;
        this.remarkGrid.store.removeAll();
        this.remarkGrid.setStoreFromArray(record.get('remarks') || []);

        this.remarkGrid.store.sort('minutes_before', 'ASC');
    },

    /**
     * on record update event
     * 
     * @param {Object} record
     */
    onRecordUpdate: function(record) {
        // we need to initialze remarks because stringcompare would detect no change of the arrays
        record.set('remarks', '');
        record.set('remarks', this.remarkGrid.getFromStoreAsArray());
    },
    
    /**
     * disable contents not panel
     */
    setDisabled: function(v) {
        this.el[v ? 'mask' : 'unmask']();
    }
});
