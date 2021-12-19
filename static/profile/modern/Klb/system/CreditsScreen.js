/*
 * Modern 3.1.0
 * 
 * @license     http://www.gnu.org/licenses/agpl.html AGPL Version 3
 * @author      Alexander Stintzing <a.stintzing@metaways.de>
 * @copyright   Copyright (c) 2007-2012 Metaways Infosystems GmbH (http://www.metaways.de)
 *
 */
Ext.ns('Klb.system');

/**
 * @namespace   Klb.system
 * @class       Klb.system.CreditsScreen
 * @extends     Klb.abstract.Window
 * @author      Alexander Stintzing <a.stintzing@metaways.de>
 * 
 * @param {Object} config The configuration options.
 */
Ext.define('Klb.system.CreditsScreen', {
    extend: 'Klb.abstract.Window',

    closeAction: 'close',
    modal: true,
    width: 400,
    height: 360,
    minWidth: 400,
    minHeight: 360,
    layout: 'fit',
    title: null,
    
    /**
     * init component
     */
    initComponent: function() {

        this.title = _('Credits');
        
        this.items = {
            layout: 'fit',
            border: false,
            
            padding: 10,
            autoScroll:true,
            autoLoad: {
                url: 'CREDITS',
                isUpload: true,
                method: 'GET',
                callback: function(el, s, response) {
                    el.update(Ext.util.Format.nl2br(response.responseText));
                }
            },
            buttons: [{
                text: _('Ok'),
                iconCls: 'action_saveAndClose',
                handler: this.close,
                scope: this
            }]
        };
        
        Klb.system.CreditsScreen.superclass.initComponent.call(this);
    }
});
