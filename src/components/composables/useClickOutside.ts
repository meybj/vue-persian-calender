import { watch, onBeforeUnmount, type Ref } from 'vue';

export function useClickOutside(
  rootRef: Readonly<Ref<HTMLElement | null>>,
  pickerRef: Readonly<Ref<HTMLElement | null>>,
  isOpen: Ref<boolean>,
  onClose: () => void,
) {
  function handleClickOutside(e: MouseEvent) {
    const target = e.target as Node;
    if (rootRef.value?.contains(target)) return;
    if (pickerRef.value?.contains(target)) return;
    onClose();
  }

  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  watch(isOpen, (val) => {
    if (timeoutId) clearTimeout(timeoutId);
    if (val) {
      timeoutId = setTimeout(() => {
        document.addEventListener('click', handleClickOutside);
      }, 0);
    } else {
      document.removeEventListener('click', handleClickOutside);
    }
  });

  onBeforeUnmount(() => {
    if (timeoutId) clearTimeout(timeoutId);
    document.removeEventListener('click', handleClickOutside);
  });
}
