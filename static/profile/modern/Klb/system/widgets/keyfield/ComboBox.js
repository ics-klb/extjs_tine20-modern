/* 
 * Modern 3.1.0
 * 
 * @license     http://www.gnu.org/licenses/agpl.html AGPL Version 3
 * @author      Cornelius Weiss <c.weiss@metaways.de>
 * @copyright   Copyright (c) 2011 Metaways Infosystems GmbH (http://www.metaways.de)
 */
 
Ext.ns('Klb.system.widgets.keyfield');

/**
 * key field combo
 * 
 * @namespace   Klb.system.widgets.keyfield
 * @class       Klb.system.widgets.keyfield.ComboBox
 * @extends     Ext.form.field.ComboBox
 */
Ext.define('Klb.system.widgets.keyfield.ComboBox', {
    extend: 'Ext.form.field.ComboBox',

    /**
     * @cfg {String/Application} app
     */
    app: null,

    xtype: 'keyfieldcombo',
    /**
     * @cfg {String} keyFieldName 
     * name of key field
     */
    keyFieldName: null,
    /**
     * @cfg {Boolean} showIcon
     * show icon in list and value
     */
    showIcon: true,
    /**
     * sort by a field
     * 
     * @cfg {String} sortBy
     */
    sortBy: null,
    /* begin config */
    blurOnSelect  : true,
    expandOnFocus : true,
    mode          : 'local',
    displayField  : 'i18nValue',
    valueField    : 'id',

    /* end config */
    initComponent: function() {

        this.app = Ext.isString(this.app) ? Klb.system.appMgr.get(this.app) : this.app;

        // get keyField config
        this.keyFieldConfig = this.app.getRegistry().get('config')[this.keyFieldName];

        if (! this.value && (this.keyFieldConfig && Ext.isObject(this.keyFieldConfig.value) && this.keyFieldConfig.value.hasOwnProperty('default'))) {
            this.value = this.keyFieldConfig.value['default'];
        }

        this.store = Klb.system.widgets.keyfield.StoreMgr.get(this.app, this.keyFieldName);
        if (this.sortBy) {
            this.store.sort(this.sortBy);
        }

        this.showIcon = this.showIcon && this.store.find('icon', /^.+$/) > -1;

        this.initTpl();
        this.callParent();
    },
    
    initTpl: function() {
        if (this.showIcon) {
            this.tpl = '<ul class="x-list-plain">'
               + '<tpl for="."><li role="option" class="x-boundlist-item">'
                  + '<div class="x-combo-list-item"><img src="' + Klb.Common.RESOURCE_PATH + '{icon}" class="apibase-keyfield-icon"/>{' + this.displayField + '}</div>'
               + '</li></tpl></ul>';
        }
    }
});
