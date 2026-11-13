import {
  ref,
  computed,
  nextTick,
  watch,
  onMounted,
  onBeforeUnmount,
  type Ref,
} from 'vue';
import type { Dir, PickerPlace } from '../utils/modules/types';

export function usePopoverPosition(options: {
  rootRef: Readonly<Ref<HTMLElement | null>>;
  pickerRef: Readonly<Ref<HTMLElement | null>>;
  isOpen: Ref<boolean>;
  isModal: () => boolean;
  isInline: () => boolean;
  teleportTarget: () => boolean | string;
  mobileDrawer: () => boolean;
  pickerDir: () => Dir;
}) {
  const pickerPlace = ref<PickerPlace>({
    top: false,
    left: false,
    right: true,
  });
  const documentWidth = ref(
    typeof window !== 'undefined' ? window.innerWidth : 1024,
  );
  const teleportStyles = ref<Record<string, string>>({});

  // Mobile Drawer state (<600px)
  const isMobileSheet = computed(
    () =>
      !options.isInline() &&
      options.mobileDrawer() &&
      documentWidth.value < 600,
  );

  // Touch swipe-to-dismiss state
  const dragOffsetY = ref(0);
  let touchStartY = 0;

  function onTouchStart(e: TouchEvent) {
    if (!isMobileSheet.value) return;
    touchStartY = e.touches[0].clientY;
  }

  function onTouchMove(e: TouchEvent) {
    if (!isMobileSheet.value) return;
    const delta = e.touches[0].clientY - touchStartY;
    if (delta > 0) {
      dragOffsetY.value = delta;
    }
  }

  function onTouchEnd(onDismiss: () => void) {
    if (!isMobileSheet.value) return;
    if (dragOffsetY.value > 90) {
      onDismiss();
    }
    dragOffsetY.value = 0;
  }

  function locate() {
    if (
      options.isInline() ||
      options.isModal() ||
      isMobileSheet.value ||
      !options.isOpen.value
    ) {
      teleportStyles.value = {};
      return;
    }

    nextTick(() => {
      const rootEl = options.rootRef.value;
      const pickerEl = options.pickerRef.value;
      if (!rootEl || !pickerEl) return;

      const rect = rootEl.getBoundingClientRect();
      const pRect = pickerEl.getBoundingClientRect();
      const isRtl = options.pickerDir() === 'rtl';

      const flipTop =
        window.innerHeight - rect.bottom < pRect.height + 12 &&
        rect.top > pRect.height + 12;

      let alignLeft = !isRtl;
      let alignRight = isRtl;

      if (isRtl && rect.right - pRect.width < 8) {
        alignRight = false;
        alignLeft = true;
      } else if (!isRtl && rect.left + pRect.width > window.innerWidth - 8) {
        alignRight = true;
        alignLeft = false;
      }

      pickerPlace.value = {
        top: flipTop,
        left: alignLeft,
        right: alignRight,
      };

      // Calculate fixed coordinates when teleported to body
      if (options.teleportTarget()) {
        const top = flipTop
          ? Math.max(8, rect.top - pRect.height - 8)
          : rect.bottom + 8;
        const left = alignRight
          ? Math.max(8, rect.right - pRect.width)
          : Math.min(window.innerWidth - pRect.width - 8, rect.left);

        teleportStyles.value = {
          position: 'fixed',
          top: `${top}px`,
          left: `${left}px`,
          right: 'auto',
          bottom: 'auto',
          margin: '0',
        };
      } else {
        teleportStyles.value = {};
      }
    });
  }

  function onResize() {
    documentWidth.value = window.innerWidth;
    if (options.isOpen.value) locate();
  }

  watch(options.isOpen, (open) => {
    if (open) {
      window.addEventListener('scroll', locate, true);
      locate();
    } else {
      window.removeEventListener('scroll', locate, true);
      dragOffsetY.value = 0;
    }
  });

  onMounted(() => {
    window.addEventListener('resize', onResize);
  });

  onBeforeUnmount(() => {
    window.removeEventListener('resize', onResize);
    window.removeEventListener('scroll', locate, true);
  });

  return {
    pickerPlace,
    documentWidth,
    teleportStyles,
    isMobileSheet,
    dragOffsetY,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    locate,
  };
}
