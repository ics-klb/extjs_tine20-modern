/*
 * Modern 3.1.0
 * 
 * @license     http://www.gnu.org/licenses/agpl.html AGPL Version 3
 * @author      Philipp Schuele <p.schuele@metaways.de>
 * @copyright   Copyright (c) 2007-2009 Metaways Infosystems GmbH (http://www.metaways.de)
 * 
 * TODO         add to extdoc
 */

/*global Ext, Modern, Locale*/

Ext.ns('Klb.system.widgets', 'Klb.system.widgets.activities', 'Klb.system.widgets.ActivitiesPanel');

/************************* panel *********************************/

/**
 * Class for a single activities panel
 * 
 * @namespace   Klb.system.widgets.activities
 * @class       Klb.system.widgets.activities.ActivitiesPanel
 * @extends     Ext.panel.Panel
 */
Ext.define('Klb.system.widgets.activities.FilemanagerPanel', {
    extend:  'Ext.panel.Panel',

    xtype: 'apibaseactivitiespanel',
    /**
     * @cfg {String} app Application which uses this panel
     */
    app: '',
    
    /**
     * @cfg {Boolean}
     */
    showAddNoteForm: true,
    
    /**
     * @cfg {Array} notes Initial notes
     */
    notes: [],
    /**
     * the translation object
     */
    translation: null,
    /**
     * @var {Klb.system.data.JsonStore}
     * Holds activities of the record this panel is displayed for
     */
    recordNotesStore: null,
    
    title: null,
    iconCls: 'filemgrs_filemgrIcon',
    layout: 'hfit',
    bodyStyle: 'padding: 2px 2px 2px 2px',
    autoScroll: true,
            
});

