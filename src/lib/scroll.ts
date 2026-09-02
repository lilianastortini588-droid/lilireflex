export function scrollToId(id: string) {
  const node = document.getElementById(id);
  node?.scrollIntoView({ behavior: "smooth", block: "start" });
}
