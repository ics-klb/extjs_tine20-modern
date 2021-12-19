/*
 * Modern 3.1.0
 * 
 * @license     http://www.gnu.org/licenses/agpl.html AGPL Version 3
 * @author      Cornelius Weiss <c.weiss@metaways.de>
 * @copyright   Copyright (c) 2007-2010 Metaways Infosystems GmbH (http://www.metaways.de)
 */
Ext.ns('Klb.system.Container');

/**
 * Modern container class
 * 
 * @todo move container model here
 * 
 * @namespace   Klb.system.Container
 * @author      Cornelius Weiss <c.weiss@metaways.de>
 */
Klb.system.Container = {
    /**
     * type for personal containers
     * 
     * @constant TYPE_PERSONAL
     * @type String
     */
    TYPE_PERSONAL: 'personal',
    
    /**
     * type for shared container
     * 
     * @constant TYPE_SHARED
     * @type String
     */
    TYPE_SHARED: 'shared',
    
    /**
     * @private
     * 
     * @property isLeafRegExp
     * @type RegExp
     */
    isLeafRegExp: /^\/personal\/[0-9a-z_\-]+\/|^\/shared\/[a-f0-9]+/i,
    
    /**
     * @private
     * 
     * @property isPersonalNodeRegExp
     * @type RegExp
     */
    isPersonalNodeRegExp: /^\/personal\/([0-9a-z_\-]+)$/i,
    
    /**
     * returns the path of the 'my ...' node
     * 
     * @return {String}
     */
    getMyNodePath: function() {
        return '/personal/' + Klb.App.Api.registry.get('currentAccount').accountId;
    },
    
    /**
     * returns the file node path of the 'my ...' node
     * 
     * @return {String}
     */
    getMyFileNodePath: function() {
        return '/personal/' + Klb.App.Api.registry.get('currentAccount').accountLoginName;
    },
    
    /**
     * returns true if given path represents a (single) container
     * 
     * NOTE: if path could only be undefined when server send container without path.
     *       This happens only in server json classes which only could return containers
     * 
     * @static
     * @param {String} path
     * @return {Boolean}
     */
    pathIsContainer: function(path) {
        return !Ext.isString(path) || !!path.match(Klb.system.Container.isLeafRegExp);
    },
    
    /**
     * returns true if given path represents a personal container of current user
     * 
     * @param {String} path
     * @return {Boolean}
     */
    pathIsMyPersonalContainer: function(path) {
        var regExp = new RegExp('^' + Klb.system.Container.getMyNodePath() + '\/([0-9a-z_\-]+)$');
        var matches = String(path).match(regExp);
        
        return !!matches;
    },
    
    /**
     * returns owner id if given path represents an personal _node_
     * 
     * @static
     * @param {String} path
     * @return {String/Boolean}
     */
    pathIsPersonalNode: function(path) {
        if (! Ext.isString(path)) {
            return false;
        }
        var matches = path.match(Klb.system.Container.isPersonalNodeRegExp);
        
        return matches ? matches[1] : false;
    },
    
    /**
     * gets translated container name by path
     * 
     * @static
     * @param {String} path
     * @param {String} containerName
     * @param {String} containersName
     * @return {String}
     */
    path2name: function(path, containerName, containersName) {
        switch (path) {
            case '/':           return  Ext.String.format(_('All {0}'), containersName);
            case '/shared':     return  Ext.String.format(_('Shared {0}'), containersName);
            case '/personal':   return  Ext.String.format(_('Other Users {0}'), containersName);
        }
        
        if (path === Klb.system.Container.getMyNodePath()
                || path === Klb.system.Container.getMyFileNodePath()) {
            return  Ext.String.format(_('My {0}'), containersName);
        }
        
        return path;
    },
    
    /**
     * returns container type (personal/shared) of given path
     * 
     * @static
     * @param {String} path
     * @return {String}
     */
    path2type: function(path) {
        var pathParts = Ext.isArray(path) ? path : String(path).split('/');
        
        return pathParts[1];
    }
    
};
