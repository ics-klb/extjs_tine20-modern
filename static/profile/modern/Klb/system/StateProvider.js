/*
 * Modern 3.0.1
 *
 * @package     System
 * @copyright   Copyright (c) 2018 LLC ICS (http://www.icstime.com)
 * @license     http://www.gnu.org/licenses/agpl.html AGPL Version 3
 */

/**
 * @namespace   Klb.system
 * @class       Klb.system.StateProvider
 * @extends     Ext.state.Provider
 */

Ext.define("Klb.system.StateProvider", {
    extend: "Ext.state.Provider",

    constructor: function(config){
       var me = this;
          config = config || {};
       me.callParent([config]);
       this.state = this.readRegistry();
    },

    // private
    clear: function(name){
        // persistent clear
        Klb.system.clearState(name);
        // store back in registry (as needed for popups)
        var stateInfo = Klb.App.Api.registry.get('stateInfo');
        delete stateInfo[name];
        
        Klb.system.StateProvider.superclass.clear.call(this, name);
    },
    
    // private
    readRegistry: function() {
        var states = {};
        var stateInfo = Klb.App.Api.registry.get('stateInfo');
        for (var name in stateInfo) {
            states[name] = this.decodeValue(stateInfo[name]);
        };
        
        return states;
    },
    
    // private
    set: function(name, value) {
        if(typeof value == "undefined" || value === null){
            this.clear(name);
            return;
        }
        
        var encodedValue = this.encodeValue(value);
        // persistent save OpenLayers
//        Klb.App.Api.setState(name, encodedValue);

        // store back in registry (as needed for popups)
        var stateInfo = Klb.App.Api.registry.get('stateInfo');
        stateInfo[name] = encodedValue;

        Klb.system.StateProvider.superclass.set.call(this, name, value);
    }
});
