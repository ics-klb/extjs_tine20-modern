/*
 * Modern 3.0
 * 
 * @package     Modern
 * @license     http://www.gnu.org/licenses/agpl.html AGPL Version 3
 * @author      Alexander Stintzing <alex@stintzing.net>
 * @copyright   Copyright (c) 2009-2011 Metaways Infosystems GmbH (http://www.metaways.de)
 *
 */

Ext.define('Ext.ux.TabPanelKeyPlugin', {
    extend: 'Ext.plugin.Abstract',
    panel : null,
    alias: 'plugin.ux.tabpanelkeyplugin',

    init : function(panel) {
        this.panel = panel;
        this.panel.onRender = this.panel.onRender.bind(this.onRender, this);
    },
    
    /**
     * creates shortcuts for tabs
     */
    onRender: function() {
        
        if (! this.panel.rendered) {
            this.onRender.defer(250, this);
            return;
        }

        var tabCount = this.panel.items.length;
        
        for (var index = 0; index < tabCount; index++) {
            var item = this.panel.items.items[index];
            if(item.disabled !== true) {
                new Ext.KeyMap(this.panel.el, [{
                    key: index + 49,
                    ctrl: true,
                    scope: this,
                    fn: this.switchTab
                }]);
            }
        }
    },
    
    /**
     * switch to tab
     * @param Integer code
     */
    switchTab: function(code) {
        var number = parseInt(code) - 49;
        if (this.panel) {
            this.panel.setActiveTab(number);
        }
    }
});

// Ext.preg('ux.tabpanelkeyplugin', Ext.ux.TabPanelKeyPlugin);