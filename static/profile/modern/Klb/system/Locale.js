/*
 * Modern 3.0.1
 *
 * @package     System
 * @copyright   Copyright (c) 2018 LLC ICS (http://www.icstime.com)
 * @license     http://www.gnu.org/licenses/agpl.html AGPL Version 3
 */

/**
 * @license     http://creativecommons.org/licenses/publicdomain Public Domain
 * @author      Koji Horaguchi <horaguchi@horaguchi.net>
 */
Ext.ns('Klb.system.Locale');
Klb.system.Locale = function (category, locale) {
    this._instance = true;
    this.LC_ALL =      'C';
    this.LC_COLLATE =  'C';
    this.LC_CTYPE =    'C';
    this.LC_MESSAGES = 'C';
    this.LC_MONETARY = 'C';
    this.LC_NUMERIC =  'C';
    this.LC_TIME =     'C';
    this.setlocale(category, locale);
};

Klb.system.Locale.VERSION = '0.0.3';
Klb.system.Locale.EXPORT = [
  'LC_ALL',
  'LC_COLLATE',
  'LC_CTYPE',
  'LC_MESSAGES',
  'LC_MONETARY',
  'LC_NUMERIC',
  'LC_TIME'
];
Klb.system.Locale.EXPORT_OK = [
  'setlocale'
];
Klb.system.Locale.EXPORT_TAGS = {
  ':common': Klb.system.Locale.EXPORT,
  ':all': Klb.system.Locale.EXPORT.concat(Klb.system.Locale.EXPORT_OK)
};

Klb.system.Locale.prototype.TranslationLists = {};

Klb.system.Locale.LC_ALL =      'LC_ALL';
Klb.system.Locale.LC_COLLATE =  'LC_COLLATE';
Klb.system.Locale.LC_CTYPE =    'LC_CTYPE';
Klb.system.Locale.LC_MESSAGES = 'LC_MESSAGES';
Klb.system.Locale.LC_MONETARY = 'LC_MONETARY';
Klb.system.Locale.LC_NUMERIC =  'LC_NUMERIC';
Klb.system.Locale.LC_TIME =     'LC_TIME';

Klb.system.Locale.setlocale = Klb.system.Locale.prototype.setlocale = function (category, locale) {
  return function () {
    if (locale === null || typeof locale == 'undefined') {
      return this[category];
    }

    if (locale == '') {
      locale = (window.navigator.browserLanguage || window.navigator.language || 'C')
        .replace(/^(.{2}).?(.{2})?.*$/, function (match, lang, terr) {
          return lang.toLowerCase() + (terr ? '_' + terr.toUpperCase() : '');
        });
    }

    switch (category) {
      case Klb.system.Locale.LC_ALL:
        this.LC_ALL      = locale;
        this.LC_COLLATE  = locale;
        this.LC_CTYPE    = locale;
        this.LC_MESSAGES = locale;
        this.LC_MONETARY = locale;
        this.LC_NUMERIC  = locale;
        this.LC_TIME     = locale;
        break;
      case Klb.system.Locale.LC_COLLATE:
      case Klb.system.Locale.LC_CTYPE:
      case Klb.system.Locale.LC_MESSAGES:
      case Klb.system.Locale.LC_MONETARY:
      case Klb.system.Locale.LC_NUMERIC:
      case Klb.system.Locale.LC_TIME:
        this[category] = locale;
        break;
      default:
        return false;
    }
    return locale;
  }.call(this._instance ? this : arguments.callee);
};

Klb.system.Locale.setlocale.LC_ALL =      'C';
Klb.system.Locale.setlocale.LC_COLLATE =  'C';
Klb.system.Locale.setlocale.LC_CTYPE =    'C';
Klb.system.Locale.setlocale.LC_MESSAGES = 'C';
Klb.system.Locale.setlocale.LC_MONETARY = 'C';
Klb.system.Locale.setlocale.LC_NUMERIC =  'C';
Klb.system.Locale.setlocale.LC_TIME =     'C';

/**
 * get translation data from generic locale object (partial clone of Zend Frameworks locale data)
 * 
 * @param   type (Date, Symbol, ...)
 * @param   key  the key
 * @return  translation data
 */
Klb.system.Locale.getTranslationData = function(type, key) {
    
    var value = '';
 
    if ( Klb.system.Locale.prototype.TranslationLists[type] && Klb.system.Locale.prototype.TranslationLists[type][key] ) {
        value = Klb.system.Locale.prototype.TranslationLists[type][key];
    }
    
    return value;
};

/**
 * get translation list from generic locale object (partial clone of Zend Frameworks locale data)
 * 
 * @param {String} type
 * @return {Object}
 */
Klb.system.Locale.getTranslationList = function(type) {
    return Klb.system.Locale.prototype.TranslationLists[type];
}

/**
 * this is called in tineInit::initLocale() to make sure we translate some plugin strings by overwriting prototype values
 */
Klb.system.Locale.prototypeTranslation = function() {
    // html editor plugin translations
    Ext.ux.form.HtmlEditor.IndentOutdent.prototype.midasBtns[1].tooltip.title = _('Outdent Text');
    Ext.ux.form.HtmlEditor.IndentOutdent.prototype.midasBtns[1].overflowText = _('Outdent Text');
    Ext.ux.form.HtmlEditor.IndentOutdent.prototype.midasBtns[2].tooltip.title = _('Indent Text');
    Ext.ux.form.HtmlEditor.IndentOutdent.prototype.midasBtns[2].overflowText = _('Indent Text');
    Ext.ux.form.HtmlEditor.RemoveFormat.prototype.midasBtns[1].tooltip.title = _('Remove Formatting');
    Ext.ux.form.HtmlEditor.RemoveFormat.prototype.midasBtns[1].overflowText = _('Remove Formatting');
}