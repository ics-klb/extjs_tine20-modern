/*
 * Modern 3.1.0
 * 
 * @license     http://www.gnu.org/licenses/agpl.html AGPL Version 3
 * @author      Cornelius Weiss <c.weiss@metaways.de>
 * @copyright   Copyright (c) 2007-2012 Metaways Infosystems GmbH (http://www.metaways.de)
 *
 */

Ext.ns('Klb', 'Klb.system');
 
 /**
  * @namespace  Klb.system
  * @class      Klb.system.ExceptionDialog
  * @extends    Klb.abstract.Window
  */
Ext.define('Klb.system.ExceptionDialog', {
    extend: 'Klb.abstract.Window',
    width: 400,
    height: 600,
    layout: 'fit',
    plain: true,
    closeAction: 'close',
    autoScroll: true,
    releaseMode: true,

    /**
     * non-interactive mode: do not show anything and just submit the report
     * 
     * @type Boolean
     */
    nonInteractive: false,
    
    /**
     * @private
     */
    initComponent: function () {
        this.currentAccount = Klb.App.Api.registry.get('currentAccount');
        
        // check if we have the version in registry (is not the case in the setup)
        if (! Klb.App.Api.registry.get('version') || Klb.App.Api.registry.get('version').buildType != 'RELEASE') {
            this.releaseMode = false;
            this.width = 800;
        }

        var trace = '';
        if (Ext.isArray(this.exception.trace)) {
            for (var i = 0,j = this.exception.trace.length; i < j; i++) {
                trace += (this.exception.trace[i].file ? this.exception.trace[i].file : '[internal function]') +
                         (this.exception.trace[i].line ? '(' + this.exception.trace[i].line + ')' : '') + ': ' +
                         (this.exception.trace[i]['class'] ? '<b>' + this.exception.trace[i]['class'] + this.exception.trace[i].type + '</b>' : '') +
                         '<b>' + this.exception.trace[i]['function'] + '</b>' +
                        '(' + ((this.exception.trace[i].args && this.exception.trace[i].args[0]) ? this.exception.trace[i].args[0] : '') + ')<br/>';
            }
            
            this.exception.traceHTML = trace;
        }
        
        this.title = _('Abnormal End');
        this.items = this.getReportForm();
        
        Klb.system.ExceptionDialog.superclass.initComponent.call(this);
        
        this.on('show', function () {
            if (this.nonInteractive) {
                Klb.Logger.debug('Klb.system.ExceptionDialog::onShow -> Sending bugreport non-interactive ...');
                this.onSendReport();
            } else {
                // fix layout issue
                this.setHeight(this.getHeight() + 10);
            }
        }, this);
        
        this.on('close', function() {
            if (Klb.system.configManager.get('automaticBugreports') && ! this.nonInteractive) {
                Klb.Logger.debug('Klb.system.ExceptionDialog::onCancel -> Activate non-interacive exception dialog.');
                Klb.system.exceptionDlg = new Klb.system.ExceptionDialog({
                    exception: this.exception,
                    nonInteractive: true,
                    listeners: {
                        close: function() {
                            Klb.system.exceptionDlg = null;
                        }
                    }
                });
                Klb.system.exceptionDlg.show();
            }
        }, this);
    },
    
    /**
     * use button order based on preference
     * 
     * @private
     * @return {Array}
     */
    initButtons: function () {
        if (Klb.App.Api.registry && Klb.App.Api.registry.get('preferences') && Klb.App.Api.registry.get('preferences').get('dialogButtonsOrderStyle') === 'Windows') {
            this.reportButtons = [{
                text: _('Send Report'),
                iconCls: 'action_saveAndClose',
                enabled: Klb.system.Common.hasRight('report_bugs', 'Modern'),
                scope: this,
                handler: this.onSendReport
            }, {
                text: _('Cancel'),
                iconCls: 'action_cancel',
                scope: this,
                handler: function() {
                    this.close();
                }
            }];
        }
        else {
            this.reportButtons = [{
                text: _('Cancel'),
                iconCls: 'action_cancel',
                scope: this,
                handler: function() {
                    this.close();
                }
            }, {
                text: _('Send Report'),
                iconCls: 'action_saveAndClose',
                enabled: Klb.system.Common.hasRight('report_bugs', 'Modern'),
                scope: this,
                handler: this.onSendReport
            }];
        }
        
        return this.reportButtons;
    },
    
    /**
     * @private
     */
    getReportForm: function () {
        this.initButtons();
        
        this.reportForm = new Ext.form.Panel({
            id: 'tb-exceptiondialog-frompanel',
            bodyStyle: 'padding:5px;',
            buttonAlign: 'right',
            labelAlign: 'top',
            autoScroll: true,
            buttons: this.reportButtons,
            items: [{
                xtype: 'panel',
                border: false,
                html: '<div class="tb-exceptiondialog-text">' + 
                        '<p>' + _('An error occurred, the program ended abnormal.') + '</p>' +
                        '<p>' + _('The last action you made was potentially not performed correctly.') + '</p>' +
                        '<p>' + _('Please help improving this software and notify the vendor. Include a brief description of what you where doing when the error occurred.') + '</p>' + 
                    '</div>'
            }, {
                id: 'tb-exceptiondialog-description',
                height: 60,
                xtype: 'textarea',
                fieldLabel: _('Description'),
                name: 'description',
                anchor: '95%',
                readOnly: false
            }, {
                xtype: 'fieldset',
                id: 'tb-exceptiondialog-send-contact',
                anchor: '95%',
                title: _('Send Contact Information'),
                autoHeight: true,
                checkboxToggle: true,
                items: [{
                    id: 'tb-exceptiondialog-contact',
                    xtype: 'textfield',
                    hideLabel: true,
                    anchor: '100%',
                    name: 'contact',
                    value: this.currentAccount.accountFullName + ' ' + this.currentAccount.accountEmailAddress
                }]
            }, {
                xtype: 'panel',
                width: '95%',
                layout: 'form',
                collapsible: true,
                collapsed: this.releaseMode,
                title: _('Details:'),
                defaults: {
                    xtype: 'textfield',
                    readOnly: true,
                    anchor: '95%'
                },
                html: '<div class="tb-exceptiondialog-details">' +
                        '<p class="tb-exceptiondialog-msg">' + this.exception.message + '</p>' +
                        '<p class="tb-exceptiondialog-trace">' + this.exception.traceHTML + '</p>' +
                    '</div>'
            }]
        });
        
        return this.reportForm;
    },
    
    /**
     * send the report to tine20.org bugracker
     * 
     * NOTE: due to same domain policy, we need to send data via a img get request
     * @private
     */
    onSendReport: function () {
        if (! this.nonInteractive) {
            Ext.MessageBox.wait(_('Sending report...'), _('Please wait a moment'));
        }
        var baseUrl = KlbSys.bugreportUrl;
        var hash = this.generateHash();
        
        this.exception.msg           = this.exception.message;
        this.exception.description   = Ext.getCmp('tb-exceptiondialog-description').getValue();
        this.exception.clientVersion = Klb.clientVersion;
        this.exception.serverVersion = (Klb.App.Api.registry.get('version')) ? Klb.App.Api.registry.get('version') : {};

        // tinebase version
        Ext.each(Klb.App.Api.registry.get('userApplications'), function (app) {
            if (app.name == 'Modern') {
                this.exception.tinebaseVersion = app;
                return false;
            }
        }, this);
        
        // append contact?
        if (! Ext.getCmp('tb-exceptiondialog-send-contact').collapsed) {
            this.exception.contact = Ext.getCmp('tb-exceptiondialog-contact').getValue();
        }
        
        // NOTE:  - we have about 80 chars overhead (url, paramnames etc) in each request
        //        - 1024 chars are expected to be pass client/server limits savely => 940
        //        - base64 means about 30% overhead => 600 
        var chunks = this.strChunk(Ext.util.JSON.encode(this.exception), 600);
        
        var img = [];
        for (var i = 0; i < chunks.length; i++) {
            var part = i+1 + '/' + chunks.length;
            var data = {data : this.base64encode('hash=' + hash + '&part=' + part + '&data=' + chunks[i])};

            var url = baseUrl + '?' + Ext.urlEncode(data);
            img.push(Ext.DomHelper.insertFirst(this.el, {tag: 'img', src: url, hidden: true}, true));
        }
        
        if (! this.nonInteractive) {
            window.setTimeout(this.showTransmissionCompleted, 4000);
        }

        this.close();
    },
    
    /**
     * @private
     */
    showTransmissionCompleted: function () {
        Ext.MessageBox.show({
            title: _('Transmission Completed'),
            msg: _('Your report has been sent. Thanks for your contribution') + '<br /><b>' + _('Please restart your browser now!') + '</b>',
            buttons: Ext.MessageBox.OK,
            icon: Ext.MessageBox.INFO
        });
    },

    /**
     * @private
     */
    strChunk: function (str, chunklen) {
        var chunks = [];
        
        var numChunks = Math.ceil(str.length / chunklen);
        for (var i = 0; i < str.length; i +=  chunklen) {
            chunks.push(str.substr(i, chunklen));
        }
        return chunks;
    },

    /**
     * @private
     */
    generateHash: function () {
        // if the time isn't unique enough, the addition 
        // of random chars should be
        var t = String(new Date().getTime()).substr(4);
        var s = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        for(var i = 0; i < 4; i++){
            t += s.charAt(Math.floor(Math.random()*26));
        }
        return t;
    },
    

    /**
     * base 64 encode given string
     * @private
     */
    base64encode : function (input) {
        var keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
        var output = "";
        var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
        var i = 0;

        while (i < input.length) {

            chr1 = input.charCodeAt(i++);
            chr2 = input.charCodeAt(i++);
            chr3 = input.charCodeAt(i++);

            enc1 = chr1 >> 2;
            enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
            enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
            enc4 = chr3 & 63;

            if (isNaN(chr2)) {
                enc3 = enc4 = 64;
            } else if (isNaN(chr3)) {
                enc4 = 64;
            }

            output = output +
            keyStr.charAt(enc1) + keyStr.charAt(enc2) +
            keyStr.charAt(enc3) + keyStr.charAt(enc4);

        }

        return output;
    }
});
