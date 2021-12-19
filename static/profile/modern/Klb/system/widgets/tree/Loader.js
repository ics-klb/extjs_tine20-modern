/*
 * Modern 3.0
 * 
 * @license     http://www.gnu.org/licenses/agpl.html AGPL Version 3
 * @author      Philipp Schuele <p.schuele@metaways.de>
 * @copyright   Copyright (c) 2009 Metaways Infosystems GmbH (http://www.metaways.de)
 *
 */

Ext.ns('KlbDesktop.widgets', 'Klb.system.widgets.tree');

/**
 * generic tree loader for tine trees
 * - calls json method with a filter to return children of a node
 * 
 * @namespace   Klb.system.widgets.tree
 * @class       Klb.system.widgets.tree.Loader
 * @extends     Ext.data.TreeStore
 */
Ext.define('Klb.system.widgets.tree.Loader', {
    extend: 'Klb.system.data.RecordProxy',
    preloadChildren: true,

    /**
     * @private
     */
    $configStrict: false,

    treeOnLoad: Ext.emptyFn,
    /**
     * template fn for subclasses to inspect createNode
     *
     * @param {Object} attr
     */
    inspectCreateNode: Ext.EmptyFn,

    /**
     * @cfg {Number} how many chars of the containername to display
     */
    displayLength: 25,

    /**
     * @cfg {application}
     */
    app: null,

    /**
     * @cfg {String} method
     */
    method: null,

    /**
     * @cfg {Array} of filter objects for search method
     */
    filter: null,

    view: null,

    url: KlbSys.requestUrl,

    /**
     * @cfg {Ext.util.MixedCollection} recordCollection
     */
    recordCollection: null,

    /**
     * @cfg {String} selectedFilterId id to autoselect
     */
    selectedFilterId : null,

    /**
     * @private
     */
    createNode: function() {

        if ( this.inspectCreateNode ) {
            this.inspectCreateNode.apply(this, arguments);
        }
        return this.callParent(arguments);
    },

    /**
     * returns params for async request
     *
     * @param {Ext.tree.TreeNode} node
     * @return {Object}
     */
    getParams: function(node) {
        return {
            method: this.method,
            filter: this.filter
        };
    },


    /**
     * @param {Ext.data.TreeStore}  node
     *  @param {Function}
     *  callback Function to call after the node has been loaded. The function is passed the TreeNode which was requested to be loaded.
     *  @param (Object) scope The cope (this reference) in which the callback is executed. defaults to the loaded TreeNode.
    */
    requestData : function(node, callback, scope) {
        if (this.fireEvent("beforeload", this, node, callback) !== false) {

            node.beginUpdate();
            this.recordCollection.each(function(record) {
                var n = this.createNode(record.copy().data);
                if (n) {
                    node.appendChild(n);
                }
            }, this);
            node.endUpdate();

            this.runCallback(callback, scope || node, [node]);

        } else {
            // if the load is cancelled, make sure we notify
            // the node that we are done
            this.runCallback(callback, scope || node, []);
        }
    },

    moveNode: function(filter, node, event) {

        var me = this,
            targetContainerId = event.target.id;

        // move messages to folder
        Klb.system.Ajax.request({
            params: {
                method: 'Api_Container.moveRecordsToContainer',
                targetContainerId: targetContainerId,
                filterData: filter,
                model: me.view.recordClass.prototype.getMeta('modelName'),
                applicationName: me.view.recordClass.prototype.getMeta('appName')
            },
            success: function(result, request){
                // update grid
                me.view.app.getMainScreen().getCenterPanel().loadGridData();
            }
            // scope: me.view
        });
    },

    processResponse: function(response, node, callback, scope) {

        // convert tine search response into usual treeLoader structure
        var o = response.responseData || Ext.decode(response.responseText);
        if (o.totalcount) {
            // take results part as response only
            response.responseData = o.results;
        }
        
        return this.callParent(arguments);
    }
 });
