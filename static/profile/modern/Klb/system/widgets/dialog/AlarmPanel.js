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
 * @class       Klb.system.widgets.dialog.AlarmPanel
 * @extends     Ext.panel.Panel
 * 
 * @TODO add validation (alarm after alarmtime)
 */
Ext.define('Klb.system.widgets.dialog.AlarmPanel', {
    extend: 'Ext.panel.Panel',
    /**
     * @cfg {string} name of alarm field
     */
    recordAlarmField: 'dtstart',
    
    //private
    layout      : 'fit',
    border      : true,
    frame       : true,
    
    
    initComponent: function() {
        this.title = _('Alarms');
        
        this.alarmOptions = [
            ['0',       _('0 minutes before')],
            ['5',       _('5 minutes before')],
            ['15',      _('15 minutes before')],
            ['30',      _('30 minutes before')],
            ['60',      _('1 hour before')],
            ['120',     _('2 hours before')],
            ['720',     _('12 hours before')],
            ['1440',    _('1 day before')],
            ['2880',    _('2 days before')],
            ['custom',  _('Custom Datetime')]
        ];

        var _colums = [{
            // id: 'minutes_before',
            header: _('Alarm Time'),
            dataIndex: 'minutes_before',
            width: 200,
            hideable: false,
            sortable: true,
            quickaddField: new Ext.form.field.ComboBox({
                triggerAction   : 'all',
                lazyRender      : false,
                editable        : false,
                mode            : 'local',
                forceSelection  : true,
                store: this.alarmOptions,
                listeners       : {
                    scope: this,
                    beforeselect: function(combo, record, index) {
                        var alarmFieldDate = this.record ? this.record.get(this.recordAlarmField) : null;

                        this.alarmTimeQuickAdd.setDisabled(record.data.field1 != 'custom');

                        // preset a usefull value
                        if (Ext.isDate(alarmFieldDate) && record.data.field1 == 'custom') {
                            this.alarmTimeQuickAdd.setValue(alarmFieldDate.add(Date.MINUTE, -1 * Ext.isNumber(combo.getValue()) ? combo.getValue() : 0));
                        }

                        if (record.data.field1 != 'custom') {
                            this.alarmTimeQuickAdd.setValue();
                        }
                    }
                }
            }),
            editor: new Ext.form.field.ComboBox({
                triggerAction   : 'all',
                lazyRender      : false,
                editable        : false,
                mode            : 'local',
                forceSelection  : true,
                allowBlank      : false,
                expandOnFocus   : true,
                blurOnSelect    : true,
                store: this.alarmOptions
            }),
            renderer: this.minutesBeforeRenderer.bind(this)
        }, {
            // id: 'alarm_time',
            dataIndex: 'alarm_time',
            hideable: false,
            sortable: false,
            renderer: this.alarmTimeRenderer.bind(this),
            quickaddField: this.alarmTimeQuickAdd = new Ext.ux.form.DateTimeField({
                allowBlank      : true
            }),
            editor: new Ext.ux.form.DateTimeField({
                allowBlank      : false
            })
        },{
            // id: 'alarm_action',
            hideable: false,
            sortable: false,
            renderer: this.alarmAddRenderer.bind(this),
            quickaddField: this.alarmAddButton = new Ext.button.Button({
                // id: 'action_add',
                text: _('Add'),
                value: 'additem',
                listeners: {
                    scope: this,
                    click : function(){
                        this.alarmGrid.doBlur();
                    }
                }
            })
        }];

        this.items = this.alarmGrid = new Klb.system.widgets.grid.QuickaddGridPanel({
            layout: 'fit',
            autoExpandColumn: 'alarm_time',
            quickaddMandatory: 'minutes_before',
            frame: false,
            recordClass: Klb.system.Model.Alarm,
            onNewentry: this.onNewentry.bind(this),
            headerCt: Ext.create('Ext.grid.header.Container', {
                defaults: {
                    flex: 1,
                    sealed: true,
                    sortable: true,
                    resizable: true
                },
                items: _colums
            })
             // colums: _colums
        });
        
        this.alarmGrid.on('beforeedit', this.onBeforeEdit, this);
        this.alarmGrid.on('afteredit',  this.onAfterEdit, this);
        this.callParent();
    },
    
    onNewentry: function(recordData) {
        if (recordData.minutes_before == 'custom' && ! Ext.isDate(recordData.alarm_time)) {
            return false;
        }
        
        Klb.system.widgets.grid.QuickaddGridPanel.prototype.onNewentry.apply(this.alarmGrid, arguments);
        this.alarmGrid.store.sort('minutes_before', 'ASC');
    },
    
    onBeforeEdit: function(o) {
        if (o.field == 'alarm_time') {
            var minutesBefore = o.record.get('minutes_before'),
                alarmTime = o.record.get('alarm_time');
            
            // allow status setting if status authkey is present
            if (minutesBefore != 'custom') {
                o.cancel = true;
            } else if (alarmTime && ! Ext.isDate(alarmTime)) {
                var alarmDate = Ext.Date.parse(alarmTime, Date.patterns.ISO8601Long);
                o.record.set('alarm_time', '');
                o.record.set('alarm_time', alarmDate);
            }
        }
    },
    
    onAfterEdit: function(o) {
        if (o.record.get('minutes_before') == 'custom' && ! Ext.isDate(o.record.get('alarm_time'))) {
            var alarmFieldDate = this.record ? this.record.get(this.recordAlarmField) : null;
            
            o.record.set('alarm_time', Ext.isDate(alarmFieldDate) ? alarmFieldDate.clone() : new Date());
        }
        
        if (o.record.get('minutes_before') != 'custom') {
            o.record.set('alarm_time', '');
        }
        
        this.alarmGrid.store.sort('minutes_before', 'ASC');
    },
    
    minutesBeforeRenderer: function(value) {
        var string = null;
        Ext.each(this.alarmOptions, function(opt) {
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
    
    alarmTimeRenderer: function(value, metaData, record) {
        return record.get('minutes_before') == 'custom' ? Klb.system.Common.dateTimeRenderer.apply(this, arguments) : '';
    },
    
    alarmAddRenderer: function(){
        return('');
    },
    
    /**
     * on record load event
     * 
     * @param {Object} record
     */
    onRecordLoad: function(record) {
        this.record = record;
        this.alarmGrid.store.removeAll();
        this.alarmGrid.setStoreFromArray(record.get('alarms') || []);
        
        this.alarmGrid.store.sort('minutes_before', 'ASC');
    },

    /**
     * on record update event
     * 
     * @param {Object} record
     */
    onRecordUpdate: function(record) {
        // we need to initialze alarms because stringcompare would detect no change of the arrays
        record.set('alarms', '');
        record.set('alarms', this.alarmGrid.getFromStoreAsArray());
    },
    
    /**
     * disable contents not panel
     */
    setDisabled: function(v) {
        this.el[v ? 'mask' : 'unmask']();
    }
});

