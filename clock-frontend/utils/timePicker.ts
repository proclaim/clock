// Works around an MUI multi-section digital clock bug where the AM/PM section
// renders scrolled away from the selectable items.
export const scrollMeridiemToTop = () => {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const sections = document.querySelectorAll('.MuiMultiSectionDigitalClockSection-root');
      if (sections.length === 0) return;
      const section = sections[sections.length - 1] as HTMLElement;
      const firstRealItem = Array.from(section.querySelectorAll('li')).find(
        (li) => li.textContent?.trim(),
      ) as HTMLElement | undefined;
      if (firstRealItem) section.scrollTop = firstRealItem.offsetTop;
    });
  });
};
