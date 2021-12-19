/*
 * Modern 3.1.0
 * 
 * @license     http://www.gnu.org/licenses/agpl.html AGPL Version 3
 * @author      Cornelius Weiss <c.weiss@metaways.de>
 * @copyright   Copyright (c) 2007-2008 Metaways Infosystems GmbH (http://www.metaways.de)
 *
 */
 
Ext.ns('Ext.ux', 'Ext.ux.form');

Ext.define('Ext.ux.form.ColumnFormPanel', {
    extend: 'Ext.panel.Panel',
    xtype: 'columnform',
    formDefaults: {
        xtype:  'icontextfield',
        anchor: '100%',
        labelSeparator: '',
        columnWidth: .333
    },
    layout: {
        type: 'vbox',
        pack: 'start',
        align: 'stretch'
    },
    labelAlign: 'top',
    /**
     * @private
     */
    initComponent: function() {
        var items = [];
            
       if ( this.items.length )   
         // each item is an array with the config of one row
            for (var i=0,j=this.items.length; i<j; i++) {

                var initialRowConfig = this.items[i];
                var rowConfig = {
                    border: false,
                    layout: 'column',
                    defaults: { border: false, padding: '5 5 0' },
                    items: []
                };
                // each row consits n column objects 
                for (var n=0,m=initialRowConfig.length; n<m; n++) {
                    var column = initialRowConfig[n];

                    column.labelAlign  = this.labelAlign;
                    column.columnWidth = column.columnWidth ? column.columnWidth : this.formDefaults.columnWidth;
                    column.xtype       = column.xtype ? column.xtype : this.formDefaults.xtype;
                    // column.bodyStyle   = n+1>=m ? 'padding-right: 0px;' : 'padding-right: 5px;';
                    var idx = rowConfig.items.push(column);

                    if (column.width) {
                        rowConfig.items[idx-1].width = column.width;
                        delete rowConfig.items[idx-1].columnWidth;
                    }
                }
                items.push(rowConfig);
            }
        this.items = items;
        
        this.callParent();
    }
});
