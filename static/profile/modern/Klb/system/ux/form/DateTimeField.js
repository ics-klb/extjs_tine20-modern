/*
 * Modern 3.1.0
 * 
 * @license     http://www.gnu.org/licenses/agpl.html AGPL Version 3
 * @author      Cornelius Weiss <c.weiss@metaways.de>
 * @copyright   Copyright (c) 2007-2011 Metaways Infosystems GmbH (http://www.metaways.de)
 *
 */

/*global Ext*/

Ext.ns('Ext.ux', 'Ext.ux.form');

/**
 * A combination of datefield and timefield
 * 
 * @namespace   Ext.ux.form
 * @class       Ext.ux.form.DateTimeField
 * @extends     Ext.form.Field
 */
Ext.define("Ext.ux.form.DateTimeField", {
    extend: 'Ext.form.field.Date',
    alias: 'widget.datetimefield',
    requires: ['Ext.ux.form.DateTimePicker'],
    hiddenFormat: 'Y-m-d H:i:s',
    format: 'Y-m-d',
    width: 145,
    initComponent: function () {
        this.format = 'Y-m-d H:i';
        this.callParent();
    },
    // overwrite
    createPicker: function () {
        var me = this,
            format = Ext.String.format;

        return Ext.create('Ext.ux.form.DateTimePicker', {
            ownerCt: me.ownerCt,
            renderTo: Ext.getBody(),
            floating: true,
            hidden: true,
            focusOnShow: true,
            width: me.width,
            minDate: me.minValue,
            maxDate: me.maxValue,
            disabledDatesRE: me.disabledDatesRE,
            disabledDatesText: me.disabledDatesText,
            disabledDays: me.disabledDays,
            disabledDaysText: me.disabledDaysText,
            format: me.format,
            showToday: me.showToday,
            startDay: me.startDay,
            minText: format(me.minText, me.formatDate(me.minValue)),
            maxText: format(me.maxText, me.formatDate(me.maxValue)),
            listeners: {
                scope: me,
                select: me.onSelect
            },
            keyNavConfig: {
                esc: function () {
                    me.collapse();
                }
            }
        });
    }
});

