/*
 * Modern 3.0
 * 
 * @package     Ext
 * @subpackage  ux
 * @license     http://www.gnu.org/licenses/agpl.html AGPL Version 3
 * @author      Cornelius Weiss <c.weiss@metaways.de>
 * @copyright   Copyright (c) 2007-2011 Metaways Infosystems GmbH (http://www.metaways.de)
 *
 */

/**
 * increase depth of cell selector depth for event delegation (defaults to 4) 
 */
//if (Ext.grid.View.prototype.cellSelectorDepth < 6) {
//    Ext.grid.View.prototype.cellSelectorDepth = 6;
//}

Ext.ns('Ext.ux', 'Ext.ux.Percentage');

/**
 * Percentage select combo box
 * 
 * @namespace   Ext.ux
 * @class       Ext.ux.PercentCombo
 * @extends     Ext.form.field.ComboBox
 */
 Ext.define('Ext.ux.PercentCombo', {
    extend: 'Ext.form.field.ComboBox', 
    xtype: 'extuxpercentcombo',
    /**
     * @cfg {bool} autoExpand Autoexpand comboBox on focus.
     */
    autoExpand: false,
    /**
     * @cfg {bool} blurOnSelect blurs combobox when item gets selected
     */
    blurOnSelect: false,
    
    displayField: 'value',
    valueField: 'key',
    mode: 'local',
    triggerAction: 'all',
    emptyText: 'percent ...',
    lazyInit: false,
    forceSelection: true,
    
    //private
    initComponent: function(){

        this.store = Ext.create('Ext.data.ArrayStore', {
            fields: ['key','value'],
            data: [
                ['0',    '0%'],
                ['10',  '10%'],
                ['20',  '20%'],
                ['30',  '30%'],
                ['40',  '40%'],
                ['50',  '50%'],
                ['60',  '60%'],
                ['70',  '70%'],
                ['80',  '80%'],
                ['90',  '90%'],
                ['100','100%']
            ]
        });

        this.callParent();
        // allways set a default
        if(!this.value) {
            this.value = 0;
        }

        if (this.autoExpand) {
            this.lazyInit = false;
            this.on('focus', function(){
                this.selectByValue(this.getValue());
                this.onTriggerClick();
            });
        }
        
        if (this.blurOnSelect){
            this.on('select', function(){
                this.fireEvent('blur', this);
            }, this);
        }
    },
    
    setValue: function(value) {
        value = value ? value : 0;
        Ext.ux.PercentCombo.superclass.setValue.call(this, value);
    }
});
//Ext.reg('extuxpercentcombo', Ext.ux.PercentCombo);

/**
 * Renders a percentage value to a percentage bar
 * @constructor
 */
Ext.ux.PercentRenderer = function(percent) {
    if (! Ext.ux.PercentRenderer.template) {
        Ext.ux.PercentRenderer.template = new Ext.XTemplate(
            '<div>{percent}%</div>'
        );
    }
    // this will enable a color scheme for each percentage on the progress bar
    var colorClass = "PercentRenderer-progress-bar"; 
    colorClass += Math.round(percent/10)+"0";

    return Ext.ux.PercentRenderer.template.apply({percent: percent, colorclass: colorClass});
};

/**
 * Renders a percentage value to a percentage bar / uploadrow
 * @constructor
 */
Ext.ux.PercentRendererWithName = function(value, metadata, record) {
  
    var metaStyle = '';
    
    if(record.fileRecord) {
        record = record.fileRecord;
    }
    
    if(record.get('type') == 'folder') {
        metadata.css = 'x-apibase-typefolder';
    }
    else {

        var contenttype =  record.get('contenttype');
        if(contenttype) {
            var iconClass = contenttype.replace("/", "-");
            metadata.css = iconClass + '_16x16 ';
        }
               
        metadata.css += 'standardFileClass_16x16';
    }
    
    
    if (!Klb.system.uploadManager.isHtml5ChunkedUpload()) {

        var fileName = value;
        if (typeof value == 'object') {
            fileName = value.name;
        } 
    
        if(record.get('status') == 'uploading') {
            metadata.css = 'x-apibase-uploadrow';
        }
        
        return fileName;
    }

    if (! Ext.ux.PercentRendererWithName.template) {
        Ext.ux.PercentRendererWithName.template = new Ext.XTemplate(
            '<div class="x-progress-wrap PercentRenderer" style="{display}">',
            '<div class="x-progress-inner PercentRenderer">',
                '<div class="x-progress-bar PercentRenderer" style="width:{percent}%;{additionalStyle}">',
                    '<div class="PercentRendererText PercentRenderer">',
                         '{fileName}',
                    '</div>',
                '</div>',
                '<div class="x-progress-text x-progress-text-back PercentRenderer">',
                    '<div>&#160;</div>',
                '</div>',
            '</div>',
        '</div>'
        ).compile();
    }
    
    if(value == undefined) {
        return '';
    }
    
    var fileName = value;

    if (typeof value == 'object') {
        fileName = value.name;
    }
    
    var percent = record.get('progress');

    var additionalStyle = '';
    if(record.get('status') == 'paused' && percent < 100) {
        fileName = _('(paused)') + '&#160;&#160;' + fileName;
        additionalStyle = 'background-image: url(\'styles/images/tine20/progress/progress-bg-y.gif\') !important;';
    }
       
    var display = 'width:0px';
    if(percent > -1 && percent < 100) {
        display = '';
        var renderedField = Ext.ux.PercentRendererWithName.template.apply({percent: percent, display: display, fileName: fileName
            , additionalStyle: additionalStyle}) ;
        return renderedField;
    }
    else {
        return fileName;
    }
    

};
