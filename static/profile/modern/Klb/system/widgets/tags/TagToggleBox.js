/*
 * Modern 3.0
 * 
 * @license http://www.gnu.org/licenses/agpl.html AGPL Version 3 
 * @author Alexander Stintzing <alex@stintzing.net>
 * @copyright Copyright (c) 2007-2009
 * Metaways Infosystems GmbH (http://www.metaways.de)
 * 
 * TODO use new filter syntax in onBeforeQuery when TagFilter is refactored and
 * extends Modern_Model_Filter_FilterGroup
 */

Ext.ns('Klb.system.widgets', 'Klb.system.widgets.tags');

/**
 * @namespace Klb.system.widgets.tags
 * @class Klb.system.widgets.tags.TagToggleBox
 * @extends Ext.tree.Panel
 */

Ext.define('Klb.system.widgets.tags.TagToggleBox', {
    extend: 'Ext.form.Panel',
    layout : 'fit',
    border : false,
    cls : 'tw-editdialog',
    store : null,
    buttonAlign : 'right',
    win: null,
    mode: null,
    
    anchor : '100% 100%',
    
    loadMask: null,

    initComponent : function() {
        
        this.addEvents('cancel', 'update', 'close');
        this.initStore();
        this.initTemplate();
        this.initView();

        this.initActions();

        this.initButtons();

        this.items = this.getFormItems();

        this.callParent();
    },

    initActions : function() {
        this.action_update = new Ext.Action({
                    text : (this.mode == 'detach') ? _('Detach Tags') : _('Attach Tags'),
                    minWidth : 70,
                    scope : this,
                    handler : this.onUpdate,
                    iconCls : 'action_saveAndClose'
                });
        this.action_cancel = new Ext.Action({
                    text : _('Cancel'),
                    minWidth : 70,
                    scope : this,
                    handler : this.onCancel,
                    iconCls : 'action_cancel'
                });

    },

    initStore : function() {
            
        this.store = new Klb.system.data.JsonStore({
                    idProperty : 'id',
                    rootProperty : 'results',
                    totalProperty : 'totalCount',
                    model : 'Klb.system.Model.Tag',
                    baseParams : {
                        method : 'Api.searchTagsByForeignFilter',
                        filterData: this.selectionModel.getSelectionFilter(),
                        filterName: this.recordClass.getMeta('appName') + '_Model_' +  this.recordClass.getMeta('modelName') + 'Filter'
                        }
                });
        
        this.store.load();
        
    },

    initButtons : function() {
        this.fbar = ['->', this.action_cancel, this.action_update];
    },
    
    getFormItems : function() {
        return {
            border : false,
            frame : true,
            layout : 'form',
            items : [{
                region : 'center',
                layout : {
                    align : 'stretch',
                    type : 'vbox'
                }
            }, this.view]
        };
    },
    
    initTemplate: function() {
        this.tpl = new Ext.XTemplate(
            '<tpl for=".">', 
                '<div class="x-combo-list-item">',
                    '<input class="tagcheckel" type="checkbox" style="margin-right:3px;float:left" id="{values.id}" /><div class="tb-grid-tags" style="margin-top:2px;background-color:{values.color};">&#160;</div>',
                    '<div class="x-widget-tag-tagitem-text" style="margin-top:1px" ext:qtip="', 
                        '{[this.encode(values.name)]}', 
                        '<tpl if="type == \'personal\' ">&nbsp;<i>(' + _('personal') + ')</i></tpl>',
                        '</i>&nbsp;[{occurrence}]',
                        '<tpl if="description != null && description.length &gt; 1"><hr>{[this.encode(values.description)]}</tpl>" >',
                        
                        '&nbsp;{[this.encode(values.name)]}&nbsp;({values.selection_occurrence})',
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
    },
    
    
    initView : function() {
        this.view = new Ext.DataView({
            anchor : '100% 100%',
            autoScroll : true,
            store : this.store,
            tpl : this.tpl,
            emptyText : _('No Tags to detach found in the selected records'),
            loadingText : _('Please Wait...'),
            style : 'background:#fff;'
        });
    },
    
    onCancel: function() {
        this.fireEvent('cancel');
    },
    // TODO: formitems could not be fetched by formpanel->getform->getvalues
    onUpdate: function() {
        
        this.loadMask = new Ext.LoadMask(this.getEl(), {msg: _('Detaching Tags')});
        this.loadMask.show();
        
        var els = Ext.select('input.tagcheckel');
        var checked = [];
        els.each(function(el){
            if(el.dom.checked) checked.push(el.id);
        });

        var filter = this.selectionModel.getSelectionFilter();
        var filterModel = this.recordClass.getMeta('appName') + '_Model_' +  this.recordClass.getMeta('modelName') + 'Filter';
        
        Klb.system.detachTagsFromMultipleRecords(filter, filterModel, checked, this.onUpdated.bind(this));

    },
    
    onUpdated: function() {
        this.loadMask.hide();
        this.fireEvent('updated');
    }
    

});
