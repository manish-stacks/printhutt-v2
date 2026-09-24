'use client';
import { useEffect } from 'react';

/**
 * Admin "Custom Scripts" (Meta Pixel / GA / Clarity) ko exactly jaisa paste kiya
 * gaya waisa hi run karta hai — koi regex parsing ya rewriting nahi, isliye jo
 * admin panel me dala hai bilkul wahi execute hota hai.
 *
 * `innerHTML` se dala gaya <script> browser khud execute nahi karta, isliye har
 * <script> node ko manually recreate karke head/body me append karte hain.
 *
 * Dedup: agar wahi block galti se head aur body dono fields me chala jaaye, ya
 * ek hi field me do baar paste ho jaaye — exact text match par sirf ek baar
 * inject hota hai (Set browser session ke liye persist karta hai).
 */
const injected = new Set<string>();

function inject(html: string | undefined, target: 'head' | 'body') {
  const code = html?.trim();
  if (!code || injected.has(code)) return;
  injected.add(code);

  const wrapper = document.createElement('div');
  wrapper.innerHTML = code;
  const mount = target === 'head' ? document.head : document.body;

  Array.from(wrapper.childNodes).forEach((node) => {
    if (node.nodeName === 'SCRIPT') {
      const old = node as HTMLScriptElement;
      const fresh = document.createElement('script');
      Array.from(old.attributes).forEach((attr) => fresh.setAttribute(attr.name, attr.value));
      fresh.text = old.text; // inline code as-is
      mount.appendChild(fresh);
    } else if (node.nodeName !== 'NOSCRIPT') {
      // <noscript> browser me already skip hota hai jab JS on hai — SPA me faltu hai
      mount.appendChild(node.cloneNode(true));
    }
  });
}

export default function CustomScripts({ headHtml, bodyHtml }: { headHtml?: string; bodyHtml?: string }) {
  useEffect(() => {
    inject(headHtml, 'head');
    inject(bodyHtml, 'body');
  }, [headHtml, bodyHtml]);
  return null;
}
