/*
 * Modern 3.0.1
 * 
 * @package     System
 * @subpackage  AppPile
 * @copyright   Copyright (c) 2018 LLC ICS (http://www.icstime.com)
 * @license     http://www.gnu.org/licenses/agpl.html AGPL Version 3
 */

/**
 * Main appStarter/picker app pile panel
 * 
 * @namespace   Klb.system
 * @class       Klb.system.AppPile
 * @extends     Ext.panel.Panel
 * @author      Cornelius Weiss <c.weiss@metaways.de>
 */
Ext.define('Klb.system.AppPile', {
    extend: 'Ext.panel.Panel',
    /**
     * @property apps
     * @type Ext.util.Observable
     */
    apps: null,
    
    /**
     * @property defaultApp
     * @type Klb.Application
     */
    defaultApp: null,
    
    /**
     * @private
     * @property {Object} items
     * holds internal item elements
     */
    els: {},
    
    /**
     * @private
     */
    border: false,
    layout: 'fit',
    autoScroll: true,
    
    /**
     * @private
     * @todo: register app.on('titlechange', ...)
     */
    initComponent: function() {
        this.apps = Klb.system.appMgr.getAll();
        this.defaultApp = Klb.system.appMgr.getDefault();
        
        Klb.system.appMgr.on('activate', this.onActivateApp, this);
        
        Klb.system.AppPile.superclass.initComponent.call(this);
        
        this.tpl = new Ext.XTemplate(
            '<div class="x-panel-header x-panel-header-noborder x-unselectable x-accordion-hd">',
                '<img class="x-panel-inline-icon {iconCls}" src="' + Ext.BLANK_IMAGE_URL + '"/>',
                '<span class="x-panel-header-text app-panel-apptitle-text">{title}</span>',
            '</div>'
        ).compile();

    },
    
    /**
     * @private
     */
    onRender: function(ct, position) {
        Klb.system.AppPile.superclass.onRender.call(this, ct, position);

        this.apps.each(function(app) {
            if (app.hasMainScreen) {
                this.els[app.appName] = this.tpl.insertFirst(this.body, {title: app.getTitle(), iconCls: app.getIconCls()}, true);
                this.els[app.appName].setStyle('cursor', 'pointer');
                this.els[app.appName].addClassOnOver('app-panel-header-over');
                this.els[app.appName].on('click', this.onAppTitleClick, this, app);
            }
            
        }, this);
        
        // limit to max pile height
        this.on('resize', function() {
            var appHeaders = Ext.DomQuery.select('div[class^=x-panel-header]', this.el.dom);
            for (var i=0, height=0; i<appHeaders.length; i++) {
                height += Ext.fly(appHeaders[i]).getHeight();
            }
            if (arguments[2] && arguments[2] > height) {
                this.setHeight(height);
            }
        });
        this.setActiveItem(this.els[this.defaultApp.appName]);
    },
    
    /**
     * executed when an app get activated by mainscreen
     * 
     * @param {Klb.Application} app
     */
    onActivateApp: function(app) {
        this.setActiveItem(this.els[app.appName]);
    },
    
    /**
     * @private
     */
    onAppTitleClick: function(e, dom, app) {
        this.setActiveItem(Ext.get(dom));
        Klb.system.appMgr.activate(app);
    },
    
    /**
     * @private
     */
    setActiveItem: function(el) {
        for (var appName in this.els) {
            if (el) {
                if (el == this.els[appName] || el.parent() == this.els[appName]) {
                    this.els[appName].addClass('app-panel-header-active');
                } else {
                    this.els[appName].removeClass('app-panel-header-active');
                }
            }
        }
    }
});
