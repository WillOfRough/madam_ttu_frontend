import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * 스크롤 진입 시 요소를 순차적으로 노출시키는 reveal 훅.
 * register(idx) 로 ref 를 연결하고, visible.has(idx) 로 노출 여부를 확인한다.
 * (About / AboutManager 등 소개 페이지 공용)
 */
export default function useReveal({ threshold = 0.12, rootMargin = '0px 0px -32px 0px' } = {}) {
  const [visible, setVisible] = useState(new Set());
  const refs = useRef([]);

  const register = useCallback((idx) => (el) => {
    refs.current[idx] = el;
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = refs.current.indexOf(entry.target);
            if (idx !== -1) {
              setVisible((prev) => new Set([...prev, idx]));
              observer.unobserve(entry.target);
            }
          }
        });
      },
      { threshold, rootMargin }
    );
    refs.current.forEach((el) => { if (el) observer.observe(el); });
    return () => observer.disconnect();
  }, [threshold, rootMargin]);

  return { register, visible };
}
