/*
 * Modern 3.1.0
 * 
 * @license     http://www.gnu.org/licenses/agpl.html AGPL Version 3
 * @author      Cornelius Weiss <c.weiss@metaways.de>
 * @copyright   Copyright (c) 2007-2013 Metaways Infosystems GmbH (http://www.metaways.de)
 */
Ext.ns('Klb.system.widgets.dialog');

/**
 * Generic 'Edit Record' dialog
 * Base class for all 'Edit Record' dialogs
 * 
 * @namespace   Klb.system.widgets.dialog
 * @class       Klb.system.widgets.dialog.EditDialog
 * @extends     Ext.form.Panel
 * @author      Cornelius Weiss <c.weiss@metaways.de>
 * @constructor
 * @param {Object} config The configuration options.
 */

Ext.define('Klb.system.widgets.dialog.EditDialog', {
    extend: 'Ext.form.Panel',
    xtype: 'klbeditdialog',
    requires: [
          'Ext.ux.TabPanelKeyPlugin',
          'Ext.ux.form.MirrorTextField',
          'Ext.ux.form.ColumnFormPanel',
          'Klb.system.widgets.dialog.TokenModeEditDialogPlugin',
          'Klb.system.widgets.customfields.EditDialogPlugin',
          'Klb.system.widgets.tags.TagsPanel',
          'Klb.system.widgets.relation.GenericPickerGridPanel',
          'Klb.system.widgets.dialog.AttachmentsGridPanel',
          'Klb.system.widgets.grid.FileUploadGrid'
    ],
    /**
     * @cfg {Klb.system.Application} app
     * instance of the app object (required)
     */
    app: null,
    /**
     * @cfg {String} mode
     * Set to 'local' if the EditDialog only operates on this.record (defaults to 'remote' which loads and saves using the recordProxy)
     */
    mode: 'remote',
    /**
     * @cfg {Array} tbarItems
     * additional toolbar items (defaults to false)
     */
    tbarItems: false,
    /**
     * internal/untranslated app name (required)
     * 
     * @cfg {String} appName
     */
    appName: null,
    /**
     * the modelName (filled by application starter)
     * 
     * @type {String} modelName
     */
    modelName: null,
    
    /**
     * record definition class  (required)
     * 
     * @cfg {Ext.data.Model} recordClass
     */
    recordClass: null,
    /**
     * @cfg {Ext.data.DataProxy} recordProxy
     */
    recordProxy: null,
    /**
     * @cfg {Bool} showContainerSelector
     * show container selector in bottom area
     */
    showContainerSelector: null,
    /**
     * @cfg {Bool} evalGrants
     * should grants of a grant-aware records be evaluated (defaults to true)
     */
    evalGrants: true,
    /**
     * @cfg {Ext.data.Model} record
     * record in edit process.
     */
    record: null,
    
    /**
     * holds the modelConfig for the handled record (json-encoded object)
     * will be decoded in initComponent
     * 
     * @type 
     */
    modelConfig: null,
    
    /**
     * @cfg {String} saveAndCloseButtonText
     * text of save and close button
     */
    saveAndCloseButtonText: '',
    /**
     * @cfg {String} cancelButtonText
     * text of cancel button
     */
    cancelButtonText: '',
    
    /**
     * @cfg {Boolean} copyRecord
     * copy record
     */
    copyRecord: false,
    
    /**
     * @cfg {Boolean} doDuplicateCheck
     * do duplicate check when saving record (mode remote only)
     */
    doDuplicateCheck: true,
    
    /**
     * required grant for apply/save
     * @type String
     */
    editGrant: 'editGrant',

    /**
     * when a record has the relations-property the relations-panel can be disabled here
     * @cfg {Boolean} hideRelationsPanel
     */
    hideRelationsPanel: false,
    
    /**
     * when a record has the attachments-property the attachments-panel can be disabled here
     * @cfg {Boolean} hideAttachmentsPanel
     */
    hideAttachmentsPanel: false,
    
    /**
     * Registry for other relationgridpanels than the generic one,
     * handling special types of relations the generic one will not.
     * Panels registered here must have a store with the relation records.
     * 
     * @type {Array}
     */
    relationPanelRegistry: null,
    
    /**
     * ignore relations to given php-class names in the relation grid
     * @type {Array}
     */
    ignoreRelatedModels: null,
    
    /**
     * dialog is currently saving data
     * @type Boolean
     */
    saving: false,
    
    /**
     * Disable adding cf tab even if model has support for customfields
     * @type Boolean
     */
    disableCfs: false,
    
    /**
     * @property window {Klb.abstract.Window|Ext.ux.PopupWindow|Ext.Air.Window}
     */
    /**
     * @property {Number} loadRequest 
     * transaction id of loadData request
     */
    /**
     * @property loadMask {Ext.LoadMask}
     */
    
    /**
     * @property containerSelectCombo {Klb.system.widgets.container.selectionComboBox}
     */
    containerSelectCombo: null,
    
    /**
     * If set, these fields are readOnly (when called dependent to related record)
     * 
     * @type {Ext.util.MixedCollection}
     */
    fixedFields: null,

    /**
     * Plain Object with additional configuration (JSON-encoded)
     * 
     * @type {Object}
     */
    additionalConfig: null,
    
    // private
    bodyStyle:'padding:5px',
    layout: 'fit',
    border: false,
    anchor:'100% 100%',
    deferredRender: false,
    buttonAlign: null,
    bufferResize: 500,

    /**
     * relations panel
     * 
     * @type Klb.system.widgets.relation.GenericPickerGridPanel
     */
    relationsPanel: null,
    
    // Array of Relation Pickers
    relationPickers: null,
    
    /**
     * attachments panel
     * 
     * @type Klb.system.widgets.dialog.AttachmentsGridPanel
     */
    attachmentsPanel: null,
    
    /**
     * holds the loadMask
     * set this to false, if no loadMask should be shown
     * 
     * @type {Ext.LoadMask}
     */
    loadMask: null,

    /**
     * hook notes panel into dialog
     */
    displayNotes: false,

    //private
    initComponent: function() {
        this.relationPanelRegistry = this.relationPanelRegistry ? this.relationPanelRegistry : [];

        if (Ext.isString(this.modelConfig)) {
            this.modelConfig = Ext.decode(this.modelConfig);
        }
        
        if (Ext.isString(this.additionalConfig)) {
            Ext.apply(this, Ext.decode(this.additionalConfig));
        }
        
        if (Ext.isString(this.fixedFields)) {
            var decoded = Ext.decode(this.fixedFields);
            this.fixedFields = new Ext.util.MixedCollection();
            this.fixedFields.addAll(decoded);
        }
        
        if (! this.recordClass && this.modelName) {
            this.recordClass = Klb.App[this.appName].Model[this.modelName];
        }
        
        if (this.recordClass) {
            this.appName    = this.appName    ? this.appName    : this.recordClass.getMeta('appName');
            this.modelName  = this.modelName  ? this.modelName  : this.recordClass.getMeta('modelName');
        }
        
        if (! this.app) {
            this.app = Klb.system.appMgr.get(this.appName);
        }
        
        if (! this.windowNamePrefix) {
            this.windowNamePrefix = this.modelName + 'EditWindow_';
        }

    Klb.Logger.debug('initComponent: appName: ', this.appName);
    Klb.Logger.debug('initComponent: modelName: ', this.modelName);
    Klb.Logger.debug('initComponent: app: ', this.app);

        // init some translations
        if (this.app.i18n && this.recordClass !== null) {
            this.i18nRecordName = this.app.i18n.n_hidden(this.recordClass.getMeta('recordName'), this.recordClass.getMeta('recordsName'), 1);
            this.i18nRecordsName = this.app.i18n._hidden(this.recordClass.getMeta('recordsName'));
        }
    
        if (! this.recordProxy && this.recordClass) {
            Klb.Logger.debug('no record proxy given, creating a new one...');
            this.recordProxy = Ext.create('Klb.system.data.RecordProxy', {
                recordClass: this.recordClass
            });
        }
        // init plugins
        this.plugins = Ext.isString(this.plugins) ? Ext.decode(this.plugins) : Ext.isArray(this.plugins) ? this.plugins.concat(Ext.decode(this.initialConfig.plugins)) : [];
        
        // this.plugins.push(this.tokenModePlugin = new Klb.system.widgets.dialog.TokenModeEditDialogPlugin({}));
        // added possibility to disable using customfield plugin
        if (this.disableCfs !== true) {
            // this.plugins.push(new Klb.system.widgets.customfields.EditDialogPlugin({}));
        }
        
        // init actions
        this.initActions();
        // init buttons and tbar
        this.initButtons();
        // init container selector
        this.initContainerSelector();
        // init record 
        this.initRecord();
        // get items for this dialog
        this.items = this.getFormItems();

        // init relations panel if relations are defined
        this.initRelationsPanel();
        // init attachments panel
        this.initAttachmentsPanel();
        // init notes panel
        this.initNotesPanel();

        this.callParent();
        
        // set fields readOnly if set
        this.fixFields();
        
        // firefox fix: blur each item before tab changes, so no field  will be focused afterwards
        if (Ext.isGecko) {
            this.items.items[0].addListener('beforetabchange', function(tabpanel, newtab, oldtab) {
                if (! oldtab) {
                    return;
                }
                var form = this.getForm();
                
                if (form && form.hasOwnProperty('items'))
                    form.items.each(function(item, index) {
                        item.blur();
                    });
            }, this);
        }
    },

    /**
     * fix fields (used for preselecting form fields when called in dependency to another record)
     * @return {Boolean}
     */
    fixFields: function() {
        if (this.fixedFields && this.fixedFields.getCount() > 0) {
            if (! this.rendered) {
                Ext.Function.defer( this.fixFields, 100, this);
                return false;
            }
            
            this.fixedFields.each(function(value, index) {
                var key = this.fixedFields.keys[index]; 
                
                var field = this.getForm().findField(key);
                
                if (field) {
                    if (Ext.isFunction(this.recordClass.getField(key).type)) {
                        var foreignRecordClass = this.recordClass.getField(key).type;
                        var record = new foreignRecordClass(value);
                        field.selectedRecord = record;
                        field.setValue(value);
                        field.fireEvent('select');
                    } else {
                        field.setValue(value);
                    }
                    field.disable();
                }
            }, this);
        }
    },

    /**
     * Get available model for given application
     *
     *  @param {Mixed} application
     *  @param {Boolean} customFieldModel
     */
    getApplicationModels: function (application, customFieldModel) {
        var models      = [],
            useModel,
            appName     = Ext.isString(application) ? application : application.get('name'),
            app         = Klb.system.appMgr.get(appName),
            trans       = app && app.i18n ? app.i18n : Klb.system.translation,
            appModels   = Klb.App[appName].Model;

        if (appModels) {
            for (var model in appModels) {
                if (appModels.hasOwnProperty(model) && typeof appModels[model].getMeta === 'function') {
                    if (customFieldModel && appModels[model].getField('customfields')) {
                        useModel = appModels[model].getMeta('appName') + '_Model_' + appModels[model].getMeta('modelName');

                        Klb.Logger.info('Found model with customfields property: ' + useModel);
                        models.push([useModel, trans.n_(appModels[model].getMeta('recordName'), appModels[model].getMeta('recordsName'), 1)]);
                    } else if (! customFieldModel) {
                        useModel = 'Klb.' + appModels[model].getMeta('appName') + '.Model.' + appModels[model].getMeta('modelName');

                        Klb.Logger.info('Found model: ' + useModel);
                        models.push([useModel, trans.n_(appModels[model].getMeta('recordName'), appModels[model].getMeta('recordsName'), 1)]);
                    }
                }
            }
        }
        return models;
    },

    /**
     * init actions
     */
    initActions: function() {
        this.action_saveAndClose = new Ext.Action({
            requiredGrant: this.editGrant,
            text: (this.saveAndCloseButtonText != '') ? this.app.i18n._(this.saveAndCloseButtonText) : _('Ok'),
            minWidth: 70,
            ref: '../btnSaveAndClose',
            scope: this,
            // TODO: remove the defer when all subpanels use the deferByTicket mechanism
            handler: function() { Ext.Function.defer( this.onSaveAndClose, 500, this); },
            iconCls: 'action_saveAndClose'
        });
    
        this.action_applyChanges = new Ext.Action({
            requiredGrant: this.editGrant,
            text: _('Apply'),
            minWidth: 70,
            ref: '../btnApplyChanges',
            scope: this,
            handler: this.onApplyChanges,
            iconCls: 'action_applyChanges'
        });
        
        this.action_cancel = new Ext.Action({
            text: (this.cancelButtonText != '') ? this.app.i18n._(this.cancelButtonText) : _('Cancel'),
            minWidth: 70,
            scope: this,
            handler: this.onCancel,
            iconCls: 'action_cancel'
        });
        
        this.action_delete = new Ext.Action({
            requiredGrant: 'deleteGrant',
            text: _('delete'),
            minWidth: 70,
            scope: this,
            handler: this.onDelete,
            iconCls: 'action_delete',
            disabled: true
        });
    },
    
    /**
     * init buttons
     * 
     * use button order from preference
     */
    initButtons: function () {
        this.fbar = [
            '->'
        ];
        
        if (Klb.App.Api.registry && Klb.App.Api.registry.get('preferences') && Klb.App.Api.registry.get('preferences').get('dialogButtonsOrderStyle') === 'Windows') {
            this.fbar.push(this.action_saveAndClose, this.action_cancel);
        } else {
            this.fbar.push(this.action_cancel, this.action_saveAndClose);
        }
       
        if (this.tbarItems) {
            this.tbar = new Ext.Toolbar({
                items: this.tbarItems
            });
        }
    },
    
    /**
     * init container selector
     */
    initContainerSelector: function() {
        if (this.showContainerSelector) {
            this.containerSelectCombo = Ext.create('Klb.system.widgets.container.selectionComboBox', {
                id: this.app.appName + 'EditDialogContainerSelector-' + Ext.id(),
                // fieldLabel: _('Saved in'),
                width: 300,
                listWidth: 300,
                name: this.recordClass.getMeta('containerProperty'),
                recordClass:   this.recordClass,
                containerName: this.app.i18n.n_hidden(this.recordClass.getMeta('containerName'), this.recordClass.getMeta('containersName'), 1),
                containersName: this.app.i18n._hidden(this.recordClass.getMeta('containersName')),
                appName: this.app.appName,
                requiredGrant: this.evalGrants ? 'addGrant' : false,
                disabled: this.isContainerSelectorDisabled(),
                listeners: {
                    scope: this,
                    'select': function() {
                        // enable or disable save button dependent to containers account grants
                        var grants = this.containerSelectCombo.selectedContainer ? this.containerSelectCombo.selectedContainer.account_grants : {};
                        // on edit check editGrant, on add check addGrant
                        if (this.record.data.id) {  // edit if record has already an id
                            var disable = grants.hasOwnProperty('editGrant') ? ! grants.editGrant : false;
                        } else {
                            var disable = grants.hasOwnProperty('addGrant') ? ! grants.addGrant : false;
                        }
                        this.action_saveAndClose.setDisabled(disable);
                    }
                }
            });

            // this.on('render', function() {  this.add(this.containerSelectCombo);  }, this);

            this.fbar = [
                _('Saved in'),
                this.containerSelectCombo
            ].concat(this.fbar);
        }
        
    },
    
    /**
     * checks if the container selector should be disabled (dependent on account grants of the container itself)
     * @return {}
     */
    isContainerSelectorDisabled: function() {
        if (this.record) {
            var cp = this.recordClass.getMeta('containerProperty'),
                container = this.record.data[cp],
                grants = (container && container.hasOwnProperty('account_grants')) ? container.account_grants : null,
                cond = false;

            // check grants if record already exists and grants should be evaluated
            if(this.evalGrants && this.record.data.id && grants) {
                cond = ! (grants.hasOwnProperty('editGrant') && grants.editGrant);
            }

            return cond;
        }

        return false;
    },
    
    /**
     * init record to edit
     */
    initRecord: function() {
        Klb.Logger.debug('init record with mode: ' + this.mode);
        if (! this.record) {
            Klb.Logger.debug('creating new default data record');
            this.record = new this.recordClass(this.recordClass.getDefaultData(), 0);
        }
        
        if (this.mode !== 'local') {
            if (this.record && this.record.id) {
                this.loadRemoteRecord();
            } else {
                this.onRecordLoad();
            }
        } else {
            // note: in local mode we expect a valid record
            if (! Ext.isFunction(this.record.beginEdit)) {
                this.record = this.recordProxy.recordReader({responseText: this.record});
            }
            this.onRecordLoad();
        }
    },
    
    /**
     * load record via record proxy
     */
    loadRemoteRecord: function() {
        Klb.Logger.info('initiating record load via proxy');
        this.loadRequest = this.recordProxy.loadRecord(this.record, {
            scope: this,
            success: function(record) {
                this.record = record;
                this.onRecordLoad();
            }
        });
    },

    /**
     * copy this.record record
     */
    doCopyRecord: function() {
        this.record = this.doCopyRecordToReturn(this.record);
    },

    /**
     * Copy record and returns "new record with same settings"
     *
     * @param record
     */
    doCopyRecordToReturn: function(record) {
        var omitFields = this.recordClass.getMeta('copyOmitFields') || [];
        // always omit id + notes + attachments
        omitFields = omitFields.concat(['id', 'notes', 'attachments', 'relations']);

        var fieldsToCopy = this.recordClass.prototype.getFieldNames().diff(omitFields),
            recordData = Ext.copyTo({}, record.data, fieldsToCopy);

        var resetProperties = {
            alarms:    ['id', 'record_id', 'sent_time', 'sent_message'],
            relations: ['id', 'own_id', 'created_by', 'creation_time', 'last_modified_by', 'last_modified_time']
        };

        var setProperties = {alarms: {sent_status: 'pending'}};

        Ext.iterate(resetProperties, function(property, properties) {
            if (recordData.hasOwnProperty(property)) {
                var r = recordData[property];
                for (var index = 0; index < r.length; index++) {
                    Ext.each(properties,
                        function(prop) {
                            r[index][prop] = null;
                        }
                    );
                }
            }
        });

        Ext.iterate(setProperties, function(property, properties) {
            if (recordData.hasOwnProperty(property)) {
                var r = recordData[property];
                for (var index = 0; index < r.length; index++) {
                    Ext.iterate(properties,
                        function(prop, value) {
                            r[index][prop] = value;
                        }
                    );
                }
            }
        });

        return new this.recordClass(recordData, 0);
    },

    
    /**
     * executed after record got updated from proxy
     */
    onRecordLoad: function() {
        // interrupt process flow until dialog is rendered
        if (! this.rendered) {
            Ext.Function.defer( this.onRecordLoad, 250, this);
            return;
        }
        Klb.Logger.debug('Klb.system.widgets.dialog.EditDialog::onRecordLoad() - Loading of the following record completed:');

        if (this.copyRecord) {
            this.doCopyRecord();
            this.setTitle( Ext.String.format(_('Copy {0}'), this.i18nRecordName));
        } else {
            if (! this.record.id) {
                this.setTitle( Ext.String.format(_('Add New {0}'), this.i18nRecordName));
            } else {
                this.setTitle( Ext.String.format(_('Edit {0} "{1}"'), this.i18nRecordName, this.record.getTitle()));
            }
        }
        
        var ticketFn = this.onAfterRecordLoad.deferByTickets(this),
            wrapTicket = ticketFn();
        
        this.fireEvent('load', this, this.record, ticketFn);
        wrapTicket();
    },
    
    // finally load the record into the form
    onAfterRecordLoad: function() {
        var form = this.getForm();
        
        if (form) {
            form.loadRecord(this.record);
            form.clearInvalid();
        }
        
        if (this.record && this.record.hasOwnProperty('data') && Ext.isObject(this.record.data[this.recordClass.getMeta('containerProperty')])) {
            this.updateToolbars(this.record, this.recordClass.getMeta('containerProperty'));
        }
        
        // add current timestamp as id, if this is a dependent record 
        if (this.modelConfig && this.modelConfig.isDependent == true && this.record.id == 0) {
            this.record.set('id', (new Date()).getTime());
        }
        
        if (this.loadMask) {
            this.loadMask.hide();
        }
    },
    
    /**
     * executed when record gets updated from form
     */
    onRecordUpdate: function() {
        var form = this.getForm();

        // merge changes from form into record
        form.updateRecord(this.record);
    },
    
    /**
     * @private
     */
    onRender : function(ct, position){
        Klb.system.widgets.dialog.EditDialog.superclass.onRender.call(this, ct, position);
        
        // generalized keybord map for edit dlgs
        new Ext.KeyMap(this.el, [
            {
                key: [10,13], // ctrl + return
                ctrl: true,
                scope: this,
                fn: function() {
                    if (this.getForm().hasOwnProperty('items')) {
                        // force set last selected field
                        this.getForm().items.each(function(item) {
                            if (item.hasFocus) {
                                item.setValue(item.getRawValue());
                            }
                        }, this);
                    }
                    this.action_saveAndClose.execute();
                }
            }
        ]);
        
        if (this.loadMask !== false && this.i18nRecordName) {
            this.loadMask = new Ext.LoadMask({ target: ct.component, msg:  Ext.String.format(_('Transferring {0}...'), this.i18nRecordName)});
            this.loadMask.show();
        }
    },
    
    /**
     * update (action updateer) top and bottom toolbars
     */
    updateToolbars: function(record, containerField) {
        if (! this.evalGrants) {
            return;
        }
        
        var actions = [
            this.action_saveAndClose,
            this.action_applyChanges,
            this.action_delete,
            this.action_cancel
        ];
        Klb.system.widgets.actionUpdater(record, actions, containerField);
        Klb.system.widgets.actionUpdater(record, this.tbarItems, containerField);
    },
    
    /**
     * get top toolbar
     */
    getToolbar: function() {
        return this.getTopToolbar();
    },
    
    /**
     * is form valid?
     * 
     * @return {Boolean}
     */
    isValid: function() {
        return this.getForm().isValid();
    },
    
    /**
     * vaidates on multiple edit
     * 
     * @return {Boolean}
     */
    isMultipleValid: function() {
        return true;
    },
    
    /**
     * @private
     */
    onCancel: function(){
        this.fireEvent('cancel');
        this.clearListeners();
        this.window.close();
    },
    
    /**
     * @private
     */
    onSaveAndClose: function() {
        this.fireEvent('saveAndClose');
        this.onApplyChanges(true);
    },
    
    /**
     * generic apply changes handler
     * @param {Boolean} closeWindow
     */
    onApplyChanges: function(closeWindow) {
        if (this.saving) {
            return;
        }
        this.saving = true;
        this.loadMask.show();

        var ticketFn = this.doApplyChanges.deferByTickets(this, [closeWindow]),
            wrapTicket = ticketFn();

        this.fireEvent('save', this, this.record, ticketFn);
        wrapTicket();
    },
    
    /**
     * is called from onApplyChanges
     * @param {Boolean} closeWindow
     */
    doApplyChanges: function(closeWindow) {
        // we need to sync record before validating to let (sub) panels have 
        // current data of other panels
        this.onRecordUpdate();
        
        // quit copy mode
        this.copyRecord = false;
 
        if (this.isValid()) {
            if (this.mode !== 'local') {
                this.recordProxy.saveRecord(this.record, {
                    scope: this,
                    success: function(record) {
                        // override record with returned data
                        this.record = record;
                        if (! Ext.isFunction(this.window.cascade)) {
                            // update form with this new data
                            // NOTE: We update the form also when window should be closed,
                            //       cause sometimes security restrictions might prevent
                            //       closing of native windows
                            this.onRecordLoad();
                        }
                        var ticketFn = this.onAfterApplyChanges.deferByTickets(this, [closeWindow]),
                            wrapTicket = ticketFn();
                            
                        this.fireEvent('update', Ext.util.JSON.encode(this.record.data), this.mode, this, ticketFn);
                        wrapTicket();
                    },
                    failure: this.onRequestFailed,
                    timeout: 300000 // 5 minutes
                }, {
                    duplicateCheck: this.doDuplicateCheck
                });
            } else {
                this.onRecordLoad();
                var ticketFn = this.onAfterApplyChanges.deferByTickets(this, [closeWindow]),
                    wrapTicket = ticketFn();
                    
                this.fireEvent('update', Ext.util.JSON.encode(this.record.data), this.mode, this, ticketFn);
                wrapTicket();
            }
        } else {
            this.saving = false;
            this.loadMask.hide();
            Ext.MessageBox.alert(_('Errors'), this.getValidationErrorMessage());
        }
    },
    
    onAfterApplyChanges: function(closeWindow) {
        this.window.rename(this.windowNamePrefix + this.record.id);
        this.loadMask.hide();
        this.saving = false;

        if (closeWindow) {
            this.window.fireEvent('saveAndClose');
            this.clearListeners();
            this.window.close();
        }
    },
    
    /**
     * get validation error message
     * 
     * @return {String}
     */
    getValidationErrorMessage: function() {
        return _('Please fix the errors noted.');
    },
    
    /**
     * generic delete handler
     */
    onDelete: function(btn, e) {
        Ext.MessageBox.confirm(_('Confirm'),  Ext.String.format(_('Do you really want to delete this {0}?'), this.i18nRecordName), function(_button) {
            if(btn == 'yes') {
                var deleteMask = new Ext.LoadMask(this.getEl(), {msg:  Ext.String.format(_('Deleting {0}'), this.i18nRecordName)});
                deleteMask.show();
                
                this.recordProxy.deleteRecords(this.record, {
                    scope: this,
                    success: function() {
                        this.clearListeners();
                        this.window.close();
                    },
                    failure: function () {
                        Ext.MessageBox.alert(_('Failed'),  Ext.String.format(_('Could not delete {0}.'), this.i18nRecordName));
                        Ext.MessageBox.hide();
                    }
                });
            }
        });
    },
    
    /**
     * duplicate(s) found exception handler
     * 
     * @param {Object} exception
     */
    onDuplicateException: function(exception) {
        var resolveGridPanel = new Klb.system.widgets.dialog.DuplicateResolveGridPanel({
            app: this.app,
            store: new Klb.system.widgets.dialog.DuplicateResolveStore({
                app: this.app,
                recordClass: this.recordClass,
                recordProxy: this.recordProxy,
                data: {
                    clientRecord: exception.clientRecord,
                    duplicates: exception.duplicates
                }
            }),
            fbar: [
                '->',
                this.action_cancel,
                this.action_saveAndClose
            ]
        });
        
        // intercept save handler
        resolveGridPanel.btnSaveAndClose.setHandler(function(btn, e) {
            var resolveStrategy = resolveGridPanel.store.resolveStrategy;
            
            // action discard -> close window
            if (resolveStrategy == 'discard') {
                return this.onCancel();
            }
            
            this.record = resolveGridPanel.store.getResolvedRecord();
            
            // quit copy mode before populating form with resolved data
            this.copyRecord = false;
            this.onRecordLoad();
            
            mainCardPanel.layout.setActiveItem(this.id);
            resolveGridPanel.doLayout();
            
            this.doDuplicateCheck = false;
            this.onSaveAndClose();
        }, this);
        
        // place in viewport
        this.window.setTitle( Ext.String.format(_('Resolve Duplicate {0} Suspicion'), this.i18nRecordName));
        var mainCardPanel = this.findParentBy(function(p) {return p.isWindowMainCardPanel });
        mainCardPanel.add(resolveGridPanel);
        mainCardPanel.layout.setActiveItem(resolveGridPanel.id);
        resolveGridPanel.doLayout();
    },
    
    /**
     * generic request exception handler
     * 
     * @param {Object} exception
     */
    onRequestFailed: function(exception) {
        this.saving = false;

        if (exception.code == 629) {
            this.onDuplicateException.apply(this, arguments);
        } else {
            Klb.system.ExceptionHandler.handleRequestException(exception);
        }
        this.loadMask.hide();
    },
    
    /**
     * creates the relations panel, if relations are defined
     */
    initRelationsPanel: function() {

        if (! this.hideRelationsPanel && this.recordClass && this.recordClass.getField('relations')) {
            // init relations panel before onRecordLoad
            if (! this.relationsPanel) {
                this.relationsPanel = new Klb.system.widgets.relation.GenericPickerGridPanel({ anchor: '100% 100%', editDialog: this });
            }
            // interrupt process flow until dialog is rendered
            if (! this.rendered) {
                 Ext.Function.defer( this.initRelationsPanel, 250, this);
                return;
            }
            // add relations panel if this is rendered
            if (this.items.items[0]) {
                this.items.items[0].add(this.relationsPanel);
            }

            Klb.Logger.debug('Klb.system.widgets.dialog.EditDialog::initRelationsPanel() - Initialized relations panel and added to dialog tab items.');
        }
    },

    /**
     * create notes panel
     */
    initNotesPanel: function() {
        // This dialog is pretty generic but for some cases it's used in a differend way
        if(this.displayNotes == true) {
            this.items.items.push(new Klb.system.widgets.activities.ActivitiesGridPanel({
                anchor: '100% 100%',
                editDialog: this
            }));
        }
    },

    /**
     * creates attachments panel
     */
    initAttachmentsPanel: function() {
        if (! this.attachmentsPanel && ! this.hideAttachmentsPanel && this.recordClass && this.recordClass.hasField('attachments') ) {
            this.attachmentsPanel = Ext.create('Klb.system.widgets.dialog.AttachmentsGridPanel', { anchor: '100% 100%', editDialog: this });
            this.items.items.push(this.attachmentsPanel);
        }
    }
});
