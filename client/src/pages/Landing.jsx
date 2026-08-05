import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Logo from '../components/common/Logo.jsx';
import Button from '../components/common/Button.jsx';

const features = [
  { icon: '📝', title: 'Infinite Whiteboard', desc: 'Zoom, pan and draw freely on an infinite canvas with 20+ tools.' },
  { icon: '👥', title: 'Real-Time Collaboration', desc: 'Live cursors, presence, chat and comments — conflict-free via CRDT.' },
  { icon: '🤖', title: 'AI Diagram Generator', desc: 'Describe a system and generate editable diagrams instantly.' },
  { icon: '🧠', title: 'Mind Maps & Flowcharts', desc: 'From text to structured visual thinking in seconds.' },
  { icon: '🎯', title: 'Project Management', desc: 'Kanban boards, timelines, calendars and tasks built in.' },
  { icon: '💼', title: 'Interview Whiteboard', desc: 'Live coding interviews with drawing, chat, timer and code editor.' },
  { icon: '📤', title: 'Export Anywhere', desc: 'PNG, SVG, PDF, JSON, Markdown and Mermaid exports.' },
  { icon: '🔐', title: 'Secure & Scalable', desc: 'JWT auth, RBAC, Redis, RabbitMQ and a production-grade stack.' },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <header className="sticky top-0 z-40 backdrop-blur-lg bg-white/60 dark:bg-gray-950/60 border-b border-gray-200/60 dark:border-gray-800/60">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-4">
          <Logo />
          <nav className="flex items-center gap-3">
            <Link to="/login"><Button variant="ghost">Sign in</Button></Link>
            <Link to="/register"><Button>Get Started</Button></Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="max-w-6xl mx-auto px-4 py-24 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 mb-6">
              ✨ AI-Powered Collaborative Whiteboard
            </span>
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6">
              Think. Draw. {' '}
              <span className="bg-gradient-to-r from-primary-500 to-purple-500 bg-clip-text text-transparent">Collaborate.</span>
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-8">
              The infinite whiteboard that combines Excalidraw, Miro and FigJam — with AI that turns
              your words into diagrams, architecture, and plans.
            </p>
            <div className="flex gap-3 justify-center">
              <Link to="/register"><Button size="lg">Start Free</Button></Link>
              <Link to="/login"><Button variant="secondary" size="lg">Live Demo</Button></Link>
            </div>
          </motion.div>
        </section>

        <section className="max-w-6xl mx-auto px-4 pb-20">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="card hover:shadow-lg transition-shadow"
              >
                <div className="text-3xl mb-3">{f.icon}</div>
                <h3 className="font-semibold mb-1">{f.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-4 pb-24">
          <div className="card bg-gradient-to-br from-primary-600 to-purple-600 text-white p-12 text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to build something great?</h2>
            <p className="opacity-90 mb-8 max-w-xl mx-auto">Join thousands of teams visualizing ideas together with AI superpowers.</p>
            <Link to="/register"><Button variant="secondary" size="lg">Create your free board</Button></Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-gray-200 dark:border-gray-800 py-8">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Logo size={24} />
          <p className="text-sm text-gray-400">© {new Date().getFullYear()} VectorShare AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
