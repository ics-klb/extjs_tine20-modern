
Ext.ns('Ext.ux.file');

/**
 * a simple file upload manager
 * collects all uploads
 * 
 * @namespace   Ext.ux.file
 * @class       Ext.ux.file.UploadManager
 */
Ext.define('Ext.ux.file.UploadManager', {
    extend: 'Object',
    mixins : {
        observable : 'Ext.util.Observable'
    },
    
    constructor: function(config) {
        config = config || {};
        config.events = [
             'uploadcomplete',
             'uploadfailure',
             'uploadprogress',
             'uploadstart',
             'update'
        ];

        this.mixins.observable.constructor.call(this);
        Ext.apply(this, config);

        this.uploads = {};
    },
    /**
     * @cfg {Int} number of allowed concurrent uploads
     */
    maxConcurrentUploads: 3,

    /**
     * current running uploads
     */
    runningUploads: 0,

    /**
     * @cfg (String) upload id prefix
     */
    uploadIdPrefix: "tine-upload-",

    /**
     * holds the uploads
     */
    uploads: null,

    /**
     * counts session uploads
     */
    uploadCount: 0,

    /**
     * every upload in the upload manager gets queued initially
     * 
     * @param upload {Ext.ux.file.Upload} Upload object
     * @returns {String} upload id
     */
    queueUpload: function(upload) {
        var uploadId = this.uploadIdPrefix + (1000 + this.uploadCount++).toString();
        if(upload.id && upload.id !== -1) {
            uploadId = upload.id;
        }
        upload.id = uploadId;

        this.uploads[uploadId] = upload;
        this.relayEvents(upload, ['update']);

        upload.on('uploadcomplete', this.onUploadComplete, this);

        return uploadId;
    },

    /**
     * starts the upload
     * 
     * @param id {String} upload id
     * @returns {Ext.ux.file.Upload.file} upload file record
     */
    upload: function(id) {
        return this.uploads[id].upload();
    },

    /**
     * returns upload by id
     * 
     * @param id {String} upload id
     * @returns (Ext.ux.file.Upload} Upload object
     */
    getUpload: function(id) {
        return this.uploads[id];
    },

    /**
     * remove upload from the upload manager
     * 
     * @param {String} upload id
     */
    unregisterUpload: function(id) {
        delete this.uploads[id];
    },


    /**
     * indicates whether the HTML5 chunked upload is available
     * 
     * @returns {Boolean}
     */
    isHtml5ChunkedUpload: function() {

        if(window.File == undefined) return false;
        if(this.isHostMethod(File.prototype, 'slice')
            || this.isHostMethod(File.prototype, 'mozSlice')
            || this.isHostMethod(File.prototype, 'webkitSlice')) {
          return true;
        }
        else {
          return false;
        }

    },

    /**
     * checks for the existance of a method of an object
     * 
     * @param object    {Object}
     * @param property  {String} method name 
     * @returns {Boolean}
     */
    isHostMethod: function (object, property) {
        var t = typeof object[property];
        return t == 'function' || (!!(t == 'object' && object[property])) || t == 'unknown';
    },

    /**
     * are there as much as allowed uploads in progress
     * 
     * @returns {Boolean}
     */
    isBusy: function() {
        return (this.maxConcurrentUploads == this.runningUploads);
    },

    /**
     * are there uploads in progress or queued
     */
    isUploadsPending: function (){
        return (this.uploads.length > 0);
    },

    /**
     * on upload complete handler
     */
    onUploadComplete: function() {

        Klb.system.uploadManager.runningUploads 
            = Math.max(0, Klb.system.uploadManager.runningUploads - 1);

        for(var uploadKey in Klb.system.uploadManager.uploads){

            var upload = Klb.system.uploadManager.uploads[uploadKey];
            if(upload.isQueued() && !upload.isPaused() && !Klb.system.uploadManager.isBusy()) {
                upload.setQueued(false);
                upload.resumeUpload();

                break;
            }
       }

    }, 

    /**
     * on upload start handler
     */
    onUploadStart: function() {
        Klb.system.uploadManager.runningUploads 
            = Math.min(Klb.system.uploadManager.maxConcurrentUploads, Klb.system.uploadManager.runningUploads + 1);
    }
    
});
