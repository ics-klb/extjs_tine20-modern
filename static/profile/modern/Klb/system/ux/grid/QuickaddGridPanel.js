/*
 * Modern 3.0
 * 
 * @package     Ext
 * @subpackage  ux
 * @license     http://www.gnu.org/licenses/agpl.html AGPL Version 3
 * @author      Cornelius Weiss <c.weiss@metaways.de>
 * @copyright   Copyright (c) 2007-2008 Metaways Infosystems GmbH (http://www.metaways.de)
 *
 */
Ext.ns('Ext.ux', 'Ext.ux.grid');

Ext.define('Ext.ux.grid.QuickaddGridPanel', {
    extend:  'Ext.grid.Panel', // 'Ext.grid.EditorGridPanel',
    /**
     * @cfg {String} quickaddMandatory 
     * Mandatory field which must be set before quickadd fields will be enabled
     */
    quickaddMandatory: false,
    /**
     * if set, the quickadd fields are validated on blur
     * @type Boolean
     */
    validate: false,
    
    /**
     * @cfg {Bool} resetAllOnNew
     * reset all fields after new record got created (per default only den mandatory field gets resetted).
     */
    resetAllOnNew: false,
    
    /**
     * @property {Bool} adding true if a quickadd is in process
     */
    adding: false,

    initComponent: function(){
        var me = this,
            cellEditingPlugin = Ext.create('Ext.grid.plugin.CellEditing');

        me.idPrefix = Ext.id();
        me.plugins = [cellEditingPlugin];

        me.on('columnresize', me.syncFormFieldWidth);
        me.callParent();

        me.cls = 'x-grid3-quickadd';
        // The customized header template
        me.initTemplates();
        // add our fields after view is rendered
        me.getView().afterRender = Ext.Function.createSequence(me.getView().afterRender, me.renderQuickAddFields, me);
        // init handlers
        me.quickaddHandlers = {
            scope: me,
            blur: function(field){
                Ext.Function.defer(this.doBlur, 250, this);
            },
            specialkey: function(f, e){
                var key = e.getKey();
                switch (key) {
                    case e.ENTER:
                        e.stopEvent();
                        f.el.blur();
                        if (f.triggerBlur){
                            f.triggerBlur();
                        }
                        break;
                    case e.ESC:
                        e.stopEvent();
                        f.setValue('');
                        f.el.blur();
                        break;
                }
            }
        };
    },

    /**
     * @private
     */
    initTemplates: function() {
        var me = this,
            cm = me.getColumnManager(),
            ncols = cm.headerCt.getColumnCount();

        var _quickFormadd = {
            xtype: 'form',
            dock: 'top',
            layout: {
                type: 'hbox',
                pack: 'start',
                align: 'stretch'
            },
            height: 23,
            weight: 101,
            bodyPadding: 0,
            cls: 'new-row',
            defaults: {
                frame: true,
                bodyPadding: 1
            },
            reference: 'quicktopfrom',
            bodyStyle: {
                'background-color': '#E4E5E7'
            },
            items: []
        };

        for (var i=0; i<ncols; i++) {
            var _colum = cm.headerCt.getHeaderAtIndex(i),
                colId = _colum.getId();
            if ( !_colum.config.hidden ) {
                _quickFormadd.items.push({
                    xtype: 'component',
                    reference: 'field' + _colum.config.dataIndex,
                    width: _colum.config.width || 0
                });
            }

        }
        me.addDocked(_quickFormadd, 'top');
        // me.getHeaderContainer().add(_quickFormadd, 'top');
    },

    /**
     * Handles the task grid columnresize event.
     * Synchronizes the width the column's associated form field with the width of the column
     * @param {Ext.grid.header.Container} headerContainer
     * @param {Ext.column.Column} column
     * @param {Number} width The new column width
     */
    syncFormFieldWidth: function(headerContainer, column, width) {
        var  field =  this.down('[reference=quicktopfrom]').query('[reference=field' + column.dataIndex + ']')[0],
             hdCl  =  this.headerCt.query('[dataIndex=' + column.dataIndex + ']')[0];
        // width = column.config.width  > width ? column.config.width : width;
        if (field) {
            // column.setWidth(width);
            field.setWidth(width);
            if ( column.config && column.config.quickaddField  && column.config.quickaddField.setWidth ) {
                column.config.quickaddField.setWidth(width-5);
            }
        }
    },

    /**
     * renders the quick add fields
     */
    renderQuickAddFields: function() {

        var me =  this,
            _form = me.down('[reference=quicktopfrom]'),
            _index = 0;

        if (_form ) {
            Ext.each(this.getCols(), function (column) {
                var _component = me.getQuickAddWrap(_index, column);
                if (column.quickaddField) {
                    column.quickaddField.render( _component.getEl() );
                    column.quickaddField.setDisabled(column.dataIndex != me.quickaddMandatory);
                    column.quickaddField.on(me.quickaddHandlers);
                }
                    me.syncFormFieldWidth(_component, column);
                _index++;
            }, me);

            var headerCt = this.getHeaderContainer();
            headerCt.on('configchange', me.syncFields, me);
            headerCt.on('widthchange',  me.syncFields, me);
            headerCt.on('hiddenchange', me.syncFields, me);

            me.on('resize',       me.syncFields);
            me.on('columnresize', me.syncFields);

            me.syncFields();

            var fieldHeader  = me.getColumnManager().getHeaderByDataIndex(me.quickaddMandatory);
            if (fieldHeader)
                fieldHeader.quickaddField.on('focus', this.onMandatoryFocus, this);
        }
    },
    
    /**
     * @private
     */
    doBlur: function(){

        // check if all quickadd fields are blured, validate them if required
        var focusedOrInvalid,
            cm = this.getColumnManager();
        Ext.each(this.getCols(true), function(item){
            if(item.quickaddField && (item.quickaddField.hasFocus || item.quickaddField.hasFocusedSubPanels || (this.validate && !item.quickaddField.isValid()))) {
                focusedOrInvalid = true;
            }
        }, this);

        // only fire a new record if no quickaddField is focused
        if (!focusedOrInvalid) {
            var data = {};
            Ext.each(this.getCols(true), function(item){
                if(item.quickaddField){
                    if(item.dataIndex != 'alarm_action'){
                        data[item.dataIndex] = item.quickaddField.getValue();
                        item.quickaddField.setDisabled(item.dataIndex != this.quickaddMandatory);
                    }
                }
            }, this);
            
            if (cm.getHeaderByDataIndex(this.quickaddMandatory).quickaddField.getValue() != '') {
                if (this.fireEvent('newentry', data)){
                    cm.getHeaderByDataIndex(this.quickaddMandatory).quickaddField.setValue('');
                    if(this.validate) {
                        cm.getHeaderByDataIndex(this.quickaddMandatory).quickaddField.clearInvalid();
                    }
                    if (this.resetAllOnNew) {
                        var columns = this.colModel.config;
                        for (var i = 0, len = columns.length; i < len; i++) {
                            if(columns[i].quickaddField != undefined){
                               columns[i].quickaddField.setValue('');
                            }
                        }
                    }
                }
            }
            
            this.adding = false;
        }
        
    },

    /**
     * gets columns
     *
     * @param {Boolean} visibleOnly
     * @return {Array}
     */
    getCols: function(visibleOnly) {
        if(visibleOnly === true){
            var visibleCols = [];
            Ext.each(this.headerCt.config.items, function(column) {
                if (! column.hidden) {
                    visibleCols.push(column);
                }
            }, this);
            return visibleCols;
        }
        return this.headerCt.config ? this.headerCt.config.items : [];
    },

    /**
     * returns wrap el for quick add filed of given col
     * 
     * @param {Ext.grid.Colum} col
     * @return {Ext.Element}
     */
    getQuickAddWrap: function(index, column) {

        return  this.down('[reference=quicktopfrom]').query('[reference=field' + column.dataIndex + ']')[0];
    },

    /**
     * @private
     */
    syncFields: function() {
        return;
        var newRowEl = Ext.get(Ext.DomQuery.selectNode('tr[class=new-row]', this.getView().getHeaderCt().dom));
        
        var columns = this.getCols();
        for (var column, tdEl, i=columns.length -1; i>=0; i--) {
            column = columns[i];
            var tdEl = this.getQuickAddWrap(column).parent();
            
            // resort columns
            newRowEl.insertFirst(tdEl);
            
            // set hidden state
            tdEl.dom.style.display = column.hidden ? 'none' : '';
            
            // resize
            //tdEl.setWidth(column.width);
            if (column.quickaddField) {
                column.quickaddField.setSize(column.width -1);
            }
        }
    },
    
    /**
     * @private
     */
    onMandatoryFocus: function() {
        this.adding = true;
        Ext.each(this.getCols(true), function(item){
            if(item.quickaddField){
                item.quickaddField.setDisabled(false);
            }
        }, this);
    }
});

