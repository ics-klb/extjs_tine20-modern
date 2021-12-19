/**
 * @license     http://creativecommons.org/licenses/publicdomain Public Domain
 * @author      Koji Horaguchi <horaguchi@horaguchi.net>
 */
 
/* We don't support dynamic inclusion of po files any longer!
if (typeof ActiveXObject != 'undefined' && typeof XMLHttpRequest == 'undefined') {
  XMLHttpRequest = function () { try { return new ActiveXObject("Msxml2.XMLHTTP");
  } catch (e) { return new ActiveXObject("Microsoft.XMLHTTP"); } };
}
*/

/**
 * @constuctor
 */
Klb.system.Locale.Gettext = function (locale) {
    this.locale = typeof locale == 'string' ? new Klb.system.Locale(Klb.system.Locale.LC_ALL, locale) : locale || Klb.system.Locale;
    this.domain = 'messages';
    this.category = Klb.system.Locale.LC_MESSAGES;
    this.suffix = 'po';
    this.dir = '.';
};

Klb.system.Locale.Gettext.prototype.bindtextdomain = function (domain, dir) {
  this.dir = dir;
  this.domain = domain;
};

Klb.system.Locale.Gettext.prototype.textdomain = function (domain) {
  this.domain = domain;
};

Klb.system.Locale.Gettext.prototype.getmsg = function (domain, category, reload) {
  var key = this._getkey(category, domain);
  return Klb.system.Locale.Gettext.prototype._msgs[key];
};

Klb.system.Locale.Gettext.prototype._msgs = {};

Klb.system.Locale.Gettext.prototype._getkey = function(category, domain) {
    return this.dir + '/' + category + '/' + domain; // expect category is str
};

/*
Klb.system.Locale.Gettext.prototype._url = function (category, domain) {
 try {
    var req = new XMLHttpRequest;

    req.open('POST', KlbSys.requestUrl , false);
    req.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
    req.setRequestHeader('X-Modern20-Request-Type', 'JSON');
    req.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    req.send('method=Modern.getTranslations&requestType=JSON&application=' + domain + '&jsonKey=' + Modern.Modern.registry.get('jsonKey'));
    if (req.status == 200 || req.status == 304 || req.status == 0 || req.status == null) {
      return Ext.util.JSON.decode(req.responseText);
    }
  } catch (e) {
    return '';
  }
};
*/

Klb.system.Locale.Gettext.prototype.dcgettext = function (domain, msgid, category) {
  var msg = this.getmsg(domain, category);
  
  return msg ? msg.get(msgid) || msgid : msgid;
};

Klb.system.Locale.Gettext.prototype.dcngettext = function (domain, msgid, msgid_plural, n, category) {
  var msg = this.getmsg(domain, category);
  
  if (msg) {
    return (msg.get(msgid, msgid_plural) || [msgid, msgid_plural])[msg.plural(n)] || (n > 1 ? msgid_plural : msgid);
  } else {
    // fallback if cataloge is not available
    return n > 1 ? msgid_plural : msgid;
  }
};

Klb.system.Locale.Gettext.prototype.dgettext = function (domain, msgid) {
  return this.dcgettext(domain, msgid, this.category);
};

Klb.system.Locale.Gettext.prototype.dngettext = function (domain, msgid, msgid_plural, n) {
  return this.dcngettext(domain, msgid, msgid_plural, n, this.category);
};

Klb.system.Locale.Gettext.prototype.gettext = Klb.system.Locale.Gettext.prototype._ = Klb.system.Locale.Gettext.prototype._hidden = function (msgid) {
  return this.dcgettext(this.domain, msgid, this.category);
};

Klb.system.Locale.Gettext.prototype.ngettext = Klb.system.Locale.Gettext.prototype.n_ = Klb.system.Locale.Gettext.prototype.n_hidden = function (msgid, msgid_plural, n) {
  return this.dcngettext(this.domain, msgid, msgid_plural, n, this.category);
};

Klb.system.Locale.Gettext.prototype.gettext_noop = Klb.system.Locale.Gettext.prototype.N_ = function (msgid) {
  return msgid;
};

// extend object
(function () {
  for (var i in Klb.system.Locale.Gettext.prototype) {
    Klb.system.Locale.Gettext[i] = function (func) {
      return function () {
        return func.apply(Klb.system.Locale.Gettext, arguments);
      };
    }(Klb.system.Locale.Gettext.prototype[i]);
  }
})();

// Klb.system.Locale.Gettext.PO

if (typeof Klb.system.Locale.Gettext.PO == 'undefined') {
  Klb.system.Locale.Gettext.PO = function (object) {
    if (typeof object == 'string' || object instanceof String) {
      this.msg = Klb.system.Locale.Gettext.PO.po2object(object);
    } else if (object instanceof Object) {
      this.msg = object;
    } else {
      this.msg = {};
    }
  };
}

/*
Klb.system.Locale.Gettext.PO.VERSION = '0.0.4';
Klb.system.Locale.Gettext.PO.EXPORT_OK = [
  'po2object',
  'po2json'
];

Klb.system.Locale.Gettext.PO.po2object = function (po) {
  return eval(Klb.system.Locale.Gettext.PO.po2json(po));
};


Klb.system.Locale.Gettext.PO.po2json = function (po) {
  var first = true, plural = false;
  return '({\n' + po
    .replace(/\r?\n/g, '\n')
    .replace(/#.*\n/g, '')
    .replace(/"(\n+)"/g, '')
    .replace(/msgid "(.*?)"\nmsgid_plural "(.*?)"/g, 'msgid "$1, $2"')
    .replace(/msg(\S+) /g, function (match, op) {
      switch (op) {
      case 'id':
        return first
          ? (first = false, '')
          : plural
            ? (plural = false, ']\n, ')
            : ', ';
      case 'str':
        return ': ';
      case 'str[0]':
        return plural = true, ': [\n  ';
      default:
        return ' ,';
      }
    }) + (plural ? ']\n})' : '\n})');
};
*/

Klb.system.Locale.Gettext.PO.prototype.get = function (msgid, msgid_plural) {
  // for msgid_plural == ""
  return typeof msgid_plural != 'undefined' ? this.msg[msgid + ', ' + msgid_plural] : this.msg[msgid];
};

Klb.system.Locale.Gettext.PO.prototype.plural = function (n) {
  var nplurals, plural;
  eval((this.msg[''] + 'Plural-Forms: nplurals=2; plural=n != 1\n').match(/Plural-Forms:(.*)\n/)[1]);
  return plural === true
    ? 1
    : plural === false
      ? 0
      : plural;
};

// create dummy domain
Klb.system.Locale.Gettext.prototype._msgs.emptyDomain = new Klb.system.Locale.Gettext.PO(({}));
