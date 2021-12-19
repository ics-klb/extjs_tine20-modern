/*
 * Modern 3.0.1
 *
 * @package     System
 * @copyright   Copyright (c) 2018 LLC ICS (http://www.icstime.com)
 * @license     http://www.gnu.org/licenses/agpl.html AGPL Version 3
 */

/**
 * @namespace   Klb.system
 * @class       Klb.system.LoginPanel
 * @extends     Ext.panel.Panel
 * @author      Cornelius Weiss <c.weiss@metaways.de>
 */
Ext.define('Klb.system.LoginPanel', {
    extend: 'Ext.panel.Panel',
    /**
     * @cfg {String} defaultUsername prefilled username
     */
    defaultCompany: '',

    defaultUsername: '',

    defaultPassword: '',

    /**
     * @cfg {String} loginMethod server side login method
     */
    loginMethod: 'Api.login',
    
    /**
     * @cfg {String} loginLogo logo to show
     */
    loginLogo: KlbSys.loginLogo,
    
    /**
     * @cfg {String} onLogin callback after successfull login
     */
    onLogin: Ext.emptyFn,
    
    /**
     * @cfg {Boolean} show infobox (survey, links, text)
     */
    showInfoBox: true,
    
    /**
     * @cfg {String} scope scope of login callback
     */
    scope: null,
    
    layout: 'fit',
    border: false,

    /**
     * return loginPanel
     * 
     * @return {Ext.FromPanel}
     */
    getLoginPanel: function () {

        return this.getLoginPanelWin();
    },
    
    getLoginPanelWin: function () {

        var modSsl = Klb.App.Api.registry.get('modSsl');

        if (! this.loginPanel) {
            this.loginPanel = Ext.create('Ext.form.Panel', {
                frame: true,
                border: false,
                layout:'auto',
                region: 'center',
                bodyPadding: 10,
                cls: 'tb-login-panel',
                defaults:{
                      width: 250,
                      fieldWidth: 80,
                      enableKeyEvents:true
                },
                items: [
                {
                    xtype: 'textfield',
                    tabindex: 2,
                    fieldLabel: _('Company'),
                    name: 'company',
                    allowBlank: false,
                    validateOnBlur: false,
                    selectOnFocus: true,
                    value: this.defaultCompany,
                    disabled: modSsl ? true : false
                }, {
                    xtype: 'textfield',
                    tabindex: 2,
                    fieldLabel: _('Username'),
                    name: 'username',
                    allowBlank: false, 
                    validateOnBlur: false,
                    selectOnFocus: false,
                    value: this.defaultUsername ? this.defaultUsername : '',
                    disabled: modSsl ? true : false,
                    listeners: {
                        render: function (field) {
                            field.focus(false, 250);
                        }
                    }
                }, {
                    xtype: 'textfield',
                    tabindex: 3,
                    inputType: 'password',
                    fieldLabel: _('Password'),
                    name: 'password',
                    allowBlank: false,
                    selectOnFocus: false,
                    value: this.defaultPassword,
                    disabled: modSsl ? true : false,
                    listeners: {
                        specialKey: function(field, el) {
                            if(el.getKey() == Ext.EventObject.ENTER) {
                                 Klb.Controller.LoginPanel.onLoginPress();
                            }
                        },
                        render: this.setLastLoginUser.bind(this)
                    }
                }, {
                    xtype: 'displayfield',
                    style: {
                        align: 'center',
                        marginTop: '10px'
                    },
                    value: _('Digital certificate detected. <br />Press <b>Login</b> to proceed.'),
                    hidden: modSsl ? false : true
                }, {
                    xtype: 'container',
                    id:'contImgCaptcha',
                    layout: 'form',
                    style: { visibility:'hidden' },
                    items:[{
                       xtype: 'textfield',
                       width: 170,
                       labelSeparator: '',
                       id: 'security_code',
                       value: null,
                       name: 'securitycode'
                    }, {
                       fieldLabel:(' '),
                       labelSeparator: '',
                       items:[{
                          xtype: 'component',
                          autoEl: { tag: 'img', id: 'imgCaptcha' } 
                       }]
                    }]
                  }
                ],
                buttonAlign: 'center',
                buttons: [{
                    xtype: 'button',
                    width: 120,
                    text: _('Login'),
                    scope: this,
                    handler: this.onLoginPress
                }]
            });
        }
        return this.loginPanel;
    },

    setLastLoginUser: function (field) {
        var lastUser, lastCompany;
            lastUser = Ext.util.Cookies.get('LASTUSERID');
        if (lastUser || lastCompany ) {
            this.loginPanel.getForm().findField('company').setValue(lastCompany);
            this.loginPanel.getForm().findField('username').setValue(lastUser);
            field.focus(false,250);
        }
    },

    getVersionPanel: function () {
        if (! this.versionPanel) {
            var version = (Klb.App.Api.registry.get('version')) ? Klb.App.Api.registry.get('version') : {
                codeName: 'unknown',
                packageString: 'unknown'
            };
            
            var versionHtml = '<label class="tb-version-label">' + _('Version') + ':</label> ' +
                              '<label class="tb-version-codename">' + version.codeName + '</label> ' +
                              '<label class="tb-version-packagestring">(' + version.packageString + ')</label>';
            this.versionPanel = new Ext.Container({
                layout: 'fit',
                cls: 'tb-version-tinepanel',
                border: false,
                defaults: {xtype: 'label'},
                items: [{
                    html: versionHtml
                }]
            });
        }

        return this.versionPanel;
    },

    getSurveyData: function (cb) {
        var ds = new Ext.data.Store({
            proxy: new Ext.data.proxy.JsonP({
                url: KlbSys.requestUrl + '?System.Check'
            }),
            reader: new Ext.data.JsonReader({
                root: 'survey'
            }, ['title', 'subtitle', 'duration', 'langs', 'link', 'enddate', 'htmlmessage', 'version'])
        });

        ds.on('load', function (store, records) {
            var survey = records[0];

            cb.call(this, survey);
        }, this);
        ds.load({params: {lang: Klb.App.Api.registry.get('locale').locale}});
    },
    
    getSurveyPanel: function () {

        if (! this.surveyPanel) {
            this.surveyPanel = new Ext.Container({
                layout: 'fit',
                cls: 'tb-login-surveypanel',
                border: false,
                defaults: {xtype: 'label'},
                items: []
            });
            
            if (! Klb.App.Api.registry.get('denySurveys')) {
                this.getSurveyData(function (survey) {
                    if (typeof survey.get === 'function') {
                        var enddate = Ext.Date.parse(survey.get('enddate'), Date.patterns.ISO8601Long);
                        var version = survey.get('version');

                        if (Ext.isDate(enddate) && enddate.getTime() > new Date().getTime() && 
                            Klb.clientVersion.packageString.indexOf(version) === 0) {
                            survey.data.lang_duration =  Ext.String.format(_('about {0} minutes'), survey.data.duration);
                            survey.data.link = '/check.php?participate';
                            
                            this.surveyPanel.add([{
                                cls: 'tb-login-big-label',
                                html: _('Crm needs your help')
                            }, {
                                html: '<p>' + _('We regularly need your feedback to make the next Crm releases fit your needs even better. Help us and yourself by participating:') + '</p>'
                            }, {
                                html: this.getSurveyTemplate().apply(survey.data)
                            }, {
                                xtype: 'button',
                                width: 120,
                                text: _('participate!'),
                                handler: function () {
                                    window.open(survey.data.link);
                                }
                            }]);
                            this.surveyPanel.doLayout();
                        }
                    }
                });
            }
        }

        return this.surveyPanel;
    },
    
    getSurveyTemplate: function () {
        if (! this.surveyTemplate) {
            this.surveyTemplate = new Ext.XTemplate(
                '<br/ >',
                '<p><b>{title}</b></p>',
                '<p><a target="_blank" href="{link}" border="0">{subtitle}</a></p>',
                '<br/>',
                '<p>', _('Languages'), ': {langs}</p>',
                '<p>', _('Duration'), ': {lang_duration}</p>',
                '<br/>').compile();
        }
        
        return this.surveyTemplate;
    },
    
    /**
     * checks browser compatibility and show messages if unknown/incompatible
     * @return {Ext.Container}
     * 
     * TODO find icons with the correct license
     */
    getBrowserIncompatiblePanel: function() {
        if (! this.browserIncompatiblePanel) {
            this.browserIncompatiblePanel = new Ext.Container({
                layout: 'fit',
                cls: 'tb-login-browserpanel',
                border: false,
                defaults: {xtype: 'label'},
                items: []
            });
            
            var browserSupport = 'compatible';
            if (Ext.isIE6 || Ext.isIE7 || Ext.isGecko2) {
                browserSupport = 'incompatible';
            } else if (
                ! (Ext.isWebKit || Ext.isGecko || Ext.isIE || Ext.isNewIE)
            ) {
                // yepp we also mean -> Ext.isOpera
                browserSupport = 'unknown';
            }
            
            var items = [];
            if (browserSupport == 'incompatible') {
                items = [{
                    cls: 'tb-login-big-label',
                    html: _('Browser incompatible')
                }, {
                    html: '<p>' + _('Your browser is not supported by JS') + '<br/><br/></p>'
                }];
            } else if (browserSupport == 'unknown') {
                items = [{
                    cls: 'tb-login-big-label',
                    html: _('Browser incompatible?')
                }, {
                    html: '<p>' + _('You are using an unrecognized browser. This could result in unexpected behaviour.') + '<br/><br/></p>'
                }];
            }

            if (browserSupport != 'compatible') {
                this.browserIncompatiblePanel.add(items.concat([{
                    html: '<p>' + _('You might try one of these browsers:') + '<br/>'
                        + '<a href="http://www.google.com/chrome" target="_blank">Google Chrome</a><br/>'
                        + '<a href="http://www.mozilla.com/firefox/" target="_blank">Mozilla Firefox</a><br/>'
                        + '<br/></p>'
                }]));
                this.browserIncompatiblePanel.doLayout();
            }
        }
        
        return this.browserIncompatiblePanel;
    },
    
    initComponent: function () {
        this.initLayout();
        this.callParent();
    },
    
    initLayout: function () {
        var infoPanelItems = (this.showInfoBox) ? [
            this.getBrowserIncompatiblePanel()
        ] : [];

        this.infoPanel = new Ext.Container({
            cls: 'tb-login-infosection',
            border: false,
            width: 300,
            minheight: 460,
            layout: 'vbox',
            layoutConfig: {
                align: 'stretch'
            },
            items: infoPanelItems
        });

        this.items = [{
            xtype: 'container',
            layout: 'absolute',
            border: false,
            items: [
                this.getLoginPanel(),
                this.infoPanel,
                this.getVersionPanel()
            ]
        }];
//        var tbHeight = this.activeFilterPanel.getHeight(),
//             northHeight = this.layout.absolute ? this.layout.north.panel.getHeight() : 0,
//             eastHeight = this.layout.east && this.layout.east.panel.getEl().child('ul') ? (this.layout.east.panel.getEl().child('ul').getHeight() + 28) : 0,
//             height = Math.min(Math.max(eastHeight, tbHeight + northHeight), 120);
//        this.setHeight(height);
    },

    getLoginValues: function(account) {
        var values = {};
        if ( this.loginPanel && !account ) {
            var form = this.getLoginPanel().getForm();
                values =form.getValues();
         } 
           else if ( account && Klb.App.Api && Klb.App.Api.registry ) {
             var _current = Klb.system.Core.getAccount();

                values.company   = account.company   || this.defaultCompany;
                values.password  = account.password  || '';                  
                values.username  = account.username  || _current.accountLoginName;
                values.useremail = account.useremail || _current.accountEmailAddress;
                values.securitycode = 0;
         }
        return values;
    },
    /**
     * @private
     */
    onAbout: function() {
//       var aboutDialog = new Klb.system.AboutDialog();
 ///        aboutDialog.show();
    },
    
    /**
     * do the actual login
     */
    onLoginPress: function () {
        var form = this.getLoginPanel().getForm();
 
        if (form.isValid()) {
            this.onAuthenticationLogin( this.getLoginValues() ); 
        } else {
            Ext.MessageBox.alert(_('Errors'), _('Please fix the errors noted.'));
        }
    },
    
    onAuthenticationLogin: function (values) {
        
            Ext.MessageBox.wait(_('Logging you in...'), _('Please wait'));
            Klb.system.Ajax.request({
                scope: this,
                params : {
                    method: this.loginMethod,
                    company: values.company,
                    username: values.username,
                    password: values.password,
                    securitycode: values.securitycode
                },
                timeout: 60000, // 1 minute
                callback: function (request, httpStatus, response) {

                    var responseData = Ext.util.JSON.decode(response.responseText);
                    if (responseData.success === true) {
                        Klb.system.Core.waitLoading(true);
                        window.document.title = this.originalTitle;
                        this.onLogin.call(this.scope);
                    } else {
                        if (responseData.data && responseData.data.code === 510) {
                            // NOTE: when communication is lost, we can't create a nice ext window.
                            (function() {
                                Klb.system.Core.waitLoading(false);
                                Klb.Msg.Alert(false, _('Connection lost, please check your network!'));
                            }).defer(1000);
                        } else {
                            var errorMessage = responseData.errorMessage || responseData.message;

                            if(errorMessage.indexOf("expired") != -1) {
                                Ext.MessageBox.show({
                                    title:_('Login failure'),
                                    msg: _(errorMessage),
                                    buttons: Ext.Msg.YESNO,
                                    fn: function(_btn){
                                        if(_btn == 'yes'){
                                            var passwordDialog = new Klb.system.ExpiredPasswordChangeDialog();
                                                passwordDialog.show();
                                        }
                                    },
                                    icon: Ext.MessageBox.QUESTION
                                });
                            }
                              else {
                                var modSsl = Klb.App.Api.registry.get('modSsl');
                                var resultMsg = modSsl ? _('There was an error verifying your certificate!!!') :
                                                          _('Your username and/or your password are wrong!!!');
                                Ext.MessageBox.show({
                                    title: _('Login failure'),
                                    msg: _(errorMessage),
                                    buttons: Ext.MessageBox.OK,
                                    icon: Ext.MessageBox.ERROR,
                                    fn: function () {
                                        this.getLoginPanel().getForm().findField('password').focus(true);
                                        if(document.getElementById('useCaptcha')) {
                                            if(typeof responseData.c1 != 'undefined') {
                                                document.getElementById('imgCaptcha').src = 'data:image/png;base64,' + responseData.c1;
                                                document.getElementById('contImgCaptcha').style.visibility = 'visible';  
                                            }
                                        }
                                    }.bind(this)
                                });
                            }
                        }
                    }
                }
            });
    },

    onRender: function (ct, position) {

        this.callParent(arguments);          
        this.map = new Ext.KeyMap(this.el, [{
            key : [10, 13],
            scope : this,
            fn : this.onLoginPress
        }]);
        
        this.originalTitle = window.document.title;
        var postfix = (Klb.App.Api.registry.get('titlePostfix')) ? Klb.App.Api.registry.get('titlePostfix') : '';
        window.document.title = Klb.title + postfix + ' - ' + _('Please enter your login data');
    },
    
    onResize: function () {

        this.callParent(arguments);  
        var box      = this.getBox(),
            loginBox = this.getLoginPanel().rendered ? this.getLoginPanel().getBox() : {width : this.getLoginPanel().width, height: this.getLoginPanel().height},
            infoBox  = this.infoPanel.rendered ? this.infoPanel.getBox() : {width : this.infoPanel.width, height: this.infoPanel.height};

        var top = (box.height - loginBox.height) / 2;
        if (box.height - top < infoBox.height) {
            top = box.height - infoBox.height;
        }
        
        var loginLeft = (box.width - loginBox.width) / 2;
        if (loginLeft + loginBox.width + infoBox.width > box.width) {
            loginLeft = box.width - loginBox.width - infoBox.width;
        }
                
        this.getLoginPanel().setPosition(loginLeft, top);
        this.infoPanel.setPosition(loginLeft + loginBox.width, top);

//        this.getPoweredByPanel().setPosition(650, 463);
    },
    
    renderSurveyPanel: function (survey) {
        var items = [{
            cls: 'tb-login-big-label',
            html: _('Home needs your help')
        }, {
            html: '<p>' + _('We regularly need your feedback to make the next Crm releases fit your needs even better. Help us and yourself by participating:') + '</p>'
        }];
    }
});
