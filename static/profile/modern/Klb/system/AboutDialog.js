/*
 * Modern 3.0.1
 * 
 * @package     System
 * @subpackage  AboutDialog
 * @copyright   Copyright (c) 2018 LLC ICS (http://www.icstime.com)
 * @license     http://www.gnu.org/licenses/agpl.html AGPL Version 3
 */

Ext.ns('Klb', 'Klb.system', 'Klb.packages');
/**
  * @namespace  Klb.system
  * @class      Klb.system.AboutDialog
  * @extends    Klb.abstract.Window
  */
Ext.define('Klb.system.AboutDialog', {
    extend: 'Klb.abstract.Window',
    
    closeAction: 'close',
    modal: true,
    width: 400,
    height: 360,
    minWidth: 400,
    minHeight: 360,
    layout: 'fit',
    title: null,

    initAboutTpl: function() {
        this.aboutTpl = new Ext.XTemplate(
            '<div class="tb-about-dlg">',
                '<div class="tb-about-img"><a href="{logoLink}" target="_blank"><img src="{logo}" /></a></div>',
                '<div class="tb-link-home"><a href="{logoLink}" target="_blank">{logoLink}</a></div>',
                '<div class="tb-about-version">Version: {codeName}</div>',
                '<div class="tb-about-build">({packageString})</div>',
                '<div class="tb-about-credits-license"><p><a href="javascript:\'void()\'" class="license" /><a href="javascript:\'void()\'" class="credits" /></p></div>',
            '</div>'
        );
    },
    
    initComponent: function() {
        this.title =  Ext.String.format(_('About {0}'), Klb.title);
        
        this.initAboutTpl();
        
        var version = (Klb.App.Api.registry.get('version')) ? Klb.App.Api.registry.get('version') : {
            codeName: 'unknown',
            packageString: 'unknown'
        };

        this.items = {
            layout: 'fit',
            border: false,
            html: this.aboutTpl.applyTemplate({
                logo: Klb.system.LoginPanel.prototype.loginLogo,
                logoLink: Klb.weburl,
                codeName: version.codeName,
                packageString: version.packageString
            }),
            buttons: [{
                text: _('Ok'),
                iconCls: 'action_saveAndClose',
                handler: this.close,
                scope: this
            }]
        };
        
        // create links
        this.on('afterrender', function() {
            var el = this.getEl().select('div.tb-about-dlg div.tb-about-credits-license a.license');
            el.insertHtml('beforeBegin', ' ' + _('Released under different') + ' ');
            el.insertHtml('beforeBegin', _('Open Source Licenses'));
            el.on('click', function(){
                var ls = new Klb.system.LicenseScreen();
                ls.show();
            });
            
            var el = this.getEl().select('div.tb-about-dlg div.tb-about-credits-license a.credits');
            el.insertHtml('beforeBegin', ' ' + _('with the help of our') + ' ');
            el.insertHtml('beforeBegin', _('Contributors'));
            el.on('click', function() {
                var cs = new Klb.system.CreditsScreen();
                cs.show();
            });
            
            
        }, this);

        Klb.system.AboutDialog.superclass.initComponent.call(this);
    }
});
