import { MapPin, Phone, Mail, Instagram, ExternalLink, Calendar, Shield, Clock, Printer } from "lucide-react"
import Image from "next/image"

export function Footer() {
  const resources = [
    { title: "Data Terbuka", href: "https://bungokab.bps.go.id/id", external: true },
    { title: "Publikasi", href: "https://bungokab.bps.go.id/id/publication", external: true },
    { title: "Infografis", href: "https://bungokab.bps.go.id/id/infographic", external: true },
  ]

  return (
    <footer className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.3)_1px,transparent_0)] bg-[length:20px_20px]"></div>
      </div>

      <div className="relative container mx-auto px-4">
        {/* Main Footer Content */}
        <div className="py-16">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Contact Information */}
            <div className="space-y-6">
              <h4 className="text-lg font-semibold text-white">Kontak & Informasi</h4>

              <div className="space-y-4">
                <div className="flex items-start gap-3 text-slate-200">
                  <MapPin className="w-5 h-5 text-orange-400 mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium text-white mb-1">Alamat Kantor</p>
                    <p>Badan Pusat Statistik Kabupaten Bungo</p>
                    <p>Jl. RM. Thaher Kel Cadika, Kec. Rimbo Tengah</p>
                    <p>Bungo, Indonesia, 37214</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-slate-200">
                  <Phone className="w-5 h-5 text-orange-400 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium text-white">Telepon</p>
                    <a href="tel:(0747)21120" className="hover:text-orange-300 transition-colors">
                      (0747) 21120
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-slate-200">
                  <Printer className="w-5 h-5 text-orange-400 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium text-white">Fax</p>
                    <a href="tel:(0747)21120" className="hover:text-orange-300 transition-colors">
                      (0747) 21120
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-slate-200">
                  <Mail className="w-5 h-5 text-orange-400 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium text-white">Email</p>
                    <a href="mailto:bps1509@bps.go.id" className="hover:text-orange-300 transition-colors">
                      bps1509@bps.go.id
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-slate-200">
                  <Instagram className="w-5 h-5 text-orange-400 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium text-white">Instagram</p>
                    <a
                      href="https://www.instagram.com/bpsbungo/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-orange-300 transition-colors flex items-center gap-1"
                    >
                      @bpsbungo
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Resources */}
            <div className="space-y-6">
              <h4 className="text-lg font-semibold text-white">Sumber Daya</h4>
              <nav className="space-y-3">
                {resources.map((resource, index) => (
                  <a
                    key={index}
                    href={resource.href}
                    className="flex items-center text-slate-200 hover:text-orange-300 transition-colors duration-200 group"
                    target={resource.external ? "_blank" : undefined}
                    rel={resource.external ? "noopener noreferrer" : undefined}
                  >
                    <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mr-3 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    {resource.title}
                    {resource.external && (
                      <ExternalLink className="w-3 h-3 ml-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                  </a>
                ))}
              </nav>
            </div>

            {/* Brand Section */}
            <div className="lg:col-span-1 space-y-6 text-right">
              <div className="flex items-center gap-4 justify-end">
                <div>
                  <h3 className="text-2xl font-bold text-white">BEDARO</h3>
                  <p className="text-orange-300 text-sm">BPS Kabupaten Bungo</p>
                </div>
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl blur opacity-50"></div>
                  <div className="relative w-14 h-14 bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl flex items-center justify-center border border-orange-200">
                    <Image
                      src="/logo-bungo.png"
                      alt="Logo Kabupaten Bungo"
                      width={36}
                      height={36}
                      className="object-contain"
                    />
                  </div>
                </div>
              </div>

              <p className="text-slate-200 leading-relaxed">
                Platform terpadu untuk akses data dan informasi statistik Kabupaten Bungo yang mendukung transparansi
                dan pengambilan keputusan berbasis data.
              </p>

              {/* Status Badge */}
              <div className="flex justify-end">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/20 border border-green-500/30 rounded-full text-green-200">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium">Data Terupdate</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-slate-700/50 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Copyright */}
            <div className="text-center md:text-left">
              <p className="text-slate-300 text-sm">
                © 2025 <span className="text-white font-medium">BPS Kabupaten Bungo</span>. Hak Cipta Dilindungi.
              </p>
              <p className="text-slate-400 text-xs mt-1">Dibuat dengan ❤️ untuk transparansi data publik</p>
            </div>
          </div>

          {/* Credits */}
          <div className="mt-6 pt-6 border-t border-slate-700/30 text-center">
            <p className="text-slate-400 text-xs">
              Platform BEDARO - Bedah Data dan Ragam Informasi<span className="ml-1 text-slate-300"></span>
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
