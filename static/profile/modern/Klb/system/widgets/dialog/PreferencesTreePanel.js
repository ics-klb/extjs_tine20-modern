/*
 * Modern 3.0
 * 
 * @package     Modern
 * @subpackage  widgets
 * @license     http://www.gnu.org/licenses/agpl.html AGPL Version 3
 * @author      Philipp Schuele <p.schuele@metaways.de>
 * @copyright   Copyright (c) 2009 Metaways Infosystems GmbH (http://www.metaways.de)
 *
 * @todo        create generic app tree panel?
 * @todo        add button: set default value(s)
 */

Ext.ns('Klb.system.widgets', 'Klb.system.widgets.dialog');

/**
 * preferences application tree panel
 * 
 * @namespace   Klb.system.widgets.dialog
 * @class       Klb.system.widgets.dialog.PreferencesTreePanel
 * @extends     Ext.tree.Panel
 */
 Ext.define('Klb.system.widgets.dialog.PreferencesTreePanel', {
    extend : 'Ext.tree.Panel',
    xtype: 'PreferencesTreePanel',
    /**
     * @cfg String  initialNodeId to select after render
     */
    initialNodeId: null,
    
    // presets
    iconCls: 'x-new-application',
    rootVisible: true,
    border: false,
    autoScroll: true,
    bodyStyle: 'background-color:white',
    
    /**
     * initComponent
     * 
     */
    initComponent: function(){
       var me = this, 
           config = config || {};

         me.callParent([config]);
         me.initTreeNodes();
         me.initHandlers();
         me.selectInitialNode(); 
    },

    /**
     * select initial node
     */
    selectInitialNode: function() {
        var initialNode = (this.initialNodeId !== null) ? this.getNodeById(this.initialNodeId) : this.getRootNode();
        this.fireEvent('click', initialNode);
    },
    
    /**
     * initTreeNodes with Modern and apps prefs
     * 
     * @private
     */
    initTreeNodes: function() {

        // general preferences are tree root
        var treeRoot = Ext.create('Ext.data.TreeStore', {
            text: _('General Preferences'),
            id: 'Modern',
            draggable: false,
            allowDrop: false,
            expanded: true
        });
        this.setRootNode(treeRoot);

        // add all apps
        var allApps = Klb.system.appMgr.getAll();

        // sort nodes by translated title (text property)
//        new Ext.tree.TreeSorter(this, {
        new Ext.data.TreeStore(this, {
            folderSort: true,
            dir: "asc"
        });

        // add "My Profile"
        if (Klb.system.Common.hasRight('manage_own_profile', 'Modern')) {
            var profileNode = Ext.create('Ext.data.TreeStore', {
                text: _('My Profile'),
                cls: 'file',
                iconCls: 'apibase-accounttype-user',
                id: 'Api.UserProfile',
                leaf: true
            });
            this.getRootNode().appendChild(profileNode);
        }
        
        // console.log(allApps);
        allApps.each(function(app) {
            if (app && Ext.isFunction(app.getTitle)) {

                var node = Ext.create('Ext.data.TreeStore', {
                    text: app.getTitle(),
                    cls: 'file',
                    id: app.appName,
                    iconCls: app.getIconCls('PreferencesTreePanel'),
                    leaf: true
                });
        
                this.getRootNode().appendChild(node);
            }
        }, this);
    },

    /**
     * initTreeNodes with Modern and apps prefs
     * 
     * @private
     */

    onCellClick: function(_panel, td, cellIndex, node, tr, rowIndex ) {
            // note: if node is clicked, it is not selected!
            node.getOwnerTree().selectPath(node.getPath());
            node.expand();

            // get parent pref panel
            var parentPanel = this.findParentByType('Preferences'); // Klb.system.widgets.dialog.Preferences
            // add panel to card panel to show prefs for chosen app

            if (parentPanel) parentPanel.showPrefsForApp(node.id);
    },
    onBeforeExpand: function(_panel, animate, eOpts) {
            if(_panel.getSelectionModel().getSelectedNode() === null) {
                _panel.expandPath('/Modern');
                _panel.selectPath('/Modern');
            }
            _panel.fireEvent('click', _panel.getSelectionModel().getSelectedNode());
    },

    initHandlers: function() {

        this.on({
            cellClick: this.onCellClick,
            beforeexpand: this.onBeforeExpand,
            scope: this // Important. Ensure "this" is correct during handler execution
        });
    },

    /**
     * check grants for tree nodes / apps
     * 
     * @param {Bool} adminMode
     */
    checkGrants: function(adminMode) {
        var root = this.getRootNode();
                
        root.eachChild(function(node) {
            // enable or disable according to admin rights / admin mode
            if (!Klb.system.Common.hasRight('admin', node.id) && adminMode) {
                node.disable();
            } else {
                node.enable();
            }
        });
    }
});
