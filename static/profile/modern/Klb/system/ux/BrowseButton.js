/*
 * Modern 3.1.0
 * 
 * @license     http://www.gnu.org/licenses/agpl.html AGPL Version 3
 * @author      Cornelius Weiss <c.weiss@metaways.de>
 * @copyright   Copyright (c) 2009 Metaways Infosystems GmbH (http://www.metaways.de)
 *
 */
Ext.ns('Ext.ux.form');

/**
 * @namespace   Ext.ux.form
 * @class       Ext.ux.form.BrowseButton
 * @extends     Ext.button.Button
 */

Ext.define('Ext.ux.BrowseButtonSplit', {
    extend: 'Ext.button.Split',
    xtype: 'browsebuttonsplit',
    initComponent: function() {
        this.plugins = this.plugins || [];
        this.plugins.push( new Ext.ux.file.BrowsePlugin({}));
        
        this.callParent();
    }
});

Ext.define('Ext.ux.BrowseButton', {
    extend: 'Ext.button.Button',
    xtype: 'browsebutton',
    iconCls: 'x-fa fa-camera',
//    icon: Klb.Common.RESOURCE_PATH + 'images/icons/fugue/webcam.png',
    initComponent: function() {
        var me = this;
        
            me.scope = this;
            me.handler = me.onFileSelect;

            me.plugins = me.plugins || [];
            me.plugins.push( new Ext.ux.file.BrowsePlugin({}));
           
        me.callParent(this);
    },
    /**
     * @private
     */
    onFileSelect: function (fileSelector) {
 
        var files = fileSelector.getFileList();
        this.uploader = new Ext.ux.file.Upload({
            file: files[0],
            fileSelector: fileSelector
        });
        
        this.uploader.on('uploadstart', Klb.system.uploadManager.onUploadStart, this);
        this.uploader.on('uploadcomplete', this.onUploadComplete, this);
        this.uploader.on('uploadfailure', this.onUploadFail, this);
        this.uploader.on('update',        this.onUploadProgress, this);
        
        var uploadKey  =  Klb.system.uploadManager.queueUpload(this.uploader);
        var fileRecord =  Klb.system.uploadManager.upload(uploadKey);
    },

    onUploadProgress: function(action, event, fileRecord) {

      var data = fileRecord.data;
          this.setText( data.progress + '%');

    },

    onUploadComplete: function(upload, fileRecord) {
 
         var record = this.getWidgetRecord ? this.getWidgetRecord() : null;

         this.ui = 'soft-red';
         this.fireEvent('uploadcomplete',  this, fileRecord, record);
 
         if ( this.uploader ) {
             this.uploader.un('uploadcomplete', this.onUploadComplete, this);
             this.uploader.un('uploadfailure', this.onUploadFail, this);
             this.uploader.un('update', this.onUploadFail, this);

             fileRecord.data.progress = 100;
             this.onUploadProgress('complete', this, fileRecord);
             delete this.uploader;
          }
         
    },
    /**
     * @private
     */
    onUploadFail: function () {
       
        Ext.MessageBox.alert(_('Upload Failed'), _('Could not upload image. Please notify your Administrator')).setIcon(Ext.MessageBox.ERROR);
          if ( this.uploader ) {  
            this.uploader.un('uploadcomplete', this.onUploadComplete, this);
            this.uploader.un('uploadfailure', this.onUploadFail, this);
            delete this.uploader;
          }
        
        
    }
});
