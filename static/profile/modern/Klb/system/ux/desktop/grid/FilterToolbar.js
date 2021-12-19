Ext.ns('Klb.system.ux.desktop');
Klb.system.ux.desktop.PercentRenderer = function(percent) {
    if (! Klb.system.ux.desktop.PercentRenderer.template) {
        Klb.system.ux.desktop.PercentRenderer.template = new Ext.XTemplate(
            '<div class="x-progress-wrap PercentRenderer">',
            '<div class="x-progress-inner PercentRenderer">',
                '<div class="x-progress-bar PercentRenderer" style="width:{percent}%">',
                    '<div class="PercentRendererText PercentRenderer">',
                        '<div>{percent}%</div>',
                    '</div>',
                '</div>',
                '<div class="x-progress-text x-progress-text-back PercentRenderer">',
                    '<div>&#160;</div>',
                '</div>',
            '</div>',
        '</div>'
        ).compile();
    }
    
    return Klb.system.ux.desktop.PercentRenderer.template.apply({percent: percent});
};

Ext.ns('Klb.system.ux.desktop.grid');

/**
 * @namespace   Klb.system.ux.desktop.widgets.grid
 * @class       Klb.system.ux.desktop.grid.grid.FilterToolbar
 * @extends     Ext.Panel
 * 
 * <br>Usage:<br>
     <pre><code>
     tb = new Klb.system.ux.desktop.grid.FilterToolbar({
         filterModels: [
            {label: 'Full Name', field: 'n_fn', defaultOperator: 'contains'},
            {label: 'Container', field: 'container_id', operatorRenderer: function() {...}, valueRenderer: function() {...}},
            {label: 'Contact', field: 'quicksearch'}
         ],
         defaultFilter: 'quicksearch',
         filters: [
            {field: 'n_fn', operator: 'contains', value: 'Smith'},
            {field: 'container_id', operator: 'equals', value: 4}
        ]
     });
    </code></pre>
 * @constructor
 * @param {Object} config
 */
 
Klb.system.ux.desktop.grid.FilterPlugin = function(config) {
    config = config || {};
    Ext.apply(this, config);

    if ( ExtJsVersion ==  '4.2.1')
    this.addEvents(
        /**
         * @event change
         * Fired when the filter changed.
         * @param {KlbDesktop.Widgets.grid.FilterPlugin} this
         */
        'change'
    );
    
    Klb.system.ux.desktop.grid.FilterPlugin.superclass.constructor.call(this);
};

Ext.extend(Klb.system.ux.desktop.grid.FilterPlugin, Ext.util.Observable, {
    /**
     * @property {Ext.grid.GridPanel} grid
     */
    grid: null,
    
    /**
     * @property {Ext.data.Store} store
     */
    store: null,
    
    /**
     * @property {String} xtype
     */
    xtype: 'filterplugin',
    
    /**
     * main method which must return the filter object of this filter
     * 
     * @return {Object}
     */
    getValue: Ext.emptyFn,
    
    /**
     * returns gird panel this filterplugin is bound to/for
     * 
     * @return {Ext.Panel}
     */
    getGridPanel: function() {
        return this.grid;
    },
    
    /**
     * main method which must set the filter from given data
     * 
     * @param {Array} all filters
     */
    setValue: Ext.emptyFn,
    
    /**
     * plugin method of Ext.grid.GridPanel
     * 
     * @param {Ext.grid.GridPanel} grid
     */
    init: function(grid) {
        this.grid = grid;
        this.store = grid.store;
        this.doBind();
    },
    
    /**
     * binds this plugin to the grid store
     */
    doBind: function() {
        this.store.on('beforeload', this.onBeforeLoad, this);
        this.store.on('load', this.onLoad, this);
    },
    
    /**
     * fires our change event
     */
    onFilterChange: function() {
        
        if (this.getGridPanel() && typeof this.getGridPanel().getView === 'function') {
            this.getGridPanel().getView().isPagingRefresh = true;
        }
        
        if (this.store) {
            this.store.load({});
        }
        
        this.fireEvent('change', this);
    },
    
    /**
     * called before store loads
     */
    onBeforeLoad: function(store, options) {
        options = options || {};
        options.params = options.params || {};
        options.params.filter = options.params.filter ? options.params.filter : [];
        
        var value = this.getValue();
        if (value && Ext.isArray(options.params.filter)) {
            value = Ext.isArray(value) ? value : [value];
            for (var i=0; i<value.length; i++) {
                options.params.filter.push(value[i]);
            }
        }
    },
    
    /**
     * called after store data loaded
     */
    onLoad: function(store, options) {
        if (Ext.isArray(store.proxy.jsonReader.jsonData.filter)) {
            
            // filter plugin has to 'pick' its records
            this.setValue(store.proxy.jsonReader.jsonData.filter);
        }
    }
});

