/**
 * Modern 3.0
 * 
 * @license     http://www.gnu.org/licenses/agpl.html AGPL Version 3
 * @author      Philipp Schuele <p.schuele@metaways.de>
 * @copyright   Copyright (c) 2007-2008 Metaways Infosystems GmbH (http://www.metaways.de)
 *
 * @deprecated  is replaced by preferences dialog / perhaps we need this again in calendar (event edit dialog)
 */

Ext.ns('Klb.system.widgets');

/**
 * timezone chooser widget
 *
 * @namespace   Klb.system.widgets
 * @class       Klb.system.widgets.TimezoneChooser
 * @extends     Ext.form.field.ComboBox
 */
Ext.define('Klb.system.widgets.TimezoneChooser', {
    extend: 'Ext.form.field.ComboBox',
    /**
     * @cfg {Sring}
     */
    fieldLabel: null,
    
    displayField: 'timezoneTranslation',
    valueField: 'timezone',
    triggerAction: 'all',
    width: 100,
    listWidth: 250,
    editable: false,
    //typeAhead: true,
    
    initComponent: function() {
        this.value = Klb.App.Api.registry.get('timeZone');
        this.fieldLabel = this.fieldLabel ? this.fieldLabel : _('Timezone');

        this.tpl = new Ext.XTemplate(
            '<tpl for=".">' +
                '<div class="x-combo-list-item">' +
                    '{[this.translate(values.timezone, values.timezoneTranslation)]}' + 
                '</div>' +
            '</tpl>',{
                translate: function(timezone, timezoneTranslation) {
                    // use timezoneTranslation as fallback
                    var translation = (Locale.getTranslationData('CityToTimezone', timezone)) 
                       ? Locale.getTranslationData('CityToTimezone', timezone)
                       : timezoneTranslation;
                    return timezone + (translation ? (' - <i>(' + translation + ')</i>') : '');
                }
            }
        );
        
        this.store = new Klb.system.data.JsonStore({
            idProperty: 'timezone',
            rootProperty: 'results',
            totalProperty: 'totalcount',
            model: 'Klb.system.Model.Timezone',
            baseParams: {
                method: 'Api.getAvailableTimezones'
            }
        });
        Klb.system.widgets.TimezoneChooser.superclass.initComponent.call(this);
        
        this.on('select', this.onTimezoneSelect, this);
    },
    
    /**
     * timezone selection ajax call
     */
    onTimezoneSelect: function(combo, record, idx) {
        var currentTimezone = Klb.App.Api.registry.get('timeZone');
        var newTimezone = record.get('timezone');
        
        if (newTimezone != currentTimezone) {
            Ext.MessageBox.wait(_('setting new timezone...'), _('Please Wait'));
            
            Klb.system.Ajax.request({
                scope: this,
                params: {
                    method: 'Api.setTimezone',
                    timezoneString: newTimezone,
                    saveaspreference: true
                },
                success: function(result, request){
                    var responseData = Ext.util.JSON.decode(result.responseText);
                    window.location.reload();
                }
            });
        }
    }
});
