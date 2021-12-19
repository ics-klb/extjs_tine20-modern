/*
 * Modern 3.1.0
 * 
 * @license     http://www.gnu.org/licenses/agpl.html AGPL Version 3
 * @author      Cornelius Weiss <c.weiss@metaways.de>
 * @copyright   Copyright (c) 2012-2013 Metaways Infosystems GmbH (http://www.metaways.de)
 */
Ext.ns('Klb.system');

/**
 * central config
 */
Klb.system.configManager = function(){
    return {
        get: function(name, appName) {
            var app = (Klb.system.hasOwnProperty('appMgr') && appName) ? Klb.system.appMgr.get(appName) : null,
                registry = app ? app.getRegistry() : Klb.App.Api.registry,
                config = registry && registry.get ? registry.get('config') : false,
                struct = config ? config[name] : false,
                // TODO get default from definition?
                // def = struct ? struct.definition : false,
                value = struct ? struct.value : null;
            return value;
        }
    }
}();