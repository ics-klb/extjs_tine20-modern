Ext.define("Klb.abstract.LocalStorage",{
    extend    : "Ext.data.proxy.LocalStorage",
    constructor : function() {
        var me = this;
        me.callParent();
    }
});

Ext.define("Klb.abstract.Proxy",{
    extend        : "Ext.data.proxy.Ajax",
    constructor    : function() {
        var me = this;
        me.callParent();
    }
});