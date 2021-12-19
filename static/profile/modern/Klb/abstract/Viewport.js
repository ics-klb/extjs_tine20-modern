/**
 * @class Klb.abstract.Viewport
 * @extends Ext.panel.Panel
 * Description
 * extend: "Ext.container.Viewport"
 **/

Ext.define("Klb.abstract.Viewport",{   
    extend: 'Ext.window.Window',
    requires: [
        'Ext.layout.container.Border'
    ],
                
    constrain: true,
    height: 285,
    width: 334,
    layout: {
        type: 'border'
    },                    
    title: 'Klb.abstract.Viewport',

    autoScroll: true,

    initComponent: function() {
        
    },
	
    createWindowViewport: function(winid, items){
        var win, desktop = KlbExtDesk.getApp().getDesktop();
            win =  desktop.getWindow(winid);
        if (!win) {
              win =  desktop.createWindow({  //win =  Ext.create("Ext.ux.desktop.Window", {
                    title: 'Klb.abstract.Viewport',
                    id: winid
               }, false);
        } 
             win.update('');
             win.add( items );
      return true;
    },

	buildItems: function(){
		return [{
			region	: "center",
			border	: false,
			html	: "Please override the 'buildItems' method in your subclass!"
		}];
	},

	buildTopButtons	: function(){
		return [{
			xtype	: "buttongroup",
			title	: "Actions",
			defaults: {scale: 'large',iconAlign:"top",width:45},
			items	: [{
				text 	: "New",
				action	: "new",
				iconCls	: "new-action-icon"
			},{
				text	: "Save",
				action	: "save",
				iconCls	: "save-action-icon"
			},{
				text	: "Delete",
				action	: "delete",
				disabled: true,
				iconCls	: "delete-action-icon"
			}]
		},{
			xtype	: "buttongroup",
			title	: "Export",
			defaults: {scale: 'large',iconAlign:"top",width:45},
			items	: [{
				text	: "Excel",
				action	: "export",
				iconCls	: "export-action-icon"
			},{
				text	: "Print",
				action	: "print",
				iconCls	: "print-action-icon"
			}]
		}];
	}
});