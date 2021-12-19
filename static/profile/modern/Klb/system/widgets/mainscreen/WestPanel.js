/*
 * Modern 3.0
 * 
 * @license     http://www.gnu.org/licenses/agpl.html AGPL Version 3
 * @author      Cornelius Weiss <c.weiss@metaways.de>
 * @copyright   Copyright (c) 2007-2013 Metaways Infosystems GmbH (http://www.metaways.de)
 */
 
/**
 * @namespace   Klb.system.widgets.mainscreen
 * @class       Klb.system.widgets.mainscreen.WestPanel
 * @extends     Ext.ux.Portal
 */

Ext.ns('Klb.system.widgets.mainscreen');

Ext.define('Klb.system.widgets.mainscreen.WestPanel', {
    extend: 'Ext.ux.Portal',   

    defaults: {},

    xtype: 'mainscreenwestpanel',
    /**
     * @cfg {Array} contentTypes
     * Array of Objects
     * Object Properties: "model", "requiredRight"
     * Prop. model (e.g. "Abc") will be expanded to Klb.Application.Model.Abc
     * Prop. requiredRight (e.g. "read") will be expanded to Klb.system.Common.hasRight('read', this.app.appName, recordClass.getMeta('recordsName').toLowerCase())
     * Prop. singularContainerMode (bool): when true, the records of the model doesn't have containers, so no containertreepanel is rendered
     *                                     but a containertreenode must be defined in Application.js
     * Prop. genericCtxActions (Array of Strings e.g. "['rename','grant']") Creates a Klb.system.widgets.tree.ContextMenu with the actions in this array                                    
     */
    contentTypes: null,

    /**
     * @cfg {String} contentType
     * defines the contentType (e.g. Xyz), which will be expanded to Klb.Application.Model.Xyz, this panel controls 
     */
    contentType: null,
    
    /**
     * @cfg {String} containerTreeClass
     * name of container tree class in namespace of this app (defaults to TreePanel)
     * the class name will be expanded to Klb.App[this.appName][this.containerTreePanelClassName]
     */
    containerTreePanelClassName: 'TreePanel',
    
    /**
     * @cfg {String} favoritesPanelClassName
     * name of favorites class in namespace of this app (defaults to FilterPanel)
     * the class name will be expanded to Klb.App[this.appName][this.favoritesPanelClassName]
     */
    favoritesPanelClassName: 'FilterPanel',
    
    /**
     * @cfg {Bool} hasContentTypeTreePanel
     * west panel has modulePanel (defaults to null -> autodetection)
     */
    hasContentTypeTreePanel: null,
    
    /**
     * @cfg {Bool} hasContainerTreePanel
     * west panel has containerTreePanel (defaults to null -> autodetection)
     */
    hasContainerTreePanel: null,
    
    /**
     * @cfg {Bool} hasFavoritesPanel
     * west panel has favorites panel (defaults to null -> autodetection)
     */
    hasFavoritesPanel: null,
    defaultType : 'uxportalcolumn',
    // autoHeight: true,
    border: false,
    stateful: true,
    stateEvents: ['collapse', 'expand', 'drop'],
    // layout: 'column',
    // cls :   'x-uxportal',
    /**
     * inits this west panel
     */
    initComponent: function() {

        this.stateId = this.app.appName + this.getContentType() + '-mainscreen-westpanel';
        var fpcn =  this.getContentType() + this.favoritesPanelClassName;
        this.hasFavoritesPanel = Ext.isBoolean(this.hasFavoritesPanel) ? this.hasFavoritesPanel : !! Klb.App[this.app.appName].getMVC(fpcn);

        this.hasContentTypeTreePanel = Ext.isArray(this.contentTypes) && this.contentTypes.length > 1;

        if (this.hasContainerTreePanel === null) {
            this.hasContainerTreePanel = true;
            if (this.contentTypes) {
                Ext.each(this.contentTypes, function(ct) {
                    if ((ct.hasOwnProperty('modelName') && ct.modelName == this.contentType) && (ct.singularContainerMode)) {
                        this.hasContainerTreePanel = false;
                        return false;
                    }
                }, this);
            }
        }
        
        this.items = this.getPortalColumn();
        this.callParent();
    },
    
    /**
     * called after rendering process
     */
    afterRender: function() {

        this.callParent(arguments);
                       
        this.getPortalColumn().items.each(function(item, idx) {
            //bubble state events
            item.enableBubble(['collapse', 'expand', 'selectionchange']);
        }, this);
    },
    
    /**
     * initializes the stateif no state is saved
     * overwrites the Ext.Component initState method
     */
    initState: function() {
        var state = Ext.state.Manager.get(this.stateId) ? Ext.state.Manager.get(this.stateId) : this.getState();

        if(this.fireEvent('beforestaterestore', this, state) !== false) {
            this.applyState(Ext.apply({}, state));
            this.fireEvent('staterestore', this, state);
        }
    },
    
    /**
     * applies state to cmp
     */
    applyState: function(state) {
console.log('applyState');        
        var collection = this.getPortalColumn().items,
            c = new Array(collection.getCount()), k = collection.keys, items = collection.items;

        Ext.each(state.order, function(position, idx) {
            c[idx] = {key: k[position], value: items[position], index: position};
        }, this);

        for(var i = 0, len = collection.length; i < len; i++){
            if (c[i] && c[i].value) {
                items[i] = c[i].value;
                k[i] = c[i].key;
            }
        }
        collection.fireEvent('sort', collection);

        collection.each(function(item, idx) {
            if ((! item) || typeof item.addFill === 'function') return;
            if (item.getEl()) {
                item[state.collapsed[idx] ? 'collapse' : 'expand'](false);
            } else {
                item.collapsed = (state.collapsed ? !!state.collapsed[idx] : false);
            }
        }, this);
        
    },
    
    /**
     * returns additional items for the westpanel
     * template fn to be overrwiten by subclasses
     */
    getAdditionalItems: function() {

        return this.additionalItems || [];
    },

    getContentType: function() {

        return (this.contentType) ? this.contentType : '';
    },
    
    /**
     * returns containerTree panel
    */
    getContainerTreePanel: function() {
        var  ct = this.app.getMainScreen().getActiveContentType(),
            panelName =  ct + 'TreePanel',
            panelClass = Klb.App[this.app.appName].getMVC('TreePanel');

        if(!this[panelName]) {
            if(  panelClass ) this[panelName] = Ext.create(panelClass, {app: this.app} );
                else this[panelName] = Ext.create('Klb.system.widgets.persistentfilter.PickerPanel', { app: this.app } );

            this[panelName].on('click', function (node, event) {
                if(node != this.lastClickedNode) {
                    this.lastClickedNode = node;
                    this.fireEvent('selectionchange');
                }
            });
        }

        return this[panelName];
    },
    
    /**
     * returns favorites panel
     */
    getFavoritesPanel: function() {
        var ct = this.app.getMainScreen().getActiveContentType(),
            panelName = ct + this.favoritesPanelClassName,
            panelClass = Klb.App[this.app.appName].getMVC( this.favoritesPanelClassName );

            if(!this[panelName]) {
                this[panelName] = Ext.create( panelClass, {
                    root: null,
                    titleCollapse: true,
                    title: '',
                    baseCls: 'ux-arrowcollapse',

                    app: this.app,
                    contentType: ct,

                    style: {
                        width: '100%',
                        overflow: 'hidden'
                    },

                    treePanel: (this.hasContainerTreePanel) ? this.getContainerTreePanel() : null,
                    listeners: {
                        scope: this,
                        click: function (node, event) {
                            if(node != this.lastClickedNode) {
                                this.lastClickedNode = node;
                                this.fireEvent('selectionchange');
                            }
                        }
                    }
                });
            }

        try {
        } catch(e) {
            Klb.Logger.info('No Favorites Panel created');
        }
        
        return this[panelName];
    },
    
    /**
     * returns filter plugin of west panel for given content type
     */
    getFilterPlugin: function(contentType) {
  
        if (this.hasContainerTreePanel) {
            return this.getContainerTreePanel().getFilterPlugin();
        } else {
            return new Klb.system.widgets.grid.FilterPlugin({
                getValue: function() {
                    return [
                    ];
                }
            });
        }
    },
    
    /**
     * returns the one and only uxportalcolumn of this west panel
     */
    getPortalColumn: function() {
        
        if (! this.uxportalColumn) {

            var items = [];         
            if (this.hasContainerTreePanel) {
                var containerTreePanel = this.getContainerTreePanel();
                
                var containersName = containerTreePanel.recordClass
                    ? containerTreePanel.recordClass.getContainersName()
                    : _('containers');
                
                // recheck if container tree is a container tree as in apps not dealing
                // with containers we don't want a collapsed arrow header
                var isContainerTreePanel = typeof containerTreePanel.selectContainerPath === 'function';
 
                if (isContainerTreePanel ) {
                    this.defaults = {
                        collapsible: false,
                        animCollapse: true,
                        width: '100%',
                        // baseCls: 'ux-arrowcollapse',
                        titleCollapse: false,
                        draggable : true,
                        autoScroll: false,
                        rootVisible: false
                    };
                }
 
                items.push(Ext.apply(this.getContainerTreePanel(), {
                    title: isContainerTreePanel ? containersName : false,
                    collapsed: isContainerTreePanel
                }, this.defaults));

            }

            if (this.hasFavoritesPanel) {
                // favorites panel
                items.unshift(Ext.apply(this.getFavoritesPanel(), {
                    title: _('Favorites')
                }, this.defaults));
            }

            items = items.concat(this.getAdditionalItems());

            // save original/programatical position
            // NOTE: this has to be done before applyState!
            if (items.length) {
                Ext.each(items, function(item, idx) {
                    item.startPosition = idx;
                }, this);
            }
            this.uxportalColumn = new Ext.ux.PortalColumn({
                columnWidth: 1,
                items: items
            });

            this.uxportalColumn.on('resize', function(cmp, width) {
                this.uxportalColumn.items.each(function(item) {
                    item.setWidth(width);
                }, this);
            }, this);
        }
        
        return this.uxportalColumn;
    },
    
    /**
     * gets state of this cmp
     */
    getState: function() {
console.log('getState');
        var state = {
            order: [],
            collapsed: []
        };
        
        this.getPortalColumn().items.each(function(item, idx) {
            state.order.push(item.startPosition);
            state.collapsed.push(!!item.collapsed);
        }, this);
        
        return state;
    }
   
});
