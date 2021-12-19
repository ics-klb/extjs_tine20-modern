/*
 * Modern 3.0.1
 *
 * @package     System
 * @copyright   Copyright (c) 2018 LLC ICS (http://www.icstime.com)
 * @license     http://www.gnu.org/licenses/agpl.html AGPL Version 3
 */

Ext.ns('Klb.system.Models', 'Klb.system.Model');

Klb.system.Model.modlogFields = [
    { name: 'creation_time',      type: 'date', dateFormat: Date.patterns.ISO8601Long, omitDuplicateResolving: true },
    { name: 'created_by',                                                              omitDuplicateResolving: true },
    { name: 'last_modified_time', type: 'date', dateFormat: Date.patterns.ISO8601Long, omitDuplicateResolving: true },
    { name: 'last_modified_by',                                                        omitDuplicateResolving: true },
    { name: 'is_deleted',         type: 'boolean',                                     omitDuplicateResolving: true },
    { name: 'deleted_time',       type: 'date', dateFormat: Date.patterns.ISO8601Long, omitDuplicateResolving: true },
    { name: 'deleted_by',                                                              omitDuplicateResolving: true },
    { name: 'seq',                                                                     omitDuplicateResolving: true }
];

/**
 * @type {Array}
 * generic Record fields
 */
Klb.system.Model.genericFields = Klb.system.Model.modlogFields.concat([
    { name: 'container_id', header: 'Container', omitDuplicateResolving: false}
]);
    
/**
 * Model of a language
 */
Ext.define('Klb.system.Model.Language', {
    extend: 'Klb.abstract.Model',
     fields: [
        { name: 'locale' },
        { name: 'language' },
        { name: 'region' }
    ]
});

/**
 * Model of a timezone
 */
Ext.define('Klb.system.Model.Timezone', {
    extend: 'Klb.abstract.Model',
    fields: [
        { name: 'timezone' },
        { name: 'timezoneTranslation' }
    ]
});

/**
 * Model of a role
 */
Klb.system.data.Record.createMeta('Klb.system.Model.Role',[
    {name: 'id'},
    {name: 'name'},
    {name: 'description'}
], {
    appName: 'Api',
    modelName: 'Role',
    idProperty: 'id',
    titleProperty: 'name',
    recordName: 'Role',
    recordsName: 'Roles'
});

/**
 * Model of a generalised account (user or group)
 */
Ext.define('Klb.system.Model.Account', {
    extend: 'Klb.abstract.Model',
     fields: [
        {name: 'id'},
        {name: 'type'},
        {name: 'name'},
        {name: 'data'} // todo: throw away data
     ]
});

/**
 * Model of a container
 */
Klb.system.data.Record.createMeta('Klb.system.Model.Container', Klb.system.Model.modlogFields.concat([
    {name: 'id'},
    {name: 'name'},
    {name: 'type'},
    {name: 'color'},
    {name: 'path'},
    {name: 'is_container_node', type: 'boolean'},
    {name: 'dtselect', type: 'number'},
    {name: 'backend'},
    {name: 'application_id'},
    {name: 'account_grants'},
    {name: 'model'},
    {name: 'relations'}
]), {
    appName: 'Api',
    modelName: 'Container',
    idProperty: 'id',
    titleProperty: 'name',
    /**
     * checks whether creating folders is allowed
     */
    isCreateFolderAllowed: function() {
        var grants = this.get('account_grants');

        if(!grants && this.data.id !== 'personal' && this.data.id !== 'shared') {
            return false;
        }
        else if(!grants && (this.data.id === 'personal'
            || (this.data.id === 'shared' && (Modern.Modernbase.common.hasRight('admin', this.appName)
                || Klb.system.Common.hasRight('manage_shared_folders', this.appName))))) {
            return true;
        } else if (!grants) {
            return false;
        }

        return this.get('type') == 'file' ? grants.editGrant : grants.addGrant;
    },

    isDropFilesAllowed: function() {
        var grants = this.get('account_grants');
        if(!grants) {
            return false;
        }
        else if(!grants.addGrant) {
            return false;
        }
        return true;
    },

    isDragable: function() {
        var grants = this.get('account_grants');

        if(!grants) {
            return false;
        }

        if(this.get('id') === 'personal' || this.get('id') === 'shared' || this.get('id') === 'otherUsers') {
            return false;
        }

        return true;
    }

});