Ext.define('Klb.system.widgets.activities.ActivitiesPanel', {
    extend: "Ext.panel.Panel",
    /**
     * @cfg {String} app Application which uses this panel
     */
    app: '',
    
    /**
     * @cfg {Boolean}
     */
    showAddNoteForm: true,
    
    /**
     * @cfg {Array} notes Initial notes
     */
    notes: [],
    
    /**
     * the translation object
     */
    translation: null,

    /**
     * @var {Klb.system.data.JsonStore}
     * Holds activities of the record this panel is displayed for
     */
    recordNotesStore: null,
    
    title: null,
    iconCls: 'notes_noteIcon',
    bodyStyle: 'padding: 2px 2px 2px 2px',
    autoScroll: true,
    layout: {
        type: 'vbox',
        pack: 'start',
        align: 'stretch'
    },
    /**
     * event handler
     */
    handlers: {
        
        /**
         * add a new note
         * 
         */
        addNote: function (button, event) {
            //var note_type_id = Ext.getCmp('note_type_combo').getValue();
            var note_type_id = button.typeId,
                noteTextarea = Ext.getCmp('note_textarea'),
                note = noteTextarea.getValue(),
                notesStore,
                newNote;
            
            if (note_type_id && note) {
                notesStore = Ext.StoreMgr.lookup('NotesStore');
                newNote = new Klb.system.Model.Note({note_type_id: note_type_id, note: note});
                notesStore.insert(0, newNote);
                
                // clear textarea
                noteTextarea.setValue('');
                noteTextarea.emptyText = noteTextarea.emptyText;
            }
        }        
    },
    
    /**
     * init activities data view
     */
    initActivitiesDataView: function () {
        var ActivitiesTpl = new Ext.XTemplate(
            '<tpl for=".">',
                '<div class="x-ux-messagebox-msg">',
                    '<div class="x-box-tl"><div class="x-box-tr"><div class="x-box-tc"></div></div></div>',
                    '<div class="x-box-ml"><div class="x-box-mr"><div class="x-box-mc" style="font-size: 11px;">',
                        '<div class="x-widget-activities-activitiesitem-text"',
                        '   ext:qtip="{[this.encode(values.note)]} - {[this.render(values.creation_time, "timefull")]} - {[this.render(values.created_by, "user")]}" >', 
                            '{[this.render(values.note_type_id, "icon")]}&nbsp;{[this.render(values.creation_time, "timefull")]}<br/>',
                            '{[this.encode(values.note, true)]}',
                        '</div>',
                    '</div></div></div>',
                    '<div class="x-box-bl"><div class="x-box-br"><div class="x-box-bc"></div></div></div>',
                '</div><div style="clear: both; height: 2px;"></div>',
            '</tpl>' , {
                encode: function (value, ellipsis) {
                    var result = Ext.util.Format.nl2br(Klb.system.Common.doubleEncode(value));
                    return (ellipsis) ? Ext.util.Format.ellipsis(result, 300) : result;
                },
                render: function (value, type) {
                    switch (type) 
                    {
                    case 'icon':
                        return Klb.system.widgets.activities.getTypeIcon(value);
                    case 'user':
                        if (!value) {
                            value = Klb.App.Api.registry.map.currentAccount.accountDisplayName;
                        }
                        var username = value;
                        return '<i>' + username + '</i>';
                    case 'time':
                        if (!value) {
                            return '';
                        }
                        return value.format(Locale.getTranslationData('Date', 'medium'));
                    case 'timefull':
                        if (!value) {
                            return '';
                        }
                        return value.format(Locale.getTranslationData('Date', 'medium')) + ' ' +
                            value.format(Locale.getTranslationData('Time', 'medium'));
                    }
                }
            }
        );
        
        this.activities = new Ext.DataView({
            anchor: '-20',
            tpl: ActivitiesTpl,       
            // id: 'grid_activities_limited',
            store: this.recordNotesStore,
            overClass: 'x-view-over',
            itemSelector: 'activities-item-small'
        });
    },
    
    /**
     * init note form
     * 
     */
    initNoteForm: function () {
        var noteTextarea =  new Ext.form.TextArea({
            id: 'note_textarea',
            emptyText: this.translation.gettext('Add a Note...'),
            grow: false,
            preventScrollbars: false,
            anchor: '100%',
            height: 55,
            hideLabel: true
        });
        
        var subMenu = [];
        var typesStore = Klb.system.widgets.activities.getTypesStore();
        var defaultTypeRecord = typesStore.getAt(typesStore.find('is_user_type', '1'));
        
        typesStore.each(function (record) {
            if (record.data.is_user_type === 1) {
                var action = new Ext.Action({
                    text: this.translation.gettext('Add') + ' ' + this.translation.gettext(record.data.name) + ' ' + this.translation.gettext('Note'),
                    tooltip: this.translation.gettext(record.data.description),
                    handler: this.handlers.addNote,
                    iconCls: 'notes_' + record.data.name + 'Icon',
                    typeId: record.data.id,
                    scope: this
                });
                subMenu.push(action);
            }
        }, this);
        
        var addButton = new Ext.SplitButton({
            text: this.translation.gettext('Add'),
            tooltip: this.translation.gettext('Add new note'),
            iconCls: 'action_saveAndClose',
            menu: {
                items: subMenu
            },
            handler: this.handlers.addNote,
            typeId: defaultTypeRecord.data.id
        });

        this.formFields = {
            layout: 'form',
            items: [
                noteTextarea
            ],
            bbar: [
                '->',
                addButton
            ]
        };
    },

    /**
     * @private
     */
    initComponent: function () {
        
        // get translations
        this.translation = new Klb.system.Locale.Gettext();
        this.translation.textdomain('Modern');
        
        // translate / update title
        this.title = this.translation.gettext('Notes');
        
        // init recordNotesStore
        this.notes = [];
        this.recordNotesStore = Ext.create('Klb.system.data.JsonStore', {
            model: 'Klb.system.Model.Note',
            data: this.notes,
            sortInfo: {
                field: 'creation_time',
                direction: 'DESC'
            }
        });
        
        Ext.StoreMgr.add('NotesStore', this.recordNotesStore);
        
        // set data view with activities
        this.initActivitiesDataView();
        
        if (this.showAddNoteForm) {
            // set add new note form
            this.initNoteForm();
                
            this.items = [
                this.formFields,
                // this form field is only for fetching and saving notes in the record
                new Klb.system.widgets.activities.NotesFormField({
                    recordNotesStore: this.recordNotesStore
                }),                 
                this.activities
            ];
        } else {
            this.items = [
                new Klb.system.widgets.activities.NotesFormField({
                    recordNotesStore: this.recordNotesStore
                }),                 
                this.activities
            ];
        }

        this.callParent();
    }
});
//Ext.reg('tineactivitiespanel', Klb.system.widgets.activities.ActivitiesPanel);

/************************* add note button ***************************/

/**
 * button for adding notes
 * 
 * @namespace   Klb.system.widgets.activities
 * @class       Klb.system.widgets.activities.ActivitiesAddButton
 * @extends     Ext.SplitButton
 */
