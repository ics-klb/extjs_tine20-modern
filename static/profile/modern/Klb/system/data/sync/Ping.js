/*
 * Modern 3.0
 * 
 * @package     Modern
 * @subpackage  Modern
 * @license     http://www.gnu.org/licenses/agpl.html AGPL Version 3
 * @author      Cornelius Weiss <c.weiss@metaways.de>
 * @copyright   Copyright (c) 2009 Metaways Infosystems GmbH (http://www.metaways.de)
 */
 
Ext.ns('Klb.system.sync');

/**
 * @namespace   Klb.system.sync
 * @class       Klb.system.sync.Ping
 * @extends     Ext.util.Observable
 */
Klb.system.sync.Ping = function(config) {
    Ext.apply(this, config);
    Klb.system.sync.Ping.superclass.constructor.call(this);
    
    this.sendPing();
};

Ext.extend(Klb.system.sync.Ping, Ext.util.Observable, {
    sendPing: function() {
        this.connectionId = Klb.system.Ajax.request({
            timeout: 45000,
            success: this.onPingSuccess,
            fail: this.onPingFail,
            scope: this,
            params: {
                method: 'Api.ping'
            }
        });
    },
    
    onPingSuccess: function() {
        this.sendPing();
    },
    
    onPingFail: function() {
        Ext.Msg.alert('Ping', 'Failed');
    }
});
