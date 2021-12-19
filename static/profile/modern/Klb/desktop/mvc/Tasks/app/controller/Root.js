/**
 * This global controller manages the login view and ensures that view is created when
 * the application is launched. Once login is complete we then create the main view.
 */

Ext.define('KlbDesktop.MVC.Tasks.controller.Root', {
    extend: 'Klb.abstract.AppController',
    
    requires: [
        'KlbDesktop.MVC.Tasks.controller.Application'
      , 'KlbDesktop.MVC.Tasks.model.Model'
    ],
 
    window: null
});
