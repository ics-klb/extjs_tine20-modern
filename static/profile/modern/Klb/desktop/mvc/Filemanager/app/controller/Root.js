/**
 * This global controller manages the login view and ensures that view is created when
 * the application is launched. Once login is complete we then create the main view.
 */

Ext.define('KlbDesktop.MVC.Filemanager.controller.Root', {
    extend: 'Klb.abstract.AppController',
    
    requires: [
        'KlbDesktop.MVC.Filemanager.controller.Application'
      , 'KlbDesktop.MVC.Filemanager.model.Model'
    ],
 
    window: null
});
