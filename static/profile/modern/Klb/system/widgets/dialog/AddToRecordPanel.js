/*
 * Modern 3.1.0
 * 
 * @package     Modern
 * @license     http://www.gnu.org/licenses/agpl.html AGPL Version 3
 * @author      Alexander Stintzing <alex@stintzing.net>
 * @copyright   Copyright (c) 2009-2012 Metaways Infosystems GmbH (http://www.metaways.de)
 *
 */
 
Ext.ns('Klb.system.widgets.dialog');

/**
 * @namespace   Klb.system.widgets.dialog
 * @class       Klb.system.widgets.dialog.AddToRecordPanel
 * @extends     Ext.form.Panel
 * @author      Alexander Stintzing <alex@stintzing.net>
 */

Ext.define('Klb.system.widgets.dialog.AddToRecordPanel', {
    extend: 'Ext.form.Panel',
    /**
     * the name of the application the record to be added belongs to
     * @cfg {String}
     */
    appName : null,
    
    /**
     * the record class of the record the selected records should be added to
     * @cfg {Klb.system.data.Record}
     */
    recordClass: null,
    
    /**
     * the selection filter if is filter select
     * @type {Object}
     */
    selectionFilter: null,
    
    /**
     * count of records to add to
     * @type {Integer}
     */
    count: null,
    
    /**
     * the calling app
     * @type {String}
     */
    callingApp: null,
    
    /**
     * the calling model
     * @type {String}
     */
    callingModel: null,
    
    /**
     * the relations to add as Json Encoded array or bool on filterSelection
     * @type {Boolean|String} 
     */
    addRelations: null,
    
    // private
    app: null,
    layout : 'fit',
    border : false,
    cls : 'tw-editdialog',
    labelAlign : 'top',
    anchor : '100% 100%',
    deferredRender : false,
    buttonAlign : null,
    bufferResize : 500,
    
    /**
     * initializes the component
     */
    initComponent: function() {
         
        if (!this.app) {
            this.app = Klb.system.appMgr.get(this.appName);
        }
            
        Klb.Logger.debug('initComponent: appName: ', this.appName);
        Klb.Logger.debug('initComponent: app: ', this.app);

        // init actions
        this.initActions();
        // init buttons and tbar
        this.initButtons();
        
        // get items for this dialog
        this.items = this.getFormItems();

        Klb.system.widgets.dialog.AddToRecordPanel.superclass.initComponent.call(this);
    },
    
    /**
     * initializes the actions
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
            text : _('Ok'),
            minWidth : 70,
            scope : this,
            handler : this.onUpdate,
            iconCls : 'action_saveAndClose'
        });
    },

    /**
     * create the buttons
     * use preference settings for order of save and close buttons
     */
    initButtons : function() {
        this.fbar = ['->'];
        
        if (Klb.App.Api.registry && Klb.App.Api.registry.get('preferences') && Klb.App.Api.registry.get('preferences').get('dialogButtonsOrderStyle') === 'Windows') {
            this.fbar.push(this.action_update, this.action_cancel);
        }
        else {
            this.fbar.push(this.action_cancel, this.action_update);
        }
    },    
    
    /**
     * is called on render, creates keymap
     * @param {} ct
     * @param {} position
     */
    onRender : function(ct, position) {
        Klb.system.widgets.dialog.AddToRecordPanel.superclass.onRender.call(this, ct, position);

        // generalized keybord map for edit dlgs
        new Ext.KeyMap(this.el, [ {
            key : [ 10, 13 ], // ctrl + return
            ctrl : true,
            fn : this.onUpdate,
            scope : this
        }]);

    },
    
    /**
     * is called on cancel
     */
    onCancel: function() {
        this.fireEvent('cancel');
        this.onClose();
    },
    
    /**
     * closes the window
     */
    onClose: function() {
        this.clearListeners();
        this.window.close();
    },
    
    /**
     * returns true if the form is valid, must be overridden
     * @return {Boolean}
     */
    isValid: Ext.emptyFn,
    
    /**
     * returns the items of the form, must be overridden
     * @return {Object} with the configured items
     */
    getFormItems: Ext.emptyFn,
    
    /**
     * returns the configuration for the relations to be created, must be overridden
     * @return {Object}
     */
    getRelationConfig: function() {
        return {};
    },
    
    /**
     * returns the selected record. may be overridden.
     * @return {Object} config for the record to edit
     */
    getRecord: function() {
        var recordId = this.searchBox.getValue(), 
            record = this.searchBox.store.getById(recordId);
        return record;
    },
    
    /**
     * is called when ok-button is pressed and edit dialog should be opened
     */
    onUpdate: function() {
        if (this.isValid()) {
            if (this.app) {
                var ms = this.app.getMainScreen();
                if (ms) {
                    var cp = ms.getCenterPanel();
                }
            }
            cp.onEditInNewWindow({actionType: 'edit'}, this.getRecord() ? this.getRecord() : this.searchBox.selectedRecord, [{
                ptype:          'adddependence_edit_dialog',
                selectionFilter: this.selectionFilter,
                addRelations:    this.addRelations,
                relationConfig:  this.getRelationConfig(),
                callingApp:      this.callingApp,
                callingModel:    this.callingModel
            }]);
            this.onClose();
        }
    }
});