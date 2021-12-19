/*
 * Modern 3.1.0
 * 
 * @license     http://www.gnu.org/licenses/agpl.html AGPL Version 3
 * @author      Cornelius Weiss <c.weiss@metaways.de>
 * @copyright   Copyright (c) 2007-2011 Metaways Infosystems GmbH (http://www.metaways.de)
 */
Ext.ns('Klb.system.widgets.grid');
// FilterPanel -> [FilterToolbar] -> FilterPlugin
Ext.define('Klb.system.widgets.grid.FilterPanel', {
    extend: 'Ext.container.Container',
    requires: [
            'Ext.ux.SearchField'
          , 'Klb.system.widgets.grid.FilterPlugin'
    ],
    mixins: {
        observable: 'Klb.system.widgets.grid.FilterPlugin'
    },
    constructor: function (config) {
        var config = config || {};
        this.filterToolbarConfig = config;

        // @TODO find quickfilter plugin an pick quickFilterField and criteriaIgnores from it
        this.criteriaIgnores = config.criteriaIgnores || [
            {field: 'container_id', operator: 'equals',    value: {path: '/'}},
            {field: 'query',        operator: 'contains',  value: ''}
        ];

        // the plugins won't work there
        delete this.filterToolbarConfig.plugins;

        // apply some filterPanel configs
        Ext.each(['onFilterChange', 'getAllFilterData'], function(p) {
            if (config.hasOwnProperty(p)) {
                this[p] = config[p];
            }
        }, this);

        // become filterPlugin
        // Ext.applyIf(this, Ext.create('Klb.system.widgets.grid.FilterPlugin', {}));
        this.mixins.observable.constructor.call(this, config);

        this.filterPanels = [];

        this.callParent([config]);
    },
    /**
     * @cfg {String} quickFilterField
     * 
     * name of quickfilter filed in filter definitions
     */
    quickFilterField: 'query',
    
    /**
     * @cfg {Array} criterias to ignore
     */
    criteriaIgnores: null,
    
    /**
     * @cfg {String} moreFiltersActiveText
     */
    moreFiltersActiveText: 'Attention: There are more filters active!', //_('Attention: There are more filters active!')
    
    /**
     * @property activeFilterPanel
     * @type Klb.system.widgets.grid.FilterToolbar
     */
    activeFilterPanel: null,
    
    /**
     * @property filterPanels map filterPanelId => filterPanel
     * @type Object
     */
    filterPanels: null,
    
    /**
     * @property criteriaCount
     * @type Number
     */
    criteriaCount: 0,

    header: false,
    cls: 'tw-ftb-filterpanel',

    layout: {
        type: 'vbox',
        pack: 'start',
        align: 'stretch'
    },
    defaults: {
        xtype: 'panel',
        border: false,
        bodyPadding: 0
    },

    initComponent: function() {
 
        var me = this,
            filterPanel = me.addFilterPanel();

        me.activeFilterPanel = filterPanel;
        me.initQuickFilterField();
        me.items = [
            {
                region: 'center',
                reference : 'filterpanel-center',
                layout: 'card',
                activeItem: 0,
                // flex: 2,
                items: [ filterPanel ],
                autoScroll: false,
                listeners: {
                    scope: me,
                    beforeshow: me.manageHeight
                }
            }, {
                region: 'north',
                reference : 'filterpanel-north',
                hidden: true,
                // flex: 1,
                items: [ Ext.create('Klb.system.widgets.grid.FilterStructureTreePanel', {filterPanel: me}) ]
            }
        ];

        me.callParent();
    },

    /**
     * is persiting this filterPanel is allowed
     * 
     * @return {Boolean}
     */
    isSaveAllowed: function() {
        return this.activeFilterPanel.allowSaving;
    },

    getAllFilterData:  Object.getPrototypeOf('Klb.system.widgets.grid.FilterToolbar.getAllFilterData'),
    storeOnBeforeload: Object.getPrototypeOf('Klb.system.widgets.grid.FilterToolbar.storeOnBeforeload'), 

    manageHeight: function() {
        var height = 120;
        if (this.rendered) {
            var tbHeight = this.activeFilterPanel.getHeight(),
                centerRegion = this.down('[reference=filterpanel-center]'),
                northRegion = this.down('[reference=filterpanel-north]'),
                eastRegion = this.down('[reference=filterpanel-east]'),
                northHeight = northRegion ? northRegion.getHeight() : 0,
                eastHeight = eastRegion && eastRegion.getEl().child('ul') ? (eastRegion.getEl().child('ul').getHeight() + 28) : 0,
                height = Math.min(Math.max(eastHeight, tbHeight + northHeight), height);
            // if ( height  == 0 ) height = 22;
            this.setHeight(height);

            // manage scrolling
            if (centerRegion&& tbHeight > height) {
                centerRegion.el.child('div[class^="x-panel-body"]', true).scrollTop = 1000000;
                centerRegion.el.child('div[class^="x-panel-body"]', false).applyStyles('overflow-y: auto');
            }
            if (eastHeight && eastHeight > height) {
                eastHeight.el.child('div[class^="x-panel-body"]', true).scrollTop = 1000000;
            }
            this.ownerCt.updateLayout();
        }
    },

    onAddFilterPanel: function() {
        var filterPanel = this.addFilterPanel();
        this.setActiveFilterPanel(filterPanel);
    },
    
    addFilterPanel: function(config) {
        config = config || {};

        var  filterToolbarConfig = Ext.apply({}, this.filterToolbarConfig, config),
              filterPanel = Ext.create('Klb.system.widgets.grid.FilterToolbar', filterToolbarConfig );

            filterPanel.onFilterChange = this.onFilterChange.bind(this);

            this.filterPanels[filterPanel.id] = filterPanel;
            this.criteriaCount++;

            if (this.criteriaCount > 1 && filterPanel.title == filterPanel.generateTitle()) {
                filterPanel.setTitle(filterPanel.title + ' ' + this.criteriaCount);
            }
            this.fireEvent('filterpaneladded', this, filterPanel);
        return filterPanel;
    },
    
    /**
     * remove filter panel
     * 
     * @param {mixed} filterPanel
     */
    removeFilterPanel: function(filterPanel) {
        filterPanel = Ext.isString(filterPanel) ? this.filterPanels[filterPanel] : filterPanel;
        
        if (! this.filterPanels[filterPanel.id].destroying) {
            this.filterPanels[filterPanel.id].destroy();
        }
        
        delete this.filterPanels[filterPanel.id];
        this.criteriaCount--;
        
        this.fireEvent('filterpanelremoved', this, filterPanel);
        
        for (var id in this.filterPanels) {
            if (this.filterPanels.hasOwnProperty(id)) {
                return this.setActiveFilterPanel(this.filterPanels[id]);
            }
        }
        return this;
    },
    
    setActiveFilterPanel: function(filterPanel) {
        filterPanel = Ext.isString(filterPanel) ? this.filterPanels[filterPanel] : filterPanel;
        this.activeFilterPanel = filterPanel;

        // var appName = this.filterToolbarConfig.app.name,
        //     cpanel = Klb.system.appMgr.get(appName).getMainScreen()
        //             . getCenterPanel(); // . getFilterToolbar();

        var centerPanel = this.down('[reference=filterpanel-center]');
        centerPanel.add(filterPanel);
        if ( centerPanel.setActiveItem ) {
             centerPanel.setActiveItem(filterPanel);
        }

        filterPanel.doLayout();
        if (filterPanel.activeSheet) {
         // solve layout problems (#6332)
            filterPanel.setActiveSheet(filterPanel.activeSheet);
        }
        Ext.Function.defer(this.manageHeight, 100, this);
        
        this.fireEvent('filterpanelactivate', this, filterPanel);
    },
    
    // NOTE: there is no special filterPanel, each filterpanel could be closed  at any time
    //       ?? what does this mean for quickfilterplugin???
    //       -> we cant mirror fileds or need to mirror the field from the active tbar
    //       -> mhh, better deactivate as soon as we have more than one tbar
    //       -> don't sync, but fetch with this wrapper!
    initQuickFilterField: function() {
        var stateful = !! this.filterToolbarConfig.recordClass;
        // autogenerate stateId
        if (stateful) {
            var stateId = this.filterToolbarConfig.recordClass.getMeta('appName') + '-' + this.filterToolbarConfig.recordClass.getMeta('recordName') + '-FilterToolbar-QuickfilterPlugin';
        }
        
        this.quickFilter = new Ext.ux.SearchField({
            width: 300,
            enableKeyEvents: true
        });
        
        this.quickFilter.onTrigger1Click = Ext.Function.createSequence(this.quickFilter.onTrigger1Click, this.onQuickFilterClear, this);
        this.quickFilter.onTrigger2Click = Ext.Function.createSequence(this.quickFilter.onTrigger2Click, this.onQuickFilterTrigger, this);

        this.criteriaText = Ext.create('Ext.panel.Panel', {
            border: 0,
            html: '',
            bodyStyle: {
                border: 0,
                background: 'none', 
                'text-align': 'left', 
                'line-height': '11px'
            }
        });
        
        this.detailsToggleBtn = new Ext.button.Button({
            style: {'margin-top': '2px'},
            enableToggle: true,
            text: _('show details'), //'Advanced Search'
            tooltip: _('Always show advanced filters'),
            scope: this,
            handler: this.onDetailsToggle,
            stateful: stateful,
            stateId : stateful ? stateId : null,
            getState: function() {
                return {detailsButtonPressed: this.pressed};
            },
            applyState: function(state) {
                if (state.detailsButtonPressed) {
                    this.toggle(state.detailsButtonPressed);
                }
            },
            stateEvents: ['toggle'],
            listeners: {
                scope: this,
                render: function() {
                    // limit width of this.criteriaText
                    this.criteriaText.setWidth(this.quickFilterGroup.getWidth() - this.detailsToggleBtn.getWidth());
                    this.onDetailsToggle(this.detailsToggleBtn);
                }
            }
        });
    },
    
    /**
     * called when the (external) quick filter is cleared
     */
    onQuickFilterClear: function() {

        this.quickFilter.reset();
        this.quickFilter.setValue('');
        this.syncQuickFilterFields(true, '');
        this.activeFilterPanel.onFiltertrigger.call(this.activeFilterPanel);
    },
    
    /**
     * called when the (external) filter triggers filter action
     */
    onQuickFilterTrigger: function() {
        
        if(this.quickFilter.getValue() == ''){
            this.syncQuickFilterFields(true, '');
        }
        
        this.activeFilterPanel.onFiltertrigger.call(this.activeFilterPanel);
        this.activeFilterPanel.onFilterRowsChange.call(this.activeFilterPanel);
    },
    
    /**
     * called when the details toggle button gets toggled
     * 
     * @param {Ext.button.Button} btn
     */
    onDetailsToggle: function(btn) {
        this[btn.pressed ? 'show' : 'hide']();
        this.quickFilter.setDisabled(btn.pressed);
        this.manageCriteriaText();
        
        this.syncQuickFilterFields(btn.pressed);
        
        this.activeFilterPanel.doLayout();
        this.manageHeight();
    },
    
    /**
     * synchronizes the quickfilter field with the  coreesponding filter of the active filter toolbar
     * 
     * @param {Bool} fromQuickFilter
     * @param {String} value
     */
    syncQuickFilterFields: function(fromQuickFilter, value) {
        
        if (fromQuickFilter === undefined) {
            fromQuickFilter = true;
        }
        
        if (fromQuickFilter) {
            var val = (value !== undefined) ? value : this.quickFilter.getValue(),
                quickFilter;
                
            this.quickFilter.setValue('');
            // find quickfilterrow
            this.activeFilterPanel.filterStore.each(function(filter) {
                if (filter.get('field') == this.quickFilterField) {
                    quickFilter = filter;
                    quickFilter.set('value', val);
                    quickFilter.formFields.value.setValue(val);
                    return false;
                }
            }, this);
        
            if (! quickFilter && val) {
                quickFilter = this.activeFilterPanel.addFilter(new this.activeFilterPanel.record({field: this.quickFilterField, value: val}));
            }
        } else {
            this.activeFilterPanel.filterStore.each(function(filter) {
                if (filter.get('field') == this.quickFilterField) {
                    this.quickFilter.setValue(filter.formFields.value.getValue());
                    filter.set('value', '');
                    return false;
                }
            }, this);
        }
    },
    
    /**
     * manages the criteria text
     */
    manageCriteriaText: function() {
        var moreCriterias = false,
            filterPanelCount = 0,
            criterias = [];
            
        // count filterPanels
        for (var id in this.filterPanels) {if (this.filterPanels.hasOwnProperty(id)) {filterPanelCount++;}}
        
        if (! filterPanelCount > 1) {
            moreCriterias = true;
            
        } else {
            // not more filters only if we hove one filterPanel & only one queryFilter in it (or implicit filters)
            this.activeFilterPanel.filterStore.each(function(filter) {
                var f = this.activeFilterPanel.getFilterData(filter);
                
                for (var i=0, criteria, ignore; i<this.criteriaIgnores.length; i++) {
                    criteria = this.criteriaIgnores[i];
                    ignore = true;
                    
                    for (var p in criteria) {
                        if (criteria.hasOwnProperty(p)) {
                            if (Ext.isString(criteria[p]) || Ext.isEmpty(f[p]) ) {
                                ignore &= f.hasOwnProperty(p) && f[p] === criteria[p];
                            } else {
                                for (var pp in criteria[p]) {
                                    if (criteria[p].hasOwnProperty(pp)) {
                                        ignore &= f.hasOwnProperty(p) && typeof f[p].hasOwnProperty == 'function' && f[p].hasOwnProperty(pp) && f[p][pp] === criteria[p][pp];
                                    }
                                }
                            }
                        }
                    }
                    
                    if (ignore) {
                        // don't judge them as criterias
                        return;
                    }
                }
                
                if (this.activeFilterPanel.filterModelMap[f.field]) {
                    criterias.push(this.activeFilterPanel.filterModelMap[f.field].label);
                } else {
                    // no idea how to get the filterplugin for non ftb itmes
                    criterias.push(f.field);
                }
            }, this);
            moreCriterias = criterias.length > 0;
        }
        
        moreCriterias = this.hidden ? moreCriterias : false;
        
        if (this.criteriaText && this.criteriaText.rendered) {
            this.criteriaText.update(moreCriterias ? _(this.moreFiltersActiveText) : '');
        }
    },
    
    /**
     * gets the (extra) quick filter toolbar items
     * 
     * @return {Ext.container.ButtonGroup}
     */
    getQuickFilterField: function() {
        if (! this.quickFilterGroup) {
            this.quickFilterGroup = new Ext.container.ButtonGroup({
                columns: 1,
                items: [
                    this.quickFilter, {
                        xtype: 'toolbar',
                        style: {border: 0, background: 'none'},
                        items: [this.criteriaText, '->', this.detailsToggleBtn]
                    }
                ]
            });
        }
        
        return this.quickFilterGroup;
    },
    
    getQuickFilterPlugin: function() {
        return this;
    },
    
    getValue: function() {
        var quickFilterValue = this.quickFilter.getValue(),
            filters = [];
        
        if (quickFilterValue) {
            filters.push({field: this.quickFilterField, operator: 'contains', value: quickFilterValue}); // , id: 'quickFilter'
            
            // add implicit / ignored fields (important e.g. for container_id)
            Ext.each(this.criteriaIgnores, function(criteria) {
                if (criteria.field != this.quickFilterField) {
                    var filterIdx = this.activeFilterPanel.filterStore.find('field', criteria.field),
                        filter = filterIdx >= 0  ? this.activeFilterPanel.filterStore.getAt(filterIdx) : null,
                        filterModel = filter ? this.activeFilterPanel.getFilterModel(filter) : null;
                    
                    if (filter) {
                        filters.push(Ext.isFunction(filterModel.getFilterData) ? filterModel.getFilterData(filter) : this.activeFilterPanel.getFilterData(filter));
                    }
                }
                
            }, this);
            
            return filters;
        }
        
        for (var id in this.filterPanels) {
            if (this.filterPanels.hasOwnProperty(id) && this.filterPanels[id].isActive) {
                filters.push({'condition': 'AND', 'filters': this.filterPanels[id].getValue(), 'id': id, label: this.filterPanels[id].title});
            }
        }
        
        // NOTE: always trigger a OR condition, otherwise we sould loose inactive FilterPanles
        //return filters.length == 1 ? filters[0].filters : [{'condition': 'OR', 'filters': filters}];
        return [{'condition': 'OR', 'filters': filters}];
    },
    
    setValue: function(value) {
        // save last filter ?
        var prefs;
        if ((prefs = this.filterToolbarConfig.app.getRegistry().get('preferences')) && prefs.get('defaultpersistentfilter') == '_lastusedfilter_') {
            var lastFilterStateName = this.filterToolbarConfig.recordClass.getMeta('appName') + '-' + this.filterToolbarConfig.recordClass.getMeta('recordName') + '-lastusedfilter';
            
            if (Ext.encode(Ext.state.Manager.get(lastFilterStateName)) != Ext.encode(value)) {
                KlbDesktop.log.debug('Klb.system.widgets.grid.FilterPanel::setValue save last used filter');
                Ext.state.Manager.set(lastFilterStateName, value);
            }
        }
        
        // NOTE: value is always an array representing a filterGroup with condition AND (server limitation)!
        //       so we need to route "alternate criterias" (OR on root level) through this filterGroup for transport
        //       and scrape them out here -> this also means we whipe all other root level filters (could only be implicit once)
        var alternateCriterias = false;
        Ext.each(value, function(filterData) {
            if (filterData.condition && filterData.condition == 'OR') {
                value = filterData.filters;
                alternateCriterias = true;
                return false;
            }
        }, this);
        
        
        if (! alternateCriterias) {
            // reset criterias
//            this.criteriaCount = 0;
//            this.activeFilterPanel.setTitle( Ext.String.format(_('Criteria {0}'), ++this.criteriaCount));
            this.activeFilterPanel.setTitle(this.activeFilterPanel.generateTitle());
            for (var id in this.filterPanels) {
                if (this.filterPanels.hasOwnProperty(id)) {
                    if (this.filterPanels[id] != this.activeFilterPanel) {
                        this.removeFilterPanel(this.filterPanels[id]);
                    }
                }
            }
            
            this.activeFilterPanel.setValue(value);
            
            var quickFilterValue = this.activeFilterPanel.filterStore.getById('quickFilter');
            if (quickFilterValue) {
                this.quickFilter.setValue(quickFilterValue.get('value'));
                this.activeFilterPanel.supressEvents = true;
                this.activeFilterPanel.deleteFilter(quickFilterValue);
                this.activeFilterPanel.supressEvents = false;
            }
        } 
        
        // OR condition on root level
        else {
            var keepFilterPanels = [],
                activeFilterPanel = this.activeFilterPanel;
            
            Ext.each(value, function(filterData) {
                var filterPanel;
                
                // refresh existing filter panel
                if (filterData.id && this.filterPanels.hasOwnProperty(filterData.id)) {
                    filterPanel = this.filterPanels[filterData.id];
                }
                
                // create new filterPanel
                else {
                    // NOTE: don't use filterData.id here, it's a ext-comp-* which comes from a different session
                    // and might be a totally different element yet.
                    filterPanel = this.addFilterPanel();
                    this.setActiveFilterPanel(filterPanel);
                }
                
                filterPanel.setValue(filterData.filters);
                keepFilterPanels.push(filterPanel.id);
                
                if (filterData.label) {
                    filterPanel.setTitle(Ext.util.Format.htmlEncode(filterData.label));
                }
                
            }, this);
            
            // (re)activate filterPanel
            this.setActiveFilterPanel(keepFilterPanels.indexOf(activeFilterPanel.id) > 0 ? activeFilterPanel : keepFilterPanels[0]);

            // remove unused panels
            for (var id in this.filterPanels) {
                if (this.filterPanels.hasOwnProperty(id) && keepFilterPanels.indexOf(id) < 0 && this.filterPanels[id].isActive == true) {
                    this.removeFilterPanel(id);
                }
            }
            
        }
        
        this.manageCriteriaText();
    }
});