Ext.define('Klb.system.widgets.activities.ActivitiesAddButton', {
    extend:  'Ext.button.Split',
    xtype:   'activitiesaddbutton',
    iconCls: 'notes_noteIcon',

    /**
     * event handler
     */
    handlers: {
        
        /**
         * add a new note (show prompt)
         */
        addNote: function (button, event) {

            this.formPanel = new Ext.form.Panel({
                labelAlign: 'top',
                border: false,
                frame: true,
                items: [{                    
                    xtype: 'textarea',
                    name: 'notification',
                    fieldLabel: this.translation.gettext('Enter new note:'),
                    labelSeparator: '',
                    anchor: '100% 100%'
                }]
            });
            
            this.onClose = function () {
                this.window.close();
            };

            this.onCancel = function () {
                this.onClose();
            };

            this.onOk = function () {
                var text = this.formPanel.getForm().findField('notification').getValue();
                this.handlers.onNoteAdd(text, button.typeId);
                this.onClose();
            };
            
            this.cancelAction = new Ext.Action({
                text: this.translation.gettext('Cancel'),
                iconCls: 'action_cancel',
                minWidth: 70,
                handler: this.onCancel,
                scope: this
            });
            
            this.okAction = new Ext.Action({
                text: this.translation.gettext('Ok'),
                iconCls: 'action_saveAndClose',
                minWidth: 70,
                handler: this.onOk,
                scope: this
            });
           
            this.buttons = [];
            if (Klb.App.Api.registry && Klb.App.Api.registry.get('preferences') && Klb.App.Api.registry.get('preferences').get('dialogButtonsOrderStyle') === 'Windows') {
                this.buttons.push(this.okAction, this.cancelAction);
            }
            else {
                this.buttons.push(this.cancelAction, this.okAction);
            }
            
            this.window = Klb.system.WindowFactory.getWindow({
                title: this.translation.gettext('Add Note'),
                width: 500,
                height: 260,
                modal: true,
                layout: 'fit',
                buttonAlign: 'right',
                border: false,    
                buttons: this.buttons,
                items: this.formPanel
            });
        },       
        
        /**
         * on add note
         * - add note to activities panel
         */
        onNoteAdd: function (text, typeId) {
            if (text && typeId) {
                var notesStore = Ext.StoreMgr.lookup('NotesStore');
                var newNote = new Klb.system.Model.Note({note_type_id: typeId, note: text});
                notesStore.insert(0, newNote);
            }
        }
    },
    
    /**
     * @private
     */
    initComponent: function () {

        // get translations
        this.translation = new Klb.system.Locale.Gettext();
        this.translation.textdomain('Api');

        // get types for split button
        var subMenu = [],
            typesStore = Klb.system.widgets.activities.getTypesStore(),
            defaultTypeRecord = typesStore.getAt(typesStore.find('is_user_type', '1'));

        typesStore.each(function (record) {
            if (record.data.is_user_type === '1') {
                var action = new Ext.Action({
                    requiredGrant: 'editGrant',
                    text: Ext.String.format(this.translation.gettext('Add a {0} Note'), record.data.name),
                    tooltip: this.translation.gettext(record.data.description),
                    handler: this.handlers.addNote,
                    //iconCls: 'notes_' + record.data.name + 'Icon',
                    iconCls: record.data.icon_class,
                    typeId: record.data.id,
                    scope: this
                });
                subMenu.push(action);
            }
        }, this);

        this.requiredGrant = 'editGrant';
        this.text = this.translation.gettext('Add Note');
        this.tooltip = this.translation.gettext('Add new note');
        this.menu = {
            items: subMenu
        };
        this.handler = this.handlers.addNote;
        this.typeId = defaultTypeRecord.data.id;

        this.callParent();
    }
});

/************************* tab panel *********************************/

/**
 * Class for a activities tab with notes/activities grid
 * 
 * TODO add more filters to filter toolbar
 * 
 * 
 * @namespace   Klb.system.widgets.activities
 * @class       Klb.system.widgets.activities.ActivitiesTabPanel
 * @extends     Ext.panel.Panel
 */
