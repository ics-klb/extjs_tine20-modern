/*
 * Klb Desktop 3.0.1
 * 
 * @package     Filemanager
 * @subpackage  Model
 * @copyright   Copyright (c) 2018 LLC ICS (http://www.icstime.com)
 * @license     http://www.gnu.org/licenses/agpl.html AGPL Version 3
 */

Ext.ns('KlbDesktop.MVC.Tasks.Model', 'KlbDesktop.MVC.Tasks.model.Model');

KlbDesktop.MVC.Tasks.Model.ChecklistArray = Klb.system.Model.genericFields.concat([
    { name: 'id' },
    { name: 'percent', header: 'Percent' },
    { name: 'started_by', type: 'date', dateFormat: Date.patterns.ISO8601Long },
    { name: 'end_scheduled', type: 'string' },
    { name: 'completed', type: 'date', dateFormat: Date.patterns.ISO8601Long },
    { name: 'due', type: 'date', dateFormat: Date.patterns.ISO8601Long }
]);

KlbDesktop.MVC.Tasks.Model.TaskArray = Klb.system.Model.modlogFields.concat([
    { name: 'id' },
    { name: 'percent', header: 'Percent' },
    { name: 'started_by', type: 'date', dateFormat: Date.patterns.ISO8601Long },
    { name: 'end_scheduled', type: 'string' },
    { name: 'completed', type: 'date', dateFormat: Date.patterns.ISO8601Long },
    { name: 'due', type: 'date', dateFormat: Date.patterns.ISO8601Long },
    // ical common fields
    { name: 'class' },
    { name: 'description' },
    { name: 'geo' },
    { name: 'location' },
    { name: 'organizer' },
    { name: 'originator_tz' },
    { name: 'priority' },
    { name: 'status' },
    { name: 'status_byupdate' },
    { name: 'summary' },
    { name: 'url' },
    // ical common fields with multiple appearance
    { name: 'attach' },
    { name: 'attendee' },
    { name: 'tags' },
    { name: 'comment' },
    { name: 'contact' },
    { name: 'related' },
    { name: 'resources' },
    { name: 'rstatus' },
    // scheduleable interface fields
    { name: 'dtstart', type: 'date', dateFormat: Date.patterns.ISO8601Long },
    { name: 'duration', type: 'date', dateFormat: Date.patterns.ISO8601Long },
    { name: 'recurid' },
    // scheduleable interface fields with multiple appearance
    { name: 'exdate' },
    { name: 'exrule' },
    { name: 'rdate' },
    { name: 'rrule' },
    // tine 2.0 notes field
    { name: 'notes'},
    // tine 2.0 alarms field
    { name: 'alarms'},
    // relations with other objects
    { name: 'relations'},
    { name: 'attachments' }
]);
    
Klb.system.data.Record.createMeta('KlbDesktop.MVC.Tasks.Model.Checklist', KlbDesktop.MVC.Tasks.Model.ChecklistArray, {
    appName: 'Tasks',
    modelName: 'Checklist',
    idProperty: 'id',
    titleProperty: 'summary',
    // ngettext('Task', 'Tasks', n); gettext('Tasks');
    recordName: 'Checklist',
    recordsName: 'Checklists',
    containerProperty: 'container_id',
    // ngettext('to do list', 'to do lists', n); gettext('to do lists');
    containerName: 'to do list',
    containersName: 'to do lists'
});

Klb.system.data.Record.createMeta('KlbDesktop.MVC.Tasks.Model.Task', KlbDesktop.MVC.Tasks.Model.TaskArray, {
    appName: 'Tasks',
    modelName: 'Task',
    idProperty: 'id',
    titleProperty: 'summary',
    // ngettext('Task', 'Tasks', n); gettext('Tasks');
    recordName: 'Task',
    recordsName: 'Tasks',
    containerProperty: 'container_id',
    // ngettext('to do list', 'to do lists', n); gettext('to do lists');
    containerName: 'to do list',
    containersName: 'to do lists'
});

