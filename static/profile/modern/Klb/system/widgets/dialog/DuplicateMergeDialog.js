/*
 * Modern 3.1.0
 * 
 * @license     http://www.gnu.org/licenses/agpl.html AGPL Version 3
 * @author      Alexander Stintzing <a.stintzing@metaways.de>
 * @copyright   Copyright (c) 2007-2012 Metaways Infosystems GmbH (http://www.metaways.de)
 */
Ext.ns('Klb.system.widgets.dialog');

/**
 * @namespace   Klb.system.widgets.dialog
 * @class       Klb.system.widgets.dialog.DuplicateMergeDialog
 * @extends     Ext.form.Panel
 * @author      Alexander Stintzing <a.stintzing@metaways.de>
 * 
 * @param {Object} config The configuration options.
 */

Ext.define('Klb.system.widgets.dialog.DuplicateMergeDialog', {
    extend: 'Ext.form.Panel',

    appName : null,
    app: null,
    modelName: null,
    
    recordClass: null,
    recordProxy: null,
    loadMask: null,
    
    layout : 'fit',
    border : false,
    cls : 'tw-editdialog',    

    labelAlign : 'top',

    anchor : '100% 100%',
    deferredRender : false,
    buttonAlign : null,
    bufferResize : 500,
    
    /**
     * init component
     */
    initComponent: function() {

        if (!this.app) {
            this.app = Klb.system.appMgr.get(this.appName);
        }

        this.recordClass = Klb.system.data.RecordMgr.get(this.appName, this.modelName);
        this.selections = Ext.decode(this.selections);
        this.records = [];
        
        this.recordProxy = Klb.App[this.appName][this.recordClass.getMeta('recordName').toLowerCase() + 'Backend'];
        
        if(!this.recordProxy) {
            return;
        }
        
        Ext.each(this.selections, function(rec) {
            this.records.push(this.recordProxy.recordReader({responseText: Ext.encode(rec)}));
        }, this );
        
        Klb.Logger.debug('initComponent: appName: ', this.appName);
        Klb.Logger.debug('initComponent: app: ', this.app);

        // init actions
        this.initActions();

        // get items for this dialog
        this.items = this.getFormItems();

        Klb.system.widgets.dialog.DuplicateMergeDialog.superclass.initComponent.call(this);
    },
    /**
     * initializes the actions for the buttons
     */
    initActions: function() {
        this.action_cancel = new Ext.Action({
            text : _('Cancel'),
            minWidth : 70,
            scope : this,
            handler : this.onCancel,
            iconCls : 'action_cancel'
        });

        this.action_update = new Ext.Action({
            text : _('OK'),
            minWidth : 70,
            scope : this,
            handler : this.onUpdate,
            iconCls : 'action_saveAndClose'
        });
        
        this.fbar = [ '->', this.action_cancel, this.action_update ];
    },
    
    /**
     * is called to resolve the records
     */
    onUpdate: function() {
        var store = this.gridPanel.getStore(),
            updateRecord = store.getResolvedRecord(),
            removeRecords = [],
            allRecords = store.duplicates.concat([store.clientRecord]),
            strategy = this.gridPanel.actionCombo.getValue();
        
        Klb.Logger.debug('Klb.system.widgets.dialog.DuplicateMergeDialog::onUpdate() - strategy:');
        Klb.Logger.debug(this.gridPanel.actionCombo.getValue());
        
        Klb.Logger.debug('Klb.system.widgets.dialog.DuplicateMergeDialog::onUpdate() - allRecords:');
        Klb.Logger.debug(allRecords);
        
        if (strategy === 'mergeTheirs') {
            // we need to use the first id in update record
            updateRecord.id = allRecords[0].id;
        } else {
            // we need to use the second id (clientRecord) in update record
            updateRecord.id = allRecords[1].id;
        }
        updateRecord.data.id = updateRecord.id;

        Klb.Logger.debug('Klb.system.widgets.dialog.DuplicateMergeDialog::onUpdate() - updateRecord:');
        Klb.Logger.debug(updateRecord);
        
        Ext.each(allRecords, function(rec) {
            if (rec.id != updateRecord.id) {
                removeRecords.push(rec);
            }
        });

        Klb.Logger.debug('Klb.system.widgets.dialog.DuplicateMergeDialog::onUpdate() - removeRecords:');
        Klb.Logger.debug(removeRecords);
        
        this.loadMask = new Ext.LoadMask(this.getEl(), {msg: _('Merging Records...')});
        this.loadMask.show();
        
        this.recordProxy.saveRecord(updateRecord, {
            scope: this,
            success: function(newRecord) {
                this.removeDuplicates(removeRecords);
            },
            failure: function(failure) {
                this.onFailure('update', failure);
            }
        });
    },
    
    /**
     * remove duplicate records, when update of the new record succeeded
     * @param {Array} removeRecords
     */
    removeDuplicates: function(removeRecords) {
        this.recordProxy.deleteRecords(removeRecords, {
            scope: this,
            success: function() {
                this.onSuccess();
            },
            failure: function(failure) {
                this.onFailure('remove', failure);
            }
        });
    },
    
    /**
     * is called when a failure on saving the merge result or deleting the duplicate happens
     * @param {} step
     * @param {} failure
     */
    onFailure: function(step, failure) {
        if(step == 'update') {
             Klb.system.ExceptionHandler.handleRequestException(failure, function() { if (this.loadMask) this.loadMask.hide(); }, this);
        } else {
             Ext.MessageBox.alert(_('Merge Failed'),  Ext.String.format(_('The merge succeeded, but the duplicate {0} could not be deleted.'), this.recordClass.getRecordName()), function() { Klb.system.ExceptionHandler.handleRequestException(failure); if (this.loadMask) this.loadMask.hide();}, this);
        }
    },
    /**
     * returns the form items of this panel
     * @return {}
     */
    getFormItems: function() {
        return {
            layout: 'border',
            items: [{
                region: 'center',
                layout: 'fit',
                items: [new Klb.system.widgets.dialog.DuplicateResolveGridPanel({
                    ref: '../../gridPanel',
                    app: this.app,
                    recordClass: this.recordClass,
                    store: new Klb.system.widgets.dialog.DuplicateResolveStore({
                        recordClass: this.recordClass,
                        defaultResolveStrategy: 'mergeMine',
                        app: this.app,
                        data: {
                            clientRecord: this.records.shift(),
                            duplicates: this.records
                        },
                        // TODO we might add some grants handling here to show the user if she can't edit, update or delete the records
                        // strategy can't be set to 'keep' here
                        checkEditGrant: Ext.emptyFn
                    }),
                    listeners: {
                        afterrender: function() {
                            var recordsName = this.recordClass.getRecordsName(),
                                recordName = this.recordClass.getRecordName();
                
                            // change actionComboListEls
                            this.actionCombo.store = new Ext.data.ArrayStore({
                                id: 0,
                                fields: ['value', 'text'],
                                data: [
                                    ['mergeMine',  Ext.String.format(_('Merge {0}, prefer First'), recordsName)],
                                    ['mergeTheirs',  Ext.String.format(_('Merge {0}, prefer Second'), recordsName)]
                                ]
                            });
                            this.actionCombo.setWidth(400);
                            this.onStoreLoad();
                
                            // change title
                            this.setTitle( Ext.String.format(_('Merge {0}'), recordsName));
                            
                            // change column headers
                            this.getColumnModel().setColumnHeader(this.getColumnModel().getIndexById('clientValue'),  Ext.String.format(_('First {0}'), recordName));
                            this.getColumnModel().setColumnHeader(this.getColumnModel().getIndexById('value0'),  Ext.String.format(_('Second {0}'), recordName));
                            this.getColumnModel().setColumnHeader(this.getColumnModel().getIndexById('finalValue'),  Ext.String.format(_('Final {0}'), recordName));
                        }
                    }
                    })]
            }]
        };
    },
    
    onSuccess: function() {
        this.window.fireEvent('contentschange');
        this.onCancel();
    },
    
    onCancel: function() {
        this.window.clearListeners();
        this.window.close();
    }
    
});

Klb.system.widgets.dialog.DuplicateMergeDialog.getWindow = function(config) {
    return Klb.system.WindowFactory.getWindow({
        width: 800,
        height: 600,
        name: Klb.system.widgets.dialog.ImportDialog.windowNamePrefix + Ext.id(),
        contentPanelConstructor: 'Klb.system.widgets.dialog.DuplicateMergeDialog',
        contentPanelConstructorConfig: config
    });
};