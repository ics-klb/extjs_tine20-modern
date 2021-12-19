/*
 * Klb Desktop 3.0.1
 * 
 * @package     Modern
 * @subpackage  Filemanager.NodeTreePanel
 * @copyright   Copyright (c) 2018 LLC ICS (http://www.icstime.com)
 * @license     http://www.gnu.org/licenses/agpl.html AGPL Version 3
 */

Ext.ns('KlbDesktop.MVC.Filemanager');

/**
 * filter plugin for container tree
 * 
 * @namespace Klb.system.widgets.tree
 * @class     KlbDesktop.MVC.Filemanager.PathFilterPlugin
 * @extends   Klb.system.widgets.grid.FilterPlugin
 */
Ext.define('KlbDesktop.MVC.Filemanager.view.PathFilterPlugin', {
    extend: 'Klb.system.widgets.tree.FilterPlugin',
    /**
     * select tree node(s)
     * 
     * @param {String} value
     */
    selectValue: function(value) {
        var me = this,
            values = Ext.isArray(value) ? value : [value];
        Ext.each(values, function(value) {

            var path = Ext.isString(value) ? value : (value ? value.path : '') || '/',
                treePath = me.treePanel.getTreePath(path);
            
            this.selectPath.call(me.treePanel, treePath, null, function() {
                // mark this expansion as done and check if all are done
                value.isExpanded = true;
                var allValuesExpanded = true,
                    node = null,
                    selModel = me.treePanel.getSelectionModel(),
                    nodes = selModel.getSelection();
                    
                Ext.each(values, function(v) {
                    allValuesExpanded &= v.isExpanded;
                }, me);

                node = nodes.length ? nodes[0] : me.treePanel.getStore().findNode('path', value.path );
                if (allValuesExpanded) {
                    selModel.resumeEvents();
                    
                    // @TODO remove this code when fm is cleaned up conceptually
                    //       currentFolderNode -> currentFolder
                    me.treePanel.updateActions(selModel, node);
                    Klb.system.appMgr.get('Filemanager').getMainScreen(). getCenterPanel().currentFolderNode = node;
                }
            }, true); // .createDelegate(this)
        }, this);
    }
});
