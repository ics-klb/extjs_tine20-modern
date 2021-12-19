/*
 * Modern 3.1.0
 * 
 * @license     http://www.gnu.org/licenses/agpl.html AGPL Version 3
 * @author      Cornelius Weiss <c.weiss@metaways.de>
 * @copyright   Copyright (c) 2007-2010 Metaways Infosystems GmbH (http://www.metaways.de)
 */
Ext.ns('Klb.system.widgets', 'Klb.system.widgets.container', 'Klb.system.widgets.container.ContainerSelect');

/**
 * Container select ComboBox widget
 * 
 * @namespace   Klb.system.widgets.container
 * @class       Klb.system.widgets.container.selectionComboBox
 * @extends     Ext.form.field.ComboBox
 * @author      Cornelius Weiss <c.weiss@metaways.de>
 */
Ext.define('Klb.system.widgets.container.selectionComboBox', {
    extend: 'Ext.form.field.ComboBox',
    requires: [
             'Klb.system.widgets.form.RecordPickerManager'
    ],
    xtype: 'apibasewidgetscontainerselectcombo',
    /**
     * @cfg {Boolean} allowNodeSelect
     */
    allowNodeSelect: false,
    /**
     * @cfg {array}
     * default container
     */
    defaultContainer: false,
    /**
     * @cfg {Number} how many chars of the containername to display
     */
    displayLength: 25,
    /**
     * @property {Object} currently displayed container
     */
    selectedContainer: null,
    /**
     * @cfg {Number} list width
     */    
    listWidth: 400,
    /**
     * @cfg {string} containerName
     * name of container (singular)
     */
    containerName: 'container',
    /**
     * @cfg {string} containersName
     * name of container (plural)
     */
    containersName: 'containers',
    /**
     * @cfg {Boolean} hideTrigger2
     */
    hideTrigger2: true,
    /**
     * @cfg {String} startPath a container path to start with
     * possible values are: '/', '/personal/someAccountId', '/shared' (defaults to '/')
     * 
     * NOTE: container paths could not express tree paths .../otherUsers!
     */
    startPath: '/',
    /**
     * @cfg {Klb.data.Record} recordClass
     */
    recordClass: null,
    /**
     * @cfg {Array} requiredGrants
     * grants which are required to select leaf node(s)
     */
    requiredGrants: null,
    
    /**
     * @cfg {String} requiredGrant (legacy - should not be used any more)
     * grants which is required to select leaf node(s)
     */
    requiredGrant: null,
    
    /**
     *  @cfg {Number} trigger2width
     */
    trigger2width: 100,
    
    // private
    allowBlank: false,
    triggerAction: 'all',
    forceAll: true,
    lazyInit: true,
    editable: false,
    clearFilterOnReset: false,
    
    stateful: true,
    stateEvents: ['select'],
    
    mode: 'local',
    valueField: 'id',
    displayField: 'name',
    
    /**
     * is set to true if subpanels (selectionDialog) are active
     * useful in QuickAddGrid
     * @type Boolean
     */
    hasFocusedSubPanels: null,
    /**
     * @private
     */
    initComponent: function() {
        // init state
        if (this.stateful && !this.stateId) {
            if (! this.recordClass) {
                this.stateful = false;
            } else {
                this.stateId = this.recordClass.getMeta('appName') + '-apibase-widgets-container-selectcombo-' + this.recordClass.getMeta('modelName');
            }
        }

        // legacy handling for requiredGrant
        if(this.requiredGrant && ! this.requiredGrants) {
            this.requiredGrants = [this.requiredGrant];
        } else if (! this.requiredGrant && ! this.requiredGrants) {
            // set default required Grants
            this.requiredGrants = ['readGrant', 'addGrant', 'editGrant'];
        }

        // no state saving for startPath != /
        this.on('beforestatesave', function() {return this.startPath === '/';}, this);
        
        this.initStore();
        
        this.otherRecord = new Klb.system.Model.Container({id: 'other', name:  Ext.String.format(_('choose other {0}...'), this.containerName)}, 'other');
        this.store.add(this.otherRecord);
        
        this.emptyText =  Ext.String.format(_('Select a {0}'), this.containerName);
        
        // init triggers (needs to be done before standard initTrigger template fn)
        if (! this.hideTrigger2) {
            if (this.triggerClass == 'x-form-arrow-trigger') {
                this.triggerClass = 'x-form-arrow-trigger-rectangle';
            }
            
            this.triggerConfig = {
                tag:'span', cls:'x-form-twin-triggers', cn:[
                {tag: "img", src: Ext.BLANK_IMAGE_URL, cls: "x-form-trigger " + this.triggerClass},
                {tag:'span', cls:'tw-containerselect-trigger2', cn:[
                    {tag: "img", src: Ext.BLANK_IMAGE_URL, cls: "x-form-trigger tw-containerselect-trigger2-bg"},
                    {tag: "img", src: Ext.BLANK_IMAGE_URL, cls: "x-form-trigger tw-containerselect-trigger2"},
                    {tag: "div", style: {position: 'absolute', top: 0, left: '5px'}}
                ]}
            ]};
        }
        
        this.title =  Ext.String.format(_('Recently used {0}:'), this.containersName);
        
        this.callParent();

        this.hasFocusedSubPanels = false;
        if (this.defaultContainer) {
            this.selectedContainer = this.defaultContainer;
            this.value = this.defaultContainer.name;
        }
        this.on('blur', function() {
            if(this.hasFocusedSubPanels) {
                return false;
            }
        }, this);
        this.on('beforequery', this.onBeforeQuery, this);
        this.on('select',      this.onSelect, this);
    },
    
    /**
     * @private
     * @todo error in IE on Ext.state.Manager.get
     */
    initStore: function() {
        var state = this.stateful ? Ext.state.Manager.get(this.stateId) : null;
        try {
            var recentsData = state && state.recentsData || [];
        } catch (error) {
            recentsData = [];
            console.log('ERROR in ie on Ext.state.Manager.get');
        }
	
        this.store = new Klb.system.data.JsonStore({
            data: recentsData,
            remoteSort: false,
            model: 'Klb.system.Model.Container',
            baseParams: {
                method: 'Api_Container.getContainer'
            },
            listeners: { beforeload: this.onBeforeLoad.bind(this)}
        });
        this.setStoreFilter();
    },
    
    initTrigger : function(){
        if (! this.hideTrigger2) {
            var t1 = this.trigger.first();
            var t2 = this.trigger.last();
            this.trigger2 = t2;
            
            t1.on("click", this.onTriggerClick, this, {preventDefault:true});
            t2.on("click", this.onTrigger2Click, this, {preventDefault:true});
            
            t1.addClassOnOver('x-form-trigger-over');
            t1.addClassOnClick('x-form-trigger-click');
            
            t2.addClassOnOver('x-form-trigger-over');
            t2.addClassOnClick('x-form-trigger-click');
            
            
        } else {
            Klb.system.widgets.container.selectionComboBox.superclass.initTrigger.call(this);
        }
    },
    
    manageRecents: function(recent) {
        recent.set('dtselect', new Date().getTime());
        
        this.store.remove(this.otherRecord);
        this.store.clearFilter();
        this.store.sort('dtselect', 'DESC');
        
        // keep 10 containers and the nodes in betwwen
        var containerKeepCount = 0;
        this.store.each(function(record) {
            if (containerKeepCount < 10) {
                if (! record.get('is_container_node')) {
                    containerKeepCount += 1;
                }
                return;
            }
            this.store.remove(record);
        }, this);
        this.setStoreFilter();
        this.store.add(this.otherRecord);
    },

    /**
     * prepare params for remote search (this.startPath == /personal/*
     * 
     * @param {} store
     * @param {} options
     */
    onBeforeLoad: function(store, options) {
        options.params = {
            method: 'Api_Container.getContainer',
            application: this.appName,
            containerType: Klb.system.Container.TYPE_PERSONAL,
            owner: Klb.system.Container.pathIsPersonalNode(this.startPath)
        };
    },
    
    /**
     * if this.startPath correspondes to a personal node, 
     * directly do a remote search w.o. container tree dialog
     * 
     * @private
     * @param {} queryEvent
     */
    onBeforeQuery: function(queryEvent) {
        queryEvent.query = new Date().getTime();
        this.mode = Klb.system.Container.pathIsPersonalNode(this.startPath) ? 'remote' : 'local' ;
        
        // skip combobox nativ filtering to preserv our filters
        if (this.mode == 'local') {
            this.onLoad();
            // return false;
        }
    },
    
    /**
     * filter store according to this.startPath and this.allowNodeSelect
     * 
     * NOTE: If this.startPath != '/' resents are not used as we force remote loads,
     *       thus we don't need to filter in this case!
     */
    setStoreFilter: function() {
        this.store.clearFilter();
        this.store.sort('dtselect', 'DESC');

        var skipBoundary = this.store.getAt(Math.max(this.store.getCount(), 10) -1);
        var dtselectMin = skipBoundary ? skipBoundary.get('dtselect') : -1;
        
        this.store.filterBy(function(record) {
            var keep = (this.allowNodeSelect || !record.get('is_container_node')) && record.get('dtselect') > dtselectMin;
            return keep;
        }, this);
    },
    
    setTrigger2Text: function(text) {
        var trigger2 = this.trigger.last().last().update(text);
    },
    
    setTrigger2Disabled: function(bool) {
        if (bool) {
            this.trigger2.setOpacity(0.5);
            this.trigger2.un("click", this.onTrigger2Click, this, {preventDefault:true});
        } else {
            this.trigger2.setOpacity(1);
            this.trigger2.on("click", this.onTrigger2Click, this, {preventDefault:true});
        }
    },
    
    getTrigger2: function() {
        return this.trigger2;
    },
    
    onTrigger2Click: Ext.emptyFn,
    
    // private: only blur if dialog is closed
    onBlur: function() {
        if (!this.dlg) {
            return Klb.system.widgets.container.selectionComboBox.superclass.onBlur.apply(this, arguments);
        }
    },
    
    onSelect: function(combo, record, eOpts) {
        this.hasFocusedSubPanels = true;
        if (record == this.otherRecord) {
            this.onChoseOther();
        } else {
            this.manageRecents(record);
            Klb.system.widgets.container.selectionComboBox.superclass.onSelect.apply(this, arguments);
        }
    },
    
    /**
     * @private
     */
    onChoseOther: function() {
        this.collapse();
        this.dlg = new Klb.system.widgets.container.selectionDialog({
            allowNodeSelect: this.allowNodeSelect,
            containerName: this.containerName,
            containersName: this.containersName,
            requiredGrants: this.requiredGrants,
            TriggerField: this
        });
    },
    
    /**
     * @private
     */
    getValue: function(){
        return (this.selectedContainer !== null) ? this.selectedContainer.id : '';
    },
    
    /**
     * @private
     * @todo // records might be in from state, but value is conainerData only
     */
    setValue: function(container) {
        
        if(!container) return;
        
        if (container.hasOwnProperty('get') && Ext.isFunction(container.get)) {
            // container is a record -> already in store -> nothing to do
        } else if (this.store.getById(container)) {
            // store already has a record of this container
            container = this.store.getById(container);
            
        } else if (container.path && this.store.findExact('path', container.path) >= 0) {
            // store already has a record of this container
            container = this.store.getAt(this.store.findExact('path', container.path));
            
        } else if (container.path || container.id) {
            // ignore server name for node 'My containers'
            if (container.path && container.path === Klb.system.Container.getMyNodePath()) {
                container.name = null;
            }
            container.name = container.name || Klb.system.Container.path2name(container.path, this.containerName, this.containersName);
            container.id = container.id ||container.path;
            
            container = new Klb.system.Model.Container(container, container.id);
            
            this.store.add(container);
        } else {
            // reject container
            return this;
        }
        
        container.set('is_container_node', !!!Klb.system.Container.pathIsContainer(container.get('path')));
        this.selectedContainer = container.data;
        
        // make sure other is _last_ entry in list
        this.store.remove(this.otherRecord);
        this.store.add(this.otherRecord);
        
        Klb.system.widgets.container.selectionComboBox.superclass.setValue.call(this, container.id);
        
        if (container.account_grants) {
            this.setDisabled(! container.account_grants.deleteGrant);
        }
        
        if(this.qtip) {
            this.qtip.remove();
        }
        
        return container;
    },
    
    /**
     * Resets the current field value to the originally loaded value and clears any validation messages.
     * See {@link Ext.form.BasicForm}.{@link Ext.form.BasicForm#trackResetOnLoad trackResetOnLoad}
     */
    reset : function() {
        this.supr().setValue(this.originalValue);
        this.supr().reset.call(this);
    },
    
    applyState: Ext.emptyFn,
    
    /**
     * @private
     */
    getState: function() {
		return null;
    }
});