/**
 * returns default account data
 *
 * @namespace KlbDesktop.MVC.Tasks.Model.Task
 * @static
 * @return {Object} default data
 */
KlbDesktop.MVC.Tasks.Model.Task.getDefaultData = function() {
    var app = Klb.system.appMgr.get('Tasks'),
        dtstart = new Date().clearTime().add(Date.HOUR, (new Date().getHours() + 1)); 

    return {
        'class': 'PUBLIC',
        started_by: dtstart,
        end_scheduled: '00:00',
        percent: 0,
        organizer: Klb.App.Api.registry.get('currentAccount'),
        container_id: app.getMainScreen().getWestPanel().getContainerTreePanel().getDefaultContainer()
    };
};

/**
 * @namespace KlbDesktop.MVC.Tasks.Model.Task
 *
 * get task filter
 *
 * @return {Array} filter objects
 * @static
 */
KlbDesktop.MVC.Tasks.Model.Task.getFilterModel = function() {
    var app = Klb.system.appMgr.get('Tasks');

    return [
        {label: _('Quick Search'),             field: 'query',    operators: ['contains']},
        {filtertype: 'apibase.widget.container.filtermodel', app: app, recordClass: KlbDesktop.MVC.Tasks.Model.Task},
        {label: app.i18n._('Summary'),         field: 'summary' },
        {label: app.i18n._('Due Date'),        field: 'due', valueType: 'date', operators: ['within', 'before', 'after']},
        {
            label: app.i18n._('Status'),
            field: 'status',
            filtertype: 'apibase.widget.keyfield.filter',
            app: app,
            defaultValue: KlbDesktop.MVC.Tasks.Model.Task.getClosedStatus(),
            keyfieldName: 'taskStatus',
            defaultOperator: 'notin'
        },
        {label: app.i18n._('Responsible'),       field: 'organizer', valueType: 'user'},
        {filtertype: 'apibase.tag', app: app},
        {label: _('Last Modified Time'),         field: 'last_modified_time', valueType: 'date'},
        {label: _('Last Modified By'),           field: 'last_modified_by',   valueType: 'user'},
        {label: _('Creation Time'),              field: 'creation_time',      valueType: 'date'},
        {label: _('Created By'),                 field: 'created_by',         valueType: 'user'}
    ];
};

/**
 * @namespace KlbDesktop.MVC.Tasks.Model.Task
 *
 * get closed status ids
 *
 * @return {Array} status ids objects
 * @static
 */
KlbDesktop.MVC.Tasks.Model.Task.getClosedStatus = function() {
    var reqStatus = [];

    Klb.system.widgets.keyfield.StoreMgr.get('Tasks', 'taskStatus').each(function(status) {
        if (! status.get('is_open')) {
            reqStatus.push(status.get('id'));
        }
    }, this);

    return reqStatus;
};

/**
 * default tasks backend
 */
KlbDesktop.MVC.Tasks.fileRecordBackend = Ext.create('Klb.system.data.RecordProxy', {
    appName: 'Tasks',
    modelName: 'Task',
    // model:      'KlbDesktop.MVC.Tasks.Model.Task',
    modelClass: 'KlbDesktop.MVC.Tasks.Model.Task',
    recordClass: KlbDesktop.MVC.Tasks.Model.Task
});


Klb.system.data.Record.createMeta('KlbDesktop.MVC.Tasks.Model.Status', [ 
    { name: 'id' },
    { name: 'value' },
    { name: 'icon' },
    { name: 'system' },
    { name: 'is_open' },
    { name: 'i18nValue' }
], {
    appName: 'Tasks',
    modelName: 'Status',
    idProperty: 'id',
    titleProperty: 'i18nValue',
    // ngettext('Status', 'Status', n); gettext('Status');
    recordName: 'Status',
    recordsName: 'Status'
});