/*
 * Modern 3.1.0
 * 
 * @package     form
 * @license     http://www.gnu.org/licenses/agpl.html AGPL Version 3
 * @author      Philipp Schüle <p.schuele@metaways.de>
 * @copyright   Copyright (c) 2009-2011 Metaways Infosystems GmbH (http://www.metaways.de)
 *
 */
 
Ext.ns('Klb.system.widgets.form');
 
/**
 * Configuration Panel
 * 
 * @namespace   Klb.system.widgets.form
 * @class       Klb.system.widgets.form.ConfigPanel
 * @extends     Ext.form.Panel
 * 
 * <p>Configuration Panel</p>
 * <p><pre>
 * NOTE: 
 * - For each section in the config file, a group in the form is added.
 * - Form names are constructed <section>_<subsection>... and transformed transparently by this component
 * - Enabling and Disabling of sections is handled automatically if you give the id 'setup-<section>-group' 
 *   to the checkboxToggle enabled fieldset
 *   
 * TODO         make TABS work
 * TODO         add reload button
 * </pre></p>
 * 
 * @license     http://www.gnu.org/licenses/agpl.html AGPL Version 3
 * @author      Philipp Schuele <p.schuele@metaways.de>
 * @copyright   Copyright (c) 2009 Metaways Infosystems GmbH (http://www.metaways.de)
 * 
 * @param       {Object} config
 * @constructor
 * Create a new Klb.system.widgets.form.ConfigPanel
 */

