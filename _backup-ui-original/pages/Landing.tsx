import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Database, Upload, MessageSquare, BarChart3, Sparkles, ArrowRight } from 'lucide-react';

export default function Landing() {
  const features = [
    {
      icon: Upload,
      title: 'Easy Upload',
      description: 'Upload CSV or Excel files instantly and securely',
    },
    {
      icon: Sparkles,
      title: 'AI Analysis',
      description: 'Get instant insights powered by advanced AI',
    },
    {
      icon: MessageSquare,
      title: 'Natural Language',
      description: 'Ask questions in plain English, get clear answers',
    },
    {
      icon: BarChart3,
      title: 'Visual Insights',
      description: 'Beautiful charts and visualizations automatically generated',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      <nav className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Database className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">AI Data Assistant</span>
            </div>
            <div className="flex items-center gap-4">
              <Link
                to="/login"
                className="text-gray-700 hover:text-gray-900 font-medium"
              >
                Sign In
              </Link>
              <Link
                to="/signup"
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main>
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-4xl mx-auto"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-6"
            >
              <Sparkles className="w-4 h-4" />
              AI-Powered Data Analysis
            </motion.div>

            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Ask Questions About Your Data in{' '}
              <span className="text-blue-600">Plain English</span>
            </h1>

            <p className="text-xl text-gray-600 mb-10 leading-relaxed">
              Upload your CSV or Excel files and let AI help you discover insights,
              create visualizations, and answer questions instantly.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link
                  to="/signup"
                  className="flex items-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-lg shadow-lg shadow-blue-600/30 transition-colors"
                >
                  Start Analyzing Free
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link
                  to="/login"
                  className="flex items-center gap-2 px-8 py-4 bg-white hover:bg-gray-50 text-gray-900 rounded-xl font-semibold text-lg border-2 border-gray-200 transition-colors"
                >
                  Sign In
                </Link>
              </motion.div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="mt-20 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden"
          >
            <img
              src="https://images.pexels.com/photos/7564231/pexels-photo-7564231.jpeg?auto=compress&cs=tinysrgb&w=1200"
              alt="Data Analysis Dashboard"
              className="w-full h-96 object-cover"
            />
          </motion.div>
        </section>

        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Everything You Need
            </h2>
            <p className="text-xl text-gray-600">
              Powerful features designed for students and professionals
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -8 }}
                className="bg-white rounded-xl p-6 shadow-lg border border-gray-200"
              >
                <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-12 text-center shadow-2xl"
          >
            <h2 className="text-4xl font-bold text-white mb-4">
              Ready to Transform Your Data?
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Join professionals and students already using AI Data Assistant
            </p>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link
                to="/signup"
                className="inline-flex items-center gap-2 px-8 py-4 bg-white hover:bg-gray-100 text-blue-600 rounded-xl font-semibold text-lg transition-colors"
              >
                Get Started Now
                <ArrowRight className="w-5 h-5" />
              </Link>
            </motion.div>
          </motion.div>
        </section>
      </main>

      <footer className="bg-white border-t border-gray-200 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-center text-gray-600">
            © 2024 AI Data Assistant. Built with AI and modern technology.
          </p>
        </div>
      </footer>
    </div>
  );
}
