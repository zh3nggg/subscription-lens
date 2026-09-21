(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./locales.json'));
  else root.LensI18n = factory(root.LensLocales);
})(typeof globalThis !== 'undefined' ? globalThis : this, function (catalog) {
  'use strict';
  function resolveLanguage(preference, systemLanguage) {
    const value = preference && preference !== 'system' ? preference : systemLanguage;
    const base = String(value || 'en').toLowerCase().split(/[-_]/)[0];
    return base === 'zh' ? 'zh-CN' : base === 'nl' ? 'nl-NL' : 'en-US';
  }
  function translate(key, language, params) {
    const locale = resolveLanguage(language, 'en-US');
    const entry = catalog[key];
    let text = locale === 'zh-CN' ? key : entry ? entry[locale === 'nl-NL' ? 1 : 0] : key;
    if (params && Number.isFinite(params.n)) {
      const forms = text.split(' || ');
      text = forms.length === 2 ? forms[new Intl.PluralRules(locale).select(params.n) === 'one' ? 0 : 1] : text;
      text = text.replaceAll('{n}', new Intl.NumberFormat(locale).format(params.n));
    }
    return text;
  }
  return {resolveLanguage, translate, catalog};
});
