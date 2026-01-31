import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Users, Wrench, FileText, Shield, Phone, Mail, MapPin } from "lucide-react"
import { MobileNav } from "@/components/mobile-nav"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Navigation */}
      <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center space-x-2">
                <Image src="/logo.png" alt="EPM Logo" width={40} height={40} className="w-9 h-9 sm:w-10 sm:h-10" />
                <span className="text-lg font-bold text-slate-900">
                  <span className="hidden sm:inline">Elevate PM</span>
                  <span className="sm:hidden">EPM</span>
                </span>
              </Link>
              <div className="hidden md:flex items-center space-x-6 ml-10">
                <Link href="#services" className="text-slate-600 hover:text-slate-900 text-sm font-medium">Services</Link>
                <Link href="#about" className="text-slate-600 hover:text-slate-900 text-sm font-medium">About</Link>
                <Link href="#contact" className="text-slate-600 hover:text-slate-900 text-sm font-medium">Contact</Link>
              </div>
            </div>
            <div className="hidden md:flex items-center space-x-3">
              <Link href="/login">
                <Button variant="ghost" size="sm">Sign In</Button>
              </Link>
              <Link href="/register">
                <Button size="sm">Get Started</Button>
              </Link>
            </div>
            <MobileNav />
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-slate-900 mb-4">
            Property Management
            <span className="text-blue-600"> Elevated</span>
          </h1>
          <p className="text-xl text-slate-600 mb-6 max-w-2xl mx-auto">
            Professional property management services that put owners and tenants first.
            Over a decade of real estate expertise at your service.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/register">
              <Button size="lg" className="px-8">
                Start Managing Today
              </Button>
            </Link>
            <a href="#contact">
              <Button size="lg" variant="outline" className="px-8">
                Contact Us
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-20 px-4 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-12">Our Services</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-xl shadow-sm border">
              <Users className="h-12 w-12 text-blue-600 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Tenant Management</h3>
              <p className="text-slate-600">
                Complete tenant screening, lease management, and 24/7 support portal for all residents.
              </p>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-sm border">
              <Wrench className="h-12 w-12 text-blue-600 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Maintenance</h3>
              <p className="text-slate-600">
                Online ticket system for maintenance requests with real-time status updates and tracking.
              </p>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-sm border">
              <FileText className="h-12 w-12 text-blue-600 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Financial Reporting</h3>
              <p className="text-slate-600">
                Detailed financial reports, rent collection, and transparent accounting for property owners.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 mb-6">
                A Decade of Real Estate Excellence
              </h2>
              <p className="text-slate-600 mb-4">
                With over 10 years of experience in real estate, Elevate Property Management
                brings expertise and dedication to every property we manage.
              </p>
              <p className="text-slate-600 mb-6">
                We understand the challenges of property ownership and tenant relations.
                Our platform streamlines communication, payments, and maintenance to make
                property management effortless.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Shield className="h-5 w-5 text-blue-600" />
                  <span className="text-slate-700">Licensed & Insured</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  <span className="text-slate-700">24/7 Support</span>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl p-8 text-white">
              <div className="grid grid-cols-2 gap-8 text-center">
                <div>
                  <div className="text-4xl font-bold">10+</div>
                  <div className="text-blue-100">Years Experience</div>
                </div>
                <div>
                  <div className="text-4xl font-bold">98%</div>
                  <div className="text-blue-100">Satisfaction Rate</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Partner Section */}
      <section className="py-8 px-4 bg-black">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-xs uppercase tracking-wider text-slate-400 mb-3">Partnered Real Estate Brokerage</p>
          <a
            href="https://elevaterealtynj.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block hover:opacity-80 transition-opacity"
          >
            <Image
              src="/elevate-realty-logo.png"
              alt="Elevate Realty"
              width={160}
              height={60}
              className="mx-auto"
            />
          </a>
          <p className="text-slate-500 text-sm mt-2">
            <a
              href="https://elevaterealtynj.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              Visit Elevate Realty →
            </a>
          </p>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 px-4 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-12">Get In Touch</h2>
          <div className="max-w-xl mx-auto bg-white p-8 rounded-xl shadow-sm border">
            <form className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Name</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Your name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                <input
                  type="email"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="your@email.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Message</label>
                <textarea
                  rows={4}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="How can we help you?"
                />
              </div>
              <Button className="w-full" size="lg">Send Message</Button>
            </form>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Image src="/logo.png" alt="EPM Logo" width={48} height={48} className="brightness-0 invert" />
                <span className="text-lg font-bold">Elevate Property Management</span>
              </div>
              <p className="text-slate-400">
                Professional property management services.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-slate-400">
                <li><Link href="/login" className="hover:text-white">Owner Portal</Link></li>
                <li><Link href="/login" className="hover:text-white">Tenant Portal</Link></li>
                <li><Link href="#services" className="hover:text-white">Services</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Contact</h4>
              <ul className="space-y-3 text-slate-400">
                <li className="flex items-start space-x-2">
                  <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>605 Anderson Ave #3<br />Cliffside Park, NJ 07010</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 flex-shrink-0" />
                  <a href="tel:+12018877766" className="hover:text-white">(201) 887-7766</a>
                </li>
                <li className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 flex-shrink-0" />
                  <a href="mailto:elevatepropertymanagement@outlook.com" className="hover:text-white break-all">
                    elevatepropertymanagement@outlook.com
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Hours</h4>
              <div className="text-slate-400 space-y-1">
                <p>Mon - Sat: 9am - 5pm</p>
                <p>Sunday: Closed</p>
              </div>
            </div>
          </div>
          <div className="border-t border-slate-800 mt-8 pt-8 text-center text-slate-400">
            <p>&copy; {new Date().getFullYear()} Elevate Property Management. All rights reserved.</p>
            <p className="text-slate-500 text-sm mt-1">Operated by <a href="https://elevaterealtynj.com" target="_blank" rel="noopener noreferrer" className="hover:text-white">Elevate Realty</a></p>
          </div>
        </div>
      </footer>
    </div>
  )
}
