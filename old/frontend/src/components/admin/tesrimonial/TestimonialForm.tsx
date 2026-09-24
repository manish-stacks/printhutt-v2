'use client';

import { ITestimonial } from '@/lib/types';
import Image from 'next/image';
import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useState,
} from 'react';

import { RiLoader2Line } from 'react-icons/ri';
import Select from 'react-select';

interface FormProps {
  formData: Partial<ITestimonial>;
  isSubmitting: boolean;
  onSubmit: (e: FormEvent) => void;
  onChange: (
    e:
      | ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
      | any
  ) => void;
  onClose: () => void;
  mode: 'add' | 'edit';
}

export function TestimonialForm({
  formData,
  isSubmitting,
  onSubmit,
  onChange,
  onClose,
  mode,
}: FormProps) {

  const [previewImage, setPreviewImage] =
    useState<string>('');

  useEffect(() => {

    // edit mode image preview
    if (
      typeof formData.image === 'string' &&
      formData.image
    ) {
      setPreviewImage(formData.image);
    }

    // existing cloudinary image
    else if (
      typeof formData.image === 'object' &&
      'url' in (formData.image as any)
    ) {
      setPreviewImage(
        (formData.image as any).url
      );
    }

  }, [formData.image]);

  const handleFileChange = (
    event: ChangeEvent<HTMLInputElement>
  ) => {

    const file = event.target.files?.[0];

    if (!file) return;

    // parent state update
    onChange({
      target: {
        name: 'image',
        value: file,
      },
    });

    // preview
    const reader = new FileReader();

    reader.onloadend = () => {
      setPreviewImage(
        reader.result as string
      );
    };

    reader.readAsDataURL(file);
  };

  const options = [
    {
      value: 'true',
      label: 'Active',
    },
    {
      value: 'false',
      label: 'Inactive',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">

      {/* Modal */}
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl max-h-[90vh] overflow-hidden">

        {/* Header */}
        <div className="sticky top-0 z-20 bg-white border-b px-6 py-4 flex items-center justify-between">

          <h3 className="text-xl font-semibold text-gray-900">
            {mode === 'add'
              ? 'Add Testimonial'
              : 'Edit Testimonial'}
          </h3>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full hover:bg-gray-100 transition flex items-center justify-center text-gray-500 hover:text-black"
          >
            ✕
          </button>

        </div>

        {/* Scroll Area */}
        <div className="overflow-y-auto max-h-[calc(90vh-80px)] px-6 py-5">

          <form
            onSubmit={onSubmit}
            className="space-y-6"
            encType="multipart/form-data"
          >

            {/* Name */}
            <div>

              <label className="block mb-2 text-sm font-medium text-gray-900">
                User Name
              </label>

              <input
                type="text"
                name="name"
                value={formData.name || ''}
                onChange={onChange}
                placeholder="Enter user name"
                required
                className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />

            </div>

            {/* Image Upload */}
            <div>

              <label className="block mb-2 text-sm font-medium text-gray-900">
                User Image
              </label>

              <div className="rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 p-6">

                <div className="flex flex-col items-center justify-center">

                  {/* Preview */}
                  <div className="relative w-full max-w-sm h-64 overflow-hidden rounded-xl border bg-white shadow-sm">

                    {previewImage ? (

                      <Image
                        src={previewImage}
                        alt="Preview"
                        fill
                        className="object-cover"
                      />

                    ) : (

                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                        No Image Selected
                      </div>

                    )}

                  </div>

                  {/* Upload */}
                  <div className="mt-5">

                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                      id="image-upload"
                    />

                    <label
                      htmlFor="image-upload"
                      className="cursor-pointer inline-flex items-center rounded-xl bg-black px-5 py-3 text-sm font-medium text-white hover:bg-gray-800 transition"
                    >
                      Upload Image
                    </label>

                  </div>

                  <p className="mt-3 text-xs text-gray-500">
                    PNG, JPG, WEBP up to 10MB
                  </p>

                </div>

              </div>

            </div>

            {/* Feedback */}
            <div>

              <label className="block mb-2 text-sm font-medium text-gray-900">
                Feedback
              </label>

              <textarea
                rows={5}
                name="feedback"
                value={formData.feedback || ''}
                onChange={onChange}
                placeholder="Enter feedback"
                className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-sm outline-none resize-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />

            </div>

            {/* Status */}
            <div>

              <label className="block mb-2 text-sm font-medium text-gray-900">
                Status
              </label>

              <Select
                name="isActive"
                options={options}
                value={options.find(
                  (option) =>
                    option.value ===
                    String(formData.isActive)
                )}
                onChange={(selectedOption) => {
                  onChange({
                    target: {
                      name: 'isActive',
                      value:
                        selectedOption?.value || '',
                    },
                  });
                }}
                classNamePrefix="select"
              />

            </div>

            {/* Submit */}
            <div className="flex items-center gap-3 pt-2">

              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center justify-center rounded-xl bg-blue-700 px-6 py-3 text-sm font-medium text-white hover:bg-blue-800 transition disabled:opacity-70"
              >

                {isSubmitting && (
                  <RiLoader2Line className="mr-2 h-4 w-4 animate-spin" />
                )}

                {isSubmitting
                  ? 'Saving...'
                  : 'Save Testimonial'}

              </button>

              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-gray-300 px-6 py-3 text-sm font-medium hover:bg-gray-100 transition"
              >
                Cancel
              </button>

            </div>

          </form>

        </div>

      </div>

    </div>
  );
}