/*
 * IcsDesktop 2.4.0
 *
 * @license     http://www.gnu.org/licenses/agpl.html AGPL Version 3
 * @author      Cornelius Weiss <c.weiss@metaways.de>
 * @copyright   Copyright (c) 2007-2011 Metaways Infosystems GmbH (http://www.metaways.de)
 *
 */

/*global Ext*/

Ext.ns('Klb.system.ux', 'Klb.system.ux.form');

Ext.define('Klb.system.ux.form.DateTimeRange', {
    extend: 'Ext.form.FieldContainer',
    xtype: 'datetimerangefield',

    requires: [
        'Ext.form.field.Date',
        'Ext.form.field.Time',
        'Ext.form.Label',
        'Ext.form.field.Checkbox',
        'Ext.layout.container.Column'
    ],

    singleLine: true,
    dateFormat: 'Y-m-d',
    timeFormat: Ext.Date.use24HourTime ? 'G:i' : 'g:i A',

    // private
    fieldLayout: 'hbox',
    defaults: {
        margin: '0 5 0 0'
    },

    // private
    initComponent: function() {
        var me = this;

        me.addCls('ext-dt-range');
        me.allDayText = _('#Calendar/whole day');
        me.toText = _('#Calendar/to');

        if (me.singleLine) {
            me.layout = me.fieldLayout;
            me.items = me.getFieldConfigs();
        }
        else {
            me.items = [{
                xtype: 'container',
                layout: me.fieldLayout,
                items: [
                    me.getStartDateConfig(),
                    me.getStartTimeConfig(),
                    me.getDateSeparatorConfig()
                ]
            },{
                xtype: 'container',
                layout: me.fieldLayout,
                items: [
                    me.getEndDateConfig(),
                    me.getEndTimeConfig(),
                    me.getAllDayConfig()
                ]
            }];
        }

        me.callParent(arguments);
        me.initRefs();
    },

    initRefs: function() {
        var me = this;
        me.startDate = me.down('#' + me.id + '-start-date');
        me.startTime = me.down('#' + me.id + '-start-time');
        me.endTime = me.down('#' + me.id + '-end-time');
        me.endDate = me.down('#' + me.id + '-end-date');
        me.allDay = me.down('#' + me.id + '-allday');
        me.toLabel = me.down('#' + me.id + '-to-label');

        me.startDate.validateOnChange = me.endDate.validateOnChange = false;

        me.startDate.isValid = me.endDate.isValid = function() {
            var me = this,
                valid = Ext.isDate(me.getValue());
            if (!valid) {
//                                        me.focus();
            }
            return valid;
        };
    },

    getFieldConfigs: function() {
        var me = this;
        return [
            me.getStartDateConfig(),
            me.getStartTimeConfig(),
            me.getDateSeparatorConfig(),
            me.getEndTimeConfig(),
            me.getEndDateConfig(),
            me.getAllDayConfig()
        ];
    },

    getStartDateConfig: function() {
        return {
            xtype: 'datefield',
            itemId: this.id + '-start-date',
            format: this.dateFormat,
            width: 100,
            listeners: {
                'blur': {
                    fn: function(){
                        this.onFieldChange('date', 'start');
                    },
                    scope: this
                }
            }
        };
    },

    getStartTimeConfig: function() {
        return {
            xtype: 'timefield',
            itemId: this.id + '-start-time',
            hidden: this.showTimes === false,
            labelWidth: 0,
            hideLabel: true,
            width: 90,
            format: this.timeFormat,
            listeners: {
                'select': {
                    fn: function(){
                        this.onFieldChange('time', 'start');
                    },
                    scope: this
                }
            }
        };
    },

    getEndDateConfig: function() {
        return {
            xtype: 'datefield',
            itemId: this.id + '-end-date',
            format: this.dateFormat,
            hideLabel: true,
            width: 100,
            listeners: {
                'blur': {
                    fn: function(){
                        this.onFieldChange('date', 'end');
                    },
                    scope: this
                }
            }
        };
    },

    getEndTimeConfig: function() {
        return {
            xtype: 'timefield',
            itemId: this.id + '-end-time',
            hidden: this.showTimes === false,
            labelWidth: 0,
            hideLabel: true,
            width: 90,
            format: this.timeFormat,
            listeners: {
                'select': {
                    fn: function(){
                        this.onFieldChange('time', 'end');
                    },
                    scope: this
                }
            }
        };
    },

    getDuration: function() {
        var me = this,
            dtstart = me.getDT('start'),
            dtend = me.getDT('end');
        return dtend.getTime() - dtstart.getTime();
    },

    getAllDayConfig: function() {
        return {
            xtype: 'checkbox',
            itemId: this.id + '-allday',
            hidden: this.showTimes === false || this.showAllDay === false,
            boxLabel: this.allDayText,
            margin: '2 5 0 0',
            handler: this.onAllDayChange,
            scope: this
        };
    },

    onAllDayChange: function(chk, checked) {
        var me = this;

        Ext.suspendLayouts();
        me.startTime.setDisabled(checked).setVisible(!checked);
        me.endTime.setDisabled(checked).setVisible(!checked);
        Ext.resumeLayouts(true);
        if (checked ){
            me.fireEvent('change', me, me.getValue());
        }
    },

    getDateSeparatorConfig: function() {
        return {
            xtype: 'label',
            itemId: this.id + '-to-label',
            text: this.toText,
            margin: '4 5 0 0'
        };
    },

    isSingleLine: function() {
        var me = this;

        if (me.calculatedSingleLine === undefined) {
            if(me.singleLine == 'auto'){
                var ownerCtEl = me.ownerCt.getEl(),
                    w = me.ownerCt.getWidth() - ownerCtEl.getPadding('lr'),
                    el = ownerCtEl.down('.x-panel-body');

                if(el){
                    w -= el.getPadding('lr');
                }

                el = ownerCtEl.down('.x-form-item-label');
                if(el){
                    w -= el.getWidth() - el.getPadding('lr');
                }
                me.calculatedSingleLine = w <= me.singleLineMinWidth ? false : true;
            }
            else {
                me.calculatedSingleLine = me.singleLine !== undefined ? me.singleLine : true;
            }
        }
        return me.calculatedSingleLine;
    },

    // private
    onFieldChange: function(type, startend){
        this.checkDates(type, startend);
        this.fireEvent('change', this, this.getValue());
    },

    // private
    checkDates: function(type, startend){
        var me = this,
            startField = me.down('#' + me.id + '-start-' + type),
            endField = me.down('#' + me.id + '-end-' + type),
            startValue = me.getDT('start'),
            endValue = me.getDT('end');

        if (!startValue || !endValue) {
            return;
        }

        if(startValue > endValue){
            if(startend=='start'){
                endField.setValue(startValue);
            }else{
                startField.setValue(endValue);
                me.checkDates(type, 'start');
            }
        }
        if(type=='date'){
            me.checkDates('time', startend);
        }
    },

    getValue: function(){
        var eDate = Klb.Common.util.Date,
            dtstart = this.getDT('start'),
            dtend = this.getDT('end'),
            allDay = this.allDay.getValue();

        if (Ext.isDate(dtstart) && Ext.isDate(dtend) && dtstart.getTime() !== dtend.getTime()) {
            if (!allDay && eDate.isMidnight(dtstart) && eDate.isMidnight(dtend)) {
                // 12:00am -> 12:00am over n days, all day event
                allDay = true;
                dtend = eDate.add(dtend, {
                    days: -1
                });
            }
        }

        if (allDay && Ext.isDate(dtend) && Ext.Date.format(dtend, 'H:i:s') != '17:59:59') {

            dtstart = Ext.Date.clearTime(dtstart);
            dtend = Ext.Date.clearTime(dtend);
            dtstart =dtstart.add(Ext.Date.HOUR, 8);
            dtend =dtend.add(Ext.Date.HOUR, 17).add(Ext.Date.SECOND, -1);
        }

        return [
            dtstart,
            dtend,
            allDay
        ];
    },

    // private getValue helper
    getDT: function(startend){
        var time = this[startend+'Time'].getValue(),
            dt = this[startend+'Date'].getValue();

        if(Ext.isDate(dt)){
            dt = Ext.Date.format(dt, this[startend + 'Date'].format);
        }
        else{
            return null;
        }
        if(time && time !== ''){
            time = Ext.Date.format(time, this[startend+'Time'].format);
            var val = Ext.Date.parseDate(dt + ' ' + time, this[startend+'Date'].format + ' ' + this[startend+'Time'].format);
            return val;
            //return Ext.Date.parseDate(dt+' '+time, this[startend+'Date'].format+' '+this[startend+'Time'].format);
        }
        return Ext.Date.parseDate(dt, this[startend+'Date'].format);

    },

    setValue: function(v){
        if(!v) {
            return;
        }
        if(Ext.isArray(v)){
            this.setDT(v[0], 'start');
            this.setDT(v[1], 'end');
            this.allDay.setValue(!!v[2]);
        }
        else if(Ext.isDate(v)){
            this.setDT(v, 'start');
            this.setDT(v, 'end');
            this.allDay.setValue(false);
        }
        // else if(v[KlbDesktop.MVC.Calendar.data.EventMappings.StartDate.name]){ //object
        //     this.setDT(v[KlbDesktop.MVC.Calendar.data.EventMappings.StartDate.name], 'start');
        //     if(!this.setDT(v[KlbDesktop.MVC.Calendar.data.EventMappings.EndDate.name], 'end')){
        //         this.setDT(v[KlbDesktop.MVC.Calendar.data.EventMappings.StartDate.name], 'end');
        //     }
        //     this.allDay.setValue(!!v[KlbDesktop.MVC.Calendar.data.EventMappings.IsAllDay.name]);
        // }
        return true;
    },

    // private setValue helper
    setDT: function(dt, startend){
        if(dt && Ext.isDate(dt)){
            this[startend + 'Date'].setValue(dt);
            this[startend + 'Time'].setValue(Ext.Date.format(dt, this[startend + 'Time'].format));
            return true;
        }
    },

    // inherited docs
    isDirty: function(){
        var dirty = false;
        if(this.rendered && !this.disabled) {
            this.items.each(function(item){
                if (item.isDirty()) {
                    dirty = true;
                    return false;
                }
            });
        }
        return dirty;
    },

    // private
    onDisable : function(){
        this.delegateFn('disable');
    },

    // private
    onEnable : function(){
        this.delegateFn('enable');
    },

    // inherited docs
    reset : function(){
        this.delegateFn('reset');
    },

    // private
    delegateFn : function(fn){
        this.items.each(function(item){
            if (item[fn]) {
                item[fn]();
            }
        });
    },

    // private
    beforeDestroy: function(){
        Ext.destroy(this.fieldCt);
        this.callParent(arguments);
    },

    /**
     * @method getRawValue
     * @hide
     */
    getRawValue : Ext.emptyFn,
    /**
     * @method setRawValue
     * @hide
     */
    setRawValue : Ext.emptyFn
});