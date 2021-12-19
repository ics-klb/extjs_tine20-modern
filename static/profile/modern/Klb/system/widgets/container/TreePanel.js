/*
 * Modern 3.0
 * 
 * @license     http://www.gnu.org/licenses/agpl.html AGPL Version 3
 * @author      Cornelius Weiss <c.weiss@metaways.de>
 * @copyright   Copyright (c) 2007-2011 Metaways Infosystems GmbH (http://www.metaways.de)
 */
Ext.ns('Klb.system.widgets', 'Klb.system.widgets.container');

/**
 * @namespace   Klb.system.widgets.container
 * @class       Klb.system.widgets.container.TreePanel
 * @extends     Ext.tree.Panel
 * @author      Cornelius Weiss <c.weiss@metaways.de>
 * @param       {Object} config Configuration options
 * @description
 */

Ext.define('Klb.system.widgets.container.TreePanelKpi', {
    extend: 'Ext.tree.Panel',
   
    title : 'Core Team Projects',
    collapsible : true,
    useArrows : true,
    rootVisible : false,

    multiSelect : true,
    singleExpand : true,
    columns : [{
            xtype : 'treecolumn', //this is so we know which column will show the tree
            text : 'Region',
            flex : 2,
            sortable : true,
            dataIndex : 'task'
    }, {
            //we must use the templateheader component so we can use a custom tpl
            xtype : 'templatecolumn',
            text : 'Kpi',
            flex : 1,
            sortable : true,
            dataIndex : 'duration',
            align : 'center',
            //add in the custom tpl for the rows
            tpl : Ext.create('Ext.XTemplate', '{duration:this.formatHours}', {
                  formatHours : function(v) {
                                if (v < 1) {
                                        return Math.round(v * 60) + ' mins';
                                } else if (Math.floor(v) !== v) {
                                        var min = v - Math.floor(v);
                                        return Math.floor(v) + 'h ' + Math.round(min * 60) + 'm';
                                } else {
                                        return v + ' hour' + (v === 1 ? '' : 's');
                                }
                        }
                  })

    }, {
            text : 'Assigned To',
            flex : 1,
            dataIndex : 'user',
            sortable : true
    }]
    
});

Ext.define('Klb.system.widgets.container.TreeModel', {
    extend: 'Ext.data.TreeModel',
    identifier: 'uuid',

    prepareDataNode: function (node) {
        if ( !node.attributes ) {
            node.attributes = {
                name: node.get('name'),
                path: node.get('path')
            }
        };
        var attr = node.attributes,
            store = this.getTreeStore();
        if ( !node.get('name') && attr.path && store && store.attributes) {
            attr.name = Klb.system.Container.path2name(attr.path, store.attributes.containerName, store.attributes.containersName);
            node.set('name', attr.name);
            node.set('text', attr.name);
        }
        if ( !node.get('text') && attr.name ) {
            attr.name =  node.get('name');
            node.set('text', attr.name);
        }

        Ext.applyIf(attr, {
            text: Ext.util.Format.htmlEncode(attr.name),
            qtip: Klb.system.Common.doubleEncode(attr.name),
            leaf: !!attr.account_grants,
            allowDrop: !!attr.account_grants &&  attr.account_grants.addGrant
        });

        // copy 'real' data to container space
        attr.container = attr.container || Ext.copyTo({}, attr, Klb.system.Model.Container.getFieldNames());
       return node;
    }

}, function () {
    // Do this first to be able to override NodeInterface methods
    Ext.data.NodeInterface.decorate(this);

    this.override({
        // @OVERRIDE
        createNode: function (node) {
                node = this.prepareDataNode(node);
            return this.callParent([node]);
        },
        // @OVERRIDE
        appendChild : function (node) {
            return this.callParent([node]);
        }

    });
});

