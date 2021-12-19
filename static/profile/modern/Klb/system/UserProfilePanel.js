/*
 * Klb Desktop 3.0.1
 *
 * @package     Modern
 * @subpackage  ExtDesktop
 * @copyright   Copyright (c) 2018 LLC ICS (http://www.icstime.com)
 * @license     http://www.gnu.org/licenses/agpl.html AGPL Version 3
 */

Ext.ns('Klb.system');

/**
 * user profile panel
 * 
 * @namespace   Klb.system
 * @class       Klb.system.UserProfilePanel
 * @extends     Ext.form.Panel
 * @consturctor
 * @author      Cornelius Weiss <c.weiss@metaways.de>
 */
Ext.define('Klb.system.UserProfilePanel', {
    extend: 'Ext.panel.Panel',

    genericFields: ['account_id', 'created_by', 'creation_time', 'last_modified_by',
                      'last_modified_time', 'is_deleted', 'deleted_time', 'deleted_by'],
    layout: 'form',
    border: true,
    labelAlign: 'top',
    autoScroll: true,
    defaults: {
        anchor: '95%',
        labelSeparator: ''
    },
    bodyStyle: 'padding:5px',
    
    initComponent: function() {
        Klb.system.getUserProfile(Klb.App.Api.registry.get('currentAccount').accountId, this.onData.bind(this));
        this.items = [];

        this.callParent(arguments);
    },
    
    onData: function(userProfileInfo) {
        var userProfile      = userProfileInfo.userProfile,
            readableFields   = userProfileInfo.readableFields,
            updateableFields = userProfileInfo.updateableFields;
            
        var adbI18n = new Klb.system.Locale.Gettext();
        adbI18n.textdomain('Addressbook');
        
        Ext.each(readableFields, function(fieldName) {
            // don't display generic fields
            var fieldDefinition = Klb.Addressbook.Model.Contact.getField(fieldName);
            
            switch(fieldName) {
                default: 
                    this.add(new Ext.form.field.Text({
                        hidden: this.genericFields.indexOf(fieldName) >= 0,
                        name: fieldName, 
                        value: userProfile[fieldName],
                        fieldLabel: adbI18n._hidden(fieldDefinition.label),
                        readOnly: updateableFields.indexOf(fieldName) < 0
                    }));
                    break;
            }
        }, this);
        
        this.doLayout();
    }
});
