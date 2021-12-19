/*
 * Modern 3.0
 * 
 * @license     http://www.gnu.org/licenses/agpl.html AGPL Version 3
 * @author      Cornelius Weiss <c.weiss@metaways.de>
 * @copyright   Copyright (c) 2007-2012 Metaways Infosystems GmbH (http://www.metaways.de)
 */

Ext.ns('Klb.system.widgets', 'Klb.system.widgets.tags');

/**
 * @namespace   Klb.system.widgets.tags
 * @class       Klb.system.widgets.tags.TagFilter
 * @extends     Klb.system.widgets.grid.PickerFilter
 */
Ext.define('Klb.system.widgets.tags.TagFilter', {
    extend: 'Klb.system.widgets.grid.PickerFilter',
    
    field: 'tag',
    defaultOperator: 'equals',
    
    /**
     * @private
     */
    initComponent: function() {
        this.picker = Klb.system.widgets.tags.TagCombo;
        this.recordClass = Klb.system.Model.Tag;
        
        Klb.system.widgets.tags.TagFilter.superclass.initComponent.call(this);
        
        this.label = _('Tag');
    }
});

Klb.system.statics.Filters.add(  'apibase.tag', 'Klb.system.widgets.tags.TagFilter');
