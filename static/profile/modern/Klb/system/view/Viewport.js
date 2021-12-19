/**
 * Main application Viewport
 * Uses a {@link Ext.layout.container.Border} layout for ccontent organization
 */
Ext.define('Klb.system.view.Viewport', {
    extend: 'Klb.abstract.Viewport',
    alias: 'widget.systemViewport',
//    id: 'widget.mvc_system-viewport',  // Error #Extjs 6
    winid: 'widget.mvc_systemwiewport',

    itemsView: [
         { xtype: 'klbpanel',   region: 'north',  border: false },
         { xtype: 'klbpanel' ,  region: 'west',   border: false,   layout: { type: 'accordion', titleCollapse: false, animate: true, activeOnTop: true}, collapsible : true , collapsed: true,  split : true, width: 300 },
         { xtype: 'klbpanel',   region: 'center', border: false,  layout: { type: 'fit'} }
    ]
});