/**
 * @class Klb.abstract.
 * @extends Ext.ux.desktop.Module
 * Form panel
 *
 **/

//Ext.require("Klb.abstract.Tree");

Ext.define("Klb.abstract.Abstract",  { extend: "Object", singleton: true  });
Ext.define("Klb.abstract.Window",{ extend : "Ext.window.Window" });
Ext.define("Klb.abstract.Model", { 
    extend: "Ext.data.Model"
});

Ext.define("Klb.abstract.StoreData",{
    extend: "Ext.data.Store"
});

Ext.define("Klb.abstract.StoreTree",{
    extend: "Ext.data.TreeStore",
    getAt: function (index) {
        var current = 0;
        return (function find(nodes) {
          var i, len = nodes.length;
          for (i = 0; i < len; i++) {
            if (current === index) {
              return nodes[i];
            }
            current++;
            var found = find(nodes[i].childNodes);
            if (found) {
              return found;
            }
          }
        }(this.tree.root.childNodes));
    }
});

Ext.define("Klb.abstract.Module",{
  extend : "Ext.ux.desktop.Module" ,
  id : null,
  launcher : null,
  loaded : false,
  init : Ext.emptyFn, 
  createWindow : function() { 
    this.app.createWindow(this.id)
  },
  handleRequest : Ext.emptyFn,
  
  getId: function() {
    return this.id;
  }
});

Ext.define("Klb.abstract.Tree", { extend: "Object", singleton: true  });

Ext.define("Klb.abstract.Grid",{
    extend : "Ext.grid.Panel",

    paging: true,
    border: false,
    full:  true,

    initComponent: function() {
        var me = this;

        if(me.paging){
            me.dockedItems = [{
                xtype        : "pagingtoolbar",
                store        : me.store,
                dock        : "bottom",
                displayInfo    : true
            }];
        }

        me.callParent();
    }
});

Ext.define("Klb.abstract.Form",{
    extend        : "Ext.form.Panel",
    
    columns       : 1,
    border        : false,
    defaultType   : 'textfield',
    fieldDefaults : {
        labelAlign: 'left',
        msgTarget : 'side',
        width     : 180
    },
    layout        : 'anchor',
    bodyPadding   : 5,
    autoScroll    : true,

    initComponent    : function(){
        this.layout.columns = this.columns;
        this.callParent();
    }
});

Ext.define("Klb.abstract.TreePanel",{
    extend        : "Ext.tree.Panel",
    initComponent    : function() {
        var me = this;
        me.callParent();
    }
});

Ext.define("Klb.abstract.LocalStorage",{
    extend    : "Ext.data.proxy.LocalStorage",
    constructor : function() {
        var me = this;
        me.callParent();
    }
});

Ext.define("Klb.abstract.ProxyAjax",{
    extend        : "Ext.data.proxy.Ajax",
    constructor    : function() {
        var me = this;
        me.callParent();
    }
});


Ext.define("Klb.abstract.ModalWindow",{
    extend: "Ext.window.Window",
    layout: "fit",
    cls   : "window-modal",
    modal  : true,
    draggable   : false,
    resizable   : false,
    bodyPadding : 10
});

Ext.define("Klb.abstract.MessageBox", {
    extend: "Ext.window.MessageBox",
    alternateClassName: "Klb.Msg",
    singleto: true,
    process: function(cfg){
      this.show({
            msg: cfg.msg,
            progressText: cfg.progressText,
            waitConfig: { interval:50 },
            buttons: Ext.Msg.CANCEL, 
            width:300,
            wait:true,
            modal:true,
            fn : callback || Ext.emptyFnaq
        });
    },
    alert : function(message){
       this.show({
          title: "Alert",
          modal: true,
          icon : Ext.Msg.WARNING,
          buttons    : Ext.Msg.OK,
          ms        : message
       });
    },

    info : function(message){
       this.show({
          title    : "Information",
          modal    : true,
          icon    : Ext.Msg.INFO,
          buttons    : Ext.Msg.OK,
          ms        : message
       });
    },

    error    : function(message){
       this.show({
          title    : "Error",
          modal    : true,
          icon    : Ext.Msg.ERROR,
          buttons    : Ext.Msg.OK,
          ms        : message
       });
    },

    warning    : function(message){
       this.show({
          title    : "Warning",
          modal    : true,
          icon    : Ext.Msg.WARNING,
          buttons    : Ext.Msg.OK,
          ms        : message
       });
    },

    confirm    : function(message,callback,scope){
       this.show({
          title    : "Confirm",
          modal    : true,
          icon    : Ext.Msg.QUESTION,
          buttons : Ext.Msg.YESNO,
          ms : message,
          fn : callback || Ext.emptyFn,
          scope    : scope || this
       });
    }
});