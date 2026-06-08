import { DEFAULT_ABOUT_PAGE, DEFAULT_HOME_PAGE, DEFAULT_HOME_TRUST_ITEMS } from '@/lib/constants/homeDefaults';
import type { AboutPageSettings, HomePageSettings } from '@/types';

export function resolveTrustItems(homePage?: HomePageSettings) {
  const items = homePage?.trustItems?.filter((item) => item.title?.trim());
  return items?.length ? items : DEFAULT_HOME_TRUST_ITEMS;
}

export function resolveHomePage(homePage?: HomePageSettings): HomePageSettings {
  if (!homePage || typeof homePage !== 'object') return { ...DEFAULT_HOME_PAGE, trustItems: DEFAULT_HOME_TRUST_ITEMS };
  return {
    ...DEFAULT_HOME_PAGE,
    ...homePage,
    trustItems: homePage.trustItems?.length ? homePage.trustItems : DEFAULT_HOME_TRUST_ITEMS,
  };
}

export function resolveAboutPage(aboutPage?: AboutPageSettings): AboutPageSettings {
  if (!aboutPage || typeof aboutPage !== 'object') return DEFAULT_ABOUT_PAGE;
  return {
    ...DEFAULT_ABOUT_PAGE,
    ...aboutPage,
    storyParagraphs: aboutPage.storyParagraphs?.length ? aboutPage.storyParagraphs : DEFAULT_ABOUT_PAGE.storyParagraphs,
    philosophyParagraphs: aboutPage.philosophyParagraphs?.length ? aboutPage.philosophyParagraphs : DEFAULT_ABOUT_PAGE.philosophyParagraphs,
    values: aboutPage.values?.length ? aboutPage.values : DEFAULT_ABOUT_PAGE.values,
  };
}
