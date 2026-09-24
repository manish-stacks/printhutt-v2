export const PAGE_DEFAULTS: Record<
  string,
  {
    title: string;
    content: string;
    metaTitle: string;
    metaDescription: string;
  }
> = {
  'return-policy': {
    title: 'Return Policy',
    metaTitle: 'Return Policy | PrintHutt',
    metaDescription: 'Read our return policy.',
    content: `
<h2>Return Policy</h2>
<p>We accept returns within 7 days of delivery for eligible items in their original condition.</p>

<h3>Eligibility</h3>
<ul>
  <li>Item must be unused and in original packaging</li>
  <li>Personalized/customized items are non-returnable</li>
</ul>

<h3>How to return</h3>
<p>
  Contact our support team at
  <strong>support@printhutt.com</strong>
  with your order ID.
</p>
    `.trim(),
  },

  'privacy-policy': {
    title: 'Privacy Policy',
    metaTitle: 'Privacy Policy | PrintHutt',
    metaDescription: 'How we collect and use your data.',
    content: `
<h2>Privacy Policy</h2>

<p>
  We respect your privacy and are committed to protecting your
  personal information.
</p>

<h3>Information we collect</h3>
<p>
  Name, email, phone number, shipping address, and payment
  information necessary to process your order.
</p>

<h3>How we use it</h3>
<p>
  To process orders, send updates, and improve our services.
  We do not sell your data to third parties.
</p>
    `.trim(),
  },

  'terms-and-conditions': {
    title: 'Terms & Conditions',
    metaTitle: 'Terms & Conditions | PrintHutt',
    metaDescription: 'Rules and terms for using PrintHutt.',
    content: `
<h2>Terms & Conditions</h2>

<p>
  By using PrintHutt, you agree to the following terms.
</p>

<h3>Use of website</h3>
<p>
  You agree to use the website for lawful purposes only.
</p>

<h3>Orders & payments</h3>
<p>
  All orders are subject to acceptance and availability.
  Payment must be made in full before shipping.
</p>
    `.trim(),
  },

  'refund-policy': {
    title: 'Refund Policy',
    metaTitle: 'Refund Policy | PrintHutt',
    metaDescription: 'Our refund policy.',
    content: `
<h2>Refund Policy</h2>

<p>
  Refunds are processed within 7–10 business days after the
  returned item is received and inspected.
</p>

<h3>Refund methods</h3>
<ul>
  <li>Original payment method</li>
  <li>Store credit (faster)</li>
</ul>
    `.trim(),
  },
};