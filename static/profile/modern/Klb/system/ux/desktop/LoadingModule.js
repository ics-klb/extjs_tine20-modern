/*
 * IcsDesktop 2.4.0
 * 
 * @package     Modern
 * @subpackage  JS Library
 * @copyright   Copyright (c) 2018 LLC ICS (http://www.icstime.com)
 * @license     http://www.gnu.org/licenses/agpl.html AGPL Version 3
 */

Ext.define("Klb.system.ux.desktop.LoadingModule",{
    extend  : "Klb.system.Abstract.ModalWindow",

    bodyCls : "ux-loading-module",
    layout  : "auto",
    width   : 400,
    height  : 240,
    closable: false,

    initComponent   : function() {
        var me = this;
        me.html = "<p>Please wait, loading module...</p>";
        me.callParent();
    }
});