/**
 * Model of a grant
 */
Ext.define('Klb.system.Model.Grant', {
    extend: 'Klb.abstract.Model',
    fields: [
        {name: 'id'},
        {name: 'account_id'},
        {name: 'account_type'},
        {name: 'account_name', sortType: Klb.system.Common.accountSortType},
        {name: 'freebusyGrant',type: 'boolean'},
        {name: 'readGrant',    type: 'boolean'},
        {name: 'addGrant',     type: 'boolean'},
        {name: 'editGrant',    type: 'boolean'},
        {name: 'deleteGrant',  type: 'boolean'},
        {name: 'privateGrant', type: 'boolean'},
        {name: 'exportGrant',  type: 'boolean'},
        {name: 'syncGrant',    type: 'boolean'},
        {name: 'adminGrant',   type: 'boolean'}
    ]
});

/**
 * Model of a tag
 * 
 * @constructor {Klb.system.data.Record}
 */
Klb.system.data.Record.createMeta('Klb.system.Model.Tag',Klb.system.Model.modlogFields.concat([
    {name: 'id'         },
    {name: 'app'        },
    {name: 'owner'      },
    {name: 'name'       },
    {name: 'type'       },
    {name: 'description'},
    {name: 'color'      },
    {name: 'occurrence' },
    {name: 'rights'     },
    {name: 'contexts'   },
    {name: 'selection_occurrence', type: 'number'}
]), {
    appName: 'Api',
    modelName: 'Tag',
    idProperty: 'id',
    titleProperty: 'name',
    // ngettext('Tag', 'Tags', n); gettext('Tag');
    recordName: 'Tag',
    recordsName: 'Tags'
});

/**
 * replace template fields with data
 * @static
 */
Klb.system.Model.Tag.replaceTemplateField = function(tagData) {
    if (Ext.isArray(tagData)) {
        return Ext.each(tagData, Klb.system.Model.Tag.replaceTemplateField);
    }
    
    if (Ext.isFunction(tagData.beginEdit)) {
        tagData = tagData.data;
    }
    
    var replace = {
        'CURRENTDATE': Klb.system.Common.dateRenderer(new Date()),
        'CURRENTTIME': Klb.system.Common.timeRenderer(new Date()),
        'USERFULLNAME': Klb.App.Api.registry.get('currentAccount').accountDisplayName
    };
    
    Ext.each(['name', 'description'], function(field) {
        for(var token in replace) {
            if (replace.hasOwnProperty(token) && Ext.isString(tagData[field])) {
                tagData[field] = tagData[field].replace(new RegExp('###' + token + '###', 'g'), replace[token]);
            }
        }
    }, this);
    
};

/**
 * Model of a PickerRecord
 * 
 * @constructor {Klb.abstract.Model}
 * 
 * @deprecated
 */
Ext.define('Klb.system.PickerRecord', {
    extend: 'Klb.abstract.Model',
    fields: [
         {name: 'id'}, 
         {name: 'name'}, 
         {name: 'data'}
    ]
});

/**
 * Model of a note
 * 
 * @constructor {Klb.abstract.Model}
 */
Ext.define('Klb.system.Model.Note', {
    extend: 'Klb.abstract.Model',
    fields: [
        {name: 'id'             },
        {name: 'note_type_id'   },
        {name: 'note'           },
        {name: 'creation_time', type: 'date', dateFormat: Date.patterns.ISO8601Long },
        {name: 'created_by'     }
    ]
});

/**
 * Model of a note type
 * 
 * @constructor {Klb.abstract.Model}
 */
Ext.define('Klb.system.Model.NoteType', {
    extend: 'Klb.abstract.Model',
    fields: [
     {name: 'id'             },
     {name: 'name'           },
     {name: 'icon'           },
     {name: 'icon_class'     },
     {name: 'description'    },
     {name: 'is_user_type'   }
    ]
});

/**
 * Model of a note
 * 
 * @constructor {Klb.abstract.Model}
 */
