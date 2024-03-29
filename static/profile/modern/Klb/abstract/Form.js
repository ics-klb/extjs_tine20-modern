Ext.define('Klb.abstract.form.Panel', {
    extend: 'Ext.form.Panel',
    alias: 'widget.dextopform',
    alternateClassName: ['Klb.FormPanel', 'Klb.form.FormPanel'],

    model: undefined, //FormItems
    itemsOptions: undefined, //options that will be passed to ItemFactory.getItems

    initComponent: function () {

        this.itemsOptions = this.itemsOptions || {};

        Ext.applyIf(this.itemsOptions, {
            remote: this.remote,
            data: this.data
        });

        var formFields = Ext.create(this.model).getItems(this.itemsOptions);

        Ext.apply(this, {
            items: formFields
        });

        this.callParent();
    }
});