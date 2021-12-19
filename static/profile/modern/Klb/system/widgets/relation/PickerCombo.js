/*
 * Modern 3.0
 *
 * @package     Modern
 * @license     http://www.gnu.org/licenses/agpl.html AGPL Version 3
 * @author      Alexander Stintzing <alex@stintzing.net>
 * @copyright   Copyright (c) 2009-2012 Metaways Infosystems GmbH (http://www.metaways.de)
 *
 */

Ext.ns('Klb.system.widgets.relation');

/**
 * @namespace   Klb.system.widgets.relation
 * @class       Klb.system.widgets.relation.PickerCombo
 * @author      Alexander Stintzing <a.stintzing@metaways.de>
 */

Klb.system.widgets.relation.PickerCombo = Ext.extend(Ext.Container, {
    xtype: 'tinerelationpickercombo',
    // private
    items: null,
    combo: null,
    layout: 'fit',
    /**
     * @cfg {Klb.system.widgets.dialog.EditDialog}
     */
    editDialog: null,
    /**
     * @cfg {Klb.system.data.Record} recordClass
     */
    recordClass: null,
    /**
     * @cfg {Ext.data.SimpleStore} store 
     */
    store: null,

    /**
     * initializes the component
     */
    initComponent: function() {
        this.combo = Klb.system.widgets.form.RecordPickerManager.get(this.app, this.recordClass, Ext.applyIf({},this));
        this.items = [this.combo];

        this.deferredLoading();
    },

    /**
     * wait until the relationPanel is created
     */
    deferredLoading: function() {

        if(!this.editDialog.relationsPanel) {
            this.deferredLoading.defer(100, this);
            return;
        }

        this.store = this.editDialog.relationsPanel.getStore();
        this.fullModelName = this.recordClass.getMeta('appName') + '_Model_' + this.recordClass.getMeta('modelName');

        this.combo.on('select', function() {
            var value = this.combo.getValue();

            if(value.length) {
                var recordToAdd = this.combo.selectedRecord;

                // check if another relationPicker has the same record selected
                if (this.modelUnique) {
                    var hasDuplicate = false,
                        fieldName;

                    Ext.each(this.editDialog.relationPickers, function(picker) {
                        if(picker != this) {
                            if(picker.getValue() == this.getValue()) {
                                hasDuplicate = true;
                                fieldName = picker.fieldLabel;
                                return false;
                            }
                        }
                    }, this);
                }

                if(hasDuplicate) {
                    if(this.combo.startRecord) {
                        var split = this.fullModelName.split('_Model_');
                        var startRecord = this.combo.startRecord;
                    } else {
                        startRecord = null;
                    }
                    this.combo.reset();
                    this.combo.setValue(startRecord);
                    this.combo.selectedRecord = startRecord;
                    this.combo.markInvalid( Ext.String.format(_('The {1} "{2}" is already used in the Field "{0}" and can be linked only once!'), fieldName, this.recordClass.getRecordName(), recordToAdd.get(this.recordClass.getMeta('titleProperty'))));
                    return false;
                }

                if(value != this.combo.startValue) {
                    this.removeIdFromStore(this.combo.startValue);
                }

                if(this.store.findBy(function(record, id) {
                    if(record) {
                        if(record.get('related_id') == value && record.get('type') == this.relationType) return true;
                    }
                }, this) == -1) {
                    var relationRecord = new Klb.system.Model.Relation(Ext.apply(this.editDialog.relationsPanel.getRelationDefaults(), {
                        related_record: recordToAdd.data,
                        related_id: recordToAdd.id,
                        related_model: this.fullModelName,
                        type: this.relationType,
                        own_degree: this.relationDegree
                    }), recordToAdd.id);

                    this.combo.startRecord = recordToAdd;
                    this.store.add(relationRecord);
                    }
            } else {
                this.removeIdFromStore(this.combo.startValue);
            }
        }, this);

        if(!this.editDialog.relationPickers) this.editDialog.relationPickers = [];
        this.editDialog.relationPickers.push(this);

        this.callParent();
    },

    /**
     * removes the relation record by the related record id, if the type is the same handled by this combo
     * @param {String} id
     */
    removeIdFromStore: function(id) {
        if(id) {
            var oldRecPos = this.store.findBy(function(record) {
                if(record) {
                    if(record.get('related_id') == id && record.get('type') == this.relationType) return true;
                } else {
                    return false;
                }
            }, this);
            this.store.removeAt(oldRecPos);
        }
    },

    /**
     * Shortcut for the equivalent method of the combo
     */
    setValue: function(v) {
        return this.combo.setValue(v);
    },
    /**
     * Shortcut for the equivalent method of the combo
     */
    clear: function() {
        this.combo.startRecord = null;
        return this.combo.setValue(null);
    },
    /**
     * Shortcut for the equivalent method of the combo
     */
    getValue: function() {
        return this.combo.getValue();
    }
});
