/*
 * Klb Desktop 3.0.1
 * 
 * @package     Modern
 * @subpackage  Content.Common
 * @copyright   Copyright (c) 2018 LLC ICS (http://www.icstime.com)
 * @license     http://www.gnu.org/licenses/agpl.html AGPL Version 3
 */

Ext.ns('KlbDesktop.MVC.Tasks');

/**
 * @namespace KlbDesktop.MVC.Tasks
 * @class KlbDesktop.MVC.Tasks.Application
 * @extends Klb.system.Application
 */

Ext.define('KlbDesktop.MVC.Tasks.Core', {
    extend: "Object",

    constructor: function () {
        this.registry = new Ext.util.MixedCollection();
        var prefixCls = 'KlbDesktop.MVC.Tasks',
            _registry = this.registry;

        _registry.add('Application',  prefixCls + '.Application');
        _registry.add('MainScreen' ,  prefixCls + '.MainScreen');
        _registry.add('TreePanel',    prefixCls + '.view.TaskTreePanel');
        _registry.add('CenterPanel',  prefixCls + '.view.TaskGridPanel');
        _registry.add('EditDialog',   prefixCls + '.view.TaskEditDialog');
        _registry.add('Models',       prefixCls + '.Model');
        _registry.add('FilterPanel',  prefixCls + '.TaskFilterPanel');
    }
});

Ext.define('KlbDesktop.MVC.Tasks.Application', {
    extend: 'Klb.system.Application',
    alternateClassName: 'KlbDesktop.MVC.Tasks.controller.Application',
    /**
     * auto hook text _('New Task')
     */
    addButtonText: 'New Task',
    requires: [
          'KlbDesktop.MVC.Tasks.model.Model'
        , 'KlbDesktop.MVC.Tasks.view.TaskGridPanel'
        , 'KlbDesktop.MVC.Tasks.view.TaskEditDialog'
    ]
});
 
/**
 * @namespace KlbDesktop.MVC.Tasks
 * @class KlbDesktop.MVC.Tasks.MainScreen
 * @extends Klb.system.widgets.MainScreen
 */
Ext.define('KlbDesktop.MVC.Tasks.MainScreen', {
    extend: 'Klb.system.widgets.MainScreen',

    activeContentType: 'Task'
});

Ext.define('KlbDesktop.MVC.Tasks.view.TaskTreePanel', {
    extend: 'Klb.system.widgets.container.TreePanel',
    alternateClassName: 'KlbDesktop.MVC.Tasks.TaskTreePanel',

    constructor: function (config) {
        config = config || {};


        config.reference = 'TasksTreePanel';
        config.modelClass = 'KlbDesktop.MVC.Tasks.Model.Task';
        config.recordClass = KlbDesktop.MVC.Tasks.Model.Task;

        config.filterMode = 'filterToolbar';

        Ext.apply(this, config);
        this.callParent([config]);
    }
});


Ext.define('KlbDesktop.MVC.Tasks.TaskFilterPanel', {
    extend: 'Klb.system.widgets.persistentfilter.PickerPanel',
    filter: [{field: 'model', operator: 'equals', value: 'Tasks_Model_TaskFilter'}]
});