Ext.ns('KlbDesktop.widgets');

/**
 * Widget to display maps
 *
 * @namespace   KlbDesktop.widgets
 * @class       Klb.system.widgets.MapPanel
 * @extends     GeoExt.MapPanel
 */
Ext.define('Klb.system.widgets.MapPane', {
    extend: 'GeoExt.MapPanel',

    xtype: 'mappanel',
    zoom: 4,
    map: null,
    layers: null,
    
    /**
     * @private
     */
    initComponent: function() {
        this.map =  new OpenLayers.Map();
        this.layers = [
            new OpenLayers.Layer.OSM()
        ];
        
        if(this.center instanceof Array) {
            this.center = new OpenLayers.LonLat(this.center[0], this.center[1]).transform(new OpenLayers.Projection("EPSG:4326"), new OpenLayers.Projection("EPSG:900913"));
        }

        Klb.system.widgets.MapPanel.superclass.initComponent.call(this);
    },
    
    setCenter: function(lon, lat) {
        this.center = new OpenLayers.LonLat(lon, lat).transform(new OpenLayers.Projection("EPSG:4326"), this.map.getProjectionObject());
        this.map.setCenter(this.center);
        
        // add a marker
        var size = new OpenLayers.Size(32,32);
        var offset = new OpenLayers.Pixel(0, -size.h);
        var icon = new OpenLayers.Icon('images/oxygen/32x32/actions/flag-red.png', size, offset);
        
        var markers = new OpenLayers.Layer.Markers( "Markers" );
        markers.addMarker(new OpenLayers.Marker(this.center, icon));
        this.map.addLayer(markers);
    },
    
    beforeDestroy: function() {
        delete this.map;
        this.supr().beforeDestroy.apply(this, arguments);
    }
});

//Ext.reg('widget-mappanel', Klb.system.widgets.MapPanel);
