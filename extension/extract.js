(() => {
  const selection = window.getSelection()?.toString().trim();
  const article = selection ? null : new Readability(document.cloneNode(true)).parse();
  return {
    title: article?.title || document.title || "Untitled article",
    byline: article?.byline || "",
    url: location.href,
    text: selection || article?.textContent?.trim() || "",
    selected: Boolean(selection)
  };
})();