Klb.system.ux.desktop.grid.FilterModel = function(config) {
    Ext.apply(this, config);
    Klb.system.ux.desktop.grid.FilterModel.superclass.constructor.call(this);

    this.addEvents(
      /**
       * @event filtertrigger
       * is fired when user request to update list by filter
       * @param {KlbDesktop.Widgets.grid.FilterToolbar}
       */
      'filtertrigger'
    );
    
    this.initComponent();
};

Ext.extend(Klb.system.ux.desktop.grid.FilterModel, Ext.util.Observable, {
    /**
     * @cfg {String} label 
     * label for the filter
     */
    label: '',
    
    /**
     * @cfg {String} field
     * name of th field to filter
     */
    field: '',
    
    /**
     * @cfg {String} valueType
     * type of value
     */
    valueType: 'string',
    
    /**
     * @cfg {String} defaultValue
     * default value
     */
    defaultValue: null,
    
    /**
     * @cfg {Array} operators
     * valid operators
     */
    operators: null,
    
    /**
     * @cfg {String} defaultOperator
     * name of the default operator
     */
    defaultOperator: null,
    
    /**
     * @cfg {Array} customOperators
     * define custom operators
     */
    customOperators: null,
    
    /**
     * @cfg {Ext.data.Store|Array} 
     * used by combo valueType
     */
    store: null,
    
    /**
     * @cfg {String} displayField
     * used by combo valueType
     */
    displayField: null,
    
    /**
     * @cfg {String} valueField
     * used by combo valueType
     */
    valueField: null,
    filterValueWidth: 200,
    
    /**
     * @private
     */
    initComponent: function() {
        this.isFilterModel = true;
        
        if (! this.operators) {
            this.operators = [];
        }
        
        
        if (this.defaultOperator === null) {
            switch (this.valueType) {
                
                case 'date':
                    this.defaultOperator = 'within';
                    break;
                case 'account':
                case 'group':
                case 'user':
                case 'bool':
                case 'number':
                case 'percentage':
                case 'combo':
                case 'country':
                    this.defaultOperator = 'equals';
                    break;
                case 'string':
                default:
                    this.defaultOperator = 'contains';
                    break;
            }
        }
        
        if (this.defaultValue === null) {
            switch (this.valueType) {
                case 'customfield':
                case 'string':
                    this.defaultValue = '';
                    break;
                case 'bool':
                    this.defaultValue = '1';
                    break;
                case 'percentage':
                    this.defaultValue = '0';
                    break;
                case 'date':
                case 'account':
                case 'group':
                case 'user':
                case 'number':
                case 'country':
                default:
                    break;
            }
        }
    },
    
    onDestroy: Ext.emptyFn,
    
    /**
     * operator renderer
     * 
     * @param {Ext.data.Record} filter line
     * @param {Ext.Element} element to render to 
     */
    operatorRenderer: function (filter, el) {
        var operatorStore = new Ext.data.JsonStore({
            fields: ['operator', 'label'],
            data: [
                {operator: 'contains',   label: i18n('contains')},
                {operator: 'regex',      label: i18n('reg. exp.')},
                {operator: 'equals',     label: i18n('is equal to')},
                {operator: 'greater',    label: i18n('is greater than')},
                {operator: 'less',       label: i18n('is less than')},
                {operator: 'not',        label: i18n('is not')},
                {operator: 'in',         label: i18n('one of')},
                {operator: 'notin',      label: i18n('none of')},
                {operator: 'before',     label: i18n('is before')},
                {operator: 'after',      label: i18n('is after')},
                {operator: 'within',     label: i18n('is within')},
                {operator: 'inweek',     label: i18n('is in week no.')},
                {operator: 'startswith', label: i18n('starts with')},
                {operator: 'endswith',   label: i18n('ends with')},
                {operator: 'definedBy',  label: i18n('defined by')}
            ].concat(this.getCustomOperators() || []),
            remoteSort: false,
            sortInfo: {
                field: 'label',
                direction: 'ASC'
            }
        });

        // filter operators
        if (this.operators.length == 0) {
            switch (this.valueType) {
                case 'string':
                    this.operators.push('contains', 'equals', 'startswith', 'endswith', 'not', 'in');
                    break;
                case 'customfield':
                    this.operators.push('contains', 'equals', 'startswith', 'endswith', 'not');
                    break;
                case 'date':
                    this.operators.push('equals', 'before', 'after', 'within', 'inweek');
                    break;
                case 'number':
                case 'percentage':
                    this.operators.push('equals', 'greater', 'less');
                    break;
                default:
                    this.operators.push(this.defaultOperator);
                    break;
            }
        }
        
        if (this.operators.length > 0) {
            operatorStore.each(function(operator) {
                if (this.operators.indexOf(operator.get('operator')) < 0 ) {
                    operatorStore.remove(operator);
                }
            }, this);
        }
        
        if (operatorStore.getCount() > 1) {
            var operator = new Ext.form.field.ComboBox({
                filter: filter,
                width: 80,
                id: 'tw-ftb-frow-operatorcombo-' + filter.id,
                mode: 'local',
                lazyInit: false,
                emptyText: i18n('select a operator'),
                forceSelection: true,
                typeAhead: true,
                triggerAction: 'all',
                store: operatorStore,
                displayField: 'label',
                valueField: 'operator',
                value: filter.get('operator') ? filter.get('operator') : this.defaultOperator,
                tpl: '<tpl for="."><div class="x-combo-list-item tw-ftb-operator-{operator}">{label}</div></tpl>',
                renderTo: el
            });
            operator.on('select', function(combo, newRecord, newKey) {
                if (combo.value != combo.filter.get('operator')) {
                    this.onOperatorChange(combo.filter, combo.value);
                }
            }, this);
            
            operator.on('blur', function(combo) {
                if (combo.value != combo.filter.get('operator')) {
                    this.onOperatorChange(combo.filter, combo.value);
                }
            }, this);
            
        } else if (this.operators[0] == 'freeform') {
            var operator = new Ext.form.field.Text({
                filter: filter,
                width: 100,
                emptyText: this.emptyTextOperator || '',
                value: filter.get('operator') ? filter.get('operator') : '',
                renderTo: el
            });
        } else {
            var operator = new Ext.form.Label({
                filter: filter,
                width: 100,
                style: {margin: '0px 10px'},
                getValue: function() { return operatorStore.getAt(0).get('operator'); },
                text : operatorStore.getAt(0).get('label'),
                renderTo: el,
                setValue: Ext.emptyFn
            });
        }
        
        return operator;
    },
    
    /**
     * get custom operators
     * 
     * @return {Array}
     */
    getCustomOperators: function() {
        return this.customOperators || [];
    },
    
    /**
     * called on operator change of a filter row
     * @private
     */
    onOperatorChange: function(filter, newOperator) {
        filter.set('operator', newOperator);
        filter.set('value', '');
        
        // for date filters we need to rerender the value section
        if (this.valueType == 'date') {
            switch (newOperator) {
                case 'within':
                    filter.numberfield.hide();
                    filter.datePicker.hide();
                    filter.withinCombo.show();
                    filter.formFields.value = filter.withinCombo;
                    break;
                case 'inweek':
                    filter.withinCombo.hide();
                    filter.datePicker.hide();
                    filter.numberfield.show();
                    filter.formFields.value = filter.numberfield;
                    break;
                default:
                    filter.withinCombo.hide();
                    filter.numberfield.hide();
                    filter.datePicker.show();
                    filter.formFields.value = filter.datePicker;
            }
        }
    },
    
    /**
     * value renderer
     * 
     * @param {Ext.data.Record} filter line
     * @param {Ext.Element} element to render to 
     */
    valueRenderer: function(filter, el) {
        var value,
            fieldWidth = this.filterValueWidth,
            commonOptions = {
                filter: filter,
                width: fieldWidth,
                id: 'tw-ftb-frow-valuefield-' + filter.id,
                renderTo: el,
                value: filter.data.value ? filter.data.value : this.defaultValue
            };
        
        switch (this.valueType) {
            case 'date':
                value = this.dateValueRenderer(filter, el);
                break;
            case 'percentage':
                value = new Ext.ux.PercentCombo(Ext.apply(commonOptions, {
                    listeners: {
                        'specialkey': function(field, e) {
                             if(e.getKey() == e.ENTER){
                                 this.onFiltertrigger();
                             }
                        },
                        'select': this.onFiltertrigger,
                        scope: this
                    }
                }));
                break;
            case 'user':
                value = new Tine.Addressbook.SearchCombo(Ext.apply(commonOptions, {
                    listWidth: 350,
                    emptyText: i18n('Search Account ...'),
                    userOnly: true,
                    name: 'organizer',
                    nameField: 'n_fileas',
                    useAccountRecord: true,
                    listeners: {
                        'specialkey': function(field, e) {
                             if(e.getKey() == e.ENTER){
                                 this.onFiltertrigger();
                             }
                        },
                        'select': this.onFiltertrigger,
                        scope: this
                    }
                }));
                break;
            case 'bool':
                value = new Ext.form.field.ComboBox(Ext.apply(commonOptions, {
                    mode: 'local',
                    forceSelection: true,
                    triggerAction: 'all',
                    store: [
                        [0, Locale.getTranslationData('Question', 'no').replace(/:.*/, '')], 
                        [1, Locale.getTranslationData('Question', 'yes').replace(/:.*/, '')]
                    ],
                    listeners: {
                        'specialkey': function(field, e) {
                             if(e.getKey() == e.ENTER){
                                 this.onFiltertrigger();
                             }
                        },
                        'select': this.onFiltertrigger,
                        scope: this
                    }
                }));
                break;
            case 'combo':
                var comboConfig = Ext.apply(commonOptions, {
                    mode: 'local',
                    forceSelection: true,
                    triggerAction: 'all',
                    store: this.store,
                    listeners: {
                        'specialkey': function(field, e) {
                             if(e.getKey() == e.ENTER){
                                 this.onFiltertrigger();
                             }
                        },
                        'select': this.onFiltertrigger,
                        scope: this
                    }
                });
                if (this.displayField !== null && this.valueField !== null) {
                    comboConfig.displayField = this.displayField;
                    comboConfig.valueField = this.valueField;
                }
                value = new Ext.form.field.ComboBox(comboConfig);
                break;
            case 'country':
                value = new KlbDesktop.Widgets.CountryCombo(Ext.apply(commonOptions, {
                }));
                break;
            case 'customfield':
            case 'string':
            case 'number':
            default:
                value = new Ext.ux.form.ClearableTextField(Ext.apply(commonOptions, {
                    emptyText: this.emptyText,
                    listeners: {
                        scope: this,
                        specialkey: function(field, e){
                            if(e.getKey() == e.ENTER){
                                this.onFiltertrigger();
                            }
                        }
                    }
                }));
                break;
        }
        
        return value;
    },
    
    /**
     * called on value change of a filter row
     * @private
     */
    onValueChange: function(filter, newValue) {
        filter.set('value', newValue);
    },
    
    /**
     * render a date value
     * 
     * we place a picker and a combo in the dom element and hide the one we don't need yet
     */
    dateValueRenderer: function(filter, el) {
        var operator = filter.get('operator') ? filter.get('operator') : this.defaultOperator;
        
        var valueType = 'datePicker';
        switch (operator) {
            case 'within':
                valueType = 'withinCombo';
                break;
            case 'inweek':
                valueType = 'numberfield';
                break;
        }
        
        var pastOps = [
            ['dayThis',         i18n('today')], 
            ['dayLast',         i18n('yesterday')], 
            ['weekThis',        i18n('this week')], 
            ['weekLast',        i18n('last week')],
            ['weekBeforeLast',  i18n('the week before last')],
            ['monthThis',       i18n('this month')],
            ['monthLast',       i18n('last month')],
            ['quarterThis',     i18n('this quarter')],
            ['quarterLast',     i18n('last quarter')],
            ['yearThis',        i18n('this year')],
            ['yearLast',        i18n('last year')]
        ];
        
        var futureOps = [
            ['dayNext',         i18n('tomorrow')], 
            ['weekNext',        i18n('next week')], 
            ['monthNext',       i18n('next month')],
            ['quarterNext',     i18n('next quarter')],
            ['yearNext',        i18n('next year')]
        ];
        
        var comboOps = this.pastOnly ? pastOps : futureOps.concat(pastOps);
        var comboValue = 'weekThis';
        if (filter.data.value && filter.data.value.toString().match(/^[a-zA-Z]+$/)) {
            comboValue = filter.data.value.toString();
        } else if (this.defaultValue && this.defaultValue.toString().match(/^[a-zA-Z]+$/)) {
            comboValue = this.defaultValue.toString();
        }
        
        filter.withinCombo = new Ext.form.field.ComboBox({
            hidden: valueType != 'withinCombo',
            filter: filter,
            width: this.filterValueWidth,
            value: comboValue,
            renderTo: el,
            mode: 'local',
            lazyInit: false,
            forceSelection: true,
            typeAhead: true,
            triggerAction: 'all',
            store: comboOps,
            editable: false,
            listeners: {
                'specialkey': function(field, e) {
                     if(e.getKey() == e.ENTER){
                         this.onFiltertrigger();
                     }
                },
                'select': this.onFiltertrigger,
                scope: this
            }
        });

        var pickerValue = '';
        if (Ext.isDate(filter.data.value)) {
            pickerValue = filter.data.value;
        } else if (Ext.isDate(Ext.Date.parse(filter.data.value, Date.patterns.ISO8601Long))) {
            pickerValue = Ext.Date.parse(filter.data.value, Date.patterns.ISO8601Long);
        } else if (Ext.isDate(this.defaultValue)) {
            pickerValue = this.defaultValue;
        }
        
        filter.datePicker = new Ext.form.DateField({
            hidden: valueType != 'datePicker',
            filter: filter,
            width: this.filterValueWidth,
            value: pickerValue,
            renderTo: el,
            listeners: {
                'specialkey': function(field, e) {
                     if(e.getKey() == e.ENTER){
                         this.onFiltertrigger();
                     }
                },
                'select': this.onFiltertrigger,
                scope: this
            }
        });
        
        filter.numberfield = new Ext.form.NumberField({
            hidden: valueType != 'numberfield',
            filter: filter,
            width: this.filterValueWidth,
            value: pickerValue,
            renderTo: el,
            minValue: 1,
            maxValue: 52,
            maxLength: 2,   
            allowDecimals: false,
            allowNegative: false,
            listeners: {
                scope: this,
                specialkey: function(field, e){
                    if(e.getKey() == e.ENTER){
                        this.onFiltertrigger();
                    }
                }
            }
        });
        
        // upps, how to get a var i only know the name of???
        return filter[valueType];
    },
    
    /**
     * @private
     */
    onFiltertrigger: function() {
        this.fireEvent('filtertrigger', this);
    }
});
/**************************************************/
Klb.system.ux.desktop.grid.FilterToolbar.FILTERS = {};

