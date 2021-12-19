
Ext.define('KlbDesktop.plugins.upload.AttachmentGrid', {
    extend: 'Klb.abstract.GridBase',
    alias: 'widget.AttachmentGrid',
    border: false,
    model: null,
    initComponent: function () {
      var me = this;
        if (me.model === null) {
//            alert("Error: Model can't be null!");
        }
        me.store = Ext.create("Ext.data.Store", {
            model: me.model,
            proxy: {
                type: 'memory',
                reader: {
                    type: 'json'
                }
            }
            
        });

        me.editing = Ext.create('Ext.grid.plugin.CellEditing', {
            clicksToEdit: 1
        });

        me.plugins =  [ me.editing ];
 
        me.deleteButton = Ext.create("Ext.button.Button", {
                text: 'Delete',
                disabled: true,
                itemId: 'delete',
                scope: me,
                icon: Klb.Common.RESOURCE_PATH + 'images/silkicons/delete.png',
                handler: this.onDeleteClick
        });

        me.viewButton = Ext.create("Ext.button.Button", {
            text:    "View",
            handler: this.onViewClick,
            scope:   me,
            icon:    Klb.Common.RESOURCE_PATH + 'images/silkicons/zoom.png',
            disabled: true
        });

        me.webcamButton = Ext.create("Ext.button.Button", {
            text: "Take image",
            handler: this.onWebcamClick,
            scope:   me,
            icon:    Klb.Common.RESOURCE_PATH + 'images/icons/fugue/webcam.png'
        });

        me.dockedItems = [{
            xtype: 'toolbar',
            items: [{
                text: 'Add',
                scope: me,
                icon: Klb.Common.RESOURCE_PATH + 'images/silkicons/attach.png',
                handler: me.onAddClick
            },
            me.webcamButton,
            me.viewButton,
            me.deleteButton
            ]
        }];

        me.columns = [
            {
                dataIndex: 'extension',
                width: 30,
                renderer: function (val) {
                    return '<img src="'+ Klb.Common.RESOURCE_PATH +'mimetypes/'+val+'.png"/>';
                }
            }, {
                header: "Filename",
                dataIndex: 'originalFilename',
                width: 200
            }, {
                header: "Size",
                dataIndex: 'size',
                width: 80,
                renderer: Klb.Functions.bytesToSize
            }, {     
                header: "Description",
                dataIndex: 'description',
                flex: 0.4,
                editor: {
                    xtype:'textfield',
                    allowBlank:true
                }
            }
        ];

        me.callParent();

        me.getSelectionModel().on('selectionchange', this.onSelectChange, this);
        me.on("itemdblclick", me.onDoubleClick, me);
    },

    onWebcamClick: function () {
        var me = this;
        var wp = Ext.create("KlbDesktop.plugins.webcam.WebcamPanel");
            wp.on("uploadComplete", me.onFileUploaded, me);

        var j = Ext.create("Klb.abstract.Window", {
            title: "Take Webcam Photo",
            items: [ wp ]
        });

        wp.on("uploadComplete", function () { j.close(); });
        j.show();
    },
    onDoubleClick: function (view, record) {
    var me = this; 
        if (record) {
            me.viewAttachment(record);
        }
    },
    onAddClick: function () {
        var me = this;
        var dialog = Ext.create('KlbDesktop.plugins.upload.Dialog', {
                             dialogTitle: 'Upload files',
                             uploadUrl: Klb.Common.getUrlParams('desktop', 'attach', {'option': 'file', 'action': 'upload'} )
                        });
//        var j = Ext.create("KlbDesktop.plugins.upload.Panel");
//        j.on("fileUploaded", me.onFileUploaded, me);
//        j.show();
       dialog.show();
    },
    onFileUploaded: function (response) {
       var me = this; 
        me.editing.cancelEdit();
        me.store.insert(me.store.getCount(), Ext.create(me.model, {
            id: "TMP:"+response.id,
            extension: response.extension,
            size: response.size,
            originalFilename: response.originalFilename
        }));
    },
    onDeleteClick: function () {
        var selection = this.getView().getSelectionModel().getSelection()[0];
        if (selection) {
            this.store.remove(selection);
        }
    },
    onSelectChange: function(selModel, selections){
        this.deleteButton.setDisabled(selections.length === 0);
        this.viewButton.setDisabled(selections.length === 0);
    },
    onViewClick: function () {
        var selection = this.getView().getSelectionModel().getSelection()[0];
        if (selection) {
            this.viewAttachment(selection);
        }
    },
    viewAttachment: function (record) {
        var mySrc = Klb.Common.getUrlParams('desktop', 'attach', {'option': 'file', 'action': 'view', 'type': this.model } );

        if (record.get("id") === 0) {
            mySrc += "id=0&tmpId=" + record.get("tmp_id");
        } else {
            mySrc += "id=" + record.get("id");
        }

        new Klb.abstract.Window({
            title : "Display File",
            width : 640,
            height: 600,
            maximizable: true,
            constrain: true,
            layout : 'fit',
            items : [{
                xtype : "component",
                autoEl : {
                    tag : "iframe",
                    src : mySrc
                }
            }]
        }).show();
    }
});