Ext.define('Klb.system.widgets.form.ConfigPanel', {
    extend: 'Ext.form.Panel',
    /**
     * @cfg {String} saveMethod 
     * save method (for example 'Setup.saveConfig')
     */
    saveMethod: '',
    
    /**
     * @cfg {String} registryKey 
     * registry key (for example 'configData')
     */
    registryKey: '',
    
    /**
     * @cfg {Array} actionToolbarItems
     * additional items for actionToolbar
     */
    actionToolbarItems: [],

    /**
     * form panel cfg
     * 
     * @private
     */
    border: false,
    bodyStyle:'padding:5px 5px 0',
    labelAlign: 'left',
    labelSeparator: ':',
    labelWidth: 150,
    autoScroll: true,
    
    /**
     * application object
     * 
     * @property app
     * @type Klb.system.Application
     */
    app: null,

    /**
     * save config and update setup registry
     */
    onSaveConfig: function() {
        if (this.isValid()) {
            var configData = this.form2config();
            
            this.loadMask.show();
            Klb.system.Ajax.request({
                scope: this,
                params: {
                    method: this.saveMethod,
                    data: configData
                },
                success: function(response) {
                    var regData = Ext.util.JSON.decode(response.responseText);
                    // replace some registry data
                    for (key in regData) {
                        if (key != 'status') {
                            Klb.Setup.registry.replace(key, regData[key]);
                        }
                    }
                    this.loadMask.hide();
                },
                failure: function(response, options) {
                    this.loadMask.hide();
                    var responseText = Ext.util.JSON.decode(response.responseText),
                        exception = responseText.data ? responseText.data : responseText;
                        
                    switch (exception.code) {
                        // Service Unavailable! / configuration problem
                        case 503:
                            Ext.MessageBox.show({
                                title: _('Configuration Problem'), 
                                msg: exception.message,
                                buttons: Ext.Msg.OK,
                                icon: Ext.MessageBox.WARNING,
                                fn: function() {
                                    // TODO only reload own config data
                                    window.location.reload();
                                }
                            });
                            break;
                        default:
                            Klb.system.ExceptionHandler.handleRequestException(exception);
                    }
                }
            });
        } else {
            this.alertInvalidData();
        }
    },
    
    alertInvalidData: function() {
        Ext.Msg.alert(this.app.i18n._('Invalid configuration'), this.app.i18n._('You need to correct the red marked fields before config could be saved'));
    },
    
    /**
     * @private
     */
    initComponent: function() {
        this.initActions();
        this.items = this.getFormItems();

        Klb.system.widgets.form.ConfigPanel.superclass.initComponent.call(this);
    },
    
    /**
     * @private
     */
    onRender: function(ct, position) {
        Klb.system.widgets.form.ConfigPanel.superclass.onRender.call(this, ct, position);
        
        // always the same shit! when form panel is rendered, the form fields are not yet rendered ;-(
        var formData = this.config2form.defer(250, this, [Klb.Setup.registry.get(this.registryKey)]);
        
        Klb.Setup.registry.on('replace', this.applyRegistryState, this);
        
        this.loadMask = new Ext.LoadMask(ct, {msg: this.app.i18n._('Transferring Configuration...')});
    },
    
    /**
     * applies registry state to this cmp
     */
    applyRegistryState: function() {
    
    },

    /**
     * returns config form (extending classes need to overwrite this)
     * 
     * @private
     * @return {Array} items
     */
    getFormItems: function() {
        return [];
    },
    
    /**
     * transforms form data into a config object
     * 
     * @return {Object} configData
     */
    form2config: function() {
        // getValues only returns RAW HTML content... and we don't want to 
        // define a record here
        var formData = {};
        this.getForm().items.each(function(field) {
            formData[field.name] = field.getValue();
        });
        
        var configData = {};
        var keyParts, keyPart, keyGroup, dataPath;
        for (key in formData) {
            keyParts = key.split('_');
            dataPath = configData;
            
            while (keyPart = keyParts.shift()) {
                if (keyParts.length == 0) {
                    dataPath[keyPart] = formData[key];
                } else {
                    if (!dataPath[keyPart]) {
                        dataPath[keyPart] = {};
                        
                        // is group active?
                        keyGroup = Ext.getCmp('setup-' + keyPart + '-group');
                        if (keyGroup && keyGroup.checkboxToggle) {
                            dataPath[keyPart].active = !keyGroup.collapsed;
                        }
                    }
                
                    dataPath = dataPath[keyPart];
                }
            }
        }
        return configData;
    },
    
    /**
     * loads form with config data
     * 
     * @param  {Object} configData
     */
    config2form: function(configData) {
        var formData = arguments[1] ? arguments[1] : {};
        var currKey  = arguments[2] ? arguments[2] : '';
        
        var keyGroup;
        for (key in configData) {
            if(typeof configData[key] == 'object') {
                this.config2form(configData[key], formData, currKey ? currKey + '_' + key : key);
            } else {
                formData[currKey + '_' + key] = configData[key];
                
                // activate group?
                keyGroup = Ext.getCmp('setup-' + currKey + '-group');
                if (keyGroup && key == 'active' && configData.active) {
                    keyGroup.expand();
                }
            }
        }
        
        // skip transform calls
        if (! currKey) {
            this.getForm().setValues(formData);
            this.applyRegistryState();
        }
    },
    
    /**
     * @private
     */
    initActions: function() {
        this.action_saveConfig = new Ext.Action({
            text: this.app.i18n._('Save config'),
            iconCls: 'setup_action_save_config',
            scope: this,
            handler: this.onSaveConfig,
            disabled: true
        });
        
        // TODO add this to reload registry and update form / button
        /*
        this.action_reloadConfig = new Ext.Action({
            text: this.app.i18n._('Reload config'),
            handler: function() {
                Klb.Setup.registry.get(this.registryKey).on('replace', this.config2form, this, [Klb.Setup.registry.get(this.registryKey)]);
                s.initRegistry();
            },
            iconCls: 'x-tbar-loading',
            scope: this
        });
        */

        this.actions = [
            this.action_saveConfig
            //this.action_reloadConfig
        ];
        
        this.actionToolbar = new Ext.Toolbar({
            items: this.actions.concat(this.actionToolbarItems)
        });
    },
    
    /**
     * checks if form is valid
     * 
     * @return {Boolean}
     */
    isValid: function() {
        var form = this.getForm();
        return form.isValid();
    },
    
    /**
     * change card layout card according to combo value
     * 
     * @param {Ext.form.field.ComboBox} combo
     * @param {String} backendIdPrefix
     */
    changeCard: function(combo, backendIdPrefix) {
        var value = combo.getValue();
        Klb.Logger.debug('changeCard() -> value: ' + value);
        
        var cardPanel = Ext.getCmp(backendIdPrefix + 'CardLayout'),
            cardLayout = (cardPanel) ? cardPanel.getLayout() : null;
        
        if (cardLayout && cardLayout !== 'card') {
            Klb.Logger.debug('changeCard() -> set active item: ' + backendIdPrefix + value);
            cardLayout.setActiveItem(backendIdPrefix + value);
        }
    }
});
