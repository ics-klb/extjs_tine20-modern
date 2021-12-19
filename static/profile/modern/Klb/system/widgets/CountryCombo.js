/*
 * Modern 3.1.0
 * 
 * @license     http://www.gnu.org/licenses/agpl.html AGPL Version 3
 * @author      Cornelius Weiss <c.weiss@metaways.de>
 * @copyright   Copyright (c) 2007-2011 Metaways Infosystems GmbH (http://www.metaways.de)
 *
 */
 
Ext.ns('KlbDesktop.widgets');

/**
 * Widget for country selection
 *
 * @namespace   KlbDesktop.widgets
 * @class       Klb.system.widgets.CountryCombo
 * @extends     Ext.form.field.ComboBox
 */
Ext.define('Klb.system.widgets.CountryCombo', {
    extend: 'Ext.form.field.ComboBox',

    xtype: 'countrycombo',
    fieldLabel: 'Country',
    displayField:'translatedName',
    valueField:'shortName',
    typeAhead: true,
    forceSelection: true,
    mode: 'local',
    triggerAction: 'all',
    selectOnFocus:true,
    
    /**
     * @private
     */
    initComponent: function() {
        this.store = this.getCountryStore();
        this.emptyText = _('Select a country...');
        
        Klb.system.widgets.CountryCombo.superclass.initComponent.call(this);
    },
    /**
     * @private store has static content
     */
    getCountryStore: function(){
        var store = Ext.StoreMgr.get('Countries');
        if(!store) {
            store = new Klb.system.data.JsonStore({
                baseParams: {
                    method:'Api.getCountryList'
                },
                idProperty: 'shortName',
                rootProperty: 'results',
                fields: ['shortName', 'translatedName'],
                remoteSort: false,
                sortInfo: {
                    field: 'translatedName',
                    direction: 'ASC'
                }
            });
            Ext.StoreMgr.add('Countries', store);
        }
        
        var countryList = Locale.getTranslationList('CountryList');
        if (countryList) {
            var storeData = {results: []};
            for (var shortName in countryList) {
                storeData.results.push({shortName: shortName, translatedName: countryList[shortName]});
            }
            store.loadData(storeData);
        }
        return store;
    }
});

//Ext.reg('widget-countrycombo', Klb.system.widgets.CountryCombo);
