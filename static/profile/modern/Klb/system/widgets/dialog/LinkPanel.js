/*
 * Modern 3.0
 * 
 * @license     http://www.gnu.org/licenses/agpl.html AGPL Version 3
 * @author      Philipp Schüle <p.schuele@metaways.de>
 * @copyright   Copyright (c) 2009-2012 Metaways Infosystems GmbH (http://www.metaways.de)
 *
 */
 
Ext.ns('Klb.system.widgets', 'Klb.system.widgets.dialog');

/**
 * link display panel
 * 
 * @namespace   Klb.system.widgets.dialog
 * @class       Klb.system.widgets.dialog.LinkPanel
 * @extends     Ext.panel.Panel
 * 
 * @license     http://www.gnu.org/licenses/agpl.html AGPL Version 3
 * @author      Philipp Schuele <p.schuele@metaways.de>
 * @copyright   Copyright (c) 2009 Metaways Infosystems GmbH (http://www.metaways.de)
 * 
 * @param       {Object} config
 * @constructor
 * Create a new Klb.system.widgets.dialog.LinkPanel
 */
Ext.define('Klb.system.widgets.dialog.LinkPanel', {
    extend: 'Ext.panel.Panel',

    //private
    frame: true,
    border: true,
    autoScroll: true,
    
    relatedRecords: null,
    
    /**
     * @private
     */
    initComponent: function() {
        this.title = _('Links');
        
        this.store = new Klb.system.data.JsonStore({
            idProperty: 'id',
            model: 'Klb.system.Model.Relation',
            sortInfo: {
                field: 'related_model',
                direction: 'DESC'
            }
        });

        this.initLinksDataView();
        this.items = [this.linksDataView];
        Klb.system.widgets.dialog.MultipleEditDialogPlugin.prototype.registerSkipItem(this);
       
        Klb.system.widgets.dialog.LinkPanel.superclass.initComponent.call(this);
    },
    
    /**
     * add on click event after render
     * @private
     */
    afterRender: function() {
        Klb.system.widgets.dialog.LinkPanel.superclass.afterRender.apply(this, arguments);
        
        this.body.on('click', this.onClick, this);
    },
    
    /**
     * @param {Object} record
     */
    onRecordLoad: function(record) {
        this.record = record;
        
        if (record.get('relations')) {
            this.store.loadData(record.get('relations'), true);
        }
    },
    
    /**
     * init activities data view
     */
    initLinksDataView: function() {
        var linksTpl = new Ext.XTemplate(
            '<tpl for=".">',
               '<div class="x-widget-links-linkitem" id="{id}">',
                    '<div class="x-widget-links-linkitem-text">',
                        //' ext:qtip="{related_model}">',
                        '{[this.render(values.related_record, values.related_model, values.type, values.id)]}<br/>',
                    '</div>',
                '</div>',
            '</tpl>' ,{
                relatedRecords: this.relatedRecords,
                render: function(value, model, type, id) {
                    var result = '',
                        record = null;
                    if (this.relatedRecords[model]) {
                        Klb.Logger.debug('Klb.system.widgets.dialog.LinkPanel::initLinksDataView - showing link for ' + model);
                        record = new this.relatedRecords[model].recordClass(value);
                        result = record.modelName 
                            + ' ( <i>' + type + '</i> ): <a class="apibase-relation-link" href="#" id="' + id + ':' + model + '">' 
                            + Ext.util.Format.htmlEncode(record.getTitle()) + '</a>';
                    } else {
                        Klb.Logger.warn('Klb.system.widgets.dialog.LinkPanel::initLinksDataView - ' + model + ' does in exist in related records!');
                    }
                    return result;
                }
            }
        );
        
        this.linksDataView = new Ext.DataView({
            anchor: '100% 100%',
            tpl: linksTpl,       
            //id: 'grid_links_limited',
            store: this.store,
            overClass: 'x-view-over',
            itemSelector: 'activities-item-small' // don't forget that
        });
    },
    
    /**
     * on click for opening edit related object dlg
     * 
     * @param {} e
     * @private
     */
    onClick: function(e) {
        target = e.getTarget('a[class=apibase-relation-link]');
        if (target) {
            var idParts = target.id.split(':');
            var record = this.store.getById(idParts[0]).get('related_record');
            
            var popupWindow = this.relatedRecords[idParts[1]].dlgOpener({
                record: new this.relatedRecords[idParts[1]].recordClass(record)
            });
        }
    }
});
