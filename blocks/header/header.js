import { getMetadata, fetchPlaceholders } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';
import { getHostname } from '../../scripts/utils.js';

import {
  getNavigationMenu, formatNavigationJsonData,
} from './navigation.js';
import {
  getLanguage, getSiteName, TAG_ROOT, PATH_PREFIX, SUPPORTED_LANGUAGES, computeLocalizedUrl, discoverLanguagesFromPlaceholders,
} from '../../scripts/utils.js';
import {
  button,
  div,
  img,
  span,
  a,
} from '../../scripts/dom-helpers.js';

import { isAuthorEnvironment } from '../../scripts/scripts.js';

// media query match that indicates mobile/tablet width
const isDesktop = window.matchMedia('(min-width: 900px)');
const siteName = await getSiteName();

/**
 * Returns true if we're on a nav fragment page itself.
 * This prevents "header injected on top of header" when viewing nav.html directly.
 */
function isNavFragmentPage(pathname = window.location.pathname) {
  // Author URLs typically end with .html
  return pathname.endsWith('/nav.html')
    || pathname.endsWith('/child-site/nav.html')
    // Edge/plain URLs may not include .html
    || pathname.endsWith('/nav')
    || pathname.endsWith('/child-site/nav');
}

/**
 * Returns true if current page is under the child site hierarchy.
 * Adjust '/child-site/' if your child site path differs.
 */
function isChildSite(pathname = window.location.pathname) {
  return pathname.includes('/child-site/');
}

