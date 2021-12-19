/**
 * @class Klb.abstract.MessageBox
 * @extends Ext.Msg
**/

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
          buttons	: Ext.Msg.OK,
          ms        : message
       });
    },

    info : function(message){
       this.show({
          title	: "Information",
          modal	: true,
          icon	: Ext.Msg.INFO,
          buttons	: Ext.Msg.OK,
          ms        : message
       });
    },

    error	: function(message){
       this.show({
          title	: "Error",
          modal	: true,
          icon	: Ext.Msg.ERROR,
          buttons	: Ext.Msg.OK,
          ms        : message
       });
    },

    warning	: function(message){
       this.show({
          title	: "Warning",
          modal	: true,
          icon	: Ext.Msg.WARNING,
          buttons	: Ext.Msg.OK,
          ms        : message
       });
    },

    confirm	: function(message,callback,scope){
       this.show({
          title	: "Confirm",
          modal	: true,
          icon	: Ext.Msg.QUESTION,
          buttons : Ext.Msg.YESNO,
          ms : message,
          fn : callback || Ext.emptyFn,
          scope	: scope || this
       });
    }
}); 
/*, function() {
    Klb.MessageBox = Klb.Msg = new this();
});
*/
