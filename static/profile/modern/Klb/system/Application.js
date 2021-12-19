/*
 * Modern 3.1.0
 * 
 * @license     http://www.gnu.org/licenses/agpl.html AGPL Version 3
 * @author      Cornelius Weiss <c.weiss@metaways.de>
 * @copyright   Copyright (c) 2007-2010 Metaways Infosystems GmbH (http://www.metaways.de)
 */
Ext.ns('Klb.system');
/**
 * <p>Abstract base class for all Modern applications</p>
 * 
 * @namespace   Klb.system
 * @class       Klb.system.Application
 * @extends     Ext.util.Observable
 */
Ext.define('Klb.system.AppRegistry', {
    extend: "Object",

    constructor: function(config) {
        config = config || {};
        this.registry = Ext.create('Ext.util.MixedCollection', {});
        if ( config.data ) this.setReg( config.data );
    },

    isReg: function(name) {
        return this.registry.indexOfKey(name) < 0 ? false : true; 
    },
    getReg: function(name) {
        return this.registry.get(name);
    },
    setReg: function(data) {
       if ( !Ext.isEmpty(data) )
          for (var key in data) {
              if (data.hasOwnProperty(key)) {
                  if (key === 'preferences') {
                      var prefs = new Ext.util.MixedCollection();
                      for (var pref in data[key]) {
                          if (data[key].hasOwnProperty(pref)) {
                              prefs.add(pref, data[key][pref]);
                          }
                      }
                      prefs.on('replace', Klb.system.Core.onPreferenceChange);
                      this.registry.add(key, prefs);
                  } else {
                      this.registry.add(key, data[key]);
                  }
              }
            }
      return this;
    },

    isMVC: function() {
       return this.isReg('MVC');
    },
    getMVC: function( name ) {
        var appMVC = this.registry.get('MVC');
       return  appMVC && appMVC.registry.get(name) ? appMVC.registry.get(name) : null;
    },
    setMVC: function(obj) {
        this.registry.add('MVC', obj );
      return this.registry.get('MVC');
    }

});

Ext.define('Klb.system.Application', {
    extend: 'Ext.util.Observable',
    requires: [
        'Ext.ux.ItemRegistry'
    ],

    constructor: function(config) {
        config = config || {};
        Ext.apply(this, config);
        this.callParent([config]);

        this.i18n = new Klb.system.Locale.Gettext();
        this.i18n.textdomain(this.appName);
        this.init();
        this.initAutoHooks();
    },

    /**
     * @cfg {String} appName
     * untranslated application name (required)
     */
    appName: null,
    
    /**
     * @cfg {Boolean} hasMainScreen
     */
    hasMainScreen: true,
    
    /**
     * @property {Klb.system.Locale.Gettext} i18n
     */
    i18n: null,

    /**
     * template function for subclasses to initialize application
     */
    init: Ext.emptyFn,

    /**
     * returns title of this application
     * 
     * @return {String}
     */
    getTitle: function() {
        return this.i18n._(this.appName);
    },
    
    /**
     * returns iconCls of this application
     * 
     * @param {String} target
     * @return {String}
     */
    getIconCls: function(target) {
        return this.appName + 'IconCls';
    },
    
    /**
     * returns the mainscreen of this application
     * 
     * @return {Klb.system.widgets.app.MainScreen}
     */
    getMainScreen: function() {
        var appMainScreen = Klb.App[this.appName].getMVC('MainScreen');
        if ( ! this.mainScreen && appMainScreen ) {
            // Klb.system.appMainScreen.initViewport();
            this.mainScreen = Ext.create(appMainScreen, {
                app: this
            });

            
        }
        return this.mainScreen;
    },
    
    setViewport: function(viewport) {
        if (! this.mainScreen ) {
            this.mainScreen.viewport = viewport;
        }
        return this;
    },
    
    /**
     * returns registry of this app
     * 
     * @return {Ext.util.MixedCollection}
     */
    getRegistry: function() {
        return Klb.App[this.appName].registry;
    },
    
    /**
     * init some auto hooks
     */
    initAutoHooks: function() {
 
        if (this.addButtonText) {
            Ext.ux.ItemRegistry.registerItem('Klb.system.widgets.grid.GridPanel.addButton', {
                text: this.i18n._hidden(this.addButtonText), 
                iconCls: this.getIconCls(),
                scope: this,
                handler: function() {
                    var ms = this.getMainScreen(),
                        cp = ms.getCenterPanel();
                    cp.onEditInNewWindow.call(cp, {});
                }
            });
        }
    },
    
    /**
     * template function for subclasses is called before app activation. Return false to cancel activation
     */
    onBeforeActivate: Ext.emptyFn,
    
    /**
     * template function for subclasses is called after app activation.
     */
    onActivate: Ext.emptyFn,
    
    /**
     * template function for subclasses is called before app deactivation. Return false to cancel deactivation
     */
    onBeforeDeActivate: Ext.emptyFn,
    
    /**
     * template function for subclasses is called after app deactivation.
     */
    onDeActivate: Ext.emptyFn
    
});