export default async function decorate(block) {
  // Prevent injecting the header into the nav fragment pages themselves
  if (isNavFragmentPage()) {
    return;
  }

  const themeCFReference = getMetadata('theme_cf_reference');
  applyCFTheme(themeCFReference);

  const navMeta = getMetadata('nav');
  const langCode = getLanguage();
  const isAuthor = isAuthorEnvironment();

  // Default nav fragment based on hierarchy
  // Master pages: /{lang}/nav
  // Child pages:  /{lang}/child-site/nav
  const defaultEdgeNavPath = isChildSite()
    ? `/${langCode}/child-site/nav`
    : `/${langCode}/nav`;

  let navPath = defaultEdgeNavPath;

  // If nav metadata is set, always honor it (author OR publish)
  if (navMeta) {
    navPath = new URL(navMeta, window.location).pathname;
  } else if (isAuthor) {
    // Author fallback when no metadata: point to AEM content path
    navPath = `/content/${siteName}${PATH_PREFIX}/${langCode}${isChildSite() ? '/child-site' : ''}/nav`;
  }

  const fragment = await loadFragment(navPath);

  // ---- everything below here stays exactly as you already have it ----

  // decorate nav DOM
  block.textContent = '';
  const nav = document.createElement('nav');
  nav.id = 'nav';
  while (fragment && fragment.firstElementChild) nav.append(fragment.firstElementChild);

  const classes = ['brand', 'sections', 'tools'];
  classes.forEach((c, i) => {
    const section = nav.children[i];
    if (section) section.classList.add(`nav-${c}`);
  });

  const navBrand = nav.querySelector('.nav-brand');
  const brandLink = navBrand?.querySelector('.button');
  if (brandLink) {
    brandLink.className = '';
    brandLink.closest('.button-container').className = '';
  }

  const navSections = nav.querySelector('.nav-sections');
  if (navSections) {
    navSections.querySelectorAll(':scope .default-content-wrapper > ul > li').forEach((navSection) => {
      if (navSection.querySelector('ul')) navSection.classList.add('nav-drop');
      navSection.addEventListener('click', () => {
        if (isDesktop.matches) {
          const expanded = navSection.getAttribute('aria-expanded') === 'true';
          toggleAllNavSections(navSections);
          navSection.setAttribute('aria-expanded', expanded ? 'false' : 'true');
        }
      });
    });
  }

  // ... keep the rest of your original file unchanged ...
}

  //console.log("parentPath header: ", parentPath);
  //const navPath = locale ? `/${locale}/nav` : parentPath+'/nav';
  //const navPath = parentPath=='/' ? locale ? `/${locale}/nav` : '/nav' : locale ? `/${locale}/nav` : parentPath+'/nav';
  //console.log("navPath header: ", navPath);
  const fragment = await loadFragment(navPath);

  // decorate nav DOM
  block.textContent = '';
  const nav = document.createElement('nav');
  nav.id = 'nav';
  while (fragment && fragment.firstElementChild) nav.append(fragment.firstElementChild);

  const classes = ['brand', 'sections', 'tools'];
  classes.forEach((c, i) => {
    const section = nav.children[i];
    if (section) section.classList.add(`nav-${c}`);
  });

  const navBrand = nav.querySelector('.nav-brand');
  const brandLink = navBrand?.querySelector('.button');
  if (brandLink) {
    brandLink.className = '';
    brandLink.closest('.button-container').className = '';
  }

  const navSections = nav.querySelector('.nav-sections');
  if (navSections) {
    navSections.querySelectorAll(':scope .default-content-wrapper > ul > li').forEach((navSection) => {
      if (navSection.querySelector('ul')) navSection.classList.add('nav-drop');
      navSection.addEventListener('click', () => {
        if (isDesktop.matches) {
          const expanded = navSection.getAttribute('aria-expanded') === 'true';
          toggleAllNavSections(navSections);
          navSection.setAttribute('aria-expanded', expanded ? 'false' : 'true');
        }
      });
    });
  }

  const navTools = nav.querySelector('.nav-tools');
  if (navTools) {
    const contentWrapper = nav.querySelector('.nav-tools > div[class = "default-content-wrapper"]');
    // Language switcher (minimal UI)
    try {
      const currentLang = getLanguage();
      const langWrap = document.createElement('div');
      langWrap.className = 'lang-switcher';
      const langBtn = document.createElement('button');
      langBtn.type = 'button';
      langBtn.className = 'lang-button';
      langBtn.setAttribute('aria-haspopup', 'listbox');
      langBtn.setAttribute('aria-expanded', 'false');
      langBtn.textContent = currentLang.toUpperCase();
      const langMenu = document.createElement('ul');
      langMenu.className = 'lang-menu';
      langMenu.setAttribute('role', 'listbox');
      const langs = await discoverLanguagesFromPlaceholders();
      const uniqueLangs = [...new Set(langs && langs.length ? langs : ['en'])];
      if (uniqueLangs.length <= 1) {
        langBtn.setAttribute('disabled', 'true');
        langWrap.classList.add('single-lang');
      }
      const regionNames = (() => {
        try { return new Intl.DisplayNames([navigator.language || 'en'], { type: 'region' }); } catch (e) { return null; }
      })();
      const languageNames = (() => {
        try { return new Intl.DisplayNames([navigator.language || 'en'], { type: 'language' }); } catch (e) { return null; }
      })();

      uniqueLangs.forEach((raw) => {
        const code = String(raw).replace('_', '-').toLowerCase();
        const [langPart, regionPart] = code.split('-');
        const displayCode = `${langPart}${regionPart ? `-${regionPart}` : ''}`.toUpperCase();
        const country = regionPart ? (regionNames ? regionNames.of(regionPart.toUpperCase()) : regionPart.toUpperCase())
          : (languageNames ? languageNames.of(langPart) : langPart.toUpperCase());

        const li = document.createElement('li');
        li.className = 'lang-item';
        li.setAttribute('role', 'option');
        li.setAttribute('aria-selected', langPart === currentLang ? 'true' : 'false');

        const link = document.createElement('a');
        // Use only language segment for routing if site paths are language-based
        link.href = computeLocalizedUrl(langPart);

        const pre = document.createElement('span');
        pre.className = 'lang-pretitle';
        pre.textContent = displayCode;

        const name = document.createElement('span');
        name.className = 'lang-country';
        name.textContent = country;

        link.append(name, pre);
        li.append(link);
        langMenu.append(li);
      });
      langBtn.addEventListener('click', () => {
        const expanded = langBtn.getAttribute('aria-expanded') === 'true';
        langBtn.setAttribute('aria-expanded', expanded ? 'false' : 'true');
        langWrap.classList.toggle('open', !expanded);
      });
      document.addEventListener('click', (e) => {
        if (!langWrap.contains(e.target)) {
          langBtn.setAttribute('aria-expanded', 'false');
          langWrap.classList.remove('open');
        }
      });
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          langBtn.setAttribute('aria-expanded', 'false');
          langWrap.classList.remove('open');
        }
      });
      langWrap.append(langBtn, langMenu);
      const targetContainer = contentWrapper || navTools;
      targetContainer.append(langWrap);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('Language switcher init failed', e);
    }
    // Close Search Container on Focus out
    document.addEventListener('click', (e) => {
      closeSearchOnFocusOut(e, navTools);
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        const headerWrapper = document.querySelector('.header-wrapper');
        const searchContainer = headerWrapper ? headerWrapper.querySelector('.search-container') : null;
        if (searchContainer && searchContainer.style.display !== 'none' && searchContainer.contains(e.target)) {
          closeSearchBox();
        }
      }
    });
  }
  
  // hamburger for mobile
  const hamburger = document.createElement('div');
  hamburger.classList.add('nav-hamburger');
  hamburger.innerHTML = `<button type="button" aria-controls="nav" aria-label="Open navigation">
      <span class="nav-hamburger-icon"></span>
    </button>`;
  hamburger.addEventListener('click', () => toggleMenu(nav, navSections));
  nav.prepend(hamburger);
  nav.setAttribute('aria-expanded', 'false');
  // prevent mobile nav behavior on window resize
  toggleMenu(nav, navSections, isDesktop.matches);
  isDesktop.addEventListener('change', () => toggleMenu(nav, navSections, isDesktop.matches));

  const navWrapper = document.createElement('div');
  navWrapper.className = 'nav-wrapper';
  navWrapper.append(nav);
  block.append(navWrapper);
  settingAltTextForSearchIcon();
  //fetchingPlaceholdersData();
  addLogoLink(langCode);
    // Ensure search icon mask uses correct base path in UE/author/local
    try {
      const iconEl = document.querySelector('header .search.search-icon .icon');
      if (iconEl && window.hlx && window.hlx.codeBasePath) {
        const iconUrl = `${window.hlx.codeBasePath}/icons/search.svg`;
        iconEl.style.webkitMask = `url(${iconUrl}) no-repeat center / contain`;
        iconEl.style.mask = `url(${iconUrl}) no-repeat center / contain`;
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.debug('search icon mask init skipped', e);
    }
}
