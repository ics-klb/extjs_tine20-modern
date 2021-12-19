/*
 * Klb Desktop 3.0.1
 * 
 * @package     Modern
 * @subpackage  Filemanager.SearchCombo
 * @copyright   Copyright (c) 2018 LLC ICS (http://www.icstime.com)
 * @license     http://www.gnu.org/licenses/agpl.html AGPL Version 3
 */

Ext.ns('Klb.system.widgets.grid');

/**
  * 
 * @namespace   Klb.system.widgets.grid
 * @class       Klb.system.widgets.grid.GridPanel
 * @extends     Ext.panel.Panel
 * 
 * @license     http://www.gnu.org/licenses/agpl.html AGPL Version 3
 * @author      Cornelius Weiss <c.weiss@metaways.de>
 */
Ext.define('Klb.system.widgets.grid.GridPanel', {
    extend: 'Ext.container.Container', // Ext.container.Container Ext.panel.Panel

    constructor: function (config) {
        config = config || {};
        this.gridConfig      = this.gridConfig || {};
        this.defaultSortInfo = this.defaultSortInfo || {};
        this.defaultPaging   = this.defaultPaging || {
            start: 0,
            limit: 50
        }; 

        this.callParent([config]);
    },
    /**
     * @cfg {Klb.system.Application} app
     * instance of the app object (required)
     */
    app: null,
    /**
     * @cfg {Object} gridConfig
     * Config object for the Ext.grid.GridPanel
     */
    gridConfig: null,
    /**
     * @cfg {Ext.data.Model} recordClass
     * record definition class  (required)
     */
    recordClass: null,
    /**
     * @cfg {Ext.data.DataProxy} recordProxy
     */
    recordProxy: null,
    /**
     * @cfg {Klb.system.widgets.grid.FilterToolbar} filterToolbar
     */
    filterToolbar: null,
    /**
     * @cfg {Bool} evalGrants
     * should grants of a grant-aware records be evaluated (defaults to true)
     */
    evalGrants: true,
    /**
     * @cfg {Bool} filterSelectionDelete
     * is it allowed to deleteByFilter?
     */
    filterSelectionDelete: false,
    /**
     * @cfg {Object} defaultSortInfo
     */
    defaultSortInfo: null,
    /**
     * @cfg {Object} storeRemoteSort
     */
    storeRemoteSort: true,
    /**
     * @cfg {Bool} usePagingToolbar 
     */
    usePagingToolbar: true,
    /**
     * @cfg {Object} defaultPaging 
     */
    defaultPaging: null,
    /**
     * @cfg {Object} pagingConfig
     * additional paging config
     */
    pagingConfig: null,
    /**
     * @cfg {Klb.system.widgets.grid.DetailsPanel} detailsPanel
     * if set, it becomes rendered in region south 
     */
    detailsPanel: null,
    /**
     * @cfg {Array} i18nDeleteQuestion 
     * spechialised strings for deleteQuestion
     */
    i18nDeleteQuestion: null,
    /**
     * @cfg {String} i18nAddRecordAction 
     * spechialised strings for add action button
     */
    i18nAddActionText: null,
    /**
     * @cfg {String} i18nEditRecordAction 
     * specialised strings for edit action button
     */
    i18nEditActionText: null,
    /**
     * @cfg {Array} i18nDeleteRecordAction 
     * specialised strings for delete action button
     */
    i18nDeleteActionText: null,
    
    /**
     * if this resides in a editDialog, this property holds it
     * if it is so, the grid can't save records itsef, just update
     * the editDialogs record property holding these records
     * 
     * @cfg {Klb.system.widgets.dialog.EditDialog} editDialog
     */
    editDialog: null,

    /**
     * if this resides in an editDialog, this property defines the 
     * property of the record of the editDialog, holding these records
     * 
     * @type {String} editDialogRecordProperty
     */
    editDialogRecordProperty: null,

    /**
     * config passed to edit dialog to open from this grid
     * 
     * @cfg {Object} editDialogConfig
     */
    editDialogConfig: null,

    /**
     * the edit dialog class to open from this grid
     * 
     * @cfg {String} editDialogClass
     */
    editDialogClass: null,

    /**
     * @cfg {String} i18nEmptyText 
     */
    i18nEmptyText: null,

    /**
     * @cfg {String} newRecordIcon 
     * icon for adding new records button
     */
    newRecordIcon: null,

    /**
     * @cfg {Bool} i18nDeleteRecordAction 
     * update details panel if context menu is shown
     */
    updateDetailsPanelOnCtxMenu: true,

    /**
     * @cfg {Number} autoRefreshInterval (seconds)
     */
    autoRefreshInterval: 300,

    /**
     * @cfg {Bool} hasFavoritesPanel 
     */
    hasFavoritesPanel: false,
    
    /**
     * @cfg {Bool} hasQuickSearchFilterToolbarPlugin 
     */
    hasQuickSearchFilterToolbarPlugin: true,

    /**
     * disable 'select all pages' in paging toolbar
     * @cfg {Bool} disableSelectAllPages
     */
    disableSelectAllPages: false,

    /**
     * enable if records should be multiple editable
     * @cfg {Bool} multipleEdit
     */
    multipleEdit: false,
    
    /**
     * set if multiple edit requires special right
     * @type {String}  multipleEditRequiredRight
     */
    multipleEditRequiredRight: null,
    
    /**
     * enable if selection of 2 records should allow merging
     * @cfg {Bool} duplicateResolvable
     */
    duplicateResolvable: false,
    
    /**
     * @property autoRefreshTask
     * @type Ext.util.DelayedTask
     */
    autoRefreshTask: null,

    /**
     * @type Bool
     * @property updateOnSelectionChange
     */
    updateOnSelectionChange: true,

    /**
     * @type Bool
     * @property copyEditAction
     * 
     * TODO activate this by default
     */
    copyEditAction: false,

    /**
     * @type Ext.Toolbar
     * @property actionToolbar
     */
    actionToolbar: null,

    /**
     * @type Ext.ux.grid.PagingToolbar
     * @property pagingToolbar
     */
    pagingToolbar: null,

    /**
     * @type Ext.Menu
     * @property contextMenu
     */
    contextMenu: null,

    /**
     * @property lastStoreTransactionId 
     * @type String
     */
    lastStoreTransactionId: null,

    /**
     * @property editBuffer  - array of ids of records edited since last explicit refresh
     * @type Array of ids
     */
    editBuffer: null,

    /**
     * @property deleteQueue - array of ids of records currently being deleted
     * @type Array of ids
     */
    deleteQueue: null,

    /**
     * configuration object of model from application starter
     * @type object
     */
    modelConfig: null,
    
    /**
     * @property selectionModel
     * @type Klb.system.widgets.grid.FilterSelectionModel
     */
    selectionModel: null,
    
    /**
     * add records from other applications using the split add button
     * - activated by default
     */
    splitAddButton: true,

    header: false,
    border: false,
    stateful: true,
    layout: {
       type: 'vbox',
       pack: 'start',
       align: 'stretch'
    },

    /**
     * extend standard initComponent chain
     */
    initComponent: function(){
        var me =  this;

        me.plugins = me.plugins || [];
        me.editBuffer = [];
        me.deleteQueue = [];
        me.editDialogConfig = me.editDialogConfig || {};

        // autogenerate stateId
        if (this.stateful !== false && ! this.stateId) {
            this.stateId = this.recordClass.getMeta('appName') + '-' + this.recordClass.getMeta('recordName') + '-GridPanel';
        }

        // init some translations
        me.i18nRecordName = me.i18nRecordName ? me.i18nRecordName : me.recordClass.getRecordName();
        me.i18nRecordsName = me.i18nRecordsName ? me.i18nRecordsName : me.recordClass.getRecordsName();
        me.i18nContainerName = me.i18nContainerName ? me.i18nContainerName : me.recordClass.getContainerName();
        me.i18nContainersName = me.i18nContainersName ? me.i18nContainersName : me.recordClass.getContainersName();
        me.i18nEmptyText = me.i18nEmptyText ||  Ext.String.format(Klb.system.translation._("There could not be found any {0}. Please try to change your filter-criteria, view-options or the {1} you search in."), this.i18nRecordsName, this.i18nContainersName);

        me.i18nEditActionText = me.i18nEditActionText ? this.i18nEditActionText : [ Ext.String.format(Klb.system.translation.ngettext('Edit {0}', 'Edit {0}', 1), this.i18nRecordName),  Ext.String.format(Klb.system.translation.ngettext('Edit {0}', 'Edit {0}', 2), this.i18nRecordsName)];

        // init generic stuff
        if (me.modelConfig) {
            me.initGeneric();
        }
        me.initFilterPanel();
        // init store
        me.initStore();
        // init (ext) grid
        me.initGrid();
        // init actions
        me.actionUpdater = Ext.create('Klb.system.widgets.ActionUpdater', {
            containerProperty: me.recordClass.getMeta('containerProperty'),
            evalGrants: me.evalGrants
        });
        me.initActions();
        me.initLayout();

        // for some reason IE looses split height when outer layout is layouted
        me.callParent();
    },
    /**
     * initializes generic stuff when used with ModelConfiguration
     */
    initGeneric: function() {

        if (this.modelConfig) {
            Klb.Logger.debug('init generic gridpanel with config:');
            Klb.Logger.debug(this.modelConfig);

            if (this.modelConfig.hasOwnProperty('multipleEdit') && (this.modelConfig.multipleEdit === true)) {
                this.multipleEdit = true;
                this.multipleEditRequiredRight = (this.modelConfig.hasOwnProperty('multipleEditRequiredRight')) ? this.modelConfig.multipleEditRequiredRight : null;
            }
        }
            // init generic columnModel
            this.initGenericColumnModel();
        return this;
    },
    /**
     * initialises the filter panel 
     */
    initFilterPanel: function(config) {

        if (! this.filterToolbar) {
             var config = Ext.apply(config || {}, {
                cls: 'tw-ftb-filterpanel',
                app: this.app,
                recordClass:   this.recordClass,
                filterModels:  this.modelConfig ? this.getCustomfieldFilters() : this.recordClass.getFilterModel(),
                defaultFilter: this.recordClass.getMeta('defaultFilter') ? this.recordClass.getMeta('defaultFilter') : 'query',
                filters:       this.defaultFilters || []
            } );

            
            // this.filterToolbar = Ext.create('Klb.system.widgets.grid.FilterPanel', config );
            this.filterToolbar = Ext.create('Klb.system.widgets.grid.FilterToolbar', config ); // test
            this.plugins.push(this.filterToolbar);
        }
        return this;
    },
    /**
     * initializes the generic column model on auto bootstrap
     */
    initGenericColumnModel: function() {

        if (this.modelConfig) {
            var columns = [];
            Ext.each(this.modelConfig.fieldKeys, function(key) {
                var fieldConfig = this.modelConfig.fields[key];
                
                // don't show multiple record fields
                if (fieldConfig.type == 'records') {
                    return true;
                }

                // don't show parent property in dependency of an editDialog
                if (this.editDialog && fieldConfig.hasOwnProperty('config') && fieldConfig.config.isParent) {
                    return true;
                }

                // If no label exists, don't use in grid
                if (fieldConfig.label) {
                    var config = {
                        id: key,
                        dataIndex: key,
                        header: this.app.i18n._(fieldConfig.label),
                        hidden: fieldConfig.hasOwnProperty('shy') ? fieldConfig.shy : false,    // defaults to false
                        sortable: (fieldConfig.hasOwnProperty('sortable') && fieldConfig.sortable == false) ? false : true // defaults to true
                    };
                    var renderer = Klb.system.widgets.grid.RendererManager.get(this.app.name, this.recordClass.getMeta('modelName'), key);
                    if (renderer) {
                        config.renderer = renderer;
                    }
                    columns.push(config);
                }
            }, this);
            
            if (this.modelConfig.hasCustomFields) {
                columns = columns.concat(this.getCustomfieldColumns());
            }

            this.gridConfig.headerCt = Ext.create('Ext.grid.header.Container', {
                defaults: {
                    resizable: true
                },
                columns: columns
            });
        }

        return this;
    },
    /**
     * @private
     */
    initLayout: function() {
        var me = this;
        me.items = [];

        // add filter toolbar
        if (this.filterToolbar) {
            me.items.push({
                xtype: 'panel',
                region : 'north',
                reference : 'gridpanel-north',
                scrollable: true,
                minWidth: 780,
                items: me.filterToolbar,
                listeners: {
                    afterlayout: {
                        scope: me,
                        fn: function(ct) {
                            ct.suspendEvents();
                            ct.setHeight( Math.min(120, me.filterToolbar.getHeight()));
                            ct.getEl().child('div[class^="x-panel-body"]', true).scrollTop = 1000000;
                            ct.ownerCt.updateLayout();
                            ct.resumeEvents();
                        }
                    }
                }
            });
        }

        me.items.push({
                xtype: 'panel',
                region: 'center',
                reference: 'gridpanel-center',
                // layout: 'fit',
                flex:   1,
                tbar:  me.pagingToolbar,
                items: me.grid
        });

        // add detail panel
        if (me.detailsPanel) {
            me.items.push({
                xtype: 'panel',
                region: 'south',
                reference: 'gridpanel-south',
                border: false,
                collapsible: true,
                collapseMode: 'mini',
                header: false,
                split: true,
                // layout: 'fit',
                flex:  1,
                height: me.detailsPanel.defaultHeight ? me.detailsPanel.defaultHeight : 125,
                items: me.detailsPanel
            });
            me.detailsPanel.doBind(me.grid);
        }

        return me;
    },
    /**
     * init actions with actionToolbar, contextMenu and actionUpdater
     */
    initActions: function() {

        var services = Klb.App.Api.registry.get('serviceMap').services;
        this.action_editInNewWindow = Ext.create('Ext.Action', {
            requiredGrant: 'readGrant',
            requiredMultipleGrant: 'editGrant',
            requiredMultipleRight: this.multipleEditRequiredRight,
            text: this.i18nEditActionText ? this.i18nEditActionText[0] :  Ext.String.format(_('Edit {0}'), this.i18nRecordName),
            singularText: this.i18nEditActionText ? this.i18nEditActionText[0] :  Ext.String.format(_('Edit {0}'), this.i18nRecordName),
            pluralText:  this.i18nEditActionText ? this.i18nEditActionText[1] :  Ext.String.format(Klb.system.translation.ngettext('Edit {0}', 'Edit {0}', 1), this.i18nRecordsName),
            disabled: true,
            translationObject: this.i18nEditActionText ? this.app.i18n : Klb.system.translation,
            actionType: 'edit',
            handler: Ext.bind(this.onEditInNewWindow, this, [{actionType: 'edit'}]),
            iconCls: 'action_edit',
            scope: this,
            allowMultiple: this.multipleEdit
        });

        this.action_editCopyInNewWindow = new Ext.Action({
            hidden: ! this.copyEditAction,
            requiredGrant: 'readGrant',
            text:  Ext.String.format(_('Copy {0}'), this.i18nRecordName),
            disabled: true,
            actionType: 'copy',
            handler: Ext.bind(this.onEditInNewWindow, this, [{actionType: 'copy'}]),
            iconCls: 'action_editcopy',
            scope: this
        });

        this.action_addInNewWindow = new Ext.Action({
            requiredGrant: 'addGrant',
            actionType: 'add',
            text: this.i18nAddActionText ? this.app.i18n._hidden(this.i18nAddActionText) :  Ext.String.format(_('Add {0}'), this.i18nRecordName),
            handler: Ext.bind(this.onEditInNewWindow, this, [{actionType: 'add'}]),
            iconCls: (this.newRecordIcon !== null) ? this.newRecordIcon : this.app.appName + 'IconCls',
            scope: this
        });

        this.actions_print = new Ext.Action({
            requiredGrant: 'readGrant',
            text: _('Print Page'),
            disabled: false,
            handler: function() {
                Ext.ux.Printer.print(this.getGrid());
            },
            iconCls: 'action_print',
            scope: this,
            allowMultiple: true
        });

        this.initDeleteAction(services);
        var sm = this.getGridSM();

        this.action_tagsMassAttach = new Klb.system.widgets.tags.TagsMassAttachAction({
            hidden:         ! this.recordClass.getField('tags'),
            selectionModel: sm,
            recordClass:    this.recordClass,
            updateHandler:  this.loadGridData.bind(this),
            app:            this.app
        });

        this.action_tagsMassDetach = new Klb.system.widgets.tags.TagsMassDetachAction({
            hidden:         ! this.recordClass.getField('tags'),
            selectionModel: sm,
            recordClass:    this.recordClass,
            updateHandler:  this.loadGridData.bind(this),
            app:            this.app
        });

        this.action_resolveDuplicates = new Ext.Action({
            requiredGrant: null,
            text:  Ext.String.format(_('Merge {0}'), this.i18nRecordsName),
                iconCls: 'action_resolveDuplicates',
                scope: this,
                handler: this.onResolveDuplicates,
                disabled: false,
                actionUpdater: function(action, grants, records) {
                    if (records && (records.length != 2)) action.setDisabled(true);
                    else action.setDisabled(false);
                }
        });

        // add actions to updater
        this.actionUpdater.addActions([
            this.action_addInNewWindow,
            this.action_editInNewWindow,
            this.action_editCopyInNewWindow,
            this.action_deleteRecord,
            this.action_tagsMassAttach,
            this.action_tagsMassDetach,
            this.action_resolveDuplicates
        ]);

        // init actionToolbar (needed for correct fitertoolbar init atm -> fixme)
        this.getActionToolbar();
    },
    /**
     * initializes the delete action
     */
    initDeleteAction: function(services) {

        // note: unprecise plural form here, but this is hard to change
        this.action_deleteRecord = new Ext.Action({
            requiredGrant: 'deleteGrant',
            allowMultiple: true,
            singularText: this.i18nDeleteActionText ? this.i18nDeleteActionText[0] :  Ext.String.format(Klb.system.translation.ngettext('Delete {0}', 'Delete {0}', 1), this.i18nRecordName),
            pluralText: this.i18nDeleteActionText ? this.i18nDeleteActionText[1] :  Ext.String.format(Klb.system.translation.ngettext('Delete {0}', 'Delete {0}', 1), this.i18nRecordsName),
            translationObject: this.i18nDeleteActionText ? this.app.i18n : Klb.system.translation,
            text: this.i18nDeleteActionText ? this.i18nDeleteActionText[0] :  Ext.String.format(Klb.system.translation.ngettext('Delete {0}', 'Delete {0}', 1), this.i18nRecordName),
            handler: this.onDeleteRecords,
            disabled: true,
            iconCls: 'action_delete',
            scope: this
        });
        // if nested in a editDialog (dependent record), the service won't exist
        if (! this.editDialog) {
            this.disableDeleteActionCheckServiceMap(services);
        }
    },
    /**
     * disable delete action if no delete method was found in serviceMap
     */
    disableDeleteActionCheckServiceMap: function(services) {

        if (services) {
            var serviceKey = this.app.name + '.delete' + this.recordClass.getMeta('modelName') + 's';
            if (! services.hasOwnProperty(serviceKey)) {
                this.action_deleteRecord.setDisabled(1);
                this.action_deleteRecord.initialConfig.actionUpdater = function(action) {
                    Klb.Logger.debug("disable delete action because no delete method was found in serviceMap");
                    action.setDisabled(1);
                }
            }
        }
    },
    /**
     * init store
     * @private
     */
    initStore: function() {

        if (this.recordProxy) {
            this.store = Ext.create('Ext.data.Store', {
                // fields: this.recordClass.fields,
                model:  this.recordProxy.modelClass,
                proxy:  this.recordProxy,
                remoteSort: this.storeRemoteSort,
                sortInfo: this.defaultSortInfo,
                listeners: {
                     scope: this,
                    'add': this.onStoreAdd,
                    'remove': this.onStoreRemove,
                    'update': this.onStoreUpdate,
                    'beforeload': this.onStoreBeforeload,
                    'load': this.onStoreLoad,
                    'beforeloadrecords': this.onStoreBeforeLoadRecords,
                    'loadexception': this.onStoreLoadException
                }
            });
        } else {
            this.store = new Klb.system.data.RecordStore({
                recordClass: this.recordClass
            });
        }

        // init autoRefresh
        this.autoRefreshTask = new Ext.util.DelayedTask(this.loadGridData, this, [{
            removeStrategy: 'keepBuffered',
            autoRefresh: true
        }]);
    },

    /**
     * returns view row class
     */
    getViewRowClass: function(record, index, rowParams, store) {
        var noLongerInFilter = record.not_in_filter,
            className = '';

        if (noLongerInFilter) {
            className += 'apibase-grid-row-nolongerinfilter';
        }
        return className;
    },
    /**
     * new entry event -> add new record to store
     */
    onStoreNewEntry: function(recordData) {
        var initialData = null;

        if (Ext.isFunction(this.recordClass.getDefaultData)) {
            initialData = Ext.apply(this.recordClass.getDefaultData(), recordData);
        } else {
            initialData = recordData;
        }
        var record = new this.recordClass(initialData);
        this.store.insert(0 , [record]);

        if (this.usePagingToolbar) {
            this.pagingToolbar.disable();
        }
        this.recordProxy.saveRecord(record, {
            scope: this,
            success: function(newRecord) {
                this.store.suspendEvents();
                this.store.remove(record);
                this.store.insert(0 , [newRecord]);
                this.store.resumeEvents();

                this.addToEditBuffer(newRecord);

                this.loadGridData({
                    removeStrategy: 'keepBuffered'
                });
            }
        });

        return true;
    },
    /**
     * header is clicked
     */
    onHeaderClick: function(grid, colIdx, e) {

        Ext.apply(this.store.lastOptions, {
            preserveCursor:     true,
            preserveSelection:  true, 
            preserveScroller:   true, 
            removeStrategy:     'default'
        });
    },
    /**
     * called when Records have been added to the Store
     */
    onStoreAdd: function(store, records, index) {

        this.store.totalLength += records.length;
        if (this.pagingToolbar) {
            this.pagingToolbar.updateInfo();
        }
    },
    /**
     * called when a Record has been removed from the Store
     */
    onStoreRemove: function(store, record, index) {

        this.store.totalLength--;
        if (this.pagingToolbar) {
            this.pagingToolbar.updateInfo();
        }
    },
    /**
     * called when the store gets updated, e.g. from editgrid
     */
    onStoreUpdate: function(store, record, operation) {
        var me = this;
        switch (operation) {
            case Ext.data.Model.EDIT:
                me.addToEditBuffer(record);

                if (me.usePagingToolbar) {
                    me.pagingToolbar.disable();
                }
                // don't save these records. Add them to the parents' record store
                if (me.editDialog) {
                    var items = [];
                    store.each(function(item) {
                        items.push(item.data);
                    });
                    me.editDialog.record.set(me.editDialogRecordProperty, items);
                    me.editDialog.fireEvent('updateDependent');
                } else {
                    me.recordProxy.saveRecord(record, {
                        scope: me,
                        success: function(updatedRecord) {
                            store.commitChanges();
                            // update record in store to prevent concurrency problems
                            record.data = updatedRecord.data;
                            me.loadGridData({
                                removeStrategy: 'keepBuffered'
                            });
                        }
                    });
                    break;
                }
            case Ext.data.Model.COMMIT:
                //nothing to do, as we need to reload the store anyway.
                break;
        }
    },
    /**
     * called before store queries for data
     */
    onStoreBeforeload: function(store, options) {
        var me = this;
        // define a transaction
        me.lastStoreTransactionId = options.transactionId = Ext.id();

        options.params = options.params || {};
        // allways start with an empty filter set!
        // this is important for paging and sort header!
        options.params.filter = [];

        if (! options.removeStrategy || options.removeStrategy !== 'keepBuffered') {
            me.editBuffer = [];
        }

//        options.preserveSelection = options.hasOwnProperty('preserveSelection') ? options.preserveSelection : true;
//        options.preserveScroller = options.hasOwnProperty('preserveScroller') ? options.preserveScroller : true;

        // fix nasty paging tb
        Ext.applyIf(options.params, me.defaultPaging);
    },
    /**
     * called after a new set of Records has been loaded
     * 
     * @param  {Ext.data.Store} this.store
     * @param  {Array}          loaded records
     * @param  {Array}          load options
     * @return {Void}
     */
    onStoreLoad: function(store, records, options) {
        // we always focus the first row so that keynav starts in the grid
        // this resets scroller ;-( -> need a better solution
        if (this.store.getCount() > 0) {
            this.grid.getView().focusRow(0);
        }
        // restore selection
        if (Ext.isArray(options.preserveSelection)) {
            Ext.each(options.preserveSelection, function(record) {
                var row = this.store.indexOfId(record.id);
                if (row >= 0) {
                    this.grid.getSelectionModel().selectRow(row, true);
                }
            }, this);
        }

        // restore scroller
        if (Ext.isNumber(options.preserveScroller)) {
            this.grid.getView().scroller.dom.scrollTop = options.preserveScroller;
        }
        // reset autoRefresh
        if (window.isMainWindow && this.autoRefreshInterval) {
            this.autoRefreshTask.delay(this.autoRefreshInterval * 1000);
        }
    },
    /**
     * on store load exception
     */
    onStoreLoadException: function(proxy, type, error, options) {

        // reset autoRefresh
        if (window.isMainWindow && this.autoRefreshInterval) {
            this.autoRefreshTask.delay(this.autoRefreshInterval * 5000);
        }

        if (this.usePagingToolbar && this.pagingToolbar.refresh) {
            this.pagingToolbar.enable();
        }

        if (! options.autoRefresh) {
            proxy.handleRequestException(error);
        } else {
            Klb.Logger.debug('Klb.system.widgets.grid.GridPanel::onStoreLoadException -> auto refresh failed.');
        }
    },
    /**
     * onStoreBeforeLoadRecords
     */
    onStoreBeforeLoadRecords: function(o, options, success, store) {

        var options = options || {};

        // RecordProxy is dealing with repeated requests.
        // if (this.lastStoreTransactionId && options.transactionId && this.lastStoreTransactionId !== options.transactionId) {
        //     Klb.Logger.debug('onStoreBeforeLoadRecords - cancelling old transaction request.');
        //     return false;
        // }

        // save selection -> will be applied onLoad
        if (options.preserveSelection) {
            options.preserveSelection = this.grid.getSelectionModel().getSelection();
        }

        // save scroller -> will be applied onLoad
        if (options.preserveScroller
                && this.grid.getView().scroller && this.grid.getView().scroller.dom)
            options.preserveScroller = this.grid.getView().scroller.dom.scrollTop;

        // apply removeStrategy
        if (! options.removeStrategy || options.removeStrategy === 'default') {
            return true;
        }

        var records = [],
            recordsIds = [],
            recordToLoadCollection = new Ext.util.MixedCollection();

        // fill new collection
        Ext.each(o.records, function(record) {
            recordToLoadCollection.add(record.id, record);
        });

        // assemble update & keep
        this.store.each(function(currentRecord) {
            var recordToLoad = recordToLoadCollection.get(currentRecord.id);
            if (recordToLoad) {
                // we replace records that are the same, because otherwise this would not work for local changes
                if (recordToLoad.isObsoletedBy(currentRecord)) {
                    records.push(currentRecord);
                    recordsIds.push(currentRecord.id);
                } else {
                    records.push(recordToLoad);
                    recordsIds.push(recordToLoad.id);
                }
            } else if (options.removeStrategy === 'keepAll' || (options.removeStrategy === 'keepBuffered'
                                                                    && this.editBuffer.indexOf(currentRecord.id) >= 0)) {
                var copiedRecord = currentRecord.copy();
                copiedRecord.not_in_filter = true;
                records.push(copiedRecord);
                recordsIds.push(currentRecord.id);
            }
        }, this);
        
        // assemble adds
        recordToLoadCollection.each(function(record, idx) {
            if (recordsIds.indexOf(record.id) == -1 && this.deleteQueue.indexOf(record.id) == -1) {
                var lastRecord = recordToLoadCollection.itemAt(idx-1),
                    lastRecordIdx = lastRecord ? recordsIds.indexOf(lastRecord.id) : -1;

                records.splice(lastRecordIdx+1, 0, record);
                recordsIds.splice(lastRecordIdx+1, 0, record.id);
            }
        }, this);

        o.records = records;
        
        // hide current records from store.loadRecords()
        // @see 0008210: email grid: set flag does not work sometimes
        this.store.clearData();
    },
    /**
     * perform the initial load of grid data
     */
    initialLoad: function() {
        var defaultFavorite = Klb.system.widgets.persistentfilter.Model.PersistentFilter.getDefaultFavorite(this.app.appName, this.recordClass.prototype.modelName);
        var favoritesPanel  = this.app.getMainScreen() 
                                && typeof this.app.getMainScreen().getWestPanel().getFavoritesPanel === 'function' 
                                && this.hasFavoritesPanel 
                            ? this.app.getMainScreen().getWestPanel().getFavoritesPanel() 
                            : null;
        if (defaultFavorite && favoritesPanel) {
            favoritesPanel.selectFilter(defaultFavorite);
        } else {
           if (! this.editDialog) {

               Ext.Function.defer(this.store.load, 10, this.store, [ typeof this.autoLoad == 'object' ? this.autoLoad : undefined]);
           } else {
               // editDialog exists, so get the records from there.
               var items = this.editDialog.record.get(this.editDialogRecordProperty);
               if (Ext.isArray(items)) {
                   Ext.each(items, function(item) {
                       var record = this.recordProxy.recordReader({responseText: Ext.encode(item)});
                       this.store.addSorted(record);
                   }, this);
               }
           }
        }

        if (this.usePagingToolbar && this.recordProxy) {
           Ext.Function.defer(this.pagingToolbar.doRefresh, 11, this);
        }
    },

    getViewAddConfig: function () {
        return {};
    },

    /**
     * init ext grid panel
     * @private
     */
    initGrid: function() {

        if (Klb.App.Api.registry.containsKey('preferences')) {
            this.gridConfig = Ext.applyIf(this.gridConfig || {}, {
                stripeRows: Klb.App.Api.registry.get('preferences').containsKey('gridStripeRows') ? Klb.App.Api.registry.get('preferences').get('gridStripeRows') : false,
                loadMask: Klb.App.Api.registry.get('preferences').containsKey('gridLoadMask') ? Klb.App.Api.registry.get('preferences').get('gridLoadMask') : false
            });
            
            // added paging number of result read from settings
            if(!this.defaultPaging || !this.defaultPaging.limit) {
                if (Klb.App.Api.registry.get('preferences').containsKey('pageSize')) {
                    this.defaultPaging = {
                        start: 0,
                        limit: parseInt(Klb.App.Api.registry.get('preferences').get('pageSize'), 10)
                    };
                }
            }
        }
        
        // generic empty text
        this.i18nEmptyText = Klb.system.translation.gettext('No data to display');
        
        // init sel model
        this.selectionModel = Ext.create('Klb.system.widgets.grid.FilterSelectionModel', {
            store: this.store,
            gridPanel: this
        });
        this.selectionModel.on('selectionchange', function(sm) {
            this.actionUpdater.updateActions(sm);

            this.ctxNode = this.selectionModel.getSelection();
            if (this.updateOnSelectionChange && this.detailsPanel) {
                this.detailsPanel.onDetailsUpdate(sm);
            }
        }, this);

        if (this.usePagingToolbar) {
            this.pagingToolbar = new Ext.ux.grid.PagingToolbar(Ext.apply({
                pageSize: this.defaultPaging && this.defaultPaging.limit ? this.defaultPaging.limit : 50,
                store: this.store,
                displayInfo: true,
                displayMsg: Klb.system.translation._('Displaying records {0} - {1} of {2}').replace(/records/, this.i18nRecordsName),
                emptyMsg:  Ext.String.format(Klb.system.translation._("No {0} to display"), Klb.system.translation._(this.i18nRecordsName)),
                displaySelectionHelper: true,
                selModel: this.selectionModel,
                disableSelectAllPages: this.disableSelectAllPages,
                nested: this.editDialog ? true : false
            }, this.pagingConfig));
            // mark next grid refresh as paging-refresh
            this.pagingToolbar.on('beforechange', function() {
                this.grid.getView().isPagingRefresh = true;
            }, this);
        }
 
        // init view
        var viewConfig =  Ext.applyIf({ // Ext.view.View Ext.view.Table Ext.grid.View Ext.grid.plugin.CellEditing
                enableTextSelection: true,
                getRowClass: this.getViewRowClass,
                autoFill: true,
                forceFit:true,
                ignoreAdd: true,
                emptyText: this.i18nEmptyText,
                onLoad: Ext.Function.createInterceptor(
                            Ext.grid.plugin.CellEditing.prototype.onLoad, function() {
                            if (this.grid.getView().isPagingRefresh) {
                                this.grid.getView().isPagingRefresh = false;
                                return true;
                            }
                            return false;
                        }, this)
        }, this.getViewAddConfig() );


        // which grid to use?
        var classNameGrid = this.gridConfig.quickaddMandatory
                            ? 'Ext.ux.grid.QuickaddGridPanel'
                            : (this.gridConfig.gridType || 'Ext.grid.Panel' );

        this.gridConfig.store = this.store;
        this.gridConfig.emptyText = this.i18nEmptyText;
        this.gridConfig.onLoad = Ext.Function.createInterceptor(Ext.grid.plugin.CellEditing.prototype.onLoad, function() {
                if (this.grid.getView().isPagingRefresh) {
                    this.grid.getView().isPagingRefresh = false;
                    return true;
                }
                return false;
            }, this);

        // activate grid header menu for column selection
        this.gridConfig.plugins = this.gridConfig.plugins ? this.gridConfig.plugins : [];
        this.gridConfig.plugins.push(new Ext.ux.grid.GridViewMenuPlugin({}));
        this.gridConfig.enableHdMenu = false;

        if (this.stateful) {
            this.gridConfig.stateful = true;
            this.gridConfig.stateId  = this.stateId + '-Grid';
        }

        var configGrid =  Ext.applyIf(this.gridConfig, {
            border: false,
            store: this.store,
            // layout: 'fit',
            multiSelect: true,
            headerBorders: false,
            stateful: true,
            selModel:   this.selectionModel,
            viewConfig: viewConfig
        });

        // this.cellEditing = new Ext.grid.plugin.CellEditing({
        //     clicksToEdit: 1
        // });
        // configGrid.plugins  = [this.cellEditing];
        this.grid = Ext.create(classNameGrid, configGrid);

        // init various grid / sm listeners
        this.grid.on('keydown',      this.onKeyDown,       this);
        this.grid.on('itemclick',    this.onRowClick,      this);
        this.grid.on('itemdblclick', this.onRowDblClick,   this);
        this.grid.on('newentry',     this.onStoreNewEntry, this);
        this.grid.on('headerclick',  this.onHeaderClick,   this);

        this.grid.on('rowcontextmenu', this.onRowContextMenu, this);
    },
    /**
     * executed after outer panel rendering process
     */
    afterRender: function() {
        this.callParent();
        this.initialLoad();
    },
    /**
     * trigger store load with grid related options
     * 
     * TODO rethink -> preserveCursor and preserveSelection might conflict on page breaks!
     * TODO don't reload details panel when selection is preserved
     */
    loadGridData: function(options) {
        var options = options || {};

        Ext.applyIf(options, {
            callback:           Ext.emptyFn,
            scope:              this,
            params:             {},

            preserveCursor:     true, 
            preserveSelection:  true, 
            preserveScroller:   true, 
            removeStrategy:     'default'
        });

        if (options.preserveCursor && this.usePagingToolbar) {
            options.params.start = this.pagingToolbar.cursor;
        }

        this.store.load(options);
    },
    /**
     * get action toolbar
     */
    getActionToolbar: function() {
        if (! this.actionToolbar) {
            var additionalItems = this.getActionToolbarItems();

            var items = [];
            if (this.action_addInNewWindow) {
                if (this.splitAddButton ) {
                    items.push(Ext.apply(
                        Ext.create('Ext.SplitButton', this.action_addInNewWindow), {
                            scale: 'medium',
                            rowspan: 2,
                            iconAlign: 'top',
                            arrowAlign:'right',
                            menu: new Ext.menu.Menu({
                                items: [],
                                  plugins: [{
                                     ptype: 'ux.itemregistry',
                                    key: 'Klb.system.widgets.grid.GridPanel.addButton'
                                }]
                            })
                        }
                        )
                    );
                } else {
                    items.push(Ext.apply(
                        new Ext.button.Button(this.action_addInNewWindow), {
                            scale: 'medium',
                            rowspan: 2,
                            iconAlign: 'top'
                        })
                    );
                }
            }

            if (this.action_editInNewWindow) {
                items.push(Ext.apply(
                    new Ext.button.Button(this.action_editInNewWindow), {
                        scale: 'medium',
                        rowspan: 2,
                        iconAlign: 'top'
                    })
                );
            }
            
            if (this.action_deleteRecord) {
                items.push(Ext.apply(
                    new Ext.button.Button(this.action_deleteRecord), {
                        scale: 'medium',
                        rowspan: 2,
                        iconAlign: 'top'
                    })
                );
            }
            
            if (this.actions_print) {
                items.push(Ext.apply(
                    new Ext.button.Button(this.actions_print), {
                        scale: 'medium',
                        rowspan: 2,
                        iconAlign: 'top'
                    })
                );
            }

            this.actionToolbar = new Ext.Toolbar({
                items: [{
                    xtype: 'buttongroup',
                    plugins: [{
                       ptype: 'ux.itemregistry',
                       key:  this.app.appName + '-' + this.recordClass.prototype.modelName+ '-GridPanel-ActionToolbar-leftbtngrp'
                    }],
                    items: items.concat(Ext.isArray(additionalItems) ? additionalItems : [])
                }].concat(Ext.isArray(additionalItems) ? [] : [additionalItems])
            });

            if (this.filterToolbar && typeof this.filterToolbar.getQuickFilterField == 'function') {
                this.actionToolbar.add('->', this.filterToolbar.getQuickFilterField());
            } 
        }

        return this.actionToolbar;
    },
    /**
     * template fn for subclasses to add custom items to action toolbar
     */
    getActionToolbarItems: function() {
        var items = this.actionToolbarItems || [];

        if (! Ext.isEmpty(items)) {
         // legacy handling! subclasses should register all actions when initializing actions
            this.actionUpdater.addActions(items);
        }
        return items;
    },
    /**
     * returns rows context menu
     */
    getContextMenu: function(grid, row, e) {

        if (! this.contextMenu) {
            var items = [];
            
            if (this.action_addInNewWindow) items.push(this.action_addInNewWindow);
            if (this.action_editCopyInNewWindow) items.push(this.action_editCopyInNewWindow);
            if (this.action_editInNewWindow) items.push(this.action_editInNewWindow);
            if (this.action_deleteRecord) items.push(this.action_deleteRecord);

            if (this.duplicateResolvable) {
                items.push(this.action_resolveDuplicates);
            }
            
            if (this.action_tagsMassAttach && ! this.action_tagsMassAttach.hidden) {
                items.push('-', this.action_tagsMassAttach, this.action_tagsMassDetach);
            }

            // lookup additional items
            items = items.concat(this.getContextMenuItems());

            // New record of another app
            this.newRecordMenu = new Ext.menu.Menu({
                items: [],
                plugins: [{
                    ptype: 'ux.itemregistry',
                    key:   this.app.appName + '-' + this.recordClass.prototype.modelName+ '-GridPanel-ContextMenu-New'
                }]
            });

            this.newRecordAction = new Ext.Action({
                text: _('New...'),
                hidden: ! this.newRecordMenu.items.length,
                iconCls: this.app.getIconCls(),
                scope: this,
                menu: this.newRecordMenu
            });

            items.push(this.newRecordAction);

            // Add to record of another app
            this.addToRecordMenu = new Ext.menu.Menu({
                items: [],
                plugins: [{
                    ptype: 'ux.itemregistry',
                    key:   this.app.appName + '-' + this.recordClass.prototype.modelName + '-GridPanel-ContextMenu-Add'
                }]
            });

            this.addToRecordAction = new Ext.Action({
                text: _('Add to...'),
                hidden: ! this.addToRecordMenu.items.length,
                iconCls: this.app.getIconCls(),
                scope: this,
                menu: this.addToRecordMenu
            });

            items.push(this.addToRecordAction);

            this.contextMenu = new Ext.menu.Menu({
                items: items,
                plugins: [{
                    ptype: 'ux.itemregistry',
                    key:   this.app.appName + '-' + this.recordClass.prototype.modelName+  '-GridPanel-ContextMenu'
                }]
            });
        }

        return this.contextMenu;
    },
    /**
     * template fn for subclasses to add custom items to context menu
     */
    getContextMenuItems: function() {
        var items = this.contextMenuItems || [];

        if (! Ext.isEmpty(items)) {
            // legacy handling! subclasses should register all actions when initializing actions
            this.actionUpdater.addActions(items);
        }

        return items;
    },
    /**
     * get modlog columns
     * 
     * shouldn' be used anymore
     * @TODO: use applicationstarter and modelconfiguration
     */
    getModlogColumns: function() {
        var result = [
            { id: 'creation_time',      header: _('Creation Time'),         dataIndex: 'creation_time',         renderer: Klb.system.Common.dateRenderer,        hidden: true, sortable: true },
            { id: 'created_by',         header: _('Created By'),            dataIndex: 'created_by',            renderer: Klb.system.Common.usernameRenderer,    hidden: true, sortable: true },
            { id: 'last_modified_time', header: _('Last Modified Time'),    dataIndex: 'last_modified_time',    renderer: Klb.system.Common.dateRenderer,        hidden: true, sortable: true },
            { id: 'last_modified_by',   header: _('Last Modified By'),      dataIndex: 'last_modified_by',      renderer: Klb.system.Common.usernameRenderer,    hidden: true, sortable: true }
        ];

        return result;
    },
    /**
     * get custom field columns for column model
     */
    getCustomfieldColumns: function() {
        var modelName = this.recordClass.getMeta('appName') + '_Model_' + this.recordClass.getMeta('modelName'),
            cfConfigs = Klb.system.widgets.customfields.ConfigManager.getConfigs(this.app, modelName),
            result = [];

        Ext.each(cfConfigs, function(cfConfig) {
            result.push({
                id: cfConfig.id,
                header: cfConfig.get('definition').label,
                dataIndex: 'customfields',
                renderer: Klb.system.widgets.customfields.Renderer.get(this.app, cfConfig),
                sortable: false,
                hidden: true
            });
        }, this);

        return result;
    },
    /**
     * get custom field filter for filter toolbar
     */
    getCustomfieldFilters: function() {
        var modelName = this.recordClass.getMeta('appName') + '_Model_' + this.recordClass.getMeta('modelName'),
            cfConfigs = Klb.system.widgets.customfields.ConfigManager.getConfigs(this.app, modelName),
            result = [];
        Ext.each(cfConfigs, function(cfConfig) {
            result.push({filtertype: 'apibase.customfield', app: this.app, cfConfig: cfConfig});
        }, this);

        return result;
    },
    /**
     * returns filter toolbar
     * @private
     */
    getFilterToolbar: function(config) {
        config = config || {};
        return this.filterToolbar ? this.filterToolbar 
                : new Klb.system.widgets.grid.FilterPanel(Ext.apply(config, {
                        app: this.app,
                        recordClass: this.recordClass,
                        filterModels: this.recordClass.getFilterModel().concat(this.getCustomfieldFilters()),
                        defaultFilter: 'query',
                        filters: this.defaultFilters || []
                 }));
    },
    /**
     * return store from grid
     */
    getStore: function() {
        return this.grid.getStore();
    },
    /**
     * return view from grid
     */
    getView: function() {
        return this.grid.getView();
    },
    /**
     * return grid
     * @return {Ext.ux.grid.QuickaddGridPanel|Ext.grid.GridPanel}
     */
    getGrid: function() {
        return this.grid;
    },

    getGridSM: function() {
        return this.grid ? this.grid.getSelectionModel() : null;
    },
    
    getGridSelection: function() {
        return this.grid ? this.getGridSM().selectAll(true) : null;
    },

    /**
     * key down handler
     * @private
     */
    onKeyDown: function(e){
        if (e.ctrlKey) {
            switch (e.getKey()) {
                case e.A:
                    // select only current page
                    this.grid.getSelectionModel().selectAll(true);
                    e.preventDefault();
                    break;
                case e.E:
                    if (this.action_editInNewWindow && !this.action_editInNewWindow.isDisabled()) {
                        this.onEditInNewWindow.call(this, {
                            actionType: 'edit'
                        });
                        e.preventDefault();
                    }
                    break;
                case e.N:
                    if (this.action_addInNewWindow && !this.action_addInNewWindow.isDisabled()) {
                        this.onEditInNewWindow.call(this, {
                            actionType: 'add'
                        });
                        e.preventDefault();
                    }
                    break;
                case e.F:
                    if (this.filterToolbar && this.hasQuickSearchFilterToolbarPlugin) {
                        e.preventDefault();
                        this.filterToolbar.getQuickFilterPlugin().quickFilter.focus();
                    }
                    break;
            }
        } else {
            if ([e.BACKSPACE, e.DELETE].indexOf(e.getKey()) !== -1) {
                if (!this.grid.editing && !this.grid.adding && !this.action_deleteRecord.isDisabled()) {
                    this.onDeleteRecords.call(this);
                    e.preventDefault();
                }
            }
        }
    },
    /**
     * row click handler
     * 
     */
    onRowClick: function(grid, row, e) {

        // fix selection of one record if shift/ctrl key is not pressed any longer
        if (e.button === 0 && !e.shiftKey && !e.ctrlKey) {
            var sm = grid.getSelectionModel();

            if (sm.getCount() == 1 && sm.isSelected(row)) {
                return;
            }

            sm.clearSelections();
            sm.selectRow(row, false);
            grid.view.focusRow(row);
        }
    },
    /**
     * row doubleclick handler
     */
    onRowDblClick: function(grid, record, item, index, e, eOpts) {

         this.action_editInNewWindow.setDisabled(false);
         this.onEditInNewWindow.call(this, { actionType: 'edit'} );
    }, 
    /**
     * called on row context click
     */
    onRowContextMenu: function(grid, record, item, index, e, eOpts) {
        e.stopEvent();
        var sm = grid.getSelectionModel();
        if (!sm.isSelected(record)) {
            // disable preview update if config option is set to false
            this.updateOnSelectionChange = this.updateDetailsPanelOnCtxMenu;
            sm.select(record);
        }

        this.getContextMenu(grid, record, e).showAt(e.getXY());
        // reset preview update
        this.updateOnSelectionChange = true;
    },
    /**
     * Opens the required EditDialog
     */
    onEditInNewWindow: function(button, view, record, plugins, additionalConfig) {
        if (! record) {
            if (button.actionType == 'edit' || button.actionType == 'copy') {
                if (! this.action_editInNewWindow || this.action_editInNewWindow.isDisabled()) {
                    // if edit action is disabled or not available, we also don't open a new window
                    return false;
                }
                var selectedRows = this.grid.getSelectionModel().getSelection();
                record = selectedRows[0];
            } else {
                record = new this.recordClass(this.recordClass.getDefaultData(), 0);
            }
        }

        // plugins to add to edit dialog
        var plugins = plugins ? plugins : [];
        var totalcount = this.selectionModel.getCount(),
            selectedRecords = [],
            fixedFields = (button.hasOwnProperty('fixedFields') && Ext.isObject(button.fixedFields)) ? Ext.encode(button.fixedFields) : null,
            editDialogClass = this.editDialogClass || Klb.App[this.app.appName].getMVC('EditDialog'),
            additionalConfig = additionalConfig ? additionalConfig : {};
            // editDialog =  Ext.create(editDialogClass, {});


        // add "multiple_edit_dialog" plugin to dialog, if required
        if (((totalcount > 1) && (this.multipleEdit) && (button.actionType == 'edit'))) {

            Ext.each(this.selectionModel.getSelections(), function(record) {
                selectedRecords.push(record.data);
            }, this );

            plugins.push({
                ptype: 'multiple_edit_dialog', 
                selectedRecords: selectedRecords,
                selectionFilter: this.selectionModel.getSelectionFilter(),
                isFilterSelect: this.selectionModel.isFilterSelect,
                totalRecordCount: totalcount
            });
        }

        var popupWindow = Ext.ClassManager.get(editDialogClass).openWindow(Ext.copyTo(
            this.editDialogConfig || {}, {
                plugins: plugins ? Ext.encode(plugins) : null,
                fixedFields: fixedFields,
                additionalConfig: Ext.encode(additionalConfig),
                record: record  ?  record : null, // editDialogClass.prototype.mode == 'local' ? Ext.encode(record.data) :
                copyRecord: (button.actionType == 'copy'),
                listeners: {
                    scope: this,
                    'update': ((this.selectionModel.getCount() > 1) && (this.multipleEdit)) ? this.onUpdateMultipleRecords : this.onUpdateRecord
                }
            }, 'record,listeners,fixedFields,copyRecord,plugins,additionalConfig')
        );
        return true;
    },
    /**
     * is called after multiple records have been updated
     */
    onUpdateMultipleRecords: function() {

        this.store.reload();
    },
    /**
     * on update after edit
     */
    onUpdateRecord: function(record, mode) {
        
        if (! this.rendered) {
            return;
        }
        
        if (Ext.isString(record) && this.recordProxy) {
            record = this.recordProxy.recordReader({responseText: record});
        } else if (record && Ext.isFunction(record.copy)) {
            record = record.copy();
        }

        Klb.Logger.debug('Klb.system.widgets.grid.GridPanel::onUpdateRecord() -> record:');

        if (record && Ext.isFunction(record.copy)) {
            var idx = this.getStore().indexOfId(record.id);
            if (idx >=0) {
                var isSelected = this.getGrid().getSelectionModel().isSelected(idx);
                this.getStore().removeAt(idx);
                this.getStore().insert(idx, [record]);

                if (isSelected) {
                    this.getGrid().getSelectionModel().selectByPosition(idx, true);
                }
            } else {
                this.getStore().add([record]);
            }
            this.addToEditBuffer(record);
        }

        if (mode == 'local') {
            this.onStoreUpdate(this.getStore(), record, Ext.data.Model.EDIT);
        } else {
            this.loadGridData({
                removeStrategy: 'keepBuffered'
            });
        }
    },
    /**
     * is called to resolve conflicts from 2 records
     */
    onResolveDuplicates: function() {
        // TODO: allow more than 2 records 
        if (this.grid.getSelectionModel().getSelection().length != 2) return;
        
        var selections = [];
        Ext.each(this.grid.getSelectionModel().getSelection(), function(sel) {
            selections.push(sel.data);
        });
        
        var window = Klb.system.widgets.dialog.DuplicateMergeDialog.getWindow({
            selections: Ext.encode(selections),
            appName: this.app.name,
            modelName: this.recordClass.getMeta('modelName')
        });
        
        window.on('contentschange', function() { this.store.reload(); }, this);
    },
    /**
     * add record to edit buffer
     */
    addToEditBuffer: function(record) {

        var recordData = (Ext.isString(record)) ? Ext.decode(record) : record.data,
            id = recordData[this.recordClass.getMeta('idProperty')];

        if (this.editBuffer.indexOf(id) === -1) {
            this.editBuffer.push(id);
        }
    },
    /**
     * generic delete handler
     */
    onDeleteRecords: function(btn, e) {
        var sm = this.grid.getSelectionModel();

        if (sm.isFilterSelect && ! this.filterSelectionDelete) {
            Ext.MessageBox.show({
                title: _('Not Allowed'), 
                msg: _('You are not allowed to delete all pages at once'),
                buttons: Ext.Msg.OK,
                icon: Ext.MessageBox.INFO
            });

            return;
        }
        var records = sm.getSelections();

        if (Klb.App[this.app.appName].registry.containsKey('preferences') 
            && Klb.App[this.app.appName].registry.get('preferences').containsKey('confirmDelete')
            && Klb.App[this.app.appName].registry.get('preferences').get('confirmDelete') == 0
        ) {
            // don't show confirmation question for record deletion
            this.deleteRecords(sm, records);
        } else {
            var recordNames = records[0].get(this.recordClass.getMeta('titleProperty'));
            if (records.length > 1) {
                recordNames += ', ...';
            }
            var i18nQuestion = this.i18nDeleteQuestion ?
                this.app.i18n.n_hidden(this.i18nDeleteQuestion[0], this.i18nDeleteQuestion[1], records.length) :
                 Ext.String.format(Klb.system.translation.ngettext('Do you really want to delete the selected record ({0})?',
                    'Do you really want to delete the selected records ({0})?', records.length), recordNames);

            Ext.MessageBox.confirm(_('Confirm'), i18nQuestion, function(btn) {
                if (btn == 'yes') {
                    this.deleteRecords(sm, records);
                }
            }, this);
        }
    },
    /**
     * delete records
     */
    deleteRecords: function(sm, records) {
        // directly remove records from the store (only for non-filter-selection)
        if (Ext.isArray(records) && ! (sm.isFilterSelect && this.filterSelectionDelete)) {
            Ext.each(records, function(record) {
                this.store.remove(record);
            });
            // if nested in an editDialog, just change the parent record
            if (this.editDialog) {
                var items = [];
                this.store.each(function(item) {
                    items.push(item.data);
                });
                this.editDialog.record.set(this.editDialogRecordProperty, items);
                this.editDialog.fireEvent('updateDependent');
                return;
            }
        }

        if (this.recordProxy) {
            if (this.usePagingToolbar) {
                this.pagingToolbar.disable();
            }

            var i18nItems = this.app.i18n.n_hidden(this.recordClass.getMeta('recordName'), this.recordClass.getMeta('recordsName'), records.length),
                recordIds = [].concat(records).map(function(v){ return v.id; });

            if (sm.isFilterSelect && this.filterSelectionDelete) {
                if (! this.deleteMask) {
                    this.deleteMask = new Ext.LoadMask(this.grid.getEl(), {
                        msg:  Ext.String.format(_('Deleting {0}'), i18nItems) + _(' ... This may take a long time!')
                    });
                }
                this.deleteMask.show();
            }

            this.deleteQueue = this.deleteQueue.concat(recordIds);

            var options = {
                scope: this,
                success: function() {
                    this.refreshAfterDelete(recordIds);
                    this.onAfterDelete(recordIds);
                },
                failure: function (exception) {
                    this.refreshAfterDelete(recordIds);
                    this.loadGridData();
                    Klb.system.ExceptionHandler.handleRequestException(exception);
                }
            };

            if (sm.isFilterSelect && this.filterSelectionDelete) {
                this.recordProxy.deleteRecordsByFilter(sm.getSelectionFilter(), options);
            } else {
                this.recordProxy.deleteRecords(records, options);
            }
        }
    },
    /**
     * refresh after delete (hide delete mask or refresh paging toolbar)
     */
    refreshAfterDelete: function(ids) {
        this.deleteQueue = this.deleteQueue.diff(ids);

        if (this.deleteMask) {
            this.deleteMask.hide();
        }

        if (this.usePagingToolbar) {
            this.pagingToolbar.show();
        }
    },
    /**
     * do something after deletion of records
     * - reload the store
     */
    onAfterDelete: function(ids) {
        this.editBuffer = this.editBuffer.diff(ids);
        this.loadGridData({
            removeStrategy: 'keepBuffered'
        });
    }
});
