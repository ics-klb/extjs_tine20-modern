/*
 * Modern 3.1.0
 *
 * @license     http://www.gnu.org/licenses/agpl.html AGPL Version 3
 * @author      Alexander Stintzing <a.stintzing@metaways.de>
 * @copyright   Copyright (c) 2012-2013 Metaways Infosystems GmbH (http://www.metaways.de)
 */
Ext.ns('Klb.system.widgets');

/**
 * @namespace   Klb.system.widgets
 * @class       Klb.system.widgets.ContentTypeTreePanel
 * @extends     Ext.tree.Panel
 * @author      Alexander Stintzing <a.stintzing@metaways.de>
 * @param       {Object} config Configuration options
 * @description
 * <p>Utility class for generating content type trees as used in the apps westpanel</p>
 *<p>Example usage:</p>
<pre><code>
var modulePanel =  new Klb.system.widgets.ContentTypeTreePanel({
    app: Klb.system.appMgr.get('Timetracker'),
    contentTypes: [{modelName: 'Timesheet', requiredRight: null}, {modelName: 'Timeaccount', requiredRight: 'manage'}],
    contentType: 'Timeaccount'
});
</code></pre>
 */
Klb.system.widgets.ContentTypeTreePanel = function(config) {
    Ext.apply(this, config);

    Klb.system.widgets.ContentTypeTreePanel.superclass.constructor.call(this);
};

Ext.extend(Klb.system.widgets.ContentTypeTreePanel, Ext.tree.Panel, {
    rootVisible : false,
    border : false,

    root: null,

    title: 'Modules',

    collapsible: true,
    baseCls: 'ux-arrowcollapse',
    animCollapse: true,
    titleCollapse:true,
    draggable : true,
    autoScroll: false,
    autoHeight: true,

    collapsed: false,
    renderHidden: true,

    recordClass: null,
    /**
     * @cfg {Klb.system.Application} app
     */
    app: null,

    /**
     * @cfg {Array} contentTypes
     */
    contentTypes: null,

    /**
     * @cfg {String} contentType
     */
    contentType: null,

    /**
     * Enable state
     *
     * @type {Boolean}
     */
    stateful: true,

    /**
     * define state events
     *
     * @type {Array}
     */
    stateEvents: ['collapse', 'expand', 'collapsenode', 'expandnode'],

    /**
     * @private {Ext.data.TreeStore} the latest clicked node
     */
    lastClickedNode: null,

    /**
     * init
     */
    initComponent: function() {
        this.stateId = this.app.name + (this.contentType ? this.contentType : '') + '-moduletree';
        Klb.system.widgets.ContentTypeTreePanel.superclass.initComponent.call(this);

        var treeRoot = new Ext.data.TreeStore({
            expanded: true,
            text : '',
            allowDrag : false,
            allowDrop : false,
            icon : false
        });
        var groupNodes = {};
        this.setRootNode(treeRoot);
        var treeRoot = this.getRootNode();

        this.recordClass = Klb.App[this.app.appName].Model[this.contentType];

        this.on('click', this.saveClickedNodeState, this);

        Ext.each(this.contentTypes, function(ct) {
            var modelName = ct.hasOwnProperty('meta') 
                ? ct.meta.modelName 
                : (
                    ct.hasOwnProperty('model')
                        ? ct.model
                        : ct.modelName
                ); 
            
            var modelApp = ct.appName ? Klb.system.appMgr.get(ct.appName) : this.app;
            
            var recordClass = Klb.App[modelApp.appName].Model[modelName];
            var group = recordClass.getMeta('group');

            if (group) {
                if(! groupNodes[group]) {
                    groupNodes[group] = new Ext.data.TreeStore({
                        id : 'modulenode-' + recordClass.getMeta('modelName'),
                        iconCls: modelApp.appName + modelName,
                        text: modelApp.i18n._hidden(group),
                        leaf : false,
                        expanded: false
                    });
                    treeRoot.appendChild(groupNodes[group]);
                }
                var parentNode = groupNodes[group];
            } else {
                var parentNode = treeRoot;
            }

            // check requiredRight if any
            // add check for model name also
            if (
                ct.requiredRight && 
                ! Klb.system.Common.hasRight(ct.requiredRight, this.app.appName, recordClass.getMeta('recordsName').toLowerCase()) &&
                ! Klb.system.Common.hasRight(ct.requiredRight, this.app.appName, recordClass.getMeta('modelName').toLowerCase()) &&
                ! Klb.system.Common.hasRight(ct.requiredRight, this.app.appName, recordClass.getMeta('modelName').toLowerCase() + 's')
            ) return true;
            
            var child = new Ext.data.TreeStore({
                id : 'treenode-' + recordClass.getMeta('modelName'),
                iconCls: modelApp.appName + modelName,
                text: recordClass.getRecordsName(),
                leaf : true
            });

            child.on('click', function() {
                this.app.getMainScreen().activeContentType = modelName;
                this.app.getMainScreen().show();
            }, this);

            // append generic ctx-items (Klb.system.widgets.tree.ContextMenu)

            parentNode.appendChild(child);
        }, this);
    },

    /**
     * saves the last clicked node as state
     *
     * @param {Ext.data.TreeStore} node
     * @param {Ext.EventObjectImpl} event
     */
    saveClickedNodeState: function(node, event) {
        this.lastClickedNode = node;
        this.saveState();
    },

    /**
     * @see Ext.Component
     */
    getState: function() {
        var root = this.getRootNode();

        var state = {
            expanded: [],
            selected: this.lastClickedNode ? this.lastClickedNode.id : null
        };
        Ext.each(root.childNodes, function(node) {
            state.expanded.push(!! node.expanded);
        }, this);

        return state;
    },

    /**
     * applies state to cmp
     *
     * @param {Object} state
     */
    applyState: function(state) {
        var root = this.getRootNode();
        Ext.each(state.expanded, function(isExpanded, index) {
            // check if node exists, as user might have lost permissions for modules
            if (root.childNodes[index]) {
                root.childNodes[index].expanded = isExpanded;
            }
        }, this);

        (function() {
            var node = this.getNodeById(state.selected);
            if (node) {
                node.select();
                var contentType = node.id.split('-')[1];
                this.app.getMainScreen().activeContentType = contentType ? contentType : '';
                this.app.getMainScreen().show();
            }
        }).defer(100, this);
    },
    
    // added to select node of active content type
    afterRender: function () {
        Klb.system.widgets.ContentTypeTreePanel.superclass.afterRender.call(this);
        this.getSelectionModel().select(this.getRootNode().findChild('id', 'treenode-' + this.contentType));
    }
});
