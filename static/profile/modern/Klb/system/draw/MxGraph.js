/**
 * @private
 * @class Klb.system.draw.SurfaceBase
 */
Ext.define('Klb.system.draw.MxGraph', {
    extend: 'Ext.Widget',

    getOwnerBody: function() {
        return this.ownerCt.body;
    },

    destroy: function () {
        var me = this;

        if (me.hasListeners.destroy) {
            me.fireEvent('destroy', me);
        }
        me.callParent();
    }

});
