/*
 * Modern 3.0.1
 *
 * @package     System
 * @copyright   Copyright (c) 2018 LLC ICS (http://www.icstime.com)
 * @license     http://www.gnu.org/licenses/agpl.html AGPL Version 3
 */

/**
 * Modern 3.0 jsclient MainScreen.
 */
Ext.define('Klb.system.MainScreen', {
    extend: 'Klb.abstract.Panel',
    requires: [
         'Klb.system.widgets.container.ContainerSelect'
       , 'Klb.system.view.Viewport'
    ],

    border: false,
    layout: {
        type:  'vbox',
        align: 'stretch',
        padding:'0'
    },
    /**
     * the active app
     */
    app: null,
    viewport: null,
    /**
     * @cfg {String} appPickerStyle "tabs" or "pile" defaults to "tabs"
     */
    appPickerStyle: 'tabs',
    /**
     * @private
     */
    refs: [{
        ref: 'toolbarRegion',
        selector: 'panel[region=north]'
    }, {
        ref: 'WestRegion',
        selector: 'panel[region=west]'
    }, {
        ref: 'CenterRegion',
        selector: 'panel[region=center]'
    }],

    initViewport: function() {
       if ( !this.viewport ) {
            this.viewport = Ext.create('Klb.system.view.Viewport', {
                autoShow: true,
                viewModel: {
                    scope: this
                }
            });
       }
       return this.viewport;
    },

    initComponent: function() {
        // NOTE: this is a cruid method to create some kind of singleton...
        Klb.system.appMgr.on('activate', this.onAppActivate, this);
        this.callParent();
    },
    /**
     * returns main menu
     */
    getMainMenu: function() {

        if (! this.mainMenu) {
            this.mainMenu = Ext.create('Klb.system.MainMenu', {
                showMainMenu: this.appPickerStyle != 'tabs'
            });
        }
        return this.mainMenu;
    },
    /**
     * appMgr app activation listener
     * 
     * @param {Klb.Application} app
     */
    onAppActivate: function(app) {
        Klb.Logger.info('Activating app ' + app.appName);
        
        this.app = app;
        
        // set document / browser title
        var postfix = (Klb.App.Api.registry.get('titlePostfix')) ? Klb.App.Api.registry.get('titlePostfix') : '',
            // some apps (Felamimail atm) can add application specific title postfixes
            // TODO generalize this
            appPostfix = (document.title.match(/^\([0-9]+\) /)) ? document.title.match(/^\([0-9]+\) /)[0] : '';
        document.title = appPostfix + Klb.title + postfix  + ' - ' + app.getTitle();
    },
    /**
     * executed after rendering process
     * 
     * @private
     */
    afterRender: function() {

        this.callParent(arguments);

        this.activateDefaultApp();
        if (Klb.App.Api.registry.get('mustchangepw')) {
            var passwordDialog = new Klb.system.PasswordChangeDialog({
                title: _('Your password expired. Please enter a new user password:')
            });
            passwordDialog.show();
        }
    },
    
    /**
     * activate default application
     */
    activateDefaultApp: function() {
        if (Ext.getCmp('treecards').rendered) {
            Klb.system.appMgr.activate();
        } else {
            this.activateDefaultApp.defer(10, this);
        }
    },
    
    /**
     * sets the active content panel
     */
    setActiveContentPanel: function(panel, keep) {
        var me = this,
            cardPanel = me.getCenterRegion();

            panel.keep = keep;
            this.cleanupCardPanelItems(cardPanel);
            this.setActiveCardPanelItem(cardPanel, panel);
    },

    /**
     * sets the active tree panel
     */
    setActiveTreePanel: function(panel, keep) {
        var me = this,
            cardPanel = me.getWestRegion();

        panel.keep = keep;
        this.cleanupCardPanelItems(cardPanel);
        this.setActiveCardPanelItem(cardPanel, panel);
    },
    
    /**
     * sets the active module tree panel
     */
    setActiveModulePanel: function(panel, keep) {
        var modulePanel = Ext.getCmp('moduletree');
        panel.keep = keep;
        this.cleanupCardPanelItems(modulePanel);
        this.setActiveCardPanelItem(modulePanel, panel);
    },
    
    /**
     * sets item
     */
    setActiveToolbar: function(panel, keep) {
         var me = this,
            cardPanel = me.getToolbarRegion();

        panel.keep = keep;
        this.cleanupCardPanelItems(cardPanel);
        this.setActiveCardPanelItem(cardPanel, panel);
    },
    
    /**
     * gets the currently displayed toolbar
     */
    getActiveToolbar: function() {
        var northPanel = Ext.getCmp('north-panel-2');

        if (northPanel.layout.activeItem && northPanel.layout.activeItem.el) {
            return northPanel.layout.activeItem.el;
        } else {
            return false;
        }
    },
    
    /**
     * remove all items which should not be keeped -> don't have a keep flag
     */
    cleanupCardPanelItems: function(cardPanel) {
        if (cardPanel.items) {
            for (var i=0,p; i<cardPanel.items.length; i++){
                p =  cardPanel.items.get(i);
                if (! p.keep) {
                    cardPanel.remove(p);
                }
            }  
        }
    },

    /**
     * add or set given item
     */
    setActiveCardPanelItem: function(cardPanel, item) {
        if (cardPanel.items.indexOf(item) !== -1) {
            cardPanel.layout.setActiveItem(item.id);
        } else {
            cardPanel.add(item);
            cardPanel.doLayout();
        }
    }
});