Ext.define('Klb.system.widgets.container.TreePanel', {
    extend: 'Ext.tree.Panel',
    requires: [
          'Klb.system.widgets.tree.FilterPlugin'
        , 'Klb.system.widgets.tree.Loader'
        , 'Klb.system.widgets.tree.ContextMenu'
        , 'Klb.system.widgets.container.PropertiesDialog',
        , 'Klb.system.widgets.container.FilterModel'
        , 'Ext.grid.plugin.CellEditing'
        , 'Ext.tree.plugin.TreeViewDragDrop'
        , 'Ext.grid.column.Action'
        , 'Ext.ux.form.ColorField'
        , 'Ext.ux.colorpick.Field'
    ],

    /**
     * @cfg {Klb.system.Application} app
     */
    app: null,
    /**
     * @cfg {Boolean} allowMultiSelection (defaults to true)
     */
    allowMultiSelection: true,
    /**
     * @cfg {String} defaultContainerPath
     */
    defaultContainerPath: null,
    /**
     * @cfg {array} extraItems additional items to display under all
     */
    extraItems: null,
    /**
     * @cfg {String} filterMode one of:
     *   - gridFilter: hooks into the grids.store
     *   - filterToolbar: hooks into the filterToolbar (container filterModel required)
     */
    filterMode: 'gridFilter',
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
     * @cfg {Boolean} useContainerColor
     * use container colors
     */
    useContainerColor: false,
    /**
     * @cfg {Boolean} useContainerColor
     * use container properties
     */
    useProperties: true,
    
    border: false,
    autoScroll: true,
    enableDrop: false,
    ddGroup: 'containerDDGroup',
    hideHeaders: true,
    rootVisible: false,
    collapsible : true,
    useArrows : true,
    // singleExpand : true,

    ctxNode: null,

    /**
     * init this treePanel
     */
    initComponent: function() {
        var me = this;

        if ( !me.recordClass ) {
            me.recordClass = Klb.system.Model.Container;
        }
        if (! me.appName && me.recordClass) {
            me.appName = me.recordClass.getMeta('appName');
        }
        if (! me.app) {
            me.app = Klb.system.appMgr.get(me.appName);
        }

        me.allowMultiSelection = false;
        if (me.allowMultiSelection) {
             me.selModel = new Ext.tree.MultiSelectionModel({});
        }

        var containerName  = me.recordClass ? me.recordClass.getContainerName() : 'container',
            containersName = me.recordClass ? me.recordClass.getContainersName() : 'containers';

        me.model = me.model || 'Klb.system.widgets.container.TreeModel';
        me.modelClass = me.modelClass || 'Klb.system.widgets.container.TreeModel';
        me.containerName = me.containerName || me.app.i18n.n_hidden(containerName, containersName, 1);
        me.containersName = me.containersName || me.app.i18n._hidden(containersName);
 
        me.root = {
            path: '/',
            cls: 'apibase-tree-hide-collapsetool',
            loaded: false,
            expanded: true,
            children: [{
                path: me.getRootPath(),
                text: _('personal'),
                parentId: 0,
                loaded: false
            }, {
                path: '/shared',
                text: _('shared'),
                parentId: 0,
                loaded: false
            }, {
                path: '/personal',
                text: _('otherUsers'),
                parentId: 0,
                loaded: false
            }].concat(me.getExtraItems())
        };

        me.columns = [
            {
                xtype: 'treecolumn',
                dataIndex: 'text',
                flex: 1,
                renderer: Ext.Function.bind(me.renderName,  this)
            }, {
                xtype: 'actioncolumn',
                width: 24,
                icon:  Ext.Loader.getPath('KlbDesktop') + '/resources/images/delete.png',
                iconCls: 'x-hidden',
                tooltip: 'Delete',
                handler:  Ext.Function.bind(me.handleDeleteClick, this)
            }
        ];
 
        // init drop zone
        me.dropConfig = {
            ddGroup: me.ddGroup || 'TreeDD',
            appendOnly: me.ddAppendOnly === true,
            // @todo check acl!
            onNodeOver : function(n, dd, e, data) {
                var node = n.node;
                // auto node expand check
                if(node.hasChildNodes() && !node.isExpanded()){
                    me.queueExpand(node);
                }
                return node.allowDrop ? 'apibase-tree-drop-move' : false;
            },
            isValidDropPoint: function(n, dd, e, data){
                return n.node.allowDrop;
            },
            completeDrop: Ext.emptyFn
        };
 
        me.listeners  = {
            itemmouseenter: me.showActions,
            itemmouseleave: me.hideActions
        };

        me.initContextMenu();

        me.treeLoader = me.treeLoader || Ext.create('Klb.system.widgets.tree.Loader', {
            model:  me.model,
            recordClass:       me.recordClass,
            getParams:         Ext.Function.bind(me.onBeforeLoad, me),
            inspectCreateNode: Ext.Function.bind(me.onBeforeCreateNode, me)
        });

        me.on('itemcontextmenu',   me.onContextMenu, me);
        me.on('itemclick',         me.onItemClick,   me);
        me.on('itemappend',        me.onItemAppend, me);
        me.on('itemexpand',        me.onItemExpand, me);
        me.on('beforenodedrop',    me.onBeforeNodeDrop, me);
        me.on('append',            me.onAppendNode, me);

        me.on('getviewtree',       me.getTreeView, me);

        me.store = { model: me.model,
                     attributes: {
                          appName: me.appName,
                          containerName: containerName,
                          containersName: containersName
                     },
                     getNodeByAt: function (index) {
                        var current = 0;

                        return (function find(nodes) {
                            var i, len = nodes.length;
                            for (i = 0; i < len; i++) {
                                if (current === index) {
                                    return nodes[i];
                                }
                                current++;
                                var found = find(nodes[i].childNodes);
                                if (found) {
                                    return found;
                                }
                            }
                        }(this.tree.root.childNodes));
                     }
        };
        me.store = me.applyStore(me.store);

        me.callParent();
    },

    getTreeView: function() {
        return this;
    },

    showActions: function(view, list, record, rowIndex, e) {
        var icons = Ext.DomQuery.select('.x-action-col-icon', record);
        if(view.getRecord(record).get('id') > 0) {
            Ext.each(icons, function(icon){
                Ext.get(icon).removeCls('x-hidden');
            });
        }
    },

    hideActions: function(view, list, record, rowIndex, e) {
 
        var icons = Ext.DomQuery.select('.x-action-col-icon', record);
        Ext.each(icons, function(icon){
            Ext.get(icon).addCls('x-hidden');
        });
    },

    renderName: function(value, metaData, list, rowIndex, colIndex, store, view) {

        return value;
    },

    handleDeleteClick: function(gridView, rowIndex, colIndex, column, e) {
        // Fire a "deleteclick" event with all the same args as this handler
        this.fireEvent('deleteclick', gridView, rowIndex, colIndex, column, e);
    },

    refreshView: function() {
        // refresh the data in the view.  This will trigger the column renderers to run, making sure the task counts are up to date.
        this.getView().refresh();
    },
    /**
     * delivers the personal root node path
     * 
     * @returns personal root node path
     */
    getRootPath: function() {
        return Klb.system.Container.getMyNodePath();
    },
    
    /**
     * template fn for subclasses to set default path
     * 
     * @return {String}
     */
    getDefaultContainerPath: function() {
        return this.defaultContainerPath || '/';
    },
    
    /**
     * template fn for subclasses to append extra items
     * 
     * @return {Array}
     */
    getExtraItems: function() {
        return this.extraItems || [];
    },
    
    /**
     * returns a filter plugin to be used in a grid
     */
    getFilterPlugin: function() {
        if (!this.filterPlugin) {
            this.filterPlugin = new Klb.system.widgets.tree.FilterPlugin({
                treePanel: this
            });
        }
        
        return this.filterPlugin;
    },
    
    /**
     * returns object of selected container/filter or null/default
     * 
     * @param {Array} [requiredGrants]
     * @param {Klb.system.Model.Container} [defaultContainer]
     * @param {Boolean} onlySingle use default if more than one container in selection
     * @return {Klb.system.Model.Container}
     */
    getSelectedContainer: function(requiredGrants, defaultContainer, onlySingle) {
        var container = defaultContainer,
            sm = this.getSelectionModel(),
            selection = typeof sm.getSelection == 'function' ? sm.getSelection() : [];
        
        if (Ext.isArray(selection) && selection.length > 0 && (! onlySingle || selection.length === 1 || ! container)) {
            container = this.getContainerFromSelection(selection, requiredGrants) || container;
        } 
        // postpone this as we don't get the whole container record here
        else if (this.filterMode == 'filterToolbar' && this.filterPlugin) {
           container = this.getContainerFromFilter() || container;
        }
        
        return container;
    },
    
    /**
     * get container from selection
     * 
     * @param {Array} selection
     * @param {Array} requiredGrants
     * @return {Klb.system.Model.Container}
     */
    getContainerFromSelection: function(selection, requiredGrants) {
        var result = null;

        Ext.each(selection, function(node) {
            if (node && Klb.system.Container.pathIsContainer(node.attributes.container.path)) {
                if (! requiredGrants || this.hasGrant(node, requiredGrants)) {
                    result = node.attributes.container;
                    result.owner = node.attributes.owner;
                    // take the first one
                    return false;
                }
            }
        }, this);
        
        return result;
    },

    /**
     * get container from filter toolbar
     * 
     * @param {Array} requiredGrants
     * @return {Klb.system.Model.Container}
     * 
     * TODO make this work -> atm we don't get the account grants here (why?)
     */
    getContainerFromFilter: function(requiredGrants) {
        var result = null;
        
        // check if single container is selected in filter toolbar 
        var ftb = this.filterPlugin.getGridPanel().filterToolbar,
            filterValue = null;

        ftb.filterStore.each(function(filter) {
            if (filter.get('field') == this.recordClass.getMeta('containerProperty')) {
                filterValue = filter.get('value');
                if (filter.get('operator') == 'equals') {
                    result = filterValue;
                } else if (filter.get('operator') == 'in' && filterValue.length == 1){
                    result = filterValue[0];
                }
                // take the first one
                return false;
            }
        }, this);
        
        return result;
    },
    
    /**
     * convert containerPath to treePath
     * 
     * @param {String}  containerPath
     * @return {String} treePath
     */
    getTreePath: function(containerPath) {
        var treePath = '/' + this.getRootNode().id + (containerPath !== '/' ? containerPath : '');

        // replace personal with otherUsers if personal && ! personal/myaccountid
        var matches = containerPath.match(/^\/personal\/{0,1}([0-9a-z_\-]*)\/{0,1}/i);
        if (matches) {
            if (matches[1] != Klb.App.Api.registry.get('currentAccount').accountId) {
                treePath = treePath.replace('personal', 'otherUsers');
            } else {
                treePath = treePath.replace('personal/'  + Klb.App.Api.registry.get('currentAccount').accountId, 'personal');
            }
        }

        return treePath;
    },

    setNodeBySelect: function(node) {
        var sm = this.getSelectionModel();
            // view =  this.getView();
        // view.select(node);
        if ( sm )
        {
            if (sm.getSelection() !== node) {
                sm.deselectAll();
                sm.clearSelections();
                sm.select(node);
            }

            if (sm.getSelection()[0] !== node) {
                parentNode = node.parentNode;
                if (parentNode) {
                    parentNode.expand();
                }
                treeView = this.getView();
                treeView.scrollRowIntoView(treeView.getRow(node));
            }

            this.onSelectionChange(sm, node);
        }
        this.refreshView();
        return this;
    },

    setNodeByExpand: function(node) {

            this.expandNode(node);
        return this;
    },

    getNodeById: function( nodeId ) {
        var me  = this,
            recordId = me.getStore().find('id', nodeId);
        return recordId < 0 ? null : me.getStore().getAt(recordId);
    },

    getNodeByPath: function(path) {
        var me  = this,
            recordId = me.getStore().find('path', path);
        return recordId < 0 ? null : me.getStore().getAt(recordId);
    },
    /**
     * checkes if user has requested grant for given container represented by a tree node 
     * 
     * @param {Ext.data.TreeStore} node
     * @param {Array} grant
     * @return {}
     */
    hasGrant: function(node, grants) {
        var attr = node.getData(),
            condition = false;

        if(attr && attr.leaf) {
            condition = true;
            Ext.each(grants, function(grant) {
                condition = condition && attr.container.account_grants[grant];
            }, this);
        }
        return condition;
    },

    /**
     * @private
     * - select default path
     */
    afterRender: function() {
        this.callParent(arguments);
        
        var defaultContainerPath = this.getDefaultContainerPath();
        
        if (defaultContainerPath && defaultContainerPath != '/') {
            var root = '/' + this.getRootNode().id;
            
            this.expand();
            // @TODO use getTreePath() when filemanager is fixed
            Ext.Function.defer(this.selectPath, 100, this, [root + defaultContainerPath]);
        }
        
        if (this.filterMode == 'filterToolbar' && this.filterPlugin) {
            this.filterPlugin.getGridPanel().filterToolbar.on('change', this.onFilterChange, this);
        }
    },
    
    /**
     * @private
     */
    initContextMenu: function() {

        this.contextMenuUserFolder = Klb.system.widgets.tree.ContextMenu.getMenu({
            nodeName: this.containerName,
            actions: [ 'add','reload', 'delete', 'rename', 'grants', 'properties'],
            scope: this,
            backend: 'Api_Container',
            backendModel: 'Container'
        });

        this.contextMenuFolderContainer = Klb.system.widgets.tree.ContextMenu.getMenu({
            nodeName: this.containerName,
            actions: ['addfolder',  'add', 'reload', 'delete', 'rename', 'grants'].concat(
                this.useProperties ? ['properties'] : []
            ).concat(
                this.useContainerColor ? ['changecolor'] : []
            ),
            scope: this,
            backend: 'Api_Container',
            backendModel: 'Container'
        });

        this.contextMenuSingleContainer = Klb.system.widgets.tree.ContextMenu.getMenu({
            nodeName: this.containerName,
            actions: [ 'delete', 'rename', 'grants'].concat(
                this.useProperties ? ['properties'] : []
            ).concat(
                this.useContainerColor ? ['changecolor'] : []
            ),
            scope: this,
            backend: 'Api_Container',
            backendModel: 'Container'
        });

        this.contextMenuSingleContainerProperties = Klb.system.widgets.tree.ContextMenu.getMenu({
            nodeName: this.containerName,
            actions: ['properties'],
            scope: this,
            backend: 'ApiContainer',
            backendModel: 'Container'
        });

    },

    /**
     * create Tree node by given node data
     *
     * @param nodeData
     * @param target
     * @returns {Ext.tree.AsyncTreeNode}
     */
    createTreeNode: function(nodeData, target) {
        var me = this;
            _node = Ext.create(me.model, nodeData);

        target.appendChild(_node);
        me.fireEvent('containeradd', nodeData);
    },

    createNode: function(nodeData) {
        var me = this;

        return this.treeLoader.createNode(nodeData);
    },

    onBeforeLoad: function(node) {

        var path = node && node.attributes ? node.attributes.path : '/',
            type = Klb.system.Container.path2type(path),
            owner = Klb.system.Container.pathIsPersonalNode(path);

        if (type === 'personal' && ! owner) {
            type = 'otherUsers';
        }

        var params = {
            method: 'Api_Container.getContainer',
            application: this.app.appName,
            containerType: type || 'shared',
            requiredGrants: this.requiredGrants,
            owner: owner
        };

        return params;
    },

    /**
     * show context menu
     *
     * @param {} node
     * @param {} event
     */
    onContextMenu: function( view, record, item, index, event, eOpts) {

        var sm = this.getSelectionModel(),
            node = sm.getLastSelected(),
            container = node.attributes.container,
            path = container.path,
            owner;
        // this.ctxNode = record;
        this.ctxNode = node;

        if (! Ext.isString(path)) {
            return;
        }

        if (Klb.system.Container.pathIsContainer(path)) {
            if (container.account_grants && container.account_grants.adminGrant) {
                this.contextMenuSingleContainer.showAt(event.getXY());
            } else {
                this.contextMenuSingleContainerProperties.showAt(event.getXY());
            }
        } else if (path.match(/^\/shared$/)
             && (Klb.system.Common.hasRight('admin', this.app.appName)
                    || Klb.system.Common.hasRight('manage_shared_folders', this.app.appName))){

            this.contextMenuUserFolder.showAt(event.getXY());
        } else if (Klb.App.Api.registry.get('currentAccount').accountId == Klb.system.Container.pathIsPersonalNode(path)){

            this.contextMenuUserFolder.showAt(event.getXY());
        }

        event.preventDefault();
    },

    /**
     * adopt attr
     *
     * @param {Object} attr
     */
    onBeforeCreateNode: function(attr) {
        // var view = this.getStore().getTreeView();

        if (attr.accountDisplayName) {
            attr.name = attr.accountDisplayName;
            attr.path = '/personal/' + attr.accountId;
            attr.id = attr.accountId;
        }

        if (! attr.name && attr.path  ) {
            attr.name = Klb.system.Container.path2name(attr.path, this.containerName, this.containersName);
        }
    },

    /**
     * called when node is appended to this tree
     */
    onAppendNode: function(tree, parent, appendedNode, idx) {

        if (appendedNode.leaf && this.hasGrant(appendedNode, this.requiredGrants)) {
            if (this.useContainerColor) {
                appendedNode.ui.render = appendedNode.ui.render.createSequence(function() {
                    this.colorNode = Ext.DomHelper.insertAfter(this.iconNode,
                        {tag: 'span', html: '&nbsp;&#9673;&nbsp', style: {color: appendedNode.attributes.container.color || '#808080'}}, true);
                }, appendedNode.ui);
            }
        }
    },

     /**
     * expand automatically on node click
     * @param {} view
     * @param {} node
     * @param HTMLElement tr
     * @param Number rowIndex
     * @param Number rowIndex
     * @param {} e
     * @param {} eOpts
     */
     onItemClick: function(view, node, tr, rowIndex, e, eOpts) {

        var sm = this.getSelectionModel(),
            selectedNode = sm.getSelection();
        // NOTE: in single select mode, a node click on a selected node does not trigger
        // a selection change. We need to do this by hand here
        if ( sm.hasSelection() && ! this.allowMultiSelection && node == selectedNode[0]) {
            this.onSelectionChange(sm, node);
        }
        node.expand();
    },

    /**
     * permit selection of nodes with missing required grant
     * 
     * @param {} sm
     * @param {} newSelection
     * @param {} oldSelection
     * @return {Boolean}
     */
    onBeforeSelect: function(sm, newSelection, oldSelection) {

        if (this.requiredGrant && newSelection.isLeaf()) {
            var accountGrants =  newSelection.attributes.container.account_grants || {};
            if (! accountGrants[this.requiredGrant]) {
                var message = '<b>' + Ext.String.format(_("You are not allowed to select the {0} '{1}':"), this.containerName, newSelection.attributes.text) + '</b><br />' +
                               Ext.String.format(_("{0} grant is required for desired action"), this.requiredGrant);
                Ext.Msg.alert(_('Insufficient Grants'), message);
                return false;
            }
        }
    },

    /**
     * record  add on container node
     *
     * @param {Object} parent
     * @param {Object} node
     * @param Number   index
     * @param {Object} eOpts
     */
    onItemAppend: function( parent, node, index, eOpts) {
        if ( !node.attributes ) {
            node.attributes = {
                name: node.get('text'),
                path: node.get('path')
            }
        };
        return true;
    },

    /**
     * record got expand on container node
     *
     * @param {Object} node
     * @param {Object} eOpts
     */
    onItemExpand: function(node, eOpts) {
        var me = this,
            options = {},
            target = node;

        if (  target.isLeaf() ) {
            return true;
        }

        options.params  = me.treeLoader.getParams(node);
        options.beforeSuccess = function(response) {
            var folder, result, readOptions = null;
            // this.jsonReader.readRecords(recordData);
            if (response.responseText) {
                result = this.reader.getResponseData(response);
                if (result && result.__$isError) {
                    return new Ext.data.ResultSet({
                        total: 0,
                        count: 0,
                        records: [],
                        success: false,
                        message: result.msg
                    });
                } else {
                    folder = this.reader.readRecords(result, readOptions);
                }
            } else {
                folder = this.reader.readRecords(response, readOptions);
            }

            this.reader.jsonData = {
                filter: result && result.filter  ? result.filter : false
            };

            return [folder];
        };

        options.success = function(recordSet, response, request){
            var nodeData = response.responseData || Ext.decode(response.responseText);

            var  _records = nodeData.results ?  nodeData.results : nodeData;
            target.beginEdit();

            for(var i = 0, len = _records.length; i < len; i++){

                if ( !target ) {
                    target = me.getStore().getRoot();
                }
                me.createTreeNode(_records[i], target);
            }
            target.cancelEdit();
            me.getStore().sync();
        };

        me.treeLoader.doXHTTPRequest(options);
        return true;
    },

    /**
     * record got dropped on container node
     * 
     * @param {Object} dropEvent
     * @private
     * 
     * TODO use Ext.direct
     */
    onBeforeNodeDrop: function(dropEvent) {
        var me = this,
            targetContainerId = dropEvent.target.id;
 
        // get selection filter from grid
        var sm = this.app.getMainScreen().getCenterPanel().getGrid().getSelectionModel();
        if (sm.getCount() === 0) {
            return false;
        }
        var filter = sm.getSelectionFilter();

        this.treeLoader.moveNode(filter, null, dropEvent);
        // move messages to folder
        Klb.system.Ajax.request({
            params: {
                method: 'Api_Container.moveRecordsToContainer',
                targetContainerId: targetContainerId,
                filterData: filter,
                model: this.recordClass.getMeta('modelName'),
                applicationName: this.recordClass.getMeta('appName')
            },
            // scope: this,
            success: function(result, request){
                // update grid
                me.app.getMainScreen().getCenterPanel().loadGridData();
            }
        });
        
        // prevent repair actions
        dropEvent.dropStatus = true;
        return true;
    },
    
    /**
     * called on filtertrigger of filter toolbar
     * clears selection silently
     */
    onFilterChange: function() {
        /* 2012-01-30 cweiss: i have no idea what this was for.
         * if its needed please document here!
        var sm = this.getSelectionModel();
        
        sm.suspendEvents();
        sm.clearSelections();
        sm.resumeEvents();
        */
    },
    
    /**
     * called when tree selection changes
     * 
     * @param {} sm
     * @param {} node
     */
    onSelectionChange: function(sm, nodes) {

        if (this.filterMode == 'gridFilter' && this.filterPlugin) {
            this.filterPlugin.onFilterChange();
        }
        if (this.filterMode == 'filterToolbar' && this.filterPlugin) {
            // get filterToolbar
            var ftb = this.filterPlugin.getGridPanel().filterToolbar;
            
            // in case of filterPanel
            ftb = ftb.activeFilterPanel ? ftb.activeFilterPanel : ftb;

            // remove all ftb container and /toberemoved/ filters
            ftb.supressEvents = true;
            ftb.filterStore.each(function(filter) {
                var field = filter.get('field');
                // @todo find criteria what to remove
                if (field === 'container_id' || field === 'attender' || field === 'path') {
                    ftb.deleteFilter(filter);
                }
            }, this);
            ftb.supressEvents = false;
            
            // set ftb filters according to tree selection
            var containerFilter = this.getFilterPlugin().getFilter();
            ftb.addFilter(Ext.create(ftb.modelClass, containerFilter) );
        
            ftb.onFiltertrigger();
            
            // finally select the selected node, as filtertrigger clears all selections
            sm.suspendEvents();
            Ext.each(nodes, function(node) {
                sm.select(node, Ext.EventObject, true);
            }, this);
            sm.resumeEvents();
        }
    },
    
    /**
     * selects path by container Path
     * 
     * @param {String} containerPath
     * @param {String} [attr]
     * @param {Function} [callback]
     */
    selectContainerPath: function(containerPath, attr, callback) {
        return this.selectPath(this.getTreePath(containerPath), attr, callback);
    },
    
    /**
     * get default container for new records
     * 
     * @param {String} default container registry key
     * @return {Klb.system.Model.Container}
     */
    getDefaultContainer: function(registryKey) {
        if (! registryKey) {
            registryKey = 'defaultContainer';
        }
        
        var container = Klb.App[this.appName].registry.get(registryKey);
        
        return this.getSelectedContainer('addGrant', container, true);
    }
});
