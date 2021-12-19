/*
 * Klb Desktop 3.0.1
 * 
 * @package     Modern
 * @subpackage  Filemanager.SearchCombo
 * @copyright   Copyright (c) 2018 LLC ICS (http://www.icstime.com)
 * @license     http://www.gnu.org/licenses/agpl.html AGPL Version 3
 */

Ext.ns('KlbDesktop.MVC.Filemanager');

/**
 * Node selection combo box
 * 
 * @namespace   KlbDesktop.MVC.Filemanager
 * @class       KlbDesktop.MVC.Filemanager.SearchCombo
 * @extends     Ext.form.ComboBox
 * 
 * @param       {Object} config
 * @constructor
 * Create a new KlbDesktop.MVC.Filemanager.SearchCombo
 */ 
Ext.define('KlbDesktop.MVC.Filemanager.view.SearchCombo', {
    extend: 'Klb.system.widgets.form.RecordPickerComboBox',
    alternateClassName: 'KlbDesktop.MVC.Filemanager.SearchCombo',
    allowBlank: false,
    itemSelector: 'div.search-item',
    minListWidth: 200,
    
    //private
    initComponent: function(){
        this.recordClass = KlbDesktop.MVC.Filemanager.Model.Node;
        this.recordProxy = KlbDesktop.MVC.Filemanager.recordBackend;
        
        this.initTemplate();
        this.callParent();
    },
    
    /**
     * use beforequery to set query filter
     * 
     * @param {Event} qevent
     */
    onBeforeQuery: function(qevent) {
        this.callParent(arguments);
        this.store.baseParams.filter.push(
            {field: 'recursive', operator: 'equals', value: true }
        );
        this.store.baseParams.filter.push(
            {field: 'path', operator: 'equals', value: '/' }
        );
    },
    
    /**
     * init template
     * @private
     */
    initTemplate: function() {
        // Custom rendering Template
        // TODO move style def to css ?
        if (! this.tpl) {
            this.tpl = new Ext.XTemplate(
                '<tpl for="."><div class="search-item">',
                    '<table cellspacing="0" cellpadding="2" border="0" style="font-size: 11px;" width="100%">',
                        '<tr>',
                            '<td ext:qtip="{[this.renderPathName(values)]}" style="height:16px">{[this.renderFileName(values)]}</td>',
                        '</tr>',
                    '</table>',
                '</div></tpl>',
                {
                    renderFileName: function(values) {
                        return Ext.util.Format.htmlEncode(values.name);
                    },
                    renderPathName: function(values) {
                        return Ext.util.Format.htmlEncode(values.path.replace(values.name, ''));
                    }
                    
                }
            );
        }
    },
    
    getValue: function() {
            return KlbDesktop.MVC.Filemanager.SearchCombo.superclass.getValue.call(this);
    },

    setValue: function (value) {
        return KlbDesktop.MVC.Filemanager.SearchCombo.superclass.setValue.call(this, value);
    }

});

Klb.system.widgets.form.RecordPickerManager.register('Filemanager', 'Node', KlbDesktop.MVC.Filemanager.SearchCombo);