Klb.system.ux.desktop.grid.FilterToolbar = function(config) {
    Ext.apply(this, config);
    Klb.system.ux.desktop.grid.FilterToolbar.superclass.constructor.call(this);

    // become filterPlugin
    Ext.applyIf(this, new Klb.system.ux.desktop.grid.FilterPlugin());

    this.childSheets = {};
};

Ext.extend(Klb.system.ux.desktop.grid.FilterToolbar, Ext.Panel, {
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
     * @cfg {String} row prefix (defaults to i18n('Show'))
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
    region: 'north',
    layout: 'fit',
    //split: true,

    record: Ext.data.Record.create([
        {name: 'field'},
        {name: 'operator'},
        {name: 'value'}
    ]),

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
            addFilterRow: new Ext.Button({
                //disabled: true,
                tooltip: i18n('add new filter'),
                iconCls: 'action_addFilter',
                scope: this,
                handler: this.addFilter
            }),
            removeAllFilters: new Ext.Button({
                tooltip: i18n('reset all filters'),
                iconCls: 'action_delAllFilter',
                scope: this,
                handler: this.deleteAllFilters
            }),
            startSearch: new Ext.Button({
                text: i18n('start search'),
                iconCls: 'action_startFilter',
                scope: this,
                handler: function() {
                    this.onFiltertrigger();
                }
            }),
            saveFilter: new Ext.Button({
                tooltip: i18n('save as favorite'),
                iconCls: 'action_saveFilter',
                handler: this.onSaveFilter.createDelegate(this)
            })
        };

        this.action_loadFilter = new Ext.Action({
            text: i18n('Load a favorite'),
            hidden: true,
            iconCls: 'action-apibase-favorite',
            scope: this,
            handler: this.onLoadFilter
        });
    },
    
    /**
     * @private
     */
    onRender: function(ct, position) {
        Klb.system.ux.desktop.grid.FilterToolbar.superclass.onRender.call(this, ct, position);
 
        // only get app and enable saving if this.store is available (that is not the case in the activities panel)
        // at this point the plugins are initialised
        if (! this.app && this.store) {
            this.app = Klb.Base.appMgr.get(this.store.proxy.recordClass.getMeta('appName'));
        }
        // automatically enable saving
        if (! this.neverAllowSaving && this.app && this.app.getMainScreen() && typeof this.app.getMainScreen().getWestPanel == 'function' && this.app.getMainScreen().getWestPanel().hasFavoritesPanel) {
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
            this.actions[action].render(this.bwrap);
        }
        
        // wrap search button an set it always mouse-overed
        this.searchButtonWrap = this.actions.startSearch.getEl().wrap();
        this.searchButtonWrap.addClass('x-btn-over');
        
        // arrange static action buttons
        this.onFilterRowsChange();
        
        if (! this.parentSheet) {
            this.tbar = new Ext.Toolbar({
                items: [],
                hidden: true
            });
            this.tbar.render(this.el, 0);
            
//            // tab bar to start or filters
//            this.tabBar = new Ext.Panel({
//                cls: 'tw-ftb-criteria-tabs',
//                border: false,
//                height: Ext.isGecko ? 22 : 20,
//                items: new Ext.tab.Panel({
//                    border: false,
//                    plain: true,
//                    activeItem: 1,
//                    items: [{title: 'combination', html:''}, {title: 'criteria 1', html:''}, {title: 'criteria 2', html: ''}, {iconCls: 'action_add', title: '&nbsp;', html: ''}]
//                })
//            });
//            this.tabBar.render(this.el, 0);
        }
        
        this.breadCrumb = new Ext.Action({
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
            var app = Klb.Base.appMgr.get( this.recordClass.getMeta('appName') ),
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
     * @param {Ext.Panel} panel
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

        this.tableEl = ts.master.overwrite(this.bwrap, {tbody: tbody}, true);
    },
    
    /**
     * renders the filter specific stuff of a single filter row
     * 
     * @param {Ext.data.Record} el representing a filter tr tag
     * @private
     */
    renderFilterRow: function(filter) {
        filter.formFields = {};
        var filterModel = this.getFilterModel(filter);
        
        if (! filterModel) {
            Tine.log.warn('Klb.system.ux.desktop.grid.FilterToolbar::renderFilterRow no filterModel found');
            Tine.log.warn(filter);
            this.filterStore.remove(filter);
            return;
        }
        var fRow = this.bwrap.child('tr[id='+ this.frowIdPrefix + filter.id + ']');
        
        // field
        filter.formFields.field = new Ext.form.field.ComboBox({
            filter: filter,
            width: this.filterFieldWidth,
            minListWidth: 240, // will be ignored if width is heigher
            resizable: true,
            id: 'tw-ftb-frow-fieldcombo-' + filter.id,
            mode: 'local',
            lazyInit: false,
            emptyText: i18n('select a field'),
            forceSelection: true,
            typeAhead: true,
            triggerAction: 'all',
            store: this.fieldStore,
            displayField: 'label',
            valueField: 'field',
            value: filterModel.field,
            renderTo: fRow.child('td[class=tw-ftb-frow-field]'),
            validator: this.validateFilter.createDelegate(this),
            tpl: '<tpl for="."><div class="x-combo-list-item tw-ftb-field-{field}">{label}</div></tpl>'
        });
        filter.formFields.field.setValue = filter.formFields.field.setValue.createInterceptor(function() {
            // NOTE: as this.fieldStore is a shared store we need to clear the filter before we use it,
            //       otherwise the record (e.g. query) might not be in the store
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
        filter.formFields.operator = filterModel.operatorRenderer(filter, fRow.child('td[class^=tw-ftb-frow-operator]'));
        
        // value
        filter.formFields.value = filterModel.valueRenderer(filter, fRow.child('td[class^=tw-ftb-frow-value]'));
        
        filter.deleteRowButton = new Ext.Button({
            id: 'tw-ftb-frow-deletebutton-' + filter.id,
            tooltip: i18n('Delete this filter'),
            filter: filter,
            iconCls: 'action_delThisFilter',
            renderTo: fRow.child('td[class=tw-ftb-frow-mbutton]'),
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
        var firstId = this.filterStore.getAt(0).id;
        var lastId = this.filterStore.getAt(numFilters-1).id;
        
        this.filterStore.each(function(filter){
            var tr = this.bwrap.child('tr[id='+ this.frowIdPrefix + filter.id + ']');
            
            // prefix
            tr.child('td[class=tw-ftb-frow-prefix]').dom.innerHTML = i18n('and');
            //filter.deleteRowButton.setVisible(filter.id != lastId);
                
            if (filter.id == lastId) {
                // move add filter button
                tr.child('td[class=tw-ftb-frow-pbutton]').insertFirst(this.actions.addFilterRow.getEl());
                this.actions.addFilterRow.show();
                // move start search button
                tr.child('td[class=tw-ftb-frow-searchbutton]').insertFirst(this.searchButtonWrap);
                if (this.showSearchButton) {
                    this.actions.startSearch.show();
                }
                // move delete all filters
                // tr.child('td[class=tw-ftb-frow-deleteallfilters]').insertFirst(this.actions.removeAllFilters.getEl());
                this.actions.removeAllFilters.setVisible(numFilters > 1);
                // move save filter button
                // tr.child('td[class=tw-ftb-frow-savefilterbutton]').insertFirst(this.actions.saveFilter.getEl());
                this.actions.saveFilter.setVisible(this.allowSaving && numFilters > 1);
            }
            
            if (filter.id == firstId) {
                tr.child('td[class=tw-ftb-frow-prefix]').dom.innerHTML = this.rowPrefix;
                
                // hack for the save/delete all btns which are now in the first row
                //if (Ext.isSafari) {
                    this.actions.removeAllFilters.getEl().applyStyles('float: left');
                //} else {
                //    this.actions.saveFilter.getEl().applyStyles('display: inline');
                //    this.actions.removeAllFilters.getEl().applyStyles('display: inline');
                //}
                
                tr.child('td[class=tw-ftb-frow-searchbutton]').insertFirst(this.actions.saveFilter.getEl());
                tr.child('td[class=tw-ftb-frow-searchbutton]').insertFirst(this.actions.removeAllFilters.getEl());
                
                //tr.child('td[class=tw-ftb-frow-pmbutton]').insertFirst(this.actions.removeAllFilters.getEl());
                //this.actions.removeAllFilters.setVisible(numFilters > 1);
            }
        }, this);
    },

    doLayout: function() {
        if (typeof this.layout.layout == 'function') {
            Klb.system.ux.desktop.grid.FilterToolbar.superclass.doLayout.apply(this, arguments);
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
        var fRow = this.bwrap.child('tr[id='+ this.frowIdPrefix + filter.id + ']');

        var opEl = fRow.child('td[class^=tw-ftb-frow-operator]');
        var valEl = fRow.child('td[class^=tw-ftb-frow-value]');

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
                filter.formFields.value.selectText.defer(50, filter.formFields.value);
            }
        }
    },

    /**
     * @private
     */
    initComponent: function() {
        this.title = this.generateTitle();
        this.on('titlechange', this.onTitleChange, this);
        
        Klb.system.ux.desktop.grid.FilterToolbar.superclass.initComponent.call(this);
        
        this.on('show', function() {
            this.doLayout();
        }, this);

        if (this.rowPrefix === null) {
            this.rowPrefix = i18n('Show');
        }

        this.initTemplates();
        this.initActions();
        
        // init filters
        this.filters = Ext.isArray(this.filters) ? this.filters : [];
        if (this.filters.length < 1) {
            this.filters = [{field: this.defaultFilter}];
        }
        this.filterStore = new Ext.data.JsonStore({
            fields: this.record,
            data: this.filters
        });

        // init filter models
        this.filterModelMap = {};
        var filtersFields = [];
        
        if (this.recordClass && !this.filterModels) {
            this.filterModels = this.recordClass.getFilterModel();
        }
        
        
        if (this.recordClass) {
            // concat registered filters
            this.filterModels = this.filterModels.concat(Klb.system.ux.desktop.grid.FilterRegistry.get(this.recordClass));
            
            // auto add foreign record filter on demand
            var foreignRecordFilter = this.createFilterModel({filtertype: 'foreignrecord', ownRecordClass: this.recordClass, isGeneric: true});
            if (foreignRecordFilter.operatorStore.getCount() > 0) {
                this.filterModels.push(foreignRecordFilter);
            }
            
            // auto add self id filter
            this.ownRecordFilterModel = this.createFilterModel({filtertype: 'ownrecord', ownRecordClass: this.recordClass});
            this.filterModels.push(this.ownRecordFilterModel);
//            filtersFields.push(this.ownRecordFilterModel);
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
        
//        // auto add self id filter
//        if (this.recordClass) {
//            this.ownRecordFilterModel = this.createFilterModel({filtertype: 'ownrecord', ownRecordClass: this.recordClass});
//            filtersFields.push(this.ownRecordFilterModel);
//        }
            
        // init filter selection
        this.fieldStore = new Ext.data.JsonStore({
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
            this.ownerCt.layout.layout();
        }
        this.doLayout();
    },
    
    createFilterModel: function(config) {
        if (config && config.isFilterModel) {
            return config;
        }
        
        // push this filtertoolbar in config
        config.ftb = this;
        
        if (config.filtertype) {
            // filter from reg
            return new Klb.system.ux.desktop.grid.FilterToolbar.FILTERS[config.filtertype](config);
        } else {
            return new Klb.system.ux.desktop.grid.FilterModel(config);
        }
    },
    
    /**
     * returns filterModel
     * 
     * @param {String} fieldName
     * @return {Klb.system.ux.desktop.grid.FilterModel}
     */
    getFilterModel: function(field) {
        var fieldName = Ext.isFunction(field.get) ? field.get('field') : field;
  
        if (! fieldName && field.data && field.data.condition) {
            return this.ownRecordFilterModel;
        }
        
        return this.filterModelMap[fieldName];
    },
    
    /**
     * adds a new filer row
     */
    addFilter: function(filter) {
        if (! filter || arguments[1]) {
            filter = new this.record({
                field: this.defaultFilter
            });
        }
        this.filterStore.add(filter);

        var fRow = this.templates.filterrow.insertAfter(this.bwrap.child('tr[class=fw-ftb-frow]:last'),{
            id: 'tw-ftb-frowid-' + filter.id
        }, true);
        
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
        var fRow = this.bwrap.child('tr[id=tw-ftb-frowid-' + filter.id + ']');
        //var isLast = this.filterStore.getAt(this.filterStore.getCount()-1).id == filter.id;
        var isLast = this.filterStore.getCount() == 1,
            filterModel = this.getFilterModel(filter);

        this.filterStore.remove(this.filterStore.getById(filter.id));
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
                this.bwrap.insertFirst(action == 'startSearch' ? this.searchButtonWrap : this.actions[action].getEl());
            }
        }
        fRow.remove();
        
        this.onFilterRowsChange();
        
        if (!this.supressEvents) {
            this.onFiltertrigger();
        }
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
        this.onFiltertrigger();
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
                        var superFilter = this.addFilter(new this.record({field: filterModel.superFilter.field, operator: 'definedBy'}));
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
        filter.fields.each(function(field)  {
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
        filter.beginEdit();
        
        Ext.each(['field', 'operator', 'value'], function(t) {
            filter.set(t, filterData[t]);
            if (Ext.isFunction(filter.formFields[t].setValue)) {
                filter.formFields[t].setValue(filterData[t]);
            }
        }, this);
        
        filter.endEdit();
        
        return filter;
    },
    
    setValue: function(filters) {
        this.supressEvents = true;
        
        var oldFilters = [];
        this.filterStore.each(function(filterRecord) {oldFilters.push(filterRecord);}, this);
        
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
                    oldFilters.remove(filterRecord);
                } 
                
                // add non existing filters only if they where not created implicitly by server
                else if (! filterData.implicit) {
                    // NOTE: don't use filterData.id here, it's a ext-comp-* which comes from a different session
                    // and might be a totally different element yet.
                    filterRecord = new this.record(filterData);
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
        this.childSheets[ftb.id] = ftb
        ftb.onFilterChange = this.onFilterChange.createDelegate(this);
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
        
        this.bwrap[ftb == this ? 'show' : 'hide']();
        
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
