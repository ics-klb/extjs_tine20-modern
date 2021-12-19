/*
 * Modern 3.0
 * 
 * @package     Modern
 * @subpackage  Modern
 * @license     http://www.gnu.org/licenses/agpl.html AGPL Version 3
 * @author      Cornelius Weiss <c.weiss@metaways.de>
 * @copyright   Copyright (c) 2007-2008 Metaways Infosystems GmbH (http://www.metaways.de)
 *
 */

Ext.ns('Klb.system.widgets');

/**
 * check if newer version of Modern 3.0 is available
 * 
 * @namespace   Klb.system.widgets
 * @class       Klb.system.widgets.VersionCheck
 * @constructor
 */
Klb.system.widgets.VersionCheck = function() {
    
    var ds = new Ext.data.Store({
        proxy: new Ext.data.ScriptTagProxy({
            url: '/version.php'
        }),
        reader: new Ext.data.JsonReader({
            root: 'version'
        }, ['codeName', 'packageString', 'releaseTime', 'critical', 'build'])
    });
    ds.on('load', function(store, records) {
        if (! Klb.App.Api.registry.get('version')) {
            return false;
        }

        var version = records[0];
        
        var local = Ext.Date.parse(Klb.App.Api.registry.get('version').releasetime, Date.patterns.ISO8601Long);
        var latest = Ext.Date.parse(version.get('releasetime'), Date.patterns.ISO8601Long);
        
        if (latest > local && Klb.system.Common.hasRight('run', 'Modern')) {
            if (version.get('critical') == true) {
                Ext.MessageBox.show({
                    title: _('New version of Modern 3.0 available'), 
                    msg:  Ext.String.format(_('Version "{0}" of Modern 3.0 is available.'), version.get('codeName')) + "\n" +
                                 _("It's a critical update and must be installed as soon as possible!"),
                    width: 500,
                    buttons: Ext.Msg.OK,
                    icon: Ext.MessageBox.ERROR
                });
            } else {
                Ext.MessageBox.show({
                    title: _('New version of Modern 3.0 available'),
                    msg:  Ext.String.format(_('Version "{0}" of Modern 3.0 is available.'), version.get('codeName')) + "\n" +
                                 _('Please consider updating!'),
                    width: 400,
                    buttons: Ext.Msg.OK,
                    icon: Ext.MessageBox.INFO
                });
            }
        }
    }, this);
 
//    ds.load({params: {version: Ext.util.JSON.encode(Klb.App.Api.registry.get('version'))}});
};
