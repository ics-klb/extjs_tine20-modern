/*
 * Modern 3.1.0
 * 
 * @license     http://www.gnu.org/licenses/agpl.html AGPL Version 3
 * @author      Cornelius Weiss <c.weiss@metaways.de>
 * @copyright   Copyright (c) 2007-2013 Metaways Infosystems GmbH (http://www.metaways.de)
 */
Ext.ns('Klb.system.widgets.grid');

Ext.define('Klb.system.widgets.grid.FilterToolbar', {
    extend: 'Ext.panel.Panel',
    requires: [
          'Klb.system.widgets.container.FilterModel'
        , 'Klb.system.widgets.container.ContainerSelect'

        , 'Klb.system.widgets.grid.FilterModel'
        , 'Klb.system.widgets.grid.FilterRegistry'
        , 'Klb.system.widgets.grid.FilterPlugin'
        , 'Klb.system.widgets.grid.ForeignRecordFilter'
        , 'Klb.system.widgets.grid.FilterPanel'
        , 'Klb.system.widgets.grid.OwnRecordFilter'
        , 'Klb.system.widgets.grid.QuickaddGridPanel'
        , 'Klb.system.widgets.grid.FilterStructureTreePanel'
        , 'Klb.system.widgets.grid.FilterSelectionModel'
        , 'Klb.system.widgets.grid.FilterModelMultiSelect'
        , 'Klb.system.widgets.grid.QuickaddGridPanel'
        , 'Klb.system.widgets.grid.PickerGridPanel'

        , 'Klb.system.widgets.keyfield.ComboBox'
        , 'Klb.system.widgets.keyfield.Filter'
        , 'Klb.system.widgets.keyfield.Renderer'
        , 'Klb.system.widgets.keyfield.Renderer'
        , 'Klb.system.widgets.keyfield.Store'
    ],
    xtype: 'apiwidgetsfiltertoolbar',
    mixins: {
        observable: 'Klb.system.widgets.grid.FilterPlugin'
    },
    constructor: function (config) {
        config = config || {};
        
       // become filterPlugin
       //  Ext.applyIf(this, Ext.create('Klb.system.widgets.grid.FilterPlugin', {}) );
        this.mixins.observable.constructor.call(this, config);

        this.childSheets = {};
        this.callParent(arguments);
    },
    
    /**
     * @cfg {Array} array of filter models (possible filters in this toolbar)
     */
    filterModels: null,
    
    /**
     * @cfg {String} fieldname of default filter
     */
    defaultFilter: null,
    
    /**
     * @cfg {Klb.system.data.Record} model this filter is for
     */
    recordClass: null,
    
    /**
     * @cfg {Bool} allowSaving (defaults to false)
     */
    allowSaving: false,
    
    /**
     * @cfg {Bool} neverAllowSaving (defaults to false)
     */
    neverAllowSaving: false,

    /**
     * @cfg {Bool} showSearchButton (defaults to true)
     */
    showSearchButton: true,
    
    filterFieldWidth: 240,
    filterValueWidth: 200,
    
    /**
     * @cfg {String} row prefix (defaults to _('Show'))
     */
    rowPrefix: null,
    
    /**
     * @property childSheets
     * @type Object
     */
    childSheets: null,
    
    /**
     * @property isActive
     * @type Boolean
     */
    isActive: true,
    
    header: false,
    border: false,
    monitorResize: true,
    // region: 'north',
    layout: 'fit',

    modelClass: 'Klb.system.Model.FilterToolbar',
    
    frowIdPrefix: 'tw-ftb-frowid-',
    
    /**
     * @private
     */
    initTemplates : function() {

        var ts = this.templates || {};
        if(!ts.master) {
            ts.master = new Ext.Template(
                '<div class="tw-filtertoolbar x-toolbar x-small-editor" hidefocus="true">',
                    '<table style="width: auto;" border="0" cellpadding="0" cellspacing="0">',
                         '{tbody}', 
                     '</table>',
                '</div>'
            );
        }
        if(!ts.filterrow){
            ts.filterrow = new Ext.Template(
                '<tr id="{id}" class="fw-ftb-frow">',
                    '<td class="tw-ftb-frow-pbutton"></td>',
                    '<td class="tw-ftb-frow-mbutton"></td>',
                    '<td class="tw-ftb-frow-prefix">{prefix}</td>',
                    '<td class="tw-ftb-frow-field" width="' + this.filterFieldWidth + 'px">{field}</td>',
                    '<td class="tw-ftb-frow-operator" width="90px" >{operator}</td>',
                    '<td class="tw-ftb-frow-value" width="' + this.filterValueWidth + 'px">{value}</td>',
                    '<td class="tw-ftb-frow-searchbutton"></td>',
                    //'<td class="tw-ftb-frow-deleteallfilters"></td>',
                    //'<td class="tw-ftb-frow-savefilterbutton"></td>',
                '</tr>'
            );
        }

        for(var k in ts){
            var t = ts[k];
            if(t && typeof t.compile == 'function' && !t.compiled){
                t.disableFormats = true;
                t.compile();
            }
        }

        this.templates = ts;
    },
    
    /**
     * @private
     */
    initActions: function() {
        this.actions = {
            addFilterRow: new Ext.button.Button({
                //disabled: true,
                tooltip: _('add new filter'),
                iconCls: 'action_addFilter',
                scope: this,
                handler: this.addFilter
            }),
            removeAllFilters: new Ext.button.Button({
                tooltip: _('reset all filters'),
                iconCls: 'action_delAllFilter',
                scope: this,
                handler: this.deleteAllFilters
            }),
            startSearch: new Ext.button.Button({
                text: _('start search'),
                iconCls: 'action_startFilter',
                scope: this,
                handler: function() {
                    this.onFiltertrigger();
                }
            }),
            saveFilter: new Ext.button.Button({
                tooltip: _('save as favorite'),
                iconCls: 'action_saveFilter',
                handler: this.onSaveFilter.bind(this)
            })
        };

        this.action_loadFilter = new Ext.Action({
            text: _('Load a favorite'),
            hidden: true,
            iconCls: 'action-apibase-favorite',
            scope: this,
            handler: this.onLoadFilter
        });
    },

    /**
     * @private
     */
    onRender: function() { // ct, position
        this.callParent(arguments);
        // only get app and enable saving if this.store is available (that is not the case in the activities panel)
        if (! this.app && this.store) {
            this.app = Klb.system.appMgr.get(this.store.proxy.recordClass.getMeta('appName'));
        }
        // automatically enable saving
        if (! this.neverAllowSaving && this.app && this.app.getMainScreen() 
                && typeof this.app.getMainScreen().getWestPanel == 'function' 
                && this.app.getMainScreen().getWestPanel().hasFavoritesPanel) {
            this.allowSaving = true;
        }
        // render static table
        this.renderTable();
        // render each filter row into table
        this.filterStore.each(function(filter) {
            this.renderFilterRow(filter);
        }, this);
        // render static action buttons
        for (var action in this.actions) {
            this.actions[action].hidden = true;
            this.actions[action].render(this.body);  // this.body - this.bwrap
        }
        // wrap search button an set it always mouse-overed
        this.searchButtonWrap = this.actions.startSearch.getEl().wrap();
        this.searchButtonWrap.addCls('x-btn-over');  //   addClass
        // arrange static action buttons
 
        this.onFilterRowsChange();
        if (! this.parentSheet) {
            this.tbar = Ext.create('Ext.toolbar.Toolbar', {
                items:  [],
                hidden: true
            });
            this.tbar.render(this.el, 0);
        }

        this.breadCrumb = Ext.create('Ext.Action', {
            text: (this.parentSheet ? '&gt;&nbsp;&nbsp;&nbsp;' : '') + this.title,
            scope: this,
            handler: function() {
                this.setActiveSheet(this);
            }
        });
    },
    
    generateTitle: function() {
        var title = this.id;
        
        if (this.recordClass) {
            var app = Klb.system.appMgr.get(this.recordClass.getMeta('appName')),
                recordName = this.recordClass.getMeta('recordName'),
                recordsName = this.recordClass.getMeta('recordsName');
                
            title = app.i18n.n_hidden(recordName, recordsName, 50);
        }
        
        return title;
    },
    
    /**
     * is persiting this filterPanel is allowed
     * 
     * @return {Boolean}
     */
    isSaveAllowed: function() {
        return this.allowSaving;
    },
    
    /**
     * called when the title of this panel changes
     * 
     * @param {Ext.panel.Panel} panel
     * @param {String} title
     */
    onTitleChange: function(panel, title) {
        if (this.breadCrumb) {
            this.breadCrumb.setText((this.parentSheet ? '&gt;&nbsp;&nbsp;&nbsp;' : '') + title);
        }
    },
    
    /**
     * save filterset as persisten filter
     */
    onSaveFilter: function() {
        this.app.getMainScreen().getWestPanel().getFavoritesPanel().saveFilter();
    },
    
    onLoadFilter: function() {
        Ext.Msg.alert('sorry', 'not yet implemented');
    },
    
    /**
     * renders static table
     * @private
     */
    renderTable: function() {

        var ts = this.templates;
        var tbody = '';
        
        this.filterStore.each(function(filter){
            tbody += ts.filterrow.apply({
                id: this.frowIdPrefix + filter.id
            });
        }, this);
        
        this.tableEl = ts.master.overwrite(this.body, {tbody: tbody}, true);
    },
    
    /**
     * renders the filter specific stuff of a single filter row
     * 
     * @param {Ext.data.Model} el representing a filter tr tag
     * @private
     */
    renderFilterRow: function(filter) {

        filter.formFields = {};
        var filterModel = this.getFilterModel(filter);
        if (! filterModel) {
            Klb.Logger.warn('Klb.system.widgets.grid.FilterToolbar::renderFilterRow no filterModel found');
            Klb.Logger.warn(filter);
            this.filterStore.remove(filter);
            return;
        }
        var fRow = this.body.getById(this.frowIdPrefix + filter.id);

        // field
        filter.formFields.field = new Ext.form.field.ComboBox({
            filter: filter,
            width: this.filterFieldWidth,
            minListWidth: 240, // will be ignored if width is heigher
            resizable: true,
            id: 'tw-ftb-frow-fieldcombo-' + filter.id,
            mode: 'local',
            lazyInit: false,
            emptyText: _('select a field'),
            forceSelection: true,
            typeAhead: true,
            triggerAction: 'all',
            store: this.fieldStore,
            displayField: 'label',
            valueField: 'field',
            value: filterModel.field,
            renderTo: fRow.down('td[class=tw-ftb-frow-field]'),
            validator: this.validateFilter.bind(this),
            tpl:  '<ul class="x-list-plain">'
                    + '<tpl for="."><li role="option" class="x-boundlist-item x-combo-list-item tw-ftb-field-{field}">{label}</li></tpl>'
                  + '</ul>'

        });
        filter.formFields.field.setValue = Ext.Function.createInterceptor(filter.formFields.field.setValue, function() {
            // NOTE: as this.fieldStore is a shared store we need to clear the filter before we use it,
            // otherwise the record (e.g. query) might not be in the store
            this.fieldStore.clearFilter();
        }, this);
        
        filter.formFields.field.on('select', function(combo, newRecord, newKey) {
            if (combo.value != combo.filter.get('field')) {
                this.onFieldChange(combo.filter, combo.value);
            }
        }, this);
        
        filter.formFields.field.on('blur', function(combo) {
            if (combo.value != combo.filter.get('field')) {
                this.onFieldChange(combo.filter, combo.value);
            }
        }, this);
        
        // operator
        filter.formFields.operator = filterModel.operatorRenderer(filter, fRow.down('td[class^=tw-ftb-frow-operator]'));
        
        // value
        filter.formFields.value = filterModel.valueRenderer(filter, fRow.down('td[class^=tw-ftb-frow-value]'));

        var elId = 'tw-ftb-frow-deletebutton-' + filter.id;
        filter.deleteRowButton =  Ext.getCmp(elId) || Ext.create('Ext.button.Button', {
            id: elId,
            tooltip: _('Delete this filter'),
            filter: filter,
            iconCls: 'action_delThisFilter',
            renderTo: fRow.down('td[class=tw-ftb-frow-mbutton]'),
            scope: this,
            handler: function(button) {
                this.deleteFilter(button.filter);
            }
        });
    },
    
    /**
     * validate if type ahead is in our filter store
     * @return {Bool}
     */
    validateFilter: function(value) {
        return this.fieldStore.query('label', value).getCount() != 0;
    },
    
    /**
     * @private
     */
    arrangeButtons: function() {

        var numFilters = this.filterStore.getCount();
        
        if (numFilters == 0) {
            Klb.Logger.info('Klb.system.widgets.grid.FilterToolbar::arrangeButtons no filters found!');
            return;
        }
        
        var firstId = this.filterStore.getAt(0).id,
            lastId = this.filterStore.getAt(numFilters-1).id;
        
        this.filterStore.each(function(filter){
            var tr = this.body.getById( this.frowIdPrefix + filter.id );
            
            // prefix
            tr.down('td[class=tw-ftb-frow-prefix]').dom.innerHTML = _('and');
            //filter.deleteRowButton.setVisible(filter.id != lastId);
                
            if (filter.id == lastId) {
                // move add filter button
                tr.down('td[class=tw-ftb-frow-pbutton]').insertFirst(this.actions.addFilterRow.getEl());
                this.actions.addFilterRow.show();
                // move start search button
                tr.down('td[class=tw-ftb-frow-searchbutton]').insertFirst(this.searchButtonWrap);
                if (this.showSearchButton) {
                    this.actions.startSearch.show();
                }
                // move delete all filters
                // tr.down('td[class=tw-ftb-frow-deleteallfilters]').insertFirst(this.actions.removeAllFilters.getEl());
                this.actions.removeAllFilters.setVisible(numFilters > 1);
                // move save filter button
                // tr.down('td[class=tw-ftb-frow-savefilterbutton]').insertFirst(this.actions.saveFilter.getEl());
                this.actions.saveFilter.setVisible(this.allowSaving && numFilters > 1);
            }
            
            if (filter.id == firstId) {
                tr.down('td[class=tw-ftb-frow-prefix]').dom.innerHTML = this.rowPrefix;
                
                // hack for the save/delete all btns which are now in the first row
                //if (Ext.isSafari) {
                    this.actions.removeAllFilters.getEl().applyStyles('float: left');
                //} else {
                //    this.actions.saveFilter.getEl().applyStyles('display: inline');
                //    this.actions.removeAllFilters.getEl().applyStyles('display: inline');
                //}
                
                tr.down('td[class=tw-ftb-frow-searchbutton]').insertFirst(this.actions.saveFilter.getEl());
                tr.down('td[class=tw-ftb-frow-searchbutton]').insertFirst(this.actions.removeAllFilters.getEl());
                
                //tr.down('td[class=tw-ftb-frow-pmbutton]').insertFirst(this.actions.removeAllFilters.getEl());
                //this.actions.removeAllFilters.setVisible(numFilters > 1);
            }
        }, this);
    },
    
    doLayout: function() {

        if (typeof this.layout.layout == 'function') {
            Klb.system.widgets.grid.FilterToolbar.superclass.doLayout.apply(this, arguments);
        }
        
        if (this.rendered) {
            this.arrangeButtons();
            
            this.filterStore.each(function(filter){
                for (var formItemName in filter.formFields) {
                    if (filter.formFields[formItemName] && typeof filter.formFields[formItemName].syncSize == 'function') {
                        filter.formFields[formItemName].setWidth(filter.formFields[formItemName].width);
                        if (filter.formFields[formItemName].wrap) {
                            filter.formFields[formItemName].wrap.setWidth(filter.formFields[formItemName].width);
                        }
                        filter.formFields[formItemName].syncSize();
                    }
                }
            }, this);
        }
    },
    
    /**
     * called  when a filter action is to be triggered (start new search)
     * @private
     */
    onFiltertrigger: function() {
        if (! this.supressEvents) {
            this.onFilterChange();
        }
    },
    
    /**
     * called on field change of a filter row
     * @private
     */
    onFieldChange: function(filter, newField) {
        var oldFilterModel = this.getFilterModel(filter),
            oldOperator = filter.formFields.operator.getValue(),
            oldValue    = filter.formFields.value.getValue();
        
        // only use old operator/value for textfields
        var f = filter.formFields.value;
        if (typeof f.selectText != 'function' || typeof f.doQuery == 'function') {
            oldValue = '';
        }
        
        if (oldFilterModel && Ext.isFunction(oldFilterModel.onDestroy)) {
            oldFilterModel.onDestroy(filter);
        }
        
        // NOTE: removeMode got introduced on ext3.1 but is not docuemented
        //       'childonly' is no ext mode, we just need something other than 'container'
        filter.formFields.operator.removeMode = 'childsonly';
        filter.formFields.value.removeMode = 'childsonly';
        
        filter.formFields.operator.destroy();
        delete filter.formFields.operator;
        filter.formFields.value.destroy();
        delete filter.formFields.value;
        
        var filterModel = this.getFilterModel(newField);
        var fRow = this.body.getById( this.frowIdPrefix + filter.id );
        
        var opEl = fRow.down('td[class^=tw-ftb-frow-operator]');
        var valEl = fRow.down('td[class^=tw-ftb-frow-value]');
        
        filter.set('field', newField);
        filter.set('operator', '');
        filter.set('value', '');
        
        filter.formFields.operator = filterModel.operatorRenderer(filter, opEl);
        filter.formFields.value = filterModel.valueRenderer(filter, valEl);
        
        // only use old operator/value for textfields
        var f = filter.formFields.value;
        if (oldValue && typeof f.selectText == 'function' && typeof f.doQuery != 'function') {
            var o = filter.formFields.operator;
            
            if (typeof o.findRecord == 'function') {
                if (typeof o.setValue == 'function' && o.findRecord(o.valueField, oldOperator)) {
                    o.setValue(oldOperator);
                }
                filter.formFields.value.setValue(oldValue);
                Ext.Function.defer(filter.formFields.value.selectText, 50, filter, filter.formFields.value);
                // filter.formFields.value.selectText.defer(50, filter.formFields.value);
            }
        }
    },
    
    /**
     * @private
     */
    initComponent: function() {
        this.title = this.generateTitle();
        this.on('titlechange', this.onTitleChange, this);

        this.record  = new Ext.data.Model({fields: Klb.system.Model.FilterToolbar.getFields() });

        this.callParent();
        
        this.on('show', function() {
            this.doLayout();
        }, this);
        
        if (this.rowPrefix === null) {
            this.rowPrefix = _('Show');
        }

        this.initTemplates();
        this.initActions();
        
        // init filters
        this.filters = Ext.isArray(this.filters) ? this.filters : [];
        if (this.filters.length < 1) {
            this.filters = [{field: this.defaultFilter}];
        }
        this.filterStore = Ext.create('Klb.system.data.JsonStore', {
            fields: this.record, // Klb.system.Model.FilterToolbar.fields,
            model: this.modelClass,
            data: this.filters
        });

        // init filter models
        this.filterModelMap = {};
        var filtersFields = [];
        
        if (this.recordClass && ! this.filterModels) {
            // TODO: getFilterModel should not be used anymore. This should completely done by the registry.
            this.filterModels = Ext.isFunction(this.recordClass.getFilterModel) ? this.recordClass.getFilterModel() : [];
        }

        if (this.recordClass) {
            // concat registered filters
            this.filterModels = this.filterModels.concat(Klb.system.widgets.grid.FilterRegistry.get(this.recordClass));

            // auto add foreign record filter on demand
            var foreignRecordFilter = this.createFilterModel({filtertype: 'foreignrecord', ownRecordClass: this.recordClass, isGeneric: true});
            if (foreignRecordFilter.operatorStore.getCount() > 0) {
                this.filterModels.push(foreignRecordFilter);
            }

            // auto add self id filter
            // add own record filter by default but ignore if set
            if (this.ownRecordFilter !== false) {
                this.ownRecordFilterModel = this.createFilterModel({filtertype: 'ownrecord', ownRecordClass: this.recordClass});
                this.filterModels.push(this.ownRecordFilterModel);
            }
        }

        for (var i=0; i<this.filterModels.length; i++) {
            var config = this.filterModels[i],
                fm = this.createFilterModel(config);
            
            this.filterModelMap[fm.field] = fm;
            filtersFields.push(fm);

            fm.on('filtertrigger', this.onFiltertrigger, this);

            // insert subfilters
            if (Ext.isFunction(fm.getSubFilters)) {
                Ext.each(fm.getSubFilters(), function(sfm) {
                    sfm.superFilter = fm;
 
                    // :<field> indicates a left hand filter
                    sfm.field = ':' + sfm.field;
                    
                    this.filterModelMap[sfm.field] = sfm;
                    filtersFields.push(sfm);
                    sfm.on('filtertrigger', this.onFiltertrigger, this);
                }, this);
            }
        }

        // init filter selection
        this.fieldStore = Ext.create('Klb.system.data.JsonStore', {
            fields: ['field', 'label'],
            data: filtersFields,
            remoteSort: false,
            sortInfo: {
                field: 'label',
                direction: 'ASC'
            }
        });
    },
    
    /**
     * called when a filter row gets added/deleted
     * @private
     */
    onFilterRowsChange: function() {
        if (! this.supressEvents) {
            this.ownerCt.updateLayout();
        }
        this.doLayout();
    },
    
    createFilterModel: function(config) {
        if (config && config.isFilterModel) {
            return config;
        }
        
        // push this filtertoolbar in config
        config.ftb = this;

        if (config.filtertype && Klb.system.statics.Filters.getByKey(config.filtertype)) {
            // filter from reg
            return Ext.create(Klb.system.statics.Filters.getByKey(config.filtertype), config);
        } else {

            return new Klb.system.widgets.grid.FilterModel(config);
        }
    },
    
    /**
     * returns filterModel
     * 
     * @param {String} fieldName
     * @return {Klb.system.widgets.grid.FilterModel}
     */
    getFilterModel: function(field) {
        var fieldName = Ext.isFunction(field.get) ? field.get('field') : field;
  
        if (! fieldName && field.data && field.data.condition) {
            return this.ownRecordFilterModel;
        }
        
        return this.filterModelMap[fieldName];
    },
    
    /**
     * adds a new filter row
     */
    addFilter: function(filter) {
        if (! filter || arguments[1]) {
            filter = Ext.create(this.modelClass, {
                field: this.defaultFilter
            });
        }
        this.filterStore.add(filter);

        var el = this.body.query('tr[class=fw-ftb-frow]:last-child'),
            fRow = this.templates.filterrow.insertAfter(el.length ? el[0] : el , {
                        id: this.frowIdPrefix + filter.id
            });
        
        this.renderFilterRow(filter);
        
        this.onFilterRowsChange();
        
        /*
        if (!this.supressEvents) {
            this.onFiltertrigger();
        }
        */
        return filter;
    },
    
    /**
     * resets a filter
     * @param {Ext.Record} filter to reset
     */
    resetFilter: function(filter) {
        
    },
    
    /**
     * deletes a filter
     * @param {Ext.Record} filter to delete
     */
    deleteFilter: function(filter) {
        var fRow = this.body ? this.body.getById( this.frowIdPrefix + filter.id ) : null;
        //var isLast = this.filterStore.getAt(this.filterStore.getCount()-1).id == filter.id;
        var isLast = this.filterStore.getCount() == 1,
            filterModel = this.getFilterModel(filter);

        this.filterStore.removeAt( this.filterStore.indexOf(filter) );

        filter.formFields.field.destroy();
        filter.formFields.operator.destroy();
        filter.formFields.value.destroy();
        
        if (filterModel && Ext.isFunction(filterModel.onDestroy)) {
            filterModel.onDestroy(filter);
        }
        
        if (isLast) {
            // add a new first row
            var firstFilter = this.addFilter();
            
            // save buttons somewhere
            for (var action in this.actions) {
                this.actions[action].hide();
                this.body.insertFirst(action == 'startSearch' ? this.searchButtonWrap : this.actions[action].getEl());
            }
        }
        
        if (fRow) {
            fRow.remove();
        }
        
        var savedSupressEvents = this.supressEvents;
        if(typeof this.dontRefreshOnDeleteFilter != "undefined")
        {
            this.supressEvents = this.dontRefreshOnDeleteFilter;
        }
        
        if (!this.supressEvents) {
            this.onFiltertrigger();
        }
        this.supressEvents = savedSupressEvents;
        this.onFilterRowsChange();
    },
    
    /**
     * deletes all filters
     */
    deleteAllFilters: function() {
        this.supressEvents = true;
        
        this.filterStore.each(function(filter) {
            this.deleteFilter(filter);
        },this);
        
        this.supressEvents = false;
        if(typeof this.dontRefreshOnDeleteFilter != "undefined")
        {
            this.supressEvents = this.dontRefreshOnDeleteFilter;
        }
        
        this.onFiltertrigger();
        this.supressEvents = false;
        this.onFilterRowsChange();
    },
    
    getValue: function() {
        var filters = [];
        
        this.filterStore.each(function(filter) {
            var filterModel = this.getFilterModel(filter),
                line = Ext.isFunction(filterModel.getFilterData) ? filterModel.getFilterData(filter) : this.getFilterData(filter);
            
            if (line.field && Ext.isString(line.field) &&  line.field.match(/:/)) {
                var parts = line.field.split(':');
                
                // customfield handling
                if (parts[0] == 'customfield') {
                    filters.push({field: 'customfield', operator: line.operator, value: {cfId: parts[1], value: line.value}});
                }
                
                else if (filterModel && filterModel.superFilter) {
                    // if we are a childfilter of a recordclass of the subfilter, just place the subfilter
                    if (this.parentSheet && this.parentSheet.recordClass == filterModel.superFilter.foreignRecordClass) {
                        filters.push(line);
                        return;
                    }
                    
                    // check if filter of type superfilter is present
                    if (this.filterStore.find('field', filterModel.superFilter.field) < 0) {
                        
                        // create one
                        // @TODO HIDE? -> see ForeignRecordFilter line ~300
                        var superFilter = this.addFilter( Ext.create(this.modelClass, {field: filterModel.superFilter.field, operator: 'definedBy'}));
                        line = this.getFilterData(superFilter);
                        filters.push(line);
                    }
                }
            } else {
                filters.push(line);
            }
        }, this);
        
        return filters;
    },
    
    /**
     * @static
     * @param {filterRecord} filter
     */
    getFilterData: function(filter) {
        var line = {};
                
        for (var formfield in filter.formFields) {
            line[formfield] = filter.formFields[formfield].getValue();
        }
        
        // fill data with filter record data in case form field not exist (not rendered)
        Ext.each(filter.fields, function(field)  {
            var name = field.name;
            if (! line.hasOwnProperty(name)) {
                line[name] = filter.get(name);
            }
        }, this);
        
        // append id
        line.id = filter.id;

        return line;
    },
    
    /**
     * set filterData in a filter
     * 
     * @static
     * @param {filterRecord} filter
     * @param {Object} filterData
     * @return {filterRecord}
     */
    setFilterData: function(filter, filterData) {
        if (filter.formFields) {
            filter.beginEdit();
            Ext.each(['field', 'operator', 'value'], function(t) {
                filter.set(t, filterData[t]);
                if (Ext.isFunction(filter.formFields[t].setValue)) {
                    filter.formFields[t].setValue(filterData[t]);
                }
            }, this);
            filter.endEdit();
        }

        return filter;
    },
    
    setValue: function(filters) {
        
        if (! filters) {
            return;
        }
        
        this.supressEvents = true;
        
        var oldFilters = [];
        this.filterStore.each(function(filterRecord) {
            oldFilters.push(filterRecord);
        }, this);
        
        var filterModel, filterData, filterRecord;
        
        // custom fields handling
        for (var i=0; i<filters.length; i++) {
            filterData = filters[i];
            if (filterData.value && filterData.value.cfId) {
                filters[i].field = filterData.field + ':' + filterData.value.cfId;
                filters[i].value = filterData.value.value;
            }
        }

        for (var i=0; i<filters.length; i++) {
            filterRecord = null;
            filterData = filters[i];
            filterModel = filterData.condition ? this.ownRecordFilterModel : this.filterModelMap[filterData.field];
            
            if (filterModel) {
                if (filterData.id) {
                    filterRecord = this.filterStore.getById(filterData.id);
                }
                
                // refresh existing filters
                if (filterRecord) {
                    Ext.isFunction(filterModel.setFilterData) ? filterModel.setFilterData(filterRecord, filterData) : this.setFilterData(filterRecord, filterData);
                    Ext.Array.remove(oldFilters, filterRecord);
                } 
                
                // add non existing filters only if they where not created implicitly by server
                else if (! filterData.implicit) {
                    // NOTE: don't use filterData.id here, it's a ext-comp-* which comes from a different session
                    // and might be a totally different element yet.
                    filterRecord = Ext.create(this.modelClass, filterData);
                    this.addFilter(filterRecord);
                }
            }
            
        }
        
        // remove unused filters
        Ext.each(oldFilters, function(filterRecord) {
            this.deleteFilter(filterRecord);
        }, this);
        
        this.supressEvents = false;
        this.onFilterRowsChange();
    },
    
    /**
     * gets filter data of all filter plugins
     * 
     * NOTE: As we can't find all filter plugins directly we need a litte hack 
     *       to get their data
     *       
     *       We register ourselve as latest beforeload.
     *       In the options.filter we have the filters then.
     */
    getAllFilterData: function() {
        this.store.on('beforeload', this.storeOnBeforeload, this);
        this.store.load();
        this.store.un('beforeload', this.storeOnBeforeload, this);
        
        return this.allFilterData;
    },
    
    storeOnBeforeload: function(store, options) {
        this.allFilterData = options.params.filter;
        this.store.fireEvent('exception');

        return false;
    },
    
    onDestroy: function() {
        if (this.parentSheet) {
            this.parentSheet.removeFilterSheet(this);
        }
    },
    
    /***** sheets functions *****/
    addFilterSheet: function(ftb) {
        ftb.ownerCt = this.ownerCt;
        ftb.parentSheet = this;
        this.childSheets[ftb.id] = ftb;
        
        ftb.onFilterChange = this.onFilterChange.bind(this);
    },
    
    removeFilterSheet: function(ftb) {
        if (! this.childSheets[ftb.id].destroying) {
            this.childSheets[ftb.id].destroy();
        }
        delete this.childSheets[ftb.id];
        
        if (ftb == this.activeSheet) {
            this.setActiveSheet.defer(100, this, [this]);
        }
    },
    
    setActiveSheet: function(sheet) {
        var ftb = Ext.isString(sheet) ? (sheet = this.id ? this : this.childSheets[sheet]) : sheet,
            rootSheet = this.getRootSheet(),
            parentSheets = sheet.getParentSheets();
        
        if (! ftb.rendered) {
            ftb.render(this.el);
        }
        
        this.body[ftb == this ? 'show' : 'hide']();
        
        for( var ftbId in this.childSheets) {
            if (this.childSheets.hasOwnProperty(ftbId)) {
                if (ftb == this.childSheets[ftbId]) {
                    this.childSheets[ftbId].show();
                    this.childSheets[ftbId].setActiveSheet(sheet);
                } else {
                    this.childSheets[ftbId].hide();
                }
            }
        }
        
        // show toolbar on demand
        if (ftb != rootSheet) {
            rootSheet.tbar.removeAll();
            Ext.each(parentSheets, function(sheet) {
                sheet.breadCrumb.enable();
                rootSheet.tbar.add(sheet.breadCrumb);
            }, this);
            ftb.breadCrumb.disable();
            rootSheet.tbar.add(ftb.breadCrumb, '->', ftb.action_loadFilter);
            rootSheet.tbar.show();
            rootSheet.tbar.doLayout();
        } else {
            rootSheet.tbar.hide();
        }
        
        this.activeSheet = ftb;
        this.onFilterRowsChange();
    },
    
    getParentSheets: function(parents) {
        parents = parents || [];
        
        if (this.parentSheet) {
            parents.unshift(this.parentSheet);
            return this.parentSheet.getParentSheets(parents);
        }
        
        return parents;
    },
    
    getRootSheet: function() {
        return this.parentSheet ? this.parentSheet.getRootSheet() : this;
    }

});
