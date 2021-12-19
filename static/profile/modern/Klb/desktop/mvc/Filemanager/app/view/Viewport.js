/*
 * Klb Desktop 3.0.1
 *
 * @package     Modern
 * @subpackage  Filemanager.Viewport
 * @copyright   Copyright (c) 2018 LLC ICS (http://www.icstime.com)
 * @license     http://www.gnu.org/licenses/agpl.html AGPL Version 3
 */

Ext.define('KlbDesktop.MVC.Filemanager.view.Viewport', {
    extend: 'Klb.abstract.MVCViewport',

    winid: 'widgetmvcfilemanager',
    alias: 'widget.mvcfilemanager',

    items: [{xtype: 'appviewfilemanagermain'}]
});

Ext.define('KlbDesktop.MVC.Filemanager.view.main.Main', {
    extend: 'Klb.abstract.ViewportModern',
    xtype: 'appviewfilemanagermain',
    layout: 'fit',
    appName: 'Filemanager',
    /**
     * after render handler
     */
    setupView: function() {
        var me = this,
            viewApp = Klb.system.appMgr.get(this.appName).getMainScreen();

        me . setViewCenter( viewApp.getCenterPanel() )
            . setViewWest( viewApp.getWestPanel() )
             . setViewNorth( viewApp.getNorthPanel() );
        return me;
    }
});