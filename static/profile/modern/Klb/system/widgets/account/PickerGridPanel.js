/*
 * Modern 3.0
 * 
 * @package     Modern
 * @subpackage  widgets
 * @license     http://www.gnu.org/licenses/agpl.html AGPL Version 3
 * @author      Philipp Schüle <p.schuele@metaways.de>
 * @copyright   Copyright (c) 2009-2012 Metaways Infosystems GmbH (http://www.metaways.de)
 *
 */

/*global Ext, Modern*/

Ext.ns('Klb.system.widgets.account');

/**
 * Account Picker GridPanel
 * 
 * @namespace   Klb.system.widgets.account
 * @class       Klb.system.widgets.account.PickerGridPanel
 * @extends     Klb.system.widgets.grid.PickerGridPanel
 * 
 * <p>Account Picker GridPanel</p>
 * <p><pre>
 * TODO         use selectAction config?
 * </pre></p>
 * 
 * @license     http://www.gnu.org/licenses/agpl.html AGPL Version 3
 * @author      Philipp Schuele <p.schuele@metaways.de>
 * @copyright   Copyright (c) 2009 Metaways Infosystems GmbH (http://www.metaways.de)
 * 
 * @param       {Object} config
 * @constructor Create a new Klb.system.widgets.account.PickerGridPanel
 */