/**
 * @namespace Klb.system.widgets.container
 * @class Klb.system.widgets.container.selectionDialog
 * @extends Ext.Component
 * 
 * This widget shows a modal container selection dialog
 */
Ext.define('Klb.system.widgets.container.selectionDialog', {
    extend: 'Ext.Component',

    /**
     * @cfg {Boolean} allowNodeSelect
     */
    allowNodeSelect: false,
    /**
     * @cfg {string} containerName
     * name of container (singular)
     */
    containerName: 'container',
    /**
     * @cfg {string} containerName
     * name of container (plural)
     */
    containersName: 'containers',
    /**
     * @cfg {string}
     * title of dialog
     */
    title: null,
    /**
     * @cfg {Number}
     */
    windowHeight: 400,
    /**
     * @property {Klb.abstract.Window}
     */
    win: null,
    /**
     * @property {Ext.tree.Panel}
     */
    tree: null,
    /**
     * @cfg {Array} requiredGrants
     * grants which are required to select leaf node(s)
     */
    requiredGrants: ['readGrant'],
    
    /**
     * @private
     */
    initComponent: function(){
        Klb.system.widgets.container.selectionDialog.superclass.initComponent.call(this);
        
        this.title = this.title ? this.title :  Ext.String.format(_('please select a {0}'), this.containerName);
        
        this.cancelAction = new Ext.Action({
            text: _('Cancel'),
            iconCls: 'action_cancel',
            minWidth: 70,
            handler: this.onCancel,
            scope: this
        });
        
        this.okAction = new Ext.Action({
            disabled: true,
            text: _('Ok'),
            iconCls: 'action_saveAndClose',
            minWidth: 70,
            handler: this.onOk,
            scope: this
        });
        
        // adjust window height
        if (Ext.getBody().getHeight(true) * 0.7 < this.windowHeight) {
            this.windowHeight = Ext.getBody().getHeight(true) * 0.7;
        }

        this.tree = new Klb.system.widgets.container.TreePanel({
            allowMultiSelection: false,
            containerName: this.TriggerField.containerName,
            containersName: this.TriggerField.containersName,
            appName: this.TriggerField.appName,
            defaultContainer: this.TriggerField.defaultContainer,
            requiredGrants: this.requiredGrants
        });
        
        this.tree.on('click', this.onTreeNodeClick, this);
        this.tree.on('dblclick', this.onTreeNoceDblClick, this);

        this.win = Klb.system.WindowFactory.getWindow({
            title: this.title,
            closeAction: 'close',
            modal: true,
            width: 375,
            height: this.windowHeight,
            minWidth: 375,
            minHeight: this.windowHeight,
            layout: 'fit',
            plain: true,
            bodyStyle: 'padding:5px;',
            buttonAlign: 'right',
             buttons: [
                this.cancelAction,
                this.okAction
            ],
            
            items: [ this.tree ]
        });
    },
    
    /**
     * @private
     */
    onTreeNodeClick: function(node) {
        this.okAction.setDisabled(! (node.leaf ||this.allowNodeSelect));
        
        if (! node.leaf ) {
            node.expand();
        }
    },
    
    /**
     * @private
     */
    onTreeNoceDblClick: function(node) {
        if (! this.okAction.isDisabled()) {
            this.onOk();
        }
    },
    
    /**
     * @private
     */
    onCancel: function() {
        this.onClose();
    },
    
    /**
     * @private
     */
    onClose: function() {
        this.win.close();
    },
    
    /**
     * @private
     */
    onOk: function() {
        var  node = this.tree.getSelectionModel().getSelectedNode();
        if (node) {
            this.TriggerField.hasFocusedSubPanels = false;
            var container = this.TriggerField.setValue(node.attributes.container);
            this.TriggerField.manageRecents(container);
	    this.TriggerField.fireEvent('select', this.TriggerField, node.attributes.container);

            if (this.TriggerField.blurOnSelect) {
                this.TriggerField.fireEvent('blur', this.TriggerField);
            }
            this.onClose();
        }
    }
});