Ext.define('Klb.system.Model.Remark', {
    extend: 'Klb.abstract.Model',
    fields: [
     {name: 'id'             },
     {name: 'remark_type_id'   },
     {name: 'note'           },
     {name: 'description'    },
     {name: 'creation_time', type: 'date', dateFormat: Date.patterns.ISO8601Long },
     {name: 'created_by'     }
    ]
});

/**
 * Model of a note type
 * 
 * @constructor {Klb.abstract.Model}
 */
Ext.define('Klb.system.Model.RemarkType',  {
    extend: 'Klb.abstract.Model',
    fields: [
     {name: 'id'             },
     {name: 'name'           },
     {name: 'icon'           },
     {name: 'icon_class'     },
     {name: 'description'    },
     {name: 'is_user_type'   }
    ]
});

/**
 * Model of a customfield definition
 */
Ext.define('Klb.system.Model.Customfield', {
    extend: 'Klb.abstract.Model',
    fields: [
     { name: 'id'             },
     { name: 'application_id' },
     { name: 'model'          },
     { name: 'name'           },
     { name: 'definition'     },
     { name: 'account_grants' }
    ]
});

/**
 * Model of a customfield value
 */
Ext.define('Klb.system.Model.CustomfieldValue', {
    extend: 'Klb.abstract.Model',
    fields: [
     { name: 'record_id'      },
     { name: 'customfield_id' },
     { name: 'value'          }
    ]
});

/**
 * Model of a preference
 * 
 * @constructor {Klb.abstract.Model}
 */
Ext.define('Klb.system.Model.Preference', {
    extend: 'Klb.abstract.Model',
    fields: [
     {name: 'id'             },
     {name: 'name'           },
     {name: 'value'          },
     {name: 'type'           },
     {name: 'label'          },
     {name: 'description'    },
     {name: 'personal_only',         type: 'boolean' },
     {name: 'options'        }
    ]
});

Ext.define('Klb.system.Model.FilterToolbar', {
    extend: 'Klb.abstract.Model',
    fields: [
        {name: 'field'},
        {name: 'operator'},
        {name: 'value'}
    ]
});

/**
 * Model of an alarm
 * 
 * @constructor {Klb.abstract.Model}
 */
Klb.system.data.Record.createMeta('Klb.system.Model.Alarm', [
    {name: 'id'             },
    {name: 'record_id'      },
    {name: 'model'          },
    {name: 'alarm_time',      type: 'date', dateFormat: Date.patterns.ISO8601Long },
    {name: 'minutes_before',  sortType: Ext.data.SortTypes.asInt},
    {name: 'sent_time',       type: 'date', dateFormat: Date.patterns.ISO8601Long },
    {name: 'sent_status'    },
    {name: 'sent_message'   },
    {name: 'options'        }
], {
    appName: 'Api',
    modelName: 'Alarm',
    idProperty: 'id',
    titleProperty: 'minutes_before',

    recordName: 'Alarm',
    recordsName: 'Alarms',
    getOption: function(name) {
        var encodedOptions = this.get('options'),
            options = encodedOptions ? Ext.decode(encodedOptions) : {}
        
        return options[name];
    },
    setOption: function(name, value) {
        var encodedOptions = this.get('options'),
            options = encodedOptions ? Ext.decode(encodedOptions) : {}
        
        options[name] = value;
        this.set('options', Ext.encode(options));
    }
});


/**
 * @namespace Klb.system.Model
 * @class     Klb.system.Model.ImportJob
 * @extends   Klb.system.data.Record
 * 
 * Model of an import job
 */
Klb.system.data.Record.createMeta('Klb.system.Model.ImportJob', [
    {name: 'files'                  },
    {name: 'import_definition_id'   },
    {name: 'model'                  },
    {name: 'import_function'        },
    {name: 'container_id'           },
    {name: 'dry_run'                },
    {name: 'options'                }
], {
    appName: 'Api',
    modelName: 'Import',
    idProperty: 'id',
    titleProperty: 'model',
    recordName: 'Import',
    recordsName: 'Imports'
});

/**
 * @namespace Klb.system.Model
 * @class     Klb.system.Model.ExportJob
 * @extends   Klb.system.data.Record
 * 
 * Model of an export job
 */
