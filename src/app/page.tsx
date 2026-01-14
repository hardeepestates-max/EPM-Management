import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Users, Wrench, FileText, Shield, Phone } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Navigation */}
      <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Image src="/logo.png" alt="EPM Logo" width={40} height={40} />
              <span className="text-xl font-bold text-slate-900">Elevate PM</span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <Link href="#services" className="text-slate-600 hover:text-slate-900">Services</Link>
              <Link href="#about" className="text-slate-600 hover:text-slate-900">About</Link>
              <Link href="#contact" className="text-slate-600 hover:text-slate-900">Contact</Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/login">
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Link href="/register">
                <Button>Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-slate-900 mb-6">
            Property Management
            <span className="text-blue-600"> Elevated</span>
          </h1>
          <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
            Professional property management services that put owners and tenants first.
            Over a decade of real estate expertise at your service.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" className="px-8">
                Start Managing Today
              </Button>
            </Link>
            <Link href="#contact">
              <Button size="lg" variant="outline" className="px-8">
                Contact Us
              </Button>
            </Link>
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
                  <div className="text-4xl font-bold">500+</div>
                  <div className="text-blue-100">Units Managed</div>
                </div>
                <div>
                  <div className="text-4xl font-bold">98%</div>
                  <div className="text-blue-100">Satisfaction Rate</div>
                </div>
                <div>
                  <div className="text-4xl font-bold">24/7</div>
                  <div className="text-blue-100">Support Available</div>
                </div>
              </div>
            </div>
          </div>
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
                <Image src="/logo.png" alt="EPM Logo" width={32} height={32} className="brightness-0 invert" />
                <span className="text-lg font-bold">Elevate PM</span>
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
              <ul className="space-y-2 text-slate-400">
                <li className="flex items-center space-x-2">
                  <Phone className="h-4 w-4" />
                  <span>(201) 917-0689</span>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Hours</h4>
              <p className="text-slate-400">
                Mon-Fri: 9am - 6pm<br />
                Emergency: 24/7
              </p>
            </div>
          </div>
          <div className="border-t border-slate-800 mt-8 pt-8 text-center text-slate-400">
            <p>&copy; {new Date().getFullYear()} Elevate Property Management. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
