/*
 * Modern 3.0
 *
 * @package     Modern
 * @license     http://www.gnu.org/licenses/agpl.html AGPL Version 3
 * @author      Alexander Stintzing <a.stintzing@metaways.de>
 * @copyright   Copyright (c) 2009-2012 Metaways Infosystems GmbH (http://www.metaways.de)
 *
 */

Ext.ns('Klb.system.widgets.relation');
/**
 * @namespace   Klb.system.widgets.relation
 * @class       Klb.system.widgets.relation.GenericPickerGridPanel
 * @extends     Klb.system.widgets.grid.PickerGridPanel
 * @author      Alexander Stintzing <a.stintzing@metaways.de>
 */

Ext.define('Klb.system.widgets.relation.GenericPickerGridPanel', {
    extend: 'Klb.system.widgets.grid.PickerGridPanel',
    /**
     * @cfg for PickerGridPanel
     */
    recordClass: Klb.system.Model.Relation,
    clicksToEdit: 1,
    selectRowAfterAdd: false,
    
    /**
     * disable Toolbar creation, create a custom one
     * @type Boolean
     */
    enableTbar: false,
    title: null,
    /**
     * the record
     * @type Record
     */
    record: null,
    /**
     *
     * @type {String}
     */
    ownRecordClass: null,
    /**
     * @type Modern.Application
     */
    app: null,
    /**
     * The calling EditDialog
     * @type Klb.system.widgets.dialog.EditDialog
     */
    editDialog: null,
    /**
     * reference to relationPanelRegistry from the editdialog
     * 
     * @type {Array}
     */
    relationPanelRegistry: null,
    /* private */
    /**
     * configuration fetched from registry
     * @type {Object}
     * autoconfig
     */
    possibleRelations: null,
    /**
     * Selects the Model to relate to
     * @type {Ext.form.field.ComboBox} modelCombo
     */
    modelCombo: null,
    /**
     * Array with searchcombos for each model
     * @type {Array}
     */
    searchCombos: null,
    /**
     * The by the modelcombo activated model
     * @type {String}
     */
    activeModel: null,
    /**
     * Array of possible degrees
     * @type {Array} degreeData
     */
    degreeData: null,
    /**
     * keyfieldConfigs shortcuts
     * @type {Object} keyFieldConfigs
     */
    keyFieldConfigs: null,
    /**
     * constrains config
     * @type {Object} constrainsConfig
     */
    constrainsConfig: null,
    /* config */
    frame: true,
    border: true,
    autoScroll: true,
    layout: 'fit',

    /**
     * initializes the component
     */
    initComponent: function() {
        this.record = this.editDialog.record;
        this.app = this.editDialog.app;
        this.ownRecordClass = this.editDialog.recordClass;
        
        this.ignoreRelatedModels = this.editDialog.ignoreRelatedModels ? [].concat(this.editDialog.ignoreRelatedModels) : [];
        this.relationPanelRegistry = this.editDialog.relationPanelRegistry;
        
        if (this.relationPanelRegistry && this.relationPanelRegistry.length) {
            Ext.each(this.relationPanelRegistry, function(panel) {
                if (panel.relatedPhpModel) {
                    this.ignoreRelatedModels.push(panel.relatedPhpModel);
                }
            }, this);
        }
        
        this.possibleRelations = Klb.system.widgets.relation.Manager.get(this.app, this.ownRecordClass, this.ignoreRelatedModels);
        
        this.initTbar();
        this.viewConfig = {
            getRowClass: this.getViewRowClass,
            enableRowBody: true
            };
        this.actionEditInNewWindow = new Ext.Action({
            text: _('Edit record'),
            disabled: true,
            scope: this,
            handler: this.onEditInNewWindow,
            iconCls: 'action_edit'
        });
        
        this.title = this.i18nTitle = Klb.system.translation.ngettext('Relation', 'Relations', 50);
        
        Klb.system.widgets.dialog.MultipleEditDialogPlugin.prototype.registerSkipItem(this);

        this.on('rowdblclick', this.onEditInNewWindow.bind(this), this);
        
        this.on('beforecontextmenu', this.onBeforeContextMenu.bind(this), this);
        
        this.contextMenuItems = [this.actionEditInNewWindow];
        // preparing keyfield and constrains configs
        this.keyFieldConfigs = {};
        this.constrainsConfig = {};
        
        Ext.each(this.app.getRegistry().get('relatableModels'), function(rel) {
            if (rel.ownModel == this.ownRecordClass.getMeta('modelName')) {
                if (rel.keyfieldConfig) {
                    if (rel.keyfieldConfig.from == 'foreign') {
                        this.keyFieldConfigs[rel.relatedApp + rel.relatedModel] = {app: rel.relatedApp, name: rel.keyfieldConfig.name};
                    } else {
                        this.keyFieldConfigs[this.app.name + rel.ownModel] = {app: this.app.name, name: rel.keyfieldConfig.name};
                    }
                }
                if (rel.config) {
                    this.constrainsConfig[rel.relatedApp + rel.relatedModel] = rel.config;
                }
            }
        }, this);

        this.degreeData = [
            ['sibling', _('Sibling')],
            ['parent',  _('Parent')],
            ['child',   _('Child')]
        ];
        
        this.on('beforeedit', this.onBeforeRowEdit, this);
        this.on('validateedit', this.onValidateRowEdit, this);
        this.on('afteredit', this.onAfterRowEdit, this);
        
        this.editDialog.on('save', this.onSaveRecord, this);
        this.editDialog.on('load', this.loadRecord, this);
        
        this.callParent();
        
        this.selModel.on('selectionchange', function(sm) {
            this.actionEditInNewWindow.setDisabled(sm.getCount() != 1);
        }, this);
        
        this.store.on('add', this.onAdd, this);
    },
    
    /**
     * is called from onApplyChanges of the edit dialog per save event
     * 
     * @param {Klb.system.widgets.dialog.EditDialog} dialog
     * @param {Klb.system.data.Record} record
     * @param {Function} ticket
     * @return {Boolean}
     */
    onSaveRecord: function(dialog, record, ticket) {
        var interceptor = ticket();

        // update from relationsPanel if any
        if (this.isValid()) {
            if (record.data.hasOwnProperty('relations')) {
                delete record.data.relations;
            }
            var relations = [];
            
            Ext.each(this.relationPanelRegistry, function(panel) {
                relations = relations.concat(this.getData(panel.store));
            }, this);
            
            relations = relations.concat(this.getData());
            
            record.set('relations', relations);
        } else {
            Ext.Msg.alert(_('Relations failure'), _('There are invalid relations. Please check before saving.'));
            this.editDialog.loadMask.hide();
            return false;
        }
        interceptor();
    },
    
    /**
     * updates the title ot the tab
     * @param {Integer} count
     */
    updateTitle: function(count) {
        count = Ext.isNumber(count) ? count : this.store.getCount();
        this.setTitle((count > 0) ?  this.i18nTitle + ' (' + count + ')' : this.i18nTitle);
    },
    
    /**
     * creates the toolbar
     */
    initTbar: function() {
        var items = [this.getModelCombo(), ' '];
        items = items.concat(this.createSearchCombos());

        this.tbar = new Ext.Toolbar({
            items: items
        });
    },

    /**
     * adds invalid row class to a invalid row and adds the error qtip
     * 
     * @param {Klb.system.data.Record} record
     * @param {Integer} index
     * @param {Object} rowParams
     * @param {Ext.data.store} store
     * @scope this.view
     * @return {String}
     */
    getViewRowClass: function(record, index, rowParams, store) {
        if(this.invalidRowRecords && this.invalidRowRecords.indexOf(record.id) !== -1) {
            var model = record.get('related_model').split('_Model_');
            model = Klb.App[model[0]].Model[model[1]];
            rowParams.body = '<div style="height: 19px; margin-top: -19px" ext:qtip="' +
                 Ext.String.format(_('The maximum number of {0} with the type {1} is reached. Please change the type of this relation'), model.getRecordsName(), this.grid.typeRenderer(record.get('type'), null, record))
                + '"></div>';
            return 'tine-editorgrid-row-invalid';
        }
        rowParams.body='';
        return '';
    },
    /**
     * calls the editdialog for the model
     */
    onEditInNewWindow: function() {
        var selected = this.getSelectionModel().getSelected(),
            app = selected.get('related_model').split('_')[0],
            model = selected.get('related_model').split('_')[2],
            ms = Klb.system.appMgr.get(app).getMainScreen(),
            recordData = selected.get('related_record'),
            record = new Klb.App[app].Model[model](recordData);

        ms.activeContentType = model;
        var cp = ms.getCenterPanel(model);
        cp.onEditInNewWindow({actionType: 'edit', mode: 'remote'}, record);
    },
    
    /**
     * is called before context menu is shown
     * adds additional menu items from Klb.system.widgets.relation.MenuItemManager
     * @param {Klb.system.widgets.grid.PickerGridPanel} grid
     * @param {Integer} index
     * @return {Boolean}
     */
    onBeforeContextMenu: function(grid, index) {
        var record = grid.store.getAt(index),
            rm = record.get('related_model');
            if(!rm) {
                return;
            }
        var model = rm.split('_Model_');
        
        var app = Klb.system.appMgr.get(model[0]);
        var additionalItems = Klb.system.widgets.relation.MenuItemManager.get(model[0], model[1], {
            scope: app,
            grid: grid,
            gridIndex: index
        });
        
        Ext.each(additionalItems, function(item) {
            item.setText(app.i18n._(item.getText()));
            this.contextMenu.add(item);
            if(! this.contextMenu.hasOwnProperty('tempItems')) {
                this.contextMenu.tempItems = [];
            }
            this.contextMenu.tempItems.push(item);
        }, this);
    },
    
    /**
     * creates the model combo
     * @return {Ext.form.field.ComboBox}
     */
    getModelCombo: function() {
        if (!this.modelCombo) {
            var data = [];
            var id = 0;

            Ext.each(this.possibleRelations, function(rel) {
                data.push([id, rel.text, rel.relatedApp, rel.relatedModel]);
                id++;
            }, this);

            this.modelCombo = new Ext.form.field.ComboBox({
                store: new Ext.data.ArrayStore({
                    fields: ['id', 'text', 'appName', 'modelName'],
                    data: data
                }),

                allowBlank: false,
                forceSelection: true,
                value: data.length > 0 ? data[0][0] : null,
                displayField: 'text',
                valueField: 'id',
                idIndex: 0,
                mode: 'local',
                triggerAction: 'all',
                selectOnFocus: true,
                getActiveData: function() {
                    var rec = this.getStore().getAt(this.getValue());
                    if(rec) {
                        return rec.data;
                    } else {
                        return null;
                    }
                },
                listeners: {
                    scope: this,
                    select: function(combo) {
                        var value = combo.getActiveData();
                        if(value) {
                            this.showSearchCombo(value.appName, value.modelName);
                        }
                    }
                }
            });

        }
        return this.modelCombo;
    },
    /**
     * creates the searchcombos for the models
     * @return {}
     */
    createSearchCombos: function() {
        var sc = [];
        this.searchCombos = {};

        Ext.each(this.possibleRelations, function(rel) {
            var key = rel.relatedApp+rel.relatedModel;
            this.searchCombos[key] = Klb.system.widgets.form.RecordPickerManager.get(rel.relatedApp, rel.relatedModel,{
                width: 300,
                allowBlank: true,
                listeners: {
                    scope: this,
                    select: this.onAddRecordFromCombo
                }
            });
            sc.push(this.searchCombos[key]);
            this.searchCombos[key].hide();
        }, this);

        this.showSearchCombo(this.possibleRelations[0].relatedApp, this.possibleRelations[0].relatedModel);
        return sc;
    },
    /**
     * shows the active model searchcombo
     * @param {String} appName
     * @param {String} modelName
     */
    showSearchCombo: function(appName, modelName) {
        var key = appName+modelName;
        if(this.activeModel) this.searchCombos[this.activeModel].hide();
        this.searchCombos[key].show();
        this.activeModel = appName+modelName;
    },
    /**
     * returns the active search combo
     * @return {}
     */
    getActiveSearchCombo: function() {
        return this.searchCombos[this.activeModel];
    },

    /**
     * @return Ext.grid.ColumnManager
     * @private
     */
    getColumnModel: function () {
        
        this.degreeEditor = new Ext.form.field.ComboBox({
            store: new Ext.data.ArrayStore({
                fields: ['id', 'value'],
                data: this.degreeData
            }),
            allowBlank: false,
            displayField: 'value',
            valueField: 'id',
            mode: 'local'
        });

        if (! this.headerCt) {
            this.headerCt =  {
                defaults: {
                    sortable: true,
                    width: 180
                },
                columns: [
                    { dataIndex: 'related_model', header: _('Record'), editor: false, renderer: this.relatedModelRenderer.bind(this), scope: this},
                    { dataIndex: 'related_record', header: _('Description'), renderer: this.relatedRecordRenderer.bind(this), editor: false, scope: this},
                    { dataIndex: 'remark', header: _('Remark'), renderer: this.remarkRenderer.bind(this), editor: Ext.form.Field, scope: this, width: 120},
                    { hidden: true, dataIndex: 'own_degree', header: _('Dependency'), editor: this.degreeEditor, renderer: this.degreeRenderer.bind(this), scope: this, width: 100},
                    { dataIndex: 'type', renderer: this.typeRenderer, header: _('Type'),  scope: this, width: 120, editor: true},
                    { dataIndex: 'creation_time', editor: false, renderer: Klb.system.Common.dateTimeRenderer, header: _('Creation Time'), width: 140}
                ]
            };
        }
        return this.headerCt;
    },
    /**
     * creates the special editors
     * @param {} o
     */
    onBeforeRowEdit: function(o) {
        var model = o.record.get('related_model').split('_');
        var app = model[0];
        model = model[2];
        var colModel = o.grid.getColumnModel();

        switch (o.field) {
            case 'type':
                var editor = null;
                if (this.constrainsConfig[app+model]) {
                    editor = this.getTypeEditor(this.constrainsConfig[app+model]);
                } else if (this.keyFieldConfigs[app+model]) {
                    editor = new Klb.system.widgets.keyfield.ComboBox({
                        app: app,
                        keyFieldName: this.keyFieldConfigs[app+model].name
                    });
                }
                if (editor) {
                    colModel.config[o.column].setEditor(editor);
                } else {
                    colModel.config[o.column].setEditor(null);
                }
                break;
            default: return;
        }
        if(colModel.config[o.column].editor) colModel.config[o.column].editor.selectedRecord = null;
    },

    /**
     * returns the type editors for each row in the grid
     * @param {} relation
     * @return {}
     */
    getTypeEditor: function(config) {
        var data = [];
        Ext.each(config, function(c){
            data.push([c.type.toUpperCase(), c.text]);
        });
        return new Ext.form.field.ComboBox({
            store: new Ext.data.ArrayStore({
                fields: ['id', 'value'],
                data: data
            }),
            allowBlank: false,
            displayField: 'value',
            valueField: 'id',
            mode: 'local'
        });
    },

    /**
     * related record renderer
     *
     * @param {Record} value
     * @return {String}
     */
    relatedRecordRenderer: function (recData, meta, relRec) {
        var relm = relRec.get('related_model');
        if(!relm) {
            return '';
        }
        var split = relm.split('_'); 
        var recordClass = Klb.App[split[0]][split[1]][split[2]];
        var record = new recordClass(recData);
        var result = '';
        if (recData) {
            result = Ext.util.Format.htmlEncode(record.getTitle());
        }
        return result;
    },
    
    /**
     * renders the remark
     * @param {String} value
     * @param {Object} row
     * @param {String} Klb.system.data.Record
     * @return {String}
     */
    remarkRenderer: function(value, row, record) {
        if (record && record.get('related_model')) {
            var app = Klb.system.appMgr.get(record.get('related_model').split('_Model_')[0]);
        }
        if (! value) {
            value = '';
        } else if (Ext.isObject(value)) {
            var str = '';
            Ext.iterate(value, function(label, val) {
                str += app.i18n._(Ext.util.Format.capitalize(label)) + ': ' + (Ext.isNumber(val) ? val : Ext.util.Format.capitalize(val)) + ', ';
            }, this);
            value = str.replace(/, $/,'');
        } else if (Ext.isArray(value)) {
            var str = '';
            Ext.each(value, function(val) {
                str += (Ext.isNumber(val) ? val : Ext.util.Format.capitalize(val)) + ', ';
            }, this);
            value = str.replace(/, $/,'');
        } else if(value.match(/^\[.*\]$/)) {
            value = Ext.decode(value);
            return this.remarkRenderer(value);
        }
        
        return Ext.util.Format.htmlEncode(value);
    },
    /**
     * renders the degree
     * @param {String} value
     * @return {String}
     */
    degreeRenderer: function(value) {
        if(!this.degreeDataObject) {
            this.degreeDataObject = {};
            Ext.each(this.degreeData, function(dd) {
                this.degreeDataObject[dd[0]] = dd[1];
            }, this);
        }
        return this.degreeDataObject[value] ? _(this.degreeDataObject[value]) : '';
    },

    /**
     * renders the titleProperty of the models
     * @param {String} value
     * @return {String}
     */
    relatedModelRenderer: function(value) {
        if(!value) {
            return '';
        }
        var split = value.split('_');
        var model = Klb.App[split[0]][split[1]][split[2]];
        return '<span class="tine-recordclass-gridicon ' + model.getMeta('appName') + model.getMeta('modelName') + '">&nbsp;</span>' + model.getRecordName() + ' (' + model.getAppName() + ')';
    },

    /**
     * renders the type
     * @param {String} value
     * @param {Object} row
     * @param {Klb.system.data.Record} rec
     * @return {String}
     */
    typeRenderer: function(value, row, rec) {
        if(!rec.get('own_model') || !rec.get('related_model')) {
            return '';
        }
        var o = rec.get('own_model').split('_Model_').join('');
        var f = rec.get('related_model').split('_Model_').join('');

        var renderer = Ext.util.Format.htmlEncode;
        if (this.constrainsConfig[f]) {
            Ext.each(this.constrainsConfig[f], function(c){
                if(c.type == value) value = c.text;
            });
        } else if(this.keyFieldConfigs[o]) {
            renderer = Klb.system.widgets.keyfield.Renderer.get(this.keyFieldConfigs[o].app, this.keyFieldConfigs[o].name);
        } else if(this.keyFieldConfigs[f]) {
            renderer = Klb.system.widgets.keyfield.Renderer.get(this.keyFieldConfigs[f].app, this.keyFieldConfigs[f].name);
        }

        return renderer(value);
    },

    /**
     * returns the default relation values
     * @return {Array}
     */
    getRelationDefaults: function() {
        return {
            own_backend: 'Sql',
            related_backend: 'Sql',
            own_id: (this.record) ? this.record.id : null,
            own_model: this.ownRecordClass.getPhpClassName()
        };
    },

    /**
     * is called when selecting a record in the searchCombo (relationpickercombo)
     */
    onAddRecordFromCombo: function() {
        var record = this.getActiveSearchCombo().store.getById(this.getActiveSearchCombo().getValue());
        
        if (! record) {
            return;
        }
        
        if (Ext.isArray(this.constrainsConfig[this.activeModel])) {
            var relconf = {type: this.constrainsConfig[this.activeModel][0]['type']};
        } else {
            var relconf = {};
        }
        
        this.onAddRecord(record, relconf);
        
        this.getActiveSearchCombo().collapse();
        this.getActiveSearchCombo().reset();
    },

    /**
     * call to add relation from an external component
     * @param {Klb.system.data.Record} record
     * @param {Object} relconf
     */
    onAddRecord: function(record, relconf) {
        if (record) {
            if (! relconf) {
                relconf = {};
            }
            if (record.data.hasOwnProperty('relations')) {
                delete record.data.relations;
            }
            var rc = this.getActiveSearchCombo().recordClass;
            var relatedPhpModel = rc.getPhpClassName();
            
            var app = rc.getMeta('appName'), model = rc.getMeta('modelName'), f = app + model;
            var type = '';
            
            if (this.constrainsConfig[f] && this.constrainsConfig[f].length) {
                // per default the first defined type is used
                var type = this.constrainsConfig[f][0].type;
            }
            
            var relationRecord = new Klb.system.Model.Relation(Ext.apply(this.getRelationDefaults(), Ext.apply({
                related_record: record.data,
                related_id: record.id,
                related_model: relatedPhpModel,
                type: type,
                own_degree: 'sibling'
            }, relconf)), record.id);

            if (this.constrainsConfig[app + model]) {
                Ext.each(this.constrainsConfig[app + model], function(conf) {
                    // check new value
                    if (conf.hasOwnProperty('max') && conf.max > 0 && (conf.type == relationRecord.get('type'))) {
                        var resNew = this.store.queryBy(function(existingRecord, id) {
                            if ((relationRecord.get('type') == existingRecord.get('type')) && (existingRecord.get('related_model') == relationRecord.get('related_model'))) {
                                return true;
                            } else {
                                return false;
                            }
                        }, this);
                        
                        if (resNew.getCount() >= conf.max) {
                            if (! this.view) {
                                this.view = {};
                            }
                            if (! this.view.invalidRowRecords) {
                                this.view.invalidRowRecords = [];
                            }
                            this.view.invalidRowRecords.push(relationRecord.get('id'));
                        }
                    } 
                }, this);
            }
            
            
            
            // add if not already in
            if (this.store.findExact('related_id', record.id) === -1) {
                Klb.Logger.debug('Adding new relation:');
                Klb.Logger.debug(relationRecord);
                this.store.add([relationRecord]);
            }
        }
        this.getActiveSearchCombo().collapse();
        this.getActiveSearchCombo().reset();
    },
    
    /**
     * checks if record to add is already linked or is the same record
     * @param {Klb.system.data.Record} recordToAdd
     * @param {String} relatedModel
     * @return {Boolean}
     */
    relationCheck: function(recordToAdd, relatedModel) {
        var add = true;
        this.store.each(function(relation) {
            if (relation.get('related_model') == relatedModel && relation.get('related_id') == recordToAdd.getId()) {
                Ext.MessageBox.show({
                    title: _('Failure'),
                    msg: _('The record you tried to link is already linked. Please edit the existing link.'),
                    buttons: Ext.MessageBox.OK,
                    icon: Ext.MessageBox.INFO
                });
                add = false;
                return false;
            }
        }, this);
        
        // don't allow to relate itself
        if((this.ownRecordClass.getMeta('phpClassName') == relatedModel) && recordToAdd.getId() == this.editDialog.record.getId()) {
            Ext.MessageBox.show({
                title: _('Failure'),
                msg: _('You tried to link a record with itself. This is not allowed!'),
                buttons: Ext.MessageBox.OK,
                icon: Ext.MessageBox.ERROR  
            });
            add = false;
        }
        return add;
    },
    
    /**
     * is called after a row has been edited
     * @param {Object} o
     */
    onAfterRowEdit: function(o) {
        this.onUpdate(o.grid.store, o.record);
        this.view.refresh();
    },
    /**
     * validates constrains config, is called after row edit
     * @param {Object} o
     */
    onValidateRowEdit: function(o) {
        if(o.field === 'type') {
            var model = o.record.get('related_model').split('_');
            var app = model[0];
            if(!this.view.invalidRowRecords) this.view.invalidRowRecords = [];
            model = model[2];
            
            if(this.constrainsConfig[app + model]) {
                // remove itself at first
                this.view.invalidRowRecords.remove(o.record.get('id'));
                Ext.each(this.constrainsConfig[app + model], function(conf) {
                    // check new value
                    if(conf.max && conf.max > 0 && (conf.type == o.value)) {
                        var resNew = this.store.queryBy(function(record, id) {
                            if((o.value == record.get('type')) && (record.get('related_model') == (app + '_Model_' + model))) return true;
                            else return false;
                        }, this);
                        // add all record ids to invalidRecords, if maximum is reached
                        if(resNew.getCount() >= conf.max) {
                            resNew.each(function(item) {
                                if(this.view.invalidRowRecords.indexOf(item.id) === -1) this.view.invalidRowRecords.push(item.id);
                            }, this);
                            if(this.view.invalidRowRecords.indexOf(o.record.id) === -1) this.view.invalidRowRecords.push(o.record.id);
                        }
                    } 
                    // check old value
                    if (conf.max && conf.max > 0 && (conf.type == o.originalValue)) {
                        var resOld = this.store.queryBy(function(record, id) {
                            if((o.originalValue == record.get('type')) && (record.get('related_model') == (app + '_Model_' + model))) return true;
                            else return false;
                        }, this);

                        if((resOld.getCount()-1) <= conf.max) {
                            resOld.each(function(item) {
                                if(item.id != o.record.get('id')) this.view.invalidRowRecords.remove(item.id);
                            }, this);
                        }
                    }
                }, this);
            }
        }
        return true;
    },

    /**
     * is called when a record is added to the store
     * @param {Ext.data.SimpleStore} store
     * @param {Array} records
     */
    onAdd: function(store, records) {
        Ext.each(records, function(record) {
            Ext.each(this.editDialog.relationPickers, function(picker) {
                if(picker.relationType == record.get('type') && record.get('related_id') != picker.getValue() && picker.fullModelName == record.get('related_model')) {
                    var split = picker.fullModelName.split('_Model_');
                    picker.combo.selectedRecord = new Klb.App[split[0]].Model[split[1]](record.get('related_record'));
                    picker.combo.startRecord = new Klb.App[split[0]].Model[split[1]](record.get('related_record'));
                    picker.combo.setValue(picker.combo.selectedRecord);
                    picker.combo.startValue = picker.combo.selectedRecord.get(this.recordClass.getMeta('idProperty'));
                }
            }, this);
        }, this);
    },
    /**
     * is called when a record in the grid changes
     * @param {Ext.data.SimpleStore} store
     * @param {} record
     */
    onUpdate: function(store, record) {
        store.each(function(record) {
            Ext.each(this.editDialog.relationPickers, function(picker) {
                if(picker.relationType == record.get('type') && picker.fullModelName == record.get('related_model')) {
                    picker.setValue(record.get('related_record'));
                }
            }, this);
        }, this);
        this.updateTitle();
    },

    /**
     * populate store and set record
     * @param {Record} record
     */
    loadRecord: function(dialog, record, ticketFn) {
        this.store.removeAll();
        var interceptor = ticketFn();
        var relations = record.get('relations');
        if (relations && relations.length > 0) {
            this.updateTitle(relations.length);
            var relationRecords = [];
            
            Ext.each(relations, function(relation) {
                if(this.ignoreRelatedModels) {
                    if(relation.hasOwnProperty('related_model') && this.ignoreRelatedModels.indexOf(relation.related_model) == -1) {
                        relationRecords.push(new Klb.system.Model.Relation(relation, relation.id));
                    }
                } else {
                    relationRecords.push(new Klb.system.Model.Relation(relation, relation.id));
                }
            }, this);
            this.store.add(relationRecords);
            
            // sort by creation time
            this.store.sort('creation_time', 'DESC');
            
            this.updateTitle();
        }

        // add other listeners after population
        if(this.store) {
            this.store.on('update', this.onUpdate, this);
            this.store.on('add', this.updateTitle, this);
            this.store.on('remove', function(store, records, index) {
                Ext.each(records, function(record) {
                    Ext.each(this.editDialog.relationPickers, function(picker) {
                        if(picker.relationType == record.get('type') && record.get('related_id') == picker.getValue() && picker.fullModelName == record.get('related_model')) {
                            picker.clear();
                        }
                    }, this);
                }, this);
                this.updateTitle();
            }, this);
        }
        interceptor();
    },
    /**
     * checks if there are invalid relations
     * @return {Boolean}
     */
    isValid: function() {
        if(this.view && this.view.invalidRowRecords && this.view.invalidRowRecords.length > 0) return false;
        return true;
    },

    /**
     * get relations data as array
     * 
     * @param store if no store is given, this.store will be iterated
     * @return {Array}
     */
    getData: function(store) {
        store = store ? store : this.store;
        var relations = [];
        store.each(function(record) {
            delete record.data.related_record.relations;
            delete record.data.related_record.relation;
            relations.push(record.data);
        }, this);

        return relations;
    }
});