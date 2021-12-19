/**
 * Modern 3.0
 * 
 * @license     http://www.gnu.org/licenses/agpl.html AGPL Version 3
 * @author      Cornelius Weiss <c.weiss@metaways.de>
 * @copyright   Copyright (c) 2007-2012 Metaways Infosystems GmbH (http://www.metaways.de)
 *
 */

Ext.ns('Klb.system.widgets');

/**
 * lang chooser widget
 *
 * @namespace   Klb.system.widgets
 * @class       Klb.system.widgets.LangChooser
 * @extends     Ext.form.field.ComboBox
 */
Ext.define('Klb.system.widgets.LangChooser', {
    extend: 'Ext.form.field.ComboBox',

    xtype: 'tinelangchooser',
    /**
     * @cfg {Sring}
     */
    fieldLabel: null,
    
    displayField: 'language',
    valueField: 'locale',
    triggerAction: 'all',
    editable: false,
    width: 100,
    listWidth: 200,
    
    initComponent: function () {
        this.value = Klb.App.Api.registry.get('locale').language;
        this.fieldLabel = this.fieldLabel ? this.fieldLabel : _('Language');
        
        this.tpl = new Ext.XTemplate(
            '<tpl for=".">' +
                '<div class="x-combo-list-item">' +
                    '{language} <tpl if="region.length &gt; 1">{region}</tpl> [{locale}]' + 
                '</div>' +
            '</tpl>', {
                encode: function (value) {
                    return Ext.util.Format.htmlEncode(value);
                }
            }
        );
        
        this.store = new Klb.system.data.JsonStore({
            idProperty: 'locale',
            rootProperty: 'results',
            totalProperty: 'totalcount',
            model: 'Klb.system.Model.Language',
            baseParams: {
                method: 'Api.getAvailableTranslations'
            }
        });
        Klb.system.widgets.LangChooser.superclass.initComponent.call(this);
        
        this.on('select', this.onLangSelect, this);
    },
    
    onLangSelect: function (combo, localeRecord, idx) {
        var currentLocale = Klb.App.Api.registry.get('locale').locale;
        var newLocale = localeRecord.get('locale');
        
        if (newLocale !== currentLocale) {
            Ext.MessageBox.wait(_('setting new language...'), _('Please Wait'));
            
            Klb.system.Ajax.request({
                scope: this,
                params: {
                    method: 'Api.setLocale',
                    localeString: newLocale,
                    saveaspreference: true,
                    setcookie: true
                },
                success: function (result, request) {
                    if (window.google && google.gears && google.gears.localServer) {
                        var pkgStore = google.gears.localServer.openStore('tine20-package-store');
                        if (pkgStore) {
                            google.gears.localServer.removeStore('tine20-package-store');
                        }
                    }
                    window.location.reload(true);
                }
            });
        }
    }
});
//Ext.reg('tinelangchooser', Klb.system.widgets.LangChooser);

