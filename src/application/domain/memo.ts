const FORBIDDEN_KEYWORDS = ["금칙어"];

export const containsForbiddenKeyword = (title: string, content: string) => {
  const text = `${title} ${content}`.toLowerCase();
  return FORBIDDEN_KEYWORDS.some((keyword) =>
    text.includes(keyword.toLowerCase()),
  );
};
