"use client";

import { useState } from 'react';
import { axiosInstance } from '@/utils/axios';
import { toast } from 'react-toastify';
import { RiCloseLine, RiMailSendLine, RiMessage3Line, RiWhatsappLine } from 'react-icons/ri';

interface Props {
  user: {
    userId: string;
    userName: string;
    userEmail: string;
    userNumber: string;
  };
  onClose: () => void;
  onSent: () => void;
}

export default function MessageComposerModal({ user, onClose, onSent }: Props) {
  const [channel, setChannel] = useState<'email' | 'sms' | 'whatsapp'>('email');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!body.trim()) {
      toast.error('Message body is required');
      return;
    }
    if (channel === 'email' && !subject.trim()) {
      toast.error('Subject is required for email');
      return;
    }

    setSending(true);
    try {
      await axiosInstance.post('/messaging/send', {
        userId: user.userId,
        channel,
        subject: channel === 'email' ? subject : undefined,
        body,
      });
      onSent();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Send failed');
    } finally {
      setSending(false);
    }
  };

  const channelOptions = [
    { value: 'email', label: 'Email', icon: RiMailSendLine, disabled: !user.userEmail },
    { value: 'sms', label: 'SMS', icon: RiMessage3Line, disabled: !user.userNumber },
    { value: 'whatsapp', label: 'WhatsApp', icon: RiWhatsappLine, disabled: !user.userNumber },
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h3 className="font-bold text-gray-900">Send Message</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              To: <span className="font-medium text-gray-700">{user.userName || 'Guest'}</span>
            </p>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500">
            <RiCloseLine className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Channel picker */}
          <div>
            <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Channel</label>
            <div className="grid grid-cols-3 gap-2 mt-2">
              {channelOptions.map((opt) => {
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.value}
                    onClick={() => setChannel(opt.value as any)}
                    disabled={opt.disabled}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition ${
                      channel === opt.value
                        ? 'border-purple-500 bg-purple-50 text-purple-700'
                        : opt.disabled
                          ? 'border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed'
                          : 'border-gray-200 hover:border-purple-300 text-gray-700'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-xs font-medium">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Subject (email only) */}
          {channel === 'email' && (
            <div>
              <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Subject</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g., Your wishlist items are waiting..."
                className="w-full mt-1.5 px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
              />
            </div>
          )}

          {/* Body */}
          <div>
            <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Message</label>
            <textarea
              rows={6}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Hi {{userName}}, you left items in your wishlist..."
              className="w-full mt-1.5 px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 resize-none"
            />
            <p className="text-[11px] text-gray-500 mt-1">
              Supports placeholders: <code>{'{{userName}}'}</code>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-100 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={sending}
            className="px-5 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-semibold rounded-lg disabled:opacity-50 flex items-center gap-2"
          >
            <RiMailSendLine className="w-4 h-4" />
            {sending ? 'Sending...' : 'Send Message'}
          </button>
        </div>
      </div>
    </div>
  );
}