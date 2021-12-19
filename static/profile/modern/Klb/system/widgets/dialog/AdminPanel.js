/*
 * Modern 3.1.0
 * 
 * @package     Admin
 * @license     http://www.gnu.org/licenses/agpl.html AGPL Version 3
 * @author      Philipp Schuele <p.schuele@metaways.de>
 * @copyright   Copyright (c) 2010 Metaways Infosystems GmbH (http://www.metaways.de)
 *
 */

Ext.ns('Klb.system.widgets', 'Klb.system.widgets.dialog');

/**
 * admin settings panel
 * 
 * @namespace   Klb.system.widgets.dialog
 * @class       Klb.system.widgets.dialog.AdminPanel
 * @extends     Klb.system.widgets.dialog.EditDialog
 * 
 * <p>Admin Panel</p>
 * <p><pre>
 * </pre></p>
 * 
 * @license     http://www.gnu.org/licenses/agpl.html AGPL Version 3
 * @author      Philipp Schuele <p.schuele@metaways.de>
 * @copyright   Copyright (c) 2010 Metaways Infosystems GmbH (http://www.metaways.de)
 * 
 * @param       {Object} config
 * @constructor
 * Create a new Klb.system.widgets.dialog.AdminPanel
 */
Ext.define('Klb.system.widgets.dialog.AdminPanel', {
    extend: 'Klb.system.widgets.dialog.EditDialog',
    /**
     * @private
     */
    appName: 'Admin',
    recordClass: Klb.system.Model.Config,
    evalGrants: false,
    
    //private
    initComponent: function(){
        this.record = new this.recordClass({
            id: this.appName
        });
        
        Klb.system.widgets.dialog.AdminPanel.superclass.initComponent.call(this);
    },
    
    /**
     * executed after record got updated from proxy
     */
    onRecordLoad: function() {
        // interrupt process flow until dialog is rendered
        if (! this.rendered) {
            this.onRecordLoad.defer(250, this);
            return;
        }
        
        this.window.setTitle( Ext.String.format(_('Change settings for application {0}'), this.appName));
        
        if (this.fireEvent('load', this) !== false) {
            var settings = this.record.get('settings'),
                form = this.getForm();
            for (var setting in settings) {
                form.findField(setting).setValue(settings[setting]);
            }
        
            form.clearInvalid();
            
            this.loadMask.hide();
        }
    },
    
    /**
     * executed when record gets updated from form
     */
    onRecordUpdate: function() {
        // merge changes from form into settings
        var settings = this.record.get('settings'),
            form = this.getForm(),
            newSettings = {};

        for (var setting in settings) {
            newSettings[setting] = form.findField(setting).getValue();
        }
        
        this.record.set('settings', newSettings);
        
        // TODO update registry
    },
    
    /**
     * returns dialog
     * 
     * NOTE: when this method gets called, all initalisation is done.
     * 
     * @return {Object}
     * @private
     */
    getFormItems: function() {
        
        return {
            xtype: 'tabpanel',
            activeTab: 0,
            border: false,
            items: [{
                title: this.app.i18n._('Defaults'),
                autoScroll: true,
                border: false,
                frame: true,
                xtype: 'columnform',
                formDefaults: {
                    anchor: '90%',
                    labelSeparator: '',
                    columnWidth: 1
                },
                items: this.getConfigItems()
            }]
        };
    },
    
    /**
     * get config items
     * - overwrite this in subclasses
     * 
     * @return {Array}
     */
    getConfigItems: function() {
        return [];
    }
});
