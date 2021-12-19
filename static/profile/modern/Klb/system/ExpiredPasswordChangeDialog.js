/*
 * Modern 3.1.0
 * 
 * @license     http://www.gnu.org/licenses/agpl.html AGPL Version 3
 * @author      Fernando Alberto Reuter Wendt <fernando-alberto.wendt@serpro.gov.br>
 * @copyright   Copyright (c) 2013 SERPRO - Serviço Federal de Processamento de Dados (http://www.serpro.gov.br)
 *
 */
 
 Ext.ns('Klb', 'Klb.system');
 
 /**
  * @namespace  Klb.system
  * @class      Klb.system.PasswordChangeDialog
  * @extends    Klb.abstract.Window
  */
Ext.define('Klb.system.ExpiredPasswordChangeDialog', {
    extend: 'Klb.abstract.Window',

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
        if (!Klb.loginPanel){
            Klb.Msg.Alert(_('Warning'), _('This action is only available in the login screen!'));
            return;
        }      
        
        this.currentAccount = Klb.loginPanel.getLoginPanel().getForm().findField("username").getValue();
        this.currentPassword = Klb.loginPanel.getLoginPanel().getForm().findField("password").getValue();
        
        if ((Ext.isEmpty(this.currentAccount)) || (Ext.isEmpty(this.currentPassword))){
            Ext.Msg.alert(_('Warning'), _('Check the username and/or password entered in the login screen!'));
            return;            
        }

        this.title = (this.title !== null) ? this.title :  Ext.String.format(_('Change Password For "{0}"'), this.currentAccount);
        
        this.items = new Ext.form.Panel({
            bodyStyle: 'padding:5px;',
            buttonAlign: 'right',
            labelAlign: 'top',
            anchor:'100%',
            id: 'changeExpiredPasswordPanel',
            defaults: {
                xtype: 'textfield',
                inputType: 'password',
                anchor: '100%',
                allowBlank: false
            },
            items: [{
                id: 'oldPassword',
                fieldLabel: _('Old Password'), 
                value: this.currentPassword,
                name:'oldPassword'
            },{
                id: 'newPassword',
                fieldLabel: _('New Password'), 
                name:'newPassword'
            },{
                id: 'newPasswordSecondTime',
                fieldLabel: _('Repeat new Password'), 
                name:'newPasswordSecondTime'
            },{
                id: 'accountId',
                name:'accountId',
                inputType: 'hidden',
                value: this.currentAccount
            }],
            buttons: [{
                text: _('Cancel'),
                iconCls: 'action_cancel',
                handler: function() {
                    Ext.getCmp('changeExpiredPassword_window').close();
                }
            }, {
                text: _('Ok'),
                iconCls: 'action_saveAndClose',
                handler: function() {
                    var form = Ext.getCmp('changeExpiredPasswordPanel').getForm();
                    var values;
                    if (form.isValid()) {
                        values = form.getValues();
                        if (values.newPassword == values.newPasswordSecondTime) {
                            Ext.MessageBox.wait(_('Updating your new password...'), _('Please wait'));
                            
                            Klb.system.Ajax.request({
                                waitTitle: _('Please Wait!'),
                                waitMsg: _('changing password...'),
                                params: {
                                    method: 'Api.changeExpiredPassword',
                                    userName: values.accountId,
                                    oldPassword: values.oldPassword,
                                    newPassword: values.newPassword
                                },
                                success: function(_result, _request){
                                    var response = Ext.util.JSON.decode(_result.responseText);
                                    if (response.success) {
                                        Ext.getCmp('changeExpiredPassword_window').close();                                       
                                        
                                        
                                        Ext.MessageBox.show({
                                            title: _('Success'),
                                            msg: _(response.successMessage),
                                            buttons: Ext.MessageBox.OK,
                                            icon: Ext.MessageBox.INFO,
                                            fn: function(){
                                                    if(Klb.loginPanel){
                                                        Klb.loginPanel.getLoginPanel().getForm().findField('password').setValue("");
                                                    }
                                            }
                                        });
                                    } else {
                                        Ext.MessageBox.show({
                                            title: _('Failure'),
                                            msg: _(response.errorMessage),
                                            buttons: Ext.MessageBox.OK,
                                            icon: Ext.MessageBox.ERROR  
                                        });
                                    }
                                },
                                failure: function(response, opts) {
                                        window.alert('foo\n' + response.errorMessage);
                                        Ext.MessageBox.show({
                                            title: _('Failure'),
                                            msg: _('Something wrong happened while setting your new password. You can try again, or contact your system administrator'),
                                            buttons: Ext.MessageBox.OK,
                                            icon: Ext.MessageBox.INFO
                                        });
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
        
        this.callParent(arguments);
    }
});
