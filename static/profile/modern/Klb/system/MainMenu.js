/*
 * Modern 3.0.1
 *
 * @package     System
 * @copyright   Copyright (c) 2018 LLC ICS (http://www.icstime.com)
 * @license     http://www.gnu.org/licenses/agpl.html AGPL Version 3
 */

/**
 * Modern 3.0 jsclient main menu
 * 
 * @namespace   Klb.system
 * @class       Klb.system.MainMenu
 * @extends     Ext.Toolbar
 * @author      Cornelius Weiss <c.weiss@metaways.de>
 */
Ext.define('Klb.system.MainMenu', {
    extend: 'Ext.toolbar.Toolbar',
    /**
     * @cfg {Boolean} showMainMenu
     */
    showMainMenu: false,
    style: {'padding': '0px 2px'},
    cls: 'tbar-mainmenu',
    /**
     * @type Array
     */
    mainActions: null,

    initComponent: function() {
        this.initActions();
        this.onlineStatus = new Ext.ux.ConnectionStatus({
            showIcon: false
        });

        this.items = this.getItems();

        var buttonTpl = new Ext.Template(
            '<table id="{4}" cellspacing="0" class="x-btn {3}"><tbody class="{1}">',
            '<tr><td class="x-btn-ml"><i>&#160;</i></td><td class="x-btn-mc"><em class="{2}" unselectable="on"><button type="{0}"></button></em></td><td class="x-btn-mr"><i>&#160;</i></td></tr>',
            '</tbody></table>'
        ).compile();

        Ext.each(this.items, function(item) {
            item.template = buttonTpl;
        }, this);
//        this.supr().initComponent.call(this);
        this.callParent();  
    },
    
    getItems: function() {
        return [{
            text: Klb.title,
            hidden: !this.showMainMenu,
            menu: {
                id: 'Api_System_Menu', 
                items: this.getMainActions()
        }},
        '->', {
            text:  Ext.String.format(_('User: {0}'), Klb.App.Api.registry.get('currentAccount').accountDisplayName),
            menu: this.getUserActions(),
            menuAlign: 'tr-br'
        },
        this.onlineStatus,
        this.action_logout];
    },
    
    /**
     * returns all main actions
     * 
     * @return {Array}
     */
    getMainActions: function() {
        if (! this.mainActions) {
            this.mainActions = [
                this.action_loadTutorial,
                '-',
                this.getUserActions(),
                '-',
                this.action_logout
            ];
        }
        
        return this.mainActions;
    },
    
    getUserActions: function() {
        if (! this.userActions) {
            this.userActions = [
                this.action_editProfile,
                this.action_showPreferencesDialog,
                this.action_changePassword
            ];
        }
        return this.userActions;
    },
    
    /**
     * initialize actions
     * @private
     */
    initActions: function() {
        this.action_loadTutorial = new Ext.Action({
            text:  Ext.String.format(_('Help')),
            iconCls: 'action_loadTutorial',
            handler: this.onLoadTutorial,
            scope: this
        });

        this.action_showDebugConsole = new Ext.Action({
            text: _('Debug Console (Ctrl + F11)'),
            handler: Klb.system.Common.showDebugConsole,
            iconCls: 'apibase-action-debug-console'
        });

        this.action_showPreferencesDialog = new Ext.Action({
            text: _('Preferences'),
            disabled: false,
            handler: this.onEditPreferences,
            iconCls: 'action_adminMode'
        });

        this.action_editProfile = new Ext.Action({
            text: _('Edit Profile'),
            disabled: false,
            handler: this.onEditProfile,
            iconCls: 'apibase-accounttype-user'
        });

        this.action_changePassword = new Ext.Action({
            text: _('Change password'),
            handler: this.onChangePassword,
            disabled: (! Klb.system.configManager.get('changepw')),
            iconCls: 'action_password'
        });
        
        this.action_logout = new Ext.Action({
            text: _('Logout'),
            tooltip:   Ext.String.format(_('Logout from {0}'), Klb.title),
            iconCls: 'action_logOut',
            handler: this.onLogout,
            scope: this
        });
    },
    
    /**
     * open new window/tab to show help and tutorial
     */
    onLoadTutorial: function() {
        window.open(Klb.helpUrl,'_blank');
    },
    
    /**
     * @private
     */
    onAbout: function() {
        var aboutDialog = new Klb.system.AboutDialog();
        aboutDialog.show();
    },
    
    /**
     * @private
     */
    onChangePassword: function() {
        var passwordDialog = new Klb.system.PasswordChangeDialog();
        passwordDialog.show();
    },
    
    /**
     * @private
     */
    onEditPreferences: function() {
        Klb.system.widgets.dialog.Preferences.openWindow({});
    },

    /**
     * @private
     */
    onEditProfile: function() {
        Klb.system.widgets.dialog.Preferences.openWindow({
            initialCardName: 'Api.UserProfile'
        });
    },
    
    /**
     * the logout button handler function
     * @private
     */
    onLogout: function() {
        if (Klb.App.Api.registry.get('confirmLogout') != '0') {
            Ext.MessageBox.confirm(_('Confirm'), _('Are you sure you want to logout?'), function(btn, text) {
                if (btn == 'yes') {
                    this._doLogout();
                }
            }, this);
        } else {
            this._doLogout();
        }
    },
    
    /**
     * logout user & redirect
     */
    _doLogout: function() {
        Ext.MessageBox.wait(_('Logging you out...'), _('Please wait!'));
        Klb.system.Ajax.request( {
            params : {
                method : 'Api.logout'
            },
            callback : function(options, Success, response) {
                // clear the authenticated mod_ssl session
                if (document.all == null) {
                    if (window.crypto && Ext.isFunction(window.crypto.logout)) {
                        window.crypto.logout();
                    }
                } else {
                    document.execCommand('ClearAuthenticationCache');
                }
                // remove the event handler
                // the reload() trigers the unload event
                var redirect = Klb.App.Api.registry.get('redirectUrl'),
                    modSsl =  Klb.App.Api.registry.get('modSsl'),
                    redirectUrlmodSsl = Klb.App.Api.registry.get('redirectUrlmodSsl'); 

                if (modSsl && redirectUrlmodSsl != '') {
                    window.location.assign(redirectUrlmodSsl);
                } else {
                    if (redirect && redirect != '') {
                        window.location.assign(redirect);
                    } else {
                    window.location.reload();
                    }
                }
            }
        });
    }
});
