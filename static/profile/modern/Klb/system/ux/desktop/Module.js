/*
 * IcsDesktop 2.4.0
 * 
 * @package     Modern
 * @subpackage  JS Library
 * @copyright   Copyright (c) 2018 LLC ICS (http://www.icstime.com)
 * @license     http://www.gnu.org/licenses/agpl.html AGPL Version 3
 */

Ext.define('Klb.system.ux.desktop.Module', {
    mixins: {
        observable: 'Ext.util.Observable'
    },
    id : null,
    app: null,
    winids: {},

    constructor: function (config) {
      config =  Ext.apply({}, config, this.config);

        if ( this.mixins ) this.mixins.observable.constructor.call(this, config);
        this.app = Klb.system.appDesktop.getApp();
        this.callParent([config]);
    },

    initComponent: function(){
        this.init();
        this.callParent();
    },

    init: Ext.emptyFn,

    initMenu : function( winds ) {
 
        var me = this;
        var obj;
        for (key in winds )  {
          if (  winds.hasOwnProperty(key) ) {
              obj = winds[key];
              me.launcher.menu.items.push({
                 title: obj.title,
                 text:  obj.text,
                 iconCls: obj.iconCls,
                 handler : function (obj) { me.app.getModuleWindow(obj); },
                 scope: me,
                 modclass: obj.modclass, 
                 windowId: obj.id 
             });
           }
        }
    },

    addMenuItems: function( items ) {

        this.launcher.menu.items.push(items );
    },

    addSubMenu: function( sub, items ) {

    },

    getIdFromName: function(name) {

      return [name + 'id', 'widget.' + name + 'id'];
    },

    createWindow : function(src) {

          Klb.system.appDesktop.getApp().createWindow(src);
    }
});
