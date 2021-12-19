/*
 * Klb Desktop 3.0.1
 *
 * @package     Modern
 * @subpackage  Tasks.Viewport
 * @copyright   Copyright (c) 2018 LLC ICS (http://www.icstime.com)
 * @license     http://www.gnu.org/licenses/agpl.html AGPL Version 3
 */

Ext.define('KlbDesktop.MVC.Tasks.view.Viewport', {
    extend: 'Klb.abstract.MVCViewport',

    winid: 'widgetmvctasks',
    alias: 'widget.mvctasks',

    items: [{xtype: 'apptasksmain', layout: 'fit'}]
});

Ext.define('KlbDesktop.MVC.Tasks.view.main.Main', {
    extend: 'Klb.abstract.ViewportModern',
    xtype: 'apptasksmain',

    appName: 'Tasks',
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