Ext.define("Ext.ux.form.DateTimeFieldCombo", {
    extend: 'Ext.form.field.Base',
    requires: [
        'Ext.form.field.Date',
        'Ext.form.field.Time',
        'Ext.form.Label',
        'Ext.form.field.Checkbox',
        'Ext.layout.container.Column',
        'Ext.ux.form.ClearableDateField'
    ],
    xtype: 'datetimefieldcombo',

    autoEl: 'div',
    value: '',
    increment: 15,
    timeEditable: true,
    markedInvalid: false,
    layout: {
        type: 'hbox',
        align: 'stretch'
    },
    inputWrapCls: Ext.baseCSSPrefix + 'form-text-wrap',
    inputWrapFocusCls: Ext.baseCSSPrefix + 'form-text-wrap-focus',
    inputWrapInvalidCls: Ext.baseCSSPrefix + 'form-text-wrap-invalid',
    /**
     * @cfg {Object} config to be applied to date field
     */
    dateConf: null,

    /**
     * @cfg {Object} config to be applied to time field
     */
    timeConf: null,

    /*
     * @cfg {String} Default Time in the form HH:MM, if null current time is used
     */
    defaultTime: null,

    dtSeparator: ' ',
    hiddenFormat: 'Y-m-d H:i:s',
    hideMode: 'offsets',
    otherToNow: true,
    timePosition: 'right',
    dateWidth: 135,
    timeWidth: 100,

    initComponent: function () {

        this.lastValues = [];

        var dateConf  = Ext.apply({
            lazyRender: false,
            width: this.dateWidth,

            readOnly: this.readOnly,
            hideTrigger: this.hideTrigger,
            disabled: this.disabled,
            tabIndex: this.tabIndex === -1 ? this.tabIndex : false,
            allowBlank: this.allowBlank,
            value: this.value,
            listeners: {
                scope: this,
                change: this.onDateChange,
                select: this.onDateChange,
                focus: this.onDateFocus,
                blur: this.onDateBlur
            }
        }, this.dateConf || {});

        var timeConf = Ext.apply({
            lazyRender: false,
            width: this.timeWidth,
            increment: this.increment,
            readOnly: this.readOnly,
            hideTrigger: this.hideTrigger,
            disabled: this.disabled,
            editable: this.timeEditable,
            format: 'H:i',
            altFormats:'H:i',
            tabIndex: this.tabIndex === -1 ? this.tabIndex : false,
            allowBlank: this.allowBlank,
            value: this.value,
            listeners: {
                scope: this,
                change: this.onTimeChange,
                select: this.onTimeChange,
                focus: this.onDateFocus,
                blur: this.onDateBlur
            }
        }, this.timeConf || {});


        var dateField = (this.allowBlank) ? 'Ext.ux.form.ClearableDateField' : 'Ext.form.DateField';

        this.dateField = Ext.create(dateField,             dateConf );
        this.timeField = Ext.create('Ext.form.TimeField',  timeConf );

        this.callParent(arguments);

        this.on('change', this.onChange, this);
    },

    /**
     * Sets the default time when using the first time or after clearing the datefield
     * @param {Ext.form.Field}
     * @param {DateTime} newValue
     * @param {DateTime} oldValue
     */
    onChange: function(f, newValue, oldValue) {

        if(oldValue == '' && newValue) {
            var newDate = newValue.clone(),
                now = new Date(),
                times = (this.defaultTime) ? this.defaultTime.split(':') : [now.getHours(), now.getMinutes()];


            newDate.setHours(parseInt(times[0]));
            newDate.setMinutes(parseInt(times[1]));

            f.setValue(newDate);
        }
    },

    clearInvalid: function () {
        this.markedInvalid = false;

        if (this.dateField) {
            this.dateField.clearInvalid();
        }
        if (this.timeField) {
            this.timeField.clearInvalid();
        }
    },

    clearTime: function () {
        var dateTime = this.getValue();
        if (Ext.isDate(dateTime)) {
            this.setValue(this.getValue().clearTime(true));
        } else {
            this.timeField.setValue(new Date().clearTime());
        }
    },

    combineDateTime: function (date, time) {
        date = Ext.isDate(date) ? date : new Date.clearTime();

        if (Ext.isDate(time)) {
            date = date.clone();
            date.clearTime();
	    if(date.getHours() == 01){
		date = date.add(Date.HOUR, time.getHours() -1);
	    } else{
		date = date.add(Date.HOUR, time.getHours());
	    }
            date = date.add(Date.MINUTE, time.getMinutes());
        }

        return date;
    },

    getName: function () {
        return this.name;
    },

    getValue: function () {
        if (! this.dateField) {
            return this.value;
        }

        var date = this.dateField.getValue();
        var time = this.timeField.getValue();

        // this is odd, why doesn't Ext.form.TimeField a Date datatype?
        if (! Ext.isDate(time)) {
            time = Ext.Date.parse(time, 'H:i');
        }

        if (Ext.isDate(date)) {
            date = this.combineDateTime(date, time);
        }

        return date;
    },

    markInvalid: function (msg) {
        this.markedInvalid = true;

        this.dateField.markInvalid(msg);
        this.timeField.markInvalid(msg);
    },

    onRender: function (ct, position) {

        Ext.ux.form.DateTimeField.superclass.onRender.call(this, arguments);

        // this.el = Ext.dom.Element.create({tag: this.autoEl} );
        // this.el.id = this.getId();
        // this.el = Ext.fly(this.el);
        //     // ct.dom.insertBefore(this.el.dom, ct.dom.firstChild); // set label before tag:input
        //  ct.insertFirst(this.el);
        //  // ct.createChild(this.el.dom);


        // this.dateField.render( this.el );
        // this.timeField.render( this.el );

        // render DateField and TimeField
        // create bounding table
        if ('below' === this.timePosition) {
            var t = Ext.DomHelper.append(ct, {
                tag: 'table',
                style: 'border-collapse:collapse',
                children: [{
                    tag: 'tr',
                    children: [{
                        tag: 'td',
                        style: 'padding-bottom:1px',
                        cls: 'ux-datetime-date'
                    }]
                }, {
                    tag: 'tr',
                    children: [{
                        tag: 'td',
                        cls: 'ux-datetime-time'
                    }]
                }]
            }, true);
        }
        else {
            var t = Ext.DomHelper.append(ct, {
                tag: 'table',
                style: 'border-collapse:collapse',
                children: [{
                    tag: 'tr',
                    children: [{
                        tag: 'td',
                        style: 'padding-right:4px',
                        cls: 'ux-datetime-date'
                    }, {
                        tag: 'td',
                        cls: 'ux-datetime-time'
                    }]
                }]
            }, true);
        }

        this.tableEl = t;
        this.wrap = t.wrap({
            cls: 'x-form-field-wrap'
        });
        this.wrap.on("mousedown", this.onMouseDown, this, {
            delay: 10
        });

        // render DateField & TimeField
        this.dateField.render(Ext.getDom(t.query('td.ux-datetime-date')[0]) );
        this.timeField.render(Ext.getDom(t.query('td.ux-datetime-time')[0]) );

        if (Ext.isIE && Ext.isStrict) {
            t.select('input').applyStyles({
                top: 0
            });
        }

         this.callParent([ct, position]);
    },

    // private
    afterRender: function(){
        this.callParent(arguments);
        this.wrap = this.el.down('.x-form-text-wrap');
    },

    onDateFocus: function () {
        this.hasFocus = true;
        this.fireEvent('focus', this);
    },

    onDateBlur: function () {
        this.hasFocus = false;
        this.fireEvent('blur', this);
    },

    onDateChange: function () {
        var newValue = this.getValue();
        this.setValue(newValue);
        this.fireEvent('change', this, newValue, this.lastValues.length > 1 ? this.lastValues[this.lastValues.length - 2] : '');
    },

    onResizeDD: function (w, h) {

        Ext.ux.form.DateTimeField.superclass.onResize.apply(this, arguments);
        // if (!w) {
        //     return;
        // }
        // if ('below' == this.timePosition) {
        //     this.dateField.setSize(w, h);
        //     this.timeField.setSize(w, h);
        //     if (Ext.isIE) {
        //         this.dateField.el.up('td').setWidth(w);
        //         this.timeField.el.up('td').setWidth(w);
        //     }
        // }
        // else {
        //     this.dateField.setSize(w - this.timeWidth - 4, h);
        //     this.timeField.setSize(this.timeWidth, h);
        //
        //     if (Ext.isIE) {
        //         this.dateField.el.up('td').setWidth(w - this.timeWidth - 4);
        //         this.timeField.el.up('td').setWidth(this.timeWidth);
        //     }
        // }


        if(this.allowBlank) {
            var korrel = [0.65, 0.35];
        } else {
            var korrel = [0.55, 0.45];
        }

        // // needed for readonly
        // this.el.setHeight(20);
        // // this.el.setStyle({'position': 'relative'});
        //
        // var dateFieldWidth = Math.abs(w * korrel[0] - 5);
        // // this.dateField.el.down('.x-form-text-wrap').setStyle({'position': 'absolute'});
        // this.dateField.setWidth(dateFieldWidth);
        // this.dateField.el.down('.x-form-text-wrap').setWidth(dateFieldWidth);
        //
        // var timeFieldWidth = Math.abs(w * korrel[1]);
        // // this.timeField.el.down('.x-form-text-wrap').setStyle({'position': 'absolute'});
        // this.timeField.setWidth(timeFieldWidth);
        // this.timeField.el.down('.x-form-text-wrap').setWidth(timeFieldWidth);
        // this.timeField.el.down('.x-form-text-wrap').setLeft(dateFieldWidth + 5);
    },

    onTimeChange: function () {
        var newValue = this.getValue();
        this.setValue(newValue);
        this.fireEvent('change', this, newValue, this.lastValues.length > 1 ? this.lastValues[this.lastValues.length - 2] : '');
    },

    setDisabled: function (bool, what) {
        if (what !== 'time' && this.dateField) {
            this.dateField.setDisabled(bool);
        }

        if (what !== 'date' && this.timeField) {
            this.timeField.setDisabled(bool);
        }

        Ext.ux.form.DateTimeField.superclass.setDisabled.call(this, bool);
    },

    setReadOnly: function (bool, what) {
        if (what !== 'time' && this.dateField) {
            this.dateField.setReadOnly(bool);
        }

        if (what !== 'date' && this.timeField) {
            this.timeField.setReadOnly(bool);
        }

        Ext.ux.form.DateTimeField.superclass.setReadOnly.call(this, bool);
    },

    setRawValue: Ext.EmptyFn,

    setValue: function (value, skipHistory) {
        if (! skipHistory) {
            this.lastValues.push(value);
        }

        if (this.dateField && this.timeField) {
            this.dateField.setValue(value);
            this.timeField.setValue(value);
        }

        this.value = value;
       return this;
    },

    undo: function () {
        if (this.lastValues.length > 1) {
            this.lastValues.pop();
            this.setValue(this.lastValues[this.lastValues.length - 1], true);
        } else {
            this.reset();
        }
    },

    isValid: function (preventMark) {
        return this.dateField.isValid(preventMark) && this.timeField.isValid(preventMark) && ! this.markedInvalid;
    }
});

Ext.define('Ext.ux.form.DateTimeRange', {
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