Ext.define('Klb.system.widgets.account.PickerGridPanel', {
    extend: 'Klb.system.widgets.grid.PickerGridPanel',

    xtype: 'tinerecordpickergrid',
    /**
     * @cfg {String} one of 'user', 'group', 'both'
     * selectType
     */
    selectType: 'user',
    
    /**
     * @cfg{String} selectTypeDefault 'user' or 'group' defines which accountType is selected when  {selectType} is true
     */
    selectTypeDefault: 'user',
    
    /**
     * @cfg {Ext.Action}
     * selectAction
     */
    //selectAction: false,
    
    /**
     * @cfg {bool}
     * add 'anyone' selection if selectType == 'both'
     */
    selectAnyone: true,

    /**
     * @cfg {bool}
     * show hidden (user) contacts / (group) lists
     */
    showHidden: false,

    /**
     * get only users with defined status (enabled, disabled, expired)
     * get all -> 'enabled expired disabled'
     * 
     * @type String
     * @property userStatus
     */
    userStatus: 'enabled',
    
    /**
     * @cfg {bool} have the record account properties an account prefix?
     */
    hasAccountPrefix: false,
    
    /**
     * @cfg {String} recordPrefix
     */
    recordPrefix: '',

    /**
     * grid config
     * @private
     */
    autoExpandColumn: 'name',
    
    /**
     * @private
     */
    initComponent: function () {
        this.recordPrefix = (this.hasAccountPrefix) ? 'account_' : '';
        
        this.recordClass = this.recordClass || Klb.system.Model.Account;
        this.groupRecordClass = this.groupRecordClass || Klb.Addressbook.Model.List;
        
        if (Klb.system.configManager.get('anyoneAccountDisabled')) {
            Klb.Logger.info('Klb.system.widgets.account.PickerGridPanel::initComponent() -> select anyone disabled in config');
            this.selectAnyone = false;
        }
        Klb.system.widgets.account.PickerGridPanel.superclass.initComponent.call(this);

        this.store.sort(this.recordPrefix + 'name');
    },

    /**
     * init top toolbar
     */
    initTbar: function() {
        this.accountTypeSelector = this.getAccountTypeSelector();
        this.contactSearchCombo = this.getContactSearchCombo();
        this.groupSearchCombo = this.getGroupSearchCombo();
        
        var items = [];
        switch (this.selectType) 
        {
        case 'both':
            items = items.concat([this.contactSearchCombo, this.groupSearchCombo]);
            if (this.selectTypeDefault === 'user') {
                this.groupSearchCombo.hide();
            } else {
                this.contactSearchCombo.hide();
            }
            break;
        case 'user':
            items = this.contactSearchCombo;
            break;
        case 'group':
            items = this.groupSearchCombo;
            break;
        }
        
        this.comboPanel = Ext.create('Ext.panel.Panel', {
            layout: 'hfit',
            border: false,
            items: items,
            columnWidth: 1
        });
        
        this.tbar = Ext.create('Ext.Toolbar', {
            items: [
                this.accountTypeSelector,
                this.comboPanel
            ],
            layout: 'column'
        });
    },
    
    /**
     * define actions
     * 
     * @return {Ext.Action}
     */
    getAccountTypeSelector: function () {
        var userActionCfg = {
            text: _('Search User'),
            scope: this,
            iconCls: 'apibase-accounttype-user',
            handler: this.onSwitchCombo.bind(this, ['contact', 'apibase-accounttype-user'])
        };
        var groupActionCfg = {
            text: _('Search Group'),
            scope: this,
            iconCls: 'apibase-accounttype-group',
            handler: this.onSwitchCombo.bind(this, ['group', 'apibase-accounttype-group'])
        };
        var anyoneActionCfg = {
            text: _('Add Anyone'),
            scope: this,
            iconCls: 'apibase-accounttype-addanyone',
            handler: this.onAddAnyone
        };
        
        // set items
        var items = [];
        switch (this.selectType) 
        {
        case 'both':
            items = items.concat([userActionCfg, groupActionCfg]);
            if (this.selectAnyone) {
                items.push(anyoneActionCfg);
            }
            break;
        case 'user':
            items = userActionCfg;
            break;
        case 'group':
            items = groupActionCfg;
            break;
        }
        
        // create action
        return Ext.create('Ext.Action', {
            width: 20,
            text: '',
            disabled: false,
            iconCls: (this.selectTypeDefault === 'user') ? 'apibase-accounttype-user' : 'apibase-accounttype-group',
            menu: new Ext.menu.Menu({
                items: items
            }),
            scope: this
        });
    },
    
    /**
     * add anyone to grid
     */
    onAddAnyone: function() {
        var recordData = (this.recordDefaults !== null) ? this.recordDefaults : {};
        recordData[this.recordPrefix + 'type'] = 'anyone';
        recordData[this.recordPrefix + 'name'] = _('Anyone');
        recordData[this.recordPrefix + 'id'] = 0;
        var record = new this.recordClass(recordData, 0);
        
        // check if already in
        if (! this.store.getById(record.id)) {
            this.store.add([record]);
        }
    },
    
    /**
     * @return {Klb.Addressbook.SearchCombo}
     */
    getContactSearchCombo: function () {
        return Ext.create('Klb.Addressbook.SearchCombo', {
            accountsStore: this.store,
            emptyText: _('Search for users ...'),
            newRecordClass: this.recordClass,
            newRecordDefaults: this.recordDefaults,
            recordPrefix: this.recordPrefix,
            userOnly: true,
            onSelect: this.onAddRecordFromCombo,
            additionalFilters: (this.showHidden) ? [{field: 'showDisabled', operator: 'equals', value: true}] : []
        });
    },
    
    /**
     * @return {Klb.system.widgets.form.RecordPickerComboBox}
     */
    getGroupSearchCombo: function () {
        return Ext.create('Klb.system.widgets.form.RecordPickerComboBox', {
            //anchor: '100%',
            accountsStore: this.store,
            blurOnSelect: true,
            recordClass: this.groupRecordClass,
            newRecordClass: this.recordClass,
            newRecordDefaults: this.recordDefaults,
            recordPrefix: this.recordPrefix,
            emptyText: _('Search for groups ...'),
            onSelect: this.onAddRecordFromCombo
        });
    },
    
    /**
     * @return Ext.grid.ColumnManager
     * @private
     */
    getColumnModel: function () {
        return new Ext.grid.ColumnManager({
            defaults: {
                sortable: true
            },
            columns:  [
                //{id: 'type', header: '',        dataIndex: this.recordPrefix + 'type', width: 35, renderer: Klb.system.Common.accountTypeRenderer},
                {id: 'name', header: _('Name'), dataIndex: this.recordPrefix + 'name', renderer: Klb.system.Common.accountRenderer}
            ].concat(this.configColumns)
        });
    },
    
    /**
     * @param {Record} recordToAdd
     * 
     * TODO make reset work correctly -> show emptyText again
     */
    onAddRecordFromCombo: function (recordToAdd) {
        var recordData = {},
            record;
        
        // account record selected
        if (recordToAdd.data.account_id) {
            // user account record
            recordData[this.recordPrefix + 'id'] = recordToAdd.data.account_id;
            recordData[this.recordPrefix + 'type'] = 'user';
            recordData[this.recordPrefix + 'name'] = recordToAdd.data.n_fileas;
            recordData[this.recordPrefix + 'data'] = recordToAdd.data;

            record = new this.newRecordClass(Ext.applyIf(recordData, this.newRecordDefaults), recordToAdd.data.account_id);
        } 
        // group or addressbook list record selected
        else if (recordToAdd.data.group_id || recordToAdd.data.id) {
            recordData[this.recordPrefix + 'id'] = recordToAdd.data.group_id || recordToAdd.data.id;
            recordData[this.recordPrefix + 'type'] = 'group';
            recordData[this.recordPrefix + 'name'] = recordToAdd.data.name;
            recordData[this.recordPrefix + 'data'] = recordToAdd.data;
            
            record = new this.newRecordClass(Ext.applyIf(recordData, this.newRecordDefaults), recordToAdd.id);
        }
        
        // check if already in
        if (! this.accountsStore.getById(record.id)) {
            this.accountsStore.add([record]);
        }
        this.collapse();
        this.clearValue();
        this.reset();
    },
    
    /**
     * 
     * @param {String} show
     * @param {String} iconCls
     * 
     * TODO fix width hack (extjs bug?)
     */
    onSwitchCombo: function (show, iconCls) {
        var showCombo = (show === 'contact') ? this.contactSearchCombo : this.groupSearchCombo;
        var hideCombo = (show === 'contact') ? this.groupSearchCombo : this.contactSearchCombo;
        
        if (! showCombo.isVisible()) {
            var width = hideCombo.getWidth();
            
            hideCombo.hide();
            showCombo.show();
            
            // adjust width
            showCombo.setWidth(width - 1);
            showCombo.setWidth(showCombo.getWidth() + 1);
            
            this.accountTypeSelector.setIconClass(iconCls);
        }
    }
});