Ext.define('Klb.system.widgets.activities.ActivitiesTabPanel', {
    extend:  'Ext.panel.Panel',

    /**
     * @cfg {String} app Application which uses this panel
     */
    app: '',
    
    /**
     * @var {Klb.system.data.JsonStore}
     * Holds activities of the record this panel is displayed for
     */
    store: null,
    
    /**
     * the translation object
     */
    translation: null,

    /**
     * @cfg {Object} paging defaults
     */
    paging: {
        start: 0,
        limit: 20,
        sort: 'creation_time',
        dir: 'DESC'
    },

    /**
     * the record id
     */
    record_id: null,
    
    /**
     * the record model
     */
    record_model: null,
    
    /**
     * other config options
     */
    title: null,
    layout: 'fit',
    
    getActivitiesGrid: function () {
        // @todo add row expander on select ?
        // @todo add context menu ?
        // @todo add buttons ?        
        // @todo add more renderers ?
        
        // the columnmodel
        var _columns = [
            { header: this.translation.gettext('Type'), dataIndex: 'note_type_id', width: 17,
              renderer: Klb.system.widgets.activities.getTypeIcon },
            { header: this.translation.gettext('Note'), dataIndex: 'note', flex: 1 },
            { header: this.translation.gettext('Created By'), dataIndex: 'created_by', width: 70},
            { header: this.translation.gettext('Timestamp'),  dataIndex: 'creation_time', width: 100,
                renderer: Klb.system.Common.dateTimeRenderer  }
        ];

        var headerCt = { // Ext.create('Ext.grid.header.Container',
            defaults: {
                sealed: true,
                sortable: true, // by default columns are sortable
                resizable: true
            },
            items: _columns
        };

        // the rowselection model
        // var rowSelectionModel = new Ext.grid.RowSelectionModel({multiSelect: true});

        // the paging toolbar
        var pagingToolbar = Ext.create('Ext.PagingToolbar', {
            pageSize: 20,
            store: this.store,
            displayInfo: true,
            displayMsg: this.translation.gettext('Displaying history records {0} - {1} of {2}'),
            emptyMsg: this.translation.gettext("No history to display")
        });

        // the gridpanel
        var gridPanel = Ext.create('Ext.grid.Panel', {
            reference: 'activities_grid',
            store:   this.store,
            columns: headerCt,
            tbar: pagingToolbar,
            // selModel: rowSelectionModel,
            border: false,
            //autoExpandColumn: 'note',
            //enableColLock:false,
            //autoHeight: true,
            viewConfig: {
                autoFill: true,
                forceFit: true,
                ignoreAdd: true,
                autoScroll: true
            }
        });

        return gridPanel;
    },
    
    /**
     * init the contacts json grid store
     */
    initStore: function () {

        this.store = Ext.create('Klb.system.data.JsonStore', {
            autoLoad: false,
            model: 'Klb.system.Model.Note',
            remoteSort: true,
            baseParams: {
                method: 'Api.searchNotes'
            },
            sortInfo: {
                field: this.paging.sort,
                direction: this.paging.dir
            }
        });
        
        // register store
        Ext.StoreMgr.add('NotesGridStore', this.store);
        
        // prepare filter
        this.store.on('beforeload', function (store, options) {
            var params = {};
            if (!options.params) {
                options.params = {};
            }
            
            // paging toolbar only works with this properties in the options!
            options.params.sort  = store.sortInfo ? store.sortInfo.field : this.paging.sort;
            options.params.dir   = store.sortInfo ? store.sortInfo.direction : this.paging.dir;
            options.params.start = options.params.start ? options.params.start : this.paging.start;
            options.params.limit = options.params.limit ? options.params.limit : this.paging.limit;

            params.paging = Ext.copyTo({}, options.params, 'sort,dir,start,limit');

            var filter =  this.filterToolbar ? this.filterToolbar.getValue() : [];
            filter.push(
                // {field: 'record_model',   operator: 'equals', value: this.record_model },
                {field: 'record_id',      operator: 'equals', value: (this.record_id) ? this.record_id : 0 },
                {field: 'record_backend', operator: 'equals', value: 'Sql' }
            );

            params.method =  'Api.searchNotes';
            params.filter  = filter;
            options.params = params;
        }, this);
        
        // add new notes from notes store
        this.store.on('load', function (store, records, success, operation) {
            var notesStore = Ext.StoreMgr.lookup('NotesStore');
            if (notesStore) {
                notesStore.each(function (note) {
                // Ext.Array.each(records, function (note) {
                    if (!note.data.creation_time) {
                        store.insert(0, note);
                    }
                }, this);
            }
        }, this);

    },

    /**
     * @private
     */
    initComponent: function () {
        var me = this;
        // get translations
        me.translation = new Klb.system.Locale.Gettext();
        me.translation.textdomain('Api');
        
        // translate / update title
        me.title = me.translation.gettext('History');
        
        // get store
        me.initStore();

        // get grid
        me.activitiesGrid = me.getActivitiesGrid();
        
        // the filter toolbar
        me.filterToolbar = new Klb.system.widgets.grid.FilterToolbar({
            // id : 'activitiesFilterToolbar',
            filterModels: [
                {label: _('Quick Search'), field: 'query',         operators: ['contains']},
                //{label: this.translation._('Time'), field: 'creation_time', operators: ['contains']}
                {label: me.translation.gettext('Time'), field: 'creation_time', valueType: 'date', pastOnly: true},
                // user search is note working yet -> see NoteFilter.php
                {label: this.translation._('User'), field: 'created_by', defaultOperator: 'contains'},
                // type search isn't implemented yet
                {label: this.translation._('Type'), field: 'note_type_id', defaultOperator: 'contains'}
            ],
            defaultFilter: 'query',
            filters: []
        });
        
        me.filterToolbar.on('change', function () {
            me.store.load({});
        }, me);

        me.items = [{
                xtype: 'panel',
                layout: 'border',
                items: [{
                    region: 'center',
                    xtype:  'panel',
                    layout: 'fit',
                    border: false,
                    items: [this.activitiesGrid]
                }, {
                    region: 'north',
                    border: false,
                    items: me.filterToolbar,
                    listeners: {
                        scope: me,
                        afterlayout: function (ct) {
                            ct.suspendEvents();
                                ct.setHeight(me.filterToolbar.getHeight());
                                ct.ownerCt.updateLayout();
                            ct.resumeEvents();
                        }
                    }
                }]
            }
        ];
                
        // load store on activate
        me.on('activate', function (panel) {
            panel.store.load({});
        });
        
        // no support for multiple edit
        Klb.system.widgets.dialog.MultipleEditDialogPlugin.prototype.registerSkipItem(me);
        
        me.callParent();
    }
});