Klb.system.data.Record.createMeta('Klb.system.Model.ExportJob', [
    {name: 'filter'                 },
    {name: 'export_definition_id'   },
    {name: 'format'                 },
    {name: 'exportFunction'         },
    {name: 'recordsName'            },
    {name: 'model'                  },
    {name: 'count', type: 'int'     },
    {name: 'options'                }
], {
    appName: 'Api',
    modelName: 'Export',
    idProperty: 'id',
    titleProperty: 'model',
    recordName: 'Export',
    recordsName: 'Exports'
});

/**
 * Model of an export/import definition
 * 
 * @constructor {Klb.abstract.Model}
 */
Ext.define('Klb.system.Model.ImportExportDefinition', {
    extend: 'Klb.abstract.Model',
    fields: Klb.system.Model.genericFields.concat([
                {name: 'id'             },
                {name: 'name'           },
                {name: 'label', sortType: Ext.data.SortTypes.asUCText },
                {name: 'filename'       },
                {name: 'plugin'         },
                {name: 'description'    },
                {name: 'model'          },
                {name: 'plugin_options' }
             ])
});

/**
 * @namespace Klb.system.Model
 * @class     Klb.system.Model.Credentials
 * @extends   Klb.system.data.Record
 * 
 * Model of user credentials
 */
Klb.system.data.Record.createMeta('Klb.system.Model.Credentials', [
    {name: 'id'},
    {name: 'username'},
    {name: 'password'}
], {
    appName: 'Api',
    modelName: 'Credentials',
    idProperty: 'id',
    titleProperty: 'username',
    recordName: 'Credentials',
    recordsName: 'Credentials'
});

/**
 * @namespace Klb.system.Model
 * @class     Klb.system.Model.Relation
 * @extends   Klb.system.data.Record
 * 
 * Model of a Relation
 */
Klb.system.data.Record.createMeta('Klb.system.Model.Relation', [
    {name: 'id'},
    {name: 'own_model'},
    {name: 'own_id'},
    {name: 'related_model'},
    {name: 'related_id'},
    {name: 'type'},
    {name: 'remark'},
    {name: 'related_record', sortType: Klb.system.Common.recordSortType},
    {name: 'creation_time'}
], {
    appName: 'Api',
    modelName: 'Relation',
    idProperty: 'id',
    titleProperty: 'related_model',
    recordName: 'Relation',
    recordsName: 'Relations'
});

/**
 * @namespace Klb.system.Model
 * @class     Klb.system.Model.Department
 * @extends   Klb.system.data.Record
 * 
 * Model of a Department
 */
Klb.system.data.Record.createMeta('Klb.system.Model.Department', [
    {name: 'id'},
    {name: 'name'},
    {name: 'description'}
], {
    appName: 'Api',
    modelName: 'Department',
    idProperty: 'id',
    titleProperty: 'name',
    recordName: 'Department',
    recordsName: 'Departments'
});

Klb.system.Model.Department.getFilterModel = function() {
    return [
        {label: _('Name'),  field: 'name', operators: ['contains']}
    ];
};

/**
 * @namespace Klb.system.Model
 * @class     Klb.system.Model.Config
 * @extends   Klb.system.data.Record
 * 
 * Model of a application config settings
 */
Klb.system.data.Record.createMeta('Klb.system.Model.Config', [
    {name: 'id'}, // application name
    {name: 'settings'}
], {
    appName: 'Api',
    modelName: 'Config',
    idProperty: 'id',
    titleProperty: 'id',
    recordName: 'Config',
    recordsName: 'Configs'
});

/**
 * @namespace   Klb.system.Model
 * @class       Klb.system.Model.Node
 * @extends     Klb.system.data.Record
 */
Klb.system.data.Record.createMeta('Klb.system.Model.Node', Klb.system.Model.modlogFields.concat([
    { name: 'id' },
    { name: 'name' },
    { name: 'path' },
    { name: 'size' },
    { name: 'revision' },
    { name: 'type' },
    { name: 'contenttype' },
    { name: 'description' },
    { name: 'account_grants' },
    { name: 'description' },
    { name: 'object_id'}
]), {
    appName: 'Api',
    modelName: 'Node',
    idProperty: 'id',
    titleProperty: 'name',
    recordName: 'File',
    recordsName: 'Files'
});
