(function () {
  'use strict';

  var consentKey = 'guvernanta_cookie_consent';
  var analyticsId = 'G-NBYDYPG3MV';

  function loadAnalytics() {
    if (window.__guvernantaAnalyticsLoaded) return;
    window.__guvernantaAnalyticsLoaded = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', analyticsId);
    var script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + analyticsId;
    document.head.appendChild(script);
  }

  function removeBanner() {
    var banner = document.getElementById('cookie-consent-banner');
    if (banner) banner.remove();
  }

  function injectStyles() {
    if (document.getElementById('cookie-consent-styles')) return;
    var style = document.createElement('style');
    style.id = 'cookie-consent-styles';
    style.textContent = '#cookie-consent-banner{position:fixed;z-index:10000;left:16px;right:16px;bottom:16px;display:flex;align-items:center;justify-content:space-between;gap:20px;padding:16px 20px;background:#102343;color:#fff;border:1px solid rgba(255,255,255,.2);border-radius:14px;box-shadow:0 8px 30px rgba(16,35,67,.28);font:14px/1.45 Arial,sans-serif}#cookie-consent-banner a{color:#fff;text-decoration:underline;font-weight:700}#cookie-consent-accept{flex:0 0 auto;border:0;border-radius:999px;padding:10px 18px;background:#fff;color:#102343;font:inherit;font-weight:800;cursor:pointer}#cookie-consent-accept:hover{background:#e7f0f9}@media(max-width:700px){#cookie-consent-banner{left:10px;right:10px;bottom:10px;align-items:stretch;flex-direction:column;gap:12px;padding:14px 16px}#cookie-consent-accept{width:100%}}';
    document.head.appendChild(style);
  }

  function accept() {
    try { localStorage.setItem(consentKey, 'accepted'); } catch (e) {}
    removeBanner();
    loadAnalytics();
  }

  function showBanner() {
    if (document.getElementById('cookie-consent-banner')) return;
    var banner = document.createElement('aside');
    banner.id = 'cookie-consent-banner';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-label', 'Consimțământ cookie-uri');
    banner.innerHTML = '<div class="cookie-consent-text">Acest site foloseşte cookies. Navigând în continuare vă exprimaţi acordul asupra folosirii cookie-urilor. <a href="https://gov.ro/ro/conditii-de-utilizare" target="_blank" rel="noopener">Detalii</a></div><button type="button" id="cookie-consent-accept">Sunt de acord</button>';
    document.body.appendChild(banner);
    document.getElementById('cookie-consent-accept').addEventListener('click', accept);
  }

  function init() {
    injectStyles();
    var accepted = false;
    try { accepted = localStorage.getItem(consentKey) === 'accepted'; } catch (e) {}
    if (accepted) loadAnalytics();
    else showBanner();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
}());
