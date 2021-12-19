/*
 * Modern 3.1.0
 * 
 * @license     http://www.gnu.org/licenses/agpl.html AGPL Version 3
 * @author      Philipp Schuele <p.schuele@metaways.de>
 * @copyright   Copyright (c) 2007-2010 Metaways Infosystems GmbH (http://www.metaways.de)
 *
 */
Ext.ns('Klb.system.widgets.grid');

/**
 * @namespace   Klb.system.widgets.grid
 * @class       Klb.system.widgets.grid.ExportButton
 * @extends     Ext.button.Button
 * <p>export button</p>
 * @constructor
 */
Ext.define('Klb.system.widgets.grid.ExportButton', {
    extend: 'Ext.Action',
    constructor: function (config) {
        config = config || {};
        Ext.apply(this, config);
        config.handler = this.doExport.bind(this);
        
        Klb.system.widgets.grid.ExportButton.superclass.constructor.call(this, config);
    },
    /**
     * @cfg {String} icon class
     */
    iconCls: 'action_export',
    /**
     * @cfg {String} format of export (default: csv)
     */
    format: 'csv',
    /**
     * @cfg {String} export function (for example: Timetracker.exportTimesheets)
     */
    exportFunction: null,
    /**
     * @cfg {Klb.system.widgets.grid.FilterSelectionModel} sm
     */
    sm: null,
    /**
     * @cfg {Klb.system.widgets.grid.GridPanel} gridPanel
     * use this alternativly to sm
     */
    gridPanel: null,
    /**
     * @cfg {Boolean} showExportDialog
     */
    showExportDialog: false,
    
    /**
     * do export
     */
    doExport: function() {
        // get selection model
        if (!this.selModel) {
            this.selModel = this.gridPanel.grid.getSelectionModel();
        }
        
        // return if no rows are selected
        if (this.selModel.getCount() === 0) {
            return false;
        }
        
        var filterSettings = this.selModel.getSelectionFilter();
        
        if (this.showExportDialog) {
            var gridRecordClass = this.gridPanel.recordClass,
                model = gridRecordClass.getMeta('appName') + '_Model_' + gridRecordClass.getMeta('modelName');
                
            Klb.system.widgets.dialog.ExportDialog.openWindow({
                appName: this.gridPanel.app.appName,
                record: new Klb.system.Model.ExportJob({
                    filter: filterSettings,
                    format: this.format,
                    exportFunction: this.exportFunction,
                    count: this.selModel.getCount(),
                    recordsName: this.gridPanel.i18nRecordsName,
                    model: model
                })
            });
        } else {
            this.startDownload(filterSettings);
        }
    },
    
    /**
     * start download
     * 
     * @param {Object} filterSettings
     */
    startDownload: function(filterSettings) {
        var downloader = new Ext.ux.file.Download({
            params: {
                method: this.exportFunction,
                requestType: 'HTTP',
                filter: Ext.util.JSON.encode(filterSettings),
                options: Ext.util.JSON.encode({
                    format: this.format
                })
            }
        }).start();
    }
});

