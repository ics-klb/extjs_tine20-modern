/*
 * Modern 3.0
 * 
 * @license     http://www.gnu.org/licenses/agpl.html AGPL Version 3
 * @author      Cornelius Weiss <c.weiss@metaways.de>
 * @copyright   Copyright (c) 2007-2012 Metaways Infosystems GmbH (http://www.metaways.de)
 *
 * TODO         use new filter syntax in onBeforeQuery when TagFilter is refactored and extends Modern_Model_Filter_FilterGroup 
 */
 
Ext.ns('Klb.system.widgets', 'Klb.system.widgets.tags');

/**
 * @namespace   Klb.system.widgets.tags
 * @class       Klb.system.widgets.tags.TagCombo
 * @extends     Ext.ux.form.ClearableComboBox
 */
Ext.define('Klb.system.widgets.tags.TagCombo', {
    extend:  'Ext.ux.form.ClearableComboBox', 
    /**
     * @cfg {Klb.system.Application} app
     */
    app: null,
    xtype: 'tagsTagCombo',
    /**
     * @cfg {Bool} findGlobalTags true to find global tags during search (default: true)
     */
    findGlobalTags: true,

    /**
     * @cfg {Bool} onlyUsableTags true to find only usable flags for the user (default: true)
     */
    onlyUsableTags: false,
    
    emptyText: null,
    typeAhead: true,
    mode: 'remote',
    triggerAction: 'all',
    displayField: 'name',
    valueField: 'id',
    minChars: 3,
    
    /**
     * @private
     */
    initComponent: function() {
        this.emptyText = this.emptyText ? this.emptyText : _('tag name');
        
        this.initStore();
        this.initTemplate();
        
        Klb.system.widgets.tags.TagCombo.superclass.initComponent.call(this);
        
        this.on('select', this.onSelectRecord, this);
        
        this.on('beforequery', this.onBeforeQuery, this);
    },
    
    /**
     * hander of select event
     * NOTE: executed after native onSelect method
     */
    onSelectRecord: function(){
        var v = this.getValue();
        
        if(String(v) !== String(this.startValue)){
            this.fireEvent('change', this, v, this.startValue);
        }
        
    },
    
    /**
     * use beforequery to set query filter
     * 
     * @param {Event} qevent
     */
    onBeforeQuery: function(qevent){
        
        var filter = {
            name: (qevent.query && qevent.query != '') ? '%' + qevent.query + '%' : '',
            application: this.app ? this.app.appName : '',
            grant: (this.onlyUsableTags) ? 'use' : 'view' 
        };
        
        this.store.baseParams.filter = filter;
    },

    /**
     * set value
     * 
     * @param {} value
     */
    setValue: function(value) {
        
        if (typeof value === 'object' && Object.prototype.toString.call(value) === '[object Object]') {
            if (! this.store.getById(value.id)) {
                this.store.addSorted(new Klb.system.Model.Tag(value));
            }
            value = value.id;
        }
        
        Klb.system.widgets.tags.TagCombo.superclass.setValue.call(this, value);
        
    },
    
    /**
     * init store
     */
    initStore: function() {
        var baseParams = {
            method: 'Api.searchTags',
            paging: {}
        };
        
        this.store = new Klb.system.data.JsonStore({
            idProperty: 'id',
            rootProperty: 'results',
            totalProperty: 'totalCount',
            model: 'Klb.system.Model.Tag',
            baseParams: baseParams
        });

    },
    
    /**
     * init template
     */
    initTemplate: function() {
        this.tpl = new Ext.XTemplate(
            '<tpl for=".">', 
                '<div class="x-combo-list-item">',
                    '<div class="tb-grid-tags" style="background-color:{values.color};">&#160;</div>',
                    '<div class="x-widget-tag-tagitem-text" ext:qtip="', 
                        '{[this.encode(values.name)]}', 
                        '<tpl if="type == \'personal\' ">&nbsp;<i>(' + _('personal') + ')</i></tpl>',
                        '</i>&nbsp;[{occurrence}]',
                        '<tpl if="description != null && description.length &gt; 1"><hr>{[this.encode(values.description)]}</tpl>" >',
                        
                        '&nbsp;{[this.encode(values.name)]}',
                        '<tpl if="type == \'personal\' ">&nbsp;<i>(' + _('personal') + ')</i></tpl>',
                    '</div>',
                '</div>', 
            '</tpl>',
            {
                encode: function(value) {
                     if (value) {
                        return Klb.system.Common.doubleEncode(value);
                    } else {
                        return '';
                    }
                }
            }
        );
    }
});

//Ext.reg('Klb.system.widgets.tags.TagCombo', Klb.system.widgets.tags.TagCombo);
