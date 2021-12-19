//Ext.define("Ext.locale.en.ux.picker.DateTimePicker", {
//	  override: "Ext.ux.DateTimePicker",
//	  todayText: "Now",
//	  timeLabel: 'Time'
//  });

Ext.define('Ext.ux.form.DateTimePicker', {
	  extend: 'Ext.picker.Date',
	  alias: 'widget.datetimepicker',
	  todayText: 'Current Time ',
	  timeLabel: '  Time ',
	  requires: ['Ext.ux.form.TimePickerField'],

	  initComponent: function() {
		  // keep time part for value
		  var value = this.value || new Date();
		  this.callParent();
		  this.value = value;
	  },
	  onRender: function(container, position) {
		  if(!this.timefield) {
			  this.timefield = Ext.create('Ext.ux.form.TimePickerField', {
				    fieldLabel: this.timeLabel,
				    labelWidth: 36,
				    width: this.width-5,
				    value: Ext.Date.format(this.value, 'H:i:s')
			    });
		  }
		  this.timefield.ownerCt = this;
		  this.timefield.on('change', this.timeChange, this);
		  //this.timefield.on('blur', this.timeChange, this);
		  this.callParent(arguments);

		  var table = Ext.get(Ext.DomQuery.selectNode('table', this.el.dom));
		  var tfEl = Ext.core.DomHelper.insertAfter(table, {
			    tag: 'div',
			    style: 'border:0px;',
			    children: [{
				      tag: 'div',
				      cls: 'x-datepicker-footer ux-timefield',
			      }]
		    }, true);
		  this.timefield.render(this.el.child('div div.ux-timefield'));

		  var p = this.getEl().parent('div.x-layer');
		  if(p) {
			  p.setStyle("height", p.getHeight() + 31);
			  p.setStyle("width", p.getWidth());
		  }
		  this.i = 0;
	  },
	  // listener, timefield change
	  timeChange: function(tf, time, rawtime) {		  
		  this.value = this.fillDateTime(this.value);
		  this.setValue(new Date(this.value));
		  if(typeof this.i !== 'undefined'){
			  this.fireEvent('select', this, this.value);
			  this.onSelect(); 
		  }		  
	  },
	  // @private
	  fillDateTime: function(value) {
		  if(this.timefield) {
			  var rawtime = this.timefield.getRawValue();
			  value.setHours(rawtime.h);
			  value.setMinutes(rawtime.m);
			  value.setSeconds(rawtime.s);
		  }
		  return value;
	  },
	  // @private
	  changeTimeFiledValue: function(value) {
		  this.timefield.un('change', this.timeChange, this);
		  this.timefield.setValue(this.value);
		  this.timefield.on('change', this.timeChange, this);
	  },

	  /* TODO this.timeValue */
	  // overwrite
	  setValue: function(value) {
		  this.value = value;
		  this.changeTimeFiledValue(this.value);
		  return this.update(this.value);
	  },
	  // overwrite
	  getValue: function() {
		  return this.fillDateTime(this.value);
	  },

	  // overwrite : fill time before setValue
	  handleDateClick: function(e, t) {
		  var me = this,
			  handler = me.handler;

		  //e.stopEvent();
		  if(!me.disabled && t.dateValue && !Ext.fly(t.parentNode).hasCls(me.disabledCellCls)) {
			  me.doCancelFocus = me.focusOnSelect === false;
			  me.setValue(this.fillDateTime(new Date(t.dateValue))); // overwrite: fill time before setValue
			  delete me.doCancelFocus;
			  me.fireEvent('select', me, me.value);
			  if(handler) {
				  handler.call(me.scope || me, me, me.value);
			  }
			  me.onSelect();
		  }
	  },

	  // overwrite : fill time before setValue
	  selectToday: function() {
		  var me = this,
			  btn = me.todayBtn,
			  handler = me.handler;
		  

		  if(btn && !btn.disabled) {
			  // me.setValue(Ext.Date.clearTime(new Date())); //src
			  me.setValue(new Date());// overwrite: fill time before setValue
			  me.fireEvent('select', me, me.value);
			  if(handler) {
				  handler.call(me.scope || me, me, me.value);
			  }
			  me.onSelect();
		  }
		  return me;
	  }
  });