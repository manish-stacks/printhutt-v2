import Breadcrumb from "@/components/Breadcrumb";
import React from "react";

const ContactUs = () => {
  return (
    <>
      {/* <Breadcrumb title={"Contact Us"} /> */}

      {/* HERO */}
      <section className="bg-gradient-to-br from-[#f8faff] via-white to-[#eef2ff] py-[70px] max-md:py-[40px]">
        <div className="mx-auto max-w-[1200px] px-[12px] text-center">
          <h1 className="text-[44px] font-bold text-[#1e293b] max-md:text-[30px]">
            Let’s Build Something{" "}
            <span className="text-[#6c7fd8]">Amazing Together</span>
          </h1>
          <p className="mt-4 text-[16px] text-[#64748b] max-w-[600px] mx-auto leading-[28px]">
            Have a project in mind? We’re here to help you design custom neon
            sign boards and branding solutions with premium quality and fast
            support.
          </p>
        </div>
      </section>

      {/* CONTACT SECTION */}
      <section className="py-[70px] max-md:py-[40px] bg-white">
        <div className="mx-auto max-w-[1200px] px-[12px] grid grid-cols-2 gap-10 max-lg:grid-cols-1">

          {/* FORM */}
          <div className="rounded-[30px] border border-[#eef0f4] bg-white p-8 shadow-lg">
            <h2 className="text-[26px] font-bold text-[#1e293b] mb-6">
              Get In Touch
            </h2>

            <form className="space-y-4">
              <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
                <input
                  type="text"
                  placeholder="First Name"
                  className="h-[50px] w-full rounded-[12px] border border-[#e5e7eb] px-4 text-[14px] outline-none focus:border-[#6c7fd8]"
                />
                <input
                  type="text"
                  placeholder="Last Name"
                  className="h-[50px] w-full rounded-[12px] border border-[#e5e7eb] px-4 text-[14px] outline-none focus:border-[#6c7fd8]"
                />
              </div>

              <input
                type="email"
                placeholder="Email Address"
                className="h-[50px] w-full rounded-[12px] border border-[#e5e7eb] px-4 text-[14px] outline-none focus:border-[#6c7fd8]"
              />

              <input
                type="text"
                placeholder="Phone Number"
                className="h-[50px] w-full rounded-[12px] border border-[#e5e7eb] px-4 text-[14px] outline-none focus:border-[#6c7fd8]"
              />

              <textarea
                placeholder="Tell us about your project..."
                className="h-[140px] w-full rounded-[12px] border border-[#e5e7eb] p-4 text-[14px] outline-none focus:border-[#6c7fd8]"
              />

              <button
                type="submit"
                className="w-full rounded-[12px] bg-[#6c7fd8] py-[12px] text-white font-semibold hover:bg-[#5566c9] transition"
              >
                Send Message
              </button>
            </form>
          </div>

          {/* MAP + INFO */}
          <div className="space-y-6">

            {/* INFO CARDS */}
            <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
              <div className="rounded-[20px] border p-5 bg-[#f8faff]">
                <h4 className="font-semibold text-[#1e293b]">Quick Response</h4>
                <p className="text-[13px] text-[#64748b] mt-1">
                  We reply within 24 hours
                </p>
              </div>

              <div className="rounded-[20px] border p-5 bg-[#f8faff]">
                <h4 className="font-semibold text-[#1e293b]">Support</h4>
                <p className="text-[13px] text-[#64748b] mt-1">
                  Dedicated customer help
                </p>
              </div>
            </div>

            {/* MAP */}
            <div className="overflow-hidden rounded-[30px] border shadow-lg">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3499.7120988320553!2d77.1312131!3d28.698257599999998!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390d0151f063e0a1%3A0xf5c829e933be081d!2sPrint%20Hutt!5e0!3m2!1sen!2sin!4v1735904725123!5m2!1sen!2sin"
                className="w-full h-[420px]"
                loading="lazy"
              />
            </div>
          </div>

        </div>
      </section>
      <section className="py-10 bg-[#f8faff]">
        <div className="mx-auto max-w-[1200px] px-[12px] grid grid-cols-3 gap-6 max-md:grid-cols-1">

          <div className="text-center p-6 rounded-[20px] bg-white border">
            <h3 className="text-[18px] font-semibold text-[#1e293b]">📞 Call Us</h3>
            <p className="text-[#64748b] mt-2">+91 880 011 2625</p>
          </div>

          <div className="text-center p-6 rounded-[20px] bg-white border">
            <h3 className="text-[18px] font-semibold text-[#1e293b]">📧 Email</h3>
            <p className="text-[#64748b] mt-2">printhutt05@gmail.com</p>
          </div>

          <div className="text-center p-6 rounded-[20px] bg-white border">
            <h3 className="text-[18px] font-semibold text-[#1e293b]">⏰ Working Hours</h3>
            <p className="text-[#64748b] mt-2">Mon - Sat (10AM - 7PM)</p>
          </div>

        </div>
      </section>
      <section className="py-16 bg-white">
        <div className="mx-auto max-w-[900px] px-[12px]">

          <h2 className="text-center text-[34px] font-bold text-[#1e293b]">
            Frequently Asked Questions
          </h2>

          <div className="mt-10 space-y-4">

            <div className="border rounded-[16px] p-5">
              <h4 className="font-semibold">How long does delivery take?</h4>
              <p className="text-[#64748b] mt-2 text-[14px]">
                Usually 5–7 working days depending on design.
              </p>
            </div>

            <div className="border rounded-[16px] p-5">
              <h4 className="font-semibold">Do you provide custom designs?</h4>
              <p className="text-[#64748b] mt-2 text-[14px]">
                Yes, we create fully custom neon sign boards as per requirement.
              </p>
            </div>

            <div className="border rounded-[16px] p-5">
              <h4 className="font-semibold">Is there warranty?</h4>
              <p className="text-[#64748b] mt-2 text-[14px]">
                We provide quality assurance and support after purchase.
              </p>
            </div>

          </div>
        </div>
      </section>
      <section className="py-12 bg-[#6c7fd8]">
        <div className="mx-auto max-w-[1200px] px-[12px] text-center text-white">

          <h2 className="text-[28px] font-bold">
            Need Instant Support?
          </h2>

          <p className="mt-2 text-white/80">
            Chat with our team on WhatsApp for faster response
          </p>

          <a
            href="https://wa.me/918800112625"
            className="inline-block mt-6 bg-white text-[#6c7fd8] font-semibold px-6 py-3 rounded-[12px]"
          >
            Chat on WhatsApp
          </a>

        </div>
      </section>

    </>
  );
};

export default ContactUs;