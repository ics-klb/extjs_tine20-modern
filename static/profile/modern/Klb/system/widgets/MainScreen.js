/*
 * Klb Desktop 3.0.1
 * 
 * @package     Modern
 * @subpackage  Content.Common
 * @copyright   Copyright (c) 2018 LLC ICS (http://www.icstime.com)
 * @license     http://www.gnu.org/licenses/agpl.html AGPL Version 3
 */

Ext.ns('Klb.system.widgets');
/**
 * @namespace   Klb.system.widgets
 * @class       Klb.system.widgets.MainScreen
 * @extends     Ext.util.Observable
 */
Ext.define('Klb.system.widgets.MainScreen', {
    extend: 'Ext.util.Observable',
    requires: [
          /* ux*/
          'Ext.ux.Portal'
        , 'Ext.ux.Percentage'
        , 'Ext.ux.form.ClearableComboBox'
        , 'Ext.ux.form.ClearableTextField'
        , 'Ext.ux.form.ColumnFormPanel'
        , 'Ext.ux.form.IconTextField'
        , 'Ext.ux.form.MirrorTextField'
        , 'Ext.ux.SearchField'
        , 'Ext.ux.Percentage'
        , 'Ext.ux.form.DateTimeField'
        , 'Ext.ux.grid.PagingToolbar'
        , 'Ext.ux.grid.GridViewMenuPlugin'
        , 'Ext.ux.grid.QuickaddGridPanel'
        , 'Ext.ux.ItemRegistry'
        , 'Ext.grid.plugin.CellEditing'
        , 'Ext.grid.column.Action'
        , 'Ext.grid.column.Date'
        , 'Ext.grid.feature.Grouping'
        , 'Ext.grid.plugin.DragDrop'
        /* container */
        , 'Klb.system.widgets.container.ContainerSelect'
        , 'Klb.system.widgets.container.TreePanel'
        , 'Klb.system.widgets.container.FilterModel'
        /* items */
        , 'Klb.system.widgets.persistentfilter.Model'
        , 'Klb.system.widgets.mainscreen.WestPanel'
          /* filters */
        , 'Klb.system.widgets.grid.FilterModel'
        , 'Klb.system.widgets.grid.FilterToolbar'
        , 'Klb.system.widgets.grid.FilterToolbarQuickFilterPlugin'
        , 'Klb.system.widgets.grid.FilterModel'
        , 'Klb.system.widgets.grid.FilterPlugin'
        , 'Klb.system.widgets.grid.ForeignRecordFilter'

        , 'Klb.system.widgets.relation.Manager'
        , 'Klb.system.widgets.relation.FilterModel'
        , 'Klb.system.widgets.relation.MenuItemManager'
          /* customfields */
        , 'Klb.system.widgets.customfields.ConfigManager'
        , 'Klb.system.widgets.customfields.CustomfieldSearchCombo'
        , 'Klb.system.widgets.customfields.CustomfieldsCombo'
        , 'Klb.system.widgets.customfields.Field'
        , 'Klb.system.widgets.customfields.FilterModel'
        , 'Klb.system.widgets.customfields.Renderer'
          /* keyfield */        
        , 'Klb.system.widgets.keyfield.Renderer'
        , 'Klb.system.widgets.keyfield.Store'
        , 'Klb.system.widgets.keyfield.ComboBox'
        , 'Klb.system.widgets.keyfield.Filter'
        , 'Klb.system.widgets.keyfield.Renderer'
        , 'Klb.system.widgets.keyfield.Store'
          /* form */
        , 'Klb.system.widgets.form.RecordPickerManager'
        , 'Klb.system.widgets.form.RecordPickerComboBox'
        , 'Klb.system.widgets.form.Wizard'
        /* dialog */
        , 'Klb.system.widgets.customfields.Field'
        , 'Klb.system.widgets.customfields.EditDialogPlugin'
        /* dialog */
        , 'Klb.system.widgets.dialog.AlarmPanel'
        , 'Klb.system.widgets.dialog.EditDialog'
        , 'Klb.system.widgets.dialog.MultipleEditDialogPlugin'
        , 'Klb.system.widgets.dialog.EditDialog'
        , 'Klb.system.widgets.dialog.AlarmPanel'
        /* tag */
        , 'Klb.system.widgets.tags.TagsPanel'
        , 'Klb.system.widgets.tags.TagsMassAttachAction'
        , 'Klb.system.widgets.tags.TagsMassDetachAction'
        /* persistentfilter */
        , 'Klb.system.widgets.persistentfilter.EditPersistentFilterPanel'
        , 'Klb.system.widgets.persistentfilter.Model'
        , 'Klb.system.widgets.persistentfilter.Store'
        , 'Klb.system.widgets.persistentfilter.PickerPanel'

        , 'Klb.system.widgets.ActivitiesPanel'
    ],
    constructor: function (config) {

        config = config || {};

        this.useModuleTreePanel = Ext.isArray(this.contentTypes) && this.contentTypes.length > 1;
        this.callParent([config]);
    },
    /**
     * @cfg {Klb.system.Application} app
     * instance of the app object (required)
     */
    app: null,

    /**
     * @cfg {String} activeContentType
     */
    activeContentType: null,

    /**
     * @cfg {Array} contentTypes
     */
    contentTypes: null,

    /**
     * @cfg {String} centerPanelClassName
     * name of centerpanel class name suffix in namespace of this app (defaults to GridPanel)
     * the class name will be expanded to Klb.App[this.appName][contentType + this.centerPanelClassNameSuffix]
     */
    centerPanelClassNameSuffix: 'CenterPanel',

    /**
     * @type {Bool} useModuleTreePanel
     * use modulePanel (defaults to null -> autodetection)
     */
    useModuleTreePanel: null,

    /**
     * returns active content type
     * 
     * @return {String}
     */
    getActiveContentType: function() {
        return (this.activeContentType) ? this.activeContentType : '';
    },

    /**
     * get center panel for given contentType
     * 
     * template method to be overridden by subclasses to modify default behaviour
     */
    getCenterPanel: function(contentType) {
        contentType = contentType || this.getActiveContentType();
        var appName = this.app.appName,
            panelClass = Klb.App[appName].getMVC('CenterPanel'),
            panelCenter = contentType + 'CenterPanel';

        if ( ! panelCenter )  return false;
        if ( ! this[panelCenter] ) {

            this[panelCenter] = Ext.create(panelClass, {
                 app: this.app,
                 plugins: [this.getWestPanel().getFilterPlugin(contentType)]
            });

             try {
            // move this blog up

            } catch (e) {
                Klb.Logger.err('Could not create centerPanel "KlbDesktop.Apps.' + appName + '::' + panelClass + '"');
                Klb.Logger.err(e.stack ? e.stack : e);
                this[panelCenter] = Ext.create('Ext.panel.Panel', {html: 'ERROR'});
            }
        }
        return this[panelCenter];
    },
    
    /**
     * convinience fn to get container tree panel from westpanel
     * 
     * @return {Klb.system.widgets.container.containerTreePanel}
     */
    getContainerTreePanel: function() {
        return this.getWestPanel().getContainerTreePanel();
    },

    /**
     * get north panel for given contentType
     * 
     * template method to be overridden by subclasses to modify default behaviour
     */
    getNorthPanel: function(contentType) {
        contentType = contentType || this.getActiveContentType();
        var appName = this.app.appName,
            panelClass = Klb.App[appName].getMVC('CenterPanel'),
            panelCenter = contentType + 'CenterPanel';

        if (! this[contentType + 'ActionToolbar']) {
            
            this[contentType + 'ActionToolbar'] = this[panelCenter].getActionToolbar();

            try {

            } catch (e) {
                Klb.Logger.err('Could not create northPanel');
                Klb.Logger.err(e.stack ? e.stack : e);
                this[contentType + 'ActionToolbar'] = new Ext.panel.Panel({html: 'ERROR'});
            }
        }
        return this[contentType + 'ActionToolbar'];
    },
     /**
     * get west panel for given contentType
     */
    getWestPanel: function() {
        var contentType = this.getActiveContentType(),
            appName = this.app.appName,
            panelClass = Klb.App[appName].getMVC('WestPanel'),
            wpName = contentType + 'WestPanel';

        if (! this[wpName]) {
            var wpconfig = {
                    app: this.app, 
                    contentTypes: this.contentTypes,
                    contentType: contentType,
                    listeners: {
                        scope: this,
                        selectionchange: function() {
                            var cp = this.getCenterPanel();
                            if(cp) {
                                try {
                                    var grid = cp.getGrid();
                                    if(grid) {
                                        var sm = grid.getSelectionModel();
                                        if(sm) {
                                            sm.clearSelections();
                                            cp.actionUpdater.updateActions(sm.getSelectionsCollection());
                                        }
                                    }
                                } catch (e) {
                                    // do nothing - no grid
                                }
                            }
                        }
                    }
                };


                if( panelClass && Ext.isDefined(panelClass)  ) this[wpName] = Ext.create(panelClass, wpconfig);
                  else  this[wpName] = Ext.create('Klb.system.widgets.mainscreen.WestPanel', wpconfig );
            try {

            } catch (e) {
                Klb.Logger.err('Could not create westPanel');
                Klb.Logger.err(e.stack ? e.stack : e);
                this[wpName] = Ext.create('Ext.panel.Panel', {html: 'ERROR'});
            }
        }
        return this[wpName];
    },    
   /**
     * get module tree panel
     */
    getModuleTreePanel: function() {

        if (! this.moduleTreePanel) {
            if (this.useModuleTreePanel) {
                this.moduleTreePanel = new Klb.system.widgets.ContentTypeTreePanel({
                    title: _('Modules'),
                    app: this.app, 
                    contentTypes: this.contentTypes,
                    contentType: this.getActiveContentType()
                });
                this.moduleTreePanel.on('click', function (node, event) {
                    if(node != this.lastClickedNode) {
                        this.lastClickedNode = node;
                        this.fireEvent('selectionchange');
                    }
                });
            } else {
                this.moduleTreePanel = Ext.create('Ext.panel.Panel', {html:'', frame: false});
            } 
        }
        return this.moduleTreePanel;
    },
    /**
     * shows/activates this app mainscreen
     */
    show: function() {
        if(this.fireEvent("beforeshow", this) !== false){
              this.showWestPanel();
              this.showCenterPanel();
              this.showNorthPanel();
              this.showModuleTreePanel();
            this.fireEvent('show', this);
        }
        return this;
    },
    /**
     * shows center panel in mainscreen
     */
    showCenterPanel: function() {

        Klb.system.appMainScreen.setActiveContentPanel(this.getCenterPanel( this.getActiveContentType() ), true);
    },
    /**
     * shows module tree panel in mainscreen
     */
    showModuleTreePanel: function() {
 
        Klb.system.appMainScreen.setActiveModulePanel(this.getModuleTreePanel(), true);
    },
    /**
     * shows west panel in mainscreen
     */
    showWestPanel: function() {
        // add save favorites button to toolbar if favoritesPanel exists
        // @TODO refactor me!
        var westPanel = this.getWestPanel(),
            favoritesPanel = Ext.isFunction(westPanel.getFavoritesPanel) ? westPanel.getFavoritesPanel() : null,
            westPanelToolbar = westPanel.getTopToolbar();

        westPanelToolbar.removeAll();
        if (favoritesPanel) {
            westPanelToolbar.add({
                xtype: 'button',
                text: _('Save current view as favorite'),
                iconCls: 'action_saveFilter',
                scope: this,
                handler: function() {
                    favoritesPanel.saveFilter.call(favoritesPanel);
                }
            });

            westPanelToolbar.show();
        } else {
            westPanelToolbar.hide();
        }

        westPanelToolbar.doLayout();
        Klb.system.appMainScreen.setActiveTreePanel(this.getWestPanel(), true);
    },

    /**
     * shows north panel in mainscreen
     */
    showNorthPanel: function() {

        Klb.system.appMainScreen.setActiveToolbar(this.getNorthPanel(this.getActiveContentType()), true);
    }
});
