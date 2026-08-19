// 判断当前是否处于 UI 模式（焦点在可见的可交互元素上）
export const isUIMode = (): boolean => {
  const el = document.activeElement as HTMLElement | null;
  if (!el || el === document.body) return false;
  const tag = el.tagName;
  if (tag === 'BUTTON' || tag === 'A' || tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') {
    return isVisible(el);
  }
  if (el.getAttribute('role') === 'button') return isVisible(el);
  if (el.hasAttribute('tabindex') && el.getAttribute('tabindex') !== '-1') return isVisible(el);
  return false;
};

const isVisible = (el: HTMLElement): boolean => {
  const rect = el.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) return false;
  const style = window.getComputedStyle(el);
  if (style.visibility === 'hidden' || style.display === 'none' || style.opacity === '0') return false;
  return true;
};