/************************* helper *********************************/

/**
 * @private Helper class to have activities processing in the standard form/record cycle
 */
Ext.define('Klb.system.widgets.activities.NotesFormField', {
    extend:  'Ext.form.Field',
    /**
     * @cfg {Klb.system.data.JsonStore} recordNotesStore a store where the record notes are in.
     */
    recordNotesStore: null,
    
    name: 'notes',
    hidden: true,
    hideLabel: true,
    
    /**
     * @private
     */
    initComponent: function () {
        Klb.system.widgets.activities.NotesFormField.superclass.initComponent.call(this);
        this.hide();
    },
    /**
     * returns notes data of the current record
     */
    getValue: function () {
        var value = [];
        this.recordNotesStore.each(function (note) {
            value.push(note.data);
        });
        return value;
    },
    /**
     * sets notes from an array of note data objects (not records)
     */
    setValue: function (value) {
        value = value || [];
        
        this.recordNotesStore.loadData(value);
    }

});

/**
 * get note / activities types store
 * if available, load data from initial data
 * 
 * @return Klb.system.data.JsonStore with activities types
 * 
 * @todo translate type names / descriptions
 */
Klb.system.widgets.activities.getTypesStore = function () {
    var store = Ext.StoreMgr.get('noteTypesStore');
    if (!store) {
        store = new Klb.system.data.JsonStore({
            model: 'Klb.system.Model.NoteType',
            baseParams: {
                method: 'Api.getNoteTypes'
            },
            remoteSort: false
        });
        /*if (Klb.App.Api.registry.get('NoteTypes')) {
            store.loadData(Klb.App.Api.registry.get('NoteTypes'));
        } else*/ 
        if (Klb.App.Api.registry.get('NoteTypes')) {
            store.loadData(Klb.App.Api.registry.get('NoteTypes')['results']);
        }
        Ext.StoreMgr.add('noteTypesStore', store);
    }
    
    return store;
};

/**
 * get type icon
 * 
 * @param   id of the note type record
 * @returns img tag with icon source
 * 
 * @todo use icon_class here
 */
Klb.system.widgets.activities.getTypeIcon = function (id) {
    var typesStore = Klb.system.widgets.activities.getTypesStore();
    var typeRecord = typesStore.getById(id);
    if (typeRecord) {
        return '<img src="' + KlbSys.resources + typeRecord.data.icon + '" ext:qtip="' +  Klb.system.Common.doubleEncode(typeRecord.data.description) + '"/>';
    } else {
        return '';
    }
};
