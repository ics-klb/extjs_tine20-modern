
Ext.define("Klb.abstract.Controller",{
    extend: "Ext.app.Controller",
    conf:{},

    app: { records: {} },
    init : function() {
        var me = this, actions = {};
        me.callParent();
      if (me.conf.control !== false) {
            me.control({
                "button[action=new]" : {
                    click : me.add
                },
                "button[action=save]" : {
                    click : me.save
                },
                "button[action=delete]" : {
                    click : me.remove
                }
            });
       }
//        me.setViewport();
    },

    getStoreId: function(storeId) {
        return Klb.Store.get(storeId);
    },
    /**
     * This method add the window id to the selectors, this way we can create more the one
     * instance of the same window. 
     * @param {Object} actions An object with the selectors
     */
    control : function(actions) {

        var me = this;
//       if(Ext.isObject(actions)){
//            var obj = {};
//            Ext.Object.each(actions,function(selector){
//             var s = "#"+this.win.id+" "+selector;
//                 obj[s] = actions[selector];
//           }, this);
//            delete actions;

//            if (!me.selectors){
//                 me.selectors = [];
//            }
//            me.selectors.push(obj);
//            this.callParent([obj]);
//        } else {
//            me.callParent(arguments);
//        }
           me.callParent(arguments);
    },
    
    /**
     * This method display an error message in the status bar of the main window
     * @param {String} msg The message to display
     */
    showError : function(msg){
Klb.Logger('Klb.abstract.Controller.showError()'); 
        this.win.statusBar.setStatus({
            text    : msg,
            iconCls : "x-status-error"
        });
    },
    
    /**
     * This method display a success message in the status bar of the main window
     * @param {String} msg The message to display
     */
    showMessage	: function(msg) { 
        this.win.statusBar.setStatus({
            text: msg,
            iconCls: "x-status-valid"
        });
    },
    
    /**
     * An abstract method to be implemented in the subclass, this method is executed 
     * in the "init" method of the controller, the idea is to set the content of the main
     * window.
     *
    *
    setViewport	: function(){
        this.win.add(Ext.create("Ext.panel.Panel",{html:"Hello world!"}));	    
    },
    
    * 
     */
     setViewport: Ext.emptyFn,
    /**
     * An abstract method. This method is executed when the user clicks in any button
     * withing the main window than contain a property "action" equals to "new".
     * 
     */
    add : Ext.emptyFn,
    /**
     * An abstract method. This method is executed when the user clicks in any button
     * withing the main window than contain a property "action" equals to "save".
     */
    save : Ext.emptyFn,
    /**
     * An abstract method. This method is executed when the user clicks in any button
     * withing the main window than contain a property "action" equals to "delete".
     */
    remove : Ext.emptyFn
});