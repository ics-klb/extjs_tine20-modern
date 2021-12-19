/*
 * Modern 3.0
 * 
 * @license     http://www.gnu.org/licenses/agpl.html AGPL Version 3
 * @author      Philipp Schüle <p.schuele@metaways.de>
 * @copyright   Copyright (c) 2009-2011 Metaways Infosystems GmbH (http://www.metaways.de)
 */
Ext.ns('Klb.system.widgets', 'Klb.system.widgets.container');

/**
 * Container Properties dialog
 * 
 * @namespace   Klb.system.widgets.container
 * @class       Klb.system.widgets.container.PropertiesDialog
 * @extends     Klb.system.widgets.dialog.EditDialog
 * @author      Philipp Schüle <p.schuele@metaways.de>
 * @copyright   Copyright (c) 2009-2011 Metaways Infosystems GmbH (http://www.metaways.de)
 * @constructor
 * @param {Object} config The configuration options.
 */
 Ext.define('Klb.system.widgets.container.PropertiesDialog', {
    extend: 'Klb.system.widgets.dialog.EditDialog',
    /**
     * @cfg {Klb.system.Container.models.container}
     * Container to manage grants for
     */
    grantContainer: null,
    
    /**
     * @cfg {string}
     * Name of container folders, e.g. Addressbook
     */
    containerName: null,
    
    /**
     * @private
     */
    windowNamePrefix: 'ContainerPropertiesWindow_',
    loadRecord: false,
    tbarItems: [],
    evalGrants: false,
    
    /**
     * @private
     */
    initComponent: function() {
        
        // my grants
        this.myGrants = [];
        for (var grant in this.grantContainer.account_grants) {
            if (this.grantContainer.account_grants.hasOwnProperty(grant) && this.grantContainer.account_grants[grant] && Klb.system.widgets.container.GrantsGrid.prototype[grant + 'Title']) {
                this.myGrants.push({
                    title: _(Klb.system.widgets.container.GrantsGrid.prototype[grant + 'Title']),
                    description: _(Klb.system.widgets.container.GrantsGrid.prototype[grant + 'Description'])
                })
            }
        }
        
        this.myGrantsTemplate = new Ext.XTemplate(
            '<tpl for=".">',
                '<span class="tine-wordbox" ext:qtip="','{[this.encode(values.description)]}','">','{[this.encode(values.title)]}','</span>',
            '</tpl>',
            {
                encode: function(description) { return Klb.system.Common.doubleEncode(description); }
            }
        ).compile();
        
        this.callParent();
    },
    
    /**
     * init record to edit
     * 
     * - overwritten: we don't have a record here 
     */
    initRecord: function() {
    },
    
    /**
     * returns dialog
     */
    getFormItems: function() {
        return {
            xtype: 'tabpanel',
            border: false,
            plain:true,
            activeTab: 0,
            border: false,
            items:[{
                title: _('Properties'),
                border: false,
                frame: true,
                layout: 'form',
                labelAlign: 'top',
                labelSeparator: '',
                layoutConfig: {
                    trackLabels: true
                },
                plugins: [{
                     ptype: 'ux.itemregistry',
                     key:   'Klb.system.widgets.container.PropertiesDialog.FormItems.Properties'
                }],
                items: [{
                    xtype: 'textfield',
                    anchor: '100%',
                    readOnly: true,
                    fieldLabel: _('Name'),
                    value: this.grantContainer.name
                }, {
                    xtype: 'colorfield',
                    width: 40,
                    readOnly: true,
                    fieldLabel: _('Color'),
                    value: this.grantContainer.color
                }, {
                    xtype: 'label',
                    anchor: '100%',
                    readOnly: true,
                    fieldLabel: _('My Grants'),
                    html: this.myGrantsTemplate.applyTemplate(this.myGrants)
                }]
            }]
        };
    },
    
    /**
     * @private
     */
    onApplyChanges: function() {
        this.clearListeners();
        this.window.close();
    }
}, function() {

     /**
      * grants dialog popup / window
      */
     Klb.system.widgets.container.PropertiesDialog.openWindow = function (config) {
         var window = Klb.system.WindowFactory.getWindow({
             width: 700,
             height: 450,
             name: Klb.system.widgets.container.PropertiesDialog.prototype.windowNamePrefix + Ext.id(),
             contentPanelConstructor: 'Klb.system.widgets.container.PropertiesDialog',
             contentPanelConstructorConfig: config,
             modal: true
         });
         return window;
     };
 });

