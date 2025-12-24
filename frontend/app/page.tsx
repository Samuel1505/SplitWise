import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Features from './components/Features';
import HowItWorks from './components/HowItWorks';
import UseCases from './components/UseCases';
import Statistics from './components/Statistics';
import CTA from './components/CTA';
import Footer from './components/Footer';

export default function Home() {
  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      <Navbar />
      <Hero />
      <Statistics />
      <Features />
      <HowItWorks />
      <UseCases />
      <CTA />
      <Footer />
    </div>
  );
}