import React from 'react';

/**
 * Admin se paste kiye gaye scripts ko SERVER-SIDE render karta hai (view-source me dikhte hain,
 * Meta Pixel Helper / GA / Ads tags page load par hi chalte hain — hydration ka wait nahi).
 * Supports: <script>..</script>, <script src>, raw JS (bina <script> ke), <noscript>, <meta>/<link>.
 */
type Part =
  | { t: 'script'; attrs: Record<string, string | boolean>; code: string }
  | { t: 'noscript'; html: string }
  | { t: 'tag'; tag: 'meta' | 'link'; attrs: Record<string, string> };

const ATTR_RE = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g;
function parseAttrs(s: string) {
  const out: Record<string, string | boolean> = {};
  let m: RegExpExecArray | null;
  ATTR_RE.lastIndex = 0;
  while ((m = ATTR_RE.exec(s))) out[m[1]] = m[2] ?? m[3] ?? m[4] ?? true;
  return out;
}
const toReact = (a: Record<string, any>) => {
  const o: Record<string, any> = {};
  for (const k in a) {
    if (k === 'async') o.async = true;
    else if (k === 'defer') o.defer = true;
    else if (k === 'crossorigin') o.crossOrigin = a[k] === true ? 'anonymous' : a[k];
    else if (k === 'class') o.className = a[k];
    else if (k === 'charset') o.charSet = a[k];
    else if (k === 'http-equiv') o.httpEquiv = a[k];
    else o[k] = a[k];
  }
  return o;
};

function parse(raw?: string): Part[] {
  const src = (raw || '').trim();
  if (!src) return [];
  const parts: Part[] = [];
  const re = /<script\b([^>]*)>([\s\S]*?)<\/script\s*>|<noscript\b[^>]*>([\s\S]*?)<\/noscript\s*>|<(meta|link)\b([^>]*?)\/?>/gi;
  let m: RegExpExecArray | null;
  let last = 0;
  let leftover = '';
  while ((m = re.exec(src))) {
    leftover += src.slice(last, m.index);
    last = re.lastIndex;
    if (m[0].toLowerCase().startsWith('<script')) {
      parts.push({ t: 'script', attrs: parseAttrs(m[1] || ''), code: m[2] || '' });
    } else if (m[0].toLowerCase().startsWith('<noscript')) {
      parts.push({ t: 'noscript', html: m[3] || '' });
    } else {
      parts.push({ t: 'tag', tag: m[4].toLowerCase() as 'meta' | 'link', attrs: parseAttrs(m[5] || '') as Record<string, string> });
    }
  }
  leftover = (leftover + src.slice(last)).replace(/<\/?script[^>]*>/gi, '').trim();
  // Raw JS paste (user ne <script> tags chhod diye) — wrap karke chalao
  if (leftover && /[;{}()=]/.test(leftover) && !/^</.test(leftover)) {
    parts.unshift({ t: 'script', attrs: {}, code: leftover });
  }
  return parts;
}

export default function ServerScripts({ html, where }: { html?: string; where: 'head' | 'body' }) {
  const parts = parse(html);
  if (!parts.length) return null;
  return (
    <>
      {parts.map((p, i) => {
        if (p.t === 'script') {
          const props = toReact(p.attrs);
          return p.code.trim()
            ? <script key={`${where}-${i}`} {...props} dangerouslySetInnerHTML={{ __html: p.code }} />
            : <script key={`${where}-${i}`} {...props} />;
        }
        if (p.t === 'noscript') {
          return where === 'body'
            ? <noscript key={`${where}-${i}`} dangerouslySetInnerHTML={{ __html: p.html }} />
            : null;
        }
        const Tag = p.tag as 'meta';
        return <Tag key={`${where}-${i}`} {...toReact(p.attrs)} />;
      })}
    </>
  );
}
