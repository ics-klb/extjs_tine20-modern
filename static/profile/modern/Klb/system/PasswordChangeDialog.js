/*
 * Modern 3.0.1
 *
 * @package     System
 * @copyright   Copyright (c) 2018 LLC ICS (http://www.icstime.com)
 * @license     http://www.gnu.org/licenses/agpl.html AGPL Version 3
 */

 /**
  * @namespace  Klb.system
  * @class      Klb.system.PasswordChangeDialog
  * @extends    Klb.abstract.Window
  */
Ext.define('Klb.system.PasswordChangeDialog', {
    extend: 'Klb.abstract.Window',

    id: 'changePassword_window',
    closeAction: 'close',
    modal: true,
    width: 350,
    height: 230,
    minWidth: 350,
    minHeight: 230,
    layout: 'fit',
    plain: true,
    title: null,

    initComponent: function() {
        this.currentAccount = Klb.App.Api.registry.get('currentAccount');
        this.title = (this.title !== null) ? this.title :  Ext.String.format(_('Change Password For "{0}"'), this.currentAccount.accountDisplayName);
        
        this.items = new Ext.form.Panel({
            bodyStyle: 'padding:5px;',
            buttonAlign: 'right',
            labelAlign: 'top',
            anchor:'100%',
            id: 'changePasswordPanel',
            defaults: {
                xtype: 'textfield',
                inputType: 'password',
                anchor: '100%',
                allowBlank: false
            },
            items: [{
                id: 'oldPassword',
                fieldLabel: _('Old Password'), 
                name:'oldPassword'
            },{
                id: 'newPassword',
                fieldLabel: _('New Password'), 
                name:'newPassword'
            },{
                id: 'newPasswordSecondTime',
                fieldLabel: _('Repeat new Password'), 
                name:'newPasswordSecondTime'
            }],
            buttons: [{
                text: _('Cancel'),
                iconCls: 'action_cancel',
                handler: function() {
                    Ext.getCmp('changePassword_window').close();
                }
            }, {
                text: _('Ok'),
                iconCls: 'action_saveAndClose',
                handler: function() {
                    var form = Ext.getCmp('changePasswordPanel').getForm();
                    var values;
                    if (form.isValid()) {
                        values = form.getValues();
                        if (values.newPassword == values.newPasswordSecondTime) {
                            Klb.system.Ajax.request({
                                waitTitle: _('Please Wait!'),
                                waitMsg: _('changing password...'),
                                params: {
                                    method: 'Api.changePassword',
                                    oldPassword: values.oldPassword,
                                    newPassword: values.newPassword
                                },
                                success: function(_result, _request){
                                    var response = Ext.util.JSON.decode(_result.responseText);
                                    if (response.success) {
                                        Ext.getCmp('changePassword_window').close();
                                        Ext.MessageBox.show({
                                            title: _('Success'),
                                            msg: _('Your password has been changed.'),
                                            buttons: Ext.MessageBox.OK,
                                            icon: Ext.MessageBox.INFO
                                        });
                                        Klb.system.Ajax.request({
                                            params: {
                                                method: 'Api.updateCredentialCache',
                                                password: values.newPassword
                                            }
                                        });
                                    } else {
                                        Ext.MessageBox.show({
                                            title: _('Failure'),
                                            msg: response.errorMessage,
                                            buttons: Ext.MessageBox.OK,
                                            icon: Ext.MessageBox.ERROR  
                                        });
                                    }
                                }
                            });
                        } else {
                            Ext.MessageBox.show({
                                title: _('Failure'),
                                msg: _('The new passwords mismatch, please correct them.'),
                                buttons: Ext.MessageBox.OK,
                                icon: Ext.MessageBox.ERROR 
                            });
                        }
                    }
                }                    
            }]
        });
        
        Klb.system.PasswordChangeDialog.superclass.initComponent.call(this);
    }
});
