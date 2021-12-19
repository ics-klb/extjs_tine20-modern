/**
 * @class Klb.ui.ModalPanel
 * @extends Ext.Panel
 * A modal panel that appears in top of everything
 *
 **/

Ext.define("Klb.abstract.ModalWindow",{
	extend: "Ext.Window",
    layout: "fit",
    cls   : "window-modal",
    modal  : true,
    draggable   : false,
    resizable   : false,
    bodyPadding : 10
});