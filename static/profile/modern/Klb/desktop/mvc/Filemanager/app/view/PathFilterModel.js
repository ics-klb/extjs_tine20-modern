/*
 * Klb Desktop 3.0.1
 * 
 * @package     Modern
 * @subpackage  Filemanager.NodeTreePanel
 * @copyright   Copyright (c) 2018 LLC ICS (http://www.icstime.com)
 * @license     http://www.gnu.org/licenses/agpl.html AGPL Version 3
 */

Ext.ns('KlbDesktop.MVC.Filemanager');

/**
 * @namespace   Klb.system.widgets.container
 * @class       KlbDesktop.MVC.Filemanager.PathFilterModel
 * @extends     Klb.system.widgets.grid.FilterModel
 * 
 * @author      Cornelius Weiss <c.weiss@metaways.de>
 * 
 * @TODO make valueRenderer a path picker widget
 */
Ext.define('KlbDesktop.MVC.Filemanager.view.PathFilterModel', {
    extend: 'Klb.system.widgets.grid.FilterModel',
    alternateClassName: 'KlbDesktop.MVC.Filemanager.PathFilterModel',
    /**
     * @cfg {Klb.system.Application} app
     */
    app: null,
    
    /**
     * @cfg {Array} operators allowed operators
     */
    operators: ['equals'],
    
    /**
     * @cfg {String} field path
     */
    field: 'path',
    
    /**
     * @cfg {String} defaultOperator default operator, one of <tt>{@link #operators} (defaults to equals)
     */
    defaultOperator: 'equals',
    
    /**
     * @cfg {String} defaultValue default value (defaults to all)
     */
    defaultValue: '/',
    
    /**
     * @private
     */
    initComponent: function() {
        this.label = this.app.i18n._('path');
        
        this.callParent(arguments);
    },
    
    /**
     * value renderer
     * 
     * @param {Ext.data.Record} filter line
     * @param {Ext.Element} element to render to 
     */
    valueRenderer: function(filter, el) {
        var value = new Ext.ux.form.ClearableTextField({
            filter: filter,
            width: this.filterValueWidth,
            id: 'tw-ftb-frow-valuefield-' + filter.id,
            renderTo: el,
            value: filter.data.value ? filter.data.value : this.defaultValue,
            emptyText: this.emptyText
        });
        
        value.on('specialkey', function(field, e){
            if(e.getKey() == e.ENTER){
                this.onFiltertrigger();
            }
        }, this);
                
        value.origSetValue = Ext.Function.createInterceptor(value.setValue, value.origSetValue);
        value.setValue = function(value) {
            if (value && value.path) {
                value = value.path;
            }
            else if(Ext.isString(value) && (!value.charAt(0) || value.charAt(0) != '/')) {
                value = '/' + value;
            }
            
            return this.origSetValue(value);
        };
        
        return value;
    }
});

Klb.system.statics.Filters.add('apibase.filemanager.pathfiltermodel', 'KlbDesktop.MVC.Filemanager.view.PathFilterModel');

