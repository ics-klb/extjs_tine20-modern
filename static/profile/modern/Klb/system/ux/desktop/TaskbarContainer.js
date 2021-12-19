/*
 * IcsDesktop 2.4.0
 * 
 * @package     Modern
 * @subpackage  JS Library
 * @copyright   Copyright (c) 2018 LLC ICS (http://www.icstime.com)
 * @license     http://www.gnu.org/licenses/agpl.html AGPL Version 3
 */

Ext.define("Klb.system.ux.desktop.TaskbarContainer",{
    extend: "Ext.toolbar.Toolbar",

    flex : 1,
    enableOverflow	: true,
    cls: "ux-toolbar-container",
    item: ["&#160;"]
});